// src/hooks/useClientPortal.ts
// Complete Client Portal Hook with Authentication and Error Handling - Fixed Version

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { 
  ClientPortal, 
  PortalDocument, 
  DocumentCategory, 
  DocumentUploadRequest,
  DocumentSearchRequest,
  CategoryCreateRequest,
  ClientPortalStats,
  PortalSettings,
  PortalBranding,
  PortalClient,
  PortalNotification
} from '../types/clientPortal';

interface UseClientPortalReturn {
  // Portal data
  client: ClientPortal | null;
  documents: PortalDocument[];
  categories: DocumentCategory[];
  stats: ClientPortalStats | null;
  clients: PortalClient[];
  notifications: PortalNotification[];
  
  // State
  loading: boolean;
  error: string | null;
  uploadProgress: number | null;
  
  // Document operations
  uploadDocument: (file: File, category?: string, description?: string, tags?: string[]) => Promise<PortalDocument>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<PortalDocument>) => Promise<PortalDocument>;
  downloadDocument: (documentId: string) => Promise<void>;
  verifyDocument: (documentId: string) => Promise<void>;
  shareDocument: (documentId: string, emails: string[]) => Promise<void>;
  
  // Category operations
  createCategory: (category: CategoryCreateRequest) => Promise<DocumentCategory>;
  updateCategory: (categoryId: string, updates: Partial<DocumentCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  // Search and filtering
  searchDocuments: (query: string) => Promise<void>;
  filterDocuments: (filters: DocumentSearchRequest) => Promise<void>;
  
  // Portal operations
  getDocuments: () => Promise<void>;
  getCategories: () => Promise<void>;
  getStats: () => Promise<void>;
  getClients: () => Promise<void>;
  getNotifications: (unreadOnly?: boolean) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  
  // Settings and branding
  updateSettings: (settings: PortalSettings) => Promise<void>;
  updateBranding: (branding: PortalBranding) => Promise<void>;
  
  // Client management
  inviteClient: (email: string, name: string, message?: string) => Promise<{ inviteUrl: string }>;
  removeClient: (clientId: string) => Promise<void>;
  
  // Refresh data
  refreshAll: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useClientPortal = (portalId?: string): UseClientPortalReturn => {
  // Get auth context
  const { user } = useAuth();
  
  // State management
  const [client, setClient] = useState<ClientPortal | null>(null);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [stats, setStats] = useState<ClientPortalStats | null>(null);
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Add refs to track loading state
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  // Get the auth token for API calls
  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession?.access_token) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        return refreshedSession.access_token;
      }
      
      return session.access_token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw error;
    }
  };

  // Fetch client portal information
  const getClient = useCallback(async () => {
    if (!portalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First, get the client data from Supabase
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', portalId)
        .single();

      if (clientError) {
        console.error('Error fetching client from Supabase:', clientError);
        // Don't throw, continue with defaults
      }

      // Try to get portal information from API
      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/api/client-portal/${portalId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let portalData = {};
        if (response.ok) {
          portalData = await response.json();
        } else if (response.status === 404) {
          console.log('Portal endpoint not available, using defaults');
        }

        // Build the client portal object with fallbacks
        const clientPortal: ClientPortal = {
          id: portalId,
          groupId: clientData?.practice_id || 'default',
          clientId: clientData?.id || portalId,
          clientName: clientData?.name || 'Client',
          clientEmail: clientData?.email || user?.email || '',
          portalUrl: `/client-portal/${portalId}`,
          branding: portalData.branding || {
            companyName: clientData?.name || 'Your Company',
            welcomeMessage: `Welcome to your secure document portal`,
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            logoUrl: clientData?.logo_url
          },
          settings: portalData.settings || {
            allowDocumentUpload: true,
            allowDocumentDownload: true,
            requireApproval: false,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png'],
            autoCategorization: true,
            notifications: {
              email: true,
              sms: false,
              frequency: 'immediate',
              events: ['document_uploaded', 'document_verified']
            }
          },
          isActive: clientData?.is_active !== false,
          twoFactorEnabled: clientData?.two_factor_enabled || false,
          createdAt: clientData?.created_at || new Date().toISOString(),
          updatedAt: clientData?.updated_at || clientData?.created_at || new Date().toISOString()
        };

        setClient(clientPortal);
      } catch (apiError) {
        console.error('Error fetching portal data:', apiError);
        // Still set client with basic data
        setClient({
          id: portalId,
          groupId: 'default',
          clientId: portalId,
          clientName: 'Client Portal',
          clientEmail: user?.email || '',
          portalUrl: `/client-portal/${portalId}`,
          branding: {
            companyName: 'Your Company',
            welcomeMessage: 'Welcome to your secure document portal',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          },
          settings: {
            allowDocumentUpload: true,
            allowDocumentDownload: true,
            requireApproval: false,
            maxFileSize: 10 * 1024 * 1024,
            allowedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png'],
            autoCategorization: true,
            notifications: {
              email: true,
              sms: false,
              frequency: 'immediate',
              events: ['document_uploaded', 'document_verified']
            }
          },
          isActive: true,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load client portal';
      console.error('Error loading client:', err);
      // Don't set error for expected failures
    } finally {
      setLoading(false);
    }
  }, [portalId, user?.email]);

  // Fetch documents from the API
  const getDocuments = useCallback(async () => {
    if (!portalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token and retry
          const newToken = await getAuthToken();
          const retryResponse = await fetch(`${API_URL}/api/client-portal/${portalId}/documents`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!retryResponse.ok) {
            if (retryResponse.status === 404) {
              console.log('Documents endpoint not available');
              setDocuments([]);
              return;
            }
            throw new Error(`Failed to fetch documents: ${retryResponse.statusText}`);
          }
          
          const retryData = await retryResponse.json();
          setDocuments(retryData.documents || []);
          return;
        }
        
        if (response.status === 404) {
          console.log('Documents endpoint not available');
          setDocuments([]);
          return;
        }
        
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      console.error('Error loading documents:', err);
      // Don't set error for 404s
      if (!err.message?.includes('404')) {
        setError(errorMessage);
      }
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [portalId]);

  // Fetch categories
  const getCategories = useCallback(async () => {
    if (!portalId) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Categories endpoint not available, using defaults');
          // Set default categories
          setCategories([
            {
              id: 'financial',
              portalId: portalId,
              name: 'Financial Documents',
              description: 'Tax returns, financial statements, and accounting records',
              type: 'financial',
              color: '#10B981',
              sortOrder: 1,
              createdAt: new Date().toISOString()
            },
            {
              id: 'tax',
              portalId: portalId,
              name: 'Tax Documents',
              description: 'Tax returns and related documents',
              type: 'tax',
              color: '#3B82F6',
              sortOrder: 2,
              createdAt: new Date().toISOString()
            },
            {
              id: 'compliance',
              portalId: portalId,
              name: 'Compliance',
              description: 'Regulatory and compliance documents',
              type: 'compliance',
              color: '#F59E0B',
              sortOrder: 3,
              createdAt: new Date().toISOString()
            },
            {
              id: 'contracts',
              portalId: portalId,
              name: 'Contracts',
              description: 'Legal agreements and contracts',
              type: 'legal',
              color: '#8B5CF6',
              sortOrder: 4,
              createdAt: new Date().toISOString()
            },
            {
              id: 'other',
              portalId: portalId,
              name: 'Other',
              description: 'Miscellaneous documents',
              type: 'operational',
              color: '#6B7280',
              sortOrder: 5,
              createdAt: new Date().toISOString()
            }
          ]);
          return;
        }
        
        if (response.status === 401) {
          // Try refresh and retry
          await supabase.auth.refreshSession();
          const newToken = await getAuthToken();
          const retryResponse = await fetch(`${API_URL}/api/client-portal/${portalId}/categories`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setCategories(retryData.categories || []);
            return;
          }
        }
        
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      // Set default categories on any error
      setCategories([
        {
          id: 'financial',
          portalId: portalId,
          name: 'Financial Documents',
          description: 'Tax returns, financial statements, and accounting records',
          type: 'financial',
          color: '#10B981',
          sortOrder: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 'other',
          portalId: portalId,
          name: 'Other',
          description: 'Miscellaneous documents',
          type: 'operational',
          color: '#6B7280',
          sortOrder: 2,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [portalId]);

  // Get portal statistics
  const getStats = useCallback(async () => {
    if (!portalId) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 404) {
        // If stats endpoint doesn't exist, don't treat as error
        console.log('Stats endpoint not available');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [portalId]);

  // Upload document
  const uploadDocument = useCallback(async (
    file: File, 
    category: string = 'other',
    description?: string,
    tags?: string[]
  ): Promise<PortalDocument> => {
    if (!portalId) throw new Error('Portal ID required');
    
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const token = await getAuthToken();
      
      // Validate file
      const maxSize = client?.settings.maxFileSize || 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
      }
      
      const allowedTypes = client?.settings.allowedFileTypes || ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(`File type ${fileExtension} not allowed`);
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (description) {
        formData.append('description', description);
      }
      if (tags && tags.length > 0) {
        formData.append('tags', tags.join(','));
      }
      
      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', async () => {
          setUploadProgress(null);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const newDocument = data.document;
              
              setDocuments(prev => [newDocument, ...prev]);
              toast.success('Document uploaded successfully');
              
              // Refresh stats
              await getStats();
              
              resolve(newDocument);
            } catch (err) {
              reject(new Error('Failed to parse upload response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          setUploadProgress(null);
          reject(new Error('Upload failed'));
        });
        
        xhr.open('POST', `${API_URL}/api/client-portal/${portalId}/documents/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }, [portalId, client, getStats]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    if (!portalId) throw new Error('Portal ID required');
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
      
      // Refresh stats
      await getStats();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [portalId, getStats]);

  // Update document
  const updateDocument = useCallback(async (
    documentId: string, 
    updates: Partial<PortalDocument>
  ): Promise<PortalDocument> => {
    if (!portalId) throw new Error('Portal ID required');
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }
      
      const data = await response.json();
      const updatedDocument = data.document;
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? updatedDocument : doc
      ));
      
      toast.success('Document updated successfully');
      return updatedDocument;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [portalId]);

  // Download document
  const downloadDocument = useCallback(async (documentId: string): Promise<void> => {
    if (!portalId) throw new Error('Portal ID required');
    
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/api/client-portal/${portalId}/documents/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      // Get filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'document';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to download document';
      toast.error(errorMsg);
      throw err;
    }
  }, [portalId]);

  // Verify document (accountants only)
  const verifyDocument = useCallback(async (documentId: string): Promise<void> => {
    if (!portalId) throw new Error('Portal ID required');
    
    try {
      await updateDocument(documentId, { verified: true });
      toast.success('Document verified successfully');
    } catch (err) {
      throw err;
    }
  }, [portalId, updateDocument]);

  // Share document
  const shareDocument = useCallback(async (documentId: string, emails: string[]): Promise<void> => {
    if (!portalId) throw new Error('Portal ID required');
    
    // This would need backend implementation
    toast.info('Document sharing coming soon');
  }, [portalId]);

  // Create category
  const createCategory = useCallback(async (category: CategoryCreateRequest): Promise<DocumentCategory> => {
    if (!portalId) throw new Error('Portal ID required');
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      
      const data = await response.json();
      const newCategory = data.category;
      
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category created successfully');
      
      return newCategory;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [portalId]);

  // Update category
  const updateCategory = useCallback(async (categoryId: string, updates: Partial<DocumentCategory>): Promise<void> => {
    // This would need backend implementation
    toast.info('Category update coming soon');
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    // This would need backend implementation
    toast.info('Category deletion coming soon');
  }, []);

  // Search documents
  const searchDocuments = useCallback(async (query: string): Promise<void> => {
    if (!portalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/documents/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Failed to search documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError('Failed to search documents');
      console.error('Error searching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [portalId]);

  // Filter documents
  const filterDocuments = useCallback(async (filters: DocumentSearchRequest): Promise<void> => {
    if (!portalId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/documents/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error('Failed to filter documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError('Failed to filter documents');
      console.error('Error filtering documents:', err);
    } finally {
      setLoading(false);
    }
  }, [portalId]);

  // Get portal clients (accountants only)
  const getClients = useCallback(async () => {
    if (!portalId) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else if (response.status === 404) {
        console.log('Clients endpoint not available');
        setClients([]);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
      setClients([]);
    }
  }, [portalId]);

  // Get notifications
  const getNotifications = useCallback(async (unreadOnly: boolean = false) => {
    if (!portalId) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/api/client-portal/${portalId}/notifications?unread_only=${unreadOnly}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (response.status === 404) {
        console.log('Notifications endpoint not available');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
    }
  }, [portalId]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!portalId) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_URL}/api/client-portal/${portalId}/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [portalId]);

  // Update portal settings (accountants only)
  const updateSettings = useCallback(async (settings: PortalSettings): Promise<void> => {
    if (!portalId) throw new Error('Portal ID required');
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      setClient(prev => prev ? { ...prev, settings } : null);
      toast.success('Settings updated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update settings';
      toast.error(errorMsg);
      throw err;
    }
  }, [portalId]);

  // Update portal branding (accountants only)
  const updateBranding = useCallback(async (branding: PortalBranding): Promise<void> => {
    if (!portalId) throw new Error('Portal ID required');
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/branding`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(branding)
      });

      if (!response.ok) {
        throw new Error('Failed to update branding');
      }
      
      setClient(prev => prev ? { ...prev, branding } : null);
      toast.success('Branding updated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update branding';
      toast.error(errorMsg);
      throw err;
    }
  }, [portalId]);

  // Invite client (accountants only)
  const inviteClient = useCallback(async (
    email: string, 
    name: string, 
    message?: string
  ): Promise<{ inviteUrl: string }> => {
    if (!portalId) throw new Error('Portal ID required');
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/client-portal/${portalId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name,
          message,
          role: 'client',
          send_welcome_email: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to invite client');
      }
      
      const data = await response.json();
      toast.success('Client invited successfully');
      
      // Refresh clients list
      await getClients();
      
      return { inviteUrl: data.data.invite_url };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to invite client';
      toast.error(errorMsg);
      throw err;
    }
  }, [portalId, getClients]);

  // Remove client (accountants only)
  const removeClient = useCallback(async (clientId: string): Promise<void> => {
    // This would need backend implementation
    toast.info('Client removal coming soon');
  }, []);

  // Refresh all data - prevent concurrent calls
  const refreshAll = useCallback(async () => {
    if (!portalId || loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      // Load data in parallel but handle failures gracefully
      await Promise.allSettled([
        getClient(),
        getDocuments(),
        getCategories(),
        getStats(),
        getClients(),
        getNotifications()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [portalId, getClient, getDocuments, getCategories, getStats, getClients, getNotifications]);

  // Load initial data - fix the infinite loop
  useEffect(() => {
    if (portalId && user && !hasLoadedRef.current && !loadingRef.current) {
      hasLoadedRef.current = true;
      refreshAll();
    }
  }, [portalId, user]); // Remove refreshAll from dependencies

  // Reset when portal ID changes
  useEffect(() => {
    if (portalId) {
      hasLoadedRef.current = false;
      setClient(null);
      setDocuments([]);
      setCategories([]);
      setStats(null);
      setClients([]);
      setNotifications([]);
    }
  }, [portalId]);

  // Return the hook interface
  return {
    // Portal data
    client,
    documents,
    categories,
    stats,
    clients,
    notifications,
    
    // State
    loading,
    error,
    uploadProgress,
    
    // Document operations
    uploadDocument,
    deleteDocument,
    updateDocument,
    downloadDocument,
    verifyDocument,
    shareDocument,
    
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Search and filtering
    searchDocuments,
    filterDocuments,
    
    // Portal operations
    getDocuments,
    getCategories,
    getStats,
    getClients,
    getNotifications,
    markNotificationRead,
    
    // Settings and branding
    updateSettings,
    updateBranding,
    
    // Client management
    inviteClient,
    removeClient,
    
    // Refresh data
    refreshAll
  };
};