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

// ============================================================================
// PDF TEXT EXTRACTION
// ============================================================================

function extractTextFromPDF(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    const textMatches: string[] = [];
    
    // Method 1: Extract from PDF streams
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1];
      // Clean binary data and extract readable text
      const readable = streamContent
        .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (readable.length > 20 && !/^[0-9\s.]+$/.test(readable)) {
        textMatches.push(readable);
      }
    }
    
    // Method 2: Extract text between parentheses (PDF text objects)
    const textObjRegex = /\(([^)]{3,})\)/g;
    while ((match = textObjRegex.exec(text)) !== null) {
      const content = match[1];
      // Filter out numeric-only content
      if (!/^[\d\s.]+$/.test(content) && content.length > 3) {
        textMatches.push(content);
      }
    }
    
    // Method 3: Look for Tj and TJ operators (PDF text showing operators)
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    while ((match = tjRegex.exec(text)) !== null) {
      if (match[1].length > 2) {
        textMatches.push(match[1]);
      }
    }
    
    // Method 4: Extract from BT...ET blocks
    const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
    while ((match = btRegex.exec(text)) !== null) {
      const blockContent = match[1];
      const innerText = blockContent
        .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (innerText.length > 10) {
        textMatches.push(innerText);
      }
    }
    
    const result = [...new Set(textMatches)].join(' ').substring(0, 50000);
    console.log(`[PrepareData] PDF extraction: ${result.length} chars from ${textMatches.length} matches`);
    return result;
  } catch (error) {
    console.error('[PrepareData] PDF extraction error:', error);
    return '';
  }
}

// Extract text content from a Blob based on file type
async function extractTextFromBlob(fileBlob: Blob, fileName: string): Promise<string> {
  try {
    const lowerName = fileName.toLowerCase();
    
    // Handle text-based files
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.csv')) {
      const text = await fileBlob.text();
      console.log(`[PrepareData] Text file extracted: ${text.length} chars`);
      return text;
    }
    
    // Handle JSON files
    if (lowerName.endsWith('.json')) {
      const text = await fileBlob.text();
      console.log(`[PrepareData] JSON file extracted: ${text.length} chars`);
      return text;
    }
    
    // Handle PDFs
    if (lowerName.endsWith('.pdf')) {
      const buffer = await fileBlob.arrayBuffer();
      const text = extractTextFromPDF(buffer);
      if (text && text.length > 50) {
        return text;
      }
      console.log(`[PrepareData] PDF extraction returned minimal text, file may need manual processing`);
      return '';
    }
    
    // For other files, try reading as text
    try {
      const text = await fileBlob.text();
      // Check if it's readable text
      if (text && text.length > 0 && !/[\x00-\x08\x0E-\x1F]/.test(text.substring(0, 500))) {
        console.log(`[PrepareData] Generic text extracted: ${text.length} chars`);
        return text;
      }
    } catch (e) {
      // Ignore
    }
    
    return '';
  } catch (error) {
    console.error(`[PrepareData] Error extracting from ${fileName}:`, error);
    return '';
  }
}

// ============================================================================
// LOAD DOCUMENTS DIRECTLY FROM SUPABASE STORAGE
// ============================================================================
// Storage structure: client-documents/{client_uuid}/{timestamp}_{filename}
// Example: client-documents/34c94120-928b-402e-bb04-85edf9d6de42/1765496833302_Atherio_5_Year_Summary.pdf

interface LoadedDocument {
  fileName: string;
  content: string;
  source: string;
}

async function loadClientDocumentsFromStorage(
  supabase: any,
  clientId: string
): Promise<LoadedDocument[]> {
  
  console.log('[PrepareData] === Loading documents from storage ===');
  console.log('[PrepareData] Client folder:', clientId);
  
  const documents: LoadedDocument[] = [];
  
  try {
    // List all files in the client's folder
    const { data: files, error: listError } = await supabase.storage
      .from('client-documents')
      .list(clientId, {
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (listError) {
      console.error('[PrepareData] Error listing storage:', listError);
      return documents;
    }
    
    if (!files || files.length === 0) {
      console.log('[PrepareData] No files found in client storage folder');
      
      // Debug: Check if the folder exists by listing root
      const { data: rootFiles } = await supabase.storage
        .from('client-documents')
        .list('', { limit: 10 });
      console.log('[PrepareData] Root bucket folders:', rootFiles?.map((f: any) => f.name) || 'none');
      
      return documents;
    }
    
    console.log('[PrepareData] Found files in storage:', files.map((f: any) => f.name));
    
    for (const file of files) {
      // Skip if it's a folder (id is null for folders)
      if (file.id === null) {
        console.log('[PrepareData] Skipping folder:', file.name);
        continue;
      }
      
      const storagePath = `${clientId}/${file.name}`;
      console.log('[PrepareData] Downloading file:', storagePath);
      
      try {
        // Download the file
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from('client-documents')
          .download(storagePath);
        
        if (downloadError || !fileBlob) {
          console.error('[PrepareData] Download error for', file.name, downloadError);
          continue;
        }
        
        console.log('[PrepareData] Downloaded file, size:', fileBlob.size, 'bytes');
        
        // Extract text from the file
        const content = await extractTextFromBlob(fileBlob, file.name);
        
        if (content && content.length > 10) {
          // Clean filename: remove timestamp prefix (e.g., "1765496833302_" -> "")
          const cleanName = file.name.replace(/^\d+_/, '');
          
          documents.push({
            fileName: cleanName,
            content: content.substring(0, 25000), // Cap at 25k per doc
            source: 'storage'
          });
          
          console.log('[PrepareData] ✓ Loaded:', cleanName, 'content length:', content.length);
        } else {
          console.log('[PrepareData] ✗ No content extracted from:', file.name);
        }
        
      } catch (err) {
        console.error('[PrepareData] Error processing file:', file.name, err);
      }
    }
    
  } catch (error) {
    console.error('[PrepareData] Storage loading error:', error);
  }
  
  console.log('[PrepareData] === Total documents from storage:', documents.length, '===');
  return documents;
}

// Fallback: Load documents from client_context table if storage approach fails
async function loadDocumentsFromClientContext(
  supabase: any,
  clientId: string
): Promise<LoadedDocument[]> {
  
  const documents: LoadedDocument[] = [];
  
  // Get documents from client_context with source_file_url
  const { data: contextDocs, error } = await supabase
    .from('client_context')
    .select('id, content, source_file_url, context_type, created_at')
    .eq('client_id', clientId)
    .eq('context_type', 'document')
    .not('source_file_url', 'is', null)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[PrepareData] Error loading context docs:', error);
    return documents;
  }
  
  if (!contextDocs || contextDocs.length === 0) {
    console.log('[PrepareData] No document records in client_context');
    return documents;
  }
  
  console.log(`[PrepareData] Found ${contextDocs.length} document records in client_context`);
  
  for (const doc of contextDocs) {
    if (!doc.source_file_url) continue;
    
    // Extract filename from the 'Uploaded: filename' content or URL
    let fileName = 'Unknown';
    if (doc.content && doc.content.startsWith('Uploaded: ')) {
      fileName = doc.content.replace('Uploaded: ', '').trim();
    } else {
      // Extract from URL
      const urlParts = doc.source_file_url.split('/');
      fileName = urlParts[urlParts.length - 1] || 'Unknown';
      // Clean timestamp prefix if present
      fileName = fileName.replace(/^\d+_/, '');
    }
    
    console.log(`[PrepareData] Fetching via URL: ${fileName}`);
    
    try {
      const response = await fetch(doc.source_file_url);
      if (!response.ok) {
        console.error(`[PrepareData] Failed to fetch ${fileName}: ${response.status}`);
        continue;
      }
      
      const blob = await response.blob();
      const content = await extractTextFromBlob(blob, fileName);
      
      if (content && content.length > 10) {
        documents.push({
          fileName,
          content: content.substring(0, 25000),
          source: 'client_context'
        });
        console.log(`[PrepareData] Loaded via URL: ${fileName}, ${content.length} chars`);
      }
    } catch (fetchError) {
      console.error(`[PrepareData] Error fetching ${fileName}:`, fetchError);
    }
  }
  
  return documents;
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

    // ========================================================================
    // LOAD DOCUMENTS - Try multiple sources
    // ========================================================================
    
    const documentsByFile: Record<string, { 
      fileName: string; 
      content: string; 
      dataSourceType: string;
      source: string;
    }> = {};

    // Source 1: Document embeddings (already processed documents)
    const { data: documentEmbeddings } = await supabase
      .from('document_embeddings')
      .select('file_name, content, metadata, chunk_index')
      .eq('client_id', clientId)
      .order('file_name', { ascending: true })
      .order('chunk_index', { ascending: true });

    if (documentEmbeddings && documentEmbeddings.length > 0) {
      for (const chunk of documentEmbeddings) {
        if (!documentsByFile[chunk.file_name]) {
          documentsByFile[chunk.file_name] = {
            fileName: chunk.file_name,
            content: '',
            dataSourceType: chunk.metadata?.dataSourceType || 'general',
            source: 'embeddings'
          };
        }
        documentsByFile[chunk.file_name].content += chunk.content + '\n';
      }
      console.log(`[PrepareData] Loaded ${Object.keys(documentsByFile).length} documents from embeddings`);
    } else {
      console.log('[PrepareData] No documents in embeddings table');
    }

    // Source 2: Direct from Supabase Storage (primary method for unprocessed docs)
    // Storage structure: client-documents/{client_id}/{timestamp}_{filename}
    const storageDocuments = await loadClientDocumentsFromStorage(supabase, clientId);
    
    for (const doc of storageDocuments) {
      if (!documentsByFile[doc.fileName]) {
        documentsByFile[doc.fileName] = {
          fileName: doc.fileName,
          content: doc.content,
          dataSourceType: 'general',
          source: doc.source
        };
        console.log(`[PrepareData] Added from storage: ${doc.fileName}`);
      } else {
        console.log(`[PrepareData] ${doc.fileName} already loaded from embeddings`);
      }
    }

    // Source 3: Fallback - client_context URLs (if storage approach missed any)
    if (Object.keys(documentsByFile).length === 0) {
      console.log('[PrepareData] No documents found via storage, trying client_context URLs...');
      const contextDocuments = await loadDocumentsFromClientContext(supabase, clientId);
      
      for (const doc of contextDocuments) {
        if (!documentsByFile[doc.fileName]) {
          documentsByFile[doc.fileName] = {
            fileName: doc.fileName,
            content: doc.content,
            dataSourceType: 'general',
            source: doc.source
          };
          console.log(`[PrepareData] Added from client_context: ${doc.fileName}`);
        }
      }
    }
    
    console.log(`[PrepareData] === Total documents loaded: ${Object.keys(documentsByFile).length} ===`);

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
        content: doc.content.substring(0, 20000), // Cap at 20k per doc
        source: doc.source
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
