import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone,
  FileText,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  Circle,
  MessageSquare, 
  Target,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Save
} from 'lucide-react';

// Types
interface MAPass1Data {
  adminGuidance: {
    quickProfile: {
      primaryPain: string;
      secondaryPain: string;
      confidenceScore: number;
      desiredFrequency: string;
      recommendedTier: string;
    };
    quotesToUse: Array<{ quote: string; context: string }>;
    gapsToFill: Array<{ gap: string; suggestedQuestion: string; whyNeeded: string }>;
    questionsToAsk: Array<{ question: string; purpose: string; listenFor: string }>;
    objectionHandling: Array<{ objection: string; response: string; theirDataToReference: string }>;
    scenariosToBuild: Array<{ type: string; name: string; reason: string }>;
  };
  clientQuotes: Record<string, string>;
  findings: Array<{
    title: string;
    finding: string;
    implication: string;
    recommendedAction: string;
    severity: 'critical' | 'significant' | 'moderate';
    category: string;
  }>;
  quickWins: Array<{ title: string; description: string; timing: string; benefit: string }>;
  tierRecommendation: { tier: string; rationale: string; keyDrivers: string[] };
}

export interface AdditionalContext {
  callNotes: string;
  callTranscript: string;
  gapsFilled: Record<string, string>;
  gapsWithLabels?: Record<string, { question: string; answer: string }>; // Structured version for AI
  gapsChecked?: Record<string, boolean>;
  tierDiscussed: string;
  clientObjections: string;
  additionalInsights: string;
  completedPhases: string[];
}

interface MAAdminReportViewProps {
  report: {
    pass1_data: MAPass1Data;
    pass2_data?: any;
    admin_view?: any;
  };
  engagement?: {
    company_name?: string;
    id?: string;
  };
  clientName?: string;
  initialContext?: AdditionalContext;
  onSaveContext?: (context: AdditionalContext) => Promise<void>;
  onRegenerateClientView?: (context: AdditionalContext) => Promise<void>;
  isRegenerating?: boolean;
}

export function MAAdminReportView({ 
  report, 
  engagement,
  clientName,
  initialContext,
  onSaveContext,
  onRegenerateClientView,
  isRegenerating = false 
}: MAAdminReportViewProps) {
  const p1 = report.pass1_data;
  const admin = p1?.adminGuidance;
  
  // State - initialize from initialContext if provided
  const [activeTab, setActiveTab] = useState<'script' | 'analysis' | 'capture' | 'regenerate'>('script');
  const [callNotes, setCallNotes] = useState(initialContext?.callNotes || '');
  const [callTranscript, setCallTranscript] = useState(initialContext?.callTranscript || '');
  const [gapsFilled, setGapsFilled] = useState<Record<string, string>>(initialContext?.gapsFilled || {});
  const [gapsChecked, setGapsChecked] = useState<Record<string, boolean>>(initialContext?.gapsChecked || {});
  const [tierDiscussed, setTierDiscussed] = useState(initialContext?.tierDiscussed || admin?.quickProfile?.recommendedTier || 'gold');
  const [clientObjections, setClientObjections] = useState(initialContext?.clientObjections || '');
  const [additionalInsights, setAdditionalInsights] = useState(initialContext?.additionalInsights || '');
  const [completedPhases, setCompletedPhases] = useState<string[]>(initialContext?.completedPhases || []);
  const [expandedObjections, setExpandedObjections] = useState<Record<number, boolean>>({});
  const [expandedFindings, setExpandedFindings] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Debounced auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const getCurrentContext = useCallback((): AdditionalContext => ({
    callNotes,
    callTranscript,
    gapsFilled,
    gapsChecked,
    tierDiscussed,
    clientObjections,
    additionalInsights,
    completedPhases
  }), [callNotes, callTranscript, gapsFilled, gapsChecked, tierDiscussed, clientObjections, additionalInsights, completedPhases]);
  
  // Auto-save context when it changes
  useEffect(() => {
    if (!onSaveContext) return;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save - wait 1.5 seconds after last change
    saveTimeoutRef.current = setTimeout(async () => {
      const context = getCurrentContext();
      // Only save if there's actual content
      const hasContent = context.callNotes || context.callTranscript || 
        Object.keys(context.gapsFilled).length > 0 || context.clientObjections || 
        context.additionalInsights || context.completedPhases.length > 0;
      
      if (hasContent) {
        setIsSaving(true);
        try {
          await onSaveContext(context);
          setLastSaved(new Date());
        } catch (err) {
          console.error('[MAAdminReport] Failed to save context:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [callNotes, callTranscript, gapsFilled, gapsChecked, tierDiscussed, clientObjections, additionalInsights, completedPhases, onSaveContext, getCurrentContext]);
  
  if (!p1 || !admin) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No admin report data available</p>
      </div>
    );
  }

  const displayName = clientName || engagement?.company_name || 'Client';
  
  const handleGapUpdate = (index: number, value: string) => {
    setGapsFilled(prev => ({ ...prev, [`gap_${index}`]: value }));
  };
  
  const handleGapCheck = (index: number, checked: boolean) => {
    setGapsChecked(prev => ({ ...prev, [`gap_${index}`]: checked }));
  };
  
  const togglePhase = (phase: string) => {
    setCompletedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };
  
  const handleRegenerate = async () => {
    if (onRegenerateClientView) {
      // Build structured gaps with labels so AI knows what each answer refers to
      const gapsWithLabels: Record<string, { question: string; answer: string }> = {};
      
      // Debug logging
      console.log('[MA Regenerate Debug] admin.gapsToFill:', admin?.gapsToFill);
      console.log('[MA Regenerate Debug] gapsFilled state:', gapsFilled);
      console.log('[MA Regenerate Debug] gapsFilled keys:', Object.keys(gapsFilled));
      
      if (admin.gapsToFill) {
        admin.gapsToFill.forEach((gap, i) => {
          const answer = gapsFilled[`gap_${i}`];
          console.log(`[MA Regenerate Debug] Gap ${i}: "${gap.gap}" -> answer: "${answer?.substring(0, 50)}..."`);
          if (answer && answer.trim()) {
            gapsWithLabels[gap.gap] = {
              question: gap.suggestedQuestion,
              answer: answer.trim()
            };
          }
        });
      }
      
      console.log('[MA Regenerate Debug] Final gapsWithLabels:', gapsWithLabels);
      console.log('[MA Regenerate Debug] gapsWithLabels count:', Object.keys(gapsWithLabels).length);
      
      await onRegenerateClientView({
        callNotes,
        callTranscript,
        gapsFilled,
        gapsWithLabels, // Include structured version for AI
        tierDiscussed,
        clientObjections,
        additionalInsights,
        completedPhases
      });
    }
  };
  
  const gapsFilledCount = Object.values(gapsFilled).filter(v => v.trim()).length;
  const gapsCheckedCount = Object.values(gapsChecked).filter(Boolean).length;
  const totalGaps = admin.gapsToFill?.length || 0;

  const tierColors: Record<string, string> = {
    bronze: 'border-orange-400 text-orange-400',
    silver: 'border-gray-400 text-gray-400',
    gold: 'border-amber-400 text-amber-400',
    platinum: 'border-purple-400 text-purple-400'
  };
  
  const tierBgColors: Record<string, string> = {
    bronze: 'bg-orange-600',
    silver: 'bg-gray-600',
    gold: 'bg-amber-600',
    platinum: 'bg-purple-600'
  };

  return (
    <div className="space-y-6">
      {/* Quick Profile Bar - Always Visible */}
      <div className="bg-slate-900 text-white rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
          <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Client</span>
              <p className="font-semibold">{displayName}</p>
          </div>
            <div className="h-8 w-px bg-slate-700 hidden sm:block" />
          <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Primary Pain</span>
              <p className="text-sm">{(admin.quickProfile?.primaryPain || '').split(' - ')[0] || 'Not identified'}</p>
          </div>
            <div className="h-8 w-px bg-slate-700 hidden sm:block" />
          <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Confidence</span>
              <p className="text-sm">{admin.quickProfile?.confidenceScore || '?'}/10</p>
          </div>
            <div className="h-8 w-px bg-slate-700 hidden sm:block" />
          <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Wants</span>
              <p className="text-sm">{(admin.quickProfile?.desiredFrequency || 'Monthly').split(' - ')[0]}</p>
            </div>
          </div>
          <span className={`text-lg px-4 py-2 border-2 rounded-lg font-semibold ${
            tierColors[admin.quickProfile?.recommendedTier] || tierColors.gold
          }`}>
            Recommend {(admin.quickProfile?.recommendedTier || 'GOLD').toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Main Tabbed Interface */}
      <div className="w-full">
        {/* Save Status + Tab Headers */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-500">
            {/* Empty left side for balance */}
          </div>
          {onSaveContext && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="h-3 w-3 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : (
                <span>Auto-save enabled</span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'script'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Call Script</span>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('capture')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'capture'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Capture</span>
            {(callNotes || gapsFilledCount > 0) && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {gapsFilledCount + (callNotes ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('regenerate')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'regenerate'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="mt-6">
          
          {/* ============================================ */}
          {/* TAB 1: CALL SCRIPT                          */}
          {/* ============================================ */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              
              {/* Phase Progress */}
              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg overflow-x-auto">
                {['opening', 'pain', 'gaps', 'solution', 'close'].map((phase, i) => (
                  <div key={phase} className="flex items-center">
                    <button
                      onClick={() => togglePhase(phase)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap ${
                        completedPhases.includes(phase)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-white border text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {completedPhases.includes(phase) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </button>
                    {i < 4 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
          </div>
                ))}
              </div>
              
              {/* Phase 1: Opening */}
              <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${completedPhases.includes('opening') ? 'opacity-60' : ''}`}>
                <div className="bg-blue-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="flex items-center gap-2 text-blue-800 font-semibold">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                    Opening
                    <span className="text-slate-500 font-normal text-sm ml-2">2-3 mins • Build rapport</span>
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-slate-500 mb-1">Open with their Tuesday question:</p>
                    <p className="italic">
                      "Thanks for completing the assessment. I noticed your Tuesday question is 
                      <span className="font-semibold text-blue-700"> '{p1.clientQuotes?.tuesdayQuestion || 'your key decision question'}'</span> - 
                      that's exactly what good management accounts should answer. Let me show you what that could look like..."
                    </p>
                  </div>
                  
                  {admin.quotesToUse && admin.quotesToUse.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Key quotes to reference:</p>
                      <div className="space-y-2">
                        {admin.quotesToUse.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="italic">"{item.quote}"</span>
                              <span className="text-slate-500 ml-2">→ {(item.context || '').replace('Use when:', '').trim()}</span>
                            </div>
              </div>
            ))}
          </div>
        </div>
      )}
                </div>
              </div>
              
              {/* Phase 2: Pain Confirmation */}
              <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${completedPhases.includes('pain') ? 'opacity-60' : ''}`}>
                <div className="bg-amber-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="flex items-center gap-2 text-amber-800 font-semibold">
                    <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    Pain Confirmation
                    <span className="text-slate-500 font-normal text-sm ml-2">5-7 mins • Get them talking</span>
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Confirm understanding. Get the client to articulate the cost of their current state.
                  </p>
                  
                  {admin.questionsToAsk && admin.questionsToAsk.length > 0 && (
                <div className="space-y-3">
                      {admin.questionsToAsk.slice(0, 3).map((q, i) => (
                        <div key={i} className="border rounded-lg p-3">
                          <p className="font-medium text-sm">
                            <HelpCircle className="h-4 w-4 inline mr-2 text-amber-500" />
                            "{q.question}"
                          </p>
                          <div className="mt-2 pl-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                              <span className="text-slate-500">Purpose:</span>
                              <p className="text-slate-700">{q.purpose}</p>
                  </div>
                  <div>
                              <span className="text-slate-500">Listen for:</span>
                              <p className="text-green-700">{q.listenFor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
                  )}
                  
                  {p1.findings && p1.findings.filter(f => f.severity === 'critical').length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">Pain points from assessment:</p>
                      <ul className="text-sm space-y-1 text-amber-900">
                        {p1.findings.filter(f => f.severity === 'critical').slice(0, 3).map((f, i) => (
                          <li key={i}>• {f.title}</li>
                        ))}
                      </ul>
        </div>
      )}
                </div>
              </div>
              
              {/* Phase 3: Fill Gaps */}
              <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${completedPhases.includes('gaps') ? 'opacity-60' : ''}`}>
                <div className="bg-red-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-red-800 font-semibold">
                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    Fill Information Gaps
                    <span className="text-slate-500 font-normal text-sm ml-2">5-10 mins • Capture specifics</span>
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full border border-red-300 text-red-700">
                    {gapsCheckedCount}/{totalGaps} captured
                  </span>
          </div>
          <div className="p-6 space-y-3">
                  <p className="text-sm text-slate-600">
                    Capture missing information needed for accurate scenarios and forecasting.
                  </p>
                  
                  {admin.gapsToFill && admin.gapsToFill.map((gap, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={gapsChecked[`gap_${i}`] || false}
                          onChange={(e) => handleGapCheck(i, e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-sm">{gap.gap}</p>
                          <p className="text-xs text-slate-600">
                            Ask: <span className="italic">"{gap.suggestedQuestion}"</span>
                          </p>
                          <textarea
                            placeholder="Capture response..."
                            value={gapsFilled[`gap_${i}`] || ''}
                            onChange={(e) => handleGapUpdate(i, e.target.value)}
                            maxLength={500}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                          />
                          {gapsFilled[`gap_${i}`] && (
                            <p className="text-xs text-slate-400 text-right">
                              {gapsFilled[`gap_${i}`].length}/500
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Phase 4: Present Solution */}
              <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${completedPhases.includes('solution') ? 'opacity-60' : ''}`}>
                <div className="bg-green-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="flex items-center gap-2 text-green-800 font-semibold">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                    Present Solution
                    <span className="text-slate-500 font-normal text-sm ml-2">5-7 mins • Show the "wow"</span>
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Switch to Client View and walk through the visual previews. Connect each to their specific pain.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-green-500">
                      <p className="font-medium text-sm mb-1">Show: True Cash</p>
                      <p className="text-xs text-slate-600">
                        "The client saw £95k and thought they could hire. Here's what TRUE available cash looks like after VAT, PAYE, and commitments..."
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-green-500">
                      <p className="font-medium text-sm mb-1">Show: 13-Week Forecast</p>
                      <p className="text-xs text-slate-600">
                        "This would have shown the February collision 6 weeks in advance..."
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-green-500">
                      <p className="font-medium text-sm mb-1">Show: Hire Scenario</p>
                      <p className="text-xs text-slate-600">
                        "Let's model Sarah. What salary? What utilisation? This answers the Tuesday question definitively..."
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-green-500">
                      <p className="font-medium text-sm mb-1">Connect to Goal</p>
                      <p className="text-xs text-slate-600">
                        "The client said they want to 'actually take holidays' and 'stop hoping'. This is what that looks like..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Phase 5: Tier & Close */}
              <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${completedPhases.includes('close') ? 'opacity-60' : ''}`}>
                <div className="bg-purple-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="flex items-center gap-2 text-purple-800 font-semibold">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                    Tier Discussion & Close
                    <span className="text-slate-500 font-normal text-sm ml-2">5 mins • Recommend & handle objections</span>
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                        tierBgColors[admin.quickProfile?.recommendedTier] || tierBgColors.gold
                      }`}>
                        {(admin.quickProfile?.recommendedTier || 'GOLD').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-purple-900">{(p1.tierRecommendation?.rationale || '').substring(0, 200)}...</p>
                  </div>
                  
                  {admin.objectionHandling && admin.objectionHandling.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        If objections arise:
                      </p>
                      <div className="space-y-2">
                        {admin.objectionHandling.slice(0, 3).map((obj, i) => (
                          <div key={i} className="border rounded-lg">
                            <button
                              onClick={() => setExpandedObjections(prev => ({ ...prev, [i]: !prev[i] }))}
                              className="w-full p-3 text-left hover:bg-slate-50 text-sm font-medium text-red-700 flex items-center justify-between"
                            >
                              "{obj.objection}"
                              <ChevronRight className={`h-4 w-4 transition-transform ${expandedObjections[i] ? 'rotate-90' : ''}`} />
                            </button>
                            {expandedObjections[i] && (
                              <div className="p-3 pt-0 text-sm border-t">
                                <p className="text-slate-700">{obj.response}</p>
                                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                                  Reference: {obj.theirDataToReference}
                                </p>
                              </div>
                            )}
              </div>
            ))}
          </div>
        </div>
      )}
                </div>
              </div>
              
            </div>
          )}
          
          {/* ============================================ */}
          {/* TAB 2: ANALYSIS                             */}
          {/* ============================================ */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              
              {/* Findings Summary */}
              {p1.findings && p1.findings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    <h3 className="font-semibold text-gray-900">Key Findings ({p1.findings.length})</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {p1.findings.map((finding, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{finding.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            finding.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            finding.severity === 'significant' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{finding.finding}</p>
                        <button
                          onClick={() => setExpandedFindings(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {expandedFindings[i] ? 'Hide' : 'Show'} implication & action
                          <ChevronRight className={`h-4 w-4 transition-transform ${expandedFindings[i] ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedFindings[i] && (
                          <div className="mt-2 pl-4 border-l-2 border-slate-200 space-y-2 text-sm">
                            <p><strong>Implication:</strong> {finding.implication}</p>
                            <p><strong>Action:</strong> {finding.recommendedAction}</p>
          </div>
                        )}
              </div>
            ))}
          </div>
        </div>
      )}
      
              {/* Quick Wins */}
              {p1.quickWins && p1.quickWins.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-amber-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Quick Wins (to discuss with client)</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {p1.quickWins.map((win, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{win.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{win.timing}</p>
                          <p className="text-xs text-amber-700 mt-1">{win.benefit}</p>
          </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
              {/* Scenarios to Build */}
      {admin.scenariosToBuild && admin.scenariosToBuild.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <h3 className="font-semibold text-gray-900">Scenarios to Pre-Build for Presentation</h3>
          </div>
          <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-3">
                      {admin.scenariosToBuild.map((scenario, i) => (
                        <div key={i} className="border rounded-lg p-3">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-2">
                    {scenario.type}
                  </span>
                          <p className="font-medium text-sm">{scenario.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{scenario.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
              {/* All Client Quotes */}
              {p1.clientQuotes && Object.keys(p1.clientQuotes).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-semibold text-gray-900">All Client Quotes (verbatim)</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(p1.clientQuotes).map(([key, quote]) => (
                        quote && (
                          <div key={key} className="border-l-4 border-slate-200 pl-3 py-1">
                            <p className="text-xs text-slate-500 uppercase">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-sm italic">"{quote}"</p>
                          </div>
                        )
                      ))}
          </div>
                  </div>
                </div>
              )}
              
              {/* Full Tier Recommendation */}
              {p1.tierRecommendation && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Tier Recommendation: {(p1.tierRecommendation.tier || 'GOLD').toUpperCase()}
                  </h3>
                  <p className="text-sm mb-4">{p1.tierRecommendation.rationale}</p>
                  {p1.tierRecommendation.keyDrivers && p1.tierRecommendation.keyDrivers.length > 0 && (
                    <>
                      <p className="text-sm font-medium mb-2">Key drivers:</p>
                      <ul className="text-sm space-y-1">
                        {p1.tierRecommendation.keyDrivers.map((driver, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              
            </div>
          )}
          
          {/* ============================================ */}
          {/* TAB 3: CAPTURE NOTES                        */}
          {/* ============================================ */}
          {activeTab === 'capture' && (
            <div className="space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-semibold text-gray-900">Call Notes</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-3">
                    What came up in the conversation? New pain points, specific numbers, emotional reactions...
                  </p>
                  <textarea
                    placeholder="Key points from the call..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{callNotes.length}/2000</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Call Transcript (optional)</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-3">
                    Paste a call transcript if available. AI will extract relevant insights.
                  </p>
                  <textarea
                    placeholder="Paste transcript here..."
                    value={callTranscript}
                    onChange={(e) => setCallTranscript(e.target.value)}
                    rows={8}
                    maxLength={15000}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono resize-y"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{callTranscript.length}/15,000</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Client Objections & Concerns</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-3">
                    What pushback did the client give? These will be addressed in the client presentation.
                  </p>
                  <textarea
                    placeholder="e.g., 'Concerned about price', 'Needs to discuss with partner'..."
                    value={clientObjections}
                    onChange={(e) => setClientObjections(e.target.value)}
                    rows={4}
                    maxLength={1500}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{clientObjections.length}/1,500</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Tier Interest</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-3">
                    Which tier did the client show interest in?
                  </p>
                  <div className="flex gap-2">
                    {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setTierDiscussed(tier)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          tierDiscussed === tier
                            ? `${tierBgColors[tier]} text-white`
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tier.toUpperCase()}
                      </button>
            ))}
          </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Additional Context</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-3">
                    Anything else that should inform the client presentation?
                  </p>
                  <textarea
                    placeholder="e.g., 'Business partner is skeptical', 'Year-end in 6 weeks'..."
                    value={additionalInsights}
                    onChange={(e) => setAdditionalInsights(e.target.value)}
                    rows={4}
                    maxLength={1500}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{additionalInsights.length}/1,500</p>
                </div>
              </div>
              
        </div>
      )}
      
          {/* ============================================ */}
          {/* TAB 4: REGENERATE                           */}
          {/* ============================================ */}
          {activeTab === 'regenerate' && (
            <div className="space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  <h3 className="font-semibold text-gray-900">Regenerate Client View</h3>
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-slate-600">
                    Use the information captured from the call to generate an enhanced client presentation.
                  </p>
                  
                  {/* Summary of captured info */}
                  <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                    <p className="font-medium text-sm">Information captured:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {callNotes ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                        Call notes {callNotes && `(${callNotes.length} chars)`}
                      </div>
                      <div className="flex items-center gap-2">
                        {callTranscript ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                        Transcript {callTranscript && '(provided)'}
                      </div>
                      <div className="flex items-center gap-2">
                        {gapsFilledCount > 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                        Gaps filled ({gapsFilledCount}/{totalGaps})
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Tier interest: {tierDiscussed.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        {clientObjections ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                        Objections {clientObjections && '(captured)'}
                      </div>
                      <div className="flex items-center gap-2">
                        {additionalInsights ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                        Additional context {additionalInsights && '(added)'}
                      </div>
                    </div>
                  </div>
                  
                  {/* What regeneration will do */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-sm text-blue-800 mb-2">What regeneration will do:</p>
                    <ul className="text-sm space-y-1 text-blue-700">
                      <li>• Incorporate specific details from the call (names, numbers, concerns)</li>
                      <li>• Address objections raised in the narrative</li>
                      <li>• Refine tier recommendation if different tier discussed</li>
                      <li>• Add more accurate scenarios based on filled gaps</li>
                      <li>• Strengthen emotional connection with new context</li>
                    </ul>
                  </div>
                  
                  {onRegenerateClientView ? (
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRegenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Regenerate Client View with Call Context
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
                        <p className="text-sm font-medium text-amber-800">Regeneration not available</p>
                        <p className="text-sm text-amber-700">This feature requires a regeneration handler to be configured.</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 text-center">
                    Previous version will be preserved in version history.
                  </p>
                </div>
              </div>
              
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default MAAdminReportView;
