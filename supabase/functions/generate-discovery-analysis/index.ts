// ============================================================================
// GENERATE DISCOVERY ANALYSIS - Part 2 of 2-stage report generation
// ============================================================================
// Takes prepared data and generates the full analysis using Claude Opus 4.5
// This is the heavy LLM call - should complete within 60s with prepared data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scoreServicesFromDiscovery } from '../_shared/service-scorer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

// Use Claude Opus 4.5 for premium quality analysis
const MODEL = 'anthropic/claude-opus-4.5';

// ============================================================================
// MECHANICAL TEXT CLEANUP - Enforce British English & style rules
// ============================================================================

function cleanMechanical(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Remove em dashes, replace with comma
    .replace(/—/g, ', ')
    .replace(/, ,/g, ',')
    .replace(/, \./g, '.')
    // British English spellings
    .replace(/\boptimize/gi, 'optimise')
    .replace(/\boptimizing/gi, 'optimising')
    .replace(/\boptimized/gi, 'optimised')
    .replace(/\banalyze/gi, 'analyse')
    .replace(/\banalyzing/gi, 'analysing')
    .replace(/\banalyzed/gi, 'analysed')
    .replace(/\brealize/gi, 'realise')
    .replace(/\brealizing/gi, 'realising')
    .replace(/\brealized/gi, 'realised')
    .replace(/\bbehavior/gi, 'behaviour')
    .replace(/\bbehaviors/gi, 'behaviours')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bcenters\b/gi, 'centres')
    .replace(/\bprogram\b/gi, 'programme')
    .replace(/\bprograms\b/gi, 'programmes')
    .replace(/\borganize/gi, 'organise')
    .replace(/\borganizing/gi, 'organising')
    .replace(/\borganized/gi, 'organised')
    .replace(/\bfavor/gi, 'favour')
    .replace(/\bcolor/gi, 'colour')
    .replace(/\bhonor/gi, 'honour')
    .replace(/\brecognize/gi, 'recognise')
    .replace(/\brecognizing/gi, 'recognising')
    .replace(/\brecognized/gi, 'recognised')
    .replace(/\bspecialize/gi, 'specialise')
    .replace(/\bspecializing/gi, 'specialising')
    .replace(/\bspecialized/gi, 'specialised')
    // Clean up "Here's" patterns that slip through
    .replace(/Here's the thing[:\s]*/gi, '')
    .replace(/Here's the truth[:\s]*/gi, '')
    .replace(/Here's what I see[:\s]*/gi, '')
    .replace(/Here's what we see[:\s]*/gi, '')
    .replace(/Here's what I also see[:\s]*/gi, '')
    .replace(/But here's what I also see[:\s]*/gi, '')
    .replace(/Here's another[^.]+\.\s*/gi, '')
    // Clean up "hard work of" patterns
    .replace(/You've done the hard work of [^.]+\.\s*/gi, '')
    // Clean up "It doesn't mean X. It means Y." patterns
    .replace(/It doesn't mean [^.]+\. It means /gi, 'It means ')
    // Clean up "That's not a fantasy" patterns
    .replace(/That's not a fantasy\.\s*/gi, '')
    .replace(/That's not a dream\.\s*/gi, '')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    .trim();
}

// Recursively clean all string fields in an object
function cleanAllStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return cleanMechanical(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanAllStrings(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanAllStrings(obj[key]);
    }
    return cleaned;
  }
  
  return obj;
}

// ============================================================================
// DESTINATION CLARITY FALLBACK CALCULATION
// ============================================================================

function calculateFallbackClarity(responses: Record<string, any>): number {
  const vision = responses.dd_five_year_vision || responses.dd_five_year_picture || '';
  
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
  const sleepThieves = responses.dd_sleep_thieves || responses.dd_sleep_thief || [];
  const sleepArray = Array.isArray(sleepThieves) ? sleepThieves : [sleepThieves];
  const cashConstrained = 
    responses.sd_growth_blocker === "Don't have the capital" ||
    sleepArray.some((s: string) => s && s.includes('Cash flow and paying bills'));
  
  // Fundraising detection
  const ifIKnew = (responses.dd_suspected_truth || responses.dd_if_i_knew || '').toLowerCase();
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
  const visionText = ((responses.dd_five_year_vision || responses.dd_five_year_picture || '')).toLowerCase();
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
    reasons.push('Vision describes fundamentally different role (operator to investor transition)');
  }
  
  // Identity shift: Success defined as business running without them
  const identityShift = 
    successDef === "Creating a business that runs profitably without me" ||
    successDef === "Building a legacy that outlasts me" ||
    successDef === "Building something I can sell for a life-changing amount";
  
  if (identityShift) {
    reasons.push(`Success defined as "${successDef}" requires structured transition support`);
  }
  
  // Burnout with high readiness
  const weeklyHours = responses.dd_weekly_hours || responses.dd_owner_hours || '';
  const burnoutWithReadiness = 
    ['60-70 hours', '70+ hours'].includes(weeklyHours) &&
    responses.dd_change_readiness === "Completely ready - I'll do whatever it takes";
  
  if (burnoutWithReadiness) {
    reasons.push('Working 60-70+ hours but completely ready for change, needs structured pathway');
  }
  
  // Legacy focus
  const legacyFocus = 
    successDef.includes('legacy') ||
    responses.dd_exit_thoughts === "I've already got a clear exit plan" ||
    ['1-3 years - actively preparing', '3-5 years - need to start thinking'].includes(responses.sd_exit_timeline || '');
  
  if (legacyFocus) {
    reasons.push('Legacy or exit focus requires strategic roadmap');
  }
  
  return { lifestyleTransformation, identityShift, burnoutWithReadiness, legacyFocus, reasons };
}

// ============================================================================
// INTELLIGENT DOCUMENT EXTRACTION (LLM-Based)
// ============================================================================

interface ExtractedProjections {
  hasProjections: boolean;
  currentRevenue?: number;
  projectedRevenue?: { year: number; amount: number }[];
  grossMargin?: number;
  year5Revenue?: number;
  growthMultiple?: number;
  teamGrowth?: { current: number; projected: number };
  ebitdaMargin?: { year1?: number; year5?: number };
  customerMetrics?: { year1?: number; year5?: number };
  rawInsights?: string;
}

interface DocumentInsights {
  financialProjections: ExtractedProjections;
  businessContext: {
    stage: 'pre-revenue' | 'early-revenue' | 'growth' | 'established' | 'unknown';
    model?: string;
    fundingStatus?: string;
    launchTimeline?: string;
    keyRisks?: string[];
    keyStrengths?: string[];
  };
  relevantQuotes: string[];
}

async function extractDocumentInsights(
  documents: any[],
  openrouterKey: string
): Promise<DocumentInsights> {
  
  const emptyResult: DocumentInsights = {
    financialProjections: { hasProjections: false },
    businessContext: { stage: 'unknown' },
    relevantQuotes: []
  };
  
  if (!documents || documents.length === 0) {
    console.log('[DocExtract] No documents to process');
    return emptyResult;
  }
  
  // Combine all document content
  const documentContent = documents.map((doc, i) => {
    const content = doc.content || doc.text || '';
    if (!content) return '';
    return `\n--- DOCUMENT ${i + 1}: ${doc.fileName || 'Unnamed'} ---\n${content}\n`;
  }).filter(Boolean).join('\n');
  
  if (!documentContent || documentContent.length < 50) {
    console.log('[DocExtract] Insufficient document content');
    return emptyResult;
  }
  
  console.log('[DocExtract] Processing documents, total content length:', documentContent.length);
  
  const extractionPrompt = `You are a financial analyst extracting structured data from business documents.

Analyze the following document(s) and extract ALL financial and business information you can find.

<documents>
${documentContent}
</documents>

Return a JSON object with this EXACT structure (use null for missing data, not empty strings):

{
  "financialProjections": {
    "hasProjections": true/false,
    "projectedRevenue": [
      { "year": 1, "amount": 559000 },
      { "year": 2, "amount": 3100000 },
      ...
    ],
    "currentRevenue": <number or null - Year 1 revenue>,
    "year5Revenue": <number or null>,
    "growthMultiple": <number or null - e.g., 41 for 41x growth>,
    "grossMargin": <decimal 0-1, e.g., 0.90 for 90%>,
    "ebitdaMargin": {
      "year1": <decimal or null>,
      "year5": <decimal or null>
    },
    "teamGrowth": {
      "current": <number>,
      "projected": <number - Year 5 team size>
    },
    "customerMetrics": {
      "year1": <number or null>,
      "year5": <number or null>
    }
  },
  "businessContext": {
    "stage": "pre-revenue" | "early-revenue" | "growth" | "established",
    "model": "<business model description, e.g., 'B2B SaaS with Pro and Enterprise tiers'>",
    "fundingStatus": "<e.g., 'Raised £1m seed' or null>",
    "launchTimeline": "<e.g., 'Launching January 2025' or null>",
    "keyStrengths": ["<strength 1>", "<strength 2>"],
    "keyRisks": ["<risk 1>", "<risk 2>"]
  },
  "relevantQuotes": [
    "<any specific numbers or statements worth quoting directly>"
  ]
}

CRITICAL RULES:
1. All monetary amounts should be in GBP (£) as raw numbers (559000 not "£559K")
2. Percentages as decimals (0.90 not 90 or "90%")
3. If you can calculate growth multiple (Year5/Year1), include it
4. If data is ambiguous or missing, use null
5. Return ONLY valid JSON, no markdown, no explanation

Extract everything you can find - revenue, margins, team size, customer counts, growth rates, pricing, churn, etc.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Document Extraction',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5', // Better extraction quality
        max_tokens: 4000, // Increased to prevent truncation
        temperature: 0.1, // Low temp for consistent extraction
        messages: [
          { role: 'user', content: extractionPrompt }
        ]
      }),
    });
    
    if (!response.ok) {
      console.error('[DocExtract] API error:', response.status, await response.text());
      return emptyResult;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[DocExtract] Raw extraction response length:', content.length);
    
    // Parse the JSON response with robust extraction
    let extracted: DocumentInsights;
    try {
      let jsonString = content.trim();
      
      // Method 1: Extract from code block if present (handles ```json ... ```)
      const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
        console.log('[DocExtract] Extracted from code block');
      } else {
        // Method 2: Manual removal of fences at start/end
        jsonString = jsonString.replace(/^```(?:json)?\s*\n?/i, '');
        jsonString = jsonString.replace(/\n?```\s*$/g, '');
        jsonString = jsonString.trim();
      }
      
      // Method 3: Find JSON object start if still not clean
      if (!jsonString.startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        if (jsonStart !== -1) {
          jsonString = jsonString.substring(jsonStart);
          console.log('[DocExtract] Found JSON start at position', jsonStart);
        }
      }
      
      // Method 4: Find the matching closing brace using brace counting
      if (jsonString.startsWith('{')) {
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonString.length; i++) {
          if (jsonString[i] === '{') braceCount++;
          if (jsonString[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        if (jsonEnd !== -1 && jsonEnd < jsonString.length - 1) {
          jsonString = jsonString.substring(0, jsonEnd + 1);
          console.log('[DocExtract] Trimmed to valid JSON ending at position', jsonEnd);
        }
      }
      
      console.log('[DocExtract] Cleaned JSON length:', jsonString.length, 'preview:', jsonString.substring(0, 100));
      
      extracted = JSON.parse(jsonString);
      
      // Validate structure
      if (!extracted.financialProjections) {
        extracted.financialProjections = { hasProjections: false };
      }
      if (!extracted.businessContext) {
        extracted.businessContext = { stage: 'unknown' };
      }
      if (!extracted.relevantQuotes) {
        extracted.relevantQuotes = [];
      }
      
      // Calculate growth multiple if we have the data but it wasn't calculated
      if (extracted.financialProjections.projectedRevenue?.length >= 2) {
        const revenues = extracted.financialProjections.projectedRevenue;
        const year1 = revenues.find(r => r.year === 1)?.amount;
        const year5 = revenues.find(r => r.year === 5)?.amount;
        
        if (year1 && year5 && !extracted.financialProjections.growthMultiple) {
          extracted.financialProjections.growthMultiple = Math.round(year5 / year1);
        }
        if (year1) extracted.financialProjections.currentRevenue = year1;
        if (year5) extracted.financialProjections.year5Revenue = year5;
        
        extracted.financialProjections.hasProjections = true;
      }
      
      console.log('[DocExtract] Successfully extracted:', {
        hasProjections: extracted.financialProjections.hasProjections,
        revenueYears: extracted.financialProjections.projectedRevenue?.length || 0,
        growthMultiple: extracted.financialProjections.growthMultiple,
        businessStage: extracted.businessContext.stage
      });
      
      return extracted;
      
    } catch (parseError: any) {
      console.error('[DocExtract] JSON parse error:', parseError.message);
      console.error('[DocExtract] Raw content (first 500):', content.substring(0, 500));
      
      // Fallback: Try to extract key data using regex
      try {
        const hasProjectionsMatch = content.match(/"hasProjections"\s*:\s*(true|false)/);
        const year1Match = content.match(/"year"\s*:\s*1\s*,\s*"amount"\s*:\s*(\d+)/);
        const year5Match = content.match(/"year"\s*:\s*5\s*,\s*"amount"\s*:\s*(\d+)/);
        const grossMarginMatch = content.match(/"grossMargin"\s*:\s*([\d.]+)/);
        
        if (hasProjectionsMatch && year1Match) {
          console.log('[DocExtract] Fallback regex extraction succeeded');
          const year1 = parseInt(year1Match[1]);
          const year5 = year5Match ? parseInt(year5Match[1]) : undefined;
          const grossMargin = grossMarginMatch ? parseFloat(grossMarginMatch[1]) : undefined;
          
          return {
            financialProjections: {
              hasProjections: true,
              currentRevenue: year1,
              year5Revenue: year5,
              growthMultiple: year5 && year1 ? Math.round(year5 / year1) : undefined,
              grossMargin: grossMargin
            },
            businessContext: { stage: 'unknown' },
            relevantQuotes: []
          };
        }
      } catch (fallbackError) {
        console.error('[DocExtract] Fallback extraction also failed');
      }
      
      return emptyResult;
    }
    
  } catch (error) {
    console.error('[DocExtract] Extraction error:', error);
    return emptyResult;
  }
}

// Build context string for the main prompt
function buildDocumentInsightsContext(insights: DocumentInsights): string {
  if (!insights.financialProjections.hasProjections && insights.businessContext.stage === 'unknown') {
    return '';
  }
  
  const fp = insights.financialProjections;
  const bc = insights.businessContext;
  
  let context = `\n## EXTRACTED DOCUMENT INSIGHTS (LLM-Parsed)\n`;
  
  if (fp.hasProjections) {
    context += `\n### Financial Projections\n`;
    
    if (fp.projectedRevenue && fp.projectedRevenue.length > 0) {
      context += `Revenue Trajectory:\n`;
      fp.projectedRevenue.forEach(r => {
        const formatted = r.amount >= 1000000 
          ? `£${(r.amount / 1000000).toFixed(1)}M`
          : `£${(r.amount / 1000).toFixed(0)}K`;
        context += `- Year ${r.year}: ${formatted}\n`;
      });
    }
    
    if (fp.growthMultiple) {
      context += `\nGrowth Multiple: ${fp.growthMultiple}x over 5 years\n`;
    }
    
    if (fp.grossMargin) {
      context += `Gross Margin: ${(fp.grossMargin * 100).toFixed(0)}%\n`;
    }
    
    if (fp.ebitdaMargin?.year1 || fp.ebitdaMargin?.year5) {
      context += `EBITDA Margin: ${fp.ebitdaMargin.year1 ? (fp.ebitdaMargin.year1 * 100).toFixed(0) + '% Y1' : ''} ${fp.ebitdaMargin.year5 ? '→ ' + (fp.ebitdaMargin.year5 * 100).toFixed(0) + '% Y5' : ''}\n`;
    }
    
    if (fp.teamGrowth?.current && fp.teamGrowth?.projected) {
      context += `Team Growth: ${fp.teamGrowth.current} → ${fp.teamGrowth.projected} people\n`;
    }
    
    if (fp.customerMetrics?.year1 || fp.customerMetrics?.year5) {
      context += `Customers: ${fp.customerMetrics.year1 || '?'} Y1 → ${fp.customerMetrics.year5 || '?'} Y5\n`;
    }
    
    // Investment context calculations
    if (fp.currentRevenue && fp.currentRevenue > 0) {
      const phase1Investment = 13300; // Could be dynamic
      const pctOfRevenue = ((phase1Investment / fp.currentRevenue) * 100).toFixed(1);
      context += `\n### Investment Context\n`;
      context += `- Phase 1 investment (£${phase1Investment.toLocaleString()}) = ${pctOfRevenue}% of Year 1 revenue\n`;
      
      if (fp.grossMargin && fp.grossMargin > 0.5) {
        context += `- At ${(fp.grossMargin * 100).toFixed(0)}% gross margin, efficiency gains go almost straight to profit\n`;
      }
      
      if (fp.year5Revenue && fp.year5Revenue > 1000000) {
        const y5m = fp.year5Revenue / 1000000;
        const founderDependent = y5m * 6;
        const systemised = y5m * 12;
        context += `- At Year 5 £${y5m.toFixed(1)}M ARR:\n`;
        context += `  - Founder-dependent (6x): £${founderDependent.toFixed(0)}M valuation\n`;
        context += `  - Systemised (12x): £${systemised.toFixed(0)}M valuation\n`;
        context += `  - Infrastructure delta: £${(systemised - founderDependent).toFixed(0)}M additional value\n`;
      }
    }
  }
  
  if (bc.stage !== 'unknown') {
    context += `\n### Business Context\n`;
    context += `- Stage: ${bc.stage}\n`;
    if (bc.model) context += `- Model: ${bc.model}\n`;
    if (bc.fundingStatus) context += `- Funding: ${bc.fundingStatus}\n`;
    if (bc.launchTimeline) context += `- Timeline: ${bc.launchTimeline}\n`;
    if (bc.keyStrengths?.length) context += `- Strengths: ${bc.keyStrengths.join(', ')}\n`;
    if (bc.keyRisks?.length) context += `- Risks: ${bc.keyRisks.join(', ')}\n`;
  }
  
  if (insights.relevantQuotes?.length > 0) {
    context += `\n### Key Data Points\n`;
    insights.relevantQuotes.slice(0, 5).forEach(q => {
      context += `- "${q}"\n`;
    });
  }
  
  context += `\n### How to Use This Data\n`;
  context += `1. Reference specific projections to show you understand their business\n`;
  context += `2. Calculate investment as % of their actual revenue\n`;
  context += `3. Show valuation impact using their growth trajectory\n`;
  context += `4. Connect efficiency gains to their margins\n`;
  context += `5. Quote specific numbers to build credibility\n`;
  
  return context;
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

interface GapCalibration {
  score: number;
  counts: GapSeverity;
  explanation: string;
}

function calibrateGapScore(gaps: any[]): GapCalibration {
  // Revised weights: critical=2, high=1, medium=0.5
  const weights = {
    critical: 2,
    high: 1,
    medium: 0.5,
    low: 0.25
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
  
  // Calculate weighted score with base of 3
  const baseScore = 3;
  const weightedSum = 
    baseScore +
    counts.critical * weights.critical +
    counts.high * weights.high +
    counts.medium * weights.medium +
    counts.low * weights.low;
  
  // Cap at 10 and round conservatively
  const normalizedScore = Math.min(10, Math.max(1, Math.round(weightedSum)));
  
  let explanation = '';
  if (normalizedScore >= 9) explanation = 'Crisis level, business at risk without intervention';
  else if (normalizedScore >= 7) explanation = 'Significant gaps, multiple critical issues affecting core operations';
  else if (normalizedScore >= 5) explanation = 'Multiple gaps, 1-2 critical issues need attention';
  else if (normalizedScore >= 3) explanation = 'Some gaps, no critical issues blocking growth';
  else explanation = 'Minor optimisations, business is fundamentally healthy';
  
  return { score: normalizedScore, counts, explanation };
}

// ============================================================================
// ENHANCED CLOSING MESSAGE GUIDANCE
// ============================================================================

function buildClosingMessageGuidance(
  responses: Record<string, any>,
  affordability: AffordabilityProfile
): string {
  const teamSecret = responses.dd_hidden_from_team || responses.dd_team_secret || '';
  const externalView = responses.dd_external_perspective || responses.dd_external_view || '';
  const hardTruth = responses.dd_hard_truth || '';
  const vision = responses.dd_five_year_vision || responses.dd_five_year_picture || '';
  
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

⚠️ CRITICAL: DO NOT INVENT FACTS
Only reference things the client actually said OR that appear in the ADVISOR CONTEXT NOTES. 
- If they didn't mention a valuation, don't say "you've had a professional valuation"
- If they didn't mention funding, don't say "you've raised a seed round" (unless it's in context notes)
- If context notes mention funding: "Given your recent raise..." NOT "You said you raised..."
Hallucinating facts destroys trust instantly. One invented fact undermines the entire report.

You're not writing marketing copy. You're having a blunt conversation with someone who respects directness.

${hasVulnerability ? `
VULNERABILITY DETECTED: They shared "${teamSecret}"
Acknowledge it briefly. One sentence. Don't dwell or get therapy-speak.
Example: "The [thing they mentioned]? It's not unusual at this stage. What matters is what you do next."
NOT: "[Thing they mentioned]? It's lying to you. You're building something real, something you want to outlast you. That takes courage, not credentials."
` : ''}

${hasRelationshipStrain ? `
RELATIONSHIP STRAIN DETECTED: Their partner views work as "${externalView}"
State it plainly as a cost of the current situation. Don't soften it, but don't dramatise it either.
Example: "That tension at home? It's the cost of 70-hour weeks without the systems to support them."
` : ''}

${visionDetails.length > 0 ? `
VISION DETAILS AVAILABLE (pick ONE only):
${visionDetails.map(d => `- ${d}`).join('\n')}

Pick the single most impactful one. ONE. Not two. Not three.
BAD: "morning runs, school drop-offs, Padel with mates"
BAD: "taking your boys to school, managing a portfolio, building something that outlasts you"
GOOD: "the school drop-offs you described"
GOOD: "the portfolio life you want"
` : ''}

${affordability.stage === 'pre-revenue' ? `
FOR PRE-REVENUE CLIENT:
State the Phase 1 number. Mention Phase 2 exists. Move on.
Example: "£[X] gets [specific outcomes]. The [bigger service] comes later, after you've raised."
` : ''}

WRITING STYLE - THIS IS CRITICAL:
- Short sentences. Punch, don't pad.
- No "I believe in you" energy. State facts.
- No explaining why you're not being salesy. That's salesy.
- No parallel structures ("hard work / easier work", "not X, but Y").
- No over-explaining ("It doesn't mean X. It means Y." - just say what it means)
- Professional but direct. Senior consultant who's seen this before, not a motivational coach.
- Credible and authoritative, but approachable. Not corporate, not casual.
- Cut anything that sounds like you're building to a point. Just make the point.

TONE CALIBRATION:
Too casual: "Call me, mate"
Too corporate: "We would welcome the opportunity to schedule a discovery session"
Right tone: "Let's talk this week." or "Book a call when you're ready."

Too casual: "You've got this"
Too corporate: "We are confident in your ability to execute"
Right tone: "You've built something real. Now build the infrastructure to match."

STRUCTURE (keep it tight):
1. Acknowledge one thing they shared (1 sentence)
2. Name the gap between where they are and the destination they described (1-2 sentences)
3. Paint the destination, then mention the investment (1-2 sentences) - DESTINATION FIRST
4. Close with next step (1 sentence)

Total: 5-6 sentences MAX. Not a paragraph. Not a speech.

EXAMPLE (adapt to each client):
"The imposter syndrome? Common at this stage. You're operating in chaos, and the school drop-offs stay in the future until that changes. In 12 months you could have investor-ready numbers, a team that runs without you, and a path to the portfolio life you described. £13,300 starts that journey. Let's talk this week."

Notice: DESTINATION first ("school drop-offs", "portfolio life"), INVESTMENT second ("£13,300 starts that journey").

That's 5 sentences. That's enough.

## CLOSING MESSAGE - HARD LIMITS

MAXIMUM: 350 characters (about 5 short sentences)

If your closing is longer than 350 characters, you've written too much. Cut it.

STRUCTURE (4-5 sentences only):
1. Acknowledge ONE vulnerability they shared (1 sentence)
2. Name the destination they want (1 sentence)
3. State the gap (1 sentence)
4. Investment + next step (1-2 sentences)

EXAMPLE (318 characters):
"The imposter syndrome you mentioned? Common at this stage. You've raised nearly £1m, you're projecting 41x growth. The gap isn't capability. It's infrastructure. £13,300 starts that journey. Let's talk this week."

BAD (too long):
"The imposter syndrome you mentioned? Common at this stage. You've raised nearly £1m, you're launching in January, and you're projecting 41x growth. The gap isn't capability, it's infrastructure. The school drop-offs you described stay in the future until the chaos is addressed. £9,150 starts that journey. Let's talk this week."

That's 383 characters - trim it.

BAD PATTERNS:
- Leading with services ("£13,300 gets you management accounts, a systems audit, and 365 programme")
- Leading with features ("Financial visibility, operational clarity, transition roadmap")
- Over-explaining ("It doesn't mean you're not capable. It means you're operating without infrastructure." - just say the second part)
- Listing vision details ("taking your boys to school, managing a portfolio, building something" - pick ONE)
- "That's not a fantasy. But it requires..." (variant of It's not X. It's Y.)
- Therapy-speak ("That takes courage, not credentials")
- False intimacy with strangers ("We're in this together", "Call me")

## CONTEXT NOTE URGENCY - USE TIME-SENSITIVE DETAILS

ALWAYS check advisorContextNotes for:
- Upcoming launches ("Launching January" → "before your January launch")
- Funding rounds ("Raising Series A" → "before you go to investors")
- Deadlines ("Board meeting next month" → "before your board meeting")
- Milestones ("Product launch Q1" → "before Q1 launch")

If a time-sensitive event exists within 3 months:
1. Reference it in the closing
2. Use it as the call-to-action urgency

EXAMPLE:
Without context: "Let's talk this week."
With context: "Let's talk this week, before the January launch."

The second version creates real urgency tied to THEIR timeline.

### Context Note Extraction

Look for these patterns in advisorContextNotes:
- "Launching [month]" → deadline
- "Raising" / "fundraising" → investor urgency
- "Board" / "meeting" → governance deadline
- Dates within next 90 days → immediate urgency

If found, the closing MUST reference it.

CALL TO ACTION:
One sentence. Professional but direct.
Good: "Let's talk this week."
Good: "Let's talk this week, before the January launch." (with context)
Good: "Book a call when you're ready."
Good: "We should talk."
Bad: "Call me." (too casual for someone you've never met)
Bad: "Let's schedule a call this week. Not a sales pitch. A conversation about which of these three starting points makes the most sense for where you are right now." (over-explains)

BANNED PHRASES IN CLOSING:
- "I want to be direct with you" (just be direct)
- "because I think you can handle it"
- "playing the long game with you" (sounds like manipulation)
- "Not a sales pitch. A conversation about..."
- "You've done the hard work of X" or "You've done the hard work of getting X" (patronising)
- "I believe in you" or any variant
- Any sentence starting with "Here's"
- "What I also see:" or "What I notice:"
- "Call me" (too casual for strangers)
- "We're in this together" (false intimacy)
- "That's not a fantasy. But it..." (variant of It's not X. It's Y.)
- "It doesn't mean X. It means Y." (over-explaining)
- Listing more than 2 vision details (don't list "morning runs, school drop-offs, Padel with mates" - pick ONE)
- Listing more than 2 goals (don't list "taking boys to school, managing a portfolio, building something" - pick ONE)

ALLOWED:
- "Let's talk this week."
- "Book a call when you're ready."
- "Start with what you can afford."
- "We're here when you're ready for more."
`;
}

// Service line definitions
const SERVICE_LINES = {
  '365_method': { 
    name: '365 Alignment Programme', 
    tiers: [
      { name: 'Lite', price: 1500 }, 
      { name: 'Growth', price: 4500 }, 
      { name: 'Partner', price: 9000 }
    ] 
  },
  'management_accounts': { 
    name: 'Management Accounts', 
    tiers: [
      { name: 'Monthly', price: 650, isMonthly: true },
      { name: 'Quarterly', price: 1750, isQuarterly: true }
    ] 
  },
  'benchmarking': { 
    name: 'Benchmarking Services', 
    tiers: [
      { name: 'Snapshot', price: 450 },
      { name: 'Full Package', price: 3500 }
    ] 
  },
  'systems_audit': { 
    name: 'Systems Audit', 
    tiers: [
      { name: 'Diagnostic', price: 1500 },
      { name: 'Comprehensive', price: 4000 }
    ] 
  },
  'fractional_cfo': { 
    name: 'Fractional CFO Services', 
    tiers: [
      { name: '1 day/month', price: 2000, isMonthly: true },
      { name: '2 days/month', price: 4000, isMonthly: true },
      { name: '4 days/month', price: 7500, isMonthly: true }
    ] 
  },
  'fractional_coo': { 
    name: 'Fractional COO Services', 
    tiers: [
      { name: '1 day/month', price: 1875, isMonthly: true },
      { name: '2 days/month', price: 3750, isMonthly: true },
      { name: '4 days/month', price: 7000, isMonthly: true }
    ] 
  },
  'combined_advisory': { 
    name: 'Combined CFO/COO Advisory', 
    tiers: [
      { name: '2 days each', price: 7500, isMonthly: true },
      { name: '4 days each', price: 14000, isMonthly: true }
    ] 
  },
  'business_advisory': { 
    name: 'Business Advisory & Exit Planning', 
    tiers: [
      { name: 'Valuation', price: 1000 },
      { name: 'Full Package', price: 4000 }
    ] 
  },
  'automation': { 
    name: 'Automation Services', 
    tiers: [
      { name: 'Per hour', price: 150 },
      { name: 'Day rate', price: 1000 }
    ] 
  }
};

const SYSTEM_PROMPT = `You are a senior business advisor analysing a discovery assessment. Generate a comprehensive, personalised report.

## THE TRAVEL AGENT PRINCIPLE

You are a travel agent selling a holiday, NOT an airline selling seats.

THE DESTINATION is the life they described in their assessment - the school drop-offs, the freedom, the portfolio investor lifestyle, the business that runs without them.

THE JOURNEY is how they get there - what their life looks like at Month 3, Month 6, Month 12. Each phase is a postcard from their future.

THE SERVICES are just the planes. They're how you get there, not why you go. Nobody books a holiday because of seat pitch. They book because of the beach.

When you write this report:
- Lead with where they're going, not what they're buying
- Describe each phase as "here's what your life looks like" not "here's what the service does"
- Services are footnotes that "enable" each phase, not headlines

BAD (selling planes): "Management Accounts - £650/month - Monthly financial visibility, investor-ready reporting"
GOOD (selling destination): "Month 1-3: Investor-ready numbers. Answers when VCs ask questions. You stop guessing."

CRITICAL REQUIREMENTS:
1. Quote client's EXACT WORDS at least 10 times throughout
2. Calculate specific £ figures for every cost and benefit
3. Structure as a TRANSFORMATION JOURNEY, not a service list
4. Recommend services in PHASES based on affordability (see affordability context)
5. Show the domino effect: how each phase enables the next
6. Make the comparison crystal clear: investment cost vs. cost of inaction

⚠️ DO NOT HALLUCINATE FACTS:
Only reference things the client actually said in their responses OR that appear in the ADVISOR CONTEXT NOTES.

STRICT VERIFICATION RULES:
- If they said "investment-ready" that does NOT mean they've had a professional valuation
- If they've raised funding, you can say "you've raised funding" but NOT "you've had a professional valuation" unless explicitly stated
- If context notes mention funding, reference it as "Given your recent funding..." not as something they said in the assessment
- NEVER infer credentials, achievements, or milestones that aren't explicitly stated
- When in doubt, don't include it

CLAIM SOURCES - every factual claim must come from ONE of these:
1. DIRECT QUOTE from their assessment responses (use exact quotes)
2. ADVISOR CONTEXT NOTES (reference as "Given [context]..." or "Your recent [milestone]...")
3. CALCULATED from known data (show your working)

If you cannot point to the source, DO NOT include the claim.

EXAMPLES OF PROHIBITED INFERENCES:
- "investment-ready" → "professionally valued" ❌
- "raised funding" → "investors believe in you" ❌  
- "has a board" → "experienced governance" ❌
- "working 60-70 hours" → "dedicated founder" ❌ (editorialising)

EXAMPLES OF VALID CLAIMS:
- "You said you're 'investment-ready'" ✅ (direct quote)
- "Given your recent £1m raise..." ✅ (from context notes)
- "50% manual work on a 3-person team = ~£40k in labour waste" ✅ (calculated)

⚠️ FINANCIAL CALCULATIONS MUST BE CREDIBLE:
- Use CONSERVATIVE estimates, not inflated ones
- Don't value founder time at £200/hour as "cost" - that's not real money lost
- Real costs: actual labour waste (hours × actual wage), revenue leakage, direct inefficiency
- Opportunity cost is NOT the same as actual cost - be clear about the difference
- If manual work is 50% of a £100k payroll, the waste is £50k, not £500k
- Projected returns should be realistic and defensible, not inflated for impact
- A credible advisor gives conservative numbers that hold up to scrutiny
- An inflated number destroys trust faster than a conservative one builds it

BAD: "£364,000/year trapped in operations" (values founder time as billable - it's not)
GOOD: "£78,000/year in manual work that could be automated" (actual labour cost)

BAD: "£492,000 minimum cost of inaction"
GOOD: "£75,000-£100,000 in direct inefficiency, plus the harder-to-quantify cost of investor readiness"

## LABOUR WASTE CALCULATION - USE THEIR ACTUAL DATA

When the client says "over half our effort is manual" or similar:

1. CHECK if we have staff costs from their projections
   - documentInsights.financialProjections may contain staffCosts, overheads, or team costs
   - Check Year 1 projections for staff/team costs
   - If Year 1 staff costs = £198,000, use that EXACT number

2. CALCULATE actual waste:
   - "Over half" = 55% (conservative estimate)
   - "About half" = 50%
   - "31-50%" = 40%
   - "11-30%" = 20%
   - Waste = Staff Costs × Manual Work %
   - £198,000 × 55% = £109,000

3. DO NOT default to generic estimates (£30-40k) when you have their actual numbers

4. SHOW THE CALCULATION in the report:
   "£109,000/year in labour inefficiency (55% of £198k Year 1 staff costs)"

This makes the report credible and specific to THEM, not generic.

### Projection-Based Calculations Priority

ALWAYS prefer calculations from their projections over generic estimates:
- Staff costs from projections > industry average
- Their gross margin (90%) > assumed margin
- Their revenue (£559k) > "early stage" assumptions
- Their team size (3→28) > generic growth assumptions

## VALUATION IMPACT - ALWAYS CALCULATE FOR FOUNDER DEPENDENCY

When founder dependency is detected AND we have Year 5 projections:

1. GET Year 5 revenue from documentInsights.financialProjections.year5Revenue
2. ESTIMATE EBITDA:
   - Use their gross margin if available (e.g., 90% gross margin → assume 40-50% EBITDA for SaaS)
   - Or assume 40-50% EBITDA margin for SaaS businesses
   - Or use 30-40% for services businesses
3. CALCULATE valuation delta:
   - Founder-dependent: EBITDA × 6
   - Systemised: EBITDA × 12
   - Delta = Systemised - Founder-dependent

4. SHOW THIS IN THE GAP:
   "At your Year 5 projections (£22.7M), founder dependency costs you:
   - Founder-dependent (6x): £68M valuation
   - Systemised (12x): £136M valuation
   - Infrastructure delta: £68M in lost value"

Or more simply:
"6x vs 12x at £22.7M ARR = £136M difference in exit value"

This is not speculation - it's standard M&A math. Use it.

### When to Include Valuation Impact

ALWAYS include when:
- founderDependency = true (from advisoryInsights or pattern detection)
- Year 5 revenue > £5M
- Client has mentioned exit/legacy/investor goals

The number makes the founder dependency gap REAL and URGENT.

INVESTMENT PHASING IS CRITICAL:
- For pre-revenue/cash-constrained clients: PHASE services by affordability
- Phase 1 = Start Now (under £15k/year)
- Phase 2 = After Raise/Revenue (when they can afford it)
- Phase 3 = At Scale (when revenue supports it)
- HEADLINE the affordable number, not the total if-everything number

## INVESTMENT CALCULATION RULES

CRITICAL: Be consistent with investment figures throughout the report.

1. **Phase 1 Investment** = Services recommended for "now" timing
   - Include FULL first year cost of monthly services (e.g., £650 × 12 = £7,800)
   - Add one-time fees
   - This is the "First Year Investment" for most clients
   
2. **First Year Investment** = Same as Phase 1 for most clients
   - Only different if Phase 2 services start mid-year (rare)
   - For 99% of clients, Phase 1 = First Year Investment

3. **"Starts that journey" figure** = Phase 1 Investment (the full number)

NEVER show a partial figure like "£9,150" without explaining what it includes.

EXAMPLE CALCULATION (show your working):
- Management Accounts: £650/month × 12 months = £7,800
- Systems Audit: £4,000 (one-time)
- 365 Programme: £1,500 (one-time)
- **Phase 1 Total: £13,300**

Use £13,300 consistently:
- In the journey header: "This is what £13,300 and 12 months builds"
- In the investment box: "YOUR INVESTMENT £13,300 FIRST YEAR"
- In the closing: "£13,300 starts that journey"

If you show a different number, you've made an error. Check your math.

## INVESTMENT FRAMING - ALWAYS SHOW % OF REVENUE

When we have Year 1 revenue projections:

1. CALCULATE: Investment ÷ Year 1 Revenue × 100
   - £13,300 ÷ £559,000 = 2.38% ≈ 2.4%

2. USE in investment summary:
   "£13,300 - that's 2.4% of your Year 1 revenue"

3. USE in closing:
   "2.4% of Year 1 revenue buys you investor-ready numbers, operational clarity, and a transition path"

This reframes the investment from "expense" to "rounding error on your growth trajectory."

### Framing Hierarchy

Best → Worst:
1. "2.4% of Year 1 revenue" (specific, powerful)
2. "Less than one month's staff costs" (relatable if staff costs known)
3. "£13,300 for the year" (okay but not compelling)
4. "£13,300" (never use alone in closing)

Always use the most powerful framing you have data for.

## REVENUE TRAJECTORY - SHOW THE ARC

When we have multi-year revenue projections, show the trajectory.

INSTEAD OF:
"You're building for £22.7M ARR"

USE:
"You're building from £559k to £22.7M over 5 years - 41x growth"

OR in gap analysis:
"Your projections show £559k → £3.1M → £7.1M → £13.1M → £22.7M. 
Current systems won't survive that trajectory."

The trajectory shows:
1. The SCALE of ambition (not just end state)
2. The SPEED of growth (41x isn't incremental)
3. Why infrastructure matters NOW (Year 2 is 5.5x growth alone)

### Where to Use Trajectory

- Executive summary headline: Include Year 5 target AND growth multiple
- Gap analysis (systems): Reference Year 2 growth spike specifically
- Cost of inaction: "Another year at current trajectory means..."
- Closing: Can reference "41x growth" as credibility marker

## PAYBACK CALCULATION - BE PRECISE

Calculate payback from actual efficiency gains:

1. Investment: £13,300
2. Annual efficiency gain: Use calculated labour waste (e.g., £109,000)
3. Conservative capture rate: 30% in Year 1 = £32,700
4. Monthly savings = Annual savings ÷ 12
5. Payback = Investment ÷ Monthly savings

Round to nearest quarter:
- < 3.5 months → "3 months"
- 3.5-4.5 months → "3-4 months"
- 4.5-5.5 months → "4-5 months"
- 5.5-6.5 months → "5-6 months"

EXAMPLE CALCULATION:
- £13,300 investment
- £109,000 annual waste × 30% = £32,700 captured
- £32,700 ÷ 12 = £2,725/month savings
- Payback = £13,300 ÷ £2,725 = 4.9 months → **"4-5 months"**

Or with 40% capture rate:
- £109,000 × 40% = £43,600
- £43,600 ÷ 12 = £3,633/month
- Payback = £13,300 ÷ £3,633 = 3.7 months → **"3-4 months"**

Use the calculation, don't guess. Show your working in the ROI calculation field.

365 ALIGNMENT PROGRAMME:
This is NOT just for people without plans. It's for founders undergoing TRANSFORMATION:
- OPERATOR to INVESTOR transition
- FOUNDER to CHAIRMAN transition
- BURNOUT to BALANCE transition
If transformation signals are detected, recommend 365 even if they have a business plan.

LANGUAGE RULES (non-negotiable):

1. No em dashes (the long dash). Use commas or full stops instead.

2. British English only: optimise, analyse, realise, behaviour, centre, programme, organisation, recognise, specialise

3. Banned words (never use these): delve, realm, harness, unlock, leverage, seamless, empower, streamline, elevate, unprecedented, reimagine, holistic, foster, robust, scalable, breakthrough, disruptive, transformative, game-changer, cutting-edge, synergy, frictionless, data-driven, next-gen, paradigm, innovative

4. Banned patterns (never use these, they sound like AI):
   - Any sentence starting with "Here's" (e.g. "Here's the truth:", "Here's the thing:", "Here's what I see:", "Here's what I also see:")
   - Any sentence containing "what I see:" or "what I notice:" or "what I also see:"
   - "In a world where..."
   - "It's not about X. It's about Y."
   - "That's not a fantasy. But it..." or "That's not X. It's Y." (same pattern, different words)
   - "It doesn't mean X. It means Y." (over-explaining)
   - "Most people [X]. The few who [Y]."
   - "The real work is..."
   - "If you're not doing X, you're already behind"
   - "Let me be clear:" or "To be clear:"
   - "At the end of the day..."
   - "It goes without saying..."
   - "I want to be direct with you" (just be direct, don't announce it)
   - "because I think you can handle it"
   - "playing the long game with you" (sounds manipulative)
   - "Not a sales pitch. A conversation about..."
   - "You've done the hard work of X" (patronising)
   - Parallel structures like "You've done X. Now do Y." or "hard work / easier work"
   - Listing multiple vision details ("morning runs, school drop-offs, Padel" - pick ONE)
   - Listing multiple goals ("taking your boys to school, managing a portfolio, building something" - pick ONE)

5. Write like a senior consultant in a meeting. Direct. Credible. Professional but not corporate. Has an edge but not casual.

Writing style:
- Short sentences punch. Use them.
- State facts, not feelings. No "I believe in you" energy.
- Don't explain why you're being direct. Just be direct.
- Vary sentence length but favour short.
- For pre-revenue clients: optimise for THEIR outcome, not our revenue
- Authoritative but approachable. Not therapy-speak. Not LinkedIn motivation.
- This could go to a stranger. Keep it professional with an edge.`;

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

    const { preparedData, advisoryInsights } = await req.json();

    if (!preparedData) {
      throw new Error('preparedData is required - call prepare-discovery-data first');
    }
    
    // Log if advisory insights are provided
    if (advisoryInsights) {
      console.log('[Discovery] Advisory insights received from Stage 2:', {
        phase1Services: advisoryInsights.serviceRecommendations?.phase1?.services,
        phase2Services: advisoryInsights.serviceRecommendations?.phase2?.services,
        phase3Services: advisoryInsights.serviceRecommendations?.phase3?.services,
        topNarrativeHooks: advisoryInsights.topNarrativeHooks?.length || 0
      });
    } else {
      console.log('[Discovery] No advisory insights provided - proceeding with standard analysis');
    }

    console.log(`Generating analysis for: ${preparedData.client.name}`);

    // Debug: Log what documents we received
    if (preparedData.documents && preparedData.documents.length > 0) {
      console.log('[Discovery] Documents received:', preparedData.documents.map((d: any) => ({
        fileName: d.fileName,
        hasContent: !!(d.content || d.text),
        contentLength: (d.content || d.text || '').length,
        contentPreview: (d.content || d.text || '').substring(0, 300)
      })));
    } else {
      console.log('[Discovery] No documents in preparedData');
    }

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
    // PRE-COMPUTE SERVICE SCORES
    // ========================================================================

    const serviceScores = scoreServicesFromDiscovery(preparedData.discovery.responses);
    console.log('[Discovery] Service scores:', serviceScores.filter(s => s.score > 0));

    // ========================================================================
    // USE DOCUMENT INSIGHTS FROM STAGE 1 (or extract if not available)
    // ========================================================================
    
    let documentInsights: DocumentInsights;
    
    if (preparedData.documentInsights?.hasProjections) {
      console.log('[Discovery] Using document insights from Stage 1', {
        hasProjections: true,
        revenueYears: preparedData.documentInsights.financialProjections?.projectedRevenue?.length || 0,
        teamYears: preparedData.documentInsights.financialProjections?.projectedTeamSize?.length || 0
      });
      
      // Convert Stage 1 format to Stage 3 format
      const stage1Insights = preparedData.documentInsights;
      const fp = stage1Insights.financialProjections;
      
      // Calculate growth multiple
      let growthMultiple: number | undefined;
      if (fp?.projectedRevenue?.length) {
        const year1 = fp.projectedRevenue.find((r: any) => r.year === 1);
        const year5 = fp.projectedRevenue.find((r: any) => r.year === 5);
        if (year1 && year5 && year1.amount > 0) {
          growthMultiple = Math.round(year5.amount / year1.amount);
        }
      }
      
      // Extract funding status and launch timeline from extractedFacts
      const facts = stage1Insights.extractedFacts || [];
      const fundingStatus = facts.find((f: string) => 
        f.toLowerCase().includes('raised') || 
        f.toLowerCase().includes('funding') ||
        f.toLowerCase().includes('£') && f.toLowerCase().includes('seed')
      );
      const launchTimeline = facts.find((f: string) => 
        f.toLowerCase().includes('launch') || 
        f.toLowerCase().includes('january') ||
        f.toLowerCase().includes('february') ||
        f.toLowerCase().includes('march')
      );
      
      // Determine stage from revenue projections
      let stage: 'pre-revenue' | 'early-revenue' | 'growth' | 'established' | 'unknown' = 'unknown';
      if (fp?.projectedRevenue?.length) {
        const year1 = fp.projectedRevenue.find((r: any) => r.year === 1);
        if (year1) {
          const rev = year1.amount;
          if (rev >= 10000000) stage = 'established';
          else if (rev >= 2000000) stage = 'established';
          else if (rev >= 500000) stage = 'growth';
          else if (rev >= 100000) stage = 'early-revenue';
          else if (rev > 0) stage = 'early-revenue';
          else stage = 'pre-revenue';
        }
      }
      
      documentInsights = {
        financialProjections: {
          hasProjections: true,
          currentRevenue: fp?.projectedRevenue?.find((r: any) => r.year === 1)?.amount,
          year5Revenue: fp?.projectedRevenue?.find((r: any) => r.year === 5)?.amount,
          projectedRevenue: fp?.projectedRevenue?.map((r: any) => ({ year: r.year, amount: r.amount })),
          growthMultiple: growthMultiple,
          grossMargin: fp?.projectedGrossMargin?.[0]?.percent ? fp.projectedGrossMargin[0].percent / 100 : undefined
        },
        businessContext: {
          stage: stage,
          model: stage1Insights.businessContext?.businessModel,
          fundingStatus: fundingStatus || undefined,
          launchTimeline: launchTimeline || undefined
        },
        relevantQuotes: facts
      };
      
      console.log('[Discovery] Converted Stage 1 insights:', {
        hasProjections: documentInsights.financialProjections.hasProjections,
        growthMultiple: documentInsights.financialProjections.growthMultiple,
        year1: documentInsights.financialProjections.currentRevenue,
        year5: documentInsights.financialProjections.year5Revenue
      });
    } else {
      // Fall back to extracting ourselves (backward compatibility)
      console.log('[Discovery] Extracting document insights (Stage 1 had none)...');
      documentInsights = await extractDocumentInsights(
        preparedData.documents || [],
        openrouterKey
      );
      
      const financialProjections = documentInsights.financialProjections;
      console.log('[Discovery] Document insights extracted:', {
        hasProjections: financialProjections.hasProjections,
        growthMultiple: financialProjections.growthMultiple,
        businessStage: documentInsights.businessContext.stage,
        year1: financialProjections.currentRevenue,
        year5: financialProjections.year5Revenue
      });
    }
    
    const financialProjections = documentInsights.financialProjections;
    const documentInsightsContext = buildDocumentInsightsContext(documentInsights);

    // ========================================================================
    // BUSINESS STAGE DETECTION - For realistic timeframe calibration
    // ========================================================================
    
    interface BusinessStageProfile {
      stage: 'early-stage' | 'scaling' | 'established' | 'lifestyle';
      destinationTimeframe: '3-5 years' | '2-3 years' | '12-18 months' | '6-12 months';
      journeyFraming: 'foundations' | 'progress' | 'achievement';
    }
    
    const detectBusinessStage = (
      responses: Record<string, any>,
      projections: any
    ): BusinessStageProfile => {
      // Check for early-stage indicators
      const hasLongGrowthTrajectory = projections?.growthMultiple && projections.growthMultiple > 10;
      const isPreRevenue = !projections?.currentRevenue || projections.currentRevenue < 100000;
      const mentionsLaunching = (responses.sd_business_overview || '').toLowerCase().includes('launch');
      const mentionsRaising = (responses.sd_business_overview || '').toLowerCase().includes('raising') || 
                              (responses.sd_business_overview || '').toLowerCase().includes('investors') ||
                              (responses.sd_raising_capital || '').toLowerCase().includes('yes');
      const hasLongExitTimeline = ['3-5 years', '5+ years', 'Not thinking about it'].includes(responses.sd_exit_timeline || '');
      
      // Check for established indicators
      const hasNearExitTimeline = ['1-2 years', 'Within 12 months'].includes(responses.sd_exit_timeline || '');
      const visionForSteppingBack = (responses.dd_five_year_vision || responses.dd_five_year_picture || '').toLowerCase();
      const mentionsSteppingBack = visionForSteppingBack.includes('step back') ||
                                    visionForSteppingBack.includes('retirement');
      
      // Determine stage
      if ((hasLongGrowthTrajectory || isPreRevenue || mentionsLaunching || mentionsRaising) && hasLongExitTimeline) {
        return {
          stage: 'early-stage',
          destinationTimeframe: '3-5 years',
          journeyFraming: 'foundations'
        };
      }
      
      if (hasNearExitTimeline || mentionsSteppingBack) {
        return {
          stage: 'established',
          destinationTimeframe: '12-18 months',
          journeyFraming: 'achievement'
        };
      }
      
      if (hasLongGrowthTrajectory && !isPreRevenue) {
        return {
          stage: 'scaling',
          destinationTimeframe: '2-3 years',
          journeyFraming: 'progress'
        };
      }
      
      return {
        stage: 'lifestyle',
        destinationTimeframe: '6-12 months',
        journeyFraming: 'achievement'
      };
    };
    
    const businessStage = detectBusinessStage(
      preparedData.discovery.responses,
      financialProjections
    );

    // ========================================================================
    // BUILD PROJECTION ENFORCEMENT (if projections available)
    // ========================================================================
    
    let projectionEnforcement = '';
    
    if (financialProjections.hasProjections) {
      const y1 = financialProjections.currentRevenue || 0;
      const y5 = financialProjections.year5Revenue || 0;
      const gm = financialProjections.grossMargin || 0;
      const mult = financialProjections.growthMultiple || 0;
      const phase1 = 13300; // Base phase 1 investment
      
      const investmentPct = y1 > 0 ? ((phase1 / y1) * 100).toFixed(1) : null;
      const founderDepVal = y5 > 0 ? (y5 * 6 / 1000000).toFixed(0) : null;
      const systemisedVal = y5 > 0 ? (y5 * 12 / 1000000).toFixed(0) : null;
      const infraDelta = y5 > 0 ? ((y5 * 6) / 1000000).toFixed(0) : null;
      
      projectionEnforcement = `
## ⚠️ MANDATORY: USE THEIR FINANCIAL PROJECTIONS EXPLICITLY

Their documents contain real financial data. This differentiates a generic report from a personalised one.

### Extracted Numbers (verified from their documents):
${y1 > 0 ? `- Year 1 Revenue: £${y1.toLocaleString()}` : ''}
${y5 > 0 ? `- Year 5 Revenue: £${y5.toLocaleString()}` : ''}
${mult > 0 ? `- Growth Multiple: ${mult.toFixed(0)}x over 5 years` : ''}
${gm > 0 ? `- Gross Margin: ${(gm * 100).toFixed(0)}%` : ''}

### REQUIRED in your output:

**1. Executive Summary** - Reference their scale:
${y5 > 0 ? `- Use "£${(y5/1000000).toFixed(1)}M trajectory" or "${mult.toFixed(0)}x growth" in the headline` : '- Reference their growth ambitions'}

**2. Investment Context** - Show the math:
${investmentPct ? `- "£${phase1.toLocaleString()} represents ${investmentPct}% of Year 1 revenue"` : ''}
${gm > 0.7 ? `- "At ${(gm*100).toFixed(0)}% gross margins, efficiency savings go straight to profit"` : ''}

**3. Valuation Impact** (if Year 5 > £1M):
${y5 > 1000000 ? `- Founder-dependent (6x): £${founderDepVal}M
- Systemised (10-12x): £${systemisedVal}M  
- Infrastructure value: £${infraDelta}M difference
- Use this in closing: "The delta between 6x and 12x at your scale is £${infraDelta}M. That's what infrastructure is worth."` : ''}

**4. Closing Message** - ONE killer projection stat:
Pick the single most impactful:
${investmentPct ? `- "£${phase1.toLocaleString()} is ${investmentPct}% of your Year 1 revenue"` : ''}
${mult > 20 ? `- "${mult.toFixed(0)}x growth only happens with infrastructure"` : ''}
${infraDelta ? `- "£${infraDelta}M is what the infrastructure is worth at exit"` : ''}

### DO NOT:
- Mention projections without connecting to investment decision
- Use round/generic numbers when you have their exact figures
- Bury the projection data in the middle of the report
- List all the stats - pick the most powerful ONE for each section
`;
    } else {
      projectionEnforcement = `
## NO FINANCIAL PROJECTIONS AVAILABLE

No projection documents provided. Use assessment-based framing:
- Frame costs in terms of hours and manual work they mentioned
- Use industry benchmarks cautiously (state they're estimates)
- Focus on operational efficiency rather than revenue multiples
- Don't invent growth rates or revenue figures
`;
    }

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

    // Build context notes section
    const advisorNotes = preparedData.advisorContextNotes || [];
    const contextNotesSection = advisorNotes.length > 0 ? `
## ADVISOR CONTEXT NOTES (CRITICAL - TRUST THESE OVER ASSESSMENT!)
These are dated updates from the advisor that may supersede or add context to what the assessment captured.
The assessment captures a moment in time, these notes capture what's happened SINCE.

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
4. Reference these specifics in your analysis ("Given your recent raise..." or "With your January launch...")

⚠️ CONTEXT NOTES RULES:
- You CAN reference facts stated in context notes
- You CANNOT infer unstated facts from context notes
- "Raised £1m" does NOT mean "professionally valued" unless valuation is explicitly stated
- "Launching in January" does NOT mean "product is ready" unless explicitly stated
- Frame context note facts as external knowledge: "Given your..." not "You said..."
` : '';

    // Build business stage context
    const stageContext = `
## BUSINESS STAGE ASSESSMENT
Stage: ${businessStage.stage}
Destination Timeframe: ${businessStage.destinationTimeframe}
Journey Framing: ${businessStage.journeyFraming}

${businessStage.stage === 'early-stage' ? `
⚠️ CRITICAL: This is an early-stage/high-growth client.
- Their ultimate destination is 3-5 YEARS away, NOT 12 months
- Frame the hero as "YOUR 5-YEAR DESTINATION" 
- Frame the journey as "THE FOUNDATIONS" not "achieving the dream"
- DO NOT promise they'll be a portfolio investor in 12 months
- Use "destinationLabel": "YOUR 5-YEAR DESTINATION"
- Use "destinationContext": "This is what the next 5 years builds."
- Use "journeyLabel": "THE FOUNDATIONS (12 months)"
- Use "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination"
` : ''}

${businessStage.stage === 'established' ? `
This is an established client looking to step back.
- Their destination is achievable in 12-18 months
- Frame as "IN 12 MONTHS, YOU COULD BE..."
- Use "destinationLabel": "IN 12-18 MONTHS, YOU COULD BE..."
- Use "destinationContext": "This is what £13,300 and 12 months builds."
- Use "journeyLabel": "YOUR JOURNEY"
- Use "totalTimeframe": "12-18 months to fundamental change"
` : ''}

${businessStage.stage === 'scaling' ? `
This is a scaling business with high growth trajectory.
- Their destination is 2-3 years away
- Frame as meaningful progress toward destination
- Use "destinationLabel": "YOUR 2-3 YEAR DESTINATION"
- Use "destinationContext": "This is what the next 2-3 years builds."
- Use "journeyLabel": "YOUR JOURNEY"
- Use "totalTimeframe": "12 months to operational foundations; 2-3 years to full destination"
` : ''}

${businessStage.stage === 'lifestyle' ? `
This is a lifestyle business seeking work-life balance.
- Their destination is achievable in 6-12 months
- Frame as "IN 12 MONTHS, YOU COULD BE..."
- Use "destinationLabel": "IN 12 MONTHS, YOU COULD BE..."
- Use "destinationContext": "This is what £13,300 and 12 months builds."
- Use "journeyLabel": "YOUR JOURNEY"
- Use "totalTimeframe": "6-12 months to fundamental change"
` : ''}
`;

    const analysisPrompt = `
Analyse this discovery assessment for ${preparedData.client.name} (${preparedData.client.company || 'their business'}).

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
${stageContext}

## AFFORDABILITY ASSESSMENT
- Client Stage: ${affordability.stage}
- Cash Constrained: ${affordability.cashConstrained}
- Actively Raising: ${affordability.activelyRaising}
- Estimated Monthly Capacity: ${affordability.estimatedMonthlyCapacity}

${affordability.stage === 'pre-revenue' ? `
⚠️ PRE-REVENUE CLIENT - PHASE YOUR RECOMMENDATIONS:

## PHASE TIMING RULES

Phases are SEQUENTIAL milestones, not overlapping activities.

STANDARD PHASE STRUCTURE:
- Phase 1: Month 1-3 (Foundation)
- Phase 2: Month 3-6 (Build)  
- Phase 3: Month 6-12 (Transform)

TIMING RULES:
1. Phase 2 starts AFTER Phase 1 ends (Month 3, not Month 2)
2. Phase 3 starts AFTER Phase 2 ends (Month 6, not Month 1)
3. Each phase timeframe should be 3-6 months, not 12 months

SERVICE TIMING:
- Monthly services (Management Accounts): Start in Phase 1, continue through all phases
- One-time services (Systems Audit): Placed in the phase where they deliver impact
- Long-running programmes (365): Can span phases but should show the START phase

BAD EXAMPLE:
- Phase 1: Month 1-3, Management Accounts
- Phase 2: Month 2-4, Systems Audit  ← WRONG: overlaps
- Phase 3: Month 1-12, 365 Programme ← WRONG: spans everything

GOOD EXAMPLE:
- Phase 1: Month 1-3, "Investor-Ready Numbers" (Management Accounts £650/month)
- Phase 2: Month 3-6, "Operational Clarity" (Systems Audit £4,000)
- Phase 3: Month 6-12, "The Transition" (365 Programme £1,500)

The TRANSFORMATION is the narrative arc. Services enable each phase but don't define the timing.

Phase 1 - Foundation (Month 1-3, Start Now, max £15,000/year):
- Only recommend what they NEED NOW
- Focus on services that help them raise or launch faster
- Management Accounts + Systems Audit are appropriate

Phase 2 - Post-Raise (Month 3-6, After funding):
- Fractional executives go here
- Frame as "when you've closed your round"
- Starts AFTER Phase 1 ends

Phase 3 - At Scale (Month 6-12, when revenue supports):
- Full operational support
- Only mention as future horizon
- Starts AFTER Phase 2 ends

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
- As revenue stabilises

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

${documentInsightsContext}

## PRE-COMPUTED SERVICE SCORES (use as guidance)
These scores are computed from explicit question triggers. The AI should generally agree,
but can adjust based on holistic assessment. If deviating significantly, explain why.

${serviceScores
  .filter(s => s.score >= 20)
  .map(s => `- **${s.name}** (${s.code}): ${s.score}/100
  Triggers: ${s.triggers.join('; ')}`)
  .join('\n\n')}

${advisoryInsights ? `
## ADVISORY DEEP DIVE INSIGHTS (Stage 2 Analysis)

The following service recommendations and insights have been pre-analyzed using our advisory logic:

### EXTRACTED METRICS
${JSON.stringify(advisoryInsights.extractedMetrics, null, 2)}

### PHASED SERVICE RECOMMENDATIONS
**Phase 1 (Start Now):**
${advisoryInsights.serviceRecommendations.phase1.services.map((s: string) => `- ${s}`).join('\n')}
Total Investment: £${advisoryInsights.serviceRecommendations.phase1.totalInvestment.toLocaleString()}
Rationale: ${advisoryInsights.serviceRecommendations.phase1.rationale}

${advisoryInsights.serviceRecommendations.phase2 ? `
**Phase 2 (${advisoryInsights.serviceRecommendations.phase2.timing}):**
${advisoryInsights.serviceRecommendations.phase2.services.map((s: string) => `- ${s}`).join('\n')}
Total Investment: £${advisoryInsights.serviceRecommendations.phase2.totalInvestment.toLocaleString()}
Trigger: ${advisoryInsights.serviceRecommendations.phase2.trigger}
` : ''}

${advisoryInsights.serviceRecommendations.phase3 ? `
**Phase 3 (${advisoryInsights.serviceRecommendations.phase3.timing}):**
${advisoryInsights.serviceRecommendations.phase3.services.map((s: string) => `- ${s}`).join('\n')}
Total Investment: £${advisoryInsights.serviceRecommendations.phase3.totalInvestment.toLocaleString()}
Trigger: ${advisoryInsights.serviceRecommendations.phase3.trigger}
` : ''}

### KEY FIGURES
${Object.entries(advisoryInsights.keyFigures || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

### TOP NARRATIVE HOOKS
${advisoryInsights.topNarrativeHooks?.map((hook: string) => `- ${hook}`).join('\n') || 'None provided'}

### OVERSELLING CHECK
${advisoryInsights.oversellingCheck.rulesApplied.length > 0 ? `
Rules Applied: ${advisoryInsights.oversellingCheck.rulesApplied.join(', ')}
Services Excluded: ${advisoryInsights.oversellingCheck.servicesExcluded.join(', ') || 'None'}
Phase 1 Capped: ${advisoryInsights.oversellingCheck.phase1Capped ? 'Yes' : 'No'}
${advisoryInsights.oversellingCheck.explanation ? `Explanation: ${advisoryInsights.oversellingCheck.explanation}` : ''}
` : 'No overselling rules applied'}

**USE THESE INSIGHTS TO:**
1. Validate and refine the service recommendations in your analysis
2. Use the narrative hooks as starting points for compelling copy
3. Reference the key figures in your ROI calculations
4. Respect the phasing logic - don't recommend Phase 2/3 services in Phase 1
5. Incorporate the quantified impacts into your value propositions

**IMPORTANT:** These are advisory insights, not final recommendations. You should still apply your judgment and client-specific context, but use these as a strong foundation.
` : ''}

${projectionEnforcement}

${closingGuidance}

## GAP SCORE CALIBRATION - REVISED

Score based on severity counts:
- Each CRITICAL gap = 2 points
- Each HIGH gap = 1 point
- Each MEDIUM gap = 0.5 points

Base score = 3 (everyone has some gaps)
Final score = Base + Critical×2 + High×1 + Medium×0.5 (cap at 10)

EXAMPLES:
- 2 critical + 2 high = 3 + 4 + 2 = 9 → show as 8/10 (round conservatively)
- 2 critical + 1 high = 3 + 4 + 1 = 8 → show as 7/10
- 1 critical + 2 high = 3 + 2 + 2 = 7 → show as 6/10
- 0 critical + 3 high = 3 + 0 + 3 = 6 → show as 5/10

For Ben Stocken example:
- 2 CRITICAL (financial visibility, founder dependency)
- 2 HIGH (manual work, systems at scale)
- Score = 3 + 4 + 2 = 9 → **display as 7 or 8/10**

A score of 6/10 with 2 critical gaps undersells the urgency.

## AVAILABLE SERVICES
${JSON.stringify(SERVICE_LINES, null, 2)}

## OUTPUT FORMAT - CRITICAL: USE EXACT FIELD NAMES

⚠️ THE UI WILL BREAK IF YOU USE DIFFERENT FIELD NAMES ⚠️

BEFORE generating the report, mentally verify each factual claim has a source.

Return ONLY a valid JSON object (no markdown, no explanation, just the JSON):

{
  "verifiedFacts": {
    "fromResponses": ["list of facts directly quoted from their assessment responses"],
    "fromContextNotes": ["list of facts from advisor context notes"],
    "calculated": ["list of calculated figures with working shown"]
  },
  "executiveSummary": {
    "headline": "Destination vs current reality in one sentence (e.g., 'You're building for legacy but operating in chaos.')",
    "situationInTheirWords": "2-3 sentences using their EXACT quotes",
    "destinationVision": "The life they described - ONE specific detail, not a list",
    "currentReality": "Where they are now - concrete, not abstract",
    "criticalInsight": "The gap between destination and reality",
    "urgencyStatement": "Why the destination stays distant without action"
  },
  "destinationAnalysis": {
    "theDestination": "Paint the picture: what does their life look like when they arrive? Use THEIR words and details.",
    "fiveYearVision": "Their stated destination in their words",
    "coreEmotionalDrivers": [{ "driver": "Freedom/Legacy/Security", "evidence": "exact quote", "whatItMeans": "why this matters to them" }],
    "lifestyleGoals": ["Pick ONE specific non-business goal they mentioned - the postcard image"]
  },
  "gapAnalysis": {
    "primaryGaps": [{ 
      "gap": "specific gap", 
      "category": "Financial", 
      "severity": "critical", 
      "evidence": "quote", 
      "currentImpact": { "timeImpact": "X hours/week", "financialImpact": "£X - REAL cost, not opportunity cost", "emotionalImpact": "how it feels" } 
    }],
    "costOfInaction": { 
      "annualFinancialCost": "£X,XXX - use REAL costs only (labour waste, revenue leakage), not inflated opportunity costs", 
      "personalCost": "The destination stays distant - reference ONE specific thing they want that won't happen", 
      "compoundingEffect": "How another year of inaction pushes the destination further away" 
    }
  },
  "transformationJourney": {
    "destinationLabel": "YOUR 5-YEAR DESTINATION" or "IN 12 MONTHS, YOU COULD BE..." (based on business stage),
    "destination": "One sentence: the life they described (e.g., 'Portfolio investor. School drop-offs. A business that runs without you.')",
    "destinationContext": "This is what the next 5 years builds." or "This is what £13,300 and 12 months builds." (based on stage),
    "journeyLabel": "THE FOUNDATIONS (12 months)" or "YOUR JOURNEY" (based on stage),
    "totalInvestment": "£X,XXX", // MUST match sum of all phase services (Phase 1 = First Year for most clients)
    "investmentBreakdown": "£X,XXX management accounts + £X,XXX systems audit + £X,XXX 365 programme", // Show your working
    "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination" or "12-18 months to fundamental change" (based on stage),
    "phases": [
      {
        "phase": 1,
        "timeframe": "Month 1-3", // Always starts at Month 1
        "title": "Short punchy title (e.g., 'Financial Clarity')",
        "youWillHave": "What their life/business looks like at this point. Concrete, tangible, desirable.",
        "whatChanges": "One sentence on the shift (e.g., 'The fog lifts. You stop guessing.')",
        "enabledBy": "Service name - this is the plane, not the destination",
        "enabledByCode": "service_code_for_ui",
        "investment": "£X,XXX/frequency"
      },
      {
        "phase": 2,
        "timeframe": "Month 3-6", // Starts where Phase 1 ends (NOT Month 2-4)
        "title": "Next phase title",
        "youWillHave": "Next milestone in their journey",
        "whatChanges": "What's different now",
        "enabledBy": "Service name",
        "enabledByCode": "service_code",
        "investment": "£X,XXX"
      },
      {
        "phase": 3,
        "timeframe": "Month 6-12",
        "title": "The destination phase",
        "youWillHave": "The life they described. Reference ONE specific vision detail.",
        "whatChanges": "The fundamental transformation",
        "enabledBy": "Service name",
        "enabledByCode": "service_code",
        "investment": "£X,XXX"
      }
    ]
  },
  "recommendedInvestments": [
    {
      "service": "Service name",
      "code": "service_code",
      "priority": 1,
      "recommendedTier": "tier name",
      "investment": "£X,XXX",
      "investmentFrequency": "per month or one-time",
      "whyThisService": "Why they need this based on their responses",
      "expectedROI": "Xx in Y months",
      "keyOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"]
    }
  ],
  "investmentSummary": {
    "totalFirstYearInvestment": "£X,XXX", // MUST match transformationJourney.totalInvestment
    "investmentBreakdown": "Management Accounts £X,XXX (£XXX×12) + Systems Audit £X,XXX + 365 Lite £X,XXX", // Show your working
    "investmentAsPercentOfRevenue": "X.X% of Year 1 revenue", // ALWAYS include if Year 1 revenue available
    "projectedFirstYearReturn": "£X,XXX - be CONSERVATIVE, this must be defensible",
    "paybackPeriod": "X-X months", // Calculate precisely (see payback calculation rules)
    "netBenefitYear1": "£X,XXX",
    "roiCalculation": "Show your working - only count real, measurable savings",
    "comparisonToInaction": "Clear comparison"
  },
  "recommendedNextSteps": [
    { "step": 1, "action": "Schedule discovery call", "timing": "This week", "owner": "Oracle team" }
  ],
  "closingMessage": {
    "personalNote": "Acknowledge vulnerability, name the destination they want, state the gap. DESTINATION FIRST, investment second.",
    "callToAction": "One sentence. Let's talk this week.",
    "urgencyReminder": "Why the destination stays distant without action - ONE sentence"
  }
}

CRITICAL FIELD NAME REQUIREMENTS:
- Include BOTH "transformationJourney" AND "recommendedInvestments" (for backwards compatibility)
- transformationJourney phases need: "phase", "timeframe", "title", "youWillHave", "whatChanges", "enabledBy", "enabledByCode", "investment"
- recommendedInvestments need: "service", "code", "priority", "recommendedTier", "investment", "investmentFrequency", "whyThisService", "expectedROI", "keyOutcomes"
- Use "totalFirstYearInvestment" NOT "total" or "totalFirstYear"
- Use "recommendedNextSteps" with "step", "action", "timing", "owner"

TRANSFORMATION JOURNEY PHILOSOPHY:
You are a travel agent selling a holiday, not an airline selling seats.

CRITICAL: DESTINATION TIMEFRAME MUST BE REALISTIC
- The ULTIMATE DESTINATION is the life they described (school drop-offs, freedom, the portfolio)
- BUT: The timeframe to reach that destination depends on their business stage
- The 12-MONTH JOURNEY is about BUILDING THE FOUNDATION, not achieving the final destination

TIMEFRAME CALIBRATION (use financial projections if available):

1. PRE-REVENUE / EARLY-STAGE STARTUPS (like clients with 5-year growth trajectories):
   - Ultimate destination: 3-5 YEARS away
   - 12-month milestone: "The infrastructure that makes it possible"
   - Frame as: "In 12 months, you'll have the foundations for..."
   - Hero text: "YOUR 5-YEAR DESTINATION" (not "In 12 months")
   - DO NOT promise they'll be a "portfolio investor" in 12 months when they haven't launched yet!

2. ESTABLISHED BUSINESSES (stable revenue, looking to exit or step back):
   - Ultimate destination: 12-18 months away
   - 12-month milestone: Meaningful progress toward destination
   - Frame as: "IN 12 MONTHS, YOU COULD BE..."

3. LIFESTYLE BUSINESSES (owner wants work-life balance, not scaling):
   - Ultimate destination: 6-12 months away
   - 12-month milestone: The destination itself
   - Frame as: "In 12 months, you could be..."

HOW TO DETECT BUSINESS STAGE:
- Check for growth projections showing 5+ year trajectory → Early-stage
- Check for "launching soon" or "pre-revenue" language → Early-stage
- Check for exit timeline of 3-5 years → Established
- Check for mentions of "raising capital" or "investors" → Early-stage/Scaling
- Check for "stepping back" or "retirement" → Established

ADJUST THE HERO SECTION ACCORDINGLY:

For early-stage (Ben's case):
{
  "destinationLabel": "YOUR 5-YEAR DESTINATION",
  "destination": "Portfolio investor. School drop-offs. A business that runs without you.",
  "destinationContext": "This is what the next 5 years builds.",
  "journeyLabel": "THE FOUNDATIONS (12 months)",
  "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination"
}

For established businesses:
{
  "destinationLabel": "IN 12-18 MONTHS, YOU COULD BE...",
  "destination": "Portfolio investor. School drop-offs. A business that runs without you.",
  "destinationContext": "This is what £13,300 and 12 months builds.",
  "journeyLabel": "YOUR JOURNEY",
  "totalTimeframe": "12-18 months to fundamental change"
}

Write "youWillHave" as if describing a postcard from that point in the journey:
BAD: "Monthly financial visibility and investor-ready reporting" (feature list)
GOOD: "Investor-ready numbers. Answers when VCs ask questions. Decisions based on data, not gut." (what life feels like)

Write "whatChanges" as the shift they'll feel:
BAD: "Improved financial oversight"
GOOD: "The fog lifts. You stop guessing."

TRANSFORMATION JOURNEY SCHEMA - ADJUST TIMEFRAME TO BUSINESS STAGE:

For EARLY-STAGE / HIGH-GROWTH clients (e.g., pre-revenue startup with 5-year projections):
{
  "destinationLabel": "YOUR 5-YEAR DESTINATION",
  "destination": "Portfolio investor. School drop-offs. A business that runs without you.",
  "destinationContext": "This is what the next 5 years builds.",
  "journeyLabel": "THE FOUNDATIONS (12 months)",
  "totalInvestment": "£13,300 (Phase 1)",
  "totalTimeframe": "12 months to operational foundations; 3-5 years to full destination",
  "phases": [
    {
      "phase": 1,
      "timeframe": "Month 1-3",
      "title": "Financial Clarity",
      "youWillHave": "Investor-ready numbers. Answers when VCs ask questions. Decisions based on data, not gut.",
      "whatChanges": "The fog lifts. You stop guessing.",
      "enabledBy": "Management Accounts",
      "enabledByCode": "management_accounts",
      "investment": "£650/month"
    },
    {
      "phase": 2,
      "timeframe": "Month 3-6",
      "title": "Operational Freedom",
      "youWillHave": "A team that runs without firefighting. Manual work mapped and prioritised for automation. Your evenings back.",
      "whatChanges": "You work ON the business, not IN it.",
      "enabledBy": "Systems Audit",
      "enabledByCode": "systems_audit",
      "investment": "£4,000"
    },
    {
      "phase": 3,
      "timeframe": "Month 6-12",
      "title": "The Transition",
      "youWillHave": "A structured path from operator to investor. The school drop-offs you described. Progress toward the portfolio life.",
      "whatChanges": "You become optional to daily operations.",
      "enabledBy": "365 Alignment Programme",
      "enabledByCode": "365_lite",
      "investment": "£1,500"
    }
  ]
}

Notice: Every "youWillHave" describes LIFE, not FEATURES. The services are afterthoughts.

NOTE: Output BOTH transformationJourney AND recommendedInvestments. The frontend will transition from the old view to the new view, and needs both during the migration.

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
        hasTransformationJourney: !!analysis.transformationJourney,
        transformationJourneyPhases: analysis.transformationJourney?.phases?.length || 0,
        hasRecommendedInvestments: !!analysis.recommendedInvestments,
        recommendedInvestmentsCount: analysis.recommendedInvestments?.length || 0,
        hasInvestmentSummary: !!analysis.investmentSummary,
        hasClosingMessage: !!analysis.closingMessage
      });
      
      // Debug: Log first transformation phase if exists
      if (analysis.transformationJourney?.phases?.[0]) {
        console.log('[Discovery] First transformation phase:', JSON.stringify(analysis.transformationJourney.phases[0], null, 2));
      }
      
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
        console.log('[Discovery] Normalised investments:', analysis.recommendedInvestments.length);
      }
      
      // Normalize investment summary
      if (analysis.investmentSummary) {
        analysis.investmentSummary = {
          totalFirstYearInvestment: analysis.investmentSummary.totalFirstYearInvestment || 
                                     analysis.investmentSummary.totalFirstYear || 
                                     analysis.investmentSummary.total || '',
          investmentBreakdown: analysis.investmentSummary.investmentBreakdown || '',
          investmentAsPercentOfRevenue: analysis.investmentSummary.investmentAsPercentOfRevenue || '',
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
      
      // ======================================================================
      // APPLY MECHANICAL TEXT CLEANUP - British English & style fixes
      // ======================================================================
      console.log('[Discovery] Applying mechanical text cleanup...');
      analysis = cleanAllStrings(analysis);
      console.log('[Discovery] Text cleanup complete');
      
    } catch (e: any) {
      console.error('[Discovery] JSON parse error:', e.message);
      console.error('[Discovery] Failed to parse text (first 1000 chars):', analysisText.substring(0, 1000));
      analysis = { rawAnalysis: cleanMechanical(analysisText), parseError: true };
    }

    // ========================================================================
    // CALIBRATE GAP SCORE FROM ANALYSIS
    // ========================================================================
    
    const gapCalibration = calibrateGapScore(analysis.gapAnalysis?.primaryGaps || []);
    console.log('[Discovery] Gap calibration:', gapCalibration);

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
          gapScore: gapCalibration.score,
          gapCounts: gapCalibration.counts,
          gapExplanation: gapCalibration.explanation
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        financialProjections: financialProjections.hasProjections ? financialProjections : null,
        documentInsights: documentInsights.businessContext.stage !== 'unknown' ? documentInsights : null,
        serviceScores: serviceScores
      },
      created_at: new Date().toISOString()
    };

    // Check if a report already exists for this client/discovery combination
    const { data: existingReport } = await supabase
      .from('client_reports')
      .select('id, is_shared_with_client, shared_at')
      .eq('client_id', preparedData.client.id)
      .eq('discovery_id', preparedData.discovery.id)
      .eq('report_type', 'discovery_analysis')
      .maybeSingle();

    let savedReport;
    let saveError;

    if (existingReport) {
      // Update existing report, preserving sharing status
      console.log('[Discovery] Updating existing report:', existingReport.id);
      const { data: updatedReport, error: updateError } = await supabase
        .from('client_reports')
        .update({
          report_data: report.report_data,
          // Preserve sharing status and shared_at timestamp
          is_shared_with_client: existingReport.is_shared_with_client,
          shared_at: existingReport.shared_at
        })
        .eq('id', existingReport.id)
        .select()
        .single();
      
      savedReport = updatedReport;
      saveError = updateError;
      
      if (saveError) {
        console.error('[Discovery] Error updating report:', saveError);
      } else {
        console.log('[Discovery] Report updated successfully, sharing status preserved:', {
          isShared: existingReport.is_shared_with_client,
          sharedAt: existingReport.shared_at
        });
      }
    } else {
      // Insert new report
      console.log('[Discovery] Creating new report');
      const { data: insertedReport, error: insertError } = await supabase
        .from('client_reports')
        .insert(report)
        .select()
        .single();
      
      savedReport = insertedReport;
      saveError = insertError;
      
      if (saveError) {
        console.error('[Discovery] Error inserting report:', saveError);
      }
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
          gapScore: gapCalibration.score,
          gapCounts: gapCalibration.counts,
          gapExplanation: gapCalibration.explanation
        },
        affordability: affordability,
        transformationSignals: transformationSignals.reasons.length > 0 ? transformationSignals : null,
        financialProjections: financialProjections.hasProjections ? financialProjections : null,
        documentInsights: documentInsights.businessContext.stage !== 'unknown' ? documentInsights : null,
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

