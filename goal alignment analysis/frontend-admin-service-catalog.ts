/**
 * Service Catalog - Database-backed service lookup
 * 
 * Fetches services and issue mappings from database, with fallback to hardcoded values.
 */

import { supabase } from '../supabase';

export interface Service {
  code: string;
  name: string;
  category: string;
  tier?: string;
  shortDescription: string;
  whatWeDo: string[];
  priceAmount: number;
  pricePeriod: string;
  priceDisplay: string;
  typicalRoi: string;
  bestFor: string;
  ctaText: string;
  ctaUrl?: string;
  displayOrder: number;
}

export interface IssueMapping {
  issueCode: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggerField: string;
  triggerCondition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  triggerValue: string;
  primaryServiceCode: string;
  secondaryServiceCode?: string;
  whyItMattersTemplate: string;
  roiTemplate: string;
  displayOrder: number;
}

// Cache for services and mappings
let servicesCache: Service[] | null = null;
let mappingsCache: IssueMapping[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active services from database
 */
export async function fetchServices(): Promise<Service[]> {
  // Check cache
  if (servicesCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return servicesCache;
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')
      .order('display_order');

    if (error) {
      console.warn('[ServiceCatalog] Database fetch failed, using fallback:', error.message);
      return getFallbackServices();
    }

    if (!data || data.length === 0) {
      console.warn('[ServiceCatalog] No services in database, using fallback');
      return getFallbackServices();
    }

    const services = data.map(transformDbService);
    servicesCache = services;
    cacheTimestamp = Date.now();
    return services;
  } catch (err) {
    console.warn('[ServiceCatalog] Error fetching services:', err);
    return getFallbackServices();
  }
}

/**
 * Fetch all active issue mappings from database
 */
export async function fetchIssueMappings(): Promise<IssueMapping[]> {
  // Check cache
  if (mappingsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return mappingsCache;
  }

  try {
    const { data, error } = await supabase
      .from('issue_service_mappings')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.warn('[ServiceCatalog] Mappings fetch failed, using fallback:', error.message);
      return getFallbackMappings();
    }

    if (!data || data.length === 0) {
      console.warn('[ServiceCatalog] No mappings in database, using fallback');
      return getFallbackMappings();
    }

    const mappings = data.map(transformDbMapping);
    mappingsCache = mappings;
    cacheTimestamp = Date.now();
    return mappings;
  } catch (err) {
    console.warn('[ServiceCatalog] Error fetching mappings:', err);
    return getFallbackMappings();
  }
}

/**
 * Get a specific service by code
 */
export async function getServiceByCode(code: string): Promise<Service | null> {
  const services = await fetchServices();
  return services.find(s => s.code === code) || null;
}

/**
 * Get services by category
 */
export async function getServicesByCategory(category: string): Promise<Service[]> {
  const services = await fetchServices();
  return services.filter(s => s.category === category);
}

/**
 * Clear the cache (useful after updates)
 */
export function clearServiceCache(): void {
  servicesCache = null;
  mappingsCache = null;
  cacheTimestamp = 0;
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

function transformDbService(dbService: any): Service {
  return {
    code: dbService.code,
    name: dbService.name,
    category: dbService.category,
    tier: dbService.tier,
    shortDescription: dbService.short_description || '',
    whatWeDo: Array.isArray(dbService.what_we_do) ? dbService.what_we_do : [],
    priceAmount: dbService.price_amount || 0,
    pricePeriod: dbService.price_period || 'month',
    priceDisplay: dbService.price_display || '',
    typicalRoi: dbService.typical_roi || '',
    bestFor: dbService.best_for || '',
    ctaText: dbService.cta_text || 'Learn More',
    ctaUrl: dbService.cta_url,
    displayOrder: dbService.display_order || 0,
  };
}

function transformDbMapping(dbMapping: any): IssueMapping {
  return {
    issueCode: dbMapping.issue_code,
    title: dbMapping.title,
    severity: dbMapping.severity as IssueMapping['severity'],
    triggerField: dbMapping.trigger_field,
    triggerCondition: dbMapping.trigger_condition as IssueMapping['triggerCondition'],
    triggerValue: dbMapping.trigger_value,
    primaryServiceCode: dbMapping.primary_service_code,
    secondaryServiceCode: dbMapping.secondary_service_code,
    whyItMattersTemplate: dbMapping.why_it_matters_template || '',
    roiTemplate: dbMapping.roi_template || '',
    displayOrder: dbMapping.display_order || 0,
  };
}

// =============================================================================
// FALLBACK DATA (in case database is unavailable)
// =============================================================================

function getFallbackServices(): Service[] {
  return [
    {
      code: 'ma_gold',
      name: 'Management Accounts - Gold',
      category: 'management_accounts',
      tier: 'gold',
      shortDescription: 'Full strategic finance support with margin tracking and deep insights.',
      whatWeDo: [
        'Project/client margin tracking',
        'Strategic narrative and insights',
        'Monthly review call',
        'Concentration monitoring',
        'Custom KPI dashboard'
      ],
      priceAmount: 1500,
      pricePeriod: 'month',
      priceDisplay: '£1,500/month',
      typicalRoi: '2-5% margin improvement typical',
      bestFor: 'Ambitious businesses wanting strategic advantage',
      ctaText: 'Learn More',
      displayOrder: 30,
    },
    {
      code: 'goal_alignment',
      name: '365 Alignment Programme',
      category: 'advisory',
      shortDescription: 'Strategic clarity with North Star articulation, 90-day sprints, and quarterly reviews.',
      whatWeDo: [
        'North Star destination articulation',
        '90-day sprint planning',
        'Quarterly accountability reviews',
        'Team alignment workshops',
        'Knowledge transfer framework'
      ],
      priceAmount: 4500,
      pricePeriod: 'year',
      priceDisplay: '£4,500/year',
      typicalRoi: '+20-40% business value through succession readiness',
      bestFor: 'Businesses seeking strategic clarity or succession planning',
      ctaText: 'Learn More',
      displayOrder: 50,
    },
    {
      code: 'fractional_cfo',
      name: 'Fractional CFO',
      category: 'fractional',
      shortDescription: 'Senior financial strategy without full-time cost.',
      whatWeDo: [
        'Financial strategy development',
        'Pricing and margin optimisation',
        'Fundraising support',
        'Exit planning and preparation',
        'Board/investor presentations'
      ],
      priceAmount: 3000,
      pricePeriod: 'month',
      priceDisplay: '£2,000-5,000/month',
      typicalRoi: 'Varies by engagement - typically 5-10x ROI',
      bestFor: 'Businesses needing senior financial leadership',
      ctaText: 'Learn More',
      displayOrder: 80,
    },
  ];
}

function getFallbackMappings(): IssueMapping[] {
  return [
    {
      issueCode: 'concentration_critical',
      title: 'Critical Client Concentration',
      severity: 'critical',
      triggerField: 'client_concentration_top3',
      triggerCondition: 'gte',
      triggerValue: '80',
      primaryServiceCode: 'ma_gold',
      secondaryServiceCode: 'goal_alignment',
      whyItMattersTemplate: '{concentration}% of your revenue comes from just 3 clients.',
      roiTemplate: 'Protection and monitoring of revenue base',
      displayOrder: 10,
    },
    {
      issueCode: 'founder_dependency_critical',
      title: 'Critical Founder Dependency',
      severity: 'critical',
      triggerField: 'founder_risk_level',
      triggerCondition: 'eq',
      triggerValue: 'critical',
      primaryServiceCode: 'goal_alignment',
      whyItMattersTemplate: 'Critical knowledge and relationships concentrated in founder.',
      roiTemplate: '+30-50% business value through succession readiness',
      displayOrder: 20,
    },
  ];
}

