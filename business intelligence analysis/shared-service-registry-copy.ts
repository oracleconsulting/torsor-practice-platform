// ============================================================================
// CANONICAL SERVICE REGISTRY — Single Source of Truth
// ============================================================================
// This file defines EVERY service, tier, price, and display string.
// ALL other systems read from this. To change a price: change it HERE.
//
// Location: supabase/functions/_shared/service-registry.ts
// Consumers: Pass 2, Pass 3, ServiceDetailPopup, TransformationJourney,
//            service-scorer-v2, service-lines.ts
// Deploy: Supabase bundles each function in isolation. Pass 2 and Pass 3 use
//         local copies (generate-discovery-report-pass2/service-registry.ts and
//         generate-discovery-opportunities/service-registry.ts). Keep those in
//         sync when editing this file.
// ============================================================================

// === TYPES ===

export interface TurnoverBand {
  maxTurnover: number | null;  // null = no upper limit
  price: number;
  priceFormatted: string;
}

export interface ServiceTier {
  name: string;              // "Clarity", "Tier 1", "Growth"
  tagline: string;           // "See where you are", "See where you could be"
  pricingModel: 'fixed' | 'turnover-scaled';

  // For fixed pricing
  price?: number;
  priceFormatted?: string;

  // For turnover-scaled pricing
  priceRanges?: TurnoverBand[];
  priceFromFormatted?: string;  // "from £2,000" — for popups/summaries

  period: 'one-off' | 'monthly' | 'annual';
  periodLabel: string;       // "", "/month", "/year"

  examplePdfUrl?: string;    // URL in Supabase Storage for tier example
  showInPopup: boolean;      // true for Clarity/Foresight, false for Strategic
  popupCtaLabel?: string;    // "View Example" or "Talk to us"
}

export interface ServiceDefinition {
  code: string;
  name: string;              // "Business Intelligence"
  displayName: string;       // "Business Intelligence" (may include tier in context)
  category: 'foundation' | 'growth' | 'strategic' | 'operational';
  outcome: string;           // "You'll Know Your Numbers"
  description: string;       // One-liner for popups
  keywords: string[];        // For matching LLM output back to service code
  tiers: ServiceTier[];
  defaultTierIndex: number;  // Which tier to recommend by default
  isActive: boolean;         // Include in recommendations?
}

// === THE REGISTRY ===

export const SERVICE_REGISTRY: Record<string, ServiceDefinition> = {

  // ────────────────────────────────────────────────────────────
  // BUSINESS INTELLIGENCE (replaces Management Accounts)
  // The anchor service — every client engagement starts here
  // ────────────────────────────────────────────────────────────
  'business_intelligence': {
    code: 'business_intelligence',
    name: 'Business Intelligence',
    displayName: 'Business Intelligence',
    category: 'operational',
    outcome: "You'll Know Your Numbers",
    description: 'Monthly financial visibility — from knowing where you are to having a strategic financial partner in the room.',
    keywords: ['business intelligence', 'management account', 'monthly reporting', 'financial', 'numbers', 'cash flow', 'P&L'],
    tiers: [
      {
        name: 'Clarity',
        tagline: 'See where you are',
        pricingModel: 'turnover-scaled',
        priceRanges: [
          { maxTurnover: 750000,  price: 2000, priceFormatted: '£2,000' },
          { maxTurnover: 2000000, price: 2500, priceFormatted: '£2,500' },
          { maxTurnover: 5000000, price: 3000, priceFormatted: '£3,000' },
          { maxTurnover: null,    price: 3500, priceFormatted: '£3,500' },
        ],
        priceFromFormatted: 'from £2,000',
        period: 'monthly',
        periodLabel: '/month',
        examplePdfUrl: '/storage/service-examples/business-intelligence-clarity.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Foresight',
        tagline: 'See where you could be',
        pricingModel: 'turnover-scaled',
        priceRanges: [
          { maxTurnover: 750000,  price: 3000, priceFormatted: '£3,000' },
          { maxTurnover: 2000000, price: 3500, priceFormatted: '£3,500' },
          { maxTurnover: 5000000, price: 4500, priceFormatted: '£4,500' },
          { maxTurnover: null,    price: 5000, priceFormatted: '£5,000' },
        ],
        priceFromFormatted: 'from £3,000',
        period: 'monthly',
        periodLabel: '/month',
        examplePdfUrl: '/storage/service-examples/business-intelligence-foresight.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Strategic',
        tagline: 'Your financial partner',
        pricingModel: 'turnover-scaled',
        priceRanges: [
          { maxTurnover: 2000000, price: 5000, priceFormatted: '£5,000' },
          { maxTurnover: 5000000, price: 7000, priceFormatted: '£7,000' },
          { maxTurnover: null,    price: 10000, priceFormatted: '£10,000' },
        ],
        priceFromFormatted: 'from £5,000',
        period: 'monthly',
        periodLabel: '/month',
        showInPopup: true,
        popupCtaLabel: 'Talk to us',
      },
    ],
    defaultTierIndex: 0,
    isActive: true,
  },

  // ────────────────────────────────────────────────────────────
  // INDUSTRY BENCHMARKING
  // ────────────────────────────────────────────────────────────
  'benchmarking': {
    code: 'benchmarking',
    name: 'Industry Benchmarking',
    displayName: 'Industry Benchmarking (Full Package)',
    category: 'foundation',
    outcome: "You'll Know Where You Stand",
    description: 'See exactly how your business compares to others in your industry — revenue, margins, staffing, and hidden value.',
    keywords: ['benchmark', 'valuation', 'hidden value', 'what its worth', 'baseline', 'industry', 'comparison'],
    tiers: [
      {
        name: 'Tier 1',
        tagline: 'Industry comparison and baseline',
        pricingModel: 'fixed',
        price: 2000,
        priceFormatted: '£2,000',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/benchmarking-tier1.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Tier 2',
        tagline: 'Deep-dive with action plan',
        pricingModel: 'fixed',
        price: 4500,
        priceFormatted: '£4,500',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/benchmarking-tier2.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
    ],
    defaultTierIndex: 0,
    isActive: true,
  },

  // ────────────────────────────────────────────────────────────
  // SYSTEMS & PROCESS AUDIT
  // ────────────────────────────────────────────────────────────
  'systems_audit': {
    code: 'systems_audit',
    name: 'Systems & Process Audit',
    displayName: 'Systems & Process Audit',
    category: 'foundation',
    outcome: "You'll See Where The Time Goes",
    description: 'Map every system, process, and workaround in your business — identify what to fix first.',
    keywords: ['systems', 'process', 'efficiency', 'automation', 'audit', 'bottleneck', 'workaround'],
    tiers: [
      {
        name: 'Tier 1',
        tagline: 'Systems map and priority list',
        pricingModel: 'fixed',
        price: 2000,
        priceFormatted: '£2,000',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/systems-audit-tier1.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Tier 2',
        tagline: 'Full audit with implementation roadmap',
        pricingModel: 'fixed',
        price: 4500,
        priceFormatted: '£4,500',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/systems-audit-tier2.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
    ],
    defaultTierIndex: 0,
    isActive: true,
  },

  // ────────────────────────────────────────────────────────────
  // GOAL ALIGNMENT PROGRAMME
  // ────────────────────────────────────────────────────────────
  'goal_alignment': {
    code: 'goal_alignment',
    name: 'Goal Alignment Programme',
    displayName: 'Goal Alignment Programme',
    category: 'growth',
    outcome: "You'll Have Someone In Your Corner",
    description: 'Quarterly accountability and strategic support to close the gap between where you are and where you want to be.',
    keywords: ['goal alignment', 'accountability', 'co-pilot', 'corner', 'support', 'growth', '365', 'alignment'],
    tiers: [
      {
        name: 'Lite',
        tagline: 'Survey + plan + one review',
        pricingModel: 'fixed',
        price: 1500,
        priceFormatted: '£1,500',
        period: 'annual',
        periodLabel: '/year',
        examplePdfUrl: '/storage/service-examples/goal-alignment-lite.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Growth',
        tagline: 'Quarterly reviews for 12 months',
        pricingModel: 'fixed',
        price: 4500,
        priceFormatted: '£4,500',
        period: 'annual',
        periodLabel: '/year',
        examplePdfUrl: '/storage/service-examples/goal-alignment-growth.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Partner',
        tagline: 'Strategy day + BSG integration',
        pricingModel: 'fixed',
        price: 9000,
        priceFormatted: '£9,000',
        period: 'annual',
        periodLabel: '/year',
        showInPopup: true,
        popupCtaLabel: 'Talk to us',
      },
    ],
    defaultTierIndex: 1,
    isActive: true,
  },

  // ────────────────────────────────────────────────────────────
  // BUSINESS ADVISORY & EXIT PLANNING
  // ────────────────────────────────────────────────────────────
  'business_advisory': {
    code: 'business_advisory',
    name: 'Business Advisory & Exit Planning',
    displayName: 'Business Advisory & Exit Planning',
    category: 'strategic',
    outcome: "You'll Know What It's Worth",
    description: 'Protect and maximise the value you have built.',
    keywords: ['exit', 'sale', 'succession', 'planning', 'advisory', 'worth', 'value'],
    tiers: [
      {
        name: 'Tier 1',
        tagline: 'Valuation and readiness assessment',
        pricingModel: 'fixed',
        price: 2000,
        priceFormatted: '£2,000',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/business-advisory-tier1.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Tier 2',
        tagline: 'Full exit strategy and preparation',
        pricingModel: 'fixed',
        price: 4000,
        priceFormatted: '£4,000',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/business-advisory-tier2.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
    ],
    defaultTierIndex: 0,
    isActive: false,
  },

  // ────────────────────────────────────────────────────────────
  // AUTOMATION SERVICES
  // ────────────────────────────────────────────────────────────
  'automation': {
    code: 'automation',
    name: 'Automation Services',
    displayName: 'Automation Services',
    category: 'operational',
    outcome: "The Manual Work Disappears",
    description: 'Eliminate manual work and unlock your team\'s potential.',
    keywords: ['automation', 'automate', 'manual', 'integrate', 'workflow', 'zapier'],
    tiers: [
      {
        name: 'Project',
        tagline: 'Scoped automation implementation',
        pricingModel: 'fixed',
        price: 5000,
        priceFormatted: '£5,000',
        period: 'one-off',
        periodLabel: '',
        examplePdfUrl: '/storage/service-examples/automation-project.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
      {
        name: 'Retainer',
        tagline: 'Ongoing automation support',
        pricingModel: 'fixed',
        price: 1500,
        priceFormatted: '£1,500',
        period: 'monthly',
        periodLabel: '/month',
        examplePdfUrl: '/storage/service-examples/automation-retainer.pdf',
        showInPopup: true,
        popupCtaLabel: 'View Example',
      },
    ],
    defaultTierIndex: 0,
    isActive: false,
  },

  // ────────────────────────────────────────────────────────────
  // FRACTIONAL CFO
  // ────────────────────────────────────────────────────────────
  'fractional_cfo': {
    code: 'fractional_cfo',
    name: 'Fractional CFO',
    displayName: 'Fractional CFO Services',
    category: 'strategic',
    outcome: "You'll Have Strategic Financial Leadership",
    description: 'Part-time strategic finance leadership — the natural next step when you need someone in the room full-time.',
    keywords: ['cfo', 'finance director', 'strategic finance', 'fractional cfo'],
    tiers: [
      {
        name: '2 days/month',
        tagline: 'Strategic finance leadership',
        pricingModel: 'fixed',
        price: 4000,
        priceFormatted: '£4,000',
        period: 'monthly',
        periodLabel: '/month',
        showInPopup: true,
        popupCtaLabel: 'Talk to us',
      },
    ],
    defaultTierIndex: 0,
    isActive: false,
  },

  // ────────────────────────────────────────────────────────────
  // FRACTIONAL COO
  // ────────────────────────────────────────────────────────────
  'fractional_coo': {
    code: 'fractional_coo',
    name: 'Fractional COO',
    displayName: 'Fractional COO Services',
    category: 'strategic',
    outcome: "Someone Else Carries The Load",
    description: 'Operational leadership to build systems that run without you.',
    keywords: ['coo', 'operations', 'fractional coo', 'operational leadership'],
    tiers: [
      {
        name: '2 days/month',
        tagline: 'Operational leadership',
        pricingModel: 'fixed',
        price: 3750,
        priceFormatted: '£3,750',
        period: 'monthly',
        periodLabel: '/month',
        showInPopup: true,
        popupCtaLabel: 'Talk to us',
      },
    ],
    defaultTierIndex: 0,
    isActive: false,
  },

  // ────────────────────────────────────────────────────────────
  // COMBINED CFO/COO ADVISORY
  // ────────────────────────────────────────────────────────────
  'combined_advisory': {
    code: 'combined_advisory',
    name: 'Combined CFO/COO Advisory',
    displayName: 'Combined CFO/COO Advisory',
    category: 'strategic',
    outcome: "Complete Business Transformation",
    description: 'Executive partnership covering both financial and operational strategy.',
    keywords: ['combined', 'cfo coo', 'executive partnership'],
    tiers: [
      {
        name: 'Standard',
        tagline: 'Full executive partnership',
        pricingModel: 'fixed',
        price: 6000,
        priceFormatted: '£6,000',
        period: 'monthly',
        periodLabel: '/month',
        showInPopup: true,
        popupCtaLabel: 'Talk to us',
      },
    ],
    defaultTierIndex: 0,
    isActive: false,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPriceForTurnover(tier: ServiceTier, turnover: number): { price: number; priceFormatted: string } {
  if (tier.pricingModel === 'fixed') {
    return { price: tier.price!, priceFormatted: tier.priceFormatted! };
  }
  if (!tier.priceRanges || tier.priceRanges.length === 0) {
    return { price: 0, priceFormatted: 'TBD' };
  }
  for (const band of tier.priceRanges) {
    if (band.maxTurnover === null || turnover <= band.maxTurnover) {
      return { price: band.price, priceFormatted: band.priceFormatted };
    }
  }
  const last = tier.priceRanges[tier.priceRanges.length - 1];
  return { price: last.price, priceFormatted: last.priceFormatted };
}

export function getDefaultTier(code: string): ServiceTier | null {
  const def = SERVICE_REGISTRY[code];
  if (!def) return null;
  return def.tiers[def.defaultTierIndex] || def.tiers[0] || null;
}

export function getTierByName(code: string, tierName: string): ServiceTier | null {
  const def = SERVICE_REGISTRY[code];
  if (!def) return null;
  return def.tiers.find(t => t.name.toLowerCase() === tierName.toLowerCase()) || null;
}

export function getEnabledByString(
  code: string,
  options?: { tierName?: string; turnover?: number; deferred?: boolean }
): string {
  const def = SERVICE_REGISTRY[code];
  if (!def) return code;
  const tier = options?.tierName ? getTierByName(code, options.tierName) : getDefaultTier(code);
  if (!tier) return def.displayName;
  const { priceFormatted } = options?.turnover
    ? getPriceForTurnover(tier, options.turnover)
    : tier.pricingModel === 'fixed'
      ? { priceFormatted: tier.priceFormatted! }
      : { priceFormatted: tier.priceFromFormatted || 'TBD' };
  const tierLabel = def.tiers.length > 1 ? ` (${tier.name})` : '';
  const priceLabel = `${priceFormatted}${tier.periodLabel}`;
  const deferredSuffix = options?.deferred ? ' — when ready' : '';
  return `${def.displayName}${tierLabel} (${priceLabel}${deferredSuffix})`;
}

export function getOutcome(code: string): string {
  return SERVICE_REGISTRY[code]?.outcome || 'Business Transformation';
}

export function getActiveServiceCodes(): string[] {
  return Object.entries(SERVICE_REGISTRY)
    .filter(([, def]) => def.isActive)
    .map(([code]) => code);
}

export function detectServiceCode(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes('business intelligence')) return 'business_intelligence';
  if (lower.includes('management account')) return 'business_intelligence';
  if (lower.includes('benchmark')) return 'benchmarking';
  if (lower.includes('system') && (lower.includes('audit') || lower.includes('process'))) return 'systems_audit';
  if (lower.includes('goal') || lower.includes('alignment') || lower.includes('365')) return 'goal_alignment';
  if (lower.includes('combined') && (lower.includes('cfo') || lower.includes('coo'))) return 'combined_advisory';
  if (lower.includes('fractional cfo') || (lower.includes('cfo') && !lower.includes('coo'))) return 'fractional_cfo';
  if (lower.includes('fractional coo') || (lower.includes('coo') && !lower.includes('cfo'))) return 'fractional_coo';
  if (lower.includes('automation') || lower.includes('automate')) return 'automation';
  if (lower.includes('exit') || lower.includes('advisory')) return 'business_advisory';
  return null;
}

export function getLegacyServiceDetail(
  code: string,
  turnover?: number
): { name: string; price: string; priceType: string; outcome: string } | null {
  const def = SERVICE_REGISTRY[code];
  if (!def) return null;
  const tier = getDefaultTier(code);
  if (!tier) return null;
  const { priceFormatted } = turnover
    ? getPriceForTurnover(tier, turnover)
    : tier.pricingModel === 'fixed'
      ? { priceFormatted: tier.priceFormatted! }
      : { priceFormatted: tier.priceFromFormatted || 'TBD' };
  return {
    name: def.displayName,
    price: priceFormatted,
    priceType: tier.period === 'one-off' ? 'one-time' : tier.period,
    outcome: def.outcome,
  };
}

export const LEGACY_CODE_MAP: Record<string, string> = {
  '365_method': 'goal_alignment',
  'management_accounts': 'business_intelligence',
};

export function resolveServiceCode(code: string): string {
  return LEGACY_CODE_MAP[code] || code;
}
