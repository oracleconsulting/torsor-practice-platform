import { 
  ClientPortal, 
  PortalDocument, 
  DocumentCategory, 
  DocumentUploadRequest,
  DocumentSearchRequest,
  CategoryCreateRequest,
  ClientPortalStats,
  ClientLoginRequest,
  ClientLoginResponse,
  TwoFactorRequest,
  TwoFactorVerify,
  DocumentActionRequest,
  BulkDocumentAction,
  PortalNotification
} from '../types/clientPortal';

// API Configuration
const API_BASE_URL = 'https://oracle-api-server-production.up.railway.app/api';
const UPLOAD_CHUNK_SIZE = 1024 * 1024; // 1MB chunks

class ClientPortalApiService {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadSessionToken();
  }

  private loadSessionToken(): void {
    const storedSession = localStorage.getItem('clientPortalSession');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        this.sessionToken = session.sessionToken;
      } catch (error) {
        console.error('Error loading session token:', error);
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication Methods
  async login(request: ClientLoginRequest): Promise<ClientLoginResponse> {
    const response = await this.request<ClientLoginResponse>('/client-portal/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    if (response.sessionToken) {
      this.sessionToken = response.sessionToken;
    }
    
    return response;
  }

  async requestTwoFactorCode(request: TwoFactorRequest): Promise<void> {
    await this.request('/client-portal/2fa/request', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async verifyTwoFactorCode(request: TwoFactorVerify): Promise<void> {
    const response = await this.request<{ sessionToken: string }>('/client-portal/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    if (response.sessionToken) {
      this.sessionToken = response.sessionToken;
    }
  }

  async logout(): Promise<void> {
    if (this.sessionToken) {
      await this.request('/client-portal/logout', {
        method: 'POST',
      });
    }
    this.sessionToken = null;
    localStorage.removeItem('clientPortalSession');
  }

  // Portal Management
  async getClientPortal(portalId: string): Promise<ClientPortal> {
    return this.request<ClientPortal>(`/client-portal/${portalId}`);
  }

  async getPortalStats(portalId: string): Promise<ClientPortalStats> {
    return this.request<ClientPortalStats>(`/client-portal/${portalId}/stats`);
  }

  async inviteClient(portalId: string, inviteData: {
    email: string;
    name: string;
    role: 'client' | 'viewer' | 'editor' | 'admin';
    message?: string;
    sendWelcomeEmail?: boolean;
    setPassword?: boolean;
  }): Promise<{
    status: 'success' | 'error';
    message: string;
    data?: {
      invite_id: string;
      invite_url: string;
      expires_at: string;
    };
  }> {
    return this.request(`/client-portal/${portalId}/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  }

  async getPortalClients(portalId: string): Promise<{
    clients: Array<{
      id: string;
      email: string;
      name: string;
      role: 'client' | 'viewer' | 'editor' | 'admin';
      created_at: string;
      last_login?: string;
      status: 'active' | 'inactive' | 'pending';
      document_count: number;
      last_activity?: string;
    }>;
    total: number;
  }> {
    return this.request(`/client-portal/${portalId}/clients`);
  }

  // Document Management
  async getDocuments(portalId: string, params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ documents: PortalDocument[]; total: number; page: number; pageSize: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request(`/client-portal/${portalId}/documents?${searchParams.toString()}`);
  }

  async searchDocuments(portalId: string, request: DocumentSearchRequest): Promise<{
    documents: PortalDocument[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return this.request(`/client-portal/${portalId}/documents/search`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async uploadDocument(
    portalId: string,
    file: File,
    category?: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<PortalDocument> {
    // Generate file checksum
    const checksum = await this.generateFileChecksum(file);
    
    // Create upload session
    const uploadSession = await this.request<{
      uploadId: string;
      chunks: number;
      chunkSize: number;
    }>(`/client-portal/${portalId}/documents/upload/init`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        checksum,
        category,
        description,
      }),
    });

    // Upload file in chunks
    const chunks = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
    let uploadedChunks = 0;

    for (let i = 0; i < chunks; i++) {
      const start = i * UPLOAD_CHUNK_SIZE;
      const end = Math.min(start + UPLOAD_CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      await this.uploadChunk(portalId, uploadSession.uploadId, i, chunk);
      
      uploadedChunks++;
      if (onProgress) {
        onProgress((uploadedChunks / chunks) * 100);
      }
    }

    // Complete upload
    return this.request<PortalDocument>(`/client-portal/${portalId}/documents/upload/complete`, {
      method: 'POST',
      body: JSON.stringify({
        uploadId: uploadSession.uploadId,
      }),
    });
  }

  private async uploadChunk(
    portalId: string,
    uploadId: string,
    chunkIndex: number,
    chunk: Blob
  ): Promise<void> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());

    await this.request(`/client-portal/${portalId}/documents/upload/chunk/${uploadId}`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  private async generateFileChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async downloadDocument(portalId: string, documentId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/client-portal/${portalId}/documents/${documentId}/download`, {
      headers: {
        'Authorization': `Bearer ${this.sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async deleteDocument(portalId: string, documentId: string): Promise<void> {
    await this.request(`/client-portal/${portalId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async updateDocument(
    portalId: string,
    documentId: string,
    updates: Partial<PortalDocument>
  ): Promise<PortalDocument> {
    return this.request<PortalDocument>(`/client-portal/${portalId}/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async bulkAction(portalId: string, action: BulkDocumentAction): Promise<void> {
    await this.request(`/client-portal/${portalId}/documents/bulk`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
  }

  // Category Management
  async getCategories(portalId: string): Promise<DocumentCategory[]> {
    return this.request<DocumentCategory[]>(`/client-portal/${portalId}/categories`);
  }

  async createCategory(portalId: string, category: CategoryCreateRequest): Promise<DocumentCategory> {
    return this.request<DocumentCategory>(`/client-portal/${portalId}/categories`, {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    portalId: string,
    categoryId: string,
    updates: Partial<DocumentCategory>
  ): Promise<DocumentCategory> {
    return this.request<DocumentCategory>(`/client-portal/${portalId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCategory(portalId: string, categoryId: string): Promise<void> {
    await this.request(`/client-portal/${portalId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(portalId: string): Promise<PortalNotification[]> {
    return this.request<PortalNotification[]>(`/client-portal/${portalId}/notifications`);
  }

  async markNotificationAsRead(portalId: string, notificationId: string): Promise<void> {
    await this.request(`/client-portal/${portalId}/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  // Document Versioning
  async getDocumentVersions(portalId: string, documentId: string): Promise<PortalDocument[]> {
    return this.request<PortalDocument[]>(`/client-portal/${portalId}/documents/${documentId}/versions`);
  }

  async createDocumentVersion(
    portalId: string,
    documentId: string,
    file: File,
    description?: string
  ): Promise<PortalDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.request<PortalDocument>(`/client-portal/${portalId}/documents/${documentId}/versions`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Advanced Search (OCR)
  async searchDocumentsOCR(
    portalId: string,
    query: string,
    options?: {
      includeOCR?: boolean;
      searchInContent?: boolean;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<{
    documents: PortalDocument[];
    total: number;
    highlights: Record<string, string[]>; // documentId -> highlighted snippets
  }> {
    return this.request(`/client-portal/${portalId}/documents/search/ocr`, {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
  }

  // Collaborative Editing
  async getDocumentCollaborators(portalId: string, documentId: string): Promise<{
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: 'viewer' | 'editor' | 'admin';
      lastActive: string;
    }>;
  }> {
    return this.request(`/client-portal/${portalId}/documents/${documentId}/collaborators`);
  }

  async addDocumentCollaborator(
    portalId: string,
    documentId: string,
    email: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<void> {
    await this.request(`/client-portal/${portalId}/documents/${documentId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async removeDocumentCollaborator(
    portalId: string,
    documentId: string,
    userId: string
  ): Promise<void> {
    await this.request(`/client-portal/${portalId}/documents/${documentId}/collaborators/${userId}`, {
      method: 'DELETE',
    });
  }

  // Audit Logging
  async getAuditLogs(
    portalId: string,
    params?: {
      action?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    logs: Array<{
      id: string;
      action: string;
      userId: string;
      userType: string;
      resourceType: string;
      resourceId?: string;
      metadata: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return this.request(`/client-portal/${portalId}/audit-logs?${searchParams.toString()}`);
  }

  // External Service Integrations
  async integrateWithExternalService(
    portalId: string,
    service: 'dropbox' | 'google-drive' | 'onedrive' | 'box',
    action: 'connect' | 'disconnect' | 'sync'
  ): Promise<{
    status: 'success' | 'error';
    message: string;
    data?: any;
  }> {
    return this.request(`/client-portal/${portalId}/integrations/${service}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // Automated Categorization
  async categorizeDocument(
    portalId: string,
    documentId: string
  ): Promise<{
    suggestedCategory: string;
    confidence: number;
    alternatives: Array<{
      categoryId: string;
      confidence: number;
    }>;
  }> {
    return this.request(`/client-portal/${portalId}/documents/${documentId}/categorize`, {
      method: 'POST',
    });
  }

  // Rate Limiting and Security
  async checkRateLimit(): Promise<{
    remaining: number;
    reset: number;
    limit: number;
  }> {
    const response = await fetch(`${this.baseUrl}/rate-limit/check`, {
      headers: {
        'Authorization': `Bearer ${this.sessionToken}`,
      },
    });

    return {
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
      reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
      limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
    };
  }

  // Health Check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'up' | 'down'>;
    timestamp: string;
  }> {
    return this.request('/health');
  }

  // Cloud Sync Integration Methods
  async startCloudAuth(portalId: string, provider: 'microsoft' | 'google'): Promise<{ auth_url: string; state: string; provider: string }> {
    return this.request(`/cloud-sync/auth/${provider}?portal_id=${portalId}`, {
      method: 'GET',
    });
  }

  async configureSync(config: {
    portal_id: string;
    provider: string;
    folder_mapping: Record<string, string>;
    direction: 'upload' | 'download' | 'bidirectional';
    file_types: string[];
    max_file_size: number;
    auto_sync: boolean;
    sync_interval: number;
    include_subfolders: boolean;
  }): Promise<{ status: string; message: string; config: any }> {
    return this.request('/cloud-sync/configure', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async startSync(portalId: string, provider: string): Promise<{
    status: string;
    result: {
      files_processed: number;
      files_synced: number;
      files_failed: number;
      error_message?: string;
      sync_time?: string;
    };
  }> {
    return this.request(`/cloud-sync/sync/${portalId}?provider=${provider}`, {
      method: 'POST',
    });
  }

  async getSyncStatus(portalId: string, provider: string): Promise<{
    status: string;
    last_sync?: string;
    connected_at?: string;
    sync_config?: any;
  }> {
    return this.request(`/cloud-sync/status/${portalId}?provider=${provider}`, {
      method: 'GET',
    });
  }

  async listFolders(provider: string, portalId: string): Promise<{ folders: Array<{ id: string; name: string; type: string; path?: string; parent_id?: string }> }> {
    return this.request(`/cloud-sync/folders/${provider}?portal_id=${portalId}`, {
      method: 'GET',
    });
  }

  async disconnectIntegration(portalId: string, provider: string): Promise<{ status: string; message: string }> {
    return this.request(`/cloud-sync/disconnect/${portalId}?provider=${provider}`, {
      method: 'DELETE',
    });
  }

  async listIntegrations(portalId: string): Promise<{
    integrations: Array<{
      id: string;
      service: string;
      status: string;
      last_sync?: string;
      connected_at?: string;
      sync_config?: any;
    }>;
  }> {
    return this.request(`/cloud-sync/integrations/${portalId}`, {
      method: 'GET',
    });
  }
}

// Create singleton instance
export const clientPortalApi = new ClientPortalApiService();

// Export for testing
export { ClientPortalApiService }; 