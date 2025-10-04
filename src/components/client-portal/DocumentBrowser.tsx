import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Grid, 
  List, 
  MoreVertical,
  CheckCircle,
  Clock,
  File,
  Image,
  FileSpreadsheet,
  FileArchive
} from 'lucide-react';
import { PortalDocument } from '../../types/clientPortal';

interface DocumentBrowserProps {
  documents: PortalDocument[];
  onDocumentSelect: (document: PortalDocument) => void;
  onDocumentDelete: (documentId: string) => void;
  onDocumentPreview: (document: PortalDocument) => void;
}

type ViewMode = 'grid' | 'list';

export const DocumentBrowser: React.FC<DocumentBrowserProps> = ({
  documents,
  onDocumentSelect,
  onDocumentDelete,
  onDocumentPreview
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (type.includes('image')) return <Image className="w-6 h-6 text-green-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-6 h-6 text-purple-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDocumentSelect = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) {
      selectedDocuments.forEach(documentId => {
        onDocumentDelete(documentId);
      });
      setSelectedDocuments(new Set());
    }
  };

  const handleDownload = (document: PortalDocument) => {
    // In a real implementation, this would trigger a download
    console.log('Downloading document:', document.name);
    // You could create a temporary download link here
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents</h3>
        <p className="text-gray-600 mb-6">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Toolbar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Documents ({documents.length})
            </h2>
            {selectedDocuments.size > 0 && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {selectedDocuments.size} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedDocuments.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {documents.map((document) => (
                <motion.div
                  key={document.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                    selectedDocuments.has(document.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => onDocumentSelect(document)}
                >
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedDocuments.has(document.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleDocumentSelect(document.id);
                    }}
                    className="absolute top-2 right-2 z-10"
                  />

                  {/* Document Icon */}
                  <div className="flex items-center justify-center mb-3">
                    {getFileIcon(document.type)}
                  </div>

                  {/* Document Info */}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                      {document.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(document.fileSize)}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      {formatDate(document.uploadedAt)}
                    </p>

                    {/* Status */}
                    <div className="flex items-center justify-center mb-3">
                      {document.verified ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-yellow-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentPreview(document);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(document);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentDelete(document.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {documents.map((document) => (
                <motion.div
                  key={document.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedDocuments.has(document.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedDocuments.has(document.id)}
                    onChange={() => handleDocumentSelect(document.id)}
                    className="mr-4"
                  />

                  {/* Document Icon */}
                  <div className="mr-4">
                    {getFileIcon(document.type)}
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {document.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>{formatDate(document.uploadedAt)}</span>
                        {document.verified ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    {document.description && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {document.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onDocumentPreview(document)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDocumentDelete(document.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 