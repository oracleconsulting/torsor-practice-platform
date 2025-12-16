// ============================================================================
// MA MANAGEMENT PAGE
// ============================================================================
// Page for managing MA engagements and uploading documents
// ============================================================================

import { useState, useEffect } from 'react';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { MADocumentUpload } from '@/components/management-accounts/MADocumentUpload';
import { supabase } from '@/lib/supabase';
import { 
  Upload, 
  FileText, 
  Plus, 
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface MAEngagement {
  id: string;
  client_id: string;
  tier: string;
  frequency: string;
  status: string;
  start_date: string;
  monthly_fee?: number;
  practice_members?: {
    name: string;
    client_company: string;
  };
}

export default function MAManagementPage() {
  const { member } = useCurrentMember();
  const [engagements, setEngagements] = useState<MAEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const practiceId = member?.practice_id;

  useEffect(() => {
    if (practiceId) {
      fetchEngagements();
    }
  }, [practiceId]);

  const fetchEngagements = async () => {
    if (!practiceId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ma_engagements')
        .select(`
          id,
          client_id,
          tier,
          frequency,
          status,
          start_date,
          monthly_fee,
          practice_members!ma_engagements_client_id_fkey (
            name,
            client_company
          )
        `)
        .eq('practice_id', practiceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEngagements(data || []);
    } catch (error) {
      console.error('Failed to fetch engagements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (snapshotId: string) => {
    setShowUpload(false);
    // Optionally refresh data or show success message
    console.log('Snapshot created:', snapshotId);
  };

  if (!practiceId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                Management Accounts
              </h1>
              <p className="text-slate-600 mt-1">
                Manage MA engagements and upload financial documents
              </p>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Management Accounts</h2>
            
            {selectedEngagement ? (
              <MADocumentUpload
                engagementId={selectedEngagement}
                onUploadComplete={handleUploadComplete}
                onError={(error) => console.error('Upload error:', error)}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Select an engagement to upload documents for:
                </p>
                <div className="grid gap-3">
                  {engagements.map((engagement) => (
                    <button
                      key={engagement.id}
                      onClick={() => setSelectedEngagement(engagement.id)}
                      className="text-left p-4 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {engagement.practice_members?.client_company || 'Client'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {engagement.practice_members?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                            {engagement.tier}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {engagements.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No active engagements found. Create an engagement first.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Engagements List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Active Engagements</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-slate-600">Loading engagements...</p>
            </div>
          ) : engagements.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No active engagements</p>
              <p className="text-slate-500 text-sm mt-1">
                Create an engagement to start managing accounts for a client
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {engagement.practice_members?.client_company || 'Client'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          engagement.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {engagement.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                          {engagement.tier}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {engagement.practice_members?.name}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Started {format(new Date(engagement.start_date), 'MMM yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {engagement.frequency}
                        </div>
                        {engagement.monthly_fee && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            £{engagement.monthly_fee.toLocaleString()}/month
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEngagement(engagement.id);
                        setShowUpload(true);
                      }}
                      className="ml-4 inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Upload
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

