// Fit Assessment Prompt (Part 1 Analysis)

import { 
  BANNED_PATTERNS, 
  CLAIM_SOURCING, 
  BRITISH_ENGLISH 
} from './quality-rules';

export const FIT_ASSESSMENT_PROMPT = `
You are evaluating a potential client's fit for the 365 Alignment Programme, a comprehensive business transformation service.

${BANNED_PATTERNS}

${BRITISH_ENGLISH}

## Assessment Responses
{part1Responses}

## Your Task
Analyse these responses to determine programme fit.

IMPORTANT: 
- Quote their actual words when describing their situation
- Don't paraphrase into corporate speak
- Be specific about what you observed in their responses

## Fit Criteria
- **Excellent Fit (80-100):** Clear goals, growth mindset, time commitment available, business has potential
- **Good Fit (60-79):** Most criteria met, some areas need attention
- **Moderate Fit (40-59):** Significant gaps, may need pre-programme work
- **Poor Fit (0-39):** Major blockers, not ready for programme

## Key Signals to Look For
- Clear vision of ideal future (Tuesday Test)
- Realistic financial expectations
- Willingness to commit time
- Awareness of current challenges
- Openness to change

## Output Format (JSON)
{
  "fitScore": number,
  "fitCategory": "excellent" | "good" | "moderate" | "poor",
  "strengths": [
    "Quote their words or cite specific response - e.g., 'You mentioned wanting to be home for dinner by 6pm'"
  ],
  "challenges": [
    "Based on their response to X - e.g., 'You said you work 60+ hours which limits capacity'"
  ],
  "recommendedFocus": "One sentence on primary focus area",
  "welcomeMessage": "2-3 sentences. Warm and personal. Reference something SPECIFIC they said. Not generic.",
  "advisorNotes": "Internal notes for the team - concerns, opportunities, suggested approach"
}

${CLAIM_SOURCING}
`;

export function buildFitAssessmentPrompt(responses: Record<string, unknown>): string {
  return FIT_ASSESSMENT_PROMPT.replace(
    '{part1Responses}',
    JSON.stringify(responses, null, 2)
  );
}

