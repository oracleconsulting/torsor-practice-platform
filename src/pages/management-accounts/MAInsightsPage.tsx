// ============================================================================
// MA INSIGHTS PAGE
// ============================================================================
// Main page for reviewing and managing MA insights
// Philosophy: Transform "here are your numbers" into "here's what your numbers
//             mean for your journey to [North Star]"
// ============================================================================

import { useState } from 'react';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { MAInsightsList } from '@/components/management-accounts/MAInsightsList';
import { MAInsightReview } from '@/components/management-accounts/MAInsightReview';
import type { NavigationProps } from '@/types/navigation';
import {
  FileText,
  CheckCircle,
  Clock,
  Send,
  X,
  BarChart3
} from 'lucide-react';

type StatusTab = 'generated' | 'approved' | 'shared' | 'all';

const TABS: { value: StatusTab; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'generated', label: 'Pending Review', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle },
  { value: 'shared', label: 'Shared', icon: Send },
  { value: 'all', label: 'All', icon: FileText },
];

export default function MAInsightsPage(_props: NavigationProps) {
  const { member } = useCurrentMember();
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusTab>('generated');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const practiceId = member?.practice_id;

  if (!practiceId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
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
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                Management Accounts Insights
              </h1>
              <p className="text-slate-600 mt-1">
                Review and approve AI-generated narrative insights before sharing with clients
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${isActive 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Insights List */}
          <MAInsightsList
            practiceId={practiceId}
            statusFilter={statusFilter}
            onSelectInsight={setSelectedInsightId}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Review Slide-over Panel */}
      {selectedInsightId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 transition-opacity"
            onClick={() => setSelectedInsightId(null)}
          />
          
          {/* Panel */}
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl">
              <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-lg font-semibold text-slate-900">Review Insight</h2>
                  <button
                    onClick={() => setSelectedInsightId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <MAInsightReview
                    insightId={selectedInsightId}
                    onClose={() => setSelectedInsightId(null)}
                    onStatusChange={() => {
                      setRefreshTrigger(prev => prev + 1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

