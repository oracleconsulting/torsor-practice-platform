import React, { useRef, useState } from 'react';

interface DocumentUploaderProps {
  label: string;
  onUpload: (file: File) => void;
  accept?: string;
  error?: string;
  className?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ label, onUpload, accept = '.pdf,.jpg,.jpeg,.png', error, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
    onUpload(f);
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="block text-white font-medium mb-1">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
        onClick={() => inputRef.current?.click()}
      >
        Choose File
      </button>
      {file && (
        <div className="mt-2">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="max-h-32 rounded shadow" />
          ) : (
            <span className="text-white">{file.name}</span>
          )}
        </div>
      )}
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
    </div>
  );
}; 