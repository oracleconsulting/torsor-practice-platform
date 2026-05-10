-- Add client_collection_fields to industry_valuation_basis for gap detection
BEGIN;

ALTER TABLE industry_valuation_basis
  ADD COLUMN IF NOT EXISTS client_collection_fields JSONB;

COMMENT ON COLUMN industry_valuation_basis.client_collection_fields IS
  'Array of field definitions the client needs to provide for this industry x stage. Pass 1 compares against actual data to surface gaps.';

UPDATE industry_valuation_basis
SET client_collection_fields = jsonb_build_array(
  jsonb_build_object('field','target_exit_valuation','source_table','bm_engagements','label','Target exit valuation','type','currency','required',true,'rationale','Anchors the VC method back-solve and metric targets.','drives',jsonb_build_array('valuation','metric_targets','scenarios')),
  jsonb_build_object('field','exit_horizon_years','source_table','bm_engagements','label','Exit horizon (years)','type','number','required',true,'rationale','Year-by-year valuation milestones depend on this.','drives',jsonb_build_array('valuation','metric_targets')),
  jsonb_build_object('field','forecast_year_1','source_table','bm_pre_revenue_signals','label','Year 1 forecast (revenue, ARR, EBITDA, headcount, GM)','type','forecast_year','required',true,'rationale','Forecast credibility scoring is capped without this.','drives',jsonb_build_array('investment_readiness.forecast_credibility')),
  jsonb_build_object('field','forecast_year_2','source_table','bm_pre_revenue_signals','label','Year 2 forecast','type','forecast_year','required',true,'rationale','As above.','drives',jsonb_build_array('investment_readiness.forecast_credibility')),
  jsonb_build_object('field','forecast_year_3','source_table','bm_pre_revenue_signals','label','Year 3 forecast','type','forecast_year','required',true,'rationale','As above.','drives',jsonb_build_array('investment_readiness.forecast_credibility')),
  jsonb_build_object('field','pipeline_qualified_acv','source_table','bm_pre_revenue_signals','label','Total qualified pipeline ACV','type','currency','required',true,'rationale','Drives pipeline quality scoring (0/25 if blank).','drives',jsonb_build_array('investment_readiness.pipeline')),
  jsonb_build_object('field','pipeline_top3_acv','source_table','bm_pre_revenue_signals','label','Top 3 prospect ACV (named)','type','currency','required',true,'rationale','Concentration risk surfaces top-3 dependency.','drives',jsonb_build_array('investment_readiness.pipeline')),
  jsonb_build_object('field','pipeline_signed_loi_count','source_table','bm_pre_revenue_signals','label','Number of signed LOIs','type','number','required',false,'rationale','Adds 5+ points to readiness; marks scenario base as defensible.','drives',jsonb_build_array('investment_readiness.pipeline','valuation.scorecard')),
  jsonb_build_object('field','round_size_target','source_table','bm_pre_revenue_signals','label','Round size you are raising','type','currency','required',true,'rationale','Pre-money triangulation needs this.','drives',jsonb_build_array('valuation.vc_method')),
  jsonb_build_object('field','round_pre_money_target','source_table','bm_pre_revenue_signals','label','Pre-money you are asking for','type','currency','required',true,'rationale','Triangulated against our defensible range.','drives',jsonb_build_array('valuation.position_narrative')),
  jsonb_build_object('field','round_seis_eis_advance_assurance','source_table','bm_pre_revenue_signals','label','SEIS/EIS advance assurance secured','type','boolean','required',true,'rationale','Without it the round closes to a fraction of UK angel market.','drives',jsonb_build_array('investment_readiness.cap_table')),
  jsonb_build_object('field','cap_table_complexity','source_table','bm_pre_revenue_signals','label','Cap table complexity','type','enum','required',true,'rationale','Flags EIS-incompatible structures.','drives',jsonb_build_array('investment_readiness.cap_table')),
  jsonb_build_object('field','team_size_current','source_table','bm_pre_revenue_signals','label','Current team size','type','number','required',true,'rationale','Team gap scoring relies on knowing actuals.','drives',jsonb_build_array('investment_readiness.team')),
  jsonb_build_object('field','team_gaps_critical','source_table','bm_pre_revenue_signals','label','Critical hiring gaps','type','tags','required',true,'rationale','Missing C-suite hires reduce team score and surface as suppressors.','drives',jsonb_build_array('investment_readiness.team')),
  jsonb_build_object('field','ip_holding_entity','source_table','bm_pre_revenue_signals','label','Where does the IP currently sit?','type','text','required',true,'rationale','IP migration is the single biggest binding constraint on raises.','drives',jsonb_build_array('investment_readiness.data_room')),
  jsonb_build_object('field','data_room_completeness_pct','source_table','bm_pre_revenue_signals','label','Data room completeness (%)','type','percent','required',true,'rationale','Data room scoring depends on this.','drives',jsonb_build_array('investment_readiness.data_room'))
)
WHERE industry_code = 'SAAS_REGTECH'
  AND business_stage IN ('pre_revenue', 'early_revenue');

COMMIT;
