// ============================================================================
// EDGE FUNCTION: Complete 365 Transformation Analysis
// ============================================================================
// This is the comprehensive Oracle Method implementation.
// 
// The 365 Method:
// - 365 days to transform (not just grow)
// - 5-Year Life Compass (not just business goals)
// - 6-Month Structural Shifts (HOW they work, not tasks)
// - 3-Month Implementation Sprints (specific, measurable progress)
// - 12-Week detailed task breakdown with accountability
// - Value Analysis (hidden value markers)
//
// This is about life transformation through business transformation.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface EmotionalAnchors {
  painPhrases: string[];
  desirePhrases: string[];
  metaphors: string[];
  timePatterns: string[];
  transformationSignals: string[];
  repeatedThemes: string[];
}

interface AssessmentContext {
  // Identity
  userName: string;
  companyName: string;
  industry: string;
  
  // Part 1 - Life Design
  tuesdayTest: string;
  emergencyLog: string;
  relationshipMirror: string;
  moneyWorry: string;
  sacrifices: string[];
  commitmentHours: string;
  currentIncome: string;
  desiredIncome: string;
  hasPartners: string;
  dangerZone: string;
  mondayFrustration: string;
  familyFeedback: string;
  twoWeekBreakImpact: string;
  magicAwayTask: string;
  secretPride: string;
  lastExcitement: string;
  helpFears: string;
  
  // Part 2 - Business Deep Dive
  tradingName: string;
  yearsTrading: string;
  tenYearVision: string;
  annualTurnover: string;
  winningBy2030: string;
  sixMonthShifts: string;
  teamSize: string;
  growthBottleneck: string;
  ninetyDayPriorities: string[];
  currentWorkingHours: number;
  targetWorkingHours: number;
  toolsUsed: string[];
  
  // Part 3 - Hidden Value
  knowledgeDependency: number;
  personalBrand: number;
  competitiveMoat: string[];
  undocumentedProcesses: string[];
  customerConcentration: number;
  exitReadiness: string[];
  
  // Computed
  isPreRevenue: boolean;
  revenueNumeric: number;
  emotionalAnchors: EmotionalAnchors;
}

// ============================================================================
// EMOTIONAL ANCHOR EXTRACTION
// ============================================================================
// This is the heart of personalization. We extract their exact words to use
// throughout the roadmap, making it feel deeply personal.

function extractEmotionalAnchors(
  part1: Record<string, any>,
  part2: Record<string, any>,
  part3: Record<string, any>
): EmotionalAnchors {
  const anchors: EmotionalAnchors = {
    painPhrases: [],
    desirePhrases: [],
    metaphors: [],
    timePatterns: [],
    transformationSignals: [],
    repeatedThemes: []
  };

  // Combine all responses for analysis
  const allResponses = { ...part1, ...part2, ...part3 };

  // Extract from Tuesday Test / 90-Day Fantasy
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesdayTest) {
    // Time patterns - when they describe their ideal day
    const timeMatches = tuesdayTest.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\b\d+-\d+\b|\bearly\b|\blate\b|\bmorning\b|\bevening\b/gi);
    if (timeMatches) {
      anchors.timePatterns = [...new Set(timeMatches.map((t: string) => t.toLowerCase()))];
    }

    // Pain phrases - what they want to stop
    const painWords = ['not', "don't", 'stop', 'no more', 'without', 'never', 'tired of', 'sick of', 'hate'];
    painWords.forEach(word => {
      if (tuesdayTest.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, 'gi');
        const matches = tuesdayTest.match(regex);
        if (matches) {
          anchors.painPhrases.push(...matches.map((m: string) => m.trim()));
        }
      }
    });

    // Desire phrases - what they want
    const desireWords = ['want', 'wish', 'dream', 'love to', 'finally', 'freedom', 'choose', 'able to', 'can'];
    desireWords.forEach(word => {
      if (tuesdayTest.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, 'gi');
        const matches = tuesdayTest.match(regex);
        if (matches) {
          anchors.desirePhrases.push(...matches.map((m: string) => m.trim()));
        }
      }
    });
  }

  // Extract metaphors from Relationship Mirror
  const relationshipMirror = part1.relationship_mirror || part1.business_relationship || '';
  if (relationshipMirror) {
    if (relationshipMirror.toLowerCase().includes('feels like')) {
      const metaphorPart = relationshipMirror.toLowerCase().split('feels like').pop() || '';
      const metaphor = metaphorPart.replace(/[.!?].*/, '').trim();
      if (metaphor && metaphor.length > 3) {
        anchors.metaphors.push(metaphor);
      }
    }
    // Also look for "like a" metaphors
    const likeAMatch = relationshipMirror.match(/like a ([^.!?,]+)/i);
    if (likeAMatch) {
      anchors.metaphors.push(likeAMatch[1].trim());
    }
  }

  // Extract from emotion-rich fields
  const emotionFields = [
    'emergency_log', 'money_worry', 'monday_frustration',
    'family_feedback', 'two_week_break_impact', 'magic_away_task',
    'business_secret', 'secret_pride', 'last_excitement',
    'danger_zone', 'help_fears', 'biggest_challenge', 'growth_bottleneck'
  ];

  emotionFields.forEach(field => {
    const content = allResponses[field];
    if (content && typeof content === 'string' && content.length > 15) {
      // Extract pain-indicating words
      const painMatches = content.match(/\b(stress|overwhelm|chaos|struggle|worry|fear|exhaust|frustrat|anxious|trapped|drown|spinning|emergency|constant|always|never|can't)\w*\b/gi);
      if (painMatches) {
        anchors.painPhrases.push(...painMatches);
      }

      // Extract aspiration words
      const aspirationMatches = content.match(/\b(freedom|peace|calm|control|balance|growth|success|achieve|finally|time|family|enjoy|love|happy)\w*\b/gi);
      if (aspirationMatches) {
        anchors.desirePhrases.push(...aspirationMatches);
      }

      // Look for transformation signals
      const transformMatches = content.match(/\b(change|transform|different|better|improve|grow|build|create|start|stop|more|less)\w*\b/gi);
      if (transformMatches) {
        anchors.transformationSignals.push(...transformMatches);
      }
    }
  });

  // Find repeated themes across responses
  const allText = Object.values(allResponses)
    .filter(v => typeof v === 'string')
    .join(' ')
    .toLowerCase();
  
  const themeWords = ['time', 'money', 'family', 'freedom', 'stress', 'work', 'team', 'growth', 'control', 'help'];
  themeWords.forEach(word => {
    const count = (allText.match(new RegExp(`\\b${word}\\w*\\b`, 'g')) || []).length;
    if (count >= 3) {
      anchors.repeatedThemes.push(word);
    }
  });

  // Clean and deduplicate
  Object.keys(anchors).forEach(key => {
    const arr = anchors[key as keyof EmotionalAnchors];
    if (Array.isArray(arr)) {
      (anchors as any)[key] = [...new Set(arr.filter(Boolean).map((s: string) => 
        typeof s === 'string' ? s.trim() : s
      ))].slice(0, 10); // Keep top 10 for each
    }
  });

  return anchors;
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildContext(
  part1: Record<string, any>,
  part2: Record<string, any>,
  part3: Record<string, any>
): AssessmentContext {
  const anchors = extractEmotionalAnchors(part1, part2, part3);
  
  // Parse revenue
  const turnoverStr = part2.annual_turnover || '';
  let revenueNumeric = 0;
  if (turnoverStr.includes('Under £100k')) revenueNumeric = 50000;
  else if (turnoverStr.includes('£100k-£250k')) revenueNumeric = 175000;
  else if (turnoverStr.includes('£250k-£500k')) revenueNumeric = 375000;
  else if (turnoverStr.includes('£500k-£1m')) revenueNumeric = 750000;
  else if (turnoverStr.includes('£1m-£2.5m')) revenueNumeric = 1750000;
  else if (turnoverStr.includes('£2.5m')) revenueNumeric = 3500000;

  // Detect industry from responses
  const allText = JSON.stringify({ ...part1, ...part2, ...part3 }).toLowerCase();
  let industry = 'general_business';
  if (allText.includes('rowing') || allText.includes('fitness') || allText.includes('gym')) industry = 'fitness_equipment';
  else if (allText.includes('consult') || allText.includes('advisor')) industry = 'consulting';
  else if (allText.includes('software') || allText.includes('saas') || allText.includes('tech')) industry = 'technology';
  else if (allText.includes('agency') || allText.includes('marketing')) industry = 'agency';
  else if (allText.includes('trade') || allText.includes('construction')) industry = 'trades';

  return {
    userName: part1.full_name || 'Founder',
    companyName: part1.company_name || part2.trading_name || 'Your Business',
    industry,
    
    // Part 1
    tuesdayTest: part1.tuesday_test || part1.ninety_day_fantasy || '',
    emergencyLog: part1.emergency_log || '',
    relationshipMirror: part1.relationship_mirror || '',
    moneyWorry: part1.money_worry || '',
    sacrifices: part1.sacrifices || [],
    commitmentHours: part1.commitment_hours || '10-15 hours',
    currentIncome: part1.current_income || '',
    desiredIncome: part1.desired_income || '',
    hasPartners: part1.has_partners || 'No',
    dangerZone: part1.danger_zone || '',
    mondayFrustration: part1.monday_frustration || '',
    familyFeedback: part1.family_feedback || '',
    twoWeekBreakImpact: part1.two_week_break_impact || '',
    magicAwayTask: part1.magic_away_task || '',
    secretPride: part1.secret_pride || '',
    lastExcitement: part1.last_excitement || '',
    helpFears: part1.help_fears || '',
    
    // Part 2
    tradingName: part2.trading_name || '',
    yearsTrading: part2.years_trading || '',
    tenYearVision: part2.ten_year_vision || '',
    annualTurnover: part2.annual_turnover || '',
    winningBy2030: part2.winning_2030 || '',
    sixMonthShifts: part2.six_month_shifts || '',
    teamSize: part2.team_size || 'solo',
    growthBottleneck: part2.growth_bottleneck || '',
    ninetyDayPriorities: part2.ninety_day_priorities || [],
    currentWorkingHours: parseInt(part2.current_working_hours) || 50,
    targetWorkingHours: parseInt(part2.target_working_hours) || 35,
    toolsUsed: part2.current_tools || [],
    
    // Part 3
    knowledgeDependency: parseInt(part3.knowledge_dependency_percentage) || 0,
    personalBrand: parseInt(part3.personal_brand_percentage) || 0,
    competitiveMoat: part3.competitive_moat || [],
    undocumentedProcesses: part3.critical_processes_undocumented || [],
    customerConcentration: parseInt(part3.top3_customer_revenue_percentage) || 0,
    exitReadiness: part3.documentation_24hr_ready || [],
    
    // Computed
    isPreRevenue: revenueNumeric === 0,
    revenueNumeric,
    emotionalAnchors: anchors
  };
}

// ============================================================================
// THE 365 METHOD - 5-YEAR VISION PROMPT
// ============================================================================
// This generates a deeply personal narrative that uses their exact words.
// The output should make them think "How did you know that about me?"

const FIVE_YEAR_VISION_PROMPT = `You are an emotionally intelligent advisor who creates deeply personal transformation narratives. You excel at recognising that true success isn't just financial growth - it's about creating a business that enhances life rather than consuming it. You understand that working fewer hours with slightly less income often creates far more happiness than grinding endless hours for marginally more money.

FOUNDER'S COMPLETE JOURNEY (their exact words):

=== PART 1: LIFE DESIGN ===
Name: {userName}
Company: {companyName}
Tuesday Test/90-Day Fantasy: "{tuesdayTest}"
Business Relationship (metaphor): "{relationshipMirror}"
Money Worry: "{moneyWorry}"
What They've Sacrificed: {sacrifices}
Emergency Log: "{emergencyLog}"
Danger Zone: "{dangerZone}"
Monday Frustration: "{mondayFrustration}"
Family Feedback: "{familyFeedback}"
Two Week Break Impact: "{twoWeekBreakImpact}"
What They'd Magic Away: "{magicAwayTask}"
Secret Pride: "{secretPride}"
Last Excitement: "{lastExcitement}"
Help Fears: "{helpFears}"

=== PART 2: BUSINESS REALITY ===
Industry: {industry}
Years Trading: {yearsTrading}
Annual Turnover: {annualTurnover}
Current Personal Income: {currentIncome}
Desired Personal Income: {desiredIncome}
Current Working Hours: {currentWorkingHours} hours/week
Target Working Hours: {targetWorkingHours} hours/week
Team Size: {teamSize}
10-Year Vision: "{tenYearVision}"
Winning by 2030: "{winningBy2030}"
Biggest Challenge: "{growthBottleneck}"
Time Commitment Available: {commitmentHours}
90-Day Priorities: {ninetyDayPriorities}

=== PART 3: HIDDEN VALUE ===
Knowledge Dependency: {knowledgeDependency}%
Personal Brand Dependency: {personalBrand}%
Customer Concentration (top 3): {customerConcentration}%
Undocumented Processes: {undocumentedProcesses}
Competitive Moat: {competitiveMoat}

=== EMOTIONAL PATTERNS DETECTED ===
Pain phrases (their exact words): {painPhrases}
Desire phrases (their exact words): {desirePhrases}
Metaphors they use: {metaphors}
Time patterns mentioned: {timePatterns}
Repeated themes: {repeatedThemes}

THE CORE INSIGHT TO REMEMBER:
This founder isn't just seeking more money or growth. They're seeking a specific quality of life. Look at the gap between their current ({currentWorkingHours} hours) and target ({targetWorkingHours} hours) working hours as much as the revenue gap. Notice what they say when asked about a two-week break - that reveals their true relationship with their business. Their family feedback tells you the real cost of their current approach.

CRITICAL INSTRUCTIONS:
1. Write in SECOND PERSON - speak directly to them ("You" not "They")
2. Identify the LIFE they want, not just the business they want
3. Notice if they're sacrificing happiness for marginal gains
4. Use their EXACT emotional phrases naturally throughout - weave their actual quotes into the narrative
5. Mirror their communication style and energy
6. Show them a path where success means LESS stress, not more
7. Make them feel truly understood - "How did you know that about me?"
8. Focus on sustainable growth that enhances life, not endless scaling
9. Reference specific details from their responses (family, hobbies, goals)

Create a comprehensive 5-year vision that shows them how to build a business that serves their life, not the other way around.

Return as JSON with this EXACT structure:

{
  "tagline": "A short aspirational tagline for their transformation, e.g., 'Britain's Leading Rowing Machine Specialist - On Your Terms'",
  
  "transformationStory": {
    "currentReality": {
      "title": "Your Current Reality: [use their exact phrase]",
      "narrative": "3-4 paragraphs (300+ words) describing where they are now. Weave in their EXACT quotes naturally - their Tuesday test description, their relationship metaphor, what they've sacrificed, their family feedback, their emergency log entries. Make them feel DEEPLY understood. This should read like you've been watching their life unfold."
    },
    "turningPoint": {
      "title": "Your Turning Point: [the insight that changes everything]",
      "narrative": "2-3 paragraphs (200+ words) about the breakthrough moment. What needs to change in their thinking? What's the key insight that unlocks everything? Reference their specific fears (help_fears), their danger zone, and their secret pride. This is the 'aha' moment."
    },
    "visionAchieved": {
      "title": "Your Vision Achieved: [use their winning_2030 phrase]",
      "narrative": "3-4 paragraphs (300+ words) painting the picture of success IN THEIR TERMS. What does their ideal Tuesday actually look like (reference their tuesday_test)? How does their family see them now? What can they finally do? Reference their 10-year vision, their desired income, their target working hours. Be specific, emotional, and use their words."
    }
  },
  
  "yearMilestones": {
    "year1": {
      "headline": "From [current state] to [first shift] - use their words",
      "story": "Full paragraph (100+ words) showing what specifically changes. What's different about their mornings? Their weekends? Their stress levels? Their family time? Reference their current pain points being resolved.",
      "measurable": "Specific metrics: Working hours reduced from {currentWorkingHours} to X, income increased to £Y, [specific pain point] reduced by Z%"
    },
    "year3": {
      "headline": "The [Business/Life] That Serves Your [their goal]",
      "story": "Full paragraph (100+ words) showing their transformation midpoint. The business works differently now. What can they do that was impossible before? Reference their 10-year vision progress.",
      "measurable": "Their target working hours achieved, specific income goals met, life milestones progressing"
    },
    "year5": {
      "headline": "[Their exact winning_2030 phrase or equivalent]",
      "story": "Full paragraph (100+ words) showing complete vision achieved. Not generic success - THEIR success. Reference their exact 'winning' description. What's their relationship with the business now? With their family?",
      "measurable": "Their specific vision quantified - income, hours, lifestyle, business value"
    }
  },
  
  "northStar": "One powerful sentence that captures their core desire using their EXACT words. This becomes the filter for every decision they make. Pull directly from their tuesday_test, winning_2030, or ten_year_vision.",
  
  "archetype": "freedom_seeker|empire_builder|lifestyle_designer|impact_maker|balanced_achiever",
  
  "emotionalCore": "2-3 sentences explaining the deep truth about what they're really seeking - usually connection, control, freedom, or peace. Why does THIS matter to THIS person specifically?"
}

Remember: This should be so well-written that they want to print it out and put it on their wall. Every paragraph should make them think "How did you know that about me?" Use their exact words throughout.`;

// ============================================================================
// THE 365 METHOD - 6-MONTH SHIFT PROMPT
// ============================================================================

const SIX_MONTH_SHIFT_PROMPT = `Based on the founder's 5-year vision, create a detailed 6-month shift plan that bridges their current reality to their year 1 goals.

FIVE-YEAR VISION CONTEXT:
{fiveYearVision}

CURRENT REALITY:
- Business: {companyName} ({industry})
- Revenue: {annualTurnover} (Numeric: £{revenueNumeric})
- Pre-revenue: {isPreRevenue}
- Time Available: {commitmentHours}
- Team Size: {teamSize}
- Years Trading: {yearsTrading}
- Current Working Hours: {currentWorkingHours}/week
- Target Working Hours: {targetWorkingHours}/week

THEIR SPECIFIC PAIN POINTS:
- Biggest Challenge: "{growthBottleneck}"
- Money Worry: "{moneyWorry}"
- Danger Zone: "{dangerZone}"
- What They'd Magic Away: "{magicAwayTask}"
- Emergency Log: "{emergencyLog}"
- 90-Day Priorities Selected: {ninetyDayPriorities}

THEIR EMOTIONAL ANCHORS:
Pain phrases: {painPhrases}
Desire phrases: {desirePhrases}

FOUNDER ARCHETYPE: {archetype}
NORTH STAR: {northStar}

Create a 6-month shift plan that:
1. Addresses their immediate pain points using THEIR language
2. Makes tangible progress toward their year 1 vision
3. Respects their time constraints ({commitmentHours})
4. Focuses on highest-impact activities first
5. Builds momentum through quick wins
6. Uses their emotional anchors naturally throughout

Return as JSON:
{
  "shiftOverview": "3-4 sentences summarizing what this 6 months will achieve. Use their exact words and phrases. Connect to their north star.",
  
  "month1_2": {
    "theme": "Short, punchy theme name that resonates with their situation",
    "focus": "Clear description of the primary focus area - connect to their biggest pain",
    "keyActions": [
      "Specific action that addresses [their pain phrase]",
      "Specific action building toward [their desire phrase]",
      "Specific action relevant to {industry}"
    ],
    "successMetrics": [
      "Measurable outcome 1",
      "Measurable outcome 2"
    ],
    "timeCommitment": "X hours/week on specific activities",
    "howYoullFeel": "Describe the emotional shift they'll experience"
  },
  
  "month3_4": {
    "theme": "Theme that builds on months 1-2",
    "focus": "Building momentum and systems",
    "keyActions": [
      "Action 1",
      "Action 2", 
      "Action 3"
    ],
    "successMetrics": [
      "Metric 1",
      "Metric 2"
    ],
    "timeCommitment": "Hours/week on activities",
    "howYoullFeel": "Emotional progress description"
  },
  
  "month5_6": {
    "theme": "Theme approaching year 1 milestone",
    "focus": "Consolidation and scaling what works",
    "keyActions": [
      "Action 1",
      "Action 2",
      "Action 3"
    ],
    "successMetrics": [
      "Metric 1",
      "Metric 2"
    ],
    "timeCommitment": "Hours/week on activities",
    "howYoullFeel": "How they feel approaching year 1"
  },
  
  "quickWins": [
    "Something they can achieve THIS WEEK that addresses {magicAwayTask}",
    "Something achievable in the first month that builds confidence",
    "Early indicator of progress toward their north star"
  ],
  
  "dangerMitigation": "Specific plan for addressing their danger zone: {dangerZone}",
  
  "northStarAlignment": "How each phase moves them toward: {northStar}",
  
  "monthlyCheckIn": {
    "questions": [
      "Progress question 1",
      "Emotional check-in question",
      "Adjustment question"
    ]
  }
}`;

// ============================================================================
// THE 365 METHOD - 12-WEEK SPRINT PROMPT
// ============================================================================

const TWELVE_WEEK_SPRINT_PROMPT = `You are implementing The 365 Method for {companyName} - a {industry} business ready for life-first transformation.

THE 365 METHOD FOUNDATION:
- 365 days to transform (not just grow)
- 5-Year Life Compass (not just business goals)
- 6-Month Structural Shifts (HOW they work, not tasks)
- 3-Month Implementation Sprints (specific, measurable progress)
- This is about changing HOW they work, not just WHAT they do
- Every week must move them closer to their ideal Tuesday feeling
- Progress is measured in life quality improvement, not just revenue

THEIR 6-MONTH SHIFTS:
{sixMonthShift}

THEIR 5-YEAR COMPASS:
North Star: {northStar}
Emotional Core: {emotionalCore}
Year 1 Target: {year1Target}

BUSINESS SPECIFICS:
- Business: {companyName} ({industry})
- Revenue: £{revenueNumeric} (Pre-revenue: {isPreRevenue})
- Team: {teamSize}
- Years Trading: {yearsTrading}
- Current Tools: {toolsUsed}
- Current working hours: {currentWorkingHours} hours/week
- Target working hours: {targetWorkingHours} hours/week

EMOTIONAL DRIVERS (USE THESE EXACT WORDS):
- Their biggest pain: "{growthBottleneck}"
- Their 90-day fantasy: "{tuesdayTest}"
- Money worry: "{moneyWorry}"
- Emergency log: "{emergencyLog}"
- Danger zone: "{dangerZone}"
- What they'd magic away: "{magicAwayTask}"
- Monday frustration: "{mondayFrustration}"

CONSTRAINTS TO HONOR:
- Available time per week: {commitmentHours}
- Must work within current team size initially
- 90-day priorities selected: {ninetyDayPriorities}

CRITICAL: Create a comprehensive 12-week transformation. Each week must be specific to THEIR situation using THEIR words.

Return as JSON:
{
  "sprintTheme": "Overarching theme that connects to their 90-day fantasy",
  
  "sprintPromise": "In 90 days, transform from [their current Tuesday feeling] to [their ideal Tuesday]",
  
  "sprintGoals": [
    "Primary goal addressing their biggest pain",
    "Secondary goal addressing their money worry",
    "Tertiary goal moving toward their north star"
  ],
  
  "phases": {
    "weeks1_2": { "name": "Immediate Relief", "purpose": "Quick wins and pain reduction" },
    "weeks3_4": { "name": "Foundation Building", "purpose": "Address root causes" },
    "weeks5_6": { "name": "Momentum Multiplication", "purpose": "Scale what works" },
    "weeks7_8": { "name": "Lock-In Phase", "purpose": "Make changes permanent" },
    "weeks9_10": { "name": "Scale Phase", "purpose": "Multiply success" },
    "weeks11_12": { "name": "Transform Phase", "purpose": "Become the new version" }
  },
  
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "Specific theme addressing their biggest pain",
      "tuesdayTransformation": "How Tuesday starts to feel different",
      "focus": "The ONE thing to focus on this week",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "Quick win task title",
          "description": "Clear, actionable description",
          "why": "Connect to their pain/desire",
          "category": "Operations|Systems|People|Financial|Marketing",
          "priority": "critical|high|medium",
          "estimatedHours": 1,
          "deliverable": "Specific output"
        },
        {
          "id": "w1_t2",
          "title": "Foundation task",
          "description": "Description",
          "why": "Connection to goals",
          "category": "Category",
          "priority": "Priority",
          "estimatedHours": 2,
          "deliverable": "Output"
        },
        {
          "id": "w1_t3",
          "title": "Reflection task",
          "description": "Weekly review and planning",
          "why": "Build the habit of strategic thinking",
          "category": "Personal",
          "priority": "medium",
          "estimatedHours": 0.5,
          "deliverable": "Week 1 insights captured"
        }
      ],
      "milestone": "What success looks like by end of week 1",
      "celebrationPrompt": "How to recognize this week's wins"
    }
    // Repeat for weeks 2-12, each building on the previous and getting more specific to their industry and situation
  ],
  
  "successMetrics": {
    "week4": "Foundation solid - [their main pain] 50% reduced",
    "week8": "Momentum locked - Working toward {targetWorkingHours} hours",
    "week12": "Transformed - Living the [their 90-day fantasy]"
  },
  
  "tuesdayEvolution": {
    "week0": "[Their current Tuesday feeling from tuesday_test]",
    "week4": "First noticeable shift - [specific improvement]",
    "week8": "New patterns established - [specific change]",
    "week12": "This is just how Tuesdays are now - [their ideal]"
  },
  
  "backslidePreventions": [
    {
      "trigger": "Common trigger that might cause old patterns",
      "response": "Specific action to take instead"
    }
  ],
  
  "supportNeeded": [
    "Type of support 1",
    "Type of support 2"
  ]
}

IMPORTANT: Generate ALL 12 weeks with specific, actionable tasks. Each week should have 3-5 tasks that are realistic given their time constraints ({commitmentHours}). Make every task specific to their industry ({industry}) and situation.`;

// ============================================================================
// VALUE ANALYSIS (Rule-Based - No LLM Cost)
// ============================================================================

function calculateValueAnalysis(part3: Record<string, any>, context: AssessmentContext): any {
  const assetScores: any[] = [];
  
  // 1. Intellectual Capital
  let icScore = 60;
  const undocumented = context.undocumentedProcesses;
  if (undocumented.length > 4) icScore -= undocumented.length * 4;
  if (undocumented.length <= 2) icScore += 15;
  
  const dependency = context.knowledgeDependency;
  if (dependency > 80) icScore -= 25;
  else if (dependency > 60) icScore -= 15;
  else if (dependency < 40) icScore += 10;
  
  assetScores.push({
    category: 'Intellectual Capital',
    score: Math.max(0, Math.min(100, icScore)),
    issues: [
      ...(undocumented.length > 2 ? [`${undocumented.length} critical processes undocumented`] : []),
      ...(dependency > 60 ? [`${dependency}% knowledge dependency on founder`] : [])
    ],
    opportunities: [
      ...(undocumented.length > 0 ? ['Document core processes to reduce risk'] : []),
      ...(dependency > 50 ? ['Cross-train team on critical knowledge'] : [])
    ],
    financialImpact: undocumented.length * 50000 + (dependency > 60 ? 100000 : 0)
  });
  
  // 2. Brand & Trust
  let btScore = 60;
  const personalBrand = context.personalBrand;
  if (personalBrand > 70) btScore -= 25;
  else if (personalBrand > 50) btScore -= 15;
  else if (personalBrand < 30) btScore += 15;
  
  assetScores.push({
    category: 'Brand & Trust',
    score: Math.max(0, Math.min(100, btScore)),
    issues: personalBrand > 50 ? [`${personalBrand}% of customers buy because of you personally`] : [],
    opportunities: personalBrand > 40 ? ['Build business brand independent of founder'] : ['Strong business brand foundation'],
    financialImpact: personalBrand > 50 ? 75000 : 0
  });
  
  // 3. Market Position
  let mpScore = 60;
  const moat = context.competitiveMoat;
  if (moat.includes('Nothing - we compete on price')) mpScore -= 30;
  else mpScore += moat.length * 5;
  
  const concentration = context.customerConcentration;
  if (concentration > 60) mpScore -= 20;
  else if (concentration > 40) mpScore -= 10;
  else if (concentration < 25) mpScore += 10;
  
  assetScores.push({
    category: 'Market Position',
    score: Math.max(0, Math.min(100, mpScore)),
    issues: [
      ...(moat.includes('Nothing - we compete on price') ? ['No competitive moat - price competition only'] : []),
      ...(concentration > 50 ? [`${concentration}% revenue from top 3 customers`] : [])
    ],
    opportunities: [
      ...(moat.length < 3 ? ['Build additional competitive advantages'] : []),
      ...(concentration > 40 ? ['Diversify customer base'] : [])
    ],
    financialImpact: (concentration > 40 ? 100000 : 0) + (moat.length < 2 ? 50000 : 0)
  });
  
  // 4. Systems & Scale
  let ssScore = 60;
  let failedProcesses = 0;
  ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance', 'autonomy_operations'].forEach(f => {
    if (part3[f] === 'Would fail') failedProcesses++;
  });
  if (failedProcesses > 2) ssScore -= failedProcesses * 10;
  else if (failedProcesses === 0) ssScore += 20;
  
  assetScores.push({
    category: 'Systems & Scale',
    score: Math.max(0, Math.min(100, ssScore)),
    issues: failedProcesses > 1 ? [`${failedProcesses} key processes would fail without you`] : [],
    opportunities: failedProcesses > 0 ? ['Systematize operations for scale'] : ['Strong operational foundation'],
    financialImpact: failedProcesses * 40000
  });
  
  // 5. People & Culture
  let pcScore = 60;
  const noSuccession = part3.succession_your_role === 'Nobody';
  if (noSuccession) pcScore -= 25;
  
  assetScores.push({
    category: 'People & Culture',
    score: Math.max(0, Math.min(100, pcScore)),
    issues: noSuccession ? ['No succession plan for your role'] : [],
    opportunities: noSuccession ? ['Develop succession planning'] : ['Succession planning in place'],
    financialImpact: noSuccession ? 150000 : 0
  });
  
  // 6. Financial & Exit Readiness
  let feScore = 60;
  const exitDocs = context.exitReadiness;
  if (exitDocs.length < 3) feScore -= 20;
  else if (exitDocs.length >= 6) feScore += 15;
  
  assetScores.push({
    category: 'Financial & Exit',
    score: Math.max(0, Math.min(100, feScore)),
    issues: exitDocs.length < 4 ? [`Only ${exitDocs.length}/8 due diligence documents ready`] : [],
    opportunities: exitDocs.length < 6 ? ['Prepare comprehensive data room'] : ['Exit documentation ready'],
    financialImpact: exitDocs.length < 4 ? 80000 : 0
  });
  
  // Calculate overall
  const overallScore = Math.round(assetScores.reduce((sum, s) => sum + s.score, 0) / assetScores.length);
  
  // Build risk register
  const riskRegister = [];
  if (dependency > 75) {
    riskRegister.push({
      title: 'Critical Knowledge Concentration',
      severity: 'Critical',
      impact: `${dependency}% of business knowledge concentrated in founder`,
      mitigation: 'Immediate documentation of critical processes and cross-training',
      timeline: '0-30 days'
    });
  }
  if (failedProcesses > 2) {
    riskRegister.push({
      title: 'Operational Fragility',
      severity: 'High',
      impact: `${failedProcesses} processes would fail without founder`,
      mitigation: 'Document SOPs and train backup personnel',
      timeline: '30-60 days'
    });
  }
  if (concentration > 50) {
    riskRegister.push({
      title: 'Customer Concentration Risk',
      severity: 'High',
      impact: `${concentration}% revenue from top 3 customers`,
      mitigation: 'Diversify customer base through targeted acquisition',
      timeline: '60-180 days'
    });
  }
  if (personalBrand > 60) {
    riskRegister.push({
      title: 'Personal Brand Dependency',
      severity: 'Medium',
      impact: `${personalBrand}% of sales tied to founder's personal brand`,
      mitigation: 'Build business brand and train sales team',
      timeline: '90-180 days'
    });
  }
  
  // Build value gaps
  const valueGaps = [];
  if (undocumented.length > 0) {
    valueGaps.push({
      area: 'Process Documentation',
      currentValue: 0,
      potentialValue: undocumented.length * 50000,
      gap: undocumented.length * 50000,
      effort: undocumented.length > 4 ? 'High' : 'Medium',
      timeframe: '4-8 weeks',
      actions: [`Document "${undocumented[0]}" process`, 'Create SOP templates', 'Establish documentation culture']
    });
  }
  if (concentration > 40) {
    valueGaps.push({
      area: 'Customer Diversification',
      currentValue: 0,
      potentialValue: 200000,
      gap: 200000,
      effort: 'High',
      timeframe: '3-6 months',
      actions: ['Develop customer acquisition strategy', 'Target 10 new customers', 'Reduce top 3 concentration below 30%']
    });
  }
  
  const totalOpportunity = assetScores.reduce((sum, s) => sum + s.financialImpact, 0);
  
  return {
    assetScores,
    overallScore,
    riskRegister,
    valueGaps,
    totalOpportunity,
    exitReadinessScore: Math.round((exitDocs.length / 8) * 100),
    valuationMultiplierImpact: overallScore > 70 ? '+0.5x' : overallScore > 50 ? '+0.2x' : '-0.3x',
    generatedAt: new Date().toISOString()
  };
}

// ============================================================================
// LLM CALL HELPER
// ============================================================================

async function callLLM(prompt: string, context: AssessmentContext): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Fill in the prompt template
  let filledPrompt = prompt;
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    let stringValue: string;
    
    if (Array.isArray(value)) {
      stringValue = JSON.stringify(value);
    } else if (typeof value === 'object' && value !== null) {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value || '');
    }
    
    filledPrompt = filledPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
  });

  // Also fill emotional anchors specifically
  if (context.emotionalAnchors) {
    filledPrompt = filledPrompt
      .replace(/{painPhrases}/g, JSON.stringify(context.emotionalAnchors.painPhrases))
      .replace(/{desirePhrases}/g, JSON.stringify(context.emotionalAnchors.desirePhrases))
      .replace(/{metaphors}/g, JSON.stringify(context.emotionalAnchors.metaphors))
      .replace(/{timePatterns}/g, JSON.stringify(context.emotionalAnchors.timePatterns))
      .replace(/{repeatedThemes}/g, JSON.stringify(context.emotionalAnchors.repeatedThemes));
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Alignment'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are an expert advisor who creates deeply personal transformation narratives. You excel at reading between the lines and finding the emotional truth in people's words. Write in second person, directly to the founder. Weave their exact quotes naturally throughout. Every paragraph should make them think "How did you know that about me?" Always return valid JSON.`
        },
        { role: 'user', content: filledPrompt }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error: ${errorText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Extract JSON from LLM response (handles markdown code blocks)
function extractJson(text: string): any {
  if (!text) throw new Error('Empty LLM response');
  
  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Find JSON object boundaries
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1 || end < start) {
    console.error('No JSON found in response:', text.substring(0, 500));
    throw new Error('No valid JSON object found in LLM response');
  }
  
  const jsonStr = cleaned.substring(start, end + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try to fix common issues
    const fixed = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1f]/g, ' ')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
    
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.error('JSON parse failed. First 1000 chars:', jsonStr.substring(0, 1000));
      throw new Error(`Failed to parse JSON: ${(e2 as Error).message}`);
    }
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, regenerate } = await req.json();

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId or practiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting comprehensive 365 Analysis for client ${clientId}...`);
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all assessments
    const { data: assessments, error: fetchError } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses, status')
      .eq('client_id', clientId);

    if (fetchError) throw new Error(`Failed to fetch assessments: ${fetchError.message}`);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
    const part3 = assessments?.find(a => a.assessment_type === 'part3')?.responses || {};

    // Build comprehensive context
    const context = buildContext(part1, part2, part3);
    console.log('Context built for', context.companyName);
    console.log('Emotional anchors:', context.emotionalAnchors.painPhrases.length, 'pain phrases,', context.emotionalAnchors.desirePhrases.length, 'desire phrases');

    // ========================================
    // PHASE 1: Value Analysis (Free - Rule-based)
    // ========================================
    console.log('Running value analysis...');
    const valueAnalysis = calculateValueAnalysis(part3, context);
    console.log('Value score:', valueAnalysis.overallScore, '/ Total opportunity: £', valueAnalysis.totalOpportunity);

    // ========================================
    // PHASE 2: Generate 5-Year Vision (LLM)
    // ========================================
    console.log('Generating 5-Year Vision...');
    const visionResponse = await callLLM(FIVE_YEAR_VISION_PROMPT, context);
    const fiveYearVision = extractJson(visionResponse);
    console.log('Vision generated. North Star:', fiveYearVision.northStar?.substring(0, 60) + '...');

    // ========================================
    // PHASE 3: Generate 6-Month Shift (LLM)
    // ========================================
    console.log('Generating 6-Month Shift...');
    const shiftContext = {
      ...context,
      fiveYearVision: JSON.stringify(fiveYearVision),
      northStar: fiveYearVision.northStar || '',
      archetype: fiveYearVision.archetype || 'balanced_achiever'
    } as any;
    const shiftResponse = await callLLM(SIX_MONTH_SHIFT_PROMPT, shiftContext);
    const sixMonthShift = extractJson(shiftResponse);
    console.log('6-Month Shift generated');

    // ========================================
    // PHASE 4: Generate 12-Week Sprint (LLM)
    // ========================================
    console.log('Generating 12-Week Sprint...');
    const sprintContext = {
      ...context,
      sixMonthShift: JSON.stringify(sixMonthShift),
      northStar: fiveYearVision.northStar || '',
      emotionalCore: fiveYearVision.emotionalCore || '',
      year1Target: fiveYearVision.yearMilestones?.year1?.measurable || ''
    } as any;
    const sprintResponse = await callLLM(TWELVE_WEEK_SPRINT_PROMPT, sprintContext);
    const sprint = extractJson(sprintResponse);
    console.log('12-Week Sprint generated with', sprint.weeks?.length || 0, 'weeks');

    const duration = Date.now() - startTime;
    console.log(`Total generation time: ${duration}ms`);

    // ========================================
    // Build complete roadmap data
    // ========================================
    const roadmapData = {
      // Core vision
      fiveYearVision,
      sixMonthShift,
      sprint,
      
      // Summary for quick display
      summary: {
        headline: fiveYearVision.tagline || `${context.companyName}'s Transformation`,
        northStar: fiveYearVision.northStar,
        keyInsight: sixMonthShift.shiftOverview,
        expectedOutcome: fiveYearVision.yearMilestones?.year1?.measurable
      },
      
      // For backward compatibility
      priorities: sprint.sprintGoals?.map((goal: string, i: number) => ({
        rank: i + 1,
        title: goal,
        description: goal,
        category: 'Strategic'
      })) || [],
      
      weeks: sprint.weeks || [],
      
      // Metadata
      generatedAt: new Date().toISOString(),
      generationDurationMs: duration
    };

    // ========================================
    // Save to database
    // ========================================
    // Deactivate old roadmaps
    await supabase.from('client_roadmaps').update({ is_active: false }).eq('client_id', clientId);

    // Insert new roadmap
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        roadmap_data: roadmapData,
        value_analysis: valueAnalysis,
        is_active: true
      })
      .select()
      .single();

    if (saveError) throw new Error(`Failed to save roadmap: ${saveError.message}`);

    // Create tasks from sprint weeks
    if (sprint.weeks?.length > 0) {
      const tasks = sprint.weeks.flatMap((week: any) =>
        (week.tasks || []).map((task: any, i: number) => ({
          practice_id: practiceId,
          client_id: clientId,
          roadmap_id: savedRoadmap.id,
          week_number: week.weekNumber,
          title: task.title,
          description: task.description,
          category: task.category || 'General',
          priority: task.priority || 'medium',
          estimated_hours: task.estimatedHours || 1,
          sort_order: i,
          status: 'pending'
        }))
      );
      
      if (tasks.length > 0) {
        const { error: tasksError } = await supabase.from('client_tasks').insert(tasks);
        if (tasksError) {
          console.error('Failed to create tasks:', tasksError.message);
        } else {
          console.log(`Created ${tasks.length} tasks`);
        }
      }
    }

    console.log('365 Analysis complete!');

    return new Response(
      JSON.stringify({
        success: true,
        roadmapId: savedRoadmap.id,
        summary: {
          headline: roadmapData.summary.headline,
          northStar: fiveYearVision.northStar,
          archetype: fiveYearVision.archetype,
          valueScore: valueAnalysis.overallScore,
          totalOpportunity: valueAnalysis.totalOpportunity,
          weekCount: sprint.weeks?.length || 0,
          taskCount: sprint.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0
        },
        usage: {
          durationMs: duration,
          llmCalls: 3
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
