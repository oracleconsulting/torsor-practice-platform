// Assessment Questions - All 3 Parts
export * from './part1-questions';
export * from './part2-questions';
export * from './part3-questions';

// SA Process Deep Dives (Stage 3)
export * from './saProcessDeepDiveChains';

// Summary stats
import { PART1_TOTAL_QUESTIONS } from './part1-questions';
import { PART2_TOTAL_QUESTIONS, PART2_TOTAL_SECTIONS } from './part2-questions';
import { PART3_TOTAL_QUESTIONS, PART3_TOTAL_SECTIONS } from './part3-questions';

export const ASSESSMENT_TOTALS = {
  part1: {
    questions: PART1_TOTAL_QUESTIONS, // 15
    sections: 1,
    estimatedMinutes: 15
  },
  part2: {
    questions: PART2_TOTAL_QUESTIONS, // 72
    sections: PART2_TOTAL_SECTIONS,   // 12
    estimatedMinutes: 45
  },
  part3: {
    questions: PART3_TOTAL_QUESTIONS, // 32
    sections: PART3_TOTAL_SECTIONS,   // 6
    estimatedMinutes: 30
  },
  total: {
    questions: PART1_TOTAL_QUESTIONS + PART2_TOTAL_QUESTIONS + PART3_TOTAL_QUESTIONS,
    estimatedMinutes: 90
  }
} as const;

