// ============================================================================
// PREPARE DISCOVERY DATA - Part 1 of 2-stage report generation
// ============================================================================
// Gathers all client data, documents, and runs pattern detection
// Returns prepared data for the analysis stage
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log('=== PREPARE-DISCOVERY-DATA STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clientId, practiceId, discoveryId, skipPatternDetection } = await req.json();

    if (!clientId) {
      throw new Error('clientId is required');
    }

    console.log(`Preparing data for client: ${clientId}`);

    // ========================================================================
    // 1. FETCH ALL CLIENT DATA
    // ========================================================================

    // Get client info
    const { data: client } = await supabase
      .from('practice_members')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      throw new Error('Client not found');
    }
    console.log('Client loaded:', client.name);

    // Get discovery data
    const { data: discovery } = await supabase
      .from('destination_discovery')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!discovery) {
      throw new Error('No discovery data found for this client');
    }
    console.log('Discovery loaded, responses:', Object.keys(discovery.responses || {}).length);

    // Get any uploaded documents/context from client_context
    const { data: contextDocs } = await supabase
      .from('client_context')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get full document content from embeddings
    const { data: documentEmbeddings } = await supabase
      .from('document_embeddings')
      .select('file_name, content, metadata, chunk_index')
      .eq('client_id', clientId)
      .order('file_name', { ascending: true })
      .order('chunk_index', { ascending: true });

    // Reconstruct full documents from chunks
    const documentsByFile: Record<string, { 
      fileName: string; 
      content: string; 
      dataSourceType: string;
    }> = {};
    
    if (documentEmbeddings && documentEmbeddings.length > 0) {
      for (const chunk of documentEmbeddings) {
        if (!documentsByFile[chunk.file_name]) {
          documentsByFile[chunk.file_name] = {
            fileName: chunk.file_name,
            content: '',
            dataSourceType: chunk.metadata?.dataSourceType || 'general'
          };
        }
        documentsByFile[chunk.file_name].content += chunk.content + '\n';
      }
      console.log(`Loaded ${Object.keys(documentsByFile).length} documents`);
    }

    // Get practice info
    const { data: practice } = await supabase
      .from('practices')
      .select('name, branding')
      .eq('id', practiceId || client.practice_id)
      .single();

    // Get financial context
    const { data: financialContext } = await supabase
      .from('client_financial_context')
      .select('*')
      .eq('client_id', clientId)
      .order('period_end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get operational context
    const { data: operationalContext } = await supabase
      .from('client_operational_context')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    // Get advisor context notes (date-stamped updates)
    const { data: contextNotes } = await supabase
      .from('client_context_notes')
      .select('*')
      .eq('client_id', clientId)
      .eq('include_in_analysis', true)
      .order('event_date', { ascending: true, nullsFirst: false });
    
    console.log(`Loaded ${contextNotes?.length || 0} context notes`);

    // ========================================================================
    // 2. RUN PATTERN DETECTION (if not skipped)
    // ========================================================================

    let patternAnalysis = null;
    
    // Check for existing patterns
    try {
      const { data: existingPatterns } = await supabase
        .from('assessment_patterns')
        .select('*')
        .eq('assessment_id', discovery.id)
        .single();

      if (existingPatterns) {
        patternAnalysis = existingPatterns;
        console.log('Using existing pattern analysis');
      }
    } catch (e) {
      console.log('No existing pattern analysis found');
    }
    
    // Run pattern detection if needed
    if (!patternAnalysis && !skipPatternDetection) {
      console.log('Running pattern detection...');
      try {
        const patternResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/detect-assessment-patterns`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ assessmentId: discovery.id })
          }
        );

        if (patternResponse.ok) {
          const patternResult = await patternResponse.json();
          if (patternResult.success) {
            patternAnalysis = patternResult.patterns;
            console.log('Pattern detection complete');
          }
        }
      } catch (e) {
        console.log('Pattern detection skipped:', e);
      }
    }

    // ========================================================================
    // 3. BUILD PREPARED DATA PACKAGE
    // ========================================================================

    const preparedData = {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.client_company,
        practiceId: client.practice_id
      },
      discovery: {
        id: discovery.id,
        responses: discovery.responses,
        extractedAnchors: discovery.extracted_anchors,
        recommendedServices: discovery.recommended_services,
        destinationClarityScore: discovery.destination_clarity_score,
        gapScore: discovery.gap_score
      },
      documents: Object.values(documentsByFile).map(doc => ({
        fileName: doc.fileName,
        dataSourceType: doc.dataSourceType,
        content: doc.content.substring(0, 15000) // Cap at 15k per doc
      })),
      contextDocs: contextDocs?.map(doc => ({
        type: doc.context_type,
        content: doc.content?.substring(0, 500)
      })) || [],
      financialContext: financialContext ? {
        periodType: financialContext.period_type,
        periodEnd: financialContext.period_end_date,
        revenue: financialContext.revenue,
        grossProfit: financialContext.gross_profit,
        grossMarginPct: financialContext.gross_margin_pct,
        netProfit: financialContext.net_profit,
        netMarginPct: financialContext.net_margin_pct,
        staffCount: financialContext.staff_count,
        revenuePerHead: financialContext.revenue_per_head,
        revenueGrowthPct: financialContext.revenue_growth_pct
      } : null,
      operationalContext: operationalContext ? {
        businessType: operationalContext.business_type,
        industry: operationalContext.industry,
        yearsTrading: operationalContext.years_trading,
        observedStrengths: operationalContext.observed_strengths,
        observedChallenges: operationalContext.observed_challenges
      } : null,
      patternAnalysis: patternAnalysis,
      practice: {
        name: practice?.name || 'RPGCC'
      },
      // Advisor-added context notes (critical updates not captured in assessment)
      advisorContextNotes: contextNotes?.map(note => ({
        type: note.note_type,
        title: note.title,
        content: note.content,
        eventDate: note.event_date,
        isFutureEvent: note.is_future_event,
        importance: note.importance
      })) || []
    };

    const executionTime = Date.now() - startTime;
    console.log(`Data preparation complete in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      preparedData,
      metadata: {
        executionTimeMs: executionTime,
        documentsCount: Object.keys(documentsByFile).length,
        hasPatternAnalysis: !!patternAnalysis,
        hasFinancialContext: !!financialContext,
        contextNotesCount: contextNotes?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error preparing data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
