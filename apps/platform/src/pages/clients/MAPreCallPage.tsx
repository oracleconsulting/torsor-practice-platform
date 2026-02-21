// ============================================================================
// Management Accounts Pre-Call Preparation Page
// ============================================================================
// Admin view for preparing for MA sales calls
// Shows: auto-populated data, gaps to fill, AI analysis, talking points
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Calendar,
  FileText,
  MessageSquare,
  Lightbulb,
  Target,
  DollarSign,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface MAEngagement {
  id: string;
  client_id: string;
  status: string;
  recommended_tier: string | null;
  tier_rationale: string | null;
  ai_analysis: any;
  ai_analysis_generated_at: string | null;
  pre_call_completed_at: string | null;
  presentation_generated_at: string | null;
  selected_tier: string | null;
}

interface AssessmentResponse {
  question_id: string;
  response: any;
}

interface PrecallGap {
  id: string;
  gap_category: string;
  gap_question: string;
  gap_type: string;
  gap_options: string[] | null;
  is_filled: boolean;
  response: any;
}

interface TalkingPoint {
  id: string;
  point_category: string;
  point_title: string;
  point_content: string;
  objection_response: string | null;
  source_question_id: string | null;
  source_answer: string | null;
}

interface ClientProfile {
  company_number: string | null;
  accounting_software: string | null;
  year_end_month: number | null;
  vat_registered: boolean | null;
  vat_quarter: string | null;
  annual_revenue_estimate: number | null;
  headcount_estimate: number | null;
  bookkeeper: string | null;
  bookkeeping_frequency: string | null;
  verified_fields: Record<string, boolean>;
}

const TIER_COLORS = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  silver: 'bg-slate-100 text-slate-800 border-slate-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  platinum: 'bg-purple-100 text-purple-800 border-purple-300'
};

const TIER_PRICES = {
  bronze: '£750',
  silver: '£1,500',
  gold: '£3,000',
  platinum: '£5,000'
};

export default function MAPreCallPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [engagement, setEngagement] = useState<MAEngagement | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [gaps, setGaps] = useState<PrecallGap[]>([]);
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    gaps: true,
    analysis: true,
    talking: false,
    objections: false
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  if (!clientId) {
    return <Navigate to="/clients" replace />;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      // Load client
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('id, name, email, client_company')
        .eq('id', clientId)
        .single();
      
      if (clientData) {
        setClient({
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          company: clientData.client_company
        });
      }

      // Load MA engagement
      const { data: engagementData } = await supabase
        .from('ma_engagements')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (engagementData) {
        setEngagement(engagementData);

        // Load assessment responses
        const { data: responsesData } = await supabase
          .from('ma_assessment_responses')
          .select('responses')
          .eq('engagement_id', engagementData.id)
          .maybeSingle();
        
        if (responsesData?.responses) {
          setResponses(responsesData.responses);
        }

        // Load gaps
        const { data: gapsData } = await supabase
          .from('ma_precall_gaps')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('display_order');
        
        if (gapsData) {
          setGaps(gapsData);
        }

        // Load talking points
        const { data: pointsData } = await supabase
          .from('ma_talking_points')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('display_order');
        
        if (pointsData) {
          setTalkingPoints(pointsData);
        }

        // Load client profile
        const { data: profileData } = await supabase
          .from('ma_client_profile')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .maybeSingle();
        
        if (profileData) {
          setClientProfile(profileData);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!engagement) return;
    
    setGeneratingAnalysis(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ma-precall-analysis', {
        body: { engagementId: engagement.id }
      });
      
      if (error) throw error;
      
      // Reload data to get updated analysis
      await loadData();
    } catch (err) {
      console.error('Error generating analysis:', err);
      alert('Failed to generate analysis. Please try again.');
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const updateGap = async (gapId: string, response: any) => {
    try {
      await supabase
        .from('ma_precall_gaps')
        .update({ 
          response, 
          is_filled: !!response,
          filled_at: new Date().toISOString()
        })
        .eq('id', gapId);
      
      setGaps(gaps.map(g => g.id === gapId ? { ...g, response, is_filled: !!response } : g));
    } catch (err) {
      console.error('Error updating gap:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
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

  if (!client || !engagement) {
    return (
      <Layout 
        title="Not Found" 
        breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Not Found' }]}
      >
        <div className="text-center py-12">
          <p className="text-slate-500">Client or MA engagement not found</p>
        </div>
      </Layout>
    );
  }

  const analysis = engagement.ai_analysis;
  const painPoints = analysis?.primary_pain_points || [];
  const recommendedTier = analysis?.recommended_tier || engagement.recommended_tier;

  return (
    <Layout 
      title={`MA Pre-Call: ${client.name}`}
      subtitle={client.company || client.email}
      breadcrumbs={[
        { label: 'Clients', href: '/clients' }, 
        { label: client.name, href: `/clients/${client.id}` },
        { label: 'MA Pre-Call' }
      ]}
    >
      {/* Header with client info and actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
              <p className="text-slate-500">{client.company || client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {recommendedTier && (
              <div className={`px-4 py-2 rounded-lg border-2 font-medium ${TIER_COLORS[recommendedTier as keyof typeof TIER_COLORS]}`}>
                Recommended: {recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1)} ({TIER_PRICES[recommendedTier as keyof typeof TIER_PRICES]}/mo)
              </div>
            )}
            <button
              onClick={generateAnalysis}
              disabled={generatingAnalysis}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
            >
              {generatingAnalysis ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {analysis ? 'Regenerate Analysis' : 'Generate Analysis'}
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <StatusIndicator
            label="Assessment"
            completed={Object.keys(responses).length > 0}
            detail={`${Object.keys(responses).length} responses`}
          />
          <StatusIndicator
            label="Gaps Filled"
            completed={gaps.filter(g => g.is_filled).length === gaps.length}
            detail={`${gaps.filter(g => g.is_filled).length}/${gaps.length}`}
          />
          <StatusIndicator
            label="AI Analysis"
            completed={!!analysis}
            detail={analysis ? 'Ready' : 'Not generated'}
          />
          <StatusIndicator
            label="Pre-Call Complete"
            completed={!!engagement.pre_call_completed_at}
            detail={engagement.pre_call_completed_at ? 'Completed' : 'Pending'}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content - 2 cols */}
        <div className="col-span-2 space-y-6">
          
          {/* AI Analysis */}
          <CollapsibleSection
            title="AI Analysis"
            icon={<Lightbulb className="w-5 h-5" />}
            expanded={expandedSections.analysis}
            onToggle={() => toggleSection('analysis')}
            badge={analysis ? 'Ready' : 'Generate to see'}
          >
            {!analysis ? (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Click "Generate Analysis" to create AI-powered insights</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Primary Pain Points */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Primary Pain Points</h4>
                  <div className="space-y-4">
                    {painPoints.map((pain: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-slate-900">{pain.title}</h5>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            pain.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                            pain.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {pain.confidence} confidence
                          </span>
                        </div>
                        <ul className="space-y-1 text-sm text-slate-600">
                          {pain.evidence?.map((e: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                        {pain.quote && (
                          <blockquote className="mt-3 pl-3 border-l-2 border-indigo-300 text-sm italic text-slate-600">
                            "{pain.quote}"
                          </blockquote>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier Recommendation */}
                {analysis.tier_recommendation && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-2">Recommended Tier: {analysis.tier_recommendation.tier?.toUpperCase()}</h4>
                    <p className="text-sm text-indigo-800 mb-3">{analysis.tier_recommendation.rationale}</p>
                    <div className="text-xs text-indigo-600">
                      <strong>Key factors:</strong> {analysis.tier_recommendation.key_factors?.join(', ')}
                    </div>
                  </div>
                )}

                {/* Scenarios to Pre-Build */}
                {analysis.scenarios_to_build && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Scenarios to Pre-Build</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.scenarios_to_build.map((scenario: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                          {scenario}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Talking Points */}
          <CollapsibleSection
            title="Talking Points"
            icon={<MessageSquare className="w-5 h-5" />}
            expanded={expandedSections.talking}
            onToggle={() => toggleSection('talking')}
            badge={`${talkingPoints.filter(t => t.point_category !== 'objection').length} points`}
          >
            <div className="space-y-4">
              {/* Opening */}
              <TalkingPointGroup
                title="Open With"
                points={talkingPoints.filter(t => t.point_category === 'opening')}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
              />
              
              {/* Pain References */}
              <TalkingPointGroup
                title="Reference Their Pain"
                points={talkingPoints.filter(t => t.point_category === 'pain_reference')}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
              />
              
              {/* Destination */}
              <TalkingPointGroup
                title="Paint the Destination"
                points={talkingPoints.filter(t => t.point_category === 'destination')}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
              />

              {/* Questions */}
              <TalkingPointGroup
                title="Questions to Ask"
                points={talkingPoints.filter(t => t.point_category === 'question')}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
              />
            </div>
          </CollapsibleSection>

          {/* Objection Handling */}
          <CollapsibleSection
            title="Objection Handling"
            icon={<Target className="w-5 h-5" />}
            expanded={expandedSections.objections}
            onToggle={() => toggleSection('objections')}
            badge={`${talkingPoints.filter(t => t.point_category === 'objection').length} prepared`}
          >
            <div className="space-y-3">
              {talkingPoints.filter(t => t.point_category === 'objection').map((point) => (
                <div key={point.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-slate-900">"{point.point_title}"</h5>
                    <button
                      onClick={() => copyToClipboard(point.objection_response || point.point_content, point.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedId === point.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">{point.objection_response || point.point_content}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Assessment Responses - Quick View */}
          <CollapsibleSection
            title="Assessment Responses"
            icon={<FileText className="w-5 h-5" />}
            expanded={false}
            onToggle={() => {}}
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(responses).map(([key, value]) => (
                <div key={key} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1 font-medium">
                    {key.replace(/ma_/g, '').replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-slate-800">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          {/* Client Profile (Auto-populated) */}
          <CollapsibleSection
            title="Client Profile"
            icon={<Building className="w-5 h-5" />}
            expanded={expandedSections.profile}
            onToggle={() => toggleSection('profile')}
          >
            <div className="space-y-3">
              <ProfileField 
                label="Company Number" 
                value={clientProfile?.company_number} 
                verified={clientProfile?.verified_fields?.company_number}
              />
              <ProfileField 
                label="Accounting Software" 
                value={clientProfile?.accounting_software} 
                verified={clientProfile?.verified_fields?.accounting_software}
              />
              <ProfileField 
                label="Year End" 
                value={clientProfile?.year_end_month ? `Month ${clientProfile.year_end_month}` : null} 
                verified={clientProfile?.verified_fields?.year_end_month}
              />
              <ProfileField 
                label="VAT Registered" 
                value={clientProfile?.vat_registered != null ? (clientProfile.vat_registered ? 'Yes' : 'No') : null} 
                verified={clientProfile?.verified_fields?.vat_registered}
              />
              <ProfileField 
                label="VAT Quarter" 
                value={clientProfile?.vat_quarter} 
                verified={clientProfile?.verified_fields?.vat_quarter}
              />
              <ProfileField 
                label="Annual Revenue" 
                value={clientProfile?.annual_revenue_estimate ? `£${clientProfile.annual_revenue_estimate.toLocaleString()}` : null} 
                verified={clientProfile?.verified_fields?.annual_revenue_estimate}
              />
              <ProfileField 
                label="Headcount" 
                value={clientProfile?.headcount_estimate?.toString()} 
                verified={clientProfile?.verified_fields?.headcount_estimate}
              />
              <ProfileField 
                label="Bookkeeper" 
                value={clientProfile?.bookkeeper} 
                verified={clientProfile?.verified_fields?.bookkeeper}
              />
              <ProfileField 
                label="Bookkeeping Frequency" 
                value={clientProfile?.bookkeeping_frequency} 
                verified={clientProfile?.verified_fields?.bookkeeping_frequency}
              />
            </div>
          </CollapsibleSection>

          {/* Gaps to Fill */}
          <CollapsibleSection
            title="Gaps to Fill"
            icon={<AlertTriangle className="w-5 h-5" />}
            expanded={expandedSections.gaps}
            onToggle={() => toggleSection('gaps')}
            badge={`${gaps.filter(g => !g.is_filled).length} remaining`}
          >
            <div className="space-y-4">
              {Object.entries(
                gaps.reduce((acc, gap) => {
                  if (!acc[gap.gap_category]) acc[gap.gap_category] = [];
                  acc[gap.gap_category].push(gap);
                  return acc;
                }, {} as Record<string, PrecallGap[]>)
              ).map(([category, categoryGaps]) => (
                <div key={category}>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {category.replace(/_/g, ' ')}
                  </h5>
                  <div className="space-y-2">
                    {categoryGaps.map((gap) => (
                      <GapField
                        key={gap.id}
                        gap={gap}
                        onUpdate={(response) => updateGap(gap.id, response)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.open(`/clients/${clientId}/ma-presentation`, '_blank')}
                className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
              >
                <span className="font-medium">View Client Presentation</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
              >
                <span className="font-medium">Mark Pre-Call Complete</span>
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
              >
                <span className="font-medium">Send Presentation to Client</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusIndicator({ label, completed, detail }: { label: string; completed: boolean; detail: string }) {
  return (
    <div className="text-center">
      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
        completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
      }`}>
        {completed ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      </div>
      <p className="text-sm font-medium text-slate-900 mt-2">{label}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function CollapsibleSection({ 
  title, 
  icon, 
  expanded, 
  onToggle, 
  badge,
  children 
}: { 
  title: string; 
  icon: React.ReactNode;
  expanded: boolean; 
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-500">{icon}</div>
          <span className="font-semibold text-slate-900">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {expanded && (
        <div className="p-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value, verified }: { label: string; value: string | null | undefined; verified?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || '—'}
        </span>
        {value && (
          verified ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )
        )}
      </div>
    </div>
  );
}

function GapField({ gap, onUpdate }: { gap: PrecallGap; onUpdate: (response: any) => void }) {
  const [value, setValue] = useState(gap.response || '');

  const handleBlur = () => {
    if (value !== gap.response) {
      onUpdate(value);
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${gap.is_filled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
      <label className="block text-sm text-slate-700 mb-1">{gap.gap_question}</label>
      {gap.gap_type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter response..."
        />
      )}
      {gap.gap_type === 'select' && gap.gap_options && (
        <select
          value={value}
          onChange={(e) => { setValue(e.target.value); onUpdate(e.target.value); }}
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select...</option>
          {gap.gap_options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}
      {gap.gap_type === 'multi_select' && gap.gap_options && (
        <div className="space-y-1">
          {gap.gap_options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(value || []).includes(opt)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...(value || []), opt]
                    : (value || []).filter((v: string) => v !== opt);
                  setValue(newValue);
                  onUpdate(newValue);
                }}
                className="rounded text-indigo-600"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function TalkingPointGroup({ 
  title, 
  points, 
  copyToClipboard, 
  copiedId 
}: { 
  title: string; 
  points: TalkingPoint[];
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  if (points.length === 0) return null;
  
  return (
    <div>
      <h4 className="font-medium text-slate-900 mb-2">{title}</h4>
      <div className="space-y-2">
        {points.map((point) => (
          <div key={point.id} className="bg-slate-50 rounded-lg p-3 group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-700">{point.point_content}</p>
                {point.source_answer && (
                  <p className="text-xs text-slate-500 mt-1 italic">
                    Based on: "{point.source_answer.substring(0, 80)}..."
                  </p>
                )}
              </div>
              <button
                onClick={() => copyToClipboard(point.point_content, point.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity ml-2"
              >
                {copiedId === point.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

