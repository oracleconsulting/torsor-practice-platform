import { supabase } from '@/lib/supabase/client';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'best_practice' | 'case_study' | 'template' | 'guide' | 'policy';
  category?: string;
  tags?: string[];
  source?: string;
  author?: string;
  file_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  usage_count?: number;
  sync_status?: {
    last_synced_at?: string;
    sync_status?: 'pending' | 'syncing' | 'completed' | 'failed';
    error_message?: string;
    vector_id?: string;
  };
}

export type UsageContext = 'roadmap' | 'sprint' | 'vision' | 'board_meeting';

export interface KnowledgeUsage {
  id: string;
  document_id: string;
  used_at: string;
  used_by?: string;
  used_in_context: UsageContext;
  client_id?: string;
  relevance_score?: number;
  feedback?: string;
  metadata?: any;
}

class KnowledgeBaseService {
  async uploadDocument(file: File, metadata: {
    title: string;
    type: KnowledgeDocument['type'];
    category?: string;
    tags?: string[];
    author?: string;
  }): Promise<KnowledgeDocument> {
    try {
      // First check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw new Error('Unable to access storage. Please contact support.');
      }
      
      const bucketExists = buckets?.some(bucket => bucket.id === 'documents');
      
      if (!bucketExists) {
        console.error('Documents bucket not found. The bucket should be created via database migration.');
        throw new Error(
          'Storage bucket not configured. Please ask your administrator to run the latest database migrations. ' +
          'Run the migration file: 20250109_fix_knowledge_base_storage.sql'
        );
      }

      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message?.includes('row-level security')) {
          throw new Error('Permission denied. Please ensure you are logged in with proper permissions.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Extract text content from file
      let content = '';
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        content = await file.text();
      } else if (file.type === 'application/pdf') {
        // For PDF files, you'd need a PDF parsing library
        content = `PDF content extraction not implemented yet. File: ${file.name}`;
      }

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: metadata.title,
          content: content || `Content from file: ${file.name}`,
          type: metadata.type,
          category: metadata.category,
          tags: metadata.tags,
          author: metadata.author,
          source: publicUrl,
          file_url: publicUrl,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create initial sync status
      await supabase
        .from('knowledge_sync_status')
        .insert({
          document_id: document.id,
          sync_status: 'pending'
        });

      // Note: Vector embeddings would be created here using Cohere
      // This would typically be handled by the backend API server
      // which already has Cohere integration set up
      console.log('Document uploaded. Vector sync will be handled by backend service.');

      return document;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async searchDocuments(
    query: string,
    filters?: {
      type?: KnowledgeDocument['type'];
      category?: string;
      tags?: string[];
    }
  ): Promise<KnowledgeDocument[]> {
    try {
      // First try to use the backend API for vector search
      // The backend uses OpenRouter for LLM queries and Cohere for embeddings
      const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
      
      try {
        const response = await fetch(`${apiUrl}/api/knowledge/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            query,
            filters,
            use_vector_search: true
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.documents || [];
        }
      } catch (apiError) {
        console.log('Backend API not available, falling back to SQL search');
      }

      // Fallback to SQL full-text search
      const { data, error } = await supabase
        .rpc('search_knowledge_documents', {
          search_query: query,
          search_type: filters?.type || null,
          search_limit: 20
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Search error:', error);
      // Final fallback to basic search
      let dbQuery = supabase
        .from('knowledge_documents')
        .select('*')
        .eq('is_active', true);

      if (filters?.type) {
        dbQuery = dbQuery.eq('type', filters.type);
      }
      if (filters?.category) {
        dbQuery = dbQuery.eq('category', filters.category);
      }

      const { data, error: fallbackError } = await dbQuery;
      if (fallbackError) throw fallbackError;
      
      // Basic text filtering
      const searchLower = query.toLowerCase();
      return (data || []).filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.content.toLowerCase().includes(searchLower)
      );
    }
  }

  async getDocument(id: string): Promise<KnowledgeDocument | null> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select(`
        *,
        sync_status:knowledge_sync_status(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data;
  }

  async getAllDocuments(filters?: {
    type?: KnowledgeDocument['type'];
    category?: string;
    isActive?: boolean;
  }): Promise<KnowledgeDocument[]> {
    let query = supabase
      .from('knowledge_documents')
      .select(`
        *,
        sync_status:knowledge_sync_status(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data || [];
  }

  async updateDocument(
    id: string,
    updates: Partial<Omit<KnowledgeDocument, 'id' | 'created_at' | 'created_by'>>
  ): Promise<KnowledgeDocument | null> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return null;
    }

    // Update sync status if content changed
    if ('content' in updates) {
      await supabase
        .from('knowledge_sync_status')
        .update({
          sync_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('document_id', id);

      // Trigger re-embedding via backend API
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
        await fetch(`${apiUrl}/api/knowledge/reindex/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
      } catch (error) {
        console.log('Could not trigger reindexing:', error);
      }
    }

    return data;
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      // Get document to delete file
      const { data: doc } = await supabase
        .from('knowledge_documents')
        .select('file_url')
        .eq('id', id)
        .single();

      // Delete from storage if file exists
      if (doc?.file_url) {
        const fileName = doc.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('documents')
            .remove([fileName]);
        }
      }

      // Delete from database (cascades to sync_status)
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Also remove from vector store via backend
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
        await fetch(`${apiUrl}/api/knowledge/remove-vectors/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
      } catch (error) {
        console.log('Could not remove vectors:', error);
      }

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  async recordUsage(
    documentId: string,
    context: UsageContext,
    metadata?: {
      clientId?: string;
      relevanceScore?: number;
      enrichmentType?: string;
    }
  ): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      
      await supabase
        .from('knowledge_usage')
        .insert({
          document_id: documentId,
          used_by: user.data.user?.id,
          used_in_context: context,
          client_id: metadata?.clientId,
          relevance_score: metadata?.relevanceScore,
          metadata: metadata
        });
    } catch (error) {
      console.error('Error recording usage:', error);
    }
  }

  async getUsageAnalytics(): Promise<{
    totalUsage: number;
    usageByContext: Record<UsageContext, number>;
    topDocuments: any[];
    recentUsage: KnowledgeUsage[];
  }> {
    try {
      // Get total usage count
      const { count: totalUsage } = await supabase
        .from('knowledge_usage')
        .select('*', { count: 'exact', head: true });

      // Get usage by context
      const { data: contextData } = await supabase
        .from('knowledge_usage')
        .select('used_in_context');

      const usageByContext = (contextData || []).reduce((acc, item) => {
        const context = item.used_in_context as UsageContext;
        acc[context] = (acc[context] || 0) + 1;
        return acc;
      }, {} as Record<UsageContext, number>);

      // Get top used documents
      const { data: topDocuments } = await supabase
        .rpc('get_top_used_documents', { limit_count: 10 });

      // Get recent usage
      const { data: recentUsage } = await supabase
        .from('knowledge_usage')
        .select('*')
        .order('used_at', { ascending: false })
        .limit(20);

      return {
        totalUsage: totalUsage || 0,
        usageByContext,
        topDocuments: topDocuments || [],
        recentUsage: recentUsage || []
      };
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      return {
        totalUsage: 0,
        usageByContext: {} as Record<UsageContext, number>,
        topDocuments: [],
        recentUsage: []
      };
    }
  }

  async provideFeedback(
    usageId: string,
    feedback: string
  ): Promise<void> {
    try {
      await supabase
        .from('knowledge_usage')
        .update({ feedback })
        .eq('id', usageId);
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService(); 