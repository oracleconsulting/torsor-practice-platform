import { useState } from 'react';
import { 
  MessageSquare, HelpCircle, ArrowRight, CheckSquare, AlertTriangle,
  ChevronDown, ChevronUp, User, Clock, Target,
  Sparkles, FileText
} from 'lucide-react';

interface SAAdminReportViewProps {
  report: any;
  engagement: any;
  findings: any[];
  recommendations: any[];
}

export function SAAdminReportView({ report, findings }: SAAdminReportViewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    talkingPoints: true,
    questions: true,
    nextSteps: true,
    tasks: false,
    risks: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const talkingPoints = report.admin_talking_points || [];
  const questions = report.admin_questions_to_ask || [];
  const nextSteps = report.admin_next_steps || [];
  const tasks = report.admin_tasks || [];
  const riskFlags = report.admin_risk_flags || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-xs text-red-600 uppercase font-medium">Annual Cost of Chaos</p>
          <p className="text-2xl font-bold text-red-700">£{(report.total_annual_cost_of_chaos || 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 uppercase font-medium">Recoverable</p>
          <p className="text-2xl font-bold text-green-700">£{(report.total_annual_benefit || 0).toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-600 uppercase font-medium">Investment Needed</p>
          <p className="text-2xl font-bold text-blue-700">£{(report.total_recommended_investment || 0).toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-xs text-purple-600 uppercase font-medium">Payback</p>
          <p className="text-2xl font-bold text-purple-700">{report.overall_payback_months || '?'} months</p>
        </div>
      </div>

      {/* Talking Points Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('talkingPoints')}
          className="w-full px-6 py-4 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Talking Points for Client Meeting</h3>
            <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">{talkingPoints.length}</span>
          </div>
          {expandedSections.talkingPoints ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {expandedSections.talkingPoints && (
          <div className="p-6 space-y-4">
            {talkingPoints.length > 0 ? talkingPoints.map((tp: any, idx: number) => (
              <div key={idx} className={`border-l-4 pl-4 py-2 ${
                tp.importance === 'critical' ? 'border-red-500 bg-red-50' :
                tp.importance === 'high' ? 'border-amber-500 bg-amber-50' :
                'border-blue-500 bg-blue-50'
              } rounded-r-lg`}>
                <p className="font-medium text-gray-900">{tp.topic}</p>
                <p className="text-sm text-gray-700 mt-1">{tp.point}</p>
                {tp.clientQuote && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    Quote to use: "{tp.clientQuote}"
                  </p>
                )}
              </div>
            )) : (
              <p className="text-gray-500 text-sm">No talking points generated. Regenerate the report to include admin guidance.</p>
            )}
          </div>
        )}
      </div>

      {/* Questions to Ask Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('questions')}
          className="w-full px-6 py-4 flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Questions to Ask</h3>
            <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full">{questions.length}</span>
          </div>
          {expandedSections.questions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {expandedSections.questions && (
          <div className="p-6 space-y-4">
            {questions.length > 0 ? questions.map((q: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 text-lg">"{q.question}"</p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Why Ask This</p>
                    <p className="text-gray-700">{q.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Expected Insight</p>
                    <p className="text-gray-700">{q.expectedInsight}</p>
                  </div>
                </div>
                {q.followUp && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase mb-1">Follow-Up</p>
                    <p className="text-gray-700 text-sm">{q.followUp}</p>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-gray-500 text-sm">No questions generated.</p>
            )}
          </div>
        )}
      </div>

      {/* Next Steps Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('nextSteps')}
          className="w-full px-6 py-4 flex items-center justify-between bg-green-50 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Recommended Next Steps</h3>
            <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">{nextSteps.length}</span>
          </div>
          {expandedSections.nextSteps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {expandedSections.nextSteps && (
          <div className="p-6">
            {nextSteps.length > 0 ? (
              <div className="space-y-3">
                {nextSteps.sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99)).map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {step.priority || idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{step.action}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {step.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {step.timing}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" /> {step.outcome}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No next steps generated.</p>
            )}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('tasks')}
          className="w-full px-6 py-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Tasks to Assign</h3>
            <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
          </div>
          {expandedSections.tasks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {expandedSections.tasks && (
          <div className="p-6">
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.task}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {task.assignTo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {task.dueDate}
                        </span>
                      </div>
                      {task.deliverable && (
                        <p className="text-sm text-gray-500 mt-1">Deliverable: {task.deliverable}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tasks generated.</p>
            )}
          </div>
        )}
      </div>

      {/* Risk Flags Section */}
      {riskFlags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('risks')}
            className="w-full px-6 py-4 flex items-center justify-between bg-red-50 hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Risk Flags & Concerns</h3>
              <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full">{riskFlags.length}</span>
            </div>
            {expandedSections.risks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.risks && (
            <div className="p-6 space-y-3">
              {riskFlags.map((risk: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg ${
                  risk.severity === 'high' ? 'bg-red-50 border border-red-200' :
                  risk.severity === 'medium' ? 'bg-amber-50 border border-amber-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <p className="font-medium text-gray-900">{risk.flag}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Findings & Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Detailed Findings ({findings?.length || 0})
        </h3>
        <div className="space-y-4">
          {findings?.map((finding: any, idx: number) => (
            <div key={finding.id || idx} className={`border-l-4 pl-4 py-3 ${
              finding.severity === 'critical' ? 'border-red-500' :
              finding.severity === 'high' ? 'border-orange-500' :
              finding.severity === 'medium' ? 'border-yellow-500' :
              'border-green-500'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    finding.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    finding.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {finding.severity?.toUpperCase()}
                  </span>
                  <h4 className="font-medium text-gray-900 mt-2">{finding.title}</h4>
                </div>
                {finding.annual_cost_impact && (
                  <span className="text-red-600 font-semibold">
                    £{finding.annual_cost_impact.toLocaleString()}/yr
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">{finding.description}</p>
              {finding.client_quote && (
                <p className="text-sm text-gray-500 mt-2 italic">"{finding.client_quote}"</p>
              )}
              {finding.recommendation && (
                <p className="text-sm text-green-700 mt-2">
                  <strong>Fix:</strong> {finding.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      {report.quick_wins && report.quick_wins.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Quick Wins (Implement in &lt;1 week)
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {report.quick_wins.map((qw: any, idx: number) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{qw.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{qw.action}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-gray-500">{qw.timeToImplement}</span>
                  <span className="text-green-600 font-medium">
                    Saves {qw.hoursSavedWeekly}hrs/wk (£{qw.annualBenefit?.toLocaleString()}/yr)
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

