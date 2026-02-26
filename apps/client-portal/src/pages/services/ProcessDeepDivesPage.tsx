// ============================================================================
// SYSTEMS AUDIT - STAGE 3: PROCESS DEEP DIVES
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Workflow, CheckCircle, Clock, ChevronRight, Save,
  Loader2, AlertCircle, ChevronLeft, Target, Zap
} from 'lucide-react';
import { processChainConfigs, type ProcessChainConfig, type DeepDiveQuestion } from '@torsor/shared';

interface ProcessDeepDive {
  id: string;
  chain_code: string;
  completed_at: string | null;
  responses: Record<string, any>;
}

interface ProcessChain {
  id: string;
  chain_code: string;
  chain_name: string;
  description: string;
  estimated_duration_mins: number;
  display_order: number;
  question_config?: ProcessChainConfig | null;
  chain_status?: string;
  engagement_id?: string | null;
  is_core?: boolean;
  suggestion_reason?: string | null;
}

function DeepDiveContextField({
  contextValue,
  onContextChange,
}: {
  contextValue: string;
  onContextChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(!!contextValue);

  if (!expanded && !contextValue) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-2 text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Anything to add?
      </button>
    );
  }

  return (
    <div className="mt-2">
      <textarea
        value={contextValue || ''}
        onChange={(e) => onContextChange(e.target.value)}
        onBlur={() => { if (!contextValue?.trim()) setExpanded(false); }}
        placeholder="Optional — add context to explain your answer..."
        maxLength={300}
        rows={2}
        autoFocus={!contextValue}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-gray-50"
      />
      <p className="text-[10px] text-gray-400 text-right mt-0.5">
        {contextValue?.length || 0} / 300
      </p>
    </div>
  );
}

export default function ProcessDeepDivesPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [engagementId, setEngagementId] = useState<string | null>(null);
  const [processChains, setProcessChains] = useState<ProcessChain[]>([]);
  const [deepDives, setDeepDives] = useState<Record<string, ProcessDeepDive>>({});
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [engagementStatus, setEngagementStatus] = useState<string | null>(null);
  const [saSubmissionLocked, setSaSubmissionLocked] = useState(false);
  const [saSubmittedAt, setSaSubmittedAt] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editMode, setEditMode] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadData();
  }, [clientSession?.clientId]);

  const loadData = async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch engagement (include is_shared_with_client for redirect when report is shared)
      const { data: engagementData, error: engError } = await supabase
        .from('sa_engagements')
        .select('id, status, is_shared_with_client, submission_status, submitted_at')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      if (engError && (engError as { code?: string }).code !== 'PGRST116') {
        console.error('Error fetching engagement:', engError);
        setLoading(false);
        return;
      }

      let engagement: NonNullable<typeof engagementData> | null = engagementData;
      if (!engagement) {
        console.log('📝 No engagement found, creating one for Stage 3 access...');
        const { data: newEngagement, error: createError } = await supabase
          .from('sa_engagements')
          .insert({
            client_id: clientSession.clientId,
            practice_id: clientSession.practiceId,
            status: 'in_progress',
          })
          .select('id, status, is_shared_with_client')
          .single();

        if (createError || !newEngagement) {
          console.error('Error creating engagement:', createError);
          setLoading(false);
          return;
        }
        engagement = newEngagement as NonNullable<typeof engagementData>;
      }

      if (!engagement) {
        setLoading(false);
        return;
      }

      setEngagementId(engagement.id);
      setEngagementStatus(engagement.status);
      setSaSubmissionLocked((engagement as any)?.submission_status === 'submitted');
      setSaSubmittedAt((engagement as any)?.submitted_at ?? null);

      // Check if Stage 3 is complete - if so, check report status
      if (engagement.status === 'stage_3_complete' || engagement.status === 'analysis_complete' || engagement.status === 'completed') {
        const { data: reportData, error: reportError } = await supabase
          .from('sa_audit_reports')
          .select('*')
          .eq('engagement_id', engagement.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        console.log('🔍 ProcessDeepDivesPage - Report check:', {
          reportData,
          reportError,
          engagementId: engagement.id,
          hasReport: !!reportData,
          reportStatus: reportData?.status
        });
        
        if (reportError) {
          console.error('❌ Error fetching report in ProcessDeepDivesPage:', reportError);
        }
        
        if (reportData) {
          setReport(reportData);
          setReportStatus(reportData.status);
          console.log('✅ Report loaded. Status:', reportData.status, 'Approved?', 
            reportData.status === 'approved' || reportData.status === 'published' || reportData.status === 'delivered');

          // If report is shared with client, redirect to the dedicated report page (not Stage 3)
          const reportAvailable = ['approved', 'published', 'delivered'].includes(reportData.status);
          if (engagement.is_shared_with_client && reportAvailable) {
            navigate('/service/systems_audit/report', { replace: true });
            return;
          }
        } else {
          console.log('⚠️ No report found for engagement', reportError ? { error: reportError.message, code: reportError.code } : '(no error – RLS may block client select)');
          setReportStatus(null);
          // If report is shared but we got no report (e.g. RLS or timing), still send client to report page so they see the proper UI and any error there
          if (engagement.is_shared_with_client) {
            navigate('/service/systems_audit/report', { replace: true });
            return;
          }
        }
      }

      // Fetch process chains: core (global) + engagement-specific active custom chains
      const { data: chains, error: chainsError } = await supabase
        .from('sa_process_chains')
        .select('*')
        .or(`is_core.eq.true,and(engagement_id.eq.${engagement.id},chain_status.eq.active)`)
        .order('display_order', { ascending: true });

      if (chainsError) {
        console.error('Error fetching process chains:', chainsError);
      } else {
        setProcessChains(chains || []);
      }

      // Fetch existing deep dives
      const { data: dives, error: divesError } = await supabase
        .from('sa_process_deep_dives')
        .select('*')
        .eq('engagement_id', engagement.id);

      if (divesError) {
        console.error('Error fetching deep dives:', divesError);
      } else {
        const divesMap: Record<string, ProcessDeepDive> = {};
        (dives || []).forEach(dive => {
          divesMap[dive.chain_code] = dive;
        });
        setDeepDives(divesMap);
      }

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoSaveDraft = async () => {
    if (!engagementId || !selectedChain || Object.keys(responses).length === 0) return;
    try {
      const { error } = await supabase
        .from('sa_process_deep_dives')
        .upsert({
          engagement_id: engagementId,
          chain_code: selectedChain,
          responses,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'engagement_id,chain_code' });
      if (!error) {
        setLastSaved(new Date());
      } else {
        console.error('Auto-save error:', error);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  useEffect(() => {
    if (isInitialLoadRef.current || !selectedChain || !engagementId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (Object.keys(responses).length > 0) autoSaveDraft();
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [responses, selectedChain, engagementId]);

  const handleSelectChain = (chainCode: string) => {
    setSelectedChain(chainCode);
    setCurrentSection(0);
    setLastSaved(null);
    const existingDive = deepDives[chainCode];
    if (existingDive && existingDive.responses) {
      setResponses(existingDive.responses);
    } else {
      setResponses({});
    }
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  };

  const handleResponseChange = (field: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChain = async () => {
    if (!engagementId || !selectedChain) return;

    setSaving(true);
    try {
      const chain = processChains.find(c => c.chain_code === selectedChain);
      const config = chain?.question_config ?? processChainConfigs[selectedChain];
      if (!config) {
        throw new Error('Process chain config not found');
      }

      // Extract key pain points from AI anchor questions
      const painPoints: string[] = [];
      config.sections.forEach(section => {
        section.questions.forEach(q => {
          if (q.aiAnchor && responses[q.field]) {
            const answer = responses[q.field];
            if (typeof answer === 'string' && answer.trim()) {
              painPoints.push(answer.trim());
            }
          }
        });
      });

      const deepDiveData = {
        engagement_id: engagementId,
        chain_code: selectedChain,
        responses,
        key_pain_points: painPoints.length > 0 ? painPoints : null,
        completed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('sa_process_deep_dives')
        .upsert(deepDiveData, { onConflict: 'engagement_id,chain_code' });

      if (error) throw error;

      await loadData();
      setSelectedChain(null);
      setResponses({});
    } catch (err: any) {
      console.error('Error saving deep dive:', err);
      alert(`Error saving: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteStage3 = async () => {
    if (!engagementId) return;

    const coreChains = processChains.filter(c => c.is_core !== false);
    const suggestedChains = processChains.filter(c => c.is_core === false);
    const completedChainCodes = Object.keys(deepDives).filter(code => deepDives[code].completed_at);
    const allCoreCompleted = coreChains.length > 0 && coreChains.every(c => completedChainCodes.includes(c.chain_code));
    
    if (!allCoreCompleted) {
      const completedCore = coreChains.filter(c => completedChainCodes.includes(c.chain_code)).length;
      alert(`Please complete all ${coreChains.length} required process chains before completing Stage 3. You have completed ${completedCore} of ${coreChains.length}.`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sa_engagements')
        .update({
          status: 'stage_3_complete',
          stage_3_completed_at: new Date().toISOString()
        })
        .eq('id', engagementId);

      if (error) throw error;

      setEngagementStatus('stage_3_complete');
      // After completing Stage 3, check report status
      const { data: reportData } = await supabase
        .from('sa_audit_reports')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (reportData) {
        setReport(reportData);
        setReportStatus(reportData.status);
      }

      // Navigate to dashboard - they'll see "coming soon" if report not approved
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error completing stage 3:', err);
      alert(`Error completing stage: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!engagementId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Engagement Found</h2>
          <p className="text-gray-600 mb-6">Please complete Stage 1 and Stage 2 first.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show "coming soon" if Stage 3 is complete but report is not approved (unless user chose Edit My Answers)
  if (!editMode &&
      (engagementStatus === 'stage_3_complete' || engagementStatus === 'analysis_complete' || engagementStatus === 'completed') &&
      reportStatus &&
      reportStatus !== 'approved' &&
      reportStatus !== 'published' &&
      reportStatus !== 'delivered') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-2xl">
          <div className="mb-6">
            <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Systems Audit Report is Coming Soon</h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing all three stages. Our team is currently reviewing
              your responses and generating your personalized report.
            </p>
            <p className="text-gray-500 text-sm">
              You'll be notified as soon as your report is ready for review.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Edit My Answers
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show report if approved
  if ((engagementStatus === 'stage_3_complete' || engagementStatus === 'analysis_complete' || engagementStatus === 'completed') && 
      reportStatus && 
      (reportStatus === 'approved' || reportStatus === 'published' || reportStatus === 'delivered') &&
      report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Systems Audit Report</h1>
          </div>
          
          {/* Report View - matches SAClientReportView structure */}
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 md:p-12">
              <p className="text-amber-400 font-medium mb-2">Systems Audit Report</p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
                {report.headline || 'Systems Audit Report'}
              </h1>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-red-400">
                    £{Math.round((report.total_annual_cost_of_chaos || 0) / 10) * 10}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Annual Cost of Chaos</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-amber-400">
                    {report.total_hours_wasted_weekly || 0}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Hours Lost Weekly</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-green-400">
                    {report.hours_reclaimable_weekly || Math.round((report.total_hours_wasted_weekly || 0) * 0.5) || 'TBC'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Hours Recoverable</p>
                </div>
              </div>
            </div>

            {/* Executive Brief */}
            {report.client_executive_brief && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">In Brief</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {report.client_executive_brief}
                </p>
              </div>
            )}

            {/* The Story */}
            {report.executive_summary && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What We Found</h2>
                <div className="prose prose-slate max-w-none">
                  {report.executive_summary.split('\n\n').map((paragraph: string, idx: number) => (
                    <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* The Cost */}
            {report.cost_of_chaos_narrative && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">The Cost of Staying Where You Are</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {report.cost_of_chaos_narrative}
                  </p>
                </div>
                
                {/* Visual Cost Breakdown */}
                <div className="mt-6 pt-6 border-t border-red-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-red-600">{report.total_hours_wasted_weekly || 0}</p>
                    <p className="text-sm text-gray-600">Hours Lost Weekly</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">£{Math.round((report.total_annual_cost_of_chaos || 0) / 10) * 10}</p>
                    <p className="text-sm text-gray-600">Annual Impact</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">£{Math.round((report.projected_cost_at_scale || 0) / 10) * 10}</p>
                    <p className="text-sm text-gray-600">At {report.growth_multiplier || 1.5}x Growth</p>
                  </div>
                </div>
              </div>
            )}

            {/* The Opportunity */}
            {report.time_freedom_narrative && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">What This Enables</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {report.time_freedom_narrative}
                  </p>
                </div>
                
                {/* Hours Reclaimable - only show if value exists */}
                {report.hours_reclaimable_weekly && report.hours_reclaimable_weekly > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-xs text-gray-500 uppercase mb-1">Hours Reclaimable Weekly</p>
                    <p className="text-2xl font-bold text-green-600">{report.hours_reclaimable_weekly}</p>
                  </div>
                )}
              </div>
            )}

            {/* ROI Summary */}
            {(report.total_recommended_investment || report.total_annual_benefit) && (
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-6 md:p-8">
                <h2 className="text-lg font-semibold mb-6">Return on Investment</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-emerald-200 text-sm">Investment</p>
                    <p className="text-2xl font-bold">£{(report.total_recommended_investment || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Annual Return</p>
                    <p className="text-2xl font-bold">£{(report.total_annual_benefit || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">Payback Period</p>
                    <p className="text-2xl font-bold">{report.overall_payback_months || '?'} months</p>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm">ROI</p>
                    <p className="text-2xl font-bold">{report.roi_ratio || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {report.quick_wins && report.quick_wins.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Quick Wins</h2>
                    <p className="text-sm text-gray-500">Implementable within one week</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {report.quick_wins.slice(0, 4).map((qw: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-amber-700">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{qw.title}</p>
                        <p className="text-sm text-gray-500">{qw.impact}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-semibold">+{qw.hoursSavedWeekly || qw.hours_saved_weekly || 0}hrs/wk</p>
                        <p className="text-xs text-gray-500">{qw.timeToImplement || qw.time_to_implement || 'TBC'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="bg-slate-900 text-white rounded-xl p-6 md:p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Ready to Reclaim Your Time?</h2>
              <p className="text-slate-400 mb-6">
                Let's discuss how to implement these recommendations and start recovering those {report.hours_reclaimable_weekly || Math.round((report.total_hours_wasted_weekly || 0) * 0.5) || 'valuable'} hours every week.
              </p>
              <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors">
                Schedule a Call
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If a chain is selected, show the form
  if (selectedChain) {
    const selectedChainObj = processChains.find(c => c.chain_code === selectedChain);
    const config = selectedChainObj?.question_config ?? processChainConfigs[selectedChain];
    if (!config) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Process Chain Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">Configuration may be pending for this custom chain.</p>
            <button
              onClick={() => setSelectedChain(null)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Chains
            </button>
          </div>
        </div>
      );
    }

    const currentSectionData = config.sections[currentSection];
    const isLastSection = currentSection === config.sections.length - 1;
    const isFirstSection = currentSection === 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedChain(null);
                setResponses({});
                setCurrentSection(0);
                isInitialLoadRef.current = true;
                setLastSaved(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Process Chains
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
                <p className="text-gray-600">{config.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {lastSaved && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Progress saved
                  </span>
                )}
                <Clock className="w-4 h-4" />
                <span>~{config.estimatedMins} minutes</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {config.sections.map((section, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    idx < currentSection ? 'bg-emerald-500 text-white' :
                    idx === currentSection ? 'bg-indigo-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {idx < currentSection ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  {idx < config.sections.length - 1 && (
                    <div className={`w-12 h-1 ${
                      idx < currentSection ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Section {currentSection + 1} of {config.sections.length}: {currentSectionData.name}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{currentSectionData.name}</h2>
            
            <div className="space-y-6">
              {currentSectionData.questions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                    {question.aiAnchor && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        Key Insight
                      </span>
                    )}
                  </label>
                  
                  {question.type === 'text' && (
                    <textarea
                      value={responses[question.field] ?? ''}
                      onChange={(e) => handleResponseChange(question.field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      rows={3}
                      placeholder={question.placeholder || 'Enter your answer...'}
                      disabled={saSubmissionLocked}
                    />
                  )}
                  
                  {question.type === 'select' && (
                    <select
                      value={responses[question.field] || ''}
                      onChange={(e) => handleResponseChange(question.field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={saSubmissionLocked}
                    >
                      <option value="">Select an option...</option>
                      {question.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  
                  {question.type === 'multi_select' && (
                    <div className="space-y-2">
                      {question.options?.map(opt => (
                        <label key={opt.value} className={`flex items-center gap-2 ${saSubmissionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={(responses[question.field] || []).includes(opt.value)}
                            onChange={(e) => {
                              const current = responses[question.field] || [];
                              if (e.target.checked) {
                                handleResponseChange(question.field, [...current, opt.value]);
                              } else {
                                handleResponseChange(question.field, current.filter((v: string) => v !== opt.value));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            disabled={saSubmissionLocked}
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(question.type === 'select' || question.type === 'multi_select') &&
                    (question.type === 'select' ? responses[question.field] : (responses[question.field]?.length ?? 0) > 0) && (
                    <DeepDiveContextField
                      contextValue={responses[`${question.field}_context`] || ''}
                      onContextChange={(val) => handleResponseChange(`${question.field}_context`, val)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => {
                autoSaveDraft();
                setCurrentSection(Math.max(0, currentSection - 1));
              }}
              disabled={isFirstSection || saSubmissionLocked}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Section
            </button>
            
            {isLastSection ? (
              <button
                onClick={handleSaveChain}
                disabled={saving || saSubmissionLocked}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save & Complete Chain
              </button>
            ) : (
              <button
                onClick={() => {
                  autoSaveDraft();
                  setCurrentSection(currentSection + 1);
                }}
                disabled={saSubmissionLocked}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Next Section
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show chain selection — require only core chains for "Complete Stage 3"; suggested are optional
  const coreChainsList = processChains.filter(c => c.is_core !== false);
  const suggestedChainsList = processChains.filter(c => c.is_core === false);
  const completedChainCodesSet = new Set(Object.keys(deepDives).filter(code => deepDives[code].completed_at));
  const allCoreCompleted = coreChainsList.length > 0 && coreChainsList.every(chain => completedChainCodesSet.has(chain.chain_code));
  const suggestedCompletedCount = suggestedChainsList.filter(c => completedChainCodesSet.has(c.chain_code)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {editMode && (engagementStatus === 'stage_3_complete' || engagementStatus === 'analysis_complete') && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">You're editing completed answers. Changes will be saved but may not be reflected in a report that's already been generated.</span>
          </div>
        )}
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Workflow className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Systems Audit - Stage 3</h1>
                <p className="text-gray-600">Process Deep Dives</p>
              </div>
            </div>
            {allCoreCompleted && !saSubmissionLocked && (
              <button
                onClick={handleCompleteStage3}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Complete Stage 3
              </button>
            )}
          </div>
        </div>

        {saSubmissionLocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              These answers were submitted on {saSubmittedAt ? new Date(saSubmittedAt).toLocaleDateString() : 'a previous date'} and cannot be changed. Contact your practice team if you need to make corrections.
            </p>
          </div>
        )}

        {allCoreCompleted && suggestedChainsList.length > 0 && suggestedCompletedCount < suggestedChainsList.length && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              You have {suggestedChainsList.length - suggestedCompletedCount} recommended process deep dive(s) still to complete.
              These are optional but will improve the quality of your assessment.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-cyan-900 mb-2">About Process Deep Dives</h3>
          <p className="text-sm text-cyan-700">
            Complete detailed deep dives for each key business process. This helps us identify bottlenecks, 
            inefficiencies, and opportunities for improvement. You can complete them in any order, and your 
            progress is saved automatically.
          </p>
        </div>

        {/* Process Chains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processChains.map((chain) => {
            const config = chain.question_config ?? processChainConfigs[chain.chain_code];
            const deepDive = deepDives[chain.chain_code];
            const isCompleted = !!deepDive?.completed_at;
            const isSuggested = chain.is_core === false;

            return (
              <div
                key={chain.id}
                className={`bg-white rounded-xl border-2 p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50' : isSuggested ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                }`}
                onClick={() => handleSelectChain(chain.chain_code)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{chain.chain_name}</h3>
                      {isSuggested && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Recommended for your industry
                        </span>
                      )}
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    {chain.suggestion_reason && (
                      <p className="text-xs text-gray-500 mt-1">{chain.suggestion_reason}</p>
                    )}
                    <p className="text-sm text-gray-600 mb-3">{chain.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~{chain.estimated_duration_mins} mins</span>
                      </div>
                      {config ? (
                        <span>{config.sections?.length ?? 0} sections</span>
                      ) : (
                        <span className="text-amber-600">Configuration pending</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                {isCompleted && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <span className="text-xs font-medium text-emerald-700">Completed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        {processChains.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Chains Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Object.values(deepDives).filter(d => d.completed_at).length} / {processChains.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(Object.values(deepDives).filter(d => d.completed_at).length / processChains.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
