/**
 * EnhancedServiceRecommendations - Comprehensive Service Presentation
 * 
 * Displays recommended services with full detail:
 * - Service name, headline, description
 * - Pricing and timeline
 * - Key deliverables
 * - WHY it's recommended (linked to specific issues)
 * - Expected outcomes and ROI
 * - How it connects to the overall analysis
 */

import { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Shield,
  Sparkles
} from 'lucide-react';

interface ServiceOpportunity {
  id: string;
  opportunity_code: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  data_evidence: string;
  financial_impact_amount?: number;
  talking_point?: string;
  life_impact?: string;
  quick_win?: string;
  service?: {
    id: string;
    code: string;
    name: string;
    headline?: string;
    description?: string;
    price_from?: number;
    price_to?: number;
    price_unit?: string;
    typical_duration?: string;
    deliverables?: string[];
    category?: string;
  };
  service_fit_rationale?: string;
  for_the_owner?: string;
}

interface EnhancedServiceRecommendationsProps {
  opportunities: ServiceOpportunity[];
  clientName?: string;
  practitionerName?: string;
  practitionerEmail?: string;
}

// Map service codes to icons
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  SYSTEMS_AUDIT: <Shield className="w-6 h-6" />,
  STRATEGIC_ADVISORY: <Lightbulb className="w-6 h-6" />,
  QUARTERLY_BI_SUPPORT: <TrendingUp className="w-6 h-6" />,
  PROFIT_EXTRACTION: <DollarSign className="w-6 h-6" />,
  EXIT_READINESS: <Target className="w-6 h-6" />,
  FRACTIONAL_COO: <Shield className="w-6 h-6" />,
  FRACTIONAL_CFO: <DollarSign className="w-6 h-6" />,
};

// Default deliverables by service category
const DEFAULT_DELIVERABLES: Record<string, string[]> = {
  SYSTEMS_AUDIT: [
    'Comprehensive process inventory — what exists vs what\'s assumed',
    'Documentation gap analysis with priority ratings',
    'Knowledge dependency map (who knows what)',
    'System health assessment and risk register',
    'Prioritised systemisation roadmap',
    'Quick wins identification for immediate action'
  ],
  STRATEGIC_ADVISORY: [
    'Monthly strategic review sessions',
    'Decision support on key business challenges',
    'Growth strategy refinement',
    'Stakeholder communication guidance',
    'Exit preparation advisory (if applicable)',
    'Access to senior expertise without full-time cost'
  ],
  QUARTERLY_BI_SUPPORT: [
    'Quarterly benchmarking refresh and trend analysis',
    'Monthly KPI dashboard and commentary',
    'Early warning indicators for your sector',
    'Board-ready financial summaries',
    'Ad-hoc analysis requests',
    'Strategic insights from your data'
  ],
  PROFIT_EXTRACTION: [
    'Current structure efficiency review',
    'Tax-efficient extraction modelling',
    'Dividend vs salary optimisation',
    'Pension contribution strategy',
    'Personal wealth structuring guidance',
    '12-month extraction plan'
  ],
};

export function EnhancedServiceRecommendations({
  opportunities,
  clientName,
  practitionerName = 'your advisor',
  practitionerEmail
}: EnhancedServiceRecommendationsProps) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  // Filter to only opportunities with recommended services
  const serviceOpportunities = opportunities.filter(o => o.service && o.service.code);

  // Group by service to avoid duplicates
  const uniqueServices = new Map<string, ServiceOpportunity[]>();
  serviceOpportunities.forEach(opp => {
    const code = opp.service!.code;
    if (!uniqueServices.has(code)) {
      uniqueServices.set(code, []);
    }
    uniqueServices.get(code)!.push(opp);
  });

  // Sort by severity of linked opportunities
  const sortedServices = Array.from(uniqueServices.entries()).sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aMaxSeverity = Math.min(...a[1].map(o => severityOrder[o.severity] || 3));
    const bMaxSeverity = Math.min(...b[1].map(o => severityOrder[o.severity] || 3));
    return aMaxSeverity - bMaxSeverity;
  });

  if (sortedServices.length === 0) {
    return null;
  }

  const toggleExpand = (code: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const formatPrice = (service: ServiceOpportunity['service']) => {
    if (!service?.price_from) return 'Contact for pricing';
    
    const from = service.price_from.toLocaleString();
    const to = service.price_to?.toLocaleString();
    const unit = service.price_unit || '';
    
    let unitLabel = '';
    if (unit === 'per_month' || unit === 'month' || unit === 'monthly') unitLabel = '/month';
    else if (unit === 'one_off' || unit === 'one-off' || unit === '/project') unitLabel = ' (one-off)';
    else if (unit === 'per_year' || unit === 'annual') unitLabel = '/year';
    
    if (to && to !== from) {
      return `£${from} - £${to}${unitLabel}`;
    }
    return `From £${from}${unitLabel}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTotalImpact = () => {
    return serviceOpportunities.reduce((sum, o) => sum + (o.financial_impact_amount || 0), 0);
  };

  return (
    <section className="enhanced-service-recommendations py-12 print:py-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full mb-4">
            RECOMMENDED SERVICES
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            How We Can Help
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Based on your benchmarking analysis, here are the services that directly address 
            the opportunities and risks we've identified.
          </p>
          {getTotalImpact() > 0 && (
            <p className="text-emerald-600 font-semibold mt-3">
              Combined potential impact: £{getTotalImpact().toLocaleString()}
            </p>
          )}
        </div>

        {/* Service Cards */}
        <div className="space-y-6">
          {sortedServices.map(([serviceCode, opps]) => {
            const service = opps[0].service!;
            const isExpanded = expandedServices.has(serviceCode);
            const deliverables = service.deliverables?.length 
              ? service.deliverables 
              : DEFAULT_DELIVERABLES[serviceCode] || [];
            const Icon = SERVICE_ICONS[serviceCode] || <Sparkles className="w-6 h-6" />;
            
            // Calculate total financial impact for this service
            const totalImpact = opps.reduce((sum, o) => sum + (o.financial_impact_amount || 0), 0);

            return (
              <div 
                key={serviceCode}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:break-inside-avoid"
              >
                {/* Service Header - Always Visible */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                      {Icon}
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {service.name}
                          </h3>
                          {service.headline && (
                            <p className="text-slate-600 mt-1">
                              {service.headline}
                            </p>
                          )}
                        </div>
                        
                        {/* Pricing Badge */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-emerald-600">
                            {formatPrice(service)}
                          </div>
                          {service.typical_duration && (
                            <div className="text-sm text-slate-500 flex items-center justify-end gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {service.typical_duration}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Why This Service - Brief */}
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-500" />
                          Why We're Recommending This
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {opps.map((opp, idx) => (
                            <span 
                              key={idx}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getSeverityColor(opp.severity)}`}
                            >
                              {opp.severity.toUpperCase()}: {opp.title.slice(0, 40)}{opp.title.length > 40 ? '...' : ''}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-600">
                          {opps[0].service_fit_rationale || service.description || 
                           `Directly addresses ${opps.length} identified ${opps.length === 1 ? 'issue' : 'issues'} in your analysis.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(serviceCode)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        See Full Details & Deliverables
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-6">
                    {/* Description */}
                    {service.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          About This Service
                        </h4>
                        <p className="text-slate-600">
                          {service.description}
                        </p>
                      </div>
                    )}

                    {/* Deliverables */}
                    {deliverables.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          What You'll Receive
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {deliverables.map((item, idx) => (
                            <div 
                              key={idx}
                              className="flex items-start gap-2 bg-white rounded-lg p-3 border border-slate-200"
                            >
                              <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                              <span className="text-sm text-slate-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Issues Detail */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Issues This Addresses
                      </h4>
                      <div className="space-y-3">
                        {opps.map((opp, idx) => (
                          <div 
                            key={idx}
                            className="bg-white rounded-xl p-4 border border-slate-200"
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <span className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded mr-2 ${getSeverityColor(opp.severity)}`}>
                                  {opp.severity}
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {opp.title}
                                </span>
                              </div>
                              {opp.financial_impact_amount && opp.financial_impact_amount > 0 && (
                                <span className="text-emerald-600 font-bold flex-shrink-0">
                                  £{opp.financial_impact_amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                              {opp.data_evidence}
                            </p>
                            {opp.quick_win && (
                              <p className="text-sm text-indigo-600 flex items-start gap-2">
                                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span><strong>Quick Win:</strong> {opp.quick_win}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expected Outcomes */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                      <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Expected Outcomes
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {totalImpact > 0 && (
                          <div>
                            <p className="text-sm text-emerald-700">
                              <strong>Financial Impact:</strong> Up to £{totalImpact.toLocaleString()} potential value
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-emerald-700">
                            <strong>Timeline:</strong> {service.typical_duration || 'Results within 30-90 days'}
                          </p>
                        </div>
                        {opps[0].for_the_owner && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-emerald-700">
                              <strong>For You:</strong> {opps[0].for_the_owner}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white print:hidden">
          <h3 className="text-2xl font-bold mb-3">
            Ready to Take Action?
          </h3>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            {practitionerName} can walk you through each recommendation and help you prioritise 
            based on your timeline and budget.
          </p>
          
          {practitionerEmail && (
            <a
              href={`mailto:${practitionerEmail}?subject=Benchmarking%20Services%20Discussion${clientName ? `%20-%20${encodeURIComponent(clientName)}` : ''}&body=Hi%2C%0A%0AI've%20reviewed%20my%20benchmarking%20report%20and%20would%20like%20to%20discuss%20the%20recommended%20services.%0A%0AThanks`}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Schedule a Discussion
              <ArrowRight className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Print Note */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Service pricing is indicative and confirmed based on scope. All recommendations are tailored 
          to the specific issues identified in your analysis.
        </p>
      </div>
    </section>
  );
}

export default EnhancedServiceRecommendations;
