# 365 ALIGNMENT SYSTEM: NARRATIVE ELEVATION
## From Functional Output to Transformational Storytelling

**Last Updated:** December 14, 2025  
**Status:** Design Document - Ready for Implementation  
**Author:** James Howard / Oracle Consulting AI

---

**Objective:** Elevate the 365 Alignment Programme from clinical business advisory to a transformational narrative experience that sells the destination, not the process. Every output should make the client think: *"How did you know that about me?"* and *"I want to print this on my wall."*

**Philosophy:** We are not generating reports. We are crafting the opening chapter of someone's transformation story. McKinsey rigour, Tolkien wonder, human truth.

---

# PART 1: THE PROBLEM WE'RE SOLVING

## Current State (What's Broken)

The system generates **functional** content but lacks **soul**:

### What We're Producing:
```
5-Year Vision: "Britain's Rowing Specialist - With Freedom to Live"

6-Month Shift:
- Month 2: Better processes and training
- Month 4: More staff
- Month 6: A GM

Value Analysis: 64/100 | £136,250 Opportunity | 0 Critical Risks
```

### What We Should Produce:

```
THE VISION

You're standing in your unit at 6pm on a Friday, your phone buzzing again 
with another sink leak at the salon. Zaneta's waiting at home but you know 
the drill—you'll be there until 10pm, then back Sunday fitting new taps. 
Within the space of a few hours, you want to burn the whole thing down, 
then feel like the happiest man alive, then back again.

This is the pattern. And it's exhausting.

But five years from now? It's a Tuesday morning. There's no alarm. You're 
having coffee in bed with Zaneta, the kids are (finally) there, and your 
phone hasn't buzzed since 8pm last night because Pete knows what to do. 
You'll drop into the Rowgear unit this afternoon—not because you have to, 
but because you want to see how the new engineer's doing.

The £10k lands in your account monthly like clockwork.
Britain's rowing specialist keeps winning without you on every job.
And the only question you're asking yourself is: Bali or Thailand next month?

---

THE 6-MONTH SHIFT

You said it yourself: "more staff, better processes and training, a GM."
You already know what needs to happen. What's been missing is the roadmap.

By Month 6, Tom is no longer the person who fixes everything. Rowgear has:
• Documented processes (that 40-machines-per-day system that only exists in 
  your head? Written down, tested, trainable)
• A team that can run a full day without calling you
• The foundation for a GM who handles daily operations

The emotional shift: From "I can't take a day off without my phone exploding" 
to "I took Tuesday off and nothing caught fire."

---

VALUE ANALYSIS: THE UNCOMFORTABLE TRUTH

⚠️ CRITICAL: Your revenue grew 47% but your profit dropped 62%.

This is not a success story yet. Your subcontractor costs nearly doubled 
(£32k → £70k) while revenue only grew 47%. Before hiring anyone else, you 
need to understand: are you paying too much for subs, underpricing jobs, or both?

The £136,250 opportunity is real—but only if you fix the margin leak first.
Otherwise you're just scaling a problem.
```

**That's** the difference. One is a report. The other is a mirror.

---

# PART 2: SYSTEM ARCHITECTURE CHANGES

## 2.1 Data Flow Enhancement

### Current Flow:
```
Assessment Data → Edge Function → JSON Output → UI Display
```

### Enhanced Flow:
```
Assessment Data ─┬─→ Emotional Anchor Extraction
                 ├─→ Financial Data Integration (accounts if uploaded)
                 ├─→ Context Notes (advisor observations)
                 └─→ Edge Function with NARRATIVE prompts
                              ↓
                     Rich JSON with Stories
                              ↓
                     UI with Proper Rendering
```

## 2.2 New Data Sources to Integrate

**Add to each edge function's context gathering:**

1. **Financial Accounts** (if uploaded)
   - Year-on-year revenue change
   - Gross margin trend
   - Profit margin trend
   - Key expense categories
   - Cash position

2. **Advisor Context Notes** (from `client_context` table)
   - Call observations
   - Email insights
   - Specific corrections

3. **Previous Stage Outputs** (chain context)
   - North Star from fit_assessment
   - Vision narrative from five_year_vision
   - Shift milestones from six_month_shift

---

# PART 3: EDGE FUNCTION REWRITES

## 3.1 generate-fit-profile/index.ts

### Current Prompt Issues:
- Generates scores but weak narrative
- Doesn't create emotional connection
- Missing the "profile" that makes them feel seen

### New Prompt Structure:

```typescript
const NARRATIVE_FIT_PROMPT = `You are crafting the opening of someone's transformation story.

THE PERSON:
Name: ${ctx.userName}
Company: ${ctx.companyName}
Their words about their ideal Tuesday: "${ctx.tuesdayTest}"
Their relationship with their business: "${ctx.relationshipMirror}"
What keeps them up at night: "${ctx.moneyWorry}"
What they'd magic away: "${ctx.magicAwayTask}"
What they're secretly proud of: "${ctx.secretPride}"

THEIR NUMBERS:
Current income: £${ctx.currentIncome}/month
Desired income: £${ctx.desiredIncome}/month
Current hours: ${ctx.currentWorkingHours}/week
Desired hours: ${ctx.targetWorkingHours}/week
Team: ${ctx.teamSize}

WHAT YOU MUST CREATE:

1. A NORTH STAR (one sentence, max 25 words)
   - Must use THEIR exact words from tuesdayTest, winningBy2030, or tenYearVision
   - Must capture LIFE goal, not just business goal
   - Must be memorable enough to tattoo
   
   BAD: "Build a successful rowing machine service business"
   GOOD: "Working 1-2 days a week, earning £10k/month, with the freedom to start a family and travel with Zaneta—without being the backstop that gets called whenever plans are made."

2. A TAGLINE (max 10 words)
   - Their business identity + their life aspiration
   
   BAD: "Rowing machine services"
   GOOD: "Britain's Rowing Specialist—With Freedom to Live"

3. AN OPENING REFLECTION (2-3 paragraphs)
   - Start with their pain (use their exact words)
   - Acknowledge where they are
   - Mirror their emotional state
   - Make them feel SEEN
   
   Structure:
   - Para 1: "You said [their words]. I hear [the deeper meaning]."
   - Para 2: "What you're describing is [pattern recognition]."
   - Para 3: "Here's what I see in you: [their strengths they don't see]."

4. FIT SIGNALS (honest assessment)
   - Readiness Score (0-100)
   - Commitment Score (0-100)
   - Clarity Score (0-100)
   - Urgency Score (0-100)
   - Coachability Score (0-100)
   
   With 1-sentence explanation for each using their specific answers.

5. JOURNEY RECOMMENDATION
   - "365_method" | "needs_discussion" | "not_ready"
   - With honest reasoning

6. ARCHETYPE
   - freedom_seeker: Wants time/autonomy back
   - empire_builder: Wants to scale/dominate
   - lifestyle_designer: Wants business to fund life
   - impact_maker: Wants to change their industry
   - balanced_achiever: Wants sustainable success
   
   Must explain WHY this archetype based on their specific answers.

OUTPUT AS JSON:
{
  "northStar": "string - their exact words woven into a powerful statement",
  "tagline": "string - 10 words max",
  "openingReflection": "string - 2-3 paragraphs that make them feel seen",
  "fitSignals": {
    "readinessScore": number,
    "readinessExplanation": "string - using their answers",
    "commitmentScore": number,
    "commitmentExplanation": "string",
    "clarityScore": number,
    "clarityExplanation": "string",
    "urgencyScore": number,
    "urgencyExplanation": "string",
    "coachabilityScore": number,
    "coachabilityExplanation": "string",
    "overallFit": "excellent|good|needs_discussion|not_ready"
  },
  "journeyRecommendation": "365_method|needs_discussion|not_ready",
  "journeyReasoning": "string - honest explanation",
  "archetype": "string",
  "archetypeExplanation": "string - why this fits them specifically"
}

CRITICAL RULES:
1. Use THEIR words, not business clichés
2. If they said "burn it down" - use "burn it down"
3. If they mentioned family - family goes in the North Star
4. Every score explanation must reference a specific thing they said
5. The opening reflection should make them slightly emotional
`;
```

---

## 3.2 generate-five-year-vision/index.ts

### Current Prompt Issues:
- Produces tagline but not full narrative
- Missing the "transformation story" arc
- Year milestones are generic

### New Prompt Structure:

```typescript
const NARRATIVE_VISION_PROMPT = `You are writing the opening chapter of someone's transformation story. This is not a business plan—it's the future they can taste, told so vividly they can feel the coffee cup in their hands on that Tuesday morning five years from now.

THE PROTAGONIST:
${ctx.userName} runs ${ctx.companyName}.
${ctx.yearsTrading} years in business.
Current reality: ${ctx.annualTurnover}, working ${ctx.currentWorkingHours} hours/week.
Their words about their ideal Tuesday: "${ctx.tuesdayTest}"

THE CONFLICT (their exact words):
Emergency log: "${ctx.emergencyLog}"
Money worry: "${ctx.moneyWorry}"
What family says: "${ctx.familyFeedback}"
What they'd magic away: "${ctx.magicAwayTask}"
Their relationship with the business: "${ctx.relationshipMirror}"

THE DESIRE (their exact words):
What winning looks like to them: "${ctx.winningBy2030}"
Their 10-year vision: "${ctx.tenYearVision}"
Their secret pride: "${ctx.secretPride}"
What they've sacrificed: ${JSON.stringify(ctx.sacrifices)}

THEIR NORTH STAR (from fit profile):
"${fitProfile.northStar}"

ARCHETYPE: ${fitProfile.archetype}

---

WHAT YOU MUST CREATE:

1. TRANSFORMATION NARRATIVE (3 paragraphs, ~300 words total)

   Structure this as a story arc:
   
   PARAGRAPH 1 - THE CURRENT REALITY (make it visceral)
   Start in a specific moment of their current life. Use their exact words.
   "You're standing in [specific place from their context] when [specific 
   pain they described] happens again. [Their emotional words about it]."
   
   PARAGRAPH 2 - THE TURNING POINT (the insight)
   What needs to change and why. Not what they need to DO but what they 
   need to BECOME. Reference their archetype and what's really driving them.
   "What you're building toward isn't just [business goal]. It's [life goal].
   The business is the vehicle, not the destination."
   
   PARAGRAPH 3 - THE ACHIEVED VISION (make it sensory)
   Five years from now, specific Tuesday morning. What do they see, feel,
   hear? Use their Tuesday Test answer but elevated. Make it so vivid they
   can taste the coffee.
   "It's Tuesday. [Time]. [Sensory detail]. [Emotional state]. 
   [Specific freedom they described]. [The relationship with business now]."

2. YEAR MILESTONES (not generic goals—emotional shifts)

   For each year, provide:
   - headline: Max 8 words, captures the emotional shift
   - story: 2-3 sentences, specific to their situation
   - measurable: Specific numbers tied to their stated goals
   - emotionalShift: What changes in how they FEEL day-to-day
   
   YEAR 1: "The Reclamation"
   - This is about getting their life back, not growing the business
   - Reference their immediate pain points
   - The goal is RELIEF, not revenue
   
   YEAR 3: "The Crossing"  
   - They've crossed from operator to owner
   - The business runs without heroics
   - Their life goals (family, travel, freedom) are progressing
   
   YEAR 5: "The Arrival"
   - Their specific vision of "winning" achieved
   - Use their EXACT words from winning_2030
   - What their family says about them NOW vs then

3. THE CHOICE (make it real)
   
   One paragraph acknowledging what they'll have to give up, let go of,
   or face to get there. Not scary—honest. This is their growth edge.

OUTPUT AS JSON:
{
  "transformationNarrative": {
    "currentReality": "paragraph 1 - visceral, specific, their words",
    "turningPoint": "paragraph 2 - the insight they need",
    "achievedVision": "paragraph 3 - sensory, emotional, specific"
  },
  "yearMilestones": {
    "year1": {
      "headline": "The Reclamation",
      "story": "2-3 sentences specific to their situation",
      "measurable": "Hours reduced to X, income at £Y, [specific relief]",
      "emotionalShift": "From [current feeling] to [new feeling]"
    },
    "year3": {
      "headline": "The Crossing",
      "story": "2-3 sentences",
      "measurable": "Their target hours, income, life goals progressing",
      "emotionalShift": "From [current] to [transformed]"
    },
    "year5": {
      "headline": "The Arrival",
      "story": "2-3 sentences using their winning_2030 words",
      "measurable": "Their specific vision quantified",
      "emotionalShift": "What their family says about them now"
    }
  },
  "theChoice": "paragraph - what they must face/release to get there",
  "northStar": "${fitProfile.northStar}",
  "tagline": "max 10 words - their identity + aspiration"
}

CRITICAL RULES:
1. This should read like the opening of a novel, not a consulting report
2. Use THEIR words—if they said "burn it down," write "burn it down"
3. The Tuesday morning scene must be SENSORY (what do they see/hear/feel)
4. Year milestones must connect to their STATED goals, not generic business targets
5. If they mentioned family/kids, that goes in Year 3 and 5
6. The emotionalShift must name actual emotions (not "feeling better")
7. This should make them slightly emotional to read
`;
```

---

## 3.3 generate-six-month-shift/index.ts

### Current Prompt Issues:
- Only outputs 3 bullet points
- Missing the narrative wrapper
- No connection between milestones and their stated "six_month_shifts" answer

### New Prompt Structure:

```typescript
const NARRATIVE_SHIFT_PROMPT = `You are creating the bridge between where ${ctx.userName} is now and where they need to be in Year 1.

This is not a project plan. This is the first chapter of their transformation.

THE GAP TO BRIDGE:
From: ${ctx.currentWorkingHours} hours/week → To: ${vision.yearMilestones.year1.measurable}
From: "${ctx.mondayFrustration}" → To: "${vision.yearMilestones.year1.emotionalShift}"
From: "${ctx.relationshipMirror}" → To: Year 1 reality

THEIR OWN ANSWER (THIS IS GOLD - USE IT):
When asked "What needs to shift in the next 6 months?", they said:
"${ctx.sixMonthShifts}"

This is your source material. Don't invent—refine.

THE VISION WE'RE BUILDING TOWARD:
North Star: "${vision.northStar}"
Year 1 Headline: "${vision.yearMilestones.year1.headline}"

THEIR CONSTRAINTS:
Time available: ${ctx.commitmentHours}
Biggest challenge: "${ctx.growthBottleneck}"
Danger zone: "${ctx.dangerZone}"
What they'd magic away: "${ctx.magicAwayTask}"

${ctx.financialContext ? `
FINANCIAL REALITY CHECK:
${ctx.financialContext}
` : ''}

---

WHAT YOU MUST CREATE:

1. SHIFT STATEMENT (2-3 sentences)
   Transform their six_month_shifts answer into a vivid statement of what's 
   different at Month 6. Not what they'll DO—what will be TRUE.
   
   Their answer: "${ctx.sixMonthShifts}"
   Your job: Make it specific, measurable, and emotionally resonant.
   
   Example transformation:
   Input: "more staff, better processes and training, a GM"
   Output: "In 6 months, Rowgear has documented processes, a trained team 
   that can operate independently, and a GM who handles daily operations—
   so Tom is no longer the only person who can fix everything."

2. KEY MILESTONES (parse from their answer)
   
   Extract exactly what they said and add specificity:
   - What they said → When (Month 2/4/6) → Measurable outcome
   
   For "${ctx.sixMonthShifts}":
   [Parse their answer into 3-4 discrete milestones with target months]

3. GAP ANALYSIS
   
   Show where they are now vs. Month 6:
   {
     "category": "e.g., Process Documentation",
     "current": "What's true now (be specific)",
     "month6": "What's true at month 6",
     "bridgeAction": "How we get there"
   }

4. RISK REGISTER (honest about their danger zone)
   
   Their danger zone: "${ctx.dangerZone}"
   - What could derail this shift
   - Mitigation strategy
   - Early warning signs

5. QUICK WINS (from their magicAwayTask)
   
   They want to magic away: "${ctx.magicAwayTask}"
   - Week 1 win that addresses this
   - Month 1 win that shows progress
   - What this proves is possible

6. THE TUESDAY EVOLUTION
   
   Show how their Tuesday changes across the 6 months:
   - Month 1 Tuesday: [still fighting fires but...]
   - Month 3 Tuesday: [starting to breathe...]
   - Month 6 Tuesday: [approaching their vision...]

${ctx.financialContext ? `
7. FINANCIAL REALITY CHECK

   Based on their accounts:
   [Summarize the key financial insight—e.g., margin compression]
   [What this means for the 6-month plan]
   [Specific action to address it]
` : ''}

OUTPUT AS JSON:
{
  "shiftStatement": "2-3 sentences - what's TRUE at month 6",
  "keyMilestones": [
    {
      "milestone": "From their six_month_shifts answer",
      "targetMonth": 2,
      "measurable": "Specific outcome",
      "whyItMatters": "Connection to their north star"
    }
    // 3-4 total, parsed from their answer
  ],
  "gapAnalysis": [
    {
      "category": "string",
      "current": "string",
      "month6": "string", 
      "bridgeAction": "string"
    }
  ],
  "risks": [
    {
      "risk": "From their danger_zone",
      "mitigation": "string",
      "earlyWarning": "string"
    }
  ],
  "quickWins": [
    {
      "timing": "Week 1",
      "win": "From their magic_away_task",
      "impact": "Why this matters emotionally"
    }
  ],
  "tuesdayEvolution": {
    "month1": "string - still in transition",
    "month3": "string - starting to shift",
    "month6": "string - approaching year 1 vision"
  },
  "financialRealityCheck": {
    "insight": "string - if accounts uploaded",
    "implication": "string - what it means for the plan",
    "action": "string - what to do about it"
  },
  "connectionToVision": "How this 6-month shift moves them toward: ${vision.northStar}"
}

CRITICAL RULES:
1. Their "six_month_shifts" answer IS your source for milestones—don't invent
2. Every milestone needs a measurable target
3. The Tuesday Evolution should show emotional progress, not just business progress
4. If financial data shows a problem (e.g., margin drop), ADDRESS IT directly
5. Quick wins must connect to their magic_away_task specifically
6. Risk mitigation must be specific to their stated danger_zone
`;
```

---

## 3.4 generate-sprint-plan (part1 & part2)

### Current Prompt Issues:
- Tasks are functional but disconnected from emotional journey
- Missing the "why this matters to YOUR life" wrapper
- No connection between tasks and milestones

### New Prompt Structure:

```typescript
const NARRATIVE_SPRINT_PROMPT = `You are creating a 12-week transformation sprint for ${ctx.userName}.

This is not a task list. This is a carefully sequenced journey where each week 
builds on the last, each task serves the larger vision, and every action connects 
to their North Star.

THE NORTH STAR (filter every task through this):
"${vision.northStar}"

THE 6-MONTH MILESTONES (every task serves one of these):
${shift.keyMilestones.map((m, i) => `
Milestone ${i+1}: ${m.milestone}
- Target: Month ${m.targetMonth}
- Measurable: ${m.measurable}
`).join('\n')}

THEIR IMMEDIATE PAIN (address in Weeks 1-4):
- Monday frustration: "${ctx.mondayFrustration}"
- Magic away task: "${ctx.magicAwayTask}"  
- Emergency log: "${ctx.emergencyLog}"
- 90-day priorities they selected: ${JSON.stringify(ctx.ninetyDayPriorities)}

THEIR CONSTRAINTS:
- Time available: ${ctx.commitmentHours}
- Current hours: ${ctx.currentWorkingHours}/week
- Target hours: ${ctx.targetWorkingHours}/week
- Team: ${ctx.teamSize}

THEIR TOOLS (reference these in tasks):
${ctx.toolsUsed?.length > 0 ? ctx.toolsUsed.join(', ') : 'No specific tools mentioned—recommend appropriate ones'}

${ctx.financialContext ? `
FINANCIAL CONTEXT (incorporate if relevant):
${ctx.financialContext}
` : ''}

---

WHAT YOU MUST CREATE:

For each week (1-6 for Part 1, 7-12 for Part 2):

1. WEEK THEME (max 6 words)
   - Should resonate emotionally, not sound like a project phase
   - Example: "Reclaim Your Mornings" not "Process Documentation Phase"

2. PHASE LABEL
   - Weeks 1-2: "Immediate Relief"
   - Weeks 3-4: "Foundation"
   - Weeks 5-6: "Implementation"
   - Weeks 7-8: "Momentum"
   - Weeks 9-10: "Embed"
   - Weeks 11-12: "Measure"

3. WEEK NARRATIVE (2-3 sentences)
   WHY this week matters to their life, not just their business.
   Connect to their emotional journey.
   
   Example: "This week is about one thing: proving to yourself that you're 
   not trapped. By Friday, you'll know exactly how much you're worth per 
   hour—and it's going to be higher than you think."

4. TASKS (3-4 per week)
   Each task must have:
   
   {
     "title": "Action-oriented, specific",
     "description": "2-3 sentences explaining exactly what to do, step by step",
     "whyThisMatters": "Connection to their north star or immediate pain",
     "milestone": "Which 6-month milestone this serves",
     "tools": "Specific tools to use",
     "timeEstimate": "Hours this will take",
     "deliverable": "What's produced/completed",
     "celebrationMoment": "What to notice when done"
   }
   
   Task sequencing rules:
   - Week 1-2 tasks must address magic_away_task and monday_frustration
   - Tasks must be completable in their stated commitment_hours
   - Each task should build on the previous
   - Include at least one "quick win" per week in early weeks

5. WEEK MILESTONE
   "By the end of Week X: [specific, measurable outcome]"
   This should feel like an achievement, not a checkbox.

6. TUESDAY CHECK-IN (for that week)
   A question they ask themselves: "Do I feel [emotion]?"
   Shows emotional progress, not just task completion.

---

OUTPUT STRUCTURE:

{
  "sprintTheme": "The overarching theme of this 12-week transformation",
  "sprintPromise": "What's TRUE about their life at Week 12",
  "sprintGoals": ["3-4 high-level outcomes"],
  
  "phases": {
    "immediateRelief": {
      "weeks": [1, 2],
      "theme": "Quick wins and hope restoration",
      "emotionalGoal": "From overwhelmed to 'I can do this'"
    },
    "foundation": {
      "weeks": [3, 4],
      "theme": "Building the base",
      "emotionalGoal": "From reactive to proactive"
    }
    // ... other phases
  },
  
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Reclaim Your Mornings",
      "phase": "immediateRelief",
      "narrative": "This week is about proving to yourself...",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "Map your time reality",
          "description": "For 3 days, track every 30-minute block...",
          "whyThisMatters": "You said you're 'constantly doing repairs'—let's see the real numbers",
          "milestone": "Process Documentation",
          "tools": "Google Sheets or Toggl",
          "timeEstimate": "2 hours across 3 days",
          "deliverable": "Time audit spreadsheet",
          "celebrationMoment": "When you see your actual hourly rate"
        }
      ],
      "weekMilestone": "By end of Week 1: You know your real hourly rate",
      "tuesdayCheckIn": "Do I feel like I have more control over my time?"
    }
  ],
  
  "tuesdayEvolution": {
    "week1": "Still firefighting, but starting to see patterns",
    "week4": "First signs of breathing room",
    "week8": "Starting to trust the systems",
    "week12": "Approaching the Month 3 vision"
  },
  
  "backslidePreventions": [
    "What to do when [specific risk] happens",
    "How to recover if you miss a week"
  ],
  
  "nextSprintPreview": "Sprint 2 will build on this foundation by..."
}

CRITICAL RULES:
1. Every task MUST connect to a 6-month milestone
2. Weeks 1-2 MUST address their magic_away_task
3. Tasks must fit within their stated commitment_hours
4. Use their specific tools or recommend alternatives
5. The narrative for each week should make them FEEL something
6. Tuesday check-ins measure emotional state, not task completion
7. If their accounts show a problem, Week 1-2 should include a financial review task
8. Week themes should be memorable enough to remember without looking
`;
```

---

## 3.5 generate-value-analysis/index.ts

### Current Prompt Issues:
- Only uses Part 3 assessment responses, not actual accounts
- Shows "0 Critical Risks" when profit dropped 62%
- Missing narrative around the numbers

### New Architecture:

```typescript
// ADD: Financial data integration
interface FinancialData {
  // From uploaded accounts (if available)
  currentYearRevenue?: number;
  priorYearRevenue?: number;
  revenueGrowth?: number;
  
  currentYearGrossMargin?: number;
  priorYearGrossMargin?: number;
  marginChange?: number;
  
  currentYearProfit?: number;
  priorYearProfit?: number;
  profitChange?: number;
  
  // Derived insights
  hasMarginCompression?: boolean;
  hasProfitCrisis?: boolean;
  hasRevenueDecline?: boolean;
}

// ADD: Accounts parsing function
function parseUploadedAccounts(accountsData: any): FinancialData {
  // Extract from PDF/parsed accounts
  // Compare year-on-year
  // Flag critical issues
}
```

### New Prompt:

The value analysis prompt should:
1. Surface uncomfortable truths from financial data
2. Create a "headline truth" that doesn't sugar-coat
3. Show 0 Critical Risks ONLY if there truly are none
4. Connect opportunities to their specific situation

---

# PART 4: UI DISPLAY CHANGES

## 4.1 Roadmap Tab Enhancement

The UI needs to render the rich narrative structure, not just bullet points.

### Key Components Needed:

1. **VisionSection** - Full transformation narrative
2. **MilestoneTimeline** - Year 1/3/5 with emotional shifts
3. **ShiftSection** - 6-month bridge with Tuesday evolution
4. **ValueSection** - Honest headline truth and risk alerts

## 4.2 Sprint Tab Enhancement

1. **Phase navigation** - Show which phase they're in
2. **Week narratives** - Why this week matters
3. **Task cards** - With "why this matters" and celebration moments
4. **Tuesday evolution tracker** - Emotional progress visualization

---

# PART 5: IMPLEMENTATION ORDER

## Phase 1: Foundation (Week 1)

1. **Update `generate-fit-profile`** with new narrative prompt
2. **Update `generate-five-year-vision`** with transformation narrative structure
3. **Test with Tom Clark's data** - verify narrative quality

## Phase 2: Shift & Sprint (Week 1-2)

4. **Update `generate-six-month-shift`** with milestone parsing and Tuesday evolution
5. **Update `generate-sprint-plan-part1`** with narrative wrappers
6. **Update `generate-sprint-plan-part2`** with narrative wrappers
7. **Test full chain** - verify coherence across stages

## Phase 3: Value Analysis & Financial Integration (Week 2)

8. **Add financial data parsing** for uploaded accounts
9. **Update `generate-value-analysis`** with financial reality check
10. **Ensure critical risks from accounts surface properly**

## Phase 4: UI Updates (Week 2-3)

11. **Update ClientDetailModal** - Roadmap tab narrative display
12. **Update Sprint display** - week narratives and task context
13. **Update Value Analysis display** - headline truth and risk alerts

## Phase 5: Testing & Refinement (Week 3)

14. **Full test with Tom Clark's complete data**
15. **Compare output to "what it should look like" examples**
16. **Iterate on prompt tuning**

---

# PART 6: SUCCESS CRITERIA

The system is working when:

1. **The North Star** uses the client's exact words and captures their life goal, not just business goal

2. **The Transformation Narrative** makes the client slightly emotional—they feel truly seen

3. **Year Milestones** connect to their stated desires (family, travel, freedom) not generic business targets

4. **The 6-Month Shift** parses their own "six_month_shifts" answer into specific milestones

5. **Every Sprint Task** connects to a milestone and includes "why this matters to your life"

6. **The Value Analysis** surfaces uncomfortable truths (like profit dropping 62%) as Critical Risks

7. **The client's reaction**: "How did you know that about me?"

8. **The partner's reaction**: "I want to show this to every prospect"

---

# APPENDIX: EXAMPLE OUTPUT FOR TOM CLARK

## What The System Should Produce:

### North Star
*"Working 1-2 days a week, earning £10k/month, with the freedom to start a family and travel with Zaneta—without being the backstop that gets called whenever plans are made."*

### Transformation Narrative

**Current Reality:**
You're standing in your unit at 6pm on a Friday, phone buzzing again. There's a sink leak at the salon. Zaneta's waiting at home but you know the drill—you'll be there until 10pm, then back Sunday fitting new taps. *"Within the space of a few hours I can want to burn the whole thing down, to feeling like the happiest man alive and back again."* That's exhausting. And it's not sustainable—especially not if you want what you said you want: kids, travel, a life.

**The Turning Point:**
What you're building toward isn't just a more profitable rowing machine business. It's freedom from being the only person who can fix everything. The business is the vehicle, not the destination. You already know what needs to happen—*"more staff, better processes and training, a GM."* You said it yourself. What's been missing is the roadmap to get there without the whole thing collapsing in the meantime.

**The Achieved Vision:**
It's a Tuesday morning, five years from now. There's no alarm. You're having coffee in bed with Zaneta, the kids are finally there, and your phone hasn't buzzed since 8pm last night because Pete knows what to do and the new GM handles the daily operations. You'll drop into the Rowgear unit this afternoon—not because you have to, but because you want to see how the new engineer's doing. The £10k lands in your account monthly like clockwork. Britain's rowing specialist keeps winning without you on every job. And the only question you're asking yourself is: *Bali or Thailand next month?*

### Year Milestones

**Year 1: The Reclamation**
*Story:* The fires stop. You've documented the 40-machines-per-day process, trained two engineers who can run jobs independently, and established Tuesday as your sacred day off. The business still needs you—but it doesn't need you on every job.
*Measurable:* Working 3 days/week, £7k/month income, taking consecutive days off without emergency calls.
*Emotional Shift:* From "I can't take a day off without my phone exploding" to "I took Tuesday off and nothing caught fire."

**Year 3: The Crossing**
*Story:* You've crossed from operator to owner. A GM handles daily operations. You focus on the relationships that matter—the GB Rowing accounts, the CrossFit chains, the growth opportunities. Pete's running the systems you built together. Zaneta's pregnant—and you're actually present for it.
*Measurable:* Working 2 days/week, £9k/month income, GM hired and functioning, first extended holiday taken.
*Emotional Shift:* From "the business runs on me" to "the business runs beside me."

**Year 5: The Arrival**
*Story:* *"10k a month for me and working 1 or 2 days a week. I don't need anymore money than that."* You said it. Now it's true. Rowgear is Britain's rowing specialist—with or without you on the van. The kids are here. The country house is happening. And when your family talks about you now, they don't say *"worried"*—they say *"proud."*
*Measurable:* £10k/month, 1-2 days/week, business valued at 3x what it would be today.
*Emotional Shift:* From "daydreaming about someone putting a cheque in my hand so I can walk away" to "I could sell this, but I don't want to."

### Value Analysis - The Uncomfortable Truth

⚠️ **CRITICAL: Your revenue grew 47% but your profit dropped 62%.**

| Metric | Jan 2024 | Jan 2025 | Change |
|--------|----------|----------|--------|
| Revenue | £147,458 | £217,351 | +47% |
| Gross Margin | 47.3% | 36.7% | -10.6pp |
| Operating Profit | £40,023 | £15,021 | **-62%** |

Your subcontractor costs nearly doubled (£32k → £70k) while revenue only grew 47%. Before hiring anyone else, you need to understand: are you paying too much for subs, underpricing jobs, or both?

**The £136,250 opportunity is real—but only if you fix the margin leak first. Otherwise you're just scaling a problem.**

**Immediate Action:** Week 1-2 of your sprint includes a financial review with Keely. This isn't optional.

---

*That's* what we're building. Let's make it happen.



