import { describe, it, expect } from 'vitest';
import { scanVoice } from './ga-voice-scan';

function rules(text: string): string[] {
  return Array.from(new Set(scanVoice({ field: text }).violations.map((v) => v.rule)));
}

describe('scanVoice', () => {
  it('passes clean copy', () => {
    const result = scanVoice({
      theme: 'Revenue visibility',
      narrative: 'You cannot scale what you cannot see. This week you build the view.',
    });
    expect(result.violationCount).toBe(0);
    expect(result.fieldsScanned).toBe(2);
  });

  it('catches em dashes and en dashes', () => {
    expect(rules('You built the base\u2014now scale it')).toContain('em_dash');
    expect(rules('Weeks 3\u20136 are the middle')).toContain('em_dash');
  });

  it('catches a spaced hyphen doing dash work but not a hyphenated word', () => {
    expect(rules('You built the base - now scale it')).toContain('spaced_hyphen');
    expect(rules('A best-in-class month-end process')).not.toContain('spaced_hyphen');
  });

  it('catches rather than and not X but Y', () => {
    expect(rules('Fix the process rather than the symptom')).toContain('rather_than');
    expect(rules('Not only does it save time, but also it cuts errors')).toContain('not_x_but_y');
    expect(rules("It's not about the tools. It's about the habit")).toContain('not_x_but_y');
  });

  it('catches importance assertions', () => {
    expect(rules("It's important to note that cash is tight")).toContain('importance_assertion');
    expect(rules('This step is crucial for month end')).toContain('importance_assertion');
    expect(rules('Visibility plays a pivotal role here')).toContain('importance_assertion');
  });

  it('catches forbidden phrases on word boundaries only', () => {
    expect(rules('Additionally, we will delve into the numbers')).toContain('forbidden_phrase');
    expect(rules('Leverage the ecosystem to foster synergy')).toContain('forbidden_phrase');
    // 'foster' must not fire inside 'fostered'? It should, but must not fire on
    // an unrelated word that merely contains a banned substring.
    expect(rules('Send the roster to the team')).not.toContain('forbidden_phrase');
  });

  it('catches hollow intensifiers', () => {
    expect(rules('This is a very important number')).toContain('hollow_intensifier');
    expect(rules('Simply put, you are behind')).toContain('hollow_intensifier');
  });

  it('catches currency format problems', () => {
    expect(rules('It costs $650 a month')).toContain('currency_format');
    expect(rules('It costs £13300 to start')).toContain('currency_format');
    expect(rules('It costs £650.00 a month')).toContain('currency_format');
    expect(rules('It costs £650 a month')).not.toContain('currency_format');
    expect(rules('It costs £13,300 to start')).not.toContain('currency_format');
  });

  it('records a path per field so the diff view can flag the right task', () => {
    const result = scanVoice({
      week4: {
        narrative: 'You built the base\u2014now scale it',
        tasks: [{ title: 'Fine', description: 'This is crucial work' }],
      },
    });
    const paths = result.violations.map((v) => v.path);
    expect(paths).toContain('week4.narrative');
    expect(paths).toContain('week4.tasks[0].description');
    expect(result.flaggedPaths.length).toBe(2);
  });

  it('scans duplicated halves independently', () => {
    const result = scanVoice({
      week4: {
        weekMilestone: 'By week 4 you are truly done',
        milestone: 'By week 4 you are done',
        tuesdayCheckIn: 'Am I seeing the shift?',
        tuesdayTransformation: 'Am I seeing the shift\u2014yet?',
      },
    });
    const paths = result.violations.map((v) => v.path);
    expect(paths).toContain('week4.weekMilestone');
    expect(paths).toContain('week4.tuesdayTransformation');
    expect(paths).not.toContain('week4.milestone');
  });

  it('survives cycles and reports rule counts', () => {
    const node: any = { text: 'This is very crucial' };
    node.self = node;
    const result = scanVoice(node);
    expect(result.byRule.hollow_intensifier).toBe(1);
    expect(result.byRule.importance_assertion).toBe(1);
  });
});
