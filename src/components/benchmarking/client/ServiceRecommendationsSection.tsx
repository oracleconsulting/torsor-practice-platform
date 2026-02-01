/**
 * ServiceRecommendationsSection - ACT Phase
 * Displays recommended services based on identified issues with CTAs
 */

import React from 'react';
import { ArrowRight, CheckCircle, Clock, TrendingUp, AlertTriangle, Shield, Zap } from 'lucide-react';
import type { DetectedIssue, ServiceRecommendation } from '../../../lib/issue-service-mapping';

interface ServiceRecommendationsSectionProps {
  issues: DetectedIssue[];
  priorityServices: ServiceRecommendation[];
  practitionerName?: string;
  practitionerEmail?: string;
  clientName?: string;
}

export const ServiceRecommendationsSection: React.FC<ServiceRecommendationsSectionProps> = ({
  issues,
  priorityServices,
  practitionerName = 'your advisor',
  practitionerEmail,
  clientName,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <Shield className="w-5 h-5" />;
      case 'medium': return <TrendingUp className="w-5 h-5" />;
      case 'low': return <Zap className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'Start Now';
      case 'short-term': return '1-3 Months';
      case 'medium-term': return '3-6 Months';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-100 text-red-700';
      case 'short-term': return 'bg-amber-100 text-amber-700';
      case 'medium-term': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Group critical/high issues for emphasis
  const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  const otherIssues = issues.filter(i => i.severity === 'medium' || i.severity === 'low');

  return (
    <section className="service-recommendations-section py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-4">
            ACT
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Your Pathway Forward
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Based on the analysis, here are the areas where focused action will have the greatest impact on your business.
          </p>
        </div>

        {/* Priority Issues */}
        {criticalIssues.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Priority Actions
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {criticalIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border-2 p-6 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(issue.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          issue.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg mb-2">{issue.headline}</h4>
                      <p className="text-sm opacity-90 mb-3">{issue.description}</p>
                      <p className="text-sm font-medium opacity-75">{issue.dataPoint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Issues - Compact */}
        {otherIssues.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Additional Opportunities
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {otherIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    issue.severity === 'medium' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{issue.headline}</p>
                    <p className="text-xs text-slate-500">{issue.dataPoint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Services */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Recommended Services
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {priorityServices.map((service, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Service Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h4 className="font-bold text-lg text-slate-900">
                      {service.serviceName}
                    </h4>
                    <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${getPriorityColor(service.priority)}`}>
                      {getPriorityLabel(service.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    {service.description}
                  </p>
                  <p className="text-lg font-semibold text-indigo-600">
                    {service.priceRange}
                  </p>
                </div>
                
                {/* How It Helps */}
                <div className="p-6 bg-slate-50">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    How It Helps
                  </h5>
                  <p className="text-sm text-slate-700 mb-4">
                    {service.howItHelps}
                  </p>
                  
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Expected Outcome
                  </h5>
                  <p className="text-sm text-slate-700 mb-4">
                    {service.expectedOutcome}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Time to value: {service.timeToValue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Take Action?
          </h3>
          <p className="text-lg text-indigo-100 mb-6 max-w-2xl mx-auto">
            {practitionerName} can guide you through the next steps. Schedule a conversation to discuss which services align with your priorities.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {practitionerEmail && (
              <a
                href={`mailto:${practitionerEmail}?subject=Benchmarking%20Report%20Follow-up${clientName ? `%20-%20${encodeURIComponent(clientName)}` : ''}`}
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Schedule a Discussion
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            
            <div className="text-sm text-indigo-200">
              or call to discuss your options
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-slate-500 mt-8">
          These recommendations are based on your business data and industry benchmarks. 
          Service pricing is indicative and will be confirmed based on your specific requirements.
        </p>
      </div>
    </section>
  );
};

export default ServiceRecommendationsSection;

