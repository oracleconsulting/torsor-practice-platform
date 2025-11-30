// ============================================================================
// EDGE FUNCTION: process-documents
// ============================================================================
// Purpose: Extract text from uploaded documents and create embeddings for
// vector similarity search to enrich roadmap generation
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
    const { clientId, practiceId, contextId, documents, appliesTo } = await req.json();
    
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

    const processedDocs: any[] = [];
    const errors: string[] = [];

    for (const doc of documents as UploadedDocument[]) {
      try {
        console.log(`Processing: ${doc.fileName}`);
        
        // 1. Extract text from document
        const text = await extractTextFromUrl(doc.fileUrl, doc.fileType);
        console.log(`Extracted ${text.length} chars from ${doc.fileName}`);
        
        // 2. Chunk the text
        const chunks = chunkText(text, doc.fileName);
        console.log(`Created ${chunks.length} chunks from ${doc.fileName}`);
        
        // 3. Generate embeddings and store each chunk
        for (const chunk of chunks) {
          try {
            // Generate embedding
            const embedding = await generateEmbedding(chunk.content);
            
            // Store in document_embeddings table
            const { error: insertError } = await supabase
              .from('document_embeddings')
              .insert({
                practice_id: practiceId,
                client_id: clientId,
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
                  processedAt: new Date().toISOString()
                }
              });
            
            if (insertError) {
              console.error('Insert error:', insertError);
              errors.push(`Failed to store chunk ${chunk.metadata.chunkIndex} of ${doc.fileName}`);
            }
          } catch (embeddingError) {
            console.error(`Embedding error for chunk ${chunk.metadata.chunkIndex}:`, embeddingError);
            errors.push(`Embedding failed for ${doc.fileName} chunk ${chunk.metadata.chunkIndex}`);
          }
        }
        
        processedDocs.push({
          fileName: doc.fileName,
          chunksCreated: chunks.length,
          textLength: text.length
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

