import React from 'react';
import { 
  AlertTriangle, 
  MessageSquare, 
  HelpCircle, 
  Target,
  CheckCircle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

interface MAAdminReportViewProps {
  report: {
    pass1_data: any;
    pass2_data?: any;
    admin_view?: any;
  };
  engagement?: any;
}

export function MAAdminReportView({ report, engagement }: MAAdminReportViewProps) {
  const p1 = report.pass1_data;
  const admin = p1?.adminGuidance;
  
  if (!p1 || !admin) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No admin report data available</p>
      </div>
    );
  }

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    significant: 'bg-amber-100 text-amber-800 border-amber-200',
    moderate: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="space-y-6">
      {/* Quick Profile Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm text-slate-500">Primary Pain</span>
            <p className="font-medium text-slate-900">{admin.quickProfile?.primaryPain || 'Not identified'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Secondary</span>
            <p className="font-medium text-slate-900">{admin.quickProfile?.secondaryPain || 'None'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Confidence</span>
            <p className="font-medium text-slate-900">{admin.quickProfile?.confidenceScore || '?'}/10</p>
          </div>
          <div>
            <span className="text-sm text-slate-500">Frequency</span>
            <p className="font-medium text-slate-900">{admin.quickProfile?.desiredFrequency || 'Monthly'}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase ${
            admin.quickProfile?.recommendedTier === 'gold' 
              ? 'bg-amber-100 text-amber-800' 
              : admin.quickProfile?.recommendedTier === 'platinum'
              ? 'bg-purple-100 text-purple-800'
              : admin.quickProfile?.recommendedTier === 'silver'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-orange-100 text-orange-800'
          }`}>
            {admin.quickProfile?.recommendedTier || 'SILVER'} Recommended
          </div>
        </div>
      </div>
      
      {/* Their Words to Use */}
      {admin.quotesToUse && admin.quotesToUse.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Their Words to Use</h3>
          </div>
          <div className="p-6 space-y-3">
            {admin.quotesToUse.map((item: any, i: number) => (
              <div key={i} className="border-l-4 border-blue-500 pl-4 py-1">
                <p className="font-medium italic text-gray-800">"{item.quote}"</p>
                <p className="text-sm text-slate-500 mt-1">Use when: {item.context}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Key Findings */}
      {p1.findings && p1.findings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Key Findings ({p1.findings.length})</h3>
          </div>
          <div className="p-6 space-y-4">
            {p1.findings.map((finding: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{finding.title}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                    severityColors[finding.severity] || severityColors.moderate
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-slate-500">Finding:</span>
                    <p className="text-gray-700">{finding.finding}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Implication:</span>
                    <p className="text-gray-700">{finding.implication}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-blue-800">Recommended Action:</span>
                    <p className="text-blue-700">{finding.recommendedAction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Gaps to Fill */}
      {admin.gapsToFill && admin.gapsToFill.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Gaps to Fill on Call</h3>
          </div>
          <div className="p-6 space-y-3">
            {admin.gapsToFill.map((gap: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-amber-400" />
                <div>
                  <p className="font-medium text-amber-900">{gap.gap}</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Ask: <span className="italic">"{gap.suggestedQuestion}"</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Why: {gap.whyNeeded}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Questions to Ask */}
      {admin.questionsToAsk && admin.questionsToAsk.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Questions to Ask</h3>
          </div>
          <div className="p-6 space-y-4">
            {admin.questionsToAsk.map((q: any, i: number) => (
              <div key={i} className="border-l-4 border-green-500 pl-4 py-1">
                <p className="font-medium text-gray-900">"{q.question}"</p>
                <p className="text-sm text-slate-500 mt-1">Purpose: {q.purpose}</p>
                <p className="text-sm text-green-600 mt-1">Listen for: {q.listenFor}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Objection Handling */}
      {admin.objectionHandling && admin.objectionHandling.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Objection Handling</h3>
          </div>
          <div className="p-6 space-y-4">
            {admin.objectionHandling.map((obj: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-red-600 mb-2">"{obj.objection}"</p>
                <p className="text-gray-700">{obj.response}</p>
                <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                  <span className="font-medium">Reference:</span> {obj.theirDataToReference}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Scenarios to Pre-Build */}
      {admin.scenariosToBuild && admin.scenariosToBuild.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Scenarios to Pre-Build</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {admin.scenariosToBuild.map((scenario: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 text-center">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-2">
                    {scenario.type}
                  </span>
                  <p className="font-medium text-gray-900">{scenario.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{scenario.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Wins */}
      {p1.quickWins && p1.quickWins.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Quick Wins</h3>
          </div>
          <div className="p-6 space-y-3">
            {p1.quickWins.map((win: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">{win.title}</p>
                  <p className="text-sm text-green-700">{win.description}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-slate-500">{win.timing}</span>
                    <span className="text-green-600 font-medium">{win.benefit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tier Recommendation */}
      {p1.tierRecommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            Tier Recommendation: {p1.tierRecommendation.tier?.toUpperCase()}
          </h3>
          <p className="text-blue-800 mb-4">{p1.tierRecommendation.rationale}</p>
          {p1.tierRecommendation.keyDrivers && p1.tierRecommendation.keyDrivers.length > 0 && (
            <div>
              <span className="font-medium text-blue-900">Key drivers:</span>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                {p1.tierRecommendation.keyDrivers.map((driver: string, i: number) => (
                  <li key={i} className="text-blue-700">{driver}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MAAdminReportView;

