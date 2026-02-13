// ============================================================================
// EDGE FUNCTION: generate-fit-profile
// ============================================================================
// Triggered: Immediately after Part 1 (Life Design) is completed
// Purpose: Create the opening chapter of their transformation story
// Output: North Star, Opening Reflection, Fit Signals, Archetype
// 
// Philosophy: This is not a report. This is a mirror that makes them feel SEEN.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// LIFE DESIGN PROFILE (extracted from Part 1 for downstream pipeline)
// ============================================================================

interface LifeCommitment {
  id: string;
  commitment: string;
  category: 'time' | 'relationship' | 'health' | 'experience' | 'identity';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'one-off';
  source: string;
  measurable: string;
  startWeek: number;
}

interface LifeDesignProfile {
  currentWeeklyHours: number;
  targetWeeklyHours: number;
  hourReductionTarget: number;
  protectedDays: string[];
  protectedTimeBlocks: string[];
  currentMonthlyIncome: number;
  targetMonthlyIncome: number;
  incomeGap: number;
  financialFreedomDefinition: string;
  keyRelationship: string | null;
  relationshipImpact: string;
  familyFeedback: string;
  relationshipGoal: string;
  sacrifices: string[];
  dangerZone: string;
  energyDrains: string[];
  energyGoal: string;
  tuesdayVision: string;
  secretPride: string;
  archetype: string;
  identityShift: string;
  lifeCommitments: LifeCommitment[];
}

// ============================================================================
// FIT ANALYSIS (Rule-based scoring - kept for objectivity)
// ============================================================================

interface FitSignals {
  readinessScore: number;
  readinessExplanation: string;
  commitmentScore: number;
  commitmentExplanation: string;
  clarityScore: number;
  clarityExplanation: string;
  urgencyScore: number;
  urgencyExplanation: string;
  coachabilityScore: number;
  coachabilityExplanation: string;
  overallFit: 'excellent' | 'good' | 'needs_discussion' | 'not_ready';
}

function analyzeFitSignals(part1: Record<string, any>): FitSignals {
  let readinessScore = 50;
  let commitmentScore = 50;
  let clarityScore = 50;
  let urgencyScore = 50;
  let coachabilityScore = 50;

  // Track explanations based on their actual answers
  const readinessReasons: string[] = [];
  const commitmentReasons: string[] = [];
  const clarityReasons: string[] = [];
  const urgencyReasons: string[] = [];
  const coachabilityReasons: string[] = [];

  // ---- READINESS SIGNALS ----
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesdayTest.length > 200) {
    readinessScore += 20;
    readinessReasons.push('Your Tuesday Test shows detailed, concrete thinking');
  } else if (tuesdayTest.length > 100) {
    readinessScore += 10;
    readinessReasons.push('You have a clear picture of what you want');
  } else if (tuesdayTest.length < 30) {
    readinessScore -= 15;
    readinessReasons.push('Your vision could use more specificity');
  }

  if (/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(tuesdayTest)) {
    readinessScore += 10;
    readinessReasons.push('You think in specific times—that\'s concrete planning');
  }

  const emergencyLog = part1.emergency_log || '';
  if (emergencyLog.length > 50) {
    readinessScore += 10;
    readinessReasons.push('You\'re aware of what\'s pulling you back into the business');
  }

  // ---- COMMITMENT SIGNALS ----
  const commitment = part1.commitment_hours || '';
  if (commitment.includes('20+') || commitment.includes('20 hours')) {
    commitmentScore += 25;
    commitmentReasons.push('20+ hours/week shows serious commitment');
  } else if (commitment.includes('15-20') || commitment.includes('15 hours')) {
    commitmentScore += 15;
    commitmentReasons.push('15-20 hours is solid time investment');
  } else if (commitment.includes('10-15')) {
    commitmentScore += 5;
    commitmentReasons.push('10-15 hours is workable but tight');
  } else if (commitment.includes('5-10') || commitment.includes('less')) {
    commitmentScore -= 15;
    commitmentReasons.push('Limited time availability may slow progress');
  }

  const sacrifices = part1.sacrifices || [];
  if (sacrifices.length >= 3) {
    commitmentScore += 15;
    commitmentReasons.push('You\'ve acknowledged real trade-offs');
  } else if (sacrifices.length >= 1) {
    commitmentScore += 5;
  } else {
    commitmentScore -= 10;
    commitmentReasons.push('Consider what you\'re willing to sacrifice');
  }

  const currentIncome = parseIncome(part1.current_income);
  const desiredIncome = parseIncome(part1.desired_income);
  if (desiredIncome > currentIncome * 2) {
    commitmentScore += 10;
    commitmentReasons.push('Ambitious income goals—good, this takes courage');
  }

  // ---- CLARITY SIGNALS ----
  const tenYearVision = part1.ten_year_vision || '';
  if (tenYearVision.length > 100) {
    clarityScore += 20;
    clarityReasons.push('Your 10-year vision is well-articulated');
  } else if (tenYearVision.length > 50) {
    clarityScore += 10;
  } else if (tenYearVision.length < 20 && tenYearVision.length > 0) {
    clarityScore -= 10;
    clarityReasons.push('Your long-term vision could use more detail');
  }

  const relationshipMirror = part1.relationship_mirror || '';
  if (relationshipMirror.length > 75) {
    clarityScore += 15;
    clarityReasons.push('You\'re self-aware about your relationship with the business');
  }
  if (relationshipMirror.toLowerCase().includes('feel')) {
    clarityScore += 5;
    clarityReasons.push('You connect with how the business makes you feel');
  }

  const dangerZone = part1.danger_zone || '';
  if (dangerZone.length > 30) {
    clarityScore += 10;
    clarityReasons.push('You know your danger zone—awareness is power');
  }

  // ---- URGENCY SIGNALS ----
  const familyFeedback = part1.family_feedback || '';
  if (familyFeedback.length > 50) {
    urgencyScore += 15;
    urgencyReasons.push('Your family\'s feedback suggests this matters to more than just you');
  }
  if (familyFeedback.toLowerCase().includes('worried') || 
      familyFeedback.toLowerCase().includes('concern') ||
      familyFeedback.toLowerCase().includes('never see')) {
    urgencyScore += 10;
    urgencyReasons.push('People who love you are noticing the toll');
  }

  const moneyWorry = part1.money_worry || '';
  if (moneyWorry.length > 50) urgencyScore += 10;
  if (moneyWorry.toLowerCase().includes('keep me up') ||
      moneyWorry.toLowerCase().includes('cant sleep') ||
      moneyWorry.toLowerCase().includes("can't sleep")) {
    urgencyScore += 15;
    urgencyReasons.push('This is affecting your sleep—that\'s a body signal to pay attention to');
  }

  const twoWeekBreak = part1.two_week_break_impact || '';
  if (twoWeekBreak.toLowerCase().includes('disaster') ||
      twoWeekBreak.toLowerCase().includes('collapse') ||
      twoWeekBreak.toLowerCase().includes('stop')) {
    urgencyScore += 15;
    urgencyReasons.push('The business can\'t survive without you—that\'s both the problem and the opportunity');
  }

  // ---- COACHABILITY SIGNALS ----
  const helpFears = part1.help_fears || '';
  if (helpFears.length > 30) {
    coachabilityScore += 15;
    coachabilityReasons.push('Acknowledging fears about getting help shows self-awareness');
  }
  if (helpFears.toLowerCase().includes('control') ||
      helpFears.toLowerCase().includes('trust')) {
    coachabilityScore += 5;
    coachabilityReasons.push('You know what holds you back from accepting help');
  }

  const lastExcitement = part1.last_excitement || '';
  if (lastExcitement.length > 30) {
    coachabilityScore += 10;
    coachabilityReasons.push('You still have passion for parts of this');
  }

  const secretPride = part1.secret_pride || '';
  if (secretPride.length > 30) {
    coachabilityScore += 10;
    coachabilityReasons.push('You have strengths you don\'t fully acknowledge');
  }

  const magicAway = part1.magic_away_task || '';
  if (magicAway.length > 20) {
    coachabilityScore += 5;
    coachabilityReasons.push('You can articulate what you want to stop doing');
  }

  // Normalize scores
  readinessScore = Math.max(0, Math.min(100, readinessScore));
  commitmentScore = Math.max(0, Math.min(100, commitmentScore));
  clarityScore = Math.max(0, Math.min(100, clarityScore));
  urgencyScore = Math.max(0, Math.min(100, urgencyScore));
  coachabilityScore = Math.max(0, Math.min(100, coachabilityScore));

  // Calculate overall fit
  const avgScore = (readinessScore + commitmentScore + clarityScore + urgencyScore + coachabilityScore) / 5;
  
  let overallFit: FitSignals['overallFit'];
  if (avgScore >= 70 && commitmentScore >= 60) overallFit = 'excellent';
  else if (avgScore >= 55 && commitmentScore >= 50) overallFit = 'good';
  else if (avgScore >= 40 || (urgencyScore >= 70 && coachabilityScore >= 60)) overallFit = 'needs_discussion';
  else overallFit = 'not_ready';

  return {
    readinessScore,
    readinessExplanation: readinessReasons.join('. ') || 'Ready to move forward',
    commitmentScore,
    commitmentExplanation: commitmentReasons.join('. ') || 'Commitment level assessed',
    clarityScore,
    clarityExplanation: clarityReasons.join('. ') || 'Vision clarity assessed',
    urgencyScore,
    urgencyExplanation: urgencyReasons.join('. ') || 'Urgency level assessed',
    coachabilityScore,
    coachabilityExplanation: coachabilityReasons.join('. ') || 'Openness to change assessed',
    overallFit
  };
}

function parseIncome(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[£,\s]/g, '').replace(/k$/i, '000');
  return parseInt(cleaned) || 0;
}

// ============================================================================
// NARRATIVE FIT PROFILE GENERATION (LLM-powered)
// ============================================================================

interface NarrativeFitProfile {
  northStar: string;
  tagline: string;
  openingReflection: string;
  archetype: string;
  archetypeExplanation: string;
  journeyRecommendation: string;
  journeyReasoning: string;
}

async function generateNarrativeProfile(part1: Record<string, any>, signals: FitSignals): Promise<NarrativeFitProfile> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!openRouterKey) {
    console.warn('OPENROUTER_API_KEY not found, using template-based generation');
    return generateTemplateNarrativeProfile(part1, signals);
  }

  // Extract all the context we need
  const userName = part1.full_name || 'there';
  const companyName = part1.company_name || part1.business_name || 'your business';
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  const relationshipMirror = part1.relationship_mirror || '';
  const familyFeedback = part1.family_feedback || '';
  const dangerZone = part1.danger_zone || '';
  const secretPride = part1.secret_pride || '';
  const helpFears = part1.help_fears || '';
  const moneyWorry = part1.money_worry || '';
  const magicAwayTask = part1.magic_away_task || '';
  const tenYearVision = part1.ten_year_vision || '';
  const winningBy2030 = part1.winning_by_2030 || part1.winning_2030 || '';
  const sixMonthShifts = part1.six_month_shifts || '';
  const currentIncome = part1.current_income || '';
  const desiredIncome = part1.desired_income || '';
  const currentHours = part1.current_working_hours || part1.working_hours || '';
  const targetHours = part1.target_working_hours || part1.desired_hours || '';
  const teamSize = part1.team_size || part1.team || '';

  const prompt = `You are crafting the opening of someone's transformation story. This is not a report—it's a mirror that makes them feel truly SEEN.

THE PERSON:
Name: ${userName}
Company: ${companyName}
Their words about their ideal Tuesday: "${tuesdayTest}"
Their relationship with their business: "${relationshipMirror}"
What family says: "${familyFeedback}"
What keeps them up at night: "${moneyWorry}"
What they'd magic away: "${magicAwayTask}"
What they're secretly proud of: "${secretPride}"
Their fears about getting help: "${helpFears}"
Their danger zone: "${dangerZone}"
Their 10-year vision: "${tenYearVision}"
What winning looks like: "${winningBy2030}"
What needs to shift in 6 months: "${sixMonthShifts}"

THEIR NUMBERS:
Current income: ${currentIncome}
Desired income: ${desiredIncome}
Current hours: ${currentHours}/week
Desired hours: ${targetHours}/week
Team: ${teamSize}

FIT SCORES (for context):
- Readiness: ${signals.readinessScore}/100 - ${signals.readinessExplanation}
- Commitment: ${signals.commitmentScore}/100 - ${signals.commitmentExplanation}
- Clarity: ${signals.clarityScore}/100 - ${signals.clarityExplanation}
- Urgency: ${signals.urgencyScore}/100 - ${signals.urgencyExplanation}
- Coachability: ${signals.coachabilityScore}/100 - ${signals.coachabilityExplanation}
- Overall Fit: ${signals.overallFit}

---

CREATE:

1. A NORTH STAR (one sentence, max 30 words)
   - Must use THEIR exact words from tuesdayTest, winningBy2030, or tenYearVision
   - Must capture LIFE goal, not just business goal
   - If they mentioned family, partner, kids, travel—include it
   - Must be memorable enough to tattoo
   
   BAD: "Build a successful service business"
   GOOD: "Working 1-2 days a week, earning £10k/month, with the freedom to start a family and travel with Zaneta—without being the backstop that gets called whenever plans are made."

2. A TAGLINE (max 10 words)
   - Their business identity + their life aspiration
   
   BAD: "Professional services"
   GOOD: "Britain's Rowing Specialist—With Freedom to Live"

3. AN OPENING REFLECTION (exactly 3 paragraphs, ~200 words total)
   
   PARAGRAPH 1: Mirror their pain. Use their EXACT words.
   Start with: "You said..." or a direct quote. Show you heard them.
   Example: "You said you can go from wanting to burn it all down to feeling like the happiest man alive within hours. That emotional rollercoaster isn't sustainable—especially not if you want what you said you want."
   
   PARAGRAPH 2: Name the pattern they're caught in.
   What's really going on beneath the surface? What are they actually building toward?
   Example: "What you're describing isn't just burnout. It's the weight of being irreplaceable. Every call, every emergency, every 'just this once'—they add up to a prison you built with your own success."
   
   PARAGRAPH 3: Show them their strength they don't fully see.
   Reference their secret pride. End with hope.
   Example: "But here's what I see: someone who's built something real. Your customers trust you. Your reputation precedes you. That's not nothing—that's a foundation. The question isn't whether you can change this. It's whether you're ready to."

4. ARCHETYPE (choose one)
   - freedom_seeker: Wants time/autonomy back (mentions family, travel, lifestyle)
   - empire_builder: Wants to scale and dominate market
   - lifestyle_designer: Wants business to fund specific life (country house, etc.)
   - impact_maker: Wants to change their industry
   - balanced_achiever: Wants sustainable success without sacrifice
   
   With 1-2 sentence explanation of WHY this archetype based on their specific answers.

5. JOURNEY RECOMMENDATION
   - "365_method" | "needs_discussion" | "not_ready"
   - With honest reasoning (2-3 sentences)

OUTPUT AS JSON:
{
  "northStar": "string - their exact words woven into a powerful statement",
  "tagline": "string - max 10 words",
  "openingReflection": "string - exactly 3 paragraphs that make them feel seen",
  "archetype": "freedom_seeker|empire_builder|lifestyle_designer|impact_maker|balanced_achiever",
  "archetypeExplanation": "string - why this fits them specifically",
  "journeyRecommendation": "365_method|needs_discussion|not_ready",
  "journeyReasoning": "string - honest explanation"
}

CRITICAL RULES:
1. Use THEIR words, not business clichés
2. If they said "burn it down"—write "burn it down"
3. If they mentioned a partner's name, use it
4. If they mentioned specific numbers (£10k, 2 days/week), use them
5. The opening reflection should make them feel slightly emotional
6. This should read like a letter from someone who truly gets them
`;

  console.log('Generating narrative fit profile with LLM...');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor 365 Fit Profile'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 2500,
        temperature: 0.7,
        messages: [
          { 
            role: 'system', 
            content: `You craft transformational narratives that make business owners feel truly understood. 
You use their exact words—not business jargon. You mirror their emotions. You see what they don't see about themselves.
McKinsey rigour. Tolkien wonder. Human truth.

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, showcases, fostering, tapestry, landscape, synergy, leverage, scalable, holistic, impactful, ecosystem, vibrant, intricate, enduring
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists, "-ing" phrase endings
THE TEST: If it sounds corporate, rewrite it. Sound like poetry, not prose.
Return only valid JSON.`
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter error (status ${response.status}):`, errorText);
      return generateTemplateNarrativeProfile(part1, signals);
    }

    const data = await response.json();
    console.log('LLM response received');
    
    const content = data.choices[0].message.content;
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      console.error('Failed to find JSON in response');
      return generateTemplateNarrativeProfile(part1, signals);
    }
    
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    console.log('Narrative profile parsed successfully');
    return parsed;
    
  } catch (e) {
    console.error('LLM error:', e);
    return generateTemplateNarrativeProfile(part1, signals);
  }
}

async function extractLifeDesignProfile(part1: Record<string, any>): Promise<LifeDesignProfile | null> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    console.warn('OPENROUTER_API_KEY not found, skipping Life Design Profile extraction');
    return null;
  }

  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  const relationshipMirror = part1.relationship_mirror || '';
  const sacrifices = Array.isArray(part1.sacrifices) ? part1.sacrifices : (part1.sacrifices ? [part1.sacrifices] : []);
  const familyFeedback = part1.family_feedback || '';
  const moneyWorry = part1.money_worry || '';
  const dangerZone = part1.danger_zone || '';
  const emergencyLog = part1.emergency_log || '';
  const mondayFrustration = part1.monday_frustration || '';
  const magicAwayTask = part1.magic_away_task || '';
  const secretPride = part1.secret_pride || '';
  const currentIncome = part1.current_income || part1.current_monthly_income || '';
  const desiredIncome = part1.desired_income || part1.desired_monthly_income || '';
  const commitmentHours = part1.commitment_hours || '';
  const workingHours = part1.working_hours || part1.current_working_hours || '';
  const idealHours = part1.ideal_working_hours || part1.target_working_hours || part1.desired_hours || '';
  const twoWeekBreak = part1.two_week_break_impact || '';

  const prompt = `You are extracting concrete, measurable life commitments from a client's personal assessment responses. These are NOT aspirational goals — they are specific actions that will be scheduled into their weekly sprint plan.

THE CLIENT'S ANSWERS:

Tuesday Test (their ideal day): "${tuesdayTest}"
Relationship Mirror (how they describe their business): "${relationshipMirror}"
Sacrifices (what they've given up): ${JSON.stringify(sacrifices)}
Family Feedback (what their family says): "${familyFeedback}"
Money Worry: "${moneyWorry}"
Danger Zone (what might pull them back): "${dangerZone}"
Emergency Log (what interrupts their life): "${emergencyLog}"
Monday Frustration: "${mondayFrustration}"
Magic Away Task: "${magicAwayTask}"
Secret Pride: "${secretPride}"
Current Income: "${currentIncome}"
Desired Income: "${desiredIncome}"
Commitment Hours: "${commitmentHours}"
Current Working Hours: "${workingHours || 'not given'}"
Ideal Working Hours: "${idealHours || 'not given'}"
Two Week Break Impact: "${twoWeekBreak}"

EXTRACTION RULES:

1. From Tuesday Test: If they describe specific times, activities, or routines — extract as time commitments. "I wake at 7, gym, start work at 9:30" → commitment: "Start work no earlier than 9:30am", category: time, frequency: daily.

2. From Sacrifices: Whatever they've given up → restoration commitment. "Haven't had a holiday in 3 years" → "Book a week off within the first quarter", category: experience, frequency: quarterly, startWeek: 1.

3. From Family Feedback: Whatever their family says they're missing → commitment. "Partner says I'm never present at dinner" → "Phone-off dinner 5 nights a week", category: relationship, frequency: daily.

4. From Relationship Mirror: The opposite of how they describe the business → commitment. "Business is like a demanding child" → "One full day per week with zero business contact", category: time, frequency: weekly.

5. From Danger Zone: Whatever might pull them back → guardrail. "I'll say yes to every client" → "Run every new opportunity through the capacity filter before responding", category: identity, frequency: as-needed.

6. From Emergency Log / Monday Frustration / Magic Away Task: What steals their time → protection commitment.

Extract 3-6 commitments. Be SPECIFIC, not aspirational. "Spend more time with family" is too vague. "Leave the office by 5pm on Wednesdays and Fridays" is a commitment.

Also extract:
- protectedDays: specific days mentioned or implied (e.g., "Tuesdays" from the Tuesday Test)
- protectedTimeBlocks: specific time boundaries (e.g., "no work before 9am", "finish by 5pm")
- keyRelationship: partner/spouse name if mentioned, null if not
- relationshipGoal: one sentence on what needs to change in their key relationship
- energyDrains: top 3 things that drain their energy (from emergency_log, monday_frustration)
- energyGoal: what "good energy" looks like for them (from tuesday_test, secret_pride)
- identityShift: who they need to become — one sentence (from archetype + their answers)
- financialFreedomDefinition: what "enough money" means to them (from money_worry + desired_income)

Parse currentMonthlyIncome and targetMonthlyIncome as numbers (strip £, k = *1000). Use 0 if not parseable.
Parse currentWeeklyHours and targetWeeklyHours from working hours / ideal hours (numbers only). Use 40 and 35 if not clear.
hourReductionTarget = currentWeeklyHours - targetWeeklyHours.
incomeGap = targetMonthlyIncome - currentMonthlyIncome.
tuesdayVision = first 200 chars of Tuesday Test. relationshipImpact = relationship mirror. familyFeedback = as given. sacrifices = array as given. dangerZone = as given.

Return ONLY valid JSON matching this structure (no markdown, no explanation):
{
  "currentWeeklyHours": number,
  "targetWeeklyHours": number,
  "hourReductionTarget": number,
  "protectedDays": string[],
  "protectedTimeBlocks": string[],
  "currentMonthlyIncome": number,
  "targetMonthlyIncome": number,
  "incomeGap": number,
  "financialFreedomDefinition": string,
  "keyRelationship": string | null,
  "relationshipImpact": string,
  "familyFeedback": string,
  "relationshipGoal": string,
  "sacrifices": string[],
  "dangerZone": string,
  "energyDrains": string[],
  "energyGoal": string,
  "tuesdayVision": string,
  "secretPride": string,
  "archetype": string,
  "identityShift": string,
  "lifeCommitments": [{"id": string, "commitment": string, "category": "time"|"relationship"|"health"|"experience"|"identity", "frequency": "daily"|"weekly"|"monthly"|"quarterly"|"one-off", "source": string, "measurable": string, "startWeek": number}]
}
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Life Design Profile'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 2000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'You extract structured life design data from assessment text. Return only valid JSON. No markdown, no code fences.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      console.warn('Life Design Profile LLM error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    const parsed = JSON.parse(cleaned.substring(start, end + 1)) as LifeDesignProfile;
    if (!parsed.lifeCommitments || !Array.isArray(parsed.lifeCommitments)) parsed.lifeCommitments = [];
    if (!parsed.protectedDays) parsed.protectedDays = [];
    if (!parsed.protectedTimeBlocks) parsed.protectedTimeBlocks = [];
    if (!parsed.energyDrains) parsed.energyDrains = [];
    return parsed;
  } catch (e) {
    console.warn('Life Design Profile extraction failed:', e);
    return null;
  }
}

function generateTemplateNarrativeProfile(part1: Record<string, any>, signals: FitSignals): NarrativeFitProfile {
  const userName = part1.full_name?.split(' ')[0] || 'there';
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  const secretPride = part1.secret_pride || '';
  const relationshipMirror = part1.relationship_mirror || '';
  const desiredIncome = part1.desired_income || '';
  const desiredHours = part1.target_working_hours || part1.desired_hours || '';

  // Build North Star from their answers
  let northStar = '';
  if (tuesdayTest) {
    const shortened = tuesdayTest.length > 100 ? tuesdayTest.substring(0, 100) + '...' : tuesdayTest;
    northStar = shortened;
  } else if (desiredIncome && desiredHours) {
    northStar = `Earning ${desiredIncome} while working ${desiredHours} hours per week, with the freedom to live on your own terms.`;
  } else {
    northStar = 'Building a business that works for you, not the other way around.';
  }

  // Build opening reflection
  let openingReflection = '';
  
  if (relationshipMirror) {
    openingReflection += `You described your relationship with your business as "${relationshipMirror.substring(0, 150)}${relationshipMirror.length > 150 ? '...' : ''}" That's honest. And it tells me you're ready to look at this clearly.\n\n`;
  } else {
    openingReflection += `Taking the time to reflect on these questions shows you're serious about change. That matters.\n\n`;
  }
  
  openingReflection += `What you're experiencing—the push and pull, the desire for freedom while carrying the weight of responsibility—that's not a weakness. It's a signal. The business you've built has outgrown its current structure.\n\n`;
  
  if (secretPride) {
    openingReflection += `And here's what I see that you might not: "${secretPride.substring(0, 100)}${secretPride.length > 100 ? '...' : ''}" That's real. That's a foundation we can build on.`;
  } else {
    openingReflection += `The fact that you're here, doing this work, tells me something important: you haven't given up. You're looking for a path forward. Let's find it together.`;
  }

  // Determine archetype
  let archetype = 'balanced_achiever';
  let archetypeExplanation = 'You want sustainable success without sacrificing what matters.';
  
  const combined = (tuesdayTest + ' ' + (part1.ten_year_vision || '') + ' ' + (part1.winning_by_2030 || '')).toLowerCase();
  
  if (combined.includes('family') || combined.includes('kids') || combined.includes('travel') || combined.includes('freedom')) {
    archetype = 'freedom_seeker';
    archetypeExplanation = 'Your answers point to one thing: freedom. Time with family, travel, life on your terms. The business is meant to serve that vision.';
  } else if (combined.includes('scale') || combined.includes('dominate') || combined.includes('market leader')) {
    archetype = 'empire_builder';
    archetypeExplanation = 'You\'re not just building a business—you\'re building something that matters. Scale and impact drive you.';
  } else if (combined.includes('country') || combined.includes('house') || combined.includes('retire')) {
    archetype = 'lifestyle_designer';
    archetypeExplanation = 'You have a specific vision of what life should look like. The business is the vehicle to get there.';
  }

  return {
    northStar,
    tagline: `${userName}'s Journey to Freedom`,
    openingReflection,
    archetype,
    archetypeExplanation,
    journeyRecommendation: signals.overallFit === 'not_ready' ? 'not_ready' : signals.overallFit === 'needs_discussion' ? 'needs_discussion' : '365_method',
    journeyReasoning: signals.overallFit === 'excellent' 
      ? 'Your scores show you\'re ready for this. Let\'s build your roadmap.'
      : signals.overallFit === 'good'
      ? 'Good foundation. Part 2 will help us get specific about where to focus.'
      : signals.overallFit === 'needs_discussion'
      ? 'Before diving in, a quick conversation would help align expectations.'
      : 'The timing might not be right. Let\'s talk about what needs to happen first.'
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { clientId, practiceId } = await req.json();

    if (!clientId || !practiceId) {
      return new Response(JSON.stringify({ error: 'Missing clientId or practiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Generating fit profile for client ${clientId}...`);

    // Check for existing stage record to determine version
    const { data: existingStages, error: queryError } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'fit_assessment')
      .order('version', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Error querying existing stages:', queryError);
    }

    const maxVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version 
      : 0;

    let nextVersion = maxVersion + 1;
    let stage = null;
    let stageError = null;
    let attempts = 0;
    const maxAttempts = 5;

    // Retry logic to handle race conditions
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}: Creating fit_assessment stage with version ${nextVersion}`);

      const { data, error } = await supabase
        .from('roadmap_stages')
        .insert({
          practice_id: practiceId,
          client_id: clientId,
          stage_type: 'fit_assessment',
          version: nextVersion,
          status: 'generating',
          generation_started_at: new Date().toISOString(),
          model_used: 'anthropic/claude-sonnet-4.5'
        })
        .select()
        .single();

      if (!error) {
        stage = data;
        stageError = null;
        break;
      }

      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        console.log(`Version ${nextVersion} exists, trying ${nextVersion + 1}`);
        nextVersion++;
        continue;
      }

      stageError = error;
      break;
    }

    if (stageError || !stage) {
      throw stageError || new Error(`Failed to create stage after ${attempts} attempts`);
    }

    // Fetch Part 1 responses
    const { data: assessment, error: fetchError } = await supabase
      .from('client_assessments')
      .select('responses')
      .eq('client_id', clientId)
      .eq('assessment_type', 'part1')
      .single();

    if (fetchError || !assessment) {
      throw new Error('Part 1 not found');
    }

    const part1 = assessment.responses;

    // Also fetch client info for company name
    const { data: clientInfo } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    if (clientInfo) {
      part1.full_name = part1.full_name || clientInfo.name;
      part1.company_name = part1.company_name || clientInfo.client_company;
    }

    // Analyze fit signals (rule-based)
    const signals = analyzeFitSignals(part1);
    console.log(`Fit signals: ${signals.overallFit} (avg: ${Math.round((signals.readinessScore + signals.commitmentScore + signals.clarityScore + signals.urgencyScore + signals.coachabilityScore) / 5)})`);

    // Generate narrative profile (LLM-powered)
    const narrativeProfile = await generateNarrativeProfile(part1, signals);
    console.log('Narrative profile generated');

    // Extract Life Design Profile (for downstream pipeline)
    const lifeDesignProfile = await extractLifeDesignProfile(part1);
    const duration = Date.now() - startTime;
    if (lifeDesignProfile) {
      console.log(`Life Design Profile extracted: ${lifeDesignProfile.lifeCommitments?.length ?? 0} commitments`);
      const { data: existingLifeStage } = await supabase
        .from('roadmap_stages')
        .select('id')
        .eq('client_id', clientId)
        .eq('stage_type', 'life_design_profile')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLifeStage) {
        await supabase
          .from('roadmap_stages')
          .update({
            status: 'generated',
            generated_content: lifeDesignProfile,
            generation_completed_at: new Date().toISOString(),
            generation_duration_ms: duration
          })
          .eq('id', existingLifeStage.id);
      } else {
        await supabase.from('roadmap_stages').insert({
          practice_id: practiceId,
          client_id: clientId,
          stage_type: 'life_design_profile',
          version: 1,
          status: 'generated',
          generated_content: lifeDesignProfile,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: duration,
          model_used: 'anthropic/claude-sonnet-4.5'
        });
      }
    }

    // Build complete fit profile
    const fitProfile = {
      // Core narrative elements
      northStar: narrativeProfile.northStar,
      tagline: narrativeProfile.tagline,
      openingReflection: narrativeProfile.openingReflection,
      
      // Archetype
      archetype: narrativeProfile.archetype,
      archetypeExplanation: narrativeProfile.archetypeExplanation,
      
      // Fit signals with explanations
      fitSignals: {
        readinessScore: signals.readinessScore,
        readinessExplanation: signals.readinessExplanation,
        commitmentScore: signals.commitmentScore,
        commitmentExplanation: signals.commitmentExplanation,
        clarityScore: signals.clarityScore,
        clarityExplanation: signals.clarityExplanation,
        urgencyScore: signals.urgencyScore,
        urgencyExplanation: signals.urgencyExplanation,
        coachabilityScore: signals.coachabilityScore,
        coachabilityExplanation: signals.coachabilityExplanation,
        overallFit: signals.overallFit
      },
      
      // Journey recommendation
      journeyRecommendation: narrativeProfile.journeyRecommendation,
      journeyReasoning: narrativeProfile.journeyReasoning,
      
      // Metadata
      generatedAt: new Date().toISOString(),
      unlocksPartTwo: signals.overallFit !== 'not_ready',
      lifeDesignProfile: lifeDesignProfile || undefined
    };

    // Update stage record
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: fitProfile,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    // Also store with Part 1 assessment (backward compatibility)
    await supabase
      .from('client_assessments')
      .update({ 
        fit_profile: fitProfile,
        status: 'completed'
      })
      .eq('client_id', clientId)
      .eq('assessment_type', 'part1');

    console.log(`Fit profile complete! North Star: "${fitProfile.northStar.substring(0, 50)}..."`);

    return new Response(JSON.stringify({
      success: true,
      stageId: stage.id,
      fitProfile,
      unlocksPartTwo: fitProfile.unlocksPartTwo,
      duration,
      summary: {
        northStar: fitProfile.northStar,
        tagline: fitProfile.tagline,
        archetype: fitProfile.archetype,
        overallFit: signals.overallFit,
        scores: {
          readiness: signals.readinessScore,
          commitment: signals.commitmentScore,
          clarity: signals.clarityScore,
          urgency: signals.urgencyScore,
          coachability: signals.coachabilityScore
        }
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
