export interface ClientPortal {
  id: string;
  groupId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  portalUrl: string;
  branding: PortalBranding;
  settings: PortalSettings;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  welcomeMessage?: string;
}

export interface PortalSettings {
  allowDocumentUpload: boolean;
  allowDocumentDownload: boolean;
  requireApproval: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  autoCategorization: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  events: string[];
}

export interface PortalDocument {
  id: string;
  portalId: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  fileSize: number;
  filePath: string;
  encryptionKey: string;
  checksum: string;
  version: number;
  uploadedBy: string;
  uploadedByType: 'client' | 'admin' | 'system';
  expiryDate?: string;
  metadata: Record<string, any>;
  isDeleted: boolean;
  verified: boolean;
  uploadedAt: string;
  updatedAt: string;
  accessLevel?: 'standard' | 'restricted' | 'confidential';
  encrypted?: boolean;
  previewUrl?: string;
  thumbnailUrl?: string;
  pageCount?: number;
}

export interface DocumentCategory {
  id: string;
  portalId: string;
  name: string;
  description?: string;
  type: 'financial' | 'legal' | 'operational' | 'compliance' | 'other';
  color: string;
  icon?: string;
  sortOrder: number;
  createdAt: string;
}

export interface PortalPermission {
  id: string;
  portalId: string;
  userId: string;
  userType: 'client' | 'admin' | 'viewer';
  permissionLevel: 'read' | 'write' | 'admin';
  folderPermissions: Record<string, string[]>;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface PortalAuditLog {
  id: string;
  portalId: string;
  userId: string;
  userType: 'client' | 'admin' | 'system';
  action: string;
  resourceType: 'document' | 'category' | 'permission' | 'portal';
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ClientSession {
  id: string;
  portalId: string;
  clientEmail: string;
  sessionToken: string;
  twoFactorCode?: string;
  twoFactorExpiresAt?: string;
  isVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface DocumentUploadRequest {
  files: File[];
  category?: string;
  description?: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
}

export interface DocumentSearchRequest {
  query: string;
  category?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  verified?: boolean;
}

export interface DocumentSearchResponse {
  documents: PortalDocument[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  type: DocumentCategory['type'];
  color: string;
  icon?: string;
  sortOrder?: number;
}

export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest> {
  id: string;
}

export interface PortalNotification {
  id: string;
  portalId: string;
  type: 'document_uploaded' | 'document_verified' | 'document_expiring' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ClientPortalStats {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  totalCategories: number;
  recentActivity: PortalAuditLog[];
  storageUsed: number;
  storageLimit: number;
}

export interface TwoFactorRequest {
  email: string;
  portalId: string;
}

export interface TwoFactorVerify {
  email: string;
  portalId: string;
  code: string;
  sessionToken: string;
}

export interface ClientLoginRequest {
  email: string;
  portalId: string;
  password?: string;
}

export interface ClientLoginResponse {
  sessionToken: string;
  requiresTwoFactor: boolean;
  client: ClientPortal;
}

export interface DocumentPreviewData {
  document: PortalDocument;
  previewUrl?: string;
  thumbnailUrl?: string;
  canDownload: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface DocumentActionRequest {
  documentId: string;
  action: 'download' | 'preview' | 'delete' | 'verify' | 'update';
  metadata?: Record<string, any>;
}

export interface BulkDocumentAction {
  documentIds: string[];
  action: 'delete' | 'move' | 'verify' | 'download';
  targetCategory?: string;
  metadata?: Record<string, any>;
}

export interface DocumentRequestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  required_fields: Record<string, any>;
  default_priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
}

export interface DocumentRequest {
  template_id?: string;
  custom_request?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DocumentRequestResponse {
  id: string;
  portal_id: string;
  client_id: string;
  template_id?: string;
  custom_request?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  completed_at?: string;
  created_at: string;
}
