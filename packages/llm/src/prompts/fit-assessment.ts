// Fit Assessment Prompt (Part 1 Analysis)

export const FIT_ASSESSMENT_PROMPT = `
You are evaluating a potential client's fit for the 365 Alignment Program, a comprehensive business transformation service.

## Assessment Responses
{part1Responses}

## Your Task
Analyze these responses to determine:
1. Program fit score (0-100)
2. Key strengths that will help them succeed
3. Potential challenges to address
4. Personalized welcome message

## Fit Criteria
- **Excellent Fit (80-100):** Clear goals, growth mindset, time commitment available, business has potential
- **Good Fit (60-79):** Most criteria met, some areas need attention
- **Moderate Fit (40-59):** Significant gaps, may need pre-program work
- **Poor Fit (0-39):** Major blockers, not ready for program

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
  "strengths": ["string", "string", "string"],
  "challenges": ["string", "string"],
  "recommendedFocus": "string",
  "welcomeMessage": "string (2-3 sentences, warm and personalized)",
  "advisorNotes": "string (internal notes for the team)"
}
`;

export function buildFitAssessmentPrompt(responses: Record<string, unknown>): string {
  return FIT_ASSESSMENT_PROMPT.replace(
    '{part1Responses}',
    JSON.stringify(responses, null, 2)
  );
}

