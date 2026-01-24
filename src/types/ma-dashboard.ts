// ============================================
// MA DASHBOARD TYPES
// Types for the elevated visual dashboard
// ============================================

export type VisualizationType = 
  | 'none'
  | 'bar_chart'
  | 'waterfall'
  | 'timeline'
  | 'comparison'
  | 'progress'
  | 'mini_table'
  | 'custom';

export type ChartType = 
  | 'true_cash_trend'
  | 'true_cash_waterfall'
  | 'cash_forecast'
  | 'revenue_trend'
  | 'client_profitability'
  | 'margin_trend'
  | 'kpi_sparklines';

export type DashboardTheme = 'default' | 'minimal' | 'detailed';

export type SectionId = 
  | 'tuesday_question'
  | 'true_cash'
  | 'cash_forecast'
  | 'insights'
  | 'profitability'
  | 'kpis'
  | 'revenue_trend'
  | 'documents';

export type InsightPriority = 'critical' | 'warning' | 'opportunity' | 'info';
export type ScenarioRecommendation = 'positive' | 'warning' | 'neutral';

// ============================================
// REPORT CONFIG
// ============================================

export interface MAReportConfig {
  id: string;
  period_id: string;
  section_order: SectionId[];
  sections_visible: Record<SectionId, boolean>;
  theme: DashboardTheme;
  custom_logo_path?: string;
  primary_color?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// CHART DATA
// ============================================

export interface MAChartData {
  id: string;
  period_id: string;
  chart_type: ChartType;
  data_points: any;
  config: Record<string, any>;
  generated_at: string;
}

export interface TrueCashWaterfallData {
  bankBalance: number;
  trueCash: number;
  breakdown: {
    vatLiability: number;
    payeLiability: number;
    corporationTax: number;
    committedPayments: number;
    confirmedReceivables: number;
  };
  runwayMonths: number;
}

export interface CashForecastDataPoint {
  period: string;
  date: string;
  baseline: number;
  [scenarioId: string]: number | string;
}

export interface CashForecastConfig {
  monthlyBurn: number;
  startDate: string;
  endDate: string;
  forecastType: '13-week' | '6-month';
}

// ============================================
// SCENARIOS
// ============================================

export interface MAScenario {
  id: string;
  engagement_id: string;
  period_id?: string;
  name: string;
  description?: string;
  scenario_type: string;
  assumptions: Record<string, any>;
  forecast_data?: CashForecastDataPoint[];
  impact_on_cash?: number;
  impact_on_runway?: number;
  short_label?: string;
  scenario_color: string;
  is_featured: boolean;
  impact_summary?: string;
  recommendation?: ScenarioRecommendation;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================
// INSIGHT VISUALIZATION
// ============================================

export interface InsightVisualizationConfig {
  type: VisualizationType;
  data?: any;
}

export interface ComparisonVisualizationConfig {
  items: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}

export interface TimelineVisualizationConfig {
  events: Array<{
    date: string;
    label: string;
    amount: number;
    type?: 'payment' | 'receipt' | 'milestone';
  }>;
}

export interface ProgressVisualizationConfig {
  current: number;
  target: number;
  label?: string;
  unit?: string;
}

export interface BarChartVisualizationConfig {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  xKey: string;
  yKey: string;
}

export interface MiniTableVisualizationConfig {
  columns: string[];
  rows: any[][];
}

// ============================================
// ENHANCED INSIGHT
// ============================================

export interface MADashboardInsight {
  id: string;
  period_id: string;
  engagement_id: string;
  insight_type: string;
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  recommendation_priority?: string;
  priority: InsightPriority;
  data_points?: string[];
  implications?: string;
  visualization_type: VisualizationType;
  visualization_config?: InsightVisualizationConfig;
  linked_scenario_id?: string;
  linked_scenario?: MAScenario;
  display_order: number;
  is_collapsed_default: boolean;
  show_to_client: boolean;
  status: string;
  is_auto_generated: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================
// DASHBOARD STATE
// ============================================

export interface MADashboardState {
  engagement: any;
  period: any;
  reportConfig: MAReportConfig | null;
  chartData: Record<ChartType, MAChartData>;
  insights: MADashboardInsight[];
  scenarios: MAScenario[];
  financialData: any;
  kpis: any[];
  loading: boolean;
  error: string | null;
}

export interface EditModeState {
  editMode: boolean;
  sectionOrder: SectionId[];
  sectionsVisible: Record<SectionId, boolean>;
  hasChanges: boolean;
  expandedInsights: Set<string>;
  activeScenario: string | null;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface DashboardSectionProps {
  period: any;
  engagement: any;
  chartData: Record<ChartType, MAChartData>;
  insights: MADashboardInsight[];
  scenarios: MAScenario[];
  financialData: any;
  kpis: any[];
  activeScenario: string | null;
  onScenarioChange: (scenarioId: string | null) => void;
  editMode: boolean;
  onRefetch: () => void;
}

export interface WaterfallItem {
  label: string;
  value: number;
  type: 'start' | 'subtract' | 'add' | 'total';
  tooltip?: string;
}


