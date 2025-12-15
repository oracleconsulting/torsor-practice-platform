// ============================================================================
// EDGE FUNCTION: generate-value-analysis (COMPREHENSIVE VERSION)
// ============================================================================
// Full Oracle Method Value Analysis implementation with:
// - Dynamic business stage detection
// - Stage-specific questions (pre_revenue → mature)
// - 6 asset category scoring with detailed calculations
// - Risk register with severity and cost estimation
// - Value gap identification with £ opportunity sizing
// - Valuation impact analysis
// - 30-day action plans by stage
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// CLEANUP UTILITIES (inlined to avoid _shared import issues)
// ============================================================================

function cleanMechanical(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // British English spellings
    .replace(/\boptimize/gi, 'optimise')
    .replace(/\boptimizing/gi, 'optimising')
    .replace(/\boptimized/gi, 'optimised')
    .replace(/\boptimization/gi, 'optimisation')
    .replace(/\banalyze/gi, 'analyse')
    .replace(/\banalyzing/gi, 'analysing')
    .replace(/\banalyzed/gi, 'analysed')
    .replace(/\brealize/gi, 'realise')
    .replace(/\brealizing/gi, 'realising')
    .replace(/\brealized/gi, 'realised')
    .replace(/\bbehavior/gi, 'behaviour')
    .replace(/\bbehaviors/gi, 'behaviours')
    .replace(/\bbehavioral/gi, 'behavioural')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bcentered/gi, 'centred')
    .replace(/\bprogram\b/gi, 'programme')
    .replace(/\bprograms\b/gi, 'programmes')
    .replace(/\borganize/gi, 'organise')
    .replace(/\borganizing/gi, 'organising')
    .replace(/\borganized/gi, 'organised')
    .replace(/\borganization/gi, 'organisation')
    .replace(/\bfavor\b/gi, 'favour')
    .replace(/\bfavors\b/gi, 'favours')
    .replace(/\bfavorite/gi, 'favourite')
    .replace(/\bcolor/gi, 'colour')
    .replace(/\bcolors/gi, 'colours')
    .replace(/\bhonor/gi, 'honour')
    .replace(/\bhonors/gi, 'honours')
    .replace(/\brecognize/gi, 'recognise')
    .replace(/\brecognizing/gi, 'recognising')
    .replace(/\brecognized/gi, 'recognised')
    .replace(/\bspecialize/gi, 'specialise')
    .replace(/\bspecializing/gi, 'specialising')
    .replace(/\bspecialized/gi, 'specialised')
    .replace(/\bcatalog/gi, 'catalogue')
    .replace(/\bdialog\b/gi, 'dialogue')
    .replace(/\blabor/gi, 'labour')
    .replace(/\bneighbor/gi, 'neighbour')
    .replace(/\bpracticing/gi, 'practising')
    .replace(/\bfulfill/gi, 'fulfil')
    .replace(/\bfulfillment/gi, 'fulfilment')
    // Remove AI patterns
    .replace(/Here's the thing[:\s]*/gi, '')
    .replace(/Here's the truth[:\s]*/gi, '')
    .replace(/Here's what I see[:\s]*/gi, '')
    .replace(/Here's what we see[:\s]*/gi, '')
    .replace(/Here's what I also see[:\s]*/gi, '')
    .replace(/But here's what I also see[:\s]*/gi, '')
    .replace(/Here's another[^.]+\.\s*/gi, '')
    .replace(/Let me be direct[:\s]*/gi, '')
    .replace(/Let me be honest[:\s]*/gi, '')
    .replace(/I want to be direct with you[:\s]*/gi, '')
    .replace(/I want to be honest[:\s]*/gi, '')
    .replace(/You've done the hard work of [^.]+\.\s*/gi, '')
    .replace(/It doesn't mean [^.]+\. It means /gi, 'It means ')
    .replace(/That's not a fantasy\.\s*/gi, '')
    .replace(/That's not a dream\.\s*/gi, '')
    .replace(/At the end of the day,?\s*/gi, '')
    .replace(/To be honest,?\s*/gi, '')
    .replace(/Quite frankly,?\s*/gi, '')
    .replace(/The reality is,?\s*/gi, '')
    .replace(/Moving forward,?\s*/gi, '')
    .replace(/Going forward,?\s*/gi, '')
    .replace(/In a world where[^,]+,\s*/gi, '')
    // Clean up corporate jargon
    .replace(/\blow-hanging fruit\b/gi, 'quick wins')
    .replace(/\bmove the needle\b/gi, 'make progress')
    .replace(/\bboil the ocean\b/gi, 'try to do everything')
    .replace(/\bcircle back\b/gi, 'return to')
    .replace(/\btouch base\b/gi, 'check in')
    // Clean up spacing
    .replace(/  +/g, ' ')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
}

function cleanAllStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return cleanMechanical(obj);
  if (Array.isArray(obj)) return obj.map(item => cleanAllStrings(item));
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanAllStrings(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

type BusinessStage = 'pre_revenue' | 'early_revenue' | 'growth' | 'scale' | 'mature';

// ============================================================================
// NARRATIVE SUMMARY GENERATOR
// ============================================================================
// Creates "The Uncomfortable Truth" - a narrative that surfaces financial 
// insights emotionally, making the client feel seen and the data meaningful
// ============================================================================

async function generateNarrativeSummary(
  stageContext: StageContext,
  financialData: any,
  overallScore: number,
  totalOpportunity: number,
  riskRegister: any[],
  valueGaps: any[],
  fitProfile: any,
  vision: any
): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    console.warn('OPENROUTER_API_KEY not configured - skipping narrative summary');
    return null;
  }

  const criticalRisks = riskRegister.filter(r => r.severity === 'Critical');
  const quickWins = valueGaps.filter(g => g.effort === 'Low').slice(0, 3);

  const prompt = `Create a VALUE ANALYSIS narrative summary for ${stageContext.companyName}.

## THEIR NORTH STAR
"${fitProfile?.northStar || 'Building a business that gives them freedom'}"

## THE NUMBERS

Revenue: £${financialData.revenue?.toLocaleString() || 'Unknown'}
Gross Margin: ${Math.round((financialData.grossMargin || 0.3) * 100)}%
Net Profit: £${financialData.netProfit?.toLocaleString() || 'Unknown'}
Year-on-Year Growth: ${Math.round((financialData.yearOnYearGrowth || 0) * 100)}%
Overall Score: ${overallScore}/100
Total Opportunity: £${totalOpportunity.toLocaleString()}

## CRITICAL RISKS (${criticalRisks.length})
${criticalRisks.map(r => `- ${r.risk}: ${r.description}`).join('\n') || 'No critical risks identified'}

## QUICK WINS
${quickWins.map(qw => `- ${qw.gap}: £${qw.opportunity?.toLocaleString()} opportunity`).join('\n') || 'No quick wins identified'}

## YOUR TASK

Create a narrative summary with:

1. **uncomfortableTruth** (2-3 sentences)
   - The ONE thing they need to hear
   - If profit is dropping while revenue grows, say it
   - If they're underpricing, say it
   - If margins are compressed, say it
   - Be direct but not harsh

2. **whatThisRealleMeans** (2-3 sentences)
   - Translate the numbers into life impact
   - Connect to their North Star
   - Example: "This £136k opportunity isn't just money—it's the difference between working 60 hours a week and having Tuesdays free"

3. **beforeYouDoAnythingElse** (1-2 sentences)
   - The FIRST thing to fix
   - Usually the critical risk or the biggest margin leak

4. **theGoodNews** (1-2 sentences)
   - What's working that they should recognise
   - The foundation they've built

Return as JSON:
{
  "uncomfortableTruth": "string",
  "whatThisReallyMeans": "string",
  "beforeYouDoAnythingElse": "string",
  "theGoodNews": "string"
}

RULES:
- Be direct, not corporate
- Use their exact situation, not generic advice
- If the numbers show a problem, SAY IT
- British English (£, organise, colour)`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Value Narrative'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 1500,
        temperature: 0.6,
        messages: [
          { 
            role: 'system', 
            content: 'You surface financial truths that clients need to hear. Be direct but human. Return only valid JSON.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      console.error(`Narrative LLM error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start === -1 || end === -1) return null;
    
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch (error) {
    console.error('Narrative generation error:', error);
    return null;
  }
}

interface StageContext {
  stage: BusinessStage;
  revenue: number;
  revenueBand: string;
  revenueSource: 'actual' | 'band';
  teamSize: string;
  yearsTrading: number;
  companyName: string;
  industry: string;
}

// ============================================================================
// BUSINESS STAGE DETERMINATION (Comprehensive)
// ============================================================================

// Helper to parse actual currency values (handles £217,351 or 217351 etc)
function parseActualCurrency(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, spaces
  const cleaned = String(value).replace(/[£$€,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

// Helper to parse revenue from band (fallback only)
function parseRevenueBand(band: string): number {
  if (!band || band === '£0' || band === '') return 0;
  if (band.includes('Under £100k')) return 50000;
  if (band.includes('£100k-£250k')) return 175000;
  if (band.includes('£250k-£500k')) return 375000;
  if (band.includes('£500k-£1m')) return 750000;
  if (band.includes('£1m-£2.5m')) return 1750000;
  if (band.includes('£2.5m')) return 3500000;
  return 0;
}

function determineBusinessStage(part1: Record<string, any>, part2: Record<string, any>, part3?: Record<string, any>): StageContext {
  // PRIORITY: Use actual financial figures if provided, bands are FALLBACK only
  // Check multiple possible field names for actual turnover
  const actualTurnover = parseActualCurrency(
    part2.actual_turnover || 
    part2.actual_revenue ||
    part2.turnover ||
    part2.revenue ||
    part3?.actual_turnover ||
    part3?.turnover ||
    part3?.annual_turnover_actual ||
    part3?.revenue
  );
  
  const revenueBand = part2.annual_turnover || '£0';
  
  // Use actual if available, otherwise fall back to band midpoint
  let revenue: number;
  let revenueSource: 'actual' | 'band';
  
  if (actualTurnover !== null && actualTurnover > 0) {
    revenue = actualTurnover;
    revenueSource = 'actual';
    console.log(`Using ACTUAL turnover: £${revenue.toLocaleString()} (ignoring band: ${revenueBand})`);
  } else {
    revenue = parseRevenueBand(revenueBand);
    revenueSource = 'band';
    console.log(`Using BAND estimate: £${revenue.toLocaleString()} (from: ${revenueBand})`);
  }

  // Parse years trading - check for actual years first
  const actualYears = parseFloat(part2.actual_years_trading) || parseFloat(part3?.years_in_business);
  const yearsStr = part2.years_trading || '0';
  let yearsTrading = 0;
  
  if (actualYears && actualYears > 0) {
    yearsTrading = actualYears;
    console.log(`Using ACTUAL years trading: ${yearsTrading}`);
  } else if (yearsStr.includes('Less than 1')) yearsTrading = 0.5;
  else if (yearsStr.includes('1-2')) yearsTrading = 1.5;
  else if (yearsStr.includes('3-5')) yearsTrading = 4;
  else if (yearsStr.includes('5-10')) yearsTrading = 7;
  else if (yearsStr.includes('10+')) yearsTrading = 12;
  else yearsTrading = parseFloat(yearsStr) || 0;

  // Determine stage
  let stage: BusinessStage;
  if (revenue === 0) {
    stage = 'pre_revenue';
  } else if (revenue < 250000) {
    stage = 'early_revenue';
  } else if (revenue < 1000000) {
    stage = 'growth';
  } else if (revenue < 5000000) {
    stage = 'scale';
  } else {
    stage = 'mature';
  }

  // Detect industry using comprehensive dynamic detection
  const allText = JSON.stringify({ ...part1, ...part2 });
  const companyName = part1.company_name || part2.trading_name || '';
  const industry = detectIndustryFromContext(allText, companyName);
  
  console.log(`Industry detected: ${industry} for "${companyName}"`);

  return {
    stage,
    revenue,
    revenueBand,
    revenueSource,
    teamSize: part2.team_size || 'Just me',
    yearsTrading,
    companyName: companyName || 'Your Business',
    industry
  };
}

// ============================================================================
// BUSINESS VALUATION ENGINE (NEW - Comprehensive)
// ============================================================================
// Establishes baseline business value using:
// - Industry-specific valuation multiples
// - Revenue/EBITDA/SDE analysis
// - Value driver adjustments (+/-)
// - Before/after ROI projections
// ============================================================================

interface FinancialData {
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  ebitda: number;
  ownerSalary: number;
  ownerPerks: number;
  sde: number;  // Seller's Discretionary Earnings
  assets: number;
  liabilities: number;
  yearOnYearGrowth: number;
  recurringRevenuePercentage: number;
  grossMargin: number;
  netMargin: number;
}

interface ValuationMultiples {
  revenueMultiple: { low: number; mid: number; high: number };
  ebitdaMultiple: { low: number; mid: number; high: number };
  sdeMultiple: { low: number; mid: number; high: number };
  primaryMethod: 'revenue' | 'ebitda' | 'sde' | 'asset';
  notes: string;
}

interface ValueDriver {
  name: string;
  impact: number;  // -30 to +30 percentage points on multiple
  reason: string;
  fixable: boolean;
  fixCost: number;
  fixTimeMonths: number;
  afterFix: number;
}

interface BusinessValuation {
  asOfDate: string;
  method: string;
  baselineValue: number;
  adjustedValue: number;
  valueRange: { low: number; mid: number; high: number };
  keyMetrics: FinancialData;
  multiples: ValuationMultiples;
  valueDrivers: ValueDriver[];
  potentialValue: number;  // After implementing improvements
  valueGap: number;  // Difference between current and potential
  roi: {
    investmentRequired: number;
    timeToRealize: number;
    valueIncrease: number;
    roiPercentage: number;
  };
  industryComparison: {
    industry: string;
    averageMultiple: number;
    yourMultiple: number;
    percentile: number;
    topPerformersMultiple: number;
  };
  exitReadiness: {
    score: number;
    blockers: string[];
    recommendations: string[];
    timeToExit: string;
  };
}

// ============================================================================
// COMPREHENSIVE INDUSTRY MULTIPLES DATABASE
// ============================================================================
// Dynamic industry detection with 50+ industries and sub-sectors
// Multiples based on BizBuySell, IBBA, and Pepperdine data 2023-2024
// ============================================================================

const INDUSTRY_MULTIPLES: Record<string, ValuationMultiples> = {
  // ============ SPORTING GOODS & FITNESS ============
  fitness_equipment: {
    revenueMultiple: { low: 0.8, mid: 1.5, high: 2.5 },
    ebitdaMultiple: { low: 3.0, mid: 4.5, high: 7.0 },
    sdeMultiple: { low: 2.5, mid: 3.5, high: 5.0 },
    primaryMethod: 'sde',
    notes: 'Sporting goods/fitness: valued on SDE with premium for brand strength and recurring revenue'
  },
  sporting_goods_retail: {
    revenueMultiple: { low: 0.3, mid: 0.5, high: 0.8 },
    ebitdaMultiple: { low: 2.5, mid: 3.5, high: 5.0 },
    sdeMultiple: { low: 2.0, mid: 2.8, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'Retail sporting goods: inventory and location dependent'
  },
  gym_fitness_center: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 1.8 },
    ebitdaMultiple: { low: 3.0, mid: 4.5, high: 6.5 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    primaryMethod: 'sde',
    notes: 'Gym/fitness centers: membership recurring revenue adds premium'
  },
  
  // ============ E-COMMERCE ============
  ecommerce: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 2.0 },
    ebitdaMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    primaryMethod: 'sde',
    notes: 'E-commerce: valued on SDE, premium for proprietary products and brand'
  },
  amazon_fba: {
    revenueMultiple: { low: 0.8, mid: 1.5, high: 2.5 },
    ebitdaMultiple: { low: 2.5, mid: 3.5, high: 5.0 },
    sdeMultiple: { low: 2.5, mid: 3.5, high: 5.0 },
    primaryMethod: 'sde',
    notes: 'Amazon FBA: premium for established listings, reviews, and brand registry'
  },
  subscription_box: {
    revenueMultiple: { low: 1.0, mid: 2.0, high: 3.5 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 9.0 },
    sdeMultiple: { low: 3.0, mid: 4.5, high: 6.5 },
    primaryMethod: 'sde',
    notes: 'Subscription boxes: recurring revenue commands significant premium'
  },
  
  // ============ PROFESSIONAL SERVICES ============
  consulting: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 1.5 },
    ebitdaMultiple: { low: 3.0, mid: 5.0, high: 8.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'Consulting: heavily discounted for founder dependency, premium for systems'
  },
  accounting_bookkeeping: {
    revenueMultiple: { low: 0.8, mid: 1.2, high: 1.8 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 8.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'revenue',
    notes: 'Accounting: recurring engagements, valued on revenue multiple'
  },
  law_firm: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 1.5 },
    ebitdaMultiple: { low: 3.0, mid: 5.0, high: 7.0 },
    sdeMultiple: { low: 1.0, mid: 2.0, high: 3.0 },
    primaryMethod: 'sde',
    notes: 'Law firms: highly dependent on partners, difficult to transfer'
  },
  coaching_training: {
    revenueMultiple: { low: 0.4, mid: 0.8, high: 1.5 },
    ebitdaMultiple: { low: 2.0, mid: 4.0, high: 6.0 },
    sdeMultiple: { low: 1.0, mid: 2.0, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Coaching: highly founder-dependent, premium for group programs and IP'
  },
  recruitment_staffing: {
    revenueMultiple: { low: 0.3, mid: 0.6, high: 1.2 },
    ebitdaMultiple: { low: 3.0, mid: 5.0, high: 7.0 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    primaryMethod: 'sde',
    notes: 'Recruitment: relationship-dependent, premium for retained/exclusive contracts'
  },
  
  // ============ TECHNOLOGY ============
  technology: {
    revenueMultiple: { low: 2.0, mid: 4.0, high: 8.0 },
    ebitdaMultiple: { low: 6.0, mid: 10.0, high: 15.0 },
    sdeMultiple: { low: 3.0, mid: 5.0, high: 8.0 },
    primaryMethod: 'revenue',
    notes: 'Technology/SaaS: valued on revenue with premium for growth and recurring revenue'
  },
  saas: {
    revenueMultiple: { low: 3.0, mid: 6.0, high: 12.0 },
    ebitdaMultiple: { low: 8.0, mid: 15.0, high: 25.0 },
    sdeMultiple: { low: 4.0, mid: 7.0, high: 12.0 },
    primaryMethod: 'revenue',
    notes: 'SaaS: ARR-based, premium for low churn, high NRR, and growth rate'
  },
  it_services_msp: {
    revenueMultiple: { low: 0.8, mid: 1.5, high: 2.5 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 9.0 },
    sdeMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    primaryMethod: 'sde',
    notes: 'IT Services/MSP: MRR valued highly, premium for managed services'
  },
  software_development: {
    revenueMultiple: { low: 0.8, mid: 1.5, high: 3.0 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 10.0 },
    sdeMultiple: { low: 2.0, mid: 3.5, high: 5.5 },
    primaryMethod: 'sde',
    notes: 'Software dev agencies: project vs retainer mix affects valuation'
  },
  
  // ============ MARKETING & CREATIVE ============
  agency: {
    revenueMultiple: { low: 0.4, mid: 0.8, high: 1.5 },
    ebitdaMultiple: { low: 3.0, mid: 5.0, high: 8.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'Agencies: valued on SDE, heavily discounted for key person dependency'
  },
  digital_marketing: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 2.0 },
    ebitdaMultiple: { low: 3.0, mid: 5.0, high: 8.0 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 5.0 },
    primaryMethod: 'sde',
    notes: 'Digital marketing: retainer revenue and processes add premium'
  },
  seo_ppc: {
    revenueMultiple: { low: 0.8, mid: 1.5, high: 2.5 },
    ebitdaMultiple: { low: 3.5, mid: 5.5, high: 8.0 },
    sdeMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    primaryMethod: 'sde',
    notes: 'SEO/PPC agencies: recurring revenue model valued highly'
  },
  content_media: {
    revenueMultiple: { low: 1.0, mid: 2.0, high: 4.0 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 10.0 },
    sdeMultiple: { low: 2.0, mid: 3.5, high: 5.5 },
    primaryMethod: 'sde',
    notes: 'Content/media: subscriber base and traffic metrics key drivers'
  },
  
  // ============ TRADES & CONSTRUCTION ============
  trades: {
    revenueMultiple: { low: 0.3, mid: 0.6, high: 1.0 },
    ebitdaMultiple: { low: 2.0, mid: 3.5, high: 5.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Trades: valued on SDE plus assets, premium for recurring contracts'
  },
  construction: {
    revenueMultiple: { low: 0.2, mid: 0.4, high: 0.7 },
    ebitdaMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Construction: backlog quality and relationships key, plus equipment value'
  },
  electrical: {
    revenueMultiple: { low: 0.3, mid: 0.5, high: 0.8 },
    ebitdaMultiple: { low: 2.5, mid: 4.0, high: 5.5 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'Electrical contractors: licenses and recurring maintenance add premium'
  },
  plumbing_hvac: {
    revenueMultiple: { low: 0.4, mid: 0.7, high: 1.2 },
    ebitdaMultiple: { low: 3.0, mid: 4.5, high: 6.0 },
    sdeMultiple: { low: 2.0, mid: 3.5, high: 5.0 },
    primaryMethod: 'sde',
    notes: 'HVAC/Plumbing: maintenance contracts highly valued, premium for commercial'
  },
  landscaping: {
    revenueMultiple: { low: 0.3, mid: 0.5, high: 0.8 },
    ebitdaMultiple: { low: 2.0, mid: 3.5, high: 5.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Landscaping: recurring maintenance contracts key value driver'
  },
  
  // ============ HEALTHCARE & WELLNESS ============
  healthcare_practice: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 1.5 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 9.0 },
    sdeMultiple: { low: 2.0, mid: 3.5, high: 5.0 },
    primaryMethod: 'sde',
    notes: 'Healthcare practices: patient base and recurring care highly valued'
  },
  dental_practice: {
    revenueMultiple: { low: 0.6, mid: 0.9, high: 1.3 },
    ebitdaMultiple: { low: 5.0, mid: 7.0, high: 10.0 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    primaryMethod: 'revenue',
    notes: 'Dental: valued on collections, premium for hygiene program and specialists'
  },
  veterinary: {
    revenueMultiple: { low: 0.8, mid: 1.2, high: 1.8 },
    ebitdaMultiple: { low: 5.0, mid: 8.0, high: 12.0 },
    sdeMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    primaryMethod: 'revenue',
    notes: 'Veterinary: consolidation driving multiples, premium for specialty'
  },
  beauty_salon_spa: {
    revenueMultiple: { low: 0.3, mid: 0.5, high: 0.8 },
    ebitdaMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Salons/spas: stylist retention and location critical'
  },
  
  // ============ FOOD & HOSPITALITY ============
  restaurant: {
    revenueMultiple: { low: 0.25, mid: 0.4, high: 0.7 },
    ebitdaMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Restaurants: lease terms, location, and brand all critical'
  },
  cafe_coffee_shop: {
    revenueMultiple: { low: 0.3, mid: 0.5, high: 0.8 },
    ebitdaMultiple: { low: 2.0, mid: 3.0, high: 4.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'Cafes: foot traffic, location, and systems key'
  },
  food_manufacturing: {
    revenueMultiple: { low: 0.5, mid: 0.8, high: 1.3 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 8.0 },
    sdeMultiple: { low: 2.5, mid: 4.0, high: 5.5 },
    primaryMethod: 'ebitda',
    notes: 'Food manufacturing: contracts, facilities, and certifications valued'
  },
  
  // ============ RETAIL ============
  retail_general: {
    revenueMultiple: { low: 0.2, mid: 0.4, high: 0.7 },
    ebitdaMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 3.5 },
    primaryMethod: 'sde',
    notes: 'General retail: inventory plus goodwill, lease terms critical'
  },
  franchise: {
    revenueMultiple: { low: 0.3, mid: 0.6, high: 1.0 },
    ebitdaMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    primaryMethod: 'sde',
    notes: 'Franchises: multiple varies by brand strength and territory'
  },
  
  // ============ MANUFACTURING ============
  manufacturing: {
    revenueMultiple: { low: 0.4, mid: 0.7, high: 1.2 },
    ebitdaMultiple: { low: 3.5, mid: 5.5, high: 8.0 },
    sdeMultiple: { low: 2.5, mid: 4.0, high: 5.5 },
    primaryMethod: 'ebitda',
    notes: 'Manufacturing: equipment, contracts, and customer concentration key'
  },
  engineering: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 1.5 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 9.0 },
    sdeMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    primaryMethod: 'sde',
    notes: 'Engineering firms: IP, contracts, and team retention critical'
  },
  
  // ============ TRANSPORT & LOGISTICS ============
  transport_logistics: {
    revenueMultiple: { low: 0.3, mid: 0.6, high: 1.0 },
    ebitdaMultiple: { low: 3.0, mid: 5.0, high: 7.0 },
    sdeMultiple: { low: 2.0, mid: 3.5, high: 5.0 },
    primaryMethod: 'ebitda',
    notes: 'Logistics: fleet value, contracts, and driver retention key'
  },
  courier_delivery: {
    revenueMultiple: { low: 0.4, mid: 0.7, high: 1.2 },
    ebitdaMultiple: { low: 3.0, mid: 4.5, high: 6.5 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.5 },
    primaryMethod: 'sde',
    notes: 'Courier services: contracts and route optimization valued'
  },
  
  // ============ PROPERTY & REAL ESTATE ============
  property_management: {
    revenueMultiple: { low: 1.0, mid: 1.5, high: 2.5 },
    ebitdaMultiple: { low: 5.0, mid: 7.0, high: 10.0 },
    sdeMultiple: { low: 3.0, mid: 4.5, high: 6.5 },
    primaryMethod: 'revenue',
    notes: 'Property management: units under management drive value'
  },
  estate_agency: {
    revenueMultiple: { low: 0.4, mid: 0.8, high: 1.3 },
    ebitdaMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'Estate agents: lettings portfolio valued higher than sales'
  },
  
  // ============ EDUCATION ============
  education_training: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 2.0 },
    ebitdaMultiple: { low: 4.0, mid: 6.0, high: 9.0 },
    sdeMultiple: { low: 2.0, mid: 3.5, high: 5.5 },
    primaryMethod: 'sde',
    notes: 'Education: curriculum IP, accreditations, and enrollments valued'
  },
  tutoring: {
    revenueMultiple: { low: 0.4, mid: 0.8, high: 1.5 },
    ebitdaMultiple: { low: 2.5, mid: 4.0, high: 6.0 },
    sdeMultiple: { low: 1.5, mid: 2.5, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'Tutoring: student retention and tutor quality key'
  },
  
  // ============ GENERAL / FALLBACK ============
  general_business: {
    revenueMultiple: { low: 0.5, mid: 1.0, high: 2.0 },
    ebitdaMultiple: { low: 3.0, mid: 4.0, high: 6.0 },
    sdeMultiple: { low: 2.0, mid: 3.0, high: 4.0 },
    primaryMethod: 'sde',
    notes: 'General: valued on SDE with standard adjustments for risk factors'
  }
};

// ============================================================================
// DYNAMIC INDUSTRY DETECTION
// ============================================================================
// Analyzes business context to determine most appropriate industry category
// ============================================================================

function detectIndustryFromContext(allText: string, companyName: string): string {
  const text = (allText + ' ' + companyName).toLowerCase();
  
  // Priority-ordered industry detection patterns
  const industryPatterns: { industry: string; patterns: RegExp[]; priority: number }[] = [
    // Specific industries first (higher priority)
    { industry: 'saas', patterns: [/\bsaas\b/, /software as a service/, /\barr\b/, /\bmrr\b/, /subscription software/], priority: 100 },
    { industry: 'amazon_fba', patterns: [/\bfba\b/, /amazon seller/, /amazon business/, /fulfilled by amazon/], priority: 100 },
    { industry: 'subscription_box', patterns: [/subscription box/, /monthly box/, /curated box/], priority: 100 },
    
    // Fitness & Sporting Goods
    { industry: 'fitness_equipment', patterns: [/rowing/, /fitness equipment/, /gym equipment/, /exercise equipment/, /sport.*equipment/], priority: 90 },
    { industry: 'gym_fitness_center', patterns: [/\bgym\b/, /fitness cent/, /fitness studio/, /health club/, /crossfit/, /pilates studio/, /yoga studio/], priority: 85 },
    { industry: 'sporting_goods_retail', patterns: [/sporting goods/, /sports shop/, /sport.*retail/], priority: 80 },
    
    // Healthcare
    { industry: 'dental_practice', patterns: [/dental/, /dentist/, /orthodont/], priority: 90 },
    { industry: 'veterinary', patterns: [/veterinary/, /\bvet\b/, /animal hospital/, /pet clinic/], priority: 90 },
    { industry: 'healthcare_practice', patterns: [/medical practice/, /\bgp\b/, /clinic/, /physio/, /chiropract/, /osteopath/], priority: 85 },
    { industry: 'beauty_salon_spa', patterns: [/salon/, /\bspa\b/, /beauty/, /hair.*dress/, /barber/, /nail.*tech/], priority: 80 },
    
    // Technology
    { industry: 'it_services_msp', patterns: [/\bmsp\b/, /managed service/, /it support/, /it services/, /tech support/], priority: 85 },
    { industry: 'software_development', patterns: [/software dev/, /app dev/, /web dev/, /mobile dev/, /coding/, /programming/], priority: 80 },
    { industry: 'technology', patterns: [/\btech\b/, /software/, /\bapp\b/, /digital product/], priority: 70 },
    
    // Marketing & Creative
    { industry: 'seo_ppc', patterns: [/\bseo\b/, /\bppc\b/, /search engine/, /google ads/, /paid search/], priority: 90 },
    { industry: 'digital_marketing', patterns: [/digital market/, /online market/, /social media market/], priority: 85 },
    { industry: 'content_media', patterns: [/content creat/, /media company/, /\bblog\b/, /podcast/, /youtube/], priority: 80 },
    { industry: 'agency', patterns: [/\bagency\b/, /creative agency/, /branding/, /design agency/], priority: 75 },
    
    // Professional Services
    { industry: 'accounting_bookkeeping', patterns: [/accountant/, /bookkeep/, /\bcpa\b/, /chartered account/], priority: 90 },
    { industry: 'law_firm', patterns: [/law firm/, /solicitor/, /lawyer/, /legal practice/], priority: 90 },
    { industry: 'recruitment_staffing', patterns: [/recruit/, /staffing/, /headhunt/, /talent acqui/], priority: 85 },
    { industry: 'coaching_training', patterns: [/\bcoach\b/, /training provider/, /mentor/, /\bconsultant\b/], priority: 75 },
    { industry: 'consulting', patterns: [/consult/, /advisory/, /business advice/], priority: 70 },
    
    // Trades
    { industry: 'electrical', patterns: [/electrician/, /electrical contract/], priority: 90 },
    { industry: 'plumbing_hvac', patterns: [/plumber/, /plumbing/, /\bhvac\b/, /heating/, /air condition/], priority: 90 },
    { industry: 'landscaping', patterns: [/landscap/, /garden.*service/, /lawn care/], priority: 85 },
    { industry: 'construction', patterns: [/construct/, /building contract/, /builder/], priority: 80 },
    { industry: 'trades', patterns: [/trade/, /contractor/, /handyman/, /maintenance/], priority: 60 },
    
    // Food & Hospitality
    { industry: 'food_manufacturing', patterns: [/food manufact/, /food product/, /bakery/, /catering/], priority: 85 },
    { industry: 'cafe_coffee_shop', patterns: [/coffee shop/, /\bcafe\b/, /café/], priority: 85 },
    { industry: 'restaurant', patterns: [/restaurant/, /takeaway/, /fast food/], priority: 80 },
    
    // E-commerce
    { industry: 'ecommerce', patterns: [/e-?commerce/, /online.*shop/, /online.*store/, /webshop/, /\bshopify\b/], priority: 75 },
    
    // Property
    { industry: 'property_management', patterns: [/property manag/, /letting agent/, /rental management/], priority: 85 },
    { industry: 'estate_agency', patterns: [/estate agent/, /real estate/, /property sale/], priority: 80 },
    
    // Transport
    { industry: 'courier_delivery', patterns: [/courier/, /delivery service/, /last mile/], priority: 85 },
    { industry: 'transport_logistics', patterns: [/transport/, /logistic/, /haulage/, /freight/], priority: 80 },
    
    // Education
    { industry: 'tutoring', patterns: [/tutor/, /private lesson/], priority: 85 },
    { industry: 'education_training', patterns: [/education/, /training provider/, /course provider/, /e-?learning/], priority: 80 },
    
    // Retail & Franchise
    { industry: 'franchise', patterns: [/franchise/], priority: 80 },
    { industry: 'retail_general', patterns: [/\bretail\b/, /\bshop\b/, /store/], priority: 60 },
    
    // Manufacturing
    { industry: 'engineering', patterns: [/engineer.*firm/, /engineering company/], priority: 85 },
    { industry: 'manufacturing', patterns: [/manufactur/, /factory/, /production/], priority: 75 }
  ];
  
  // Score each industry
  const scores: { industry: string; score: number }[] = [];
  
  for (const { industry, patterns, priority } of industryPatterns) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores.push({ industry, score: matchCount * priority });
    }
  }
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  // Return best match or general_business
  return scores[0]?.industry || 'general_business';
}

// Extract financial data from context documents (uploaded accounts)
function extractFinancialsFromContext(
  contextDocuments: any[],
  stageContext: StageContext,
  part2Responses: Record<string, any>,
  part3Responses?: Record<string, any>
): FinancialData {
  // Start with what we know from assessments (may already have actual figures from determineBusinessStage)
  let revenue = stageContext.revenue;
  let grossProfit = 0;
  let operatingProfit = 0;
  let netProfit = 0;
  let ownerSalary = 0;
  let ownerPerks = 0;
  let assets = 0;
  let liabilities = 0;
  let yearOnYearGrowth = 0;
  let recurringRevenuePercentage = 0;

  // Check for actual figures in part2 or part3 (highest priority)
  const actualRevenue = parseActualCurrency(
    part3Responses?.actual_turnover ||
    part3Responses?.actual_revenue ||
    part2Responses.exact_annual_revenue ||
    part2Responses.actual_turnover
  );
  
  if (actualRevenue && actualRevenue > 0) {
    revenue = actualRevenue;
    console.log(`Using actual revenue from responses: £${revenue.toLocaleString()}`);
  }

  // Calculate gross margin (needed for fallback calculation)
  const actualGrossMarginStr = part3Responses?.actual_gross_margin;
  const grossMarginStr = actualGrossMarginStr || part2Responses.gross_margin || part2Responses.profit_margin || '30%';
  const grossMarginPct = parseFloat(String(grossMarginStr).replace('%', '')) / 100 || 0.3;

  // Check for actual gross profit
  const actualGrossProfit = parseActualCurrency(part3Responses?.actual_gross_profit);
  if (actualGrossProfit && actualGrossProfit > 0) {
    grossProfit = actualGrossProfit;
    console.log(`Using actual gross profit: £${grossProfit.toLocaleString()}`);
  } else {
    // Calculate from revenue and margin
    grossProfit = revenue * grossMarginPct;
  }

  // Check for actual net profit
  const actualNetProfit = parseActualCurrency(part3Responses?.actual_net_profit);
  if (actualNetProfit !== null) {
    netProfit = actualNetProfit;
    operatingProfit = netProfit * 1.2; // Estimate operating from net
    console.log(`Using actual net profit: £${netProfit.toLocaleString()}`);
  } else {
    // Estimate operating profit (typically 60-80% of gross for SMEs)
    operatingProfit = grossProfit * 0.7;
  }

  // Check for actual owner salary
  const actualOwnerSalary = parseActualCurrency(part3Responses?.actual_owner_salary);
  if (actualOwnerSalary && actualOwnerSalary > 0) {
    ownerSalary = actualOwnerSalary;
    console.log(`Using actual owner salary: £${ownerSalary.toLocaleString()}`);
  } else {
    ownerSalary = parseFloat(part2Responses.owner_salary?.replace(/[£,]/g, '') || '0') || revenue * 0.15;
  }
  ownerPerks = ownerSalary * 0.1; // Estimate perks at 10% of salary

  // Calculate growth rate from actual figures if available
  const previousYearTurnover = parseActualCurrency(part3Responses?.previous_year_turnover);
  if (previousYearTurnover && previousYearTurnover > 0 && revenue > 0) {
    yearOnYearGrowth = (revenue - previousYearTurnover) / previousYearTurnover;
    console.log(`Calculated YoY growth from actuals: ${(yearOnYearGrowth * 100).toFixed(1)}%`);
  } else {
    // Parse growth rate from selections
    const growthStr = part2Responses.growth_rate || part2Responses.revenue_growth || '0%';
    yearOnYearGrowth = parseFloat(growthStr.replace('%', '')) / 100 || 0;
  }

  // Parse recurring revenue
  recurringRevenuePercentage = parseFloat(part2Responses.recurring_revenue_percentage || '0') / 100 || 0;

  // Try to extract from uploaded context documents
  console.log(`[extractFinancials] Processing ${contextDocuments?.length || 0} context documents`);
  
  for (const doc of contextDocuments || []) {
    const content = (doc.content || '');
    const contentLower = content.toLowerCase();
    
    console.log(`[extractFinancials] Document type: ${doc.type}, content length: ${content.length}`);
    
    // Helper to extract monetary values - handles multiple formats
    const extractMoney = (text: string, ...patterns: RegExp[]): number | null => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const value = parseFloat(match[1].replace(/[,\s]/g, ''));
          if (value > 0) return value;
        }
      }
      return null;
    };
    
    // TURNOVER/SALES - handles various P&L formats:
    // Format 1: "Sales    217,351"
    // Format 2: "Turnover: £217,351"  
    // Format 3: "TURNOVER\nSales   217,351"
    // Format 4: "Revenue  £217,351"
    if (contentLower.includes('turnover') || contentLower.includes('sales') || contentLower.includes('revenue')) {
      const extractedRevenue = extractMoney(content,
        /sales\s+£?([\d,]+)/i,
        /turnover[:\s]+£?([\d,]+)/i,
        /revenue[:\s]+£?([\d,]+)/i,
        /total\s+(?:sales|revenue|turnover)[:\s]+£?([\d,]+)/i,
        /(?:annual|yearly)\s+(?:sales|revenue|turnover)[:\s]+£?([\d,]+)/i
      );
      if (extractedRevenue && extractedRevenue > 10000) {
        console.log(`[extractFinancials] Extracted revenue from document: £${extractedRevenue.toLocaleString()}`);
        revenue = extractedRevenue;
      }
    }
    
    // GROSS PROFIT - handles: "Gross Profit  79,673" or "GROSS PROFIT: £79,673"
    if (contentLower.includes('gross profit')) {
      const extractedGP = extractMoney(content,
        /gross\s+profit\s+£?([\d,]+)/i,
        /gross\s+profit[:\s]+£?([\d,]+)/i
      );
      if (extractedGP && extractedGP > 0) {
        console.log(`[extractFinancials] Extracted gross profit from document: £${extractedGP.toLocaleString()}`);
        grossProfit = extractedGP;
      }
    }

    // OPERATING PROFIT / EBIT
    if (contentLower.includes('operating profit') || contentLower.includes('ebit')) {
      const extractedOP = extractMoney(content,
        /operating\s+profit\s+£?([\d,]+)/i,
        /ebit[:\s]+£?([\d,]+)/i
      );
      if (extractedOP) operatingProfit = extractedOP;
    }

    // NET PROFIT
    if (contentLower.includes('net profit') || contentLower.includes('profit after tax') || contentLower.includes('profit for the year')) {
      const extractedNP = extractMoney(content,
        /net\s+profit\s+£?([\d,]+)/i,
        /profit\s+after\s+tax\s+£?([\d,]+)/i,
        /profit\s+for\s+(?:the\s+)?year\s+£?([\d,]+)/i
      );
      if (extractedNP) netProfit = extractedNP;
    }

    // DIRECTOR SALARY/REMUNERATION
    if (contentLower.includes('director') && (contentLower.includes('salary') || contentLower.includes('remuneration'))) {
      const extractedSalary = extractMoney(content,
        /director(?:'?s?)?\s+(?:salary|remuneration)\s+£?([\d,]+)/i,
        /(?:salary|remuneration)\s+£?([\d,]+)/i
      );
      if (extractedSalary) ownerSalary = extractedSalary;
    }

    // TOTAL ASSETS
    if (contentLower.includes('total assets')) {
      const extractedAssets = extractMoney(content, /total\s+assets\s+£?([\d,]+)/i);
      if (extractedAssets) assets = extractedAssets;
    }

    // TOTAL LIABILITIES
    if (contentLower.includes('total liabilities') || contentLower.includes('creditors')) {
      const extractedLiab = extractMoney(content,
        /total\s+liabilities\s+£?([\d,]+)/i,
        /creditors[:\s]+£?([\d,]+)/i
      );
      if (extractedLiab) liabilities = extractedLiab;
    }
  }
  
  console.log(`[extractFinancials] Final values - Revenue: £${revenue.toLocaleString()}, Gross Profit: £${grossProfit.toLocaleString()}`);

  // Estimate net profit if not found
  if (netProfit === 0) {
    netProfit = operatingProfit * 0.8; // Rough estimate after tax
  }

  // Calculate EBITDA (add back depreciation/amortization estimate)
  const depreciation = revenue * 0.03; // Estimate 3% of revenue
  const ebitda = operatingProfit + depreciation;

  // Calculate SDE (Seller's Discretionary Earnings)
  const sde = netProfit + ownerSalary + ownerPerks + depreciation;

  return {
    revenue,
    grossProfit,
    operatingProfit,
    netProfit,
    ebitda,
    ownerSalary,
    ownerPerks,
    sde,
    assets,
    liabilities,
    yearOnYearGrowth,
    recurringRevenuePercentage,
    grossMargin: grossMarginPct,
    netMargin: revenue > 0 ? netProfit / revenue : 0
  };
}

// Analyze value drivers and their impact on multiple
function analyzeValueDrivers(
  financials: FinancialData,
  part3Responses: Record<string, any>,
  stageContext: StageContext,
  assetScores: any[]
): ValueDriver[] {
  const drivers: ValueDriver[] = [];
  
  // --- OWNER DEPENDENCY ---
  const dependency = parseInt(part3Responses.knowledge_dependency_percentage || '50');
  if (dependency > 70) {
    drivers.push({
      name: 'High Owner Dependency',
      impact: -25,
      reason: `${dependency}% of knowledge in founder's head. Buyers see this as massive risk.`,
      fixable: true,
      fixCost: 15000, // Documentation and training
      fixTimeMonths: 6,
      afterFix: -10 // Still some dependency but much better
    });
  } else if (dependency > 50) {
    drivers.push({
      name: 'Moderate Owner Dependency',
      impact: -10,
      reason: `${dependency}% owner knowledge concentration needs addressing`,
      fixable: true,
      fixCost: 8000,
      fixTimeMonths: 3,
      afterFix: 0
    });
  } else if (dependency < 30) {
    drivers.push({
      name: 'Low Owner Dependency',
      impact: +10,
      reason: 'Business can run without founder - premium valuations apply',
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +10
    });
  }

  // --- CUSTOMER CONCENTRATION ---
  const top3Concentration = parseInt(part3Responses.top3_customer_revenue_percentage || '30');
  if (top3Concentration > 60) {
    drivers.push({
      name: 'High Customer Concentration',
      impact: -20,
      reason: `${top3Concentration}% of revenue from top 3 customers. One departure = crisis.`,
      fixable: true,
      fixCost: 25000, // Sales & marketing investment
      fixTimeMonths: 12,
      afterFix: -5
    });
  } else if (top3Concentration > 40) {
    drivers.push({
      name: 'Moderate Customer Concentration',
      impact: -10,
      reason: `${top3Concentration}% from top 3 - needs diversification`,
      fixable: true,
      fixCost: 12000,
      fixTimeMonths: 6,
      afterFix: 0
    });
  } else if (top3Concentration < 20) {
    drivers.push({
      name: 'Well-Diversified Customer Base',
      impact: +10,
      reason: 'No single customer dependency - lower risk profile',
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +10
    });
  }

  // --- RECURRING REVENUE ---
  const recurringPct = financials.recurringRevenuePercentage * 100;
  if (recurringPct > 70) {
    drivers.push({
      name: 'Strong Recurring Revenue',
      impact: +25,
      reason: `${Math.round(recurringPct)}% recurring revenue - predictable and valuable`,
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +25
    });
  } else if (recurringPct > 40) {
    drivers.push({
      name: 'Moderate Recurring Revenue',
      impact: +10,
      reason: `${Math.round(recurringPct)}% recurring - room to grow subscription model`,
      fixable: true,
      fixCost: 10000,
      fixTimeMonths: 6,
      afterFix: +15
    });
  } else if (recurringPct < 20) {
    drivers.push({
      name: 'Low Recurring Revenue',
      impact: -10,
      reason: 'Mostly one-time sales - less predictable for buyers',
      fixable: true,
      fixCost: 15000,
      fixTimeMonths: 9,
      afterFix: 0
    });
  }

  // --- GROWTH RATE ---
  const growthPct = financials.yearOnYearGrowth * 100;
  if (growthPct > 30) {
    drivers.push({
      name: 'High Growth Rate',
      impact: +20,
      reason: `${Math.round(growthPct)}% YoY growth - premium multiple territory`,
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +20
    });
  } else if (growthPct > 15) {
    drivers.push({
      name: 'Solid Growth',
      impact: +10,
      reason: `${Math.round(growthPct)}% YoY growth - above average`,
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +10
    });
  } else if (growthPct < 5) {
    drivers.push({
      name: 'Flat/Low Growth',
      impact: -15,
      reason: 'Stagnant growth impacts buyer interest',
      fixable: true,
      fixCost: 20000,
      fixTimeMonths: 12,
      afterFix: 0
    });
  }

  // --- DOCUMENTATION & SYSTEMS ---
  const undocumented = (part3Responses.critical_processes_undocumented || []).length;
  if (undocumented > 5) {
    drivers.push({
      name: 'Poor Documentation',
      impact: -15,
      reason: `${undocumented} critical processes not documented`,
      fixable: true,
      fixCost: 5000 + (undocumented * 1000),
      fixTimeMonths: 4,
      afterFix: 0
    });
  } else if (undocumented === 0) {
    drivers.push({
      name: 'Excellent Documentation',
      impact: +10,
      reason: 'All critical processes documented - transfer-ready',
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +10
    });
  }

  // --- FINANCIAL CLEANLINESS ---
  const cleanFinancials = part3Responses.clean_financials;
  if (cleanFinancials === 'Mixed personal/business expenses') {
    drivers.push({
      name: 'Messy Financials',
      impact: -20,
      reason: 'Mixed personal/business expenses = due diligence nightmare',
      fixable: true,
      fixCost: 3000,
      fixTimeMonths: 3,
      afterFix: -5
    });
  } else if (cleanFinancials === 'Audited/accountant-reviewed annually') {
    drivers.push({
      name: 'Clean Audited Financials',
      impact: +10,
      reason: 'Audited accounts = buyer confidence',
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +10
    });
  }

  // --- BRAND/PERSONAL BRAND ---
  const personalBrand = parseInt(part3Responses.personal_brand_percentage || '50');
  if (personalBrand > 70) {
    drivers.push({
      name: 'Founder is the Brand',
      impact: -30,
      reason: `${personalBrand}% of customers buy because of founder - business is unsellable without transition plan`,
      fixable: true,
      fixCost: 20000,
      fixTimeMonths: 18,
      afterFix: -10
    });
  }

  // --- SUCCESSION/EXIT READINESS ---
  const succession = part3Responses.succession_your_role;
  if (succession === 'Nobody') {
    drivers.push({
      name: 'No Succession Plan',
      impact: -15,
      reason: 'No one can run business without founder',
      fixable: true,
      fixCost: 10000,
      fixTimeMonths: 12,
      afterFix: 0
    });
  } else if (succession === 'Someone ready now') {
    drivers.push({
      name: 'Strong Succession',
      impact: +15,
      reason: 'Proven succession - low transition risk',
      fixable: false,
      fixCost: 0,
      fixTimeMonths: 0,
      afterFix: +15
    });
  }

  return drivers;
}

// Calculate business valuation
function calculateBusinessValuation(
  financials: FinancialData,
  valueDrivers: ValueDriver[],
  stageContext: StageContext,
  assetScores: any[]
): BusinessValuation {
  const industry = stageContext.industry;
  const multiples = INDUSTRY_MULTIPLES[industry] || INDUSTRY_MULTIPLES.general_business;

  // Calculate total value driver impact
  const currentImpact = valueDrivers.reduce((sum, d) => sum + d.impact, 0);
  const potentialImpact = valueDrivers.reduce((sum, d) => sum + d.afterFix, 0);

  // Adjust multiples based on value drivers
  const adjustmentFactor = 1 + (currentImpact / 100);
  const potentialAdjustmentFactor = 1 + (potentialImpact / 100);

  // Calculate valuations using primary method
  let baselineValue: number;
  let potentialValue: number;
  let method: string;

  switch (multiples.primaryMethod) {
    case 'revenue':
      baselineValue = financials.revenue * multiples.revenueMultiple.mid * adjustmentFactor;
      potentialValue = financials.revenue * multiples.revenueMultiple.mid * potentialAdjustmentFactor;
      method = 'Revenue Multiple';
      break;
    case 'ebitda':
      baselineValue = financials.ebitda * multiples.ebitdaMultiple.mid * adjustmentFactor;
      potentialValue = financials.ebitda * multiples.ebitdaMultiple.mid * potentialAdjustmentFactor;
      method = 'EBITDA Multiple';
      break;
    case 'sde':
    default:
      baselineValue = financials.sde * multiples.sdeMultiple.mid * adjustmentFactor;
      potentialValue = financials.sde * multiples.sdeMultiple.mid * potentialAdjustmentFactor;
      method = 'SDE Multiple (Seller\'s Discretionary Earnings)';
      break;
  }

  // Calculate range
  const valueLow = baselineValue * 0.7;
  const valueHigh = baselineValue * 1.4;

  // Calculate ROI on improvements
  const investmentRequired = valueDrivers
    .filter(d => d.fixable && d.fixCost > 0)
    .reduce((sum, d) => sum + d.fixCost, 0);
  
  const longestFix = Math.max(...valueDrivers.filter(d => d.fixable).map(d => d.fixTimeMonths), 0);
  const valueIncrease = potentialValue - baselineValue;
  const roiPercentage = investmentRequired > 0 ? (valueIncrease / investmentRequired) * 100 : 0;

  // Calculate current multiple and percentile
  const currentMultiple = financials.sde > 0 ? baselineValue / financials.sde : 0;
  const avgMultiple = multiples.sdeMultiple.mid;
  const percentile = Math.min(100, Math.max(0, 
    50 + ((currentMultiple - avgMultiple) / avgMultiple) * 50
  ));

  // Exit readiness assessment
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let exitScore = 50;

  valueDrivers.forEach(driver => {
    if (driver.impact < -15) {
      blockers.push(driver.name);
      exitScore -= 10;
    }
    if (driver.fixable && driver.impact < 0) {
      recommendations.push(`Fix ${driver.name}: £${driver.fixCost.toLocaleString()} investment, ${driver.fixTimeMonths} months`);
    }
  });

  // Add asset score insights to exit readiness
  assetScores.forEach(score => {
    if (score.score < 40) {
      blockers.push(`Low ${score.category} score (${score.score}%)`);
      exitScore -= 5;
    }
  });

  exitScore = Math.max(0, Math.min(100, exitScore));

  let timeToExit = 'Ready now';
  if (exitScore < 30) timeToExit = '18-24 months of improvements needed';
  else if (exitScore < 50) timeToExit = '12-18 months';
  else if (exitScore < 70) timeToExit = '6-12 months';
  else if (exitScore < 90) timeToExit = '3-6 months';

  return {
    asOfDate: new Date().toISOString().split('T')[0],
    method,
    baselineValue: Math.round(baselineValue),
    adjustedValue: Math.round(baselineValue),
    valueRange: {
      low: Math.round(valueLow),
      mid: Math.round(baselineValue),
      high: Math.round(valueHigh)
    },
    keyMetrics: financials,
    multiples,
    valueDrivers,
    potentialValue: Math.round(potentialValue),
    valueGap: Math.round(potentialValue - baselineValue),
    roi: {
      investmentRequired: Math.round(investmentRequired),
      timeToRealize: longestFix,
      valueIncrease: Math.round(valueIncrease),
      roiPercentage: Math.round(roiPercentage)
    },
    industryComparison: {
      industry: stageContext.industry.replace('_', ' '),
      averageMultiple: avgMultiple,
      yourMultiple: Math.round(currentMultiple * 10) / 10,
      percentile: Math.round(percentile),
      topPerformersMultiple: multiples.sdeMultiple.high
    },
    exitReadiness: {
      score: exitScore,
      blockers,
      recommendations,
      timeToExit
    }
  };
}

// ============================================================================
// STAGE-SPECIFIC QUESTIONS (Full Implementation)
// ============================================================================

function getPreRevenueQuestions(): any[] {
  return [
    {
      section: "Validation & Market Fit",
      description: "Understanding where you are in validating your business idea",
      questions: [
        {
          id: "validation_stage",
          fieldName: "validation_stage",
          question: "Where are you in validating your business idea?",
          type: "radio",
          options: [
            "Just an idea - no customer feedback yet",
            "Talked to 1-5 potential customers",
            "Talked to 6-20 potential customers",
            "Have verbal commitments to buy",
            "Have written LOIs or pre-orders",
            "MVP built and being tested"
          ],
          insight: "Most successful businesses validate with 20+ customer conversations before building",
          valueImpact: { low: "Just an idea", high: "MVP built" }
        },
        {
          id: "first_customer_timeline",
          fieldName: "first_customer_timeline",
          question: "When do you expect your first paying customer?",
          type: "radio",
          options: ["Within 30 days", "1-3 months", "3-6 months", "6-12 months", "More than 12 months", "Don't know"],
          insight: "Urgency correlates with founder commitment and market readiness"
        },
        {
          id: "revenue_blockers",
          fieldName: "revenue_blockers",
          question: "What's preventing revenue right now? (Select all that apply)",
          type: "checkbox",
          options: [
            "Product/service not ready",
            "Don't know who to sell to",
            "Don't know how to reach customers",
            "No sales process",
            "Pricing uncertainty",
            "Legal/regulatory requirements",
            "Need funding first",
            "Fear of rejection",
            "Waiting for 'perfect' moment"
          ],
          insight: "Most blockers are psychological, not technical"
        },
        {
          id: "target_customer_clarity",
          fieldName: "target_customer_clarity",
          question: "How clearly can you describe your ideal customer?",
          type: "radio",
          options: [
            "Vague idea",
            "General demographics",
            "Specific characteristics",
            "Named companies/individuals",
            "Have conversations scheduled"
          ]
        }
      ]
    },
    {
      section: "Founder Readiness",
      description: "Your personal runway and skills to execute",
      questions: [
        {
          id: "runway_months",
          fieldName: "runway_months",
          question: "How many months can you survive without revenue from this business?",
          type: "radio",
          options: [
            "Less than 3 months",
            "3-6 months",
            "6-12 months",
            "12+ months",
            "Indefinitely (have other income)"
          ],
          insight: "Most founders need 6-9 months to reach sustainable first revenue",
          valueImpact: { low: "Less than 3 months", high: "12+ months" }
        },
        {
          id: "commitment_level",
          fieldName: "commitment_level",
          question: "What's your current commitment level?",
          type: "radio",
          options: [
            "Side project (< 10 hours/week)",
            "Part-time (10-20 hours/week)",
            "Full-time but not all-in",
            "All-in, burning boats"
          ]
        },
        {
          id: "skills_gaps",
          fieldName: "skills_gaps",
          question: "Which skills do you lack for reaching first revenue? (Select all that apply)",
          type: "checkbox",
          options: [
            "Sales and closing deals",
            "Marketing and lead generation",
            "Product/service development",
            "Financial planning",
            "Operations setup",
            "Legal and compliance",
            "Team building",
            "None - I have all needed skills"
          ],
          insight: "Sales is the most common gap - and the most fixable"
        },
        {
          id: "support_network",
          fieldName: "support_network",
          question: "What support do you have?",
          type: "checkbox",
          options: [
            "Mentor/advisor with relevant experience",
            "Co-founder or business partner",
            "Supportive family/partner",
            "Financial safety net",
            "Industry network",
            "None of the above"
          ]
        }
      ]
    },
    {
      section: "Quick Revenue Opportunities",
      description: "Paths to cash flow while building the full vision",
      questions: [
        {
          id: "quick_revenue_paths",
          fieldName: "quick_revenue_paths",
          question: "Which of these could generate revenue within 30 days? (Select all that apply)",
          type: "checkbox",
          options: [
            "Consulting/freelancing in my expertise area",
            "Pre-selling the full solution",
            "Offering a simplified/manual version first",
            "Partnering with someone who has customers",
            "Licensing my knowledge/method",
            "Teaching/training what I know",
            "Affiliate or referral income",
            "None of these fit my situation"
          ],
          insight: "70% of successful founders generate interim revenue while building their main product"
        },
        {
          id: "pricing_confidence",
          fieldName: "pricing_confidence",
          question: "How confident are you in your pricing?",
          type: "slider",
          min: 0,
          max: 100,
          step: 10,
          labels: { 0: "No idea", 50: "Educated guess", 100: "Market validated" }
        }
      ]
    }
  ];
}

function getEarlyRevenueQuestions(teamSize: string): any[] {
  return [
    {
      section: "Revenue & Customer Foundation",
      description: "Understanding your revenue stability and customer base",
      questions: [
        {
          id: "revenue_consistency",
          fieldName: "revenue_consistency",
          question: "How predictable is your monthly revenue?",
          type: "radio",
          options: [
            "Completely random - no pattern",
            "Varies by 50%+ month to month",
            "Varies by 20-50% month to month",
            "Fairly stable (±20%)",
            "Very predictable recurring revenue"
          ],
          insight: "Predictable revenue is worth 2-3x more than volatile revenue to buyers",
          valueImpact: { low: "Completely random", high: "Very predictable" }
        },
        {
          id: "customer_acquisition_cost",
          fieldName: "customer_acquisition_cost",
          question: "Do you know your customer acquisition cost (CAC)?",
          type: "radio",
          options: [
            "Yes, tracked precisely",
            "Rough idea (within 50%)",
            "No idea",
            "We don't spend on acquisition (all referral/organic)"
          ]
        },
        {
          id: "customer_count",
          fieldName: "customer_count",
          question: "How many active customers do you have?",
          type: "radio",
          options: ["1-5", "6-20", "21-50", "51-100", "100+"]
        },
        {
          id: "top_customer_revenue",
          fieldName: "top_customer_revenue",
          question: "What percentage of revenue comes from your top 3 customers?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5,
          labels: { 0: "Diversified", 50: "Concentrated", 100: "Totally dependent" },
          insight: "Customer concentration > 30% is a significant risk factor"
        },
        {
          id: "pricing_model",
          fieldName: "pricing_model",
          question: "How do you price your services/products?",
          type: "radio",
          options: [
            "Time-based (hourly/daily)",
            "Project-based (fixed fee)",
            "Retainer/subscription",
            "Value-based",
            "Mix of the above"
          ]
        }
      ]
    },
    {
      section: "Systems & Delegation",
      description: "How well your business runs without you",
      questions: teamSize === "Just me" ? [
        {
          id: "first_hire_blocker",
          fieldName: "first_hire_blocker",
          question: "What's stopping you from hiring help? (Select all that apply)",
          type: "checkbox",
          options: [
            "Can't afford it yet",
            "Don't know what role to hire for",
            "No time to train someone",
            "Fear of losing quality",
            "Don't know how to hire",
            "Bad past experiences with hiring",
            "Prefer to work alone",
            "Already actively hiring"
          ],
          insight: "Most solo founders could hire 10 hours/week of help profitably"
        },
        {
          id: "delegation_readiness",
          fieldName: "delegation_readiness",
          question: "If you could clone yourself, what would the clone do?",
          type: "checkbox",
          options: [
            "Admin and email",
            "Customer service",
            "Marketing/content",
            "Sales calls",
            "Delivery/fulfillment",
            "Bookkeeping/invoicing",
            "Social media",
            "Nothing - I need to do it all"
          ]
        }
      ] : [
        {
          id: "delegation_failures",
          fieldName: "delegation_failures",
          question: "What happens when you delegate? (Select all that apply)",
          type: "checkbox",
          options: [
            "Quality drops significantly",
            "Takes longer than doing it myself",
            "Constant questions and interruptions",
            "Things get missed or forgotten",
            "Delegation works well",
            "Haven't tried delegating yet"
          ],
          insight: "Delegation failures usually mean process documentation is missing"
        },
        {
          id: "team_bottleneck",
          fieldName: "team_bottleneck",
          question: "Where does your team get stuck waiting for you?",
          type: "checkbox",
          options: [
            "Approvals/sign-offs",
            "Client communication",
            "Pricing decisions",
            "Quality control",
            "Problem-solving",
            "Nowhere - they're autonomous"
          ]
        }
      ],
      additionalQuestions: [
        {
          id: "documented_processes",
          fieldName: "documented_processes",
          question: "Which core processes are documented? (Select all that apply)",
          type: "checkbox",
          options: [
            "How we deliver our service/product",
            "How we onboard new customers",
            "How we handle customer issues",
            "How we generate leads",
            "How we close sales",
            "Financial processes (invoicing, etc.)",
            "None are documented yet"
          ],
          insight: "Documented processes increase business value by 20-40%"
        }
      ]
    },
    {
      section: "Growth Readiness",
      description: "Can your business handle more?",
      questions: [
        {
          id: "growth_capacity",
          fieldName: "growth_capacity",
          question: "If revenue doubled tomorrow, what would break? (Select all that apply)",
          type: "checkbox",
          options: [
            "My personal capacity/time",
            "Delivery/fulfillment capacity",
            "Customer service quality",
            "Quality control",
            "Cash flow (need to fund growth)",
            "Technology/systems",
            "Nothing - we could handle it"
          ],
          insight: "Knowing your bottleneck is 80% of the solution"
        },
        {
          id: "lead_generation",
          fieldName: "lead_generation",
          question: "How do most customers find you?",
          type: "checkbox",
          options: [
            "Referrals from existing customers",
            "Personal network",
            "Social media (organic)",
            "Paid advertising",
            "Content marketing/SEO",
            "Partnerships",
            "Cold outreach",
            "Don't know"
          ]
        }
      ]
    }
  ];
}

function getGrowthQuestions(): any[] {
  return [
    {
      section: "Market Position",
      description: "Your competitive standing and defensibility",
      questions: [
        {
          id: "competitive_advantage",
          fieldName: "competitive_advantage",
          question: "What's your genuine competitive advantage? (Select all that apply)",
          type: "checkbox",
          options: [
            "Unique product features/capability",
            "Superior service/support",
            "Better pricing",
            "Stronger customer relationships",
            "Faster delivery/response",
            "Better technology/systems",
            "Deep industry expertise",
            "Strong brand reputation",
            "Proprietary data or methods",
            "No clear advantage - compete on effort"
          ],
          insight: "Most businesses that think they compete on price actually compete on relationship"
        },
        {
          id: "market_share_growth",
          fieldName: "market_share_growth",
          question: "Is your market share growing, stable, or declining?",
          type: "radio",
          options: [
            "Growing rapidly (taking share from competitors)",
            "Growing slowly (growing with the market)",
            "Stable (holding position)",
            "Declining slowly (losing some share)",
            "Declining rapidly (serious concern)",
            "Don't track/know this"
          ]
        },
        {
          id: "pricing_power",
          fieldName: "pricing_power",
          question: "When did you last raise prices?",
          type: "radio",
          options: [
            "Never",
            "More than 2 years ago",
            "1-2 years ago",
            "Within the last year",
            "Regularly review and adjust"
          ],
          insight: "Pricing power is the strongest indicator of competitive strength"
        }
      ]
    },
    {
      section: "Team & Culture",
      description: "People dependencies and organizational health",
      questions: [
        {
          id: "key_person_risk",
          fieldName: "key_person_risk",
          question: "How many people could the business NOT survive losing? (Including you)",
          type: "radio",
          options: [
            "Just me (founder)",
            "2-3 people including me",
            "4-5 people",
            "No single point of failure"
          ],
          valueImpact: { low: "Just me", high: "No single point of failure" }
        },
        {
          id: "hiring_success",
          fieldName: "hiring_success",
          question: "What's your hiring success rate (hires that work out)?",
          type: "radio",
          options: [
            "Below 50% (more failures than successes)",
            "50-70% (hit and miss)",
            "70-90% (mostly successful)",
            "90%+ (strong track record)",
            "Haven't hired enough to know"
          ]
        },
        {
          id: "culture_documentation",
          fieldName: "culture_documentation",
          question: "Is your company culture documented?",
          type: "radio",
          options: [
            "No - it's in my head",
            "Informal values discussed",
            "Written values exist",
            "Values actively used in decisions/hiring"
          ]
        }
      ]
    },
    {
      section: "Systems Maturity",
      description: "How well your systems support growth",
      questions: [
        {
          id: "system_integration",
          fieldName: "system_integration",
          question: "How integrated are your business systems?",
          type: "radio",
          options: [
            "Everything in spreadsheets/manual",
            "Some systems but not connected",
            "Key systems integrated",
            "Fully integrated tech stack"
          ]
        },
        {
          id: "data_accessibility",
          fieldName: "data_accessibility",
          question: "How quickly can you get key business data?",
          type: "radio",
          options: [
            "Days to compile",
            "Hours to pull together",
            "Real-time dashboards available",
            "Predictive analytics in place"
          ]
        },
        {
          id: "automation_level",
          fieldName: "automation_level",
          question: "What's automated in your business?",
          type: "checkbox",
          options: [
            "Marketing (email sequences, etc.)",
            "Sales (CRM workflows)",
            "Onboarding (new customers)",
            "Invoicing and payments",
            "Reporting",
            "Customer support (chatbots, FAQs)",
            "Very little is automated"
          ]
        }
      ]
    }
  ];
}

function getScaleQuestions(): any[] {
  return [
    {
      section: "Business Independence",
      description: "How well does the business run without you?",
      questions: [
        {
          id: "founder_dependency",
          fieldName: "founder_dependency",
          question: "What still requires your personal involvement? (Select all that apply)",
          type: "checkbox",
          options: [
            "Major sales/business development",
            "Key client relationships",
            "Strategic decisions",
            "Financial decisions (over £X)",
            "Hiring decisions",
            "Product development direction",
            "Quality control/final approval",
            "Crisis management",
            "Nothing critical - business runs without me"
          ],
          insight: "Every item here reduces your business value by 5-10%"
        },
        {
          id: "vacation_test",
          fieldName: "vacation_test",
          question: "What's the longest you've been completely away from the business?",
          type: "radio",
          options: [
            "Never more than a weekend",
            "1 week",
            "2 weeks",
            "3-4 weeks",
            "More than a month"
          ],
          insight: "Buyers use the 'vacation test' as a key valuation factor"
        },
        {
          id: "succession_depth",
          fieldName: "succession_depth",
          question: "How many layers of management exist below you?",
          type: "radio",
          options: [
            "None - everyone reports to me",
            "1 layer (team leads)",
            "2 layers (managers + team leads)",
            "3+ layers"
          ]
        }
      ]
    },
    {
      section: "Exit Readiness",
      description: "Are you prepared if an opportunity arose?",
      questions: [
        {
          id: "exit_timeline",
          fieldName: "exit_timeline",
          question: "When might you consider an exit (sale, investment, succession)?",
          type: "radio",
          options: [
            "ASAP if the right offer came",
            "1-2 years",
            "3-5 years",
            "5-10 years",
            "Never - it's a lifestyle business",
            "Haven't thought about it"
          ]
        },
        {
          id: "valuation_knowledge",
          fieldName: "valuation_knowledge",
          question: "Do you know what your business is worth?",
          type: "radio",
          options: [
            "Professional valuation done in last 2 years",
            "Estimated based on industry multiples",
            "Rough idea only",
            "No idea at all"
          ],
          valueImpact: { low: "No idea", high: "Professional valuation" }
        },
        {
          id: "ip_assets",
          fieldName: "ip_assets",
          question: "What intellectual property does the business own? (Select all that apply)",
          type: "checkbox",
          options: [
            "Registered trademarks",
            "Patents filed or granted",
            "Proprietary software/code",
            "Unique methodologies (documented)",
            "Valuable data sets",
            "Content library (courses, templates, etc.)",
            "Trade secrets (documented)",
            "Nothing formal"
          ],
          insight: "Documented IP can add 20-100% to business value"
        },
        {
          id: "recurring_revenue_percentage",
          fieldName: "recurring_revenue_percentage",
          question: "What percentage of your revenue is recurring?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5,
          labels: { 0: "All one-time", 50: "Mixed", 100: "All recurring" },
          insight: "Recurring revenue is valued at 2-4x one-time revenue multiples"
        }
      ]
    },
    {
      section: "Financial Readiness",
      description: "Due diligence preparation",
      questions: [
        {
          id: "financial_documentation",
          fieldName: "financial_documentation",
          question: "Which financial documents could you produce within 24 hours? (Select all)",
          type: "checkbox",
          options: [
            "3 years of management accounts",
            "Monthly P&L breakdown",
            "Cash flow forecasts",
            "Customer revenue by account",
            "Revenue by product/service",
            "Aged debtors report",
            "None of these"
          ]
        },
        {
          id: "clean_financials",
          fieldName: "clean_financials",
          question: "How clean are your financials?",
          type: "radio",
          options: [
            "Mixed personal/business expenses",
            "Mostly separate but some crossover",
            "Clean separation, basic accounting",
            "Audited/accountant-reviewed annually"
          ]
        }
      ]
    }
  ];
}

function getMatureQuestions(): any[] {
  return [
    {
      section: "Hidden Intellectual Capital",
      description: "Knowledge and processes that exist but aren't captured",
      questions: [
        {
          id: "critical_processes_undocumented",
          fieldName: "critical_processes_undocumented",
          question: "Which critical processes exist only in people's heads? (Select all that apply)",
          type: "checkbox",
          options: [
            "Client delivery methodology",
            "Sales process and qualification",
            "Pricing decisions and exceptions",
            "Quality control standards",
            "Supplier negotiations/relationships",
            "Financial reporting/analysis",
            "Customer escalation handling",
            "New employee onboarding",
            "Strategic planning process"
          ],
          insight: "Each undocumented process is a £25-100k risk to business value"
        },
        {
          id: "knowledge_dependency_percentage",
          fieldName: "knowledge_dependency_percentage",
          question: "What percentage of critical business knowledge is only in your head?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5,
          labels: { 0: "Fully distributed", 50: "Half and half", 100: "All in founder" }
        },
        {
          id: "customer_data_unutilized",
          fieldName: "customer_data_unutilized",
          question: "What customer data do you collect but don't use? (Select all)",
          type: "checkbox",
          options: [
            "Purchase history patterns",
            "Communication preferences",
            "Feedback and complaints",
            "Referral sources",
            "Lifetime value calculations",
            "Churn predictors",
            "None - we use it all",
            "We don't collect much data"
          ]
        }
      ]
    },
    {
      section: "Brand & Trust Equity",
      description: "Credibility assets that could be leveraged",
      questions: [
        {
          id: "hidden_trust_signals",
          fieldName: "hidden_trust_signals",
          question: "Which credibility markers do you NOT display publicly? (Select all)",
          type: "checkbox",
          options: [
            "Industry awards or recognition",
            "Client testimonials (have but don't show)",
            "Media mentions/press coverage",
            "Professional certifications",
            "Partnership badges/logos",
            "Years in business",
            "Team credentials and expertise",
            "Case studies with results",
            "Customer logos (with permission)"
          ],
          insight: "Every hidden trust signal is leaving money on the table"
        },
        {
          id: "personal_brand_percentage",
          fieldName: "personal_brand_percentage",
          question: "What percentage of customers buy because of YOU personally (vs. the business)?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5,
          labels: { 0: "All buy from business", 50: "Mix", 100: "All buy from me" },
          insight: "High personal brand % makes the business unsellable"
        },
        {
          id: "brand_consistency",
          fieldName: "brand_consistency",
          question: "How consistent is your brand across all touchpoints?",
          type: "radio",
          options: [
            "Inconsistent - no brand guidelines",
            "Basic logo/colors but inconsistent messaging",
            "Documented brand guidelines",
            "Fully consistent brand experience"
          ]
        }
      ]
    },
    {
      section: "Market Position Assets",
      description: "Competitive advantages that could be monetized",
      questions: [
        {
          id: "competitive_moat",
          fieldName: "competitive_moat",
          question: "What makes you genuinely hard to compete with? (Select all that apply)",
          type: "checkbox",
          options: [
            "Proprietary technology",
            "Exclusive supplier relationships",
            "Geographic advantage",
            "Cost structure advantage",
            "Network effects (more users = more value)",
            "Regulatory barriers to entry",
            "Deep expertise/reputation",
            "Exclusive data or insights",
            "Customer lock-in (switching costs)",
            "Nothing - we compete on effort/price"
          ]
        },
        {
          id: "top3_customer_revenue_percentage",
          fieldName: "top3_customer_revenue_percentage",
          question: "What percentage of revenue comes from your top 3 customers?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5,
          labels: { 0: "Highly diversified", 50: "Moderate concentration", 100: "Totally dependent" }
        },
        {
          id: "market_position_documentation",
          fieldName: "market_position_documentation",
          question: "Is your market position documented?",
          type: "radio",
          options: [
            "No - it's intuitive",
            "Basic competitor list",
            "Detailed competitive analysis",
            "Regular market intelligence updates"
          ]
        }
      ]
    },
    {
      section: "Systems & Autonomy",
      description: "How the business runs without key people",
      questions: [
        {
          id: "autonomy_sales",
          fieldName: "autonomy_sales",
          question: "If YOU were unavailable for a month, what would happen to SALES?",
          type: "radio",
          options: ["Would stop completely", "Would decline significantly", "Would struggle but continue", "Would run smoothly"]
        },
        {
          id: "autonomy_delivery",
          fieldName: "autonomy_delivery",
          question: "If YOU were unavailable for a month, what would happen to DELIVERY?",
          type: "radio",
          options: ["Would stop completely", "Would decline significantly", "Would struggle but continue", "Would run smoothly"]
        },
        {
          id: "autonomy_finance",
          fieldName: "autonomy_finance",
          question: "If YOU were unavailable for a month, what would happen to FINANCIAL MANAGEMENT?",
          type: "radio",
          options: ["Would stop completely", "Would decline significantly", "Would struggle but continue", "Would run smoothly"]
        },
        {
          id: "autonomy_strategy",
          fieldName: "autonomy_strategy",
          question: "If YOU were unavailable for a month, what would happen to STRATEGIC DECISIONS?",
          type: "radio",
          options: ["Would stop completely", "Would decline significantly", "Would struggle but continue", "Would run smoothly"]
        }
      ]
    },
    {
      section: "People & Succession",
      description: "Leadership depth and key person risk",
      questions: [
        {
          id: "succession_your_role",
          fieldName: "succession_your_role",
          question: "Who could run the business if you stepped back tomorrow?",
          type: "radio",
          options: [
            "Nobody",
            "Someone with 6+ months of training",
            "Someone with ongoing coaching/support",
            "Someone ready now"
          ]
        },
        {
          id: "risk_key_employee",
          fieldName: "risk_key_employee",
          question: "If your most valuable employee left tomorrow, what would happen?",
          type: "radio",
          options: [
            "Crisis situation - major business impact",
            "Significant disruption for months",
            "Manageable disruption - would recover",
            "Barely noticeable - roles are covered"
          ]
        },
        {
          id: "leadership_pipeline",
          fieldName: "leadership_pipeline",
          question: "Do you have a leadership development pipeline?",
          type: "radio",
          options: [
            "No - haven't thought about it",
            "Informal mentoring",
            "Identified high potentials",
            "Active development programs"
          ]
        }
      ]
    },
    {
      section: "Financial & Exit Readiness",
      description: "Preparation for potential transactions",
      questions: [
        {
          id: "documentation_24hr_ready",
          fieldName: "documentation_24hr_ready",
          question: "Which documents could you produce in 24 hours if a buyer asked? (Select all)",
          type: "checkbox",
          options: [
            "3 years audited/reviewed accounts",
            "All customer contracts",
            "All employee contracts",
            "IP ownership documentation",
            "Supplier agreements",
            "Lease and property documents",
            "Insurance certificates",
            "Org chart with job descriptions",
            "Shareholder agreement"
          ]
        },
        {
          id: "know_business_worth",
          fieldName: "know_business_worth",
          question: "Do you know what your business is worth?",
          type: "radio",
          options: [
            "Professional valuation done recently",
            "Estimated based on industry multiples",
            "Rough idea only",
            "No idea at all"
          ]
        },
        {
          id: "exit_obstacles",
          fieldName: "exit_obstacles",
          question: "What would prevent an exit today? (Select all)",
          type: "checkbox",
          options: [
            "Founder dependency",
            "Key person risk",
            "Customer concentration",
            "Unresolved legal issues",
            "Messy financials",
            "Missing documentation",
            "Declining revenue",
            "No obstacles - exit ready"
          ]
        }
      ]
    }
  ];
}

// Actual financials section - prepended to all question sets
// These override any band selections from Part 2
function getActualFinancialsSection(): any {
  return {
    section: "Actual Financial Data (Optional)",
    description: "If you have actual figures from your accounts, enter them here. These will override any estimates and give you more accurate analysis. Leave blank to use estimates.",
    questions: [
      {
        id: "actual_turnover",
        fieldName: "actual_turnover",
        question: "What was your annual turnover/revenue for the last financial year?",
        type: "currency",
        placeholder: "e.g. 217351",
        hint: "Enter the exact figure from your accounts (e.g., £217,351)",
        optional: true
      },
      {
        id: "actual_gross_profit",
        fieldName: "actual_gross_profit",
        question: "What was your gross profit?",
        type: "currency",
        placeholder: "e.g. 79673",
        hint: "Revenue minus cost of sales",
        optional: true
      },
      {
        id: "actual_gross_margin",
        fieldName: "actual_gross_margin",
        question: "What was your gross profit margin percentage?",
        type: "text",
        placeholder: "e.g. 36.66%",
        hint: "Gross profit ÷ Revenue × 100",
        optional: true
      },
      {
        id: "actual_net_profit",
        fieldName: "actual_net_profit",
        question: "What was your net profit (after all costs)?",
        type: "currency",
        placeholder: "e.g. 25000",
        optional: true
      },
      {
        id: "actual_owner_salary",
        fieldName: "actual_owner_salary",
        question: "What was your total annual salary/drawings?",
        type: "currency",
        placeholder: "e.g. 45000",
        hint: "Include all personal income from the business",
        optional: true
      },
      {
        id: "previous_year_turnover",
        fieldName: "previous_year_turnover",
        question: "What was turnover in the year before that?",
        type: "currency",
        placeholder: "e.g. 147458",
        hint: "Helps calculate growth rate",
        optional: true
      }
    ]
  };
}

function getStageSpecificQuestions(stage: BusinessStage, teamSize: string): any[] {
  // Get stage-specific questions
  let questions: any[];
  switch (stage) {
    case 'pre_revenue': questions = getPreRevenueQuestions(); break;
    case 'early_revenue': questions = getEarlyRevenueQuestions(teamSize); break;
    case 'growth': questions = getGrowthQuestions(); break;
    case 'scale': questions = getScaleQuestions(); break;
    case 'mature': questions = getMatureQuestions(); break;
    default: questions = getMatureQuestions();
  }
  
  // Prepend actual financials section (except for pre-revenue)
  if (stage !== 'pre_revenue') {
    return [getActualFinancialsSection(), ...questions];
  }
  
  return questions;
}

// ============================================================================
// VALUE ANALYSIS CALCULATIONS (Comprehensive)
// ============================================================================

function calculateAssetScores(responses: Record<string, any>, stageContext: StageContext): any[] {
  const scores: any[] = [];
  const { stage, revenue, industry } = stageContext;
  
  // ---- 1. INTELLECTUAL CAPITAL ----
  let icScore = 60;
  const issues: string[] = [];
  const opportunities: string[] = [];
  let financialImpact = 0;

  const undocumented = responses.critical_processes_undocumented || [];
  if (undocumented.length > 0) {
    icScore -= undocumented.length * 4;
    issues.push(`${undocumented.length} critical processes undocumented (${undocumented.slice(0, 3).join(', ')}${undocumented.length > 3 ? '...' : ''})`);
    opportunities.push('Document top 3 processes starting with delivery methodology');
    financialImpact += undocumented.length * 35000; // £35k per undocumented process
  }

  const dependency = parseInt(responses.knowledge_dependency_percentage) || 0;
  if (dependency > 80) {
    icScore -= 25;
    issues.push(`${dependency}% of knowledge concentrated in founder - critical risk`);
    opportunities.push('Create knowledge transfer plan for key processes');
    financialImpact += 150000;
  } else if (dependency > 60) {
    icScore -= 15;
    issues.push(`${dependency}% knowledge still centralized`);
    opportunities.push('Implement documentation sprints');
    financialImpact += 75000;
  } else if (dependency < 40) {
    icScore += 10;
  }

  const unutilizedData = responses.customer_data_unutilized || [];
  if (unutilizedData.length > 2 && !unutilizedData.includes("None - we use it all")) {
    icScore -= 5;
    opportunities.push('Monetize unused customer data through better segmentation');
    financialImpact += 25000;
  }

  scores.push({
    category: 'Intellectual Capital',
    score: Math.max(0, Math.min(100, icScore)),
    maxScore: 100,
    weight: 0.20,
    issues,
    opportunities,
    financialImpact,
    benchmarkRange: { low: 40, average: 60, high: 80 },
    quickWins: undocumented.length > 0 ? ['Document one core process this week'] : []
  });

  // ---- 2. BRAND & TRUST EQUITY ----
  let btScore = 60;
  const btIssues: string[] = [];
  const btOpportunities: string[] = [];
  let btFinancialImpact = 0;

  const hiddenSignals = responses.hidden_trust_signals || [];
  if (hiddenSignals.length > 0) {
    btScore -= hiddenSignals.length * 3;
    btIssues.push(`${hiddenSignals.length} trust signals not displayed publicly`);
    btOpportunities.push('Add testimonials and case studies to website');
    btOpportunities.push('Create credibility/about page with awards and credentials');
    btFinancialImpact += hiddenSignals.length * 12000;
  }

  const personalBrand = parseInt(responses.personal_brand_percentage) || 0;
  if (personalBrand > 70) {
    btScore -= 25;
    btIssues.push(`${personalBrand}% of customers buy because of founder personally - business is unsellable`);
    btOpportunities.push('Build team visibility and brand independent of founder');
    btFinancialImpact += revenue * 0.3; // 30% of revenue at risk
  } else if (personalBrand > 50) {
    btScore -= 15;
    btIssues.push(`${personalBrand}% founder-dependent sales`);
    btOpportunities.push('Introduce team members in customer communications');
    btFinancialImpact += 75000;
  } else if (personalBrand < 30) {
    btScore += 10;
  }

  const brandConsistency = responses.brand_consistency;
  if (brandConsistency === "No - it's in my head" || brandConsistency === "Inconsistent - no brand guidelines") {
    btScore -= 10;
    btOpportunities.push('Create basic brand guidelines document');
  }

  scores.push({
    category: 'Brand & Trust Equity',
    score: Math.max(0, Math.min(100, btScore)),
    maxScore: 100,
    weight: 0.15,
    issues: btIssues,
    opportunities: btOpportunities,
    financialImpact: btFinancialImpact,
    benchmarkRange: { low: 35, average: 55, high: 75 },
    quickWins: hiddenSignals.length > 0 ? ['Display 3 testimonials on homepage this week'] : []
  });

  // ---- 3. MARKET POSITION ----
  let mpScore = 60;
  const mpIssues: string[] = [];
  const mpOpportunities: string[] = [];
  let mpFinancialImpact = 0;

  const moat = responses.competitive_moat || [];
  if (moat.includes('Nothing - we compete on effort/price') || moat.includes('No clear advantage - compete on effort')) {
    mpScore -= 30;
    mpIssues.push('No competitive moat - vulnerable to price competition');
    mpOpportunities.push('Identify and document your unique expertise');
    mpFinancialImpact += revenue * 0.2;
  } else {
    mpScore += Math.min(moat.length * 5, 25);
    if (moat.length >= 3) {
      mpOpportunities.push('Communicate competitive advantages more clearly');
    }
  }

  const concentration = parseInt(responses.top3_customer_revenue_percentage) || parseInt(responses.top_customer_revenue) || 0;
  if (concentration > 60) {
    mpScore -= 25;
    mpIssues.push(`${concentration}% revenue from top 3 customers - critical concentration risk`);
    mpOpportunities.push('Urgent: diversify customer base');
    mpFinancialImpact += revenue * 0.4;
  } else if (concentration > 40) {
    mpScore -= 15;
    mpIssues.push(`${concentration}% revenue concentrated in top customers`);
    mpOpportunities.push('Develop customer acquisition strategy for diversification');
    mpFinancialImpact += 100000;
  } else if (concentration < 25) {
    mpScore += 10;
  }

  const marketPosition = responses.market_position_documentation;
  if (marketPosition === "No - it's intuitive") {
    mpScore -= 5;
    mpOpportunities.push('Document competitive landscape');
  }

  scores.push({
    category: 'Market Position',
    score: Math.max(0, Math.min(100, mpScore)),
    maxScore: 100,
    weight: 0.20,
    issues: mpIssues,
    opportunities: mpOpportunities,
    financialImpact: mpFinancialImpact,
    benchmarkRange: { low: 40, average: 60, high: 85 },
    quickWins: concentration > 40 ? ['Identify 10 target prospects for diversification'] : []
  });

  // ---- 4. SYSTEMS & SCALE READINESS ----
  let ssScore = 60;
  const ssIssues: string[] = [];
  const ssOpportunities: string[] = [];
  let ssFinancialImpact = 0;

  // Autonomy assessment
  const autonomyFields = ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance', 'autonomy_strategy'];
  let failedProcesses = 0;
  let strugglingProcesses = 0;
  
  autonomyFields.forEach(field => {
    const value = responses[field];
    if (value === 'Would stop completely') {
      failedProcesses++;
      ssIssues.push(`${field.replace('autonomy_', '').toUpperCase()} would stop without founder`);
    } else if (value === 'Would decline significantly') {
      strugglingProcesses++;
    }
  });

  if (failedProcesses > 1) {
    ssScore -= failedProcesses * 12;
    ssOpportunities.push('Critical: build redundancy in core functions');
    ssFinancialImpact += failedProcesses * 50000;
  }
  if (strugglingProcesses > 0) {
    ssScore -= strugglingProcesses * 5;
    ssOpportunities.push('Train backup staff on key responsibilities');
  }
  if (failedProcesses === 0 && strugglingProcesses === 0) {
    ssScore += 20;
  }

  const systemIntegration = responses.system_integration;
  if (systemIntegration === 'Everything in spreadsheets/manual' || systemIntegration === 'Everything manual/spreadsheets') {
    ssScore -= 15;
    ssIssues.push('Manual systems limit scalability');
    ssOpportunities.push('Implement core business systems (CRM, accounting, project management)');
    ssFinancialImpact += 40000;
  }

  const growthCapacity = responses.growth_capacity || [];
  if (growthCapacity.includes('My personal capacity/time')) {
    ssScore -= 10;
    ssIssues.push('Founder capacity is the growth bottleneck');
    ssOpportunities.push('Identify tasks to delegate or systematize');
  }

  scores.push({
    category: 'Systems & Scale Readiness',
    score: Math.max(0, Math.min(100, ssScore)),
    maxScore: 100,
    weight: 0.15,
    issues: ssIssues,
    opportunities: ssOpportunities,
    financialImpact: ssFinancialImpact,
    benchmarkRange: { low: 35, average: 55, high: 80 },
    quickWins: failedProcesses > 0 ? ['Document one critical process this week'] : []
  });

  // ---- 5. PEOPLE & CULTURE ----
  let pcScore = 60;
  const pcIssues: string[] = [];
  const pcOpportunities: string[] = [];
  let pcFinancialImpact = 0;

  const succession = responses.succession_your_role;
  if (succession === 'Nobody') {
    pcScore -= 25;
    pcIssues.push('No succession plan - critical dependency on founder');
    pcOpportunities.push('Identify and develop potential successor(s)');
    pcFinancialImpact += 200000;
  } else if (succession === 'Someone with 6+ months of training') {
    pcScore -= 10;
    pcOpportunities.push('Accelerate succession planning');
    pcFinancialImpact += 50000;
  } else if (succession === 'Someone ready now') {
    pcScore += 15;
  }

  const keyEmployeeRisk = responses.risk_key_employee;
  if (keyEmployeeRisk === 'Crisis situation - major business impact' || keyEmployeeRisk === 'Crisis situation') {
    pcScore -= 20;
    pcIssues.push('Critical key person dependency beyond founder');
    pcOpportunities.push('Cross-train team on critical functions');
    pcFinancialImpact += 100000;
  }

  const leadershipPipeline = responses.leadership_pipeline;
  if (leadershipPipeline === "No - haven't thought about it") {
    pcScore -= 10;
    pcOpportunities.push('Start identifying high-potential team members');
  }

  const keyPersonRisk = responses.key_person_risk;
  if (keyPersonRisk === 'Just me (founder)') {
    pcScore -= 15;
    pcIssues.push('Business entirely dependent on founder');
  }

  scores.push({
    category: 'People & Culture',
    score: Math.max(0, Math.min(100, pcScore)),
    maxScore: 100,
    weight: 0.15,
    issues: pcIssues,
    opportunities: pcOpportunities,
    financialImpact: pcFinancialImpact,
    benchmarkRange: { low: 30, average: 50, high: 75 },
    quickWins: succession === 'Nobody' ? ['Write job description for your role'] : []
  });

  // ---- 6. FINANCIAL & EXIT READINESS ----
  let feScore = 60;
  const feIssues: string[] = [];
  const feOpportunities: string[] = [];
  let feFinancialImpact = 0;

  const readyDocs = responses.documentation_24hr_ready || responses.financial_documentation || [];
  if (readyDocs.length < 4) {
    feScore -= 20;
    feIssues.push(`Only ${readyDocs.length}/9 due diligence documents ready`);
    feOpportunities.push('Prepare data room with key documents');
    feFinancialImpact += 80000;
  } else if (readyDocs.length >= 7) {
    feScore += 15;
  }

  const valuationKnowledge = responses.know_business_worth || responses.valuation_knowledge;
  if (valuationKnowledge === 'No idea at all') {
    feScore -= 15;
    feIssues.push('Unknown business value - negotiation disadvantage');
    feOpportunities.push('Get indicative valuation from advisor');
    feFinancialImpact += 50000;
  } else if (valuationKnowledge === 'Professional valuation done recently' || valuationKnowledge === 'Professional valuation done in last 2 years') {
    feScore += 10;
  }

  const recurringRevenue = parseInt(responses.recurring_revenue_percentage) || 0;
  if (recurringRevenue > 70) {
    feScore += 15;
  } else if (recurringRevenue < 20) {
    feScore -= 10;
    feOpportunities.push('Develop recurring revenue model');
    feFinancialImpact += revenue * 0.15;
  }

  const cleanFinancials = responses.clean_financials;
  if (cleanFinancials === 'Mixed personal/business expenses') {
    feScore -= 15;
    feIssues.push('Mixed personal/business expenses - red flag for buyers');
    feOpportunities.push('Separate all personal and business expenses');
  }

  const exitObstacles = responses.exit_obstacles || [];
  if (exitObstacles.length > 0 && !exitObstacles.includes('No obstacles - exit ready')) {
    feScore -= exitObstacles.length * 3;
    feIssues.push(`${exitObstacles.length} identified obstacles to exit`);
  }

  scores.push({
    category: 'Financial & Exit Readiness',
    score: Math.max(0, Math.min(100, feScore)),
    maxScore: 100,
    weight: 0.15,
    issues: feIssues,
    opportunities: feOpportunities,
    financialImpact: feFinancialImpact,
    benchmarkRange: { low: 25, average: 50, high: 80 },
    quickWins: readyDocs.length < 4 ? ['Gather all contracts into one folder'] : []
  });

  return scores;
}

function identifyValueGaps(responses: Record<string, any>, assetScores: any[], stageContext: StageContext): any[] {
  const gaps: any[] = [];
  const { revenue, industry } = stageContext;

  // From undocumented processes
  const undocumented = responses.critical_processes_undocumented || [];
  if (undocumented.length > 0) {
    const value = undocumented.length * 35000;
    gaps.push({
      area: 'Process Documentation',
      category: 'Intellectual Capital',
      currentValue: 0,
      potentialValue: value,
      gap: value,
      timeframe: undocumented.length > 4 ? '6-12 weeks' : '4-8 weeks',
      effort: undocumented.length > 4 ? 'High' : 'Medium',
      priority: 1,
      actions: [
        `Document "${undocumented[0]}" process first (highest impact)`,
        'Create SOP template for consistency',
        'Train team on documented processes',
        undocumented.length > 3 ? 'Consider hiring documentation specialist' : 'Allocate 2 hours/week for documentation'
      ],
      roiCalculation: `${undocumented.length} processes × £35k value each = £${value.toLocaleString()}`,
      implementationSteps: [
        'Week 1: Shadow current process, take notes',
        'Week 2: Draft SOP with screenshots/videos',
        'Week 3: Review with team, refine',
        'Week 4: Train backup staff, test'
      ]
    });
  }

  // From customer concentration
  const concentration = parseInt(responses.top3_customer_revenue_percentage) || parseInt(responses.top_customer_revenue) || 0;
  if (concentration > 40) {
    const riskValue = revenue * (concentration / 100) * 0.6; // 60% at risk
    gaps.push({
      area: 'Customer Diversification',
      category: 'Market Position',
      currentValue: 0,
      potentialValue: riskValue,
      gap: riskValue,
      timeframe: '3-6 months',
      effort: 'High',
      priority: concentration > 60 ? 1 : 2,
      actions: [
        'Define ideal customer profile outside current base',
        'Develop targeted acquisition strategy',
        `Aim to reduce concentration to <30% (currently ${concentration}%)`,
        'Create customer retention program for existing accounts'
      ],
      roiCalculation: `£${revenue.toLocaleString()} × ${concentration}% concentration × 60% risk = £${riskValue.toLocaleString()} at risk`,
      implementationSteps: [
        'Month 1: Identify 20 target prospects',
        'Month 2: Launch outreach campaign',
        'Month 3: Convert first new customers',
        'Months 4-6: Scale what works'
      ]
    });
  }

  // From hidden trust signals
  const hiddenSignals = responses.hidden_trust_signals || [];
  if (hiddenSignals.length > 0) {
    const value = hiddenSignals.length * 12000;
    gaps.push({
      area: 'Trust Signal Optimization',
      category: 'Brand & Trust Equity',
      currentValue: 0,
      potentialValue: value,
      gap: value,
      timeframe: '1-2 weeks',
      effort: 'Low',
      priority: 3,
      actions: [
        'Add all testimonials to website',
        'Create "Why Us" or credibility page',
        'Display awards, certifications, logos',
        'Include trust signals in sales materials'
      ],
      roiCalculation: `${hiddenSignals.length} signals × £12k conversion impact = £${value.toLocaleString()}`,
      implementationSteps: [
        'Day 1-2: Gather all credentials and testimonials',
        'Day 3-5: Design credibility page',
        'Day 6-7: Update homepage with trust elements',
        'Ongoing: Request testimonials from happy clients'
      ]
    });
  }

  // From founder dependency
  const personalBrand = parseInt(responses.personal_brand_percentage) || 0;
  if (personalBrand > 50) {
    const value = revenue * (personalBrand / 100) * 0.4;
    gaps.push({
      area: 'Founder Independence',
      category: 'Brand & Trust Equity',
      currentValue: 0,
      potentialValue: value,
      gap: value,
      timeframe: '6-12 months',
      effort: 'High',
      priority: 2,
      actions: [
        'Introduce team members in all communications',
        'Build team visibility on LinkedIn and website',
        'Transition key client relationships to team',
        'Create brand voice guidelines (not founder voice)'
      ],
      roiCalculation: `${personalBrand}% founder-dependent × £${revenue.toLocaleString()} × 40% risk = £${value.toLocaleString()}`,
      implementationSteps: [
        'Month 1: Identify 3 team members to elevate',
        'Month 2: Create content featuring team expertise',
        'Month 3-4: Introduce team to top clients',
        'Month 5-6: Team handles new client relationships'
      ]
    });
  }

  // From succession planning
  if (responses.succession_your_role === 'Nobody') {
    gaps.push({
      area: 'Succession Planning',
      category: 'People & Culture',
      currentValue: 0,
      potentialValue: 200000,
      gap: 200000,
      timeframe: '12-24 months',
      effort: 'High',
      priority: 1,
      actions: [
        'Document your role responsibilities',
        'Identify internal candidate or hiring need',
        'Create development plan',
        'Start gradual transition of responsibilities'
      ],
      roiCalculation: 'Succession readiness adds 15-25% to business value',
      implementationSteps: [
        'Quarter 1: Document all founder responsibilities',
        'Quarter 2: Identify and assess candidates',
        'Quarter 3: Begin structured handover',
        'Quarter 4: First month without founder involvement'
      ]
    });
  }

  // From recurring revenue
  const recurringRevenue = parseInt(responses.recurring_revenue_percentage) || 0;
  if (recurringRevenue < 30 && revenue > 0) {
    const potentialValue = revenue * 0.5; // Recurring revenue worth 2x, so 50% uplift
    gaps.push({
      area: 'Recurring Revenue Model',
      category: 'Financial & Exit Readiness',
      currentValue: 0,
      potentialValue,
      gap: potentialValue,
      timeframe: '3-6 months',
      effort: 'Medium',
      priority: 2,
      actions: [
        'Identify services suitable for retainer/subscription',
        'Create pricing for recurring model',
        'Convert existing customers to recurring',
        'Target 50%+ recurring revenue'
      ],
      roiCalculation: `Recurring revenue valued at 2-4x one-time. £${revenue.toLocaleString()} → potential £${potentialValue.toLocaleString()} value uplift`,
      implementationSteps: [
        'Week 1-2: Design recurring service offering',
        'Week 3-4: Test pricing with existing customers',
        'Month 2: Launch to wider customer base',
        'Month 3-6: Optimize and scale'
      ]
    });
  }

  return gaps.sort((a, b) => a.priority - b.priority || b.gap - a.gap);
}

function assessRisks(responses: Record<string, any>, assetScores: any[], stageContext: StageContext): any[] {
  const risks: any[] = [];
  const { revenue, industry } = stageContext;

  // Knowledge concentration risk
  const dependency = parseInt(responses.knowledge_dependency_percentage) || 0;
  if (dependency > 75) {
    risks.push({
      title: 'Critical Knowledge Concentration',
      severity: 'Critical',
      category: 'Intellectual Capital',
      impact: `${dependency}% of business knowledge is in founder's head. If founder becomes unavailable, business operations severely impacted.`,
      likelihood: 'Medium',
      financialExposure: revenue * 0.5,
      mitigation: 'Document critical processes within 90 days. Cross-train team on key knowledge areas.',
      mitigationCost: 25000,
      mitigationTimeframe: '90 days',
      monitoringMetric: 'Knowledge dependency % (target: <50%)'
    });
  }

  // Succession risk
  if (responses.succession_your_role === 'Nobody') {
    risks.push({
      title: 'No Succession Plan',
      severity: 'High',
      category: 'People & Culture',
      impact: 'Business cannot continue without founder. Zero value in sale scenario.',
      likelihood: 'Certain if founder exits',
      financialExposure: revenue * 2, // Business value at risk
      mitigation: 'Identify and develop successor(s). Document founder responsibilities.',
      mitigationCost: 50000,
      mitigationTimeframe: '12-24 months',
      monitoringMetric: 'Succession readiness score'
    });
  }

  // Customer concentration risk
  const concentration = parseInt(responses.top3_customer_revenue_percentage) || parseInt(responses.top_customer_revenue) || 0;
  if (concentration > 50) {
    risks.push({
      title: 'Customer Concentration Risk',
      severity: concentration > 70 ? 'Critical' : 'High',
      category: 'Market Position',
      impact: `${concentration}% of revenue from top 3 customers. Loss of any would significantly impact business.`,
      likelihood: 'High',
      financialExposure: revenue * (concentration / 100),
      mitigation: 'Accelerate customer acquisition. Implement retention program.',
      mitigationCost: 30000,
      mitigationTimeframe: '6 months',
      monitoringMetric: 'Top 3 customer revenue % (target: <30%)'
    });
  }

  // Operational fragility
  let failedProcesses = 0;
  ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance'].forEach(f => {
    if (responses[f] === 'Would stop completely') failedProcesses++;
  });
  if (failedProcesses > 1) {
    risks.push({
      title: 'Operational Fragility',
      severity: 'High',
      category: 'Systems & Scale',
      impact: `${failedProcesses} critical business processes would stop without founder.`,
      likelihood: 'Certain if founder unavailable',
      financialExposure: failedProcesses * 50000,
      mitigation: 'Document SOPs for each critical process. Train backup staff.',
      mitigationCost: failedProcesses * 15000,
      mitigationTimeframe: '8 weeks',
      monitoringMetric: 'Business continuity score'
    });
  }

  // Key employee risk
  if (responses.risk_key_employee === 'Crisis situation - major business impact' || responses.risk_key_employee === 'Crisis situation') {
    risks.push({
      title: 'Key Employee Dependency',
      severity: 'High',
      category: 'People & Culture',
      impact: 'Business would face crisis if key employee left. Critical single point of failure.',
      likelihood: 'Medium',
      financialExposure: 100000,
      mitigation: 'Cross-train team. Improve retention for key employee. Document their processes.',
      mitigationCost: 20000,
      mitigationTimeframe: '3 months',
      monitoringMetric: 'Key person redundancy score'
    });
  }

  // Personal brand dependency
  const personalBrand = parseInt(responses.personal_brand_percentage) || 0;
  if (personalBrand > 60) {
    risks.push({
      title: 'Personal Brand Dependency',
      severity: 'High',
      category: 'Brand & Trust Equity',
      impact: `${personalBrand}% of customers buy because of founder. Business unsellable in current state.`,
      likelihood: 'Certain',
      financialExposure: revenue * (personalBrand / 100),
      mitigation: 'Build business brand independent of founder. Elevate team visibility.',
      mitigationCost: 15000,
      mitigationTimeframe: '12 months',
      monitoringMetric: 'Personal brand dependency % (target: <30%)'
    });
  }

  // No competitive moat
  const moat = responses.competitive_moat || [];
  if (moat.includes('Nothing - we compete on effort/price') || moat.includes('No clear advantage - compete on effort')) {
    risks.push({
      title: 'No Competitive Moat',
      severity: 'Medium',
      category: 'Market Position',
      impact: 'Business vulnerable to price competition. No defensible advantage.',
      likelihood: 'High',
      financialExposure: revenue * 0.2,
      mitigation: 'Develop proprietary methods, build exclusive relationships, or create switching costs.',
      mitigationCost: 25000,
      mitigationTimeframe: '6-12 months',
      monitoringMetric: 'Competitive advantage score'
    });
  }

  return risks.sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 } as Record<string, number>;
    return order[a.severity] - order[b.severity];
  });
}

function calculateValuationImpact(assetScores: any[], riskRegister: any[], stageContext: StageContext): any {
  const { revenue, industry, stage } = stageContext;
  
  // Base multiplier by industry
  const baseMultipliers: Record<string, number> = {
    'technology': 4.0,
    'consulting': 2.5,
    'agency': 2.0,
    'fitness_equipment': 2.5,
    'trades': 1.5,
    'general_business': 2.0
  };
  
  const baseMultiplier = baseMultipliers[industry] || 2.0;
  const overallScore = Math.round(assetScores.reduce((sum, s) => sum + (s.score * s.weight), 0) / 
                                  assetScores.reduce((sum, s) => sum + s.weight, 0));
  
  // Adjust multiplier based on score
  let adjustedMultiplier = baseMultiplier;
  if (overallScore < 40) adjustedMultiplier *= 0.6; // 40% discount for poor score
  else if (overallScore < 60) adjustedMultiplier *= 0.8;
  else if (overallScore > 80) adjustedMultiplier *= 1.3;
  else if (overallScore > 70) adjustedMultiplier *= 1.1;

  // Risk adjustments
  const criticalRisks = riskRegister.filter(r => r.severity === 'Critical').length;
  const highRisks = riskRegister.filter(r => r.severity === 'High').length;
  adjustedMultiplier -= criticalRisks * 0.3;
  adjustedMultiplier -= highRisks * 0.1;
  adjustedMultiplier = Math.max(0.5, adjustedMultiplier);

  const currentValuation = revenue * baseMultiplier;
  const adjustedValuation = revenue * adjustedMultiplier;
  
  // Potential with improvements
  const potentialMultiplier = Math.min(baseMultiplier * 1.5, adjustedMultiplier + 1.5);
  const potentialValuation = revenue * potentialMultiplier;
  
  const totalOpportunity = assetScores.reduce((sum, s) => sum + s.financialImpact, 0);

  return {
    currentValuation: Math.round(adjustedValuation),
    potentialValuation: Math.round(potentialValuation),
    baselineValuation: Math.round(currentValuation),
    percentageIncrease: Math.round(((potentialValuation / adjustedValuation) - 1) * 100),
    currentMultiple: Math.round(adjustedMultiplier * 10) / 10,
    potentialMultiple: Math.round(potentialMultiplier * 10) / 10,
    baseMultiple: baseMultiplier,
    totalOpportunity: Math.round(totalOpportunity),
    valueDrivers: {
      overallScore,
      criticalRisks,
      highRisks,
      topOpportunity: assetScores.reduce((top, s) => s.financialImpact > top.impact ? { category: s.category, impact: s.financialImpact } : top, { category: '', impact: 0 })
    },
    industryContext: `${industry} businesses typically trade at ${baseMultiplier}x revenue. Your current score of ${overallScore}/100 ${overallScore < 60 ? 'reduces' : 'maintains or improves'} this multiple.`
  };
}

function generate30DayPlan(assetScores: any[], valueGaps: any[], risks: any[], stageContext: StageContext): any {
  const { stage, industry } = stageContext;
  
  // Prioritize by impact and effort
  const quickWins = assetScores.flatMap(s => s.quickWins || []).slice(0, 3);
  const urgentActions = risks.filter(r => r.severity === 'Critical').map(r => r.mitigation);
  const highValueLowEffort = valueGaps.filter(g => g.effort === 'Low').slice(0, 2);
  
  return {
    week1: {
      theme: 'Quick Wins & Risk Mitigation',
      focus: quickWins.length > 0 ? quickWins[0] : 'Document one critical process',
      tasks: [
        ...quickWins.slice(0, 2),
        ...(urgentActions.length > 0 ? [urgentActions[0]] : [])
      ],
      milestone: 'First visible improvement achieved'
    },
    week2: {
      theme: 'Building Momentum',
      focus: highValueLowEffort.length > 0 ? highValueLowEffort[0].area : 'Trust signal optimization',
      tasks: highValueLowEffort.map(g => g.actions?.[0]).filter(Boolean).slice(0, 3),
      milestone: 'Trust signals visible, first gap addressed'
    },
    week3: {
      theme: 'Foundation Building',
      focus: 'Process documentation',
      tasks: [
        'Draft SOP for most critical process',
        'Review with team member',
        'Identify next process to document'
      ],
      milestone: 'First process documented and tested'
    },
    week4: {
      theme: 'Review & Plan',
      focus: 'Assess progress, plan next 30 days',
      tasks: [
        'Review all improvements made',
        'Measure impact where possible',
        'Plan next 30-day sprint',
        'Celebrate wins with team'
      ],
      milestone: 'Clear progress visible, momentum established'
    },
    summary: `In 30 days, address ${quickWins.length} quick wins, ${urgentActions.length > 0 ? '1 critical risk' : 'key risks'}, and begin closing ${highValueLowEffort.length} low-effort value gaps.`
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { action, clientId, practiceId, part3Responses } = await req.json();

    // ACTION 1: Get stage-specific questions
    if (action === 'get-questions') {
      console.log(`Getting Part 3 questions for client ${clientId}...`);
      
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2']);

      const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
      const stageContext = determineBusinessStage(part1, part2);
      const questions = getStageSpecificQuestions(stageContext.stage, stageContext.teamSize);

      console.log(`Stage: ${stageContext.stage}, ${questions.length} sections, ${questions.reduce((sum, s) => sum + s.questions.length, 0)} questions`);

      return new Response(JSON.stringify({
        success: true,
        businessStage: stageContext.stage,
        stageDescription: {
          'pre_revenue': 'Pre-Revenue: Focus on validation, runway, and first customer',
          'early_revenue': 'Early Revenue: Building foundations and systems',
          'growth': 'Growth Stage: Scaling and market position',
          'scale': 'Scale Stage: Independence and exit readiness',
          'mature': 'Mature: Comprehensive value audit'
        }[stageContext.stage],
        questions,
        questionCount: questions.reduce((sum, s) => sum + s.questions.length, 0),
        context: {
          companyName: stageContext.companyName,
          revenue: stageContext.revenueBand,
          teamSize: stageContext.teamSize,
          yearsTrading: stageContext.yearsTrading,
          industry: stageContext.industry,
          stage: stageContext.stage
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION 2: Generate value analysis
    if (action === 'generate-analysis') {
      if (!part3Responses) {
        return new Response(JSON.stringify({ error: 'Missing part3Responses' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log(`Generating comprehensive value analysis for client ${clientId}...`);
      const startTime = Date.now();

      // Check for existing stage record to determine version
      const { data: existingStages } = await supabase
        .from('roadmap_stages')
        .select('version')
        .eq('client_id', clientId)
        .eq('stage_type', 'value_analysis')
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingStages && existingStages.length > 0 
        ? existingStages[0].version + 1 
        : 1;

      console.log(`Creating value_analysis stage with version ${nextVersion}`);

      // Create stage record
      const { data: stage, error: stageError } = await supabase
        .from('roadmap_stages')
        .insert({
          practice_id: practiceId,
          client_id: clientId,
          stage_type: 'value_analysis',
          version: nextVersion,
          status: 'generating',
          generation_started_at: new Date().toISOString(),
          model_used: 'rule-based-v1'
        })
        .select()
        .single();

      if (stageError) {
        console.warn('Could not create stage record:', stageError.message);
        // Continue anyway - backward compatibility
      }

      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2']);

      const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
      
      // Pass part3Responses to allow actual financial figures to override bands
      const stageContext = determineBusinessStage(part1, part2, part3Responses);

      // Fetch any uploaded context documents (like accounts)
      const { data: contextDocs } = await supabase
        .from('client_context')
        .select('content, type, priority')
        .eq('client_id', clientId);

      // Fetch previous stages for narrative context
      const { data: fitStage } = await supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .eq('stage_type', 'fit_assessment')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: visionStage } = await supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .eq('stage_type', 'five_year_vision')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const fitProfile = fitStage?.approved_content || fitStage?.generated_content || {};
      const vision = visionStage?.approved_content || visionStage?.generated_content || {};

      // Calculate all analysis components
      const assetScores = calculateAssetScores(part3Responses, stageContext);
      const valueGaps = identifyValueGaps(part3Responses, assetScores, stageContext);
      const riskRegister = assessRisks(part3Responses, assetScores, stageContext);
      const valuationImpact = calculateValuationImpact(assetScores, riskRegister, stageContext);
      const thirtyDayPlan = generate30DayPlan(assetScores, valueGaps, riskRegister, stageContext);

      // ============ NEW: BUSINESS VALUATION ============
      // Extract financial data from assessments and uploaded documents
      // Pass part3Responses for actual financial figures
      const financialData = extractFinancialsFromContext(
        contextDocs || [],
        stageContext,
        part2,
        part3Responses
      );

      // Analyze value drivers
      const valueDrivers = analyzeValueDrivers(
        financialData,
        part3Responses,
        stageContext,
        assetScores
      );

      // Calculate comprehensive business valuation
      const businessValuation = calculateBusinessValuation(
        financialData,
        valueDrivers,
        stageContext,
        assetScores
      );

      console.log(`Business valuation calculated: £${businessValuation.baselineValue.toLocaleString()} (range: £${businessValuation.valueRange.low.toLocaleString()} - £${businessValuation.valueRange.high.toLocaleString()})`);

      const overallScore = valuationImpact.valueDrivers.overallScore;
      const totalOpportunity = valuationImpact.totalOpportunity;

      // Generate narrative summary (The Uncomfortable Truth)
      console.log('Generating narrative summary...');
      const narrativeSummary = await generateNarrativeSummary(
        stageContext,
        financialData,
        overallScore,
        totalOpportunity,
        riskRegister,
        valueGaps,
        fitProfile,
        vision
      );

      const valueAnalysis = {
        // NEW: Narrative Summary (The Uncomfortable Truth)
        narrativeSummary: narrativeSummary || {
          uncomfortableTruth: `Your overall score is ${overallScore}/100 with £${totalOpportunity.toLocaleString()} in identified opportunities.`,
          whatThisReallyMeans: 'This represents the gap between where you are and where you could be.',
          beforeYouDoAnythingElse: riskRegister.find(r => r.severity === 'Critical')?.risk || 'Address your highest-impact opportunity first.',
          theGoodNews: overallScore >= 60 ? 'You have a solid foundation to build on.' : 'Every business starts somewhere—the key is knowing where to focus.'
        },
        businessStage: stageContext.stage,
        stageContext,
        
        // NEW: Business Valuation Section
        businessValuation: {
          asOfDate: businessValuation.asOfDate,
          method: businessValuation.method,
          currentValue: businessValuation.baselineValue,
          valueRange: businessValuation.valueRange,
          potentialValue: businessValuation.potentialValue,
          valueGapAmount: businessValuation.valueGap,
          keyMetrics: {
            revenue: financialData.revenue,
            grossMargin: `${Math.round(financialData.grossMargin * 100)}%`,
            netProfit: financialData.netProfit,
            sde: financialData.sde,
            ebitda: financialData.ebitda,
            growthRate: `${Math.round(financialData.yearOnYearGrowth * 100)}%`,
            recurringRevenue: `${Math.round(financialData.recurringRevenuePercentage * 100)}%`
          },
          valueDrivers: businessValuation.valueDrivers,
          industryComparison: businessValuation.industryComparison,
          roi: businessValuation.roi,
          exitReadiness: businessValuation.exitReadiness
        },
        
        assetScores,
        overallScore,
        scoreInterpretation: overallScore < 40 ? 'Significant improvement needed' : 
                            overallScore < 60 ? 'Good foundation with opportunities' :
                            overallScore < 80 ? 'Strong position' : 'Excellent - maintain and optimize',
        valueGaps,
        riskRegister,
        totalOpportunity,
        valuationImpact,
        thirtyDayPlan,
        generatedAt: new Date().toISOString(),
        generationDurationMs: Date.now() - startTime
      };

      // Apply cleanup to all string fields in value analysis
      const cleanedValueAnalysis = cleanAllStrings(valueAnalysis);
      const duration = Date.now() - startTime;
      
      // Update stage record if it was created
      if (stage) {
        const { error: stageUpdateError } = await supabase
          .from('roadmap_stages')
          .update({
            status: 'generated',
            generated_content: cleanedValueAnalysis,
            generation_completed_at: new Date().toISOString(),
            generation_duration_ms: duration
          })
          .eq('id', stage.id);
        
        if (stageUpdateError) {
          console.error('Failed to update value_analysis stage:', stageUpdateError);
        } else {
          console.log(`Value analysis stage updated to 'generated' for client ${clientId} in ${duration}ms`);
        }
      }
      
      // Update roadmap with value analysis (backward compatibility)
      const { error: updateError } = await supabase
        .from('client_roadmaps')
        .update({ value_analysis: cleanedValueAnalysis })
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (updateError) {
        console.warn('Could not update roadmap with value analysis:', updateError.message);
      }

      // Save Part 3 responses
      await supabase.from('client_assessments').upsert({
        practice_id: practiceId,
        client_id: clientId,
        assessment_type: 'part3',
        responses: part3Responses,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, { onConflict: 'client_id,assessment_type' });

      console.log(`Value analysis complete! Score: ${overallScore}/100, Opportunity: £${totalOpportunity.toLocaleString()}`);

      return new Response(JSON.stringify({
        success: true,
        stageId: stage?.id,
        valueAnalysis,
        duration,
        summary: {
          overallScore,
          scoreInterpretation: valueAnalysis.scoreInterpretation,
          totalOpportunity,
          criticalRisks: riskRegister.filter(r => r.severity === 'Critical').length,
          highRisks: riskRegister.filter(r => r.severity === 'High').length,
          quickWins: valueGaps.filter(g => g.effort === 'Low').length,
          valuationUplift: `${valuationImpact.percentageIncrease}%`,
          currentValuation: valuationImpact.currentValuation,
          potentialValuation: valuationImpact.potentialValuation,
          // Narrative summary for display
          uncomfortableTruth: valueAnalysis.narrativeSummary?.uncomfortableTruth,
          whatThisReallyMeans: valueAnalysis.narrativeSummary?.whatThisReallyMeans
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "get-questions" or "generate-analysis"' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
