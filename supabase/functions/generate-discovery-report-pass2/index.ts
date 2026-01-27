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
}

interface DestinationClarityAnalysis {
  score: number;
  reasoning: string;
  factors: string[];
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
// SERVICE PRICING AND OUTCOMES (Services as footnotes)
// Defaults used if database fetch fails - canonical source is service_line_metadata
// ============================================================================

interface ServiceDetail {
  name: string;
  price: string;
  priceType: 'monthly' | 'one-time' | 'annual';
  outcome: string;  // The destination, not the service
}

const DEFAULT_SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'management_accounts': {
    name: 'Management Accounts',
    price: '£650',
    priceType: 'monthly',
    outcome: "You'll Know Your Numbers"
  },
  'systems_audit': {
    name: 'Systems Audit',
    price: '£4,000',
    priceType: 'one-time',
    outcome: "You'll See Where The Time Goes"
  },
  '365_method': {
    name: 'Goal Alignment Programme',
    price: '£1,500-£9,000',
    priceType: 'annual',
    outcome: "You'll Have Someone In Your Corner"
  },
  'automation': {
    name: 'Automation Services',
    price: '£5,000',
    priceType: 'one-time',
    outcome: "The Manual Work Disappears"
  },
  'fractional_cfo': {
    name: 'Fractional CFO Services',
    price: '£4,000',
    priceType: 'monthly',
    outcome: "You'll Have Strategic Financial Leadership"
  },
  'fractional_coo': {
    name: 'Fractional COO Services',
    price: '£3,750',
    priceType: 'monthly',
    outcome: "Someone Else Carries The Load"
  },
  'combined_advisory': {
    name: 'Combined CFO/COO Advisory',
    price: '£6,000',
    priceType: 'monthly',
    outcome: "Complete Business Transformation"
  },
  'business_advisory': {
    name: 'Business Advisory & Exit Planning',
    price: '£2,000', // BLOCKED - currently in development, but priced for future
    priceType: 'one-time',
    outcome: "You'll Know What It's Worth"
  },
  'benchmarking': {
    name: 'Benchmarking & Hidden Value Analysis',
    price: '£2,000', // Combined exit diagnostic: competitive positioning + value suppressors
    priceType: 'one-time',
    outcome: "You'll Know Where You Stand"
  }
  // NOTE: Benchmarking & Hidden Value Analysis is ONE COMBINED service at £2,000
  // This includes both industry benchmarking AND hidden value audit
  // DO NOT list these as separate line items
};

// Outcome mappings (destination-focused language)
const SERVICE_OUTCOMES: Record<string, string> = {
  'management_accounts': "You'll Know Your Numbers",
  'systems_audit': "You'll See Where The Time Goes",
  '365_method': "You'll Have Someone In Your Corner",
  'automation': "The Manual Work Disappears",
  'fractional_cfo': "You'll Have Strategic Financial Leadership",
  'fractional_coo': "Someone Else Carries The Load",
  'combined_advisory': "Complete Business Transformation",
  'business_advisory': "You'll Know What It's Worth",
  'benchmarking': "You'll Know Where You Stand",  // Includes Hidden Value Analysis
};

// Fetch service details from database, falling back to defaults
async function fetchServiceDetails(supabase: any, practiceId?: string): Promise<Record<string, ServiceDetail>> {
  try {
    // First try the new service_pricing table if we have a practice ID
    if (practiceId) {
      const { data: pricingData, error: pricingError } = await supabase
        .rpc('get_service_pricing', { p_practice_id: practiceId });
      
      if (!pricingError && pricingData && Object.keys(pricingData).length > 0) {
        console.log('Using service pricing from database for practice:', practiceId);
        
        const serviceDetails: Record<string, ServiceDetail> = {};
        
        for (const [code, service] of Object.entries(pricingData as Record<string, any>)) {
          const primaryTier = service.tiers?.[0];
          if (primaryTier) {
            const priceType = primaryTier.frequency === 'monthly' ? 'monthly' 
              : primaryTier.frequency === 'annual' ? 'annual' 
              : 'one-time';
            
            serviceDetails[code] = {
              name: service.name,
              price: `£${primaryTier.price.toLocaleString()}`,
              priceType,
              outcome: SERVICE_OUTCOMES[code] || DEFAULT_SERVICE_DETAILS[code]?.outcome || 'Business Transformation'
            };
          }
        }
        
        // Merge with defaults for any missing services
        return { ...DEFAULT_SERVICE_DETAILS, ...serviceDetails };
      }
    }
    
    // Fallback to service_line_metadata table
    const { data, error } = await supabase
      .from('service_line_metadata')
      .select('code, display_name, name, pricing')
      .eq('status', 'ready');
    
    if (error || !data) {
      console.log('Using default service details (DB fetch failed):', error?.message);
      return DEFAULT_SERVICE_DETAILS;
    }
    
    const serviceDetails: Record<string, ServiceDetail> = {};
    
    for (const service of data) {
      const code = service.code;
      const pricing = service.pricing?.[0]; // Get primary pricing tier
      
      if (pricing) {
        const priceType = pricing.frequency === 'monthly' ? 'monthly' 
          : pricing.frequency === 'annual' ? 'annual' 
          : 'one-time';
        
        serviceDetails[code] = {
          name: service.display_name || service.name,
          price: `£${pricing.amount.toLocaleString()}`,
          priceType,
          outcome: SERVICE_OUTCOMES[code] || DEFAULT_SERVICE_DETAILS[code]?.outcome || 'Business Transformation'
        };
      } else if (DEFAULT_SERVICE_DETAILS[code]) {
        serviceDetails[code] = DEFAULT_SERVICE_DETAILS[code];
      }
    }
    
    // Merge with defaults for any missing services
    return { ...DEFAULT_SERVICE_DETAILS, ...serviceDetails };
  } catch (err) {
    console.error('Error fetching service details:', err);
    return DEFAULT_SERVICE_DETAILS;
  }
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
    // SERVICE CATALOG - CANONICAL SERVICE DEFINITIONS
    // LLM selects which services are relevant, but cannot change names/prices
    // ========================================================================
    
    interface ServiceLine {
      id: string;
      name: string;
      displayName: string;
      price: number;
      priceFormatted: string;
      tier: string;
      description: string;
      keywords: string[];
    }
    
    const SERVICE_CATALOG: Record<string, ServiceLine> = {
      'benchmarking': {
        id: 'benchmarking',
        name: 'Industry Benchmarking',
        displayName: 'Industry Benchmarking (Full Package)',
        price: 2000,
        priceFormatted: '£2,000',
        tier: 'foundation',
        description: 'Valuation baseline and hidden value identification',
        keywords: ['benchmark', 'valuation', 'hidden value', 'what its worth', 'baseline', 'industry']
      },
      'goal_alignment_growth': {
        id: 'goal_alignment_growth',
        name: 'Goal Alignment Programme',
        displayName: 'Goal Alignment Programme (Growth)',
        price: 4500,
        priceFormatted: '£4,500',
        tier: 'growth',
        description: 'Quarterly accountability and strategic support',
        keywords: ['goal alignment', 'accountability', 'co-pilot', 'corner', 'support', 'growth']
      },
      'goal_alignment_scale': {
        id: 'goal_alignment_scale',
        name: 'Goal Alignment Programme',
        displayName: 'Goal Alignment Programme (Scale)',
        price: 7500,
        priceFormatted: '£7,500',
        tier: 'scale',
        description: 'Intensive strategic partnership',
        keywords: ['scale', 'intensive', 'transformation']
      },
      'systems_audit': {
        id: 'systems_audit',
        name: 'Systems & Process Audit',
        displayName: 'Systems & Process Audit',
        price: 3500,
        priceFormatted: '£3,500',
        tier: 'foundation',
        description: 'Operational efficiency analysis',
        keywords: ['systems', 'process', 'efficiency', 'automation', 'audit']
      },
      'ma_monthly': {
        id: 'ma_monthly',
        name: 'Management Accounts',
        displayName: 'Management Accounts (Monthly)',
        price: 500,
        priceFormatted: '£500/month',
        tier: 'ongoing',
        description: 'Monthly financial reporting and insights',
        keywords: ['management accounts', 'monthly', 'reporting', 'financials']
      },
      'fractional_cfo': {
        id: 'fractional_cfo',
        name: 'Fractional CFO',
        displayName: 'Fractional CFO',
        price: 2500,
        priceFormatted: '£2,500/month',
        tier: 'strategic',
        description: 'Part-time strategic finance leadership',
        keywords: ['cfo', 'finance director', 'strategic finance', 'fractional']
      },
      'exit_planning': {
        id: 'exit_planning',
        name: 'Exit Planning',
        displayName: 'Exit Planning & Preparation',
        price: 5000,
        priceFormatted: '£5,000',
        tier: 'strategic',
        description: 'Comprehensive exit strategy development',
        keywords: ['exit', 'sale', 'succession', 'planning']
      }
    };
    
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
    // SERVICE MATCHING FUNCTIONS
    // ========================================================================
    
    function matchServiceToCatalog(llmServiceName: string): ServiceLine | null {
      if (!llmServiceName) return null;
      const normalized = llmServiceName.toLowerCase();
      
      // Direct match by keywords
      for (const [id, service] of Object.entries(SERVICE_CATALOG)) {
        for (const keyword of service.keywords) {
          if (normalized.includes(keyword)) {
            return service;
          }
        }
      }
      
      // Fallback: fuzzy match on name
      for (const [id, service] of Object.entries(SERVICE_CATALOG)) {
        const firstWord = service.name.toLowerCase().split(' ')[0];
        if (normalized.includes(firstWord)) {
          return service;
        }
      }
      
      console.warn(`[Pass2] ⚠️ Could not match service: "${llmServiceName}"`);
      return null;
    }
    
    function enforceServiceCatalog(journeyPhases: any[]): any[] {
      if (!journeyPhases || !Array.isArray(journeyPhases)) return journeyPhases;
      
      return journeyPhases.map(phase => {
        const serviceText = phase.enabledBy || phase.service || phase.serviceName || '';
        const matched = matchServiceToCatalog(serviceText);
        
        if (matched) {
          console.log(`[Pass2] ✅ Matched "${serviceText}" → ${matched.displayName} (${matched.priceFormatted})`);
          return {
            ...phase,
            enabledBy: matched.displayName,
            service: matched.name,
            serviceId: matched.id,
            price: matched.priceFormatted  // Use formatted string for display
          };
        }
        
        return phase;
      });
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
    console.log('[Pass2] 📋 Loaded service catalog:', Object.keys(SERVICE_CATALOG).length, 'services');
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

    // Fetch service pricing from database (single source of truth)
    // Pass practice_id to use practice-specific pricing if available
    const SERVICE_DETAILS = await fetchServiceDetails(supabase, engagement.practice_id);
    console.log('[Pass2] Loaded service details for', Object.keys(SERVICE_DETAILS).length, 'services');

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
    
    // ========================================================================
    // ENHANCEMENT 3: Build Enhanced Financial Data Section
    // ========================================================================
    let financialDataSection = '';
    if (validatedPayroll.turnover && validatedPayroll.staffCosts) {
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
🔢 FINANCIAL DATA STATUS
============================================================================
No validated financial data available. When discussing financial figures:
- DO NOT make up specific amounts
- Use phrases like "Unknown precisely" or "To be confirmed from accounts"
- DO NOT guess at payroll percentages or excess amounts
`;
      console.log('[Pass2] ⚠️ No validated financial data available - LLM should not invent figures');
    }

    // Fetch Pass 1 results
    const { data: report, error: reportError } = await supabase
      .from('discovery_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();

    if (reportError || !report) {
      throw new Error('Pass 1 must be completed first');
    }

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
    
    // GROSS MARGIN PHRASE (show if healthy or better)
    if (comprehensiveAnalysis?.grossMargin?.grossMarginPct) {
      const gm = comprehensiveAnalysis.grossMargin;
      const assessment = gm.assessment || (gm.grossMarginPct > 50 ? 'excellent' : gm.grossMarginPct > 40 ? 'healthy' : 'typical');
      
      if (assessment === 'excellent' || assessment === 'healthy') {
        preBuiltPhrases.grossMarginStrength = `${gm.grossMarginPct.toFixed(1)}% gross margin - ${assessment} for the industry`;
        preBuiltPhrases.grossMarginPct = gm.grossMarginPct.toFixed(1);
        preBuiltPhrases.grossMarginAssessment = assessment;
        
        console.log('[Pass2] ✅ Built gross margin phrase from Pass 1:', preBuiltPhrases.grossMarginStrength);
      }
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
💎 HIDDEN ASSETS (MUST include in page4_numbers):
────────────────────────────────────────────────────────────────────────────
► Total: "${preBuiltPhrases.hiddenAssetsTotal}"
► Breakdown: "${preBuiltPhrases.hiddenAssetsBreakdown}"
► Note: "${preBuiltPhrases.hiddenAssetsNote || 'These assets sit OUTSIDE the earnings-based valuation'}"

⛔ YOU MUST include hiddenAssets object in page4_numbers with total: "${preBuiltPhrases.hiddenAssetsTotal}"
⛔ Mention in narrative: "Plus ${preBuiltPhrases.hiddenAssetsTotal} in hidden assets that sit outside the earnings valuation"

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
      
      if (preBuiltPhrases.productivityGap) {
        mandatoryPhrasesSection += `
👥 PRODUCTIVITY (USE THESE PHRASES):
────────────────────────────────────────────────────────────────────────────
► Gap: "${preBuiltPhrases.productivityGap}"
► Excess: "${preBuiltPhrases.excessHeadcount}"

`;
      }
      
      if (preBuiltPhrases.costOfInaction) {
        mandatoryPhrasesSection += `
⏱️ COST OF INACTION (USE THIS PHRASE):
────────────────────────────────────────────────────────────────────────────
► "Cost of inaction: ${preBuiltPhrases.costOfInaction}"

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
          price: inv.investment || inv.price || ''
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
          price: phase.price || phase.investment || ''
        };
      }
    }
    
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
    const clientName = engagement.client?.name?.split(' ')[0] || 'they'; // First name only
    const fullName = engagement.client?.name || 'Client';
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
      'business_advisory',  // Paused until service line is defined
      'hidden_value',       // Not separate - included in benchmarking
      ...(shouldBlockCOO ? ['fractional_coo', 'combined_advisory'] : [])
    ];
    console.log(`[Pass2] Blocked services: ${blockedServices.join(', ')}`);
    
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

    // ============================================================================
    // THE MASTER PROMPT - Destination-Focused Discovery Report
    // ============================================================================

    const prompt = `You are writing a Destination-Focused Discovery Report for ${clientName} from ${companyName}.

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
${financialDataSection}
${mandatoryPhrasesSection}
${servicePriceConstraints}
${mandatoryDimensionsPrompt}
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

Return a JSON object with this exact structure:

{
  "page1_destination": {
    "headerLine": "The Tuesday You're Building Towards",
    "visionProvided": true/false,
    "visionVerbatim": "IF PROVIDED: Their Tuesday Test answer, edited slightly for flow but keeping their exact words. Include specific details like leaving times, activities, family names. IF NOT PROVIDED: A warm acknowledgment that they haven't painted the picture yet, with an invitation to have that conversation.",
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
    "realReturn": "Their specific goal in their words - the emotional return"
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
        
        if (oldTotal !== pass1Total) {
          console.log(`[Pass2] Fixed totalYear1 from "${oldTotal}" → "${pass1Total}"`);
        }
      }
      
      console.log('[Pass2] ✅ Pass 1 service prices enforced');
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
      console.log('[Pass2] 🔧 Enforcing service catalog on journey phases...');
      narratives.page3_journey.phases = enforceServiceCatalog(narratives.page3_journey.phases);
      
      // Recalculate total from enforced prices
      const totalPrice = narratives.page3_journey.phases.reduce((sum: number, phase: any) => {
        const priceStr = phase.price || '';
        const match = priceStr.match(/[\d,]+/);
        return sum + (match ? parseInt(match[0].replace(/,/g, ''), 10) : 0);
      }, 0);
      
      if (totalPrice > 0) {
        const formattedTotal = `£${totalPrice.toLocaleString()}`;
        if (narratives.page4_numbers) {
          narratives.page4_numbers.totalYear1 = formattedTotal;
        }
        console.log('[Pass2] ✅ Recalculated total investment:', formattedTotal);
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
    const reportStatus = 'generated';  // Always 'generated' after Pass 2 completes
    const engagementStatus = 'pass2_complete';  // Use ready_for_client flag to indicate review needed

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

    // Update report with Pass 2 results
    const { error: updateError } = await supabase
      .from('discovery_reports')
      .update({
        status: reportStatus,
        destination_report: narratives,
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
        ready_for_client: dataCompleteness.canGenerateClientReport,
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
