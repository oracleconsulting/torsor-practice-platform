# Anti-AI-Slop Style Guide

**Purpose:** Make our AI-generated outputs sound human, direct, and valuable—not like corporate potato mush.

This guide should be referenced in ALL LLM prompts that generate client-facing content.

---

## The Core Problem

AI writing has tells. When readers encounter them, trust evaporates. The writing feels manufactured, hollow, corporate. Like it was written by a committee in a lift.

Our clients pay for insight. They deserve prose that sounds like it came from someone who gives a damn.

---

## VOCABULARY BLACKLIST

These words are AI red flags. Use alternatives or rephrase entirely.

### Tier 1: Instant Tells (NEVER USE)
| Banned | Why | Use Instead |
|--------|-----|-------------|
| Additionally | AI loves starting sentences with this | Also, And, [Just continue the thought] |
| Delve/delving | ChatGPT trademark | Look at, Examine, Dig into |
| Crucial/pivotal/vital | Puffery words | Important, Matters, [Show don't tell] |
| Testament to | Empty emphasis | Shows, Proves, [Cut it] |
| Underscores/highlights | Weasel attribution | Shows, Makes clear |
| Showcases | Marketing speak | Shows, Demonstrates |
| Fostering | Corporate nonsense | Building, Creating |
| Garnered | Nobody talks like this | Got, Received, Won |
| Tapestry (figurative) | AI loves this metaphor | [Just describe the thing] |
| Landscape (figurative) | "The regulatory landscape" | Regulations, Environment, Scene |
| Intricate/intricacies | Fake sophistication | Complex, Details |
| Vibrant | Travel brochure energy | [Be specific instead] |
| Enduring | Puffery | Lasting, [Cut if unnecessary] |
| Synergy | Kill it with fire | Working together, Combined |
| Leverage (verb) | Unless you're lifting a piano | Use, Take advantage of |
| Value-add | Nobody knows what you do | [Say what you actually do] |
| Circle back | Verbal reversing | Follow up, Return to |
| Disrupt | You're not. You're sending emails | Change, Improve, Challenge |
| Ecosystem | This isn't a pond | System, Network, Environment |
| Scalable | Funnel-speak | Can grow, Works at any size |

### Tier 2: Often Problematic (Use Sparingly)
| Word | Problem | Context Where OK |
|------|---------|-----------------|
| Key | Overused as adjective | "The key to the door" ✓ / "Key insight" ✗ |
| Significant | Vague puffery | When citing actual statistics |
| Enhance | Corporate-speak | Technical contexts only |
| Impactful | Not a word real humans use | Effective, Powerful |
| Streamline | Consultant cliché | Simplify, Speed up |
| Optimize | Fine in technical contexts | Improve, Make better |
| Holistic | Meaningless in practice | Whole, Complete, Full picture |

### Tier 3: Structural Red Flags
| Pattern | Problem | Fix |
|---------|---------|-----|
| "It's important to note that..." | Didactic padding | Just say the thing |
| "In summary..." / "In conclusion..." | Academic padding | Don't summarize—end |
| "Not only X, but also Y" | Forced parallelism | Pick X or Y. Say one well |
| "While X, it's worth noting Y" | Hedging | Commit to a point |
| "That said," / "Having said that" | Verbal backpedaling | Contrast directly |
| Rule of three lists | "X, Y, and Z" | Pick the best one. Say it well |
| "What's more," | Fake escalation | And, Also |

---

## SENTENCE-LEVEL RULES

### 1. Kill the Parallelisms
**BAD:** "Not only does this improve efficiency, but it also enhances team collaboration and fosters a culture of continuous improvement."

**GOOD:** "This saves time. Your team stops firefighting."

### 2. No Superficial Analysis
**BAD:** "This approach ensures operational excellence while fostering sustainable growth, underscoring the importance of strategic alignment in today's competitive landscape."

**GOOD:** "This fixes the bottleneck. You ship faster."

### 3. Stop Explaining Significance
**BAD:** "The cash flow visibility provided by management accounts plays a pivotal role in enabling informed decision-making, which is crucial for businesses at this stage of growth."

**GOOD:** "You'll see where the money goes. You'll make better bets."

### 4. Don't Announce What You're About to Do
**BAD:** "In this section, we will explore the key challenges facing your operations and outline a strategic roadmap for addressing them."

**GOOD:** [Just start exploring the challenges]

### 5. Cut the Travel Agent Preamble
**BAD:** "What you've described—the freedom to do the school run, the business running without you—is not just achievable, it's what this entire journey is designed to deliver."

**GOOD:** "School runs. A business that runs. That's where this goes."

---

## PARAGRAPH-LEVEL RULES

### 1. No "Challenges and Future Prospects" Structure
This is the telltale formula: "Despite its X, [subject] faces challenges including Y. However, with Z, [subject] is well-positioned for future growth."

Kill it. If there are challenges, say them. If there's opportunity, say it. Don't structure it like a Wikipedia section.

### 2. Don't Overpromise Significance
**BAD:** "This transformation represents a pivotal moment in your business journey, laying the foundations for sustainable growth while ensuring operational resilience in an ever-evolving market landscape."

**GOOD:** "This fixes the chaos. Then you can grow."

### 3. One Point Per Paragraph
AI loves jamming multiple ideas into paragraphs to seem comprehensive. Humans read better when each paragraph does one job.

### 4. End on Concrete, Not Abstract
**BAD:** "...demonstrating the enduring value of strategic advisory partnerships in navigating complex business transitions."

**GOOD:** "...so you get home before the kids go to bed."

---

## TONE GUIDE

### Sound Like This:
- Direct but not curt
- Confident but not arrogant
- Knowledgeable but not lecturing
- Warm but not sycophantic
- Urgent but not panicked

### Not Like This:
- Corporate annual report
- University dissertation
- Self-help book
- Sales brochure
- LinkedIn post

### The Test
Read your sentence aloud. If it sounds like something a human would say to a friend over coffee, keep it. If it sounds like something you'd read at an all-hands meeting, rewrite it.

---

## SPECIFIC FIXES FOR COMMON SECTIONS

### Executive Summaries
**BAD Pattern:**
"[Company] faces significant challenges in [area], which present opportunities for transformative improvement. By implementing strategic solutions across financial visibility, operational efficiency, and team alignment, [Company] can position itself for sustainable growth while maintaining its competitive edge in an evolving market landscape."

**GOOD Pattern:**
"You know the numbers are wrong. You said it yourself: '[their quote]'. Here's what that's costing you, and here's how to fix it."

### Gap Analysis
**BAD Pattern:**
"A critical gap exists in financial reporting infrastructure, underscoring the need for enhanced visibility systems. This gap impacts strategic decision-making capabilities and limits the organization's ability to respond to market opportunities in a timely manner."

**GOOD Pattern:**
"Your month-end takes 3 weeks. By the time you see the numbers, they're history. That's why you're guessing."

### Recommendations
**BAD Pattern:**
"We recommend implementing a comprehensive Management Accounts solution, which will provide enhanced financial visibility and support data-driven decision-making across all organizational levels."

**GOOD Pattern:**
"Management Accounts. £650/month. You'll have numbers you trust by month 2."

### Closings
**BAD Pattern:**
"This comprehensive analysis demonstrates the significant opportunity for transformational growth. By addressing the identified gaps and implementing the recommended solutions, [Company] can achieve its stated objectives while building a sustainable foundation for future success."

**GOOD Pattern:**
"The gap isn't capability. It's infrastructure. £13,300 starts that journey. Let's talk this week."

---

## FORMATTING RULES

### 1. Sentence Case for Headings
Write "Gap analysis" not "Gap Analysis"

### 2. No Inline Bold for Emphasis
If something needs emphasis, write it better. Don't **bold random words** for impact.

### 3. One List, Then Move On
AI loves nested bullet lists. Use one level. Then use prose.

### 4. No Em-Dash Abuse
Em dashes are fine. Using three per paragraph—to insert clauses—like this—is AI behavior.

### 5. Straight Quotes
Use "these" not "these"

---

## THE HUMAN CHECK

Before finalizing output, verify:

1. **Would I say this to their face?** If it sounds too formal for a conversation, rewrite it.

2. **Does every paragraph have their words in it?** Not paraphrased. Quoted. If you can't quote them, you're not listening.

3. **Does it sound like me?** Every practice has a voice. The output should sound like that voice, not like Generic Advisory Firm #847.

4. **Did I say anything twice?** AI loves restating. Say it once. Say it well.

5. **Is the last sentence the strongest?** End on concrete, not abstract. End on what they get, not what we recommend.

---

## PROMPT INTEGRATION

When building prompts, include this block:

```
## WRITING STYLE - ANTI-AI-SLOP RULES

BANNED WORDS (never use): Additionally, delve, crucial, pivotal, testament, underscores, highlights, showcases, fostering, garnered, tapestry, landscape, intricate, vibrant, enduring, synergy, leverage (verb), value-add, circle back, disrupt, ecosystem, scalable

BANNED STRUCTURES:
- "Not only X but also Y" parallelisms
- "It's important to note that..."
- "In summary..." / "In conclusion..."
- "While X, it's worth noting Y"
- Rule of three lists (pick the best one)
- "Despite its X, faces challenges Y" formula
- Announcements of what you're about to say

REQUIRED:
- Sentence case headings
- One point per paragraph
- Concrete endings (what they get, not what we recommend)
- Client quotes in every section
- Language you'd use in conversation

THE TEST: If it sounds like an annual report, rewrite it. If it sounds like coffee with a smart friend, keep it.
```

---

## VERSION HISTORY

- v1.0 (Jan 2026): Initial guide based on Wikipedia AI detection patterns and internal style preferences

