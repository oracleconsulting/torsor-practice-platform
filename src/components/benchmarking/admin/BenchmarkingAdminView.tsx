import { useState } from 'react';
import { QuickStatsBar } from './QuickStatsBar';
import { ConversationScript } from './ConversationScript';
import { RiskFlagsPanel } from './RiskFlagsPanel';
import { NextStepsPanel } from './NextStepsPanel';
import { ClientDataReference } from './ClientDataReference';
import { FileText, MessageSquare, AlertTriangle, ListTodo } from 'lucide-react';

interface BenchmarkAnalysis {
  headline: string;
  executive_summary: string;
  total_annual_opportunity: string;
  overall_percentile?: number;
  gap_count?: number;
  strength_count?: number;
  admin_talking_points?: string;
  admin_questions_to_ask?: string;
  admin_next_steps?: string;
  admin_tasks?: string;
  admin_risk_flags?: string;
  recommendations?: string;
  pass1_data?: string;
  industry_code?: string;
  metrics_comparison?: string;
  created_at?: string;
}

interface BenchmarkingAdminViewProps {
  data: BenchmarkAnalysis;
  clientData: {
    revenue: number;
    employees: number;
    revenuePerEmployee: number;
  };
  hvaData?: any;
  founderRisk?: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    valuationImpact: string;
  } | null;
  industryMapping?: {
    code: string;
    name: string;
    confidence: number;
  };
  onSwitchToClient?: () => void;
}

// Helper to safely parse JSON (handles both string and already-parsed objects)
const safeJsonParse = <T,>(value: string | T | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

interface Pass1Data {
  founderRiskLevel?: string;
  founderRiskScore?: number;
  valuationImpact?: string;
  dataGaps?: Array<{ metric: string }>;
  classification?: {
    industryName?: string;
    industryConfidence?: number;
  };
}

export function BenchmarkingAdminView({ data, clientData, founderRisk, industryMapping, onSwitchToClient }: BenchmarkingAdminViewProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'risks' | 'actions' | 'raw'>('script');
  
  const talkingPoints = safeJsonParse(data.admin_talking_points, []);
  const questionsToAsk = safeJsonParse(data.admin_questions_to_ask, []);
  const nextSteps = safeJsonParse(data.admin_next_steps, []);
  const tasks = safeJsonParse(data.admin_tasks, []);
  const riskFlags = safeJsonParse(data.admin_risk_flags, []);
  const pass1Data = safeJsonParse<Pass1Data>(data.pass1_data, {});
  
  // Get revenue per employee from metrics comparison (where it was calculated) or fallback to clientData
  const metrics = safeJsonParse<Array<{ metricCode?: string; clientValue?: number }>>(data.metrics_comparison, []);
  const revPerEmployeeMetric = metrics.find((m) => m.metricCode === 'revenue_per_consultant' || m.metricCode === 'revenue_per_employee');
  const revPerEmployee = revPerEmployeeMetric?.clientValue || clientData.revenuePerEmployee || 0;
  
  const openingStatement = `Based on our benchmarking analysis, we've identified a £${parseFloat(data.total_annual_opportunity || '0').toLocaleString()} annual opportunity. Your revenue per employee of £${revPerEmployee.toLocaleString()} places you at the ${data.overall_percentile || 0}th percentile - meaning ${100 - (data.overall_percentile || 0)}% of comparable firms are generating more revenue per head. Let me walk you through what we've found and what it means for your business.`;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Benchmarking Analysis - Admin View
              </h1>
              <p className="text-sm text-slate-500">
                Conversation guide and action tracker
              </p>
            </div>
            {onSwitchToClient && (
              <button 
                onClick={onSwitchToClient}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Switch to Client View
              </button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-3">
            <QuickStatsBar
              totalOpportunity={parseFloat(data.total_annual_opportunity || '0')}
              percentile={data.overall_percentile || 0}
              gapCount={data.gap_count || 0}
              strengthCount={data.strength_count || 0}
              riskLevel={(founderRisk?.level as 'low' | 'medium' | 'high' | 'critical') || (pass1Data?.founderRiskLevel as 'low' | 'medium' | 'high' | 'critical') || 'medium'}
            />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('script')}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === 'script'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Conversation Script
                </button>
                <button
                  onClick={() => setActiveTab('risks')}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === 'risks'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Risk Flags
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === 'actions'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  Next Steps
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === 'raw'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Raw Data
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'script' && (
                  <ConversationScript
                    openingStatement={openingStatement}
                    talkingPoints={talkingPoints}
                    questionsToAsk={questionsToAsk}
                  />
                )}
                
                {activeTab === 'risks' && (
                  <RiskFlagsPanel flags={riskFlags} />
                )}
                
                {activeTab === 'actions' && (
                  <NextStepsPanel nextSteps={nextSteps} tasks={tasks} />
                )}
                
                {activeTab === 'raw' && (
                  <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <ClientDataReference
              revenue={clientData.revenue}
              employees={clientData.employees}
              revenuePerEmployee={clientData.revenuePerEmployee}
              percentile={data.overall_percentile || 0}
              industryCode={industryMapping?.code || data.industry_code || ''}
              industryName={industryMapping?.name || pass1Data?.classification?.industryName || data.industry_code}
              industryConfidence={industryMapping?.confidence || pass1Data?.classification?.industryConfidence || 95}
              founderRiskScore={founderRisk?.score || pass1Data?.founderRiskScore}
              founderRiskLevel={founderRisk?.level || pass1Data?.founderRiskLevel}
              valuationImpact={founderRisk?.valuationImpact || pass1Data?.valuationImpact}
              dataGaps={pass1Data?.dataGaps?.map((g) => g.metric) || []}
            />
            
            {/* Recommendations Summary */}
            {data.recommendations && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Recommended Services
                </h3>
                <div className="space-y-2">
                  {safeJsonParse(data.recommendations, []).slice(0, 3).map((rec: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{rec.linkedService || rec.title}</span>
                      <span className="font-semibold text-emerald-600">
                        £{rec.annualValue?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

