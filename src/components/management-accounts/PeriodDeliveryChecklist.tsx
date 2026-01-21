'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  Loader2,
  Database,
  BarChart3,
  Lightbulb,
  HelpCircle,
  Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { TierType, DeliveryChecklistItem, MAInsight, MAKPIValue, MAFinancialData } from '../../types/ma';
import { getDeliveryChecklist } from '../../types/ma';

interface DataCompletionState {
  hasFinancialData: boolean;
  hasKPIs: boolean;
  hasApprovedInsights: boolean;
  hasTuesdayQuestion: boolean;
  draftInsightCount: number;
  approvedInsightCount: number;
  kpiCount: number;
}

interface PeriodDeliveryChecklistProps {
  periodId: string;
  engagementId?: string;
  tier: TierType;
  periodLabel: string;
  // Data completion state from parent
  financialData?: MAFinancialData | null;
  kpis?: MAKPIValue[];
  insights?: MAInsight[];
  tuesdayQuestion?: string;
  onComplete?: () => void;
}

export function PeriodDeliveryChecklist({
  periodId,
  engagementId: _engagementId,
  tier,
  periodLabel,
  financialData,
  kpis = [],
  insights = [],
  tuesdayQuestion,
  onComplete
}: PeriodDeliveryChecklistProps) {
  // _engagementId reserved for future cross-engagement features
  const [items, setItems] = useState<DeliveryChecklistItem[]>(() => getDeliveryChecklist(tier));
  const [expanded, setExpanded] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  
  // Calculate data completion state
  const dataState: DataCompletionState = {
    hasFinancialData: !!financialData && (financialData.cash_at_bank !== undefined || financialData.revenue !== undefined),
    hasKPIs: kpis.length > 0,
    hasApprovedInsights: insights.some(i => i.status === 'approved'),
    hasTuesdayQuestion: !!tuesdayQuestion && tuesdayQuestion.trim().length > 0,
    draftInsightCount: insights.filter(i => i.status === 'draft').length,
    approvedInsightCount: insights.filter(i => i.status === 'approved').length,
    kpiCount: kpis.length,
  };

  // Load saved checklist state
  useEffect(() => {
    loadChecklistState();
  }, [periodId]);

  const loadChecklistState = async () => {
    const { data } = await supabase
      .from('ma_periods')
      .select('delivery_checklist_state')
      .eq('id', periodId)
      .single();

    if (data?.delivery_checklist_state) {
      const state = data.delivery_checklist_state as Record<string, boolean>;
      setSavedState(state);
      setItems(prev => prev.map(item => ({
        ...item,
        completed: state[item.id] || false
      })));
    }
  };

  const handleToggleItem = async (itemId: string) => {
    const newState = { ...savedState, [itemId]: !savedState[itemId] };
    setSavedState(newState);
    
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed, completedAt: new Date().toISOString() }
        : item
    ));

    // Save to database
    await supabase
      .from('ma_periods')
      .update({ delivery_checklist_state: newState })
      .eq('id', periodId);
  };

  const handleDeliver = async () => {
    // Check all required items are complete
    const requiredComplete = items.filter(i => i.required).every(i => i.completed);
    if (!requiredComplete) {
      alert('Please complete all required items before delivering');
      return;
    }

    setDelivering(true);
    try {
      // Update period status
      await supabase
        .from('ma_periods')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', periodId);

      onComplete?.();
    } catch (error) {
      console.error('Error delivering period:', error);
    } finally {
      setDelivering(false);
    }
  };

  const requiredItems = items.filter(i => i.required);
  const optionalItems = items.filter(i => !i.required);
  const completedCount = items.filter(i => i.completed).length;
  const requiredComplete = requiredItems.every(i => i.completed);
  const progress = (completedCount / items.length) * 100;

  // Calculate if all critical data requirements are met
  const dataRequirementsMet = 
    dataState.hasFinancialData && 
    (dataState.hasApprovedInsights || dataState.approvedInsightCount > 0) &&
    dataState.draftInsightCount === 0; // No pending insights

  const canDeliver = requiredComplete && dataRequirementsMet;

  return (
    <div className="space-y-6">
      {/* Data Completion Status - Always shown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-slate-500" />
          Data Requirements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <DataRequirementCard
            icon={<Database className="h-4 w-4" />}
            label="Financial Data"
            status={dataState.hasFinancialData ? 'complete' : 'missing'}
            detail={dataState.hasFinancialData ? 'Entered' : 'Required'}
          />
          <DataRequirementCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="KPIs"
            status={dataState.kpiCount > 0 ? 'complete' : 'optional'}
            detail={`${dataState.kpiCount} configured`}
          />
          <DataRequirementCard
            icon={<Lightbulb className="h-4 w-4" />}
            label="Insights"
            status={
              dataState.draftInsightCount > 0 ? 'pending' :
              dataState.approvedInsightCount > 0 ? 'complete' : 'missing'
            }
            detail={
              dataState.draftInsightCount > 0 
                ? `${dataState.draftInsightCount} pending review` 
                : `${dataState.approvedInsightCount} approved`
            }
          />
          <DataRequirementCard
            icon={<HelpCircle className="h-4 w-4" />}
            label="Tuesday Question"
            status={dataState.hasTuesdayQuestion ? 'complete' : 'optional'}
            detail={dataState.hasTuesdayQuestion ? 'Set' : 'Not set'}
          />
        </div>

        {dataState.draftInsightCount > 0 && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {dataState.draftInsightCount} insight{dataState.draftInsightCount > 1 ? 's' : ''} pending review
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                All AI-generated insights must be approved or rejected before delivery.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div 
          className="px-5 py-4 bg-slate-50 border-b border-slate-200 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-500" />
              <div>
                <h3 className="font-semibold text-slate-800">Quality Checklist</h3>
                <p className="text-sm text-slate-600">{periodLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-sm font-medium ${requiredComplete ? 'text-green-600' : 'text-slate-600'}`}>
                  {completedCount} / {items.length}
                </span>
                <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      requiredComplete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="p-5 space-y-4">
            {/* Required Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Required Quality Checks
              </h4>
              {requiredItems.map(item => (
                <ChecklistRow 
                  key={item.id} 
                  item={item} 
                  onToggle={() => handleToggleItem(item.id)}
                />
              ))}
            </div>

            {/* Optional Items */}
            {optionalItems.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Optional
                </h4>
                {optionalItems.map(item => (
                  <ChecklistRow 
                    key={item.id} 
                    item={item} 
                    onToggle={() => handleToggleItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deliver Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {!canDeliver ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="h-5 w-5" />
              <span className="font-medium">Cannot Deliver Yet</span>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 ml-7 list-disc">
              {!dataState.hasFinancialData && (
                <li>Financial data has not been entered</li>
              )}
              {dataState.draftInsightCount > 0 && (
                <li>{dataState.draftInsightCount} insight{dataState.draftInsightCount > 1 ? 's' : ''} still pending review</li>
              )}
              {dataState.approvedInsightCount === 0 && dataState.draftInsightCount === 0 && (
                <li>No insights have been added</li>
              )}
              {!requiredComplete && (
                <li>Quality checklist items not complete</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Ready to Deliver</p>
                <p className="text-xs text-green-600 mt-0.5">
                  All requirements met. The report will be visible to the client after delivery.
                </p>
              </div>
            </div>
            <button
              onClick={handleDeliver}
              disabled={delivering}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {delivering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Delivering...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Deliver Report to Client
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ChecklistRowProps {
  item: DeliveryChecklistItem;
  onToggle: () => void;
}

function ChecklistRow({ item, onToggle }: ChecklistRowProps) {
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
        ${item.completed 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
        }
      `}
      onClick={onToggle}
    >
      {item.completed ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-slate-400 flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.completed ? 'text-green-800' : 'text-slate-700'}`}>
          {item.label}
        </p>
        {item.description && (
          <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
        )}
      </div>
      
      {item.completedAt && item.completedBy && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <User className="h-3 w-3" />
          <span>{new Date(item.completedAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}

// Data requirement status card
interface DataRequirementCardProps {
  icon: React.ReactNode;
  label: string;
  status: 'complete' | 'missing' | 'pending' | 'optional';
  detail: string;
}

function DataRequirementCard({ icon, label, status, detail }: DataRequirementCardProps) {
  const statusConfig = {
    complete: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
    missing: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
    pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <Clock className="h-4 w-4 text-amber-500" /> },
    optional: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', icon: <Circle className="h-4 w-4 text-slate-400" /> },
  };

  const config = statusConfig[status];

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{icon}</span>
          <span className={`text-sm font-medium ${config.text}`}>{label}</span>
        </div>
        {config.icon}
      </div>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default PeriodDeliveryChecklist;

