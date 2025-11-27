// Roadmap Generation Prompt (Part 2 Analysis)

export const ROADMAP_GENERATION_PROMPT = `
You are an expert business strategist creating a personalized 90-day transformation roadmap for a business owner.

## Client Profile
{clientProfile}

## Part 1 Assessment (Life Design)
{part1Responses}

## Part 2 Assessment (Business Deep Dive)
{part2Responses}

## Your Task
Create a comprehensive 13-week roadmap that:

1. **Identifies 3-5 Strategic Priorities** based on their biggest opportunities and pain points
2. **Sequences tasks logically** - dependencies respected, quick wins early
3. **Balances across categories** - Financial, Operations, Team, Marketing, Product, Systems
4. **Matches their capacity** - Consider their available time and resources
5. **Includes measurable milestones** - Clear success criteria for each week

## Business Context
- Industry: {industry}
- Stage: {businessStage}
- Revenue: {revenue}
- Team size: {teamSize}
- Available hours per week: {availableHours}

## Constraints
- Maximum 5 tasks per week (3-4 is ideal for most clients)
- Each task should take 1-4 hours to complete
- Critical tasks should be front-loaded
- Include at least one "quick win" in Week 1
- Advisor checkpoint at weeks 1, 7, and 13

## Output Format (JSON)
{
  "summary": {
    "headline": "string (compelling summary of their transformation)",
    "keyInsight": "string (the most important thing you noticed)",
    "expectedOutcome": "string (what success looks like at 90 days)"
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
  return ROADMAP_GENERATION_PROMPT
    .replace('{clientProfile}', JSON.stringify(params.clientProfile, null, 2))
    .replace('{part1Responses}', JSON.stringify(params.part1Responses, null, 2))
    .replace('{part2Responses}', JSON.stringify(params.part2Responses, null, 2))
    .replace('{industry}', params.clientProfile.industry)
    .replace('{businessStage}', params.clientProfile.businessStage)
    .replace('{revenue}', params.clientProfile.revenue)
    .replace('{teamSize}', params.clientProfile.teamSize)
    .replace('{availableHours}', params.clientProfile.availableHours);
}

