import { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';

interface FinancialPulseProps {
  valueAnalysis: any;
  collapsed?: boolean;
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  teal: 'bg-teal-50 text-teal-700',
};

function MetricCard({ label, value, sublabel, color }: {
  label: string;
  value: string;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${COLOR_CLASSES[color] || COLOR_CLASSES.emerald}`}>
      <p className="text-xs font-medium opacity-75 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
      {sublabel && <p className="text-xs opacity-75 mt-0.5">{sublabel}</p>}
    </div>
  );
}

export function FinancialPulse({ valueAnalysis, collapsed: initialCollapsed = true }: FinancialPulseProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (!valueAnalysis) return null;

  const score = valueAnalysis.overallScore;
  const opportunity = valueAnalysis.totalOpportunity;
  const scoreInterpretation = valueAnalysis.scoreInterpretation;

  const currentValue = valueAnalysis.businessValuation?.currentValue ?? valueAnalysis.businessValuation?.baselineValue;
  const potentialValue = valueAnalysis.businessValuation?.potentialValue;

  const exitScore = valueAnalysis.businessValuation?.exitReadiness?.score ?? valueAnalysis.exitReadiness?.totalScore;

  const criticalRisks = Array.isArray(valueAnalysis.riskRegister) ? valueAnalysis.riskRegister.filter((r: any) => r.severity === 'Critical').length : 0;
  const highRisks = Array.isArray(valueAnalysis.riskRegister) ? valueAnalysis.riskRegister.filter((r: any) => r.severity === 'High' || r.severity === 'HIGH').length : 0;

  const grossMargin = valueAnalysis.financialHealth?.currentYear?.grossMargin ?? valueAnalysis.businessValuation?.keyMetrics?.grossMargin;

  if (!score && !currentValue && !opportunity) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 text-sm">Your Financial Picture</h3>
            <p className="text-xs text-slate-500">
              {[
                score && `${score}/100`,
                opportunity && `£${Number(opportunity).toLocaleString()} opportunity`,
                exitScore && `Exit readiness: ${exitScore}/100`,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {score != null && (
              <MetricCard label="Business Score" value={`${score}/100`} color="emerald" />
            )}
            {opportunity != null && opportunity > 0 && (
              <MetricCard label="Annual Opportunity" value={`£${Number(opportunity).toLocaleString()}`} sublabel="overhead gap identified" color="blue" />
            )}
            {currentValue != null && currentValue > 0 && (
              <MetricCard
                label="Current Valuation"
                value={`£${Number(currentValue).toLocaleString()}`}
                sublabel={potentialValue ? `→ £${Number(potentialValue).toLocaleString()} potential` : undefined}
                color="purple"
              />
            )}
            {exitScore != null && (
              <MetricCard
                label="Exit Readiness"
                value={`${exitScore}/100`}
                sublabel={exitScore >= 70 ? 'Credibly ready' : `${70 - exitScore} points to threshold`}
                color={exitScore >= 70 ? 'emerald' : 'amber'}
              />
            )}
            {valueAnalysis?.clientMetrics?.showExitReadiness ? (
              <MetricCard label={valueAnalysis.clientMetrics.exitReadinessLabel || 'Exit Readiness'} value={`${valueAnalysis.clientMetrics.exitReadinessScore}/100`} sublabel={valueAnalysis.clientMetrics.exitReadinessContext} color="amber" />
            ) : (criticalRisks > 0 || highRisks > 0) ? (
              <MetricCard label="Risk Alerts" value={`${criticalRisks} critical · ${highRisks} high`} color="red" />
            ) : null}
            {grossMargin != null && (
              <MetricCard label="Gross Margin" value={typeof grossMargin === 'string' ? grossMargin : `${grossMargin}%`} color="teal" />
            )}
          </div>

          {scoreInterpretation && (
            <p className="text-sm text-slate-600 mt-4 italic">{scoreInterpretation}</p>
          )}

          {valueAnalysis.narrativeSummary?.theGoodNews && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">The Good News</p>
              <p className="text-sm text-emerald-900">{valueAnalysis.narrativeSummary.theGoodNews}</p>
            </div>
          )}

          {valueAnalysis.actionHierarchy?.theGoodNews && !valueAnalysis.narrativeSummary?.theGoodNews && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">The Good News</p>
              <p className="text-sm text-emerald-900">{valueAnalysis.actionHierarchy.theGoodNews}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
