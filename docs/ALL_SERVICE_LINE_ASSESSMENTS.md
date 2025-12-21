# Complete Service Line Assessment Patterns

This document provides a comprehensive overview of all assessment patterns, stages, questions, and response options for each live service line.

---

## 1. Destination Discovery

**Status:** Live  
**Type:** Single-stage assessment  
**Purpose:** Initial discovery to understand client goals and recommend services

### Assessment Structure

**Single Stage:** Discovery Assessment

#### Questions

**Note:** Destination Discovery uses a general discovery assessment format. The exact questions are managed through the `discovery_assessments` table and may vary, but typically include:

1. **Business Goals & Vision**
   - What are your primary business goals?
   - What does success look like for you?
   - What challenges are you facing?

2. **Service Needs**
   - Which areas do you need support with?
   - What services are you most interested in?

3. **Current State**
   - How would you describe your current financial/operational state?
   - What systems or processes are you using?

**Response Format:** Free text and multi-select options  
**Storage:** `discovery_assessments` table with JSONB `responses` field

---

## 2. Goal Alignment Programme (365 Alignment)

**Status:** Live  
**Type:** Multi-stage assessment  
**Purpose:** Life-first business transformation with 5-year vision, 6-month shift, and 12-week sprints

### Assessment Structure

**Note:** Goal Alignment uses the Oracle Method Portal assessment structure with multiple parts:

#### Part 1: Initial Assessment (15 Questions)

**Location:** `oracle-method-portal/src/data/assessmentQuestions.ts`

1. **The Tuesday Test**
   - Type: Textarea
   - Question: "Picture a random Tuesday 5 years from now. Walk me through your ideal day from waking up to going to bed. Be specific - what time do you wake up? What do you NOT do anymore?"

2. **The Money Truth**
   - Type: Multi-part
   - Part A: What is your current personal take-home salary/pay per month?
   - Part B: What personal monthly income would make you feel genuinely secure and free?

3. **The Business Reality**
   - Type: Multi-part
   - Part A: What is your current annual business turnover/revenue?
   - Part B: What annual turnover do you think would enable you to live the life you want?

4. **The Emergency Log**
   - Type: Textarea
   - Question: "Think about the last month. List the 'emergencies' that pulled you away from important work (the 2am calls, the 'only you can fix this' moments)"

5. **The Relationship Mirror**
   - Type: Textarea
   - Question: "Complete this sentence: 'My business relationship feels like...' (a bad marriage I can't leave? a needy child? a puzzle I'm solving? something else?)"

6. **The Sacrifice List**
   - Type: Textarea
   - Question: "What have you given up or sacrificed for this business?"

7. **Skills Confession**
   - Type: Textarea
   - Question: "What's your biggest weakness or skill gap?"

8. **90-Day Fantasy**
   - Type: Textarea
   - Question: "If you could wave a magic wand, what would the next 90 days look like?"

9. **Danger Zone**
   - Type: Textarea
   - Question: "What's the biggest risk to your business right now?"

10. **Growth Trap**
    - Type: Textarea
    - Question: "What's blocking your growth?"

11. **Commitment Hours**
    - Type: Number
    - Question: "How many hours per week can you commit to working on the business (not in it)?"

**Additional questions** (12-15) cover various aspects of business vision and goals.

#### Part 2: Deep Dive Assessment (55+ Questions)

**Location:** `oracle-method-portal/src/data/part2Questions.ts`

**12 Sections:**

1. **Leadership & Vision Reality** (9 questions)
2. **Money Truth** (7 questions)
3. **Customer & Market Reality** (6 questions)
4. **Execution Engine** (8 questions)
5. **People & Culture** (3 questions)
6. **Tech & Data** (4 questions)
7. **Product & Customer Value** (6 questions)
8. **Risk & Compliance** (5 questions)
9. **Supply Chain & Partnerships** (2 questions)
10. **Market Position & Growth** (2 questions)
11. **Integration & Bottlenecks** (3 questions)
12. **External Support & Advisory Network** (additional questions)

**Response Format:** Mix of text, number, select, multi-select, and textarea fields

---

## 3. Management Accounts

**Status:** Live  
**Type:** Assessment-based service  
**Purpose:** Monthly financial visibility with P&L, Balance Sheet, KPIs and Cash Flow analysis

### Assessment Structure

**Note:** Management Accounts uses an assessment format to gather client context and goals. The assessment questions are stored in the `ma_assessment_responses` table.

#### Assessment Questions

**Typical questions include:**

1. **Financial Goals**
   - What are your key financial goals?
   - What metrics matter most to you?

2. **Reporting Needs**
   - What reports do you need?
   - How often do you need updates?

3. **Current State**
   - How are you currently tracking finances?
   - What challenges are you facing?

**Response Format:** Free text and structured responses  
**Storage:** `ma_assessment_responses` table

**Note:** Management Accounts also includes document upload functionality for financial statements and other documents.

---

## 4. Systems Audit

**Status:** Live  
**Type:** Three-stage assessment  
**Purpose:** Identify and fix operational bottlenecks, integrate systems, eliminate manual workarounds

### Stage 1: Discovery Assessment (19 Questions)

**Location:** `apps/platform/src/config/assessments/systems-audit-discovery.ts`

#### Section 1: Current Pain (3 questions)

**Q1.1: What broke – or is about to break – that made you think about systems?**
- **Type:** Free text
- **Character Limit:** 400
- **Placeholder:** Be specific – the incident, the near-miss, the frustration that tipped you over...
- **AI Anchor:** Yes (`systems_breaking_point`)
- **Required:** Yes

**Q1.2: How would you describe your current operations?**
- **Type:** Single choice
- **Options:**
  - Controlled chaos – it works but I can't explain how
  - Manual heroics – we survive on people's goodwill
  - Death by spreadsheet – everything's tracked but nothing connects
  - Tech Frankenstein – we've bolted tools together over years
  - Actually pretty good – we just need optimisation
- **Required:** Yes

**Q1.3: If I followed you through a typical month-end, what would embarrass you most?**
- **Type:** Free text
- **Character Limit:** 300
- **Placeholder:** The workaround you're ashamed of, the process you'd never show an investor...
- **AI Anchor:** Yes (`month_end_shame`)
- **Required:** Yes

#### Section 2: Impact Quantification (5 questions)

**Q2.1: How many hours per month do you estimate your team spends on manual data entry, reconciliation, or "making things match"?**
- **Type:** Single choice
- **Options:**
  - Under 10 hours
  - 10-20 hours
  - 20-40 hours
  - 40-80 hours
  - More than 80 hours
- **Required:** Yes

**Q2.2: How long does your month-end close currently take?**
- **Type:** Single choice
- **Options:**
  - 1-2 days
  - 3-5 days
  - 1-2 weeks
  - 2-4 weeks
  - We don't really "close" – it's ongoing
- **Required:** Yes

**Q2.3: In the last year, how many times have you discovered data errors that affected a business decision?**
- **Type:** Single choice
- **Options:**
  - Never – our data is solid
  - Once or twice – minor issues
  - Several times – some costly
  - Regularly – I don't fully trust our numbers
  - I don't know – which is the scary part
- **Required:** Yes

**Q2.4: What's the most expensive mistake caused by a systems/process gap in the last 2 years?**
- **Type:** Free text
- **Character Limit:** 300
- **Placeholder:** Lost client, tax penalty, missed opportunity, overpayment...
- **AI Anchor:** Yes (`expensive_systems_mistake`)
- **Required:** Yes

**Q2.5: How many times last month did someone ask for information and you couldn't get it within 5 minutes?**
- **Type:** Single choice
- **Options:**
  - Never
  - 1-2 times
  - Weekly
  - Daily
  - Constantly
- **Required:** Yes

#### Section 3: Tech Stack (3 questions)

**Q3.1: Which software tools does your business use? (Select all that apply)**
- **Type:** Multiple choice
- **Options:**
  - Xero / QuickBooks / Sage (Accounting)
  - HubSpot / Salesforce / Pipedrive (CRM)
  - Asana / Trello / Monday (Projects)
  - Slack / Teams (Communication)
  - Stripe / GoCardless (Payments)
  - Google Workspace (Email, Docs)
  - Microsoft 365
  - BreatheHR / CharlieHR (HR)
  - Dext / Receipt Bank (Expenses)
  - Other (we'll capture in Stage 2)
- **Required:** Yes

**Q3.2: How would you rate the integration between these systems?**
- **Type:** Single choice
- **Options:**
  - Seamless – data flows automatically
  - Partial – some connected, some manual
  - Minimal – mostly manual transfers
  - Non-existent – each system is an island
- **Required:** Yes

**Q3.3: How many spreadsheets are "critical" to running your business? (Be honest)**
- **Type:** Single choice
- **Options:**
  - None – everything's in proper systems
  - 1-3 key spreadsheets
  - 4-10 spreadsheets
  - 10-20 spreadsheets
  - I've lost count
- **Required:** Yes

#### Section 4: Focus Areas (2 questions)

**Q4.1: Which areas feel most broken right now? (Select top 3)**
- **Type:** Multiple choice (Max 3 selections)
- **Options:** (Grouped by category)
  - **Finance & Reporting:**
    - Financial reporting / management accounts
    - Month-end close process
    - Cash flow visibility
    - Budgeting & forecasting
  - **Revenue & Cash:**
    - Invoicing & billing
    - Payment collection / debtor chasing
    - Quoting & proposals
    - Contract management
  - **Spending:**
    - Accounts payable (paying suppliers)
    - Expense management
    - Purchase approvals
    - Supplier management
  - **People:**
    - Payroll processing
    - Holiday & absence management
    - Time tracking
    - Onboarding & offboarding
    - Expense claims
  - **Operations:**
    - Project management
    - Resource planning & capacity
    - Client communication
    - Inventory / stock management
  - **Sales & Marketing:**
    - Lead management
    - CRM & pipeline
    - Marketing tracking
    - Client onboarding
  - **Compliance:**
    - VAT / tax filings
    - Statutory compliance
    - Document management
    - General admin burden
- **Required:** Yes

**Q4.2: If you could fix ONE process by magic, which would have the biggest impact?**
- **Type:** Free text
- **Character Limit:** 300
- **Placeholder:** Describe the process and why fixing it would matter...
- **AI Anchor:** Yes (`magic_process_fix`)
- **Required:** Yes

#### Section 5: Readiness (3 questions)

**Q5.1: What's your appetite for change right now?**
- **Type:** Single choice
- **Options:**
  - Urgent – we need to fix this yesterday
  - Ready – we've budgeted time and money for this
  - Cautious – we want to improve but can't afford disruption
  - Exploring – just want to understand options
- **Required:** Yes

**Q5.2: What's your biggest fear about tackling systems?**
- **Type:** Multiple choice
- **Options:**
  - Cost will spiral out of control
  - Implementation will disrupt operations
  - We'll invest and it won't work
  - Team won't adopt new processes
  - We'll become dependent on consultants
  - It's too complex to know where to start
  - No major fears – just want to get on with it
- **AI Anchor:** Yes (`systems_fears`)
- **Required:** Yes

**Q5.3: Who internally would champion this project?**
- **Type:** Single choice
- **Options:**
  - Me – the founder/owner
  - Finance manager/FD
  - Operations manager
  - Office manager
  - IT lead
  - Other
- **Required:** Yes

#### Section 6: Context (4 questions)

**Q6.1: How many people work in your business currently?**
- **Type:** Number
- **Min:** 1
- **Max:** 1000
- **Required:** Yes

**Q6.2: How many people do you expect in 12 months?**
- **Type:** Number
- **Min:** 1
- **Max:** 2000
- **Required:** Yes

**Q6.3: What's your annual revenue band?**
- **Type:** Single choice
- **Options:**
  - Under £250k
  - £250k - £500k
  - £500k - £1m
  - £1m - £2m
  - £2m - £5m
  - £5m - £10m
  - £10m+
- **Required:** Yes

**Q6.4: What industry are you in?**
- **Type:** Free text
- **Character Limit:** 100
- **Placeholder:** e.g., Professional services, Manufacturing, Retail, Tech...
- **Required:** Yes

**Storage:** `sa_discovery_responses` table (single row per engagement with all responses as columns)

---

### Stage 2: System Inventory

**Type:** Card-based data collection (not traditional Q&A)  
**Purpose:** Detailed inventory of all systems and tools

#### System Card Fields (per system)

**Basic Information:**
- System name (text)
- Category (select from predefined categories)
- Sub-category (text)
- Vendor (text)
- Website URL (text)

**Usage Details:**
- Primary users (multi-select: Owner, Finance, Operations, Sales, HR, Admin, Everyone)
- Number of users (number)
- Usage frequency (select: Daily, Weekly, Monthly, Rarely)
- Criticality (select: Critical, Important, Nice to have)

**Cost Information:**
- Pricing model (select: Monthly, Annual, Per user, One-time, Free)
- Monthly cost (number)
- Annual cost (number)
- Cost trend (select: Increasing, Stable, Decreasing, Don't know)

**Integration:**
- Integrates with (multi-select: other system names)
- Integration method (select: Native, Zapier/Make, Custom API, Manual, None)
- Manual transfer required (yes/no)
- Manual hours per month (number)
- Manual process description (text)

**Data Quality:**
- Data quality score (1-5)
- Data entry method (select: Single point, Duplicated, Don't know)

**Satisfaction:**
- User satisfaction (1-5)
- Fit for purpose (1-5)
- Would recommend (select: Yes, Maybe, No)

**Pain Points:**
- Known issues (text)
- Workarounds in use (text)
- Change one thing (text)

**Future Plans:**
- Future plan (select: Keep, Replace, Upgrade, Unsure)
- Replacement candidate (text)
- Contract end date (date)

**Storage:** `sa_system_inventory` table (one row per system)

---

### Stage 3: Process Deep Dives (6 Process Chains)

**Location:** `apps/platform/src/config/assessments/process-deep-dives.ts`

**Type:** Consultant-led deep dives into key process chains  
**Purpose:** Detailed understanding of end-to-end processes

#### Chain 1: Quote-to-Cash (Revenue)
**Description:** From lead to cash collected  
**Estimated Duration:** 15 minutes

**Section: Quoting & Proposals**
- Q1.1: How do you currently create quotes/proposals? (Select)
- Q1.2: Who is authorised to send quotes? (Text, AI Anchor)
- Q1.3: How long does it take to produce a typical quote? (Number, minutes)
- Q1.4: Do you have standard pricing or is everything custom? (Select)
- Q1.5: How do you track quote status? (Text)
- Q1.6: What's your quote-to-win conversion rate? (Number, %)
- Q1.7: Biggest frustration with the quoting process? (Text, AI Anchor)

**Section: Invoicing**
- Q2.1: Who raises invoices? (Text)
- Q2.2: What triggers an invoice? (Multi-select)
- Q2.3: How are invoices created? (Select)
- Q2.4: Who approves invoices before sending? (Text)
- Q2.5: How are invoices sent? (Multi-select)
- Q2.6: How long from work complete to invoice sent? (Number, days)
- Q2.7: How many invoices per month? (Number)
- Q2.8: Biggest frustration with invoicing? (Text, AI Anchor)

**Section: Payment Collection**
- Q3.1: Standard payment terms? (Select)
- Q3.2: What payment methods do you accept? (Multi-select)
- Q3.3: Do you use automated payment reminders? (Select)
- Q3.4: Who chases overdue invoices? (Text)
- Q3.5: At what age (days overdue) do you escalate? (Number)
- Q3.6: Do you use debt collection services? (Select)
- Q3.7: Bad debt write-off policy? (Text)
- Q3.8: Current debtor days? (Number)
- Q3.9: Biggest frustration with getting paid? (Text, AI Anchor)

#### Chain 2: Procure-to-Pay (Spending)
**Description:** From need to payment  
**Estimated Duration:** 15 minutes

**Section: Purchasing & Approval**
- Q1.1: Who can commit business spend? (Text, AI Anchor)
- Q1.2: Are there approval limits? (Text)
- Q1.3: Do you raise purchase orders? (Select)
- Q1.4: How are POs created and tracked? (Text)
- Q1.5: How do you track what's been ordered vs received? (Text)
- Q1.6: Biggest frustration with buying things? (Text, AI Anchor)

**Section: Supplier Invoices**
- Q2.1: How do supplier invoices arrive? (Multi-select)
- Q2.2: Who processes supplier invoices? (Text)
- Q2.3: Do you match invoices to POs/delivery notes? (Select)
- Q2.4: Where are invoices stored/filed? (Text)
- Q2.5: How do you handle queries with suppliers? (Text)
- Q2.6: Invoices processed per month? (Number)
- Q2.7: Biggest frustration with supplier invoices? (Text, AI Anchor)

**Section: Payments**
- Q3.1: How often do you run payment runs? (Select)
- Q3.2: Who authorises payments? (Text)
- Q3.3: How are payments made? (Multi-select)
- Q3.4: Do you take advantage of early payment discounts? (Select)
- Q3.5: Biggest frustration with paying suppliers? (Text, AI Anchor)

#### Chain 3: Hire-to-Retire (People)
**Description:** Full employee lifecycle  
**Estimated Duration:** 20 minutes

**Section: Time & Attendance**
- Q1.1: How do staff record hours worked? (Select)
- Q1.2: Is time tracked to projects/clients? (Select)
- Q1.3: Who reviews/approves timesheets? (Text)
- Q1.4: How is overtime calculated and approved? (Text)
- Q1.5: Biggest frustration with time tracking? (Text, AI Anchor)

**Section: Holiday & Absence**
- Q2.1: How do staff request holiday? (Select)
- Q2.2: Who approves holiday? (Text)
- Q2.3: How do you track remaining entitlement? (Text)
- Q2.4: How is sickness absence recorded? (Text)
- Q2.5: Do you track absence patterns? (Select)
- Q2.6: Biggest frustration with leave management? (Text, AI Anchor)

**Section: Expense Claims**
- Q3.1: How do staff submit expenses? (Select)
- Q3.2: How are receipts captured? (Text)
- Q3.3: Who approves expenses? (Text)
- Q3.4: How quickly are staff reimbursed? (Select)
- Q3.5: Is there a documented expense policy? (Select)
- Q3.6: Biggest frustration with expenses? (Text, AI Anchor)

**Section: Payroll Processing**
- Q4.1: Who prepares payroll each month? (Text)
- Q4.2: What inputs are needed? (Text)
- Q4.3: Payroll cut-off date? (Text)
- Q4.4: Who reviews before processing? (Text)
- Q4.5: How are payslips distributed? (Select)
- Q4.6: How are staff paid? (Select)
- Q4.7: HMRC payment - manual or DD? (Select)
- Q4.8: Pension submissions - automated? (Select)
- Q4.9: Number of employees on payroll? (Number)
- Q4.10: Biggest frustration with payroll? (Text, AI Anchor)

#### Chain 4: Record-to-Report (Finance)
**Description:** From transaction to insight  
**Estimated Duration:** 15 minutes

**Section: Transaction Processing**
- Q1.1: Who enters transactions into the accounting system? (Text)
- Q1.2: How are transactions coded? (Select)
- Q1.3: Do you use tracking categories/classes? (Select)
- Q1.4: How often is bank reconciliation done? (Select)
- Q1.5: Who does bank reconciliation? (Text)
- Q1.6: Average transactions per month? (Number)
- Q1.7: Biggest frustration with day-to-day bookkeeping? (Text, AI Anchor)

**Section: Month-End**
- Q2.1: Do you have a documented month-end checklist? (Select)
- Q2.2: How do you handle accruals and prepayments? (Text)
- Q2.3: Standard journals - templated or recreated each month? (Select)
- Q2.4: Who reviews before close? (Text)
- Q2.5: How long does month-end take currently? (Number, working days)
- Q2.6: What's the target? (Number, working days)
- Q2.7: Biggest frustration with month-end? (Text, AI Anchor)

**Section: Reporting**
- Q3.1: Who prepares management accounts? (Text)
- Q3.2: What reports are produced? (Multi-select)
- Q3.3: Who receives management reports? (Text)
- Q3.4: How are reports delivered? (Select)
- Q3.5: Do you have a board pack? What's in it? (Text)
- Q3.6: How many working days from month-end to reports delivered? (Number)
- Q3.7: Do you compare to budget? (Select)
- Q3.8: Biggest frustration with reporting? (Text, AI Anchor)

#### Chain 5: Lead-to-Client (Sales & Marketing)
**Description:** From stranger to customer  
**Estimated Duration:** 15 minutes

**Section: Lead Management**
- Q1.1: Where do most leads come from? (Multi-select)
- Q1.2: How are leads captured? (Text)
- Q1.3: Where do leads go first? (Select)
- Q1.4: Who qualifies leads? (Text)
- Q1.5: What makes a lead "qualified"? (Text)
- Q1.6: How quickly are leads followed up? (Select)
- Q1.7: Biggest frustration with lead management? (Text, AI Anchor)

**Section: Pipeline & CRM**
- Q2.1: Do you have defined sales stages? (Select)
- Q2.2: How is pipeline tracked? (Text)
- Q2.3: Do you forecast revenue? How? (Text)
- Q2.4: CRM data quality rating? (Number, 1-5)
- Q2.5: Biggest frustration with CRM? (Text, AI Anchor)

**Section: Client Onboarding**
- Q3.1: What happens when a deal is won? (Text)
- Q3.2: How is the client set up? (Text)
- Q3.3: Who owns client onboarding? (Text)
- Q3.4: Do you have a standard onboarding checklist? (Select)
- Q3.5: How long does onboarding typically take? (Text)
- Q3.6: Handoff from sales to delivery - how does it work? (Text)
- Q3.7: Biggest frustration with client onboarding? (Text, AI Anchor)

#### Chain 6: Comply-to-Confirm (Regulatory)
**Description:** From requirement to filed  
**Estimated Duration:** 10 minutes

**Section: Compliance Management**
- Q1.1: What compliance filings do you handle? (Multi-select)
- Q1.2: How do you track compliance deadlines? (Select)
- Q1.3: Who is responsible for each filing? (Text)
- Q1.4: Where does the data come from for filings? (Text)
- Q1.5: Do you use automated MTD submissions? (Select)
- Q1.6: Have you ever missed a compliance deadline? (Select)
- Q1.7: Biggest frustration with compliance? (Text, AI Anchor)

**Storage:** `sa_process_deep_dives` table (one row per process chain with JSONB `responses` field containing all question-answer pairs)

---

## 5. Hidden Value Audit

**Status:** Live  
**Type:** Assessment-based service  
**Purpose:** Identify hidden assets, risks, and opportunities to maximize business value

### Assessment Structure

**Note:** Hidden Value Audit uses an assessment format similar to Goal Alignment, potentially leveraging the Oracle Method Portal's Part 3 questions structure.

#### Assessment Questions

**Typical questions include:**

1. **Intellectual Capital**
   - Which critical processes exist only in your head?
   - What unique methods give you an edge?
   - How are these methods protected?

2. **Asset Identification**
   - What valuable knowledge walks out the door every night?
   - What assets are underutilized?
   - What opportunities exist for value creation?

3. **Risk Assessment**
   - What risks threaten your business value?
   - What dependencies exist?
   - What would happen if key people left?

**Response Format:** Mix of checkbox, textarea, select, and number fields  
**Storage:** Assessment responses stored in service-specific tables

**Note:** Hidden Value Audit may use the Oracle Method Portal's Part 3 questions structure (`oracle-method-portal/src/data/part3Questions.ts`) which includes sections on Intellectual Capital, Customer Capital, Human Capital, and more.

---

## Summary

| Service Line | Stages | Total Questions | Assessment Type |
|-------------|--------|------------------|-----------------|
| Destination Discovery | 1 | Variable | Discovery assessment |
| Goal Alignment Programme | 2+ | 70+ | Multi-part assessment (Part 1: 15, Part 2: 55+) |
| Management Accounts | 1 | Variable | Assessment + document upload |
| Systems Audit | 3 | 19 + System cards + 100+ | Stage 1: 19 questions, Stage 2: System inventory cards, Stage 3: 6 process chains |
| Hidden Value Audit | 1 | Variable | Assessment (potentially Part 3 structure) |

**Note:** Response options and exact question wording may vary. This document reflects the structure and patterns as defined in the codebase configuration files.

