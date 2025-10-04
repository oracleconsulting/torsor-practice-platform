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
  user_id?: string;
  usage_count?: number;
  metadata?: {
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    [key: string]: any;
  };
}

class DirectKnowledgeBaseService {
  // Helper method to extract content from files
  private async extractFileContent(file: File): Promise<string> {
    try {
      // Handle text-based files
      if (file.type === 'text/plain' || 
          file.type === 'text/markdown' || 
          file.type === 'text/csv' ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.md')) {
        return await file.text();
      }
      
      // Handle JSON files
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        try {
          const json = JSON.parse(text);
          return JSON.stringify(json, null, 2);
        } catch {
          return text;
        }
      }

      // For PDF, Word, etc., you would need additional libraries
      // For now, return a placeholder indicating the file type
      return `[File content: ${file.name} - ${file.type}. Content extraction for this file type requires additional processing.]`;
    } catch (error) {
      console.error('Error extracting file content:', error);
      return '';
    }
  }

  async uploadDocument(file: File, metadata: {
    title: string;
    type: KnowledgeDocument['type'];
    category?: string;
    tags?: string[];
    author?: string;
  }): Promise<KnowledgeDocument> {
    try {
      // Upload file to Supabase storage with proper content type
      const fileName = `${Date.now()}-${file.name}`;
      
      // Fix mime type for markdown files
      let uploadFile = file;
      if (file.type === 'text/x-markdown' || file.name.endsWith('.md')) {
        // Convert to text/plain for Supabase storage
        uploadFile = new File([file], file.name, { type: 'text/plain' });
      }
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, uploadFile, {
          contentType: uploadFile.type || 'text/plain',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Extract content from file
      const content = await this.extractFileContent(file);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create document record with proper schema
      const { data: document, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: metadata.title,
          content: content || '', // Required field - extracted from file
          type: metadata.type,
          category: metadata.category,
          tags: metadata.tags || [],
          source: 'upload',
          author: metadata.author,
          file_url: fileData?.path,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Add user fields for RLS policies
          user_id: user.id,
          created_by: user.id,
          // Store file details in metadata JSONB column
          metadata: {
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (docError) throw docError;

      // Send to backend API for Pinecone embedding
      // Temporarily skip if CORS is not configured
      const skipEmbedding = false; // Set to true to skip embedding calls
      
      if (!skipEmbedding) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
          const response = await fetch(`${apiUrl}/api/knowledge/embed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': import.meta.env.VITE_KNOWLEDGE_API_KEY  // Add this to your .env
            },
            body: JSON.stringify({
              document_id: document.id,
              title: document.title,
              content: document.content,
              metadata: {
                type: document.type,
                category: document.category,
                tags: document.tags,
                author: document.author || user.email,  // Include user email here
                ...document.metadata
              }
            })
          });

          if (!response.ok) {
            console.log('Backend embedding failed, but document saved locally');
          }
        } catch (error) {
          console.log('Could not reach backend for embedding, but document saved:', error);
        }
      }

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
      // Try vector search via backend first
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
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
        console.log('Backend API not available (CORS or connection issue), falling back to database search');
      }

      // Fallback to simple database search
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

      // Simple text search
      if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async getAllDocuments(filters?: {
    type?: KnowledgeDocument['type'];
    category?: string;
    isActive?: boolean;
  }): Promise<KnowledgeDocument[]> {
    let query = supabase
      .from('knowledge_documents')
      .select('*')
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

  async deleteDocument(id: string): Promise<boolean> {
    try {
      // Get document to find file_url before deletion
      const { data: doc } = await supabase
        .from('knowledge_documents')
        .select('file_url, metadata')
        .eq('id', id)
        .single();

      // Delete from database
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete file from storage if exists
      if (doc?.file_url) {
        try {
          await supabase.storage
            .from('documents')
            .remove([doc.file_url]);
        } catch (storageError) {
          console.log('Could not delete file from storage:', storageError);
        }
      }

      // Also remove from Pinecone via backend
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/knowledge/remove-vectors/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        
        if (!response.ok) {
          console.log('Could not remove vectors from backend, but document deleted from database');
        }
      } catch (error) {
        console.log('Could not remove vectors (CORS or connection issue), but document deleted:', error);
      }

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<Omit<KnowledgeDocument, 'id' | 'created_at' | 'created_by'>>
  ): Promise<KnowledgeDocument | null> {
    try {
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

      // If content was updated, re-embed in Pinecone
      if (updates.content && data) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
          await fetch(`${apiUrl}/api/knowledge/embed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              document_id: data.id,
              title: data.title,
              content: data.content,
              metadata: {
                type: data.type,
                category: data.category,
                tags: data.tags,
                author: data.author,
                ...data.metadata
              }
            })
          });
        } catch (error) {
          console.log('Could not update embeddings:', error);
        }
      }

      return data;
    } catch (error) {
      console.error('Error in updateDocument:', error);
      return null;
    }
  }

  async getUsageAnalytics(): Promise<any> {
    try {
      // Simplified analytics
      const { data: documents, error } = await supabase
        .from('knowledge_documents')
        .select('*');

      if (error) throw error;

      const total = documents?.length || 0;
      const byType = documents?.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const byCategory = documents?.reduce((acc, doc) => {
        if (doc.category) {
          acc[doc.category] = (acc[doc.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total_documents: total,
        documents_by_type: byType,
        documents_by_category: byCategory,
        usage_by_context: {},
        average_relevance_score: 0.75,
        feedback_summary: {
          helpful: 0,
          not_relevant: 0,
          needs_update: 0,
          outdated: 0
        },
        top_used_documents: documents?.slice(0, 5) || []
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        total_documents: 0,
        documents_by_type: {},
        documents_by_category: {},
        usage_by_context: {},
        average_relevance_score: 0,
        feedback_summary: {
          helpful: 0,
          not_relevant: 0,
          needs_update: 0,
          outdated: 0
        },
        top_used_documents: []
      };
    }
  }

  // Additional helper method to get document by ID
  async getDocument(id: string): Promise<KnowledgeDocument | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  // Method to download file content
  async downloadFile(fileUrl: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }
}

export const directKnowledgeBaseService = new DirectKnowledgeBaseService();