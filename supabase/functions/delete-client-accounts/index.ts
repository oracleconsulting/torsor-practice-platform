import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteRequest {
  clientId: string;
  uploadId?: string; // Optional: delete specific upload only
  deleteAll?: boolean; // Delete all accounts for this client
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: DeleteRequest = await req.json();
    const { clientId, uploadId, deleteAll } = body;

    if (!clientId) {
      throw new Error("clientId is required");
    }

    console.log(`[Delete Accounts] Starting deletion for client ${clientId}${uploadId ? `, upload ${uploadId}` : ''}${deleteAll ? ' (ALL)' : ''}`);

    let deletedUploads = 0;
    let deletedFinancialRecords = 0;
    let deletedFiles = 0;

    // Get uploads to delete (either specific one or all for client)
    let uploadsQuery = supabase
      .from('client_accounts_uploads')
      .select('id, storage_path, file_name')
      .eq('client_id', clientId);
    
    if (uploadId && !deleteAll) {
      uploadsQuery = uploadsQuery.eq('id', uploadId);
    }

    const { data: uploads, error: fetchError } = await uploadsQuery;

    if (fetchError) {
      console.error('[Delete Accounts] Error fetching uploads:', fetchError);
      throw fetchError;
    }

    console.log(`[Delete Accounts] Found ${uploads?.length || 0} uploads to delete`);

    // Delete files from storage
    if (uploads && uploads.length > 0) {
      const storagePaths = uploads
        .map(u => u.storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        console.log(`[Delete Accounts] Deleting ${storagePaths.length} files from storage...`);
        
        const { error: storageError } = await supabase.storage
          .from('client-accounts')
          .remove(storagePaths);

        if (storageError) {
          console.warn('[Delete Accounts] Storage deletion warning:', storageError);
          // Don't fail the whole operation if storage deletion fails
        } else {
          deletedFiles = storagePaths.length;
          console.log(`[Delete Accounts] Deleted ${deletedFiles} files from storage`);
        }
      }
    }

    // Delete financial data records
    if (deleteAll || !uploadId) {
      // Delete all financial data for the client
      const { error: financialDeleteError, count } = await supabase
        .from('client_financial_data')
        .delete()
        .eq('client_id', clientId)
        .select('id', { count: 'exact' });

      if (financialDeleteError) {
        console.error('[Delete Accounts] Error deleting financial data:', financialDeleteError);
      } else {
        deletedFinancialRecords = count || 0;
        console.log(`[Delete Accounts] Deleted ${deletedFinancialRecords} financial data records`);
      }
    } else if (uploadId) {
      // Delete only financial data linked to this specific upload
      const { error: financialDeleteError, count } = await supabase
        .from('client_financial_data')
        .delete()
        .eq('upload_id', uploadId)
        .select('id', { count: 'exact' });

      if (financialDeleteError) {
        console.error('[Delete Accounts] Error deleting financial data:', financialDeleteError);
      } else {
        deletedFinancialRecords = count || 0;
        console.log(`[Delete Accounts] Deleted ${deletedFinancialRecords} financial data records for upload`);
      }
    }

    // Delete upload records
    let deleteUploadsQuery = supabase
      .from('client_accounts_uploads')
      .delete()
      .eq('client_id', clientId);

    if (uploadId && !deleteAll) {
      deleteUploadsQuery = deleteUploadsQuery.eq('id', uploadId);
    }

    const { error: uploadDeleteError } = await deleteUploadsQuery;

    if (uploadDeleteError) {
      console.error('[Delete Accounts] Error deleting upload records:', uploadDeleteError);
      throw uploadDeleteError;
    }

    deletedUploads = uploads?.length || 0;
    console.log(`[Delete Accounts] Deleted ${deletedUploads} upload records`);

    console.log(`[Delete Accounts] Deletion complete: ${deletedUploads} uploads, ${deletedFinancialRecords} financial records, ${deletedFiles} files`);

    return new Response(
      JSON.stringify({
        success: true,
        clientId,
        deletedUploads,
        deletedFinancialRecords,
        deletedFiles,
        message: `Successfully deleted ${deletedUploads} upload(s), ${deletedFinancialRecords} financial record(s), and ${deletedFiles} file(s)`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[Delete Accounts] Error:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to delete accounts"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});


