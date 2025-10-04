import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  GitBranch, 
  RotateCcw, 
  Download, 
  Eye, 
  Compare, 
  Plus,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PortalDocument } from '../../types/clientPortal';
import { clientPortalApi } from '../../services/clientPortalApi';

interface DocumentVersioningProps {
  portalId: string;
  documentId: string;
  currentDocument: PortalDocument;
  onClose: () => void;
  onVersionChange?: (version: PortalDocument) => void;
}

interface VersionComparison {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

export const DocumentVersioning: React.FC<DocumentVersioningProps> = ({
  portalId,
  documentId,
  currentDocument,
  onClose,
  onVersionChange
}) => {
  const [versions, setVersions] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PortalDocument | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    loadVersions();
  }, [portalId, documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const versionList = await clientPortalApi.getDocumentVersions(portalId, documentId);
      setVersions([currentDocument, ...versionList]);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: PortalDocument) => {
    setSelectedVersion(version);
    if (onVersionChange) {
      onVersionChange(version);
    }
  };

  const compareVersions = async (version1: PortalDocument, version2: PortalDocument) => {
    try {
      // In a real implementation, this would compare document content
      // For now, we'll simulate a comparison
      const mockComparison: VersionComparison = {
        added: ['New section added', 'Updated metadata'],
        removed: ['Old deprecated field'],
        modified: ['Content updated', 'Formatting changed'],
        unchanged: ['Header information', 'Footer details']
      };
      
      setComparison(mockComparison);
      setShowComparison(true);
    } catch (error) {
      console.error('Failed to compare versions:', error);
    }
  };

  const handleUploadNewVersion = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const newVersion = await clientPortalApi.createDocumentVersion(
        portalId,
        documentId,
        file,
        uploadDescription
      );
      
      setVersions(prev => [newVersion, ...prev]);
      setUploadDescription('');
      setSelectedVersion(newVersion);
      
      if (onVersionChange) {
        onVersionChange(newVersion);
      }
    } catch (error) {
      console.error('Failed to upload new version:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRollback = async (version: PortalDocument) => {
    if (!confirm(`Are you sure you want to rollback to version ${version.version}?`)) {
      return;
    }

    try {
      // In a real implementation, this would create a new version that's identical to the selected version
      const rollbackVersion = await clientPortalApi.createDocumentVersion(
        portalId,
        documentId,
        new File([''], `rollback-${version.version}.${version.type.split('/')[1] || 'pdf'}`),
        `Rollback to version ${version.version}`
      );
      
      setVersions(prev => [rollbackVersion, ...prev]);
      setSelectedVersion(rollbackVersion);
      
      if (onVersionChange) {
        onVersionChange(rollbackVersion);
      }
    } catch (error) {
      console.error('Failed to rollback:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionStatus = (version: PortalDocument) => {
    if (version.id === currentDocument.id) {
      return { label: 'Current', color: 'text-green-600', bg: 'bg-green-50' };
    }
    if (version.verified) {
      return { label: 'Verified', color: 'text-blue-600', bg: 'bg-blue-50' };
    }
    return { label: 'Draft', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Versioning</h2>
              <p className="text-sm text-gray-500">{currentDocument.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Version List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Version History</h3>
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center"
                  disabled={uploading}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Version
                </button>
              </div>

              {/* Upload New Version */}
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadNewVersion(file);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Version description (optional)"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Version List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version, index) => {
                    const status = getVersionStatus(version);
                    const isSelected = selectedVersion?.id === version.id;
                    
                    return (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleVersionSelect(version)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <GitBranch className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              Version {version.version}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {version.id !== currentDocument.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRollback(version);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Rollback to this version"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                compareVersions(currentDocument, version);
                              }}
                              className="p-1 text-gray-400 hover:text-purple-600"
                              title="Compare with current"
                            >
                              <Compare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(version.uploadedAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-3 h-3" />
                            <span>{version.uploadedBy}</span>
                          </div>
                          {version.description && (
                            <p className="text-gray-700 mt-2">{version.description}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Version Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {selectedVersion ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Version {selectedVersion.version} Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                      <p className="text-sm text-gray-900">{selectedVersion.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedVersion.uploadedAt)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
                      <p className="text-sm text-gray-900">{selectedVersion.uploadedBy}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                      <p className="text-sm text-gray-900">
                        {(selectedVersion.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="flex items-center space-x-2">
                        {selectedVersion.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-sm text-gray-900">
                          {selectedVersion.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>
                    
                    {selectedVersion.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-sm text-gray-900">{selectedVersion.description}</p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // Download version
                            clientPortalApi.downloadDocument(portalId, selectedVersion.id);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            // Preview version
                          }}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a version to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Modal */}
        <AnimatePresence>
          {showComparison && comparison && (
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
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Version Comparison</h3>
                    <button
                      onClick={() => setShowComparison(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <span className="sr-only">Close</span>
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                  <div className="space-y-4">
                    {comparison.added.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2 flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          Added
                        </h4>
                        <ul className="space-y-1">
                          {comparison.added.map((item, index) => (
                            <li key={index} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {comparison.removed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-2 flex items-center">
                          <span className="w-4 h-4 mr-2">−</span>
                          Removed
                        </h4>
                        <ul className="space-y-1">
                          {comparison.removed.map((item, index) => (
                            <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {comparison.modified.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                          <span className="w-4 h-4 mr-2">~</span>
                          Modified
                        </h4>
                        <ul className="space-y-1">
                          {comparison.modified.map((item, index) => (
                            <li key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {comparison.unchanged.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <span className="w-4 h-4 mr-2">=</span>
                          Unchanged
                        </h4>
                        <ul className="space-y-1">
                          {comparison.unchanged.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 