// ============================================================================
// useAdaptiveAssessment — Controls Part 2 Section Visibility + Part 3 Logic
// ============================================================================
// Wraps useServiceContext to produce UI-ready state: which Part 2 sections
// are visible, question counts, skip summaries, Part 3 visibility, and
// buildAssessmentMetadata() for stamping saved responses.
// ============================================================================

import { useMemo } from 'react';
import { useServiceContext, type Part2SectionSkip, type ServiceContext } from './useServiceContext';

// ============================================================================
// TYPES
// ============================================================================

export interface AdaptivePart2Section {
  sectionId: string;
  name: string;
  visible: boolean;
  hiddenReason: string | null;
  replacedBy: string | null;
  questionCount: number;
  questions: Part2Question[];
}

export interface Part2Question {
  id: string;
  section: string;
  question: string;
  type: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  [key: string]: any;
}

export interface AdaptiveAssessmentState {
  loading: boolean;
  error: string | null;
  part2Sections: AdaptivePart2Section[];
  visiblePart2Sections: AdaptivePart2Section[];
  visibleQuestionCount: number;
  skippedQuestionCount: number;
  skipSummary: string | null;
  showPart3: boolean;
  part3HiddenReason: string | null;
  valueAnalysisSource: 'bm_report' | 'ga_part3' | 'none';
  serviceContext: ServiceContext;
  refresh: () => Promise<void>;
}

// Part 2 section definitions — sectionId must match normalizeSectionId(shared section title)
const ALL_PART2_SECTIONS: Array<{ sectionId: string; name: string; questionCount: number; gaUnique: boolean }> = [
  { sectionId: 'leadership_vision_reality', name: 'Leadership & Vision Reality', questionCount: 9, gaUnique: true },
  { sectionId: 'money_truth', name: 'Money Truth', questionCount: 7, gaUnique: false },
  { sectionId: 'customer_market_reality', name: 'Customer & Market Reality', questionCount: 6, gaUnique: false },
  { sectionId: 'execution_engine', name: 'Execution Engine', questionCount: 8, gaUnique: false },
  { sectionId: 'people_culture', name: 'People & Culture', questionCount: 3, gaUnique: true },
  { sectionId: 'tech_data', name: 'Tech & Data', questionCount: 4, gaUnique: false },
  { sectionId: 'product_customer_value', name: 'Product & Customer Value', questionCount: 6, gaUnique: false },
  { sectionId: 'risk_compliance', name: 'Risk & Compliance', questionCount: 5, gaUnique: false },
  { sectionId: 'supply_chain_partnerships', name: 'Supply Chain & Partnerships', questionCount: 2, gaUnique: true },
  { sectionId: 'market_position_growth', name: 'Market Position & Growth', questionCount: 2, gaUnique: false },
  { sectionId: 'integration_bottlenecks', name: 'Integration & Bottlenecks', questionCount: 3, gaUnique: false },
  { sectionId: 'external_support_advisory', name: 'External Support & Advisory', questionCount: 4, gaUnique: true },
  { sectionId: 'behind_scenes', name: "What's Behind the Scenes?", questionCount: 6, gaUnique: true },
];

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  benchmarking: 'Benchmarking & Hidden Value Analysis',
  systems_audit: 'Systems & Process Audit',
  business_intelligence: 'Business Intelligence',
};

// ============================================================================
// Normalize shared package section title/shortTitle to sectionId (for filtering questions)
// ============================================================================
export function normalizeSectionId(sectionNameOrTitle: string): string {
  const s = sectionNameOrTitle
    .toLowerCase()
    .replace(/[&']/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (s === 'the_money_truth') return 'money_truth';
  if (s === 'vision') return 'leadership_vision_reality';
  if (s === 'market') return 'customer_market_reality';
  if (s === 'execution') return 'execution_engine';
  if (s === 'people') return 'people_culture';
  if (s === 'tech') return 'tech_data';
  if (s === 'product') return 'product_customer_value';
  if (s === 'risk') return 'risk_compliance';
  if (s === 'supply') return 'supply_chain_partnerships';
  if (s === 'growth') return 'market_position_growth';
  if (s === 'integration') return 'integration_bottlenecks';
  if (s === 'advisors') return 'external_support_advisory';
  if (s === 'external_support_advisory_network') return 'external_support_advisory';
  if (s === 'behind_scenes' || s === 'whats_behind_the_scenes') return 'behind_scenes';
  return s;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAdaptiveAssessment(): AdaptiveAssessmentState {
  const serviceContext = useServiceContext();

  const part2Sections: AdaptivePart2Section[] = useMemo(() => {
    if (serviceContext.loading) {
      return ALL_PART2_SECTIONS.map(section => ({
        sectionId: section.sectionId,
        name: section.name,
        visible: true,
        hiddenReason: null,
        replacedBy: null,
        questionCount: section.questionCount,
        questions: []
      }));
    }
    const skipMap = new Map<string, Part2SectionSkip>();
    for (const skip of serviceContext.skippablePart2Sections) {
      skipMap.set(skip.sectionId, skip);
    }
    return ALL_PART2_SECTIONS.map(section => {
      if (section.gaUnique) {
        return {
          sectionId: section.sectionId,
          name: section.name,
          visible: true,
          hiddenReason: null,
          replacedBy: null,
          questionCount: section.questionCount,
          questions: []
        };
      }
      const skipInfo = skipMap.get(section.sectionId);
      const canSkip = skipInfo?.canSkip || false;
      return {
        sectionId: section.sectionId,
        name: section.name,
        visible: !canSkip,
        hiddenReason: canSkip ? skipInfo!.skipReason : null,
        replacedBy: canSkip && skipInfo!.replacedBy ? SERVICE_DISPLAY_NAMES[skipInfo!.replacedBy] || skipInfo!.replacedBy : null,
        questionCount: section.questionCount,
        questions: []
      };
    });
  }, [serviceContext.loading, serviceContext.skippablePart2Sections]);

  const visiblePart2Sections = useMemo(() => part2Sections.filter(s => s.visible), [part2Sections]);
  const visibleQuestionCount = useMemo(() => visiblePart2Sections.reduce((sum, s) => sum + s.questionCount, 0), [visiblePart2Sections]);
  const skippedQuestionCount = useMemo(() => part2Sections.filter(s => !s.visible).reduce((sum, s) => sum + s.questionCount, 0), [part2Sections]);

  const skipSummary = useMemo(() => {
    const hiddenSections = part2Sections.filter(s => !s.visible);
    if (hiddenSections.length === 0) return null;
    const serviceGroups = new Map<string, string[]>();
    for (const section of hiddenSections) {
      const service = section.replacedBy || 'Other services';
      const existing = serviceGroups.get(service) || [];
      existing.push(section.name);
      serviceGroups.set(service, existing);
    }
    const parts: string[] = [];
    for (const [service, sections] of serviceGroups) {
      parts.push(`${sections.join(', ')} (covered by ${service})`);
    }
    return `We've shortened your assessment by ${skippedQuestionCount} questions because we already have detailed data from your other services: ${parts.join('; ')}.`;
  }, [part2Sections, skippedQuestionCount]);

  const showPart3 = !serviceContext.skipPart3;
  const part3HiddenReason = serviceContext.skipPart3Reason;
  const valueAnalysisSource: 'bm_report' | 'ga_part3' | 'none' = serviceContext.hasBenchmarkingValueAnalysis
    ? 'bm_report'
    : showPart3
      ? 'ga_part3'
      : 'none';

  return {
    loading: serviceContext.loading,
    error: serviceContext.error,
    part2Sections,
    visiblePart2Sections,
    visibleQuestionCount,
    skippedQuestionCount,
    skipSummary,
    showPart3,
    part3HiddenReason,
    valueAnalysisSource,
    serviceContext,
    refresh: serviceContext.refresh
  };
}

export function getSkippedSectionIds(state: AdaptiveAssessmentState): string[] {
  return state.part2Sections.filter(s => !s.visible).map(s => s.sectionId);
}

export function buildAssessmentMetadata(state: AdaptiveAssessmentState): Record<string, any> {
  return {
    adaptive: true,
    version: 1,
    skippedSections: state.part2Sections
      .filter(s => !s.visible)
      .map(s => ({
        sectionId: s.sectionId,
        sectionName: s.name,
        replacedBy: s.replacedBy,
        reason: s.hiddenReason
      })),
    visibleQuestionCount: state.visibleQuestionCount,
    skippedQuestionCount: state.skippedQuestionCount,
    part3Skipped: !state.showPart3,
    part3SkippedReason: state.part3HiddenReason,
    valueAnalysisSource: state.valueAnalysisSource,
    enrichmentAvailable: {
      benchmarking: state.serviceContext.hasBenchmarkingReport,
      systemsAudit: state.serviceContext.hasSystemsAuditData,
      financialData: state.serviceContext.hasFinancialData,
      valueAnalysis: state.serviceContext.hasBenchmarkingValueAnalysis
    },
    generatedAt: new Date().toISOString()
  };
}
