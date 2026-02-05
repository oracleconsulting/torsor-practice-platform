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
  ChevronUp,
  Target,
  AlertTriangle,
  Sparkles,
  Pin,
  TrendingUp
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
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${Math.round(value / 1_000)}k`;
  return `£${value}`;
};

const formatPrice = (service: RecommendedService): string => {
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
    '/project': 'One-off',
    'one_off': 'One-off',
    '/month': 'Monthly',
    '/year': 'Annual'
  };
  return labels[unit] || unit;
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'operations':
    case 'operational':
      return <Target className="w-5 h-5" />;
    case 'finance':
    case 'tax_efficiency':
      return <TrendingUp className="w-5 h-5" />;
    case 'governance':
    case 'risk':
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return <Sparkles className="w-5 h-5" />;
  }
};

// =============================================================================
// PRIMARY SERVICE CARD - Full detail view
// =============================================================================

function PrimaryServiceCard({ service }: { service: RecommendedService }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const totalValue = service.totalValueAtStake || 
    service.addressesIssues.reduce((sum, issue) => sum + (issue.valueAtStake || 0), 0);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {service.source === 'pinned' && (
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                <Pin className="w-3 h-3" />
                RECOMMENDED FOR YOU
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">{formatPrice(service)}</p>
            {service.priceUnit && (
              <p className="text-sm text-slate-500">{getPriceUnitLabel(service.priceUnit)}</p>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            {getCategoryIcon(service.category)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{service.serviceName}</h3>
            {service.headline && (
              <p className="text-slate-600 text-sm">{service.headline}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-6 py-5 space-y-5">
        {/* Why This Matters */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Why This Matters For You
          </h4>
          <p className="text-slate-600 leading-relaxed">
            {service.whyThisMatters || service.description}
          </p>
        </div>
        
        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isExpanded ? 'Show less' : 'Show what you get'}
        </button>
        
        {isExpanded && (
          <>
            {/* What You Get */}
            {service.whatYouGet && service.whatYouGet.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  What You Get
                </h4>
                <ul className="space-y-2">
                  {service.whatYouGet.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Expected Outcome */}
            {service.expectedOutcome && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-1">
                  Expected Outcome
                </h4>
                <p className="text-blue-700">
                  {service.expectedOutcome}
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Footer: Timeline + Issues Addressed */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          {/* Timeline */}
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{service.timeToValue || '4-6 weeks'}</span>
          </div>
          
          {/* Issues Addressed */}
          {service.addressesIssues && service.addressesIssues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">Addresses:</span>
              {service.addressesIssues.map((issue, idx) => (
                <span 
                  key={idx}
                  className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(issue.severity)}`}
                >
                  {issue.issueTitle}
                  {issue.valueAtStake > 0 && (
                    <span className="ml-1 font-medium">
                      ({formatCurrency(issue.valueAtStake)})
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Total Value at Stake */}
        {totalValue > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-amber-800 font-medium">Total value at stake:</span>
            <span className="text-amber-900 font-bold text-lg">{formatCurrency(totalValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SECONDARY SERVICE ROW - Compact view
// =============================================================================

function SecondaryServiceRow({ service }: { service: RecommendedService }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-5 py-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-slate-900">{service.serviceName}</h4>
            <span className="text-sm text-slate-500">{formatPrice(service)}</span>
            {service.timeToValue && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {service.timeToValue}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {service.headline || service.description?.substring(0, 120) + (service.description && service.description.length > 120 ? '...' : '')}
          </p>
          {service.addressesIssues && service.addressesIssues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-slate-400">Addresses:</span>
              {service.addressesIssues.slice(0, 3).map((issue, idx) => (
                <span key={idx} className="text-xs text-slate-600">
                  {issue.issueTitle}{idx < Math.min(service.addressesIssues.length - 1, 2) ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecommendedServicesSection({
  services,
  clientName,
  practitionerName = 'your advisor',
  practitionerEmail,
  practitionerPhone
}: RecommendedServicesSectionProps) {
  if (!services || services.length === 0) {
    return null;
  }
  
  const primaryServices = services.filter(s => s.priority === 'primary');
  const secondaryServices = services.filter(s => s.priority === 'secondary');
  
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
        
        {/* Primary Services - Full Cards */}
        {primaryServices.length > 0 && (
          <div className="space-y-6 mb-8">
            {primaryServices.map((service, idx) => (
              <PrimaryServiceCard key={service.serviceCode || idx} service={service} />
            ))}
          </div>
        )}
        
        {/* Secondary Services - Compact List */}
        {secondaryServices.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Additional Support Options</h3>
            <div className="space-y-3">
              {secondaryServices.map((service, idx) => (
                <SecondaryServiceRow key={service.serviceCode || idx} service={service} />
              ))}
            </div>
          </div>
        )}
        
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
