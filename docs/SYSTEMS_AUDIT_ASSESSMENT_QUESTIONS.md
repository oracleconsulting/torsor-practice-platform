# Systems Audit Assessment Questions

Complete list of all assessment questions across all three stages of the Systems Audit.

---

## Stage 1: Discovery Assessment (19 Questions)

### Section 1: Current Pain

#### Q1.1: What broke – or is about to break – that made you think about systems?
- **Type:** Text
- **Character Limit:** 400
- **Placeholder:** Be specific – the incident, the near-miss, the frustration that tipped you over...
- **AI Anchor:** Yes (`systems_breaking_point`)
- **Required:** Yes

#### Q1.2: How would you describe your current operations?
- **Type:** Single Select
- **Options:**
  - Controlled chaos – it works but I can't explain how
  - Manual heroics – we survive on people's goodwill
  - Death by spreadsheet – everything's tracked but nothing connects
  - Tech Frankenstein – we've bolted tools together over years
  - Actually pretty good – we just need optimisation
- **Required:** Yes

#### Q1.3: If I followed you through a typical month-end, what would embarrass you most?
- **Type:** Text
- **Character Limit:** 300
- **Placeholder:** The workaround you're ashamed of, the process you'd never show an investor...
- **AI Anchor:** Yes (`month_end_shame`)
- **Required:** Yes

---

### Section 2: Impact Quantification

#### Q2.1: How many hours per month do you estimate your team spends on manual data entry, reconciliation, or "making things match"?
- **Type:** Single Select
- **Options:**
  - Under 10 hours
  - 10-20 hours
  - 20-40 hours
  - 40-80 hours
  - More than 80 hours
- **Required:** Yes

#### Q2.2: How long does your month-end close currently take?
- **Type:** Single Select
- **Options:**
  - 1-2 days
  - 3-5 days
  - 1-2 weeks
  - 2-4 weeks
  - We don't really "close" – it's ongoing
- **Required:** Yes

#### Q2.3: In the last year, how many times have you discovered data errors that affected a business decision?
- **Type:** Single Select
- **Options:**
  - Never – our data is solid
  - Once or twice – minor issues
  - Several times – some costly
  - Regularly – I don't fully trust our numbers
  - I don't know – which is the scary part
- **Required:** Yes

#### Q2.4: What's the most expensive mistake caused by a systems/process gap in the last 2 years?
- **Type:** Text
- **Character Limit:** 300
- **Placeholder:** Lost client, tax penalty, missed opportunity, overpayment...
- **AI Anchor:** Yes (`expensive_systems_mistake`)
- **Required:** Yes

#### Q2.5: How many times last month did someone ask for information and you couldn't get it within 5 minutes?
- **Type:** Single Select
- **Options:**
  - Never
  - 1-2 times
  - Weekly
  - Daily
  - Constantly
- **Required:** Yes

---

### Section 3: Tech Stack

#### Q3.1: Which software tools does your business use? (Select all that apply)
- **Type:** Multi-Select
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

#### Q3.2: How would you rate the integration between these systems?
- **Type:** Single Select
- **Options:**
  - Seamless – data flows automatically
  - Partial – some connected, some manual
  - Minimal – mostly manual transfers
  - Non-existent – each system is an island
- **Required:** Yes

#### Q3.3: How many spreadsheets are "critical" to running your business? (Be honest)
- **Type:** Single Select
- **Options:**
  - None – everything's in proper systems
  - 1-3 key spreadsheets
  - 4-10 spreadsheets
  - 10-20 spreadsheets
  - I've lost count
- **Required:** Yes

---

### Section 4: Focus Areas

#### Q4.1: Which areas feel most broken right now? (Select top 3)
- **Type:** Multi-Select (Max 3)
- **Options:**
  - Financial reporting / management accounts
  - Accounts payable (paying suppliers)
  - Accounts receivable (getting paid)
  - Inventory / stock management
  - Payroll and HR processes
  - Sales / CRM / pipeline tracking
  - Project management and delivery
  - Client onboarding
  - Compliance and documentation
  - IT infrastructure / security
- **Required:** Yes

#### Q4.2: If you could fix ONE process by magic, which would have the biggest impact?
- **Type:** Text
- **Character Limit:** 300
- **Placeholder:** Describe the process and why fixing it would matter...
- **AI Anchor:** Yes (`magic_process_fix`)
- **Required:** Yes

---

### Section 5: Readiness

#### Q5.1: What's your appetite for change right now?
- **Type:** Single Select
- **Options:**
  - Urgent – we need to fix this yesterday
  - Ready – we've budgeted time and money for this
  - Cautious – we want to improve but can't afford disruption
  - Exploring – just want to understand options
- **Required:** Yes

#### Q5.2: What's your biggest fear about tackling systems?
- **Type:** Multi-Select
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

#### Q5.3: Who internally would champion this project?
- **Type:** Single Select
- **Options:**
  - Me – the founder/owner
  - Finance manager/FD
  - Operations manager
  - Office manager
  - IT lead
  - Other
- **Required:** Yes

---

### Section 6: Context

#### Q6.1: How many people work in your business currently?
- **Type:** Text
- **Placeholder:** Enter number
- **Required:** Yes

#### Q6.2: How many people do you expect in 12 months?
- **Type:** Text
- **Placeholder:** Enter number
- **Required:** Yes

#### Q6.3: What's your annual revenue band?
- **Type:** Single Select
- **Options:**
  - Under £250k
  - £250k - £500k
  - £500k - £1m
  - £1m - £2m
  - £2m - £5m
  - £5m - £10m
  - £10m+
- **Required:** Yes

#### Q6.4: What industry are you in?
- **Type:** Text
- **Character Limit:** 100
- **Placeholder:** e.g., Professional services, Manufacturing, Retail, Tech...
- **Required:** Yes

---

## Stage 2: System Inventory

Stage 2 is not a traditional question-based assessment. Instead, clients fill out detailed "system cards" for each software tool/system they use. The following fields are collected for each system:

### Basic Information
- System name
- Category (from predefined categories)
- Sub-category
- Vendor
- Website URL

### Usage Details
- Primary users (multi-select: Owner, Finance, Operations, Sales, HR, Admin, Everyone)
- Number of users
- Usage frequency (Daily, Weekly, Monthly, Rarely)
- Criticality (Critical, Important, Nice to have)

### Cost Information
- Pricing model (Monthly, Annual, Per user, One-time, Free)
- Monthly cost
- Annual cost
- Cost trend (Increasing, Stable, Decreasing, Don't know)

### Integration
- Integrates with (other systems)
- Integration method (Native, Zapier/Make, Custom API, Manual, None)
- Manual transfer required (Yes/No)
- Manual hours per month
- Manual process description

### Data Quality
- Data quality score (1-5)
- Data entry method (Single point, Duplicated, Don't know)

### Satisfaction
- User satisfaction (1-5)
- Fit for purpose (1-5)
- Would recommend (Yes, Maybe, No)

### Pain Points
- Known issues
- Workarounds in use
- Change one thing

### Future Plans
- Future plan (Keep, Replace, Upgrade, Unsure)
- Replacement candidate
- Contract end date

---

## Stage 3: Process Deep Dives (6 Process Chains)

Stage 3 consists of consultant-led deep dives into 6 key process chains. Each chain has detailed questions organized into sections.

---

### Chain 1: Quote-to-Cash (Revenue)
**Description:** From lead to cash collected  
**Estimated Duration:** 15 minutes

#### Section: Quoting & Proposals

**Q1.1: How do you currently create quotes/proposals?**
- **Type:** Select
- **Options:**
  - Dedicated tool (PandaDoc, Qwilr, etc.)
  - Word/Google Doc template
  - PDF template
  - From scratch each time
  - Within accounting software

**Q1.2: Who is authorised to send quotes?**
- **Type:** Text
- **AI Anchor:** Yes

**Q1.3: How long does it take to produce a typical quote? (minutes)**
- **Type:** Number

**Q1.4: Do you have standard pricing or is everything custom?**
- **Type:** Select
- **Options:**
  - Fixed rate card
  - Mostly standard with some customisation
  - Project-based estimates each time
  - Fully custom every time

**Q1.5: How do you track quote status? (Sent, viewed, accepted, rejected)**
- **Type:** Text

**Q1.6: What's your quote-to-win conversion rate? (estimate %)**
- **Type:** Number

**Q1.7: Biggest frustration with the quoting process?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Invoicing

**Q2.1: Who raises invoices?**
- **Type:** Text

**Q2.2: What triggers an invoice?**
- **Type:** Multi-Select
- **Options:**
  - Time-based (end of month)
  - Project milestone
  - Work completion
  - Recurring schedule
  - Manual decision

**Q2.3: How are invoices created?**
- **Type:** Select
- **Options:**
  - In accounting software (Xero, QBO)
  - Word/Excel template
  - Auto-generated from CRM
  - From project management tool

**Q2.4: Who approves invoices before sending?**
- **Type:** Text

**Q2.5: How are invoices sent?**
- **Type:** Multi-Select
- **Options:**
  - Email - manually
  - Email - automated from system
  - Client portal
  - Post

**Q2.6: How long from work complete to invoice sent? (days)**
- **Type:** Number

**Q2.7: How many invoices per month?**
- **Type:** Number

**Q2.8: Biggest frustration with invoicing?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Payment Collection

**Q3.1: Standard payment terms?**
- **Type:** Select
- **Options:**
  - Due on receipt
  - 7 days
  - 14 days
  - 30 days
  - 60 days
  - Varies by client

**Q3.2: What payment methods do you accept?**
- **Type:** Multi-Select
- **Options:**
  - Bank transfer
  - Direct Debit (GoCardless)
  - Card payment
  - Cheque
  - Cash

**Q3.3: Do you use automated payment reminders?**
- **Type:** Select
- **Options:**
  - Yes - fully automated
  - Semi-automated (triggered manually)
  - No - all manual
  - We don't send reminders

**Q3.4: Who chases overdue invoices?**
- **Type:** Text

**Q3.5: At what age (days overdue) do you escalate?**
- **Type:** Number

**Q3.6: Do you use debt collection services?**
- **Type:** Select
- **Options:**
  - Yes - regularly
  - Yes - rarely
  - No

**Q3.7: Bad debt write-off policy? (age/amount threshold)**
- **Type:** Text

**Q3.8: Current debtor days? (if known)**
- **Type:** Number

**Q3.9: Biggest frustration with getting paid?**
- **Type:** Text
- **AI Anchor:** Yes

---

### Chain 2: Procure-to-Pay (Spending)
**Description:** From need to payment  
**Estimated Duration:** 15 minutes

#### Section: Purchasing & Approval

**Q1.1: Who can commit business spend?**
- **Type:** Text
- **AI Anchor:** Yes

**Q1.2: Are there approval limits? (e.g., over £X needs sign-off)**
- **Type:** Text

**Q1.3: Do you raise purchase orders?**
- **Type:** Select
- **Options:**
  - Yes - always
  - Yes - over a certain value
  - Rarely
  - Never

**Q1.4: How are POs created and tracked?**
- **Type:** Text

**Q1.5: How do you track what's been ordered vs received?**
- **Type:** Text

**Q1.6: Biggest frustration with buying things?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Supplier Invoices

**Q2.1: How do supplier invoices arrive?**
- **Type:** Multi-Select
- **Options:**
  - Email
  - Post
  - Supplier portal
  - Via app (Dext, etc.)

**Q2.2: Who processes supplier invoices?**
- **Type:** Text

**Q2.3: Do you match invoices to POs/delivery notes?**
- **Type:** Select
- **Options:**
  - Yes - always
  - Sometimes
  - No

**Q2.4: Where are invoices stored/filed?**
- **Type:** Text

**Q2.5: How do you handle queries with suppliers?**
- **Type:** Text

**Q2.6: Invoices processed per month?**
- **Type:** Number

**Q2.7: Biggest frustration with supplier invoices?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Payments

**Q3.1: How often do you run payment runs?**
- **Type:** Select
- **Options:**
  - Daily
  - Weekly
  - Fortnightly
  - Monthly
  - Ad-hoc

**Q3.2: Who authorises payments?**
- **Type:** Text

**Q3.3: How are payments made?**
- **Type:** Multi-Select
- **Options:**
  - BACS
  - Faster Payments
  - Direct Debit
  - Company card
  - Cheque

**Q3.4: Do you take advantage of early payment discounts?**
- **Type:** Select
- **Options:**
  - Yes - actively managed
  - Sometimes - if we notice
  - No

**Q3.5: Biggest frustration with paying suppliers?**
- **Type:** Text
- **AI Anchor:** Yes

---

### Chain 3: Hire-to-Retire (People)
**Description:** Full employee lifecycle  
**Estimated Duration:** 20 minutes

#### Section: Time & Attendance

**Q1.1: How do staff record hours worked?**
- **Type:** Select
- **Options:**
  - Dedicated time tracking tool
  - Spreadsheet/timesheet
  - Clock in/out system
  - Honour system (contracted hours)
  - Within project management tool

**Q1.2: Is time tracked to projects/clients?**
- **Type:** Select
- **Options:**
  - Yes - required
  - Yes - optional
  - No

**Q1.3: Who reviews/approves timesheets?**
- **Type:** Text

**Q1.4: How is overtime calculated and approved?**
- **Type:** Text

**Q1.5: Biggest frustration with time tracking?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Holiday & Absence

**Q2.1: How do staff request holiday?**
- **Type:** Select
- **Options:**
  - HR system (BreatheHR, etc.)
  - Email
  - Paper/digital form
  - Slack/Teams message
  - Shared calendar

**Q2.2: Who approves holiday?**
- **Type:** Text

**Q2.3: How do you track remaining entitlement?**
- **Type:** Text

**Q2.4: How is sickness absence recorded?**
- **Type:** Text

**Q2.5: Do you track absence patterns? (e.g., repeat Mondays)**
- **Type:** Select
- **Options:**
  - Yes - system alerts us
  - Yes - manually reviewed
  - No

**Q2.6: Biggest frustration with leave management?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Expense Claims

**Q3.1: How do staff submit expenses?**
- **Type:** Select
- **Options:**
  - Expense app (Pleo, Expensify, Dext)
  - Spreadsheet
  - Paper form
  - Email receipts

**Q3.2: How are receipts captured?**
- **Type:** Text

**Q3.3: Who approves expenses?**
- **Type:** Text

**Q3.4: How quickly are staff reimbursed?**
- **Type:** Select
- **Options:**
  - Same week
  - Next payroll
  - End of month
  - Variable

**Q3.5: Is there a documented expense policy?**
- **Type:** Select
- **Options:**
  - Yes - and it's enforced
  - Yes - but loosely followed
  - No formal policy

**Q3.6: Biggest frustration with expenses?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Payroll Processing

**Q4.1: Who prepares payroll each month?**
- **Type:** Text

**Q4.2: What inputs are needed? (hours, overtime, expenses, adjustments)**
- **Type:** Text

**Q4.3: Payroll cut-off date?**
- **Type:** Text

**Q4.4: Who reviews before processing?**
- **Type:** Text

**Q4.5: How are payslips distributed?**
- **Type:** Select
- **Options:**
  - Online portal
  - Email
  - Paper

**Q4.6: How are staff paid?**
- **Type:** Select
- **Options:**
  - BACS
  - Faster Payments
  - Cheque

**Q4.7: HMRC payment - manual or DD?**
- **Type:** Select
- **Options:**
  - Direct Debit
  - Manual payment

**Q4.8: Pension submissions - automated?**
- **Type:** Select
- **Options:**
  - Fully automated
  - Semi-automated
  - Manual

**Q4.9: Number of employees on payroll?**
- **Type:** Number

**Q4.10: Biggest frustration with payroll?**
- **Type:** Text
- **AI Anchor:** Yes

---

### Chain 4: Record-to-Report (Finance)
**Description:** From transaction to insight  
**Estimated Duration:** 15 minutes

#### Section: Transaction Processing

**Q1.1: Who enters transactions into the accounting system?**
- **Type:** Text

**Q1.2: How are transactions coded?**
- **Type:** Select
- **Options:**
  - Bank rules (auto-categorisation)
  - Preset rules in accounting system
  - Manual each time
  - Mix of automated and manual

**Q1.3: Do you use tracking categories/classes?**
- **Type:** Select
- **Options:**
  - Yes - extensively
  - Yes - basic (department/location)
  - No

**Q1.4: How often is bank reconciliation done?**
- **Type:** Select
- **Options:**
  - Daily
  - Weekly
  - Monthly
  - Rarely / when we remember

**Q1.5: Who does bank reconciliation?**
- **Type:** Text

**Q1.6: Average transactions per month?**
- **Type:** Number

**Q1.7: Biggest frustration with day-to-day bookkeeping?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Month-End

**Q2.1: Do you have a documented month-end checklist?**
- **Type:** Select
- **Options:**
  - Yes - followed consistently
  - Yes - but loosely followed
  - No formal checklist

**Q2.2: How do you handle accruals and prepayments?**
- **Type:** Text

**Q2.3: Standard journals - templated or recreated each month?**
- **Type:** Select
- **Options:**
  - Templated / recurring
  - Recreated each month
  - Varies

**Q2.4: Who reviews before close?**
- **Type:** Text

**Q2.5: How long does month-end take currently? (working days)**
- **Type:** Number

**Q2.6: What's the target? (working days)**
- **Type:** Number

**Q2.7: Biggest frustration with month-end?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Reporting

**Q3.1: Who prepares management accounts?**
- **Type:** Text

**Q3.2: What reports are produced?**
- **Type:** Multi-Select
- **Options:**
  - P&L
  - Balance Sheet
  - Cash Flow
  - KPI Dashboard
  - Aged Debtors
  - Aged Creditors
  - Budget vs Actual

**Q3.3: Who receives management reports?**
- **Type:** Text

**Q3.4: How are reports delivered?**
- **Type:** Select
- **Options:**
  - Email
  - Client/board portal
  - Presented in meeting
  - Shared drive

**Q3.5: Do you have a board pack? What's in it?**
- **Type:** Text

**Q3.6: How many working days from month-end to reports delivered?**
- **Type:** Number

**Q3.7: Do you compare to budget?**
- **Type:** Select
- **Options:**
  - Yes - monthly
  - Yes - quarterly
  - Rarely
  - No budget exists

**Q3.8: Biggest frustration with reporting?**
- **Type:** Text
- **AI Anchor:** Yes

---

### Chain 5: Lead-to-Client (Sales & Marketing)
**Description:** From stranger to customer  
**Estimated Duration:** 15 minutes

#### Section: Lead Management

**Q1.1: Where do most leads come from?**
- **Type:** Multi-Select
- **Options:**
  - Website
  - Referrals
  - LinkedIn
  - Events/networking
  - Paid advertising
  - Cold outreach
  - Partnerships

**Q1.2: How are leads captured?**
- **Type:** Text

**Q1.3: Where do leads go first?**
- **Type:** Select
- **Options:**
  - CRM
  - Spreadsheet
  - Email inbox
  - Slack/Teams channel
  - No central location

**Q1.4: Who qualifies leads?**
- **Type:** Text

**Q1.5: What makes a lead "qualified"?**
- **Type:** Text

**Q1.6: How quickly are leads followed up?**
- **Type:** Select
- **Options:**
  - Same day
  - 1-2 days
  - Within a week
  - Variable
  - Often missed

**Q1.7: Biggest frustration with lead management?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Pipeline & CRM

**Q2.1: Do you have defined sales stages?**
- **Type:** Select
- **Options:**
  - Yes - clear and followed
  - Yes - but loosely defined
  - No formal stages

**Q2.2: How is pipeline tracked?**
- **Type:** Text

**Q2.3: Do you forecast revenue? How?**
- **Type:** Text

**Q2.4: CRM data quality rating? (1-5)**
- **Type:** Number

**Q2.5: Biggest frustration with CRM?**
- **Type:** Text
- **AI Anchor:** Yes

#### Section: Client Onboarding

**Q3.1: What happens when a deal is won?**
- **Type:** Text

**Q3.2: How is the client set up? (systems, files, access)**
- **Type:** Text

**Q3.3: Who owns client onboarding?**
- **Type:** Text

**Q3.4: Do you have a standard onboarding checklist?**
- **Type:** Select
- **Options:**
  - Yes - detailed
  - Yes - basic
  - No

**Q3.5: How long does onboarding typically take?**
- **Type:** Text

**Q3.6: Handoff from sales to delivery - how does it work?**
- **Type:** Text

**Q3.7: Biggest frustration with client onboarding?**
- **Type:** Text
- **AI Anchor:** Yes

---

### Chain 6: Comply-to-Confirm (Regulatory)
**Description:** From requirement to filed  
**Estimated Duration:** 10 minutes

#### Section: Compliance Management

**Q1.1: What compliance filings do you handle?**
- **Type:** Multi-Select
- **Options:**
  - VAT returns
  - Corporation Tax
  - PAYE/RTI
  - CIS
  - Pension contributions
  - Confirmation Statement
  - Annual Accounts
  - Other regulatory filings

**Q1.2: How do you track compliance deadlines?**
- **Type:** Select
- **Options:**
  - Dedicated compliance system
  - Calendar reminders
  - Spreadsheet
  - Memory / manual tracking
  - Outsourced to accountant

**Q1.3: Who is responsible for each filing?**
- **Type:** Text

**Q1.4: Where does the data come from for filings?**
- **Type:** Text

**Q1.5: Do you use automated MTD submissions?**
- **Type:** Select
- **Options:**
  - Yes - fully automated
  - Semi-automated
  - Manual
  - Outsourced

**Q1.6: Have you ever missed a compliance deadline?**
- **Type:** Select
- **Options:**
  - Never
  - Once
  - Occasionally
  - Yes - and it was costly

**Q1.7: Biggest frustration with compliance?**
- **Type:** Text
- **AI Anchor:** Yes

---

## Summary

- **Stage 1:** 19 questions across 6 sections (Discovery Assessment)
- **Stage 2:** System inventory cards with ~25 fields per system
- **Stage 3:** 6 process chains with ~100+ total questions across all chains

Questions marked with **AI Anchor** are used as emotional anchors in the AI-generated audit report to provide context and personalization.

