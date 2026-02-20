// ============================================================================
// useAdaptiveAssessment — Controls Part 2 Section Visibility + Part 3 Logic
// ============================================================================
// Wraps useServiceContext to produce UI-ready state: which Part 2 sections
// are visible, question counts, skip summaries, Part 3 visibility, and
// buildAssessmentMetadata() for stamping saved responses.
// 4B: User can opt-in to skip skippable sections (banner per section).
// ============================================================================

import { useMemo, useState, useCallback } from 'react';
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
  /** 4B: For skippable sections, label for banner e.g. "your Benchmarking assessment" */
  dataSourceLabel?: string;
  /** 4B: If data is old (>3 months), e.g. "January 2026" */
  dataAge?: string;
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
  /** 4B: Section IDs that can be skipped (have BM/SA/financial data) */
  skippableSections: string[];
  /** 4B: Section IDs the user chose to skip */
  skippedSections: string[];
  /** 4B: Mark section as skipped (hide questions) */
  skipSection: (sectionId: string) => void;
  /** 4B: Undo skip (show questions again) */
  unskipSection: (sectionId: string) => void;
  /** 4B: Data flags for banner/UI */
  hasBMData: boolean;
  hasSAData: boolean;
  hasFinancialData: boolean;
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

function dataSourceLabelFor(replacedBy: string | null): string {
  if (!replacedBy) return '';
  const name = SERVICE_DISPLAY_NAMES[replacedBy] || replacedBy;
  return `your ${name}`;
}

export function useAdaptiveAssessment(): AdaptiveAssessmentState {
  const serviceContext = useServiceContext();
  /** 4B: User-chosen skipped section IDs (opt-in skip) */
  const [skippedSections, setSkippedSections] = useState<string[]>([]);

  const skipSection = useCallback((sectionId: string) => {
    setSkippedSections(prev => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
  }, []);
  const unskipSection = useCallback((sectionId: string) => {
    setSkippedSections(prev => prev.filter(id => id !== sectionId));
  }, []);

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
      const userSkipped = skippedSections.includes(section.sectionId);
      const visible = !canSkip || !userSkipped;
      return {
        sectionId: section.sectionId,
        name: section.name,
        visible,
        hiddenReason: canSkip ? skipInfo!.skipReason : null,
        replacedBy: canSkip && skipInfo!.replacedBy ? SERVICE_DISPLAY_NAMES[skipInfo!.replacedBy] || skipInfo!.replacedBy : null,
        questionCount: section.questionCount,
        questions: [],
        dataSourceLabel: canSkip ? dataSourceLabelFor(skipInfo!.replacedBy) : undefined,
        dataAge: undefined
      };
    });
  }, [serviceContext.loading, serviceContext.skippablePart2Sections, skippedSections]);

  const visiblePart2Sections = useMemo(
    () => part2Sections.filter(s => s.visible || skippedSections.includes(s.sectionId)),
    [part2Sections, skippedSections]
  );
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

  const skippableSections = useMemo(
    () => serviceContext.skippablePart2Sections.filter(s => s.canSkip).map(s => s.sectionId),
    [serviceContext.skippablePart2Sections]
  );

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
    refresh: serviceContext.refresh,
    skippableSections,
    skippedSections,
    skipSection,
    unskipSection,
    hasBMData: serviceContext.hasBenchmarkingReport,
    hasSAData: serviceContext.hasSystemsAuditData,
    hasFinancialData: serviceContext.hasFinancialData
  };
}

export function getSkippedSectionIds(state: AdaptiveAssessmentState): string[] {
  return state.part2Sections.filter(s => !s.visible).map(s => s.sectionId);
}

export function buildAssessmentMetadata(state: AdaptiveAssessmentState): Record<string, any> {
  const skippedEntries = state.skippedSections.map(sectionId => {
    const section = state.part2Sections.find(p => p.sectionId === sectionId);
    return {
      sectionId,
      sectionName: section?.name,
      dataSource: section?.replacedBy ?? 'unknown',
      skippedAt: new Date().toISOString()
    };
  });
  const hiddenSections = state.part2Sections.filter(s => !s.visible);
  const legacySkipped = hiddenSections.length > 0 ? hiddenSections.map(s => ({
    sectionId: s.sectionId,
    sectionName: s.name,
    replacedBy: s.replacedBy,
    reason: s.hiddenReason
  })) : [];
  return {
    adaptive: true,
    version: 1,
    skippedSections: skippedEntries.length > 0 ? skippedEntries : legacySkipped,
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
