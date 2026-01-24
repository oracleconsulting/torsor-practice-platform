# Accounts Upload Feature Specification

## Overview
Allow practices to upload 2-3 years of client accounts for automatic financial data extraction, enabling more accurate benchmarking with real figures rather than estimates.

## User Story
> As a practitioner, I want to upload my client's accounts so that benchmarking analysis uses actual financial data rather than client estimates, improving accuracy and credibility.

---

## User Flow

### 1. Upload Interface
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Upload Client Accounts                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │     📁 Drop files here or click to browse               │   │
│  │                                                          │   │
│  │     Supported: PDF, CSV, Excel (.xlsx)                  │   │
│  │     Max 3 years of accounts                             │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Or connect directly:                                           │
│  [Xero] [QuickBooks] [Sage] [FreeAgent]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Processing & Extraction
```
┌─────────────────────────────────────────────────────────────────┐
│  ⏳ Processing accounts...                                      │
│                                                                 │
│  ✓ FY2025_Accounts.pdf - Parsed                                │
│  ✓ FY2024_Accounts.pdf - Parsed                                │
│  ◌ FY2023_Accounts.pdf - Extracting data...                    │
│                                                                 │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 67%             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Review & Confirm Extracted Data
```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Data Extracted - Please Review                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Metric              │ FY2023    │ FY2024    │ FY2025    │   │
│  │─────────────────────│───────────│───────────│───────────│   │
│  │ Revenue             │ £620,000  │ £680,000  │ £750,000  │   │
│  │ Cost of Sales       │ £372,000  │ £408,000  │ £450,000  │   │
│  │ Gross Profit        │ £248,000  │ £272,000  │ £300,000  │   │
│  │ Gross Margin %      │ 40.0%     │ 40.0%     │ 40.0%     │   │
│  │ Operating Expenses  │ £180,000  │ £190,000  │ £210,000  │   │
│  │ EBITDA              │ £68,000   │ £82,000   │ £90,000   │   │
│  │ EBITDA Margin %     │ 11.0%     │ 12.1%     │ 12.0%     │   │
│  │ Net Profit          │ £52,000   │ £65,000   │ £72,000   │   │
│  │ Debtors             │ £95,000   │ £102,000  │ £115,000  │   │
│  │ Debtor Days         │ 56 days   │ 55 days   │ 56 days   │   │
│  │ Employee Count      │ 6         │ 7         │ 8         │   │
│  │ Rev per Employee    │ £103,333  │ £97,143   │ £93,750   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ 2 items need attention:                                    │
│  • Employee count not found - please enter manually            │
│  • Depreciation unclear - assumed £8,000                       │
│                                                                 │
│  [Edit Values]                    [Confirm & Use in Analysis]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### New Tables

```sql
-- Store uploaded account files
CREATE TABLE client_accounts_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES practice_members(id),
  practice_id UUID NOT NULL REFERENCES practices(id),
  
  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'csv', 'xlsx'
  file_size INTEGER,
  storage_path TEXT, -- Supabase Storage path
  
  -- Processing status
  status TEXT DEFAULT 'pending', -- pending, processing, extracted, confirmed, failed
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Extraction metadata
  fiscal_year_end DATE,
  extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00
  raw_extraction JSONB, -- Full LLM extraction response
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES practice_members(id)
);

-- Store extracted financial data (one row per year)
CREATE TABLE client_financial_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES practice_members(id),
  practice_id UUID NOT NULL REFERENCES practices(id),
  upload_id UUID REFERENCES client_accounts_uploads(id),
  
  -- Period
  fiscal_year INTEGER NOT NULL,
  fiscal_year_end DATE,
  period_months INTEGER DEFAULT 12,
  
  -- P&L Metrics
  revenue DECIMAL(15,2),
  cost_of_sales DECIMAL(15,2),
  gross_profit DECIMAL(15,2),
  gross_margin_pct DECIMAL(5,2),
  operating_expenses DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  ebitda_margin_pct DECIMAL(5,2),
  depreciation DECIMAL(15,2),
  amortisation DECIMAL(15,2),
  interest DECIMAL(15,2),
  tax DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  net_margin_pct DECIMAL(5,2),
  
  -- Balance Sheet
  total_assets DECIMAL(15,2),
  current_assets DECIMAL(15,2),
  fixed_assets DECIMAL(15,2),
  total_liabilities DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  long_term_liabilities DECIMAL(15,2),
  net_assets DECIMAL(15,2),
  
  -- Working Capital
  debtors DECIMAL(15,2),
  creditors DECIMAL(15,2),
  stock DECIMAL(15,2),
  cash DECIMAL(15,2),
  debtor_days INTEGER,
  creditor_days INTEGER,
  
  -- Operational
  employee_count INTEGER,
  revenue_per_employee DECIMAL(15,2),
  
  -- Data Quality
  data_source TEXT DEFAULT 'upload', -- 'upload', 'manual', 'integration'
  confidence_score DECIMAL(3,2),
  manually_adjusted BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_by UUID REFERENCES practice_members(id),
  confirmed_at TIMESTAMPTZ,
  
  UNIQUE(client_id, fiscal_year)
);

-- Audit log for changes
CREATE TABLE client_financial_data_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financial_data_id UUID REFERENCES client_financial_data(id),
  changed_by UUID REFERENCES practice_members(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT
);
```

---

## Technical Implementation

### 1. File Upload (Edge Function)
```typescript
// supabase/functions/upload-client-accounts/index.ts

// 1. Receive file upload
// 2. Store in Supabase Storage
// 3. Create upload record with 'pending' status
// 4. Trigger async processing
```

### 2. Document Processing (Edge Function)
```typescript
// supabase/functions/process-accounts-upload/index.ts

async function processAccountsUpload(uploadId: string) {
  // 1. Download file from storage
  // 2. Extract text based on file type:
  //    - PDF: Use pdf-parse or similar
  //    - CSV/Excel: Parse directly
  // 3. Send to LLM for structured extraction
  // 4. Validate extracted data
  // 5. Store in client_financial_data
  // 6. Update upload status
}
```

### 3. LLM Extraction Prompt
```typescript
const extractionPrompt = `
You are a financial data extraction specialist. Extract the following metrics 
from these accounts for fiscal year ${year}:

REQUIRED METRICS:
- Revenue/Turnover
- Cost of Sales  
- Gross Profit
- Operating Expenses / Administrative Expenses
- EBITDA (calculate if not stated: Operating Profit + Depreciation + Amortisation)
- Depreciation
- Amortisation
- Interest Paid
- Tax
- Net Profit / Profit After Tax

BALANCE SHEET (if available):
- Debtors / Trade Receivables
- Creditors / Trade Payables
- Cash and Cash Equivalents
- Total Current Assets
- Total Current Liabilities
- Fixed Assets / Non-Current Assets

RESPOND IN JSON FORMAT:
{
  "fiscal_year": 2025,
  "fiscal_year_end": "2025-03-31",
  "revenue": 750000,
  "cost_of_sales": 450000,
  "gross_profit": 300000,
  // ... etc
  "confidence": 0.95,
  "notes": ["Employee count not found in document"]
}

ACCOUNTS TEXT:
${accountsText}
`;
```

### 4. Integration with Benchmarking

When generating benchmarking reports, check for uploaded financial data:

```typescript
// In generate-bm-report-pass1/index.ts

// Fetch actual financial data if available
const { data: financialData } = await supabase
  .from('client_financial_data')
  .select('*')
  .eq('client_id', clientId)
  .order('fiscal_year', { ascending: false })
  .limit(3);

if (financialData && financialData.length > 0) {
  // Use actual data instead of assessment estimates
  const latestYear = financialData[0];
  
  enrichedData.revenue = latestYear.revenue;
  enrichedData.gross_margin = latestYear.gross_margin_pct;
  enrichedData.ebitda_margin = latestYear.ebitda_margin_pct;
  enrichedData.debtor_days = latestYear.debtor_days;
  
  // Add year-over-year analysis
  if (financialData.length >= 2) {
    enrichedData.revenue_growth = calculateGrowth(
      financialData[1].revenue, 
      financialData[0].revenue
    );
  }
  
  // Flag that we're using actual data
  enrichedData.data_source = 'uploaded_accounts';
  enrichedData.data_years_available = financialData.length;
}
```

---

## UI Components

### AccountsUploadPanel.tsx
```tsx
interface AccountsUploadPanelProps {
  clientId: string;
  existingUploads: AccountUpload[];
  existingFinancialData: FinancialData[];
  onUploadComplete: () => void;
}
```

### FinancialDataReviewModal.tsx
```tsx
interface FinancialDataReviewModalProps {
  extractedData: ExtractedFinancialData[];
  onConfirm: (data: FinancialData[]) => void;
  onEdit: (year: number, field: string, value: number) => void;
}
```

### FinancialTrendChart.tsx
```tsx
// Shows 3-year trends for key metrics
// Revenue growth, margin trends, etc.
```

---

## Accounting Software Integrations (Phase 2)

Direct connections to pull data automatically:

| Platform | API | Data Available |
|----------|-----|----------------|
| Xero | REST API | P&L, Balance Sheet, Invoices |
| QuickBooks | REST API | P&L, Balance Sheet |
| Sage | REST API | P&L, Balance Sheet |
| FreeAgent | REST API | P&L, Balance Sheet |

Benefits:
- Real-time data sync
- No manual upload needed
- Multi-year history automatically
- Invoice-level data for debtor analysis

---

## Security Considerations

1. **Data Encryption**: All uploaded files encrypted at rest
2. **Access Control**: Only practice members can view/upload client data
3. **Audit Trail**: All changes logged
4. **Data Retention**: Configurable retention period
5. **GDPR Compliance**: Data deletion on request

---

## Development Phases

### Phase 1: Manual Upload (MVP)
- [ ] File upload to Supabase Storage
- [ ] PDF text extraction
- [ ] LLM data extraction
- [ ] Review & confirm UI
- [ ] Integration with benchmarking

### Phase 2: Enhanced Extraction
- [ ] CSV/Excel parsing
- [ ] Multi-document correlation
- [ ] Automatic year detection
- [ ] Higher accuracy extraction

### Phase 3: Integrations
- [ ] Xero integration
- [ ] QuickBooks integration
- [ ] Auto-sync on engagement creation

---

## Estimated Effort

| Component | Effort |
|-----------|--------|
| Database schema | 2 hours |
| File upload edge function | 4 hours |
| PDF processing | 6 hours |
| LLM extraction tuning | 8 hours |
| Review UI | 8 hours |
| Benchmarking integration | 4 hours |
| Testing & refinement | 8 hours |
| **Total** | **~40 hours** |

---

## Success Metrics

1. **Extraction Accuracy**: >90% of fields correctly extracted
2. **Time Saved**: Reduce data entry from 30min to 5min per client
3. **Report Quality**: Benchmarking reports show "Actual Data" badge
4. **Adoption**: 50%+ of benchmarking engagements use uploaded accounts


