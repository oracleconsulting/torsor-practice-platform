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
CLAIM SOURCES - every factual claim must come from ONE of these:

1. DIRECT QUOTE from their assessment responses
   - Use their exact words in quotes
   - Example: You said you're "trapped in the salon"

2. CALCULATION you can show working for
   - Show the maths
   - Example: At 60 hours/week and £45/hour, that's £140k opportunity cost

3. INDUSTRY BENCHMARK you can cite
   - State the source
   - Example: Typical salon owner-operators work 50-55 hours (industry average)

4. PATTERN FROM THEIR DATA
   - Be explicit it's a pattern
   - Example: Your responses suggest a pattern of...

NEVER:
- Invent statistics
- Make up quotes they didn't say
- Claim specific figures without basis
- Say "studies show" without a study

If you don't have data, say "based on typical patterns" not fake specifics.
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

