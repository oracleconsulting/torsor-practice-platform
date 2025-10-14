# Leadership Library - Data Collection Guide

## Purpose
This guide helps you extract the right information from each leadership book to integrate them into the automated CPD planner. Use GPT-5 (or similar AI) to analyze each book and populate the CSV template with this structured data.

---

## 📋 CSV COLUMN DEFINITIONS & COLLECTION INSTRUCTIONS

### **BASIC INFORMATION**

#### `book_id`
- Format: Sequential number (001, 002, 003...)
- Keep it simple for database management

#### `book_title`
- Full official title
- Include subtitle if it adds valuable context
- Example: "The Five Dysfunctions of a Team: A Leadership Fable"

#### `author`
- Full name(s)
- Format: "First Last" or "First Last, First Last" for multiple authors

#### `publication_year`
- Year of publication (use most recent edition)
- Helps determine relevance and modernity

#### `cover_image_filename`
- Name of the cover image file you'll upload
- Format: `book_title_author.jpg` (lowercase, underscores for spaces)
- Example: `five_dysfunctions_lencioni.jpg`

---

### **SUMMARIES (Critical for CPD Matching)**

#### `short_summary` (2-3 sentences)
**AI Prompt:** "Provide a compelling 2-3 sentence summary that would make someone want to read this book. Focus on the core problem it solves and the unique value it offers."

Example:
> "Explores why even smart teams struggle to work together and presents a powerful model for overcoming the five common dysfunctions. Through a business fable, Lencioni provides actionable strategies for building trust, embracing healthy conflict, and achieving collective results."

#### `full_summary` (3-5 paragraphs)
**AI Prompt:** "Provide a comprehensive summary covering: 1) What problem/challenge does this book address? 2) What is the author's approach or methodology? 3) What are the main themes and chapters about? 4) Who would benefit most from reading it? 5) What makes this book unique or valuable?"

---

### **TARGET AUDIENCE & ACCESSIBILITY**

#### `target_audience`
**Options:** Partners, Directors, Managers, Team Members, New Advisors, All Levels

**AI Prompt:** "Based on the content complexity, examples used, and prerequisites assumed, who is this book best suited for? Consider experience level, role, and current challenges they face."

#### `estimated_read_time_hours`
- Average reading time for the book
- Use 200-250 words per minute as baseline
- Round to nearest 0.5 hours

#### `difficulty_level`
**Options:** 
- `Beginner` - No prior knowledge required, accessible concepts
- `Intermediate` - Some experience helpful, moderate depth
- `Advanced` - Significant experience required, complex concepts

#### `prerequisite_knowledge`
**AI Prompt:** "What background knowledge or experience would help someone get the most from this book?"

Examples:
- "None - accessible to all"
- "Basic understanding of team dynamics"
- "5+ years in management/leadership role"
- "Experience with client advisory services"
- "Financial/accounting background helpful but not required"

---

### **CATEGORIZATION FOR CPD MATCHING**

#### `primary_category`
**Select ONE primary category:**
- Leadership & Management
- Communication Skills
- Strategic Thinking
- Personal Development
- Client Relationship Management
- Change Management
- Emotional Intelligence
- Team Building & Collaboration
- Innovation & Creativity
- Decision Making
- Business Strategy
- Coaching & Mentoring

#### `secondary_categories`
**Pipe-separated list** of 2-4 additional relevant categories
Format: `Category 1; Category 2; Category 3`

Example: `Communication Skills; Strategic Thinking; Change Management`

---

### **SKILL TAGS (Critical for CPD Automation)**

#### `skill_tags`
**Pipe-separated list** of specific skills addressed in the book.
These map directly to your skills assessment categories!

**AI Prompt:** "List all specific skills that readers would develop or improve by reading and applying concepts from this book. Use skills that would appear in a professional skills assessment."

**Core Advisory & Consulting Skills:**
- Strategic Planning
- Decision Making
- Problem Solving
- Critical Thinking
- Innovation
- Change Management
- Risk Management
- Project Management

**Leadership Skills:**
- Team Building
- Coaching & Mentoring
- Delegation
- Performance Management
- Conflict Resolution
- Motivation & Engagement
- Vision Setting
- Cultural Leadership

**Client Management:**
- Client Relationship Building
- Consultative Selling
- Stakeholder Management
- Presentation Skills
- Business Development

**Communication & Soft Skills:**
- Active Listening
- Emotional Intelligence
- Empathy
- Influence & Persuasion
- Negotiation
- Facilitation
- Feedback Delivery

Format: `Strategic Planning | Team Building | Emotional Intelligence | Conflict Resolution`

---

#### `leadership_competencies`
**AI Prompt:** "What leadership competencies does this book develop? Focus on measurable leadership capabilities."

Examples:
- Self-awareness
- Strategic thinking
- Building high-performing teams
- Leading through change
- Developing others
- Executive presence
- Systems thinking

Format: Same pipe-separated format

---

#### `technical_skills`
Only if the book addresses technical/hard skills. Most leadership books won't have these.

Examples:
- Financial analysis
- Data-driven decision making
- Process optimization
- Technology adoption

---

#### `soft_skills`
**AI Prompt:** "What soft skills/interpersonal skills does this book help develop?"

Examples:
- Resilience
- Adaptability
- Self-regulation
- Empathy
- Collaboration
- Cultural intelligence
- Growth mindset
- Confidence

Format: Pipe-separated

---

#### `behavioral_outcomes`
**AI Prompt:** "What specific behavioral changes or outcomes would you expect to see in someone who reads and applies this book?"

**CRITICAL FOR CPD:** These show the transformation the book enables.

Examples:
- More effective delegation and less micromanagement
- Improved ability to have difficult conversations
- Enhanced strategic decision-making under uncertainty
- Better work-life balance and stress management
- Increased team engagement and morale

Format: Pipe-separated phrases

---

### **CONTENT DEPTH & STRUCTURE**

#### `key_concepts`
**AI Prompt:** "What are the 3-5 most important concepts, ideas, or principles this book teaches? For each, provide a brief 1-2 sentence explanation."

Format: `Concept 1: Explanation | Concept 2: Explanation | Concept 3: Explanation`

Example:
> "Psychological Safety: Creating an environment where team members feel safe to take risks and be vulnerable | Productive Conflict: Encouraging passionate debate about ideas without personal attacks | Commitment: Ensuring genuine buy-in even when not everyone agrees"

---

#### `key_frameworks_models`
**AI Prompt:** "Does this book introduce or use any frameworks, models, tools, or methodologies? Name them and briefly describe what they're for."

Examples:
- "Five Dysfunctions Pyramid: A hierarchical model showing how team issues build on each other"
- "GROW Model: Goal, Reality, Options, Will - for coaching conversations"
- "Eisenhower Matrix: For prioritizing tasks by urgency and importance"

Format: `Framework 1: Description | Model 2: Description`

**Important:** If the book has proprietary frameworks, these become key identifiers for matching to CPD needs!

---

#### `case_studies_examples`
**Boolean + Brief Description**

**AI Prompt:** "Does this book include real-world case studies, examples, or stories? If yes, briefly describe the types/industries covered."

Format: 
- If YES: `TRUE - Technology startups, Professional services firms, Manufacturing examples`
- If NO: `FALSE - Primarily theoretical`

---

#### `practical_exercises`
**Boolean**

**AI Prompt:** "Does this book include worksheets, exercises, self-assessments, or practical tools readers can use?"

Format: `TRUE` or `FALSE`

**CRITICAL FOR CPD:** Books with exercises are more valuable for active learning!

---

### **RECOMMENDATIONS & MATCHING**

#### `recommended_for_roles`
**Comma-separated list** of roles that would benefit most

**Options:**
- Partner
- Director
- Associate Director
- Manager
- Senior Advisor
- Team Member
- New Starter
- All Roles

Example: `Partner, Director, Manager`

---

#### `best_for_scenarios`
**AI Prompt:** "What specific situations, challenges, or scenarios is this book most helpful for? When should someone read this?"

**CRITICAL FOR CPD MATCHING:** This helps match books to current gaps or goals!

Examples:
- "Building a new team or taking over an existing team"
- "Managing organizational change or restructuring"
- "Developing junior advisors and building their confidence"
- "Improving client advisory skills beyond compliance"
- "Transitioning from technical expert to strategic leader"
- "Dealing with team conflict or dysfunction"
- "Strategic business planning for the practice"
- "Personal leadership development for partners"

Format: Pipe-separated scenarios

---

### **LEARNING OUTCOMES & VALUE**

#### `cpd_hours_value`
Estimated CPD hours for reading + applying the book

**Formula:**
- Reading time + 
- Time to complete exercises (if any) + 
- Estimated reflection/application time (usually 25% of reading time)

Example: 
- 8 hours reading + 2 hours exercises + 2 hours reflection = 12 CPD hours

---

#### `learning_objectives`
**AI Prompt:** "If this book was a training course, what would be the 4-6 learning objectives? Format as 'After reading this book, you will be able to...'"

**Format:** Numbered list separated by pipes

Example:
> "1. Master the five essential behaviors of high-performing teams | 2. Diagnose team dysfunction using the assessment model | 3. Facilitate trust-building exercises with your team | 4. Navigate healthy conflict without damaging relationships | 5. Create accountability structures that drive results"

**CRITICAL:** Use action verbs (Master, Apply, Develop, Build, Create, Facilitate, Navigate, etc.)

---

#### `actionable_takeaways`
**AI Prompt:** "What are 4-6 specific actions, tools, or techniques someone could implement immediately after reading this book? Focus on practical, concrete steps."

**Format:** Bullet points separated by pipes

Example:
> "• Implement weekly vulnerability-based trust exercises in team meetings | • Use the 'Two Questions' technique to ensure genuine commitment | • Create a team dashboard to make progress and accountability visible | • Practice the 'Mining for Conflict' technique in strategic discussions"

---

### **CONNECTIONS & METADATA**

#### `related_books`
**AI Prompt:** "What other books complement this one or should be read alongside it? List 2-4 books with similar themes or that build on these concepts."

Format: `Book Title (Author) | Another Book (Author)`

**Use for:** Building reading pathways and CPD learning journeys

---

#### `quotes`
**AI Prompt:** "Extract 2-3 powerful, memorable quotes that capture the essence or key insights of the book."

Format: Pipe-separated quotes

---

#### `isbn`
Standard ISBN-13 format

#### `amazon_link`
Direct link to the book on Amazon

#### `goodreads_rating`
Average rating (helps with quality filtering)

---

## 🤖 RECOMMENDED AI PROMPT STRUCTURE

Use this prompt with GPT-5 to extract all the information:

```
I need you to analyze the book "[BOOK TITLE]" by [AUTHOR] and extract detailed information for integration into an automated CPD (Continuing Professional Development) system for accounting/advisory professionals.

Please provide the following information in a structured format that can be easily converted to CSV:

1. **BASIC INFO**: Title, Author, Publication Year, Reading Time (in hours)

2. **SUMMARIES**:
   - Short summary (2-3 sentences)
   - Full summary (3-5 paragraphs covering: problem solved, approach, main themes, target audience, unique value)

3. **CATEGORIZATION**:
   - Primary category (select ONE from: Leadership & Management, Communication Skills, Strategic Thinking, Personal Development, Client Relationship Management, Change Management, Emotional Intelligence, Team Building, Innovation, Decision Making, Business Strategy, Coaching & Mentoring)
   - Secondary categories (2-4 additional categories)
   - Target audience (Partners, Directors, Managers, Team Members, New Advisors, All Levels)
   - Difficulty level (Beginner/Intermediate/Advanced)
   - Prerequisite knowledge

4. **SKILL DEVELOPMENT**:
   - Specific skill tags (10-15 skills this book develops, using professional skills assessment language)
   - Leadership competencies (5-8 core leadership capabilities)
   - Soft skills (5-10 interpersonal skills)
   - Behavioral outcomes (What will change in someone who reads and applies this?)

5. **KEY CONTENT**:
   - Key concepts (3-5 main ideas with brief explanations)
   - Frameworks/models (Any tools, methodologies, or proprietary frameworks - with descriptions)
   - Case studies included? (YES/NO + brief description of types/industries)
   - Practical exercises included? (YES/NO)

6. **APPLICATION & MATCHING**:
   - Best for scenarios (When should someone read this? What problems does it solve?)
   - Recommended for roles (Partner, Director, Manager, etc.)
   - CPD hours value (reading + application time)
   - Learning objectives (4-6 objectives starting with action verbs)
   - Actionable takeaways (4-6 specific techniques/tools someone can use immediately)

7. **CONNECTIONS**:
   - Related books (2-4 complementary titles)
   - Memorable quotes (2-3 powerful quotes)

Focus especially on information that would help:
- Match this book to someone's skill gaps
- Recommend it for specific development scenarios
- Integrate it into automated CPD planning
- Show tangible learning outcomes and behavioral changes

Format your response so it can be easily converted to CSV format with pipe-separated (|) lists where multiple values exist.
```

---

## 🎯 KEY IDENTIFIERS FOR CPD ALLOCATION

The system will match books to individuals based on:

### **1. SKILL GAP MATCHING**
- `skill_tags` → Matches against skill assessment gaps
- Priority: Skills with largest gap between current and required level

### **2. INTEREST ALIGNMENT**
- `skill_tags` + `leadership_competencies` → Matches against high-interest areas
- Books recommended for skills someone wants to develop (even if already proficient)

### **3. ROLE APPROPRIATENESS**
- `recommended_for_roles` → Filters by user's current role
- `difficulty_level` + `prerequisite_knowledge` → Ensures appropriate challenge level

### **4. SCENARIO MATCHING**
- `best_for_scenarios` → Matches to current challenges or goals
- Example: If setting goal "build high-performing team" → recommend relevant books

### **5. LEARNING PATHWAY BUILDING**
- `prerequisite_knowledge` + `related_books` → Creates progression
- `difficulty_level` → Orders from beginner to advanced

### **6. CPD HOUR PLANNING**
- `cpd_hours_value` → Helps plan annual CPD requirements
- `estimated_read_time_hours` → Fits into available time

### **7. LEARNING STYLE MATCHING** (Future: VARK Integration)
- `practical_exercises` = TRUE → Kinesthetic learners
- `case_studies_examples` = TRUE → Reading/Writing learners
- Framework/model-heavy → Visual learners

---

## 📊 EXAMPLE: How CPD Matching Works

**User Profile:**
- Role: Manager
- Skills Gap: "Conflict Resolution" (Current: 2, Required: 4, Interest: 5)
- Current Goal: "Improve team dynamics"
- Available time: 2 hours/week
- Learning style: Kinesthetic (likes exercises)

**System Logic:**
1. Searches `skill_tags` for "Conflict Resolution"
2. Filters `recommended_for_roles` for "Manager"
3. Matches `best_for_scenarios` for "team dynamics" or "team conflict"
4. Prefers books with `practical_exercises` = TRUE
5. Orders by `difficulty_level` appropriate for current skill level
6. Checks `cpd_hours_value` fits into weekly time budget

**Result:** Recommends "Crucial Conversations" or "Difficult Conversations" with clear rationale:
> "Recommended because: Addresses your Conflict Resolution gap (Current: 2 → Target: 4) | Aligned with your goal: Improve team dynamics | Appropriate for your Manager role | Includes practical exercises (matches your learning style) | 12 CPD hours (~6 weeks at 2 hours/week)"

---

## 🚀 GETTING STARTED

1. **Upload book covers** to `/public/images/leadership-library/` with consistent naming
2. **Process 3-5 books** with the AI prompt to validate the structure
3. **Review and refine** the data format based on what works
4. **Batch process** the remaining 25 books
5. **Import CSV** into the system

The more detailed and accurate your data, the better the CPD recommendations will be!

---

## ✅ QUALITY CHECKLIST

Before finalizing each book entry:

- [ ] Short summary is compelling and clear
- [ ] Skill tags map to your skills assessment categories
- [ ] "Best for scenarios" is specific and practical
- [ ] Learning objectives use action verbs
- [ ] Actionable takeaways are concrete and implementable
- [ ] Behavioral outcomes show clear transformation
- [ ] Related books create learning pathways
- [ ] CPD hours value is realistic
- [ ] All critical fields are populated

---

## 📞 QUESTIONS?

If you need help with any of these fields or want to discuss the structure, just ask!

