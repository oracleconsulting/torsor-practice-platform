-- COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md
-- ============================================================================
-- DISCOVERY REPORTS: 7-DIMENSION COMPREHENSIVE ANALYSIS COLUMNS
-- ============================================================================
-- Adds columns to store the pre-calculated 7-dimension analysis from Pass 1:
-- - Valuation Analysis
-- - Revenue Trajectory  
-- - Payroll Efficiency
-- - Revenue Per Head (Productivity)
-- - Working Capital Efficiency
-- - Exit Readiness Score
-- - Cost of Inaction
--
-- Plus Destination Clarity pre-calculation and Industry Detection
-- ============================================================================

-- Add comprehensive analysis column (stores all 7 dimensions)
ALTER TABLE discovery_reports 
ADD COLUMN IF NOT EXISTS comprehensive_analysis JSONB,
ADD COLUMN IF NOT EXISTS destination_clarity JSONB,
ADD COLUMN IF NOT EXISTS detected_industry TEXT;

-- Add index for faster queries on data quality
CREATE INDEX IF NOT EXISTS idx_discovery_reports_data_quality 
ON discovery_reports ((comprehensive_analysis->>'dataQuality'));

-- Add index for industry queries
CREATE INDEX IF NOT EXISTS idx_discovery_reports_industry 
ON discovery_reports (detected_industry) 
WHERE detected_industry IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN discovery_reports.comprehensive_analysis IS 
'Pre-calculated 7-dimension analysis from Pass 1: valuation, trajectory, payroll, productivity, workingCapital, exitReadiness, costOfInaction';

COMMENT ON COLUMN discovery_reports.destination_clarity IS 
'Pre-calculated Destination Clarity score (1-10) with reasoning and factors, calculated before LLM prompt to ensure consistency';

COMMENT ON COLUMN discovery_reports.detected_industry IS 
'Auto-detected industry code from assessment responses and company name, used for benchmark selection';

-- ============================================================================
-- STRUCTURE REFERENCE (for Pass 1 -> Pass 2 handoff)
-- ============================================================================
-- comprehensive_analysis JSONB structure:
-- {
--   "dataQuality": "comprehensive" | "partial" | "limited",
--   "availableMetrics": ["valuation", "trajectory", "payroll", ...],
--   "missingMetrics": ["workingCapital", ...],
--   "valuation": {
--     "hasData": true,
--     "operatingProfit": 310000,
--     "adjustedMultipleLow": 3.5,
--     "adjustedMultipleHigh": 4.5,
--     "conservativeValue": 1085000,
--     "optimisticValue": 1395000,
--     "hiddenAssets": [{"type": "property", "value": 200000, "description": "Freehold property"}],
--     "narrative": "..."
--   },
--   "trajectory": {
--     "hasData": true,
--     "currentRevenue": 2150000,
--     "priorRevenue": 2167000,
--     "percentageChange": -0.78,
--     "trend": "declining",
--     "concernLevel": "monitor",
--     "narrative": "..."
--   },
--   "payroll": {
--     "isOverstaffed": true,
--     "staffCosts": 790000,
--     "turnover": 2150000,
--     "staffCostsPct": 36.7,
--     "annualExcess": 148000,
--     "benchmark": {"typical": 30, "good": 28, "concern": 32},
--     "assessment": "elevated",
--     "narrative": "..."
--   },
--   "productivity": {
--     "hasData": true,
--     "revenuePerHead": 108000,
--     "benchmarkLow": 120000,
--     "excessHeadcount": 2,
--     "narrative": "..."
--   },
--   "workingCapital": {
--     "hasData": true,
--     "debtorDays": null,
--     "concerns": [],
--     "narrative": "..."
--   },
--   "exitReadiness": {
--     "score": 53,
--     "maxScore": 100,
--     "readiness": "not_ready",
--     "strengths": ["Clear exit intent"],
--     "blockers": ["Founder dependency", "No valuation baseline"],
--     "narrative": "..."
--   },
--   "costOfInaction": {
--     "hasData": true,
--     "timeHorizon": 3,
--     "totalAnnual": 150000,
--     "totalOverHorizon": 450000,
--     "components": [...],
--     "narrative": "..."
--   }
-- }
--
-- destination_clarity JSONB structure:
-- {
--   "score": 8,
--   "reasoning": "Crystal clear on the destination - specific outcome, timeline, and stakeholder considerations defined.",
--   "factors": ["Specific exit timeline (1-3 years)", "Concrete exit outcome defined", "Stakeholder consideration"]
-- }
-- ============================================================================
