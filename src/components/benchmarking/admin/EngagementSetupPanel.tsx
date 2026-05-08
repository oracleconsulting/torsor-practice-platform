import { useState, useEffect } from 'react';
import { Settings, Save, Edit3, ChevronRight, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface EngagementSetupPanelProps {
  engagementId: string;
  currentStage?: string;
  currentData?: any;
  onSave?: () => void;
  onNavigateToSignals?: () => void;
}

const STAGES = [
  { value: 'pre_revenue', label: 'Pre-Revenue', help: 'No recurring revenue yet — valuation anchored by qualitative frameworks (Berkus, Scorecard)' },
  { value: 'early_revenue', label: 'Early Revenue', help: 'First revenue but sub-scale — ARR multiple primary, comparable rounds secondary' },
  { value: 'growth', label: 'Growth', help: 'Revenue scaling — ARR multiple gated by Rule of 40, NRR, gross margin' },
  { value: 'operating', label: 'Operating', help: 'Established and profitable — EBITDA multiple primary, ARR secondary' },
  { value: 'mature', label: 'Mature', help: 'Stable, optimised operations — EBITDA multiple with recurring quality premium' },
];

const EXIT_METHODS = [
  'EBITDA', 'Revenue', 'ARR', 'GMV', 'SDE', 'NFI', 'GRF', 'rNPV', 'Comparable_Round', 'Berkus_Scorecard',
];

const EXIT_STRATEGIES = [
  { value: 'trade_sale', label: 'Trade Sale' },
  { value: 'pe_buyout', label: 'PE Buyout' },
  { value: 'ipo', label: 'IPO' },
  { value: 'mbo', label: 'MBO' },
  { value: 'lifestyle', label: 'Lifestyle / Hold' },
  { value: 'undecided', label: 'Undecided' },
];

export function EngagementSetupPanel({
  engagementId,
  currentStage,
  currentData,
  onSave,
  onNavigateToSignals,
}: EngagementSetupPanelProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState(currentStage || currentData?.business_stage || 'operating');
  const [exitHorizon, setExitHorizon] = useState<number | ''>(currentData?.exit_horizon_years ?? '');
  const [targetValuation, setTargetValuation] = useState<number | ''>(currentData?.target_exit_valuation ?? '');
  const [exitMethod, setExitMethod] = useState(currentData?.target_exit_method || '');
  const [exitStrategy, setExitStrategy] = useState(currentData?.exit_strategy || '');

  const hasData = !!(currentStage || currentData?.business_stage);

  useEffect(() => {
    if (currentData) {
      setStage(currentData.business_stage || 'operating');
      setExitHorizon(currentData.exit_horizon_years ?? '');
      setTargetValuation(currentData.target_exit_valuation ?? '');
      setExitMethod(currentData.target_exit_method || '');
      setExitStrategy(currentData.exit_strategy || '');
    }
  }, [currentData]);

  useEffect(() => {
    if (!currentData && engagementId) {
      (async () => {
        const { data } = await supabase
          .from('bm_engagements')
          .select('business_stage, exit_horizon_years, target_exit_valuation, target_exit_method, exit_strategy')
          .eq('id', engagementId)
          .single();
        if (data) {
          setStage(data.business_stage || 'operating');
          setExitHorizon(data.exit_horizon_years ?? '');
          setTargetValuation(data.target_exit_valuation ?? '');
          setExitMethod(data.target_exit_method || '');
          setExitStrategy(data.exit_strategy || '');
        }
      })();
    }
  }, [engagementId, currentData]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        business_stage: stage,
        exit_horizon_years: exitHorizon || null,
        target_exit_valuation: targetValuation || null,
        target_exit_method: exitMethod || null,
        exit_strategy: exitStrategy || null,
      };

      const { error: err } = await supabase
        .from('bm_engagements')
        .update(payload)
        .eq('id', engagementId);

      if (err) throw err;

      setEditing(false);
      onSave?.();

      if (stage === 'pre_revenue' || stage === 'early_revenue') {
        onNavigateToSignals?.();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedStageInfo = STAGES.find(s => s.value === stage);

  if (hasData && !editing) {
    return (
      <div style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings style={{ width: 18, height: 18, color: '#6366f1' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>Engagement Setup</h3>
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              fontSize: 13, fontWeight: 500, borderRadius: 8,
              border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer',
            }}
          >
            <Edit3 style={{ width: 14, height: 14 }} />
            Edit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SummaryField label="Business Stage" value={selectedStageInfo?.label || stage} />
          <SummaryField label="Exit Horizon" value={exitHorizon ? `${exitHorizon} years` : '—'} />
          <SummaryField label="Target Exit Valuation" value={targetValuation ? `£${Number(targetValuation).toLocaleString()}` : '—'} />
          <SummaryField label="Exit Method" value={exitMethod || '—'} />
          <SummaryField label="Exit Strategy" value={EXIT_STRATEGIES.find(s => s.value === exitStrategy)?.label || exitStrategy || '—'} />
        </div>

        {(stage === 'pre_revenue' || stage === 'early_revenue') && onNavigateToSignals && (
          <button
            onClick={onNavigateToSignals}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '8px 16px',
              fontSize: 13, fontWeight: 500, borderRadius: 8,
              background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', cursor: 'pointer',
            }}
          >
            Complete Pre-Revenue Signals
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Settings style={{ width: 18, height: 18, color: '#6366f1' }} />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>Engagement Setup</h3>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Business Stage */}
        <div>
          <label style={labelStyle}>Business Stage</label>
          <select value={stage} onChange={e => setStage(e.target.value)} style={inputStyle}>
            {STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {selectedStageInfo && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6, fontSize: 12, color: '#64748b' }}>
              <Info style={{ width: 13, height: 13, marginTop: 1, flexShrink: 0 }} />
              {selectedStageInfo.help}
            </div>
          )}
        </div>

        {/* Exit Horizon */}
        <div>
          <label style={labelStyle}>Exit Horizon (years)</label>
          <input
            type="number"
            min={1}
            max={15}
            value={exitHorizon}
            onChange={e => setExitHorizon(e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 5"
            style={inputStyle}
          />
        </div>

        {/* Target Exit Valuation */}
        <div>
          <label style={labelStyle}>Target Exit Valuation (£)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>£</span>
            <input
              type="number"
              min={0}
              value={targetValuation}
              onChange={e => setTargetValuation(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 10000000"
              style={{ ...inputStyle, paddingLeft: 28 }}
            />
          </div>
        </div>

        {/* Exit Method */}
        <div>
          <label style={labelStyle}>Target Exit Method</label>
          <select value={exitMethod} onChange={e => setExitMethod(e.target.value)} style={inputStyle}>
            <option value="">— Select —</option>
            {EXIT_METHODS.map(m => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Exit Strategy */}
        <div>
          <label style={labelStyle}>Exit Strategy</label>
          <select value={exitStrategy} onChange={e => setExitStrategy(e.target.value)} style={inputStyle}>
            <option value="">— Select —</option>
            {EXIT_STRATEGIES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
            fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none',
            background: saving ? '#94a3b8' : '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          <Save style={{ width: 14, height: 14 }} />
          {saving ? 'Saving…' : 'Save Setup'}
        </button>
        {hasData && (
          <button
            onClick={() => setEditing(false)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8,
              border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{value}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
};
