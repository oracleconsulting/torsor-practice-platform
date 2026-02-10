// ============================================================================
// DISCOVERY REPORT - PASS 2: DESTINATION-FOCUSED NARRATIVE GENERATION
// ============================================================================
// "We're travel agents selling holidays, not airlines selling seats."
// The client doesn't buy "Management Accounts" - they buy knowing which 
// customers are profitable. They don't buy "Systems Audit" - they buy a 
// week without being the only one who can fix things.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inlined service registry (avoids "Module not found" when Dashboard deploys only index.ts).
// Canonical: supabase/functions/_shared/service-registry.ts — keep in sync when changing prices/tiers.
interface TurnoverBand { maxTurnover: number | null; price: number; priceFormatted: string; }
interface ServiceTier {
  name: string; tagline: string; pricingModel: 'fixed' | 'turnover-scaled';
  price?: number; priceFormatted?: string; priceRanges?: TurnoverBand[]; priceFromFormatted?: string;
  period: 'one-off' | 'monthly' | 'annual'; periodLabel: string;
  examplePdfUrl?: string; showInPopup: boolean; popupCtaLabel?: string;
}
interface ServiceDefinition {
  code: string; name: string; displayName: string; category: 'foundation' | 'growth' | 'strategic' | 'operational';
  outcome: string; description: string; keywords: string[]; tiers: ServiceTier[]; defaultTierIndex: number; isActive: boolean;
}
const SERVICE_REGISTRY: Record<string, ServiceDefinition> = {
  business_intelligence: { code: 'business_intelligence', name: 'Business Intelligence', displayName: 'Business Intelligence', category: 'operational', outcome: "You'll Know Your Numbers", description: 'Monthly financial visibility — from knowing where you are to having a strategic financial partner in the room.', keywords: ['business intelligence', 'management account', 'monthly reporting', 'financial', 'numbers', 'cash flow', 'P&L'], tiers: [{ name: 'Clarity', tagline: 'See where you are', pricingModel: 'turnover-scaled', priceRanges: [{ maxTurnover: 750000, price: 2000, priceFormatted: '£2,000' }, { maxTurnover: 2000000, price: 2500, priceFormatted: '£2,500' }, { maxTurnover: 5000000, price: 3000, priceFormatted: '£3,000' }, { maxTurnover: null, price: 3500, priceFormatted: '£3,500' }], priceFromFormatted: 'from £2,000', period: 'monthly', periodLabel: '/month', examplePdfUrl: '/storage/service-examples/business-intelligence-clarity.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Foresight', tagline: 'See where you could be', pricingModel: 'turnover-scaled', priceRanges: [{ maxTurnover: 750000, price: 3000, priceFormatted: '£3,000' }, { maxTurnover: 2000000, price: 3500, priceFormatted: '£3,500' }, { maxTurnover: 5000000, price: 4500, priceFormatted: '£4,500' }, { maxTurnover: null, price: 5000, priceFormatted: '£5,000' }], priceFromFormatted: 'from £3,000', period: 'monthly', periodLabel: '/month', examplePdfUrl: '/storage/service-examples/business-intelligence-foresight.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Strategic', tagline: 'Your financial partner', pricingModel: 'turnover-scaled', priceRanges: [{ maxTurnover: 2000000, price: 5000, priceFormatted: '£5,000' }, { maxTurnover: 5000000, price: 7000, priceFormatted: '£7,000' }, { maxTurnover: null, price: 10000, priceFormatted: '£10,000' }], priceFromFormatted: 'from £5,000', period: 'monthly', periodLabel: '/month', showInPopup: true, popupCtaLabel: 'Talk to us' }], defaultTierIndex: 0, isActive: true },
  benchmarking: { code: 'benchmarking', name: 'Industry Benchmarking', displayName: 'Industry Benchmarking (Full Package)', category: 'foundation', outcome: "You'll Know Where You Stand", description: 'See exactly how your business compares to others in your industry.', keywords: ['benchmark', 'valuation', 'hidden value', 'baseline', 'industry'], tiers: [{ name: 'Tier 1', tagline: 'Industry comparison and baseline', pricingModel: 'fixed', price: 2000, priceFormatted: '£2,000', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/benchmarking-tier1.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Tier 2', tagline: 'Deep-dive with action plan', pricingModel: 'fixed', price: 4500, priceFormatted: '£4,500', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/benchmarking-tier2.pdf', showInPopup: true, popupCtaLabel: 'View Example' }], defaultTierIndex: 0, isActive: true },
  systems_audit: { code: 'systems_audit', name: 'Systems & Process Audit', displayName: 'Systems & Process Audit', category: 'foundation', outcome: "You'll See Where The Time Goes", description: 'Map every system, process, and workaround in your business.', keywords: ['systems', 'process', 'efficiency', 'automation', 'audit'], tiers: [{ name: 'Tier 1', tagline: 'Systems map and priority list', pricingModel: 'fixed', price: 2000, priceFormatted: '£2,000', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/systems-audit-tier1.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Tier 2', tagline: 'Full audit with implementation roadmap', pricingModel: 'fixed', price: 4500, priceFormatted: '£4,500', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/systems-audit-tier2.pdf', showInPopup: true, popupCtaLabel: 'View Example' }], defaultTierIndex: 0, isActive: true },
  goal_alignment: { code: 'goal_alignment', name: 'Goal Alignment Programme', displayName: 'Goal Alignment Programme', category: 'growth', outcome: "You'll Have Someone In Your Corner", description: 'Quarterly accountability and strategic support.', keywords: ['goal alignment', 'accountability', 'co-pilot', 'support', '365', 'alignment'], tiers: [{ name: 'Lite', tagline: 'Survey + plan + one review', pricingModel: 'fixed', price: 1500, priceFormatted: '£1,500', period: 'annual', periodLabel: '/year', examplePdfUrl: '/storage/service-examples/goal-alignment-lite.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Growth', tagline: 'Quarterly reviews for 12 months', pricingModel: 'fixed', price: 4500, priceFormatted: '£4,500', period: 'annual', periodLabel: '/year', examplePdfUrl: '/storage/service-examples/goal-alignment-growth.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Partner', tagline: 'Strategy day + BSG integration', pricingModel: 'fixed', price: 9000, priceFormatted: '£9,000', period: 'annual', periodLabel: '/year', showInPopup: true, popupCtaLabel: 'Talk to us' }], defaultTierIndex: 1, isActive: true },
  business_advisory: { code: 'business_advisory', name: 'Business Advisory & Exit Planning', displayName: 'Business Advisory & Exit Planning', category: 'strategic', outcome: "You'll Know What It's Worth", description: 'Protect and maximise the value you have built.', keywords: ['exit', 'sale', 'succession', 'planning', 'advisory'], tiers: [{ name: 'Tier 1', tagline: 'Valuation and readiness assessment', pricingModel: 'fixed', price: 2000, priceFormatted: '£2,000', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/business-advisory-tier1.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Tier 2', tagline: 'Full exit strategy and preparation', pricingModel: 'fixed', price: 4000, priceFormatted: '£4,000', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/business-advisory-tier2.pdf', showInPopup: true, popupCtaLabel: 'View Example' }], defaultTierIndex: 0, isActive: false },
  automation: { code: 'automation', name: 'Automation Services', displayName: 'Automation Services', category: 'operational', outcome: "The Manual Work Disappears", description: 'Eliminate manual work and unlock your team\'s potential.', keywords: ['automation', 'automate', 'manual', 'integrate', 'workflow'], tiers: [{ name: 'Project', tagline: 'Scoped automation implementation', pricingModel: 'fixed', price: 5000, priceFormatted: '£5,000', period: 'one-off', periodLabel: '', examplePdfUrl: '/storage/service-examples/automation-project.pdf', showInPopup: true, popupCtaLabel: 'View Example' }, { name: 'Retainer', tagline: 'Ongoing automation support', pricingModel: 'fixed', price: 1500, priceFormatted: '£1,500', period: 'monthly', periodLabel: '/month', examplePdfUrl: '/storage/service-examples/automation-retainer.pdf', showInPopup: true, popupCtaLabel: 'View Example' }], defaultTierIndex: 0, isActive: false },
  fractional_cfo: { code: 'fractional_cfo', name: 'Fractional CFO', displayName: 'Fractional CFO Services', category: 'strategic', outcome: "You'll Have Strategic Financial Leadership", description: 'Part-time strategic finance leadership.', keywords: ['cfo', 'finance director', 'strategic finance', 'fractional cfo'], tiers: [{ name: '2 days/month', tagline: 'Strategic finance leadership', pricingModel: 'fixed', price: 4000, priceFormatted: '£4,000', period: 'monthly', periodLabel: '/month', showInPopup: true, popupCtaLabel: 'Talk to us' }], defaultTierIndex: 0, isActive: false },
  fractional_coo: { code: 'fractional_coo', name: 'Fractional COO', displayName: 'Fractional COO Services', category: 'strategic', outcome: "Someone Else Carries The Load", description: 'Operational leadership to build systems that run without you.', keywords: ['coo', 'operations', 'fractional coo'], tiers: [{ name: '2 days/month', tagline: 'Operational leadership', pricingModel: 'fixed', price: 3750, priceFormatted: '£3,750', period: 'monthly', periodLabel: '/month', showInPopup: true, popupCtaLabel: 'Talk to us' }], defaultTierIndex: 0, isActive: false },
  combined_advisory: { code: 'combined_advisory', name: 'Combined CFO/COO Advisory', displayName: 'Combined CFO/COO Advisory', category: 'strategic', outcome: "Complete Business Transformation", description: 'Executive partnership covering both financial and operational strategy.', keywords: ['combined', 'cfo coo', 'executive partnership'], tiers: [{ name: 'Standard', tagline: 'Full executive partnership', pricingModel: 'fixed', price: 6000, priceFormatted: '£6,000', period: 'monthly', periodLabel: '/month', showInPopup: true, popupCtaLabel: 'Talk to us' }], defaultTierIndex: 0, isActive: false },
  // Investment vehicle services (Session 11)
  iht_planning: { code: 'iht_planning', name: 'IHT Planning Workshop', displayName: 'IHT Planning Workshop', category: 'strategic', outcome: "You'll Know What's At Risk", description: 'Map your inheritance tax exposure and create an action plan', keywords: ['iht', 'inheritance', 'estate', 'wealth transfer', 'trust', 'gifting'], tiers: [{ name: 'Workshop', tagline: 'IHT exposure and action plan', pricingModel: 'fixed', price: 2500, priceFormatted: '£2,500', period: 'one-off', periodLabel: '', showInPopup: true, popupCtaLabel: 'Learn more' }], defaultTierIndex: 0, isActive: true },
  property_health_check: { code: 'property_health_check', name: 'Property Portfolio Health Check', displayName: 'Property Portfolio Health Check', category: 'strategic', outcome: "You'll See Which Properties Earn Their Keep", description: 'Property-by-property performance analysis and rationalisation strategy', keywords: ['property', 'portfolio', 'yield', 'rationalisation'], tiers: [{ name: 'Health Check', tagline: 'Yield and rationalisation', pricingModel: 'fixed', price: 3500, priceFormatted: '£3,500', period: 'one-off', periodLabel: '', showInPopup: true, popupCtaLabel: 'Learn more' }], defaultTierIndex: 0, isActive: true },
  wealth_transfer_strategy: { code: 'wealth_transfer_strategy', name: 'Family Wealth Transfer Strategy', displayName: 'Family Wealth Transfer Strategy', category: 'strategic', outcome: "Your Family Is Protected", description: 'Comprehensive succession planning for investment portfolios', keywords: ['wealth transfer', 'succession', 'family', 'legacy'], tiers: [{ name: 'Strategy', tagline: 'Succession and family governance', pricingModel: 'fixed', price: 5500, priceFormatted: '£5,500', period: 'one-off', periodLabel: '', showInPopup: true, popupCtaLabel: 'Learn more' }], defaultTierIndex: 0, isActive: true },
  property_management_sourcing: { code: 'property_management_sourcing', name: 'Property Management Sourcing', displayName: 'Property Management Sourcing', category: 'operational', outcome: "You'll Have a Reliable Property Manager", description: 'Find and vet a reliable property management partner', keywords: ['property manager', 'delegate', 'sourcing'], tiers: [{ name: 'Sourcing', tagline: 'Find and vet property manager', pricingModel: 'fixed', price: 1500, priceFormatted: '£1,500', period: 'one-off', periodLabel: '', showInPopup: true, popupCtaLabel: 'Learn more' }], defaultTierIndex: 0, isActive: true },
};
function getPriceForTurnover(tier: ServiceTier, turnover: number): { price: number; priceFormatted: string } {
  if (tier.pricingModel === 'fixed') return { price: tier.price!, priceFormatted: tier.priceFormatted! };
  if (!tier.priceRanges?.length) return { price: 0, priceFormatted: 'TBD' };
  for (const band of tier.priceRanges) { if (band.maxTurnover === null || turnover <= band.maxTurnover) return { price: band.price, priceFormatted: band.priceFormatted }; }
  const last = tier.priceRanges[tier.priceRanges.length - 1]; return { price: last.price, priceFormatted: last.priceFormatted };
}
function getDefaultTier(code: string): ServiceTier | null { const def = SERVICE_REGISTRY[code]; if (!def) return null; return def.tiers[def.defaultTierIndex] || def.tiers[0] || null; }
function getTierByName(code: string, tierName: string): ServiceTier | null { const def = SERVICE_REGISTRY[code]; if (!def) return null; return def.tiers.find(t => t.name.toLowerCase() === tierName.toLowerCase()) || null; }
function getEnabledByString(code: string, options?: { tierName?: string; turnover?: number; deferred?: boolean }): string {
  const def = SERVICE_REGISTRY[code]; if (!def) return code;
  const tier = options?.tierName ? getTierByName(code, options.tierName) : getDefaultTier(code); if (!tier) return def.displayName;
  const { priceFormatted } = options?.turnover ? getPriceForTurnover(tier, options.turnover) : tier.pricingModel === 'fixed' ? { priceFormatted: tier.priceFormatted! } : { priceFormatted: tier.priceFromFormatted || 'TBD' };
  const tierLabel = def.tiers.length > 1 ? ` (${tier.name})` : ''; const priceLabel = `${priceFormatted}${tier.periodLabel}`; const deferredSuffix = options?.deferred ? ' — when ready' : '';
  return `${def.displayName}${tierLabel} (${priceLabel}${deferredSuffix})`;
}
function getOutcome(code: string): string { return SERVICE_REGISTRY[code]?.outcome || 'Business Transformation'; }
function detectServiceCode(text: string): string | null {
  if (!text) return null; const lower = text.toLowerCase();
  if (lower.includes('business intelligence') || lower.includes('management account')) return 'business_intelligence';
  if (lower.includes('benchmark')) return 'benchmarking'; if (lower.includes('system') && (lower.includes('audit') || lower.includes('process'))) return 'systems_audit';
  if (lower.includes('goal') || lower.includes('alignment') || lower.includes('365')) return 'goal_alignment';
  if (lower.includes('combined') && (lower.includes('cfo') || lower.includes('coo'))) return 'combined_advisory';
  if (lower.includes('fractional cfo') || (lower.includes('cfo') && !lower.includes('coo'))) return 'fractional_cfo';
  if (lower.includes('fractional coo') || (lower.includes('coo') && !lower.includes('cfo'))) return 'fractional_coo';
  if (lower.includes('automation') || lower.includes('automate')) return 'automation'; if (lower.includes('exit') || lower.includes('advisory')) return 'business_advisory';
  return null;
}
function getLegacyServiceDetail(code: string, turnover?: number): { name: string; price: string; priceType: string; outcome: string } | null {
  const def = SERVICE_REGISTRY[code]; if (!def) return null; const tier = getDefaultTier(code); if (!tier) return null;
  const { priceFormatted } = turnover ? getPriceForTurnover(tier, turnover) : tier.pricingModel === 'fixed' ? { priceFormatted: tier.priceFormatted! } : { priceFormatted: tier.priceFromFormatted || 'TBD' };
  return { name: def.displayName, price: priceFormatted, priceType: tier.period === 'one-off' ? 'one-time' : tier.period, outcome: def.outcome };
}
const LEGACY_CODE_MAP: Record<string, string> = { '365_method': 'goal_alignment', 'management_accounts': 'business_intelligence' };
function resolveServiceCode(code: string): string { return LEGACY_CODE_MAP[code] || code; }

// Use Opus for premium narrative quality
const PASS2_MODEL = 'anthropic/claude-opus-4.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// 7-DIMENSION ANALYSIS TYPES (from Pass 1)
// ============================================================================

interface ComprehensiveAnalysis {
  dataQuality: 'comprehensive' | 'partial' | 'limited';
  availableMetrics: string[];
  missingMetrics: string[];
  valuation: any;
  trajectory: any;
  payroll: any;
  productivity: any;
  workingCapital: any;
  exitReadiness: any;
  costOfInaction: any;
  hiddenAssets: any;
  grossMargin: any;
  achievements: any;
  yearOnYearComparisons?: {
    turnover?: { current?: number; prior?: number; change?: number };
    operatingProfit?: { current?: number; prior?: number; change?: number };
    netProfit?: { current?: number; prior?: number; change?: number };
  };
  clientRevenueConcentration?: Record<string, any>;
}

interface DestinationClarityAnalysis {
  score: number;
  reasoning: string;
  factors: string[];
}

// ============================================================================
// CLIENT TYPE DEFINITIONS (from Pass 1)
// ============================================================================

type ClientBusinessType = 
  | 'trading_product'        
  | 'trading_agency'         
  | 'professional_practice'  
  | 'investment_vehicle'     
  | 'funded_startup'         
  | 'lifestyle_business';

interface FrameworkOverrides {
  useEarningsValuation: boolean;
  useAssetValuation: boolean;
  benchmarkAgainst: string | null;
  exitReadinessRelevant: boolean;
  payrollBenchmarkRelevant: boolean;
  appropriateServices: string[];
  inappropriateServices: string[];
  reportFraming: 'transformation' | 'wealth_protection' | 'foundations' | 'optimisation';
  maxRecommendedInvestment: number | null;
}

interface AssetValuation {
  hasData: boolean;
  netAssets: number | null;
  investmentProperty: number | null;
  freeholdProperty: number | null;
  totalAssetValue: number | null;
  narrative: string;
}

// ============================================================================
// REPORT FRAMING INSTRUCTIONS
// ============================================================================

function getReportFramingInstructions(
  reportFraming: 'transformation' | 'wealth_protection' | 'foundations' | 'optimisation',
  clientType: ClientBusinessType
): string {
  const framingMap: Record<string, string> = {
    'transformation': `
============================================================================
📈 REPORT FRAMING: TRANSFORMATION
============================================================================
This is a trading business focused on growth and exit readiness.

NARRATIVE STRUCTURE:
"Here's where you are → here's where you want to be → here's how we get there."

APPROPRIATE LANGUAGE:
✅ "transformation journey"
✅ "unlocking potential"
✅ "scaling"
✅ "building value"
✅ "exit readiness"
✅ "cost of inaction"
✅ "leaving money on the table"
✅ Growth-focused language

TONE:
- Forward-looking and ambitious
- Focus on potential and opportunity
- Emphasize the gap between current state and desired state
- Frame services as enablers of transformation
`,

    'wealth_protection': `
============================================================================
🛡️ REPORT FRAMING: WEALTH PROTECTION
============================================================================
This client has built significant wealth (investment vehicle, property portfolio).
They're not looking to transform - they're looking to protect and transfer.

NARRATIVE STRUCTURE:
"You've built significant wealth → here are the risks to it → here's how to protect and transfer it."

APPROPRIATE LANGUAGE:
✅ "protecting"
✅ "transferring"
✅ "structuring"
✅ "planning ahead"
✅ "wealth preservation"
✅ "succession planning"
✅ "IHT planning"
✅ "asset protection"

FORBIDDEN LANGUAGE:
⛔ DO NOT use "transformation journey"
⛔ DO NOT use "unlocking potential"
⛔ DO NOT use "scaling"
⛔ DO NOT use "cost of inaction" (they're not inaction - they're protecting)
⛔ DO NOT use "leaving money on the table"
⛔ DO NOT use growth-focused language

TONE:
- Respectful of what they've built
- Focus on preservation and transfer
- Emphasize risks (IHT, succession, structure)
- Frame services as protection mechanisms
- Acknowledge they KNOW their value (don't say "you don't know what you're worth")
`,

    'foundations': `
============================================================================
🏗️ REPORT FRAMING: FOUNDATIONS
============================================================================
This is a funded startup building something ambitious. They need infrastructure, not transformation.

NARRATIVE STRUCTURE:
"You're building something ambitious → here's what you need in place → here's how we help you build it right."

APPROPRIATE LANGUAGE:
✅ "building right from the start"
✅ "getting the foundations in place"
✅ "investor-ready"
✅ "runway management"
✅ "board reporting"
✅ "financial foundations"
✅ "operational infrastructure"
✅ "building the infrastructure that makes growth possible"

FORBIDDEN LANGUAGE:
⛔ DO NOT use "you're leaving money on the table"
⛔ DO NOT use "cost of inaction"
⛔ DO NOT use "transformation journey" (too heavy for this stage)
⛔ DO NOT use exit-focused language (5-10 year horizon)
⛔ DO NOT push heavy transformation services

TONE:
- Supportive of their ambition
- Focus on building correctly from the start
- Emphasize investor-readiness and runway
- Frame services as foundational infrastructure
- Respect their 5+ year horizon
`,

    'optimisation': `
============================================================================
⚙️ REPORT FRAMING: OPTIMISATION
============================================================================
This is a lifestyle business or professional practice. They've got a good thing - make it better.

NARRATIVE STRUCTURE:
"You've got a good thing → here's where it could be better → here are targeted improvements."

APPROPRIATE LANGUAGE:
✅ "making what works, work better"
✅ "targeted improvements"
✅ "efficiency gains"
✅ "optimising"
✅ "refining"
✅ "fine-tuning"
✅ "work-life balance"
✅ "sustainable operations"

FORBIDDEN LANGUAGE:
⛔ DO NOT push growth
⛔ DO NOT use "scaling"
⛔ DO NOT use "transformation journey"
⛔ DO NOT use "unlocking potential"
⛔ DO NOT use exit-focused language (unless they explicitly mentioned it)
⛔ DO NOT disrespect their choices to prioritize lifestyle

TONE:
- Respectful of their choices
- Focus on efficiency, not growth
- Emphasize work-life balance
- Frame services as targeted improvements
- Acknowledge what's already working
- Don't push transformation if they're content
`
  };
  
  return framingMap[reportFraming] || framingMap['transformation'];
}

// ============================================================================
// CLIENT TYPE PROMPT GUIDANCE
// ============================================================================

function getClientTypePromptGuidance(
  clientType: ClientBusinessType,
  frameworkOverrides: FrameworkOverrides | null,
  assetValuation: AssetValuation | null
): string {
  
  const guidanceMap: Record<ClientBusinessType, string> = {
    'investment_vehicle': `
============================================================================
⚠️ CRITICAL: THIS IS A PROPERTY INVESTMENT BUSINESS
============================================================================

This client owns investment properties, NOT a trading business. EVERYTHING changes:

**VALUATION:**
- ⛔ DO NOT use earnings multiples
- ⛔ DO NOT say "you don't know what you're worth" - they have £${assetValuation?.netAssets ? (assetValuation.netAssets/1000000).toFixed(1) : '?'}M in net assets
- ✅ Use asset-based valuation: Net assets ARE the value
- ✅ Investment property value: £${assetValuation?.investmentProperty || assetValuation?.freeholdProperty ? ((assetValuation.investmentProperty || assetValuation.freeholdProperty || 0)/1000000).toFixed(1) : '?'}M

**SERVICES:**
- ⛔ DO NOT recommend industry benchmarking (benchmark against what?)
- ⛔ DO NOT recommend exit readiness scoring (irrelevant)
- ⛔ DO NOT recommend systems audit (minimal operations)
- ⛔ DO NOT recommend 365 Method (not a trading business)
- ✅ Focus on: IHT planning, wealth transfer, succession, property management

**FRAMING:**
- ⛔ DO NOT frame as "transformation journey"
- ✅ Frame as "wealth protection" and "succession planning"
- Use language like "protecting what you've built" not "building what you want"

**GAPS TO IDENTIFY:**
- IHT exposure (40% on assets above £325k threshold)
- Succession planning (who manages when they step back?)
- Property management delegation
- Will/trust structuring

**IHT:**
- ⛔ DO NOT calculate IHT yourself — use the pre-calculated range from Pass 1
- ⛔ DO NOT say "£X at 40%" without mentioning nil rate band
- ✅ Present the range and caveat: "depending on nil rate band availability and personal circumstances"
- ✅ Flag that Business Property Relief does NOT apply to property investment companies

**EMPLOYEE COUNT:**
- If prebuilt phrase says "2 people (including director)" — DO NOT say "one-man band"
- ✅ Say "the strategic burden sits with you" or "operational decisions all run through you"
- ✅ You can acknowledge delegation frustration without claiming they're completely alone

**GROSS MARGIN:**
- If grossMarginIsStructural is true — DO NOT say "excellent gross margin" or praise 100% GM
- ✅ Say "100% gross margin is structural — no cost of sales. The meaningful measure is operating margin of X%"
- ✅ Lead with operating margin as the profitability metric

**DEFERRED TAX:**
- If deferredTaxImpact is provided, use it when discussing profitability
- ✅ Acknowledge that the statutory accounts show a loss, but explain the underlying performance is strong
`,

    'funded_startup': `
============================================================================
⚠️ CRITICAL: THIS IS A FUNDED STARTUP (PRE/EARLY REVENUE)
============================================================================

This client has raised funding but hasn't hit scale yet. Standard frameworks don't apply:

**VALUATION:**
- ⛔ DO NOT use earnings multiples (no meaningful earnings)
- ⛔ DO NOT use asset-based valuation (value is in equity/IP)
- ✅ Their valuation is their last funding round
- ✅ Focus on runway, not value

**SERVICES:**
- ⛔ DO NOT recommend benchmarking (benchmark against what revenue?)
- ⛔ DO NOT recommend 365 Method (transformation too heavy for this stage)
- ⛔ DO NOT recommend exit planning (5-10 year horizon)
- ⛔ DO NOT recommend Fractional CFO/COO (too expensive for stage)
- ✅ Focus on: runway management, board reporting, financial foundations

**INVESTMENT CAP:**
- Maximum recommended: £${frameworkOverrides?.maxRecommendedInvestment || 15000}
- ⛔ DO NOT recommend services totalling more than this
- Start with Phase 1 foundations only

**FRAMING:**
- ⛔ DO NOT frame as "transformation" 
- ✅ Frame as "building foundations"
- ✅ Use language like "the infrastructure that makes growth possible"

**GAPS TO IDENTIFY:**
- Runway visibility (how many months?)
- Board reporting structure
- Financial literacy for founders
- Post-launch operational readiness
`,

    'trading_agency': `
============================================================================
⚠️ CRITICAL: THIS IS AN AGENCY/CREATIVE BUSINESS
============================================================================

This client runs a project-based business with contractors. Standard payroll benchmarks don't apply:

**PAYROLL:**
- ⛔ DO NOT use standard payroll benchmarks (28-30%)
- ⛔ Contractors are NOT inefficiency - they're the business model
- ✅ Analyse contractor vs permanent ratio instead
- ✅ Focus on utilisation and rate cards, not headcount

**SERVICES:**
- ⛔ DO NOT recommend generic benchmarking (agency metrics are different)
- ✅ Management accounts (critical for project profitability)
- ✅ Cash flow management (lumpy revenue from projects)

**CASH FLOW:**
- If they mentioned cash anxiety, this is PRIORITY ONE
- Start with smaller engagement to build trust
- Maximum initial recommendation: £${frameworkOverrides?.maxRecommendedInvestment || 5000}

**URGENCY:**
- If they have urgent decisions (e.g., senior hire), address IMMEDIATELY
- Don't push to "Month 3-12" timeline if decision needed THIS WEEK

**GAPS TO IDENTIFY:**
- Contractor vs permanent cost structure
- Project profitability by client
- Cash flow timing (project billing vs costs)
- Utilisation rates

**CRITICAL CONTEXT - CLIENT REVENUE CONCENTRATION:**
If the client's financial data includes client_revenue_concentration data showing a major client with documented growth potential, this MUST feature prominently in the report:
- In the Gap Analysis: as a strategic opportunity (not just a risk)
- In the Journey: as the key growth lever
- In the closing narrative: as the reason for optimism

For example, if Boston Scientific (or any major client) represents 50%+ of revenue with documented potential to expand 10x across multiple departments, this is potentially a £1-2M relationship. The report should frame the growth story around executing on this opportunity — not just generic "build a new business function" advice.

However, also flag the concentration risk: 50%+ of revenue from one client is a vulnerability. The report should acknowledge both sides — the massive opportunity AND the need to diversify.
`,

    'trading_product': `
Standard trading business - all frameworks apply normally.
`,

    'professional_practice': `
Professional services practice - most frameworks apply.
Focus on partner compensation, goodwill valuation, succession.
`,

    'lifestyle_business': `
Lifestyle business - owner optimises for life, not growth.
⛔ DO NOT push transformation if they're content
✅ Focus on efficiency gains, not growth
✅ Respect their work-life balance choices
`
  };
  
  return guidanceMap[clientType] || guidanceMap['trading_product'];
}

// ============================================================================
// SERVICE APPROPRIATENESS VALIDATION
// ============================================================================

function validateServiceRecommendations(
  recommendations: any[],
  frameworkOverrides: FrameworkOverrides | null
): { valid: any[]; removed: any[]; warnings: string[] } {
  if (!frameworkOverrides) return { valid: recommendations, removed: [], warnings: [] };
  
  const inappropriate = frameworkOverrides.inappropriateServices || [];
  const maxInvestment = frameworkOverrides.maxRecommendedInvestment;
  
  const valid: any[] = [];
  const removed: any[] = [];
  const warnings: string[] = [];
  
  let totalInvestment = 0;
  
  for (const rec of recommendations) {
    const serviceCode = rec.code || rec.service_code || rec.serviceCode;
    
    if (inappropriate.includes(serviceCode)) {
      removed.push(rec);
      warnings.push(`Removed ${serviceCode}: inappropriate for client type`);
      continue;
    }
    
    const investment = rec.investment || rec.price || 0;
    if (maxInvestment && (totalInvestment + investment) > maxInvestment) {
      removed.push(rec);
      warnings.push(`Removed ${serviceCode}: exceeds investment cap of £${maxInvestment}`);
      continue;
    }
    
    totalInvestment += investment;
    valid.push(rec);
  }
  
  return { valid, removed, warnings };
}

// ============================================================================
// BUILD MANDATORY DIMENSIONS PROMPT (Injects Pass 1 analysis into LLM prompt)
// ============================================================================

function buildMandatoryDimensionsPrompt(
  analysis: ComprehensiveAnalysis | null,
  clarity: DestinationClarityAnalysis | null
): string {
  if (!analysis) return '\n[No comprehensive analysis available from Pass 1]\n';
  
  let prompt = `
============================================================================
⛔ MANDATORY FINANCIAL ANALYSIS - USE THESE EXACT FIGURES
============================================================================

DATA QUALITY: ${analysis.dataQuality.toUpperCase()}
AVAILABLE METRICS: ${analysis.availableMetrics.join(', ')}

`;

  // DESTINATION CLARITY
  if (clarity) {
    prompt += `
## DESTINATION CLARITY (PRE-CALCULATED - USE THIS SCORE)
Score: ${clarity.score}/10
Reasoning: ${clarity.reasoning}
⛔ USE THIS SCORE: ${clarity.score}/10. Your narrative MUST match this score level.
${clarity.score >= 7 ? 'HIGH (7+): Use "crystal clear", "you know exactly"' : 
  clarity.score >= 4 ? 'MODERATE (4-6): Use "direction is there", "emerging"' : 
  'LOW (1-3): Use "destination unclear", "needs sharpening"'}

---
`;
  }

  // VALUATION
  if (analysis.valuation?.hasData) {
    const v = analysis.valuation;
    prompt += `
## VALUATION (MANDATORY GAP)
Operating Profit: £${v.operatingProfit ? (v.operatingProfit/1000).toFixed(0) : 'N/A'}k
Multiple: ${v.adjustedMultipleLow.toFixed(1)}-${v.adjustedMultipleHigh.toFixed(1)}x
Range: £${v.conservativeValue ? (v.conservativeValue/1000000).toFixed(1) : '?'}M-£${v.optimisticValue ? (v.optimisticValue/1000000).toFixed(1) : '?'}M

⛔ YOU MUST STATE: "Indicative valuation: £${v.conservativeValue ? (v.conservativeValue/1000000).toFixed(1) : '?'}M-£${v.optimisticValue ? (v.optimisticValue/1000000).toFixed(1) : '?'}M"
${v.hiddenAssets?.length > 0 ? `Hidden Assets: ${v.hiddenAssets.map((a: any) => `${a.description}: £${a.value ? (a.value/1000).toFixed(0) : '?'}k`).join(', ')}` : ''}

---
`;
  }

  // TRAJECTORY
  if (analysis.trajectory?.hasData && analysis.trajectory.trend === 'declining') {
    const t = analysis.trajectory;
    prompt += `
## TRAJECTORY (MANDATORY GAP - DECLINING)
Change: ${t.percentageChange?.toFixed(1)}% (£${t.absoluteChange ? Math.abs(t.absoluteChange/1000).toFixed(0) : '?'}k)

⛔ YOU MUST STATE: "Revenue down ${Math.abs(t.percentageChange || 0).toFixed(1)}% year-on-year (£${Math.abs(t.absoluteChange || 0)/1000}k)"

---
`;
  }

  // PAYROLL
  if (analysis.payroll?.annualExcess && analysis.payroll.annualExcess > 0) {
    const p = analysis.payroll;
    prompt += `
## PAYROLL (MANDATORY GAP)
Staff Costs: £${(p.staffCosts/1000).toFixed(0)}k (${p.staffCostsPct.toFixed(1)}%)
Benchmark: ${p.benchmark.good}-${p.benchmark.concern}%
Excess: £${(p.annualExcess/1000).toFixed(0)}k/year

⛔ YOU MUST STATE: "£${(p.annualExcess/1000).toFixed(0)}k/year excess" (EXACT figure)

---
`;
  }

  // PRODUCTIVITY
  if (analysis.productivity?.excessHeadcount && analysis.productivity.excessHeadcount > 0) {
    const pr = analysis.productivity;
    prompt += `
## PRODUCTIVITY (REQUIRED GAP)
Revenue/Head: £${pr.revenuePerHead ? (pr.revenuePerHead/1000).toFixed(0) : '?'}k vs £${(pr.benchmarkLow/1000).toFixed(0)}k benchmark
Excess: ${pr.excessHeadcount} employees

⛔ YOU SHOULD MENTION: This independently supports the payroll argument.

---
`;
  }

  // EXIT READINESS
  if (analysis.exitReadiness) {
    const e = analysis.exitReadiness;
    const pct = Math.round(e.score / e.maxScore * 100);
    prompt += `
## EXIT READINESS (MANDATORY)
Score: ${e.score}/${e.maxScore} (${pct}%)
Strengths: ${e.strengths?.join(', ') || 'None'}
Blockers: ${e.blockers?.join(', ') || 'None'}

⛔ YOU MUST INCLUDE: "Exit readiness: ${pct}%"

---
`;
  }

  // COST OF INACTION
  if (analysis.costOfInaction?.totalOverHorizon && analysis.costOfInaction.totalOverHorizon > 0) {
    const c = analysis.costOfInaction;
    prompt += `
## COST OF INACTION
Total over ${c.timeHorizon} years: £${(c.totalOverHorizon/1000).toFixed(0)}k+
${c.components?.map((comp: any) => `- ${comp.category}: £${((comp.costOverHorizon || 0)/1000).toFixed(0)}k`).join('\n') || ''}

⛔ USE THIS when comparing investment to inaction.

---
`;
  }

  // GAP DIVERSITY RULES
  prompt += `
============================================================================
⛔ GAP DIVERSITY RULES - CRITICAL
============================================================================

You MUST create gaps from at least 4 DIFFERENT categories:
1. VALUATION - "No baseline valuation"
2. TRAJECTORY - "Revenue declining"
3. PAYROLL - "Staff costs above benchmark"
4. PEOPLE - "Avoided conversation"
5. STRATEGIC - "No exit roadmap"
6. PRODUCTIVITY - "Revenue per head below benchmark"

⛔ DO NOT create multiple gaps that are the same issue rephrased:

BAD (all same issue):
- "Payroll too high"
- "Avoided redundancy conversation"
- "Need to restructure team"

GOOD (diverse):
- "No valuation baseline" (VALUATION)
- "Payroll X% above benchmark" (PAYROLL)
- "Revenue declining X%" (TRAJECTORY)
- "Avoided redundancy conversation" (PEOPLE)
- "Exit plan in your head" (STRATEGIC)

============================================================================
`;

  return prompt;
}

// ============================================================================
// DATA COMPLETENESS CHECKER
// ============================================================================

interface DataCompleteness {
  score: number;            // 0-100
  status: 'complete' | 'partial' | 'insufficient';
  missingCritical: string[];
  missingImportant: string[];
  missingNiceToHave: string[];
  canGenerateClientReport: boolean;
  adminActionRequired: string[];
}

function assessDataCompleteness(emotionalAnchors: Record<string, string>): DataCompleteness {
  const critical = [
    { key: 'tuesdayTest', label: 'Tuesday Vision (5-year picture)' },
    { key: 'coreFrustration', label: 'Core Frustration' },
  ];
  
  const important = [
    { key: 'emergencyLog', label: 'Emergency Log (recent disruptions)' },
    { key: 'relationshipMirror', label: 'Business Relationship Metaphor' },
    { key: 'sacrificeList', label: 'Sacrifice List (what they\'ve given up)' },
    { key: 'suspectedTruth', label: 'Suspected Truth (financial gut feeling)' },
  ];
  
  const niceToHave = [
    { key: 'magicFix', label: 'Magic Fix (first change)' },
    { key: 'hardTruth', label: 'Hard Truth (avoided conversation)' },
    { key: 'operationalFrustration', label: 'Operational Frustration' },
    { key: 'finalInsight', label: 'Final Insight' },
    { key: 'hiddenFromTeam', label: 'Hidden From Team' },
    { key: 'avoidedConversation', label: 'Avoided Conversation' },
    { key: 'unlimitedChange', label: 'If Unlimited Funds' },
  ];
  
  const isProvided = (val: string | undefined) => 
    val && val.trim() !== '' && val.toLowerCase() !== 'not provided' && val.length > 10;
  
  const missingCritical = critical.filter(f => !isProvided(emotionalAnchors[f.key])).map(f => f.label);
  const missingImportant = important.filter(f => !isProvided(emotionalAnchors[f.key])).map(f => f.label);
  const missingNiceToHave = niceToHave.filter(f => !isProvided(emotionalAnchors[f.key])).map(f => f.label);
  
  const criticalScore = ((critical.length - missingCritical.length) / critical.length) * 50;
  const importantScore = ((important.length - missingImportant.length) / important.length) * 30;
  const niceScore = ((niceToHave.length - missingNiceToHave.length) / niceToHave.length) * 20;
  
  const score = Math.round(criticalScore + importantScore + niceScore);
  
  let status: 'complete' | 'partial' | 'insufficient' = 'complete';
  if (missingCritical.length > 0) status = 'insufficient';
  else if (missingImportant.length > 2) status = 'partial';
  else if (score < 70) status = 'partial';
  
  const adminActionRequired: string[] = [];
  if (missingCritical.length > 0) {
    adminActionRequired.push(`Schedule discovery call to gather: ${missingCritical.join(', ')}`);
  }
  if (missingImportant.length > 2) {
    adminActionRequired.push(`Follow up to understand: ${missingImportant.join(', ')}`);
  }
  
  return {
    score,
    status,
    missingCritical,
    missingImportant,
    missingNiceToHave,
    canGenerateClientReport: missingCritical.length === 0 && score >= 50,
    adminActionRequired
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();

    if (!engagementId) {
      return new Response(
        JSON.stringify({ error: 'engagementId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // GUARD: Refuse to generate if Pass 1 hasn't run (Phase 2 / 2. Score)
    // ========================================================================
    const { data: existingReport, error: reportGuardError } = await supabase
      .from('discovery_reports')
      .select('id, comprehensive_analysis, pass1_completed_at')
      .eq('engagement_id', engagementId)
      .maybeSingle();

    if (reportGuardError) {
      console.error('[Pass2] Guard: failed to load report:', reportGuardError.message);
      throw new Error('Could not verify Pass 1 status');
    }
    if (!existingReport?.comprehensive_analysis && !existingReport?.pass1_completed_at) {
      console.warn('[Pass2] Guard: Pass 1 not complete for engagement:', engagementId);
      return new Response(
        JSON.stringify({ error: 'Pass 1 has not completed. Run Phase 2 (Score) first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================================================
    // ========================================================================
    // NON-NEGOTIABLE CONSTANTS - SYSTEM DEFINES, LLM CANNOT OVERRIDE
    // ========================================================================
    
    const NON_NEGOTIABLES = {
      // Gap score calibration rules
      gapScoreRules: {
        businessRunsWithoutFounder: 6,  // At least 6 if business runs independently
        excellentMargins: 6,            // At least 6 if margins are excellent
        bothAbove: 7,                   // At least 7 if both conditions met
        marketLeader: 7,                // At least 7 if market leader
        maxScore: 9                     // Never give 10 (always room to improve)
      },
      
      // Emotional anchors - MUST use if detected
      requiredAnchors: {
        neverHadBreak: "you've never actually taken a proper break - not once",
        healthSuffered: "Your health has already suffered once from this",
        followsOnHoliday: "staff issues keep finding you, even on holiday"
      }
    };

    // ========================================================================
    // CLEAN JOURNEY PHASES — hardcoded enabled-by strings
    // The LLM cannot be trusted to format these consistently.
    // We detect the service by keyword and overwrite the ENTIRE string.
    // Then we strip any remaining stutter patterns as a safety net.
    // ========================================================================

    // Canonical enabled-by strings — the ONLY acceptable output
    const CANONICAL_ENABLED_BY: Record<string, { phase1: string; deferred: string }> = {
      'benchmarking':        { phase1: 'Industry Benchmarking (Full Package) (£2,000 - £4,500)',              deferred: 'Industry Benchmarking (Full Package) (£2,000 - £4,500 — when ready)' },
      'systems_audit':       { phase1: 'Systems & Process Audit (£2,000 - £4,500)',                           deferred: 'Systems & Process Audit (£2,000 - £4,500 — when ready)' },
      'goal_alignment':      { phase1: 'Goal Alignment Programme (£1,500 - £9,000/year)',                        deferred: 'Goal Alignment Programme (£1,500 - £9,000/year — when ready)' },
      'management_accounts': { phase1: 'Management Accounts (from £650/month)',                               deferred: 'Management Accounts (from £650/month — when ready)' },
      'business_intelligence': { phase1: 'Business Intelligence (from £2,000/month)',                           deferred: 'Business Intelligence (from £2,000/month — when ready)' },
      'fractional_cfo':      { phase1: 'Fractional CFO (£4,000/month)',                                      deferred: 'Fractional CFO (£4,000/month — when ready)' },
      'fractional_coo':      { phase1: 'Fractional COO (£3,750/month)',                                        deferred: 'Fractional COO (£3,750/month — when ready)' },
      'business_advisory':   { phase1: 'Business Advisory & Exit Planning (£2,000 - £4,000)',                 deferred: 'Business Advisory & Exit Planning (£2,000 - £4,000 — when ready)' },
      'automation':          { phase1: 'Automation Services (£1,500 - £5,000)',                                 deferred: 'Automation Services (£1,500 - £5,000 — when ready)' },
      // Investment vehicle services (Session 11)
      'iht_planning': { phase1: 'IHT Planning Workshop (£2,500)', deferred: 'IHT Planning Workshop (£2,500 — when ready)' },
      'property_health_check': { phase1: 'Property Portfolio Health Check (£3,500)', deferred: 'Property Portfolio Health Check (£3,500 — when ready)' },
      'wealth_transfer_strategy': { phase1: 'Family Wealth Transfer Strategy (£5,500)', deferred: 'Family Wealth Transfer Strategy (£5,500 — when ready)' },
      'property_management_sourcing': { phase1: 'Property Management Sourcing (£1,500)', deferred: 'Property Management Sourcing (£1,500 — when ready)' },
    };

    function detectServiceFromText(text: string): string | null {
      if (!text) return null;
      const lower = text.toLowerCase();

      if (lower.includes('benchmark'))                                    return 'benchmarking';
      if (lower.includes('system') && (lower.includes('audit') || lower.includes('process'))) return 'systems_audit';
      if (lower.includes('goal') || lower.includes('alignment') || lower.includes('365')) return 'goal_alignment';
      if (lower.includes('management account'))                           return 'management_accounts';
      if (lower.includes('business intelligence'))                        return 'business_intelligence';
      if (lower.includes('fractional cfo') || (lower.includes('cfo') && !lower.includes('coo'))) return 'fractional_cfo';
      if (lower.includes('fractional coo') || (lower.includes('coo') && !lower.includes('cfo'))) return 'fractional_coo';
      if (lower.includes('business advisory') || lower.includes('exit planning')) return 'business_advisory';
      if (lower.includes('automation'))                                   return 'automation';
      if (lower.includes('iht') || (lower.includes('inheritance') && lower.includes('planning'))) return 'iht_planning';
      if (lower.includes('property') && lower.includes('health check')) return 'property_health_check';
      if (lower.includes('wealth transfer') || (lower.includes('family') && lower.includes('wealth'))) return 'wealth_transfer_strategy';
      if (lower.includes('property') && lower.includes('management') && lower.includes('sourcing')) return 'property_management_sourcing';

      return null;
    }

    /**
     * Strip stutter patterns from any string — safety net
     * Catches: "(£2,000) (£2,000)", "(£2,000 — when ready) (£2,000 — when ready — when ready)",
     *          "(Tier 1)", "(Tier 2)", doubled "when ready", etc.
     */
    function stripStutter(text: string): string {
      if (!text) return text;

      let result = text;

      // Remove "(Tier N)" — not client-facing
      result = result.replace(/\s*\(Tier\s*\d+\)\s*/gi, ' ');

      // Remove duplicate price brackets: "(£X,XXX) (£X,XXX)" → "(£X,XXX)"
      result = result.replace(/(\(£[\d,]+(?:\/\w+)?\))\s*\(£[\d,]+(?:\/\w+)?\)/g, '$1');

      // Remove duplicate "when ready" patterns:
      // "(£X — when ready) (£X — when ready — when ready)" → "(£X — when ready)"
      result = result.replace(/(\(£[\d,]+(?:\/\w+)?\s*—\s*when ready\))\s*\(£[\d,]+(?:\s*—\s*when ready)*(?:\/\w+)?(?:\s*—\s*when ready)*\)/gi, '$1');

      // Clean up any remaining "— when ready — when ready" to just "— when ready"
      result = result.replace(/(—\s*when ready)\s*—\s*when ready/gi, '$1');

      // Clean up "when ready/year — when ready" → just use the canonical
      result = result.replace(/when ready\/year\s*—\s*when ready/gi, 'when ready');

      // Clean up double spaces
      result = result.replace(/\s{2,}/g, ' ').trim();

      return result;
    }

    function cleanJourneyPhases(journeyData: any, _clientTurnover?: number): any {
      if (!journeyData) return journeyData;

      const phases = journeyData.phases ||
        [journeyData.phase1, journeyData.phase2, journeyData.phase3].filter(Boolean);

      if (!phases || !Array.isArray(phases) || phases.length === 0) {
        console.log('[Pass2] cleanJourneyPhases: no phases found');
        return journeyData;
      }

      console.log(`[Pass2] cleanJourneyPhases: processing ${phases.length} phases`);

      phases.forEach((phase: any, index: number) => {
        // Find the enabled-by field
        const fieldNames = ['enabledBy', 'enabled_by', 'service', 'serviceLine', 'enabledByService'];
        let fieldName: string | null = null;
        let currentValue = '';

        for (const fn of fieldNames) {
          if (phase[fn] && typeof phase[fn] === 'string') {
            fieldName = fn;
            currentValue = phase[fn];
            break;
          }
        }

        if (!fieldName) {
          console.log(`[Pass2] Phase ${index}: no enabled-by field found`);
          return;
        }

        console.log(`[Pass2] Phase ${index} BEFORE: "${currentValue}"`);

        // Step 1: Try to detect service and hardcode the correct string
        const detectedCode = phase.enabledByCode || detectServiceFromText(currentValue);

        if (detectedCode && CANONICAL_ENABLED_BY[detectedCode]) {
          const isDeferred = index > 0; // Phase 0 = firm price, Phase 1+ = "when ready"
          const canonical = isDeferred
            ? CANONICAL_ENABLED_BY[detectedCode].deferred
            : CANONICAL_ENABLED_BY[detectedCode].phase1;

          phase[fieldName] = canonical;
          phase.enabledByCode = detectedCode;
          console.log(`[Pass2] Phase ${index} AFTER (canonical): "${canonical}"`);
        } else {
          // Step 2: Couldn't detect service — apply stutter stripping as fallback
          phase[fieldName] = stripStutter(currentValue);
          console.log(`[Pass2] Phase ${index} AFTER (stripped): "${phase[fieldName]}"`);
        }
      });

      if (journeyData.phases) {
        journeyData.phases = phases;
      }

      return journeyData;
    }

    // Brute-force: clean "Enabled by:" lines in JSON string (narrative text or standalone fields)
    function cleanAllEnabledByStrings(jsonStr: string): string {
      const cleanups: [RegExp, string][] = [
        [/Enabled by:\s*Industry Benchmarking[^"\\]*/g,
         'Enabled by: Industry Benchmarking (Full Package) (£2,000 - £4,500)'],
        [/Enabled by:\s*Systems\s*(?:&|and)\s*Process Audit[^"\\]*/g,
         'Enabled by: Systems & Process Audit (£2,000 - £4,500 — when ready)'],
        [/Enabled by:\s*Goal Alignment Programme[^"\\]*/g,
         'Enabled by: Goal Alignment Programme (£1,500 - £9,000/year — when ready)'],
      ];
      let cleaned = jsonStr;
      for (const [pattern, replacement] of cleanups) {
        cleaned = cleaned.replace(pattern, replacement);
      }
      return cleaned;
    }

    // Nuclear option: remove duplicate "when ready" from entire JSON before save
    function cleanWhenReadyStutter(obj: any): any {
      if (!obj) return obj;
      try {
        const jsonStr = JSON.stringify(obj);
        let cleaned = jsonStr
          .replace(/\(When ready\)\s*\(when ready\)\s*\(When ready\s*\(When ready\)\)/gi, '— when ready)')
          .replace(/\(£[\d,]+(?:\/year)?\s*—\s*when ready\)\s*\(£[\d,]+(?:\/year)?\s*—\s*when ready\)/gi, (match: string) => {
            const first = match.match(/\(£[\d,]+(?:\/year)?\s*—\s*when ready\)/);
            return first ? first[0] : '(when ready)';
          })
          .replace(/(\([^)]*when ready[^)]*\))\s*\([^)]*when ready[^)]*\)/gi, (match: string) => {
            const first = match.match(/\([^)]*\)/);
            return first ? first[0] : '(when ready)';
          });
        return JSON.parse(cleaned);
      } catch (e) {
        console.warn('[Pass2] cleanWhenReadyStutter parse failed:', e);
        return obj;
      }
    }
    
    // ========================================================================
    // GAP SCORE CALIBRATION - SYSTEM RULES, NOT LLM DISCRETION
    // ========================================================================
    
    function calibrateGapScore(
      llmScore: number, 
      comprehensiveAnalysis: any, 
      emotionalAnchors: any
    ): number {
      const rules = NON_NEGOTIABLES.gapScoreRules;
      let calibrated = llmScore;
      
      // Check conditions
      const businessRunsAlone = 
        comprehensiveAnalysis?.exitReadiness?.factors?.some(
          (f: any) => f.name?.includes('Founder') && f.score > f.maxScore * 0.6
        ) ||
        (emotionalAnchors?.tuesdayTest || '').toLowerCase().includes('tick') ||
        (emotionalAnchors?.tuesdayTest || '').toLowerCase().includes('without');
      
      const excellentMargins = 
        comprehensiveAnalysis?.grossMargin?.assessment === 'excellent' ||
        comprehensiveAnalysis?.grossMargin?.assessment === 'healthy' ||
        (comprehensiveAnalysis?.grossMargin?.grossMarginPct || 0) > 50;
      
      const isMarketLeader = 
        (emotionalAnchors?.competitivePosition || '').toLowerCase().includes('leader') ||
        (emotionalAnchors?.competitivePosition || '').toLowerCase().includes('market leader');
      
      const achievementCount = comprehensiveAnalysis?.achievements?.achievements?.length || 0;
      
      // Apply rules
      if (businessRunsAlone) {
        calibrated = Math.max(calibrated, rules.businessRunsWithoutFounder);
      }
      
      if (excellentMargins) {
        calibrated = Math.max(calibrated, rules.excellentMargins);
      }
      
      if (businessRunsAlone && excellentMargins) {
        calibrated = Math.max(calibrated, rules.bothAbove);
      }
      
      if (isMarketLeader) {
        calibrated = Math.max(calibrated, rules.marketLeader);
      }
      
      if (achievementCount >= 4 && excellentMargins) {
        calibrated = Math.max(calibrated, rules.bothAbove);
      }
      
      // Cap at max (never give 10)
      calibrated = Math.min(calibrated, rules.maxScore);
      
      if (calibrated !== llmScore) {
        console.log(`[Pass2] 📊 Gap score calibrated: ${llmScore} → ${calibrated}`, {
          businessRunsAlone,
          excellentMargins,
          isMarketLeader,
          achievementCount
        });
      }
      
      return calibrated;
    }
    
    // ========================================================================
    // EMOTIONAL ANCHOR ENFORCEMENT
    // ========================================================================
    
    function enforceEmotionalAnchors(
      text: string, 
      emotionalAnchors: any
    ): string {
      if (!text) return text;
      let enforced = text;
      const anchors = NON_NEGOTIABLES.requiredAnchors;
      
      // Check for "never had break" anchor
      const neverHadBreak = 
        (emotionalAnchors?.lastHoliday || '').toLowerCase().includes('never') ||
        (emotionalAnchors?.lastHoliday || '').toLowerCase().includes("can't remember") ||
        (emotionalAnchors?.lastHoliday || '').toLowerCase().includes('cannot remember');
      
      if (neverHadBreak && !enforced.toLowerCase().includes('never')) {
        console.log('[Pass2] 📌 "Never had break" anchor available - client should see this');
      }
      
      // Check for health anchor
      const healthSuffered = 
        (emotionalAnchors?.stressResponse || '').toLowerCase().includes('health') ||
        (emotionalAnchors?.personalCost || '').toLowerCase().includes('health');
      
      if (healthSuffered && !enforced.toLowerCase().includes('health')) {
        console.log('[Pass2] 📌 Health anchor available - client mentioned health impact');
      }
      
      return enforced;
    }

    console.log('[Pass2] Starting for engagement:', engagementId);
    console.log('[Pass2] 📋 Service registry:', Object.keys(SERVICE_REGISTRY).length, 'services');
    const startTime = Date.now();

    // Update status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: 'pass2_processing', 
        pass2_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    await supabase
      .from('discovery_reports')
      .update({ status: 'pass2_processing', updated_at: new Date().toISOString() })
      .eq('engagement_id', engagementId);

    // ========================================================================
    // FETCH ENGAGEMENT DATA
    // IMPORTANT: Query discovery_engagements table (matches frontend & Pass 1)
    // ========================================================================
    const { data: engagement, error: engError } = await supabase
      .from('discovery_engagements')
      .select(`
        *,
        client:practice_members!discovery_engagements_client_id_fkey(
          id, name, email, client_company
        ),
        discovery:destination_discovery(*)
      `)
      .eq('id', engagementId)
      .single();

    if (engError || !engagement) {
      console.error('[Pass2] Engagement not found:', engError?.message);
      throw new Error('Engagement not found');
    }

    console.log('[Pass2] Found engagement for client:', engagement.client?.name);

    // Load advisor pin/block preferences from engagement
    const pinnedServices: string[] = ((engagement.pinned_services as string[]) || []).map((s: string) => s.toLowerCase());
    const blockedServicesFromAdvisor: string[] = ((engagement.blocked_services as string[]) || []).map((s: string) => s.toLowerCase());
    console.log(`[Pass2] Advisor pinned services: ${pinnedServices.join(', ') || 'none'}`);
    console.log(`[Pass2] Advisor blocked services: ${blockedServicesFromAdvisor.join(', ') || 'none'}`);

    // SERVICE_DETAILS built from registry after validatedPayroll (see below)

    // ========================================================================
    // FETCH VALIDATED FINANCIAL DATA
    // This ensures the LLM uses correct payroll figures, not hallucinated ones
    // ========================================================================
    const clientId = engagement.client_id;
    
    // Try to get financial context from client_financial_context table
    const { data: financialContext } = await supabase
      .from('client_financial_context')
      .select('*')
      .eq('client_id', clientId)
      .order('period_end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Try to get from client_reports (generate-discovery-analysis output)
    const { data: analysisReport } = await supabase
      .from('client_reports')
      .select('report_data')
      .eq('client_id', clientId)
      .eq('report_type', 'discovery_analysis')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Try to get from client_financial_data (accounts upload path)
    const { data: clientFinancialDataRows } = await supabase
      .from('client_financial_data')
      .select('*')
      .eq('client_id', clientId)
      .order('fiscal_year', { ascending: false })
      .limit(3);

    if (clientFinancialDataRows?.length) {
      console.log('[Pass2] ✅ Found', clientFinancialDataRows.length, 'years in client_financial_data');
    }
    
    // Extract validated payroll data
    let validatedPayroll: {
      turnover: number | null;
      staffCosts: number | null;
      staffCostsPct: number | null;
      benchmarkPct: number | null;
      excessPct: number | null;
      excessAmount: number | null;
      calculation: string | null;
    } = {
      turnover: null,
      staffCosts: null,
      staffCostsPct: null,
      benchmarkPct: null,
      excessPct: null,
      excessAmount: null,
      calculation: null
    };
    
    // Priority 1: Use discovery_reports.page4_numbers.payrollAnalysis (most validated - from Pass 1)
    // Also check the old path for backwards compatibility
    // ========================================================================
    // FIX: Read payroll from comprehensive_analysis (where Pass 1 actually saves it)
    // ========================================================================
    const { data: discoveryReportForPayroll } = await supabase
      .from('discovery_reports')
      .select('page4_numbers, comprehensive_analysis')
      .eq('engagement_id', engagementId)
      .maybeSingle();
    
    const pass1PayrollAnalysis = 
      discoveryReportForPayroll?.page4_numbers?.payrollAnalysis ||  // Try page4_numbers first (new structure)
      discoveryReportForPayroll?.comprehensive_analysis?.payroll ||  // Fallback to comprehensive_analysis (actual location)
      null;
    
    if (pass1PayrollAnalysis) {
      const payrollSource = discoveryReportForPayroll?.page4_numbers?.payrollAnalysis 
        ? 'page4_numbers' 
        : 'comprehensive_analysis';
      
      console.log('[Pass2] ✅ Found payroll data:', {
        annualExcess: pass1PayrollAnalysis.annualExcess,
        benchmark: pass1PayrollAnalysis.benchmark?.good || pass1PayrollAnalysis.benchmarkPct,
        source: payrollSource
      });
      
      validatedPayroll = {
        turnover: pass1PayrollAnalysis.turnover || null,
        staffCosts: pass1PayrollAnalysis.staffCosts || null,
        staffCostsPct: pass1PayrollAnalysis.staffCostsPct || null,
        benchmarkPct: pass1PayrollAnalysis.benchmark?.good || pass1PayrollAnalysis.benchmarkPct || 28,
        excessPct: pass1PayrollAnalysis.excessPercentage || pass1PayrollAnalysis.excessPct || null,
        excessAmount: pass1PayrollAnalysis.annualExcess || null,
        calculation: pass1PayrollAnalysis.calculation || null
      };
      console.log('[Pass2] Using validated payroll:', validatedPayroll);
    }
    // Fallback: Try the old client_reports path
    else if (analysisReport?.report_data?.analysis?.financialContext?.payrollAnalysis) {
      const pa = analysisReport.report_data.analysis.financialContext.payrollAnalysis;
      validatedPayroll = {
        turnover: pa.turnover || null,
        staffCosts: pa.staffCosts || null,
        staffCostsPct: pa.staffCostsPct || null,
        benchmarkPct: pa.benchmark?.typical || 28,
        excessPct: pa.excessPercentage || null,
        excessAmount: pa.annualExcess || null,
        calculation: pa.calculation || null
      };
      console.log('[Pass2] Using validated payroll from client_reports (fallback):', validatedPayroll);
    }
    // Priority 2: Use client_financial_context
    else if (financialContext) {
      const turnover = financialContext.turnover || financialContext.revenue;
      const staffCosts = financialContext.staff_costs || financialContext.total_staff_costs;
      if (turnover && staffCosts) {
        const staffCostsPct = (staffCosts / turnover) * 100;
        const benchmarkPct = 28; // Default benchmark for most industries
        const excessPct = Math.max(0, staffCostsPct - benchmarkPct);
        const excessAmount = Math.round((excessPct / 100) * turnover);
        
        validatedPayroll = {
          turnover,
          staffCosts,
          staffCostsPct,
          benchmarkPct,
          excessPct,
          excessAmount,
          calculation: `£${staffCosts.toLocaleString()} ÷ £${turnover.toLocaleString()} = ${staffCostsPct.toFixed(1)}%. Excess: ${excessPct.toFixed(1)}% = £${excessAmount.toLocaleString()}`
        };
        console.log('[Pass2] Calculated payroll from client_financial_context:', validatedPayroll);
      }
    }
    // Priority 3: Use client_financial_data (accounts upload path)
    else if (clientFinancialDataRows && clientFinancialDataRows.length > 0) {
      const latest = clientFinancialDataRows[0];
      const turnover = latest.revenue;
      const staffCosts = (latest as any).staff_costs;
      if (turnover && staffCosts) {
        const staffCostsPct = (staffCosts / turnover) * 100;
        const benchmarkPct = 28;
        const excessPct = Math.max(0, staffCostsPct - benchmarkPct);
        const excessAmount = Math.round((excessPct / 100) * turnover);
        validatedPayroll = {
          turnover,
          staffCosts,
          staffCostsPct,
          benchmarkPct,
          excessPct,
          excessAmount,
          calculation: `£${staffCosts.toLocaleString()} ÷ £${turnover.toLocaleString()} = ${staffCostsPct.toFixed(1)}%. Excess: ${excessPct.toFixed(1)}% = £${excessAmount.toLocaleString()}`
        };
        console.log('[Pass2] ✅ Calculated payroll from client_financial_data:', validatedPayroll);
      } else if (turnover) {
        validatedPayroll = {
          ...validatedPayroll,
          turnover,
        };
        console.log('[Pass2] ⚠️ Have turnover from client_financial_data but no staff costs');
      }
    }
    
    // ========================================================================
    // ENHANCEMENT 3: Build Enhanced Financial Data Section
    // ========================================================================
    let financialDataSection = '';
    if (validatedPayroll.turnover) {
      if (validatedPayroll.staffCosts) {
        financialDataSection = `

============================================================================
🔢 VALIDATED FINANCIAL DATA - USE THESE EXACT FIGURES
============================================================================
You MUST use these figures when discussing payroll/staff costs. DO NOT make up different numbers.

TURNOVER: £${validatedPayroll.turnover.toLocaleString()}
STAFF COSTS: £${validatedPayroll.staffCosts.toLocaleString()}
STAFF COSTS AS % OF TURNOVER: ${validatedPayroll.staffCostsPct?.toFixed(1)}%
INDUSTRY BENCHMARK: ${validatedPayroll.benchmarkPct}%
EXCESS PERCENTAGE: ${validatedPayroll.excessPct?.toFixed(1)}%
EXCESS AMOUNT: £${validatedPayroll.excessAmount?.toLocaleString() || 'Unknown'}

CALCULATION: ${validatedPayroll.calculation || 'See above'}

⚠️ IMPORTANT: 
- When mentioning payroll excess, use £${validatedPayroll.excessAmount?.toLocaleString() || 'Unknown'} - NOT any other figure
- When mentioning staff costs %, use ${validatedPayroll.staffCostsPct?.toFixed(1)}% - NOT any other figure
- When formatting large numbers, use "k" suffix ONCE (e.g., "£193k" NOT "£193kk")
`;
      } else {
        financialDataSection = `

============================================================================
🔢 VALIDATED FINANCIAL DATA (PARTIAL)
============================================================================
TURNOVER: £${validatedPayroll.turnover.toLocaleString()}
STAFF COSTS: Not available from accounts — do not guess specific amounts.
When discussing staffing: reference the team size and productivity instead of cost percentages.
`;
        console.log('[Pass2] ⚠️ Partial financial data — turnover known but staff costs unavailable');
      }
    } else {
      financialDataSection = `

============================================================================
🔢 FINANCIAL DATA STATUS
============================================================================
No validated financial data available. When discussing financial figures:
- DO NOT make up specific amounts
- Use phrases like "Unknown precisely" or "To be confirmed from accounts"
- DO NOT guess at payroll percentages or excess amounts
`;
      console.log('[Pass2] ⚠️ No validated financial data available - LLM should not invent figures');
    }

    const clientTurnover = validatedPayroll?.turnover ?? null;
    const SERVICE_DETAILS: Record<string, { name: string; price: string; priceType: string; outcome: string }> = {};
    for (const code of Object.keys(SERVICE_REGISTRY)) {
      const resolved = resolveServiceCode(code);
      const d = getLegacyServiceDetail(resolved, clientTurnover ?? undefined);
      if (d) SERVICE_DETAILS[resolved] = d;
    }
    for (const [legacy, canonical] of Object.entries(LEGACY_CODE_MAP)) {
      if (SERVICE_DETAILS[canonical] && !SERVICE_DETAILS[legacy]) (SERVICE_DETAILS as Record<string, { name: string; price: string; priceType: string; outcome: string }>)[legacy] = SERVICE_DETAILS[canonical];
    }
    console.log('[Pass2] Loaded service details from registry for', Object.keys(SERVICE_DETAILS).length, 'services');

    // Fetch Pass 1 results
    const { data: report, error: reportError } = await supabase
      .from('discovery_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    
    // Fetch engagement to get admin context and exit timeline
    const { data: engagementData } = await supabase
      .from('discovery_engagements')
      .select('admin_flags, admin_context_note, discovery')
      .eq('id', engagementId)
      .single();
    
    const adminFlags = engagementData?.admin_flags || null;
    const adminContextNote = engagementData?.admin_context_note || '';
    const exitTimeline = engagement?.discovery?.responses?.sd_exit_timeline || 
                        engagement?.discovery?.responses?.dd_exit_mindset ||
                        engagementData?.discovery?.responses?.sd_exit_timeline ||
                        engagementData?.discovery?.responses?.dd_exit_mindset ||
                        '';

    if (reportError || !report) {
      throw new Error('Pass 1 must be completed first');
    }

    // ========================================================================
    // EXTRACT CLIENT TYPE CLASSIFICATION FROM PASS 1
    // ========================================================================
    const clientType = (report.client_type || 'trading_product') as ClientBusinessType;
    const clientTypeConfidence = report.client_type_confidence || 50;
    const clientTypeSignals = report.client_type_signals || [];
    const frameworkOverrides = report.framework_overrides as FrameworkOverrides | null;
    const assetValuation = report.asset_valuation as AssetValuation | null;
    
    console.log('[Pass2] 🏷️ Client Type from Pass 1:', {
      type: clientType,
      confidence: clientTypeConfidence,
      signals: clientTypeSignals,
      framing: frameworkOverrides?.reportFraming,
      maxInvestment: frameworkOverrides?.maxRecommendedInvestment,
      useAssetValuation: frameworkOverrides?.useAssetValuation
    });
    
    // Get client-type specific prompt guidance
    const clientTypeGuidance = getClientTypePromptGuidance(clientType, frameworkOverrides, assetValuation);
    
    // Get report framing instructions
    const reportFraming = frameworkOverrides?.reportFraming || 'transformation';
    const framingInstructions = getReportFramingInstructions(reportFraming, clientType);
    
    console.log('[Pass2] 📝 Report Framing:', {
      framing: reportFraming,
      clientType: clientType
    });

    // ========================================================================
    // EXTRACT 7-DIMENSION ANALYSIS FROM PASS 1
    // ========================================================================
    const comprehensiveAnalysis = report.comprehensive_analysis as ComprehensiveAnalysis | null;
    const destinationClarity = report.destination_clarity as DestinationClarityAnalysis | null;
    const detectedIndustry = report.detected_industry || 'general_business';
    
    // NEW: Extract pre-built phrases from structured calculations (v3.0+)
    const prebuiltPhrases = report.prebuilt_phrases as Record<string, any> | null;
    const pass2PromptInjection = report.pass2_prompt_injection as string | null;
    
    console.log('[Pass2] 📊 Loaded 7-Dimension Analysis from Pass 1:', {
      dataQuality: comprehensiveAnalysis?.dataQuality,
      hasValuation: !!comprehensiveAnalysis?.valuation,
      valuationConservative: comprehensiveAnalysis?.valuation?.conservativeValue,
      valuationOptimistic: comprehensiveAnalysis?.valuation?.optimisticValue,
      hasPayroll: !!comprehensiveAnalysis?.payroll,
      hasTrajectory: !!comprehensiveAnalysis?.trajectory,
      hasProductivity: !!comprehensiveAnalysis?.productivity,
      hasGrossMargin: !!comprehensiveAnalysis?.grossMargin,
      grossMarginPct: comprehensiveAnalysis?.grossMargin?.grossMarginPct,
      grossMarginAssessment: comprehensiveAnalysis?.grossMargin?.assessment,
      hasHiddenAssets: !!comprehensiveAnalysis?.hiddenAssets,
      hiddenAssetsTotal: comprehensiveAnalysis?.hiddenAssets?.totalHiddenAssets,
      hasExitReadiness: !!comprehensiveAnalysis?.exitReadiness,
      destinationClarityScore: destinationClarity?.score,
      industry: detectedIndustry,
      hasPrebuiltPhrases: !!prebuiltPhrases,
      hasPromptInjection: !!pass2PromptInjection
    });

    console.log('[Pass2] 🔍 CoI data from Pass 1:', JSON.stringify({
      hasCoI: !!comprehensiveAnalysis?.costOfInaction,
      totalAnnual: comprehensiveAnalysis?.costOfInaction?.totalAnnual,
      totalOverHorizon: comprehensiveAnalysis?.costOfInaction?.totalOverHorizon,
      componentCount: comprehensiveAnalysis?.costOfInaction?.components?.length,
      components: comprehensiveAnalysis?.costOfInaction?.components?.map((c: any) => `${c.category}: £${Math.round(c.annualCost / 1000)}k`)
    }, null, 2));

    // If we have pre-built prompt injection from structured calculations, log it
    if (pass2PromptInjection) {
      console.log('[Pass2] ✅ Using structured pre-built phrases from Pass 1 v3.0');
    }
    
    // ========================================================================
    // BUILD PRE-PHRASED STATEMENTS FROM PASS 1 CALCULATIONS
    // These are MANDATORY - the LLM must use these exact phrases, not calculate its own
    // ========================================================================
    
    const preBuiltPhrases: Record<string, string> = {};
    
    // PAYROLL PHRASE - THE CRITICAL FIX
    if (comprehensiveAnalysis?.payroll?.annualExcess && comprehensiveAnalysis.payroll.annualExcess > 0) {
      const p = comprehensiveAnalysis.payroll;
      const excessK = Math.round(p.annualExcess / 1000);
      const staffPct = p.staffCostsPct?.toFixed(1) || '?';
      const benchmarkPct = (p.benchmark as any)?.good || (p as any).benchmarkPct || 28;
      const monthlyK = Math.round(excessK / 12);
      const twoYearK = excessK * 2;
      
      preBuiltPhrases.payrollImpact = `£${excessK}k/year excess - staff costs at ${staffPct}% vs the ${benchmarkPct}% benchmark`;
      preBuiltPhrases.payrollMonthly = `£${monthlyK}k walks out the door every month`;
      preBuiltPhrases.payrollTwoYear = `£${twoYearK}k over the next two years`;
      preBuiltPhrases.payrollComparison = `${staffPct}% vs the ${benchmarkPct}% benchmark`;
      preBuiltPhrases.payrollHeadline = `£${excessK}k/year excess`;
      
      console.log('[Pass2] ✅ Built payroll phrases from Pass 1:', preBuiltPhrases.payrollImpact);
    }
    
    // VALUATION PHRASE (includes hidden assets in enterprise value)
    if (comprehensiveAnalysis?.valuation?.conservativeValue && comprehensiveAnalysis.valuation?.optimisticValue) {
      const v = comprehensiveAnalysis.valuation;
      const hiddenAssetsTotal = comprehensiveAnalysis?.hiddenAssets?.totalHiddenAssets || 0;
      const hasHiddenAssets = hiddenAssetsTotal > 50000;
      
      if (hasHiddenAssets) {
        // Enterprise value = earnings value + hidden assets
        const enterpriseLowM = ((v.conservativeValue + hiddenAssetsTotal) / 1000000).toFixed(1);
        const enterpriseHighM = ((v.optimisticValue + hiddenAssetsTotal) / 1000000).toFixed(1);
        preBuiltPhrases.valuationRange = `£${enterpriseLowM}M - £${enterpriseHighM}M`;
        preBuiltPhrases.valuationHeadline = `Indicative enterprise value: £${enterpriseLowM}M - £${enterpriseHighM}M (includes £${Math.round(hiddenAssetsTotal/1000)}k hidden assets)`;
        preBuiltPhrases.earningsValueRange = `£${(v.conservativeValue / 1000000).toFixed(1)}M - £${(v.optimisticValue / 1000000).toFixed(1)}M`;
      } else {
        const lowM = (v.conservativeValue / 1000000).toFixed(1);
        const highM = (v.optimisticValue / 1000000).toFixed(1);
        preBuiltPhrases.valuationRange = `£${lowM}M - £${highM}M`;
        preBuiltPhrases.valuationHeadline = `Indicative valuation: £${lowM}M - £${highM}M`;
      }
      
      console.log('[Pass2] ✅ Built valuation phrase from Pass 1:', preBuiltPhrases.valuationRange);
    }
    
    // HIDDEN ASSETS PHRASE
    if (comprehensiveAnalysis?.hiddenAssets?.totalHiddenAssets && comprehensiveAnalysis.hiddenAssets.totalHiddenAssets > 50000) {
      const h = comprehensiveAnalysis.hiddenAssets;
      const totalK = Math.round(h.totalHiddenAssets / 1000);
      preBuiltPhrases.hiddenAssetsTotal = `£${totalK}k`;
      
      const components: string[] = [];
      if (h.freeholdProperty) components.push(`£${Math.round(h.freeholdProperty/1000)}k freehold property`);
      if (h.excessCash) components.push(`£${Math.round(h.excessCash/1000)}k excess cash`);
      if (h.undervaluedStock) components.push(`£${Math.round(h.undervaluedStock/1000)}k undervalued stock`);
      preBuiltPhrases.hiddenAssetsBreakdown = components.join(' + ');
      preBuiltPhrases.hiddenAssetsNote = `${preBuiltPhrases.hiddenAssetsTotal} sits OUTSIDE the earnings-based valuation`;
      
      console.log('[Pass2] ✅ Built hidden assets phrase from Pass 1:', preBuiltPhrases.hiddenAssetsTotal, '-', preBuiltPhrases.hiddenAssetsBreakdown);
    }
    
    // GROSS MARGIN PHRASE (show if healthy or better) — or structural 100% for investment vehicles (Session 11)
    const grossMarginStrengthOverride = (comprehensiveAnalysis as any)?.grossMarginStrengthOverride;
    const grossMarginIsStructural = (comprehensiveAnalysis as any)?.grossMarginIsStructural;
    if (grossMarginIsStructural && grossMarginStrengthOverride) {
      preBuiltPhrases.grossMarginStrength = grossMarginStrengthOverride;
      (preBuiltPhrases as any).grossMarginIsStructural = 'true';
      console.log('[Pass2] ✅ Structural gross margin phrase:', preBuiltPhrases.grossMarginStrength);
    } else if (comprehensiveAnalysis?.grossMargin?.grossMarginPct) {
      const gm = comprehensiveAnalysis.grossMargin;
      const assessment = gm.assessment || (gm.grossMarginPct > 50 ? 'excellent' : gm.grossMarginPct > 40 ? 'healthy' : 'typical');
      
      if (assessment === 'excellent' || assessment === 'healthy') {
        preBuiltPhrases.grossMarginStrength = `${gm.grossMarginPct.toFixed(1)}% gross margin - ${assessment} for the industry`;
        preBuiltPhrases.grossMarginPct = gm.grossMarginPct.toFixed(1);
        preBuiltPhrases.grossMarginAssessment = assessment;
        
        console.log('[Pass2] ✅ Built gross margin phrase from Pass 1:', preBuiltPhrases.grossMarginStrength);
      }
    }
    
    // IHT Exposure phrases (Session 11) — use ihtRange when available for precision
    const iht = (comprehensiveAnalysis as any)?.ihtExposure;
    if (iht?.hasData) {
      const rangeText = iht.ihtRange ?? (iht.ihtLiabilityRange
        ? `£${(iht.ihtLiabilityRange.low / 1000000).toFixed(2)}M – £${(iht.ihtLiabilityRange.high / 1000000).toFixed(2)}M`
        : `£${((iht.ihtLiability || 0) / 1000000).toFixed(2)}M`);
      (preBuiltPhrases as any).ihtHeadline = `Potential IHT liability: ${rangeText}`;
      (preBuiltPhrases as any).ihtRange = rangeText;
      (preBuiltPhrases as any).ihtEstateValue = `£${((iht.estateValue || 0) / 1000000).toFixed(1)}M`;
      (preBuiltPhrases as any).ihtCaveats = Array.isArray(iht.caveats) ? iht.caveats.join(' ') : 'Based on company net assets. Nil rate band, marital status, and personal assets will affect the final position.';
    }

    // Deferred tax impact (Session 11)
    const deferredTaxImpact = (comprehensiveAnalysis as any)?.deferredTaxImpact;
    if (deferredTaxImpact?.hasData || deferredTaxImpact?.isSignificant) {
      (preBuiltPhrases as any).deferredTaxExplanation = deferredTaxImpact.explanation;
    }
    
    // Employee count context (Session 11)
    const employeeCountContext = (comprehensiveAnalysis as any)?.employeeCountContext;
    if (employeeCountContext) {
      (preBuiltPhrases as any).employeeCountContext = employeeCountContext;
      (preBuiltPhrases as any).isNotSoloPractitioner = (comprehensiveAnalysis as any)?.isNotSoloPractitioner || 'false';
    }
    
    // PRODUCTIVITY PHRASE
    if (comprehensiveAnalysis?.productivity?.excessHeadcount && comprehensiveAnalysis.productivity.excessHeadcount > 0) {
      const pr = comprehensiveAnalysis.productivity;
      const revPerHeadK = pr.revenuePerHead ? Math.round(pr.revenuePerHead / 1000) : null;
      const benchmarkK = pr.benchmarkLow ? Math.round(pr.benchmarkLow / 1000) : 120;
      
      preBuiltPhrases.productivityGap = `Revenue per head at £${revPerHeadK}k vs £${benchmarkK}k benchmark`;
      preBuiltPhrases.excessHeadcount = `Roughly ${pr.excessHeadcount} excess employees based on productivity`;
      
      console.log('[Pass2] ✅ Built productivity phrase from Pass 1:', preBuiltPhrases.productivityGap);
    }
    
    // COST OF INACTION PHRASE
    if (comprehensiveAnalysis?.costOfInaction?.totalOverHorizon) {
      const coi = comprehensiveAnalysis.costOfInaction;
      const totalK = Math.round(coi.totalOverHorizon / 1000);
      preBuiltPhrases.costOfInaction = `£${totalK}k+ over ${coi.timeHorizon || 2} years`;
      
      console.log('[Pass2] ✅ Built cost of inaction phrase from Pass 1:', preBuiltPhrases.costOfInaction);
    }

    // FINANCIAL HEALTH SNAPSHOT PHRASES (Session 11)
    const fhsData = (comprehensiveAnalysis as any)?.financialHealthSnapshot;
    if (fhsData?.hasData) {
      const fhs = fhsData;
      (preBuiltPhrases as any).financialHealthOverall = fhs.overallHealth;
      (preBuiltPhrases as any).financialHealthSummary = fhs.summaryNarrative;
      (preBuiltPhrases as any).financialHealthRatios = fhs.noteworthyRatios.map(
        (r: { name: string; formatted: string; narrativePhrase: string }) => `${r.name}: ${r.formatted} — ${r.narrativePhrase}`
      );
      console.log('[Pass2] ✅ Built financial health phrases:', {
        overall: fhs.overallHealth,
        noteworthyCount: fhs.noteworthyRatios.length,
        ratios: fhs.noteworthyRatios.map((r: { name: string; formatted: string }) => `${r.name}: ${r.formatted}`)
      });
    }
    
    // YoY GROWTH PHRASES — prefer page4_numbers.yearOnYearComparisons (where Pass 1 saves), else comprehensive_analysis
    const yoy = (report?.page4_numbers as Record<string, any> | null)?.yearOnYearComparisons || comprehensiveAnalysis?.yearOnYearComparisons;

    // OPERATING PROFIT GROWTH
    const opYoY = yoy?.operatingProfit || comprehensiveAnalysis?.yearOnYearComparisons?.operatingProfit;
    if (opYoY?.current != null && opYoY?.prior != null && opYoY.prior > 0) {
      const opCurrent = opYoY.current;
      const opPrior = opYoY.prior;
      const growthPct = (((opCurrent - opPrior) / opPrior) * 100).toFixed(1);
      const priorK = Math.round(opPrior / 1000);
      const currentK = Math.round(opCurrent / 1000);
      preBuiltPhrases.operatingProfitGrowthPct = `${growthPct}%`;
      preBuiltPhrases.operatingProfitGrowthNarrative = `operating profit up ${growthPct}% year-on-year (£${priorK}k → £${currentK}k)`;
      preBuiltPhrases.operatingProfitGrowth = `${growthPct}%`;
      console.log('[Pass2] ✅ Built operating profit growth phrase:', preBuiltPhrases.operatingProfitGrowthNarrative);
    }

    // REVENUE GROWTH
    const revYoY = yoy?.turnover || comprehensiveAnalysis?.yearOnYearComparisons?.turnover;
    if (revYoY?.current != null && revYoY?.prior != null && revYoY.prior > 0) {
      const revCurrent = revYoY.current;
      const revPrior = revYoY.prior;
      const revGrowthPct = (((revCurrent - revPrior) / revPrior) * 100).toFixed(1);
      const formatAmount = (v: number) => v >= 1000000 ? `£${(v / 1000000).toFixed(1)}M` : `£${Math.round(v / 1000)}k`;
      preBuiltPhrases.revenueGrowth = `${revGrowthPct}%`;
      preBuiltPhrases.revenueGrowthNarrative = `revenue up ${revGrowthPct}% year-on-year (${formatAmount(revPrior)} → ${formatAmount(revCurrent)})`;
      preBuiltPhrases.turnoverScale = formatAmount(revCurrent);
      console.log('[Pass2] ✅ Built revenue growth phrase:', preBuiltPhrases.revenueGrowthNarrative);
    }

    // NET PROFIT GROWTH
    const netYoY = yoy?.netProfit || comprehensiveAnalysis?.yearOnYearComparisons?.netProfit;
    if (netYoY?.prior && netYoY.prior > 0 && netYoY.current != null && netYoY.change != null) {
      const netGrowthPct = ((netYoY.change / netYoY.prior) * 100).toFixed(1);
      preBuiltPhrases.netProfitGrowth = `${netGrowthPct}%`;
      console.log('[Pass2] ✅ Built net profit growth:', preBuiltPhrases.netProfitGrowth);
    }

    // BUSINESS SCALE (for anchoring the report) — use asset-based phrase for investment vehicles (Session 11)
    const businessSizePhrasePass1 = (comprehensiveAnalysis as any)?.businessSizePhrase;
    if (businessSizePhrasePass1) {
      preBuiltPhrases.businessScale = businessSizePhrasePass1;
      console.log('[Pass2] ✅ Built business scale phrase (Pass 1):', preBuiltPhrases.businessScale);
    } else {
      const turnoverForScale = revYoY?.current ?? validatedPayroll?.turnover ?? comprehensiveAnalysis?.payroll?.turnover;
      const empCount = comprehensiveAnalysis?.productivity?.employeeCount ?? comprehensiveAnalysis?.productivity?.headcount ?? comprehensiveAnalysis?.payroll?.employeeCount;
      if (turnoverForScale) {
        const scaleM = (Number(turnoverForScale) / 1000000).toFixed(1);
        preBuiltPhrases.businessScale = empCount
          ? `a £${scaleM}M business with ${empCount} staff`
          : `a £${scaleM}M business`;
        console.log('[Pass2] ✅ Built business scale phrase:', preBuiltPhrases.businessScale);
      }
    }

    // ========================================================================
    // BUILD ULTRA-MANDATORY PHRASES SECTION FOR PROMPT
    // ========================================================================
    let mandatoryPhrasesSection = '';
    
    if (Object.keys(preBuiltPhrases).length > 0) {
      mandatoryPhrasesSection = `

============================================================================
⛔⛔⛔ MANDATORY PHRASES - USE THESE EXACTLY - DO NOT CALCULATE ⛔⛔⛔
============================================================================
The following phrases have been PRE-CALCULATED from the client's actual data.
You MUST use these EXACT phrases. DO NOT calculate your own figures.
DO NOT paraphrase. DO NOT round differently. DO NOT use generic benchmarks.
USE THESE VERBATIM. THIS IS NOT OPTIONAL.

`;
      
      if (preBuiltPhrases.payrollImpact) {
        mandatoryPhrasesSection += `
🚨 PAYROLL (CRITICAL - USE THESE EXACT PHRASES):
────────────────────────────────────────────────────────────────────────────
► Impact statement: "${preBuiltPhrases.payrollImpact}"
► Monthly impact: "${preBuiltPhrases.payrollMonthly}"
► Two-year cost: "${preBuiltPhrases.payrollTwoYear}"
► Comparison: "${preBuiltPhrases.payrollComparison}"

⛔ When discussing payroll/staff costs, you MUST use: "${preBuiltPhrases.payrollImpact}"
⛔ DO NOT write "£147k" or "£148k" - that is WRONG
⛔ DO NOT use "30% benchmark" - the correct benchmark is in the phrase above
⛔ The correct figure is: ${preBuiltPhrases.payrollHeadline}

`;
      }
      
      if (preBuiltPhrases.valuationRange) {
        mandatoryPhrasesSection += `
💰 INDICATIVE VALUATION (MUST include in page4_numbers):
────────────────────────────────────────────────────────────────────────────
► Enterprise Value: "${preBuiltPhrases.valuationRange}"
► Full phrase: "${preBuiltPhrases.valuationHeadline}"

⛔ YOU MUST include "indicativeValuation": "${preBuiltPhrases.valuationRange}" in page4_numbers
⛔ Mention this in page4 personalCost or returns section: "The business could be worth ${preBuiltPhrases.valuationRange}"
⛔ Reference in page5_next_steps closing message

`;
      }
      
      if (preBuiltPhrases.hiddenAssetsTotal) {
        mandatoryPhrasesSection += `
💎 HIDDEN ASSETS (MUST include in page4_numbers AND explain in realReturn):
────────────────────────────────────────────────────────────────────────────
► Total: "${preBuiltPhrases.hiddenAssetsTotal}"
► Breakdown: "${preBuiltPhrases.hiddenAssetsBreakdown}"
► Note: "${preBuiltPhrases.hiddenAssetsNote || 'These assets sit OUTSIDE the earnings-based valuation'}"

⛔ YOU MUST include hiddenAssets object in page4_numbers:
   { "total": "${preBuiltPhrases.hiddenAssetsTotal}", "breakdown": "${preBuiltPhrases.hiddenAssetsBreakdown}" }

⛔ CRITICAL: In "realReturn" field, you MUST explain hidden assets with this detail:
   "The business could be worth [valuation range]. Plus ${preBuiltPhrases.hiddenAssetsTotal} in hidden assets 
   sitting outside the earnings valuation - ${preBuiltPhrases.hiddenAssetsBreakdown}. 
   This is cash/property a buyer pays for SEPARATELY, on top of the earnings multiple. 
   [Then connect to their emotional goal in their own words. DO NOT include the phrase \"But the real return?\" - the frontend adds this automatically.]"

⛔ DO NOT just say "hidden assets" without explaining what they are and why they matter.

`;
      }
      
      if (preBuiltPhrases.grossMarginStrength) {
        mandatoryPhrasesSection += `
📊 GROSS MARGIN STRENGTH (acknowledge in page2 opening):
────────────────────────────────────────────────────────────────────────────
► Statement: "${preBuiltPhrases.grossMarginStrength}"

⛔ This is a POSITIVE - acknowledge it BEFORE discussing gaps in page2_gaps.openingLine
⛔ Include "grossMarginStrength": "${preBuiltPhrases.grossMarginStrength}" in page4_numbers
⛔ This strength supports a higher gap score (7+ with good foundations)

`;
      }
      
      // Employee count context (Session 11)
      if ((preBuiltPhrases as any).employeeCountContext) {
        mandatoryPhrasesSection += `
👥 EMPLOYEE COUNT (DO NOT say "one-man band" if more than 1):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
► "${(preBuiltPhrases as any).employeeCountContext}"
${(preBuiltPhrases as any).isNotSoloPractitioner === 'true'
  ? '⛔ DO NOT call them a "one-man band". Say "the strategic burden sits with you" instead.'
  : ''}

`;
      }
      
      // Structural gross margin override (Session 11)
      if ((preBuiltPhrases as any).grossMarginIsStructural === 'true') {
        mandatoryPhrasesSection += `
📊 GROSS MARGIN IS STRUCTURAL (DO NOT praise 100% GM):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
► "${preBuiltPhrases.grossMarginStrength}"
⛔ DO NOT say "excellent gross margin" — 100% GM with no cost of sales is structural, not performance.
✅ Use operating margin as the profitability headline instead.

`;
      }
      
      if (preBuiltPhrases.productivityGap) {
        mandatoryPhrasesSection += `
👥 PRODUCTIVITY (USE THESE PHRASES):
────────────────────────────────────────────────────────────────────────────
► Gap: "${preBuiltPhrases.productivityGap}"
► Excess: "${preBuiltPhrases.excessHeadcount}"

`;
      }
      
      if (preBuiltPhrases.costOfInaction) {
        const c = (comprehensiveAnalysis as any)?.costOfInaction;
        const totalK = c?.totalOverHorizon ? Math.round(c.totalOverHorizon / 1000) : 0;
        const timeH = c?.timeHorizon || 5;
        let componentBreakdown = '';
        if (c?.components?.length > 0) {
          componentBreakdown = c.components
            .filter((comp: { costOverHorizon?: number }) => (comp.costOverHorizon || 0) > 0)
            .sort((a: { costOverHorizon?: number }, b: { costOverHorizon?: number }) => (b.costOverHorizon || 0) - (a.costOverHorizon || 0))
            .map((comp: { category: string; costOverHorizon?: number; calculation?: string }) => `- ${comp.category}: £${Math.round((comp.costOverHorizon || 0) / 1000)}k (${comp.calculation || ''})`)
            .join('\n');
        }
        mandatoryPhrasesSection += `
⏱️ COST OF DELAY — £${totalK}k+ OVER ${timeH} YEARS (MANDATORY)
────────────────────────────────────────────────────────────────────────────
Total: £${totalK}k+
Time horizon: ${timeH} years
${componentBreakdown ? `\nBREAKDOWN:\n${componentBreakdown}\n` : ''}
⛔ WHEN USING THE £${totalK}k FIGURE, YOU MUST EXPLAIN WHAT IT CONTAINS.
⛔ DO NOT just say "£${totalK}k+ over ${timeH} years" without breaking it down.
⛔ USE phrases like: "£${totalK}k+ at risk — [top components from breakdown above]"

`;
      }
      
      if (preBuiltPhrases.operatingProfitGrowthNarrative) {
        mandatoryPhrasesSection += `
📈 OPERATING PROFIT GROWTH (USE THIS EXACT PHRASE):
════════════════════════════════════════════════════════════════════════════════
► "${preBuiltPhrases.operatingProfitGrowthNarrative}"

⛔ DO NOT calculate operating profit growth yourself — use the phrase above VERBATIM
⛔ DO NOT round differently or use a different percentage

`;
      }
      if (preBuiltPhrases.revenueGrowthNarrative) {
        mandatoryPhrasesSection += `
📈 REVENUE GROWTH (USE THIS EXACT PHRASE):
════════════════════════════════════════════════════════════════════════════════
► "${preBuiltPhrases.revenueGrowthNarrative}"

`;
      }
      if (preBuiltPhrases.businessScale) {
        mandatoryPhrasesSection += `
🏢 BUSINESS SCALE (MENTION in page2 opening paragraph):
════════════════════════════════════════════════════════════════════════════════
► "This is ${preBuiltPhrases.businessScale}"
⛔ You MUST anchor the reader with the business scale in the Reality section opening.

`;
      }

      // IHT exposure mandatory phrases (Session 11 polish)
      const iht = (comprehensiveAnalysis as any)?.ihtExposure;
      if (iht?.hasData && (preBuiltPhrases as any).ihtRange) {
        const estateM = ((iht.estateValue || 0) / 1000000).toFixed(1);
        const singleNRB = iht.singleNRB ?? 325000;
        const marriedNRB = iht.marriedNRB ?? 650000;
        const caveatsList = Array.isArray(iht.caveats) ? iht.caveats : ['Based on company net assets. Nil rate band, marital status, and personal assets will affect the final position.'];
        mandatoryPhrasesSection += `
## IHT EXPOSURE (MANDATORY — USE THESE EXACT FIGURES)
Estate value: £${estateM}M
IHT liability range: ${(preBuiltPhrases as any).ihtRange}
Single nil rate band: £${(singleNRB / 1000).toFixed(0)}k
Married nil rate band: £${(marriedNRB / 1000).toFixed(0)}k (transferable)

⛔ YOU MUST USE the range "${(preBuiltPhrases as any).ihtRange}" when discussing IHT exposure.
⛔ DO NOT say "up to £X" or "significant chunk" — use the calculated range.
⛔ DO NOT recalculate. These figures include nil rate band deductions.

Caveats to mention:
${caveatsList.map((c: string) => `- ${c}`).join('\n')}

`;
      }

      // Deferred tax mandatory explanation (Session 11) — balance vs movement
      const dtImpact = (comprehensiveAnalysis as any)?.deferredTaxImpact;
      if (dtImpact?.hasData) {
        const balanceK = dtImpact.deferredTaxBalance != null ? Math.round(dtImpact.deferredTaxBalance / 1000) : null;
        const movementK = dtImpact.deferredTaxMovement != null ? Math.round(Math.abs(dtImpact.deferredTaxMovement) / 1000) : null;
        mandatoryPhrasesSection += `
## DEFERRED TAX — CRITICAL DISTINCTION (MANDATORY)
${dtImpact.explanation}

⛔ THE £${balanceK ?? '???'}k FIGURE ON THE BALANCE SHEET IS THE CUMULATIVE PROVISION, NOT THE ANNUAL CHARGE.
⛔ The annual deferred tax MOVEMENT is £${movementK ?? '???'}k. Use this figure when explaining the statutory loss.
⛔ DO NOT say "£${balanceK ?? '???'}k deferred tax provision" when explaining the annual loss — that is the balance, not the charge.
⛔ DO NOT describe the business as "loss-making" or "unprofitable."
⛔ ALWAYS use the phrase: "The statutory loss is driven by a £${movementK ?? '???'}k deferred tax movement"
`;
      } else if ((preBuiltPhrases as any).deferredTaxExplanation) {
        mandatoryPhrasesSection += `
## DEFERRED TAX EXPLANATION (MANDATORY)
${(preBuiltPhrases as any).deferredTaxExplanation}

⛔ DO NOT describe the business as "loss-making" or "unprofitable."
⛔ The statutory loss is a non-cash accounting adjustment, not poor trading.
⛔ ALWAYS explain the difference between operating profit and statutory result.

`;
      }
      
      mandatoryPhrasesSection += `============================================================================
`;
    }
    
    // Build mandatory dimensions prompt from Pass 1 analysis
    // Prefer the new structured prompt injection if available
    const mandatoryDimensionsPrompt = pass2PromptInjection || buildMandatoryDimensionsPrompt(comprehensiveAnalysis, destinationClarity);

    // ========================================================================
    // ENHANCEMENT 2: Extract Hidden Assets & Valuation from Pass 1
    // ========================================================================
    const page4Numbers = report.page4_numbers || {};
    const pass1HiddenAssets = page4Numbers?.hiddenAssets || comprehensiveAnalysis?.hiddenAssets;
    const hasHiddenAssets = pass1HiddenAssets?.totalHiddenAssets && pass1HiddenAssets.totalHiddenAssets > 50000;
    
    if (hasHiddenAssets) {
      console.log('[Pass2] 💎 Hidden Assets Found:', {
        total: pass1HiddenAssets.totalHiddenAssets,
        freehold: pass1HiddenAssets.freeholdProperty,
        excessCash: pass1HiddenAssets.excessCash
      });
    }

    // Extract Enterprise Valuation from Pass 1
    const pass1Valuation = page4Numbers?.valuationAnalysis || comprehensiveAnalysis?.valuation;
    const hasValuation = pass1Valuation?.conservativeValue && pass1Valuation?.optimisticValue;
    
    let valuationRangeText = '';
    if (hasValuation) {
      const lowM = (pass1Valuation.conservativeValue / 1000000).toFixed(1);
      const highM = (pass1Valuation.optimisticValue / 1000000).toFixed(1);
      valuationRangeText = `£${lowM}M - £${highM}M`;
      console.log('[Pass2] 💰 Enterprise Valuation:', valuationRangeText);
    }

    // Extract Gross Margin from Pass 1
    const pass1GrossMargin = page4Numbers?.grossMargin || comprehensiveAnalysis?.grossMargin;
    const hasExcellentMargin = pass1GrossMargin?.assessment === 'excellent' || pass1GrossMargin?.assessment === 'healthy';
    
    if (hasExcellentMargin) {
      console.log('[Pass2] 📊 Gross Margin:', pass1GrossMargin.grossMarginPct?.toFixed(1) + '% (' + pass1GrossMargin.assessment + ')');
    }

    // Extract Achievements from Pass 1
    const pass1Achievements = page4Numbers?.achievements || comprehensiveAnalysis?.achievements;
    const hasAchievements = pass1Achievements?.achievements && pass1Achievements.achievements.length > 0;
    
    if (hasAchievements) {
      console.log('[Pass2] ⭐ Achievements Found:', pass1Achievements.achievements.length);
    }

    // ========================================================================
    // ENHANCEMENT 3b: Add extracted data to financial section
    // ========================================================================
    
    // Add Hidden Assets to financial section
    if (hasHiddenAssets) {
      financialDataSection += `
============================================================================
💎 HIDDEN ASSETS (Include in Page 4 Numbers)
============================================================================
Total Hidden Assets: £${(pass1HiddenAssets.totalHiddenAssets/1000).toFixed(0)}k
${pass1HiddenAssets.freeholdProperty ? `- Freehold Property: £${(pass1HiddenAssets.freeholdProperty/1000).toFixed(0)}k` : ''}
${pass1HiddenAssets.excessCash ? `- Excess Cash: £${(pass1HiddenAssets.excessCash/1000).toFixed(0)}k` : ''}
${pass1HiddenAssets.undervaluedStock ? `- Undervalued Stock: £${(pass1HiddenAssets.undervaluedStock/1000).toFixed(0)}k` : ''}

⛔ MENTION these as additional value not reflected in earnings multiple.
`;
    }

    // Add Valuation to financial section
    if (hasValuation) {
      financialDataSection += `
============================================================================
💰 INDICATIVE ENTERPRISE VALUATION
============================================================================
${valuationRangeText}
Operating Profit: £${pass1Valuation.operatingProfit ? (pass1Valuation.operatingProfit/1000).toFixed(0) + 'k' : 'Unknown'}
Multiple Range: ${pass1Valuation.adjustedMultipleLow?.toFixed(1)}-${pass1Valuation.adjustedMultipleHigh?.toFixed(1)}x

⛔ YOU MUST STATE this valuation range in page4_numbers and reference it in the closing.
`;
    }

    // Add Gross Margin to financial section
    if (hasExcellentMargin) {
      financialDataSection += `
============================================================================
📊 GROSS MARGIN STRENGTH
============================================================================
Gross Margin: ${pass1GrossMargin.grossMarginPct?.toFixed(1)}% (${pass1GrossMargin.assessment})
${pass1GrossMargin.assessment === 'excellent' ? '⭐ This is a STRONG margin - highlight as a positive.' : ''}

This is a business STRENGTH that should be mentioned when discussing value.
`;
    }

    // Add Achievements to financial section
    if (hasAchievements) {
      financialDataSection += `
============================================================================
⭐ CLIENT ACHIEVEMENTS (Use to balance the gaps)
============================================================================
${pass1Achievements.achievements.map((a: any) => `- ${a.achievement}: ${a.evidence}`).join('\n')}

⛔ Reference these achievements to show the foundation is solid. 
   Don't just focus on gaps - acknowledge what's working.
`;
    }

    // Pre-calculated growth and scale (LLM must not calculate)
    if (preBuiltPhrases.operatingProfitGrowthNarrative) {
      financialDataSection += `
⛔ OPERATING PROFIT: ${preBuiltPhrases.operatingProfitGrowthNarrative}
DO NOT calculate this yourself. Use this exact phrase when discussing operating profit growth.
`;
    }
    if (preBuiltPhrases.revenueGrowthNarrative) {
      financialDataSection += `
⛔ REVENUE GROWTH: ${preBuiltPhrases.revenueGrowthNarrative}
DO NOT calculate this yourself. Use this exact phrase.
`;
    }
    if (preBuiltPhrases.businessScale) {
      financialDataSection += `
⛔ BUSINESS SCALE: This is ${preBuiltPhrases.businessScale}.
Mention the business scale in the Reality section to anchor the reader.
`;
    }
    
    // ========================================================================
    // FIX 7: CLIENT REVENUE CONCENTRATION DATA INJECTION
    // ========================================================================
    // Extract client revenue concentration from financial context or comprehensive analysis
    const clientRevenueConcentration = financialContext?.extracted_insights?.client_revenue_concentration ||
                                      (financialContext?.extracted_insights as any)?.clientRevenueConcentration ||
                                      comprehensiveAnalysis?.clientRevenueConcentration ||
                                      (comprehensiveAnalysis as any)?.client_revenue_concentration ||
                                      undefined;
    
    if (clientRevenueConcentration) {
      financialDataSection += `

============================================================================
📊 CLIENT REVENUE CONCENTRATION
============================================================================
`;
      for (const [clientName, details] of Object.entries(clientRevenueConcentration)) {
        const d = details as any;
        const revenue = d.revenue || 0;
        const pct = d.pct_of_total || (revenue && validatedPayroll.turnover ? (revenue / validatedPayroll.turnover * 100) : 0);
        financialDataSection += `- ${clientName}: £${revenue.toLocaleString()} (${pct.toFixed(0)}% of revenue)`;
        if (d.contract_length) financialDataSection += ` — ${d.contract_length}`;
        if (d.growth_potential) financialDataSection += ` — Growth potential: ${d.growth_potential}`;
        financialDataSection += '\n';
      }
      financialDataSection += `
⚠️ If any single client is >40% of revenue, flag BOTH the opportunity AND the risk.
`;
      
      console.log('[Pass2] ✅ Injected client revenue concentration data');
    }

    // Financial Health Snapshot guidance for LLM (Session 11)
    let financialHealthSection = '';
    const fhsForPrompt = (comprehensiveAnalysis as any)?.financialHealthSnapshot;
    if (fhsForPrompt?.noteworthyRatios?.length > 0) {
      const fhs = fhsForPrompt;
      financialHealthSection = `

## FINANCIAL HEALTH SNAPSHOT (USE IN PAGE 2 AND PAGE 4)

Overall financial health: ${fhs.overallHealth}

KEY RATIOS TO WEAVE INTO THE NARRATIVE (use naturally, don't list them as bullet points):
${fhs.noteworthyRatios.map((r: { name: string; formatted: string; status: string; narrativePhrase: string; context: string }) => `
- ${r.name}: ${r.formatted}
  Status: ${r.status}
  Narrative: ${r.narrativePhrase}
  Context: ${r.context}
`).join('')}

RULES FOR USING RATIOS:
1. DO NOT create a separate "financial health" section — weave insights into existing gaps (Page 2) and investment case (Page 4)
2. Only mention the ratios listed above — they've been selected as the ones that tell a story
3. Use the pre-built narrative phrases — DO NOT recalculate or reinterpret the numbers
4. If a ratio supports an existing gap (e.g., current ratio supports liquidity concern), fold it in there
5. If a ratio reveals something new (e.g., very low gearing = untapped borrowing capacity), it can be a new insight in Page 2
6. Maximum 3 ratio references across the entire report — be selective, not exhaustive
7. NEVER present ratios as a data dump or table. They should feel like advisor observations.

EXAMPLE OF GOOD RATIO USAGE:
"Your gearing of 8% tells a clear story — you've built a £6.4M estate with almost no debt. That's conservative, and it's served you well. But it also means there's borrowing capacity you're not using. Whether that matters depends on where you want to take the portfolio next."

EXAMPLE OF BAD RATIO USAGE:
"Your current ratio is 0.52, gearing is 8%, interest cover is 6.5x, asset turnover is 0.06, and return on equity is -0.7%."
`;
    }

    // Business size + asset relationship for investment vehicles (Session 11 J-A, K-A)
    let investmentVehicleExtraSection = '';
    if (clientType === 'investment_vehicle' && assetValuation?.hasData) {
      const netAssetsVal = assetValuation.netAssets || 0;
      const investmentPropVal = assetValuation.investmentProperty || assetValuation.freeholdProperty || 0;
      const turnoverVal = report.page4_numbers?.payrollAnalysis?.turnover ?? (comprehensiveAnalysis as any)?.payroll?.turnover ?? 0;
      const businessSizePhraseVal = (comprehensiveAnalysis as any)?.businessSizePhrase;
      const deferredTaxBalVal = (comprehensiveAnalysis as any)?.deferredTaxImpact?.deferredTaxBalance ?? 0;
      investmentVehicleExtraSection = `

## BUSINESS SIZE FRAMING (MANDATORY for investment vehicles)
⛔ DO NOT describe this as "a £${turnoverVal ? Math.round(turnoverVal / 1000) : '?'}k business" or use turnover to indicate size.
⛔ For property investment companies, the ASSET BASE defines the business, not the rental income.
✅ USE: "${businessSizePhraseVal || `a £${(netAssetsVal / 1000000).toFixed(1)}M estate`}" or "a property portfolio worth £${(investmentPropVal / 1000000).toFixed(1)}M"
✅ Revenue (£${turnoverVal ? Math.round(turnoverVal / 1000) : '?'}k) is rental income — mention it for context, not as a size indicator.

## ASSET VALUES — USE CONSISTENTLY (MANDATORY)
Investment property portfolio: £${(investmentPropVal / 1000000).toFixed(1)}M (gross value)
Net assets: £${(netAssetsVal / 1000000).toFixed(1)}M (after deducting bank loans, £${deferredTaxBalVal ? Math.round(deferredTaxBalVal / 1000) : '?'}k deferred tax provision, and other liabilities)

RULES:
1. When talking about PORTFOLIO SIZE or PROPERTY VALUE: use £${(investmentPropVal / 1000000).toFixed(1)}M
2. When talking about NET WORTH, IHT EXPOSURE, or ESTATE VALUE: use £${(netAssetsVal / 1000000).toFixed(1)}M
3. ALWAYS explain the difference at least once: "a £${(investmentPropVal / 1000000).toFixed(1)}M property portfolio with net assets of £${(netAssetsVal / 1000000).toFixed(1)}M after mortgages and provisions"
4. For IHT: the taxable estate is £${(netAssetsVal / 1000000).toFixed(1)}M (debts are deductible)
5. DO NOT use both figures in the same sentence without explaining the relationship
`;
    }

    // ========================================================================
    // CRITICAL: Extract Pass 1's EXACT service decisions with tiers/prices
    // These are the source of truth - Pass 2 MUST NOT change them
    // ========================================================================
    const pass1InvestmentSummary = report.destination_report?.recommendedInvestments || 
                                   report.page4_numbers?.investmentSummary || {};
    const pass1Phases = report.page3_journey?.phases || report.destination_report?.page3_journey?.phases || [];
    const pass1Total = report.page4_numbers?.investmentSummary?.totalFirstYearInvestment || 
                       report.destination_report?.analysis?.investmentSummary?.totalFirstYearInvestment || '';
    
    // ========================================================================
    // CRITICAL: Extract Pass 1's SCORES - these MUST NOT be recalculated
    // Use Destination Clarity from comprehensive analysis if available
    // ========================================================================
    const pass1ClarityScore = destinationClarity?.score ||
                              report.page1_destination?.clarityScore ||
                              report.destination_report?.page1_destination?.clarityScore ||
                              null;
    const pass1GapScore = report.page2_gaps?.gapScore ||
                          report.destination_report?.page2_gaps?.gapScore ||
                          report.destination_report?.analysis?.discoveryScores?.gapScore ||
                          null;
    
    console.log('[Pass2] 📊 Pass 1 Scores (MUST PRESERVE):');
    console.log(`  - Clarity Score: ${pass1ClarityScore}`);
    console.log(`  - Gap Score: ${pass1GapScore}`);
    
    /**
     * Strip stutter from price strings.
     * "£2,000 — when ready — when ready — when ready" → "£2,000"
     * "£4,500 — when ready/year — when ready" → "£4,500/year"
     * Returns ONLY the raw price and period.
     */
    function cleanPrice(raw: string): string {
      if (!raw) return '';
      const priceMatch = raw.match(/£[\d,]+(?:\s*\/\s*(?:month|year|quarter))?/);
      if (priceMatch) {
        return priceMatch[0].replace(/\s+/g, '');
      }
      let price = raw;
      price = price.replace(/\s*—\s*when ready/gi, '');
      price = price.replace(/\s*when ready/gi, '');
      price = price.replace(/\s*—\s*$/g, '');
      return price.trim();
    }

    // Build a map of service -> exact price from Pass 1
    const pass1ServicePrices: Record<string, { service: string; tier: string; price: string }> = {};
    
    // Extract from recommendedInvestments array
    const pass1Investments = report.destination_report?.recommendedInvestments || 
                             report.destination_report?.analysis?.recommendedInvestments || [];
    for (const inv of pass1Investments) {
      const code = inv.code || inv.serviceCode || '';
      if (code) {
        pass1ServicePrices[code] = {
          service: inv.service || inv.serviceName || code,
          tier: inv.recommendedTier || inv.tier || '',
          price: cleanPrice(inv.investment || inv.price || '')
        };
      }
    }
    
    // Also extract from phases if not already captured
    for (const phase of pass1Phases) {
      const code = phase.enabledByCode || '';
      if (code && !pass1ServicePrices[code]) {
        pass1ServicePrices[code] = {
          service: phase.enabledBy || code,
          tier: phase.tier || '',
          price: cleanPrice(phase.price || phase.investment || '')
        };
      }
    }
    // Override: Systems & Process Audit is always £2,000 (Tier 1) — correct any £1,500 from legacy/DB
    if (pass1ServicePrices['systems_audit']) {
      const p = pass1ServicePrices['systems_audit'].price || '';
      if (/1[,.]?500|£1\s*,?\s*500/i.test(p)) {
        pass1ServicePrices['systems_audit'].price = '£2,000';
        console.log('[Pass2] 📊 Overrode systems_audit price to £2,000 (was ', p, ')');
      }
    }
    console.log('[Pass2] Systems Audit price after override:', pass1ServicePrices['systems_audit']?.price ?? 'no systems_audit in pass1ServicePrices');
    
    console.log('[Pass2] 📊 Pass 1 Service Decisions (MUST USE THESE PRICES):');
    Object.entries(pass1ServicePrices).forEach(([code, info]) => {
      console.log(`  - ${code}: ${info.service} | ${info.tier || 'no tier'} | ${info.price}`);
    });
    console.log(`[Pass2] 📊 Pass 1 Total Investment: ${pass1Total}`);

    // ========================================================================
    // CRITICAL: Inject Pass 1's EXACT service prices into the prompt
    // These are MANDATORY - the LLM must NOT change them
    // ========================================================================
    let servicePriceConstraints = '';
    if (Object.keys(pass1ServicePrices).length > 0) {
      servicePriceConstraints = `

============================================================================
🚨 MANDATORY SERVICE PRICES - DO NOT CHANGE THESE
============================================================================
Pass 1 has calculated the EXACT services, tiers, and prices for this client.
You MUST use these EXACT prices in page3_journey phases and page4_numbers investment.

SERVICES AND PRICES (USE THESE EXACTLY):
`;
      for (const [code, info] of Object.entries(pass1ServicePrices)) {
        servicePriceConstraints += `- ${info.service}${info.tier ? ` (${info.tier})` : ''}: ${info.price}\n`;
      }
      
      if (pass1Total) {
        servicePriceConstraints += `
TOTAL FIRST YEAR INVESTMENT: ${pass1Total}

⚠️ CRITICAL RULES:
1. In page3_journey.phases, each phase's "price" MUST match these exact amounts
2. In page4_numbers.investment, amounts MUST match these exactly
3. page4_numbers.totalYear1 MUST equal ${pass1Total}
4. DO NOT round, change, or "simplify" these prices
5. If 365 Method/Goal Alignment is listed above, use that EXACT tier and price
`;
      }
      
      console.log('[Pass2] ✅ Injecting Pass 1 service prices as constraints');
    }

    // Fetch context notes
    const { data: contextNotes } = await supabase
      .from('discovery_context_notes')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('is_for_ai_analysis', true)
      .order('created_at', { ascending: true });

    // Fetch document summaries
    const { data: documents } = await supabase
      .from('discovery_uploaded_documents')
      .select('filename, document_type, description, ai_summary')
      .eq('engagement_id', engagementId)
      .eq('is_for_ai_analysis', true);

    // Build the prompt
    // Sanitise: strip trailing punctuation (e.g. "Jack," → "Jack")
    const rawFirst = engagement.client?.name?.split(' ')[0] || '';
    const clientName = rawFirst.replace(/[,;:.!?]+$/, '') || 'they';
    const rawFull = engagement.client?.name || 'Client';
    const fullName = rawFull.replace(/[,;:.!?]+$/, '') || rawFull;
    const companyName = engagement.client?.client_company || 'their business';
    const emotionalAnchors = report.emotional_anchors || {};
    const patterns = report.detection_patterns || {};
    const primaryRecs = report.primary_recommendations || [];
    const secondaryRecs = report.secondary_recommendations || [];

    // Assess data completeness
    const dataCompleteness = assessDataCompleteness(emotionalAnchors);
    console.log(`[Pass2] Data completeness: ${dataCompleteness.score}% (${dataCompleteness.status})`);
    console.log(`[Pass2] Missing critical: ${dataCompleteness.missingCritical.join(', ') || 'None'}`);

    // ========================================================================
    // ENHANCEMENT 1: Extract "Never Had Break" Emotional Anchor
    // ========================================================================
    const discoveryData = engagement.discovery?.responses || engagement.discovery || {};
    const breakResponse = (
      discoveryData.rl_last_break || 
      discoveryData.dd_last_real_break || 
      discoveryData.last_break || 
      ''
    ).toLowerCase();
    
    const neverHadBreak = breakResponse.includes('never') || 
                          breakResponse.includes('not once') || 
                          breakResponse.includes("haven't") || 
                          breakResponse.includes("can't remember");
    
    if (neverHadBreak) {
      console.log('[Pass2] 🎯 DETECTED: Client has never had a proper break - will use in closing');
    }

    // ========================================================================
    // COO APPROPRIATENESS CHECK - Block COO when not appropriate
    // ========================================================================
    const discoveryResponses = engagement.discovery?.responses || {};
    
    // Check conditions that make COO NOT appropriate
    const founderDependency = (discoveryResponses.sd_founder_dependency || '').toLowerCase();
    const ownerHours = (discoveryResponses.dd_owner_hours || discoveryResponses.dd_weekly_hours || '').toLowerCase();
    const externalView = (discoveryResponses.dd_external_view || discoveryResponses.dd_work_life_balance || '').toLowerCase();
    const avoidedConversation = (discoveryResponses.dd_avoided_conversation || '').toLowerCase();
    const hardTruth = (discoveryResponses.dd_hard_truth || '').toLowerCase();
    
    // Business runs fine without founder - doesn't need ongoing COO
    const businessRunsFine = founderDependency.includes('run fine') || 
                             founderDependency.includes('tick') ||
                             founderDependency.includes('optional') ||
                             founderDependency.includes('minor issues') ||
                             founderDependency.includes('team would cope') ||
                             founderDependency.includes('runs smoothly');
    
    // Owner works reasonable hours - doesn't need COO
    const reasonableHours = ownerHours.includes('under 30') || 
                            ownerHours.includes('30-40') ||
                            ownerHours.includes('less than') ||
                            ownerHours.includes('<30') ||
                            ownerHours.includes('<40');
    
    // Good work/life balance - doesn't need COO
    const hasGoodWorkLifeBalance = externalView.includes('well') ||
                                   externalView.includes('good') ||
                                   externalView.includes('healthy') ||
                                   externalView.includes('balance');
    
    // One-time restructuring need (redundancies) - needs HR consultant, not ongoing COO
    const isOneTimeRestructuring = avoidedConversation.includes('redundan') ||
                                   avoidedConversation.includes('let go') ||
                                   avoidedConversation.includes('fire') ||
                                   hardTruth.includes('overstaffed') ||
                                   hardTruth.includes('too many') ||
                                   hardTruth.includes('payroll');
    
    // Exit-focused client - adding £45k/year COO costs reduces sale value
    const tuesdayVision = (emotionalAnchors.tuesdayTest || emotionalAnchors.tuesdayVision || '').toLowerCase();
    const fiveYearVision = (discoveryResponses.dd_five_year_vision || '').toLowerCase();
    
    const isExitFocused = fiveYearVision.includes('exit') ||
                          fiveYearVision.includes('sell') ||
                          fiveYearVision.includes('sold') ||
                          tuesdayVision.includes('sold') ||
                          tuesdayVision.includes('sell') ||
                          tuesdayVision.includes('exit') ||
                          tuesdayVision.includes('moved on') ||
                          tuesdayVision.includes('move on');
    
    const shouldBlockCOO = businessRunsFine || reasonableHours || hasGoodWorkLifeBalance || isOneTimeRestructuring || (isExitFocused && businessRunsFine);
    
    // For exit-focused clients, we enforce a specific service ordering
    console.log(`[Pass2] Exit-focused client detection: ${isExitFocused}`);
    if (isExitFocused) {
      console.log(`[Pass2] 🎯 EXIT CLIENT DETECTED - Enforcing: Benchmarking FIRST, then improvements, then Goal Alignment`);
    }
    
    let cooBlockReason = '';
    if (shouldBlockCOO) {
      if (businessRunsFine) cooBlockReason = 'Business runs fine without founder - no ongoing COO needed';
      else if (reasonableHours) cooBlockReason = 'Owner works reasonable hours - no COO needed';
      else if (hasGoodWorkLifeBalance) cooBlockReason = 'Good work/life balance indicates operations are manageable';
      else if (isOneTimeRestructuring) cooBlockReason = 'Redundancy/restructuring is one-time - use HR consultant, not ongoing COO';
      else if (isExitFocused) cooBlockReason = 'Exit-focused client with stable operations - COO costs reduce sale value';
      
      console.log(`[Pass2] 🚫 BLOCKING COO: ${cooBlockReason}`);
    } else {
      console.log(`[Pass2] ✓ COO may be appropriate`);
    }

    // Build recommended services with pricing, filtering out blocked services
    // Business Advisory is ALWAYS blocked until the service line is properly defined
    // Hidden Value is NOT a separate service - it's included in Benchmarking
    const blockedServices = [
      'business_advisory',  // System block: paused until service line is defined
      'hidden_value',       // System block: included in benchmarking
      ...(shouldBlockCOO ? ['fractional_coo', 'combined_advisory'] : []),
      ...blockedServicesFromAdvisor  // Advisor blocks from pin/block UI
    ];
    console.log(`[Pass2] Combined blocked services (system + advisor): ${blockedServices.join(', ')}`);
    
    let recommendedServices = [...primaryRecs, ...secondaryRecs]
      .filter(r => r.recommended)
      .filter(r => !blockedServices.includes(r.code)) // Filter out blocked services
      .map(r => ({
        code: r.code,
        ...SERVICE_DETAILS[r.code],
        score: r.score,
        triggers: r.triggers
      }));

    // ========================================================================
    // FOR INVESTMENT VEHICLES: Force wealth protection service ordering
    // (Session 11 — runs BEFORE exit-focused check)
    // ========================================================================
    const isInvestmentVehicle = clientType === 'investment_vehicle';

    if (isInvestmentVehicle) {
      console.log(`[Pass2] 🏠 INVESTMENT VEHICLE: Forcing wealth protection service order`);

      const investmentVehicleServices = [];

      // PHASE 1: IHT Planning Workshop — ALWAYS first for wealth protection
      investmentVehicleServices.push({
        code: 'iht_planning',
        ...SERVICE_DETAILS['iht_planning'],
        score: 95,
        triggers: ['investment_vehicle', 'iht_exposure', 'wealth_protection'],
        phase: 1,
        rationale: 'IHT exposure is the highest-priority risk for investment vehicles'
      });

      // PHASE 2: Property Portfolio Health Check
      investmentVehicleServices.push({
        code: 'property_health_check',
        ...SERVICE_DETAILS['property_health_check'],
        score: 90,
        triggers: ['investment_vehicle', 'portfolio_performance', 'rationalisation'],
        phase: 2,
        rationale: 'Property-level data needed for rationalisation and delegation decisions'
      });

      // PHASE 3: Family Wealth Transfer Strategy
      investmentVehicleServices.push({
        code: 'wealth_transfer_strategy',
        ...SERVICE_DETAILS['wealth_transfer_strategy'],
        score: 85,
        triggers: ['investment_vehicle', 'succession', 'family_wealth'],
        phase: 3,
        rationale: 'Long-term succession and wealth transfer planning'
      });

      // Check if advisor has pinned any additional services
      for (const pinnedCode of pinnedServices) {
        const alreadyIncluded = investmentVehicleServices.some((s: { code: string }) => s.code === pinnedCode);
        if (!alreadyIncluded && !blockedServices.includes(pinnedCode)) {
          const serviceDetail = SERVICE_DETAILS[pinnedCode];
          if (serviceDetail) {
            investmentVehicleServices.push({
              code: pinnedCode,
              ...serviceDetail,
              score: 80,
              triggers: ['advisor_pinned'],
              pinnedByAdvisor: true
            });
            console.log(`[Pass2] Added advisor-pinned service for investment vehicle: ${pinnedCode}`);
          }
        }
      }

      // Override the recommended services
      recommendedServices = investmentVehicleServices;
      console.log(`[Pass2] INVESTMENT VEHICLE SERVICE ORDER: ${recommendedServices.map((s: { phase?: number; code?: string }) => `${(s as { phase?: number }).phase || '?'}. ${(s as { code?: string }).code}`).join(', ')}`);
    }
    
    // ========================================================================
    // FOR EXIT-FOCUSED CLIENTS: Force correct service ordering
    // ========================================================================
    if (isExitFocused) {
      console.log(`[Pass2] 🎯 EXIT CLIENT: Forcing Benchmarking FIRST, then Goal Alignment`);
      
      // Build the correct exit-focused service order
      const exitOrderedServices = [];
      
      // PHASE 1: Benchmarking & Hidden Value MUST be first
      const benchmarking = {
        code: 'benchmarking',
        ...SERVICE_DETAILS['benchmarking'],
        score: 95,
        triggers: ['exit_focused', 'value_baseline'],
        exitPhase: 1,
        exitRationale: 'Establish baseline value before anything else'
      };
      exitOrderedServices.push(benchmarking);
      
      // PHASE 2: Goal Alignment for ongoing exit support (comes BEFORE business advisory)
      const goalAlignment = {
        code: '365_method',
        ...SERVICE_DETAILS['365_method'],
        score: 90,
        triggers: ['exit_focused', 'accountability'],
        exitPhase: 2,
        exitRationale: '3-year exit plan with ongoing accountability - mid to top tier'
      };
      exitOrderedServices.push(goalAlignment);
      
      // NOTE: Business Advisory is currently EXCLUDED from recommendations
      // It will be added back once the service line is properly defined
      // For now, any advisory work fits within Goal Alignment or as ad-hoc support
      
      // Use the forced ordering
      recommendedServices = exitOrderedServices;
      console.log(`[Pass2] EXIT SERVICE ORDER: ${recommendedServices.map(s => `${s.exitPhase}. ${s.code}`).join(', ')}`);
    }
    
    console.log(`[Pass2] Recommended services after filtering:`, recommendedServices.map(s => s.code));

    // Ensure pinned services are included in recommendations
    for (const pinnedCode of pinnedServices) {
      const alreadyIncluded = recommendedServices.some((s: { code: string }) => s.code === pinnedCode);
      if (!alreadyIncluded && !blockedServices.includes(pinnedCode)) {
        const serviceDetail = SERVICE_DETAILS[pinnedCode];
        if (serviceDetail) {
          recommendedServices.push({
            code: pinnedCode,
            ...serviceDetail,
            score: 85,
            triggers: ['advisor_pinned'],
            pinnedByAdvisor: true
          });
          console.log(`[Pass2] Added advisor-pinned service: ${pinnedCode}`);
        }
      }
    }
    console.log(`[Pass2] Final recommended services: ${recommendedServices.map((s: { code: string }) => s.code).join(', ')}`);
    // Force Systems Audit to £2,000 on recommendedServices (DB/pass1 may have £1,500)
    for (const service of recommendedServices) {
      const code = (service as { code?: string }).code;
      if (code === 'systems_audit' || code === 'systems_and_process') {
        (service as { price?: string }).price = '£2,000';
        (service as { price_amount?: number }).price_amount = 2000;
        console.log('[Pass2] Forced Systems Audit price to £2,000 on recommendedServices');
      }
    }
    console.log('[Pass2] Service prices being sent to LLM:', recommendedServices.map((s: { code?: string; price?: string }) => `${(s as { code?: string }).code}: ${(s as { price?: string }).price ?? 'no price'}`));

    // Build context from notes
    const contextSection = contextNotes?.length 
      ? `\n\nADDITIONAL CONTEXT FROM ADVISOR (from follow-up calls/notes):\n${contextNotes.map(n => `[${n.note_type}] ${n.title}:\n${n.content}`).join('\n\n')}`
      : '';

    // Build document context
    const docSection = documents?.length
      ? `\n\nRELEVANT DOCUMENTS:\n${documents.map(d => `- ${d.filename} (${d.document_type}): ${d.ai_summary || d.description || 'No summary'}`).join('\n')}`
      : '';

    // ========================================================================
    // FETCH ADVISOR FEEDBACK COMMENTS - These override default recommendations
    // ========================================================================
    const { data: feedbackComments } = await supabase
      .from('discovery_analysis_comments')
      .select('*')
      .eq('engagement_id', engagementId)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: true });

    console.log(`[Pass2] Found ${feedbackComments?.length || 0} feedback comments to apply`);

    // Build feedback section for the prompt
    let feedbackSection = '';
    if (feedbackComments && feedbackComments.length > 0) {
      feedbackSection = `

============================================================================
🚨 MANDATORY ADVISOR FEEDBACK - MUST BE APPLIED
============================================================================
The following feedback has been provided by the advisor and MUST be incorporated
into this regeneration. These override any default recommendations or patterns.

`;
      for (const comment of feedbackComments) {
        feedbackSection += `
---
SECTION: ${comment.section_type}
TYPE: ${comment.comment_type} (${comment.comment_type === 'correction' ? 'MUST FIX' : comment.comment_type === 'suggestion' ? 'SHOULD INCORPORATE' : 'FOR LEARNING'})
FEEDBACK: ${comment.comment_text}
${comment.suggested_learning ? `LEARNING TO APPLY: ${comment.suggested_learning}` : ''}
---
`;
      }

      feedbackSection += `
IMPORTANT: When generating pages 1-5, you MUST:
1. Address EVERY correction marked "MUST FIX"
2. Incorporate EVERY suggestion marked "SHOULD INCORPORATE"
3. Apply the learnings to guide service recommendations and narrative tone
4. If feedback mentions specific services should be prioritized (e.g., "benchmarking first"), 
   you MUST reorder the journey phases to reflect this guidance
5. If feedback says a service should NOT be recommended, remove it from the journey
`;
    }

    // Log what feedback will be applied
    if (feedbackComments && feedbackComments.length > 0) {
      console.log('[Pass2] Applying feedback:');
      feedbackComments.forEach(f => {
        console.log(`  - [${f.section_type}] ${f.comment_type}: ${f.comment_text.substring(0, 50)}...`);
      });
    }

    // Load curated opportunities from Phase 2 for the LLM prompt
    const { data: curatedOpportunities } = await supabase
      .from('discovery_opportunities')
      .select('*, service:services(id, code, name, price_amount, price_period)')
      .eq('engagement_id', engagementId)
      .order('severity', { ascending: true });

    const clientVisibleOpps = (curatedOpportunities || []).filter((o: { show_in_client_view?: boolean }) => o.show_in_client_view);
    const pinnedOpps = (curatedOpportunities || []).filter((o: { opportunity_code?: string }) => (o.opportunity_code || '').startsWith('pinned_'));
    console.log(`[Pass2] Loaded ${curatedOpportunities?.length || 0} opportunities (${clientVisibleOpps.length} client-visible, ${pinnedOpps.length} pinned)`);

    const opportunityContext = (curatedOpportunities?.length ?? 0) > 0 ? `

============================================================================
ADVISOR-CURATED SERVICE OPPORTUNITIES (from Phase 2)
============================================================================
The advisor has reviewed the following opportunities and marked some as client-visible.
Your journey phases (Page 3) MUST reference the pinned/recommended services.
Your gap analysis (Page 2) should align with the opportunity themes below.

${(curatedOpportunities || []).map((o: { severity?: string; title?: string; category?: string; financial_impact_amount?: number; show_in_client_view?: boolean; opportunity_code?: string }) =>
  `- [${(o.severity || '').toUpperCase()}] ${o.title || 'Untitled'} (${o.category || 'General'}) — £${Number(o.financial_impact_amount || 0).toLocaleString()} impact${o.show_in_client_view ? ' [CLIENT VISIBLE]' : ''}${(o.opportunity_code || '').startsWith('pinned_') ? ' [ADVISOR PINNED]' : ''}`
).join('\n')}

PINNED SERVICES (advisor wants these in the journey):
${pinnedServices.map((code: string) => {
  const detail = SERVICE_DETAILS[code];
  return detail ? `- ${(detail as { name?: string }).name} (${code}) — £${(detail as { price?: string }).price || 'TBD'}` : `- ${code}`;
}).join('\n')}

BLOCKED SERVICES (do NOT recommend these):
${blockedServicesFromAdvisor.map((code: string) => {
  const detail = SERVICE_DETAILS[code];
  return detail ? `- ${(detail as { name?: string }).name} (${code})` : `- ${code}`;
}).join('\n')}
` : '';

    // Build MANDATORY PRICING section by client type (Session 11 — investment vehicle)
    const mandatoryPricingSection = isInvestmentVehicle
      ? `
PAGE 4 — THE INVESTMENT:

MANDATORY PRICING (INVESTMENT VEHICLE — these override standard prices):
- IHT Planning Workshop: £2,500 (one-off) — Phase 1
- Property Portfolio Health Check: £3,500 (one-off) — Phase 2
- Family Wealth Transfer Strategy: £5,500 (one-off) — Phase 3
- Property Management Sourcing: £1,500 (one-off) — optional/parallel

EXACT SERVICE PRICING (use these figures, do not invent prices):
- IHT Planning Workshop: £2,500 (one-off)
- Property Portfolio Health Check: £3,500 (one-off)
- Family Wealth Transfer Strategy: £5,500 (one-off)
- Property Management Sourcing: £1,500 (one-off)

PRICING RULES:
1. Total Year 1 cost = Phase 1 only = £2,500. Phases 2-3 are "when ready."
2. The "first step" price in Page 5 must be £2,500.
3. Do NOT reference Benchmarking, Systems Audit, or Goal Alignment pricing.

PHASE STRUCTURE:
- Phase 1 (Month 1-3): IHT Planning Workshop — £2,500
- Phase 2 (Month 3-6): Property Portfolio Health Check — £3,500 (when ready)
- Phase 3 (Month 6-12): Family Wealth Transfer Strategy — £5,500 (when ready)

ENABLED BY FORMAT:
- Phase 1: "Enabled by: IHT Planning Workshop (£2,500)"
- Phase 2: "Enabled by: Property Portfolio Health Check (£3,500 — when ready)"
- Phase 3: "Enabled by: Family Wealth Transfer Strategy (£5,500 — when ready)"

DELIVERABLE BOUNDARIES:
- IHT Planning delivers: IHT exposure calculation, nil rate band analysis, BPR exclusion mapping, trust/gifting options, action plan for solicitor, tax advisor introduction
- Property Health Check delivers: yield analysis by property, LTV review, maintenance cost trends, tenant assessment, rationalisation recommendations, portfolio projection
- Wealth Transfer delivers: family governance, next-gen readiness, trust structuring, management succession plan, advisor coordination, family communication planning
- Property Management Sourcing delivers: brief development, candidate evaluation, reference checks, contract negotiation support

Do NOT mix these. IHT Planning does NOT do property-level yield analysis. Property Health Check does NOT do succession planning.

PAGE 5 — NEXT STEPS:

The "Your First Step" section must recommend ONLY the Phase 1 service (IHT Planning Workshop at £2,500).
Do NOT bundle phases. The price in the call-to-action must be £2,500.
`
      : `
PAGE 4 — THE INVESTMENT:

MANDATORY PRICING (these override any other prices you see in the data):
- Systems & Process Audit: £2,000 (NOT £1,500 — this has been updated)
- Industry Benchmarking (Full Package): £2,000
- Goal Alignment Programme (Growth): £4,500/year

EXACT SERVICE PRICING (use these figures, do not invent prices):
- Industry Benchmarking (Full Package): £2,000 (one-off)
- Systems & Process Audit: £2,000 (one-off)
- Goal Alignment Programme (Growth): £4,500/year (ongoing)

PRICING RULES:
1. Total Year 1 cost should reflect ONLY the firm Phase 1 commitment (e.g., £2,000), NOT the sum of all phases. The client is committing to Phase 1 only. Phases 2 and 3 are next steps.
2. List each phase with its price; phases 2+ are offered when the client is ready.
3. The "first step" price in Page 5 must match the Phase 1 price exactly.
4. Do NOT bundle Phase 1 + Phase 2 into a single price. They are separate engagements.

Example format:
- Months 1-3: Know where you stand — £2,000
- Months 3-6: See where the time goes — £2,000 (when ready)
- Months 6-12: Someone in your corner — £4,500/year (when ready)
- Total Year 1 commitment: £2,000

PAGE 5 — NEXT STEPS:

The "Your First Step" section must recommend ONLY the Phase 1 service.
Do NOT bundle Phase 1 + Phase 2 into the first step.
The price in the call-to-action must match Phase 1's price exactly.

If Phase 1 is Benchmarking at £2,000, the CTA should be "£2,000 to know where you stand" — NOT "£3,500 for benchmarking and systems audit."

The systems audit comes AFTER the client has seen the benchmarking results and decided to proceed. Bundling them together undermines the "start small, prove value" approach.
`;

    // ============================================================================
    // THE MASTER PROMPT - Destination-Focused Discovery Report
    // ============================================================================

    const prompt = `You are writing a Destination-Focused Discovery Report for ${clientName} from ${companyName}.

============================================================================
CLIENT TYPE & REPORT FRAMING
============================================================================
Client Type: ${clientType}
Report Framing: ${reportFraming}

${framingInstructions}

============================================================================
THE FUNDAMENTAL PRINCIPLE
============================================================================
We're travel agents selling holidays, not airlines selling seats.

${clientName} doesn't buy "Management Accounts" - they buy knowing which customers are profitable.
They don't buy "Systems Audit" - they buy a week without being the only one who can fix things.
They don't buy "365 Programme" - they buy leaving at 4pm to pick up the kids.

HEADLINE the destination. Service is just how they get there.

============================================================================
WRITING RULES - CRITICAL
============================================================================

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue)
- Delve, delving (say: look at, dig into)
- Crucial, pivotal, vital, key (show why it matters)
- Leverage (say: use)
- Streamline (say: simplify, speed up)
- Optimize (say: improve)
- Landscape (say: market, situation)
- Ecosystem (say: system)
- Synergy (describe the actual benefit)
- Holistic (say: complete, whole)
- Robust (say: strong, reliable)
- Cutting-edge, state-of-the-art (describe what's new)
- Innovative, innovation (show it, don't label it)
- Journey (say: process, path, route)
- Unlock potential (say: enable, allow)
- Empower (say: enable, help)
- "We recommend..." (say the outcome instead)
- "Our services include..." (never headline services)
- "The solution is..." (describe what changes)

BANNED SENTENCE STRUCTURES:
- "Not only X but also Y" parallelisms
- "It's important to note that..."
- "In today's business environment..."
- "At its core..."
- "At the end of the day..."
- Starting with "Importantly," or "Notably,"

WRITING STYLE:
1. Write like you're writing to a friend going through a hard time
2. Use their EXACT words - quote them liberally (8+ times minimum)
3. Short paragraphs (2-3 sentences max)
4. Be specific - use their numbers, their examples, their situations
5. Sound human - contractions, imperfect grammar, conversational
6. Empathy before solutions - name their pain before offering hope
7. Personal anchors - reference spouse names, kids' ages, specific details
8. Services as footnotes - headline the OUTCOME, service is just how

⛔ FABRICATED QUOTE GUARD:
- The client NEVER said "one man band" or "a one-man band." DO NOT use this phrase.
- The client NEVER said "I am a one man band." DO NOT put these words in their mouth.
- Only use EXACT phrases from the assessment responses listed in CLIENT'S OWN WORDS above.
- To describe the client working alone, say "the strategic burden sits with you" or use their actual words about delegation.
${financialDataSection}
${financialHealthSection}
${mandatoryPhrasesSection}
${servicePriceConstraints}
${mandatoryDimensionsPrompt}
${clientTypeGuidance}
${investmentVehicleExtraSection}
============================================================================
DATA COMPLETENESS STATUS
============================================================================
Score: ${dataCompleteness.score}/100 (${dataCompleteness.status})
${dataCompleteness.missingCritical.length > 0 ? `⚠️ MISSING CRITICAL DATA: ${dataCompleteness.missingCritical.join(', ')}` : '✅ All critical data present'}
${dataCompleteness.missingImportant.length > 0 ? `⚠️ MISSING IMPORTANT DATA: ${dataCompleteness.missingImportant.join(', ')}` : '✅ All important data present'}

HANDLING MISSING DATA:
- If tuesdayVision is missing: Acknowledge it warmly, position the discovery call as the first step
- If emergencyLog is missing: Note we don't know what pulls them away yet
- If suspectedTruth is missing: Note we haven't heard their gut feeling on the numbers
- NEVER fabricate quotes or details
- ALWAYS acknowledge gaps honestly but warmly
- Adjust confidence scores downward for missing data
- Remove specific ROI calculations if no supporting data

============================================================================
CLIENT'S OWN WORDS (Use these VERBATIM - these are gold)
============================================================================

THEIR VISION (The Tuesday Test - what their ideal future looks like):
"${emotionalAnchors.tuesdayTest || 'Not provided'}"

THEIR MAGIC FIX (What they'd change first if they could):
"${emotionalAnchors.magicFix || 'Not provided'}"

THEIR CORE FRUSTRATION (What frustrates them most):
"${emotionalAnchors.coreFrustration || 'Not provided'}"

THEIR EMERGENCY LOG (What pulled them away recently):
"${emotionalAnchors.emergencyLog || 'Not provided'}"

HOW THE BUSINESS RELATIONSHIP FEELS (Their metaphor):
"${emotionalAnchors.relationshipMirror || 'Not provided'}"

WHAT THEY'VE SACRIFICED (Personal cost):
"${emotionalAnchors.sacrificeList || 'Not provided'}"

THEIR HARD TRUTH (What they've been avoiding):
"${emotionalAnchors.hardTruth || 'Not provided'}"

WHAT THEY SUSPECT ABOUT THE NUMBERS (Financial gut feeling):
"${emotionalAnchors.suspectedTruth || 'Not provided'}"

WHAT'S HIDDEN FROM TEAM (Worries they don't share):
"${emotionalAnchors.hiddenFromTeam || 'Not provided'}"

THE AVOIDED CONVERSATION (Who they need to talk to):
"${emotionalAnchors.avoidedConversation || 'Not provided'}"

OPERATIONAL FRUSTRATION (Day-to-day friction):
"${emotionalAnchors.operationalFrustration || 'Not provided'}"

ANYTHING ELSE THEY SHARED:
"${emotionalAnchors.finalInsight || 'Not provided'}"
${contextSection}
${docSection}
${feedbackSection}
${opportunityContext}
${neverHadBreak ? `

============================================================================
🎯 POWERFUL EMOTIONAL ANCHOR: "NEVER HAD A PROPER BREAK"
============================================================================
The client has NEVER had a proper break. This is GOLD for the closing.

⛔ YOU MUST USE THIS in page5_nextSteps.theAsk or closingMessage:
   "You've never taken a proper break. Not once. [Rest of closing]"
   
   OR weave it in naturally:
   "You've built a business that runs without you - but you've never actually 
   tested that by taking a proper break. It's time."

This is a powerful emotional anchor - use it to create urgency in the closing.
` : ''}

============================================================================
DETECTED PATTERNS
============================================================================
${patterns.burnoutDetected ? `⚠️ BURNOUT DETECTED (${patterns.burnoutFlags} indicators): ${patterns.burnoutIndicators?.join(', ')}` : 'No burnout pattern detected'}
${patterns.capitalRaisingDetected ? `💰 CAPITAL RAISING INTENT: ${patterns.capitalSignals?.join(', ')}` : 'No capital raising pattern'}
${patterns.lifestyleTransformationDetected ? `🔄 LIFESTYLE TRANSFORMATION: ${patterns.lifestyleSignals?.join(', ')}` : 'No lifestyle pattern'}

Urgency Multiplier: ${patterns.urgencyMultiplier || 1}x
Change Readiness: ${report.change_readiness || 'Unknown'}

============================================================================
RECOMMENDED SERVICES (write these as FOOTNOTES only, not headlines)
============================================================================
${JSON.stringify(recommendedServices, null, 2)}

${shouldBlockCOO ? `
============================================================================
⚠️ CRITICAL: BLOCKED SERVICES - DO NOT RECOMMEND THESE
============================================================================
The following services have been determined to be NOT APPROPRIATE for this client:
- Fractional COO Services (£3,750/month)
- Combined CFO/COO Advisory

REASON: ${cooBlockReason}

DO NOT include these services in any phase of the journey. 
DO NOT mention COO as an enabler.
If the client needs help with redundancies/restructuring, suggest a one-time HR consultant or business advisory support instead.
The client's issues can be addressed through the OTHER services listed above.
` : ''}

============================================================================
🚨 FIX 5: INVESTMENT CAP ENFORCEMENT
============================================================================
${frameworkOverrides?.maxRecommendedInvestment ? `
CRITICAL: This client is cash-strapped. Maximum initial investment recommendation: £${frameworkOverrides.maxRecommendedInvestment}

RULES:
1. The transformation journey's FIRST step must cost ≤ £${frameworkOverrides.maxRecommendedInvestment}
2. The total "to start" investment shown in the Investment Summary must be ≤ £${frameworkOverrides.maxRecommendedInvestment}
3. Subsequent steps can be presented as "when cash flow allows" or as Phase 2/3 next steps but should NOT be included in the headline investment figure
4. Present only the first step as the commitment. Any additional services should be positioned as future phases, not upfront commitments.

EXAMPLE: If benchmarking (£2,000) is the first step and fits within a £3,000 cap, present it as the initial commitment. The £4,500 365 programme should be presented as "Phase 2 — when the benchmarking data confirms the path."

⛔ DO NOT show total investment exceeding £${frameworkOverrides.maxRecommendedInvestment} in the headline "to start" figure.
` : ''}

============================================================================
🚨 FIX 6: HEADLINE FRAMING RULES (Exit vs Growth)
============================================================================
${(() => {
  const exitTimelineLower = String(exitTimeline || '').toLowerCase();
  const adminContextForFraming = engagement?.admin_context_note || engagementData?.admin_context_note || '';
  const adminContextLower = adminContextForFraming.toLowerCase();
  
  // Check exit timeline
  const isActivelyExiting = exitTimelineLower.includes('already exploring') || 
                           exitTimelineLower.includes('1-3 years') ||
                           exitTimelineLower.includes('actively preparing');
  const isFutureExit = exitTimelineLower.includes('3-5 years') || 
                      exitTimelineLower.includes('need to start thinking');
  const isLongTermOrNever = exitTimelineLower.includes('5-10 years') || 
                           exitTimelineLower.includes('never');
  
  // Check admin context
  const notActivelyPreparing = adminContextLower.includes('can exit but don\'t want to') ||
                               adminContextLower.includes('not actively preparing') ||
                               adminContextLower.includes('growth priority');
  
  if (isActivelyExiting && !notActivelyPreparing) {
    return `✅ EXIT CAN BE THE HEADLINE: Client is actively exploring exit (1-3 years). Exit readiness can be the primary framing.`;
  } else if (isFutureExit || notActivelyPreparing) {
    return `⛔ DO NOT LEAD WITH EXIT: 
- Exit timeline is 3-5 years ("need to start thinking") OR
- Admin context indicates "can exit but don't want to" / "not actively preparing" / "growth priority"

HEADLINE SHOULD FOCUS ON:
- Growth/scaling (for growth-stage agencies: "You're sitting on a relationship that could 5x your business — but you can't scale until you solve the people problem.")
- Unlocking the key client relationship
- Breaking through the revenue ceiling
- Immediate operational/growth priorities

Exit should be mentioned as a FUTURE BENEFIT, not the headline theme.`;
  } else if (isLongTermOrNever) {
    return `⛔ DO NOT LEAD WITH EXIT: Exit timeline is 5-10 years or never. Focus on immediate operational/growth priorities.`;
  } else {
    return `✅ Use standard transformation framing.`;
  }
})()}

${isExitFocused ? `
============================================================================
🎯🎯🎯 EXIT-FOCUSED CLIENT - YOU MUST USE THIS EXACT ORDER 🎯🎯🎯
============================================================================
This client wants to EXIT/SELL. The services have been PRE-ORDERED for you.
DO NOT REORDER THEM. Use them in the exact order provided below.

THE SERVICES ABOVE ARE ALREADY IN THE CORRECT ORDER. JUST USE THEM AS-IS:

PHASE 1 (Month 1-3): "${SERVICE_DETAILS['benchmarking'].outcome}"
   Service: ${SERVICE_DETAILS['benchmarking'].name} (${SERVICE_DETAILS['benchmarking'].price})
   Why first: They need to know their value TODAY before planning anything

PHASE 2 (Month 3-12+): "${SERVICE_DETAILS['365_method'].outcome}"
   Service: ${SERVICE_DETAILS['365_method'].name} (${SERVICE_DETAILS['365_method'].price}/year - recommend Growth or Partner tier)
   Why: 3-year exit plan with ongoing accountability, quarterly reviews, strategic support
   NOTE: This is an ANNUAL fee, not monthly. Lite=£1,500/yr, Growth=£4,500/yr, Partner=£9,000/yr

⚠️ IMPORTANT: Business Advisory is NOT available for recommendation right now.
   If the client needs advisory support for restructuring, HR, or exit planning,
   that work is included within the Goal Alignment Programme (Growth or Partner tier).

I REPEAT: The RECOMMENDED SERVICES list above is ALREADY in the correct order.
Phase 1 = First service listed (Benchmarking)
Phase 2 = Second service listed (Goal Alignment)

There are only 2 phases for exit clients. DO NOT add Business Advisory.
` : ''}

============================================================================
🚨 CRITICAL: ADVISOR THINKING PATTERNS - MUST FOLLOW THIS ORDER
============================================================================

FOR EXIT-FOCUSED CLIENTS (someone saying "exit", "sell", "sold", "move on"):

THE CORRECT ORDER IS:

PHASE 1 (Month 1-3): BENCHMARKING & HIDDEN VALUE ANALYSIS - ALWAYS FIRST
   - "You'll Know Where You Stand Today"
   - What's the business worth RIGHT NOW before we do ANYTHING else?
   - Where are the hidden value detractors (founder dependency, customer concentration, etc.)?
   - What's the gap between current value and their exit goal?
   - Price: £2,000 one-time (this is ONE combined service, not separate)

PHASE 2 (Month 3-12+): GOAL ALIGNMENT - The 3-Year Exit Plan
   - "You'll Have Someone In Your Corner"  
   - Get under the hood of what life outside work looks like
   - Create a plan that makes exit exceed all expectations
   - USE GROWTH OR PARTNER TIER (£4,500/year or £9,000/year)
   - NOTE: This is an ANNUAL fee, not monthly!
   - Tier pricing: Lite £1,500/yr, Growth £4,500/yr, Partner £9,000/yr

⛔ WRONG: Recommending "Business Advisory & Exit Planning" - this service is paused
⛔ WRONG: Showing Goal Alignment as monthly pricing - it's ANNUAL
⛔ WRONG: Putting anything before Benchmarking
⛔ WRONG: Listing "Industry Benchmarking" and "Hidden Value Audit" as SEPARATE services
⛔ WRONG: Using old pricing (£3,500 for benchmarking, £2,500 for hidden value)

✅ RIGHT: Benchmarking & Hidden Value is ONE service at £2,000
✅ RIGHT: Goal Alignment SECOND for ongoing support (£4,500-£9,000/year)
✅ RIGHT: Only 2 phases for exit clients, not 3

============================================================================
YOUR TASK - Generate a 5-page Destination-Focused Report
============================================================================

PAGE 3 — THE PATH FORWARD (Journey Phases):

CRITICAL RULES FOR JOURNEY PHASES:
1. Each recommended service gets its OWN dedicated phase. Do NOT bundle deliverables from one service into another service's phase.
2. Only describe deliverables that the named service actually provides. Benchmarking provides financial comparisons and competitive data. It does NOT provide systems mapping, process audits, or operational reviews.
3. Systems & Process Audit is a SEPARATE service that maps operational systems, identifies manual processes, and creates delegation plans. If it's in the recommended services, it MUST have its own phase.
4. Phase 1 is the only phase with a firm price. Phases 2 and 3 are offered as next steps when the client is ready.
5. The "Enabled by:" line at the bottom of each phase must name exactly ONE service with its exact catalog name and price.

ENABLED BY FORMAT (use EXACTLY — do not add extra "when ready" tags):
- Phase 1: "Enabled by: [Service Name] (£X,XXX)"
- Phase 2: "Enabled by: [Service Name] (£X,XXX — when ready)"
- Phase 3: "Enabled by: [Service Name] (£X,XXX/year — when ready)"
Output ONE "when ready" per line maximum. Never repeat it.

PHASE STRUCTURE (when 3 services are recommended):
- Phase 1 (Month 1-3): First service — firm commitment, specific price
- Phase 2 (Month 3-6): Second service — specific price, marked as when ready
- Phase 3 (Month 6-12): Third service — specific price, marked as when ready

DELIVERABLE BOUNDARIES:
- Benchmarking delivers: financial benchmarks against industry peers, competitive positioning, revenue/margin/productivity comparisons, baseline valuation, data for key decisions
- Systems Audit delivers: operational system mapping, process documentation, single-point-of-failure identification, delegation planning, manual vs automated assessment, handoff readiness
- Goal Alignment delivers: quarterly roadmap with milestones, strategic support, exit planning, growth planning, accountability, ongoing advisory relationship

Do NOT mix these. If a bullet point describes "mapping operational systems" or "where time disappears", that belongs in the Systems Audit phase, NOT the Benchmarking phase.

${mandatoryPricingSection}

============================================================================
PAGE 1 — YOUR VISION / THE TUESDAY:
Write this section in FIRST PERSON using the client's own words as much as possible.
The client described their ideal Tuesday in their own voice — preserve that voice.
Use "I wake up", "I'm at my desk", "My role is focused on..." — NOT "You wake up".
This is THEIR vision, spoken in THEIR words. It's more powerful because it comes from them.
Do NOT rewrite their vision into second person.
The rest of the report (Pages 2-5) should use second person ("you", "your") as the advisor speaking to the client.

Return a JSON object with this exact structure:

{
  "page1_destination": {
    "headerLine": "The Tuesday You're Building Towards",
    "visionProvided": true/false,
    "visionVerbatim": "IF PROVIDED: Their Tuesday Test answer in FIRST PERSON. Keep their exact words: 'I wake up', 'I'm at my desk', 'My role is...'. Edit only slightly for flow. Include specific details like leaving times, activities, family names. Do NOT change to second person. IF NOT PROVIDED: A warm acknowledgment that they haven't painted the picture yet, with an invitation to have that conversation.",
    "whatTheyWontBeDoing": ["List of things they specifically said they want to stop doing"],
    "destinationClarityScore": 1-10,
    "clarityExplanation": "One sentence about how clear their vision is. Be honest if data is missing."
  },
  
  "page2_gaps": {
    "headerLine": "The Gap Between Here and There",
    "dataProvided": true/false,
    "openingLine": "A punchy one-liner capturing their core tension. Use their metaphor from relationshipMirror if powerful. e.g. 'You're building for freedom but operating in a prison of your own making.'",
    "gapScore": 1-10,
    "gaps": [
      {
        "category": "operational|financial|strategic|people",
        "priority": "critical|high|medium",
        "title": "Outcome-focused title like 'You Can't Leave' not 'Founder Dependency'",
        "pattern": "Their exact words showing this pattern - DIRECT QUOTES",
        "timeImpact": "Specific hours or pattern",
        "financialImpact": "Specific amount or 'Unknown - you suspect significant'",
        "emotionalImpact": "The personal/relationship/health cost",
        "shiftRequired": "One sentence describing what needs to change"
      }
    ]
  },
  
  "page3_journey": {
    "headerLine": "From Here to [Their Specific Goal]",
    "timelineLabel": {
      "now": "Starting state word like 'Prison' or 'Blind'",
      "month3": "Month 3 state like 'Clarity' or 'Visible'",
      "month6": "Month 6 state like 'Control' or 'Understood'",
      "month12": "Month 12 state like 'Freedom' or 'Designed'"
    },
    "phases": [
      {
        "timeframe": "Month 1-3",
        "headline": "OUTCOME headline like 'You'll Know Your Numbers' NOT service name",
        "whatChanges": [
          "Specific tangible outcome 1",
          "Specific tangible outcome 2",
          "Specific tangible outcome 3"
        ],
        "feelsLike": "Emotional description using their language and metaphors. What the transformation FEELS like.",
        "outcome": "Single sentence: the tangible result they can point to",
        "enabledBy": "Service Name (footnote only)",
        "price": "£X/month or £X one-time"
      }
    ]
  },
  
  "page4_numbers": {
    "headerLine": "The Investment in Your [Their Specific Goal]",
    "dataProvided": true/false,${preBuiltPhrases.valuationRange ? `
    "indicativeValuation": "${preBuiltPhrases.valuationRange}",` : ''}${preBuiltPhrases.hiddenAssetsTotal ? `
    "hiddenAssets": {
      "total": "${preBuiltPhrases.hiddenAssetsTotal}",
      "breakdown": "${preBuiltPhrases.hiddenAssetsBreakdown || ''}",
      "note": "These assets sit OUTSIDE the earnings-based valuation"
    },` : ''}${preBuiltPhrases.grossMarginStrength ? `
    "grossMarginStrength": "${preBuiltPhrases.grossMarginStrength}",` : ''}
    "costOfStaying": {
      "labourInefficiency": "£X - £Y or 'Unknown - we need to assess this'",
      "marginLeakage": "£X or 'Unknown - you suspect significant'",
      "yourTimeWasted": "X hours/year or 'Unknown'",
      "businessValueImpact": "Description of impact"
    },
    "personalCost": "SPECIFIC personal cost using their words. Kids ages, spouse name, health mentions, sacrifices. If not provided, acknowledge we don't know what they've sacrificed yet.",
    "investment": [
      {
        "phase": "Months 1-3",
        "amount": "£X",
        "whatYouGet": "OUTCOME in 5 words, not service name"
      }
    ],
    "totalYear1": "£X",
    "totalYear1Label": "Brief outcome description",
    "returns": {
      "canCalculate": true/false,
      "conservative": {
        "labourGains": "£X or null",
        "marginRecovery": "£X or null",
        "timeReclaimed": "£X or null",
        "total": "£X"
      },
      "realistic": {
        "labourGains": "£X or null",
        "marginRecovery": "£X or null",
        "timeReclaimed": "£X or null",
        "total": "£X"
      }
    },
    "paybackPeriod": "X-Y months",
    "realReturn": "REQUIRED FORMAT: 'The business could be worth [valuation]. Plus [hidden assets total] in hidden assets sitting outside the earnings valuation - [breakdown]. This is value a buyer pays for SEPARATELY. [Then connect to their emotional goal in their own words - what this means for their life, their family, their freedom. DO NOT start with or include the phrase \"But the real return?\" - the frontend adds this automatically.]'"
  },
  
  "page5_nextSteps": {
    "headerLine": "Starting The Journey",
    "thisWeek": {
      "action": "30-minute call to [specific purpose]",
      "tone": "Reassurance this isn't a sales pitch. What will actually happen in the call."
    },
    "firstStep": {
      "headline": "OUTCOME headline, not service name",
      "recommendation": "What to start with and why",
      "theirWordsEcho": "A quote from their assessment that ties to this",
      "simpleCta": "£X to [outcome verb]"
    },
    "theAsk": "2-3 sentences referencing their finalInsight or desire for action. Acknowledge past failures. Offer the practical path.",
    "closingLine": "Let's talk this week.",
    "urgencyAnchor": "Personal anchor with time-based urgency. Kids ages. Health. Marriage. Whatever they mentioned."
  },
  
  "meta": {
    "quotesUsed": ["Array of 8-10 direct quotes used throughout"],
    "personalAnchors": ["Kids ages", "Spouse name", "Health mentions", "Hobby mentions"],
    "urgencyLevel": "high|medium|low",
    "dataCompleteness": ${dataCompleteness.score},
    "readyForClient": ${dataCompleteness.canGenerateClientReport},
    "adminActionsNeeded": ${JSON.stringify(dataCompleteness.adminActionRequired)}
  }
}

============================================================================
PHASE/GAP TITLE TRANSLATIONS
============================================================================

GAPS - Use outcome-focused titles:
| BAD (Problem-Focused) | GOOD (Outcome-Focused) |
|-----------------------|------------------------|
| "Founder Dependency" | "You Can't Leave" |
| "Financial Blindness" | "You're Flying Blind" |
| "Manual Processes" | "Everything Takes Too Long" |
| "No Accountability" | "You Keep Trying Alone" |
| "Key Person Risk" | "It All Sits With You" |

PHASES - Headlines are outcomes:
| SERVICE | BAD HEADLINE | GOOD HEADLINE |
|---------|--------------|---------------|
| Management Accounts | "Financial Reporting" | "You'll Know Your Numbers" |
| Systems Audit | "Operational Assessment" | "You'll See Where The Time Goes" |
| Automation | "Process Automation" | "The Manual Work Disappears" |
| Fractional COO | "Operations Support" | "Someone Else Carries The Load" |
| 365 Programme | "Strategic Coaching" | "You'll Have Someone In Your Corner" |
| Business Advisory | "Exit Planning" | "You'll Know What It's Worth" |

============================================================================
VALIDATION BEFORE OUTPUT
============================================================================

Before returning, verify:
- [ ] Client first name used throughout (not "the client")
- [ ] 8+ direct quotes from their responses
- [ ] Personal anchors appear 3+ times if available
- [ ] NO service names as headlines
- [ ] ALL services appear only in footnotes ("Enabled by:")
- [ ] Cost of waiting includes emotional cost
- [ ] Journey phases are outcomes, not services
- [ ] Missing data acknowledged honestly, not fabricated
- [ ] UK English throughout
- [ ] No banned phrases used
- [ ] meta.readyForClient correctly reflects data completeness`;

    // Call Claude via OpenRouter
    console.log('[Pass2] Calling Claude Opus via OpenRouter...');
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Pass 2'
      },
      body: JSON.stringify({
        model: PASS2_MODEL, // anthropic/claude-opus-4.5 for premium narrative quality
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,  // Slightly higher for more creative narrative
        max_tokens: 16000  // Increased for comprehensive 7-dimension output
      })
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      throw new Error(`OpenRouter API error: ${errText}`);
    }

    const llmData = await llmResponse.json();
    let responseText = llmData.choices[0].message.content.trim();
    
    // Remove markdown code fences if present
    responseText = responseText.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();

    // Extract JSON from response
    let narratives;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        narratives = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      console.error('Response text (first 2000 chars):', responseText.substring(0, 2000));
      throw new Error(`Failed to parse LLM response: ${parseError.message}`);
    }

    // ========================================================================
    // DEBUG: Log what the LLM ACTUALLY returned (before any mapping)
    // ========================================================================
    console.log('[Pass2] 📥 RAW LLM OUTPUT - page1_destination:', JSON.stringify(narratives.page1_destination, null, 2)?.substring(0, 500));
    console.log('[Pass2] 📥 RAW LLM OUTPUT - page2_gaps.gaps count:', narratives.page2_gaps?.gaps?.length || 'NO GAPS ARRAY');
    console.log('[Pass2] 📥 RAW LLM OUTPUT - page5_nextSteps:', JSON.stringify(narratives.page5_nextSteps, null, 2)?.substring(0, 500));

    // ========================================================================
    // POST-PROCESSING: Fix common LLM output issues
    // ========================================================================
    
    // Fix "kk" typos throughout the narratives
    const cleanupText = (obj: any): any => {
      if (!obj) return obj;
      if (typeof obj === 'string') {
        return obj
          .replace(/£(\d+(?:,\d{3})*)kk/g, '£$1k')  // Fix £414kk -> £414k
          .replace(/(\d+(?:,\d{3})*)kk/g, '$1k')    // Fix 414kk -> 414k
          .replace(/££/g, '£')                       // Fix double £
          .replace(/(\d+)%%/g, '$1%');               // Fix double %
      }
      if (Array.isArray(obj)) {
        return obj.map(item => cleanupText(item));
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
          cleaned[key] = cleanupText(obj[key]);
        }
        return cleaned;
      }
      return obj;
    };
    
    // Apply cleanup to all narratives
    narratives = cleanupText(narratives);
    console.log('[Pass2] Applied text cleanup to fix kk typos');
    
    // ========================================================================
    // Session 11 (Fix I-A): Strip fabricated "one man band" from page2_gaps
    // The client never said this — remove it so it cannot appear in the report.
    // ========================================================================
    if (narratives.page2_gaps) {
      const p2 = narratives.page2_gaps;
      const stripOneManBand = (s: string | undefined): string => {
        if (!s || typeof s !== 'string') return s || '';
        return s
          .replace(/\bYou(?:'re| are) a one[- ]man band[^."]*/gi, '')
          .replace(/\bYou described yourself as ["']a one[- ]man band["'][^.]*/gi, '')
          .replace(/\bone[- ]man band\b/gi, 'the strategic burden sits with you')
          .replace(/\s{2,}/g, ' ')
          .trim();
      };
      if (p2.openingLine) {
        const before = p2.openingLine;
        p2.openingLine = stripOneManBand(p2.openingLine);
        if (p2.openingLine !== before) console.log('[Pass2] Stripped "one man band" from page2_gaps.openingLine');
      }
      if (p2.gaps && Array.isArray(p2.gaps)) {
        for (const gap of p2.gaps) {
          if (gap.pattern) {
            const before = gap.pattern;
            gap.pattern = stripOneManBand(gap.pattern);
            if (gap.pattern !== before) console.log('[Pass2] Stripped "one man band" from gap.pattern');
          }
          if (gap.title && /one[- ]man band/i.test(gap.title)) {
            gap.title = gap.title.replace(/\bone[- ]man band\b/gi, 'strategic burden').trim();
          }
        }
      }
    }
    
    // ========================================================================
    // CRITICAL: Map field names to match client view expectations
    // The LLM output uses different field names than the client components expect
    // ========================================================================
    
    // DEBUG: Log what the LLM actually generated for each page
    console.log('[Pass2] 🔍 LLM output structure:', {
      page1_keys: narratives.page1_destination ? Object.keys(narratives.page1_destination) : 'MISSING',
      page2_keys: narratives.page2_gaps ? Object.keys(narratives.page2_gaps) : 'MISSING',
      page3_keys: narratives.page3_journey ? Object.keys(narratives.page3_journey) : 'MISSING',
      page5_keys: narratives.page5_nextSteps ? Object.keys(narratives.page5_nextSteps) : 'MISSING',
    });
    
    // PAGE 1: Comprehensive field mapping
    if (narratives.page1_destination) {
      const p1 = narratives.page1_destination;
      
      // Map ANY vision-related field to visionVerbatim
      if (!p1.visionVerbatim) {
        p1.visionVerbatim = p1.visionNarrative || p1.vision || p1.tuesdayVision || 
                           p1.tuesdayTest || p1.theirVision || p1.clientVision ||
                           p1.narrative || p1.content || p1.text || null;
      }
      
      // Use emotional anchor as fallback for visionVerbatim
      if (!p1.visionVerbatim && emotionalAnchors?.tuesdayTest) {
        p1.visionVerbatim = emotionalAnchors.tuesdayTest;
        console.log('[Pass2] 📝 Using emotionalAnchors.tuesdayTest as visionVerbatim fallback');
      }
      
      // Map clarity score from multiple sources
      if (!p1.destinationClarityScore) {
        p1.destinationClarityScore = p1.clarityScore || p1.clarity || 
                                     destinationClarity?.score || 10;
      }
      p1.clarityScore = p1.destinationClarityScore;
      
      // Ensure clarityExplanation exists
      if (!p1.clarityExplanation && destinationClarity?.reasoning) {
        p1.clarityExplanation = destinationClarity.reasoning;
      }
      
      console.log('[Pass2] ✅ Page 1 field mapping applied:', {
        hasVisionVerbatim: !!p1.visionVerbatim,
        visionSource: p1.visionVerbatim ? 'found' : 'missing',
        clarityScore: p1.destinationClarityScore
      });
    }
    
    // PAGE 2: Comprehensive field mapping for gaps
    if (narratives.page2_gaps) {
      const p2 = narratives.page2_gaps;
      
      // Map ANY gaps array field to gaps
      if (!p2.gaps || !Array.isArray(p2.gaps) || p2.gaps.length === 0) {
        p2.gaps = p2.gapsList || p2.gapList || p2.primaryGaps || p2.allGaps || 
                  p2.issues || p2.problems || p2.challenges || [];
      }
      
      // Ensure gapScore exists
      if (!p2.gapScore && p2.gaps?.length) {
        p2.gapScore = Math.min(10, Math.max(1, Math.round(p2.gaps.length * 1.5)));
      }
      
      // Normalize gap fields within the array
      if (p2.gaps && Array.isArray(p2.gaps)) {
        for (const gap of p2.gaps) {
          // Map pattern field
          if (!gap.pattern) {
            gap.pattern = gap.evidence || gap.quote || gap.theirWords || gap.verbatim || '';
          }
          // Map title field
          if (!gap.title) {
            gap.title = gap.name || gap.headline || gap.issue || gap.gap || 'Gap identified';
          }
          // Map shiftRequired
          if (!gap.shiftRequired) {
            gap.shiftRequired = gap.shift || gap.recommendation || gap.action || gap.fix || '';
          }
        }
      }
      
      console.log('[Pass2] ✅ Page 2 field mapping applied:', {
        hasGaps: !!p2.gaps?.length,
        gapCount: p2.gaps?.length || 0,
        gapScore: p2.gapScore
      });
    }
    
    // PAGE 3: Map feeling → feelsLike for each phase (client view reads feelsLike)
    if (narratives.page3_journey?.phases) {
      for (const phase of narratives.page3_journey.phases) {
        // Map feeling → feelsLike
        if (phase.feeling && !phase.feelsLike) {
          phase.feelsLike = phase.feeling;
        }
        // Also map headline → title if missing
        if (phase.headline && !phase.title) {
          phase.title = phase.headline;
        }
        // Map whatChanges to array if it's a string
        if (typeof phase.whatChanges === 'string') {
          phase.whatChanges = [phase.whatChanges];
        }
      }
      console.log('[Pass2] ✅ Page 3 phase field mapping applied:', {
        phaseCount: narratives.page3_journey.phases.length,
        hasFeelsLike: narratives.page3_journey.phases.every((p: any) => !!p.feelsLike || !!p.feeling)
      });
    }
    
    // PAGE 5: Comprehensive field mapping for next steps
    if (narratives.page5_nextSteps) {
      const p5 = narratives.page5_nextSteps;
      
      // Map thisWeek from various possible fields
      if (!p5.thisWeek) {
        // Try various field names
        const thisWeekSource = p5.thisWeekAction || p5.callThisWeek || p5.weekAction || 
                               p5.nextStep || p5.immediateAction || null;
        if (thisWeekSource) {
          p5.thisWeek = typeof thisWeekSource === 'string' 
            ? { action: thisWeekSource, tone: '' }
            : thisWeekSource;
        } else {
          // Create default thisWeek
          p5.thisWeek = {
            action: '30-minute call to discuss your situation and next steps',
            tone: "This isn't a sales pitch. It's a conversation about where you are and where you want to be."
          };
        }
      } else if (typeof p5.thisWeek === 'string') {
        // Convert string to object format
        p5.thisWeek = { action: p5.thisWeek, tone: '' };
      }
      
      // Map firstStep from various possible fields
      if (!p5.firstStep) {
        const firstStepSource = p5.recommendedFirst || p5.startWith || p5.firstRecommendation ||
                                p5.recommendation || null;
        if (firstStepSource) {
          p5.firstStep = typeof firstStepSource === 'string'
            ? { headline: firstStepSource, recommendation: '', theirWordsEcho: '', simpleCta: '' }
            : firstStepSource;
        }
      }
      
      // Map theAsk → closingMessage if closingMessage is empty
      if (!p5.closingMessage) {
        p5.closingMessage = p5.theAsk || p5.closing || p5.personalNote || p5.message || '';
      }
      
      // Map closingLine → callToAction if callToAction is empty
      if (!p5.callToAction) {
        p5.callToAction = p5.closingLine || p5.cta || "Let's talk this week.";
      }
      
      // NEW: Apply prebuilt closing phrases if available and better
      if (prebuiltPhrases?.closing) {
        // Use prebuilt "never had break" anchor if available and not already present
        if (prebuiltPhrases.closing.neverHadBreak && 
            !narratives.page5_nextSteps.closingMessage?.toLowerCase().includes('never')) {
          // Prepend the powerful anchor
          narratives.page5_nextSteps.closingMessage = 
            prebuiltPhrases.closing.neverHadBreak + ' ' + 
            (narratives.page5_nextSteps.closingMessage || prebuiltPhrases.closing.theAsk || '');
          console.log('[Pass2] ✅ Applied prebuilt "never had break" anchor to closing');
        }
        
        // Use prebuilt urgency anchor if available
        if (prebuiltPhrases.closing.urgencyAnchor && !narratives.page5_nextSteps.urgencyAnchor) {
          narratives.page5_nextSteps.urgencyAnchor = prebuiltPhrases.closing.urgencyAnchor;
        }
      }
      
      console.log('[Pass2] ✅ Page 5 field mapping applied:', {
        hasThisWeek: !!narratives.page5_nextSteps.thisWeek,
        hasFirstStep: !!narratives.page5_nextSteps.firstStep,
        hasClosingMessage: !!narratives.page5_nextSteps.closingMessage
      });
    }
    
    // ========================================================================
    // POST-PROCESSING: ENFORCE HEADLINE FRAMING (Exit vs Growth)
    // ========================================================================
    {
      const adminCtxNote = engagement?.admin_context_note || engagementData?.admin_context_note || '';
      const adminCtxLower = adminCtxNote.toLowerCase();
      const exitTimelineStr = String(exitTimeline || '').toLowerCase();
      
      const shouldNotLeadWithExit = 
        adminCtxLower.includes('can exit but don') ||
        adminCtxLower.includes('not actively preparing') ||
        adminCtxLower.includes('growth priority') ||
        exitTimelineStr.includes('3-5 years') ||
        exitTimelineStr.includes('5-10 years') ||
        exitTimelineStr.includes('never');
      
      const headline = narratives.meta?.headline || '';
      
      console.log('[Pass2] 🏷️ Headline framing check:', {
        shouldNotLeadWithExit,
        headline: headline.substring(0, 80),
        adminCtxSnippet: adminCtxLower.substring(0, 60),
        exitTimeline: exitTimelineStr.substring(0, 40)
      });
      
      if (shouldNotLeadWithExit && headline) {
        // Check if headline contains exit-focused language
        const isExitFocused = /exit/i.test(headline) || 
                              /building for.*£\d/i.test(headline) ||
                              /preparing to sell/i.test(headline);
        
        if (isExitFocused) {
          console.warn('[Pass2] ⚠️ Headline leads with exit despite context. Replacing.');
          
          // Try to find a better headline from the gaps
          const gaps = narratives.page2_gaps?.gaps || [];
          const growthGap = gaps.find((g: any) => {
            const title = (g.title || '').toLowerCase();
            return title.includes('relationship') || 
                   title.includes('revenue') ||
                   title.includes('growth') ||
                   title.includes('£1m') ||
                   title.includes('ceiling') ||
                   title.includes('engine');
          });
          
          if (growthGap?.title) {
            narratives.meta.headline = growthGap.title;
            console.log('[Pass2] ✅ Replaced headline with gap title:', growthGap.title);
          } else {
            // Fallback: rewrite to remove exit framing
            let newHeadline = headline
              .replace(/You're building for a £\d+[MmKk]? exit but/i, "You're growing but")
              .replace(/building for .* exit/i, 'building something significant')
              .replace(/exit-ready/gi, 'scalable');
            
            // If it still mentions exit, use a generic growth headline
            if (/exit/i.test(newHeadline)) {
              newHeadline = "You're stuck at half a million with the growth opportunity of a lifetime sitting right in front of you.";
            }
            
            narratives.meta.headline = newHeadline;
            console.log('[Pass2] ✅ Rewrote headline to:', newHeadline);
          }
        }
      }
    }
    
    // ========================================================================
    // CRITICAL: Enforce Pass 1 service prices in LLM output
    // The LLM might have ignored our constraints, so we fix them here
    // ========================================================================
    if (Object.keys(pass1ServicePrices).length > 0) {
      console.log('[Pass2] 🔧 Enforcing Pass 1 service prices...');
      
      // Fix page3_journey.phases prices
      if (narratives.page3_journey?.phases) {
        console.log('[Pass2] Fixing page3_journey.phases prices...');
        
        for (let i = 0; i < narratives.page3_journey.phases.length; i++) {
          const phase = narratives.page3_journey.phases[i];
          const searchText = `${phase.enabledBy || ''} ${phase.headline || ''} ${phase.title || ''} ${phase.feelsLike || ''}`.toLowerCase();
          
          console.log(`[Pass2]   Phase[${i}]: "${phase.enabledBy}" - searching in: "${searchText.substring(0, 80)}..."`);
          
          let matched = false;
          for (const [code, info] of Object.entries(pass1ServicePrices)) {
            const isMatch = (
              (code === '365_method' && (
                searchText.includes('365') ||
                searchText.includes('goal') ||
                searchText.includes('alignment') ||
                searchText.includes('corner') ||
                searchText.includes('accountab')
              )) ||
              (code === 'benchmarking' && (
                searchText.includes('benchmark') ||
                searchText.includes('hidden value') ||
                searchText.includes('where you stand') ||
                searchText.includes('value analysis')
              )) ||
              (code === 'management_accounts' && (
                searchText.includes('management account') ||
                searchText.includes('know your number') ||
                searchText.includes('financial clarity')
              )) ||
              (code === 'systems_audit' && (
                searchText.includes('systems audit') ||
                searchText.includes('where the time goes') ||
                searchText.includes('operational')
              )) ||
              (code === 'automation' && (
                searchText.includes('automat') ||
                searchText.includes('manual work disappears')
              )) ||
              (code === 'fractional_cfo' && (
                searchText.includes('cfo') ||
                searchText.includes('financial leadership')
              )) ||
              (code === 'fractional_coo' && (
                searchText.includes('coo') ||
                searchText.includes('carries the load')
              ))
            );
            
            if (isMatch) {
              const oldPrice = phase.price;
              phase.price = info.price;
              matched = true;
              
              if (info.tier && code === '365_method' && !phase.enabledBy.toLowerCase().includes(info.tier.toLowerCase())) {
                const oldEnabledBy = phase.enabledBy;
                phase.enabledBy = `Goal Alignment Programme (${info.tier})`;
                console.log(`[Pass2]   ✓ Updated enabledBy: "${oldEnabledBy}" → "${phase.enabledBy}"`);
              }
              
              if (oldPrice !== info.price) {
                console.log(`[Pass2]   ✓ Fixed: ${phase.enabledBy} (${code}) from "${oldPrice}" → "${info.price}"`);
              } else {
                console.log(`[Pass2]   ✓ Already correct: ${phase.enabledBy} (${code}) = "${info.price}"`);
              }
              break;
            }
          }
          
          if (!matched) {
            console.log(`[Pass2]   ⚠️ No match found for: "${phase.enabledBy}" with price "${phase.price}"`);
          }
        }
      }
      
      // Fix page4_numbers.investment array
      if (narratives.page4_numbers?.investment) {
        console.log('[Pass2] Fixing page4_numbers.investment items...');
        for (const inv of narratives.page4_numbers.investment) {
          const text = `${inv.amount || ''} ${inv.whatYouGet || ''} ${inv.phase || ''}`.toLowerCase();
          if ((text.includes('time goes') || text.includes('systems') || text.includes('audit')) && /1[,.]?500|£1\s*,?\s*500/.test(String(inv.amount || ''))) {
            inv.amount = '£2,000';
            console.log('[Pass2]   ✓ Overrode Systems Audit amount to £2,000 in page4 investment');
          }
        }
        for (let i = 0; i < narratives.page4_numbers.investment.length; i++) {
          const inv = narratives.page4_numbers.investment[i];
          const searchText = `${inv.phase || ''} ${inv.service || ''} ${inv.whatYouGet || ''} ${inv.description || ''}`.toLowerCase();
          
          console.log(`[Pass2]   Investment[${i}]: "${inv.phase}" - searching in: "${searchText.substring(0, 80)}..."`);
          
          let matched = false;
          for (const [code, info] of Object.entries(pass1ServicePrices)) {
            const isMatch = (
              (code === '365_method' && (
                searchText.includes('365') ||
                searchText.includes('goal') ||
                searchText.includes('alignment') ||
                searchText.includes('corner') ||
                searchText.includes('accountab')
              )) ||
              (code === 'benchmarking' && (
                searchText.includes('benchmark') ||
                searchText.includes('hidden value') ||
                searchText.includes('where you stand') ||
                searchText.includes('value analysis')
              )) ||
              (code === 'management_accounts' && (
                searchText.includes('management account') ||
                searchText.includes('know your number') ||
                searchText.includes('financial clarity')
              )) ||
              (code === 'systems_audit' && (
                searchText.includes('systems audit') ||
                searchText.includes('where the time goes') ||
                searchText.includes('operational')
              )) ||
              (code === 'automation' && (
                searchText.includes('automat') ||
                searchText.includes('manual work disappears')
              )) ||
              (code === 'fractional_cfo' && (
                searchText.includes('cfo') ||
                searchText.includes('financial leadership')
              )) ||
              (code === 'fractional_coo' && (
                searchText.includes('coo') ||
                searchText.includes('carries the load')
              ))
            );
            
            if (isMatch) {
              const oldAmount = inv.amount;
              inv.amount = info.price;
              matched = true;
              
              if (oldAmount !== info.price) {
                console.log(`[Pass2]   ✓ Fixed: ${inv.phase} (${code}) from "${oldAmount}" → "${info.price}"`);
              } else {
                console.log(`[Pass2]   ✓ Already correct: ${inv.phase} (${code}) = "${info.price}"`);
              }
              break;
            }
          }
          
          if (!matched) {
            console.log(`[Pass2]   ⚠️ No match found for: "${inv.phase}" with amount "${inv.amount}"`);
          }
        }
      }
      
      // Fix page4_numbers.totalYear1 if we have it from Pass 1
      if (pass1Total && narratives.page4_numbers) {
        const oldTotal = narratives.page4_numbers.totalYear1;
        narratives.page4_numbers.totalYear1 = pass1Total;
        if (!narratives.page4_numbers.totalYear1Label) {
          narratives.page4_numbers.totalYear1Label = 'To start the journey';
        }
        if (oldTotal !== pass1Total) {
          console.log(`[Pass2] Fixed totalYear1 from "${oldTotal}" → "${pass1Total}"`);
        }
      }
      
      console.log('[Pass2] ✅ Pass 1 service prices enforced');
    }

    // ========================================================================
    // FINAL SAFETY NET: strip stutter from ALL enabled-by fields
    // This catches anything that cleanJourneyPhases missed
    // ========================================================================
    if (narratives.page3_journey?.phases) {
      for (const phase of narratives.page3_journey.phases) {
        for (const field of ['enabledBy', 'enabled_by', 'service', 'serviceLine']) {
          if (phase[field] && typeof phase[field] === 'string') {
            const before = phase[field];
            phase[field] = stripStutter(phase[field]);
            if (before !== phase[field]) {
              console.log(`[Pass2] 🧹 Final stutter strip: "${before}" → "${phase[field]}"`);
            }
          }
        }
      }
    }

    // ========================================================================
    // MECHANICAL RETURNS CALCULATION
    // The LLM cannot reliably calculate returns. We compute from Pass 1 CoI.
    // ========================================================================

    const coiData = comprehensiveAnalysis?.costOfInaction;
    const totalInvestmentYear1 = (() => {
      // Parse the total year 1 investment from Pass 1
      const totalStr = pass1Total || narratives.page4_numbers?.totalYear1 || '';
      const match = totalStr.replace(/[,£]/g, '').match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })();

    if (coiData && coiData.totalAnnual > 0 && totalInvestmentYear1 > 0 && narratives.page4_numbers) {
      const coiAnnual = coiData.totalAnnual;
      const coiComponents = coiData.components || [];
      const timeHorizon = coiData.timeHorizon || 3;

      // Conservative: 30% of estimated annual CoI recovered in Year 1
      // Realistic: 60% of estimated annual CoI recovered in Year 1
      const conservativeRecovery = Math.round(coiAnnual * 0.3);
      const realisticRecovery = Math.round(coiAnnual * 0.6);

      // Build component breakdown
      const founderTime = coiComponents.find((c: any) => c.category?.includes('Founder'));
      const concentration = coiComponents.find((c: any) => c.category?.includes('Concentration'));
      const growth = coiComponents.find((c: any) => c.category?.includes('Growth') || c.category?.includes('Delayed'));
      const payrollExcess = coiComponents.find((c: any) => c.category?.includes('Payroll'));

      const conservativeReturn = {
        labourGains: payrollExcess ? `£${Math.round(payrollExcess.annualCost * 0.3 / 1000)}k` : null,
        marginRecovery: (founderTime || concentration)
          ? `£${Math.round(((founderTime?.annualCost || 0) + (concentration?.annualCost || 0)) * 0.3 / 1000)}k`
          : null,
        timeReclaimed: founderTime ? `${Math.round(8 * 0.3)} hours/week freed up` : null,
        total: `£${Math.round(conservativeRecovery / 1000)}k`
      };

      const realisticReturn = {
        labourGains: payrollExcess ? `£${Math.round(payrollExcess.annualCost * 0.6 / 1000)}k` : null,
        marginRecovery: (founderTime || concentration || growth)
          ? `£${Math.round(((founderTime?.annualCost || 0) + (concentration?.annualCost || 0) + (growth?.annualCost || 0)) * 0.6 / 1000)}k`
          : null,
        timeReclaimed: founderTime ? `${Math.round(8 * 0.6)} hours/week freed up` : null,
        total: `£${Math.round(realisticRecovery / 1000)}k`
      };

      // Calculate payback period
      const monthsToPayback = totalInvestmentYear1 > 0
        ? Math.ceil(totalInvestmentYear1 / (realisticRecovery / 12))
        : null;
      const paybackStr = monthsToPayback
        ? `${monthsToPayback}-${Math.min(monthsToPayback + 2, 12)} months`
        : null;

      // Only override if LLM left returns empty or set canCalculate: false
      const existingReturns = narratives.page4_numbers.returns;
      const isReturnEmpty = !existingReturns
        || existingReturns.canCalculate === false
        || !existingReturns.conservative?.total
        || existingReturns.conservative?.total === 'null'
        || existingReturns.conservative?.total === '';

      if (isReturnEmpty) {
        narratives.page4_numbers.returns = {
          canCalculate: true,
          conservative: conservativeReturn,
          realistic: realisticReturn
        };

        if (!narratives.page4_numbers.paybackPeriod || narratives.page4_numbers.paybackPeriod.includes('confirm')) {
          narratives.page4_numbers.paybackPeriod = paybackStr || 'Within first year';
        }

        console.log(`[Pass2] 📊 Mechanical returns computed from CoI data:`);
        console.log(`  - CoI annual: £${Math.round(coiAnnual / 1000)}k (${coiComponents.length} components)`);
        console.log(`  - Investment Year 1: £${Math.round(totalInvestmentYear1 / 1000)}k`);
        console.log(`  - Conservative: ${conservativeReturn.total}`);
        console.log(`  - Realistic: ${realisticReturn.total}`);
        console.log(`  - Payback: ${paybackStr || 'TBC'}`);
      } else {
        console.log(`[Pass2] Returns already populated by LLM — skipping mechanical override`);
      }
    } else {
      console.log(`[Pass2] ⚠️ Cannot compute returns: coiAnnual=${coiData?.totalAnnual || 0}, investment=${totalInvestmentYear1}`);

      if (narratives.page4_numbers) {
        const r = narratives.page4_numbers.returns;
        const hasLLMReturns = r?.conservative?.total &&
                              r.conservative.total !== 'null' &&
                              r.conservative.total !== '' &&
                              !r.conservative.total.toLowerCase().includes('confirm');

        if (!hasLLMReturns) {
          narratives.page4_numbers.returns = null;
          if (narratives.page4_numbers.paybackPeriod?.toLowerCase().includes('confirm')) {
            narratives.page4_numbers.paybackPeriod = null;
          }
          console.log(`[Pass2] Removed empty returns and TBC payback to prevent blank UI`);
        }
      }
    }

    // ========================================================================
    // CRITICAL: Override LLM scores with Pass 1's calculated scores
    // The LLM should NOT recalculate these - they're data, not narrative
    // ========================================================================
    if (pass1ClarityScore !== null && narratives.page1_destination) {
      const llmClarityScore = narratives.page1_destination.destinationClarityScore || 
                              narratives.page1_destination.clarityScore;
      narratives.page1_destination.clarityScore = pass1ClarityScore;
      narratives.page1_destination.destinationClarityScore = pass1ClarityScore;
      
      if (llmClarityScore !== pass1ClarityScore) {
        console.log(`[Pass2] ✅ Fixed clarityScore: LLM gave ${llmClarityScore} → Pass 1's ${pass1ClarityScore}`);
      }
    }
    
    if (pass1GapScore !== null && narratives.page2_gaps) {
      const llmGapScore = narratives.page2_gaps.gapScore;
      narratives.page2_gaps.gapScore = pass1GapScore;
      
      if (llmGapScore !== pass1GapScore) {
        console.log(`[Pass2] ✅ Fixed gapScore: LLM gave ${llmGapScore} → Pass 1's ${pass1GapScore}`);
      }
    }

    // ========================================================================
    // ENHANCEMENT 6: Enforce Service Catalog on Journey Phases
    // LLM selects which services are relevant, but system defines names/prices
    // ========================================================================
    if (narratives.page3_journey?.phases) {
      console.log('[Pass2] 🔧 Normalising journey phases from registry...');
      narratives.page3_journey = cleanJourneyPhases(narratives.page3_journey, clientTurnover ?? undefined);
      // Clean price/investment fields on journey phases to prevent stutter accumulation
      for (const phase of narratives.page3_journey.phases) {
        if (phase.price) phase.price = cleanPrice(phase.price);
        if (phase.investment) phase.investment = cleanPrice(phase.investment);
      }
      console.log('[Pass2] 🧹 Cleaned price/investment fields on journey phases');
      // Total Year 1 = Phase 1 commitment only (phases 2+ are "when ready")
      const firstPhase = narratives.page3_journey.phases[0];
      const firstPriceStr = firstPhase?.price || firstPhase?.investmentAmount || '';
      const firstPriceMatch = firstPriceStr.match(/[\d,]+/);
      const firstPhasePrice = firstPriceMatch ? parseInt(firstPriceMatch[0].replace(/,/g, ''), 10) : 0;
      if (firstPhasePrice > 0 && narratives.page4_numbers) {
        narratives.page4_numbers.totalYear1 = `£${firstPhasePrice.toLocaleString()}`;
        narratives.page4_numbers.totalYear1Label = 'To start the journey';
        narratives.page4_numbers.toStartTheJourney = `£${firstPhasePrice.toLocaleString()}`;
        console.log('[Pass2] ✅ Total Year 1 commitment (Phase 1 only):', narratives.page4_numbers.totalYear1);
      }
    }
    
    // ========================================================================
    // ENHANCEMENT 6b: Calibrate Gap Score Using System Rules
    // ========================================================================
    if (narratives.page2_gaps) {
      const originalScore = narratives.page2_gaps.gapScore || 6;
      narratives.page2_gaps.gapScore = calibrateGapScore(
        originalScore,
        comprehensiveAnalysis,
        emotionalAnchors
      );
    }
    
    // ========================================================================
    // ENHANCEMENT 6c: Enforce Emotional Anchors in Closing
    // ========================================================================
    if (narratives.page5_next_steps?.closingMessage || narratives.page5_nextSteps?.closingMessage) {
      const closing = narratives.page5_next_steps || narratives.page5_nextSteps;
      if (closing.closingMessage) {
        closing.closingMessage = enforceEmotionalAnchors(closing.closingMessage, emotionalAnchors);
      }
      if (closing.theAsk) {
        closing.theAsk = enforceEmotionalAnchors(closing.theAsk, emotionalAnchors);
      }
      if (closing.urgencyAnchor) {
        closing.urgencyAnchor = enforceEmotionalAnchors(closing.urgencyAnchor, emotionalAnchors);
      }
    }
    
    // ========================================================================
    // ENHANCEMENT 7: Ensure page4_numbers has calculated values
    // ========================================================================
    if (narratives.page4_numbers) {
      // Add indicative valuation if not present
      if (preBuiltPhrases.valuationRange && !narratives.page4_numbers.indicativeValuation) {
        narratives.page4_numbers.indicativeValuation = preBuiltPhrases.valuationRange;
        console.log('[Pass2] 📊 Added indicativeValuation to page4_numbers:', preBuiltPhrases.valuationRange);
      }
      
      // Add hidden assets if not present
      if (preBuiltPhrases.hiddenAssetsTotal && !narratives.page4_numbers.hiddenAssets) {
        narratives.page4_numbers.hiddenAssets = {
          total: preBuiltPhrases.hiddenAssetsTotal,
          breakdown: preBuiltPhrases.hiddenAssetsBreakdown || '',
          note: preBuiltPhrases.hiddenAssetsNote || 'These assets sit OUTSIDE the earnings-based valuation'
        };
        console.log('[Pass2] 📊 Added hiddenAssets to page4_numbers:', preBuiltPhrases.hiddenAssetsTotal);
      }
      
      // Add gross margin strength if not present
      if (preBuiltPhrases.grossMarginStrength && !narratives.page4_numbers.grossMarginStrength) {
        narratives.page4_numbers.grossMarginStrength = preBuiltPhrases.grossMarginStrength;
        console.log('[Pass2] 📊 Added grossMarginStrength to page4_numbers:', preBuiltPhrases.grossMarginStrength);
      }

      // Financial Health Snapshot (Session 11) — for frontend and narrative consistency
      const fhsForSave = (comprehensiveAnalysis as any)?.financialHealthSnapshot;
      if (fhsForSave?.hasData) {
        (narratives.page4_numbers as any).financialHealthSnapshot = {
          overallHealth: fhsForSave.overallHealth,
          noteworthyRatios: fhsForSave.noteworthyRatios.map((r: { name: string; value: number; formatted: string; category: string; status: string; narrativePhrase: string; context: string }) => ({
            name: r.name,
            value: r.value,
            formatted: r.formatted,
            category: r.category,
            status: r.status,
            narrativePhrase: r.narrativePhrase,
            context: r.context
          }))
        };
        console.log('[Pass2] 📊 Added financialHealthSnapshot to page4_numbers:', fhsForSave.noteworthyRatios.length, 'noteworthy ratios');
      }
      
      // Productivity suppressed for investment vehicles / small teams (Session 11)
      if ((comprehensiveAnalysis as any)?.productivity?.suppressInReport) {
        (narratives.page4_numbers as any).productivitySuppressed = true;
      }
      
      // Structural GM and operating margin for frontend (Session 11)
      if ((preBuiltPhrases as any).grossMarginIsStructural === 'true') {
        (narratives.page4_numbers as any).grossMarginIsStructural = true;
        const opMargin = (comprehensiveAnalysis as any)?.operatingMarginPct;
        (narratives.page4_numbers as any).operatingMarginPct = opMargin != null ? String(opMargin.toFixed(1)) : null;
      }
    }

    // For investment vehicles: override valuation with NAV when assets dwarf earnings (Session 11)
    if (clientType === 'investment_vehicle' && assetValuation?.hasData) {
      const navValue = assetValuation.netAssets ?? (assetValuation as any).totalAssetValue;
      const earningsValue = comprehensiveAnalysis?.valuation?.conservativeValue;
      if (navValue && earningsValue && navValue > earningsValue * 3 && narratives.page4_numbers) {
        const navM = (navValue / 1000000).toFixed(1);
        const earnLowM = (earningsValue / 1000000).toFixed(1);
        const earnHighM = ((comprehensiveAnalysis?.valuation?.optimisticValue || earningsValue) / 1000000).toFixed(1);
        (narratives.page4_numbers as any).indicativeValuation = `£${navM}M (net asset value)`;
        (narratives.page4_numbers as any).valuationMethod = 'net_asset_value';
        (narratives.page4_numbers as any).valuationNote =
          `For a property investment company, value is asset-based, not earnings-based. ` +
          `The earnings-based range (£${earnLowM}M-£${earnHighM}M) significantly understates the company's worth.`;
        console.log('[Pass2] 🏠 Overrode valuation with NAV for investment vehicle:', navM + 'M');
      }
    }

    // Reframe exit readiness for investment vehicles (Session 11)
    if (clientType === 'investment_vehicle' && narratives.page4_numbers?.exitReadiness) {
      (narratives.page4_numbers as any).exitReadinessNote =
        'For a property company, exit means asset disposal, company dissolution, or share transfer — not a trade sale.';
      console.log('[Pass2] 🏠 Added exit readiness context for investment vehicle');
    }

    // Strip "But the real return?" from realReturn if the LLM included it
    // (the frontend hardcodes this as a prefix — having it in the data creates duplication)
    if (narratives.page4_numbers?.realReturn) {
      narratives.page4_numbers.realReturn = narratives.page4_numbers.realReturn
        .replace(/^But the real return\?\s*/i, '')
        .replace(/\.\s*But the real return\?\s*/i, '. ')
        .trim();
      console.log('[Pass2] 🧹 Stripped "But the real return?" from realReturn to prevent frontend duplication');
    }
    
    // ========================================================================
    // FIX 2: ENFORCE INVESTMENT CAP (post-processing)
    // ========================================================================
    const maxInvestment = frameworkOverrides?.maxRecommendedInvestment;
    if (maxInvestment && narratives.page3_journey?.phases) {
      const phases = narratives.page3_journey.phases;
      let runningTotal = 0;
      
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        // Extract price from various possible fields
        const phasePriceStr = phase.investmentAmount || phase.price || phase.investment || '';
        const priceMatch = phasePriceStr.match(/[\d,]+/);
        const phasePrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : 0;
        
        if (i === 0) {
          // First phase: keep as-is if within cap
          if (phasePrice <= maxInvestment) {
            runningTotal += phasePrice;
            console.log(`[Pass2] 💰 Phase 1 within cap: £${phasePrice} (cap: £${maxInvestment})`);
          } else {
            // Even first phase exceeds cap — flag but keep
            console.warn(`[Pass2] ⚠️ First phase £${phasePrice} exceeds cap £${maxInvestment}`);
            runningTotal += phasePrice;
          }
        } else {
          // Subsequent phases: mark as deferred, remove price from commitment
          phase.deferred = true;
          phase.deferredReason = 'Phase 2 — when cash flow allows';
          // Mark as deferred; cleanJourneyPhases will normalize enabledBy to " (£X — when ready)"
          if (phase.enabledBy && !phase.enabledBy.includes('when ready')) {
            const priceMatch = (phase.price || '').match(/£[\d,]+/);
            phase.enabledBy = priceMatch ? phase.enabledBy.replace(/\(£[\d,]+\)/, `(${priceMatch[0]} — when ready)`) : phase.enabledBy + ' — when ready';
          }
          if (phasePrice > 0) {
            phase.price = phase.price?.replace(/£[\d,]+/, (m: string) => m + ' — when ready') || 'When ready';
            phase.investmentAmount = 'When ready';
          }
          console.log(`[Pass2] 💰 Deferred phase ${i + 1}: ${phase.title || phase.headline} — exceeds investment cap`);
        }
      }
      
      // Override the investment summary to show only committed amount
      if (narratives.page4_numbers) {
        const firstPhasePriceStr = phases[0]?.investmentAmount || phases[0]?.price || '0';
        const firstPriceMatch = firstPhasePriceStr.match(/[\d,]+/);
        const firstPhasePrice = firstPriceMatch ? parseInt(firstPriceMatch[0].replace(/,/g, ''), 10) : 0;
        
        narratives.page4_numbers.totalYear1 = `£${firstPhasePrice.toLocaleString()}`;
        narratives.page4_numbers.totalYear1Label = 'To start the journey';
        narratives.page4_numbers.toStartTheJourney = `£${firstPhasePrice.toLocaleString()}`;
        
        // Fix investment breakdown display
        if (narratives.page4_numbers.investmentBreakdown) {
          const breakdownItems: string[] = [];
          for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            const priceStr = phase.investmentAmount || phase.price || '';
            const service = phase.enabledBy || phase.service || `Phase ${i + 1}`;
            
            if (i === 0) {
              const priceMatch = priceStr.match(/[\d,]+/);
              const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : 0;
              breakdownItems.push(`${service}: £${price.toLocaleString()}`);
            } else {
              breakdownItems.push(`${service}: When ready`);
            }
          }
          narratives.page4_numbers.investmentBreakdown = breakdownItems.join('\n');
        }
        
        console.log(`[Pass2] 💰 Investment cap enforced: showing £${firstPhasePrice} (cap: £${maxInvestment})`);
      }
    }
    
    // ========================================================================
    // FIX 3: ENFORCE HEADLINE FRAMING (post-processing)
    // ========================================================================
    const adminContextLower = String(adminContextNote || '').toLowerCase();
    const exitTimelineLower = String(exitTimeline || '').toLowerCase();
    
    const shouldNotLeadWithExit = 
      adminContextLower.includes('can exit but don') ||
      adminContextLower.includes('not actively preparing') ||
      adminContextLower.includes('growth priority') ||
      exitTimelineLower.includes('3-5 years') ||
      exitTimelineLower.includes('5-10 years') ||
      exitTimelineLower.includes('never');
    
    console.log('[Pass2] Headline check:', { 
      shouldNotLeadWithExit, 
      headline: narratives.meta?.headline || narratives.page2_gaps?.openingLine || 'N/A',
      adminContextLower: adminContextLower.substring(0, 50),
      clientType: clientType || 'unknown'
    });
    
    if (shouldNotLeadWithExit) {
      // Check if headline contains exit-focused language
      const headline = narratives.meta?.headline || 
                      narratives.page2_gaps?.openingLine || 
                      narratives.page1_destination?.headerLine || 
                      '';
      const headlineLower = headline.toLowerCase();
      
      const exitPatterns = [
        /building for .* exit/i,
        /exit.ready/i,
        /preparing to sell/i,
        /your exit/i,
        /£\d+[mk]?\s*exit/i,  // Updated: matches "£5M exit" with optional whitespace
        /exit.*£\d+[mk]?/i
      ];
      
      const isExitFocused = exitPatterns.some(pattern => pattern.test(headline));
      
      if (isExitFocused) {
        console.warn(`[Pass2] ⚠️ Headline leads with exit despite admin context saying otherwise. Original: "${headline}"`);
        
        // Check if there's a better headline from the gap analysis or journey
        const gaps = narratives.page2_gaps?.gaps || [];
        
        // For trading_agency, prioritize gaps containing "relationship" or "£1M"
        let strategicGap: any = null;
        if (clientType === 'trading_agency') {
          strategicGap = gaps.find((g: any) => 
            g.title?.toLowerCase().includes('relationship') || 
            g.title?.includes('£1M') ||
            g.title?.includes('£1 M')
          );
        }
        
        // Fallback to general strategic gaps if no agency-specific match
        if (!strategicGap) {
          strategicGap = gaps.find((g: any) => 
            g.title?.toLowerCase().includes('relationship') || 
            g.title?.toLowerCase().includes('revenue') ||
            g.title?.toLowerCase().includes('growth') ||
            g.title?.toLowerCase().includes('ceiling') ||
            g.title?.toLowerCase().includes('scale')
          );
        }
        
        if (strategicGap) {
          // Use the strategic gap title directly as the headline
          const newHeadline = strategicGap.title;
          if (narratives.meta) narratives.meta.headline = newHeadline;
          if (narratives.page2_gaps) narratives.page2_gaps.openingLine = newHeadline;
          console.log(`[Pass2] ✅ Replaced exit headline with strategic gap: "${newHeadline}"`);
        } else {
          // Generic replacement: strip "exit" framing, keep the operational tension
          const cleaned = headline
            .replace(/building for a £\d+[mk]?\s*exit but/i, 'growing but')
            .replace(/building for .* exit but/i, 'growing but')
            .replace(/exit-ready/gi, 'scalable')
            .replace(/your exit/gi, 'your growth')
            .replace(/£\d+[mk]?\s*exit/gi, 'growth')
            .replace(/exit.*£\d+[mk]?/gi, 'growth');
          
          if (narratives.meta) narratives.meta.headline = cleaned;
          if (narratives.page2_gaps) narratives.page2_gaps.openingLine = cleaned;
          console.log(`[Pass2] ✅ Cleaned exit headline to: "${cleaned}"`);
        }
      }
    }
    
    // ========================================================================
    // ENFORCEMENT: Replace LLM's wrong payroll figure with Pass 1's validated figure
    // The LLM ignores our instructions and recalculates using generic benchmarks.
    // We find ANY payroll figure in the "wrong range" and replace with the correct one.
    // ========================================================================
    if (validatedPayroll.excessAmount && validatedPayroll.excessAmount > 0 && 
        validatedPayroll.turnover && validatedPayroll.staffCostsPct) {
      
      const correctExcess = validatedPayroll.excessAmount;
      const correctBenchmark = validatedPayroll.benchmarkPct || 28;
      const correctK = Math.round(correctExcess / 1000);
      const correctFormatted = correctExcess.toLocaleString();
      
      // Calculate what the LLM likely computed using generic 30% benchmark
      const llmLikelyExcessPct = Math.max(0, validatedPayroll.staffCostsPct - 30);
      const llmLikelyExcess = Math.round((llmLikelyExcessPct / 100) * validatedPayroll.turnover);
      const llmLikelyK = Math.round(llmLikelyExcess / 1000);
      
      // Only proceed if there's a meaningful difference (>£10k gap)
      const gapK = Math.abs(correctK - llmLikelyK);
      
      console.log(`[Pass2] 🔧 Payroll enforcement check:`, {
        correctExcess: `£${correctK}k (£${correctFormatted})`,
        correctBenchmark: `${correctBenchmark}%`,
        llmLikelyExcess: `£${llmLikelyK}k (using 30% default)`,
        gapK: `£${gapK}k`,
        needsReplacement: gapK > 10
      });
      
      if (gapK > 10) {
        let fixed = JSON.stringify(narratives);
        let replacements = 0;
        
        // Define the "wrong range" - LLM could be off by ±10% due to rounding
        const wrongLowK = Math.round(llmLikelyK * 0.9);
        const wrongHighK = Math.round(llmLikelyK * 1.1);
        
        console.log(`[Pass2] Searching for wrong figures in range £${wrongLowK}k - £${wrongHighK}k`);
        
        // PATTERN 1: Match £XXXk format for any value in the wrong range
        for (let k = wrongLowK; k <= wrongHighK; k++) {
          const kPattern = new RegExp(`£${k}k`, 'gi');
          if (kPattern.test(fixed)) {
            console.log(`[Pass2]   Found £${k}k - replacing with £${correctK}k`);
            fixed = fixed.replace(kPattern, `£${correctK}k`);
            replacements++;
          }
        }
        
        // PATTERN 2: Match £XXX,XXX format (full numbers with commas)
        // Generate all plausible wrong full figures
        for (let k = wrongLowK; k <= wrongHighK; k++) {
          // Check for exact thousands (£147,000)
          const exactThousand = (k * 1000).toLocaleString();
          const exactPattern = new RegExp(`£${exactThousand}(?![0-9])`, 'g');
          if (exactPattern.test(fixed)) {
            console.log(`[Pass2]   Found £${exactThousand} - replacing with £${correctFormatted}`);
            fixed = fixed.replace(exactPattern, `£${correctFormatted}`);
            replacements++;
          }
          
          // Check for values with hundreds (£147,500, £147,723, etc.)
          for (let h = 0; h <= 9; h++) {
            for (let t = 0; t <= 9; t++) {
              const fullValue = k * 1000 + h * 100 + t * 10;
              const fullFormatted = fullValue.toLocaleString();
              // Only check if it appears in the string (optimization)
              if (fixed.includes(fullFormatted)) {
                const fullPattern = new RegExp(`£${fullFormatted}(?![0-9])`, 'g');
                if (fullPattern.test(fixed)) {
                  console.log(`[Pass2]   Found £${fullFormatted} - replacing with £${correctFormatted}`);
                  fixed = fixed.replace(fullPattern, `£${correctFormatted}`);
                  replacements++;
                }
              }
            }
          }
        }
        
        // PATTERN 3: Two-year figures (2x the wrong amount)
        const wrongTwoYearLowK = wrongLowK * 2;
        const wrongTwoYearHighK = wrongHighK * 2;
        const correctTwoYearK = correctK * 2;
        
        for (let k = wrongTwoYearLowK; k <= wrongTwoYearHighK; k++) {
          const twoYearPattern = new RegExp(`£${k}k`, 'gi');
          if (twoYearPattern.test(fixed)) {
            console.log(`[Pass2]   Found 2-year figure £${k}k - replacing with £${correctTwoYearK}k`);
            fixed = fixed.replace(twoYearPattern, `£${correctTwoYearK}k`);
            replacements++;
          }
        }
        
        // PATTERN 4: Monthly figures (wrong annual / 12)
        const wrongMonthlyLowK = Math.round(wrongLowK / 12);
        const wrongMonthlyHighK = Math.round(wrongHighK / 12);
        const correctMonthlyK = Math.round(correctK / 12);
        
        if (wrongMonthlyLowK !== correctMonthlyK) {
          for (let k = wrongMonthlyLowK; k <= wrongMonthlyHighK; k++) {
            if (k !== correctMonthlyK && k > 0) {
              const monthlyPattern = new RegExp(`£${k}k\\s*(per\\s*month|/month|monthly)`, 'gi');
              if (monthlyPattern.test(fixed)) {
                console.log(`[Pass2]   Found monthly figure £${k}k - replacing with £${correctMonthlyK}k`);
                fixed = fixed.replace(monthlyPattern, `£${correctMonthlyK}k$1`);
                replacements++;
              }
            }
          }
        }
        
        // PATTERN 5: Fix benchmark percentages (only if our benchmark isn't 30%)
        if (correctBenchmark !== 30) {
          const benchmarkPatterns = [
            { find: /30%\s*benchmark/gi, replace: `${correctBenchmark}% benchmark` },
            { find: /vs\s*(the\s*)?30%/gi, replace: `vs the ${correctBenchmark}%` },
            { find: /versus\s*(the\s*)?30%/gi, replace: `versus the ${correctBenchmark}%` },
            { find: /benchmark\s*(of\s*)?30%/gi, replace: `benchmark of ${correctBenchmark}%` },
            { find: /the\s*30%\s*benchmark/gi, replace: `the ${correctBenchmark}% benchmark` },
            { find: /30%\s*industry/gi, replace: `${correctBenchmark}% industry` },
            { find: /(\d+\.?\d*)%\s*vs\s*30%/gi, replace: `$1% vs ${correctBenchmark}%` },
          ];
          
          for (const pattern of benchmarkPatterns) {
            if (pattern.find.test(fixed)) {
              fixed = fixed.replace(pattern.find, pattern.replace);
              replacements++;
              console.log(`[Pass2]   Fixed benchmark reference: 30% → ${correctBenchmark}%`);
            }
          }
        }
        
        narratives = JSON.parse(fixed);
        
        if (replacements > 0) {
          console.log(`[Pass2] ✅ Made ${replacements} payroll corrections (range £${wrongLowK}k-£${wrongHighK}k → £${correctK}k)`);
        } else {
          console.log(`[Pass2] ⚠️ No replacements made - checking if wrong figures still present...`);
          
          // Debug: check what payroll figures ARE in the output
          const allPayrollMatches = fixed.match(/£\d{2,3}(?:,\d{3})?(?:k|\/year)?/gi);
          if (allPayrollMatches) {
            console.log(`[Pass2] Found these payroll-like figures: ${[...new Set(allPayrollMatches)].join(', ')}`);
          }
        }
        
        // NEW: If we have prebuilt phrases, use them for gap financial impact
        if (prebuiltPhrases?.payroll?.impact && narratives.page2_gaps?.gaps) {
          const payrollImpact = prebuiltPhrases.payroll.impact;
          for (const gap of narratives.page2_gaps.gaps) {
            // Find payroll-related gaps and ensure they use the exact phrase
            if (gap.title?.toLowerCase().includes('payroll') || 
                gap.title?.toLowerCase().includes('staff') ||
                gap.category?.toLowerCase() === 'payroll') {
              gap.financialImpact = payrollImpact;
              console.log(`[Pass2] ✅ Applied prebuilt payroll phrase to gap: "${gap.title}"`);
            }
          }
        }
        
        // Final verification
        const verifyStr = JSON.stringify(narratives);
        const wrongStillPresent = verifyStr.match(/£14[0-9]k|£14[0-9],\d{3}/gi);
        if (wrongStillPresent) {
          console.warn(`[Pass2] ⚠️ May still have wrong figures: ${wrongStillPresent.join(', ')}`);
        } else {
          console.log(`[Pass2] ✓ No wrong payroll figures detected in final output`);
        }
      } else {
        console.log(`[Pass2] ✓ Payroll figures appear correct (gap only £${gapK}k) - no replacement needed`);
      }
    }

    // Log what pages have content
    const pageStatus = {
      page1: !!narratives.page1_destination?.visionVerbatim,
      page2: !!narratives.page2_gaps?.gaps?.length,
      page3: !!narratives.page3_journey?.phases?.length,
      page4: !!narratives.page4_numbers?.investment?.length,
      page5: !!narratives.page5_nextSteps?.thisWeek
    };
    console.log(`[Pass2] Page content status:`, pageStatus);
    
    const emptyPages = Object.entries(pageStatus).filter(([_, hasContent]) => !hasContent).map(([page]) => page);
    if (emptyPages.length > 0) {
      console.warn(`[Pass2] ⚠️ Pages with missing content: ${emptyPages.join(', ')}`);
      console.log(`[Pass2] Response length: ${responseText.length} chars`);
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = llmData.usage?.total_tokens || 0;
    const estimatedCost = (tokensUsed / 1000000) * 3;

    // Use valid database status values (admin_review is NOT a valid status)
    // Valid: pending, pass1_processing, pass1_complete, pass2_processing, generated, approved, published
    // Auto-publish so client portal shows Pass 2 report without a separate "Share" step
    const reportStatus = 'published';
    const engagementStatus = 'published';

    console.log(`[Pass2] Setting status to: ${reportStatus} (data completeness: ${dataCompleteness.score}%)`);

    // Log what we're saving to page4_numbers (for debugging valuation/hidden assets issues)
    console.log('[Pass2] 📄 page4_numbers being saved:', {
      hasIndicativeValuation: !!narratives.page4_numbers?.indicativeValuation,
      indicativeValuation: narratives.page4_numbers?.indicativeValuation,
      hasHiddenAssets: !!narratives.page4_numbers?.hiddenAssets,
      hiddenAssetsTotal: narratives.page4_numbers?.hiddenAssets?.total,
      hasGrossMarginStrength: !!narratives.page4_numbers?.grossMarginStrength,
      grossMarginStrength: narratives.page4_numbers?.grossMarginStrength,
      hasPayrollAnalysis: !!narratives.page4_numbers?.payrollAnalysis,
    });

    // Log exactly what we're saving for debugging
    console.log('[Pass2] 💾 SAVING to database:', {
      engagementId,
      page1_keys: Object.keys(narratives.page1_destination || {}),
      page1_hasVisionVerbatim: !!narratives.page1_destination?.visionVerbatim,
      page2_gapsCount: narratives.page2_gaps?.gaps?.length,
      page5_hasThisWeek: !!narratives.page5_nextSteps?.thisWeek
    });

    // Final cleanup: remove any duplicate "when ready" stutter in full payload before save
    narratives = cleanWhenReadyStutter(narratives);
    if (narratives?.page3_journey) {
      narratives.page3_journey = cleanJourneyPhases(narratives.page3_journey, clientTurnover ?? undefined);
    }
    // Brute-force: clean any "Enabled by:" stutter in the entire JSON before save
    const reportJsonStr = JSON.stringify(narratives);
    const cleanedStr = cleanAllEnabledByStrings(reportJsonStr);
    narratives = JSON.parse(cleanedStr);

    // ========================================================================
    // QUOTE VERIFICATION (Session 11)
    // Detect potential fabricated quotes by checking if quoted text appears
    // in the original assessment responses
    // ========================================================================
    const allResponseText = JSON.stringify(discoveryResponses).toLowerCase();
    const narrativeText = JSON.stringify(narratives);
    const directQuotes = narrativeText.match(/"([^"]{10,80})"/g) || [];
    for (const quote of directQuotes) {
      const cleanQuote = quote.replace(/^"|"$/g, '').toLowerCase().trim();
      if (cleanQuote.length < 15) continue;
      if (cleanQuote.startsWith('inheritance planning')) continue;
      if (cleanQuote.startsWith('having a highly reliable')) continue;
      if (cleanQuote.startsWith('not having someone')) continue;
      if (cleanQuote.startsWith('holidays and time')) continue;
      if (cleanQuote.startsWith('giving it up')) continue;
      if (cleanQuote.startsWith('nothing with respect')) continue;
      if (cleanQuote.startsWith('a normal marriage')) continue;
      if (!allResponseText.includes(cleanQuote)) {
        console.warn(`[Pass2] ⚠️ POTENTIAL FABRICATED QUOTE: "${cleanQuote}" — not found in assessment responses`);
      }
    }

    // Update report with Pass 2 results
    console.log('[Pass2] 📝 Final headline being saved:', narratives.meta?.headline);
    
    const { error: updateError } = await supabase
      .from('discovery_reports')
      .update({
        status: reportStatus,
        destination_report: narratives,
        headline: narratives.meta?.headline || '',
        page1_destination: narratives.page1_destination,
        page2_gaps: narratives.page2_gaps,
        page3_journey: narratives.page3_journey,
        page4_numbers: narratives.page4_numbers,
        page5_next_steps: narratives.page5_nextSteps,
        quotes_used: narratives.meta?.quotesUsed || [],
        personal_anchors: narratives.meta?.personalAnchors || [],
        urgency_level: narratives.meta?.urgencyLevel || 'medium',
        data_completeness_score: dataCompleteness.score,
        data_completeness_status: dataCompleteness.status,
        missing_critical_data: dataCompleteness.missingCritical,
        missing_important_data: dataCompleteness.missingImportant,
        admin_actions_needed: dataCompleteness.adminActionRequired,
        ready_for_client: true,
        published_to_client_at: new Date().toISOString(),
        llm_model: PASS2_MODEL,
        llm_tokens_used: tokensUsed,
        llm_cost: estimatedCost,
        generation_time_ms: processingTime,
        prompt_version: 'v4.0-admin-first',
        pass2_completed_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('engagement_id', engagementId);

    if (updateError) {
      console.error('[Pass2] ❌ Database UPDATE FAILED:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    console.log('[Pass2] ✅ Database update successful');

    // ========================================================================
    // POST-SAVE: Fix Stage 3 headline if it leads with exit inappropriately
    // (reuses exitTimelineLower from FIX 3 above)
    // ========================================================================
    const shouldNotLeadWithExitPostSave =
      exitTimelineLower.includes('3-5 years') ||
      exitTimelineLower.includes('5-10 years') ||
      exitTimelineLower.includes('never');

    if (shouldNotLeadWithExitPostSave) {
      // Check discovery_reports.headline (set by Stage 3)
      const { data: savedReport } = await supabase
        .from('discovery_reports')
        .select('headline')
        .eq('engagement_id', engagementId)
        .maybeSingle();
      
      const savedHeadline = savedReport?.headline || '';
      const exitPatterns = [/exit/i, /building for.*£\d/i, /preparing to sell/i];
      
      if (savedHeadline && exitPatterns.some(p => p.test(savedHeadline))) {
        // Try to use a gap title as the replacement
        const gaps = narratives.page2_gaps?.gaps || [];
        const betterGap = gaps.find((g: any) => {
          const t = (g.title || '').toLowerCase();
          return t.includes('relationship') || t.includes('revenue') || 
                 t.includes('growth') || t.includes('engine') || t.includes('ceiling');
        });
        
        const newHeadline = betterGap?.title || 
          savedHeadline
            .replace(/building for a? ?£\d+[mk]?\s*exit/i, 'growing')
            .replace(/£\d+[mk]?\s*exit/gi, 'growth');
        
        await supabase
          .from('discovery_reports')
          .update({ headline: newHeadline })
          .eq('engagement_id', engagementId);
        
        console.log(`[Pass2] ✅ Fixed Stage 3 headline: "${savedHeadline}" → "${newHeadline}"`);
      }
      
      // Also check client_reports (where Stage 3 stores its analysis)
      const { data: clientReport } = await supabase
        .from('client_reports')
        .select('id, report_data')
        .eq('engagement_id', engagementId)
        .maybeSingle();
      
      if (clientReport?.report_data?.analysis?.executiveSummary?.headline) {
        const stg3Headline = clientReport.report_data.analysis.executiveSummary.headline;
        if (exitPatterns.some(p => p.test(stg3Headline))) {
          const fixedData = JSON.parse(JSON.stringify(clientReport.report_data));
          fixedData.analysis.executiveSummary.headline = newHeadline || stg3Headline
            .replace(/building for a? ?£\d+[mk]?\s*exit/i, 'growing')
            .replace(/£\d+[mk]?\s*exit/gi, 'growth');
          
          await supabase
            .from('client_reports')
            .update({ report_data: fixedData })
            .eq('id', clientReport.id);
          
          console.log(`[Pass2] ✅ Also fixed client_reports headline`);
        }
      }
    }

    // Update engagement status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: engagementStatus, 
        pass2_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    console.log(`[Pass2] ✅ Complete in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        destinationReport: narratives,
        dataCompleteness: {
          score: dataCompleteness.score,
          status: dataCompleteness.status,
          missingCritical: dataCompleteness.missingCritical,
          missingImportant: dataCompleteness.missingImportant,
          canGenerateClientReport: dataCompleteness.canGenerateClientReport,
          adminActionsNeeded: dataCompleteness.adminActionRequired
        },
        reportStatus,
        processingTimeMs: processingTime,
        tokensUsed,
        estimatedCost: estimatedCost.toFixed(4),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Pass2] Error:', error.message);
    
    // Update status to indicate failure
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      const { engagementId } = await req.json();
      if (engagementId) {
        await supabase
          .from('discovery_engagements')
          .update({ 
            status: 'pass1_complete',
            updated_at: new Date().toISOString()
          })
          .eq('id', engagementId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
