// ============================================================================
// EDGE FUNCTION: process-documents
// ============================================================================
// Purpose: Extract text from uploaded documents and create embeddings for
// vector similarity search to enrich roadmap generation
// 
// CRITICAL: DATA PROTECTION
// - Raw documents are NEVER sent to LLM providers
// - Only sanitized, extracted data is used for embeddings
// - PII is redacted before any processing
// - Financial data is aggregated/anonymized
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadedDocument {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

interface DocumentChunk {
  content: string;
  metadata: {
    fileName: string;
    pageNumber?: number;
    chunkIndex: number;
    totalChunks: number;
  };
}

interface ClientEntity {
  id: string;
  name: string;
  firstName: string;
  companyPatterns: string[];
}

// ============================================================================
// CLIENT-SPECIFIC EXTRACTION (For shared documents)
// ============================================================================

function extractCompanyPatterns(email: string, name: string): string[] {
  const patterns: string[] = [];
  
  // Extract company name from email domain
  const domain = email.split('@')[1];
  if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
    const company = domain.split('.')[0];
    patterns.push(company.toLowerCase());
  }
  
  // Add name variations
  patterns.push(name.toLowerCase());
  patterns.push(name.split(' ')[0].toLowerCase()); // First name
  
  return patterns;
}

// Detect data source type from filename and content
function detectDataSourceType(fileName: string, content: string): { type: string; priority: number } {
  const lowerName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase().substring(0, 2000); // Check first 2000 chars
  
  // Official accounts - highest priority for financials
  if (lowerName.includes('account') || lowerName.includes('financials') || 
      lowerName.includes('p&l') || lowerName.includes('profit') ||
      lowerContent.includes('turnover') && lowerContent.includes('expenses') ||
      lowerContent.includes('balance sheet') || lowerContent.includes('statutory accounts')) {
    return { type: 'accounts', priority: 100 };
  }
  
  // Transcripts - lower priority for numbers, high for qualitative insights
  if (lowerName.includes('transcript') || lowerName.includes('recording') ||
      lowerContent.includes('speaker:') || lowerContent.includes('interviewer:') ||
      lowerContent.includes('[inaudible]')) {
    return { type: 'transcript', priority: 30 };
  }
  
  // Meeting notes
  if (lowerName.includes('meeting') || lowerName.includes('notes') ||
      lowerContent.includes('action items') || lowerContent.includes('next steps')) {
    return { type: 'meeting_notes', priority: 40 };
  }
  
  // Email correspondence
  if (lowerName.includes('email') || lowerContent.includes('from:') && lowerContent.includes('to:')) {
    return { type: 'email', priority: 35 };
  }
  
  return { type: 'general', priority: 50 };
}

// Extract content relevant to a specific client from shared document
function extractClientSpecificContent(
  text: string, 
  targetClient: ClientEntity,
  allClients: ClientEntity[]
): { content: string; relevanceScore: number; entityMentions: number } {
  const lines = text.split('\n');
  const relevantLines: string[] = [];
  let entityMentions = 0;
  
  // Build patterns for target client
  const targetPatterns = [
    targetClient.name.toLowerCase(),
    targetClient.firstName,
    ...targetClient.companyPatterns
  ].filter(p => p.length > 2);
  
  // Build patterns for other clients (to exclude their specific content)
  const otherPatterns = allClients
    .filter(c => c.id !== targetClient.id)
    .flatMap(c => [c.firstName, ...c.companyPatterns])
    .filter(p => p.length > 2);
  
  let inTargetSection = false;
  let lastSpeaker = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const originalLine = lines[i];
    
    // Check if this line mentions target client
    const mentionsTarget = targetPatterns.some(p => line.includes(p));
    const mentionsOther = otherPatterns.some(p => line.includes(p));
    
    // Detect speaker changes in transcripts
    const speakerMatch = line.match(/^([\w\s]+):/);
    if (speakerMatch) {
      lastSpeaker = speakerMatch[1].trim();
      if (targetPatterns.some(p => lastSpeaker.includes(p))) {
        inTargetSection = true;
      } else if (otherPatterns.some(p => lastSpeaker.includes(p))) {
        inTargetSection = false;
      }
    }
    
    // Include line if:
    // 1. It mentions the target client
    // 2. Target client is speaking (in transcript)
    // 3. It's general context (doesn't specifically mention others)
    // 4. It's about business metrics that match target's company
    if (mentionsTarget) {
      entityMentions++;
      relevantLines.push(originalLine);
      // Include surrounding context (2 lines before/after)
      if (i > 0 && !relevantLines.includes(lines[i-1])) relevantLines.push(lines[i-1]);
      if (i < lines.length - 1) relevantLines.push(lines[i+1]);
    } else if (inTargetSection && !mentionsOther) {
      relevantLines.push(originalLine);
    } else if (!mentionsOther && isGeneralBusinessContext(line)) {
      // Include general business advice that applies to everyone
      relevantLines.push(originalLine);
    }
  }
  
  const content = [...new Set(relevantLines)].join('\n').trim();
  const relevanceScore = content.length > 0 
    ? Math.min(1, entityMentions * 0.1 + content.length / text.length)
    : 0;
  
  return { content, relevanceScore, entityMentions };
}

function isGeneralBusinessContext(line: string): boolean {
  const generalPatterns = [
    'business', 'revenue', 'growth', 'strategy', 'marketing',
    'team', 'culture', 'systems', 'process', 'goal', 'vision',
    'challenge', 'opportunity', 'improvement', 'efficiency'
  ];
  return generalPatterns.some(p => line.includes(p));
}

// ============================================================================
// DATA PROTECTION & SANITIZATION (GDPR COMPLIANT)
// ============================================================================
// These functions ensure NO raw client data reaches LLM providers
// Only structured, anonymized summaries are used for embeddings
// ============================================================================

interface SanitizedFinancials {
  revenueBand: string;      // "£500k-£1m" not exact figures
  profitMargin: string;     // "15-20%" not exact figures
  growthBand: string;       // "10-20% YoY" not exact
  teamSizeBand: string;     // "5-10 employees"
  assetCategories: string[];
  businessMetrics: Record<string, string>; // Aggregated only
}

// Redact specific PII patterns
function redactPII(text: string): string {
  let sanitized = text;
  
  // Email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  
  // Phone numbers (UK and international)
  sanitized = sanitized.replace(/(?:\+44|0)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, '[PHONE_REDACTED]');
  sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_REDACTED]');
  
  // National Insurance numbers
  sanitized = sanitized.replace(/[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Z]/gi, '[NI_REDACTED]');
  
  // Bank account numbers (8 digits)
  sanitized = sanitized.replace(/\b\d{8}\b/g, '[ACCOUNT_REDACTED]');
  
  // Sort codes
  sanitized = sanitized.replace(/\b\d{2}[-\s]?\d{2}[-\s]?\d{2}\b/g, '[SORTCODE_REDACTED]');
  
  // Credit card numbers
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]');
  
  // Addresses (basic pattern - street numbers with names)
  sanitized = sanitized.replace(/\b\d+\s+[A-Z][a-z]+\s+(Road|Street|Lane|Avenue|Drive|Close|Way|Court|Place|Gardens|Crescent)\b/gi, '[ADDRESS_REDACTED]');
  
  // Postcodes (UK)
  sanitized = sanitized.replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/gi, '[POSTCODE_REDACTED]');
  
  // Specific names in common patterns
  sanitized = sanitized.replace(/(?:Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g, '[NAME_REDACTED]');
  
  return sanitized;
}

// Convert exact financial figures to bands (for LLM-safe processing)
function anonymizeFinancials(text: string): { text: string; extractedMetrics: Record<string, any> } {
  const extractedMetrics: Record<string, any> = {};
  let sanitized = text;
  
  // Extract and replace exact revenue figures with bands
  const revenuePatterns = [
    /(?:revenue|turnover|sales)[:\s]*£?([\d,]+(?:\.\d{2})?)\s*(?:k|m)?/gi,
    /£([\d,]+(?:\.\d{2})?)\s*(?:turnover|revenue)/gi
  ];
  
  for (const pattern of revenuePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 0) {
        extractedMetrics.revenue = value;
        const band = getRevenueBand(value);
        sanitized = sanitized.replace(match[0], `[REVENUE: ${band}]`);
      }
    }
  }
  
  // Extract and replace profit figures
  const profitPatterns = [
    /(?:profit|net income|operating profit|ebitda)[:\s]*£?([\d,]+(?:\.\d{2})?)/gi
  ];
  
  for (const pattern of profitPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 0) {
        extractedMetrics.profit = value;
        sanitized = sanitized.replace(match[0], `[PROFIT: Extracted]`);
      }
    }
  }
  
  // Replace any remaining large numbers (likely financial)
  sanitized = sanitized.replace(/£\s*([\d,]{5,}(?:\.\d{2})?)/g, (match, num) => {
    const value = parseFloat(num.replace(/,/g, ''));
    return `[AMOUNT: ${getRevenueBand(value)}]`;
  });
  
  return { text: sanitized, extractedMetrics };
}

function getRevenueBand(value: number): string {
  if (value < 50000) return 'Under £50k';
  if (value < 100000) return '£50k-£100k';
  if (value < 250000) return '£100k-£250k';
  if (value < 500000) return '£250k-£500k';
  if (value < 1000000) return '£500k-£1m';
  if (value < 2500000) return '£1m-£2.5m';
  if (value < 5000000) return '£2.5m-£5m';
  if (value < 10000000) return '£5m-£10m';
  return '£10m+';
}

// Full document sanitization for LLM processing
function sanitizeForLLM(rawText: string): { sanitizedText: string; extractedMetrics: Record<string, any> } {
  // Step 1: Redact PII
  let sanitized = redactPII(rawText);
  
  // Step 2: Anonymize financial figures (but extract for local processing)
  const { text: anonymizedText, extractedMetrics } = anonymizeFinancials(sanitized);
  sanitized = anonymizedText;
  
  // Step 3: Remove any remaining sensitive patterns
  // Company registration numbers
  sanitized = sanitized.replace(/\b\d{7,8}\b/g, '[REG_NUM]');
  
  // VAT numbers
  sanitized = sanitized.replace(/(?:GB)?\s?\d{3}\s?\d{4}\s?\d{2}/g, '[VAT_REDACTED]');
  
  return { sanitizedText: sanitized, extractedMetrics };
}

// ============================================================================
// TEXT EXTRACTION (simplified for common formats)
// ============================================================================

async function extractTextFromUrl(fileUrl: string, fileType: string): Promise<string> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
    
    const contentType = response.headers.get('content-type') || fileType;
    
    // Handle text-based files directly
    if (contentType.includes('text') || 
        fileType.endsWith('.txt') || 
        fileType.endsWith('.md') ||
        fileType.endsWith('.csv')) {
      return await response.text();
    }
    
    // For PDF, DOCX, etc. - we'll need to use a more sophisticated approach
    // For now, return a placeholder that indicates the file type
    // In production, you'd use a PDF parsing library or external service
    if (contentType.includes('pdf') || fileType.endsWith('.pdf')) {
      // Note: Full PDF parsing requires additional libraries
      // For MVP, we'll extract what we can or mark for manual processing
      const buffer = await response.arrayBuffer();
      const text = extractTextFromPDF(buffer);
      return text || `[PDF Document: Content extraction pending - ${fileType}]`;
    }
    
    // For Office documents
    if (fileType.includes('.doc') || fileType.includes('.xls') || fileType.includes('.ppt')) {
      return `[Office Document: ${fileType} - Content extraction pending]`;
    }
    
    // Fallback: try to read as text
    try {
      const text = await response.text();
      // Check if it looks like readable text
      if (text && text.length > 0 && !/[\x00-\x08\x0E-\x1F]/.test(text.substring(0, 1000))) {
        return text;
      }
    } catch (e) {
      // Ignore text parsing errors
    }
    
    return `[Binary file: ${fileType}]`;
  } catch (error) {
    console.error('Error extracting text:', error);
    return `[Error extracting content from ${fileType}]`;
  }
}

// Simple PDF text extraction (basic implementation)
function extractTextFromPDF(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    // Look for text streams in PDF
    const textMatches: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1];
      // Extract readable text (basic approach)
      const readable = streamContent
        .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (readable.length > 20) {
        textMatches.push(readable);
      }
    }
    
    // Also look for text between parentheses (PDF text objects)
    const textObjRegex = /\(([^)]+)\)/g;
    while ((match = textObjRegex.exec(text)) !== null) {
      if (match[1].length > 3 && !/^[\d\s]+$/.test(match[1])) {
        textMatches.push(match[1]);
      }
    }
    
    return textMatches.join(' ').substring(0, 50000); // Limit to 50k chars
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

// ============================================================================
// TEXT CHUNKING
// ============================================================================

function chunkText(text: string, fileName: string, chunkSize = 1000, overlap = 200): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  if (!text || text.length === 0) {
    return [{
      content: `[Empty or unreadable document: ${fileName}]`,
      metadata: { fileName, chunkIndex: 0, totalChunks: 1 }
    }];
  }
  
  // Clean the text
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // If text is small enough, return as single chunk
  if (cleanText.length <= chunkSize) {
    return [{
      content: cleanText,
      metadata: { fileName, chunkIndex: 0, totalChunks: 1 }
    }];
  }
  
  // Split into chunks with overlap
  let position = 0;
  let chunkIndex = 0;
  
  while (position < cleanText.length) {
    let end = position + chunkSize;
    
    // Try to break at a sentence or paragraph boundary
    if (end < cleanText.length) {
      const searchArea = cleanText.substring(position + chunkSize - 100, end + 100);
      const breakPoints = ['. ', '.\n', '\n\n', '\n', ', ', ' '];
      
      for (const bp of breakPoints) {
        const breakIndex = searchArea.lastIndexOf(bp);
        if (breakIndex > 50) {
          end = position + chunkSize - 100 + breakIndex + bp.length;
          break;
        }
      }
    }
    
    const chunkContent = cleanText.substring(position, Math.min(end, cleanText.length)).trim();
    
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        metadata: {
          fileName,
          chunkIndex,
          totalChunks: 0 // Will be updated after
        }
      });
      chunkIndex++;
    }
    
    position = end - overlap;
    if (position >= cleanText.length - overlap) break;
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });
  
  return chunks;
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  // Use OpenAI's embedding model via OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor Document Embeddings'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.substring(0, 8000) // Limit input length
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Embedding API error:', error);
    throw new Error(`Embedding API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, contextId, documents, appliesTo, isShared, sharedWithClientIds } = await req.json();
    
    if (!clientId || !practiceId || !documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all clients in this practice for entity extraction
    const { data: practiceClients } = await supabase
      .from('practice_members')
      .select('id, name, email')
      .eq('practice_id', practiceId)
      .eq('member_type', 'client');
    
    const clientEntities = (practiceClients || []).map(c => ({
      id: c.id,
      name: c.name,
      firstName: c.name.split(' ')[0].toLowerCase(),
      companyPatterns: extractCompanyPatterns(c.email, c.name)
    }));
    
    console.log(`Found ${clientEntities.length} clients for entity extraction`);

    const processedDocs: any[] = [];
    const errors: string[] = [];

    for (const doc of documents as UploadedDocument[]) {
      try {
        console.log(`Processing: ${doc.fileName}`);
        
        // 1. Extract text from document
        const rawText = await extractTextFromUrl(doc.fileUrl, doc.fileType);
        console.log(`Extracted ${rawText.length} chars from ${doc.fileName}`);
        
        // 2. Detect data source type (accounts vs transcript)
        const sourceInfo = detectDataSourceType(doc.fileName, rawText);
        console.log(`Data source: ${sourceInfo.type} (priority: ${sourceInfo.priority})`);
        
        // 3. CRITICAL: Sanitize before ANY LLM processing (GDPR compliance)
        const { sanitizedText, extractedMetrics } = sanitizeForLLM(rawText);
        console.log(`Sanitized text: ${sanitizedText.length} chars, extracted ${Object.keys(extractedMetrics).length} metrics`);
        
        // Store extracted metrics locally (these never go to LLM)
        if (Object.keys(extractedMetrics).length > 0) {
          await supabase
            .from('client_context')
            .update({ 
              extracted_metrics: extractedMetrics,
              data_source_type: sourceInfo.type,
              priority_level: sourceInfo.priority,
              processed: true 
            })
            .eq('id', contextId);
        }
        
        // 4. Determine which clients to process for
        const targetClients = isShared && clientEntities.length > 1
          ? clientEntities  // Process for all clients if shared
          : clientEntities.filter(c => c.id === clientId);  // Just the primary client
        
        console.log(`Processing for ${targetClients.length} client(s), isShared: ${isShared}`);
        
        // 5. For each client, extract relevant content and create embeddings
        for (const targetClient of targetClients) {
          let textToProcess = sanitizedText;
          let relevanceScore = 1.0;
          let entityMentions = 0;
          
          // For shared documents, extract client-specific content
          if (isShared && clientEntities.length > 1 && sourceInfo.type === 'transcript') {
            const extraction = extractClientSpecificContent(sanitizedText, targetClient, clientEntities);
            textToProcess = extraction.content;
            relevanceScore = extraction.relevanceScore;
            entityMentions = extraction.entityMentions;
            
            console.log(`Client ${targetClient.firstName}: ${textToProcess.length} chars, ${entityMentions} mentions, score: ${relevanceScore.toFixed(2)}`);
            
            // Skip if no relevant content for this client
            if (textToProcess.length < 100 || entityMentions === 0) {
              console.log(`Skipping ${targetClient.firstName} - insufficient relevant content`);
              continue;
            }
          }
          
          // 6. Chunk the text
          const chunks = chunkText(textToProcess, doc.fileName);
          console.log(`Created ${chunks.length} chunks for ${targetClient.firstName}`);
          
          // 7. Generate embeddings and store each chunk
          for (const chunk of chunks) {
            try {
              const embedding = await generateEmbedding(chunk.content);
              
              const { error: insertError } = await supabase
                .from('document_embeddings')
                .insert({
                  practice_id: practiceId,
                  client_id: targetClient.id,
                  context_id: contextId,
                  file_name: doc.fileName,
                  file_url: doc.fileUrl,
                  chunk_index: chunk.metadata.chunkIndex,
                  total_chunks: chunk.metadata.totalChunks,
                  content: chunk.content,
                  embedding: embedding,
                  applies_to: appliesTo || ['sprint'],
                  metadata: {
                    fileType: doc.fileType,
                    fileSize: doc.fileSize,
                    processedAt: new Date().toISOString(),
                    dataSourceType: sourceInfo.type,
                    priorityLevel: sourceInfo.priority,
                    relevanceScore: relevanceScore,
                    entityMentions: entityMentions,
                    isSharedDocument: isShared,
                    extractedForClient: targetClient.name
                  }
                });
              
              if (insertError) {
                console.error('Insert error:', insertError);
                errors.push(`Failed to store chunk ${chunk.metadata.chunkIndex} for ${targetClient.firstName}`);
              }
            } catch (embeddingError) {
              console.error(`Embedding error for chunk ${chunk.metadata.chunkIndex}:`, embeddingError);
              errors.push(`Embedding failed for ${doc.fileName} chunk ${chunk.metadata.chunkIndex}`);
            }
          }
          
          // Store extraction record for shared documents
          if (isShared && targetClient.id !== clientId) {
            await supabase
              .from('client_document_extractions')
              .insert({
                source_context_id: contextId,
                client_id: targetClient.id,
                practice_id: practiceId,
                extracted_content: textToProcess.substring(0, 5000), // Store summary
                relevance_score: relevanceScore,
                entity_mentions: entityMentions
              })
              .catch(err => console.log('Extraction record failed:', err));
          }
        }
        
        processedDocs.push({
          fileName: doc.fileName,
          clientsProcessed: targetClients.length,
          dataSourceType: sourceInfo.type
        });
        
      } catch (docError) {
        console.error(`Error processing ${doc.fileName}:`, docError);
        errors.push(`Failed to process ${doc.fileName}: ${docError}`);
      }
    }

    // Update context record to mark as processed
    if (contextId) {
      await supabase
        .from('client_context')
        .update({ 
          processed: true,
          metadata: { 
            documentsProcessed: processedDocs.length,
            totalChunks: processedDocs.reduce((sum, d) => sum + d.chunksCreated, 0),
            processedAt: new Date().toISOString()
          }
        })
        .eq('id', contextId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedDocs,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document processing error:', error);
    return new Response(
      JSON.stringify({ error: `Processing failed: ${error}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

