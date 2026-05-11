import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Plus, X, Rocket } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PreRevenueSignalsPanelProps {
  engagementId: string;
  onSave?: () => void;
}

interface ForecastYear {
  revenue?: number | '';
  arr?: number | '';
  ebitda?: number | '';
  headcount?: number | '';
  grossMargin?: number | '';
}

interface HirePlanItem {
  role: string;
  timing: string;
  budget: number | '';
  candidateStatus: string;
}

interface UseOfFundsItem {
  category: string;
  amount: number | '';
  percentOfTotal: number | '';
  notes: string;
}

interface PipelineDeal {
  prospectName: string;
  stage: string;
  expectedAcv: number | '';
  expectedCloseDate: string;
  discountOffered: string;
  notes: string;
}

interface InvestorCommitment {
  investorName: string;
  amount: number | '';
  status: string;
  role: string;
  notes: string;
}

const emptyForecast = (): ForecastYear => ({ revenue: '', arr: '', ebitda: '', headcount: '', grossMargin: '' });
const emptyHire = (): HirePlanItem => ({ role: '', timing: '', budget: '', candidateStatus: '' });
const emptyUseOfFunds = (): UseOfFundsItem => ({ category: '', amount: '', percentOfTotal: '', notes: '' });
const emptyPipelineDeal = (): PipelineDeal => ({ prospectName: '', stage: '', expectedAcv: '', expectedCloseDate: '', discountOffered: '', notes: '' });
const emptyInvestorCommitment = (): InvestorCommitment => ({ investorName: '', amount: '', status: '', role: '', notes: '' });

export function PreRevenueSignalsPanel({ engagementId, onSave }: PreRevenueSignalsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Capital & Runway
  const [founderCapitalInvested, setFounderCapitalInvested] = useState<number | ''>('');
  const [founderCapitalBasis, setFounderCapitalBasis] = useState('');
  const [currentRunwayMonths, setCurrentRunwayMonths] = useState<number | ''>('');
  const [monthlyBurn, setMonthlyBurn] = useState<number | ''>('');
  const [capitalRaisedToDate, setCapitalRaisedToDate] = useState<number | ''>('');

  // Forecasts
  const [forecastYear1, setForecastYear1] = useState<ForecastYear>(emptyForecast());
  const [forecastYear2, setForecastYear2] = useState<ForecastYear>(emptyForecast());
  const [forecastYear3, setForecastYear3] = useState<ForecastYear>(emptyForecast());
  const [forecastAssumptions, setForecastAssumptions] = useState('');
  const [forecastConfidence, setForecastConfidence] = useState('');

  // Pipeline
  const [pipelineQualifiedAcv, setPipelineQualifiedAcv] = useState<number | ''>('');
  const [pipelineTop3Acv, setPipelineTop3Acv] = useState<number | ''>('');
  const [pipelineTop3ConcentrationPct, setPipelineTop3ConcentrationPct] = useState<number | ''>('');
  const [pipelineSignedLoiCount, setPipelineSignedLoiCount] = useState<number | ''>('');
  const [pipelineVerbalCount, setPipelineVerbalCount] = useState<number | ''>('');
  const [pipelineColdCount, setPipelineColdCount] = useState<number | ''>('');
  const [pipelineExpectedConversionPct, setPipelineExpectedConversionPct] = useState<number | ''>('');
  const [pipelineFirstRevenueEta, setPipelineFirstRevenueEta] = useState('');
  const [pipelineEvidenceStrength, setPipelineEvidenceStrength] = useState('');

  // Round Structure
  const [roundSizeTarget, setRoundSizeTarget] = useState<number | ''>('');
  const [roundPreMoneyTarget, setRoundPreMoneyTarget] = useState<number | ''>('');
  const [roundPreMoneyMin, setRoundPreMoneyMin] = useState<number | ''>('');
  const [roundSeisEisEligible, setRoundSeisEisEligible] = useState(false);
  const [roundSeisEisAdvanceAssurance, setRoundSeisEisAdvanceAssurance] = useState(false);
  const [roundLeadInvestorStatus, setRoundLeadInvestorStatus] = useState('');
  const [roundCommittedToDate, setRoundCommittedToDate] = useState<number | ''>('');
  const [roundClosingTargetDate, setRoundClosingTargetDate] = useState('');
  const [followOnRoundSize, setFollowOnRoundSize] = useState<number | ''>('');
  const [followOnMilestones, setFollowOnMilestones] = useState('');

  // Cap Table
  const [capTableComplexity, setCapTableComplexity] = useState('');
  const [capTableShareClasses, setCapTableShareClasses] = useState('');
  const [capTableEisFriendly, setCapTableEisFriendly] = useState(false);
  const [capTableVotingStructureNotes, setCapTableVotingStructureNotes] = useState('');
  const [founderOwnershipCurrentPct, setFounderOwnershipCurrentPct] = useState<number | ''>('');

  // Team & Hires
  const [teamSizeCurrent, setTeamSizeCurrent] = useState<number | ''>('');
  const [teamGapsCritical, setTeamGapsCritical] = useState('');
  const [hirePlan12mo, setHirePlan12mo] = useState<HirePlanItem[]>([]);
  const [founderPedigreeSummary, setFounderPedigreeSummary] = useState('');
  const [founderPriorExits, setFounderPriorExits] = useState(false);

  // IP & Structure
  const [ipHoldingEntity, setIpHoldingEntity] = useState('');
  const [ipProtectionStatus, setIpProtectionStatus] = useState<string[]>([]);
  const [corporateStructureClean, setCorporateStructureClean] = useState(false);
  const [ipMigrationRequired, setIpMigrationRequired] = useState(false);
  const [ipMigrationNotes, setIpMigrationNotes] = useState('');

  // Data Room
  const [dataRoomCompletenessPct, setDataRoomCompletenessPct] = useState<number>(0);
  const [dataRoomGaps, setDataRoomGaps] = useState('');

  // Governance
  const [governanceBoardStatus, setGovernanceBoardStatus] = useState('');
  const [governanceNedsCount, setGovernanceNedsCount] = useState<number | ''>('');
  const [governanceAdvisorsCount, setGovernanceAdvisorsCount] = useState<number | ''>('');

  // Notes
  const [contextNotes, setContextNotes] = useState('');

  // New raise-centric fields (patch B1)
  const [useOfFunds, setUseOfFunds] = useState<UseOfFundsItem[]>([]);
  const [pipelineDeals, setPipelineDeals] = useState<PipelineDeal[]>([]);
  const [pricingStrategyNotes, setPricingStrategyNotes] = useState('');
  const [incorporationStatus, setIncorporationStatus] = useState('');
  const [investorCommitments, setInvestorCommitments] = useState<InvestorCommitment[]>([]);

  const parseForecast = (raw: any): ForecastYear => {
    if (!raw || typeof raw !== 'object') return emptyForecast();
    return {
      revenue: raw.revenue ?? '',
      arr: raw.arr ?? '',
      ebitda: raw.ebitda ?? '',
      headcount: raw.headcount ?? '',
      grossMargin: raw.grossMargin ?? raw.gross_margin ?? '',
    };
  };

  const loadSignals = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bm_pre_revenue_signals')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();

    if (data) {
      setFounderCapitalInvested(data.founder_capital_invested ?? '');
      setFounderCapitalBasis(data.founder_capital_basis ?? '');
      setCurrentRunwayMonths(data.current_runway_months ?? '');
      setMonthlyBurn(data.monthly_burn ?? '');
      setCapitalRaisedToDate(data.capital_raised_to_date ?? '');
      setForecastYear1(parseForecast(data.forecast_year_1));
      setForecastYear2(parseForecast(data.forecast_year_2));
      setForecastYear3(parseForecast(data.forecast_year_3));
      setForecastAssumptions(data.forecast_assumptions ?? '');
      setForecastConfidence(data.forecast_confidence ?? '');
      setPipelineQualifiedAcv(data.pipeline_qualified_acv ?? '');
      setPipelineTop3Acv(data.pipeline_top3_acv ?? '');
      setPipelineTop3ConcentrationPct(data.pipeline_top3_concentration_pct ?? '');
      setPipelineSignedLoiCount(data.pipeline_signed_loi_count ?? '');
      setPipelineVerbalCount(data.pipeline_verbal_count ?? '');
      setPipelineColdCount(data.pipeline_cold_count ?? '');
      setPipelineExpectedConversionPct(data.pipeline_expected_conversion_pct ?? '');
      setPipelineFirstRevenueEta(data.pipeline_first_revenue_eta ?? '');
      setPipelineEvidenceStrength(data.pipeline_evidence_strength ?? '');
      setRoundSizeTarget(data.round_size_target ?? '');
      setRoundPreMoneyTarget(data.round_pre_money_target ?? '');
      setRoundPreMoneyMin(data.round_pre_money_min ?? '');
      setRoundSeisEisEligible(data.round_seis_eis_eligible ?? false);
      setRoundSeisEisAdvanceAssurance(data.round_seis_eis_advance_assurance ?? false);
      setRoundLeadInvestorStatus(data.round_lead_investor_status ?? '');
      setRoundCommittedToDate(data.round_committed_to_date ?? '');
      setRoundClosingTargetDate(data.round_closing_target_date ?? '');
      setFollowOnRoundSize(data.follow_on_round_size ?? '');
      setFollowOnMilestones(Array.isArray(data.follow_on_milestones) ? data.follow_on_milestones.join(', ') : '');
      setCapTableComplexity(data.cap_table_complexity ?? '');
      setCapTableShareClasses(Array.isArray(data.cap_table_share_classes) ? data.cap_table_share_classes.join(', ') : '');
      setCapTableEisFriendly(data.cap_table_eis_friendly ?? false);
      setCapTableVotingStructureNotes(data.cap_table_voting_structure_notes ?? '');
      setFounderOwnershipCurrentPct(data.founder_ownership_current_pct ?? '');
      setTeamSizeCurrent(data.team_size_current ?? '');
      setTeamGapsCritical(Array.isArray(data.team_gaps_critical) ? data.team_gaps_critical.join(', ') : '');
      setHirePlan12mo(Array.isArray(data.hire_plan_12mo) ? data.hire_plan_12mo.map((h: any) => ({
        role: h.role ?? '', timing: h.timing ?? '', budget: h.budget ?? '', candidateStatus: h.candidateStatus ?? h.candidate_status ?? '',
      })) : []);
      setFounderPedigreeSummary(data.founder_pedigree_summary ?? '');
      setFounderPriorExits(data.founder_prior_exits ?? false);
      setIpHoldingEntity(data.ip_holding_entity ?? '');
      setIpProtectionStatus(Array.isArray(data.ip_protection_status) ? data.ip_protection_status : []);
      setCorporateStructureClean(data.corporate_structure_clean ?? false);
      setIpMigrationRequired(data.ip_migration_required ?? false);
      setIpMigrationNotes(data.ip_migration_notes ?? '');
      setDataRoomCompletenessPct(data.data_room_completeness_pct ?? 0);
      setDataRoomGaps(Array.isArray(data.data_room_gaps) ? data.data_room_gaps.join(', ') : '');
      setGovernanceBoardStatus(data.governance_board_status ?? '');
      setGovernanceNedsCount(data.governance_neds_count ?? '');
      setGovernanceAdvisorsCount(data.governance_advisors_count ?? '');
      setContextNotes(data.context_notes ?? '');

      // New raise-centric fields (patch B1)
      setUseOfFunds(
        Array.isArray(data.use_of_funds)
          ? data.use_of_funds.map((u: any) => ({
              category: u.category ?? '',
              amount: u.amount ?? '',
              percentOfTotal: u.percent_of_total ?? u.percentOfTotal ?? '',
              notes: u.notes ?? '',
            }))
          : []
      );
      setPipelineDeals(
        Array.isArray(data.pipeline_deals)
          ? data.pipeline_deals.map((d: any) => ({
              prospectName: d.prospect_name ?? d.prospectName ?? '',
              stage: d.stage ?? '',
              expectedAcv: d.expected_acv ?? d.expectedAcv ?? '',
              expectedCloseDate: d.expected_close_date ?? d.expectedCloseDate ?? '',
              discountOffered: d.discount_offered ?? d.discountOffered ?? '',
              notes: d.notes ?? '',
            }))
          : []
      );
      setPricingStrategyNotes(data.pricing_strategy_notes ?? '');
      setIncorporationStatus(data.incorporation_status ?? '');
      setInvestorCommitments(
        Array.isArray(data.investor_commitments)
          ? data.investor_commitments.map((i: any) => ({
              investorName: i.investor_name ?? i.investorName ?? '',
              amount: i.amount ?? '',
              status: i.status ?? '',
              role: i.role ?? '',
              notes: i.notes ?? '',
            }))
          : []
      );
    }
    setLoading(false);
  }, [engagementId]);

  useEffect(() => { loadSignals(); }, [loadSignals]);

  const num = (v: number | ''): number | null => (v === '' ? null : v);

  const forecastToJson = (f: ForecastYear) => {
    const hasValue = Object.values(f).some(v => v !== '' && v !== undefined);
    if (!hasValue) return null;
    return {
      revenue: num(f.revenue ?? ''),
      arr: num(f.arr ?? ''),
      ebitda: num(f.ebitda ?? ''),
      headcount: num(f.headcount ?? ''),
      grossMargin: num(f.grossMargin ?? ''),
    };
  };

  const csvToArray = (s: string): string[] | null => {
    const arr = s.split(',').map(v => v.trim()).filter(Boolean);
    return arr.length > 0 ? arr : null;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        engagement_id: engagementId,
        founder_capital_invested: num(founderCapitalInvested),
        founder_capital_basis: founderCapitalBasis || null,
        current_runway_months: num(currentRunwayMonths),
        monthly_burn: num(monthlyBurn),
        capital_raised_to_date: num(capitalRaisedToDate),
        forecast_year_1: forecastToJson(forecastYear1),
        forecast_year_2: forecastToJson(forecastYear2),
        forecast_year_3: forecastToJson(forecastYear3),
        forecast_assumptions: forecastAssumptions || null,
        forecast_confidence: forecastConfidence || null,
        pipeline_qualified_acv: num(pipelineQualifiedAcv),
        pipeline_top3_acv: num(pipelineTop3Acv),
        pipeline_top3_concentration_pct: num(pipelineTop3ConcentrationPct),
        pipeline_signed_loi_count: num(pipelineSignedLoiCount),
        pipeline_verbal_count: num(pipelineVerbalCount),
        pipeline_cold_count: num(pipelineColdCount),
        pipeline_expected_conversion_pct: num(pipelineExpectedConversionPct),
        pipeline_first_revenue_eta: pipelineFirstRevenueEta || null,
        pipeline_evidence_strength: pipelineEvidenceStrength || null,
        round_size_target: num(roundSizeTarget),
        round_pre_money_target: num(roundPreMoneyTarget),
        round_pre_money_min: num(roundPreMoneyMin),
        round_seis_eis_eligible: roundSeisEisEligible,
        round_seis_eis_advance_assurance: roundSeisEisAdvanceAssurance,
        round_lead_investor_status: roundLeadInvestorStatus || null,
        round_committed_to_date: num(roundCommittedToDate),
        round_closing_target_date: roundClosingTargetDate || null,
        follow_on_round_size: num(followOnRoundSize),
        follow_on_milestones: csvToArray(followOnMilestones),
        cap_table_complexity: capTableComplexity || null,
        cap_table_share_classes: csvToArray(capTableShareClasses),
        cap_table_eis_friendly: capTableEisFriendly,
        cap_table_voting_structure_notes: capTableVotingStructureNotes || null,
        founder_ownership_current_pct: num(founderOwnershipCurrentPct),
        team_size_current: num(teamSizeCurrent),
        team_gaps_critical: csvToArray(teamGapsCritical),
        hire_plan_12mo: hirePlan12mo.length > 0
          ? hirePlan12mo.filter(h => h.role).map(h => ({ role: h.role, timing: h.timing, budget: num(h.budget), candidateStatus: h.candidateStatus }))
          : null,
        founder_pedigree_summary: founderPedigreeSummary || null,
        founder_prior_exits: founderPriorExits,
        ip_holding_entity: ipHoldingEntity || null,
        ip_protection_status: ipProtectionStatus.length > 0 ? ipProtectionStatus : null,
        corporate_structure_clean: corporateStructureClean,
        ip_migration_required: ipMigrationRequired,
        ip_migration_notes: ipMigrationNotes || null,
        data_room_completeness_pct: dataRoomCompletenessPct,
        data_room_gaps: csvToArray(dataRoomGaps),
        governance_board_status: governanceBoardStatus || null,
        governance_neds_count: num(governanceNedsCount),
        governance_advisors_count: num(governanceAdvisorsCount),
        context_notes: contextNotes || null,

        // New raise-centric fields (patch B1)
        use_of_funds: useOfFunds.length > 0
          ? useOfFunds
              .filter(u => u.category)
              .map(u => ({
                category: u.category,
                amount: num(u.amount),
                percent_of_total: num(u.percentOfTotal),
                notes: u.notes || null,
              }))
          : null,
        pipeline_deals: pipelineDeals.length > 0
          ? pipelineDeals
              .filter(d => d.prospectName)
              .map(d => ({
                prospect_name: d.prospectName,
                stage: d.stage || null,
                expected_acv: num(d.expectedAcv),
                expected_close_date: d.expectedCloseDate || null,
                discount_offered: d.discountOffered || null,
                notes: d.notes || null,
              }))
          : null,
        pricing_strategy_notes: pricingStrategyNotes || null,
        incorporation_status: incorporationStatus || null,
        investor_commitments: investorCommitments.length > 0
          ? investorCommitments
              .filter(i => i.investorName)
              .map(i => ({
                investor_name: i.investorName,
                amount: num(i.amount),
                status: i.status || null,
                role: i.role || null,
                notes: i.notes || null,
              }))
          : null,

        updated_at: new Date().toISOString(),
      };

      const { error: err } = await supabase
        .from('bm_pre_revenue_signals')
        .upsert(payload, { onConflict: 'engagement_id' });

      if (err) throw err;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSave?.();
    } catch (e: any) {
      setError(e.message || 'Failed to save signals');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 8, color: '#64748b' }}>
        <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
        Loading signals…
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Rocket style={{ width: 18, height: 18, color: '#8b5cf6' }} />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>Pre-Revenue Signals</h3>
      </div>

      {error && <div style={errorBanner}>{error}</div>}
      {success && <div style={successBanner}>Signals saved successfully</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* ── Section 1: Capital & Runway ── */}
        <Fieldset legend="Capital & Runway">
          <div style={gridTwo}>
            <CurrencyField label="Founder Capital Invested" value={founderCapitalInvested} onChange={setFounderCapitalInvested} />
            <Field label="Founder Capital Basis" value={founderCapitalBasis} onChange={setFounderCapitalBasis} placeholder="e.g. personal savings, prior exit" />
            <NumberField label="Current Runway (months)" value={currentRunwayMonths} onChange={setCurrentRunwayMonths} />
            <CurrencyField label="Monthly Burn" value={monthlyBurn} onChange={setMonthlyBurn} />
            <CurrencyField label="Capital Raised to Date" value={capitalRaisedToDate} onChange={setCapitalRaisedToDate} />
          </div>
        </Fieldset>

        {/* ── Section 2: Forecasts ── */}
        <Fieldset legend="Forecasts">
          {[
            { label: 'Year 1', state: forecastYear1, setter: setForecastYear1 },
            { label: 'Year 2', state: forecastYear2, setter: setForecastYear2 },
            { label: 'Year 3', state: forecastYear3, setter: setForecastYear3 },
          ].map(({ label, state, setter }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{label}</div>
              <div style={gridTwo}>
                <CurrencyField label="Revenue" value={state.revenue ?? ''} onChange={v => setter({ ...state, revenue: v })} />
                <CurrencyField label="ARR" value={state.arr ?? ''} onChange={v => setter({ ...state, arr: v })} />
                <CurrencyField label="EBITDA" value={state.ebitda ?? ''} onChange={v => setter({ ...state, ebitda: v })} />
                <NumberField label="Headcount" value={state.headcount ?? ''} onChange={v => setter({ ...state, headcount: v })} />
                <NumberField label="Gross Margin (%)" value={state.grossMargin ?? ''} onChange={v => setter({ ...state, grossMargin: v })} />
              </div>
            </div>
          ))}
          <TextareaField label="Forecast Assumptions" value={forecastAssumptions} onChange={setForecastAssumptions} />
          <SelectField label="Forecast Confidence" value={forecastConfidence} onChange={setForecastConfidence}
            options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        </Fieldset>

        {/* ── Section 3: Pipeline ── */}
        <Fieldset legend="Pipeline">
          <div style={gridTwo}>
            <CurrencyField label="Qualified ACV" value={pipelineQualifiedAcv} onChange={setPipelineQualifiedAcv} />
            <CurrencyField label="Top 3 ACV" value={pipelineTop3Acv} onChange={setPipelineTop3Acv} />
            <NumberField label="Top 3 Concentration (%)" value={pipelineTop3ConcentrationPct} onChange={setPipelineTop3ConcentrationPct} />
            <NumberField label="Signed LOI Count" value={pipelineSignedLoiCount} onChange={setPipelineSignedLoiCount} />
            <NumberField label="Verbal Count" value={pipelineVerbalCount} onChange={setPipelineVerbalCount} />
            <NumberField label="Cold Count" value={pipelineColdCount} onChange={setPipelineColdCount} />
            <NumberField label="Expected Conversion (%)" value={pipelineExpectedConversionPct} onChange={setPipelineExpectedConversionPct} />
            <div>
              <label style={labelStyle}>First Revenue ETA</label>
              <input type="date" value={pipelineFirstRevenueEta} onChange={e => setPipelineFirstRevenueEta(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <SelectField label="Evidence Strength" value={pipelineEvidenceStrength} onChange={setPipelineEvidenceStrength}
            options={[
              { value: 'signed_contracts', label: 'Signed Contracts' },
              { value: 'signed_lois', label: 'Signed LOIs' },
              { value: 'verbal_commitments', label: 'Verbal Commitments' },
              { value: 'active_discussions', label: 'Active Discussions' },
              { value: 'cold_outreach', label: 'Cold Outreach' },
            ]} />

          {/* Per-deal pipeline breakdown — patch B1 */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={labelStyle}>Pipeline Deals (per-prospect detail)</label>
              <button type="button" onClick={() => setPipelineDeals([...pipelineDeals, emptyPipelineDeal()])}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#8b5cf6', background: 'transparent', border: '1px solid #8b5cf6', borderRadius: 6, cursor: 'pointer' }}>
                <Plus style={{ width: 12, height: 12 }} /> Add deal
              </button>
            </div>
            {pipelineDeals.map((d, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, padding: 10, background: '#f8fafc', borderRadius: 6, marginBottom: 8, alignItems: 'start' }}>
                <div style={{ gridColumn: '1 / 3' }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Prospect Name</label>
                  <input value={d.prospectName} onChange={e => { const a = [...pipelineDeals]; a[i] = { ...d, prospectName: e.target.value }; setPipelineDeals(a); }} style={inputStyle} placeholder="e.g. Rawlinson & Hunter" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Stage</label>
                  <select value={d.stage} onChange={e => { const a = [...pipelineDeals]; a[i] = { ...d, stage: e.target.value }; setPipelineDeals(a); }} style={inputStyle}>
                    <option value="">—</option>
                    <option value="signed_contract">Signed Contract</option>
                    <option value="signed_loi">Signed LOI</option>
                    <option value="verbal_commitment">Verbal Commitment</option>
                    <option value="active_discussion">Active Discussion</option>
                    <option value="cold_outreach">Cold Outreach</option>
                  </select>
                </div>
                <button type="button" onClick={() => setPipelineDeals(pipelineDeals.filter((_, j) => j !== i))}
                  style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 6, alignSelf: 'start' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Expected ACV</label>
                  <input type="number" value={d.expectedAcv} onChange={e => { const a = [...pipelineDeals]; a[i] = { ...d, expectedAcv: e.target.value ? Number(e.target.value) : '' }; setPipelineDeals(a); }} style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Expected Close</label>
                  <input type="date" value={d.expectedCloseDate} onChange={e => { const a = [...pipelineDeals]; a[i] = { ...d, expectedCloseDate: e.target.value }; setPipelineDeals(a); }} style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Discount Offered</label>
                  <input value={d.discountOffered} onChange={e => { const a = [...pipelineDeals]; a[i] = { ...d, discountOffered: e.target.value }; setPipelineDeals(a); }} style={inputStyle} placeholder="e.g. 50% Y1 first-adopter" />
                </div>
                <div style={{ gridColumn: '1 / 5' }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Notes</label>
                  <input value={d.notes} onChange={e => { const a = [...pipelineDeals]; a[i] = { ...d, notes: e.target.value }; setPipelineDeals(a); }} style={inputStyle} placeholder="Stakeholder, endorsement, blocker, etc." />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <TextareaField label="Pricing Strategy Notes" value={pricingStrategyNotes} onChange={setPricingStrategyNotes} placeholder="e.g. First-adopter tier: 50% Y1, 40% Y2, 30% Y3. Standard pricing represents ~60% saving vs incumbent providers." />
          </div>
        </Fieldset>

        {/* ── Section 4: Round Structure ── */}
        <Fieldset legend="Round Structure">
          <div style={gridTwo}>
            <CurrencyField label="Round Size Target" value={roundSizeTarget} onChange={setRoundSizeTarget} />
            <CurrencyField label="Pre-Money Target" value={roundPreMoneyTarget} onChange={setRoundPreMoneyTarget} />
            <CurrencyField label="Pre-Money Minimum" value={roundPreMoneyMin} onChange={setRoundPreMoneyMin} />
            <CurrencyField label="Committed to Date" value={roundCommittedToDate} onChange={setRoundCommittedToDate} />
            <CurrencyField label="Follow-on Round Size" value={followOnRoundSize} onChange={setFollowOnRoundSize} />
            <div>
              <label style={labelStyle}>Closing Target Date</label>
              <input type="date" value={roundClosingTargetDate} onChange={e => setRoundClosingTargetDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
            <CheckboxField label="SEIS/EIS Eligible" checked={roundSeisEisEligible} onChange={setRoundSeisEisEligible} />
            <CheckboxField label="Advance Assurance" checked={roundSeisEisAdvanceAssurance} onChange={setRoundSeisEisAdvanceAssurance} />
          </div>
          <SelectField label="Lead Investor Status" value={roundLeadInvestorStatus} onChange={setRoundLeadInvestorStatus}
            options={[
              { value: 'signed_termsheet', label: 'Signed Term Sheet' },
              { value: 'soft_circled', label: 'Soft Circled' },
              { value: 'in_discussion', label: 'In Discussion' },
              { value: 'searching', label: 'Searching' },
              { value: 'none', label: 'None' },
            ]} />
          <Field label="Follow-on Milestones (comma-separated)" value={followOnMilestones} onChange={setFollowOnMilestones} placeholder="e.g. 50 logos, £1m ARR, Series A" />

          {/* Use of Funds — patch B1 */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={labelStyle}>Use of Funds Breakdown</label>
              <button type="button" onClick={() => setUseOfFunds([...useOfFunds, emptyUseOfFunds()])}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#8b5cf6', background: 'transparent', border: '1px solid #8b5cf6', borderRadius: 6, cursor: 'pointer' }}>
                <Plus style={{ width: 12, height: 12 }} /> Add category
              </button>
            </div>
            {useOfFunds.map((u, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, padding: 10, background: '#f8fafc', borderRadius: 6, marginBottom: 8, alignItems: 'start' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Category</label>
                  <input value={u.category} onChange={e => { const a = [...useOfFunds]; a[i] = { ...u, category: e.target.value }; setUseOfFunds(a); }} style={inputStyle} placeholder="e.g. Engineering hires" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Amount (£)</label>
                  <input type="number" value={u.amount} onChange={e => { const a = [...useOfFunds]; a[i] = { ...u, amount: e.target.value ? Number(e.target.value) : '' }; setUseOfFunds(a); }} style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>% of Total</label>
                  <input type="number" value={u.percentOfTotal} onChange={e => { const a = [...useOfFunds]; a[i] = { ...u, percentOfTotal: e.target.value ? Number(e.target.value) : '' }; setUseOfFunds(a); }} style={inputStyle} />
                </div>
                <button type="button" onClick={() => setUseOfFunds(useOfFunds.filter((_, j) => j !== i))}
                  style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 6, alignSelf: 'start' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
                <div style={{ gridColumn: '1 / 5' }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Notes</label>
                  <input value={u.notes} onChange={e => { const a = [...useOfFunds]; a[i] = { ...u, notes: e.target.value }; setUseOfFunds(a); }} style={inputStyle} placeholder="What this funds, why this size" />
                </div>
              </div>
            ))}
          </div>

          {/* Investor Commitments — patch B1 */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={labelStyle}>Investor Commitments (per-investor detail)</label>
              <button type="button" onClick={() => setInvestorCommitments([...investorCommitments, emptyInvestorCommitment()])}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#8b5cf6', background: 'transparent', border: '1px solid #8b5cf6', borderRadius: 6, cursor: 'pointer' }}>
                <Plus style={{ width: 12, height: 12 }} /> Add investor
              </button>
            </div>
            {investorCommitments.map((inv, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, padding: 10, background: '#f8fafc', borderRadius: 6, marginBottom: 8, alignItems: 'start' }}>
                <div style={{ gridColumn: '1 / 3' }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Investor Name</label>
                  <input value={inv.investorName} onChange={e => { const a = [...investorCommitments]; a[i] = { ...inv, investorName: e.target.value }; setInvestorCommitments(a); }} style={inputStyle} placeholder="e.g. Mark Lewis" />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Amount (£)</label>
                  <input type="number" value={inv.amount} onChange={e => { const a = [...investorCommitments]; a[i] = { ...inv, amount: e.target.value ? Number(e.target.value) : '' }; setInvestorCommitments(a); }} style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Status</label>
                  <select value={inv.status} onChange={e => { const a = [...investorCommitments]; a[i] = { ...inv, status: e.target.value }; setInvestorCommitments(a); }} style={inputStyle}>
                    <option value="">—</option>
                    <option value="signed_termsheet">Signed Termsheet</option>
                    <option value="soft_circled">Soft Circled</option>
                    <option value="in_discussion">In Discussion</option>
                    <option value="searching">Searching</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <button type="button" onClick={() => setInvestorCommitments(investorCommitments.filter((_, j) => j !== i))}
                  style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 6, alignSelf: 'start' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Role</label>
                  <select value={inv.role} onChange={e => { const a = [...investorCommitments]; a[i] = { ...inv, role: e.target.value }; setInvestorCommitments(a); }} style={inputStyle}>
                    <option value="">—</option>
                    <option value="lead">Lead</option>
                    <option value="co_lead">Co-lead</option>
                    <option value="follower">Follower</option>
                    <option value="passive">Passive</option>
                  </select>
                </div>
                <div style={{ gridColumn: '2 / 5' }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Notes</label>
                  <input value={inv.notes} onChange={e => { const a = [...investorCommitments]; a[i] = { ...inv, notes: e.target.value }; setInvestorCommitments(a); }} style={inputStyle} placeholder="Relationship, blockers, momentum" />
                </div>
              </div>
            ))}
          </div>
        </Fieldset>

        {/* ── Section 5: Cap Table ── */}
        <Fieldset legend="Cap Table">
          <div style={gridTwo}>
            <SelectField label="Complexity" value={capTableComplexity} onChange={setCapTableComplexity}
              options={[
                { value: 'clean', label: 'Clean' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'complex', label: 'Complex' },
                { value: 'problematic', label: 'Problematic' },
              ]} />
            <NumberField label="Founder Ownership (%)" value={founderOwnershipCurrentPct} onChange={setFounderOwnershipCurrentPct} />
          </div>
          <Field label="Share Classes (comma-separated)" value={capTableShareClasses} onChange={setCapTableShareClasses} placeholder="e.g. Ordinary, A Preferred" />
          <CheckboxField label="EIS-Friendly" checked={capTableEisFriendly} onChange={setCapTableEisFriendly} />
          <TextareaField label="Voting Structure Notes" value={capTableVotingStructureNotes} onChange={setCapTableVotingStructureNotes} />
        </Fieldset>

        {/* ── Section 6: Team & Hires ── */}
        <Fieldset legend="Team & Hires">
          <div style={gridTwo}>
            <NumberField label="Team Size (current)" value={teamSizeCurrent} onChange={setTeamSizeCurrent} />
          </div>
          <Field label="Critical Gaps (comma-separated)" value={teamGapsCritical} onChange={setTeamGapsCritical} placeholder="e.g. CTO, Head of Sales" />

          {/* Hire Plan repeater */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>12-Month Hire Plan</label>
              <button onClick={() => setHirePlan12mo([...hirePlan12mo, emptyHire()])}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, fontWeight: 500, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}>
                <Plus style={{ width: 12, height: 12 }} /> Add Role
              </button>
            </div>
            {hirePlan12mo.map((h, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <div>
                  {i === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Role</label>}
                  <input value={h.role} onChange={e => { const a = [...hirePlan12mo]; a[i] = { ...h, role: e.target.value }; setHirePlan12mo(a); }} style={inputStyle} placeholder="e.g. CTO" />
                </div>
                <div>
                  {i === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Timing</label>}
                  <input value={h.timing} onChange={e => { const a = [...hirePlan12mo]; a[i] = { ...h, timing: e.target.value }; setHirePlan12mo(a); }} style={inputStyle} placeholder="Q2 2026" />
                </div>
                <div>
                  {i === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Budget (£)</label>}
                  <input type="number" value={h.budget} onChange={e => { const a = [...hirePlan12mo]; a[i] = { ...h, budget: e.target.value ? Number(e.target.value) : '' }; setHirePlan12mo(a); }} style={inputStyle} />
                </div>
                <div>
                  {i === 0 && <label style={{ ...labelStyle, fontSize: 11 }}>Status</label>}
                  <input value={h.candidateStatus} onChange={e => { const a = [...hirePlan12mo]; a[i] = { ...h, candidateStatus: e.target.value }; setHirePlan12mo(a); }} style={inputStyle} placeholder="Searching" />
                </div>
                <button onClick={() => setHirePlan12mo(hirePlan12mo.filter((_, j) => j !== i))}
                  style={{ padding: 6, borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', marginBottom: i === 0 ? 0 : 0, marginTop: i === 0 ? 18 : 0 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ))}
          </div>

          <TextareaField label="Founder Pedigree Summary" value={founderPedigreeSummary} onChange={setFounderPedigreeSummary} />
          <CheckboxField label="Founder has prior exits" checked={founderPriorExits} onChange={setFounderPriorExits} />
        </Fieldset>

        {/* ── Section 7: IP & Structure ── */}
        <Fieldset legend="IP & Structure">
          {/* Incorporation status — patch B1 — sits above the structural detail fields */}
          <div style={{ marginBottom: 14 }}>
            <SelectField label="Incorporation Status" value={incorporationStatus} onChange={setIncorporationStatus}
              options={[
                { value: 'pre_incorporation', label: 'Pre-incorporation (not yet filed)' },
                { value: 'basic_incorporated', label: 'Basic incorporated (Companies House done, no holdco yet)' },
                { value: 'restructure_in_progress', label: 'Restructure in progress (IP/holdco/shares being arranged)' },
                { value: 'fully_structured', label: 'Fully structured (clean, IP assigned, holdco in place)' },
              ]} />
          </div>
          <div style={gridTwo}>
            <Field label="IP Holding Entity" value={ipHoldingEntity} onChange={setIpHoldingEntity} placeholder="e.g. Acme IP Ltd" />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>IP Protection Status</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['patents_filed', 'trademarks', 'trade_secrets', 'none'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={ipProtectionStatus.includes(opt)}
                    onChange={e => setIpProtectionStatus(e.target.checked ? [...ipProtectionStatus, opt] : ipProtectionStatus.filter(v => v !== opt))} />
                  {opt.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
            <CheckboxField label="Corporate Structure Clean" checked={corporateStructureClean} onChange={setCorporateStructureClean} />
            <CheckboxField label="IP Migration Required" checked={ipMigrationRequired} onChange={setIpMigrationRequired} />
          </div>
          {ipMigrationRequired && <TextareaField label="IP Migration Notes" value={ipMigrationNotes} onChange={setIpMigrationNotes} />}
        </Fieldset>

        {/* ── Section 8: Data Room ── */}
        <Fieldset legend="Data Room">
          <div>
            <label style={labelStyle}>Completeness: {dataRoomCompletenessPct}%</label>
            <input type="range" min={0} max={100} value={dataRoomCompletenessPct} onChange={e => setDataRoomCompletenessPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <Field label="Data Room Gaps (comma-separated)" value={dataRoomGaps} onChange={setDataRoomGaps} placeholder="e.g. financial model, IP assignment" />
        </Fieldset>

        {/* ── Section 9: Governance ── */}
        <Fieldset legend="Governance">
          <SelectField label="Board Status" value={governanceBoardStatus} onChange={setGovernanceBoardStatus}
            options={[
              { value: 'formal_board_with_neds', label: 'Formal Board with NEDs' },
              { value: 'founder_only_board', label: 'Founder-Only Board' },
              { value: 'advisory_board_only', label: 'Advisory Board Only' },
              { value: 'none', label: 'None' },
            ]} />
          <div style={gridTwo}>
            <NumberField label="NED Count" value={governanceNedsCount} onChange={setGovernanceNedsCount} />
            <NumberField label="Advisors Count" value={governanceAdvisorsCount} onChange={setGovernanceAdvisorsCount} />
          </div>
        </Fieldset>

        {/* ── Section 10: Notes ── */}
        <Fieldset legend="Notes">
          <TextareaField label="Context Notes" value={contextNotes} onChange={setContextNotes} rows={4} />
        </Fieldset>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={handleSave} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
            fontSize: 14, fontWeight: 600, borderRadius: 8, border: 'none',
            background: saving ? '#94a3b8' : '#7c3aed', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
          }}>
          {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
          {saving ? 'Saving…' : 'Save All Signals'}
        </button>
        {success && <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>Saved</span>}
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 18px', margin: 0 }}>
      <legend style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', padding: '0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {legend}
      </legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </fieldset>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | ''; onChange: (v: number | '') => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value ? Number(e.target.value) : '')} style={inputStyle} />
    </div>
  );
}

function CurrencyField({ label, value, onChange }: { label: string; value: number | ''; onChange: (v: number | '') => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>£</span>
        <input type="number" value={value} onChange={e => onChange(e.target.value ? Number(e.target.value) : '')} style={{ ...inputStyle, paddingLeft: 26 }} />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#334155',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: 13,
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
};

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const errorBanner: React.CSSProperties = {
  padding: '10px 14px', marginBottom: 16, borderRadius: 8,
  background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13,
};

const successBanner: React.CSSProperties = {
  padding: '10px 14px', marginBottom: 16, borderRadius: 8,
  background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 13,
};
