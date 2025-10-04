export interface ChatMessage {
  id: string;
  portal_id: string;
  thread_id?: string;
  sender_id: string;
  sender_type: 'client' | 'accountant';
  content: string;
  attachments?: string[];
  read_by: string[];
  edited_at?: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  portal_id: string;
  title?: string;
  participants: string[];
  status: 'active' | 'archived' | 'closed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  role: 'client' | 'accountant';
  is_online: boolean;
  last_seen?: string;
}

export interface UploadFile {
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  chunks?: {
    uploaded: number;
    total: number;
  };
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 