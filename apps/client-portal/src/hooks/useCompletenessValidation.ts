// ============================================================================
// useCompletenessValidation — SA Review & Submit completeness checks
// ============================================================================

import { useMemo } from 'react';

export interface ValidationIssue {
  stage: 'stage_1' | 'stage_2' | 'stage_3';
  section?: string;
  questionId?: string;
  questionLabel?: string;
  chainCode?: string;
  type: 'placeholder' | 'missing_required' | 'too_short' | 'duplicate' | 'empty_section';
  severity: 'warning' | 'error';
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  stage1Score: { answered: number; total: number; flagged: number };
  stage2Score: { systems: number; flagged: number };
  stage3Score: { chainsCompleted: number; chainsTotal: number; flagged: number };
  canSubmit: boolean;
}

// ---------------------------------------------------------------------------
// Placeholder detection
// ---------------------------------------------------------------------------

const PLACEHOLDER_PATTERNS = [
  /^(.)\1{3,}$/,
  /^[a-z]{3,}$/i,
  /^(asdf|qwer|zxcv|test|xxx|aaa|sdf|asd)/i,
  /^.{1,3}$/,
  /^(tbd|todo|tbc|n\/a|na|-)$/i,
  /^(.{1,5})\1{2,}$/,
];

function isLikelyPlaceholder(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const cleaned = text.trim();
  if (cleaned.length === 0) return false;
  if (cleaned.length > 30 && /\s/.test(cleaned)) return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function isTooShort(text: string, questionType: string): boolean {
  if (questionType !== 'text' && questionType !== 'textarea') return false;
  const cleaned = (text || '').trim();
  if (questionType === 'textarea' && cleaned.length > 0 && cleaned.length < 15) return true;
  if (questionType === 'text' && cleaned.length > 0 && cleaned.length < 3) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Stage 1 question config (minimal shape for validation)
// ---------------------------------------------------------------------------

export interface Stage1Question {
  id: string;
  section: string;
  question: string;
  type: string;
  required?: boolean;
}

export interface Stage2System {
  id?: string;
  system_name?: string;
  category_code?: string;
  [key: string]: unknown;
}

export interface Stage3Chain {
  chain_code: string;
  chain_name?: string;
  is_core?: boolean;
}

export interface Stage3DeepDive {
  chain_code: string;
  completed_at?: string | null;
  responses?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Input for validation
// ---------------------------------------------------------------------------

export interface CompletenessValidationInput {
  stage1Responses: Record<string, unknown>;
  stage1Questions: Stage1Question[];
  stage2Systems: Stage2System[];
  stage3Chains: Stage3Chain[];
  stage3DeepDives: Stage3DeepDive[];
}

// ---------------------------------------------------------------------------
// Run validation
// ---------------------------------------------------------------------------

export function runCompletenessValidation(input: CompletenessValidationInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  const {
    stage1Responses,
    stage1Questions,
    stage2Systems,
    stage3Chains,
    stage3DeepDives,
  } = input;

  // Stage 1
  const requiredStage1 = stage1Questions.filter((q) => q.required !== false);
  const totalStage1 = stage1Questions.length;
  let answeredStage1 = 0;
  let flaggedStage1 = 0;
  const answeredEntries: { index: number; value: string; question: Stage1Question }[] = [];

  for (let i = 0; i < stage1Questions.length; i++) {
    const q = stage1Questions[i];
    const raw = stage1Responses[q.id];
    const isRequired = q.required !== false;
    const isEmpty = raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '') || (Array.isArray(raw) && raw.length === 0);

    if (!isEmpty) {
      answeredStage1 += 1;
      const strVal = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(' ') : String(raw ?? '');
      if (strVal) answeredEntries.push({ index: i, value: strVal.trim().toLowerCase(), question: q });

      const qType = q.type === 'text' || (q.type as string) === 'textarea' ? (q.type as string) : 'text';
      if (typeof raw === 'string' && (qType === 'text' || qType === 'textarea')) {
        if (isLikelyPlaceholder(raw)) {
          flaggedStage1 += 1;
          issues.push({
            stage: 'stage_1',
            section: q.section,
            questionId: q.id,
            questionLabel: q.question,
            type: 'placeholder',
            severity: 'warning',
            message: 'Looks like placeholder or incomplete text',
          });
        } else if (isTooShort(raw, qType)) {
          flaggedStage1 += 1;
          issues.push({
            stage: 'stage_1',
            section: q.section,
            questionId: q.id,
            questionLabel: q.question,
            type: 'too_short',
            severity: 'warning',
            message: 'Answer seems too short to be meaningful',
          });
        }
      }
    } else if (isRequired) {
      issues.push({
        stage: 'stage_1',
        section: q.section,
        questionId: q.id,
        questionLabel: q.question,
        type: 'missing_required',
        severity: 'error',
        message: 'This question is required',
      });
    }
  }

  // Duplicate detection: same answer repeated across questions
  const seen = new Map<string, { index: number; question: Stage1Question }>();
  for (const { index, value, question } of answeredEntries) {
    if (value.length < 30) continue;
    const key = value.slice(0, 100);
    const prev = seen.get(key);
    if (prev !== undefined) {
      if (prev.question.id !== question.id) {
        issues.push({
          stage: 'stage_1',
          section: question.section,
          questionId: question.id,
          questionLabel: question.question,
          type: 'duplicate',
          severity: 'warning',
          message: 'This answer is very similar to another — worth checking',
        });
        flaggedStage1 += 1;
      }
    } else {
      seen.set(key, { index, question });
    }
  }

  // Empty sections Stage 1
  const sectionsWithAnswers = new Set(stage1Questions.filter((q) => {
    const raw = stage1Responses[q.id];
    return raw !== undefined && raw !== null && (typeof raw !== 'string' || raw.trim() !== '') && (!Array.isArray(raw) || raw.length > 0);
  }).map((q) => q.section));
  for (const section of [...new Set(stage1Questions.map((q) => q.section))]) {
    if (!sectionsWithAnswers.has(section)) {
      const sectionQuestions = stage1Questions.filter((q) => q.section === section);
      if (sectionQuestions.some((q) => q.required)) {
        issues.push({
          stage: 'stage_1',
          section,
          type: 'empty_section',
          severity: 'warning',
          message: `Section "${section}" has no answers yet`,
        });
      }
    }
  }

  // Stage 2
  const systemsCount = stage2Systems.length;
  let flaggedStage2 = 0;
  for (const sys of stage2Systems) {
    const name = (sys.system_name ?? '').toString().trim();
    if (name.length > 0 && name.length < 3) {
      flaggedStage2 += 1;
      issues.push({
        stage: 'stage_2',
        questionId: sys.id as string,
        questionLabel: 'System name',
        type: 'too_short',
        severity: 'warning',
        message: 'System name seems too short',
      });
    }
  }

  // Stage 3
  const coreChains = stage3Chains.filter((c) => c.is_core);
  const allChains = stage3Chains;
  const chainsTotal = allChains.length;
  const chainsCompleted = stage3DeepDives.filter((d) => d.completed_at).length;
  const completedByCode = new Set(stage3DeepDives.filter((d) => d.completed_at).map((d) => d.chain_code));
  let flaggedStage3 = 0;
  for (const d of stage3DeepDives) {
    if (!d.completed_at) continue;
    const resp = d.responses || {};
    const vals = Object.values(resp).filter((v) => typeof v === 'string' && v.trim().length > 0);
    for (const v of vals) {
      if (isLikelyPlaceholder(v as string)) {
        flaggedStage3 += 1;
        issues.push({
          stage: 'stage_3',
          chainCode: d.chain_code,
          type: 'placeholder',
          severity: 'warning',
          message: `Possible placeholder answer in ${d.chain_code}`,
        });
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  const canSubmit = !hasErrors;

  return {
    issues,
    stage1Score: { answered: answeredStage1, total: totalStage1, flagged: flaggedStage1 },
    stage2Score: { systems: systemsCount, flagged: flaggedStage2 },
    stage3Score: { chainsCompleted, chainsTotal, flagged: flaggedStage3 },
    canSubmit,
  };
}

// ---------------------------------------------------------------------------
// Hook: run validation when inputs change
// ---------------------------------------------------------------------------

export function useCompletenessValidation(input: CompletenessValidationInput | null): ValidationResult | null {
  return useMemo(() => {
    if (!input) return null;
    return runCompletenessValidation(input);
  }, [input]);
}
