# Related Documentation Index

> **COPY FILE - DO NOT EDIT**
> This is a reference document for Claude Project analysis.

---

## Existing Documentation Files

### docs/BENCHMARKING_SERVICE_LINE_SUMMARY.md
**Purpose:** High-level overview of the benchmarking service offering.
**Contents:**
- Service description
- Client journey
- Deliverables
- Pricing

### docs/BENCHMARKING_AND_HVA_QUESTIONNAIRE.md
**Purpose:** Question list for assessments.
**Contents:**
- HVA (Hidden Value Audit) questions
- Benchmarking assessment questions
- Integration between the two

### docs/BENCHMARKING_HIDDEN_VALUE_DISCOVERY.md
**Purpose:** Methodology for hidden value discovery.
**Contents:**
- Value suppressor framework
- Founder risk assessment
- Exit readiness factors

---

## Discovery Assessment Integration

The benchmarking service integrates with the Discovery assessment system.

### Related Files in `discovery assessment analysis/`
- Discovery edge functions
- Discovery components
- Assessment configuration

### HVA Data Flow
```
Discovery Assessment → HVA Responses → Benchmarking → Founder Risk
                                                   → Value Suppressors
                                                   → Exit Readiness
```

---

## Service Catalogue Integration

### services table
The benchmarking service recommends services from the catalogue.

**Service Matching Logic:**
1. Pass 3 identifies opportunities
2. Each opportunity maps to:
   - Existing service (by code)
   - OR new service concept (logged for development)

### Key Service Codes for Benchmarking
- `FRACTIONAL_CFO` - Financial leadership
- `FRACTIONAL_COO` - Operations leadership
- `EXIT_READINESS` - Exit preparation programme
- `GROWTH_ACCELERATOR` - Growth planning
- `PRICING_AUDIT` - Pricing power analysis
- `CASH_OPTIMISATION` - Working capital improvement

---

## API Endpoints

### Edge Functions (Supabase)
```
POST /functions/v1/generate-bm-report-pass1
POST /functions/v1/generate-bm-report-pass2
POST /functions/v1/generate-bm-opportunities
POST /functions/v1/regenerate-bm-report
POST /functions/v1/fetch-industry-benchmarks
POST /functions/v1/save-bm-supplementary-data
POST /functions/v1/process-accounts-upload
```

### Frontend Routes
```
/client/benchmarking/:engagementId        - Client report view
/admin/services/benchmarking/:engagementId - Admin view
/admin/services                           - Service management
```

---

## External Data Sources

### Industry Benchmarks
- **Perplexity Sonar Pro** - Live web search for current benchmarks
- **ONS (Office for National Statistics)** - UK business statistics
- **Companies House** - Company financial data
- **Industry associations** - Sector-specific benchmarks

### Benchmark Caching
Benchmarks are cached in `benchmark_data` table with:
- 30-day freshness window
- Source tracking
- Confidence scoring

---

## Related Systems

### Client Financial Data
```
client_accounts_uploads → process-accounts-upload → client_financial_data
                                                          ↓
                                                   bm_reports.pass1_data
```

### Context Notes
```
client_context_notes → generate-bm-report-pass1 → LLM prompt context
```

### Value Analysis → M&A
```
bm_reports.value_analysis → M&A service valuation baseline
```

---

*Last updated: 2026-02-04*
