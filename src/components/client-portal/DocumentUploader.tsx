import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  FileArchive,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { DocumentCategory } from '../types/clientPortal';

interface DocumentUploaderProps {
  onClose: () => void;
  onUpload: (files: File[], category?: string) => Promise<void>;
  categories: DocumentCategory[];
  maxFileSize?: number;
  allowedTypes?: string[];
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  chunks?: {
    total: number;
    uploaded: number;
  };
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onClose,
  onUpload,
  categories,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed'
  ]
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (file.type.includes('image')) return <Image className="w-6 h-6 text-green-500" />;
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive className="w-6 h-6 text-purple-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported';
    }

    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const newUploadFiles: UploadFile[] = Array.from(files).map(file => {
      const error = validateFile(file);
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      return {
        file,
        id: `${file.name}-${Date.now()}`,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
        chunks: totalChunks > 1 ? { total: totalChunks, uploaded: 0 } : undefined
      };
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [maxFileSize, allowedTypes]);

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const uploadChunk = async (file: File, chunkIndex: number, totalChunks: number): Promise<boolean> => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileId', file.name);

    try {
      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Chunk upload failed:', error);
      return false;
    }
  };

  const handleUpload = async () => {
    const validFiles = uploadFiles.filter(f => f.status === 'pending');
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const uploadFile of validFiles) {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
        ));

        if (uploadFile.chunks) {
          // Chunked upload
          const { total } = uploadFile.chunks;
          let successful = true;

          for (let i = 0; i < total; i++) {
            const success = await uploadChunk(uploadFile.file, i, total);
            if (!success) {
              successful = false;
              break;
            }

            const progress = ((i + 1) / total) * 100;
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { 
                ...f, 
                progress,
                chunks: { ...f.chunks!, uploaded: i + 1 }
              } : f
            ));

            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if (successful) {
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
            ));
          } else {
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'error', error: 'Upload failed' } : f
            ));
          }
        } else {
          // Regular upload
          try {
            await onUpload([uploadFile.file], selectedCategory || undefined);
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
            ));
          } catch (error) {
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'error', error: 'Upload failed' } : f
            ));
          }
        }
      }

      // Close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const validFiles = uploadFiles.filter(f => f.status === 'pending' || f.status === 'uploading');
  const hasErrors = uploadFiles.some(f => f.status === 'error');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Upload Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Category Selection */}
          {categories.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Category (Optional)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isUploading}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-gray-700 hover:border-gray-600'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`
              w-12 h-12 mx-auto mb-4
              ${isDragOver ? 'text-purple-500' : 'text-gray-500'}
            `} />
            <h3 className="text-lg font-medium text-white mb-2">
              {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
            </h3>
            <p className="text-gray-400 mb-4">
              Support for PDF, Word, Excel, images, and archives up to {formatFileSize(maxFileSize)}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept={allowedTypes.join(',')}
            />
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-4">
                Files to Upload ({validFiles.length})
              </h3>
              <div className="space-y-3">
                {uploadFiles.map((uploadFile) => (
                  <motion.div
                    key={uploadFile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center p-3 bg-gray-800 rounded-lg"
                  >
                    {/* File Icon */}
                    <div className="mr-3">
                      {getFileIcon(uploadFile.file)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white truncate">
                          {uploadFile.file.name}
                        </h4>
                        <span className="text-sm text-gray-400">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                            <span>{uploadFile.progress}% complete</span>
                            {uploadFile.chunks && (
                              <span>
                                Chunk {uploadFile.chunks.uploaded} of {uploadFile.chunks.total}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      {uploadFile.status === 'completed' && (
                        <div className="flex items-center text-green-500 text-sm mt-1">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Uploaded successfully
                        </div>
                      )}

                      {uploadFile.status === 'error' && (
                        <div className="flex items-center text-red-500 text-sm mt-1">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {uploadFile.error}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {uploadFile.status !== 'uploading' && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="ml-3 text-gray-400 hover:text-red-400"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Error Summary */}
          {hasErrors && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-400">
                  Some files could not be uploaded. Please check the errors above.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white font-medium"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={validFiles.length === 0 || isUploading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${validFiles.length} File${validFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 