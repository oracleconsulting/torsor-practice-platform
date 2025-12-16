// ============================================================================
// MA DOCUMENT UPLOAD COMPONENT
// ============================================================================
// Allows uploading Management Accounts documents (PDF/Excel) to create
// financial snapshots automatically
// ============================================================================

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Loader2, Calendar } from 'lucide-react';

interface MADocumentUploadProps {
  engagementId: string;
  onUploadComplete?: (snapshotId: string) => void;
  onError?: (error: string) => void;
}

export function MADocumentUpload({ engagementId, onUploadComplete, onError }: MADocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [periodEndDate, setPeriodEndDate] = useState<string>(() => {
    // Default to last month end
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    return lastMonth.toISOString().split('T')[0];
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    snapshotId?: string;
    metrics?: any;
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!extension || !['pdf', 'xls', 'xlsx'].includes(extension)) {
        onError?.('Invalid file type. Please upload a PDF or Excel file.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        onError?.('File size exceeds 10MB limit.');
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !periodEndDate) {
      onError?.('Please select a file and enter a period end date.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      // Get Supabase URL and session
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mvdejlkiqslwrbarwxkw.supabase.co';
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('engagementId', engagementId);
      formData.append('periodEndDate', periodEndDate);

      // Upload via fetch (Supabase functions.invoke doesn't support FormData)
      const response = await fetch(`${supabaseUrl}/functions/v1/upload-ma-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const resultData = await response.json();

      if (!response.ok || !resultData.success) {
        throw new Error(resultData.error || 'Upload failed');
      }

      setResult({
        success: true,
        snapshotId: resultData.snapshotId,
        metrics: resultData.metrics,
      });

      setUploadProgress(100);
      onUploadComplete?.(resultData.snapshotId);

      // Reset file after successful upload
      setTimeout(() => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setResult({
        success: false,
        error: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Period End Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Period End Date
        </label>
        <input
          type="date"
          value={periodEndDate}
          onChange={(e) => setPeriodEndDate(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={uploading}
        />
        <p className="text-xs text-slate-500 mt-1">
          The month/period this management accounts document covers
        </p>
      </div>

      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Management Accounts Document
        </label>
        
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
          >
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500">
              PDF or Excel files only (max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={handleRemoveFile}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && periodEndDate && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading and processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload and Create Snapshot
            </>
          )}
        </button>
      )}

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {result.success ? (
                <>
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Document uploaded successfully!
                  </p>
                  <p className="text-xs text-green-700 mb-2">
                    Financial snapshot created. Insights will be generated automatically.
                  </p>
                  {result.metrics && (
                    <div className="mt-2 text-xs text-green-700">
                      <p className="font-medium mb-1">Extracted Metrics:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {result.metrics.revenue && (
                          <li>Revenue: £{result.metrics.revenue.toLocaleString()}</li>
                        )}
                        {result.metrics.gross_profit && (
                          <li>Gross Profit: £{result.metrics.gross_profit.toLocaleString()}</li>
                        )}
                        {result.metrics.operating_profit !== undefined && (
                          <li>Operating Profit: £{result.metrics.operating_profit.toLocaleString()}</li>
                        )}
                        {result.metrics.net_profit !== undefined && (
                          <li>Net Profit: £{result.metrics.net_profit.toLocaleString()}</li>
                        )}
                        {result.metrics.cash_position !== undefined && (
                          <li>Cash: £{result.metrics.cash_position.toLocaleString()}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Upload failed
                  </p>
                  <p className="text-xs text-red-700">{result.error}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

