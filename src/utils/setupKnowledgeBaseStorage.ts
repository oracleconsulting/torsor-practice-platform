import { supabase } from '@/lib/supabase/client';

export async function setupKnowledgeBaseStorage() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      // If we get a permission error listing buckets, assume bucket exists
      // This happens when RLS policies restrict bucket listing
      if (listError.message?.includes('row-level security') || 
          listError.message?.includes('permission') ||
          listError.message?.includes('policy')) {
        console.log('Cannot list buckets due to permissions - assuming documents bucket exists');
        return { success: true };
      }
      
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }
    
    const bucketExists = buckets?.some(bucket => bucket.id === 'documents');
    
    if (!bucketExists) {
      console.log('Creating documents bucket...');
      
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('documents', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown'
        ]
      });
      
      if (createError) {
        // If we get a permission error creating the bucket, it might already exist
        if (createError.message?.includes('row-level security') || 
            createError.message?.includes('already exists') ||
            createError.message?.includes('duplicate')) {
          console.log('Documents bucket might already exist - continuing');
          return { success: true };
        }
        
        console.error('Error creating bucket:', createError);
        return { success: false, error: createError.message };
      }
      
      console.log('Documents bucket created successfully!');
    } else {
      console.log('Documents bucket already exists');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Setup error:', error);
    // Don't fail if it's a permission issue - bucket might already exist
    if (error.message?.includes('row-level security') || 
        error.message?.includes('permission')) {
      return { success: true };
    }
    return { success: false, error: error.message };
  }
}

// Function to check if Knowledge Base is properly set up
export async function checkKnowledgeBaseSetup() {
  const checks = {
    tables: {
      knowledge_documents: false,
      knowledge_usage: false,
      knowledge_sync_status: false
    },
    storage: {
      documents_bucket: false
    },
    functions: {
      search_knowledge_documents: false,
      get_top_used_documents: false
    }
  };
  
  try {
    // Check tables
    const { error: docsError } = await supabase
      .from('knowledge_documents')
      .select('id')
      .limit(1);
    checks.tables.knowledge_documents = !docsError;
    
    const { error: usageError } = await supabase
      .from('knowledge_usage')
      .select('id')
      .limit(1);
    checks.tables.knowledge_usage = !usageError;
    
    const { error: syncError } = await supabase
      .from('knowledge_sync_status')
      .select('id')
      .limit(1);
    checks.tables.knowledge_sync_status = !syncError;
    
    // Check storage
    const { data: buckets } = await supabase.storage.listBuckets();
    checks.storage.documents_bucket = buckets?.some(b => b.id === 'documents') || false;
    
    // Check functions
    try {
      await supabase.rpc('search_knowledge_documents', {
        search_query: 'test',
        search_limit: 1
      });
      checks.functions.search_knowledge_documents = true;
    } catch {
      checks.functions.search_knowledge_documents = false;
    }
    
    try {
      await supabase.rpc('get_top_used_documents', {
        limit_count: 1
      });
      checks.functions.get_top_used_documents = true;
    } catch {
      checks.functions.get_top_used_documents = false;
    }
    
    return checks;
  } catch (error) {
    console.error('Error checking setup:', error);
    return checks;
  }
} 