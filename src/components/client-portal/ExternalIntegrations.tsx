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
  Plus,
  MapPin
} from 'lucide-react';
import { clientPortalApi } from '../services/clientPortalApi';

interface Integration {
  id: string;
  service: 'sharepoint' | 'onedrive' | 'google-drive' | 'dropbox';
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  syncStatus: {
    totalFiles: number;
    syncedFiles: number;
    failedFiles: number;
    lastSyncTime?: string;
  };
  settings: {
    autoSync: boolean;
    syncInterval: number;
    includeSubfolders: boolean;
    fileTypes: string[];
    maxFileSize: number;
  };
  quota: {
    used: number;
    total: number;
    unit: string;
  };
}

interface ExternalIntegrationsProps {
  portalId: string;
  onClose: () => void;
}

interface FolderMapping {
  portalFolder: string;
  cloudFolder: string;
}

export const ExternalIntegrations: React.FC<ExternalIntegrationsProps> = ({
  portalId,
  onClose
}) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'microsoft' | 'google' | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [folderMapping, setFolderMapping] = useState<FolderMapping[]>([]);
  const [syncConfig, setSyncConfig] = useState({
    direction: 'bidirectional' as 'upload' | 'download' | 'bidirectional',
    fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    autoSync: true,
    syncInterval: 30,
    includeSubfolders: true
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await clientPortalApi.listIntegrations(portalId);
      
      const mappedIntegrations: Integration[] = response.integrations.map(integration => ({
        id: integration.id,
        service: integration.service as any,
        name: getProviderName(integration.service),
        description: getProviderDescription(integration.service),
        icon: getProviderIcon(integration.service),
        color: getProviderColor(integration.service),
        status: integration.status as any,
        lastSync: integration.last_sync,
        syncStatus: {
          totalFiles: 0,
          syncedFiles: 0,
          failedFiles: 0,
          lastSyncTime: integration.last_sync
        },
        settings: integration.sync_config || {
          autoSync: true,
          syncInterval: 30,
          includeSubfolders: true,
          fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
          maxFileSize: 100 * 1024 * 1024
        },
        quota: {
          used: 0,
          total: 10,
          unit: 'GB'
        }
      }));
      
      setIntegrations(mappedIntegrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (service: string): string => {
    switch (service) {
      case 'sharepoint': return 'SharePoint';
      case 'onedrive': return 'OneDrive';
      case 'google-drive': return 'Google Drive';
      default: return service;
    }
  };

  const getProviderDescription = (service: string): string => {
    switch (service) {
      case 'sharepoint': return 'Microsoft SharePoint integration for business files';
      case 'onedrive': return 'Microsoft OneDrive integration for personal files';
      case 'google-drive': return 'Google Drive integration for cloud storage';
      default: return 'Cloud storage integration';
    }
  };

  const getProviderIcon = (service: string): string => {
    switch (service) {
      case 'sharepoint': return '🪟';
      case 'onedrive': return '☁️';
      case 'google-drive': return '📁';
      default: return '☁️';
    }
  };

  const getProviderColor = (service: string): string => {
    switch (service) {
      case 'sharepoint': return 'bg-blue-600';
      case 'onedrive': return 'bg-blue-500';
      case 'google-drive': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleConnect = async (provider: 'microsoft' | 'google') => {
    try {
      setLoading(true);
      const response = await clientPortalApi.startCloudAuth(portalId, provider);
      
      // Open OAuth URL in new window
      window.open(response.auth_url, '_blank', 'width=600,height=700');
      
      // Poll for completion
      const checkCompletion = setInterval(async () => {
        try {
          await loadIntegrations();
          const integration = integrations.find(i => 
            (provider === 'microsoft' && (i.service === 'sharepoint' || i.service === 'onedrive')) ||
            (provider === 'google' && i.service === 'google-drive')
          );
          
          if (integration && integration.status === 'connected') {
            clearInterval(checkCompletion);
            setShowConnectModal(false);
            setSelectedProvider(null);
          }
        } catch (error) {
          console.error('Error checking completion:', error);
        }
      }, 2000);
      
      // Clear interval after 5 minutes
      setTimeout(() => clearInterval(checkCompletion), 300000);
      
    } catch (error) {
      console.error('Failed to start auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      await clientPortalApi.disconnectIntegration(portalId, integration.service);
      await loadIntegrations();
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (integration: Integration) => {
    setSyncing(integration.id);
    try {
      const response = await clientPortalApi.startSync(portalId, integration.service);
      
      if (response.status === 'success') {
        // Update sync status
        setIntegrations(prev => prev.map(integ => 
          integ.id === integration.id 
            ? { 
                ...integ, 
                status: 'connected' as const,
                lastSync: response.result.sync_time,
                syncStatus: {
                  ...integ.syncStatus,
                  totalFiles: response.result.files_processed,
                  syncedFiles: response.result.files_synced,
                  failedFiles: response.result.files_failed,
                  lastSyncTime: response.result.sync_time
                }
              }
            : integ
        ));
      }
    } catch (error) {
      console.error('Failed to sync integration:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleConfigureSync = async (integration: Integration) => {
    try {
      setLoading(true);
      
      // Get folders for mapping
      const foldersResponse = await clientPortalApi.listFolders(integration.service, portalId);
      setFolders(foldersResponse.folders);
      
      setSelectedIntegration(integration);
      setShowConnectModal(true);
    } catch (error) {
      console.error('Failed to configure sync:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSyncConfiguration = async () => {
    if (!selectedIntegration) return;
    
    try {
      setLoading(true);
      
      const folderMappingObj: Record<string, string> = {};
      folderMapping.forEach(mapping => {
        folderMappingObj[mapping.portalFolder] = mapping.cloudFolder;
      });
      
      await clientPortalApi.configureSync({
        portal_id: portalId,
        provider: selectedIntegration.service,
        folder_mapping: folderMappingObj,
        direction: syncConfig.direction,
        file_types: syncConfig.fileTypes,
        max_file_size: syncConfig.maxFileSize,
        auto_sync: syncConfig.autoSync,
        sync_interval: syncConfig.syncInterval,
        include_subfolders: syncConfig.includeSubfolders
      });
      
      await loadIntegrations();
      setShowConnectModal(false);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Failed to save sync configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'disconnected': return <Unlink className="w-5 h-5 text-gray-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'syncing': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'syncing': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cloud Storage Integrations</h2>
              <p className="text-sm text-gray-500">Connect to SharePoint, OneDrive, and Google Drive</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConnectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Integrations List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-12">
                  <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
                  <p className="text-gray-500 mb-4">Connect your cloud storage to sync documents automatically</p>
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Add Integration
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      onClick={() => setSelectedIntegration(integration)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedIntegration?.id === integration.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${integration.color}`}>
                            <span className="text-lg">{integration.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{integration.name}</h3>
                            <p className="text-sm text-gray-500">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                            {integration.status}
                          </span>
                          {getStatusIcon(integration.status)}
                        </div>
                      </div>

                      {integration.status === 'connected' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Synced Files</span>
                            <span className="font-medium">
                              {integration.syncStatus.syncedFiles} / {integration.syncStatus.totalFiles}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${integration.syncStatus.totalFiles > 0 ? (integration.syncStatus.syncedFiles / integration.syncStatus.totalFiles) * 100 : 0}%`
                              }}
                            />
                          </div>
                          {integration.syncStatus.failedFiles > 0 && (
                            <p className="text-xs text-red-600">
                              {integration.syncStatus.failedFiles} files failed to sync
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-3">
                        {integration.status === 'connected' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSync(integration);
                              }}
                              disabled={syncing === integration.id}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                            >
                              {syncing === integration.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Sync Now
                                </>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfigureSync(integration);
                              }}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnect(integration);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(integration.service === 'google-drive' ? 'google' : 'microsoft');
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Integration Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedIntegration ? (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${selectedIntegration.color}`}>
                    <span className="text-2xl">{selectedIntegration.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedIntegration.name}</h3>
                    <p className="text-gray-500">{selectedIntegration.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Sync Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Sync</span>
                        <span className="text-gray-900">
                          {selectedIntegration.lastSync 
                            ? formatDate(selectedIntegration.lastSync)
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Auto Sync</span>
                        <span className="text-gray-900">
                          {selectedIntegration.settings.autoSync ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sync Interval</span>
                        <span className="text-gray-900">
                          Every {selectedIntegration.settings.syncInterval} minutes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* File Statistics */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <File className="w-4 h-4 mr-2" />
                      File Statistics
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Files</span>
                        <span className="text-gray-900">{selectedIntegration.syncStatus.totalFiles}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Synced Files</span>
                        <span className="text-green-600">{selectedIntegration.syncStatus.syncedFiles}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Failed Files</span>
                        <span className="text-red-600">{selectedIntegration.syncStatus.failedFiles}</span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Usage */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      Storage Usage
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Used Space</span>
                        <span className="text-gray-900">
                          {selectedIntegration.quota.used} {selectedIntegration.quota.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Space</span>
                        <span className="text-gray-900">
                          {selectedIntegration.quota.total} {selectedIntegration.quota.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(selectedIntegration.quota.used / selectedIntegration.quota.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Include Subfolders</span>
                        <span className="text-gray-900">
                          {selectedIntegration.settings.includeSubfolders ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max File Size</span>
                        <span className="text-gray-900">
                          {formatFileSize(selectedIntegration.settings.maxFileSize)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">File Types</span>
                        <span className="text-gray-900">
                          {selectedIntegration.settings.fileTypes.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Select an integration to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connect Modal */}
        <AnimatePresence>
          {showConnectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedIntegration ? 'Configure Sync Settings' : 'Connect Cloud Storage'}
                </h3>
                
                {!selectedIntegration ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleConnect('microsoft')}
                        disabled={loading}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <span className="text-white text-xl">🪟</span>
                          </div>
                          <h4 className="font-medium text-gray-900">Microsoft</h4>
                          <p className="text-sm text-gray-500">SharePoint & OneDrive</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleConnect('google')}
                        disabled={loading}
                        className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <span className="text-white text-xl">📁</span>
                          </div>
                          <h4 className="font-medium text-gray-900">Google</h4>
                          <p className="text-sm text-gray-500">Google Drive</p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Sync Direction */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sync Direction</label>
                      <select
                        value={syncConfig.direction}
                        onChange={(e) => setSyncConfig(prev => ({ ...prev, direction: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="bidirectional">Two-way sync</option>
                        <option value="upload">Upload to cloud only</option>
                        <option value="download">Download from cloud only</option>
                      </select>
                    </div>

                    {/* File Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File Types</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].map(type => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={syncConfig.fileTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSyncConfig(prev => ({ ...prev, fileTypes: [...prev.fileTypes, type] }));
                                } else {
                                  setSyncConfig(prev => ({ ...prev, fileTypes: prev.fileTypes.filter(t => t !== type) }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type.toUpperCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Max File Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size</label>
                      <select
                        value={syncConfig.maxFileSize}
                        onChange={(e) => setSyncConfig(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value={10 * 1024 * 1024}>10 MB</option>
                        <option value={50 * 1024 * 1024}>50 MB</option>
                        <option value={100 * 1024 * 1024}>100 MB</option>
                        <option value={500 * 1024 * 1024}>500 MB</option>
                      </select>
                    </div>

                    {/* Auto Sync */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={syncConfig.autoSync}
                          onChange={(e) => setSyncConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable auto-sync</span>
                      </label>
                    </div>

                    {/* Sync Interval */}
                    {syncConfig.autoSync && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval</label>
                        <select
                          value={syncConfig.syncInterval}
                          onChange={(e) => setSyncConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={240}>4 hours</option>
                        </select>
                      </div>
                    )}

                    {/* Include Subfolders */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={syncConfig.includeSubfolders}
                          onChange={(e) => setSyncConfig(prev => ({ ...prev, includeSubfolders: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Include subfolders</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowConnectModal(false);
                      setSelectedIntegration(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  {selectedIntegration && (
                    <button
                      onClick={saveSyncConfiguration}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium"
                    >
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 