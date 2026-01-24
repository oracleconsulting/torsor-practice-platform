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
// PDF TEXT EXTRACTION - Using unpdf library for edge/serverless environments
// ============================================================================

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  
  // Use unpdf - specifically designed for edge/serverless environments
  // It bundles pdf.js without the worker dependency
  try {
    console.log('[PrepareData] Attempting PDF extraction with unpdf...');
    
    // Import unpdf with explicit configuration
    const unpdf = await import('https://esm.sh/unpdf@0.12.1?bundle');
    
    // Extract text using unpdf
    const result = await unpdf.extractText(uint8Array, { mergePages: true });
    const text = result.text || '';
    
    if (text && text.length > 20) {
      const hasRealText = /[a-zA-Z]{3,}/.test(text);
      console.log(`[PrepareData] unpdf extracted: ${text.length} chars, hasRealText: ${hasRealText}`);
      
      if (hasRealText) {
        console.log('[PrepareData] PDF content preview:', text.substring(0, 200));
        return text.substring(0, 50000);
      }
    }
    
    console.log('[PrepareData] unpdf returned empty or non-text content');
  } catch (unpdfError: any) {
    console.error('[PrepareData] unpdf error:', unpdfError?.message || unpdfError);
  }
  
  // Fallback: Try using unpdf's getDocumentProxy for more control
  try {
    console.log('[PrepareData] Trying unpdf getDocumentProxy...');
    const unpdf = await import('https://esm.sh/unpdf@0.12.1?bundle');
    
    const pdf = await unpdf.getDocumentProxy(uint8Array);
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    fullText = fullText.trim();
    
    if (fullText && fullText.length > 20) {
      const hasRealText = /[a-zA-Z]{3,}/.test(fullText);
      console.log(`[PrepareData] unpdf proxy extracted: ${fullText.length} chars, ${pdf.numPages} pages, hasRealText: ${hasRealText}`);
      
      if (hasRealText) {
        console.log('[PrepareData] PDF content preview:', fullText.substring(0, 200));
        return fullText.substring(0, 50000);
      }
    }
  } catch (proxyError: any) {
    console.error('[PrepareData] unpdf proxy error:', proxyError?.message || proxyError);
  }
  
  // Final fallback: regex-based extraction for simple/uncompressed PDFs
  console.log('[PrepareData] Falling back to regex extraction...');
  return extractTextFromPDFFallback(buffer);
}

// Fallback regex method for simple/uncompressed PDFs
function extractTextFromPDFFallback(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    const textMatches: string[] = [];
    let match;
    
    // Extract text between parentheses (PDF text objects)
    // Only keep content that looks like real text (has letters)
    const textObjRegex = /\(([^)]{3,})\)/g;
    while ((match = textObjRegex.exec(text)) !== null) {
      const content = match[1];
      if (/[a-zA-Z]{2,}/.test(content) && content.length > 3) {
        textMatches.push(content);
      }
    }
    
    // Look for Tj operators
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    while ((match = tjRegex.exec(text)) !== null) {
      if (match[1].length > 2 && /[a-zA-Z]/.test(match[1])) {
        textMatches.push(match[1]);
      }
    }
    
    const result = [...new Set(textMatches)].join(' ').substring(0, 50000);
    const hasRealText = /[a-zA-Z]{5,}/.test(result);
    
    console.log(`[PrepareData] Fallback PDF extraction: ${result.length} chars, hasRealText: ${hasRealText}`);
    
    if (hasRealText) {
      console.log('[PrepareData] Fallback content preview:', result.substring(0, 150));
      return result;
    }
    
    return '';
  } catch (error) {
    console.error('[PrepareData] Fallback PDF extraction error:', error);
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
    
    // Handle PDFs with proper library
    if (lowerName.endsWith('.pdf')) {
      const buffer = await fileBlob.arrayBuffer();
      const text = await extractTextFromPDF(buffer);
      
      // Validate extraction worked - must have real text content
      const hasRealText = /[a-zA-Z]{5,}/.test(text);
      const hasNumbers = /\d{3,}/.test(text);
      
      console.log('[PrepareData] PDF extraction validation:', { 
        length: text.length, 
        hasRealText, 
        hasNumbers 
      });
      
      if (text && text.length > 50 && hasRealText) {
        return text;
      }
      
      console.log('[PrepareData] PDF extraction returned invalid/binary content');
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
// LOAD DOCUMENTS FROM STORAGE
// ============================================================================
// Uses client_context records to find document paths, then downloads via
// storage API with signed URLs to bypass access policy issues.

interface LoadedDocument {
  fileName: string;
  content: string;
  source: string;
}

// Extract storage path from a Supabase public URL
// URL format: https://xxx.supabase.co/storage/v1/object/public/client-documents/path/to/file.pdf
function extractStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Match pattern: /client-documents/...
  const match = url.match(/\/client-documents\/(.+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  
  // Also try without leading slash
  const match2 = url.match(/client-documents\/(.+)$/);
  if (match2) {
    return decodeURIComponent(match2[1]);
  }
  
  return null;
}

async function loadClientDocuments(
  supabase: any,
  clientId: string,
  practiceId?: string
): Promise<LoadedDocument[]> {
  
  console.log('[PrepareData] === Loading client documents ===');
  console.log('[PrepareData] Client ID:', clientId);
  console.log('[PrepareData] Practice ID:', practiceId || 'not provided');
  
  const documents: LoadedDocument[] = [];
  
  // ========================================================================
  // Method 1: Get document records from client_context and use storage paths
  // ========================================================================
  
  const { data: contextDocs, error: contextError } = await supabase
    .from('client_context')
    .select('id, content, source_file_url, context_type, created_at')
    .eq('client_id', clientId)
    .eq('context_type', 'document')
    .not('source_file_url', 'is', null)
    .order('created_at', { ascending: false });
  
  if (contextError) {
    console.error('[PrepareData] Error loading client_context:', contextError);
  }
  
  if (contextDocs && contextDocs.length > 0) {
    console.log(`[PrepareData] Found ${contextDocs.length} document records in client_context`);
    
    for (const doc of contextDocs) {
      console.log('[PrepareData] Processing record:', {
        id: doc.id,
        content: doc.content?.substring(0, 50),
        url: doc.source_file_url?.substring(0, 100) + '...'
      });
      
      // Extract filename
      let fileName = 'Unknown';
      if (doc.content && doc.content.startsWith('Uploaded: ')) {
        fileName = doc.content.replace('Uploaded: ', '').trim();
      }
      
      // Extract storage path from URL
      const storagePath = extractStoragePathFromUrl(doc.source_file_url);
      
      if (storagePath) {
        console.log('[PrepareData] Extracted storage path:', storagePath);
        
        // Try downloading directly using the storage path
        try {
          const { data: fileBlob, error: downloadError } = await supabase.storage
            .from('client-documents')
            .download(storagePath);
          
          if (downloadError) {
            console.error('[PrepareData] Direct download failed:', downloadError.message);
            
            // Fallback: Try creating a signed URL
            console.log('[PrepareData] Trying signed URL approach...');
            const { data: signedUrlData, error: signedError } = await supabase.storage
              .from('client-documents')
              .createSignedUrl(storagePath, 120); // 2 minutes
            
            if (signedError || !signedUrlData?.signedUrl) {
              console.error('[PrepareData] Signed URL failed:', signedError?.message);
              continue;
            }
            
            console.log('[PrepareData] Fetching via signed URL...');
            const response = await fetch(signedUrlData.signedUrl);
            if (!response.ok) {
              console.error('[PrepareData] Signed URL fetch failed:', response.status);
              continue;
            }
            
            const blob = await response.blob();
            const content = await extractTextFromBlob(blob, fileName);
            
            if (content && content.length > 10) {
              const cleanName = fileName.replace(/^\d+_/, '');
              documents.push({
                fileName: cleanName,
                content: content.substring(0, 25000),
                source: 'signed_url'
              });
              console.log('[PrepareData] ✓ Loaded via signed URL:', cleanName, 'length:', content.length);
            }
            continue;
          }
          
          // Direct download succeeded
          console.log('[PrepareData] Downloaded file, size:', fileBlob.size, 'bytes');
          
          const content = await extractTextFromBlob(fileBlob, storagePath);
          
          if (content && content.length > 10) {
            const cleanName = fileName.replace(/^\d+_/, '') || storagePath.split('/').pop()?.replace(/^\d+_/, '') || 'Document';
            documents.push({
              fileName: cleanName,
              content: content.substring(0, 25000),
              source: 'storage_download'
            });
            console.log('[PrepareData] ✓ Loaded via download:', cleanName, 'length:', content.length);
          } else {
            console.log('[PrepareData] ✗ No content extracted from:', storagePath);
          }
          
        } catch (err) {
          console.error('[PrepareData] Error processing:', storagePath, err);
        }
      } else {
        // No storage path extracted, try fetching the URL directly
        console.log('[PrepareData] No storage path extracted, trying direct URL fetch...');
        try {
          const response = await fetch(doc.source_file_url);
          if (response.ok) {
            const blob = await response.blob();
            const content = await extractTextFromBlob(blob, fileName);
            
            if (content && content.length > 10) {
              const cleanName = fileName.replace(/^\d+_/, '');
              documents.push({
                fileName: cleanName,
                content: content.substring(0, 25000),
                source: 'direct_url'
              });
              console.log('[PrepareData] ✓ Loaded via direct URL:', cleanName, 'length:', content.length);
            }
          } else {
            console.error('[PrepareData] Direct URL fetch failed:', response.status);
          }
        } catch (urlError) {
          console.error('[PrepareData] URL fetch error:', urlError);
        }
      }
    }
  } else {
    console.log('[PrepareData] No document records in client_context');
  }
  
  // ========================================================================
  // Method 1B: Get documents from discovery_uploaded_documents (Discovery flow)
  // ========================================================================
  
  // First, get the engagement_id for this client
  const { data: engagement, error: engError } = await supabase
    .from('discovery_engagements')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle();
  
  if (engError) {
    console.log('[PrepareData] Error fetching discovery engagement:', engError.message);
  }
  
  if (engagement?.id) {
    console.log('[PrepareData] Found discovery engagement:', engagement.id);
    
    const { data: discoveryDocs, error: discError } = await supabase
      .from('discovery_uploaded_documents')
      .select('id, filename, file_path, document_type, extracted_text')
      .eq('engagement_id', engagement.id)
      .order('uploaded_at', { ascending: false });
    
    if (discError) {
      console.error('[PrepareData] Error loading discovery_uploaded_documents:', discError);
    }
    
    if (discoveryDocs && discoveryDocs.length > 0) {
      console.log(`[PrepareData] Found ${discoveryDocs.length} documents in discovery_uploaded_documents`);
      
      for (const doc of discoveryDocs) {
        // First try extracted_text if available
        if (doc.extracted_text && doc.extracted_text.length > 10) {
          documents.push({
            fileName: doc.filename,
            content: doc.extracted_text.substring(0, 30000),
            source: 'discovery_extracted'
          });
          console.log('[PrepareData] ✓ Using extracted text for:', doc.filename, 'length:', doc.extracted_text.length);
        }
        // Otherwise download from storage
        else if (doc.file_path) {
          try {
            const { data: fileBlob, error: dlError } = await supabase.storage
              .from('discovery-documents')
              .download(doc.file_path);
            
            if (dlError || !fileBlob) {
              console.error('[PrepareData] Download error for discovery doc:', dlError?.message);
              continue;
            }
            
            const content = await extractTextFromBlob(fileBlob, doc.filename);
            
            if (content && content.length > 10) {
              documents.push({
                fileName: doc.filename,
                content: content.substring(0, 30000),
                source: 'discovery_storage'
              });
              console.log('[PrepareData] ✓ Loaded from discovery storage:', doc.filename, 'length:', content.length);
            }
          } catch (err) {
            console.error('[PrepareData] Error downloading discovery doc', doc.file_path, err);
          }
        }
      }
    } else {
      console.log('[PrepareData] No documents in discovery_uploaded_documents');
    }
  } else {
    console.log('[PrepareData] No discovery engagement found for client');
  }
  
  // ========================================================================
  // Method 2: Try listing storage folders directly (fallback if client_context empty)
  // ========================================================================
  
  if (documents.length === 0) {
    console.log('[PrepareData] No documents from client_context, trying direct storage listing...');
    
    // Try multiple path patterns
    const pathsToTry = [
      clientId,  // Just client ID
      practiceId ? `${practiceId}/${clientId}` : null,  // practice/client
    ].filter(Boolean) as string[];
    
    for (const basePath of pathsToTry) {
      console.log('[PrepareData] Trying storage path:', basePath);
      
      const { data: files, error: listError } = await supabase.storage
        .from('client-documents')
        .list(basePath, { limit: 50 });
      
      if (listError) {
        console.log('[PrepareData] List error for', basePath, ':', listError.message);
        continue;
      }
      
      if (files && files.length > 0) {
        console.log('[PrepareData] Found files at', basePath, ':', files.map((f: any) => f.name));
        
        for (const file of files) {
          if (file.id === null) continue; // Skip folders
          
          const fullPath = `${basePath}/${file.name}`;
          
          try {
            const { data: fileBlob, error: dlError } = await supabase.storage
              .from('client-documents')
              .download(fullPath);
            
            if (dlError || !fileBlob) {
              console.error('[PrepareData] Download error:', dlError?.message);
              continue;
            }
            
            const content = await extractTextFromBlob(fileBlob, file.name);
            
            if (content && content.length > 10) {
              const cleanName = file.name.replace(/^\d+_/, '');
              documents.push({
                fileName: cleanName,
                content: content.substring(0, 25000),
                source: 'storage_list'
              });
              console.log('[PrepareData] ✓ Loaded from listing:', cleanName, 'length:', content.length);
            }
          } catch (err) {
            console.error('[PrepareData] Error downloading', fullPath, err);
          }
        }
        
        if (documents.length > 0) break; // Found files, stop trying paths
      }
    }
  }
  
  console.log('[PrepareData] === Total documents loaded:', documents.length, '===');
  return documents;
}

// Legacy function name for compatibility
async function loadClientDocumentsFromStorage(
  supabase: any,
  clientId: string
): Promise<LoadedDocument[]> {
  return loadClientDocuments(supabase, clientId);
}

// Legacy fallback function
async function loadDocumentsFromClientContext(
  supabase: any,
  clientId: string
): Promise<LoadedDocument[]> {
  // This is now integrated into loadClientDocuments
  return [];
}

// Placeholder for any remaining old code that calls this pattern
async function _legacyLoadDocumentsFromClientContext(
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

    // Source 2: Load from storage using client_context paths and signed URLs
    // This handles the case where storage listing fails due to bucket policies
    const actualPracticeId = practiceId || client.practice_id;
    const storageDocuments = await loadClientDocuments(supabase, clientId, actualPracticeId);
    
    for (const doc of storageDocuments) {
      if (!documentsByFile[doc.fileName]) {
        documentsByFile[doc.fileName] = {
          fileName: doc.fileName,
          content: doc.content,
          dataSourceType: 'general',
          source: doc.source
        };
        console.log(`[PrepareData] Added from ${doc.source}: ${doc.fileName}`);
      } else {
        console.log(`[PrepareData] ${doc.fileName} already loaded from embeddings`);
      }
    }
    
    console.log(`[PrepareData] === Total documents loaded: ${Object.keys(documentsByFile).length} ===`);

    // ========================================================================
    // EXTRACT STRUCTURED DATA FROM DOCUMENTS
    // ========================================================================

    interface DocumentInsights {
      hasProjections: boolean;
      financialProjections?: {
        projectedRevenue?: Array<{ year: number; amount: number; note?: string }>;
        projectedEBITDA?: Array<{ year: number; amount: number; marginPercent?: number }>;
        projectedGrossMargin?: Array<{ year: number; percent: number }>;
        projectedTeamSize?: Array<{ year: number; count: number }>;
        projectedCustomers?: Array<{ year: number; count: number }>;
      };
      businessContext?: {
        businessModel?: string;
        industry?: string;
        revenueModel?: string;
        keyMetrics?: string[];
        growthStrategy?: string;
      };
      extractedFacts?: string[];
      warnings?: string[];
    }

    async function extractDocumentInsights(
      documents: Array<{ fileName: string; content: string }>,
      openrouterKey: string
    ): Promise<DocumentInsights> {
      // Skip if no documents or no API key
      if (!documents.length || !openrouterKey) {
        console.log('[PrepareData] No documents to extract insights from');
        return { hasProjections: false };
      }

      // Combine document content
      const documentContent = documents
        .map((doc, i) => `\n--- DOCUMENT ${i + 1}: ${doc.fileName} ---\n${doc.content}\n`)
        .filter(Boolean)
        .join('\n');
      
      if (!documentContent || documentContent.length < 100) {
        console.log('[PrepareData] Insufficient document content for extraction');
        return { hasProjections: false };
      }
      
      console.log('[PrepareData] Extracting insights from documents, content length:', documentContent.length);
      
      const extractionPrompt = `You are a financial analyst extracting structured data from business documents.

Analyze the following document(s) and extract ALL financial and business information.

<documents>
${documentContent.substring(0, 30000)}
</documents>

Return a JSON object with this EXACT structure (use null for missing data):

{
  "hasProjections": true,
  "financialProjections": {
    "projectedRevenue": [
      { "year": 1, "amount": 559000 },
      { "year": 2, "amount": 3100000 },
      { "year": 3, "amount": 7100000 },
      { "year": 4, "amount": 13100000 },
      { "year": 5, "amount": 22700000 }
    ],
    "projectedGrossMargin": [
      { "year": 1, "percent": 90 }
    ],
    "projectedTeamSize": [
      { "year": 1, "count": 3 },
      { "year": 5, "count": 28 }
    ],
    "projectedCustomers": [
      { "year": 1, "count": 650 },
      { "year": 5, "count": 5100 }
    ]
  },
  "businessContext": {
    "businessModel": "B2B SaaS with Pro and Enterprise tiers",
    "industry": "Technology",
    "revenueModel": "Monthly subscriptions + annual enterprise contracts",
    "fundingStatus": "Raised £1m seed",
    "launchTimeline": "Launching January 2025"
  },
  "extractedFacts": [
    "Year 1 revenue £559k",
    "Year 5 revenue £22.7M",
    "41x growth over 5 years",
    "90% gross margin",
    "Team grows from 3 to 28",
    "Raised nearly £1m"
  ]
}

RULES:
1. All amounts in GBP as raw numbers (559000 not "£559K")
2. Percentages as whole numbers (90 not 0.90)
3. Extract ALL years if projections exist (Year 1-5)
4. Include team size projections if found
5. Include customer/subscriber projections if found
6. extractedFacts should be specific claims that can be quoted
7. Return ONLY valid JSON, no markdown

If no financial projections exist, return: { "hasProjections": false }`;

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://torsor.co.uk',
            'X-Title': 'Torsor Discovery Analysis'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-haiku-20240307', // Faster and cheaper for structured extraction
            max_tokens: 3000,
            temperature: 0.1,
            messages: [
              { role: 'user', content: extractionPrompt }
            ]
          })
        });

        if (!response.ok) {
          console.error('[PrepareData] OpenRouter error:', response.status);
          return { hasProjections: false };
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';
        
        console.log('[PrepareData] Extraction response length:', content.length);

        // Parse JSON with robust extraction
        let jsonString = content.trim();
        
        // Remove markdown code blocks if present
        const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
        }
        
        // Find JSON boundaries
        if (!jsonString.startsWith('{')) {
          const jsonStart = jsonString.indexOf('{');
          if (jsonStart !== -1) jsonString = jsonString.substring(jsonStart);
        }
        
        // Find matching closing brace
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonString.length; i++) {
          if (jsonString[i] === '{') braceCount++;
          if (jsonString[i] === '}') braceCount--;
          if (braceCount === 0) { jsonEnd = i; break; }
        }
        if (jsonEnd !== -1) jsonString = jsonString.substring(0, jsonEnd + 1);
        
        const extracted = JSON.parse(jsonString);
        
        // Calculate growth multiple if we have the data
        if (extracted.financialProjections?.projectedRevenue?.length >= 2) {
          const revenues = extracted.financialProjections.projectedRevenue;
          const year1 = revenues.find((r: any) => r.year === 1)?.amount;
          const year5 = revenues.find((r: any) => r.year === 5)?.amount;
          
          if (year1 && year5) {
            extracted.growthMultiple = Math.round(year5 / year1);
            console.log('[PrepareData] Calculated growth multiple:', extracted.growthMultiple);
          }
        }
        
        console.log('[PrepareData] Document insights extracted:', {
          hasProjections: extracted.hasProjections,
          revenueYears: extracted.financialProjections?.projectedRevenue?.length || 0,
          teamYears: extracted.financialProjections?.projectedTeamSize?.length || 0,
          growthMultiple: extracted.growthMultiple,
          factsCount: extracted.extractedFacts?.length || 0
        });
        
        return extracted;

      } catch (error: any) {
        console.error('[PrepareData] Document extraction error:', error.message);
        return { hasProjections: false };
      }
    }

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    let documentInsights: DocumentInsights = { hasProjections: false };

    const documentsArray = Object.values(documentsByFile).map(doc => ({
      fileName: doc.fileName,
      content: doc.content
    }));
    
    if (documentsArray.length > 0 && openrouterKey) {
      console.log('[PrepareData] Extracting structured insights from documents...');
      documentInsights = await extractDocumentInsights(documentsArray, openrouterKey);
      console.log('[PrepareData] Document insights:', {
        hasProjections: documentInsights.hasProjections,
        extractedFacts: documentInsights.extractedFacts?.length || 0
      });
    } else {
      console.log('[PrepareData] Skipping document extraction - no docs or no API key');
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
        content: doc.content.substring(0, 20000), // Cap at 20k per doc
        source: doc.source
      })),
      
      // NEW: Structured data extracted from documents
      documentInsights: documentInsights,
      contextDocs: contextDocs?.map(doc => ({
        type: doc.context_type,
        content: doc.content?.substring(0, 500)
      })) || [],
      financialContext: financialContext ? {
        periodType: financialContext.period_type,
        periodEnd: financialContext.period_end_date,
        // Core revenue figures
        revenue: financialContext.revenue,
        turnover: financialContext.turnover || financialContext.revenue,
        // Profitability
        grossProfit: financialContext.gross_profit,
        grossMarginPct: financialContext.gross_margin_pct,
        netProfit: financialContext.net_profit,
        netMarginPct: financialContext.net_margin_pct,
        operatingProfit: financialContext.operating_profit,
        ebitda: financialContext.ebitda,
        // Staff costs (CRITICAL for payroll analysis)
        staffCosts: financialContext.staff_costs || financialContext.total_staff_costs,
        totalStaffCosts: financialContext.total_staff_costs || financialContext.staff_costs,
        staffCostsPct: financialContext.staff_costs_pct,
        // Headcount
        staffCount: financialContext.staff_count,
        revenuePerHead: financialContext.revenue_per_head,
        revenueGrowthPct: financialContext.revenue_growth_pct,
        // Assets for valuation
        netAssets: financialContext.net_assets,
        totalAssets: financialContext.total_assets
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
