// ============================================================================
// SERVICE LINE ASSESSMENT PAGE
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  getAssessmentByCode, 
  type ServiceLineAssessment, 
  type AssessmentQuestion 
} from '@/config/serviceLineAssessments';
import { StaffRosterBuilder, type StaffRosterPerson } from '@/components/assessment/StaffRosterBuilder';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, CheckCircle,
  Target, LineChart, Settings, Users, BarChart3
} from 'lucide-react';

const serviceIcons: Record<string, React.ComponentType<any>> = {
  '365_method': Target,
  'management_accounts': LineChart,
  'systems_audit': Settings,
  'fractional_executive': Users,
  'benchmarking': BarChart3,
};

export default function ServiceAssessmentPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [assessment, setAssessment] = useState<ServiceLineAssessment | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const checkingSharedInsightRef = useRef(false);
  const hasCheckedSharedInsightRef = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (serviceCode) {
      // Reset refs when service code changes
      hasCheckedSharedInsightRef.current = false;
      checkingSharedInsightRef.current = false;
      
      const config = getAssessmentByCode(serviceCode);
      if (config) {
        // For benchmarking, load questions from database
        if (serviceCode === 'benchmarking') {
          loadBenchmarkingQuestions(config);
        } else {
          setAssessment(config);
          loadExistingResponses(serviceCode);
        }
      } else {
        navigate('/dashboard');
      }
    }
  }, [serviceCode, navigate]);
  
  // Check for shared insights on mount and when client session is available
  // Only for management_accounts, and only once per mount
  useEffect(() => {
    if (serviceCode === 'management_accounts' && clientSession?.clientId && !loading && !hasCheckedSharedInsightRef.current) {
      hasCheckedSharedInsightRef.current = true;
      const checkForSharedInsightAndRedirect = async () => {
        try {
          console.log('🔍 Checking for shared MA insight...');
          
          // FIRST: Check for two-pass assessment report (new system)
          const { data: assessmentReport } = await supabase
            .from('ma_assessment_reports')
            .select('id, status, shared_with_client, pass2_data, client_view')
            .eq('client_id', clientSession.clientId)
            .eq('shared_with_client', true)
            .eq('status', 'generated')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (assessmentReport && (assessmentReport.pass2_data || assessmentReport.client_view)) {
            console.log('✅ Two-pass MA assessment report found, redirecting to report page');
            navigate('/service/management_accounts/report', { replace: true });
            return;
          }
          
          // Check v2 insights from ma_monthly_insights
          const { data: engagement } = await supabase
            .from('ma_engagements')
            .select('id')
            .eq('client_id', clientSession.clientId)
            .maybeSingle();
          
          if (engagement) {
            const { data: monthlyInsight } = await supabase
              .from('ma_monthly_insights')
              .select('*')
              .eq('engagement_id', engagement.id)
              .eq('shared_with_client', true)
              .is('snapshot_id', null) // v2 insights only
              .order('period_end_date', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (monthlyInsight && (monthlyInsight.headline_text || monthlyInsight.insights)) {
              console.log('✅ v2 MA insight found, redirecting to report page');
              navigate('/service/management_accounts/report', { replace: true });
              return;
            }
          }
          
          // Fallback to old client_context format
          const { data: maInsight, error: maError } = await supabase
            .from('client_context')
            .select('id, is_shared, content, data_source_type')
            .eq('client_id', clientSession.clientId)
            .eq('context_type', 'note')
            .eq('is_shared', true)
            .eq('processed', true)
            .in('data_source_type', ['management_accounts_analysis', 'general'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          console.log('🔍 MA insight check result (old format):', { maInsight, maError });
          
          if (maInsight && maInsight.content) {
            try {
              const content = typeof maInsight.content === 'string' 
                ? JSON.parse(maInsight.content) 
                : maInsight.content;
              const insightData = content?.insight || content;
              if (insightData && (insightData.headline || insightData.keyInsights)) {
                // Redirect to report page if insight is available
                console.log('✅ MA insight found (old format), redirecting to report page');
                navigate('/service/management_accounts/report', { replace: true });
                return;
              }
            } catch (e) {
              console.log('⚠️ Could not parse insight content:', e);
            }
          }
        } catch (error) {
          console.error('Error checking for shared insight:', error);
        }
      };
      
      checkForSharedInsightAndRedirect();
    }
  }, [serviceCode, clientSession?.clientId, loading, navigate]);

  const loadBenchmarkingQuestions = async (config: ServiceLineAssessment) => {
    try {
      // Load questions from assessment_questions table
      const { data: questions, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('service_line_code', 'benchmarking')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading benchmarking questions:', error);
        navigate('/dashboard');
        return;
      }

      if (!questions || questions.length === 0) {
        console.error('No benchmarking questions found');
        navigate('/dashboard');
        return;
      }

      // Convert database questions to AssessmentQuestion format
      const convertedQuestions: AssessmentQuestion[] = questions.map(q => ({
        id: q.question_id,
        section: q.section,
        question: q.question_text,
        type: q.question_type === 'single' ? 'single' : q.question_type === 'multi' ? 'multi' : q.question_type === 'text' ? 'text' : 'text',
        options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)) : undefined,
        maxSelections: q.max_selections || undefined,
        placeholder: q.placeholder || undefined,
        charLimit: q.char_limit || undefined,
        emotionalAnchor: q.emotional_anchor || undefined,
        technicalField: q.technical_field || undefined,
        required: q.is_required !== false
      }));

      // Get unique sections
      const sections = Array.from(new Set(questions.map(q => q.section)));

      // Update config with loaded questions
      const updatedConfig: ServiceLineAssessment = {
        ...config,
        sections,
        questions: convertedQuestions
      };

      setAssessment(updatedConfig);
      loadExistingResponses('benchmarking');
    } catch (err) {
      console.error('Error loading benchmarking questions:', err);
      navigate('/dashboard');
    }
  };

  const loadExistingResponses = async (code: string) => {
    if (!clientSession?.clientId) { setLoading(false); return; }
    try {
      // For benchmarking, check bm_assessment_responses table instead
      if (code === 'benchmarking') {
        const { data: engagement } = await supabase
          .from('bm_engagements')
          .select('id, status, assessment_completed_at')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        if (engagement) {
          const { data: responses } = await supabase
            .from('bm_assessment_responses')
            .select('responses')
            .eq('engagement_id', engagement.id)
            .maybeSingle();
          
          if (responses) {
            setResponses(responses.responses || {});
            // Only mark as complete if engagement status is explicitly 'assessment_complete' 
            // AND we have a completed_at timestamp (to avoid false positives from auto-save)
            if (engagement.status === 'assessment_complete' && engagement.assessment_completed_at) {
              setCompleted(true);
            }
            // Mark initial load as complete after responses are loaded
            isInitialLoadRef.current = false;
          }
        }
      } else {
        const { data } = await supabase
          .from('service_line_assessments')
          .select('responses, completed_at')
          .eq('client_id', clientSession.clientId)
          .eq('service_line_code', code)
          .single();
        if (data) {
          setResponses(data.responses || {});
          if (data.completed_at) setCompleted(true);
          // Mark initial load as complete after responses are loaded
          isInitialLoadRef.current = false;
        }
      }
    } catch (err) {
      console.log('No existing assessment');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (showSavingIndicator = true) => {
    if (!clientSession?.clientId || !assessment) return;
    if (showSavingIndicator) {
      setSaving(true);
    }
    try {
      // For benchmarking, save to bm_assessment_responses
      if (assessment.code === 'benchmarking') {
        // Find or create engagement
        let { data: engagement, error: fetchError } = await supabase
          .from('bm_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[saveProgress] Error fetching engagement:', fetchError);
          // Don't throw - just log, continue to try insert if engagement is null
        }
        
        if (!engagement) {
          console.log('[saveProgress] Creating engagement for progress save...');
          const { data: newEngagement, error: createError } = await supabase
            .from('bm_engagements')
            .insert({
              client_id: clientSession.clientId,
              practice_id: clientSession.practiceId,
              status: 'assessment_in_progress'
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error('[saveProgress] Error creating engagement:', createError);
            // Don't throw - allow progress to continue without engagement for now
          } else {
            engagement = newEngagement;
          }
        }
        
        if (engagement) {
          const { error: responsesError } = await supabase.from('bm_assessment_responses').upsert({
            engagement_id: engagement.id,
            responses,
            updated_at: new Date().toISOString()
          }, { onConflict: 'engagement_id' });
          
          if (responsesError) {
            console.error('[saveProgress] Error saving responses:', responsesError);
          }
        }
      } else {
        const completionPct = Math.round((Object.keys(responses).length / assessment.questions.length) * 100);
        await supabase.from('service_line_assessments').upsert({
          client_id: clientSession.clientId,
          practice_id: clientSession.practiceId,
          service_line_code: assessment.code,
          responses,
          completion_percentage: completionPct,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,service_line_code' });
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    console.log('🎯 handleComplete CALLED!');
    console.log('📊 Current state:', { 
      clientSession: !!clientSession, 
      clientId: clientSession?.clientId,
      assessment: !!assessment,
      assessmentCode: assessment?.code,
      assessmentName: assessment?.name,
      serviceCode 
    });
    
    if (!clientSession?.clientId || !assessment) {
      console.error('❌ Missing clientSession or assessment:', { clientSession, assessment });
      return;
    }
    
    console.log('🚀 Starting assessment completion for:', assessment.code);
    console.log('📋 Assessment object:', { code: assessment.code, name: assessment.name, type: typeof assessment.code });
    console.log('🔍 Service code from URL:', serviceCode);
    
    setSaving(true);
    try {
      const extractedInsights: Record<string, any> = {};
      assessment.questions.forEach(q => {
        if (q.emotionalAnchor && responses[q.id]) extractedInsights[q.emotionalAnchor] = responses[q.id];
        if (q.technicalField && responses[q.id]) extractedInsights[q.technicalField] = responses[q.id];
      });

      // Special handling for Benchmarking
      if (assessment.code === 'benchmarking') {
        console.log('✅ Benchmarking detected! Completing assessment...');
        
        // Find or create engagement
        let { data: engagement, error: engagementError } = await supabase
          .from('bm_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        if (engagementError && engagementError.code !== 'PGRST116') {
          console.error('Error fetching engagement:', engagementError);
          throw engagementError;
        }
        
        if (!engagement) {
          console.log('📝 Creating new bm_engagement for client:', clientSession.clientId);
          const { data: newEngagement, error: createError } = await supabase
            .from('bm_engagements')
            .insert({
              client_id: clientSession.clientId,
              practice_id: clientSession.practiceId,
              status: 'assessment_complete',
              assessment_completed_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error('❌ Error creating engagement:', createError);
            console.error('Details:', {
              clientId: clientSession.clientId,
              practiceId: clientSession.practiceId,
              error: createError
            });
            throw createError;
          }
          engagement = newEngagement;
          console.log('✅ Created engagement:', engagement.id);
        } else {
          console.log('📝 Updating existing engagement:', engagement.id);
          // Update engagement status
          const { error: updateError } = await supabase
            .from('bm_engagements')
            .update({
              status: 'assessment_complete',
              assessment_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', engagement.id);
          
          if (updateError) {
            console.error('Error updating engagement:', updateError);
            throw updateError;
          }
        }
        
        // Save completed responses
        if (engagement) {
          console.log('💾 Saving assessment responses...');
          const { error: responsesError } = await supabase.from('bm_assessment_responses').upsert({
            engagement_id: engagement.id,
            responses,
            updated_at: new Date().toISOString()
          }, { onConflict: 'engagement_id' });
          
          if (responsesError) {
            console.error('Error saving responses:', responsesError);
            throw responsesError;
          }
          console.log('✅ Assessment responses saved');
        }
        
        // Trigger report generation (async, don't wait)
        try {
          console.log('🚀 Triggering report generation...');
          supabase.functions.invoke('generate-bm-report-pass1', {
            body: { engagementId: engagement?.id }
          }).catch(err => {
            console.error('Error triggering report generation (non-blocking):', err);
          });
        } catch (err) {
          console.error('Error triggering report generation:', err);
        }
        
        setCompleted(true);
        return;
      }
      
      // Special handling for Systems Audit - multi-stage process
      console.log('🔍 Assessment code check:', assessment.code, '===', 'systems_audit', '?', assessment.code === 'systems_audit');
      console.log('🔍 Type check:', typeof assessment.code, typeof 'systems_audit');
      console.log('🔍 Exact match:', JSON.stringify(assessment.code), '===', JSON.stringify('systems_audit'));
      
      if (assessment.code === 'systems_audit') {
        console.log('✅ Systems Audit detected! Starting Stage 1 completion process...');
        
        // Find or create engagement
        console.log('📋 Looking for existing engagement for client:', clientSession.clientId);
        let { data: engagement, error: engagementError } = await supabase
          .from('sa_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        console.log('📋 Engagement query result:', { engagement, error: engagementError });
        
        if (engagementError && engagementError.code !== 'PGRST116') {
          console.error('❌ Error fetching engagement:', engagementError);
          throw engagementError;
        }
        
        if (!engagement) {
          // Create new engagement
          const { data: newEngagement, error: createError } = await supabase
            .from('sa_engagements')
            .insert({
              client_id: clientSession.clientId,
              practice_id: clientSession.practiceId,
              status: 'stage_1_complete',
              stage_1_completed_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error('Error creating engagement:', createError);
            throw createError;
          }
          engagement = newEngagement;
        } else {
          // Update existing engagement
          await supabase
            .from('sa_engagements')
            .update({
              status: 'stage_1_complete',
              stage_1_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', engagement.id);
        }
        
        // Map responses to sa_discovery_responses format
        // Note: Client portal uses different question IDs (sa_*) than admin (q*_*)
        const discoveryData: any = {
          engagement_id: engagement.id,
          client_id: clientSession.clientId,
          raw_responses: responses,
          completed_at: new Date().toISOString()
        };
        
        // Helper function to normalize select options to database enum values
        const normalizeSelect = (value: string): string => {
          if (!value) return '';
          return value.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .replace(/[£k]/g, '');
        };
        
        // Map client portal question IDs to database fields
        if (responses['sa_breaking_point']) discoveryData.systems_breaking_point = responses['sa_breaking_point'];
        if (responses['sa_operations_diagnosis']) {
          const val = responses['sa_operations_diagnosis'];
          // Map to enum values
          if (val.includes('Controlled chaos')) discoveryData.operations_self_diagnosis = 'controlled_chaos';
          else if (val.includes('Manual heroics')) discoveryData.operations_self_diagnosis = 'manual_heroics';
          else if (val.includes('Death by spreadsheet')) discoveryData.operations_self_diagnosis = 'death_by_spreadsheet';
          else if (val.includes('Tech Frankenstein')) discoveryData.operations_self_diagnosis = 'tech_frankenstein';
          else if (val.includes('Actually pretty good')) discoveryData.operations_self_diagnosis = 'actually_good';
        }
        if (responses['sa_month_end_shame']) discoveryData.month_end_shame = responses['sa_month_end_shame'];
        if (responses['sa_manual_hours']) {
          const val = responses['sa_manual_hours'];
          if (val.includes('Under 10')) discoveryData.manual_hours_monthly = 'under_10';
          else if (val.includes('10-20')) discoveryData.manual_hours_monthly = '10_20';
          else if (val.includes('20-40')) discoveryData.manual_hours_monthly = '20_40';
          else if (val.includes('40-80')) discoveryData.manual_hours_monthly = '40_80';
          else if (val.includes('More than 80')) discoveryData.manual_hours_monthly = 'over_80';
        }
        if (responses['sa_month_end_duration']) {
          const val = responses['sa_month_end_duration'];
          if (val.includes('1-2 days')) discoveryData.month_end_close_duration = '1_2_days';
          else if (val.includes('3-5 days')) discoveryData.month_end_close_duration = '3_5_days';
          else if (val.includes('1-2 weeks')) discoveryData.month_end_close_duration = '1_2_weeks';
          else if (val.includes('2-4 weeks')) discoveryData.month_end_close_duration = '2_4_weeks';
          else if (val.includes('ongoing')) discoveryData.month_end_close_duration = 'ongoing';
        }
        if (responses['sa_data_error_frequency']) {
          const val = responses['sa_data_error_frequency'];
          if (val.includes('Never')) discoveryData.data_error_frequency = 'never';
          else if (val.includes('Once or twice')) discoveryData.data_error_frequency = 'once_twice';
          else if (val.includes('Several times')) discoveryData.data_error_frequency = 'several';
          else if (val.includes('Regularly')) discoveryData.data_error_frequency = 'regularly';
          else if (val.includes('don\'t know')) discoveryData.data_error_frequency = 'dont_know';
        }
        if (responses['sa_expensive_mistake']) discoveryData.expensive_systems_mistake = responses['sa_expensive_mistake'];
        if (responses['sa_tech_stack']) discoveryData.software_tools_used = Array.isArray(responses['sa_tech_stack']) ? responses['sa_tech_stack'] : [responses['sa_tech_stack']];
        if (responses['sa_integration_health']) {
          const val = responses['sa_integration_health'];
          if (val.includes('Seamless')) discoveryData.integration_rating = 'seamless';
          else if (val.includes('Partial')) discoveryData.integration_rating = 'partial';
          else if (val.includes('Minimal')) discoveryData.integration_rating = 'minimal';
          else if (val.includes('Non-existent')) discoveryData.integration_rating = 'none';
        }
        if (responses['sa_spreadsheet_count']) {
          const val = responses['sa_spreadsheet_count'];
          if (val.includes('None')) discoveryData.critical_spreadsheets = 'none';
          else if (val.includes('1-3')) discoveryData.critical_spreadsheets = '1_3';
          else if (val.includes('4-10')) discoveryData.critical_spreadsheets = '4_10';
          else if (val.includes('10-20')) discoveryData.critical_spreadsheets = '10_20';
          else if (val.includes('lost count')) discoveryData.critical_spreadsheets = 'lost_count';
        }
        if (responses['sa_information_access']) {
          const val = responses['sa_information_access'];
          if (val.includes('Never')) discoveryData.information_access_frequency = 'never';
          else if (val.includes('1-2 times')) discoveryData.information_access_frequency = '1_2_times';
          else if (val.includes('Weekly')) discoveryData.information_access_frequency = 'weekly';
          else if (val.includes('Daily')) discoveryData.information_access_frequency = 'daily';
          else if (val.includes('Constantly')) discoveryData.information_access_frequency = 'constantly';
        }
        if (responses['sa_priority_areas']) discoveryData.broken_areas = Array.isArray(responses['sa_priority_areas']) ? responses['sa_priority_areas'] : [responses['sa_priority_areas']];
        if (responses['sa_magic_fix']) discoveryData.magic_process_fix = responses['sa_magic_fix'];
        // Your Vision section
        if (responses['sa_desired_outcomes']) {
          discoveryData.desired_outcomes = Array.isArray(responses['sa_desired_outcomes'])
            ? responses['sa_desired_outcomes']
            : [responses['sa_desired_outcomes']];
        }
        if (responses['sa_monday_morning']) {
          discoveryData.monday_morning_vision = responses['sa_monday_morning'];
        }
        if (responses['sa_time_freedom']) {
          discoveryData.time_freedom_priority = responses['sa_time_freedom'];
        }
        if (responses['sa_change_appetite']) {
          const val = responses['sa_change_appetite'];
          if (val.includes('Urgent')) discoveryData.change_appetite = 'urgent';
          else if (val.includes('Ready')) discoveryData.change_appetite = 'ready';
          else if (val.includes('Cautious')) discoveryData.change_appetite = 'cautious';
          else if (val.includes('Exploring')) discoveryData.change_appetite = 'exploring';
        }
        if (responses['sa_fears']) discoveryData.systems_fears = Array.isArray(responses['sa_fears']) ? responses['sa_fears'] : [responses['sa_fears']];
        if (responses['sa_champion']) {
          const val = responses['sa_champion'];
          if (val.includes('founder') || val.includes('Me')) discoveryData.internal_champion = 'founder';
          else if (val.includes('Finance')) discoveryData.internal_champion = 'finance_manager';
          else if (val.includes('Operations')) discoveryData.internal_champion = 'operations_manager';
          else if (val.includes('Office')) discoveryData.internal_champion = 'office_manager';
          else if (val.includes('IT')) discoveryData.internal_champion = 'it_lead';
          else discoveryData.internal_champion = 'other';
        }
        if (responses['sa_team_size']) {
          const parsed = parseInt(responses['sa_team_size'], 10);
          if (!isNaN(parsed)) discoveryData.team_size = parsed;
        }
        if (responses['sa_expected_team_size']) {
          const parsed = parseInt(responses['sa_expected_team_size'], 10);
          if (!isNaN(parsed)) discoveryData.expected_team_size_12mo = parsed;
        }
        if (responses['sa_industry']) {
          discoveryData.industry_sector = responses['sa_industry'];
        }
        // Where You're Going
        if (responses['sa_growth_shape']) discoveryData.growth_vision = responses['sa_growth_shape'];
        if (responses['sa_next_hires']) discoveryData.hiring_blockers = responses['sa_next_hires'];
        if (responses['sa_growth_type']) discoveryData.growth_type = responses['sa_growth_type'];
        if (responses['sa_capacity_ceiling']) discoveryData.capacity_ceiling = responses['sa_capacity_ceiling'];
        if (responses['sa_tried_and_failed']) discoveryData.failed_tools = responses['sa_tried_and_failed'];
        if (responses['sa_non_negotiables']) discoveryData.non_negotiables = responses['sa_non_negotiables'];
        // Your Business (additional)
        if (responses['sa_business_model']) discoveryData.business_model = responses['sa_business_model'];
        if (responses['sa_team_structure']) discoveryData.team_structure = responses['sa_team_structure'];
        if (responses['sa_staff_roster']) {
          const roster = Array.isArray(responses['sa_staff_roster']) ? responses['sa_staff_roster'] : (typeof responses['sa_staff_roster'] === 'string' ? (() => { try { return JSON.parse(responses['sa_staff_roster']); } catch { return []; } })() : []);
          await supabase.from('sa_staff_members').delete().eq('engagement_id', engagement.id);
          if (roster.length > 0) {
            const staffRows = roster.map((p: StaffRosterPerson) => ({
              engagement_id: engagement.id,
              name: (p.name || '').trim(),
              role_title: (p.roleTitle || '').trim() || null,
              department: (p.department || '').trim() || null,
              hourly_rate: Number(p.hourlyRate) || 0,
              hours_per_week: Number(p.hoursPerWeek) || 37.5,
              added_at_stage: 'stage_1',
            })).filter((row: { name: string }) => row.name.length > 0);
            if (staffRows.length > 0) {
              await supabase.from('sa_staff_members').insert(staffRows);
              const totalWeighted = staffRows.reduce((s: number, r: { hourly_rate: number; hours_per_week: number }) => s + r.hourly_rate * r.hours_per_week, 0);
              const totalHours = staffRows.reduce((s: number, r: { hours_per_week: number }) => s + r.hours_per_week, 0);
              const blendedRate = totalHours > 0 ? Math.round((totalWeighted / totalHours) * 100) / 100 : 45;
              await supabase.from('sa_engagements').update({ hourly_rate: blendedRate, updated_at: new Date().toISOString() }).eq('id', engagement.id);
            }
          }
        }
        if (responses['sa_locations']) discoveryData.work_location = responses['sa_locations'];
        if (responses['sa_key_people_dependencies']) discoveryData.key_person_dependency = responses['sa_key_people_dependencies'];

        // Upsert discovery responses
        console.log('💾 Saving discovery responses...');
        const { error: discoveryError } = await supabase
          .from('sa_discovery_responses')
          .upsert(discoveryData, { onConflict: 'engagement_id' });
        
        if (discoveryError) {
          console.error('❌ Error saving discovery responses:', discoveryError);
          throw discoveryError;
        }
        
        console.log('✅ Systems Audit Stage 1 saved successfully!');
        console.log('🚀 Navigating to Stage 2: /service/systems_audit/inventory');
        
        // IMPORTANT: Set saving to false and DON'T set completed=true for Systems Audit
        setSaving(false);
        
        // Also save to service_line_assessments for backward compatibility
        await supabase.from('service_line_assessments').upsert({
          client_id: clientSession.clientId,
          practice_id: clientSession.practiceId,
          service_line_code: 'systems_audit',
          responses,
          extracted_insights: extractedInsights,
          completion_percentage: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,service_line_code' });
        
        // Route to Stage 2 (System Inventory) - use window.location directly for reliability
        console.log('🚀 Using window.location for navigation');
        window.location.href = '/service/systems_audit/inventory';
        return;
      }

      // Standard handling for other service lines
      await supabase.from('service_line_assessments').upsert({
        client_id: clientSession.clientId,
        practice_id: clientSession.practiceId,
        service_line_code: assessment.code,
        responses,
        extracted_insights: extractedInsights,
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,service_line_code' });

      const { data: sl } = await supabase.from('service_lines').select('id').eq('code', assessment.code).single();
      if (sl?.id) {
        await supabase.from('client_service_lines').update({ 
          status: 'proposal_sent',
          onboarding_completed_at: new Date().toISOString()
        }).eq('client_id', clientSession.clientId).eq('service_line_id', sl.id);
      }

      // Only set completed for non-Systems Audit and non-Benchmarking assessments
      if (assessment.code !== 'systems_audit' && assessment.code !== 'benchmarking') {
        console.log('✅ Setting completed=true for service:', assessment.code);
        setCompleted(true);
      } else {
        console.warn(`⚠️ ${assessment.code} should have been handled above - this shouldn't be reached!`);
      }
      
      // Check for shared MA insights before showing completion page
      const hasInsight = await checkForSharedMAInsight();
      if (hasInsight) {
        return; // Redirected to report page
      }
      
      setGeneratingProposal(true);
      try {
        await supabase.functions.invoke('generate-value-proposition', {
          body: { clientId: clientSession.clientId, serviceLineCode: assessment.code, responses, extractedInsights }
        });
      } catch (vpErr) { console.error('VP error:', vpErr); }
      finally { setGeneratingProposal(false); }
    } catch (err) {
      console.error('❌ Complete error:', err);
      // Don't set completed=true if there was an error
      // Show error to user
      alert('There was an error saving your assessment. Please try again or contact support.');
    } finally {
      setSaving(false);
    }
  };

  const sectionQuestions = assessment?.questions.filter(q => q.section === assessment.sections[currentSection]) || [];
  
  const isComplete = (qs: AssessmentQuestion[]) => qs.every(q => {
    if (!q.required) return true;
    const r = responses[q.id];
    if (q.type === 'text') return r && r.trim().length > 0;
    if (q.type === 'multi') return r && r.length > 0;
    if (q.type === 'staff_roster') {
      const roster = Array.isArray(r) ? r : (typeof r === 'string' ? (() => { try { return JSON.parse(r); } catch { return []; } })() : []);
      if (roster.length === 0) return false;
      return roster.every((p: StaffRosterPerson) => (p.name || '').trim().length > 0 && (p.roleTitle || '').trim().length > 0 && Number(p.hourlyRate) > 0);
    }
    return r !== undefined && r !== null;
  });

  const isSectionComplete = isComplete(sectionQuestions);
  const isAllComplete = isComplete(assessment?.questions || []);

  const handleNav = (dir: number) => {
    saveProgress();
    setCurrentSection(currentSection + dir);
    window.scrollTo(0, 0);
  };

  // Auto-save responses when they change (debounced)
  useEffect(() => {
    // Skip auto-save during initial load
    if (isInitialLoadRef.current || loading || !assessment) return;
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer to save after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      if (Object.keys(responses).length > 0) {
        saveProgress(false); // Don't show saving indicator for auto-save
      }
    }, 2000);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [responses, loading, assessment]);

  const handleSaveAndExit = async () => {
    await saveProgress(true);
    navigate('/dashboard');
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  if (!assessment) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Assessment not found</p></div>;

  // Check for shared MA insights - moved to completion handler to avoid useEffect infinite loops
  const checkForSharedMAInsight = async () => {
    if (serviceCode !== 'management_accounts' || !clientSession?.clientId || checkingSharedInsightRef.current) {
      return false;
    }
    
    checkingSharedInsightRef.current = true;
    
    try {
      // First check v2 insights from ma_monthly_insights
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('id')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();
      
      if (engagement) {
        const { data: monthlyInsight } = await supabase
          .from('ma_monthly_insights')
          .select('*')
          .eq('engagement_id', engagement.id)
          .eq('shared_with_client', true)
          .is('snapshot_id', null)
          .order('period_end_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (monthlyInsight && (monthlyInsight.headline_text || monthlyInsight.insights)) {
          navigate('/service/management_accounts/report', { replace: true });
          return true;
        }
      }
      
      // Fallback to old client_context format
      const { data: maInsight } = await supabase
        .from('client_context')
        .select('id, is_shared, content, data_source_type')
        .eq('client_id', clientSession.clientId)
        .eq('context_type', 'note')
        .eq('is_shared', true)
        .eq('processed', true)
        .in('data_source_type', ['management_accounts_analysis', 'general'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (maInsight && maInsight.content) {
        try {
          const content = typeof maInsight.content === 'string' 
            ? JSON.parse(maInsight.content) 
            : maInsight.content;
          if (content && (content.headline || content.keyInsights || (content.insight && (content.insight.headline || content.insight.keyInsights)))) {
            navigate('/service/management_accounts/report', { replace: true });
            return true;
          }
        } catch (e) {
          // Not valid insight
        }
      }
    } catch (error) {
      console.error('Error checking for shared insight:', error);
    }
    
    return false;
  };

  if (completed) {
    // Check if this is Systems Audit and Stage 1 is complete
    const isSystemsAudit = serviceCode === 'systems_audit';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSystemsAudit ? 'Stage 1 Complete!' : 'Assessment Complete!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isSystemsAudit 
              ? "Great work! You've completed the Discovery Assessment. Ready to move on to Stage 2: System Inventory?"
              : generatingProposal 
                ? "We're preparing your personalized proposal..." 
                : "Your advisor will review your responses shortly."}
          </p>
          {generatingProposal && <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-6" />}
          {checkingSharedInsightRef.current && serviceCode === 'management_accounts' && (
            <div className="mb-6">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm text-gray-500 mt-2">Checking for available insights...</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {isSystemsAudit && (
              <button 
                onClick={() => window.location.href = '/service/systems_audit/inventory'} 
                className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
              >
                Continue to Stage 2: System Inventory
              </button>
            )}
            <button 
              onClick={() => navigate('/dashboard')} 
              className={`px-6 py-3 ${isSystemsAudit ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-lg`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = serviceIcons[assessment.code] || Target;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <div className="flex-1">
              <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-indigo-600" /><h1 className="font-bold text-gray-900">{assessment.title}</h1></div>
              <p className="text-sm text-gray-500">{assessment.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {saving && <span className="text-gray-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving...</span>}
              <button
                onClick={handleSaveAndExit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Exit
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {assessment.sections.map((s, i) => {
              const qs = assessment.questions.filter(q => q.section === s);
              const done = isComplete(qs);
              return <button key={s} onClick={() => { saveProgress(); setCurrentSection(i); }} className={`flex-1 h-2 rounded-full ${i === currentSection ? 'bg-indigo-600' : done ? 'bg-emerald-500' : 'bg-gray-200'}`} title={s} />;
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{assessment.sections[currentSection]}</h2>
          <p className="text-gray-500">Section {currentSection + 1} of {assessment.sections.length}</p>
        </div>

        <div className="space-y-8">
          {sectionQuestions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              value={responses[q.id]}
              onChange={v => setResponses(prev => ({ ...prev, [q.id]: v }))}
              contextValue={responses[`${q.id}_context`] || ''}
              onContextChange={val => setResponses(prev => ({ ...prev, [`${q.id}_context`]: val }))}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button onClick={() => handleNav(-1)} disabled={currentSection === 0} className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50">
            <ArrowLeft className="w-4 h-4" />Previous
          </button>
          {currentSection === assessment.sections.length - 1 ? (
            <button 
              onClick={() => {
                console.log('🖱️ Complete button clicked!');
                console.log('📋 Button state:', { isAllComplete, saving, assessmentCode: assessment.code });
                handleComplete();
              }} 
              disabled={!isAllComplete || saving} 
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg disabled:bg-gray-300"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Check className="w-4 h-4" />Complete</>}
            </button>
          ) : (
            <button onClick={() => handleNav(1)} disabled={!isSectionComplete} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300">
              Next<ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function ContextField({
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
        className="mt-3 text-sm text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Anything to add?
      </button>
    );
  }

  return (
    <div className="mt-3">
      <textarea
        value={contextValue || ''}
        onChange={(e) => onContextChange(e.target.value)}
        onBlur={() => { if (!contextValue?.trim()) setExpanded(false); }}
        placeholder="Optional — add any context that helps explain your answer..."
        maxLength={300}
        rows={2}
        autoFocus={!contextValue}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-gray-50"
      />
      <p className="text-xs text-gray-400 text-right mt-0.5">
        {contextValue?.length || 0} / 300
      </p>
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onChange,
  contextValue = '',
  onContextChange,
}: {
  question: AssessmentQuestion;
  value: any;
  onChange: (v: any) => void;
  contextValue?: string;
  onContextChange?: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <label className="block text-lg font-medium text-gray-900 mb-4">{question.question}{question.required && <span className="text-red-500 ml-1">*</span>}</label>
      
      {question.type === 'single' && (
        <div className="space-y-2">
          {question.options?.map((opt, i) => (
            <label key={i} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${value === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" checked={value === opt} onChange={() => onChange(opt)} className="w-4 h-4 text-indigo-600" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'multi' && (
        <div className="space-y-2">
          {question.options?.map((opt, i) => {
            const sel = value?.includes(opt) || false;
            const maxReached = !!(question.maxSelections && value?.length >= question.maxSelections && !sel);
            return (
              <label key={i} className={`flex items-center gap-3 p-4 rounded-lg border-2 ${maxReached ? 'opacity-50 cursor-not-allowed' : sel ? 'border-indigo-500 bg-indigo-50 cursor-pointer' : 'border-gray-200 hover:border-gray-300 cursor-pointer'}`}>
                <input type="checkbox" checked={sel} disabled={maxReached} onChange={e => onChange(e.target.checked ? [...(value || []), opt] : (value || []).filter((v: string) => v !== opt))} className="w-4 h-4 text-indigo-600 rounded" />
                <span>{opt}</span>
              </label>
            );
          })}
          {question.maxSelections && <p className="text-sm text-gray-500 mt-2">Select up to {question.maxSelections} ({value?.length || 0} selected)</p>}
        </div>
      )}

      {(question.type === 'single' || question.type === 'multi') && value != null && (value !== '' && (!Array.isArray(value) || value.length > 0)) && onContextChange && (
        <ContextField contextValue={contextValue} onContextChange={onContextChange} />
      )}

      {question.type === 'text' && (
        <div>
          <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={question.placeholder} maxLength={question.charLimit} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
          {question.charLimit && <p className="text-sm text-gray-400 text-right mt-1">{value?.length || 0} / {question.charLimit}</p>}
        </div>
      )}

      {question.type === 'staff_roster' && (
        <StaffRosterBuilder
          value={Array.isArray(value) ? value : (typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [])}
          onChange={v => onChange(v)}
          placeholder={question.placeholder}
          required={question.required}
        />
      )}

      {question.type === 'slider' && (
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{question.sliderLabels?.min || question.sliderMin}</span>
            <span className="font-medium text-lg text-indigo-600">{value || question.sliderMin || 1}</span>
            <span>{question.sliderLabels?.max || question.sliderMax}</span>
          </div>
          <input
            type="range"
            min={question.sliderMin || 1}
            max={question.sliderMax || 10}
            value={value || question.sliderMin || 1}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            {Array.from({ length: (question.sliderMax || 10) - (question.sliderMin || 1) + 1 }, (_, i) => (
              <span key={i}>{(question.sliderMin || 1) + i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

