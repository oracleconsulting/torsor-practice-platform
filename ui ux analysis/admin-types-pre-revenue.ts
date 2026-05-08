import type { ValueSuppressor } from './benchmarking';

export type BusinessStage = 'pre_revenue' | 'early_revenue' | 'growth' | 'operating' | 'mature';

export type ValuationMethodCode =
  | 'EBITDA' | 'Revenue' | 'ARR' | 'GMV' | 'SDE' | 'NFI' | 'GRF' | 'rNPV'
  | 'Comparable_Round' | 'Berkus_Scorecard' | 'DCF' | 'Asset_Based' | 'Cap_Rate';

export interface IndustryValuationBasis {
  industryCode: string;
  businessStage: BusinessStage;
  primaryMethod: ValuationMethodCode;
  secondaryMethod?: ValuationMethodCode;
  multipleLow?: number;
  multipleMid?: number;
  multipleHigh?: number;
  preMoneyAnchorLow?: number;
  preMoneyAnchorMid?: number;
  preMoneyAnchorHigh?: number;
  primaryMetric: string;
  multipleExpansionDrivers: string[];
  keyOperationalMetrics: Record<string, unknown>;
  ukSpecificNotes?: string;
  ukDiscountVsUs?: number;
  typicalBuyerTypes: string[];
  methodologyNote: string;
  sources: string[];
  confidenceLevel: 'strong' | 'moderate' | 'limited';
}

export interface PreRevenueSignals {
  engagementId: string;

  founderCapitalInvested?: number;
  founderCapitalBasis?: string;
  currentRunwayMonths?: number;
  monthlyBurn?: number;
  capitalRaisedToDate?: number;

  forecastYear1?: ForecastYear;
  forecastYear2?: ForecastYear;
  forecastYear3?: ForecastYear;
  forecastAssumptions?: string;
  forecastConfidence?: 'high' | 'medium' | 'low';

  pipelineQualifiedAcv?: number;
  pipelineTop3Acv?: number;
  pipelineTop3ConcentrationPct?: number;
  pipelineSignedLoiCount?: number;
  pipelineVerbalCount?: number;
  pipelineColdCount?: number;
  pipelineExpectedConversionPct?: number;
  pipelineFirstRevenueEta?: string;
  pipelineEvidenceStrength?:
    | 'signed_contracts' | 'signed_lois' | 'verbal_commitments'
    | 'active_discussions' | 'cold_outreach';

  roundSizeTarget?: number;
  roundPreMoneyTarget?: number;
  roundPreMoneyMin?: number;
  roundSeisEisEligible?: boolean;
  roundSeisEisAdvanceAssurance?: boolean;
  roundLeadInvestorStatus?:
    | 'signed_termsheet' | 'soft_circled' | 'in_discussion' | 'searching' | 'none';
  roundCommittedToDate?: number;
  roundClosingTargetDate?: string;
  followOnRoundSize?: number;
  followOnMilestones?: string[];

  capTableComplexity?: 'clean' | 'moderate' | 'complex' | 'problematic';
  capTableShareClasses?: string[];
  capTableEisFriendly?: boolean;
  capTableVotingStructureNotes?: string;
  founderOwnershipCurrentPct?: number;

  teamSizeCurrent?: number;
  teamGapsCritical?: string[];
  hirePlan12mo?: HirePlanItem[];
  founderPedigreeSummary?: string;
  founderPriorExits?: boolean;

  ipHoldingEntity?: string;
  ipProtectionStatus?: string[];
  corporateStructureClean?: boolean;
  ipMigrationRequired?: boolean;
  ipMigrationNotes?: string;

  dataRoomCompletenessPct?: number;
  dataRoomGaps?: string[];

  governanceBoardStatus?:
    | 'formal_board_with_neds' | 'founder_only_board'
    | 'advisory_board_only' | 'none';
  governanceNedsCount?: number;
  governanceAdvisorsCount?: number;

  contextNotes?: string;
}

export interface ForecastYear {
  revenue?: number;
  arr?: number;
  ebitda?: number;
  headcount?: number;
  grossMargin?: number;
}

export interface HirePlanItem {
  role: string;
  timing: string;
  budget: number;
  candidateStatus?: string;
}

export interface InvestmentReadinessComponent {
  score: number;
  max: number;
  gaps: string[];
}

export interface InvestmentReadinessScore {
  score: number;
  verdict: 'investment_ready' | 'needs_preparation' | 'not_ready';
  components: {
    pipelineQuality: InvestmentReadinessComponent;
    teamAndHires: InvestmentReadinessComponent;
    capTableAndGovernance: InvestmentReadinessComponent;
    forecastCredibility: InvestmentReadinessComponent;
    dataRoomAndIp: InvestmentReadinessComponent;
  };
  overallGaps: string[];
  overallStrengths: string[];
}

export interface PreRevenueAnalysis {
  asOfDate: string;
  industryBasis: IndustryValuationBasis;

  vcMethodBackSolve: {
    targetExitValuation: number;
    exitHorizonYears: number;
    requiredArrAtExit?: number;
    requiredEbitdaAtExit?: number;
    impliedExitMultiple: number;
    investorIrr: number;
    expectedDilutionToExit: number;
    todayPostMoneyImplied: number;
    todayPreMoneyImplied: number;
    methodology: string;
  };

  scorecardValuation: {
    regionalMedianPreMoney: number;
    weightedFactor: number;
    impliedPreMoney: number;
    factorBreakdown: Record<string, { weight: number; score: number; rationale: string }>;
  };

  berkusValuation: {
    impliedPreMoney: number;
    factorBreakdown: Record<string, { value: number; rationale: string }>;
  };

  comparableRoundsAnalysis?: {
    rounds: Array<{
      company: string;
      stage: string;
      year: number;
      amountGbp?: number;
      preMoneyGbp?: number;
      relevanceNote: string;
    }>;
    impliedRange: { low: number; mid: number; high: number };
  };

  defensiblePreMoney: {
    conservative: number;
    base: number;
    stretch: number;
    triggerForBaseToStretch: string;
    triggerForStretchToSeriesA: string;
    rationale: string;
    sources: string[];
  };

  versusOwnerStated: {
    ownerStatedPreMoney?: number;
    ownerStatedRange?: { low: number; high: number };
    gapToBaseCase: number;
    gapToStretchCase: number;
    plausibilityVerdict: 'aligned' | 'stretch_defensible' | 'materially_above' | 'below_market';
    rationale: string;
  };

  forwardSuppressors: ValueSuppressor[];

  milestonePath: Array<{
    milestoneNumber: number;
    timeframeMonths: number;
    description: string;
    arrTarget?: number;
    contractedLogosTarget?: number;
    valuationStepUp: { from: number; to: number };
    blockers: string[];
  }>;

  investmentReadiness: InvestmentReadinessScore;

  caveats: string[];
}
