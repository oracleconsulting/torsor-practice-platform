/**
 * OpportunityDashboard - Comprehensive opportunity analysis for admin view
 * 
 * Shows all identified opportunities, maps to services, and suggests new service concepts
 */

import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  DollarSign, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  Target,
  Zap,
  Copy,
  Check,
  Filter,
  Download,
  PlusCircle
} from 'lucide-react';
import { 
  analyseAllOpportunities, 
  getOpportunitySummary,
  buildClientDataBundle,
  type Opportunity,
  type OpportunitySeverity,
  type OpportunityCategory
} from '../../../lib/opportunity-engine';

interface OpportunityDashboardProps {
  reportData: any;
  hvaData?: any;
  supplementaryData?: Record<string, any>;
  industryData?: any;
}

const SEVERITY_COLORS: Record<OpportunitySeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  low: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  opportunity: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const SEVERITY_LABELS: Record<OpportunitySeverity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  opportunity: 'OPPORTUNITY',
};

export function OpportunityDashboard({ 
  reportData, 
  hvaData, 
  supplementaryData,
  industryData 
}: OpportunityDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<OpportunitySeverity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<OpportunityCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Build data bundle and analyse
  const clientData = useMemo(() => 
    buildClientDataBundle(reportData, hvaData, supplementaryData, industryData),
    [reportData, hvaData, supplementaryData, industryData]
  );

  const opportunities = useMemo(() => 
    analyseAllOpportunities(clientData),
    [clientData]
  );

  const summary = useMemo(() => 
    getOpportunitySummary(opportunities),
    [opportunities]
  );

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (severityFilter !== 'all' && opp.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && opp.category !== categoryFilter) return false;
      return true;
    });
  }, [opportunities, severityFilter, categoryFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(opportunities.map(o => o.category));
    return Array.from(cats);
  }, [opportunities]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportSummary = () => {
    const lines = [
      '# Opportunity Analysis Summary',
      '',
      `Total Opportunities: ${summary.totalOpportunities}`,
      `Critical: ${summary.bySeverity.critical}`,
      `High: ${summary.bySeverity.high}`,
      `Medium: ${summary.bySeverity.medium}`,
      '',
      `Total Financial Impact: £${formatCurrency(summary.totalFinancialImpact)}`,
      `Existing Service Matches: ${summary.existingServiceMatches}`,
      `New Service Concepts: ${summary.newServiceConcepts}`,
      '',
      '## Quick Wins',
      ...summary.quickWins.map(qw => `- ${qw}`),
      '',
      '## Detailed Opportunities',
      '',
    ];

    for (const opp of opportunities) {
      lines.push(`### ${opp.title} [${opp.severity.toUpperCase()}]`);
      lines.push(`Category: ${opp.categoryLabel}`);
      lines.push(`Data: ${opp.dataPoint}`);
      if (opp.benchmark) lines.push(`Benchmark: ${opp.benchmark}`);
      if (opp.financialImpact) {
        lines.push(`Impact: £${formatCurrency(opp.financialImpact.amount)} (${opp.financialImpact.calculation})`);
      }
      if (opp.existingService) {
        lines.push(`Recommended Service: ${opp.existingService.name} (${opp.existingService.priceRange})`);
      }
      if (opp.newServiceConcept) {
        lines.push(`New Service Concept: ${opp.newServiceConcept.suggestedName}`);
        lines.push(`Suggested Pricing: ${opp.newServiceConcept.suggestedPricing}`);
      }
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opportunity-analysis.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Target className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Strong Position</h3>
        <p className="text-slate-600">
          No significant opportunities or issues identified based on available data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Opportunities"
          value={summary.totalOpportunities}
          icon={<Target className="w-5 h-5" />}
          color="text-indigo-600"
        />
        <SummaryCard
          label="Critical/High Priority"
          value={summary.bySeverity.critical + summary.bySeverity.high}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-red-600"
        />
        <SummaryCard
          label="Financial Impact"
          value={`£${formatCurrency(summary.totalFinancialImpact)}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="text-emerald-600"
        />
        <SummaryCard
          label="New Service Ideas"
          value={summary.newServiceConcepts}
          icon={<Lightbulb className="w-5 h-5" />}
          color="text-amber-600"
        />
      </div>

      {/* Quick Wins */}
      {summary.quickWins.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
          <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Wins - Actions for This Week
          </h3>
          <ul className="space-y-2">
            {summary.quickWins.map((win, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-600 mt-0.5">→</span>
                <span className="text-slate-700">{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as OpportunitySeverity | 'all')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="opportunity">Opportunity</option>
            </select>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as OpportunityCategory | 'all')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={exportSummary}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Download className="w-4 h-4" />
          Export Summary
        </button>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filteredOpportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            isExpanded={expandedId === opp.id}
            onToggle={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        ))}
      </div>

      {/* New Service Concepts Summary */}
      {summary.newServiceConcepts > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            New Service Concepts Identified
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            These are service concepts suggested by gaps where existing services don't fully address the client's needs.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities
              .filter(o => o.newServiceConcept)
              .map(o => (
                <div key={o.id} className="bg-white rounded-lg border border-indigo-100 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-slate-800">
                      {o.newServiceConcept!.suggestedName}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.newServiceConcept!.developmentPriority === 'immediate' ? 'bg-red-100 text-red-700' :
                      o.newServiceConcept!.developmentPriority === 'short-term' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {o.newServiceConcept!.developmentPriority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{o.newServiceConcept!.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Suggested: {o.newServiceConcept!.suggestedPricing}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      o.newServiceConcept!.marketSize === 'broad' ? 'bg-green-100 text-green-700' :
                      o.newServiceConcept!.marketSize === 'moderate' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {o.newServiceConcept!.marketSize} market
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SummaryCard({ label, value, icon, color }: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function OpportunityCard({ 
  opportunity, 
  isExpanded, 
  onToggle,
  onCopy,
  copiedId
}: { 
  opportunity: Opportunity; 
  isExpanded: boolean; 
  onToggle: () => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const colors = SEVERITY_COLORS[opportunity.severity];

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${colors.border} ${colors.bg}`}>
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.text} bg-white/70`}>
            {SEVERITY_LABELS[opportunity.severity]}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 truncate">{opportunity.title}</h4>
            <p className="text-sm text-slate-500 truncate">{opportunity.dataPoint}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          {opportunity.financialImpact && (
            <span className="text-sm font-semibold text-emerald-600">
              £{formatCurrency(opportunity.financialImpact.amount)}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Category & Benchmark */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 bg-white/70 rounded text-slate-600">
              {opportunity.categoryLabel}
            </span>
            {opportunity.benchmark && (
              <span className="px-2 py-1 bg-white/70 rounded text-slate-600">
                Benchmark: {opportunity.benchmark}
              </span>
            )}
            {opportunity.gap && (
              <span className="px-2 py-1 bg-red-100/70 rounded text-red-700">
                Gap: {opportunity.gap}
              </span>
            )}
          </div>

          {/* Financial Impact */}
          {opportunity.financialImpact && (
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Financial Impact</span>
                  <div className="text-xl font-bold text-emerald-600">
                    £{formatCurrency(opportunity.financialImpact.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    opportunity.financialImpact.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    opportunity.financialImpact.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {opportunity.financialImpact.confidence} confidence
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{opportunity.financialImpact.calculation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Win */}
          {opportunity.quickWin && (
            <div className="bg-emerald-100/70 rounded-lg p-3 flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-emerald-800">Quick Win</span>
                <p className="text-sm text-emerald-700">{opportunity.quickWin}</p>
              </div>
            </div>
          )}

          {/* Existing Service */}
          {opportunity.existingService && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500">RECOMMENDED SERVICE</span>
                  <h5 className="font-semibold text-slate-800">{opportunity.existingService.name}</h5>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-indigo-600">
                    {opportunity.existingService.priceRange}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs text-slate-500">Fit:</span>
                    <span className={`text-xs font-medium ${
                      opportunity.existingService.fitScore >= 80 ? 'text-green-600' :
                      opportunity.existingService.fitScore >= 60 ? 'text-amber-600' :
                      'text-slate-500'
                    }`}>
                      {opportunity.existingService.fitScore}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">{opportunity.existingService.howItHelps}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Expected: {opportunity.existingService.expectedOutcome}</span>
                <span>•</span>
                <span>Time to value: {opportunity.existingService.timeToValue}</span>
              </div>
            </div>
          )}

          {/* New Service Concept */}
          {opportunity.newServiceConcept && (
            <div className="bg-indigo-50/70 rounded-lg border border-indigo-200 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    NEW SERVICE CONCEPT
                  </span>
                  <h5 className="font-semibold text-slate-800">{opportunity.newServiceConcept.suggestedName}</h5>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  opportunity.newServiceConcept.developmentPriority === 'immediate' ? 'bg-red-100 text-red-700' :
                  opportunity.newServiceConcept.developmentPriority === 'short-term' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {opportunity.newServiceConcept.developmentPriority}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{opportunity.newServiceConcept.description}</p>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Deliverables:</span>
                  <ul className="list-disc list-inside text-slate-600 ml-2">
                    {opportunity.newServiceConcept.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-4">
                  <span><strong>Suggested Pricing:</strong> {opportunity.newServiceConcept.suggestedPricing}</span>
                  <span><strong>Market Size:</strong> {opportunity.newServiceConcept.marketSize}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Skills Required:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {opportunity.newServiceConcept.skillsRequired.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Copy talking point */}
          <div className="flex justify-end">
            <button
              onClick={() => onCopy(
                `${opportunity.title}: ${opportunity.dataPoint}. ${opportunity.existingService ? `Recommend ${opportunity.existingService.name} (${opportunity.existingService.priceRange}).` : ''}`,
                opportunity.id
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-white/70 rounded-lg transition-colors"
            >
              {copiedId === opportunity.id ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy talking point
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return value.toFixed(0);
}

export default OpportunityDashboard;

