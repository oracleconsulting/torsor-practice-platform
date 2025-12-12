// ============================================================================
// GENERATE DISCOVERY ANALYSIS - Part 2 of 2-stage report generation
// ============================================================================
// Takes prepared data and generates the full analysis using Claude Opus 4.5
// This is the heavy LLM call - should complete within 60s with prepared data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

// Use Claude Opus 4.5 for premium quality analysis
const MODEL = 'anthropic/claude-opus-4.5';

// ============================================================================
// DESTINATION CLARITY FALLBACK CALCULATION
// ============================================================================

function calculateFallbackClarity(responses: Record<string, any>): number {
  const vision = responses.dd_five_year_picture || '';
  
  if (!vision || vision.length < 20) return 1;
  
  let score = 0;
  
  // Time specificity (mentions times, days, routines)
  if (/\d{1,2}(am|pm|:\d{2})|0\d{3}/i.test(vision)) score += 2;
  if (/morning|afternoon|evening|night/i.test(vision)) score += 1;
  
  // Activity richness (verbs indicating actions)
  const activities = vision.match(/\b(wake|run|walk|take|drive|meet|call|play|work|travel|read|grab|head|pick|have|spend)\b/gi);
  score += Math.min((activities?.length || 0), 3);
  
  // Relationship mentions
  if (/wife|husband|partner|kids|children|boys|girls|family|friends|mates/i.test(vision)) score += 2;
  
  // Role transformation indicators
  if (/invest|portfolio|board|advisor|chairman|step back|ceo/i.test(vision)) score += 2;
  
  // Length and detail
  if (vision.length > 100) score += 1;
  if (vision.length > 200) score += 1;
  
  return Math.min(score, 10);
}

// ============================================================================
// AFFORDABILITY ASSESSMENT
// ============================================================================

interface AffordabilityProfile {
  stage: 'pre-revenue' | 'early-revenue' | 'established' | 'scaling';
  cashConstrained: boolean;
  activelyRaising: boolean;
  estimatedMonthlyCapacity: 'under_1k' | '1k_5k' | '5k_15k' | '15k_plus';
}

function assessAffordability(
  responses: Record<string, any>,
  financialContext?: any
): AffordabilityProfile {
  
  let stage: AffordabilityProfile['stage'] = 'established';
  
  // Check for pre-revenue signals
  const operationalFrustration = (responses.sd_operational_frustration || '').toLowerCase();
  if (operationalFrustration.includes('mvp') || 
      operationalFrustration.includes('launch') ||
      operationalFrustration.includes('product-market') ||
      operationalFrustration.includes('pre-revenue')) {
    stage = 'pre-revenue';
  }
  
  // Check for early-revenue signals
  if (responses.sd_growth_blocker === "Don't have the capital" &&
      !operationalFrustration.includes('mvp')) {
    stage = stage === 'pre-revenue' ? 'pre-revenue' : 'early-revenue';
  }
  
  // Override with financial context if available
  if (financialContext?.revenue) {
    if (financialContext.revenue < 100000) stage = 'pre-revenue';
    else if (financialContext.revenue < 500000) stage = 'early-revenue';
    else if (financialContext.revenue < 2000000) stage = 'established';
    else stage = 'scaling';
  }
  
  // Cash constraint detection
  const cashConstrained = 
    responses.sd_growth_blocker === "Don't have the capital" ||
    (responses.dd_sleep_thief || []).includes('Cash flow and paying bills');
  
  // Fundraising detection
  const ifIKnew = (responses.dd_if_i_knew || '').toLowerCase();
  const activelyRaising = 
    ifIKnew.includes('capital') ||
    ifIKnew.includes('raise') ||
    ifIKnew.includes('invest') ||
    (responses.sd_exit_readiness || '').includes('investment-ready');
  
  // Estimate monthly capacity
  let estimatedMonthlyCapacity: AffordabilityProfile['estimatedMonthlyCapacity'];
  
  switch (stage) {
    case 'pre-revenue':
      estimatedMonthlyCapacity = activelyRaising ? '1k_5k' : 'under_1k';
      break;
    case 'early-revenue':
      estimatedMonthlyCapacity = cashConstrained ? '1k_5k' : '5k_15k';
      break;
    case 'established':
      estimatedMonthlyCapacity = '5k_15k';
      break;
    case 'scaling':
      estimatedMonthlyCapacity = '15k_plus';
      break;
  }
  
  return { stage, cashConstrained, activelyRaising, estimatedMonthlyCapacity };
}

// ============================================================================
// 365 LIFESTYLE TRANSFORMATION DETECTION
// ============================================================================

interface TransformationSignals {
  lifestyleTransformation: boolean;
  identityShift: boolean;
  burnoutWithReadiness: boolean;
  legacyFocus: boolean;
  reasons: string[];
}

function detect365Triggers(responses: Record<string, any>): TransformationSignals {
  const visionText = (responses.dd_five_year_picture || '').toLowerCase();
  const successDef = responses.dd_success_definition || '';
  const reasons: string[] = [];
  
  // Lifestyle transformation: Vision describes fundamentally different role
  const lifestyleTransformation = 
    visionText.includes('invest') ||
    visionText.includes('portfolio') ||
    visionText.includes('advisory') ||
    visionText.includes('board') ||
    visionText.includes('chairman') ||
    visionText.includes('step back') ||
    (visionText.includes('ceo') && !visionText.includes('my ceo'));
  
  if (lifestyleTransformation) {
    reasons.push('Vision describes fundamentally different role (operator → investor transition)');
  }
  
  // Identity shift: Success defined as business running without them
  const identityShift = 
    successDef === "Creating a business that runs profitably without me" ||
    successDef === "Building a legacy that outlasts me" ||
    successDef === "Building something I can sell for a life-changing amount";
  
  if (identityShift) {
    reasons.push(`Success defined as "${successDef}" - requires structured transition support`);
  }
  
  // Burnout with high readiness
  const burnoutWithReadiness = 
    ['60-70 hours', '70+ hours'].includes(responses.dd_owner_hours || '') &&
    responses.dd_change_readiness === "Completely ready - I'll do whatever it takes";
  
  if (burnoutWithReadiness) {
    reasons.push('Working 60-70+ hours but completely ready for change - needs structured pathway');
  }
  
  // Legacy focus
  const legacyFocus = 
    successDef.includes('legacy') ||
    responses.dd_exit_thoughts === "I've already got a clear exit plan" ||
    ['1-3 years - actively preparing', '3-5 years - need to start thinking'].includes(responses.sd_exit_timeline || '');
  
  if (legacyFocus) {
    reasons.push('Legacy/exit focus requires strategic roadmap');
  }
  
  return { lifestyleTransformation, identityShift, burnoutWithReadiness, legacyFocus, reasons };
}

// ============================================================================
// FINANCIAL PROJECTIONS EXTRACTION
// ============================================================================

interface ExtractedProjections {
  hasProjections: boolean;
  currentRevenue?: number;
  projectedRevenue?: { year: number; amount: number }[];
  grossMargin?: number;
  year5Revenue?: number;
  growthMultiple?: number;
  teamGrowth?: { current: number; projected: number };
}

function extractFinancialProjections(documents: any[]): ExtractedProjections {
  if (!documents || documents.length === 0) {
    return { hasProjections: false };
  }
  
  // Look for financial projection documents
  const projectionDoc = documents.find(doc => 
    doc.fileName?.toLowerCase().includes('projection') ||
    doc.fileName?.toLowerCase().includes('forecast') ||
    doc.fileName?.toLowerCase().includes('5 year') ||
    doc.fileName?.toLowerCase().includes('5-year') ||
    doc.fileName?.toLowerCase().includes('summary') ||
    (doc.content?.toLowerCase().includes('year 1') && doc.content?.toLowerCase().includes('year 5'))
  );
  
  if (!projectionDoc) {
    return { hasProjections: false };
  }
  
  const content = projectionDoc.content || '';
  const projectedRevenue: { year: number; amount: number }[] = [];
  
  // Extract revenue figures (look for patterns like "Year 1: £559K" or "Year 1 Revenue: 559,000")
  const revenuePatterns = [
    /year\s*1[:\s]*[£$]?([\d,]+)k?/gi,
    /year\s*2[:\s]*[£$]?([\d,]+)k?/gi,
    /year\s*3[:\s]*[£$]?([\d,]+)k?/gi,
    /year\s*4[:\s]*[£$]?([\d,]+)k?/gi,
    /year\s*5[:\s]*[£$]?([\d,]+)k?/gi,
  ];
  
  for (let i = 0; i < 5; i++) {
    const match = content.match(revenuePatterns[i]);
    if (match && match[0]) {
      const numMatch = match[0].match(/[\d,]+/);
      if (numMatch) {
        let amount = parseInt(numMatch[0].replace(/,/g, ''));
        // If number is small, assume it's in thousands
        if (amount < 10000 && match[0].toLowerCase().includes('k')) {
          amount *= 1000;
        } else if (amount < 1000) {
          amount *= 1000; // Assume thousands
        }
        projectedRevenue.push({ year: i + 1, amount });
      }
    }
  }
  
  // Extract gross margin
  let grossMargin: number | undefined;
  const marginMatch = content.match(/gross\s*margin[:\s]*([\d.]+)%/i);
  if (marginMatch) {
    grossMargin = parseFloat(marginMatch[1]) / 100;
  }
  
  // Extract team size
  let teamGrowth: { current: number; projected: number } | undefined;
  const teamMatch = content.match(/team[:\s]*(\d+)\s*(?:→|to|->)\s*(\d+)/i);
  if (teamMatch) {
    teamGrowth = { current: parseInt(teamMatch[1]), projected: parseInt(teamMatch[2]) };
  }
  
  const year1Rev = projectedRevenue.find(p => p.year === 1)?.amount;
  const year5Rev = projectedRevenue.find(p => p.year === 5)?.amount;
  
  return {
    hasProjections: projectedRevenue.length > 0,
    currentRevenue: year1Rev,
    projectedRevenue,
    grossMargin,
    year5Revenue: year5Rev,
    growthMultiple: year1Rev && year5Rev ? Math.round(year5Rev / year1Rev) : undefined,
    teamGrowth
  };
}

function buildFinancialProjectionsContext(projections: ExtractedProjections): string {
  if (!projections.hasProjections) return '';
  
  const year1 = projections.currentRevenue || 0;
  const year5 = projections.year5Revenue || 0;
  
  return `
## CLIENT FINANCIAL PROJECTIONS (from uploaded documents)

Revenue Trajectory:
${projections.projectedRevenue?.map(p => `- Year ${p.year}: £${(p.amount / 1000).toFixed(0)}K`).join('\n') || 'Not available'}

${projections.growthMultiple ? `Growth: ${projections.growthMultiple}x over 5 years` : ''}
${projections.grossMargin ? `Gross Margin: ${(projections.grossMargin * 100).toFixed(0)}%` : ''}
${projections.teamGrowth ? `Team: ${projections.teamGrowth.current} → ${projections.teamGrowth.projected}` : ''}

USE THESE PROJECTIONS FOR:
1. Calculate investment as % of Year 1 revenue (affordability check)
2. Show ROI in context of their growth trajectory
3. Calculate exit value impact using their actual multiples
4. Reference their specific margins in efficiency calculations

${year1 > 0 ? `
EXAMPLE CALCULATIONS FOR THIS CLIENT:
- Phase 1 investment (£11,800) = ${((11800 / year1) * 100).toFixed(1)}% of Year 1 revenue
${projections.grossMargin ? `- At ${(projections.grossMargin * 100).toFixed(0)}% gross margin, efficiency gains drop almost straight to profit` : ''}
${year5 > 0 ? `- At Year 5 (£${(year5 / 1000000).toFixed(1)}M ARR):
  - Founder-dependent (6x): £${((year5 * 6) / 1000000).toFixed(0)}M valuation
  - Systematized (12x): £${((year5 * 12) / 1000000).toFixed(0)}M valuation
  - Delta: £${(((year5 * 12) - (year5 * 6)) / 1000000).toFixed(0)}M additional value from systemization` : ''}
` : ''}
`;
}

// ============================================================================
// GAP SCORE CALIBRATION
// ============================================================================

interface GapSeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

function calibrateGapScore(gaps: any[]): { score: number; counts: GapSeverity; explanation: string } {
  const weights = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0.5
  };
  
  const counts: GapSeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  // Count gaps by severity (from analysis)
  for (const gap of gaps || []) {
    const severity = (gap.severity || gap.priority || 'medium').toLowerCase();
    if (severity === 'critical') counts.critical++;
    else if (severity === 'high') counts.high++;
    else if (severity === 'medium') counts.medium++;
    else counts.low++;
  }
  
  // Calculate weighted score
  const weightedSum = 
    counts.critical * weights.critical +
    counts.high * weights.high +
    counts.medium * weights.medium +
    counts.low * weights.low;
  
  // Normalize to 1-10 scale (max: 3 critical + 4 high = 17 points = 10/10)
  const normalizedScore = Math.min(10, Math.max(1, Math.round((weightedSum / 17) * 10)));
  
  let explanation = '';
  if (normalizedScore >= 9) explanation = '🚨 Crisis level - business at risk without intervention';
  else if (normalizedScore >= 7) explanation = '⚠️ Significant gaps - multiple critical issues affecting core operations';
  else if (normalizedScore >= 5) explanation = 'Multiple gaps - 1-2 critical issues need attention';
  else if (normalizedScore >= 3) explanation = 'Some gaps - no critical issues blocking growth';
  else explanation = 'Minor optimizations - business is fundamentally healthy';
  
  return { score: normalizedScore, counts, explanation };
}

// ============================================================================
// ENHANCED CLOSING MESSAGE GUIDANCE
// ============================================================================

function buildClosingMessageGuidance(
  responses: Record<string, any>,
  affordability: AffordabilityProfile
): string {
  const teamSecret = responses.dd_team_secret || '';
  const externalView = responses.dd_external_view || '';
  const hardTruth = responses.dd_hard_truth || '';
  const vision = responses.dd_five_year_picture || '';
  
  const hasVulnerability = teamSecret.toLowerCase().includes('imposter') ||
    teamSecret.toLowerCase().includes('syndrome') ||
    teamSecret.toLowerCase().includes('fear') ||
    teamSecret.toLowerCase().includes('doubt');
  
  const hasRelationshipStrain = externalView.includes('tension') || 
    externalView.includes('given up') ||
    externalView.includes('married to');
  
  // Extract specific vision details to reference
  const visionDetails: string[] = [];
  if (vision.match(/\d{1,2}(am|pm)/i)) visionDetails.push('the specific time you wake up');
  if (vision.includes('run')) visionDetails.push('your morning run');
  if (vision.includes('school') || vision.includes('boys') || vision.includes('kids')) visionDetails.push('taking the kids to school');
  if (vision.includes('lunch') && vision.includes('wife')) visionDetails.push('lunch with your wife');
  if (vision.includes('padel') || vision.includes('mates')) visionDetails.push('Padel with your mates');
  if (vision.includes('invest')) visionDetails.push('managing your investment portfolio');
  
  return `
## CLOSING MESSAGE - THIS IS THE MOST IMPORTANT SECTION

You're not writing marketing copy. You're having a real conversation with a real person who just told you something vulnerable.

${hasVulnerability ? `
VULNERABILITY DETECTED: They shared "${teamSecret}"
This takes courage. Acknowledge it naturally - don't be awkward, just show you heard it.
Example: "The imposter syndrome you mentioned? It's lying to you..."
` : ''}

${hasRelationshipStrain ? `
RELATIONSHIP STRAIN DETECTED: Their partner views work as "${externalView}"
This isn't about business - it's about their marriage, their kids, their life.
Reference the personal cost, not just business metrics.
` : ''}

${visionDetails.length > 0 ? `
VISION DETAILS TO REFERENCE:
${visionDetails.map(d => `- ${d}`).join('\n')}
Make inaction feel like actively choosing NOT to have these things.
` : ''}

${affordability.stage === 'pre-revenue' ? `
FOR PRE-REVENUE CLIENT:
DO NOT say: "Your total investment is £150,000"
DO say: "Start with the Systems Audit and Management Accounts - that's £11,800 to get your financial house in order before you raise. The fractional support? That's Phase 2, for when you've got the capital."

Tone: "We're playing the long game with you. Do what you can afford now. We'll be here when you're ready for more."
` : ''}

STRUCTURE:
1. ACKNOWLEDGMENT (1-2 sentences) - Show you heard the vulnerability
2. REFRAME (2-3 sentences) - Connect vision to current reality, name the gap
3. HOPE WITH EVIDENCE (2-3 sentences) - Reference their strengths
4. PERSONAL STAKES (2-3 sentences) - Use personal impact, not business metrics
5. NEXT STEP (1-2 sentences) - Low pressure, high clarity, "together" language

TONE: Direct but warm. Empathetic but not soft. Honest, even if uncomfortable.
Start with something like "Ben, I want to be direct with you because I think you can handle it..."
NOT "Dear Mr Stocken, thank you for completing our assessment..."
`;
}

// Service line definitions (abbreviated for this function)
const SERVICE_LINES = {
  '365_method': { name: '365 Alignment Programme', tiers: [{ name: 'Lite', price: 1500 }, { name: 'Growth', price: 4500 }, { name: 'Partner', price: 9000 }] },
  'fractional_cfo': { name: 'Fractional CFO Services', tiers: [{ name: '2 days/month', price: 4000, isMonthly: true }] },
  'systems_audit': { name: 'Systems Audit', tiers: [{ name: 'Comprehensive', price: 4000 }] },
  'management_accounts': { name: 'Management Accounts', tiers: [{ name: 'Monthly', price: 650, isMonthly: true }] },
  'fractional_coo': { name: 'Fractional COO Services', tiers: [{ name: '2 days/month', price: 3750, isMonthly: true }] },
  'automation': { name: 'Automation Services', tiers: [{ name: 'Per hour', price: 150 }] },
  'business_advisory': { name: 'Business Advisory & Exit Planning', tiers: [{ name: 'Full Package', price: 4000 }] },
  'benchmarking': { name: 'Benchmarking Services', tiers: [{ name: 'Full Package', price: 3500 }] }
};

const SYSTEM_PROMPT = `You are a senior business advisor analyzing a discovery assessment. Generate a comprehensive, personalized report.

CRITICAL REQUIREMENTS:
1. Quote client's EXACT WORDS at least 10 times throughout
2. Calculate specific £ figures for every cost and benefit
3. Connect every recommendation to something they specifically said
4. Recommend services in PHASES based on affordability (see affordability context)
5. Show the domino effect: how fixing one thing enables the next
6. Make the comparison crystal clear: investment cost vs. cost of inaction

INVESTMENT PHASING IS CRITICAL:
- For pre-revenue/cash-constrained clients: PHASE services by affordability
- Phase 1 = Start Now (under £15k/year)
- Phase 2 = After Raise/Revenue (when they can afford it)
- Phase 3 = At Scale (when revenue supports it)
- HEADLINE the affordable number, not the total if-everything number

365 ALIGNMENT PROGRAMME:
This is NOT just for people without plans. It's for founders undergoing TRANSFORMATION:
- OPERATOR → INVESTOR transition
- FOUNDER → CHAIRMAN transition
- BURNOUT → BALANCE transition
If transformation signals are detected, recommend 365 even if they have a business plan.

Writing style:
- Direct and confident, backed by specific evidence
- Empathetic but pragmatic
- Create urgency through specific £ calculations
- For pre-revenue clients: optimise for THEIR outcome, not our revenue`;

serve(async (req) => {
  console.log('=== GENERATE-DISCOVERY-ANALYSIS STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { preparedData } = await req.json();

    if (!preparedData) {
      throw new Error('preparedData is required - call prepare-discovery-data first');
    }

    console.log(`Generating analysis for: ${preparedData.client.name}`);

    // ========================================================================
    // CALCULATE CLARITY SCORE (with fallback)
    // ========================================================================
    
    const patternClarityScore = preparedData.patternAnalysis?.destinationClarity?.score;
    const fallbackClarityScore = calculateFallbackClarity(preparedData.discovery.responses);
    const clarityScore = patternClarityScore ?? fallbackClarityScore;
    const claritySource = patternClarityScore ? 'pattern_detection' : 'fallback';
    
    console.log('[Discovery] Clarity score:', {
      patternDetectionScore: patternClarityScore,
      fallbackScore: fallbackClarityScore,
      finalScore: clarityScore,
      source: claritySource
    });

    // ========================================================================
    // ASSESS AFFORDABILITY
    // ========================================================================
    
    const affordability = assessAffordability(
      preparedData.discovery.responses,
      preparedData.financialContext
    );
    
    console.log('[Discovery] Affordability:', affordability);

    // ========================================================================
    // DETECT 365 TRANSFORMATION TRIGGERS
    // ========================================================================
    
    const transformationSignals = detect365Triggers(preparedData.discovery.responses);
    
    console.log('[Discovery] 365 Triggers:', transformationSignals);

    // ========================================================================
    // EXTRACT FINANCIAL PROJECTIONS FROM DOCUMENTS
    // ========================================================================
    
    const financialProjections = extractFinancialProjections(preparedData.documents || []);
    const financialProjectionsContext = buildFinancialProjectionsContext(financialProjections);
    
    console.log('[Discovery] Financial Projections:', {
      hasProjections: financialProjections.hasProjections,
      year1: financialProjections.currentRevenue,
      year5: financialProjections.year5Revenue,
      growthMultiple: financialProjections.growthMultiple
    });

    // ========================================================================
    // BUILD CLOSING MESSAGE GUIDANCE
    // ========================================================================
    
    const closingGuidance = buildClosingMessageGuidance(
      preparedData.discovery.responses,
      affordability
    );

    // ========================================================================
    // BUILD THE ANALYSIS PROMPT
    // ========================================================================

    const patternContext = preparedData.patternAnalysis ? `
## PATTERN ANALYSIS (Pre-computed)
- Destination Clarity: ${preparedData.patternAnalysis.destinationClarity?.score || 'N/A'}/10
- Contradictions: ${JSON.stringify(preparedData.patternAnalysis.contradictions || [])}
- Emotional State: Stress=${preparedData.patternAnalysis.emotionalState?.stressLevel}, Burnout Risk=${preparedData.patternAnalysis.emotionalState?.burnoutRisk}
- Capital Raising Detected: ${preparedData.patternAnalysis.capitalRaisingSignals?.detected || false}
- Lifestyle Transformation: ${preparedData.patternAnalysis.lifestyleTransformation?.detected || false}
` : '';

    const financialContext = preparedData.financialContext ? `
## KNOWN FINANCIALS
- Revenue: £${preparedData.financialContext.revenue?.toLocaleString() || 'Unknown'}
- Gross Margin: ${preparedData.financialContext.grossMarginPct || 'Unknown'}%
- Net Profit: £${preparedData.financialContext.netProfit?.toLocaleString() || 'Unknown'}
- Staff Count: ${preparedData.financialContext.staffCount || 'Unknown'}
` : '';

    const documentsContext = preparedData.documents.length > 0 ? `
## UPLOADED DOCUMENTS (USE THIS DATA!)
${preparedData.documents.map((doc: any, i: number) => `
### Document ${i + 1}: ${doc.fileName}
${doc.content}
`).join('\n')}
` : '';

    // Build context notes section - CRITICAL for accurate analysis
    const advisorNotes = preparedData.advisorContextNotes || [];
    const contextNotesSection = advisorNotes.length > 0 ? `
## ADVISOR CONTEXT NOTES (CRITICAL - TRUST THESE OVER ASSESSMENT!)
These are dated updates from the advisor that may supersede or add context to what the assessment captured.
The assessment captures a moment in time - these notes capture what's happened SINCE.

${advisorNotes.map((note: any) => {
  const dateStr = note.eventDate ? new Date(note.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';
  const futureFlag = note.isFutureEvent ? ' (PLANNED)' : '';
  const importanceEmoji = note.importance === 'critical' ? '🚨' : note.importance === 'high' ? '⚠️' : '';
  return `### ${importanceEmoji} ${note.title} [${dateStr}${futureFlag}]
Type: ${note.type}
${note.content}
`;
}).join('\n')}

USE THIS CONTEXT TO:
1. Update your understanding of their financial position (e.g., if they've raised funding)
2. Adjust affordability assessment (funding changes everything)
3. Understand upcoming milestones that affect timing (product launches, etc.)
4. Reference these specifics in your analysis ("Given your recent seed raise...")
` : '';

    const analysisPrompt = `
Analyze this discovery assessment for ${preparedData.client.name} (${preparedData.client.company || 'their business'}).

## CLIENT DISCOVERY RESPONSES
${JSON.stringify(preparedData.discovery.responses, null, 2)}

## EXTRACTED EMOTIONAL ANCHORS
${JSON.stringify(preparedData.discovery.extractedAnchors, null, 2)}

## EXISTING SERVICE RECOMMENDATIONS
${JSON.stringify(preparedData.discovery.recommendedServices, null, 2)}

${patternContext}
${financialContext}
${documentsContext}
${contextNotesSection}

## AFFORDABILITY ASSESSMENT
- Client Stage: ${affordability.stage}
- Cash Constrained: ${affordability.cashConstrained}
- Actively Raising: ${affordability.activelyRaising}
- Estimated Monthly Capacity: ${affordability.estimatedMonthlyCapacity}

${affordability.stage === 'pre-revenue' ? `
⚠️ PRE-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

Phase 1 - Foundation (Start Now, max £15,000/year):
- Only recommend what they NEED NOW
- Focus on services that help them raise or launch faster
- Management Accounts + Systems Audit are appropriate

Phase 2 - Post-Raise (After funding):
- Fractional executives go here
- Frame as "when you've closed your round"

Phase 3 - At Scale (12+ months, when revenue supports):
- Full operational support
- Only mention as future horizon

CRITICAL: Headline the Phase 1 number. Do NOT say "total investment £150k" to a pre-revenue startup.
` : ''}

${affordability.stage === 'early-revenue' ? `
EARLY-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

Phase 1 - Essential (Start Now, max £36,000/year):
- Management Accounts and Systems Audit
- 365 if transformation needed
- Focus on efficiency gains that pay for themselves

Phase 2 - Growth Support (3-6 months):
- Fractional CFO at lower tier
- As revenue stabilizes

Phase 3 - Full Support (12+ months):
- Full fractional suite when revenue supports
` : ''}

## 365 ALIGNMENT DETECTION
${transformationSignals.reasons.length > 0 ? `
🎯 365 TRANSFORMATION TRIGGERS DETECTED:
${transformationSignals.reasons.map(r => `- ${r}`).join('\n')}

Even if they have a business plan, recommend 365 because they need structured support for their PERSONAL transformation, not just business strategy.

Position 365 as: "You have a business plan. What you don't have is a structured path to becoming the person in your 5-year vision. The 365 programme bridges that gap."
` : 'No specific transformation triggers detected.'}

${financialProjectionsContext}

${closingGuidance}

## GAP SCORE CALIBRATION
When you identify gaps, score severity accurately:
- 2 critical + 3 high gaps = 7-8/10 (NOT 5/10)
- Use these weights: critical=3, high=2, medium=1, low=0.5
- Max score (3 critical + 4 high = 17 points) = 10/10
- Show the severity breakdown in your gap analysis

## AVAILABLE SERVICES
${JSON.stringify(SERVICE_LINES, null, 2)}

## OUTPUT FORMAT - CRITICAL: USE EXACT FIELD NAMES

⚠️ THE UI WILL BREAK IF YOU USE DIFFERENT FIELD NAMES ⚠️

Return ONLY a valid JSON object (no markdown, no explanation, just the JSON):

{
  "executiveSummary": {
    "headline": "One powerful sentence",
    "situationInTheirWords": "2-3 sentences using their EXACT quotes",
    "destinationVision": "What they really want",
    "currentReality": "Where they are now",
    "criticalInsight": "The most important insight",
    "urgencyStatement": "Why acting now matters"
  },
  "destinationAnalysis": {
    "fiveYearVision": "Their stated destination",
    "coreEmotionalDrivers": [{ "driver": "Freedom", "evidence": "exact quote", "whatItMeans": "interpretation" }],
    "lifestyleGoals": ["non-business goals"]
  },
  "gapAnalysis": {
    "primaryGaps": [{ 
      "gap": "specific gap", 
      "category": "Financial", 
      "severity": "critical", 
      "evidence": "quote", 
      "currentImpact": { "timeImpact": "X hours/week", "financialImpact": "£X", "emotionalImpact": "how it feels" } 
    }],
    "costOfInaction": { 
      "annualFinancialCost": "£X,XXX with calculation", 
      "personalCost": "impact on life", 
      "compoundingEffect": "how it gets worse" 
    }
  },
  "recommendedInvestments": [
    {
      "service": "Management Accounts",
      "code": "management_accounts",
      "priority": 1,
      "recommendedTier": "Standard tier",
      "investment": "£650",
      "investmentFrequency": "per month",
      "whyThisTier": "reasoning for this tier",
      "problemsSolved": [{ 
        "problem": "from their responses", 
        "theirWords": "exact quote", 
        "howWeSolveIt": "specific actions", 
        "expectedResult": "measurable outcome" 
      }],
      "expectedROI": { 
        "multiplier": "10x", 
        "timeframe": "3 months", 
        "calculation": "how we calculated" 
      },
      "keyOutcomes": ["Financial visibility", "Investor-ready reports"],
      "riskOfNotActing": "specific consequence"
    }
  ],
  "investmentSummary": {
    "totalFirstYearInvestment": "£11,800",
    "projectedFirstYearReturn": "£150,000+",
    "paybackPeriod": "3 months",
    "netBenefitYear1": "£138,200",
    "roiCalculation": "Based on X efficiency gains",
    "comparisonToInaction": "Clear comparison"
  },
  "recommendedNextSteps": [
    { "step": 1, "action": "Schedule discovery call", "timing": "This week", "owner": "Oracle team" }
  ],
  "closingMessage": {
    "personalNote": "Empathetic message referencing their specific situation",
    "callToAction": "Clear next step",
    "urgencyReminder": "Why now"
  }
}

CRITICAL FIELD NAME REQUIREMENTS:
- Use "service" NOT "serviceName" or "name"
- Use "investment" NOT "price" or "cost"  
- Use "investmentFrequency" NOT "frequency" or "period"
- Use "expectedROI" with "multiplier" and "timeframe" subfields
- Use "totalFirstYearInvestment" NOT "total" or "totalFirstYear"
- Use "recommendedNextSteps" with "step", "action", "timing", "owner"

Return ONLY the JSON object with no additional text.`;

    // ========================================================================
    // CALL CLAUDE OPUS 4.5
    // ========================================================================

    // Log prompt size to help debug token limits
    const promptSize = analysisPrompt.length;
    const systemSize = SYSTEM_PROMPT.length;
    console.log(`Prompt sizes - System: ${systemSize} chars, User: ${promptSize} chars, Total: ${systemSize + promptSize} chars`);
    console.log('Calling Claude Opus 4.5...');
    const llmStartTime = Date.now();

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Analysis'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 12000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    const llmTime = Date.now() - llmStartTime;
    console.log(`LLM response in ${llmTime}ms`);

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter error status:', openrouterResponse.status);
      console.error('OpenRouter error body:', errorText);
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('OpenRouter error details:', JSON.stringify(errorJson, null, 2));
        throw new Error(`AI analysis failed: ${errorJson?.error?.message || errorJson?.message || openrouterResponse.status}`);
      } catch (e) {
        throw new Error(`AI analysis failed: ${openrouterResponse.status} - ${errorText.substring(0, 200)}`);
      }
    }

    const openrouterData = await openrouterResponse.json();
    const analysisText = openrouterData.choices?.[0]?.message?.content || '';
    
    if (!analysisText) {
      throw new Error('Empty response from AI');
    }

    console.log('[Discovery] Raw LLM response length:', analysisText.length);
    console.log('[Discovery] First 500 chars:', analysisText.substring(0, 500));

    // Parse JSON from response with robust extraction
    let analysis;
    try {
      let jsonString = analysisText;
      
      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        console.log('[Discovery] Extracted from code block');
      }
      
      // Find the actual JSON object boundaries
      if (!jsonString.trim().startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
          console.log('[Discovery] Extracted JSON from position', jsonStart, 'to', jsonEnd);
        }
      }
      
      analysis = JSON.parse(jsonString);
      console.log('[Discovery] JSON parsed successfully');
      
      // Debug: Log the structure of the parsed analysis
      console.log('[Discovery] Analysis structure:', {
        hasExecutiveSummary: !!analysis.executiveSummary,
        hasGapAnalysis: !!analysis.gapAnalysis,
        hasRecommendedInvestments: !!analysis.recommendedInvestments,
        recommendedInvestmentsCount: analysis.recommendedInvestments?.length || 0,
        hasInvestmentSummary: !!analysis.investmentSummary,
        hasClosingMessage: !!analysis.closingMessage
      });
      
      // Debug: Log first investment if exists
      if (analysis.recommendedInvestments?.[0]) {
        console.log('[Discovery] First investment:', JSON.stringify(analysis.recommendedInvestments[0], null, 2));
      }
      
      // Normalize investment structure in case of field name variations
      if (analysis.recommendedInvestments && Array.isArray(analysis.recommendedInvestments)) {
        analysis.recommendedInvestments = analysis.recommendedInvestments.map((inv: any) => ({
          service: inv.service || inv.serviceName || inv.name || 'Unknown Service',
          code: inv.code || inv.serviceCode || '',
          priority: inv.priority || inv.order || 1,
          recommendedTier: inv.recommendedTier || inv.tier || '',
          investment: inv.investment || inv.price || inv.cost || '',
          investmentFrequency: inv.investmentFrequency || inv.frequency || inv.period || 'per month',
          whyThisTier: inv.whyThisTier || inv.reasoning || '',
          problemsSolved: inv.problemsSolved || inv.problems || [],
          expectedROI: {
            multiplier: inv.expectedROI?.multiplier || inv.roi?.multiplier || inv.roi?.multiple || '',
            timeframe: inv.expectedROI?.timeframe || inv.roi?.timeframe || inv.roi?.period || '',
            calculation: inv.expectedROI?.calculation || inv.roi?.calculation || ''
          },
          keyOutcomes: inv.keyOutcomes || inv.outcomes || [],
          riskOfNotActing: inv.riskOfNotActing || inv.risk || ''
        }));
        console.log('[Discovery] Normalized investments:', analysis.recommendedInvestments.length);
      }
      
      // Normalize investment summary
      if (analysis.investmentSummary) {
        analysis.investmentSummary = {
          totalFirstYearInvestment: analysis.investmentSummary.totalFirstYearInvestment || 
                                     analysis.investmentSummary.totalFirstYear || 
                                     analysis.investmentSummary.total || '',
          projectedFirstYearReturn: analysis.investmentSummary.projectedFirstYearReturn || 
                                     analysis.investmentSummary.projectedReturn || 
                                     analysis.investmentSummary.return || '',
          paybackPeriod: analysis.investmentSummary.paybackPeriod || 
                          analysis.investmentSummary.payback || '',
          netBenefitYear1: analysis.investmentSummary.netBenefitYear1 || 
                           analysis.investmentSummary.netBenefit || '',
          roiCalculation: analysis.investmentSummary.roiCalculation || 
                          analysis.investmentSummary.calculation || '',
          comparisonToInaction: analysis.investmentSummary.comparisonToInaction || ''
        };
        console.log('[Discovery] Investment summary:', JSON.stringify(analysis.investmentSummary, null, 2));
      }
      
    } catch (e: any) {
      console.error('[Discovery] JSON parse error:', e.message);
      console.error('[Discovery] Failed to parse text (first 1000 chars):', analysisText.substring(0, 1000));
      analysis = { rawAnalysis: analysisText, parseError: true };
    }

    // ========================================================================
    // SAVE REPORT TO DATABASE
    // ========================================================================

    const report = {
      client_id: preparedData.client.id,
      practice_id: preparedData.client.practiceId,
      discovery_id: preparedData.discovery.id,
      report_type: 'discovery_analysis',
      report_data: {
        generatedAt: new Date().toISOString(),
        clientName: preparedData.client.name,
        companyName: preparedData.client.company,
        analysis,
        discoveryScores: {
          clarityScore: clarityScore,
          claritySource: claritySource,
          gapScore: preparedData.discovery.gapScore
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        financialProjections: financialProjections.hasProjections ? financialProjections : null
      },
      created_at: new Date().toISOString()
    };

    const { data: savedReport, error: saveError } = await supabase
      .from('client_reports')
      .insert(report)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
    }

    // Update discovery record
    await supabase
      .from('destination_discovery')
      .update({
        analysis_completed_at: new Date().toISOString(),
        analysis_report_id: savedReport?.id
      })
      .eq('id', preparedData.discovery.id);

    const totalTime = Date.now() - startTime;
    console.log(`Analysis complete in ${totalTime}ms (LLM: ${llmTime}ms)`);

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: savedReport?.id,
        generatedAt: new Date().toISOString(),
        client: preparedData.client,
        practice: preparedData.practice,
        discoveryScores: {
          clarityScore: clarityScore,
          claritySource: claritySource,
          gapScore: preparedData.discovery.gapScore
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        financialProjections: financialProjections.hasProjections ? financialProjections : null,
        analysis
      },
      metadata: {
        model: MODEL,
        executionTimeMs: totalTime,
        llmTimeMs: llmTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error generating analysis:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
