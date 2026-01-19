// ============================================================================
// MANAGEMENT ACCOUNTS - REGENERATE ADMIN VIEW WITH CALL CONTEXT
// ============================================================================
// Purpose: Update the admin guidance (scenarios, findings) with specific numbers
// from the call context captured during the follow-up call.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reportId, clientId } = await req.json();

    if (!reportId && !clientId) {
      throw new Error('Either reportId or clientId is required');
    }

    console.log('[MA AdminRegen] Starting admin view regeneration for:', reportId ? `report ${reportId}` : `client ${clientId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the report
    let report = null;
    if (reportId) {
      const { data, error } = await supabase
        .from('ma_assessment_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (error) throw new Error(`Report not found: ${error.message}`);
      report = data;
    } else {
      const { data, error } = await supabase
        .from('ma_assessment_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw new Error(`Report not found: ${error.message}`);
      report = data;
    }

    if (!report.pass1_data) {
      throw new Error('Pass 1 data not found');
    }

    if (!report.call_context || Object.keys(report.call_context).length === 0) {
      throw new Error('No call context found - fill in the gaps first');
    }

    console.log('[MA AdminRegen] Found report with call context');

    // Extract the call context
    const callContext = report.call_context;
    const gapsWithLabels = callContext.gapsWithLabels || {};
    const gapsFilled = callContext.gapsFilled || {};

    // Build a summary of new information
    const newInfo: string[] = [];
    Object.entries(gapsWithLabels).forEach(([topic, data]: [string, any]) => {
      newInfo.push(`• ${topic}: ${data.answer}`);
    });

    if (newInfo.length === 0) {
      // Fall back to raw gaps
      Object.values(gapsFilled).forEach((answer: any, i) => {
        if (answer && String(answer).trim()) {
          newInfo.push(`• Detail ${i + 1}: ${answer}`);
        }
      });
    }

    if (newInfo.length === 0) {
      throw new Error('No filled gaps found in call context');
    }

    console.log('[MA AdminRegen] Found', newInfo.length, 'pieces of new information');

    // Build prompt to regenerate admin guidance sections
    const prompt = buildAdminRegenPrompt(report.pass1_data, newInfo, callContext);

    // Call Claude
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log('[MA AdminRegen] Calling Claude to regenerate admin sections...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor MA Admin Regen',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
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
    let updatedSections: any;
    try {
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0].trim();
      }
      updatedSections = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[MA AdminRegen] JSON parse error:', parseError);
      console.error('[MA AdminRegen] Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    // Merge updated sections into existing pass1_data
    const updatedPass1Data = {
      ...report.pass1_data,
      adminGuidance: {
        ...report.pass1_data.adminGuidance,
        scenariosToBuild: updatedSections.scenariosToBuild || report.pass1_data.adminGuidance.scenariosToBuild,
      },
      // Update findings if provided
      findings: updatedSections.findings || report.pass1_data.findings,
      // Update quick wins if provided
      quickWins: updatedSections.quickWins || report.pass1_data.quickWins,
    };

    // Update the report
    const { error: updateError } = await supabase
      .from('ma_assessment_reports')
      .update({
        pass1_data: updatedPass1Data,
        admin_view: updatedPass1Data.adminGuidance,
        admin_regenerated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    console.log('[MA AdminRegen] Admin view regeneration complete!');

    return new Response(
      JSON.stringify({
        success: true,
        reportId: report.id,
        updatedSections: Object.keys(updatedSections),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[MA AdminRegen] Error:', error);
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

function buildAdminRegenPrompt(pass1Data: any, newInfo: string[], callContext: any): string {
  // Extract numbers from the new info for the checklist
  const allText = newInfo.join(' ');
  const moneyMatches = allText.match(/£[\d,]+k?/gi) || [];
  const pctMatches = allText.match(/\d+%/g) || [];
  const monthMatches = allText.match(/\d+\s*months?/gi) || [];
  const uniqueNumbers = [...new Set([...moneyMatches, ...pctMatches, ...monthMatches])].slice(0, 10);

  return `You are updating the admin guidance for a Management Accounts assessment with SPECIFIC information captured during a follow-up call.

## CRITICAL: NEW INFORMATION FROM CALL
${newInfo.join('\n')}

${callContext.tierDiscussed ? `## CLIENT TIER INTEREST: ${callContext.tierDiscussed}` : ''}

## EXISTING PASS 1 DATA (for context)
Client Profile: ${JSON.stringify(pass1Data.clientProfile, null, 2)}
Client Quotes: ${JSON.stringify(pass1Data.clientQuotes, null, 2)}
Current Tier Recommendation: ${pass1Data.tierRecommendation?.tier}

## YOUR TASK
Update the following sections using the SPECIFIC numbers and details from the call:

1. **scenariosToBuild** - Replace generic "Role X at £Xk" with actual roles and salaries
2. **findings** - Update findings to include specific numbers where relevant
3. **quickWins** - Make quick wins reference the actual numbers

## MANDATORY: Numbers that MUST appear in your output:
${uniqueNumbers.map(n => `✓ "${n}"`).join('\n')}

## BANNED PHRASES - These will cause REJECTION:
✗ "Role X at £Xk salary" - use the actual role names and salaries from the call
✗ "your current revenue" - use the actual MRR/ARR numbers
✗ Any placeholder "X" when you have real data

## OUTPUT FORMAT
Return ONLY valid JSON with these sections:

{
  "scenariosToBuild": [
    {
      "type": "hire|price|client_loss",
      "name": "SPECIFIC scenario name with actual numbers (e.g., 'Customer Success Executive at £40k impact on runway')",
      "reason": "Why build this - reference their specific situation"
    }
  ],
  "findings": [
    {
      "id": "finding_1",
      "title": "Short punchy title WITH NUMBERS",
      "finding": "What we found using SPECIFIC details from the call",
      "implication": "Why it matters - be specific",
      "recommendedAction": "What to do - reference actual numbers",
      "severity": "critical|significant|moderate",
      "category": "cash|profitability|decisions|reporting|operations"
    }
  ],
  "quickWins": [
    {
      "title": "Quick win with SPECIFIC reference",
      "description": "What to do - use actual numbers",
      "timing": "When/how long",
      "benefit": "What they'll gain - be specific"
    }
  ]
}`;
}

