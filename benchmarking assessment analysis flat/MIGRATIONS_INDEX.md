# Benchmarking Migrations Index

> **COPY FILE - DO NOT EDIT**
> This is a reference document for Claude Project analysis.

---

## Core Schema Migrations

### 20251222_benchmarking_complete.sql
**Purpose:** Initial benchmarking schema creation.
**Creates:**
- `bm_engagements` - Engagement tracking
- `bm_assessment_responses` - Questionnaire answers
- `bm_reports` - Generated reports
- `bm_metric_comparisons` - Metric benchmarking

### 20251222_seed_benchmarking_assessment_questions.sql
**Purpose:** Seed benchmarking assessment questions.

### 20251222_add_benchmarking_service_line.sql
**Purpose:** Add benchmarking to service_lines table.

---

## Benchmark Data Seeding (Industry Benchmarks)

### 20251222_seed_benchmark_data_batch1_professional_services.sql
### 20251222_seed_benchmark_data_batch2_healthcare.sql
### 20251222_seed_benchmark_data_batch3_hospitality.sql
### 20251222_seed_benchmark_data_batch4_construction_property.sql
### 20251222_seed_benchmark_data_batch5_technology.sql
### 20251222_seed_benchmark_data_batch6_retail.sql
### 20251222_seed_benchmark_data_batch7_manufacturing.sql
### 20251222_seed_benchmark_data_batch8_wholesale_logistics.sql
### 20251222_seed_benchmark_data_batch9_financial_services.sql
### 20251222_seed_benchmark_data_batch10_charities_education.sql
### 20251222_seed_benchmark_data_batch11_creative.sql
### 20251222_seed_benchmark_data_batch12_other_services.sql

---

## Feature Enhancements

### 20251222_add_status_to_bm_reports.sql
**Purpose:** Add status tracking to reports.

### 20251222_add_responses_jsonb_to_bm_assessment_responses.sql
**Purpose:** Add JSONB responses column.

### 20260119_benchmark_live_search.sql
**Purpose:** Add live search tracking.
**Creates:**
- `benchmark_search_log` table
- Tracking columns for Perplexity searches

### 20260120_bm_sources_detail.sql
**Purpose:** Add source tracking to benchmark_data.
**Adds:**
- `fetched_via` column
- `sources` JSONB column
- `confidence_score` column

### 20260120_bm_enhanced_admin_guidance.sql
**Purpose:** Add admin guidance columns.

### 20260129_update_benchmarking_service_metadata.sql
**Purpose:** Update service line metadata.

### 20260129_bm_balance_sheet_trends.sql
**Purpose:** Add balance sheet and trend analysis.
**Adds:**
- `balance_sheet` JSONB
- `financial_trends` JSONB
- `historical_financials` JSONB
- `investment_signals` JSONB
- `current_ratio`, `quick_ratio`, `cash_months`

### 20260130_bm_surplus_cash_founder_risk.sql
**Purpose:** Add surplus cash and founder risk.
**Adds:**
- `surplus_cash` JSONB
- `founder_risk_level` TEXT
- `founder_risk_score` INTEGER
- `founder_risk_factors` JSONB
- `founder_risk_valuation_impact` TEXT

### 20260130_add_cancelled_status.sql
**Purpose:** Add cancelled status option.

### 20260131_add_itserv_revenue_per_employee.sql
**Purpose:** Add IT Services benchmarks.

### 20260131_add_telecom_infra_industry.sql
**Purpose:** Add Telecom Infrastructure industry.

---

## Value Analysis & Opportunities

### 20260201_add_value_analysis_column.sql
**Purpose:** Add value_analysis JSONB column to bm_reports.

### 20260201_create_client_opportunities_table.sql
**Purpose:** Create client_opportunities table.
**Schema:**
- `engagement_id` - Link to engagement
- `client_id` - Link to client
- `opportunity_code` - Unique code
- `title`, `category`, `severity`
- `priority`, `priority_rationale`
- `data_evidence`, `data_values`
- `financial_impact_type`, `financial_impact_amount`
- `recommended_service_id`, `suggested_concept_id`
- `talking_point`, `question_to_ask`, `quick_win`
- `life_impact`

### 20260201_create_services_table.sql
**Purpose:** Create services catalogue table.

### 20260201_add_services_catalog.sql
**Purpose:** Seed initial services.

### 20260201_add_client_scenarios.sql
**Purpose:** Add bm_client_scenarios table.

### 20260201_strategic_overhaul.sql
**Purpose:** Major strategic features update.

### 20260201_add_leadership_direction_questions.sql
**Purpose:** Add leadership direction questions.

### 20260202_value_suppressors_overhaul.sql
**Purpose:** Overhaul suppressor tracking.
**Adds:**
- `value_suppressors` JSONB
- `total_value_discount` NUMERIC
- `baseline_multiple` NUMERIC
- `discounted_multiple` NUMERIC

---

## Recent Enhancements

### 20260203_opportunity_calculations.sql
**Purpose:** Add enhanced calculation transparency.
**Adds:**
- `opportunity_calculations` JSONB
- `enhanced_suppressors` JSONB
- `exit_readiness_breakdown` JSONB
- `two_paths_narrative` JSONB

### 20260203_client_type_classification.sql
**Purpose:** Add client type classification.

### 20260203_new_client_type_services.sql
**Purpose:** Add new client type specific services.

### 20260203_fix_service_pricing_models.sql
**Purpose:** Fix service pricing model issues.

### 20260203_cleanup_client_alex.sql
**Purpose:** Client data cleanup.

### 20260204_expand_context_note_types.sql
**Purpose:** Expand context note types.
**Adds note types:**
- `discovery_call`
- `follow_up_answer`
- `advisor_observation`
- `client_email`
- `meeting_notes`
- `background_context`

---

## RLS Policy Migrations

### 20251222_fix_bm_reports_rls_policy.sql
### 20251222_fix_bm_assessment_responses_rls_upsert.sql
### 20251222_fix_bm_rls_client_inserts.sql
### 20251222_fix_bm_rls_client_inserts_v2.sql

---

## Migration File Locations

All migrations are in: `supabase/migrations/`

To apply migrations:
```bash
supabase db push
```

To view migration status:
```bash
supabase migration list
```

---

*Last updated: 2026-02-04*
