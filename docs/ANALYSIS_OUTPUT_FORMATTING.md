# Discovery Analysis Output Formatting & PDF Generation

## Overview

This document covers the complete data flow from LLM generation through to UI display and PDF export for the Discovery Analysis system.

---

## 1. LLM Output Schema

### Source: `generate-discovery-analysis/index.ts`

The LLM is prompted to return this exact JSON structure:

```json
{
  "executiveSummary": {
    "headline": "One powerful sentence",
    "situationInTheirWords": "2-3 sentences using their EXACT quotes",
    "destinationVision": "What they really want",
    "currentReality": "Where they are now",
    "criticalInsight": "The most important insight",
    "urgencyStatement": "Why acting now matters"
  },
  "destinationAnalysis": {
    "fiveYearVision": "Their stated destination",
    "coreEmotionalDrivers": [
      { 
        "driver": "Freedom", 
        "evidence": "exact quote", 
        "whatItMeans": "interpretation" 
      }
    ],
    "lifestyleGoals": ["non-business goals"]
  },
  "gapAnalysis": {
    "primaryGaps": [
      { 
        "gap": "specific gap", 
        "category": "Financial|Operational|Strategic|Personal", 
        "severity": "critical|high|medium", 
        "evidence": "quote", 
        "currentImpact": { 
          "timeImpact": "X hours/week", 
          "financialImpact": "£X", 
          "emotionalImpact": "how it feels" 
        } 
      }
    ],
    "costOfInaction": { 
      "annualFinancialCost": "£X,XXX with calculation", 
      "personalCost": "impact on life", 
      "compoundingEffect": "how it gets worse" 
    }
  },
  "recommendedInvestments": [
    {
      "service": "Management Accounts",
      "code": "management_accounts",
      "priority": 1,
      "recommendedTier": "Standard tier",
      "investment": "£650",
      "investmentFrequency": "per month",
      "whyThisTier": "reasoning for this tier",
      "problemsSolved": [
        { 
          "problem": "from their responses", 
          "theirWords": "exact quote", 
          "howWeSolveIt": "specific actions", 
          "expectedResult": "measurable outcome" 
        }
      ],
      "expectedROI": { 
        "multiplier": "10x", 
        "timeframe": "3 months", 
        "calculation": "how we calculated" 
      },
      "keyOutcomes": ["Financial visibility", "Investor-ready reports"],
      "riskOfNotActing": "specific consequence"
    }
  ],
  "investmentSummary": {
    "totalFirstYearInvestment": "£11,800",
    "projectedFirstYearReturn": "£150,000+",
    "paybackPeriod": "3 months",
    "netBenefitYear1": "£138,200",
    "roiCalculation": "Based on X efficiency gains",
    "comparisonToInaction": "Clear comparison"
  },
  "recommendedNextSteps": [
    { 
      "step": 1, 
      "action": "Schedule discovery call", 
      "timing": "This week", 
      "owner": "Oracle team" 
    }
  ],
  "closingMessage": {
    "personalNote": "Empathetic message referencing their specific situation",
    "callToAction": "Clear next step",
    "urgencyReminder": "Why now"
  }
}
```

---

## 2. Data Flow

### A. Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STAGE 1: PREPARE DATA                        │
│                    prepare-discovery-data/index.ts                   │
├─────────────────────────────────────────────────────────────────────┤
│ Fetches:                                                            │
│ • practice_members (client info)                                    │
│ • destination_discovery (responses)                                 │
│ • document_embeddings (uploaded docs)                               │
│ • client_financial_context                                          │
│ • client_operational_context                                        │
│ • client_context_notes (advisor notes)                              │
│ • assessment_patterns (if exists)                                   │
│                                                                     │
│ Returns: { preparedData: { ... } }                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       STAGE 2: GENERATE ANALYSIS                     │
│                   generate-discovery-analysis/index.ts               │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Calculate clarity score (pattern or fallback)                    │
│ 2. Assess affordability (stage, cash constraints)                   │
│ 3. Detect 365 transformation triggers                               │
│ 4. Extract financial projections from docs                          │
│ 5. Build analysis prompt with all context                           │
│ 6. Call Claude Opus 4.5 via OpenRouter                              │
│ 7. Parse JSON response                                              │
│ 8. Normalize field names (handle variations)                        │
│ 9. Apply mechanical text cleanup (British English)                  │
│ 10. Save to client_reports table                                    │
│                                                                     │
│ Returns: { success: true, report: { ... } }                         │
└─────────────────────────────────────────────────────────────────────┘
```

### B. Response Structure from Edge Function

```typescript
// What generate-discovery-analysis returns:
{
  success: true,
  report: {
    id: "uuid",                    // From client_reports table
    generatedAt: "ISO timestamp",
    client: { id, name, email, company },
    practice: { name },
    discoveryScores: {
      clarityScore: 9,             // 1-10
      claritySource: "pattern" | "fallback",
      gapScore: 7                  // From discovery record
    },
    affordability: {
      stage: "pre-revenue" | "early-revenue" | "established" | "scaling",
      cashConstrained: boolean,
      activelyRaising: boolean,
      estimatedMonthlyCapacity: "under_1k" | "1k_5k" | "5k_15k" | "15k_plus"
    },
    transformationSignals: {
      lifestyleTransformation: boolean,
      identityShift: boolean,
      burnoutWithReadiness: boolean,
      legacyFocus: boolean,
      reasons: string[]
    } | null,
    financialProjections: {
      hasProjections: boolean,
      currentRevenue: number,
      projectedRevenue: [{ year, amount }],
      year5Revenue: number,
      growthMultiple: number
    } | null,
    analysis: { /* LLM output - see schema above */ }
  },
  metadata: {
    model: "anthropic/claude-opus-4.5",
    executionTimeMs: number,
    llmTimeMs: number
  }
}
```

### C. Database Storage

```sql
-- client_reports table
{
  id: UUID,
  client_id: UUID,
  practice_id: UUID,
  discovery_id: UUID,
  report_type: 'discovery_analysis',
  report_data: JSONB {
    generatedAt,
    clientName,
    companyName,
    analysis: { /* LLM output */ },
    discoveryScores: { ... },
    affordability: { ... },
    transformationSignals: { ... },
    financialProjections: { ... }
  },
  is_shared_with_client: boolean,
  shared_at: timestamp,
  created_at: timestamp
}
```

### D. Loading & Normalization

When loading from database, the structure is different from fresh generation:

```typescript
// Database record:
existingReport = {
  id: "uuid",
  report_data: {
    analysis: { ... },
    discoveryScores: { ... }
  },
  is_shared_with_client: false,
  created_at: "timestamp"
}

// Normalized for UI (matches fresh generation):
normalizedReport = {
  id: existingReport.id,
  generatedAt: existingReport.report_data?.generatedAt,
  analysis: existingReport.report_data?.analysis,
  discoveryScores: existingReport.report_data?.discoveryScores,
  affordability: existingReport.report_data?.affordability,
  // ... etc
}
```

---

## 3. Admin Portal UI Display

### Source: `src/pages/admin/ClientServicesPage.tsx`

### A. Analysis Tab Structure

```tsx
// Main access pattern:
generatedReport.analysis?.executiveSummary
generatedReport.analysis?.gapAnalysis?.primaryGaps
generatedReport.analysis?.recommendedInvestments
generatedReport.analysis?.investmentSummary
generatedReport.analysis?.closingMessage

// Scores:
generatedReport.discoveryScores?.clarityScore
generatedReport.discoveryScores?.gapScore
```

### B. Section Rendering

#### Executive Summary (Header Card)
```tsx
<div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
  <h3>{generatedReport.analysis?.executiveSummary?.headline}</h3>
  <p>{generatedReport.analysis?.executiveSummary?.keyInsight}</p>
  <div className="grid grid-cols-2 gap-4">
    <div>Destination Clarity: {clarityScore}/10</div>
    <div>Gap Score: {gapScore}/10</div>
  </div>
</div>
```

#### Gap Analysis
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
  {gapAnalysis.primaryGaps.map(gap => (
    <div className="bg-white rounded-lg p-4">
      <span className="category">{gap.category}</span>
      <span className="severity">{gap.severity}</span>
      <p>{gap.gap}</p>
      <p className="evidence">"{gap.evidence}"</p>
      <p className="impact">{gap.currentImpact?.financialImpact}</p>
    </div>
  ))}
  
  {/* Cost of Inaction */}
  <div className="bg-red-50 border border-red-200">
    <p className="text-2xl font-bold">{costOfInaction.annualFinancialCost}</p>
    <p>{costOfInaction.personalCost}</p>
  </div>
</div>
```

#### Recommended Investments
```tsx
<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
  {recommendedInvestments.map(inv => (
    <div className="bg-white rounded-xl p-5">
      {/* Header */}
      <span className="priority-badge">Priority {inv.priority}</span>
      <h5>{inv.service}</h5>
      <p className="tier">{inv.recommendedTier}</p>
      
      {/* Price */}
      <p className="text-xl font-bold">{inv.investment}</p>
      <p className="text-xs">{inv.investmentFrequency}</p>
      
      {/* Problems Solved */}
      {inv.problemsSolved.map(problem => (
        <div>
          <p>{problem.problem}</p>
          <p className="italic">"{problem.theirWords}"</p>
          <p>→ {problem.expectedResult}</p>
        </div>
      ))}
      
      {/* ROI */}
      <p>{inv.expectedROI?.multiplier} in {inv.expectedROI?.timeframe}</p>
      
      {/* Outcomes */}
      <ul>
        {(inv.keyOutcomes || inv.expectedOutcomes).map(o => (
          <li>✓ {typeof o === 'string' ? o : o.outcome}</li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

#### Investment Summary
```tsx
<div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p>Total First Year Investment</p>
      <p className="text-2xl font-bold">{investmentSummary.totalFirstYearInvestment}</p>
    </div>
    <div>
      <p>Projected First Year Return</p>
      <p className="text-2xl font-bold">{investmentSummary.projectedFirstYearReturn}</p>
    </div>
  </div>
  <div>
    <p>Net Benefit Year 1: {investmentSummary.netBenefitYear1}</p>
    <p>Payback Period: {investmentSummary.paybackPeriod}</p>
  </div>
</div>
```

#### Closing Message
```tsx
<div className="bg-slate-800 rounded-xl p-6 text-white">
  {typeof closingMessage === 'string' ? (
    <p>{closingMessage}</p>
  ) : (
    <>
      <p className="italic">"{closingMessage.personalNote}"</p>
      <p className="text-emerald-300">{closingMessage.callToAction}</p>
      <p className="text-gray-300">{closingMessage.urgencyReminder}</p>
    </>
  )}
</div>
```

---

## 4. PDF Export

### Source: `handleExportPDF()` in `ClientServicesPage.tsx`

### A. How It Works

1. Opens new browser window
2. Writes complete HTML document with inline styles
3. Triggers browser print dialog
4. User can "Save as PDF" from print dialog

### B. Current PDF Styling

```css
/* Core Layout */
body { 
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
  line-height: 1.6; 
  color: #1f2937; 
  padding: 40px; 
  max-width: 900px; 
  margin: 0 auto; 
}

/* Header */
.header { 
  text-align: center; 
  margin-bottom: 40px; 
  padding-bottom: 20px; 
  border-bottom: 3px solid #4f46e5; 
}

/* Score Boxes */
.score-grid { display: flex; gap: 24px; margin: 20px 0; }
.score-box { 
  flex: 1; 
  background: #f3f4f6; 
  padding: 16px; 
  border-radius: 8px; 
  text-align: center; 
}
.score-box .value { font-size: 28px; font-weight: bold; color: #4f46e5; }

/* Executive Summary */
.summary-box { 
  background: linear-gradient(135deg, #4f46e5, #7c3aed); 
  color: white; 
  padding: 24px; 
  border-radius: 12px; 
}

/* Gap Cards */
.gap-card { 
  background: #fef3c7; 
  border-left: 4px solid #f59e0b; 
  padding: 16px; 
  margin: 12px 0; 
  border-radius: 4px; 
}
.gap-card.critical { background: #fee2e2; border-color: #ef4444; }
.gap-card.high { background: #fef3c7; border-color: #f59e0b; }

/* Investment Cards */
.investment-card { 
  background: #ecfdf5; 
  border: 1px solid #10b981; 
  padding: 20px; 
  margin: 16px 0; 
  border-radius: 8px; 
}
.priority-badge { 
  background: #10b981; 
  color: white; 
  padding: 4px 12px; 
  border-radius: 12px; 
  font-size: 12px; 
}
.price { font-size: 24px; font-weight: bold; color: #059669; }

/* Investment Summary */
.summary-totals { 
  background: linear-gradient(135deg, #059669, #0d9488); 
  color: white; 
  padding: 24px; 
  border-radius: 12px; 
}

/* Closing */
.closing { 
  background: #1f2937; 
  color: white; 
  padding: 24px; 
  border-radius: 12px; 
  text-align: center; 
}

/* Print Compatibility */
@media print { 
  body { padding: 20px; } 
  .summary-box, .summary-totals, .closing { 
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact; 
  } 
}
```

### C. PDF HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>Discovery Analysis - {clientName}</title>
  <style>/* inline styles */</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>Discovery Analysis</h1>
    <p class="meta">{clientName} • {companyName}</p>
    <p class="meta">Generated: {date}</p>
  </div>

  <!-- Score Grid -->
  <div class="score-grid">
    <div class="score-box">
      <div class="label">Destination Clarity</div>
      <div class="value">{clarityScore}/10</div>
    </div>
    <div class="score-box">
      <div class="label">Gap Score</div>
      <div class="value">{gapScore}/10</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="summary-box">
    <h2>{headline}</h2>
    <p>{keyInsight}</p>
    <p class="italic">"{situationInTheirWords}"</p>
  </div>

  <!-- Gap Analysis -->
  <h2>Gap Analysis</h2>
  {primaryGaps.map(gap => `
    <div class="gap-card {severity}">
      <h3>{gap.gap}</h3>
      <p><strong>Category:</strong> {category} | <strong>Severity:</strong> {severity}</p>
      <p class="evidence">"{evidence}"</p>
      <p><strong>Impact:</strong> {financialImpact} {timeImpact}</p>
    </div>
  `)}
  
  <!-- Cost of Inaction -->
  <div class="gap-card critical">
    <h3>Cost of Not Acting</h3>
    <p><strong>{annualFinancialCost}</strong></p>
    <p>{personalCost}</p>
  </div>

  <!-- Recommended Investments -->
  <h2>Recommended Investments</h2>
  {recommendedInvestments.map(inv => `
    <div class="investment-card">
      <div class="investment-header">
        <div>
          <span class="priority-badge">Priority {priority}</span>
          <h3>{service}</h3>
          <p>{recommendedTier}</p>
        </div>
        <div class="text-right">
          <div class="price">{investment}</div>
          <div>{investmentFrequency}</div>
        </div>
      </div>
      <p>{whyThisTier}</p>
      <p class="roi">Expected ROI: {multiplier} in {timeframe}</p>
      <ul class="outcomes">
        {keyOutcomes.map(o => `<li>✓ {o}</li>`)}
      </ul>
    </div>
  `)}

  <!-- Investment Summary -->
  <div class="summary-totals">
    <h2>Investment Summary</h2>
    <div class="grid">
      <div class="item">
        <div class="label">First Year Investment</div>
        <div class="value">{totalFirstYearInvestment}</div>
      </div>
      <div class="item">
        <div class="label">Projected Return</div>
        <div class="value">{projectedFirstYearReturn}</div>
      </div>
      <div class="item">
        <div class="label">Payback Period</div>
        <div class="value">{paybackPeriod}</div>
      </div>
    </div>
  </div>

  <!-- Closing Message -->
  <div class="closing">
    <p class="italic">"{personalNote}"</p>
    <p class="cta">{callToAction}</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Discovery Analysis Report • Generated by Torsor Platform</p>
    <p>Confidential - For {clientName} Use Only</p>
  </div>
</body>
</html>
```

---

## 5. Client Portal Display

### Source: `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`

### A. Data Loading

```typescript
const loadReport = async () => {
  const { data } = await supabase
    .from('client_reports')
    .select('*')
    .eq('client_id', clientSession.clientId)
    .eq('report_type', 'discovery_analysis')
    .eq('is_shared_with_client', true)  // Only shared reports!
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  setReport(data);
};
```

### B. Access Pattern

```typescript
// Client portal uses report_data directly (not normalized)
const analysis = report.report_data?.analysis || {};
const scores = report.report_data?.discoveryScores || {};
const summary = analysis.executiveSummary || {};
const gaps = analysis.gapAnalysis || {};
const investments = analysis.recommendedInvestments || [];
const investmentSummary = analysis.investmentSummary || {};
const closing = analysis.closingMessage;
```

### C. Design Philosophy

The client portal version is:
- **Sympathetic**: "We heard you", "Thank you for sharing"
- **Encouraging**: Focus on the path forward
- **Clean**: Less technical, more emotional
- **Action-oriented**: Clear CTA to book appointment

### D. Sections in Client Portal

1. **Hero Section** - Gradient background, headline, clarity indicator
2. **Your Destination** - Vision and current reality
3. **What's Holding You Back** - Gaps (limited to 3, simplified)
4. **Your Path Forward** - Investments (first one highlighted)
5. **Investment Summary** - Totals in dark card
6. **Closing Message** - Personal note
7. **Call to Action** - Book appointment button

---

## 6. Field Name Variations & Normalization

### A. Known Variations

The LLM sometimes returns different field names. These are normalized after parsing:

| Expected | Possible Variations |
|----------|---------------------|
| `service` | `serviceName`, `name` |
| `investment` | `price`, `cost`, `monthlyInvestment` |
| `investmentFrequency` | `frequency`, `period` |
| `expectedROI.multiplier` | `roi.multiplier`, `roi.multiple` |
| `expectedROI.timeframe` | `roi.timeframe`, `roi.period` |
| `keyOutcomes` | `outcomes`, `expectedOutcomes` |
| `totalFirstYearInvestment` | `totalFirstYear`, `total` |

### B. Normalization Code

```typescript
// Applied in generate-discovery-analysis after JSON parse
if (analysis.recommendedInvestments) {
  analysis.recommendedInvestments = analysis.recommendedInvestments.map((inv) => ({
    service: inv.service || inv.serviceName || inv.name || 'Unknown Service',
    code: inv.code || inv.serviceCode || '',
    priority: inv.priority || inv.order || 1,
    investment: inv.investment || inv.price || inv.cost || '',
    investmentFrequency: inv.investmentFrequency || inv.frequency || inv.period || 'per month',
    expectedROI: {
      multiplier: inv.expectedROI?.multiplier || inv.roi?.multiplier || '',
      timeframe: inv.expectedROI?.timeframe || inv.roi?.timeframe || '',
      calculation: inv.expectedROI?.calculation || inv.roi?.calculation || ''
    },
    keyOutcomes: inv.keyOutcomes || inv.outcomes || [],
    // ... etc
  }));
}
```

---

## 7. Text Cleanup (British English)

### A. Mechanical Cleanup Function

```typescript
function cleanMechanical(text: string): string {
  return text
    .replace(/—/g, ', ')                    // Em dash → comma
    .replace(/, ,/g, ',')
    .replace(/, \./g, '.')
    .replace(/\boptimize/gi, 'optimise')
    .replace(/\boptimizing/gi, 'optimising')
    .replace(/\banalyze/gi, 'analyse')
    .replace(/\brealize/gi, 'realise')
    .replace(/\bbehavior/gi, 'behaviour')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bprogram\b/gi, 'programme')
    .replace(/\borganize/gi, 'organise')
    .replace(/\bfavor/gi, 'favour')
    .replace(/\bcolor/gi, 'colour')
    .replace(/  +/g, ' ')
    .trim();
}

// Applied recursively to all string fields
function cleanAllStrings(obj: any): any {
  if (typeof obj === 'string') return cleanMechanical(obj);
  if (Array.isArray(obj)) return obj.map(cleanAllStrings);
  if (typeof obj === 'object' && obj !== null) {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanAllStrings(obj[key]);
    }
    return cleaned;
  }
  return obj;
}
```

### B. System Prompt Language Rules

```
LANGUAGE RULES (non-negotiable):

1. No em dashes. Use commas or full stops instead.

2. British English only: optimise, analyse, realise, behaviour, centre, programme

3. Banned words: delve, realm, harness, unlock, leverage, seamless, empower,
   streamline, elevate, unprecedented, reimagine, holistic, foster, robust,
   scalable, breakthrough, disruptive, transformative, game-changer,
   cutting-edge, synergy, frictionless, data-driven, next-gen

4. Banned patterns:
   - "Here's the truth:" / "Here's the thing:"
   - "In a world where..."
   - "It's not about X. It's about Y."
   - "Most people [X]. The few who [Y]."
   - "The real work is..."
   - "If you're not doing X, you're already behind"

5. Write like you're talking to them in a meeting. Direct, warm, occasionally blunt.
```

---

## 8. Improvement Opportunities

### A. PDF Export
- [ ] Add page breaks for printing
- [ ] Include practice logo
- [ ] Add watermark/confidential markings
- [ ] Consider dedicated PDF library (jsPDF, Puppeteer) for more control
- [ ] Add cover page

### B. UI Display
- [ ] Collapsible sections for long reports
- [ ] Print-specific CSS for admin view
- [ ] Visual timeline for implementation roadmap
- [ ] Charts for financial projections

### C. Data Structure
- [ ] Consistent field naming in LLM prompt
- [ ] TypeScript interfaces for report structure
- [ ] Validation before saving

### D. Client Portal
- [ ] Progress indicator for multi-page view
- [ ] Share via email option
- [ ] Download PDF from client side

---

## 9. File Locations

| Purpose | File Path |
|---------|-----------|
| Stage 1 (Data Prep) | `supabase/functions/prepare-discovery-data/index.ts` |
| Stage 2 (LLM Analysis) | `supabase/functions/generate-discovery-analysis/index.ts` |
| Admin UI | `src/pages/admin/ClientServicesPage.tsx` |
| Client Portal | `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx` |
| Database Migration | `supabase/migrations/20251212_assessment_patterns.sql` |
| System Doc | `docs/DISCOVERY_ASSESSMENT_SYSTEM.md` |
| This Doc | `docs/ANALYSIS_OUTPUT_FORMATTING.md` |



