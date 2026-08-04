// ============================================================================
// GA VOICE SCAN
// ============================================================================
// Walks a generated content object and scans every string field against the
// house voice patterns. Unlike ga-content-validator this returns a per-field
// path, so a reviewer can see which week and which task carries the violation.
//
// This never blocks generation. The result is written to
// roadmap_stages.metadata.voiceScan and flagged in the admin diff view.
//
// Patterns are drawn from _shared/ANTI_AI_SLOP_STYLE_GUIDE.md,
// _shared/ga-content-validator.ts and _shared/writing-style.ts.
// ============================================================================

export type VoiceRuleId =
  | 'em_dash'
  | 'spaced_hyphen'
  | 'rather_than'
  | 'not_x_but_y'
  | 'importance_assertion'
  | 'forbidden_phrase'
  | 'hollow_intensifier'
  | 'currency_format';

export interface VoiceViolation {
  path: string;
  rule: VoiceRuleId;
  label: string;
  match: string;
  excerpt: string;
}

export interface VoiceScanResult {
  scannedAt: string;
  fieldsScanned: number;
  violationCount: number;
  byRule: Partial<Record<VoiceRuleId, number>>;
  /** Paths with at least one violation, for cheap lookup in the diff view. */
  flaggedPaths: string[];
  violations: VoiceViolation[];
  truncated: boolean;
}

interface Rule {
  id: VoiceRuleId;
  label: string;
  pattern: RegExp;
}

const FORBIDDEN_PHRASES = [
  // Tier 1 vocabulary tells
  'additionally', 'furthermore', 'moreover', 'delve', 'delving', 'realm',
  'harness', 'unlock', 'seamless', 'empower', 'streamline', 'elevate',
  'unprecedented', 'reimagine', 'holistic', 'foster', 'fostering', 'robust',
  'scalable', 'breakthrough', 'disruptive', 'transformative', 'game-changer',
  'cutting-edge', 'synergy', 'frictionless', 'paradigm', 'testament',
  'underscores', 'showcases', 'garnered', 'tapestry', 'ecosystem',
  'intricate', 'intricacies', 'vibrant', 'impactful', 'value-add',
  'circle back', 'best-in-class', 'north star vision',
  // Structural tells
  "here's the thing", 'let me be clear', 'i want to be direct',
  'the real work is', 'in conclusion', 'in summary', "that said",
  'having said that', "what's more", "it's worth noting",
  // Therapy-speak
  'notice how it feels', 'you chose yourself', 'am i starting to believe',
  'am i reclaiming', "that's the shift", 'honour this commitment',
  'honor this commitment', 'sustains your transformation',
  'connects to your north star',
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const RULES: Rule[] = [
  {
    id: 'em_dash',
    label: 'Em dash',
    pattern: /[\u2014\u2013]/g,
  },
  {
    id: 'spaced_hyphen',
    // A hyphen with spaces either side is doing an em dash's job.
    label: 'Spaced hyphen used as a dash',
    pattern: /\S\s+-\s+\S/g,
  },
  {
    id: 'rather_than',
    label: '"rather than" construction',
    pattern: /\brather than\b/gi,
  },
  {
    id: 'not_x_but_y',
    label: '"not X but Y" construction',
    pattern:
      /\b(?:not only\b[^.!?]{1,80}?\bbut also\b|not\b[^.!?,;]{1,60}?\bbut\b|isn't\b[^.!?]{1,60}?,\s*it's\b|it's not (?:about|that)\b[^.!?]{1,80}?[.!?]\s*it's\b|that's not\b[^.!?]{1,60}?\.\s*it's\b)/gi,
  },
  {
    id: 'importance_assertion',
    label: 'Asserts importance instead of showing it',
    pattern:
      /\b(?:it(?:'s| is) important to (?:note|remember|understand)|importantly|crucially|plays? an? (?:crucial|pivotal|vital|key|essential) role|cannot be overstated|the key (?:is|to)\b|matters because\b|highlights the importance|(?:crucial|pivotal|vital)\b)/gi,
  },
  {
    id: 'hollow_intensifier',
    label: 'Hollow intensifier',
    pattern:
      /\b(?:very|really|truly|incredibly|extremely|genuinely|simply|absolutely|utterly|hugely|massively|profoundly|remarkably)\b/gi,
  },
  {
    id: 'currency_format',
    // House format is £ with thousands separators and no trailing .00.
    label: 'Currency format',
    pattern: /(?:[$\u20AC]\s?\d|£\s+\d|£\d{4,}(?!\d)|£[\d,]+\.00\b)/g,
  },
  {
    id: 'forbidden_phrase',
    label: 'Forbidden phrase',
    pattern: new RegExp(
      `(?:${FORBIDDEN_PHRASES.map((p) =>
        /^[a-z0-9'-]+$/i.test(p) ? `\\b${escapeRegExp(p)}\\b` : escapeRegExp(p),
      ).join('|')})`,
      'gi',
    ),
  },
];

const MAX_VIOLATIONS = 300;

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ')}${
    end < text.length ? '…' : ''
  }`;
}

function scanString(text: string, path: string, into: VoiceViolation[]): void {
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    let perRule = 0;
    while ((match = rule.pattern.exec(text)) !== null) {
      if (into.length >= MAX_VIOLATIONS) return;
      into.push({
        path,
        rule: rule.id,
        label: rule.label,
        match: match[0].trim(),
        excerpt: excerptAround(text, match.index, match[0].length),
      });
      // Cap per rule per field so one bad paragraph cannot swamp the report.
      if (++perRule >= 5) break;
      if (match[0].length === 0) rule.pattern.lastIndex++;
    }
  }
}

/**
 * Scans every string in `value`, including duplicated halves such as
 * weekMilestone/milestone and tuesdayCheckIn/tuesdayTransformation, since the
 * aliases are written independently and drift.
 */
export function scanVoice(value: unknown, rootPath = ''): VoiceScanResult {
  const violations: VoiceViolation[] = [];
  let fieldsScanned = 0;
  let truncated = false;
  const seen = new WeakSet<object>();

  const walk = (node: unknown, path: string): void => {
    if (violations.length >= MAX_VIOLATIONS) {
      truncated = true;
      return;
    }
    if (typeof node === 'string') {
      // Skip ids, enums and other machine values; they carry no voice.
      if (node.length < 3) return;
      fieldsScanned++;
      scanString(node, path || 'root', violations);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === 'object') {
      if (seen.has(node as object)) return;
      seen.add(node as object);
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        walk(child, path ? `${path}.${key}` : key);
      }
    }
  };

  walk(value, rootPath);

  const byRule: Partial<Record<VoiceRuleId, number>> = {};
  for (const v of violations) {
    byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
  }

  return {
    scannedAt: new Date().toISOString(),
    fieldsScanned,
    violationCount: violations.length,
    byRule,
    flaggedPaths: Array.from(new Set(violations.map((v) => v.path))),
    violations,
    truncated: truncated || violations.length >= MAX_VIOLATIONS,
  };
}
