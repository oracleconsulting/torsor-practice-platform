/**
 * ServicePathwayPanel - Admin ACT Phase
 * Shows practitioners which services to discuss with the client
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Clock, PoundSterling, Target, Copy, Check, MessageSquare, Info } from 'lucide-react';
import type { DetectedIssue, ServiceRecommendation } from '../../../lib/issue-service-mapping';
import { ServiceRecommendationPopup } from '../../shared/ServiceRecommendationPopup';

interface ServicePathwayPanelProps {
  issues: DetectedIssue[];
  priorityServices: ServiceRecommendation[];
  clientName?: string;
}

export const ServicePathwayPanel: React.FC<ServicePathwayPanelProps> = ({
  issues,
  priorityServices,
  clientName,
}) => {
  const displayName = clientName || 'the client';
  const [expandedIssue, setExpandedIssue] = useState<string | null>(
    issues.length > 0 ? (issues[0].issueType || issues[0].code || null) : null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [popupServiceCode, setPopupServiceCode] = useState<string | null>(null);

  const serviceNameToCode = (name: string): string => {
    const n = (name || '').toLowerCase();
    if (n.includes('benchmark')) return 'benchmarking';
    if (n.includes('systems') || n.includes('audit')) return 'systems_audit';
    if (n.includes('goal') || n.includes('alignment') || n.includes('365')) return 'goal_alignment';
    if (n.includes('fractional cfo')) return 'fractional_cfo';
    if (n.includes('profit extraction')) return 'profit_extraction';
    if (n.includes('business intelligence') || n.includes('quarterly bi')) return 'quarterly_bi';
    return 'benchmarking';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded">OPPORTUNITY</span>;
      default:
        return null;
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateTalkingPoint = (issue: DetectedIssue): string => {
    const service = issue.services?.[0];
    if (!service) return '';
    
    return `"Based on what we've found - ${issue.description.toLowerCase()} - I'd recommend we look at ${service.serviceName}. ${service.howItHelps}. Most clients see ${service.expectedOutcome.toLowerCase()} within ${service.timeToValue}."`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5" />
          Service Pathway {displayName !== 'the client' && `for ${displayName}`}
        </h3>
        <p className="text-indigo-100 text-sm mt-1">
          Based on {issues.length} identified {issues.length === 1 ? 'issue' : 'issues'}
        </p>
      </div>

      {/* Priority Services Summary */}
      {priorityServices.length > 0 && (
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h4 className="text-sm font-semibold text-indigo-800 mb-3">
            Lead with these services:
          </h4>
          <div className="flex flex-wrap gap-2">
            {priorityServices.map((service, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200"
              >
                <span className="font-medium text-slate-800">{service.serviceName}</span>
                <span className="text-sm text-indigo-600">{service.priceRange}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="divide-y divide-slate-100">
        {issues.map((issue, idx) => {
          const issueKey = issue.issueType || issue.code || `issue-${idx}`;
          return (
          <div key={issueKey} className="group">
            {/* Issue Header - Clickable */}
            <button
              onClick={() => setExpandedIssue(
                expandedIssue === issueKey ? null : issueKey
              )}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                {issue.severity === 'critical' || issue.severity === 'high' ? (
                  <AlertTriangle className={`w-5 h-5 ${
                    issue.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getSeverityBadge(issue.severity)}
                </div>
                <h4 className="font-semibold text-slate-900">{issue.headline}</h4>
                <p className="text-sm text-slate-500">{issue.dataPoint}</p>
              </div>

              <div className="flex-shrink-0">
                {expandedIssue === issueKey ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {expandedIssue === issueKey && (
              <div className="px-6 pb-6 space-y-4">
                {/* Description */}
                <div className="pl-9">
                  <p className="text-slate-600">{issue.description}</p>
                </div>

                {/* Talking Point */}
                <div className="pl-9">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-slate-700 mb-2">Say this:</h5>
                          <p className="text-sm text-slate-600 italic">
                            {generateTalkingPoint(issue)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(generateTalkingPoint(issue), issueKey)}
                        className="flex-shrink-0 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === issueKey ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recommended Services */}
                {issue.services && issue.services.length > 0 && (
                <div className="pl-9">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3">
                    Recommended services:
                  </h5>
                  <div className="space-y-3">
                    {issue.services.map((service, svcIdx) => (
                      <div
                        key={svcIdx}
                        className="bg-white rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h6 className="font-semibold text-slate-900">
                            {service.serviceName}
                          </h6>
                          <button
                            type="button"
                            onClick={() => setPopupServiceCode(service.serviceCode || serviceNameToCode(service.serviceName))}
                            className="flex-shrink-0 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Learn more"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            service.priority === 'immediate' ? 'bg-red-100 text-red-700' :
                            service.priority === 'short-term' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {service.priority === 'immediate' ? 'Start Now' :
                             service.priority === 'short-term' ? '1-3 Months' :
                             '3-6 Months'}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                          {service.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-500">
                            <PoundSterling className="w-4 h-4" />
                            <span>{service.priceRange}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span>{service.timeToValue}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-sm">
                            <span className="font-medium text-slate-700">Expected outcome: </span>
                            <span className="text-slate-600">{service.expectedOutcome}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        );})}
      </div>

      {/* No Issues State */}
      {issues.length === 0 && (
        <div className="px-6 py-8 text-center">
          <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h4 className="font-semibold text-slate-900 mb-2">
            Strong Position
          </h4>
          <p className="text-slate-600 text-sm">
            No significant issues detected. Focus the conversation on maintaining performance and exploring growth opportunities.
          </p>
        </div>
      )}

      {/* Footer */}
      {issues.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            <strong>Tip:</strong> Lead with the highest severity issues. Critical issues require immediate attention and typically have the strongest service fit.
          </p>
        </div>
      )}

      <ServiceRecommendationPopup
        isOpen={!!popupServiceCode}
        onClose={() => setPopupServiceCode(null)}
        serviceCode={popupServiceCode || ''}
      />
    </div>
  );
};

export default ServicePathwayPanel;

