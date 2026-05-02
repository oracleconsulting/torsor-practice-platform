// =============================================================================
// GDPR TOKENISER
// =============================================================================
// Browser-side replacement layer that swaps identifiable values for opaque
// tokens before any text is sent to the LLM, and reverses the swap on the
// response. The mapping table never leaves browser memory and is rebuilt
// per-client per-session.
//
// Coverage:
//   - Names (client + directors + staff). First-name aliases mapped to the
//     same token as the full name.
//   - Company names (with "Ltd / Limited / LLP / PLC / Inc" stripped, plus
//     first-word and first-two-word aliases).
//   - Financial figures (raw numbers and £-formatted variants).
//
// Limitations (intentionally explicit):
//   - Free-form addresses, phone numbers, emails are NOT tokenised here. If
//     they enter the conversation, treat them like any other PII and avoid
//     pasting them into the chat. A separate redaction pass in the edge
//     function (`scrubPiiFromContext`) can be added if needed.
//   - Token boundaries are word-based; embedded substrings inside other
//     tokens are not matched (regex uses literal escape, not \b, to permit
//     possessives like "Jack's" -> "CLIENT_A's").
// =============================================================================

interface TokenMap {
  /** Mapping of raw value -> token. */
  names: Record<string, string>;
  companies: Record<string, string>;
  amounts: Record<string, string>;
  /** Reverse: token -> the canonical raw value (used when detokenising). */
  reverseMap: Record<string, string>;
}

export interface TokeniserConfig {
  clientName: string;
  companyName: string;
  directors?: Array<{ name: string; role?: string }>;
  staffNames?: string[];
  /** Map of label -> value. The label becomes the token suffix, value is
   *  what gets replaced (number is auto-formatted as £). */
  financials?: Record<string, number | string>;
  /** Optional extra raw strings to redact entirely (no reverse). Useful for
   *  one-off PII like email addresses or postcodes. */
  extraRedactions?: string[];
}

export class GDPRTokeniser {
  private map: TokenMap;
  /** Tokens for plain-text redaction (no reverse swap). */
  private redactions: string[] = [];

  constructor(config: TokeniserConfig) {
    this.map = { names: {}, companies: {}, amounts: {}, reverseMap: {} };
    this.buildMap(config);
  }

  private buildMap(config: TokeniserConfig) {
    if (config.clientName) this.addName(config.clientName, 'CLIENT_A');

    (config.directors ?? []).forEach((d, i) => {
      const token = `DIRECTOR_${String.fromCharCode(65 + i)}`; // DIRECTOR_A, DIRECTOR_B, ...
      if (d?.name) this.addName(d.name, token);
    });

    (config.staffNames ?? []).forEach((name, i) => {
      if (name) this.addName(name, `STAFF_${i + 1}`);
    });

    if (config.companyName) this.addCompany(config.companyName, 'COMPANY_1');

    if (config.financials) {
      Object.entries(config.financials).forEach(([key, value]) => {
        const label = key.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const token = `${label}_VALUE`;
        const variants = this.amountVariants(value);
        for (const variant of variants) {
          if (!variant) continue;
          this.map.amounts[variant] = token;
        }
        // Reverse map keeps the most human-readable variant
        this.map.reverseMap[token] = variants[0] ?? String(value);
      });
    }

    this.redactions = (config.extraRedactions ?? []).filter(Boolean);
  }

  private addName(name: string, token: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.map.names[trimmed] = token;
    this.map.reverseMap[token] = trimmed;
    const firstName = trimmed.split(/\s+/)[0];
    if (firstName && firstName !== trimmed && firstName.length >= 2) {
      this.map.names[firstName] = token;
    }
  }

  private addCompany(name: string, token: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.map.companies[trimmed] = token;
    this.map.reverseMap[token] = trimmed;
    for (const variant of this.companyVariants(trimmed)) {
      this.map.companies[variant] = token;
    }
  }

  private companyVariants(name: string): string[] {
    const out = new Set<string>();
    const stripped = name
      .replace(/\s*(Ltd|Limited|LLP|PLC|plc|Inc|Co)\s*\.?$/i, '')
      .trim();
    if (stripped && stripped !== name) out.add(stripped);
    const words = stripped.split(/\s+/);
    if (words.length > 1) out.add(words[0]);
    if (words.length > 2) out.add(words.slice(0, 2).join(' '));
    return Array.from(out).filter((v) => v.length >= 4); // avoid 1-3 char false positives
  }

  /** Returns the variants of a financial amount we want to match. The first
   *  entry is the canonical (most human-readable) form. */
  private amountVariants(value: number | string): string[] {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      const out = new Set<string>([trimmed]);
      const numeric = Number(trimmed.replace(/[£$,\s]/g, ''));
      if (!Number.isNaN(numeric)) {
        out.add(this.formatCurrency(numeric));
        out.add(numeric.toLocaleString('en-GB'));
        out.add(String(numeric));
      }
      return Array.from(out);
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return [
        this.formatCurrency(value),
        value.toLocaleString('en-GB'),
        String(value),
      ];
    }
    return [];
  }

  private formatCurrency(value: number): string {
    return `£${value.toLocaleString('en-GB')}`;
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Replace identifiable values with tokens. Idempotent — applying twice
   *  on already-tokenised text is a no-op. */
  tokenise(text: string): string {
    if (!text) return text;
    let out = text;

    // 1. Names — sorted by length DESC so "Jack Murphy" wins over "Jack".
    const nameEntries = Object.entries(this.map.names).sort((a, b) => b[0].length - a[0].length);
    for (const [raw, token] of nameEntries) {
      out = out.replace(new RegExp(this.escapeRegex(raw), 'gi'), token);
    }

    // 2. Companies (longest first, same reasoning).
    const companyEntries = Object.entries(this.map.companies).sort((a, b) => b[0].length - a[0].length);
    for (const [raw, token] of companyEntries) {
      out = out.replace(new RegExp(this.escapeRegex(raw), 'gi'), token);
    }

    // 3. Financial figures (case-sensitive — "£1,000" must not match "1000").
    const amountEntries = Object.entries(this.map.amounts).sort((a, b) => b[0].length - a[0].length);
    for (const [raw, token] of amountEntries) {
      out = out.replace(new RegExp(this.escapeRegex(raw), 'g'), token);
    }

    // 4. Extra redactions (PII that should never round-trip).
    for (const phrase of this.redactions) {
      out = out.replace(new RegExp(this.escapeRegex(phrase), 'gi'), '[REDACTED]');
    }

    return out;
  }

  /** Replace tokens with their original values. Idempotent — text without
   *  tokens passes through unchanged. */
  detokenise(text: string): string {
    if (!text) return text;
    let out = text;
    const entries = Object.entries(this.map.reverseMap).sort((a, b) => b[0].length - a[0].length);
    for (const [token, raw] of entries) {
      out = out.replace(new RegExp(this.escapeRegex(token), 'g'), raw);
    }
    return out;
  }

  /** Look for "name + amount within ~200 chars" co-occurrences in the supplied
   *  text. Used as a sanity check before the API call so we can warn (or
   *  refuse) if the tokeniser missed something. */
  validateSeparation(text: string): { safe: boolean; violations: string[] } {
    const violations: string[] = [];
    const realNames = Object.keys(this.map.names);
    const realAmounts = Object.keys(this.map.amounts);

    for (const name of realNames) {
      const nameIdx = text.toLowerCase().indexOf(name.toLowerCase());
      if (nameIdx === -1) continue;
      for (const amount of realAmounts) {
        const amountIdx = text.indexOf(amount);
        if (amountIdx === -1) continue;
        if (Math.abs(nameIdx - amountIdx) < 200) {
          violations.push(`Untokenised name "${name}" within 200 chars of amount "${amount}"`);
        }
      }
    }

    return { safe: violations.length === 0, violations };
  }

  /** For diagnostics only — returns counts, never the raw map. */
  stats(): { names: number; companies: number; amounts: number; redactions: number } {
    return {
      names: Object.keys(this.map.names).length,
      companies: Object.keys(this.map.companies).length,
      amounts: Object.keys(this.map.amounts).length,
      redactions: this.redactions.length,
    };
  }
}
