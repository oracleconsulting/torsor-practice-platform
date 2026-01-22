/**
 * Business Intelligence Services
 * Export all services for the BI module
 */

export { 
  BIKpiCalculator, 
  CORE_KPIS, 
  FORESIGHT_KPIS, 
  getKPIsForTier 
} from './kpi-calculator';

export type { KPICalculationResult } from './kpi-calculator';

export { 
  BIComparisonService 
} from './comparison-service';

export type { 
  PLComparison, 
  FinancialComparison, 
  VarianceResult, 
  YTDComparison,
  FullComparisonData 
} from './comparison-service';

export { 
  BIAlertService 
} from '../BIAlertService';

export type { 
  AlertThreshold, 
  DetectedAlert 
} from '../BIAlertService';
