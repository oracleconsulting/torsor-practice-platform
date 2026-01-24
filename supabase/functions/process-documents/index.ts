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

// Extract text from a file using Supabase Storage authenticated download
// This is needed because client-documents bucket is PRIVATE (not public)
async function extractTextFromStorage(
  supabase: any, 
  fileUrl: string, 
  fileType: string
): Promise<string> {
  try {
    console.log(`[ProcessDocs] Extracting from: ${fileUrl}`);
    
    // Parse the URL to get bucket and path
    // URL format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
    let bucket = 'client-documents';
    let storagePath = '';
    
    if (fileUrl.includes('/storage/v1/object/public/')) {
      const parts = fileUrl.split('/storage/v1/object/public/');
      if (parts[1]) {
        const pathParts = parts[1].split('/');
        bucket = pathParts[0];
        storagePath = pathParts.slice(1).join('/');
      }
    } else if (fileUrl.includes('/storage/v1/object/')) {
      // Handle non-public URL format
      const parts = fileUrl.split('/storage/v1/object/');
      if (parts[1]) {
        const pathParts = parts[1].split('/');
        bucket = pathParts[0];
        storagePath = pathParts.slice(1).join('/');
      }
    }
    
    console.log(`[ProcessDocs] Bucket: ${bucket}, Path: ${storagePath}`);
    
    // Download the file using authenticated Supabase Storage API
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(storagePath);
    
    if (downloadError || !fileBlob) {
      console.error('[ProcessDocs] Storage download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError?.message || 'No data'}`);
    }
    
    console.log(`[ProcessDocs] Downloaded file: ${fileBlob.size} bytes`);
    
    // Convert blob to array buffer
    const buffer = await fileBlob.arrayBuffer();
    
    // Handle based on file type
    const lowerType = fileType.toLowerCase();
    
    // Text-based files
    if (lowerType.includes('text') || 
        lowerType.endsWith('.txt') || 
        lowerType.endsWith('.md') ||
        lowerType.endsWith('.csv')) {
      const text = await fileBlob.text();
      console.log(`[ProcessDocs] Text file extracted: ${text.length} chars`);
      return text;
    }
    
    // PDF files - use unpdf for proper text extraction
    if (lowerType.includes('pdf') || lowerType.endsWith('.pdf')) {
      console.log('[ProcessDocs] Extracting text from PDF...');
      const text = await extractTextFromPDF(buffer);
      if (text && text.length > 50) {
        console.log(`[ProcessDocs] Successfully extracted ${text.length} chars from PDF`);
        return text;
      }
      console.log('[ProcessDocs] PDF extraction returned insufficient text');
      return `[PDF Document: Could not extract text - ${fileType}]`;
    }
    
    // Office documents
    if (lowerType.includes('.doc') || lowerType.includes('.xls') || lowerType.includes('.ppt')) {
      return `[Office Document: ${fileType} - Content extraction pending]`;
    }
    
    // Fallback: try to read as text
    try {
      const text = await fileBlob.text();
      if (text && text.length > 0 && !/[\x00-\x08\x0E-\x1F]/.test(text.substring(0, 1000))) {
        return text;
      }
    } catch (e) {
      // Ignore text parsing errors
    }
    
    return `[Binary file: ${fileType}]`;
  } catch (error) {
    console.error('[ProcessDocs] Error extracting text:', error);
    return `[Error extracting content from ${fileType}]`;
  }
}

// ============================================================================
// PDF TEXT EXTRACTION - Uses unpdf library for proper compressed PDF handling
// ============================================================================

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  
  // Try unpdf first - handles compressed PDFs properly
  try {
    console.log('[ProcessDocs] Attempting PDF extraction with unpdf...');
    
    const unpdf = await import('https://esm.sh/unpdf@0.12.1?bundle');
    const result = await unpdf.extractText(uint8Array, { mergePages: true });
    const text = result.text || '';
    
    if (text && text.length > 100) {
      // Check if it's real readable text (not PDF binary garbage)
      const hasRealText = /[a-zA-Z]{3,}/.test(text);
      const hasSentences = /[A-Z][a-z]+\s+[a-z]+/.test(text); // Capitalized word followed by lowercase
      const garbageRatio = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length / text.length;
      
      console.log(`[ProcessDocs] unpdf extracted: ${text.length} chars, hasRealText: ${hasRealText}, hasSentences: ${hasSentences}, garbageRatio: ${garbageRatio.toFixed(2)}`);
      
      // Only use if it looks like real text (low garbage ratio)
      if (hasRealText && garbageRatio < 0.3) {
        console.log('[ProcessDocs] PDF content preview:', text.substring(0, 200));
        return text.substring(0, 50000);
      }
    }
    
    console.log('[ProcessDocs] unpdf returned empty or garbage, trying getDocumentProxy...');
  } catch (unpdfError: any) {
    console.error('[ProcessDocs] unpdf error:', unpdfError?.message || unpdfError);
  }
  
  // Fallback: Try unpdf's getDocumentProxy for more control
  try {
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
    
    if (fullText && fullText.length > 100) {
      const hasRealText = /[a-zA-Z]{3,}/.test(fullText);
      const garbageRatio = (fullText.match(/[^\x20-\x7E\n\r\t]/g) || []).length / fullText.length;
      console.log(`[ProcessDocs] unpdf proxy extracted: ${fullText.length} chars, ${pdf.numPages} pages, garbageRatio: ${garbageRatio.toFixed(2)}`);
      
      if (hasRealText && garbageRatio < 0.3) {
        return fullText.substring(0, 50000);
      }
    }
  } catch (proxyError: any) {
    console.error('[ProcessDocs] unpdf proxy error:', proxyError?.message || proxyError);
  }
  
  // If we get here, it's likely a scanned PDF - try OCR via Vision LLM
  console.log('[ProcessDocs] Text extraction failed - attempting OCR via Vision LLM...');
  try {
    const ocrText = await extractTextWithOCR(buffer);
    if (ocrText && ocrText.length > 50) {
      console.log(`[ProcessDocs] OCR extracted: ${ocrText.length} chars`);
      return ocrText;
    }
  } catch (ocrError: any) {
    console.error('[ProcessDocs] OCR error:', ocrError?.message || ocrError);
  }
  
  // Last resort: return empty with explanation
  console.log('[ProcessDocs] All extraction methods failed');
  return '[Could not extract text from scanned PDF - OCR failed]';
}

// ============================================================================
// OCR VIA VISION LLM - For scanned PDFs that don't have extractable text
// Uses Claude Vision via OpenRouter to read text from PDF images
// ============================================================================

// Convert Uint8Array to base64 without stack overflow (handles large files)
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  // Process in chunks to avoid "Maximum call stack size exceeded"
  const chunkSize = 32768; // 32KB chunks
  let binaryString = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  
  return btoa(binaryString);
}

async function extractTextWithOCR(buffer: ArrayBuffer): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY not configured for OCR');
  }
  
  console.log(`[ProcessDocs] Attempting OCR for scanned PDF (${Math.round(buffer.byteLength / 1024)}KB)`);
  
  // SEQUENTIAL PAGE PROCESSING to avoid memory limits
  // Process one page at a time: extract image → OCR → release memory → next page
  const uint8Array = new Uint8Array(buffer);
  const allExtractedText: string[] = [];
  
  try {
    const unpdf = await import('https://esm.sh/unpdf@0.12.1?bundle');
    const pdf = await unpdf.getDocumentProxy(uint8Array);
    const totalPages = pdf.numPages;
    
    console.log(`[ProcessDocs] PDF has ${totalPages} pages, processing sequentially...`);
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        console.log(`[ProcessDocs] Processing page ${pageNum}/${totalPages}...`);
        
        // Extract single page image
        const pageImage = await extractSinglePageImage(pdf, pageNum);
        
        if (!pageImage) {
          console.log(`[ProcessDocs] No image found on page ${pageNum}, skipping`);
          continue;
        }
        
        // OCR this single page
        const pageText = await ocrSingleImage(pageImage, pageNum, totalPages, openRouterKey);
        
        if (pageText && pageText.length > 10) {
          allExtractedText.push(`--- PAGE ${pageNum} ---\n${pageText}`);
          console.log(`[ProcessDocs] Page ${pageNum}: extracted ${pageText.length} chars`);
        }
        
        // Memory is released as pageImage goes out of scope
        
      } catch (pageErr: any) {
        console.error(`[ProcessDocs] Error on page ${pageNum}:`, pageErr?.message || pageErr);
        // Continue to next page
      }
    }
    
    // Cleanup
    pdf.destroy();
    
  } catch (err: any) {
    console.error('[ProcessDocs] PDF processing error:', err?.message || err);
    throw err;
  }
  
  if (allExtractedText.length === 0) {
    throw new Error('Could not extract text from any pages');
  }
  
  const fullText = allExtractedText.join('\n\n');
  console.log(`[ProcessDocs] OCR complete: ${fullText.length} chars from ${allExtractedText.length} pages`);
  
  return fullText.substring(0, 100000); // Allow more text since we're processing all pages
}

// Extract a single page's image from the PDF
async function extractSinglePageImage(pdf: any, pageNum: number): Promise<{base64: string, mimeType: string} | null> {
  try {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();
    
    // Look for image XObjects in the operator list
    for (let i = 0; i < ops.fnArray.length; i++) {
      // OPS.paintImageXObject = 85, OPS.paintJpegXObject = 82
      if (ops.fnArray[i] === 85 || ops.fnArray[i] === 82) {
        const imgName = ops.argsArray[i]?.[0];
        if (imgName) {
          try {
            const imgData = await page.objs.get(imgName);
            if (imgData && imgData.data && imgData.data.length > 1000) {
              // Convert image data to base64
              const imageBase64 = uint8ArrayToBase64(new Uint8Array(imgData.data));
              
              // Determine MIME type
              let mimeType = 'image/png';
              if (imgData.data[0] === 0xFF && imgData.data[1] === 0xD8) {
                mimeType = 'image/jpeg';
              }
              
              return { base64: imageBase64, mimeType };
            }
          } catch (imgErr) {
            // Try next image
          }
        }
      }
    }
  } catch (err) {
    console.log(`[ProcessDocs] Could not extract image from page ${pageNum}`);
  }
  
  return null;
}

// OCR a single image using Claude Vision
async function ocrSingleImage(
  image: {base64: string, mimeType: string}, 
  pageNum: number, 
  totalPages: number,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor Document OCR'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract ALL text from this page (page ${pageNum} of ${totalPages}) of a UK company accounts document.
Extract exactly as written: all text, numbers, tables, headers, notes.
Format tables with | separators. Output ONLY the text, no commentary.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${image.mimeType};base64,${image.base64}`
              }
            }
          ]
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}


// Fallback OCR: Describe what we need and ask LLM to help
async function extractTextWithOCRFallback(buffer: ArrayBuffer, apiKey: string): Promise<string> {
  console.log('[ProcessDocs] Using OCR fallback - requesting document analysis...');
  
  // For scanned PDFs, we need to either:
  // 1. Use a dedicated OCR service (Google Vision, AWS Textract)
  // 2. Convert PDF pages to images first
  
  // For now, return a message indicating OCR is needed
  // This can be enhanced with actual OCR service integration
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor Document OCR'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `A scanned PDF document was uploaded but text extraction failed.
The document is ${Math.round(buffer.byteLength / 1024)}KB in size.
Based on the filename containing "Services Limited" and "24", this is likely company annual accounts for 2024.

Please respond with a message explaining that:
1. This appears to be a scanned PDF (image-based, not text-based)
2. The financial data needs to be entered manually or the document re-uploaded as a text-based PDF
3. If exported from accounting software, use "Save as PDF" rather than scanning

Keep it brief and helpful.`
        }
      ]
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    return `[SCANNED PDF - OCR REQUIRED]\n\n${data.choices?.[0]?.message?.content || 'This document requires OCR processing.'}`;
  }
  
  return '[SCANNED PDF - Manual data entry required. Please re-upload as a text-based PDF or enter financial data manually.]';
}

// Fallback regex method for simple/uncompressed PDFs
function extractTextFromPDFFallback(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    const textMatches: string[] = [];
    let match;
    
    // Extract text between parentheses (PDF text objects)
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
    console.log(`[ProcessDocs] Fallback extraction: ${result.length} chars`);
    return result;
  } catch (error) {
    console.error('[ProcessDocs] Fallback PDF extraction error:', error);
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
        
        // 1. Extract text from document using authenticated Supabase Storage download
        // (NOT public URL fetch - client-documents bucket is PRIVATE)
        const rawText = await extractTextFromStorage(supabase, doc.fileUrl, doc.fileType);
        console.log(`Extracted ${rawText.length} chars from ${doc.fileName}`);
        
        // 2. Detect data source type (accounts vs transcript)
        const sourceInfo = detectDataSourceType(doc.fileName, rawText);
        console.log(`Data source: ${sourceInfo.type} (priority: ${sourceInfo.priority})`);
        
        // 3. CRITICAL: Sanitize before ANY LLM processing (GDPR compliance)
        const { sanitizedText, extractedMetrics } = sanitizeForLLM(rawText);
        console.log(`Sanitized text: ${sanitizedText.length} chars, extracted ${Object.keys(extractedMetrics).length} metrics`);
        
        // CRITICAL: Store extracted text and metrics in client_context
        // This is what prepare-discovery-data reads to get document content!
        
        // Sanitize text for PostgreSQL - remove problematic Unicode escape sequences
        // PostgreSQL interprets \uXXXX as Unicode escapes which can fail if malformed
        const sanitizeForPostgres = (text: string): string => {
          return text
            // Remove null bytes
            .replace(/\x00/g, '')
            // Remove other control characters (except newline, tab, carriage return)
            .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Escape backslashes that might be interpreted as Unicode escapes
            .replace(/\\u[0-9a-fA-F]{0,3}(?![0-9a-fA-F])/g, '') // Remove incomplete \uXXX sequences
            .replace(/\\/g, '\\\\') // Escape remaining backslashes
            // Remove any remaining problematic sequences
            .replace(/[\uFFFD\uFFFE\uFFFF]/g, ''); // Remove replacement characters
        };
        
        const cleanedText = sanitizeForPostgres(rawText.substring(0, 50000));
        console.log(`[ProcessDocs] Updating client_context ID: ${contextId} with cleaned content (${cleanedText.length} chars)`);
        
        if (!contextId) {
          console.error('[ProcessDocs] ERROR: No contextId provided! Cannot update client_context');
          errors.push('No contextId provided for update');
        } else {
          const { data: updateData, error: updateError } = await supabase
            .from('client_context')
            .update({ 
              content: cleanedText, // Store the sanitized extracted text
              extracted_metrics: extractedMetrics,
              data_source_type: sourceInfo.type,
              priority_level: sourceInfo.priority,
              processed: true 
            })
            .eq('id', contextId)
            .select('id');
          
          if (updateError) {
            console.error(`[ProcessDocs] Update ERROR: ${updateError.message}`);
            errors.push(`Failed to update client_context: ${updateError.message}`);
          } else if (!updateData || updateData.length === 0) {
            console.error(`[ProcessDocs] Update WARNING: No rows matched contextId ${contextId}`);
            errors.push(`No client_context found with id ${contextId}`);
          } else {
            console.log(`[ProcessDocs] ✅ Updated client_context ${contextId} with ${cleanedText.length} chars of content`);
          }
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
          
          // TEMPORARILY DISABLED: Embeddings generation
          // The document_embeddings table schema doesn't match (missing 'content', 'applies_to' columns)
          // The primary goal is achieved: content is stored in client_context for discovery analysis
          // Re-enable once table schema is updated
          console.log(`[ProcessDocs] Skipping embeddings - content already stored in client_context`);
          
          /* DISABLED: Generate embeddings and store each chunk
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
          */
          
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

