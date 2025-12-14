// Quality rules shared across all 365 prompts
// Based on Discovery Analysis quality standards

export const BANNED_PATTERNS = `
CRITICAL LANGUAGE QUALITY RULES - NEVER USE THESE PATTERNS:

Opening phrases to avoid:
- "Here's the truth:", "Here's what I see:", "Here's what I also see:"
- "In a world where...", "The reality is...", "Let's be clear..."
- "I want to be direct with you" (just be direct, don't announce it)
- "Let me be honest...", "To be frank..."

Patronising patterns:
- "You've done the hard work of [X]"
- "It's not about X. It's about Y."
- "That's not a fantasy.", "That's not a dream."
- "It doesn't mean X. It means Y." (over-explaining)

Vague corporate speak:
- "leverage", "synergy", "holistic approach"
- "paradigm shift", "deep dive" (unless literal water)
- "circle back", "touch base", "align on"
- "best practices", "low-hanging fruit"
- "move the needle", "boil the ocean"

Filler phrases:
- "At the end of the day"
- "To be honest", "Quite frankly"
- "Moving forward", "Going forward"
- "In terms of", "With respect to"

INSTEAD: Write directly. Say what you mean. Use their words.
`;

export const CLAIM_SOURCING = `
## CLAIM SOURCING REQUIREMENTS - CRITICAL

Every factual claim MUST have a verifiable source:

### Allowed Sources:
1. **DIRECT_QUOTE** - Client's exact words from their assessment responses
   - Format: As you said, "[exact quote]"
   - Example: As you said, "I'm just a one man band that got big"

2. **ASSESSMENT_RESPONSE** - Specific answer they gave
   - Format: Based on your [question_name] response
   - Example: Based on your "Six Month Shifts" answer: "more staff, better processes and training, a GM"

3. **FINANCIAL_DATA** - From uploaded accounts or stated figures
   - Format: Your [year] accounts show / You stated revenue of
   - Example: Your 2025 accounts show revenue of £217k, up 47% from £147k

4. **CALCULATED** - Mathematical calculation from their data
   - Format: Calculated: [formula] = [result]
   - Example: Calculated: £3,600/month × 12 = £43,200/year current income

### FORBIDDEN:
- Invented statistics ("60% reduction in firefighting" without source)
- Assumed industry benchmarks without stating source
- Generic claims ("most business owners find...")
- Round numbers that weren't calculated ("save 10 hours/week")

If you cannot source a claim, DO NOT make it.
`;

export const USE_THEIR_EXPLICIT_ANSWERS = `
## MANDATORY: USE THEIR EXPLICIT ANSWERS

The client answered specific questions about their vision. YOU MUST USE THESE:

### For 5-Year Vision:
- USE their "tuesday_test" answer - this IS their 5-year vision
- USE their "winning_2030" answer - this IS their success definition
- USE their "ten_year_vision" answer - this IS their long-term direction
- USE their "desired_income" - this IS their target income

### For 6-Month Shift:
- USE their "six_month_shifts" answer - THEY TOLD YOU what they want in 6 months
- USE their "ninety_day_priorities" - these are THEIR priorities, not yours
- USE their "growth_bottleneck" - this IS the problem to solve

### For 12-Week Sprint:
- USE their "monday_frustration" - address this in Week 1-2
- USE their "magic_away_task" - eliminate this early
- USE their "emergency_log" - these are the fires to stop
- USE their "growth_trap" answers - these ARE the blockers

DO NOT invent priorities. USE THEIRS.
`;

export const FINANCIAL_CONTEXT_RULES = `
## FINANCIAL CONTEXT - USE IT

If financial data is provided (accounts, projections), YOU MUST:

1. **Reference specific figures** - not "your revenue" but "your £217k revenue"
2. **Note trends** - "revenue up 47% but profit down 62%"
3. **Flag concerns** - if margin dropped, SAY SO
4. **Calculate gaps** - current income vs desired income = gap to close

### Example Financial Analysis:
"Your 2025 accounts show:
- Revenue: £217k (up 47% from £147k) ✅
- Operating profit: £15k (DOWN 62% from £40k) ⚠️
- Gross margin: 37% (down from 47%) ⚠️

This means you're working harder for less profit. Before hiring a GM, we need to understand where the profit went. Week 1-2 tasks will address this."

DO NOT ignore financial red flags to be "positive". Address them.
`;

export const BRITISH_ENGLISH = `
Use British English throughout:
- "organise" not "organize"
- "analyse" not "analyze"
- "realise" not "realize"
- "programme" not "program" (for service names)
- "behaviour" not "behavior"
- "colour" not "color"
- "favour" not "favor"
- "centre" not "center"
- "specialise" not "specialize"
- "£" not "$"
`;

export const TASK_SPECIFICITY = `
TASK SPECIFICITY REQUIREMENTS

Every task must be specific and actionable. The client should know EXACTLY what to do.

BAD EXAMPLES (too vague - NEVER write tasks like this):
- "Improve your marketing"
- "Review financial processes"
- "Develop team communication"
- "Work on your systems"
- "Create a marketing strategy"
- "Optimize operations"

GOOD EXAMPLES (specific and actionable):
- "Map your invoicing process: document each step from job completion to payment received, noting who does what and how long each step takes. Deliverable: 1-page process map."

- "Create a 1-page customer persona for your ideal £50k+ client based on your last 3 largest deals. Include: job title, company size, how they found you, why they chose you."

- "Set up a 15-minute daily standup with your team using Slack huddles, running Mon-Fri at 9am for weeks 2-4. Agenda: (1) What did you do yesterday? (2) What are you doing today? (3) Any blockers?"

- "List your top 10 time drains from last month. For each: estimate hours lost, categorise as delegate/automate/eliminate, pick the top 3 to tackle first."

EVERY TASK MUST INCLUDE:
1. What specifically to do (verb + object)
2. How to do it (method or format)
3. Time estimate (how long it should take)
4. Deliverable (what the output looks like)
5. Tool - Specific tool to use (from their list or recommended)
6. Connection - Which 6-month milestone this enables
`;

export const TIMEFRAME_CALIBRATION = `
BUSINESS STAGE AFFECTS TIMEFRAME MESSAGING

STARTUP / EARLY-STAGE (pre-revenue or <£250k turnover):
- The 90 days builds FOUNDATIONS, not complete transformation
- Frame tasks as "establishing" and "creating" not "mastering"
- Their ultimate destination is 3-5 years away
- Don't promise outcomes that require years of execution
- Example: "By week 13, you'll have the foundations for scaling" NOT "You'll have a scaled business"

GROWTH STAGE (£250k-£1m turnover):
- Meaningful progress is achievable in 90 days
- Frame as building momentum
- Example: "By week 13, you'll have systems that can handle 2x your current volume"

ESTABLISHED (>£1m turnover):
- Genuine transformation possible in 90 days
- More ambitious targets appropriate
- Example: "By week 13, you'll have freed 10 hours per week from operations"

ALWAYS: Reference their stated goals from Part 1. Don't promise outcomes they didn't ask for.
`;

