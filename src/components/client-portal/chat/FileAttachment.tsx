import React from 'react';
import { X, FileText, Image, File } from 'lucide-react';

interface FileAttachmentProps {
  file: File;
  onRemove: () => void;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  file,
  onRemove
}) => {
  // Get file icon based on type
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (file.type.includes('text/')) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
      {/* File icon */}
      <div className="text-gray-400">
        {getFileIcon()}
      </div>

      {/* File name */}
      <span className="text-sm text-white truncate max-w-[120px]">
        {file.name}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}; 