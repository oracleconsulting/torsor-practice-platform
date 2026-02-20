// ============================================================================
// useServiceContext — Check What Service Line Data Exists
// ============================================================================
// Used by the adaptive assessment system to determine which Part 2 sections
// can be skipped (because richer data exists from other service lines) and
// whether Part 3 should be shown or cross-read from BM/HVA.
//
// This hook returns a ServiceContext object that tells the assessment UI
// and the generation pipeline what data is available.
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceLineDataAvailability {
  /** Service line code */
  code: string;
  /** Whether the client is enrolled */
  enrolled: boolean;
  /** Whether there's a completed assessment/engagement */
  hasData: boolean;
  /** Whether there's a completed report/output */
  hasReport: boolean;
  /** Status of the engagement (if any) */
  status: string | null;
  /** Date of last update */
  lastUpdated: string | null;
}

export interface ServiceContext {
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;

  // ── Per-service availability ──────────────────────────────────────────

  benchmarking: ServiceLineDataAvailability;
  systemsAudit: ServiceLineDataAvailability;
  businessIntelligence: ServiceLineDataAvailability;

  // ── Derived flags for assessment logic ────────────────────────────────

  /** BM report exists with value_analysis → can skip GA Part 3 */
  hasBenchmarkingValueAnalysis: boolean;

  /** BM report exists → can slim down Part 2 financial/market sections */
  hasBenchmarkingReport: boolean;

  /** SA has completed Stage 1+ → can slim down Part 2 tech/systems sections */
  hasSystemsAuditData: boolean;

  /** SA has a completed report → can skip Part 2 bottleneck/integration sections */
  hasSystemsAuditReport: boolean;

  /** BI/MA has data (accounts uploaded or MA assessments complete) → can skip Part 2 Money Truth */
  hasFinancialData: boolean;

  /** Financial data from accounts uploads (actual P&L, balance sheet) */
  hasUploadedAccounts: boolean;

  /** Discovery has been completed → some Part 2 questions already answered */
  hasDiscoveryData: boolean;

  // ── Composite flags ───────────────────────────────────────────────────

  /** Should Part 3 be skipped? (BM/HVA value analysis exists OR tier doesn't include it) */
  skipPart3: boolean;

  /** Reason for skipping Part 3 (for UI display) */
  skipPart3Reason: string | null;

  /** Which Part 2 sections can be skipped? */
  skippablePart2Sections: Part2SectionSkip[];

  /** How many Part 2 questions will be shown (after skips)? */
  estimatedPart2QuestionCount: number;

  /** Enrichment data summaries (for generation context) */
  enrichmentSummary: EnrichmentSummary;
}

export interface Part2SectionSkip {
  /** Section identifier matching Part 2 section names */
  sectionId: string;
  /** Section display name */
  sectionName: string;
  /** Whether this section can be skipped */
  canSkip: boolean;
  /** Why it can be skipped (which service provides richer data) */
  skipReason: string | null;
  /** The service that provides the richer data */
  replacedBy: string | null;
  /** Number of questions in this section */
  questionCount: number;
}

export interface EnrichmentSummary {
  /** Summary of BM data available for context injection */
  benchmarkingSummary: string | null;
  /** Summary of SA findings available for context injection */
  systemsAuditSummary: string | null;
  /** Summary of BI/financial data available for context injection */
  financialSummary: string | null;
  /** Key metrics from other services */
  keyMetrics: Record<string, any>;
}

// ============================================================================
// PART 2 SECTION → SERVICE LINE OVERLAP MAPPING
// ============================================================================

const PART_2_SECTION_OVERLAPS: Array<{
  sectionId: string;
  sectionName: string;
  questionCount: number;
  replacedWhen: {
    service: 'benchmarking' | 'systems_audit' | 'business_intelligence';
    minimumLevel: 'enrolled' | 'hasData' | 'hasReport';
    reason: string;
  }[];
}> = [
  { sectionId: 'money_truth', sectionName: 'Money Truth', questionCount: 7, replacedWhen: [{ service: 'business_intelligence', minimumLevel: 'hasData', reason: 'Your financial data is already being analysed through Business Intelligence' }] },
  { sectionId: 'customer_market_reality', sectionName: 'Customer & Market Reality', questionCount: 6, replacedWhen: [{ service: 'benchmarking', minimumLevel: 'hasReport', reason: 'Your benchmarking report already includes detailed market positioning' }] },
  { sectionId: 'tech_data', sectionName: 'Tech & Data', questionCount: 4, replacedWhen: [{ service: 'systems_audit', minimumLevel: 'hasData', reason: 'Your systems audit covers this in much greater depth' }] },
  { sectionId: 'integration_bottlenecks', sectionName: 'Integration & Bottlenecks', questionCount: 3, replacedWhen: [{ service: 'systems_audit', minimumLevel: 'hasData', reason: 'Your systems audit identifies these bottlenecks with specific findings' }] },
  { sectionId: 'execution_engine', sectionName: 'Execution Engine', questionCount: 8, replacedWhen: [{ service: 'systems_audit', minimumLevel: 'hasReport', reason: 'Your systems audit report covers operational execution in detail' }] },
  { sectionId: 'market_position_growth', sectionName: 'Market Position & Growth', questionCount: 2, replacedWhen: [{ service: 'benchmarking', minimumLevel: 'hasReport', reason: 'Your benchmarking report includes industry growth comparisons' }] },
  { sectionId: 'risk_compliance', sectionName: 'Risk & Compliance', questionCount: 5, replacedWhen: [{ service: 'benchmarking', minimumLevel: 'hasReport', reason: 'Compliance gaps are covered in your hidden value analysis' }] },
  { sectionId: 'product_customer_value', sectionName: 'Product & Customer Value', questionCount: 6, replacedWhen: [{ service: 'benchmarking', minimumLevel: 'hasReport', reason: 'Customer value analysis is included in your benchmarking report' }] },
];

const TOTAL_PART2_QUESTIONS = 72;

// ============================================================================
// HOOK
// ============================================================================

export function useServiceContext() {
  const { clientSession } = useAuth();
  const [context, setContext] = useState<ServiceContext>(getDefaultContext());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clientId = clientSession.clientId;

      const [
        enrollmentsResult,
        bmEngagementResult,
        bmReportResult,
        saEngagementResult,
        saReportResult,
        biAssessmentResult,
        accountsResult,
        discoveryResult,
        clientSettingsResult,
        gaEnrollmentsResult
      ] = await Promise.all([
        supabase.from('client_service_lines').select('service_line_id, status').eq('client_id', clientId),
        supabase.from('bm_engagements').select('id, status, updated_at').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('bm_reports').select('id, status, value_analysis, updated_at').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('sa_engagements').select('id, status, updated_at').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('sa_audit_reports').select('id, status, updated_at').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('service_line_assessments').select('id, service_line_code, completion, updated_at').eq('client_id', clientId).in('service_line_code', ['business_intelligence', 'management_accounts', 'quarterly_bi']).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('client_financial_data').select('id, updated_at').eq('client_id', clientId).limit(1).maybeSingle(),
        supabase.from('discovery_engagements').select('id, status, updated_at').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('practice_members').select('skip_value_analysis').eq('id', clientId).single(),
        supabase.from('client_service_lines').select('metadata, service_lines(code)').eq('client_id', clientId)
      ]);

      const bmEngagement = bmEngagementResult.data;
      const bmReport = bmReportResult.data;
      const saEngagement = saEngagementResult.data;
      const saReport = saReportResult.data;
      const biAssessment = biAssessmentResult.data;
      const accounts = accountsResult.data;
      const discovery = discoveryResult.data;
      const clientSettings = clientSettingsResult.data;
      const gaEnrollments = gaEnrollmentsResult.data as Array<{ metadata?: { tier?: string }; service_lines: { code: string } }> | null;
      const gaRow = gaEnrollments?.find((e: any) => e.service_lines?.code === '365_method');
      const gaTier = gaRow?.metadata?.tier || null;

      const bmHasData = bmEngagement && ['assessment_complete', 'pass1_complete', 'generated', 'approved', 'published', 'delivered'].includes(bmEngagement.status);
      const bmHasReport = bmReport && ['generated', 'approved', 'published', 'delivered'].includes(bmReport.status);
      const bmHasValueAnalysis = bmReport?.value_analysis && Object.keys(bmReport.value_analysis).length > 0;

      const saHasData = saEngagement && saEngagement.status !== 'pending';
      const saHasReport = saReport && ['generated', 'approved', 'published', 'delivered'].includes(saReport.status);

      const biHasData = biAssessment && (biAssessment.completion || 0) >= 50;
      const hasUploadedAccounts = !!accounts;
      const hasDiscoveryData = discovery && ['completed', 'report_generated', 'report_delivered'].includes(discovery.status);

      const benchmarking: ServiceLineDataAvailability = {
        code: 'benchmarking',
        enrolled: !!bmEngagement,
        hasData: !!bmHasData,
        hasReport: !!bmHasReport,
        status: bmEngagement?.status || null,
        lastUpdated: bmEngagement?.updated_at || null
      };
      const systemsAudit: ServiceLineDataAvailability = {
        code: 'systems_audit',
        enrolled: !!saEngagement,
        hasData: !!saHasData,
        hasReport: !!saHasReport,
        status: saEngagement?.status || null,
        lastUpdated: saEngagement?.updated_at || null
      };
      const businessIntelligence: ServiceLineDataAvailability = {
        code: 'business_intelligence',
        enrolled: !!biAssessment,
        hasData: !!biHasData,
        hasReport: false,
        status: biAssessment ? 'active' : null,
        lastUpdated: biAssessment?.updated_at || null
      };

      const manualSkip = clientSettings?.skip_value_analysis || false;
      const tierSkip = gaTier === 'lite' || gaTier === 'foundations';
      const bmSkip = !!bmHasValueAnalysis;

      const skipPart3 = manualSkip || tierSkip || bmSkip;
      let skipPart3Reason: string | null = null;
      if (bmSkip) skipPart3Reason = 'Your benchmarking report includes a comprehensive value analysis — we\'ll use that instead';
      else if (tierSkip) skipPart3Reason = 'Value analysis is included in Growth and Partner tiers';
      else if (manualSkip) skipPart3Reason = 'Value analysis not required for your programme';

      const serviceAvailability: Record<string, ServiceLineDataAvailability> = {
        benchmarking,
        systems_audit: systemsAudit,
        business_intelligence: businessIntelligence
      };

      const skippablePart2Sections: Part2SectionSkip[] = PART_2_SECTION_OVERLAPS.map(section => {
        const matchingReplacement = section.replacedWhen.find(replacement => {
          const serviceData = serviceAvailability[replacement.service];
          if (!serviceData) return false;
          switch (replacement.minimumLevel) {
            case 'enrolled': return serviceData.enrolled;
            case 'hasData': return serviceData.hasData;
            case 'hasReport': return serviceData.hasReport;
            default: return false;
          }
        });
        return {
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          canSkip: !!matchingReplacement,
          skipReason: matchingReplacement?.reason || null,
          replacedBy: matchingReplacement?.service || null,
          questionCount: section.questionCount
        };
      });

      const skippedQuestionCount = skippablePart2Sections.filter(s => s.canSkip).reduce((sum, s) => sum + s.questionCount, 0);
      const estimatedPart2QuestionCount = TOTAL_PART2_QUESTIONS - skippedQuestionCount;

      const enrichmentSummary: EnrichmentSummary = {
        benchmarkingSummary: bmHasReport ? `Benchmarking report available (status: ${bmReport!.status}). Value analysis: ${bmHasValueAnalysis ? 'yes' : 'no'}.` : null,
        systemsAuditSummary: saHasData ? `Systems audit at stage: ${saEngagement!.status}. Report: ${saHasReport ? 'available' : 'not yet generated'}.` : null,
        financialSummary: hasUploadedAccounts ? 'Uploaded financial accounts available for analysis.' : biHasData ? 'BI assessment data available (self-reported financials).' : null,
        keyMetrics: {}
      };

      setContext({
        loading: false,
        error: null,
        benchmarking,
        systemsAudit,
        businessIntelligence,
        hasBenchmarkingValueAnalysis: !!bmHasValueAnalysis,
        hasBenchmarkingReport: !!bmHasReport,
        hasSystemsAuditData: !!saHasData,
        hasSystemsAuditReport: !!saHasReport,
        hasFinancialData: !!biHasData || !!hasUploadedAccounts,
        hasUploadedAccounts: !!hasUploadedAccounts,
        hasDiscoveryData: !!hasDiscoveryData,
        skipPart3,
        skipPart3Reason,
        skippablePart2Sections,
        estimatedPart2QuestionCount,
        enrichmentSummary
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check service context';
      setError(errorMessage);
      console.error('[useServiceContext] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientSession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...context, loading, error, refresh };
}

function getDefaultContext(): ServiceContext {
  const emptyService: ServiceLineDataAvailability = {
    code: '',
    enrolled: false,
    hasData: false,
    hasReport: false,
    status: null,
    lastUpdated: null
  };
  return {
    loading: true,
    error: null,
    benchmarking: { ...emptyService, code: 'benchmarking' },
    systemsAudit: { ...emptyService, code: 'systems_audit' },
    businessIntelligence: { ...emptyService, code: 'business_intelligence' },
    hasBenchmarkingValueAnalysis: false,
    hasBenchmarkingReport: false,
    hasSystemsAuditData: false,
    hasSystemsAuditReport: false,
    hasFinancialData: false,
    hasUploadedAccounts: false,
    hasDiscoveryData: false,
    skipPart3: false,
    skipPart3Reason: null,
    skippablePart2Sections: [],
    estimatedPart2QuestionCount: TOTAL_PART2_QUESTIONS,
    enrichmentSummary: { benchmarkingSummary: null, systemsAuditSummary: null, financialSummary: null, keyMetrics: {} }
  };
}
