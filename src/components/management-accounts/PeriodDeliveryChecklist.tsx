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
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { TierType, DeliveryChecklistItem } from '@/types/ma';
import { getDeliveryChecklist } from '@/types/ma';

interface PeriodDeliveryChecklistProps {
  periodId: string;
  engagementId: string;
  tier: TierType;
  periodLabel: string;
  onComplete?: () => void;
}

export function PeriodDeliveryChecklist({
  periodId,
  engagementId,
  tier,
  periodLabel,
  onComplete
}: PeriodDeliveryChecklistProps) {
  const [items, setItems] = useState<DeliveryChecklistItem[]>(() => getDeliveryChecklist(tier));
  const [expanded, setExpanded] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});

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

  return (
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
              <h3 className="font-semibold text-slate-800">Delivery Checklist</h3>
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
              Required
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

          {/* Deliver Button */}
          <div className="pt-4 border-t border-slate-100">
            {!requiredComplete ? (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Complete all required items to deliver
              </div>
            ) : (
              <button
                onClick={handleDeliver}
                disabled={delivering}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {delivering ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Delivering...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Deliver to Client
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
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

export default PeriodDeliveryChecklist;

