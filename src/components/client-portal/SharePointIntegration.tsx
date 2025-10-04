import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Link, 
  Unlink, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  ExternalLink,
  Folder,
  File,
  Database,
  Shield,
  Zap,
  Users,
  Activity,
  Microsoft,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  Share
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { clientPortalApi } from '../services/clientPortalApi';
import { toast } from 'sonner';

interface SharePointFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  created: string;
  path: string;
  webUrl: string;
  thumbnailUrl?: string;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
  };
}

interface SharePointSite {
  id: string;
  name: string;
  url: string;
  description?: string;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

interface SharePointIntegrationProps {
  portalId: string;
  onClose: () => void;
}

export const SharePointIntegration: React.FC<SharePointIntegrationProps> = ({
  portalId,
  onClose
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sites, setSites] = useState<SharePointSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(null);
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'folders'>('all');
  const [currentPath, setCurrentPath] = useState('/');
  const [syncStatus, setSyncStatus] = useState({
    totalFiles: 0,
    syncedFiles: 0,
    failedFiles: 0,
    lastSyncTime: null as string | null
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 30, // minutes
    includeSubfolders: true,
    fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    syncDeletedFiles: false
  });

  useEffect(() => {
    checkConnection();
    loadSites();
  }, [portalId]);

  const checkConnection = async () => {
    try {
      const response = await clientPortalApi.checkSharePointConnection(portalId);
      setIsConnected(response.connected);
      if (response.connected) {
        setSyncStatus(response.syncStatus || syncStatus);
      }
    } catch (error) {
      console.error('Error checking SharePoint connection:', error);
    }
  };

  const loadSites = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const response = await clientPortalApi.getSharePointSites(portalId);
      setSites(response.sites || []);
      if (response.sites && response.sites.length > 0) {
        setSelectedSite(response.sites[0]);
        loadFiles(response.sites[0].id, '/');
      }
    } catch (error) {
      console.error('Error loading SharePoint sites:', error);
      toast.error('Failed to load SharePoint sites');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (siteId: string, path: string) => {
    setLoading(true);
    try {
      const response = await clientPortalApi.getSharePointFiles(portalId, siteId, path);
      setFiles(response.files || []);
      setCurrentPath(path);
    } catch (error) {
      console.error('Error loading SharePoint files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await clientPortalApi.connectSharePoint(portalId);
      if (response.success) {
        setIsConnected(true);
        toast.success('SharePoint connected successfully!');
        loadSites();
      } else {
        toast.error(response.message || 'Failed to connect to SharePoint');
      }
    } catch (error) {
      console.error('Error connecting to SharePoint:', error);
      toast.error('Failed to connect to SharePoint');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect SharePoint? This will stop all synchronization.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await clientPortalApi.disconnectSharePoint(portalId);
      if (response.success) {
        setIsConnected(false);
        setSites([]);
        setFiles([]);
        setSelectedSite(null);
        toast.success('SharePoint disconnected successfully');
      } else {
        toast.error(response.message || 'Failed to disconnect SharePoint');
      }
    } catch (error) {
      console.error('Error disconnecting SharePoint:', error);
      toast.error('Failed to disconnect SharePoint');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedSite) return;
    
    setSyncing(true);
    try {
      const response = await clientPortalApi.syncSharePointFiles(portalId, selectedSite.id, {
        path: currentPath,
        includeSubfolders: settings.includeSubfolders,
        fileTypes: settings.fileTypes,
        maxFileSize: settings.maxFileSize
      });
      
      if (response.success) {
        setSyncStatus(response.syncStatus);
        toast.success('SharePoint files synchronized successfully!');
        loadFiles(selectedSite.id, currentPath);
      } else {
        toast.error(response.message || 'Failed to sync files');
      }
    } catch (error) {
      console.error('Error syncing SharePoint files:', error);
      toast.error('Failed to sync files');
    } finally {
      setSyncing(false);
    }
  };

  const handleFileSelect = async (file: SharePointFile) => {
    if (file.type === 'folder') {
      loadFiles(selectedSite!.id, file.path);
    } else {
      // Handle file selection - could open preview, download, etc.
      toast.info(`Selected: ${file.name}`);
    }
  };

  const handleFileDownload = async (file: SharePointFile) => {
    try {
      const response = await clientPortalApi.downloadSharePointFile(portalId, selectedSite!.id, file.id);
      // Handle file download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!selectedSite) return;
    
    setLoading(true);
    try {
      const uploadPromises = Array.from(files).map(file => 
        clientPortalApi.uploadToSharePoint(portalId, selectedSite.id, file, currentPath)
      );
      
      await Promise.all(uploadPromises);
      toast.success('Files uploaded successfully!');
      loadFiles(selectedSite.id, currentPath);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  const getFileIcon = (file: SharePointFile) => {
    if (file.type === 'folder') return <Folder className="w-5 h-5 text-blue-500" />;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <File className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx': return <File className="w-5 h-5 text-blue-500" />;
      case 'xls':
      case 'xlsx': return <File className="w-5 h-5 text-green-500" />;
      case 'ppt':
      case 'pptx': return <File className="w-5 h-5 text-orange-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Microsoft className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">SharePoint Integration</h2>
              <p className="text-sm text-gray-500">Connect and manage SharePoint files</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  disabled={loading}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link className="w-4 h-4 mr-2" />
                Connect SharePoint
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
            >
              <span className="sr-only">Close</span>
              <span className="text-2xl">&times;</span>
            </Button>
          </div>
        </div>

        {!isConnected ? (
          <div className="p-12 text-center">
            <Microsoft className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Connect to SharePoint</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Connect your SharePoint account to sync files and folders with your client portal.
              You'll be redirected to Microsoft to authorize access.
            </p>
            <Button
              onClick={handleConnect}
              disabled={loading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Microsoft className="w-5 h-5 mr-2" />
              )}
              Connect SharePoint Account
            </Button>
          </div>
        ) : (
          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              {/* Sites */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">SharePoint Sites</h3>
                <div className="space-y-2">
                  {sites.map(site => (
                    <button
                      key={site.id}
                      onClick={() => {
                        setSelectedSite(site);
                        loadFiles(site.id, '/');
                      }}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                        selectedSite?.id === site.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{site.name}</div>
                      <div className="text-xs text-gray-500 truncate">{site.url}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Status */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Sync Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Files:</span>
                    <span className="font-medium">{syncStatus.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Synced:</span>
                    <span className="font-medium text-green-600">{syncStatus.syncedFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{syncStatus.failedFiles}</span>
                  </div>
                  {syncStatus.lastSyncTime && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleSync}
                  disabled={syncing || !selectedSite}
                  className="w-full mt-3"
                  size="sm"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>

              {/* Settings */}
              <div className="p-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Settings</h3>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Sync
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Items</option>
                      <option value="files">Files Only</option>
                      <option value="folders">Folders Only</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="sharepoint-upload"
                    />
                    <label htmlFor="sharepoint-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                
                {/* Breadcrumb */}
                <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                  <span>Path:</span>
                  {currentPath.split('/').filter(Boolean).map((segment, index) => (
                    <React.Fragment key={index}>
                      <button
                        onClick={() => {
                          const path = '/' + currentPath.split('/').slice(1, index + 2).join('/');
                          loadFiles(selectedSite!.id, path);
                        }}
                        className="hover:text-blue-600"
                      >
                        {segment}
                      </button>
                      {index < currentPath.split('/').filter(Boolean).length - 1 && (
                        <span>/</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Files List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No files found</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid gap-2">
                      {filteredFiles.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleFileSelect(file)}
                                  className="font-medium text-gray-900 hover:text-blue-600 truncate"
                                >
                                  {file.name}
                                </button>
                                {file.type === 'file' && file.size && (
                                  <span className="text-sm text-gray-500">
                                    ({formatFileSize(file.size)})
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Modified: {new Date(file.modified).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {file.type === 'file' && (
                              <Button
                                onClick={() => handleFileDownload(file)}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}; 