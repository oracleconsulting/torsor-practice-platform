// ============================================================================
// DISCOVERY ADMIN MODAL
// ============================================================================
// Admin view for managing Discovery Assessment and generating reports
// Mirrors the Systems Audit modal structure with two-pass generation
// Now includes: Analysis Comment System for learning library integration
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import {
  X,
  Loader2,
  Sparkles,
  FileText,
  Upload,
  Plus,
  Save,
  Send,
  RefreshCw,
  AlertTriangle,
  Clock,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Briefcase,
  Award,
  Trash2,
  BookOpen,
  Quote,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  DollarSign,
  Phone,
  Eye
} from 'lucide-react';
import { EnabledByLink } from '../ServiceDetailPopup';
import { 
  SectionCommentBox, 
  LearningReviewPanel, 
  useAnalysisComments 
} from './AnalysisCommentSystem';

interface DiscoveryAdminModalProps {
  clientId: string;
  onClose: () => void;
}

interface ServiceScore {
  code: string;
  name: string;
  score: number;
  confidence: number;
  triggers: string[];
  priority: number;
  recommended: boolean;
}

const SERVICE_ICONS: Record<string, any> = {
  '365_method': Target,
  'management_accounts': BarChart3,
  'systems_audit': Settings,
  'automation': Settings,
  'fractional_cfo': TrendingUp,
  'fractional_coo': Users,
  'combined_advisory': Briefcase,
  'business_advisory': Award,
  'benchmarking': BarChart3,
};

export function DiscoveryAdminModal({ clientId, onClose }: DiscoveryAdminModalProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  const [activeTab, setActiveTab] = useState<'responses' | 'context' | 'report' | 'learning'>('responses');
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<any>(null);
  const [discovery, setDiscovery] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [contextNotes, setContextNotes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [clientName, setClientName] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [generatingPass, setGeneratingPass] = useState<1 | 2 | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'script' | 'client'>('admin');
  const [publishing, setPublishing] = useState(false);
  
  // Context note form
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({
    note_type: 'discovery_call' as string,
    title: '',
    content: '',
    related_service_code: '',
    source: '',
  });
  const [savingContext, setSavingContext] = useState(false);
  
  // Document upload
  const [uploading, setUploading] = useState(false);
  
  // Analysis comments (for learning system)
  const { 
    comments: analysisComments, 
    refetch: refetchComments 
  } = useAnalysisComments(engagement?.id, report?.id);

  useEffect(() => {
    if (currentMember?.practice_id) {
      fetchData();
    }
  }, [clientId, currentMember?.practice_id]);

  const fetchData = async () => {
    if (!currentMember?.practice_id) return;
    
    setLoading(true);
    try {
      // Fetch client info
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('name, client_company, email')
        .eq('id', clientId)
        .single();
      
      if (clientData) {
        setClientName(clientData.client_company || clientData.name || 'Client');
      }

      // Fetch engagement
      const { data: engagementData, error: engError } = await supabase
        .from('discovery_engagements')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (engError) {
        console.error('Error fetching engagement:', engError);
      }

      if (engagementData) {
        setEngagement(engagementData);

        // Fetch discovery responses
        if (engagementData.discovery_id) {
          const { data: discoveryData } = await supabase
            .from('destination_discovery')
            .select('*')
            .eq('id', engagementData.discovery_id)
            .single();
          
          setDiscovery(discoveryData);
        }

        // Fetch report
        const { data: reportData } = await supabase
          .from('discovery_reports')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .maybeSingle();
        
        setReport(reportData);

        // Fetch context notes
        const { data: notesData } = await supabase
          .from('discovery_context_notes')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('created_at', { ascending: false });
        
        setContextNotes(notesData || []);

        // Fetch documents
        const { data: docsData } = await supabase
          .from('discovery_uploaded_documents')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('uploaded_at', { ascending: false });
        
        setDocuments(docsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPass1 = async () => {
    if (!engagement) return;
    
    setGenerating(true);
    setGeneratingPass(1);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-discovery-report-pass1', {
        body: { engagementId: engagement.id }
      });

      if (error) throw error;
      
      console.log('Pass 1 complete:', data);
      await fetchData();
    } catch (error: any) {
      console.error('Pass 1 error:', error);
      alert(`Error running analysis: ${error.message}`);
    } finally {
      setGenerating(false);
      setGeneratingPass(null);
    }
  };

  const handleRunPass2 = async () => {
    if (!engagement) return;
    
    setGenerating(true);
    setGeneratingPass(2);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-discovery-report-pass2', {
        body: { engagementId: engagement.id }
      });

      if (error) throw error;
      
      console.log('Pass 2 complete:', data);
      await fetchData();
    } catch (error: any) {
      console.error('Pass 2 error:', error);
      alert(`Error generating narrative: ${error.message}`);
    } finally {
      setGenerating(false);
      setGeneratingPass(null);
    }
  };

  const handlePublishReport = async () => {
    if (!engagement || !report) return;
    
    // Check data completeness
    const completenessScore = report.data_completeness_score || 0;
    const missingCritical = report.missing_critical_data || [];
    
    if (missingCritical.length > 0) {
      const proceed = window.confirm(
        `⚠️ This report is missing critical data:\n\n${missingCritical.join('\n')}\n\n` +
        `Data completeness: ${completenessScore}%\n\n` +
        `Publishing with incomplete data may result in a less effective report for the client.\n\n` +
        `Are you sure you want to publish anyway?`
      );
      if (!proceed) return;
    }
    
    setPublishing(true);
    try {
      await supabase
        .from('discovery_reports')
        .update({ 
          status: 'published',
          ready_for_client: true,
          published_to_client_at: new Date().toISOString(),
          published_by: user?.id
        })
        .eq('id', report.id);
      
      await supabase
        .from('discovery_engagements')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', engagement.id);
      
      await fetchData();
      alert('Report published and now visible to client!');
    } catch (error: any) {
      alert(`Error publishing: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleAddContextNote = async () => {
    if (!engagement || !newContext.title || !newContext.content) return;
    
    setSavingContext(true);
    try {
      const { error } = await supabase
        .from('discovery_context_notes')
        .insert({
          engagement_id: engagement.id,
          note_type: newContext.note_type,
          title: newContext.title,
          content: newContext.content,
          related_service_code: newContext.related_service_code || null,
          source: newContext.source || null,
          created_by: user?.id,
          is_for_ai_analysis: true
        });

      if (error) throw error;
      
      setNewContext({
        note_type: 'discovery_call',
        title: '',
        content: '',
        related_service_code: '',
        source: '',
      });
      setShowAddContext(false);
      await fetchData();
    } catch (error: any) {
      alert(`Error saving note: ${error.message}`);
    } finally {
      setSavingContext(false);
    }
  };

  const handleDeleteContextNote = async (noteId: string) => {
    if (!confirm('Delete this context note?')) return;
    
    try {
      await supabase
        .from('discovery_context_notes')
        .delete()
        .eq('id', noteId);
      
      await fetchData();
    } catch (error: any) {
      alert(`Error deleting note: ${error.message}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!engagement || !event.target.files?.length) return;
    
    setUploading(true);
    try {
      const file = event.target.files[0];
      const filePath = `${engagement.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('discovery-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('discovery_uploaded_documents')
        .insert({
          engagement_id: engagement.id,
          filename: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size_bytes: file.size,
          uploaded_by: user?.id,
          is_for_ai_analysis: true
        });

      if (insertError) throw insertError;
      
      await fetchData();
    } catch (error: any) {
      alert(`Error uploading: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'pending_responses': { color: 'yellow', label: 'Awaiting Responses' },
      'responses_complete': { color: 'blue', label: 'Ready for Analysis' },
      'pass1_processing': { color: 'indigo', label: 'Running Analysis...' },
      'pass1_complete': { color: 'cyan', label: 'Analysis Complete' },
      'adding_context': { color: 'amber', label: 'Adding Context' },
      'pass2_processing': { color: 'purple', label: 'Generating Report...' },
      'pass2_complete': { color: 'emerald', label: 'Report Ready' },
      'approved': { color: 'green', label: 'Approved' },
      'published': { color: 'green', label: 'Published' },
    };
    
    const badge = badges[status] || { color: 'gray', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${badge.color}-100 text-${badge.color}-700 dark:bg-${badge.color}-900/30 dark:text-${badge.color}-400`}>
        {badge.label}
      </span>
    );
  };

  const renderServiceScores = () => {
    if (!report?.service_scores) return null;
    
    const scores = report.service_scores as Record<string, ServiceScore>;
    const sortedScores = Object.values(scores)
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return (
      <div className="space-y-3">
        {sortedScores.map((service) => {
          const Icon = SERVICE_ICONS[service.code] || Target;
          const isRecommended = service.recommended;
          
          return (
            <div
              key={service.code}
              className={`p-4 rounded-lg border ${
                isRecommended 
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${isRecommended ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{service.name}</span>
                  {isRecommended && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{service.score}</span>
                  <span className="text-gray-500">/100</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2">
                <div
                  className={`h-full rounded-full ${
                    service.score >= 70 ? 'bg-emerald-500' :
                    service.score >= 50 ? 'bg-blue-500' :
                    service.score >= 30 ? 'bg-amber-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${service.score}%` }}
                />
              </div>
              
              {/* Top triggers */}
              {service.triggers.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {service.triggers.slice(0, 3).map((trigger, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        {trigger}
                      </span>
                    ))}
                    {service.triggers.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500">
                        +{service.triggers.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetectionPatterns = () => {
    if (!report?.detection_patterns) return null;
    
    const patterns = report.detection_patterns;
    
    return (
      <div className="space-y-3">
        {patterns.burnoutDetected && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-700 dark:text-red-300">Burnout Pattern Detected</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">
              {patterns.burnoutFlags} indicators: {patterns.burnoutIndicators?.join(', ')}
            </p>
          </div>
        )}
        
        {patterns.capitalRaisingDetected && (
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700 dark:text-blue-300">Capital Raising Pattern</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Signals: {patterns.capitalSignals?.join(', ')}
            </p>
          </div>
        )}
        
        {patterns.lifestyleTransformationDetected && (
          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-700 dark:text-purple-300">Lifestyle Transformation Pattern</span>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Signals: {patterns.lifestyleSignals?.join(', ')}
            </p>
          </div>
        )}
        
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">Urgency Multiplier</span>
            <span className="text-lg font-bold">{patterns.urgencyMultiplier}x</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Change Readiness: {report.change_readiness}
          </p>
        </div>
      </div>
    );
  };

  const renderEmotionalAnchors = () => {
    if (!report?.emotional_anchors) return null;
    
    const anchors = report.emotional_anchors;
    const anchorLabels: Record<string, string> = {
      tuesdayTest: 'Their Vision (Tuesday Test)',
      magicFix: 'Their Magic Fix',
      coreFrustration: 'Core Frustration',
      emergencyLog: 'Emergency Log',
      relationshipMirror: 'Business Relationship',
      sacrificeList: 'What They\'ve Sacrificed',
      hardTruth: 'Hard Truth',
      suspectedTruth: 'What They Suspect',
      operationalFrustration: 'Operational Frustration',
      finalInsight: 'Final Insight',
    };

    return (
      <div className="space-y-4">
        {Object.entries(anchors)
          .filter(([, value]) => value && String(value).trim())
          .map(([key, value]) => (
            <div key={key} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {anchorLabels[key] || key}
              </h4>
              <p className="text-gray-900 dark:text-white italic">"{String(value)}"</p>
            </div>
          ))}
      </div>
    );
  };

  // ============================================================================
  // CALL SCRIPT GENERATOR - For admin to use during discovery calls
  // ============================================================================
  const renderCallScript = () => {
    const firstName = clientName?.split(' ')[0] || 'there';
    const missingCritical = report?.missing_critical_data || [];
    const missingImportant = report?.missing_important_data || [];
    const anchors = report?.emotional_anchors || {};
    
    // Questions mapped to missing data fields
    const questionBank: Record<string, { question: string; followUp: string; capture: string }> = {
      'Tuesday Vision (5-year picture)': {
        question: `"${firstName}, I want to understand what success really looks like for you. Forget the business for a second - paint me a picture of your ideal Tuesday, five years from now. What time do you wake up? What does your morning look like? Who are you with?"`,
        followUp: `"And what are you NOT doing on that Tuesday? What have you stopped doing?"`,
        capture: 'Capture: Specific times, activities, people, feelings, what they\'ve stopped doing'
      },
      'Core Frustration': {
        question: `"${firstName}, when you think about your business right now, what frustrates you most? Not the daily annoyances, but the deep stuff - the thing that makes you think 'why is this still happening?'"`,
        followUp: `"How long has that been the case? What have you tried to fix it?"`,
        capture: 'Capture: The frustration, how long, what they\'ve tried'
      },
      'Emergency Log (recent disruptions)': {
        question: `"${firstName}, think about the last month. What emergencies or unexpected issues pulled you away from what you should have been doing? Walk me through the last few times you had to drop everything."`,
        followUp: `"How many hours a week would you say you spend firefighting vs. actual work that moves things forward?"`,
        capture: 'Capture: Specific emergencies, patterns, hours lost'
      },
      'Business Relationship Metaphor': {
        question: `"${firstName}, if your relationship with your business was a relationship with a person, what kind would it be? How would you describe it to a friend?"`,
        followUp: `"What would need to change for that relationship to feel healthy?"`,
        capture: 'Capture: Their metaphor, emotional language'
      },
      'Sacrifice List (what they\'ve given up)': {
        question: `"${firstName}, building a business always costs something. What have you sacrificed? What have you given up or put on hold?"`,
        followUp: `"How does your family/partner feel about those sacrifices?"`,
        capture: 'Capture: Specific sacrifices, family impact, health, hobbies'
      },
      'Suspected Truth (financial gut feeling)': {
        question: `"${firstName}, what do you suspect about your numbers that you haven't had time to confirm? If I said 'I bet you already know something's not right' - what would you point to?"`,
        followUp: `"Which customers or jobs do you think might not be as profitable as they seem?"`,
        capture: 'Capture: Financial suspicions, specific customers/jobs'
      },
      'Magic Fix (first change)': {
        question: `"${firstName}, if I could wave a magic wand and fix ONE thing in your business tomorrow - what would make the biggest difference to your day-to-day?"`,
        followUp: `"Why hasn't that been fixed already?"`,
        capture: 'Capture: The one thing, barriers to fixing it'
      },
      'Hard Truth (avoided conversation)': {
        question: `"${firstName}, is there a conversation you've been avoiding? Someone you need to talk to but haven't? A decision you've been putting off?"`,
        followUp: `"What's holding you back from having that conversation?"`,
        capture: 'Capture: The person, the conversation, barriers'
      },
      'Operational Frustration': {
        question: `"${firstName}, what processes or systems in your business make you think 'why does this take so long?' or 'why is this still so manual?'"`,
        followUp: `"What percentage of your team's time do you think goes on manual work that should be automated?"`,
        capture: 'Capture: Specific processes, time wasted, manual work %'
      },
    };
    
    const allMissing = [...missingCritical, ...missingImportant];
    
    return (
      <div className="space-y-6 print:space-y-4">
        {/* Opening Script */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📞 Call Opening</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 italic leading-relaxed">
            "{firstName}, thanks for taking this call. I've been through your Discovery Assessment and I've got a good sense of where things are - but I want to make sure I really understand your situation before we put anything together for you.
            <br /><br />
            This isn't a sales call. I just need to fill in some gaps so the report we create actually speaks to YOUR situation, not some generic advice.
            <br /><br />
            Is now still a good time? Great. This should take about 20-30 minutes."
          </p>
        </div>
        
        {/* What we already know */}
        {Object.keys(anchors).length > 0 && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">✓ What We Already Know</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Reference these during the call to show you've done your homework:</p>
            <ul className="text-sm space-y-2">
              {anchors.tuesdayTest && <li><strong>Vision:</strong> "{String(anchors.tuesdayTest).substring(0, 100)}..."</li>}
              {anchors.coreFrustration && <li><strong>Frustration:</strong> "{String(anchors.coreFrustration).substring(0, 100)}..."</li>}
              {anchors.emergencyLog && <li><strong>Recent emergencies:</strong> "{String(anchors.emergencyLog).substring(0, 100)}..."</li>}
              {anchors.sacrificeList && <li><strong>Sacrifices:</strong> "{String(anchors.sacrificeList).substring(0, 100)}..."</li>}
            </ul>
          </div>
        )}
        
        {/* Questions to Ask */}
        {allMissing.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Questions to Ask ({allMissing.length})
            </h4>
            
            {allMissing.map((field, idx) => {
              const q = questionBank[field];
              if (!q) return null;
              
              return (
                <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-purple-600">
                      Question {idx + 1}: {field}
                    </span>
                    {missingCritical.includes(field) && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Critical</span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic">
                        {q.question}
                      </p>
                    </div>
                    
                    <div className="pl-4 border-l-2 border-purple-300">
                      <p className="text-xs text-gray-500 uppercase mb-1">Follow-up:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">{q.followUp}</p>
                    </div>
                    
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-400">
                      💡 {q.capture}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">✓ All Key Data Captured</h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              No critical questions needed. You can use this call to clarify details or dive deeper into specific areas.
            </p>
          </div>
        )}
        
        {/* Closing Script */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📋 Call Closing</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
            "{firstName}, that's really helpful. I've got a much clearer picture now.
            <br /><br />
            What I'm going to do is take everything you've told me - both from the assessment and this call - and put together a proper report that shows you exactly where you are, what's in the way, and what a realistic path forward looks like.
            <br /><br />
            That report isn't generic advice - it'll be specific to your situation, using your numbers and your priorities.
            <br /><br />
            I should have that ready for you within [TIMEFRAME]. Does that work?"
          </p>
        </div>
        
        {/* After-Call Checklist */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">✅ After the Call</h4>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li>□ Add context notes with key quotes (use their exact words)</li>
            <li>□ Note any personal anchors (spouse name, kids' ages, health mentions)</li>
            <li>□ Record any specific numbers mentioned (hours, costs, team size)</li>
            <li>□ Re-run Pass 2 to generate updated report</li>
            <li>□ Review client view before publishing</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderClientReport = () => {
    // Check for new destination-focused structure
    const dest = report?.destination_report;
    const page1 = dest?.page1_destination || report?.page1_destination;
    const page2 = dest?.page2_gaps || report?.page2_gaps;
    const page3 = dest?.page3_journey || report?.page3_journey;
    const page4 = dest?.page4_numbers || report?.page4_numbers;
    const page5 = dest?.page5_nextSteps || dest?.page5_next_steps || report?.page5_next_steps;

    if (!page1 && !report?.headline) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Report narrative not yet generated</p>
          <p className="text-sm">Run Pass 2 to generate the destination-focused report</p>
        </div>
      );
    }

    // Render destination-focused 5-page structure
    return (
      <div className="space-y-10 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        {/* ================================================================ */}
        {/* PAGE 1: THE DESTINATION YOU DESCRIBED */}
        {/* ================================================================ */}
        {page1 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-widest">
              Page 1 - Your Vision
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {page1.headerLine || "The Tuesday You're Building Towards"}
            </h2>
            
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-amber-400">
              <p className="text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                "{page1.visionVerbatim}"
              </p>
            </div>
            
            {page1.destinationClarityScore && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(page1.destinationClarityScore / 10) * 100}%` }}
                  />
                </div>
                <span className="font-semibold">{page1.destinationClarityScore}/10</span>
              </div>
            )}
            
            {/* Feedback Box */}
            {engagement?.id && currentMember?.practice_id && (
              <SectionCommentBox
                engagementId={engagement.id}
                reportId={report?.id}
                practiceId={currentMember.practice_id}
                sectionType="page1_destination"
                originalContent={page1}
                existingComments={analysisComments}
                onCommentAdded={refetchComments}
              />
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 2: WHAT'S IN THE WAY */}
        {/* ================================================================ */}
        {page2 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <span className="text-xs font-medium text-rose-600 uppercase tracking-widest">
              Page 2 - The Gaps
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {page2.headerLine || "The Gap Between Here and There"}
            </h2>
            
            {page2.openingLine && (
              <p className="mt-2 text-gray-600 dark:text-gray-400 italic">
                {page2.openingLine}
              </p>
            )}
            
            <div className="mt-4 space-y-4">
              {page2.gaps?.map((gap: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg dark:border-gray-700">
                  <h3 className="font-semibold text-rose-700 dark:text-rose-400">{gap.title}</h3>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    <p className="italic">"{gap.pattern}"</p>
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {gap.costs?.map((cost: string, i: number) => (
                      <li key={i}>• {cost}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <strong>Shift:</strong> {gap.shiftRequired}
                  </p>
                  
                  {/* Feedback Box for individual gap */}
                  {engagement?.id && currentMember?.practice_id && (
                    <SectionCommentBox
                      engagementId={engagement.id}
                      reportId={report?.id}
                      practiceId={currentMember.practice_id}
                      sectionType="page2_gap_item"
                      sectionIndex={idx}
                      sectionIdentifier={gap.title}
                      originalContent={gap}
                      existingComments={analysisComments}
                      onCommentAdded={refetchComments}
                    />
                  )}
                </div>
              ))}
            </div>
            
            {/* Overall Page 2 Feedback Box */}
            {engagement?.id && currentMember?.practice_id && (
              <SectionCommentBox
                engagementId={engagement.id}
                reportId={report?.id}
                practiceId={currentMember.practice_id}
                sectionType="page2_gaps"
                originalContent={page2}
                existingComments={analysisComments}
                onCommentAdded={refetchComments}
              />
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 3: THE JOURNEY */}
        {/* ================================================================ */}
        {page3 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <span className="text-xs font-medium text-blue-600 uppercase tracking-widest">
              Page 3 - The Path Forward
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {page3.headerLine || "From Here to the 4pm Pickup"}
            </h2>
            
            {/* Timeline Labels */}
            {page3.timelineLabel && (
              <div className="mt-4 flex justify-between text-xs text-gray-500 px-2">
                <span>{page3.timelineLabel.now}</span>
                <span>{page3.timelineLabel.month3}</span>
                <span>{page3.timelineLabel.month6}</span>
                <span className="text-emerald-600 font-medium">{page3.timelineLabel.month12}</span>
              </div>
            )}
            
            <div className="mt-4 space-y-4">
              {page3.phases?.map((phase: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg dark:border-gray-700">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-2">
                    {phase.timeframe}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {phase.headline}
                  </h3>
                  {phase.whatChanges && (
                    <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {phase.whatChanges.map((change: string, i: number) => (
                        <li key={i}>✓ {change}</li>
                      ))}
                    </ul>
                  )}
                  {phase.feelsLike && (
                    <p className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm text-amber-800 dark:text-amber-300 italic">
                      {phase.feelsLike}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Enabled by: {phase.enabledBy} ({phase.price})
                  </p>
                  
                  {/* Feedback Box for individual phase */}
                  {engagement?.id && currentMember?.practice_id && (
                    <SectionCommentBox
                      engagementId={engagement.id}
                      reportId={report?.id}
                      practiceId={currentMember.practice_id}
                      sectionType="page3_phase"
                      sectionIndex={idx}
                      sectionIdentifier={phase.timeframe}
                      originalContent={phase}
                      existingComments={analysisComments}
                      onCommentAdded={refetchComments}
                    />
                  )}
                </div>
              ))}
            </div>
            
            {/* Overall Page 3 Feedback Box */}
            {engagement?.id && currentMember?.practice_id && (
              <SectionCommentBox
                engagementId={engagement.id}
                reportId={report?.id}
                practiceId={currentMember.practice_id}
                sectionType="page3_journey"
                originalContent={page3}
                existingComments={analysisComments}
                onCommentAdded={refetchComments}
              />
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 4: THE NUMBERS */}
        {/* ================================================================ */}
        {page4 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-widest">
              Page 4 - The Investment
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {page4.headerLine || "The Investment in Your Tuesday"}
            </h2>
            
            {/* Cost of Staying */}
            {page4.costOfStaying && (
              <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                  Cost of Staying
                </h3>
                <div className="mt-2 text-sm text-rose-600 dark:text-rose-400 space-y-1">
                  {page4.costOfStaying.labourInefficiency && (
                    <p>Labour inefficiency: {page4.costOfStaying.labourInefficiency}</p>
                  )}
                  {page4.costOfStaying.marginLeakage && (
                    <p>Margin leakage: {page4.costOfStaying.marginLeakage}</p>
                  )}
                </div>
                {page4.personalCost && (
                  <p className="mt-2 text-sm text-rose-800 dark:text-rose-300 font-medium">
                    {page4.personalCost}
                  </p>
                )}
              </div>
            )}
            
            {/* Investment */}
            {page4.investment && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Investment
                </h3>
                <div className="mt-2 space-y-1">
                  {page4.investment.map((inv: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{inv.phase}: {inv.whatYouGet}</span>
                      <span className="font-medium">{inv.amount}</span>
                    </div>
                  ))}
                </div>
                {page4.totalYear1 && (
                  <div className="mt-2 pt-2 border-t dark:border-gray-700 flex justify-between font-semibold">
                    <span>Total Year 1</span>
                    <span>{page4.totalYear1}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Returns */}
            {page4.returns && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Projected Return
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Conservative</p>
                    <p className="font-bold text-emerald-600">{page4.returns.conservative?.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Realistic</p>
                    <p className="font-bold text-emerald-600">{page4.returns.realistic?.total}</p>
                  </div>
                </div>
                {page4.realReturn && (
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300 italic">
                    But the real return? {page4.realReturn}
                  </p>
                )}
                
                {/* Feedback Box for returns */}
                {engagement?.id && currentMember?.practice_id && (
                  <SectionCommentBox
                    engagementId={engagement.id}
                    reportId={report?.id}
                    practiceId={currentMember.practice_id}
                    sectionType="page4_returns"
                    originalContent={page4.returns}
                    existingComments={analysisComments}
                    onCommentAdded={refetchComments}
                  />
                )}
              </div>
            )}
            
            {/* Overall Page 4 Feedback Box */}
            {engagement?.id && currentMember?.practice_id && (
              <SectionCommentBox
                engagementId={engagement.id}
                reportId={report?.id}
                practiceId={currentMember.practice_id}
                sectionType="page4_investment"
                originalContent={page4}
                existingComments={analysisComments}
                onCommentAdded={refetchComments}
              />
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 5: NEXT STEPS */}
        {/* ================================================================ */}
        {page5 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest">
              Page 5 - Next Steps
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {page5.headerLine || "Starting The Journey"}
            </h2>
            
            {page5.thisWeek && (
              <div className="mt-4 p-4 border rounded-lg dark:border-gray-700">
                <h3 className="font-semibold">This Week</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{page5.thisWeek.action}</p>
                <p className="mt-1 text-sm text-gray-500">{page5.thisWeek.tone}</p>
              </div>
            )}
            
            {page5.firstStep && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                  {page5.firstStep.recommendation}
                </h3>
                <p className="mt-1 text-amber-700 dark:text-amber-400 text-sm">
                  {page5.firstStep.why}
                </p>
                {page5.firstStep.simpleCta && (
                  <p className="mt-2 font-semibold text-amber-900 dark:text-amber-200">
                    {page5.firstStep.simpleCta}
                  </p>
                )}
                
                {/* Feedback Box for first step recommendation */}
                {engagement?.id && currentMember?.practice_id && (
                  <SectionCommentBox
                    engagementId={engagement.id}
                    reportId={report?.id}
                    practiceId={currentMember.practice_id}
                    sectionType="page5_first_step"
                    originalContent={page5.firstStep}
                    existingComments={analysisComments}
                    onCommentAdded={refetchComments}
                  />
                )}
              </div>
            )}
            
            {page5.theAsk && (
              <div className="mt-4 p-4 bg-slate-800 dark:bg-slate-950 rounded-lg text-center">
                <p className="text-slate-300">{page5.theAsk}</p>
                {page5.closingLine && (
                  <p className="mt-2 text-amber-400 font-semibold">{page5.closingLine}</p>
                )}
              </div>
            )}
            
            {/* Overall Page 5 Feedback Box */}
            {engagement?.id && currentMember?.practice_id && (
              <SectionCommentBox
                engagementId={engagement.id}
                reportId={report?.id}
                practiceId={currentMember.practice_id}
                sectionType="page5_next_steps"
                originalContent={page5}
                existingComments={analysisComments}
                onCommentAdded={refetchComments}
              />
            )}
          </section>
        )}

        {/* Meta: Quotes Used */}
        {report?.quotes_used?.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
              Verbatim Quotes Used ({report.quotes_used.length})
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.quotes_used.slice(0, 5).map((quote: string, idx: number) => (
                <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                  "{quote.substring(0, 40)}..."
                </span>
              ))}
              {report.quotes_used.length > 5 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{report.quotes_used.length - 5} more
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    );
  };

  // ============================================================================
  // CLIENT PREVIEW - Exact match to client portal styling
  // ============================================================================
  const [expandedPhase, setExpandedPhase] = useState<number>(0);
  
  // Map service names to codes for the popup
  const getServiceCode = (name: string, code?: string) => {
    if (code) return code;
    const nameLower = name.toLowerCase();
    if (nameLower.includes('365') || nameLower.includes('goal alignment')) return '365_method';
    if (nameLower.includes('systems audit')) return 'systems_audit';
    if (nameLower.includes('management account')) return 'management_accounts';
    if (nameLower.includes('fractional cfo')) return 'fractional_cfo';
    if (nameLower.includes('hidden value')) return 'hidden_value_audit';
    if (nameLower.includes('benchmark')) return 'benchmarking';
    if (nameLower.includes('automation')) return 'automation';
    if (nameLower.includes('exit')) return 'exit_planning';
    return 'discovery';
  };
  
  // Normalize service names
  const getDisplayName = (name: string) => {
    if (name.toLowerCase().includes('365 alignment') || name.toLowerCase().includes('365 method')) {
      return 'Goal Alignment Programme';
    }
    return name;
  };
  
  const renderClientPreview = () => {
    const dest = report?.destination_report;
    const page1 = dest?.page1_destination || report?.page1_destination;
    const page2 = dest?.page2_gaps || report?.page2_gaps;
    const page3 = dest?.page3_journey || report?.page3_journey;
    const page4 = dest?.page4_numbers || report?.page4_numbers;
    const page5 = dest?.page5_nextSteps || dest?.page5_next_steps || report?.page5_next_steps;

    if (!page1 && !report?.headline) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Report narrative not yet generated</p>
          <p className="text-sm">Run analysis to generate the destination-focused report</p>
        </div>
      );
    }

    return (
      <div className="px-4 py-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-xl">
        {/* ================================================================ */}
        {/* PAGE 1: YOUR VISION - Client Portal Style */}
        {/* ================================================================ */}
        {page1 && (
          <section className="mb-16">
            <div className="mb-8">
              <p className="text-sm font-medium text-amber-600 uppercase tracking-widest mb-2">
                Your Vision
              </p>
              <h1 className="text-3xl font-serif font-light text-slate-800 leading-tight">
                {page1.headerLine || "The Tuesday You're Building Towards"}
              </h1>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-stone-50 rounded-xl p-8 border border-slate-100">
              <Quote className="h-8 w-8 text-amber-500 mb-4 opacity-60" />
              <blockquote className="text-lg text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                {page1.visionVerbatim}
              </blockquote>
            </div>
            
            {page1.destinationClarityScore && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(page1.destinationClarityScore / 10) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-emerald-600">{page1.destinationClarityScore}/10</span>
                  <span className="text-slate-400 ml-2">Destination Clarity</span>
                </div>
              </div>
            )}
            {page1.clarityExplanation && (
              <p className="mt-2 text-sm text-slate-500">{page1.clarityExplanation}</p>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 2: THE REALITY - What's In The Way */}
        {/* ================================================================ */}
        {page2 && (
          <section className="mb-16">
            <div className="mb-8">
              <p className="text-sm font-medium text-rose-600 uppercase tracking-widest mb-2">
                The Reality
              </p>
              <h2 className="text-2xl font-serif font-light text-slate-800">
                {page2.headerLine || "The Gap Between Here and There"}
              </h2>
              {page2.openingLine && (
                <p className="mt-4 text-lg text-rose-600 font-light italic">
                  {page2.openingLine}
                </p>
              )}
            </div>

            <div className="space-y-6">
              {page2.gaps?.map((gap: any, index: number) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <h3 className="text-lg font-medium text-slate-800">{gap.title}</h3>
                    </div>
                    
                    {/* The Pattern */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border-l-4 border-slate-300">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                        The pattern:
                      </p>
                      <p className="text-slate-700 italic">"{gap.pattern}"</p>
                    </div>
                    
                    {/* What This Costs */}
                    {gap.costs && gap.costs.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                          What this costs you:
                        </p>
                        <ul className="space-y-1">
                          {gap.costs.map((cost: string, costIdx: number) => (
                            <li key={costIdx} className="flex items-start gap-2 text-slate-600">
                              <span className="text-rose-400 mt-1">•</span>
                              {cost}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* The Shift Required */}
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">
                        The shift required:
                      </p>
                      <p className="text-emerald-800">{gap.shiftRequired}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 3: THE JOURNEY - With Clickable Service Links */}
        {/* ================================================================ */}
        {page3 && (
          <section className="mb-16">
            <div className="mb-8">
              <p className="text-sm font-medium text-blue-600 uppercase tracking-widest mb-2">
                The Path Forward
              </p>
              <h2 className="text-2xl font-serif font-light text-slate-800">
                {page3.headerLine || "From Here to the 4pm Pickup"}
              </h2>
            </div>

            {/* Timeline Visual */}
            <div className="mb-8 py-6 px-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-2 left-4 right-4 h-0.5 bg-slate-200" />
                {['Now', 'Month 3', 'Month 6', 'Month 12'].map((label, idx) => (
                  <div key={label} className="flex flex-col items-center relative z-10">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      idx === 3 ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
                    }`} />
                    <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Journey Phases - Collapsible */}
            <div className="space-y-4">
              {page3.phases?.map((phase: any, index: number) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  {/* Phase Header - Clickable */}
                  <button
                    onClick={() => setExpandedPhase(expandedPhase === index ? -1 : index)}
                    className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                          {phase.timeframe}
                        </span>
                        <h3 className="text-xl font-medium text-slate-800">
                          {phase.headline}
                        </h3>
                      </div>
                      {expandedPhase === index ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Content */}
                  {expandedPhase === index && (
                    <div className="px-6 pb-6 border-t border-slate-100">
                      {/* What Changes */}
                      {phase.whatChanges && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                            What changes:
                          </p>
                          <ul className="space-y-1">
                            {(Array.isArray(phase.whatChanges) ? phase.whatChanges : [phase.whatChanges]).map((change: string, changeIdx: number) => (
                              <li key={changeIdx} className="flex items-start gap-2 text-slate-700">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* What This Feels Like */}
                      {phase.feelsLike && (
                        <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
                          <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">
                            What this feels like:
                          </p>
                          <p className="text-amber-900 italic">{phase.feelsLike}</p>
                        </div>
                      )}
                      
                      {/* The Outcome */}
                      {phase.outcome && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
                            The outcome:
                          </p>
                          <p className="text-slate-700 font-medium">{phase.outcome}</p>
                        </div>
                      )}
                      
                      {/* Enabled By - CLICKABLE SERVICE LINK */}
                      {phase.enabledBy && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <EnabledByLink
                            serviceCode={getServiceCode(phase.enabledBy, phase.enabledByCode)}
                            serviceName={getDisplayName(phase.enabledBy)}
                            price={phase.price || phase.investment}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 4: THE INVESTMENT */}
        {/* ================================================================ */}
        {page4 && (
          <section className="mb-16">
            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">
                The Investment
              </p>
              <h2 className="text-2xl font-serif font-light text-slate-800">
                {page4.headerLine || "The Investment in Your Tuesday"}
              </h2>
            </div>

            {/* Cost of Staying */}
            {page4.costOfStaying && (
              <div className="bg-rose-50 rounded-xl p-6 mb-6 border border-rose-100">
                <h3 className="text-lg font-medium text-rose-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  What Staying Here Costs
                </h3>
                
                <div className="space-y-2 mb-4">
                  {page4.costOfStaying.labourInefficiency && (
                    <div className="flex justify-between text-rose-700">
                      <span>Labour inefficiency</span>
                      <span className="font-medium">{page4.costOfStaying.labourInefficiency}</span>
                    </div>
                  )}
                  {page4.costOfStaying.marginLeakage && (
                    <div className="flex justify-between text-rose-700">
                      <span>Margin leakage</span>
                      <span className="font-medium">{page4.costOfStaying.marginLeakage}</span>
                    </div>
                  )}
                </div>
                
                {page4.personalCost && (
                  <div className="mt-4 pt-4 border-t border-rose-200">
                    <p className="text-sm font-medium text-rose-600 uppercase tracking-wide mb-1">
                      Personal cost:
                    </p>
                    <p className="text-rose-800">{page4.personalCost}</p>
                  </div>
                )}
              </div>
            )}

            {/* Investment Table */}
            {page4.investment && page4.investment.length > 0 && (
              <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-slate-600" />
                  What Moving Forward Costs
                </h3>
                
                <div className="divide-y divide-slate-100">
                  {page4.investment.map((inv: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-3">
                      <div>
                        <span className="text-slate-700">{inv.phase}</span>
                        {inv.whatYouGet && (
                          <span className="text-slate-400 ml-2">— {inv.whatYouGet}</span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">{inv.amount}</span>
                    </div>
                  ))}
                  
                  {page4.totalYear1 && (
                    <div className="flex justify-between py-3 bg-emerald-50 -mx-6 px-6 mt-2 rounded-b-lg">
                      <span className="font-medium text-emerald-800">
                        Total Year 1
                      </span>
                      <span className="font-bold text-emerald-800">{page4.totalYear1}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Returns */}
            {page4.returns && (
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-lg font-medium text-emerald-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  The Return
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Conservative */}
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-500 mb-2">Conservative</p>
                    <p className="font-bold text-emerald-700">{page4.returns.conservative?.total}</p>
                  </div>
                  
                  {/* Realistic */}
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-medium text-emerald-600 mb-2">Realistic</p>
                    <p className="font-bold text-emerald-700">{page4.returns.realistic?.total}</p>
                  </div>
                </div>
                
                {page4.paybackPeriod && (
                  <p className="text-emerald-700 font-medium">
                    Payback period: {page4.paybackPeriod}
                  </p>
                )}
                
                {page4.realReturn && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-emerald-800 italic">
                      But the real return? {page4.realReturn}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* PAGE 5: NEXT STEPS */}
        {/* ================================================================ */}
        {page5 && (
          <section className="mb-8">
            <div className="mb-8">
              <p className="text-sm font-medium text-emerald-600 uppercase tracking-widest mb-2">
                Next Steps
              </p>
              <h2 className="text-2xl font-serif font-light text-slate-800">
                {page5.headerLine || "Starting The Journey"}
              </h2>
            </div>

            {/* This Week */}
            {page5.thisWeek && (
              <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
                <h3 className="text-lg font-medium text-slate-800 mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  This Week
                </h3>
                <p className="text-xl text-slate-700 font-medium mb-2">
                  {page5.thisWeek.action || page5.thisWeek}
                </p>
                {page5.thisWeek.tone && (
                  <p className="text-slate-500">{page5.thisWeek.tone}</p>
                )}
              </div>
            )}

            {/* First Step */}
            {page5.firstStep && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
                <h3 className="text-lg font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your First Step
                </h3>
                <p className="text-xl text-amber-900 font-medium mb-2">
                  {page5.firstStep.recommendation}
                </p>
                <p className="text-amber-800 mb-4">
                  {page5.firstStep.why}
                </p>
                
                {page5.firstStep.simpleCta && (
                  <p className="text-lg font-semibold text-amber-900">
                    {page5.firstStep.simpleCta}
                  </p>
                )}
              </div>
            )}

            {/* The Ask - CTA */}
            {(page5.theAsk || page5.closingMessage) && (
              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <p className="text-slate-300 text-lg mb-6">
                  {page5.theAsk || page5.closingMessage}
                </p>
                
                <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-3 mb-4 cursor-default">
                  <Phone className="h-5 w-5" />
                  Book a Conversation
                </button>
                
                {page5.closingLine && (
                  <p className="text-amber-400 font-medium text-lg">
                    {page5.closingLine}
                  </p>
                )}
                {page5.callToAction && (
                  <p className="text-amber-400 font-medium text-lg">
                    {page5.callToAction}
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading Discovery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
            <div>
              <h2 className="text-xl font-semibold">Discovery Assessment - {clientName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {engagement && getStatusBadge(engagement.status)}
                {report?.status && report.status !== engagement?.status && (
                  <span className="text-sm text-gray-500">
                    Report: {report.status}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b dark:border-gray-800 px-6">
            {[
              { id: 'responses', label: 'Responses', icon: FileText },
              { id: 'context', label: 'Context & Docs', icon: MessageSquare },
              { id: 'report', label: 'Report', icon: Sparkles },
              { id: 'learning', label: 'Learning', icon: BookOpen, badge: analysisComments.filter(c => c.status === 'pending').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Responses Tab */}
            {activeTab === 'responses' && (
              <div className="space-y-6">
                {!discovery ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Client hasn't completed the Discovery assessment yet</p>
                  </div>
                ) : (
                  <>
                    {/* Key Responses Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'dd_five_year_vision', label: 'Tuesday Test (5-Year Vision)' },
                        { key: 'dd_core_frustration', label: 'Core Frustration' },
                        { key: 'dd_magic_fix', label: 'Magic Fix (90 Days)' },
                        { key: 'dd_relationship_mirror', label: 'Business Relationship' },
                        { key: 'dd_sacrifice_list', label: 'What They\'ve Sacrificed' },
                        { key: 'dd_emergency_log', label: 'Emergency Log' },
                      ].map((field) => (
                        <div key={field.key} className="p-4 rounded-lg border dark:border-gray-700">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">{field.label}</h4>
                          <p className="text-gray-900 dark:text-white">
                            {discovery[field.key] || <span className="text-gray-400 italic">Not answered</span>}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Choice-based responses */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Key Selections</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: 'dd_success_definition', label: 'Success Definition' },
                          { key: 'dd_weekly_hours', label: 'Weekly Hours' },
                          { key: 'dd_time_allocation', label: 'Firefighting vs Strategic' },
                          { key: 'dd_last_real_break', label: 'Last Real Break' },
                          { key: 'dd_scaling_constraint', label: 'Scaling Constraint' },
                          { key: 'dd_change_readiness', label: 'Change Readiness' },
                        ].map((field) => (
                          <div key={field.key} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <span className="text-xs font-medium text-gray-500">{field.label}</span>
                            <p className="text-sm mt-1">{discovery[field.key] || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Context Tab */}
            {activeTab === 'context' && (
              <div className="space-y-6">
                {/* Add Context Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Additional Context</h3>
                  <div className="flex gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Document'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading || !engagement}
                      />
                    </label>
                    <button
                      onClick={() => setShowAddContext(true)}
                      disabled={!engagement}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Context Notes List */}
                {contextNotes.length === 0 && documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No additional context added yet</p>
                    <p className="text-sm">Add notes from discovery calls, follow-ups, or relevant documents</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Documents */}
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 rounded-lg border dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{doc.filename}</p>
                            <p className="text-sm text-gray-500">{doc.document_type}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Notes */}
                    {contextNotes.map((note) => (
                      <div key={note.id} className="p-4 rounded-lg border dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded">
                                {note.note_type.replace(/_/g, ' ')}
                              </span>
                              {note.source && (
                                <span className="text-xs text-gray-500">{note.source}</span>
                              )}
                            </div>
                            <h4 className="font-medium">{note.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteContextNote(note.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Context Modal */}
                {showAddContext && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-lg">
                      <h3 className="text-lg font-semibold mb-4">Add Context Note</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            value={newContext.note_type}
                            onChange={(e) => setNewContext({ ...newContext, note_type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          >
                            <option value="discovery_call">Discovery Call Notes</option>
                            <option value="follow_up_answer">Follow-up Answer</option>
                            <option value="advisor_observation">Advisor Observation</option>
                            <option value="client_email">Client Email</option>
                            <option value="meeting_notes">Meeting Notes</option>
                            <option value="background_context">Background Context</option>
                            <option value="general_note">General Note</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Title</label>
                          <input
                            type="text"
                            value={newContext.title}
                            onChange={(e) => setNewContext({ ...newContext, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="Brief title..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Content</label>
                          <textarea
                            value={newContext.content}
                            onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 h-32"
                            placeholder="Details, observations, answers..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Source (optional)</label>
                          <input
                            type="text"
                            value={newContext.source}
                            onChange={(e) => setNewContext({ ...newContext, source: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            placeholder="e.g., Discovery Call 15/01/2026"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => setShowAddContext(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddContextNote}
                          disabled={savingContext || !newContext.title || !newContext.content}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Tab */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('admin')}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        viewMode === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      Admin View
                    </button>
                    <button
                      onClick={() => setViewMode('script')}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                        viewMode === 'script' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Call Script
                    </button>
                    <button
                      onClick={() => setViewMode('client')}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        viewMode === 'client' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      Client View
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Pass 1 Button */}
                    <button
                      onClick={handleRunPass1}
                      disabled={generating || !discovery || engagement?.status === 'pending_responses'}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {generatingPass === 1 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {report?.service_scores ? 'Re-run Analysis' : 'Run Analysis'}
                    </button>
                    
                    {/* Pass 2 Button */}
                    <button
                      onClick={handleRunPass2}
                      disabled={generating || !report?.service_scores}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {generatingPass === 2 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate Report
                    </button>
                    
                    {/* Publish Button */}
                    {report?.destination_report && engagement?.status !== 'published' && (
                      <button
                        onClick={handlePublishReport}
                        disabled={publishing}
                        className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                          report?.ready_for_client 
                            ? 'bg-emerald-600 hover:bg-emerald-700' 
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        {publishing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {report?.ready_for_client ? 'Publish to Client' : 'Publish Anyway'}
                      </button>
                    )}
                    
                    {/* Published indicator */}
                    {engagement?.status === 'published' && (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Published
                      </span>
                    )}
                  </div>
                </div>

                {/* Report Content */}
                {viewMode === 'admin' ? (
                  <div className="space-y-6">
                    {/* Data Completeness Panel */}
                    {report && (
                      <div className={`p-4 rounded-lg border ${
                        report.data_completeness_status === 'complete' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' :
                        report.data_completeness_status === 'partial' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' :
                        report.data_completeness_status === 'insufficient' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                        'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            {report.data_completeness_status === 'complete' && (
                              <span className="text-emerald-600">✓ Data Complete</span>
                            )}
                            {report.data_completeness_status === 'partial' && (
                              <span className="text-amber-600">⚠ Partial Data</span>
                            )}
                            {report.data_completeness_status === 'insufficient' && (
                              <span className="text-red-600">⚠ Insufficient Data</span>
                            )}
                            {!report.data_completeness_status && (
                              <span className="text-gray-600">Data Completeness Unknown</span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-full rounded-full ${
                                  (report.data_completeness_score || 0) >= 70 ? 'bg-emerald-500' :
                                  (report.data_completeness_score || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${report.data_completeness_score || 0}%` }}
                              />
                            </div>
                            <span className="font-bold">{report.data_completeness_score || 0}%</span>
                          </div>
                        </div>
                        
                        {/* Missing Data */}
                        {(report.missing_critical_data?.length > 0 || report.missing_important_data?.length > 0) && (
                          <div className="space-y-2 mb-3">
                            {report.missing_critical_data?.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-red-700 dark:text-red-400">Missing Critical: </span>
                                <span className="text-red-600 dark:text-red-400">{report.missing_critical_data.join(', ')}</span>
                              </div>
                            )}
                            {report.missing_important_data?.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium text-amber-700 dark:text-amber-400">Missing Important: </span>
                                <span className="text-amber-600 dark:text-amber-400">{report.missing_important_data.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Admin Actions */}
                        {report.admin_actions_needed?.length > 0 && (
                          <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium uppercase text-gray-500 mb-2">Recommended Actions</p>
                            <ul className="text-sm space-y-1">
                              {report.admin_actions_needed.map((action: string, idx: number) => (
                                <li key={idx} className="text-gray-700 dark:text-gray-300">• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Ready Status */}
                        <div className="mt-3 text-sm">
                          {report.ready_for_client ? (
                            <span className="text-emerald-600 font-medium">✓ Ready to publish to client</span>
                          ) : (
                            <span className="text-amber-600">Consider gathering more data before publishing</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Scores & Patterns */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Service Scores</h3>
                        {report?.service_scores ? (
                          renderServiceScores()
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>Run analysis to see service scores</p>
                          </div>
                        )}
                      </div>
                      
                      {report?.detection_patterns && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Detection Patterns</h3>
                          {renderDetectionPatterns()}
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Emotional Anchors */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Emotional Anchors (Client's Words)</h3>
                      {report?.emotional_anchors ? (
                        renderEmotionalAnchors()
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p>Run analysis to extract emotional anchors</p>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                ) : viewMode === 'script' ? (
                  /* Call Script View */
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Discovery Call Script
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Use this script to guide your conversation with {clientName}
                          </p>
                        </div>
                        <button 
                          onClick={() => window.print()}
                          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Print
                        </button>
                      </div>
                      {renderCallScript()}
                    </div>
                  </div>
                ) : (
                  /* Client View - EXACT PREVIEW */
                  <div className="max-w-3xl mx-auto">
                    {/* Preview Mode Banner */}
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                      <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          Client Preview Mode
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          This is exactly what the client sees in their portal. Click service links to see details.
                        </p>
                      </div>
                    </div>
                    {renderClientPreview()}
                  </div>
                )}
              </div>
            )}

            {/* Learning Tab */}
            {activeTab === 'learning' && currentMember?.practice_id && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Practice Learning Library</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Review feedback and build your practice's wisdom for better future analyses
                    </p>
                  </div>
                  <button
                    onClick={refetchComments}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                
                <LearningReviewPanel 
                  practiceId={currentMember.practice_id}
                  engagementId={engagement?.id}
                  onRefresh={refetchComments}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscoveryAdminModal;

