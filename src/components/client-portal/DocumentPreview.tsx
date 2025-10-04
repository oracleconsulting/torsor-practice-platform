import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileArchive,
  Calendar,
  User,
  Shield,
  CheckCircle,
  Clock,
  Info,
  Loader2
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PortalDocument } from '../../types/clientPortal';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewProps {
  document: PortalDocument;
  onClose: () => void;
  onDownload: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onClose,
  onDownload
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'details'>('preview');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImage = document.type.toLowerCase().startsWith('image/');
  const isPDF = document.type.toLowerCase() === 'application/pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePageChange = (delta: number) => {
    if (!numPages) return;
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-green-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-8 h-8 text-purple-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={onDownload}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Download to View
          </button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={`/api/documents/preview/${document.id}`}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Failed to load image');
            }}
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <Document
            file={`/api/documents/preview/${document.id}`}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setLoading(false);
            }}
            onLoadError={(error) => {
              console.error('PDF load error:', error);
              setLoading(false);
              setError('Failed to load PDF');
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            }
          >
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <Page
                pageNumber={currentPage}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          </Document>

          {numPages && numPages > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 bg-gray-900/80">
              <button
                onClick={() => handlePageChange(-1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-300">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === numPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-300">Preview not available for this file type</p>
        <button
          onClick={onDownload}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Download to View
        </button>
      </div>
    );
  };

  const renderDetails = () => {
    return (
      <div className="space-y-6 p-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Document Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">File Name</label>
              <p className="text-sm text-white">{document.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">File Type</label>
              <p className="text-sm text-white">{document.type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">File Size</label>
              <p className="text-sm text-white">{formatFileSize(document.fileSize)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Version</label>
              <p className="text-sm text-white">{document.version}</p>
            </div>
          </div>
        </div>

        {/* Upload Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Upload Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Uploaded By</label>
              <p className="text-sm text-white">{document.uploadedBy}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Upload Date</label>
              <p className="text-sm text-white">{formatDate(document.uploadedAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Last Modified</label>
              <p className="text-sm text-white">{formatDate(document.updatedAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <div className="flex items-center">
                {document.verified ? (
                  <span className="inline-flex items-center text-sm text-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center text-sm text-yellow-500">
                    <Clock className="w-4 h-4 mr-1" />
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Security Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Access Level</label>
              <p className="text-sm text-white">
                {document.accessLevel || 'Standard'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Encryption</label>
              <p className="text-sm text-white">
                {document.encrypted ? 'Encrypted' : 'Not Encrypted'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            {getFileIcon(document.type)}
            <div>
              <h2 className="text-xl font-semibold text-white">{document.name}</h2>
              <p className="text-sm text-gray-400">
                {formatFileSize(document.fileSize)} • {formatDate(document.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Controls */}
            <button
              onClick={() => setActiveTab(activeTab === 'preview' ? 'details' : 'preview')}
              className={`
                p-2 rounded-lg transition-colors
                ${activeTab === 'preview' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-purple-500 bg-purple-500/10 hover:bg-purple-500/20'
                }
              `}
            >
              <Info className="w-5 h-5" />
            </button>

            {activeTab === 'preview' && (isImage || isPDF) && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={onDownload}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'preview' ? renderPreview() : renderDetails()}
        </div>
      </motion.div>
    </div>
  );
}; 