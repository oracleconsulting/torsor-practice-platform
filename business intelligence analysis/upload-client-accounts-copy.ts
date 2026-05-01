import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  clientId: string;
  practiceId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBase64: string;
  fiscalYear?: number;
  /** When uploaded from Discovery report — links upload to engagement for one document list */
  engagementId?: string;
  source?: string; // 'discovery' | 'upload' (default)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: UploadRequest = await req.json();
    const { clientId, practiceId, fileName, fileType, fileSize, fileBase64, fiscalYear, engagementId, source } = body;

    console.log(`[Accounts Upload] Starting upload for client ${clientId}`);
    console.log(`[Accounts Upload] File: ${fileName} (${fileType}, ${fileSize} bytes)`);

    // Validate file type
    const allowedTypes = ['pdf', 'csv', 'xlsx', 'xls'];
    const normalizedType = fileType.toLowerCase().replace('.', '');
    if (!allowedTypes.includes(normalizedType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid file type: ${fileType}. Allowed: PDF, CSV, Excel` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB. Max: 10MB` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 file
    const fileData = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${practiceId}/${clientId}/${timestamp}_${sanitizedFileName}`;

    console.log(`[Accounts Upload] Storing file at: ${storagePath}`);

    // Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('client-accounts')
      .upload(storagePath, fileData, {
        contentType: getMimeType(normalizedType),
        upsert: false
      });

    if (storageError) {
      console.error(`[Accounts Upload] Storage error:`, storageError);
      
      // Check if bucket doesn't exist
      if (storageError.message?.includes('not found') || storageError.message?.includes('Bucket')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Storage bucket not configured. Please create the "client-accounts" bucket in Supabase Storage.',
            setupRequired: true
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw storageError;
    }

    // Create upload record (single table for Discovery + Benchmarking + any flow)
    const { data: uploadRecord, error: dbError } = await supabase
      .from('client_accounts_uploads')
      .insert({
        client_id: clientId,
        practice_id: practiceId,
        file_name: fileName,
        file_type: normalizedType,
        file_size: fileSize,
        storage_path: storagePath,
        status: 'pending',
        fiscal_year: fiscalYear ?? null,
        engagement_id: engagementId ?? null,
        source: source ?? 'upload'
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[Accounts Upload] Database error:`, dbError);
      // Clean up uploaded file
      await supabase.storage.from('client-accounts').remove([storagePath]);
      throw dbError;
    }

    console.log(`[Accounts Upload] Upload record created: ${uploadRecord.id}`);

    // Trigger async processing
    const processResponse = await supabase.functions.invoke('process-accounts-upload', {
      body: { uploadId: uploadRecord.id }
    });

    if (processResponse.error) {
      console.warn(`[Accounts Upload] Processing trigger warning:`, processResponse.error);
      // Don't fail - processing can be retried
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadId: uploadRecord.id,
        status: 'pending',
        message: 'File uploaded successfully. Processing will begin shortly.',
        storagePath
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[Accounts Upload] Error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel'
  };
  return mimeTypes[fileType] || 'application/octet-stream';
}


