# TORSOR Workflow System - Complete Guide
**Service Workflow Builder & LLM Integration**

*Date: October 4, 2025*  
*Platform: TORSOR Practice Platform*  
*Status: Production Ready ✅*

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Getting Started](#getting-started)
5. [Workflow Types](#workflow-types)
6. [LLM Integration](#llm-integration)
7. [Execution Engine](#execution-engine)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Workflow Templates](#workflow-templates)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The TORSOR Workflow System is a comprehensive automation platform that allows accountancy practices to:

- **Build** complex, multi-step workflows for advisory services
- **Integrate** AI/LLM capabilities (via OpenRouter) into service delivery
- **Execute** workflows with dynamic branching and conditional logic
- **Track** execution history, costs, and performance metrics
- **Template** pre-built workflows for common advisory services

### What Problem Does This Solve?

Advisory services (forecasting, valuation, benchmarking, etc.) involve repeatable, multi-step processes that:
1. Require significant manual effort
2. Have inconsistent quality
3. Are difficult to scale
4. Lack automation

This system automates these processes using AI while maintaining flexibility and control.

---

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                      │
├─────────────────────────────────────────────────────┤
│  • Advisory Services Page (Service Catalog)         │
│  • Service Detail Page (Workflow Management)        │
│  • Workflow Builder (Visual Editor)                 │
│  • Workflow Executor (Run Workflows)                │
│  • Execution History (Results Viewer)               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Workflow Execution Engine               │
├─────────────────────────────────────────────────────┤
│  • Step Execution Logic                             │
│  • Branching & Conditionals                         │
│  • Data Transformation                              │
│  • Error Handling & Recovery                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                 LLM Integration                      │
├─────────────────────────────────────────────────────┤
│  • OpenRouter API (Multi-Provider)                  │
│  • Prompt Interpolation                             │
│  • Token Counting & Cost Tracking                   │
│  • Model Selection (Claude, GPT-4, etc.)            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│            Supabase Database (PostgreSQL)            │
├─────────────────────────────────────────────────────┤
│  • workflows                                        │
│  • workflow_steps                                   │
│  • workflow_executions                              │
│  • step_executions                                  │
│  • workflow_templates                               │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router

**Backend:**
- Supabase (PostgreSQL + RLS)
- OpenRouter API (LLM Gateway)

**AI/LLM:**
- OpenRouter (supports multiple providers)
- Claude 3.5 Sonnet (recommended)
- GPT-4 Turbo, GPT-3.5, Gemini Pro, Llama 3

---

## ✨ Key Features

### 1. Visual Workflow Builder
- Drag-and-drop step management
- 5 step types: LLM, Conditional, Transform, User Input, API Call
- Complex branching support
- Real-time validation

### 2. LLM-Powered Steps
- Multi-provider support via OpenRouter
- Dynamic prompt templates with variable interpolation
- Token and cost tracking per execution
- Configurable temperature, max tokens, etc.

### 3. Execution Engine
- Asynchronous step execution
- Progress tracking (0-100%)
- Error handling and recovery
- Output chaining between steps

### 4. Pre-Built Templates
- Financial Forecasting (5 steps)
- Business Valuation (4 steps)
- Industry Benchmarking (3 steps)
- Profit Extraction Planning (4 steps)

### 5. Execution History & Analytics
- View all past executions
- Step-by-step breakdown
- Token usage and costs
- Input/output data inspection
- Execution time tracking

---

## 🚀 Getting Started

### Prerequisites

1. **Supabase Setup**
   - Run the migration: `supabase/migrations/20251004_create_workflow_tables.sql`
   - Ensure RLS policies are enabled
   - Verify accountancy_users table exists

2. **OpenRouter API Key**
   - Sign up at https://openrouter.ai
   - Get API key
   - Add to environment: `VITE_OPENROUTER_API_KEY=your_key_here`

### Quick Start (5 Minutes)

1. **Navigate to Advisory Services**
   ```
   Dashboard → Advisory Services
   ```

2. **Select a Service**
   - Click on any service card (e.g., "Financial Forecasting")

3. **Load a Template**
   - Click "Load Template" button
   - System creates pre-configured workflow

4. **Run the Workflow**
   - Click "Run Workflow" on the workflow card
   - Enter client name and any additional data
   - Click "Execute Workflow"
   - Watch progress in real-time

5. **View Results**
   - Go to "Recent Executions" tab
   - Click "Details" on any execution
   - Explore step-by-step results

---

## 🔧 Workflow Types

### Step Types

#### 1. **LLM Step** 🤖
Uses AI to process data and generate insights.

**Configuration:**
```json
{
  "provider": "openrouter",
  "model": "anthropic/claude-3.5-sonnet",
  "prompt": "Analyze {{client_name}}'s financials...",
  "temperature": 0.7,
  "max_tokens": 2000,
  "input_variables": ["client_name", "financial_data"]
}
```

**Use Cases:**
- Financial analysis
- Report generation
- Data interpretation
- Recommendations

**Cost:** $0.00003 - $0.0006 per execution (varies by model)

#### 2. **Conditional Step** ⚡
Branches workflow based on conditions.

**Configuration:**
```json
{
  "condition": "revenue > 100000",
  "true_branch": "step_id_1",
  "false_branch": "step_id_2"
}
```

**Use Cases:**
- Different processes for different client sizes
- Skip steps based on data
- Dynamic workflow routing

#### 3. **Transform Step** 🔄
Processes and transforms data.

**Configuration:**
```json
{
  "transform_type": "extract",
  "fields": ["revenue", "profit", "employees"],
  "code": "return { total: input.revenue + input.profit }"
}
```

**Use Cases:**
- Data extraction
- Calculations
- Format conversions
- Aggregations

#### 4. **User Input Step** 👤
Requires specific input data.

**Configuration:**
```json
{
  "fields": [
    {
      "name": "client_name",
      "type": "text",
      "label": "Client Name",
      "required": true
    }
  ]
}
```

**Use Cases:**
- Collect required data
- Validate inputs
- Get user decisions

#### 5. **API Call Step** 🌐
Makes external API requests.

**Configuration:**
```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer TOKEN"
  },
  "body": {}
}
```

**Use Cases:**
- Fetch external data
- Integrate with third-party services
- Send notifications

---

## 🧠 LLM Integration

### Supported Models (via OpenRouter)

| Provider | Model | Context | Cost (per 1M tokens) | Best For |
|----------|-------|---------|----------------------|----------|
| Anthropic | Claude 3.5 Sonnet | 200K | $3/$15 (in/out) | Complex analysis ⭐ |
| Anthropic | Claude 3 Opus | 200K | $15/$75 | Premium tasks |
| Anthropic | Claude 3 Haiku | 200K | $0.25/$1.25 | Speed & cost |
| OpenAI | GPT-4 Turbo | 128K | $10/$30 | General purpose ⭐ |
| OpenAI | GPT-3.5 Turbo | 16K | $0.50/$1.50 | Fast & cheap |
| Google | Gemini Pro | 32K | $0.50/$1.50 | Multimodal |
| Meta | Llama 3 70B | 8K | $0.59/$0.79 | Open source |

⭐ = Recommended for most tasks

### Prompt Best Practices

1. **Be Specific**
   ```
   ❌ Bad:  "Analyze this data"
   ✅ Good: "Analyze {{client_name}}'s revenue trends over 12 months and identify 3 key drivers of growth"
   ```

2. **Use Variables**
   ```typescript
   {{client_name}}          // Client's name
   {{previous_output}}      // Output from previous step
   {{step_1_output}}        // Output from specific step
   {{financial_data}}       // Input data field
   ```

3. **Structure Output**
   ```
   "Format your response as JSON with these sections:
   {
     "summary": "...",
     "analysis": ["..."],
     "recommendations": ["..."]
   }"
   ```

4. **Set Context**
   ```
   "You are an experienced financial analyst working for a UK accountancy firm.
   Your client is a {{industry}} business with {{employees}} employees..."
   ```

### Cost Management

**Average Costs per Workflow:**
- **Forecasting Workflow:** ~$0.15-0.30 (5 LLM steps)
- **Valuation Workflow:** ~$0.12-0.25 (4 LLM steps)
- **Benchmarking Workflow:** ~$0.08-0.15 (3 LLM steps)

**Cost Optimization:**
1. Use GPT-3.5 or Haiku for simple tasks
2. Reduce max_tokens where possible
3. Cache common prompts (future feature)
4. Batch similar workflows

---

## ⚙️ Execution Engine

### How Workflows Execute

```
1. START
   ↓
2. Create Execution Record
   ↓
3. Load Workflow Steps (ordered by step_order)
   ↓
4. For Each Step:
   ├─ Update Progress
   ├─ Execute Step Logic
   ├─ Record Step Execution
   ├─ Store Output
   └─ Pass Output to Next Step
   ↓
5. Mark Complete/Failed
   ↓
6. END
```

### Progress Tracking

```typescript
// Progress is calculated as:
progress = (completed_steps / total_steps) * 100

// Updates happen:
- At start of each step
- On step completion
- On workflow completion/failure
```

### Error Handling

**What Happens on Error:**
1. Step marked as "failed"
2. Error message recorded
3. Workflow execution stops
4. Partial results saved
5. User notified

**Retry Strategy (Manual):**
- View failed execution
- Identify failed step
- Duplicate workflow
- Fix configuration
- Re-run

---

## 💾 Database Schema

### Tables

#### `workflows`
Stores workflow definitions.

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  practice_id UUID NOT NULL,
  service_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ...
);
```

#### `workflow_steps`
Individual steps in workflows.

```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  ...
);
```

#### `workflow_executions`
Execution history.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  status TEXT NOT NULL,
  progress_percentage INTEGER,
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  ...
);
```

#### `step_executions`
Individual step execution details.

```sql
CREATE TABLE step_executions (
  id UUID PRIMARY KEY,
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  step_id UUID REFERENCES workflow_steps(id),
  status TEXT NOT NULL,
  llm_model TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  ...
);
```

---

## 📚 Workflow Templates

### 1. Financial Forecasting (5 Steps)

**Purpose:** Generate 12-month financial forecast with best/worst case scenarios

**Steps:**
1. Analyze Historical Performance (LLM)
2. Generate Base Case Forecast (LLM)
3. Best Case Scenario (LLM)
4. Worst Case Scenario (LLM)
5. Executive Summary & Recommendations (LLM)

**Input Required:**
- `historical_data`: JSON with 12-24 months of financials
- `industry`: Client's industry
- `current_revenue`: Latest annual revenue
- `growth_stage`: startup/growth/mature

**Output:**
- 3 forecast scenarios (base/best/worst)
- Executive summary
- Key assumptions
- Recommendations

**Estimated Time:** 3-5 minutes  
**Estimated Cost:** $0.15-0.30

---

### 2. Business Valuation (4 Steps)

**Purpose:** Multi-method business valuation

**Steps:**
1. Financial Normalization (LLM)
2. Market Comparables Analysis (LLM)
3. DCF Valuation Model (LLM)
4. Valuation Report (LLM)

**Input Required:**
- `financial_data`: 3 years of financials
- `industry`: Industry sector
- `location`: UK region

**Output:**
- Adjusted EBITDA
- Market multiples analysis
- DCF valuation
- Final valuation range
- Recommendations

**Estimated Time:** 4-6 minutes  
**Estimated Cost:** $0.12-0.25

---

### 3. Industry Benchmarking (3 Steps)

**Purpose:** Compare client against industry peers

**Steps:**
1. Calculate Key Metrics (LLM)
2. Industry Benchmark Comparison (LLM)
3. Action Plan (LLM)

**Input Required:**
- `financial_data`: Current year financials
- `operational_data`: Employee count, customers, etc.
- `industry`: Industry code
- `company_size`: Revenue band

**Output:**
- Client metrics
- Industry percentile rankings
- Gap analysis
- Improvement recommendations

**Estimated Time:** 2-3 minutes  
**Estimated Cost:** $0.08-0.15

---

### 4. Profit Extraction Planning (4 Steps)

**Purpose:** Optimize director remuneration for tax efficiency

**Steps:**
1. Analyze Current Position (LLM)
2. Optimize Salary/Dividend Mix (LLM)
3. Pension Optimization (LLM)
4. Comprehensive Implementation Plan (LLM)

**Input Required:**
- `current_structure`: Current salary/dividend split
- `tax_details`: Personal tax info
- `target_income`: Desired take-home
- `company_profit`: Available profit

**Output:**
- Current vs optimized comparison
- Tax savings calculation
- Pension recommendations
- Implementation plan

**Estimated Time:** 3-4 minutes  
**Estimated Cost:** $0.10-0.20

---

## 🎯 Best Practices

### Workflow Design

1. **Keep Steps Focused**
   - Each step should do ONE thing well
   - Avoid mega-prompts that do everything

2. **Chain Outputs Properly**
   - Use `{{step_X_output}}` to reference previous steps
   - Verify output format matches next step's input

3. **Add Descriptions**
   - Every step should have a clear description
   - Helps with debugging and maintenance

4. **Test Incrementally**
   - Build workflow step-by-step
   - Test each step before adding the next

5. **Handle Errors Gracefully**
   - Consider what happens if a step fails
   - Build in validation where possible

### Prompt Engineering

1. **Be Explicit About Format**
   ```
   "Provide your analysis in the following JSON format:
   {
     "score": 0-100,
     "reasoning": "...",
     "recommendations": ["..."]
   }"
   ```

2. **Provide Examples**
   ```
   "For example, if revenue is £500,000 and profit is £75,000,
   the profit margin would be 15%."
   ```

3. **Set Role & Context**
   ```
   "You are a senior financial analyst with 15 years experience
   in the UK professional services sector..."
   ```

4. **Use Step-by-Step Instructions**
   ```
   "1. First, analyze the revenue trends
    2. Next, identify cost drivers
    3. Then, calculate key ratios
    4. Finally, provide recommendations"
   ```

### Cost Optimization

1. **Choose Right Model**
   - Use GPT-3.5 for simple tasks
   - Use Claude 3.5 for complex analysis
   - Reserve Opus for premium work

2. **Optimize Token Usage**
   - Set appropriate max_tokens
   - Don't request more than needed
   - Compress input data when possible

3. **Monitor Costs**
   - Review execution costs regularly
   - Identify expensive workflows
   - Optimize prompt length

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "OpenRouter API key not configured"

**Solution:**
```bash
# Add to .env file:
VITE_OPENROUTER_API_KEY=your_key_here

# Restart dev server:
npm run dev
```

#### 2. Workflow execution fails immediately

**Check:**
- Supabase connection
- Database tables exist (run migration)
- RLS policies configured
- Practice ID is valid

#### 3. LLM step returns empty output

**Possible Causes:**
- Model doesn't support requested format
- Prompt is unclear
- Max tokens too low
- API rate limit hit

**Solution:**
- Review prompt clarity
- Increase max_tokens
- Check OpenRouter dashboard for errors

#### 4. Variables not interpolating in prompts

**Check:**
- Variable name matches exactly (case-sensitive)
- Variable exists in input_data or previous outputs
- Using correct syntax: `{{variable_name}}`

#### 5. "Row Level Security" errors

**Solution:**
```sql
-- Verify RLS policies exist:
SELECT * FROM pg_policies WHERE tablename = 'workflows';

-- Re-run migration if needed
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Workflow Performance**
   - Success rate (completed / total)
   - Average execution time
   - Most-used workflows

2. **Cost Analysis**
   - Cost per workflow type
   - Cost per client
   - Monthly LLM spend
   - Token usage trends

3. **Quality Metrics**
   - Client satisfaction
   - Time saved vs manual
   - Error rates

### Future Analytics Features (Roadmap)

- Real-time cost tracking dashboard
- Workflow performance benchmarks
- Client-level usage reports
- Predictive cost modeling
- A/B testing for prompts

---

## 🚀 Deployment

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# OpenRouter
VITE_OPENROUTER_API_KEY=your_openrouter_key

# App Config
VITE_API_URL=https://your-api.com
VITE_APP_NAME=TORSOR
```

### Database Migration

```bash
# Using Supabase CLI:
supabase db push

# Or manually in Supabase dashboard:
# Copy/paste: supabase/migrations/20251004_create_workflow_tables.sql
```

### Testing Connection

```typescript
// Test OpenRouter:
import { testOpenRouterConnection } from './services/openRouterService';

const result = await testOpenRouterConnection();
console.log(result); // { success: true } or { success: false, error: "..." }
```

---

## 📖 API Reference

### Execute Workflow

```typescript
import { executeWorkflow } from './services/workflowExecutionEngine';

const result = await executeWorkflow({
  workflowId: 'uuid',
  practiceId: 'uuid',
  clientId: 'uuid',
  clientName: 'ABC Ltd',
  inputData: {
    revenue: 500000,
    employees: 25,
    industry: 'Professional Services'
  }
});

// Returns:
// {
//   success: true,
//   executionId: 'uuid'
// }
```

### Execute LLM Step

```typescript
import { executeLLMStep } from './services/openRouterService';

const result = await executeLLMStep({
  model: 'anthropic/claude-3.5-sonnet',
  prompt: 'Analyze {{client_name}}...',
  variables: { client_name: 'ABC Ltd' },
  temperature: 0.7,
  max_tokens: 2000
});

// Returns:
// {
//   success: true,
//   output: "...",
//   tokens_used: 1523,
//   cost_usd: 0.0045,
//   model: "anthropic/claude-3.5-sonnet"
// }
```

---

## 🎓 Training Materials

### For Accountants

**"How to Use Workflows" (5 Minutes)**
1. Go to Advisory Services
2. Click a service (e.g., Forecasting)
3. Click "Load Template"
4. Click "Run Workflow" on created workflow
5. Enter client details
6. Review results in "Recent Executions"

### For Administrators

**"How to Customize Workflows" (15 Minutes)**
1. Create/load workflow
2. Click "Edit" to open Workflow Builder
3. Add/edit/delete steps
4. Configure each step (model, prompt, etc.)
5. Save and test
6. Monitor costs and performance

---

## 🔮 Roadmap

### Phase 2 (Next 4 Weeks)
- [ ] Workflow versioning
- [ ] Step templates library
- [ ] Parallel step execution
- [ ] Cost budget alerts
- [ ] Workflow testing sandbox

### Phase 3 (2-3 Months)
- [ ] Visual workflow canvas (drag-drop)
- [ ] Workflow marketplace (share templates)
- [ ] Advanced analytics dashboard
- [ ] Scheduled workflow runs
- [ ] Webhook integrations
- [ ] Custom model fine-tuning

---

## 📞 Support

**Issues?**
- Check [Troubleshooting](#troubleshooting) section
- Review error logs in browser console
- Check Supabase logs
- Verify OpenRouter dashboard

**Questions?**
- Review this guide
- Check workflow templates for examples
- Test with small workflows first

---

## ✅ Quick Reference

### Workflow Lifecycle

```
CREATE → BUILD → TEST → RUN → REVIEW → IMPROVE
```

### Cost Per Model (1M tokens)

```
Claude 3.5:  $3-$15
GPT-4:       $10-$30
GPT-3.5:     $0.50-$1.50
Claude 3 H:  $0.25-$1.25
```

### Typical Workflow Times

```
Forecasting:    3-5 min
Valuation:      4-6 min
Benchmarking:   2-3 min
Profit Ext:     3-4 min
```

---

**🎉 Congratulations!**

You now have a complete workflow automation system with AI integration!

Start small, test thoroughly, and scale as you gain confidence.

---

**Last Updated:** October 4, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

