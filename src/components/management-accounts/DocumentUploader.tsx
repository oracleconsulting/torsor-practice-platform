'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MADocumentType } from '../../types/ma';

interface DocumentUploaderProps {
  periodId: string;
  engagementId: string;
  onUploadComplete?: () => void;
  allowedTypes?: MADocumentType[];
}

const DOCUMENT_TYPE_INFO: Record<MADocumentType, { label: string; accept: string; description: string }> = {
  management_pack: { 
    label: 'Management Accounts Pack', 
    accept: '.pdf', 
    description: 'Combined MA pack (PDF)' 
  },
  pnl: { 
    label: 'Profit & Loss', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'P&L statement' 
  },
  balance_sheet: { 
    label: 'Balance Sheet', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'Balance sheet' 
  },
  cash_flow: { 
    label: 'Cash Flow Statement', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'Cash flow statement' 
  },
  aged_debtors: { 
    label: 'Aged Debtors', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'Aged receivables report' 
  },
  aged_creditors: { 
    label: 'Aged Creditors', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'Aged payables report' 
  },
  trial_balance: { 
    label: 'Trial Balance', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'Trial balance' 
  },
  bank_reconciliation: { 
    label: 'Bank Reconciliation', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'Bank rec' 
  },
  vat_return: { 
    label: 'VAT Return', 
    accept: '.pdf,.xlsx,.csv', 
    description: 'VAT return' 
  },
  supporting: { 
    label: 'Supporting Document', 
    accept: '.pdf,.xlsx,.csv,.doc,.docx', 
    description: 'Other supporting docs' 
  },
  board_pack: { 
    label: 'Board Pack', 
    accept: '.pdf,.pptx', 
    description: 'Board pack (Platinum)' 
  },
  client_report: { 
    label: 'Client Report', 
    accept: '.pdf', 
    description: 'Final delivered report' 
  },
};

interface UploadedFile {
  name: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export function DocumentUploader({ 
  periodId, 
  engagementId, 
  onUploadComplete,
  allowedTypes = ['management_pack', 'pnl', 'balance_sheet', 'aged_debtors', 'aged_creditors', 'supporting']
}: DocumentUploaderProps) {
  const [selectedType, setSelectedType] = useState<MADocumentType>('management_pack');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      setUploadedFiles(prev => [...prev, { name: file.name, status: 'uploading' }]);
      
      try {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `ma/${engagementId}/${periodId}/${timestamp}_${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) throw uploadError;
        
        const { data: doc, error: dbError } = await supabase
          .from('ma_documents')
          .insert({
            period_id: periodId,
            engagement_id: engagementId,
            document_type: selectedType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            extraction_status: ['pnl', 'balance_sheet', 'aged_debtors', 'aged_creditors'].includes(selectedType) 
              ? 'pending' 
              : 'not_required',
          })
          .select('id')
          .single();
        
        if (dbError) throw dbError;
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, status: 'success', documentId: doc?.id } 
              : f
          )
        );
        
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name 
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } 
              : f
          )
        );
      }
    }
    
    setIsUploading(false);
    onUploadComplete?.();
  }, [periodId, engagementId, selectedType, onUploadComplete]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const clearCompleted = () => {
    setUploadedFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Document Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as MADocumentType)}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isUploading}
        >
          {allowedTypes.map(type => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_INFO[type].label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          {DOCUMENT_TYPE_INFO[selectedType].description}
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.csv,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          ) : (
            <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          )}
          
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop files here...</p>
          ) : isUploading ? (
            <p className="text-slate-600">Uploading...</p>
          ) : (
            <div>
              <p className="text-slate-600 font-medium">
                Drag and drop files here, or click to select
              </p>
              <p className="text-sm text-slate-400 mt-1">
                PDF, Excel, or CSV files • Max 50MB
              </p>
            </div>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">Uploaded Files</h4>
            {uploadedFiles.some(f => f.status === 'success') && (
              <button
                onClick={clearCompleted}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear completed
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {uploadedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className={`
                  flex items-center gap-3 p-3 rounded-lg text-sm
                  ${file.status === 'success' ? 'bg-green-50 border border-green-200' :
                    file.status === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-slate-50 border border-slate-200'
                  }
                `}
              >
                {file.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                ) : file.status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                
                <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="flex-1 truncate">{file.name}</span>
                
                {file.status === 'error' && (
                  <span className="text-xs text-red-600">{file.error}</span>
                )}
                
                {file.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;
