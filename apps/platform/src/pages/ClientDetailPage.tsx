import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useLocation, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useClientDetail } from '@/hooks/useClients';
import SystemsAuditView from '@/components/systems-audit/SystemsAuditView';
import { supabase } from '@/lib/supabase';
import { 
  User,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Flag,
  Upload,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Compass
} from 'lucide-react';

export default function ClientDetailPage() {
  const { clientId: clientIdParam } = useParams<{ clientId: string }>();
  const clientId = clientIdParam ?? null;
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const serviceFromUrl = searchParams.get('service') || (location.pathname.includes('systems_audit') ? 'systems_audit' : null);

  const { client, fetchClient, loading, error, addContext, regenerateRoadmap } = useClientDetail(clientId);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'context' | 'assessments'>('overview');
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({ type: 'note' as const, content: '', priority: 'normal' as const });
  const [addingContext, setAddingContext] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [hasSystemsAudit, setHasSystemsAudit] = useState(false);
  const [checkingSA, setCheckingSA] = useState(true);

  useEffect(() => {
    if (clientId) {
      console.log('[ClientDetailPage] useEffect triggered, clientId:', clientId);
      fetchClient();

      // Run SA check after a short delay to avoid stacking with initial fetch burst (reduces 429 risk)
      const saTimer = setTimeout(() => {
        const checkForSystemsAudit = async () => {
          setCheckingSA(true);
          const { data: engagement } = await supabase
            .from('sa_engagements')
            .select('id')
            .eq('client_id', clientId)
            .maybeSingle();
          if (engagement) {
            setHasSystemsAudit(true);
            setCheckingSA(false);
            return;
          }
          await checkSystemsAuditEnrollment();
          setCheckingSA(false);
        };
        checkForSystemsAudit();
      }, 500);

      return () => clearTimeout(saTimer);
    }
  }, [clientId]);

  if (!clientId) {
    return <Navigate to="/clients" replace />;
  }

  const checkSystemsAuditEnrollment = async () => {
    if (!clientId) {
      console.log('[Systems Audit] No clientId provided');
      return;
    }
    
    console.log('[Systems Audit] Checking enrollment for clientId:', clientId);
    
    try {
      // Get service line ID for systems_audit
      const { data: saServiceLine, error: slError } = await supabase
        .from('service_lines')
        .select('id, code')
        .eq('code', 'systems_audit')
        .maybeSingle();
      
      console.log('[Systems Audit] Service line lookup:', { saServiceLine, slError });
      
      if (slError || !saServiceLine) {
        console.warn('[Systems Audit] Could not find systems_audit service line');
        setHasSystemsAudit(false);
        return;
      }
      
      // Check if client is enrolled
      const { data: enrollment, error: enrollError } = await supabase
        .from('client_service_lines')
        .select('id, service_line_id, status')
        .eq('client_id', clientId)
        .eq('service_line_id', saServiceLine.id)
        .maybeSingle();
      
      console.log('[Systems Audit] Enrollment check result:', { enrollment, enrollError, hasSA: !!enrollment });
      
      const hasSA = !!enrollment;
      setHasSystemsAudit(hasSA);
      console.log('[Systems Audit] Enrollment check complete, hasSA:', hasSA);
    } catch (err) {
      console.error('[Systems Audit] Error checking enrollment:', err);
      setHasSystemsAudit(false);
    }
  };

  const handleAddContext = async () => {
    if (!newContext.content.trim()) return;
    
    setAddingContext(true);
    const success = await addContext(newContext.type, newContext.content, newContext.priority);
    if (success) {
      setNewContext({ type: 'note', content: '', priority: 'normal' });
      setShowAddContext(false);
    }
    setAddingContext(false);
  };

  const handleRegenerate = async () => {
    const confirmed = confirm(
      'This will regenerate all roadmap stages. The process will start immediately and run through all stages automatically. This may take 2-3 minutes. Continue?'
    );
    if (!confirmed) return;

    setRegenerating(true);
    try {
      const success = await regenerateRoadmap();
      
      if (success) {
        // Show success message
        alert('Roadmap regeneration started! The process is running through all stages automatically. This may take 2-3 minutes. You can refresh the page in a few moments to see progress.');
        
        // Refresh after a delay to show progress
        setTimeout(() => {
          fetchClient();
        }, 5000);
      } else {
        alert('Failed to start roadmap regeneration. Please check the console for details or contact support.');
      }
    } catch (error) {
      console.error('Unexpected error during regeneration:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setRegenerating(false);
    }
  };

  if (error) {
    const isRateLimited = error.includes('Too many requests') || error.includes('429');
    return (
      <Layout
        title="Error"
        breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Error' }]}
      >
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <p className="text-slate-700 font-medium mb-1">{error}</p>
          {isRateLimited && (
            <p className="text-sm text-slate-500 mb-4">Wait a few seconds, then click Retry.</p>
          )}
          <button
            type="button"
            onClick={() => fetchClient()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (loading || !client) {
    return (
      <Layout 
        title="Loading..." 
        breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Loading...' }]}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  const roadmapData = client.roadmap?.data;
  const vision = roadmapData?.fiveYearVision;
  const shift = roadmapData?.sixMonthShift;
  const sprint = roadmapData?.sprint;

  return (
    <Layout 
      title={client.name}
      subtitle={client.company || client.email}
      breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: client.name }]}
    >
      {/* Client Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </span>
                {client.company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {client.company}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {client.hasRoadmap ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Roadmap Generated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                <Clock className="w-4 h-4" />
                In Progress
              </span>
            )}
            {client.hasRoadmap && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {regenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerate Roadmap
              </button>
            )}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
              client.assessments.part1 === 'completed' ? 'bg-emerald-500 text-white' :
              client.assessments.part1 === 'in_progress' ? 'bg-amber-500 text-white' :
              'bg-slate-200 text-slate-500'
            }`}>
              {client.assessments.part1 === 'completed' ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <p className="text-sm text-slate-600 mt-2">Part 1</p>
            <p className="text-xs text-slate-400">Life Design</p>
          </div>
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
              client.assessments.part2 === 'completed' ? 'bg-emerald-500 text-white' :
              client.assessments.part2 === 'in_progress' ? 'bg-amber-500 text-white' :
              'bg-slate-200 text-slate-500'
            }`}>
              {client.assessments.part2 === 'completed' ? <CheckCircle className="w-6 h-6" /> : '2'}
            </div>
            <p className="text-sm text-slate-600 mt-2">Part 2</p>
            <p className="text-xs text-slate-400">Business Deep Dive</p>
          </div>
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
              client.hasRoadmap ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {client.hasRoadmap ? <CheckCircle className="w-6 h-6" /> : <Compass className="w-5 h-5" />}
            </div>
            <p className="text-sm text-slate-600 mt-2">Roadmap</p>
            <p className="text-xs text-slate-400">365 Method</p>
          </div>
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
              client.assessments.part3 === 'completed' ? 'bg-emerald-500 text-white' :
              client.assessments.part3 === 'in_progress' ? 'bg-amber-500 text-white' :
              'bg-slate-200 text-slate-500'
            }`}>
              {client.assessments.part3 === 'completed' ? <CheckCircle className="w-6 h-6" /> : '3'}
            </div>
            <p className="text-sm text-slate-600 mt-2">Part 3</p>
            <p className="text-xs text-slate-400">Value Audit</p>
          </div>
        </div>
      </div>

      {/* Systems Audit View - if engagement exists, replace entire view */}
      {checkingSA ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-slate-600">Checking Systems Audit status...</span>
        </div>
      ) : hasSystemsAudit ? (
        <SystemsAuditView clientId={clientId!} />
      ) : (
        <>
          {/* Goal Alignment View - default tabs */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {['overview', 'roadmap', 'context', 'assessments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* North Star */}
              {vision?.northStar && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5" />
                    <span className="text-sm font-medium opacity-80">North Star</span>
                  </div>
                  <p className="text-lg font-medium">{vision.northStar}</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500 mb-1">Tasks Completed</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {client.tasks.filter(t => t.status === 'completed').length} / {client.tasks.length}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500 mb-1">Current Week</p>
                  <p className="text-2xl font-bold text-slate-900">
                    Week {Math.ceil((client.tasks.filter(t => t.status === 'completed').length / client.tasks.length) * 12) || 1}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-sm text-slate-500 mb-1">Context Notes</p>
                  <p className="text-2xl font-bold text-slate-900">{client.context.length}</p>
                </div>
              </div>

              {/* Recent Context */}
              {client.context.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Recent Context</h3>
                  <div className="space-y-2">
                    {client.context.slice(0, 3).map((ctx) => (
                      <div key={ctx.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ctx.contextType === 'priority' ? 'bg-red-100 text-red-700' :
                            ctx.contextType === 'transcript' ? 'bg-blue-100 text-blue-700' :
                            ctx.contextType === 'email' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {ctx.contextType}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(ctx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{ctx.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              {!client.hasRoadmap ? (
                <div className="text-center py-12">
                  <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Roadmap not yet generated</p>
                  <p className="text-sm text-slate-400 mt-1">Client needs to complete Parts 1 & 2</p>
                </div>
              ) : (
                <>
                  {/* Vision Summary */}
                  {vision && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                      <h3 className="font-semibold text-indigo-900 mb-3">5-Year Vision</h3>
                      <p className="text-lg font-medium text-indigo-800 mb-4">{vision.tagline}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['year1', 'year3', 'year5'].map((year, i) => (
                          <div key={year} className="bg-white rounded-lg p-4">
                            <p className="text-xs text-indigo-600 font-medium mb-1">Year {i === 0 ? 1 : i === 1 ? 3 : 5}</p>
                            <p className="text-sm font-medium text-slate-900">{vision.yearMilestones?.[year]?.headline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 12-Week Sprint */}
                  {sprint?.weeks && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">12-Week Sprint</h3>
                      <div className="space-y-2">
                        {sprint.weeks.map((week: any) => (
                          <div key={week.weekNumber} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium text-sm">
                                  {week.weekNumber}
                                </span>
                                <div>
                                  <p className="font-medium text-slate-900">{week.theme}</p>
                                  <p className="text-sm text-slate-500">{week.focus}</p>
                                </div>
                              </div>
                              <span className="text-sm text-slate-400">{week.tasks?.length || 0} tasks</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Context Tab */}
          {activeTab === 'context' && (
            <div className="space-y-6">
              {/* Add Context Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddContext(!showAddContext)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Context
                </button>
              </div>

              {/* Add Context Form */}
              {showAddContext && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-4">Add New Context</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                          value={newContext.type}
                          onChange={(e) => setNewContext({ ...newContext, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="note">Note</option>
                          <option value="transcript">Call Transcript</option>
                          <option value="email">Email Thread</option>
                          <option value="priority">Priority / Action</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select
                          value={newContext.priority}
                          onChange={(e) => setNewContext({ ...newContext, priority: e.target.value as any })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                      <textarea
                        value={newContext.content}
                        onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
                        rows={5}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter context, transcript, or notes..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowAddContext(false)}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddContext}
                        disabled={addingContext || !newContext.content.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                      >
                        {addingContext && <Loader2 className="w-4 h-4 animate-spin" />}
                        Add Context
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Context List */}
              {client.context.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No context added yet</p>
                  <p className="text-sm text-slate-400 mt-1">Add meeting transcripts, emails, or notes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.context.map((ctx) => (
                    <div key={ctx.id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            ctx.contextType === 'priority' ? 'bg-red-100 text-red-700' :
                            ctx.contextType === 'transcript' ? 'bg-blue-100 text-blue-700' :
                            ctx.contextType === 'email' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ctx.contextType === 'priority' && <Flag className="w-3 h-3 inline mr-1" />}
                            {ctx.contextType === 'transcript' && <FileText className="w-3 h-3 inline mr-1" />}
                            {ctx.contextType === 'email' && <Mail className="w-3 h-3 inline mr-1" />}
                            {ctx.contextType === 'note' && <MessageSquare className="w-3 h-3 inline mr-1" />}
                            {ctx.contextType}
                          </span>
                          {ctx.priorityLevel !== 'normal' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ctx.priorityLevel === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {ctx.priorityLevel}
                            </span>
                          )}
                          {!ctx.processed && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {ctx.addedByName} • {new Date(ctx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{ctx.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assessments Tab */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              {/* Part 1 */}
              <AssessmentSection
                title="Part 1: Life Design"
                status={client.assessments.part1}
                responses={client.assessmentResponses.part1}
              />
              
              {/* Part 2 */}
              <AssessmentSection
                title="Part 2: Business Deep Dive"
                status={client.assessments.part2}
                responses={client.assessmentResponses.part2}
              />

              {/* Part 3 */}
              <AssessmentSection
                title="Part 3: Hidden Value Audit"
                status={client.assessments.part3}
                responses={client.assessmentResponses.part3}
              />
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </Layout>
  );
}

function AssessmentSection({ 
  title, 
  status, 
  responses 
}: { 
  title: string; 
  status: string; 
  responses: any 
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            status === 'completed' ? 'bg-emerald-500 text-white' :
            status === 'in_progress' ? 'bg-amber-500 text-white' :
            'bg-slate-200 text-slate-500'
          }`}>
            {status === 'completed' ? <CheckCircle className="w-4 h-4" /> : 
             status === 'in_progress' ? <Clock className="w-4 h-4" /> : 
             <AlertCircle className="w-4 h-4" />}
          </div>
          <span className="font-medium text-slate-900">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
            status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {status === 'not_started' ? 'Not Started' : status === 'in_progress' ? 'In Progress' : 'Completed'}
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {expanded && responses && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(responses).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p className="text-sm text-slate-900">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && !responses && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className="text-sm text-slate-500">No responses yet</p>
        </div>
      )}
    </div>
  );
}

