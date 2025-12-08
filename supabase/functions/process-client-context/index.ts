// ============================================================================
// PROCESS CLIENT CONTEXT - Document Intelligence
// ============================================================================
// Extracts structured data from uploaded documents and team notes
// Builds financial and operational context for enhanced discovery analysis
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

const PATTERN_DEFINITIONS = {
  owner_dependency: {
    name: 'Owner Dependency',
    indicators: [
      'works 60+ hours',
      'can\'t take holidays',
      'involved in every decision',
      'key person risk is owner',
      'team confidence below 6'
    ],
    severity_weights: {
      hours_60_plus: 3,
      no_holiday_2_years: 3,
      firefighting_70_plus: 2,
      delegation_poor: 2,
      key_person_is_owner: 3
    },
    service_fit: ['365_method', 'fractional_coo', 'systems_audit']
  },
  financial_blindness: {
    name: 'Financial Visibility Gap',
    indicators: [
      'no management accounts',
      'don\'t know the numbers',
      'decisions based on gut feel',
      'cash flow surprises'
    ],
    service_fit: ['management_accounts', 'fractional_cfo']
  },
  scaling_constraints: {
    name: 'Scaling Constraints',
    indicators: [
      'team maxed out',
      'systems would break',
      'quality would suffer',
      'personal capacity limit'
    ],
    service_fit: ['systems_audit', 'fractional_coo', 'automation']
  },
  exit_unreadiness: {
    name: 'Exit Unpreparedness',
    indicators: [
      'no exit plan',
      'can\'t imagine stopping',
      'heavily dependent on owner',
      'no documentation'
    ],
    service_fit: ['business_advisory', '365_method']
  },
  team_challenges: {
    name: 'Team & People Issues',
    indicators: [
      'team confidence below 6',
      'key person risk',
      'struggle to delegate',
      'can\'t find good people'
    ],
    service_fit: ['fractional_coo', '365_method']
  }
};

// ============================================================================
// EXTRACTION PROMPTS
// ============================================================================

const FINANCIAL_EXTRACTION_PROMPT = `You are a financial analyst extracting structured data from business documents.

Extract the following information if present. Return NULL for any fields not found.
Be precise with numbers - don't estimate.

Return a JSON object with:
{
  "period_type": "annual|quarterly|monthly|ytd",
  "period_end_date": "YYYY-MM-DD",
  "revenue": number or null,
  "cost_of_sales": number or null,
  "gross_profit": number or null,
  "operating_costs": number or null,
  "net_profit": number or null,
  "staff_costs": number or null,
  "staff_count": number or null,
  "debtors": number or null,
  "creditors": number or null,
  "cash": number or null,
  "prior_year_revenue": number or null,
  "prior_year_profit": number or null,
  "extracted_insights": [
    "Any notable observations about the financials"
  ],
  "data_quality": "high|medium|low",
  "confidence": 0-100
}`;

const OPERATIONAL_EXTRACTION_PROMPT = `You are a business analyst extracting operational intelligence from documents and notes.

Extract the following if present:
{
  "business_type": "service|product|hybrid",
  "industry": "string",
  "years_trading": number or null,
  "client_count": number or null,
  "key_clients_mentioned": ["list of client names if mentioned"],
  "team_members_mentioned": ["list of names/roles"],
  "challenges_mentioned": ["specific challenges noted"],
  "strengths_mentioned": ["specific strengths noted"],
  "opportunities_mentioned": ["opportunities identified"],
  "risks_mentioned": ["risks identified"],
  "confidence": 0-100
}`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { 
      clientId, 
      practiceId, 
      documentId,
      documentContent,
      documentType, // 'financial', 'operational', 'notes', 'auto'
      action // 'extract', 'analyze_patterns', 'full_analysis'
    } = await req.json();

    if (!clientId || !practiceId) {
      throw new Error('clientId and practiceId are required');
    }

    console.log(`Processing context for client ${clientId}, action: ${action}`);

    let result: any = { success: true };

    // ========================================================================
    // ACTION: EXTRACT - Parse document and extract structured data
    // ========================================================================
    if (action === 'extract' && documentContent) {
      const extractionType = documentType === 'auto' 
        ? await detectDocumentType(documentContent, openrouterKey)
        : documentType;

      console.log(`Detected document type: ${extractionType}`);

      if (extractionType === 'financial') {
        const financialData = await extractFinancialData(documentContent, openrouterKey);
        
        // Save to client_financial_context
        const { data: savedFinancial, error: saveError } = await supabase
          .from('client_financial_context')
          .upsert({
            client_id: clientId,
            practice_id: practiceId,
            period_type: financialData.period_type,
            period_end_date: financialData.period_end_date,
            revenue: financialData.revenue,
            gross_profit: financialData.gross_profit,
            operating_costs: financialData.operating_costs,
            net_profit: financialData.net_profit,
            staff_cost: financialData.staff_costs,
            staff_count: financialData.staff_count,
            cash_position: financialData.cash,
            revenue_growth_pct: financialData.prior_year_revenue 
              ? ((financialData.revenue - financialData.prior_year_revenue) / financialData.prior_year_revenue * 100)
              : null,
            extracted_insights: financialData.extracted_insights,
            data_source: 'document_upload',
            last_updated: new Date().toISOString()
          }, { onConflict: 'client_id' })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving financial context:', saveError);
        }

        result.extraction = {
          type: 'financial',
          data: financialData,
          saved: !saveError
        };
      } 
      else if (extractionType === 'operational') {
        const operationalData = await extractOperationalData(documentContent, openrouterKey);
        
        // Save to client_operational_context
        const { error: saveError } = await supabase
          .from('client_operational_context')
          .upsert({
            client_id: clientId,
            practice_id: practiceId,
            business_type: operationalData.business_type,
            industry: operationalData.industry,
            years_trading: operationalData.years_trading,
            client_count: operationalData.client_count,
            observed_strengths: operationalData.strengths_mentioned,
            observed_challenges: operationalData.challenges_mentioned,
            risk_factors: operationalData.risks_mentioned,
            updated_at: new Date().toISOString()
          }, { onConflict: 'client_id' });

        if (saveError) {
          console.error('Error saving operational context:', saveError);
        }

        result.extraction = {
          type: 'operational',
          data: operationalData,
          saved: !saveError
        };
      }
    }

    // ========================================================================
    // ACTION: ANALYZE_PATTERNS - Run pattern detection on all client data
    // ========================================================================
    if (action === 'analyze_patterns' || action === 'full_analysis') {
      // Gather all client data
      const [
        { data: discovery },
        { data: financial },
        { data: operational },
        { data: documents }
      ] = await Promise.all([
        supabase.from('destination_discovery').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('client_financial_context').select('*').eq('client_id', clientId).single(),
        supabase.from('client_operational_context').select('*').eq('client_id', clientId).single(),
        supabase.from('client_context').select('*').eq('client_id', clientId)
      ]);

      // Analyze patterns
      const patterns = await analyzePatterns({
        discovery: discovery?.responses || {},
        financial,
        operational,
        documents: documents || []
      }, openrouterKey);

      // Save pattern analysis
      const { data: savedAnalysis, error: analysisError } = await supabase
        .from('client_pattern_analysis')
        .upsert({
          client_id: clientId,
          practice_id: practiceId,
          analysis_type: action === 'full_analysis' ? 'combined' : 'pattern_only',
          patterns_detected: patterns.patterns,
          risks_identified: patterns.risks,
          opportunities_identified: patterns.opportunities,
          emotional_anchors: patterns.emotional_anchors,
          destination_clarity_score: patterns.scores.destination_clarity,
          gap_severity_score: patterns.scores.gap_severity,
          readiness_score: patterns.scores.readiness,
          opportunity_score: patterns.scores.opportunity,
          recommended_services: patterns.recommended_services,
          source_discovery_id: discovery?.id,
          created_at: new Date().toISOString()
        }, { onConflict: 'client_id' })
        .select()
        .single();

      if (analysisError) {
        console.error('Error saving pattern analysis:', analysisError);
      }

      result.patterns = patterns;
      result.analysisSaved = !analysisError;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error processing client context:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function detectDocumentType(content: string, apiKey: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku-20240307',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Classify this document as either "financial" (P&L, balance sheet, accounts) or "operational" (notes, org charts, processes). Reply with just one word.\n\n${content.substring(0, 2000)}`
      }]
    })
  });

  const data = await response.json();
  const classification = data.choices?.[0]?.message?.content?.toLowerCase() || 'operational';
  return classification.includes('financial') ? 'financial' : 'operational';
}

async function extractFinancialData(content: string, apiKey: string): Promise<any> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: FINANCIAL_EXTRACTION_PROMPT },
        { role: 'user', content: `Extract financial data from this document:\n\n${content}` }
      ]
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    return { error: 'Failed to parse extraction', raw: text };
  }
}

async function extractOperationalData(content: string, apiKey: string): Promise<any> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: OPERATIONAL_EXTRACTION_PROMPT },
        { role: 'user', content: `Extract operational data from this document:\n\n${content}` }
      ]
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    return { error: 'Failed to parse extraction', raw: text };
  }
}

async function analyzePatterns(clientData: any, apiKey: string): Promise<any> {
  const analysisPrompt = `Analyze this client data and identify patterns, risks, opportunities, and service recommendations.

CLIENT DATA:
${JSON.stringify(clientData, null, 2)}

PATTERN DEFINITIONS TO LOOK FOR:
${JSON.stringify(PATTERN_DEFINITIONS, null, 2)}

Return a JSON object with:
{
  "patterns": [
    {
      "pattern": "Pattern name",
      "evidence": ["specific evidence from the data"],
      "severity": "high|medium|low",
      "service_fit": ["service_codes"]
    }
  ],
  "risks": [
    {
      "risk": "Risk name",
      "description": "What this means",
      "impact": "Potential impact",
      "urgency": "high|medium|low"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Opportunity name",
      "current_state": "Where they are",
      "potential_value": "What could be achieved",
      "recommended_service": "service_code"
    }
  ],
  "emotional_anchors": {
    "freedom": ["relevant quotes/phrases"],
    "security": ["relevant quotes/phrases"],
    "growth": ["relevant quotes/phrases"],
    "family": ["relevant quotes/phrases"]
  },
  "scores": {
    "destination_clarity": 1-10,
    "gap_severity": 1-10,
    "readiness": 1-10,
    "opportunity": 1-10
  },
  "recommended_services": [
    {
      "code": "service_code",
      "priority": 1-3,
      "reason": "Why this service for this client",
      "urgency": "high|medium|low"
    }
  ]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: analysisPrompt }
      ]
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { patterns: [], risks: [], opportunities: [], scores: {} };
  } catch {
    console.error('Failed to parse pattern analysis:', text);
    return { patterns: [], risks: [], opportunities: [], scores: {}, error: 'Parse failed' };
  }
}

