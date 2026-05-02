// =============================================================================
// GA CONTENT VALIDATOR
// Post-generation tone/voice check for Goal Alignment edge functions.
// Run after parsing the LLM response and before persisting to roadmap_stages.
//
// Returns:
//   - passed: true when no violations found
//   - violations: human-readable list of issues
//   - autoFixed: the input string with em dashes auto-replaced
//
// Em dashes are auto-replaced because they're the single most common
// regression and are mechanically safe to fix; everything else is logged
// (and surfaced via console.warn at the call site) for review.
// =============================================================================

export interface ValidationResult {
  passed: boolean;
  violations: string[];
  autoFixed: string;
}

export function validateGAContent(content: string): ValidationResult {
  const violations: string[] = [];
  let fixed = content;

  // EM DASH CHECK (highest priority — auto-fix)
  const emDashCount = (content.match(/\u2014/g) || []).length;
  if (emDashCount > 0) {
    violations.push(`Found ${emDashCount} em dashes. Replacing with commas/full stops.`);
    fixed = fixed.replace(/\s*\u2014\s*/g, '. ');
  }

  // THIRD PERSON CHECK
  const thirdPersonPatterns = [
    /\bJack\s+(has|is|was|will|can|should|must|needs|wants)\b/gi,
    /\bhe\s+(has|is|was|will|can|should|must|needs|wants)\b/gi,
    /\bhis\s+(first|second|third|fourth|fifth|business|team|wife|family)\b/gi,
  ];
  for (const pattern of thirdPersonPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`Third person reference found: "${matches[0]}". Should be second person.`);
    }
  }

  // BANNED WORDS CHECK
  const bannedWords = [
    'delve', 'realm', 'harness', 'unlock', 'leverage', 'seamless', 'empower',
    'streamline', 'elevate', 'unprecedented', 'reimagine', 'holistic', 'foster',
    'robust', 'scalable', 'breakthrough', 'disruptive', 'transformative',
    'game-changer', 'cutting-edge', 'synergy', 'frictionless', 'paradigm',
    'additionally', 'furthermore', 'moreover', 'crucial', 'pivotal', 'vital',
    'testament', 'underscores', 'highlights', 'showcases', 'garnered',
    'tapestry', 'landscape', 'ecosystem', 'intricate', 'vibrant', 'enduring'
  ];
  for (const word of bannedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(content)) {
      violations.push(`Banned word found: "${word}"`);
    }
  }

  // BANNED PATTERNS CHECK
  const bannedPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /Here's (the|what|how|why)/gi, name: "Starts with 'Here's'" },
    { pattern: /It's not about .+\. It's about/gi, name: "'It's not about X. It's about Y'" },
    { pattern: /That's not .+\. It's/gi, name: "'That's not X. It's Y'" },
    { pattern: /Most people .+\. The few who/gi, name: "'Most people X. The few who Y'" },
    { pattern: /The real work is/gi, name: "'The real work is'" },
    { pattern: /Let me be clear/gi, name: "'Let me be clear'" },
    { pattern: /I want to be direct/gi, name: "'I want to be direct'" },
    { pattern: /North Star vision/gi, name: "'North Star vision' (use specific reference)" },
    { pattern: /Sustains your transformation/gi, name: "'Sustains your transformation'" },
    { pattern: /Connects to your North Star/gi, name: "'Connects to your North Star'" },
    { pattern: /Notice how it feels/gi, name: "Therapy-speak celebration" },
    { pattern: /You chose yourself/gi, name: "Therapy-speak celebration" },
    { pattern: /Am I starting to believe/gi, name: "Therapy-speak check-in" },
    { pattern: /Am I reclaiming/gi, name: "Therapy-speak check-in" },
  ];
  for (const { pattern, name } of bannedPatterns) {
    if (pattern.test(content)) {
      violations.push(`Banned pattern found: ${name}`);
    }
  }

  // CELEBRATION MOMENT CHECK (therapy-speak)
  const therapyCelebrations = [
    /Most people don't/gi,
    /That's the shift/gi,
    /honour this commitment/gi,
    /honor this commitment/gi,
    /You looked at the numbers honestly/gi,
  ];
  for (const pattern of therapyCelebrations) {
    if (pattern.test(content)) {
      const match = content.match(pattern)?.[0] ?? '';
      violations.push(`Therapy-speak celebration found: "${match}"`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    autoFixed: fixed,
  };
}
