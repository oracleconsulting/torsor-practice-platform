import { supabase } from '@/lib/supabase/client';
import { 
  KnowledgeDocument, 
  KnowledgeChunk, 
  DocumentUploadRequest,
  DocumentProcessingResult,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  KnowledgeAnalytics,
  DocumentType,
  UsageContext
} from '@/types/knowledge';

export class KnowledgeBaseService {
  /**
   * Upload and process a document
   */
  static async uploadDocument(request: DocumentUploadRequest): Promise<DocumentProcessingResult> {
    try {
      // 1. Upload file to storage
      const fileName = `${Date.now()}-${request.file.name}`;
      const filePath = `knowledge-base/${request.client_id || 'global'}/${fileName}`;
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, request.file);

      if (uploadError) throw uploadError;

      // 2. Create document record
      const { data: document, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: request.title,
          type: request.type,
          category: request.category,
          tags: request.tags || [],
          source: 'upload',
          client_id: request.client_id,
          file_url: fileData.path,
          file_name: request.file.name,
          file_size: request.file.size,
          mime_type: request.file.type,
          is_active: true
        })
        .select()
        .single();

      if (docError) throw docError;

      // 3. Trigger processing (this would be handled by an edge function)
      const { data: processResult, error: processError } = await supabase.functions
        .invoke('process-knowledge-document', {
          body: { document_id: document.id }
        });

      if (processError) {
        console.error('Processing error:', processError);
        return {
          document_id: document.id,
          status: 'partial',
          chunks_created: 0,
          error: processError.message
        };
      }

      return {
        document_id: document.id,
        status: 'success',
        chunks_created: processResult?.chunks_created || 0,
        summary: processResult?.summary,
        key_insights: processResult?.key_insights
      };

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get all documents with optional filters
   */
  static async getDocuments(filters?: {
    type?: DocumentType;
    client_id?: string;
    tags?: string[];
    is_active?: boolean;
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
    if (filters?.client_id !== undefined) {
      query = filters.client_id 
        ? query.eq('client_id', filters.client_id)
        : query.is('client_id', null);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single document with its chunks
   */
  static async getDocument(documentId: string): Promise<KnowledgeDocument | null> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select(`
        *,
        chunks:knowledge_chunks(*),
        sync_status:knowledge_sync_status(*)
      `)
      .eq('id', documentId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string, 
    updates: Partial<KnowledgeDocument>
  ): Promise<KnowledgeDocument> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        title: updates.title,
        category: updates.category,
        tags: updates.tags,
        relevance_score: updates.relevance_score,
        is_active: updates.is_active,
        metadata: updates.metadata
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a document and all its chunks
   */
  static async deleteDocument(documentId: string): Promise<void> {
    // First, delete from storage
    const { data: doc } = await supabase
      .from('knowledge_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (doc?.file_url) {
      await supabase.storage
        .from('documents')
        .remove([doc.file_url]);
    }

    // Then delete the record (cascades to chunks)
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  }

  /**
   * Search knowledge base using edge function
   */
  static async search(params: KnowledgeSearchParams): Promise<KnowledgeSearchResult[]> {
    const { data, error } = await supabase.functions
      .invoke('search-knowledge-base', {
        body: params
      });

    if (error) throw error;
    return data?.results || [];
  }

  /**
   * Record usage of a document/chunk
   */
  static async recordUsage(
    documentId: string,
    context: UsageContext,
    options?: {
      chunkId?: string;
      clientId?: string;
      queryText?: string;
      relevanceScore?: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('knowledge_usage')
      .insert({
        document_id: documentId,
        chunk_id: options?.chunkId,
        used_in_context: context,
        client_id: options?.clientId,
        query_text: options?.queryText,
        relevance_score: options?.relevanceScore
      });

    if (error) throw error;
  }

  /**
   * Submit feedback for a document usage
   */
  static async submitFeedback(
    usageId: string,
    feedback: 'helpful' | 'not_relevant' | 'needs_update' | 'outdated',
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('knowledge_usage')
      .update({
        feedback,
        feedback_notes: notes
      })
      .eq('id', usageId);

    if (error) throw error;
  }

  /**
   * Get analytics for knowledge base
   */
  static async getAnalytics(): Promise<KnowledgeAnalytics> {
    // Get document counts by type
    const { data: typeCounts } = await supabase
      .from('knowledge_documents')
      .select('type')
      .eq('is_active', true);

    const documentsByType = (typeCounts || []).reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>);

    // Get usage counts by context
    const { data: usageCounts } = await supabase
      .from('knowledge_usage')
      .select('used_in_context');

    const usageByContext = (usageCounts || []).reduce((acc, usage) => {
      acc[usage.used_in_context] = (acc[usage.used_in_context] || 0) + 1;
      return acc;
    }, {} as Record<UsageContext, number>);

    // Get feedback summary
    const { data: feedbackData } = await supabase
      .from('knowledge_usage')
      .select('feedback')
      .not('feedback', 'is', null);

    const feedbackSummary = (feedbackData || []).reduce((acc, item) => {
      if (item.feedback) {
        acc[item.feedback] = (acc[item.feedback] || 0) + 1;
      }
      return acc;
    }, {} as any);

    // Get top used documents
    const { data: topDocs } = await supabase.rpc('get_top_used_documents', {
      limit_count: 10
    });

    return {
      total_documents: Object.values(documentsByType).reduce((a, b) => a + b, 0),
      documents_by_type: documentsByType,
      usage_by_context: usageByContext,
      average_relevance_score: 0.85, // This would be calculated from actual data
      feedback_summary: {
        helpful: feedbackSummary.helpful || 0,
        not_relevant: feedbackSummary.not_relevant || 0,
        needs_update: feedbackSummary.needs_update || 0,
        outdated: feedbackSummary.outdated || 0
      },
      top_used_documents: topDocs || []
    };
  }

  /**
   * Reprocess a document (re-extract, re-chunk, re-embed)
   */
  static async reprocessDocument(documentId: string): Promise<DocumentProcessingResult> {
    // Update sync status to pending
    await supabase
      .from('knowledge_sync_status')
      .upsert({
        document_id: documentId,
        sync_status: 'pending',
        error_message: null
      });

    // Trigger reprocessing
    const { data, error } = await supabase.functions
      .invoke('process-knowledge-document', {
        body: { 
          document_id: documentId,
          reprocess: true 
        }
      });

    if (error) {
      return {
        document_id: documentId,
        status: 'failed',
        chunks_created: 0,
        error: error.message
      };
    }

    return {
      document_id: documentId,
      status: 'success',
      chunks_created: data?.chunks_created || 0,
      summary: data?.summary,
      key_insights: data?.key_insights
    };
  }

  /**
   * Get documents by tag
   */
  static async getDocumentsByTag(tag: string): Promise<KnowledgeDocument[]> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .contains('tags', [tag])
      .eq('is_active', true)
      .order('relevance_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Bulk update document tags
   */
  static async bulkUpdateTags(
    documentIds: string[], 
    tagsToAdd: string[], 
    tagsToRemove: string[]
  ): Promise<void> {
    // This would be implemented as a stored procedure for efficiency
    const { error } = await supabase.rpc('bulk_update_document_tags', {
      document_ids: documentIds,
      tags_to_add: tagsToAdd,
      tags_to_remove: tagsToRemove
    });

    if (error) throw error;
  }
} 