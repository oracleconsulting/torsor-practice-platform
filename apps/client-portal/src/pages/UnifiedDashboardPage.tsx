// ============================================================================
// UNIFIED CLIENT DASHBOARD
// ============================================================================
// Shows all assigned service lines in a clean, actionable layout
// Works for clients with multiple services (Discovery, 365, etc.)
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { supabase } from '@/lib/supabase';
import {
  Compass,
  Target,
  FileText,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  Play,
  Lock,
  Briefcase,
  BarChart3,
  Users,
} from 'lucide-react';

interface ServiceEnrollment {
  id: string;
  status: string;
  serviceCode: string;
  serviceName: string;
  serviceDescription: string;
  createdAt: string;
}

interface DiscoveryStatus {
  completed: boolean;
  completedAt?: string;
  hasReport: boolean;
  reportShared: boolean;
}

const SERVICE_ICONS: Record<string, any> = {
  'discovery': Compass,
  '365_method': Target,
  '365_alignment': Target,
  'fractional_cfo': TrendingUp,
  'management_accounts': FileText,
  'business_intelligence': FileText,  // Alias for renamed service
  'systems_audit': BarChart3,
  'hidden_value_audit': Award,
  'team_training': Users,
  'business_advisory': Briefcase,
  'benchmarking': BarChart3,
};

const SERVICE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'discovery': { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  '365_method': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  '365_alignment': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  'fractional_cfo': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  'management_accounts': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  'business_intelligence': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },  // Alias
  'systems_audit': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  'hidden_value_audit': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  'benchmarking': { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
};

// Helper to check if a service code is BI/MA
const isBIService = (code: string) => code === 'management_accounts' || code === 'business_intelligence';

export default function UnifiedDashboardPage() {
  const { clientSession } = useAuth();
  const { progress: assessmentProgress, loading: progressLoading } = useAssessmentProgress();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<ServiceEnrollment[]>([]);
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus | null>(null);
  const [maInsightShared, setMAInsightShared] = useState(false);
  const [maAssessmentCompleted, setMAAssessmentCompleted] = useState(false);
  const [biPeriodDelivered, setBIPeriodDelivered] = useState(false);  // New: track delivered BI periods
  const maInsightSharedRef = useRef(false);
  const maAssessmentCompletedRef = useRef(false);
  const biPeriodDeliveredRef = useRef(false);  // New: ref for immediate access
  const [saReportShared, setSaReportShared] = useState(false);
  const [systemsAuditStage, setSystemsAuditStage] = useState<{
    stage1Complete: boolean;
    stage2Complete: boolean;
    stage3Complete: boolean;
    engagementId: string | null;
    reportApproved: boolean;
  } | null>(null);
  const [benchmarkingStatus, setBenchmarkingStatus] = useState<{
    hasEngagement: boolean;
    assessmentComplete: boolean;
    reportGenerated: boolean;
    reportShared: boolean;
  } | null>(null);
  const [gaSprintData, setGASprintData] = useState<{
    hasRoadmap: boolean;
    hasSprint: boolean;
    sprintNumber: number;
    activeWeek: number;
    totalWeeks: number;
    completionRate: number;
    completedTasks: number;
    totalTasks: number;
    isSprintComplete: boolean;
    hasLifeCheckPending: boolean;
    hasCatchUpNeeded: boolean;
    weeksBehind: number;
    nextTaskTitle: string | null;
    sprintTheme: string | null;
  } | null>(null);
  const [gaLifeAlignmentScore, setGALifeAlignmentScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientSession?.clientId) {
      loadDashboardData();
    }
  }, [clientSession?.clientId]);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard for client:', {
        clientId: clientSession?.clientId,
        practiceId: clientSession?.practiceId,
        email: clientSession?.email,
        name: clientSession?.name
      });
      
      // Load all enrolled services
      const { data: enrollments, error: enrollError } = await supabase
        .from('client_service_lines')
        .select(`
          id,
          status,
          created_at,
          service_line:service_lines(code, name, short_description)
        `)
        .eq('client_id', clientSession?.clientId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (enrollError) {
        console.error('❌ Error loading service enrollments:', enrollError);
      }
      
      console.log('📋 Raw enrollments from DB:', enrollments);
      console.log('📋 Service enrollments (detailed):', enrollments?.map((e: any) => ({
        id: e.id,
        status: e.status,
        serviceLineCode: e.service_line?.code,
        serviceLineName: e.service_line?.name,
        hasServiceLine: !!e.service_line
      })));

      if (enrollError) {
        console.error('Error loading services:', enrollError);
      }
      
      console.log('📋 Service enrollments:', enrollments);

      // Check for shared MA insights EARLY (before building service list)
      // Also check for delivered BI periods (new system)
      let hasSharedMAInsight = false;
      let hasBIDeliveredPeriod = false;
      
      if (clientSession?.clientId) {
        // Check for MA engagement and v2 insight
        const { data: maEngagement } = await supabase
          .from('ma_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        // Also check for BI engagement (renamed service)
        const { data: biEngagement } = await supabase
          .from('bi_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        const engagement = maEngagement || biEngagement;
        console.log('📊 BI/MA Engagement check:', { maEngagement, biEngagement, clientId: clientSession.clientId });
        
        if (engagement) {
          // Check for DELIVERED periods (new BI/MA delivery system)
          // Check ma_periods first
          const { data: maPeriod } = await supabase
            .from('ma_periods')
            .select('id, status, period_label, delivered_at')
            .eq('engagement_id', engagement.id)
            .eq('status', 'delivered')
            .order('period_end', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Also check bi_periods
          const { data: biPeriod } = await supabase
            .from('bi_periods')
            .select('id, status, period_label, delivered_at')
            .eq('engagement_id', engagement.id)
            .eq('status', 'delivered')
            .order('period_end', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          const deliveredPeriod = maPeriod || biPeriod;
          if (deliveredPeriod) {
            hasBIDeliveredPeriod = true;
            console.log('✅ Found delivered BI/MA period:', {
              id: deliveredPeriod.id,
              label: deliveredPeriod.period_label,
              deliveredAt: deliveredPeriod.delivered_at,
              source: maPeriod ? 'ma_periods' : 'bi_periods'
            });
          } else {
            console.log('📋 No delivered BI/MA periods found');
          }
          
          // Check for v2 insights
          const { data: monthlyInsight } = await supabase
            .from('ma_monthly_insights')
            .select('*')
            .eq('engagement_id', engagement.id)
            .eq('shared_with_client', true)
            .is('snapshot_id', null) // v2 insights only
            .order('period_end_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (monthlyInsight && (monthlyInsight.headline_text || monthlyInsight.insights)) {
            hasSharedMAInsight = true;
            console.log('✅ Valid v2 MA insight found:', { 
              id: monthlyInsight.id,
              hasHeadline: !!monthlyInsight.headline_text,
              hasKeyInsights: !!(monthlyInsight.insights && monthlyInsight.insights.length > 0),
              headlineText: monthlyInsight.headline_text?.substring(0, 50) || 'N/A'
            });
          }
        }
        
        // Fallback to old client_context format if v2 not found
        if (!hasSharedMAInsight) {
          const { data: maInsight, error: maError } = await supabase
            .from('client_context')
            .select('id, is_shared, created_at, content, data_source_type')
            .eq('client_id', clientSession.clientId)
            .eq('context_type', 'note')
            .eq('is_shared', true)
            .eq('processed', true)
            .in('data_source_type', ['management_accounts_analysis', 'general'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          console.log('📊 MA Insight query result (old format):', { maInsight, maError, clientId: clientSession.clientId });
          
          if (maInsight && maInsight.content) {
            try {
              const content = typeof maInsight.content === 'string' 
                ? JSON.parse(maInsight.content) 
                : maInsight.content;
              
              const insightData = content?.insight || content;
              if (insightData && (insightData.headline || insightData.keyInsights)) {
                hasSharedMAInsight = true;
                console.log('✅ Valid MA insight found (old format):', { 
                  hasHeadline: !!insightData.headline, 
                  hasKeyInsights: !!insightData.keyInsights,
                  headlineText: insightData.headline?.text?.substring(0, 50) || 'N/A'
                });
              }
            } catch (e) {
              console.error('❌ Error parsing MA insight content:', e);
            }
          }
        }
      }
      maInsightSharedRef.current = hasSharedMAInsight;
      setMAInsightShared(hasSharedMAInsight);
      biPeriodDeliveredRef.current = hasBIDeliveredPeriod;
      setBIPeriodDelivered(hasBIDeliveredPeriod);
      console.log('📊 MA/BI status:', { 
        insightShared: hasSharedMAInsight, 
        periodDelivered: hasBIDeliveredPeriod 
      });

      // Check MA assessment completion status
      let maAssessmentDone = false;
      if (clientSession?.clientId) {
        const { data: maAssessment, error: maAssessmentError } = await supabase
          .from('service_line_assessments')
          .select('completed_at')
          .eq('client_id', clientSession.clientId)
          .in('service_line_code', ['management_accounts', 'business_intelligence'])
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (maAssessment?.completed_at) {
          maAssessmentDone = true;
          console.log('✅ MA Assessment completed at:', maAssessment.completed_at);
        } else {
          console.log('📋 MA Assessment not yet completed');
        }
        if (maAssessmentError) {
          console.error('❌ Error checking MA assessment:', maAssessmentError);
        }
      }
      maAssessmentCompletedRef.current = maAssessmentDone;
      setMAAssessmentCompleted(maAssessmentDone);
      console.log('📊 MA Assessment completed status set to:', maAssessmentDone);

      // Check Systems Audit engagement status
      if (clientSession?.clientId) {
        console.log('🔍 Checking Systems Audit engagement for client:', clientSession.clientId);
        const { data: saEngagement, error: saError } = await supabase
          .from('sa_engagements')
          .select('id, stage_1_completed_at, stage_2_completed_at, stage_3_completed_at, is_shared_with_client, status')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        if (saEngagement?.is_shared_with_client) setSaReportShared(true);
        
        console.log('📊 Systems Audit engagement query result:', { saEngagement, saError });
        
        if (saError) {
          console.error('❌ Error fetching Systems Audit engagement:', saError);
          setSaReportShared(false);
          setSystemsAuditStage({
            stage1Complete: false,
            stage2Complete: false,
            stage3Complete: false,
            engagementId: null,
            reportApproved: false
          });
        } else if (saEngagement) {
          // Check if report is approved
          let reportApproved = false;
          if (saEngagement.stage_3_completed_at) {
            console.log('🔍 Checking report status for engagement:', saEngagement.id);
            
            // First, check if ANY report exists (even if not approved) - this helps diagnose RLS issues
            const { data: allReports, error: allReportsError } = await supabase
              .from('sa_audit_reports')
              .select('id, status, created_at, engagement_id')
              .eq('engagement_id', saEngagement.id)
              .order('created_at', { ascending: false });
            
            console.log('🔍 All reports for engagement (diagnostic):', {
              count: allReports?.length || 0,
              reports: allReports,
              error: allReportsError
            });
            
            // Now check for approved reports only
            const { data: report, error: reportError } = await supabase
              .from('sa_audit_reports')
              .select('id, status, created_at, engagement_id')
              .eq('engagement_id', saEngagement.id)
              .in('status', ['approved', 'published', 'delivered'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            console.log('🔍 Systems Audit report check result:', { 
              report, 
              reportError, 
              engagementId: saEngagement.id,
              hasReport: !!report,
              reportStatus: report?.status,
              reportId: report?.id,
              errorCode: reportError?.code,
              errorMessage: reportError?.message,
              errorDetails: reportError?.details,
              allReportsCount: allReports?.length || 0,
              allReportsStatuses: allReports?.map(r => r.status) || []
            });
            
            if (reportError) {
              console.error('❌ Error fetching Systems Audit report:', {
                code: reportError.code,
                message: reportError.message,
                details: reportError.details,
                hint: reportError.hint
              });
              
              // If it's an RLS error, log it specifically
              if (reportError.code === '42501' || reportError.message?.includes('permission') || reportError.message?.includes('policy')) {
                console.error('🚨 RLS POLICY ERROR: Client cannot access report. This may be because:');
                console.error('   1. The RLS migration has not been applied');
                console.error('   2. The report status is not "approved", "published", or "delivered"');
                console.error('   3. The client_id does not match the engagement');
              }
            }
            
            if (report && (report.status === 'approved' || report.status === 'published' || report.status === 'delivered')) {
              reportApproved = true;
              console.log('✅ Report is approved and accessible:', report.status);
            } else if (allReports && allReports.length > 0) {
              const latestReport = allReports[0];
              console.log('⚠️ Report exists but not approved. Latest report status:', latestReport.status, '- Client cannot view yet');
              console.log('💡 To make it visible, update the report status to "approved" in the admin portal');
            } else if (!reportError && !allReportsError) {
              console.log('⚠️ No report found for engagement (no error, just no data)');
              console.log('💡 This means either:');
              console.log('   1. The report has not been generated yet');
              console.log('   2. The RLS policy is blocking access (but no error was returned)');
            }
          }
          
          setSystemsAuditStage({
            stage1Complete: !!saEngagement.stage_1_completed_at,
            stage2Complete: !!saEngagement.stage_2_completed_at,
            stage3Complete: !!saEngagement.stage_3_completed_at,
            engagementId: saEngagement.id,
            reportApproved
          });
          console.log('✅ Systems Audit stage status:', {
            stage1Complete: !!saEngagement.stage_1_completed_at,
            stage2Complete: !!saEngagement.stage_2_completed_at,
            stage3Complete: !!saEngagement.stage_3_completed_at,
            engagementId: saEngagement.id,
            reportApproved
          });
        } else {
          console.log('⚠️ No Systems Audit engagement found');
          setSaReportShared(false);
          setSystemsAuditStage({
            stage1Complete: false,
            stage2Complete: false,
            stage3Complete: false,
            engagementId: null,
            reportApproved: false
          });
        }
      }

      // ========== Benchmarking Status Check ==========
      // Check if client has a benchmarking engagement and shared report
      const hasBenchmarkingService = enrollments?.some((e: any) => e.service_line?.code === 'benchmarking');
      if (hasBenchmarkingService) {
        console.log('📊 Checking benchmarking status...');
        
        // Include report_shared_with_client from engagement (clients can read this)
        const { data: bmEngagement, error: bmEngagementError } = await supabase
          .from('bm_engagements')
          .select('id, status, assessment_completed_at, report_shared_with_client')
          .eq('client_id', clientSession?.clientId)
          .maybeSingle();
        
        if (bmEngagementError) {
          console.error('❌ Error fetching benchmarking engagement:', bmEngagementError);
          setBenchmarkingStatus({
            hasEngagement: false,
            assessmentComplete: false,
            reportGenerated: false,
            reportShared: false
          });
        } else if (bmEngagement) {
          const isReportGenerated = ['generated', 'approved', 'published', 'pass1_complete'].includes(bmEngagement.status);
          // Read share status directly from engagement (avoids RLS issues with bm_reports)
          const isReportShared = !!bmEngagement.report_shared_with_client;
          
          setBenchmarkingStatus({
            hasEngagement: true,
            assessmentComplete: !!bmEngagement.assessment_completed_at || ['assessment_complete', 'generated', 'approved', 'published', 'pass1_complete'].includes(bmEngagement.status),
            reportGenerated: isReportGenerated,
            reportShared: isReportShared
          });
          
          console.log('✅ Benchmarking status:', {
            hasEngagement: true,
            assessmentComplete: !!bmEngagement.assessment_completed_at,
            reportGenerated: isReportGenerated,
            reportShared: isReportShared,
            engagementStatus: bmEngagement.status
          });
        } else {
          console.log('⚠️ No benchmarking engagement found');
          setBenchmarkingStatus({
            hasEngagement: false,
            assessmentComplete: false,
            reportGenerated: false,
            reportShared: false
          });
        }
      }

      let serviceList: ServiceEnrollment[] = (enrollments || [])
        .filter((e: any) => {
          const hasServiceLine = !!e.service_line;
          if (!hasServiceLine) {
            console.warn('⚠️ Enrollment missing service_line:', e.id, e);
          }
          return hasServiceLine;
        })
        .map((e: any) => {
          const service = {
            id: e.id,
            status: e.status,
            serviceCode: e.service_line.code,
            serviceName: e.service_line.name,
            serviceDescription: e.service_line.short_description || '',
            createdAt: e.created_at,
          };
          console.log('✅ Mapped service:', service.serviceCode, service.serviceName);
          return service;
        });
      
      console.log('📋 Final mapped serviceList:', serviceList.map(s => ({ code: s.serviceCode, name: s.serviceName })));

      // Fetch GA sprint data if enrolled
      const hasGA = serviceList.some(s => s.serviceCode === '365_method' || s.serviceCode === '365_alignment');
      if (hasGA && clientSession?.clientId) {
        setGALifeAlignmentScore(null);
        try {
          const { data: slRow } = await supabase
            .from('service_lines')
            .select('id')
            .eq('code', '365_method')
            .maybeSingle();

          let enrollment: any = null;
          if (slRow?.id) {
            const { data: enrollRow } = await supabase
              .from('client_service_lines')
              .select('current_sprint_number, tier_name, renewal_status')
              .eq('client_id', clientSession.clientId)
              .eq('service_line_id', slRow.id)
              .maybeSingle();
            enrollment = enrollRow;
          }

          const sprintNumber = enrollment?.current_sprint_number ?? 1;
          const renewalStatus = enrollment?.renewal_status || 'not_started';
          const tier = enrollment?.tier_name || 'Growth';
          const statusFilter = tier === 'Partner' ? ['published'] : ['published', 'approved', 'generated'];

          const { data: sprintStage } = await supabase
            .from('roadmap_stages')
            .select('generated_content, approved_content, created_at')
            .eq('client_id', clientSession.clientId)
            .eq('stage_type', 'sprint_plan_part2')
            .eq('sprint_number', sprintNumber)
            .in('status', statusFilter)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

          let sprintContent = sprintStage?.approved_content || sprintStage?.generated_content || null;
          if (!sprintContent) {
            const { data: legacyStage } = await supabase
              .from('roadmap_stages')
              .select('generated_content, approved_content, created_at')
              .eq('client_id', clientSession.clientId)
              .in('stage_type', ['sprint_plan', 'sprint_plan_part1'])
              .in('status', statusFilter)
              .order('version', { ascending: false })
              .limit(1)
              .maybeSingle();
            sprintContent = legacyStage?.approved_content || legacyStage?.generated_content || null;
          }

          if (sprintContent && sprintContent.weeks) {
            const { data: dbTasks } = await supabase
              .from('client_tasks')
              .select('week_number, title, status, sprint_number')
              .eq('client_id', clientSession.clientId)
              .eq('sprint_number', sprintNumber);

            const weeks = sprintContent.weeks || [];
            const totalWeeks = weeks.length;
            let totalTaskCount = 0;
            let completedCount = 0;
            let resolvedWeeks = 0;

            for (const week of weeks) {
              const weekTasks = week.tasks || [];
              totalTaskCount += weekTasks.length;
              const weekDbTasks = (dbTasks || []).filter((t: any) => t.week_number === week.weekNumber);
              let weekResolved = true;
              for (const task of weekTasks) {
                const dbTask = weekDbTasks.find((t: any) => t.title === task.title);
                if (dbTask?.status === 'completed') completedCount++;
                else if (!dbTask || (dbTask.status !== 'completed' && dbTask.status !== 'skipped')) weekResolved = false;
              }
              if (weekResolved && weekTasks.length > 0) resolvedWeeks++;
            }

            let activeWeek = 1;
            for (const week of weeks) {
              const weekTasks = week.tasks || [];
              const weekDbTasks = (dbTasks || []).filter((t: any) => t.week_number === week.weekNumber);
              const allResolved = weekTasks.every((task: any) => {
                const dbTask = weekDbTasks.find((t: any) => t.title === task.title);
                return dbTask && (dbTask.status === 'completed' || dbTask.status === 'skipped');
              });
              if (!allResolved) {
                activeWeek = week.weekNumber;
                break;
              }
              if (week.weekNumber === totalWeeks && allResolved) activeWeek = totalWeeks;
            }

            const sprintStartDate = sprintContent.startDate || sprintStage?.created_at;
            let calendarWeek = activeWeek;
            if (sprintStartDate) {
              const start = new Date(sprintStartDate);
              const now = new Date();
              calendarWeek = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            }

            const isSprintComplete = resolvedWeeks === totalWeeks;
            const weeksBehind = Math.max(0, calendarWeek - activeWeek);
            const completionRate = totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

            // Latest life alignment score for GA card badge
            let lifeScore: number | null = null;
            try {
              const { data: latestScore } = await supabase
                .from('life_alignment_scores')
                .select('overall_score')
                .eq('client_id', clientSession.clientId)
                .eq('sprint_number', sprintNumber)
                .order('week_number', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (latestScore?.overall_score != null) lifeScore = Number(latestScore.overall_score);
            } catch {
              // ignore
            }
            setGALifeAlignmentScore(lifeScore);

            let nextTaskTitle: string | null = null;
            const activeWeekData = weeks.find((w: any) => w.weekNumber === activeWeek);
            if (activeWeekData) {
              const activeDbTasks = (dbTasks || []).filter((t: any) => t.week_number === activeWeek);
              for (const task of activeWeekData.tasks || []) {
                const dbTask = activeDbTasks.find((t: any) => t.title === task.title);
                if (!dbTask || (dbTask.status !== 'completed' && dbTask.status !== 'skipped')) {
                  nextTaskTitle = task.title;
                  break;
                }
              }
            }

            setGASprintData({
              hasRoadmap: true,
              hasSprint: true,
              sprintNumber,
              activeWeek,
              totalWeeks,
              completionRate,
              completedTasks: completedCount,
              totalTasks: totalTaskCount,
              isSprintComplete,
              hasLifeCheckPending: renewalStatus === 'life_check_pending',
              hasCatchUpNeeded: weeksBehind > 2,
              weeksBehind,
              nextTaskTitle,
              sprintTheme: sprintContent.sprintTheme || activeWeekData?.theme || null,
            });
          } else {
            const { data: anyStage } = await supabase
              .from('roadmap_stages')
              .select('id')
              .eq('client_id', clientSession.clientId)
              .limit(1)
              .maybeSingle();

            setGASprintData({
              hasRoadmap: !!anyStage,
              hasSprint: false,
              sprintNumber,
              activeWeek: 0,
              totalWeeks: 12,
              completionRate: 0,
              completedTasks: 0,
              totalTasks: 0,
              isSprintComplete: false,
              hasLifeCheckPending: renewalStatus === 'life_check_pending',
              hasCatchUpNeeded: false,
              weeksBehind: 0,
              nextTaskTitle: null,
              sprintTheme: null,
            });
          }
        } catch (err) {
          console.error('Failed to load GA sprint data:', err);
        }
      }

      // Check discovery status - try by client_id first
      // Handle multiple records by getting the most recent one
      const { data: discoveryRecords, error: discoveryError } = await supabase
        .from('destination_discovery')
        .select('id, client_id, completed_at, created_at, practice_id')
        .eq('client_id', clientSession?.clientId)
        .order('created_at', { ascending: false });

      // Get the most recent discovery record (or null if none)
      let discovery = discoveryRecords && discoveryRecords.length > 0 ? discoveryRecords[0] : null;

      console.log('🔍 Discovery by client_id:', clientSession?.clientId);
      console.log('🔍 Discovery result:', discovery);
      console.log('🔍 Discovery records count:', discoveryRecords?.length || 0);
      console.log('🔍 Discovery error:', discoveryError);

      // If no discovery found by client_id, try by practice_id (handles ID mismatch cases)
      if (!discovery && clientSession?.practiceId) {
        // Get all discoveries for this practice
        const { data: allDiscoveries, error: allDiscError } = await supabase
          .from('destination_discovery')
          .select('id, client_id, completed_at, created_at, practice_id')
          .eq('practice_id', clientSession.practiceId);
        
        console.log('🔍 All practice discoveries:', allDiscoveries, allDiscError);
        
        if (allDiscoveries && allDiscoveries.length > 0) {
          // Get practice members to match by email
          const { data: practiceMembers } = await supabase
            .from('practice_members')
            .select('id, email')
            .eq('practice_id', clientSession.practiceId)
            .eq('member_type', 'client');
          
          // Find the client_id that matches our email
          const clientMember = practiceMembers?.find((m: any) => 
            m.email?.toLowerCase() === clientSession?.email?.toLowerCase()
          );
          
          // Also check if any discovery has a client_id that's linked to our email via practice_members
          for (const disc of allDiscoveries) {
            const discMember = practiceMembers?.find((m: any) => m.id === disc.client_id);
            if (discMember?.email?.toLowerCase() === clientSession?.email?.toLowerCase()) {
              console.log('🔍 Found discovery by email match:', disc, discMember);
              discovery = disc;
              break;
            }
          }
        }
      }

      // Check for shared discovery report
      let report: any = null;
      let reportError: any = null;
      
      if (!clientSession?.clientId) {
        console.warn('⚠️ No clientId available, skipping report check');
      } else {
        console.log('🔍 Checking for shared report with client_id:', clientSession.clientId);
        
        // First, verify we can query practice_members (RLS check)
        const { data: pmCheck, error: pmError } = await supabase
          .from('practice_members')
          .select('id, user_id, member_type')
          .eq('id', clientSession.clientId)
          .eq('member_type', 'client')
          .maybeSingle();
        
        const { data: authUser } = await supabase.auth.getUser();
        console.log('🔍 Practice member check (RLS verification):', {
          pmCheck,
          pmError,
          authUid: authUser?.user?.id,
          clientId: clientSession.clientId
        });
        
        // Query for shared reports - use limit(1) instead of maybeSingle() 
        // because maybeSingle() fails when there are multiple rows
        const reportResult = await supabase
          .from('client_reports')
          .select('id, is_shared_with_client, client_id, report_type, created_at')
          .eq('client_id', clientSession.clientId)
          .eq('report_type', 'discovery_analysis')
          .eq('is_shared_with_client', true)  // Only get shared reports
          .order('created_at', { ascending: false })
          .limit(1);  // Get the most recent shared report
        
        // Take the first result if any exist
        report = reportResult.data?.[0] || null;
        reportError = reportResult.error;
        
        console.log('🔍 Report query result:', { 
          report, 
          reportError,
          hasReport: !!report,
          clientId: clientSession.clientId
        });
        
        if (reportError) {
          console.error('🔍 Error checking for report:', {
            code: reportError.code,
            message: reportError.message,
            details: reportError.details,
            hint: reportError.hint
          });
        }
        
        // Also check ALL reports (for debugging) - remove filter to see what's there
        const { data: allReports, error: allReportsError } = await supabase
          .from('client_reports')
          .select('id, is_shared_with_client, client_id, report_type, created_at')
          .eq('client_id', clientSession.clientId)
          .eq('report_type', 'discovery_analysis')
          .order('created_at', { ascending: false });
        
        console.log('🔍 All reports for client (debug):', {
          allReports,
          allReportsError,
          count: allReports?.length || 0
        });
      }

      const discoveryStatusData = {
        completed: !!discovery?.completed_at,
        completedAt: discovery?.completed_at,
        hasReport: !!report,
        reportShared: report?.is_shared_with_client || false,
      };
      
      console.log('✅ Discovery status:', discoveryStatusData);
      console.log('✅ Discovery record:', discovery);
      setDiscoveryStatus(discoveryStatusData);

      // If client has discovery data OR a discovery report but no discovery service in list, add it
      // Show discovery service if:
      // 1. Discovery record exists, OR
      // 2. Discovery report exists (even if discovery record was deleted)
      const hasDiscoveryService = serviceList.some(s => s.serviceCode === 'discovery');
      const hasDiscoveryData = !!discovery;
      const hasDiscoveryReport = !!report && report.report_type === 'discovery_analysis';
      
      console.log('📝 Has discovery service in list:', hasDiscoveryService);
      console.log('📝 Discovery data exists:', hasDiscoveryData);
      console.log('📝 Discovery report exists:', hasDiscoveryReport);
      console.log('📝 Current serviceList before discovery add:', serviceList);
      
      // Show discovery service if we have discovery data OR a report
      if (hasDiscoveryData || hasDiscoveryReport) {
        if (!hasDiscoveryService) {
          console.log('➕ Adding discovery card to service list');
          // Use report creation date if discovery record doesn't exist
          const createdAt = discovery?.created_at || report?.created_at || new Date().toISOString();
          
          serviceList = [{
            id: 'discovery-virtual',
            status: discoveryStatusData.completed ? 'discovery_complete' : 'pending_discovery',
            serviceCode: 'discovery',
            serviceName: 'Destination Discovery',
            serviceDescription: 'A guided assessment to help us understand your business goals, challenges, and opportunities.',
            createdAt: createdAt,
          }, ...serviceList];
        } else {
          // Update discovery status if it exists
          serviceList = serviceList.map(s => {
            if (s.serviceCode === 'discovery' && discoveryStatusData.completed) {
              return { ...s, status: 'discovery_complete' };
            }
            return s;
          });
        }
      }

      console.log('📝 Final serviceList:', serviceList);
      setServices(serviceList);

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceLink = (code: string, status: string) => {
    if (code === 'discovery') {
      // If report is shared, always show report page (even if assessment not "completed")
      if (discoveryStatus?.reportShared) {
        return '/discovery/report';
      }
      if (discoveryStatus?.completed) {
        return '/discovery/complete';
      }
      return '/discovery';
    }
    if (isBIService(code)) {
      // Check if there's a delivered period - route to dashboard
      if (biPeriodDeliveredRef.current || biPeriodDelivered) {
        return '/service/management_accounts/dashboard';
      }
      // Check if there's a shared insight - route to report page
      if (maInsightSharedRef.current || maInsightShared) {
        return '/service/management_accounts/report';
      }
      return '/service/management_accounts/assessment';
    }
    if (code === '365_method' || code === '365_alignment') {
      if (gaSprintData?.hasSprint) return '/tasks';
      if (gaSprintData?.hasRoadmap) return '/roadmap';
      return '/assessments';
    }
    if (code === 'hidden_value_audit') {
      return '/assessment/part3';
    }
    if (code === 'systems_audit') {
      if (saReportShared) return '/service/systems_audit/report';
      // Check stage completion status
      if (systemsAuditStage?.stage3Complete) {
        // Stage 3 complete - audit is complete, show completion or report
        return '/service/systems_audit/process-deep-dives';
      } else if (systemsAuditStage?.stage2Complete) {
        // Stage 2 complete, route to Stage 3
        return '/service/systems_audit/process-deep-dives';
      } else if (systemsAuditStage?.stage1Complete && !systemsAuditStage.stage2Complete) {
        // Stage 1 complete, route to Stage 2
        return '/service/systems_audit/inventory';
      }
      // Stage 1 not complete, route to Stage 1
      return '/service/systems_audit/assessment';
    }
    if (code === 'benchmarking') {
      // If report is shared, show the report
      if (benchmarkingStatus?.reportShared) {
        return '/service/benchmarking/report';
      }
      // Otherwise, go to assessment
      return '/service/benchmarking/assessment';
    }
    return `/service/${code}/assessment`;
  };

  const getServiceStatus = (service: ServiceEnrollment) => {
    const code = service.serviceCode;
    
    // Special handling for discovery
    if (code === 'discovery') {
      // If report is shared, always show "Report Ready" (even if assessment not "completed")
      if (discoveryStatus?.reportShared) {
        return {
          label: 'Report Ready',
          color: 'emerald',
          icon: CheckCircle,
        };
      }
      if (discoveryStatus?.completed) {
        return {
          label: 'Complete',
          color: 'blue',
          icon: CheckCircle,
        };
      }
    }
    
    // Special handling for management accounts / business intelligence
    if (isBIService(code)) {
      // Check for delivered period (new BI system) OR shared insight
      if (biPeriodDeliveredRef.current || biPeriodDelivered || maInsightSharedRef.current || maInsightShared) {
        return {
          label: 'Report Ready',
          color: 'emerald',
          icon: CheckCircle,
        };
      }
      // Check if assessment is completed but report not delivered yet
      if (maAssessmentCompletedRef.current || maAssessmentCompleted) {
        return {
          label: 'Pending',
          color: 'amber',
          icon: Clock,
        };
      }
      // Default for BI/MA - show assessment status
      return {
        label: 'Pending',
        color: 'gray',
        icon: Clock,
      };
    }
    
    // Default status handling for discovery
    if (code === 'discovery') {
      if (discoveryStatus?.completed) {
        return {
          label: 'Complete',
          color: 'emerald',
          icon: CheckCircle,
        };
      }
      return {
        label: 'Start Assessment',
        color: 'cyan',
        icon: Play,
      };
    }
    
    // Special handling for goal alignment (sprint-aware)
    if (code === '365_method' || code === '365_alignment') {
      if (gaSprintData?.hasSprint) {
        if (gaSprintData.isSprintComplete) {
          if (gaSprintData.hasLifeCheckPending) {
            return { label: 'Life Check Due', color: 'amber', icon: Clock };
          }
          return { label: `Sprint ${gaSprintData.sprintNumber} Complete`, color: 'emerald', icon: CheckCircle };
        }
        if (gaSprintData.hasCatchUpNeeded) {
          return { label: `${gaSprintData.weeksBehind} Weeks Behind`, color: 'amber', icon: Clock };
        }
        return {
          label: `Week ${gaSprintData.activeWeek} of ${gaSprintData.totalWeeks}`,
          color: 'blue',
          icon: Target,
        };
      }
      if (gaSprintData?.hasRoadmap) {
        return { label: 'Roadmap Ready', color: 'emerald', icon: CheckCircle };
      }
      if (assessmentProgress?.overall === 100) {
        return { label: 'Assessments Complete', color: 'emerald', icon: CheckCircle };
      }
      if (assessmentProgress?.overall && assessmentProgress.overall > 0) {
        return {
          label: `${assessmentProgress.overall}% Complete`,
          color: 'blue',
          icon: Clock,
        };
      }
      return { label: 'Start Assessments', color: 'indigo', icon: Play };
    }
    
    // Special handling for Hidden Value Audit - standalone service
    if (code === 'hidden_value_audit') {
      // Check if Part 3 (HVA) is completed
      if (assessmentProgress?.part3?.status === 'completed') {
        return {
          label: 'Value Analysis Underway',
          color: 'amber',
          icon: Clock,
        };
      }
      // Check if it's in progress
      if (assessmentProgress?.part3?.status === 'in_progress' || (assessmentProgress?.part3?.percentage ?? 0) > 0) {
        return {
          label: 'In Progress',
          color: 'blue',
          icon: Clock,
        };
      }
      // Not started
      return {
        label: 'Start Assessment',
        color: 'amber',
        icon: Play,
      };
    }
    
    // Special handling for Systems Audit
    if (code === 'systems_audit') {
      if (saReportShared) {
        return { label: 'Report Ready', color: 'emerald', icon: FileText };
      }
      if (systemsAuditStage?.stage3Complete && systemsAuditStage?.reportApproved) {
        return { label: 'View Report', color: 'emerald', icon: FileText };
      } else if (systemsAuditStage?.stage3Complete) {
        return { label: 'Report Coming Soon', color: 'amber', icon: Clock };
      } else if (systemsAuditStage?.stage2Complete) {
        return { label: 'Continue to Stage 3', color: 'cyan', icon: ArrowRight };
      } else if (systemsAuditStage?.stage1Complete) {
        return { label: 'Continue to Stage 2', color: 'cyan', icon: ArrowRight };
      } else {
        return { label: 'Start Stage 1', color: 'indigo', icon: Play };
      }
    }
    
    // Benchmarking handling
    if (code === 'benchmarking') {
      if (benchmarkingStatus?.reportShared) {
        return { label: 'View Report', color: 'emerald', icon: FileText };
      } else if (benchmarkingStatus?.reportGenerated) {
        return { label: 'Report Coming Soon', color: 'amber', icon: Clock };
      } else if (benchmarkingStatus?.assessmentComplete) {
        return { label: 'Analysis In Progress', color: 'blue', icon: Clock };
      } else if (benchmarkingStatus?.hasEngagement) {
        return { label: 'Continue Assessment', color: 'cyan', icon: ArrowRight };
      } else {
        return { label: 'Start Assessment', color: 'indigo', icon: Play };
      }
    }
    
    // Generic status handling
    switch (service.status) {
      case 'active':
        return { label: 'Active', color: 'emerald', icon: CheckCircle };
      case 'pending_onboarding':
        return { label: 'Ready to Start', color: 'indigo', icon: Play };
      case 'discovery_complete':
        return { label: 'Complete', color: 'emerald', icon: CheckCircle };
      case 'pending_discovery':
        return { label: 'Start Assessment', color: 'cyan', icon: Play };
      default:
        return { label: 'Pending', color: 'gray', icon: Clock };
    }
  };

  const getStatusBadgeClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // If no services, show welcome message
  if (services.length === 0) {
    return (
      <Layout
        title={`Welcome, ${clientSession?.name?.split(' ')[0] || 'there'}!`}
        subtitle="Your personalized client portal"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Your Portal
          </h2>
          <p className="text-gray-600 mb-6">
            Your advisor will assign services to you shortly. Once assigned, you'll see them here.
          </p>
          <div className="text-sm text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:hello@rpgcc.co.uk" className="text-indigo-600 hover:text-indigo-700 font-medium">
              hello@rpgcc.co.uk
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Welcome, ${clientSession?.name?.split(' ')[0] || 'there'}!`}
      subtitle="Here's an overview of your services and progress"
    >
      <div className="space-y-8">
        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => {
            const Icon = SERVICE_ICONS[service.serviceCode] || FileText;
            const colors = SERVICE_COLORS[service.serviceCode] || SERVICE_COLORS.discovery;
            const status = getServiceStatus(service);
            const StatusIcon = status.icon;
            const link = getServiceLink(service.serviceCode, service.status);

            return (
              <div
                key={service.id}
                className={`bg-white rounded-xl border ${colors.border} overflow-hidden hover:shadow-lg transition-shadow`}
              >
                {/* Card Header */}
                <div className={`${colors.bg} px-6 py-4 border-b ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{service.serviceName}</h3>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(status.color)}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4">
                  <p className="text-gray-600 text-sm mb-4">
                    {service.serviceDescription || 'Complete your assessment to unlock personalized insights.'}
                  </p>

                  {/* Goal Alignment card body */}
                  {(service.serviceCode === '365_method' || service.serviceCode === '365_alignment') && (
                    <>
                      {gaLifeAlignmentScore != null && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700">
                            Life Alignment: {Math.round(gaLifeAlignmentScore)}
                          </span>
                        </div>
                      )}
                      {gaSprintData?.hasSprint && !gaSprintData.isSprintComplete && (
                        <div className="mb-4 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-500">Sprint {gaSprintData.sprintNumber} Progress</span>
                              <span className="font-medium text-gray-900">{gaSprintData.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${gaSprintData.completionRate}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{gaSprintData.completedTasks} of {gaSprintData.totalTasks} tasks done</span>
                            {gaSprintData.sprintTheme && (
                              <span className="truncate">• {gaSprintData.sprintTheme}</span>
                            )}
                          </div>
                          {gaSprintData.hasCatchUpNeeded && (
                            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>You're {gaSprintData.weeksBehind} weeks behind — catch up when you're ready</span>
                            </div>
                          )}
                          {gaSprintData.nextTaskTitle && !gaSprintData.hasCatchUpNeeded && (
                            <div className="flex items-start gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
                              <Target className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">Next: {gaSprintData.nextTaskTitle}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {gaSprintData?.hasSprint && gaSprintData.isSprintComplete && (
                        <div className="mb-4 space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <div className="text-sm">
                              <span className="font-medium text-emerald-900">Sprint {gaSprintData.sprintNumber} complete</span>
                              <span className="text-emerald-600 ml-1">— {gaSprintData.completionRate}% tasks done</span>
                            </div>
                          </div>
                          {gaSprintData.hasLifeCheckPending && (
                            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Complete your Life Check to unlock Sprint {gaSprintData.sprintNumber + 1}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {gaSprintData && !gaSprintData.hasSprint && gaSprintData.hasRoadmap && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
                            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Your roadmap is ready — sprint coming soon</span>
                          </div>
                        </div>
                      )}
                      {(!gaSprintData || (!gaSprintData.hasSprint && !gaSprintData.hasRoadmap)) &&
                       assessmentProgress && assessmentProgress.overall > 0 && assessmentProgress.overall < 100 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Assessment Progress</span>
                            <span className="font-medium text-gray-900">{assessmentProgress.overall}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${assessmentProgress.overall}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Button */}
                  <Link
                    to={link}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                      status.color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : status.color === 'amber'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        : `${colors.bg} ${colors.text} hover:opacity-90 border ${colors.border}`
                    }`}
                  >
                    {service.serviceCode === '365_method' || service.serviceCode === '365_alignment' ? (
                      gaSprintData?.hasSprint ? (
                        gaSprintData.isSprintComplete && gaSprintData.hasLifeCheckPending ? (
                          <>Complete Life Check <ArrowRight className="w-4 h-4" /></>
                        ) : gaSprintData.hasCatchUpNeeded ? (
                          <>Catch Up <ArrowRight className="w-4 h-4" /></>
                        ) : gaSprintData.isSprintComplete ? (
                          <>View Summary <ChevronRight className="w-4 h-4" /></>
                        ) : (
                          <>Continue Sprint <ArrowRight className="w-4 h-4" /></>
                        )
                      ) : gaSprintData?.hasRoadmap ? (
                        <>View Roadmap <ChevronRight className="w-4 h-4" /></>
                      ) : assessmentProgress?.overall === 100 ? (
                        <>View Progress <ChevronRight className="w-4 h-4" /></>
                      ) : assessmentProgress?.overall && assessmentProgress.overall > 0 ? (
                        <>Continue <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>Get Started <ArrowRight className="w-4 h-4" /></>
                      )
                    ) : status.color === 'emerald' ? (
                      <>
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : status.label.includes('Awaiting') ? (
                      <>
                        View Submission
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        {status.label.includes('Start') ? 'Get Started' : 'Continue'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        {(services.some(s => s.serviceCode === '365_method' || s.serviceCode === '365_alignment')) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gaSprintData?.hasSprint ? (
              <>
                <QuickLink to="/tasks" icon={Target} label="Sprint" />
                <QuickLink to="/roadmap" icon={TrendingUp} label="Roadmap" />
                <QuickLink to="/chat" icon="💬" label="Chat" />
                <QuickLink to="/appointments" icon="📅" label="Book Call" />
              </>
            ) : (
              <>
                <QuickLink to="/assessments" icon={Target} label="Assessments" />
                <QuickLink to="/roadmap" icon={TrendingUp} label="Roadmap" />
                <QuickLink to="/chat" icon="💬" label="Chat" />
                <QuickLink to="/appointments" icon="📅" label="Book Call" />
              </>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm">
            If you have any questions about your services, contact your advisor or email us at{' '}
            <a href="mailto:hello@rpgcc.co.uk" className="text-indigo-600 hover:text-indigo-700 font-medium">
              hello@rpgcc.co.uk
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}

// Quick Link Component
function QuickLink({ 
  to, 
  icon: Icon, 
  label 
}: { 
  to: string; 
  icon: any; 
  label: string;
}) {
  const isEmoji = typeof Icon === 'string';
  
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      {isEmoji ? (
        <span className="text-2xl">{Icon}</span>
      ) : (
        <Icon className="w-5 h-5 text-gray-600" />
      )}
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}
