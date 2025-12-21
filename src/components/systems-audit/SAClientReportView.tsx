import React from 'react';
import { 
  TrendingUp, Clock, DollarSign, Target, CheckCircle2,
  AlertCircle, ArrowRight, Zap
} from 'lucide-react';

interface SAClientReportViewProps {
  report: any;
  companyName?: string;
}

export function SAClientReportView({ report, companyName = 'Your Business' }: SAClientReportViewProps) {
  const roiSummary = report.client_roi_summary || {};
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 md:p-12">
        <p className="text-amber-400 font-medium mb-2">Systems Audit Report</p>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
          {report.headline}
        </h1>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold text-red-400">
              £{(report.total_annual_cost_of_chaos || 0).toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm mt-1">Current Annual Cost</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold text-green-400">
              £{(report.total_annual_benefit || 0).toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm mt-1">Recoverable Value</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold text-amber-400">
              {report.hours_reclaimable_weekly || 0}
            </p>
            <p className="text-slate-400 text-sm mt-1">Hours Back Weekly</p>
          </div>
        </div>
      </div>

      {/* Executive Brief */}
      {report.client_executive_brief && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">In Brief</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            {report.client_executive_brief}
          </p>
        </div>
      )}

      {/* The Story */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What We Found</h2>
        <div className="prose prose-slate max-w-none">
          {report.executive_summary?.split('\n\n').map((paragraph: string, idx: number) => (
            <p key={idx} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* The Cost */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">The Cost of Staying Where You Are</h2>
        </div>
        <div className="prose prose-slate max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {report.cost_of_chaos_narrative}
          </p>
        </div>
        
        {/* Visual Cost Breakdown */}
        <div className="mt-6 pt-6 border-t border-red-200 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-red-600">{report.total_hours_wasted_weekly}</p>
            <p className="text-sm text-gray-600">Hours Lost Weekly</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">£{(report.total_annual_cost_of_chaos || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Annual Impact</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">£{(report.projected_cost_at_scale || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">At {report.growth_multiplier}x Growth</p>
          </div>
        </div>
      </div>

      {/* System Health at a Glance */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Your System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Integration', score: report.integration_score, color: 'blue' },
            { label: 'Automation', score: report.automation_score, color: 'purple' },
            { label: 'Data Access', score: report.data_accessibility_score, color: 'indigo' },
            { label: 'Scalability', score: report.scalability_score, color: 'cyan' }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40" cy="40" r="36"
                    className="stroke-gray-200"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40" cy="40" r="36"
                    className={`stroke-${item.color}-500`}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(item.score || 0) * 2.26} 226`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                  {item.score || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Opportunity */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">What This Enables</h2>
        </div>
        <div className="prose prose-slate max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {report.time_freedom_narrative}
          </p>
        </div>
        
        {/* What Changes */}
        {report.what_this_enables && report.what_this_enables.length > 0 && (
          <div className="mt-6 pt-6 border-t border-green-200 space-y-3">
            {report.what_this_enables.map((item: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROI Summary */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-6">Return on Investment</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-emerald-200 text-sm">Investment</p>
            <p className="text-2xl font-bold">£{(report.total_recommended_investment || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-emerald-200 text-sm">Annual Return</p>
            <p className="text-2xl font-bold">£{(report.total_annual_benefit || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-emerald-200 text-sm">Payback Period</p>
            <p className="text-2xl font-bold">{report.overall_payback_months || '?'} months</p>
          </div>
          <div>
            <p className="text-emerald-200 text-sm">ROI</p>
            <p className="text-2xl font-bold">{report.roi_ratio || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      {report.quick_wins && report.quick_wins.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Wins</h2>
              <p className="text-sm text-gray-500">Implementable within one week</p>
            </div>
          </div>
          <div className="space-y-4">
            {report.quick_wins.slice(0, 4).map((qw: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-amber-700">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{qw.title}</p>
                  <p className="text-sm text-gray-500">{qw.impact}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-semibold">+{qw.hoursSavedWeekly}hrs/wk</p>
                  <p className="text-xs text-gray-500">{qw.timeToImplement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Ready to Reclaim Your Time?</h2>
        <p className="text-slate-400 mb-6">
          Let's discuss how to implement these recommendations and start recovering those {report.hours_reclaimable_weekly} hours every week.
        </p>
        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors">
          Schedule a Call
        </button>
      </div>
    </div>
  );
}

