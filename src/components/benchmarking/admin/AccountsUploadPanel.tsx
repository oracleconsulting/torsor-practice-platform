import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AccountUpload {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'extracted' | 'confirmed' | 'failed';
  fiscal_year?: number;
  extraction_confidence?: number;
  error_message?: string;
  created_at: string;
}

interface FinancialData {
  id: string;
  fiscal_year: number;
  revenue?: number;
  gross_margin_pct?: number;
  ebitda_margin_pct?: number;
  net_margin_pct?: number;
  debtor_days?: number;
  employee_count?: number;
  revenue_per_employee?: number;
  confidence_score?: number;
  confirmed_at?: string;
  notes?: string;
}

interface AccountsUploadPanelProps {
  clientId: string;
  practiceId: string;
  existingUploads: AccountUpload[];
  existingFinancialData: FinancialData[];
  onUploadComplete: () => void;
  onReviewData: (financialData: FinancialData) => void;
}

export const AccountsUploadPanel: React.FC<AccountsUploadPanelProps> = ({
  clientId,
  practiceId,
  existingUploads,
  existingFinancialData,
  onUploadComplete,
  onReviewData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  }, [clientId, practiceId, selectedYear]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
    // Reset input
    e.target.value = '';
  }, [clientId, practiceId, selectedYear]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    try {
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/csv', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|csv|xlsx|xls)$/i)) {
        throw new Error('Please upload a PDF, CSV, or Excel file');
      }

      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Get file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('upload-client-accounts', {
        body: {
          clientId,
          practiceId,
          fileName: file.name,
          fileType: extension,
          fileSize: file.size,
          fileBase64: base64,
          fiscalYear: selectedYear
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Upload failed');

      onUploadComplete();

    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteUpload = async (uploadId: string) => {
    if (!confirm('Delete this upload and its extracted data?')) return;

    try {
      const { error } = await supabase
        .from('client_accounts_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;
      onUploadComplete();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const retryProcessing = async (uploadId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-accounts-upload', {
        body: { uploadId }
      });

      if (error) throw error;
      onUploadComplete();
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return `£${value.toLocaleString()}`;
  };

  const getStatusBadge = (status: AccountUpload['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Pending</span>;
      case 'processing':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </span>;
      case 'extracted':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Extracted</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Confirmed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Failed</span>;
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload Client Accounts</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-slate-600">Fiscal Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onClick={() => document.getElementById('accounts-file-input')?.click()}
        >
          <input
            id="accounts-file-input"
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-600">Uploading and processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-slate-400" />
              <div>
                <p className="text-slate-700 font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-slate-500 mt-1">PDF, CSV, or Excel files up to 10MB</p>
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Previous Uploads */}
      {existingUploads.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload History</h3>
          
          <div className="space-y-3">
            {existingUploads.map(upload => (
              <div 
                key={upload.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {upload.file_type === 'pdf' ? (
                    <FileText className="w-8 h-8 text-red-500" />
                  ) : (
                    <FileSpreadsheet className="w-8 h-8 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-slate-800">{upload.file_name}</p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(upload.file_size)} • FY{upload.fiscal_year || '?'}
                      {upload.extraction_confidence && (
                        <span className="ml-2">
                          • {Math.round(upload.extraction_confidence * 100)}% confidence
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(upload.status)}
                  
                  {upload.status === 'failed' && (
                    <button
                      onClick={() => retryProcessing(upload.id)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Retry processing"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteUpload(upload.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete upload"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Financial Data */}
      {existingFinancialData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Extracted Financial Data</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Year</th>
                  <th className="text-right py-2 px-3 text-slate-600 font-medium">Revenue</th>
                  <th className="text-right py-2 px-3 text-slate-600 font-medium">Gross %</th>
                  <th className="text-right py-2 px-3 text-slate-600 font-medium">EBITDA %</th>
                  <th className="text-right py-2 px-3 text-slate-600 font-medium">Net %</th>
                  <th className="text-right py-2 px-3 text-slate-600 font-medium">Debtor Days</th>
                  <th className="text-right py-2 px-3 text-slate-600 font-medium">Employees</th>
                  <th className="text-center py-2 px-3 text-slate-600 font-medium">Status</th>
                  <th className="text-center py-2 px-3 text-slate-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {existingFinancialData
                  .sort((a, b) => b.fiscal_year - a.fiscal_year)
                  .map(data => (
                    <tr key={data.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium text-slate-800">FY{data.fiscal_year}</td>
                      <td className="py-3 px-3 text-right text-slate-700">{formatCurrency(data.revenue)}</td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {data.gross_margin_pct !== undefined ? `${data.gross_margin_pct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {data.ebitda_margin_pct !== undefined ? `${data.ebitda_margin_pct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {data.net_margin_pct !== undefined ? `${data.net_margin_pct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {data.debtor_days !== undefined ? data.debtor_days : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {data.employee_count !== undefined ? data.employee_count : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {data.confirmed_at ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                            <CheckCircle className="w-3 h-3" /> Confirmed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                            Needs Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onReviewData(data)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {existingFinancialData.some(d => d.notes) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-1">Extraction Notes:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {existingFinancialData
                  .filter(d => d.notes)
                  .map(d => (
                    <li key={d.id}>
                      <strong>FY{d.fiscal_year}:</strong> {d.notes}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {existingUploads.length === 0 && existingFinancialData.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No accounts uploaded yet</p>
          <p className="text-sm mt-1">Upload 2-3 years of accounts for automatic data extraction</p>
        </div>
      )}
    </div>
  );
};

