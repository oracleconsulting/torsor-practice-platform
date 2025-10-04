import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  FolderOpen,
  Shield,
  Bell,
  Settings,
  LogOut,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Star
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ClientPortalHeader } from '../components/client-portal/ClientPortalHeader';
import { DocumentUploader } from '../components/client-portal/DocumentUploader';
import { DocumentBrowser } from '../components/client-portal/DocumentBrowser';
import { DocumentPreview } from '../components/client-portal/DocumentPreview';
import { ClientPortalSidebar } from '../components/client-portal/ClientPortalSidebar';
import { useClientPortal } from '../hooks/useClientPortal';
import { useClientAuth } from '../hooks/useClientAuth';
import { PortalDocument, DocumentCategory } from '../types/clientPortal';
import { supabase } from '../lib/supabase/client';

const ClientPortal: React.FC = () => {
  const { portalId } = useParams<{ portalId: string }>();
  const navigate = useNavigate();
  
  const { 
    client, 
    documents, 
    categories, 
    loading, 
    error,
    uploadDocument,
    deleteDocument,
    updateDocument,
    createCategory,
    getDocuments,
    searchDocuments
  } = useClientPortal(portalId);

  const { 
    isAuthenticated, 
    isTwoFactorVerified, 
    logout,
    requestTwoFactorCode,
    verifyTwoFactorCode 
  } = useClientAuth();

  const [activeTab, setActiveTab] = useState<'documents' | 'categories' | 'activity' | 'settings'>('documents');
  const [selectedDocument, setSelectedDocument] = useState<PortalDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Handle authentication
  useEffect(() => {
    const checkAuth = async () => {
      // First check JWT auth (custom auth from invitation system)
      const jwtToken = localStorage.getItem('client_auth_token');
      const clientData = localStorage.getItem('client_data');
      
      if (jwtToken && clientData) {
        // User authenticated via invitation system (JWT)
        try {
          const parsed = JSON.parse(clientData);
          
          // Verify this is the correct client for this portal
          if (parsed.id !== portalId) {
            // Redirect to their correct portal
            navigate(`/client-portal/${parsed.id}`);
            return;
          }
          
          // Load portal data
          if (portalId) {
            getDocuments();
          }
          return; // Exit early - user is authenticated via JWT
        } catch (error) {
          console.error('Error parsing client data:', error);
        }
      }
      
      // Fall back to Supabase auth check if no JWT
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // No auth at all - redirect to login
        navigate(`/client-portal/${portalId}/login`);
        return;
      }

      // Verify this is the correct client for this portal (Supabase auth)
      const userClientId = user.user_metadata?.client_id || user.user_metadata?.portal_id;
      if (userClientId !== portalId) {
        // Redirect to their correct portal
        navigate(`/client-portal/${userClientId}`);
        return;
      }

      // Skip 2FA check for now since it's not configured
      // if (!isTwoFactorVerified) {
      //   navigate(`/client-portal/${portalId}/2fa`);
      //   return;
      // }

      // Load portal data
      if (portalId) {
        getDocuments();
      }
    };

    checkAuth();
  }, [portalId, navigate, getDocuments]); // Remove isTwoFactorVerified from dependencies if not using

  // Custom logout handler for both JWT and Supabase auth
  const handleLogout = () => {
    // Clear JWT tokens
    localStorage.removeItem('client_auth_token');
    localStorage.removeItem('client_data');
    
    // Clear Supabase session if exists
    logout();
    
    // Redirect to login
    navigate('/client-portal/login');
  };

  const handleUpload = async (files: File[], category?: string) => {
    try {
      for (const file of files) {
        await uploadDocument(file, category);
      }
      toast.success(`${files.length} document(s) uploaded successfully`);
      setShowUploadModal(false);
    } catch (error) {
      toast.error('Failed to upload document(s)');
      console.error('Upload error:', error);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Delete error:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchDocuments(searchQuery);
    } else {
      await getDocuments();
    }
  };

  const handleDownload = async (doc: PortalDocument) => {
    try {
      // This would typically trigger a download from your API
      const response = await fetch(`/api/documents/download/${doc.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('client_auth_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Document downloaded successfully');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      toast.error('Failed to download document');
      console.error('Download error:', error);
    }
  };

  const handleDownloadForPreview = () => {
    if (selectedDocument) {
      handleDownload(selectedDocument);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.uploadedAt).getTime();
        bValue = new Date(b.uploadedAt).getTime();
        break;
      case 'size':
        aValue = a.fileSize;
        bValue = b.fileSize;
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Loading Client Portal...</h2>
          <p className="text-gray-600 mt-2">Please wait while we load your documents</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Portal Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <ClientPortalHeader 
        client={client}
        onLogout={handleLogout}
        notifications={[]}
        portalId={portalId || ''}
      />

      <div className="flex">
        {/* Sidebar */}
        <ClientPortalSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          documents={documents} // Add this line - pass the documents array
        />

        {/* Main Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'documents' && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Toolbar */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Documents
                    </button>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                      <option value="type">Type</option>
                    </select>
                    
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>

                  {/* Document Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Total Documents</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{documents.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Verified</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800 mt-1">
                        {documents.filter(d => d.verified).length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-800 mt-1">
                        {documents.filter(d => !d.verified).length}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">Categories</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-800 mt-1">{categories.length}</p>
                    </div>
                  </div>
                </div>

                {/* Document Browser */}
                <DocumentBrowser
                  documents={sortedDocuments}
                  onDocumentSelect={setSelectedDocument}
                  onDocumentDelete={handleDelete}
                  onDocumentPreview={(doc) => {
                    setSelectedDocument(doc);
                    setShowPreviewModal(true);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">Document Categories</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <h3 className="font-semibold text-gray-800">{category.name}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{documents.filter(d => d.category === category.id).length} documents</span>
                          <span>{category.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">Activity Log</h1>
                  <div className="space-y-4">
                    {/* Activity items would go here */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">Document "Financial Report Q1" uploaded</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">Portal Settings</h1>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Security Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600">Enhanced security for your account</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Not configured</span>
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <DocumentUploader
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUpload}
            categories={categories}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && selectedDocument && (
          <DocumentPreview
            document={selectedDocument}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedDocument(null);
            }}
            onDownload={handleDownloadForPreview}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientPortal;