// Knowledge Base Types

export type DocumentType = 'methodology' | 'case_study' | 'board_minutes' | 'client_data' | 'framework';
export type DocumentSource = 'upload' | 'generated' | 'meeting';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type FeedbackType = 'helpful' | 'not_relevant' | 'needs_update' | 'outdated';
export type UsageContext = 'roadmap' | 'sprint' | 'vision' | 'board_meeting';

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: DocumentType;
  category?: string;
  tags: string[];
  source: DocumentSource;
  client_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  processed_content?: string;
  summary?: string;
  key_insights?: Record<string, any>;
  metadata?: Record<string, any>;
  relevance_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relations
  chunks?: KnowledgeChunk[];
  sync_status?: KnowledgeSyncStatus;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding_id?: string;
  namespace?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface KnowledgeUsage {
  id: string;
  document_id: string;
  chunk_id?: string;
  used_in_context: UsageContext;
  client_id?: string;
  user_id?: string;
  query_text?: string;
  relevance_score?: number;
  feedback?: FeedbackType;
  feedback_notes?: string;
  created_at: string;
}

export interface KnowledgeSyncStatus {
  id: string;
  document_id: string;
  sync_status: SyncStatus;
  last_sync_at?: string;
  error_message?: string;
  chunks_synced: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadRequest {
  file: File;
  title: string;
  type: DocumentType;
  category?: string;
  tags?: string[];
  client_id?: string;
}

export interface DocumentProcessingResult {
  document_id: string;
  status: 'success' | 'partial' | 'failed';
  chunks_created: number;
  summary?: string;
  key_insights?: string[];
  error?: string;
}

export interface KnowledgeSearchParams {
  query: string;
  context?: UsageContext;
  client_id?: string;
  document_types?: DocumentType[];
  tags?: string[];
  limit?: number;
  include_global?: boolean;
}

export interface KnowledgeSearchResult {
  document_id: string;
  chunk_id?: string;
  title: string;
  content: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeAnalytics {
  total_documents: number;
  documents_by_type: Record<DocumentType, number>;
  usage_by_context: Record<UsageContext, number>;
  average_relevance_score: number;
  feedback_summary: {
    helpful: number;
    not_relevant: number;
    needs_update: number;
    outdated: number;
  };
  top_used_documents: Array<{
    document_id: string;
    title: string;
    usage_count: number;
    average_relevance: number;
  }>;
} 