/**
 * RecommendedServicesSection - Premium Client-Facing Service Recommendations
 * 
 * This is the commercial heart of the report. It displays:
 * - Primary services (full cards with detailed value proposition)
 * - Secondary services (compact rows)
 * - Each service connected to specific client issues
 * - Personalised "why this matters for YOU" content
 * 
 * Data source: bm_reports.recommended_services (built by Pass 3)
 * NOT from static issue-service-mapping.ts
 */

import { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  Sparkles
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface AddressedIssue {
  issueTitle: string;
  valueAtStake: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RecommendedService {
  serviceCode: string;
  serviceName: string;
  description: string;
  headline?: string;
  priceFrom?: number;
  priceTo?: number;
  priceUnit?: string;
  priceRange?: string;
  category?: string;
  // Personalised content
  whyThisMatters: string;
  whatYouGet: string[];
  expectedOutcome: string;
  timeToValue: string;
  // Connection to issues
  addressesIssues: AddressedIssue[];
  totalValueAtStake?: number;
  // Source and priority
  source: 'pinned' | 'opportunity' | 'context_suggested';
  priority: 'primary' | 'secondary';
}

interface RecommendedServicesSectionProps {
  services: RecommendedService[];
  clientName?: string;
  practitionerName?: string;
  practitionerEmail?: string;
  practitionerPhone?: string;
  expandAll?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${Math.round(value / 1_000)}k`;
  return `£${value}`;
};

const isBIOrBenchmarking = (service: RecommendedService): boolean => {
  const n = (service.serviceName || service.serviceCode || '').toLowerCase();
  const c = (service.serviceCode || '').toLowerCase();
  return n.includes('bi') || n.includes('benchmarking') || c === 'business_intelligence' || c === 'benchmarking';
};

const formatPrice = (service: RecommendedService): string => {
  if (isBIOrBenchmarking(service)) {
    return '£500 – £1,000/month or £1,500 – £3,000/quarter';
  }
  if (service.priceRange) return service.priceRange;
  if (service.priceFrom && service.priceTo) {
    return `£${service.priceFrom.toLocaleString()} – £${service.priceTo.toLocaleString()}${service.priceUnit ? ` ${service.priceUnit}` : ''}`;
  }
  if (service.priceFrom) {
    return `From £${service.priceFrom.toLocaleString()}${service.priceUnit ? ` ${service.priceUnit}` : ''}`;
  }
  return 'Contact for pricing';
};

const getPriceUnitLabel = (unit?: string): string => {
  if (!unit) return '';
  const labels: Record<string, string> = {
    'per_month': 'Monthly',
    'per_year': 'Annual',
    'per_quarter': 'Quarterly',
    '/quarter': 'Quarterly',
    '/project': 'One-off',
    'one_off': 'One-off',
    '/month': 'Monthly',
    '/year': 'Annual'
  };
  return labels[unit] || unit;
};

const getPriceUnitLabelForService = (service: RecommendedService): string => {
  if (isBIOrBenchmarking(service)) return 'Monthly or Quarterly';
  return getPriceUnitLabel(service.priceUnit);
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

function ServiceAccordionCard({
  service,
  index,
  expandAll = false,
}: {
  service: RecommendedService;
  index: number;
  expandAll?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isExpanded = expandAll || isOpen;
  const isPrimary = service.priority === 'primary';
  const totalValue = service.totalValueAtStake ||
    service.addressesIssues.reduce((sum, issue) => sum + (issue.valueAtStake || 0), 0);
  const accent = isPrimary ? 'border-blue-500' : 'border-purple-500';
  const accentText = isPrimary ? 'text-blue-700' : 'text-purple-700';
  const accentBg = isPrimary ? 'bg-blue-50' : 'bg-purple-50';

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${accent}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
        aria-expanded={isExpanded}
      >
        {isPrimary && (
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Recommended For You</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900">{service.serviceName}</h3>
              {isPrimary && (
                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-wide">
                  Priority
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {service.headline || service.description || service.whyThisMatters}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-sm font-semibold ${accentText}`}>{formatPrice(service)}</p>
            {getPriceUnitLabelForService(service) && (
              <p className="text-xs text-slate-500">{getPriceUnitLabelForService(service)}</p>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-4 border-t border-slate-100 space-y-4">
          {service.whyThisMatters && (
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Why This Matters For You
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{service.whyThisMatters}</p>
            </div>
          )}

          {service.whatYouGet && service.whatYouGet.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                What You Get
              </h4>
              <ul className="space-y-2">
                {service.whatYouGet.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.expectedOutcome && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                Expected Outcome
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">{service.expectedOutcome}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{service.timeToValue || '4-6 weeks'}</span>
            </div>
            {service.addressesIssues && service.addressesIssues.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500">Addresses:</span>
                {service.addressesIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(issue.severity || 'medium')}`}
                  >
                    {issue.issueTitle}
                    {issue.valueAtStake > 0 && (
                      <span className="ml-1 font-medium">({formatCurrency(issue.valueAtStake)})</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {totalValue > 0 && (
            <div className={`${accentBg} border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between`}>
              <span className="text-slate-800 font-medium">Total value at stake:</span>
              <span className={`font-bold text-lg ${accentText}`}>{formatCurrency(totalValue)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecommendedServicesSection({
  services,
  clientName,
  expandAll = false,
}: RecommendedServicesSectionProps) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-slate-50 to-white print:py-8" data-section="recommended-services">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Tailored Support
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            How We Can Help
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Based on your analysis, we've identified specific services that address your key challenges
            {clientName && ` and are tailored to ${clientName}'s situation`}.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {services.map((service, idx) => (
            <ServiceAccordionCard
              key={service.serviceCode || `${service.serviceName}-${idx}`}
              service={service}
              index={idx}
              expandAll={expandAll}
            />
          ))}
        </div>
        
        {/* Softer close - no hard CTA */}
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <p className="text-slate-600">
            These recommendations are based on your business data and industry benchmarks.
            Service scope and pricing are confirmed based on your specific requirements.
          </p>
        </div>
      </div>
    </section>
  );
}

export default RecommendedServicesSection;
