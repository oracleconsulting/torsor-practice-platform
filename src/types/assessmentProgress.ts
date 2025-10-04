export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
}

export interface AssetScore {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  opportunities: string[];
  financialImpact: number;
}

export interface ValueGap {
  area: string;
  currentValue: number;
  potentialValue: number;
  gap: number;
  actions: string[];
  timeframe: string;
  effort: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  description?: string;
}

export interface RiskItem {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
  cost: number;
  risk?: string;
  description?: string;
}

export interface ActionPlan {
  quick_wins: any[];
  critical_fixes: any[];
  strategic_initiatives: any[];
  total_actions: number;
  estimated_impact: number;
  time_requirement: string;
}

export interface ValueAnalysisData {
  current_valuation: number;
  potential_valuation: number;
  valuation_increase: number;
  percentage_increase: number;
  exit_readiness_score: number;
  current_multiple: number;
  potential_multiple: number;
  timeframe: string;
}

export interface AssessmentProgress {
  part1Complete: boolean;
  part1Answers: Record<string, string>;
  part2Complete: boolean;
  part2Answers: Record<string, any>;
  validationComplete: boolean;
  validationAnswers: Record<string, any>;
  part3Complete: boolean;
  part3Answers: Record<string, any>;
  valueAnalysisComplete: boolean;
  valueAnalysis?: ValueAnalysisData;
  assetScores?: AssetScore[];
  valueGaps?: ValueGap[];
  riskRegister?: RiskItem[];
  actionPlan?: ActionPlan;
  currentPart2Section: number;
  fitMessage: string | null;
  roadmapGenerated: boolean;
  roadmapExpectedAt: string | null;
  roadmap: any;
  boardRecommendation?: any;
  boardGenerated?: boolean;
  board?: any;
  boardRationale?: string;
  boardComposition?: any;
  boardSessionType?: string;
  boardGeneratedAt?: string;
  group_id: string;
  metadata?: {
    validationWarnings?: string[];
    confidenceScores?: Record<string, number>;
    interpretedData?: Record<string, any>;
  };
  confirmedData?: Record<string, any>;
}

export const DEFAULT_PROGRESS: AssessmentProgress = {
  part1Complete: false,
  part1Answers: {},
  part2Complete: false,
  part2Answers: {},
  validationComplete: false,
  validationAnswers: {},
  part3Complete: false,
  part3Answers: {},
  valueAnalysisComplete: false,
  valueAnalysis: undefined,
  assetScores: undefined,
  valueGaps: undefined,
  riskRegister: undefined,
  actionPlan: undefined,
  currentPart2Section: 0,
  fitMessage: null,
  roadmapGenerated: false,
  roadmapExpectedAt: null,
  roadmap: null,
  boardRecommendation: null,
  boardGenerated: false,
  board: null,
  boardRationale: undefined,
  boardComposition: undefined,
  boardSessionType: undefined,
  boardGeneratedAt: undefined,
  group_id: '',
  metadata: undefined,
  confirmedData: undefined
};
