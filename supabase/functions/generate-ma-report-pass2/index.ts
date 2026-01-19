// ============================================================================
// MANAGEMENT ACCOUNTS REPORT - PASS 2: NARRATIVES & CLIENT VIEW
// ============================================================================
// Purpose: Generate compelling narratives for client view. Create the "wow" content.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MAPass2Output {
  headline: string;
  tuesdayAnswerPreview: {
    question: string;
    introText: string;
    showTrueCash: boolean;
    showForecast: boolean;
    showScenario: boolean;
    scenarioType?: string;
  };
  clientFindings: Array<{
    headline: string;
    detail: string;
    cost: string;
  }>;
  transformationSection: {
    intro: string;
    quotes: string[];
    connectionText: string;
  };
  quickWins: Array<{
    action: string;
    timing: string;
    benefit: string;
  }>;
  recommendedApproach: {
    summary: string;
    frequency: string;
    focusAreas: string[];
    tier: string;
    tierRationale: string;
  };
  goalConnection: {
    narrative: string;
    theirWords: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reportId, engagementId, clientId, additionalContext } = await req.json();

    if (!reportId && !engagementId && !clientId) {
      throw new Error('Either reportId, engagementId, or clientId is required');
    }

    const isRegeneration = !!additionalContext;
    console.log('[MA Pass2] Starting narrative generation for:', reportId ? `report ${reportId}` : engagementId ? `engagement ${engagementId}` : `client ${clientId}`);
    if (isRegeneration) {
      console.log('[MA Pass2] Regeneration mode with additional context:');
      console.log('[MA Pass2] - callNotes length:', additionalContext.callNotes?.length || 0);
      console.log('[MA Pass2] - callTranscript length:', additionalContext.callTranscript?.length || 0);
      console.log('[MA Pass2] - gapsFilled keys:', additionalContext.gapsFilled ? Object.keys(additionalContext.gapsFilled) : 'none');
      console.log('[MA Pass2] - gapsWithLabels keys:', additionalContext.gapsWithLabels ? Object.keys(additionalContext.gapsWithLabels) : 'none');
      console.log('[MA Pass2] - tierDiscussed:', additionalContext.tierDiscussed || 'none');
      if (additionalContext.gapsFilled) {
        console.log('[MA Pass2] - gapsFilled values:', JSON.stringify(additionalContext.gapsFilled).substring(0, 500));
      }
      if (additionalContext.gapsWithLabels) {
        console.log('[MA Pass2] - gapsWithLabels sample:', JSON.stringify(Object.entries(additionalContext.gapsWithLabels).slice(0, 2)));
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the report with pass1 data - try by reportId first, then engagementId, then clientId
    let report = null;
    let reportError = null;
    
    if (reportId) {
      const { data, error } = await supabase
        .from('ma_assessment_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      report = data;
      reportError = error;
    } else if (engagementId) {
      const { data, error } = await supabase
        .from('ma_assessment_reports')
        .select('*')
        .eq('engagement_id', engagementId)
        .single();
      report = data;
      reportError = error;
    } else if (clientId) {
      const { data, error } = await supabase
        .from('ma_assessment_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      report = data;
      reportError = error;
    }

    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message}`);
    }

    if (!report.pass1_data) {
      throw new Error('Pass 1 data not found. Run pass 1 first.');
    }

    // Skip early return only if NOT regenerating
    if (report.status !== 'pass1_complete' && !isRegeneration) {
      console.log('[MA Pass2] Report status:', report.status);
      if (report.status === 'generated') {
        console.log('[MA Pass2] Report already generated, returning existing data');
        return new Response(
          JSON.stringify({
            success: true,
            reportId: report.id,
            status: 'generated',
            pass2Data: report.pass2_data,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    if (isRegeneration) {
      console.log('[MA Pass2] Regeneration requested - will regenerate even though status is:', report.status);
    }

    // Update status
    await supabase
      .from('ma_assessment_reports')
      .update({ status: 'pass2_running' })
      .eq('id', report.id);

    console.log('[MA Pass2] Pass 1 data found, generating narratives...');

    // Fetch uploaded documents and their extracted data if available
    let uploadedDocumentsContext = '';
    try {
      // Get engagement ID from report
      const engagementIdToUse = report.engagement_id;
      
      if (engagementIdToUse) {
        const { data: documents } = await supabase
          .from('ma_uploaded_documents')
          .select('*')
          .eq('engagement_id', engagementIdToUse)
          .eq('processing_status', 'completed');
        
        if (documents && documents.length > 0) {
          console.log(`[MA Pass2] Found ${documents.length} processed documents to include`);
          
          const docSummaries = documents.map(doc => {
            const extracted = doc.extracted_data || {};
            return {
              type: doc.document_type || 'unknown',
              filename: doc.original_name,
              // Include key extracted financial data
              revenue: extracted.revenue,
              costs: extracted.costs,
              profit: extracted.profit,
              cashBalance: extracted.cashBalance,
              keyMetrics: extracted.keyMetrics,
              trends: extracted.trends,
              summary: extracted.summary,
            };
          });
          
          uploadedDocumentsContext = `
## UPLOADED FINANCIAL DOCUMENTS
The client has provided the following financial documents. Use this data to make your analysis more specific and accurate:

${JSON.stringify(docSummaries, null, 2)}

Use specific numbers from these documents to strengthen your findings and recommendations.
`;
        }
      }
    } catch (docErr) {
      console.error('[MA Pass2] Error fetching documents (non-fatal):', docErr);
    }

    // Build the prompt (with additional context if regenerating, and documents)
    const prompt = buildPass2Prompt(report.pass1_data, additionalContext, uploadedDocumentsContext);

    // Call Claude via OpenRouter
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log('[MA Pass2] Calling Claude Opus 4.5 via OpenRouter for narrative generation...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor MA Report Pass2',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.5',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const openRouterResponse = await response.json();
    const content = openRouterResponse.choices?.[0]?.message?.content || '';
    
    if (!content) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON response
    let pass2Data: MAPass2Output;
    try {
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0].trim();
      }
      pass2Data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[MA Pass2] JSON parse error:', parseError);
      console.error('[MA Pass2] Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    // Calculate cost (OpenRouter uses OpenAI-style usage format)
    // Opus 4.5 pricing: $15/1M input, $75/1M output
    const inputTokens = openRouterResponse.usage?.prompt_tokens || 0;
    const outputTokens = openRouterResponse.usage?.completion_tokens || 0;
    const cost = (inputTokens * 0.015 + outputTokens * 0.075) / 1000;

    // Build client view combining pass1 and pass2 data
    const clientView = {
      headline: pass2Data.headline,
      tuesdayAnswerPreview: pass2Data.tuesdayAnswerPreview,
      clientFindings: pass2Data.clientFindings,
      transformationSection: pass2Data.transformationSection,
      quickWins: pass2Data.quickWins,
      recommendedApproach: pass2Data.recommendedApproach,
      goalConnection: pass2Data.goalConnection,
      // Include some pass1 data needed for previews
      extractedFacts: report.pass1_data.extractedFacts,
      tierRecommendation: report.pass1_data.tierRecommendation,
    };

    // Update report with pass2 data and set as generated
    const { error: updateError } = await supabase
      .from('ma_assessment_reports')
      .update({
        status: 'generated',
        pass2_data: pass2Data,
        pass2_completed_at: new Date().toISOString(),
        pass2_model: 'anthropic/claude-opus-4.5',
        pass2_cost: cost,
        client_view: clientView,
      })
      .eq('id', report.id);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    console.log('[MA Pass2] Report generation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        reportId: report.id,
        status: 'generated',
        pass2Data,
        clientView,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[MA Pass2] Error:', error);

    // Try to update status to error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { engagementId } = await req.json().catch(() => ({}));
      if (engagementId) {
        await supabase
          .from('ma_assessment_reports')
          .update({
            status: 'error',
            error_message: error.message,
            error_at: new Date().toISOString(),
          })
          .eq('engagement_id', engagementId);
      }
    } catch (e) {
      console.error('[MA Pass2] Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildPass2Prompt(pass1Data: any, additionalContext?: any, uploadedDocumentsContext?: string): string {
  let contextSection = '';
  
  if (additionalContext) {
    // Build gaps section - prefer structured labels, fall back to raw JSON
    let gapsSection = '';
    if (additionalContext.gapsWithLabels && Object.keys(additionalContext.gapsWithLabels).length > 0) {
      gapsSection = `### CRITICAL: New Information Captured During Call
These specific details were captured during the follow-up call. You MUST use these exact numbers in your output:

${Object.entries(additionalContext.gapsWithLabels).map(([topic, data]: [string, any]) => 
  `**${topic}**\nAnswer: ${data.answer}`
).join('\n\n')}`;
    } else if (additionalContext.gapsFilled && Object.keys(additionalContext.gapsFilled).length > 0) {
      // Fall back to raw gaps but format them better
      const gapValues = Object.values(additionalContext.gapsFilled).filter((v: any) => v && String(v).trim());
      if (gapValues.length > 0) {
        gapsSection = `### CRITICAL: New Information Captured During Call
These specific details were captured during the follow-up call. You MUST use these exact numbers in your output:

${gapValues.map((answer: any, i: number) => `Detail ${i + 1}: ${answer}`).join('\n\n')}`;
      }
    }
    
    contextSection = `
## ⚠️ REGENERATION WITH NEW CALL DATA - READ CAREFULLY ⚠️

This is a REGENERATION request. The advisor has conducted a follow-up call and captured NEW SPECIFIC INFORMATION.

**YOUR #1 PRIORITY: Use the specific numbers, names, and details from this section. Do NOT use placeholder or generic language when you have real data.**

${additionalContext.callNotes ? `### Call Notes\n${additionalContext.callNotes}\n` : ''}
${additionalContext.callTranscript ? `### Call Transcript\n${additionalContext.callTranscript.substring(0, 8000)}\n` : ''}
${gapsSection}
${additionalContext.clientObjections ? `### Client Objections to Address\n${additionalContext.clientObjections}\n` : ''}
${additionalContext.tierDiscussed ? `### Tier Interest\nClient showed interest in: ${additionalContext.tierDiscussed.toUpperCase()} tier.\n` : ''}
${additionalContext.additionalInsights ? `### Additional Context\n${additionalContext.additionalInsights}\n` : ''}

## MANDATORY REQUIREMENTS FOR THIS REGENERATION:
1. If MRR/ARR numbers are provided above, use them (e.g., "At £0 MRR currently with £40k YTD consulting revenue...")
2. If burn rate is provided above, use it (e.g., "Your £22k monthly burn gives you 9 months runway...")  
3. If hiring triggers are mentioned, reference them specifically (e.g., "Your £200k ARR trigger for hiring...")
4. If funding plans are mentioned, incorporate them (e.g., "Your seed round target at £500k ARR...")
5. NEVER say generic things like "your current revenue" when you have the actual number above

`;
  }

  return `You are writing the client-facing analysis for a Management Accounts assessment.
${uploadedDocumentsContext || ''}

## YOUR TASK
Create compelling, personalized content that:
1. Shows them we listened (use their exact words and specifics)
2. Creates the "wow" (help them visualize what better looks like)
3. Connects to emotion (their fears, their hopes, their goals)
4. Leads to action (natural progression to tier selection)
${contextSection}
## PASS 1 DATA (extracted from their assessment)
${JSON.stringify(pass1Data, null, 2)}

## WRITING RULES

### Headline
- Must be punchy and specific
- Use their actual numbers from the assessment
- Show the cost of status quo
- Maximum 2 sentences
- Example: "You're running a £2m-£5m business by checking your bank balance, which has already cost you £80k in missed opportunities and created cash crises that forced you to delay hires twice."

### Client Findings (max 3)
- Short headlines that name the problem specifically
- Use THEIR names/numbers: "The £95k illusion", "The Henderson unknown", "The Morrison blindspot"
- Quantify the cost where possible
- Each should be punchy, not a paragraph

### Tuesday Answer Preview
- Determine which visual previews to show based on their Tuesday question:
  - If about cash/affordability → showTrueCash: true, showForecast: true
  - If about profitability → showScenario with type 'price' or 'client_loss'
  - If about hiring → showScenario with type 'hire'
- Write intro text that connects to their specific question

### Transformation Section
- Use their EXACT quotes from visibilityTransformation and sleepBetter
- Don't paraphrase - quote verbatim with quotation marks
- Connection text should link their hopes to our delivery

### Quick Wins (exactly 3)
- Reformatted from pass1 for client consumption
- Clear timing and benefit

### Recommended Approach
- One paragraph summary of what we'll deliver
- Connect to their specific pain points
- Explain why the recommended tier fits them

### Goal Connection
- This is the emotional close
- Reference their specific stories (cash crisis, delayed decisions, missed opportunities)
- Use contrast: "Right now you're... / With visibility you'd..."
- End section with 3-5 of their most powerful quotes

## BANNED PHRASES
- "streamline", "leverage", "optimize", "best practices"
- "digital transformation", "holistic approach"
- "I want to be direct", "Let me be honest"
- Starting sentences with "Your"
- Generic consulting speak

## TONE
- Direct, confident, specific
- UK English (organisation not organization)
- No corporate waffle
- Short sentences. Punch, don't pad.

## OUTPUT FORMAT
Return ONLY valid JSON matching this structure (no markdown, no explanation):

{
  "headline": "Punchy headline using their numbers and specifics",
  "tuesdayAnswerPreview": {
    "question": "Their exact Tuesday question verbatim",
    "introText": "Here's what answering that could look like...",
    "showTrueCash": boolean,
    "showForecast": boolean,
    "showScenario": boolean,
    "scenarioType": "hire|price|client_loss|investment" or null
  },
  "clientFindings": [
    {
      "headline": "The £X Problem (short, punchy)",
      "detail": "One sentence explanation",
      "cost": "Quantified cost or impact"
    }
  ],
  "transformationSection": {
    "intro": "When we asked what would change with proper visibility, you said:",
    "quotes": ["Exact quote 1", "Exact quote 2"],
    "connectionText": "That's exactly what we're going to build."
  },
  "quickWins": [
    {
      "action": "What to do",
      "timing": "When",
      "benefit": "What they gain"
    }
  ],
  "recommendedApproach": {
    "summary": "One paragraph describing the service",
    "frequency": "Monthly/weekly etc",
    "focusAreas": ["Focus 1", "Focus 2", "Focus 3"],
    "tier": "bronze|silver|gold|platinum",
    "tierRationale": "Why this tier fits their situation"
  },
  "goalConnection": {
    "narrative": "Longer paragraph connecting their pain to our solution, ending with hope",
    "theirWords": ["Key quote 1", "Key quote 2", "Key quote 3"]
  }
}`;
}

