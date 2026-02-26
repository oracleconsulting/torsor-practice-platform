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
import { PageSkeleton, StatusBadge } from '@/components/ui';

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
    submissionStatus?: string;
    submittedAt?: string | null;
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
  const clientId = clientSession?.clientId;

  useEffect(() => {
    if (clientId) {
      loadDashboardData();
    }
  }, [clientId]);

  const loadDashboardData = async () => {
    const startTime = performance.now();
    try {
      const clientId = clientSession?.clientId;
      const practiceId = clientSession?.practiceId;
      if (!clientId) return;

      // Batch 1: independent queries in parallel
      const [
        pmResult,
        enrollResult,
        saResult,
        maEngResult,
        biEngResult,
        maAssessResult,
        discoveryResult,
        bmResult,
      ] = await Promise.all([
        supabase
          .from('practice_members')
          .select('hide_discovery_in_portal')
          .eq('id', clientId)
          .eq('member_type', 'client')
          .maybeSingle(),
        supabase
          .from('client_service_lines')
          .select('id, status, created_at, service_line:service_lines(code, name, short_description)')
          .eq('client_id', clientId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false }),
        supabase
          .from('sa_engagements')
          .select('id, stage_1_completed_at, stage_2_completed_at, stage_3_completed_at, is_shared_with_client, status, submission_status, submitted_at')
          .eq('client_id', clientId)
          .maybeSingle(),
        supabase.from('ma_engagements').select('id').eq('client_id', clientId).maybeSingle(),
        supabase.from('bi_engagements').select('id').eq('client_id', clientId).maybeSingle(),
        supabase
          .from('service_line_assessments')
          .select('completed_at')
          .eq('client_id', clientId)
          .in('service_line_code', ['management_accounts', 'business_intelligence'])
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('destination_discovery')
          .select('id, client_id, completed_at, created_at, practice_id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('bm_engagements')
          .select('id, status, assessment_completed_at, report_shared_with_client')
          .eq('client_id', clientId)
          .maybeSingle(),
      ]);

      const hideDiscoveryInPortal = !!pmResult.data?.hide_discovery_in_portal;
      const enrollments = enrollResult.data;
      if (enrollResult.error) {
        console.error('Error loading service enrollments:', enrollResult.error);
      }
      const saEngagement = saResult.data;
      const maEngagement = maEngResult.data;
      const biEngagement = biEngResult.data;
      const engagement = maEngagement || biEngagement;
      const maAssessmentDone = !!maAssessResult.data?.completed_at;
      let discovery = discoveryResult.data?.[0] ?? null;
      const bmEngagement = bmResult.data;

      maAssessmentCompletedRef.current = maAssessmentDone;
      setMAAssessmentCompleted(maAssessmentDone);

      if (bmEngagement) {
        const isReportGenerated = ['generated', 'approved', 'published', 'pass1_complete'].includes(bmEngagement.status);
        setBenchmarkingStatus({
          hasEngagement: true,
          assessmentComplete: !!bmEngagement.assessment_completed_at || ['assessment_complete', 'generated', 'approved', 'published', 'pass1_complete'].includes(bmEngagement.status),
          reportGenerated: isReportGenerated,
          reportShared: !!bmEngagement.report_shared_with_client,
        });
      } else {
        setBenchmarkingStatus({ hasEngagement: false, assessmentComplete: false, reportGenerated: false, reportShared: false });
      }

      // Batch 2: depend on Batch 1
      const batch2Promises: Promise<any>[] = [];
      const batch2Keys: string[] = [];
      if (engagement?.id) {
        batch2Keys.push('maPeriod', 'biPeriod', 'monthlyInsight');
        batch2Promises.push(
          supabase.from('ma_periods').select('id, status, period_label, delivered_at').eq('engagement_id', engagement.id).eq('status', 'delivered').order('period_end', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('bi_periods').select('id, status, period_label, delivered_at').eq('engagement_id', engagement.id).eq('status', 'delivered').order('period_end', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('ma_monthly_insights').select('*').eq('engagement_id', engagement.id).eq('shared_with_client', true).is('snapshot_id', null).order('period_end_date', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        );
      }
      if (saEngagement?.stage_3_completed_at) {
        batch2Keys.push('saReports');
        batch2Promises.push(
          supabase.from('sa_audit_reports').select('id, status, created_at, engagement_id').eq('engagement_id', saEngagement.id).in('status', ['approved', 'published', 'delivered']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        );
      }
      if (!discovery && practiceId) {
        batch2Keys.push('discoveryFallback');
        batch2Promises.push(supabase.from('destination_discovery').select('id, client_id, completed_at, created_at, practice_id').eq('practice_id', practiceId));
      }
      const hasGA = enrollments?.some((e: any) => e.service_line?.code === '365_method' || e.service_line?.code === '365_alignment');
      if (hasGA) {
        batch2Keys.push('gaServiceLine');
        batch2Promises.push(supabase.from('service_lines').select('id').eq('code', '365_method').maybeSingle());
      }
      const batch2Results = batch2Promises.length > 0 ? await Promise.all(batch2Promises) : [];
      const batch2Map: Record<string, any> = {};
      batch2Keys.forEach((key, i) => { batch2Map[key] = batch2Results[i]; });

      let hasSharedMAInsight = false;
      let hasBIDeliveredPeriod = false;
      if (engagement?.id) {
        const deliveredPeriod = batch2Map.maPeriod?.data || batch2Map.biPeriod?.data;
        if (deliveredPeriod) hasBIDeliveredPeriod = true;
        const monthlyInsight = batch2Map.monthlyInsight?.data;
        if (monthlyInsight && (monthlyInsight.headline_text || monthlyInsight.insights)) hasSharedMAInsight = true;
      }
      if (!hasSharedMAInsight && engagement?.id) {
        const { data: maInsight } = await supabase
          .from('client_context')
          .select('id, content')
          .eq('client_id', clientId)
          .eq('context_type', 'note')
          .eq('is_shared', true)
          .eq('processed', true)
          .in('data_source_type', ['management_accounts_analysis', 'general'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (maInsight?.content) {
          try {
            const content = typeof maInsight.content === 'string' ? JSON.parse(maInsight.content) : maInsight.content;
            const insightData = content?.insight || content;
            if (insightData && (insightData.headline || insightData.keyInsights)) hasSharedMAInsight = true;
          } catch {
            // ignore
          }
        }
      }
      maInsightSharedRef.current = hasSharedMAInsight;
      setMAInsightShared(hasSharedMAInsight);
      biPeriodDeliveredRef.current = hasBIDeliveredPeriod;
      setBIPeriodDelivered(hasBIDeliveredPeriod);

      // Systems Audit: use Batch 1 saEngagement and Batch 2 saReports
      if (saEngagement) {
        setSaReportShared(!!saEngagement.is_shared_with_client);
        const reportApproved = !!batch2Map.saReports?.data;
        setSystemsAuditStage({
          stage1Complete: !!saEngagement.stage_1_completed_at,
          stage2Complete: !!saEngagement.stage_2_completed_at,
          stage3Complete: !!saEngagement.stage_3_completed_at,
          engagementId: saEngagement.id,
          reportApproved,
          submissionStatus: saEngagement.submission_status ?? 'draft',
          submittedAt: saEngagement.submitted_at ?? null,
        });
      } else {
        const hasSystemsAudit = enrollments?.some((e: any) => e.service_line?.code === 'systems_audit');
        if (hasSystemsAudit && practiceId) {
          const { data: newEngagement, error: createErr } = await supabase
            .from('sa_engagements')
            .insert({ client_id: clientId, practice_id: practiceId, status: 'pending' })
            .select('id, stage_1_completed_at, stage_2_completed_at, stage_3_completed_at, is_shared_with_client, status')
            .single();
          if (!createErr && newEngagement) {
            setSystemsAuditStage({
              stage1Complete: !!newEngagement.stage_1_completed_at,
              stage2Complete: !!newEngagement.stage_2_completed_at,
              stage3Complete: !!newEngagement.stage_3_completed_at,
              engagementId: newEngagement.id,
              reportApproved: false,
              submissionStatus: (newEngagement as any)?.submission_status ?? 'draft',
              submittedAt: (newEngagement as any)?.submitted_at ?? null,
            });
          } else {
            setSaReportShared(false);
            setSystemsAuditStage({ stage1Complete: false, stage2Complete: false, stage3Complete: false, engagementId: null, reportApproved: false, submissionStatus: 'draft', submittedAt: null });
          }
        } else {
          setSaReportShared(false);
          setSystemsAuditStage({ stage1Complete: false, stage2Complete: false, stage3Complete: false, engagementId: null, reportApproved: false, submissionStatus: 'draft', submittedAt: null });
        }
      }

      let serviceList: ServiceEnrollment[] = (enrollments || [])
        .filter((e: any) => !!e.service_line)
        .map((e: any) => ({
          id: e.id,
          status: e.status,
          serviceCode: e.service_line.code,
          serviceName: e.service_line.name,
          serviceDescription: e.service_line.short_description || '',
          createdAt: e.created_at,
        }));

      // Fetch GA sprint data if enrolled (use batch2 gaServiceLine when available)
      const gaServiceLineId = batch2Map.gaServiceLine?.data?.id;
      if (hasGA && clientId) {
        setGALifeAlignmentScore(null);
        try {
          const slId = gaServiceLineId ?? (await supabase.from('service_lines').select('id').eq('code', '365_method').maybeSingle()).data?.id;
          if (!slId) {
            setGASprintData({ hasRoadmap: false, hasSprint: false, sprintNumber: 0, activeWeek: 0, totalWeeks: 12, completionRate: 0, completedTasks: 0, totalTasks: 0, isSprintComplete: false, hasLifeCheckPending: false, hasCatchUpNeeded: false, weeksBehind: 0, nextTaskTitle: null, sprintTheme: null });
          } else {
          const [enrollRow, sprintStage] = await Promise.all([
            supabase.from('client_service_lines').select('current_sprint_number, tier_name, renewal_status').eq('client_id', clientId).eq('service_line_id', slId).maybeSingle(),
            supabase.from('roadmap_stages').select('generated_content, approved_content, created_at').eq('client_id', clientId).eq('stage_type', 'sprint_plan_part2').eq('sprint_number', 1).order('version', { ascending: false }).limit(1).maybeSingle(),
          ]);
          let enrollment = enrollRow.data;
          const sprintNumber = enrollment?.current_sprint_number ?? 1;
          const renewalStatus = enrollment?.renewal_status || 'not_started';
          const tier = enrollment?.tier_name || 'Growth';
          const statusFilter = tier === 'Partner' ? ['published'] : ['published', 'approved', 'generated'];

          const [sprintStageCorrect, legacyStage, dbTasksResult] = await Promise.all([
            supabase.from('roadmap_stages').select('generated_content, approved_content, created_at').eq('client_id', clientId).eq('stage_type', 'sprint_plan_part2').eq('sprint_number', sprintNumber).in('status', statusFilter).order('version', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('roadmap_stages').select('generated_content, approved_content, created_at').eq('client_id', clientId).in('stage_type', ['sprint_plan', 'sprint_plan_part1']).in('status', statusFilter).order('version', { ascending: false }).limit(1).maybeSingle(),
            sprintNumber >= 1 ? supabase.from('client_tasks').select('week_number, title, status, sprint_number').eq('client_id', clientId).eq('sprint_number', sprintNumber) : Promise.resolve({ data: [] }),
          ]);
          let sprintContent = sprintStageCorrect.data?.approved_content || sprintStageCorrect.data?.generated_content || null;
          if (!sprintContent) sprintContent = legacyStage.data?.approved_content || legacyStage.data?.generated_content || null;
          const dbTasks = dbTasksResult.data || [];

          if (sprintContent && sprintContent.weeks) {
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

            const sprintStartDate = sprintContent.startDate || sprintStageCorrect.data?.created_at;
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
                .eq('client_id', clientId)
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
              .eq('client_id', clientId)
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
          }
        } catch (err) {
          console.error('Failed to load GA sprint data:', err);
        }
      }

      // Discovery: already have from Batch 1; fallback from Batch 2 (practice_id) with email match
      if (!discovery && practiceId && batch2Map.discoveryFallback?.data?.length) {
        const allDiscoveries = batch2Map.discoveryFallback.data;
        const { data: practiceMembers } = await supabase
          .from('practice_members')
          .select('id, email')
          .eq('practice_id', practiceId)
          .eq('member_type', 'client');
        for (const disc of allDiscoveries) {
          const discMember = practiceMembers?.find((m: any) => m.id === disc.client_id);
          if (discMember?.email?.toLowerCase() === clientSession?.email?.toLowerCase()) {
            discovery = disc;
            break;
          }
        }
      }

      // Check for shared discovery report
      let report: any = null;
      if (clientId) {
        const reportResult = await supabase
          .from('client_reports')
          .select('id, is_shared_with_client, client_id, report_type, created_at')
          .eq('client_id', clientId)
          .eq('report_type', 'discovery_analysis')
          .eq('is_shared_with_client', true)
          .order('created_at', { ascending: false })
          .limit(1);
        report = reportResult.data?.[0] || null;
        if (reportResult.error) {
          console.error('Error checking for discovery report:', reportResult.error);
        }
      }

      const discoveryStatusData = {
        completed: !!discovery?.completed_at,
        completedAt: discovery?.completed_at,
        hasReport: !!report,
        reportShared: report?.is_shared_with_client || false,
      };
      setDiscoveryStatus(discoveryStatusData);

      const hasDiscoveryService = serviceList.some(s => s.serviceCode === 'discovery');
      const hasDiscoveryData = !!discovery;
      const hasDiscoveryReport = !!report && report.report_type === 'discovery_analysis';

      if ((hasDiscoveryData || hasDiscoveryReport) && !hideDiscoveryInPortal) {
        if (!hasDiscoveryService) {
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

      // If practice chose to hide Discovery for this client, remove it from the list
      if (hideDiscoveryInPortal) {
        serviceList = serviceList.filter(s => s.serviceCode !== 'discovery');
      }

      setServices(serviceList);
      console.log(`⏱️ Dashboard loaded in ${Math.round(performance.now() - startTime)}ms`);
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
      if (systemsAuditStage?.submissionStatus === 'submitted') {
        return '/service/systems_audit/status';
      }
      if (systemsAuditStage?.stage1Complete && systemsAuditStage?.stage2Complete && systemsAuditStage?.stage3Complete) {
        return '/service/systems_audit/review';
      }
      if (systemsAuditStage?.stage2Complete) {
        return '/service/systems_audit/process-deep-dives';
      } else if (systemsAuditStage?.stage1Complete && !systemsAuditStage.stage2Complete) {
        return '/service/systems_audit/inventory';
      }
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
      const stagesComplete = (systemsAuditStage?.stage1Complete ? 1 : 0) +
        (systemsAuditStage?.stage2Complete ? 1 : 0) +
        (systemsAuditStage?.stage3Complete ? 1 : 0);
      if (stagesComplete === 3) {
        return { label: 'All Stages Complete', color: 'emerald', icon: CheckCircle };
      } else if (stagesComplete > 0) {
        return { label: `${stagesComplete}/3 Stages Complete`, color: 'cyan', icon: ArrowRight };
      } else {
        return { label: 'Get Started', color: 'indigo', icon: Play };
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
      <Layout title="Dashboard">
        <PageSkeleton />
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
                className={`bg-white rounded-xl border ${colors.border} overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer`}
              >
                {/* Card Header */}
                <div className={`${colors.bg} px-6 py-4 border-b ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 font-display">{service.serviceName}</h3>
                    </div>
                    <StatusBadge status={service.status} label={status.label} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4">
                  <p className="text-gray-600 text-sm mb-4">
                    {service.serviceDescription || 'Complete your assessment to unlock personalized insights.'}
                  </p>

                  {/* Systems Audit Stage Breakdown */}
                  {service.serviceCode === 'systems_audit' && !saReportShared && (
                    <div className="space-y-2 mb-4">
                      {/* Stage 1: Discovery Assessment */}
                      <Link
                        to="/service/systems_audit/assessment"
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          systemsAuditStage?.stage1Complete
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            systemsAuditStage?.stage1Complete
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {systemsAuditStage?.stage1Complete ? '✓' : '1'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              systemsAuditStage?.stage1Complete ? 'text-emerald-800' : 'text-slate-800'
                            }`}>
                              Discovery Assessment
                            </p>
                            <p className="text-xs text-slate-500">Your business, goals & pain points</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${
                          systemsAuditStage?.stage1Complete ? 'text-emerald-400' : 'text-slate-400'
                        }`} />
                      </Link>

                      {/* Stage 2: System Inventory */}
                      <Link
                        to="/service/systems_audit/inventory"
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          systemsAuditStage?.stage2Complete
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            systemsAuditStage?.stage2Complete
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {systemsAuditStage?.stage2Complete ? '✓' : '2'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              systemsAuditStage?.stage2Complete ? 'text-emerald-800' : 'text-slate-800'
                            }`}>
                              System Inventory
                            </p>
                            <p className="text-xs text-slate-500">Map your current tech stack</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${
                          systemsAuditStage?.stage2Complete ? 'text-emerald-400' : 'text-slate-400'
                        }`} />
                      </Link>

                      {/* Stage 3: Process Deep Dives */}
                      <Link
                        to="/service/systems_audit/process-deep-dives"
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          systemsAuditStage?.stage3Complete
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            systemsAuditStage?.stage3Complete
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {systemsAuditStage?.stage3Complete ? '✓' : '3'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              systemsAuditStage?.stage3Complete ? 'text-emerald-800' : 'text-slate-800'
                            }`}>
                              Process Deep Dives
                            </p>
                            <p className="text-xs text-slate-500">How your key workflows actually run</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${
                          systemsAuditStage?.stage3Complete ? 'text-emerald-400' : 'text-slate-400'
                        }`} />
                      </Link>

                      {/* Progress summary */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${(
                                (systemsAuditStage?.stage1Complete ? 1 : 0) +
                                (systemsAuditStage?.stage2Complete ? 1 : 0) +
                                (systemsAuditStage?.stage3Complete ? 1 : 0)
                              ) / 3 * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {(systemsAuditStage?.stage1Complete ? 1 : 0) +
                           (systemsAuditStage?.stage2Complete ? 1 : 0) +
                           (systemsAuditStage?.stage3Complete ? 1 : 0)}/3 complete
                        </span>
                      </div>
                    </div>
                  )}

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
                                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-teal transition-all duration-700 ease-out"
                                style={{ width: `${gaSprintData.completionRate}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Tasks: {gaSprintData.completedTasks}/{gaSprintData.totalTasks} complete</span>
                            {gaSprintData.sprintTheme && (
                              <span className="truncate">• {gaSprintData.sprintTheme}</span>
                            )}
                          </div>
                          <Link to="/progress" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
                            View full progress →
                          </Link>
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
                              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-teal transition-all duration-700 ease-out"
                              style={{ width: `${assessmentProgress.overall}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Action Button — hide for SA when sub-stages are shown (report not shared) */}
                  {(service.serviceCode !== 'systems_audit' || saReportShared) && (
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
                  )}
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
                <QuickLink to="/progress" icon={BarChart3} label="Progress" />
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
