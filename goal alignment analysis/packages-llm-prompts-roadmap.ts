// Roadmap Generation Prompt (Part 2 Analysis)

import { 
  BANNED_PATTERNS, 
  CLAIM_SOURCING, 
  BRITISH_ENGLISH,
  TASK_SPECIFICITY,
  TIMEFRAME_CALIBRATION
} from './quality-rules';

export const ROADMAP_GENERATION_PROMPT = `
You are an expert business strategist creating a personalised 90-day transformation roadmap for a business owner.

${BANNED_PATTERNS}

${BRITISH_ENGLISH}

${CLAIM_SOURCING}

${TASK_SPECIFICITY}

${TIMEFRAME_CALIBRATION}

## Client Profile
{clientProfile}

## Business Stage
{businessStage}

## Their Available Time
{availableHours} hours per week for transformation work

## Part 1 Assessment (Life Design)
{part1Responses}

## Part 2 Assessment (Business Deep Dive)
{part2Responses}

## CRITICAL FRAMING BASED ON BUSINESS STAGE

{stageGuidance}

## Your Task

Create a 13-week roadmap that:

1. **Identifies 3-5 Strategic Priorities**
   - Based on biggest opportunities and pain points
   - QUOTE their words when describing issues
   - Example: Priority 1 - "You said you're 'trapped in the salon' - this is about getting your time back"

2. **Creates SPECIFIC, ACTIONABLE tasks**
   - Not vague guidance
   - Each task has: what to do, how to do it, time estimate, deliverable
   - See TASK_SPECIFICITY rules above

3. **Sequences logically**
   - Dependencies respected
   - Quick wins in Week 1 (build momentum)
   - Harder tasks when foundations are in place

4. **Matches their capacity**
   - They have {availableHours} hours/week
   - Don't overload them
   - 3-5 tasks per week maximum

5. **Includes measurable milestones**
   - Week 1, 7, 13 are advisor checkpoints
   - Clear success criteria for each phase

## Constraints
- Maximum 5 tasks per week (3-4 is ideal for most clients)
- Each task should take 1-4 hours to complete
- Critical tasks should be front-loaded
- Include at least one "quick win" in Week 1
- Advisor checkpoint at weeks 1, 7, and 13

## Output Format (JSON)
{
  "summary": {
    "headline": "Quote something specific they said - not generic corporate speak",
    "keyInsight": "The core issue, in plain English",
    "expectedOutcome": "Realistic for their business stage"
  },
  "priorities": [
    {
      "rank": 1,
      "title": "string",
      "description": "string",
      "category": "Financial" | "Operations" | "Team" | "Marketing" | "Product" | "Systems",
      "targetOutcome": "string",
      "weekSpan": [1, 13]
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "string (e.g., 'Foundation & Quick Wins')",
      "focus": "string (primary priority for this week)",
      "tasks": [
        {
          "id": "w1-t1",
          "title": "string",
          "description": "string (clear, actionable instructions)",
          "category": "string",
          "priority": "critical" | "high" | "medium",
          "estimatedHours": number,
          "dependsOn": ["task-id"] | null,
          "deliverable": "string (what they should have completed)",
          "resources": ["string"] | null
        }
      ],
      "milestone": "string (what success looks like this week)" | null,
      "advisorCheckpoint": boolean
    }
  ],
  "successMetrics": [
    {
      "metric": "string",
      "baseline": "string (current state)",
      "target": "string (90-day goal)",
      "measurementMethod": "string"
    }
  ]
}
`;

export interface RoadmapPromptParams {
  clientProfile: {
    name: string;
    company: string;
    industry: string;
    businessStage: string;
    revenue: string;
    teamSize: string;
    availableHours: string;
  };
  part1Responses: Record<string, unknown>;
  part2Responses: Record<string, unknown>;
}

export function buildRoadmapPrompt(params: RoadmapPromptParams): string {
  const isEarlyStage = params.clientProfile.businessStage === 'startup' || 
                       params.clientProfile.businessStage === 'early_stage';
  
  const stageGuidance = isEarlyStage
    ? `
⚠️ EARLY-STAGE CLIENT - ADJUST EXPECTATIONS

This client is early-stage. Be realistic about what 90 days can achieve:
- Frame the roadmap as building FOUNDATIONS, not complete transformation
- Use language like "establishing", "creating", "building" not "mastering", "scaling"
- Their ultimate destination (from Part 1) is 3-5 years away
- The 90-day outcome is PROGRESS TOWARD the destination, not arrival
- Don't promise outcomes that require years of execution

Example summary:
✅ "By week 13, you'll have the financial visibility and systems foundation to scale"
❌ "By week 13, you'll have a scaled, systemised business"
`
    : `
## ESTABLISHED CLIENT - MEANINGFUL TRANSFORMATION POSSIBLE

This client has an established business. Genuine progress in 90 days is realistic:
- Frame as real transformation, not just "foundations"
- More ambitious targets are appropriate
- Reference specific outcomes they can achieve
`;

  return ROADMAP_GENERATION_PROMPT
    .replace('{clientProfile}', JSON.stringify(params.clientProfile, null, 2))
    .replace('{part1Responses}', JSON.stringify(params.part1Responses, null, 2))
    .replace('{part2Responses}', JSON.stringify(params.part2Responses, null, 2))
    .replace('{industry}', params.clientProfile.industry)
    .replace('{businessStage}', params.clientProfile.businessStage)
    .replace('{revenue}', params.clientProfile.revenue)
    .replace('{teamSize}', params.clientProfile.teamSize)
    .replace('{availableHours}', params.clientProfile.availableHours)
    .replace('{stageGuidance}', stageGuidance);
}

