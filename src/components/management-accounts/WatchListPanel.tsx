'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, 
  AlertTriangle, 
  CreditCard, 
  TrendingDown, 
  AlertCircle,
  Calendar,
  Plus,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MAWatchListItem, TierType } from '../../types/ma';
import { TIER_FEATURES } from '../../types/ma';

interface WatchListPanelProps {
  engagementId: string;
  tier: TierType;
  maxItems?: number;
  showAddButton?: boolean;
  onItemClick?: (item: MAWatchListItem) => void;
}

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  debtor: <CreditCard className="h-4 w-4" />,
  creditor: <CreditCard className="h-4 w-4" />,
  kpi_threshold: <TrendingDown className="h-4 w-4" />,
  cash_warning: <AlertTriangle className="h-4 w-4" />,
  client_concern: <AlertCircle className="h-4 w-4" />,
  renewal: <Calendar className="h-4 w-4" />,
  custom: <Eye className="h-4 w-4" />,
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  debtor: 'Overdue Debtor',
  creditor: 'Payment Due',
  kpi_threshold: 'KPI Alert',
  cash_warning: 'Cash Warning',
  client_concern: 'Client Issue',
  renewal: 'Renewal Due',
  custom: 'Watch Item',
};

const PRIORITY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
};

export function WatchListPanel({
  engagementId,
  tier,
  maxItems,
  showAddButton = false,
  onItemClick
}: WatchListPanelProps) {
  const [items, setItems] = useState<MAWatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const tierConfig = TIER_FEATURES[tier];
  const displayLimit = maxItems ?? (tier === 'platinum' ? 20 : tier === 'gold' ? 10 : tier === 'silver' ? 5 : 3);

  useEffect(() => {
    loadWatchList();
  }, [engagementId]);

  const loadWatchList = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ma_watch_list')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .order('triggered_at', { ascending: false })
        .limit(displayLimit);

      if (data) setItems(data);
    } catch (error) {
      console.error('Error loading watch list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (itemId: string, notes?: string) => {
    await supabase
      .from('ma_watch_list')
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', itemId);

    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleDismiss = async (itemId: string) => {
    await supabase
      .from('ma_watch_list')
      .update({ status: 'dismissed' })
      .eq('id', itemId);

    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleAddItem = async (item: Partial<MAWatchListItem>) => {
    const { data } = await supabase
      .from('ma_watch_list')
      .insert({
        engagement_id: engagementId,
        ...item,
        status: 'active',
        triggered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (data) {
      setItems(prev => [data, ...prev].slice(0, displayLimit));
    }
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800">Watch List</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              {items.length} active
            </span>
          </div>
          {showAddButton && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active watch items</p>
          </div>
        ) : (
          items.map(item => (
            <WatchListItem
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
              onResolve={(notes) => handleResolve(item.id, notes)}
              onDismiss={() => handleDismiss(item.id)}
            />
          ))
        )}
      </div>

      {/* Tier limit message */}
      {items.length >= displayLimit && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing top {displayLimit} items ({tierConfig.name})
          </p>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <AddWatchItemForm
          onAdd={handleAddItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

interface WatchListItemProps {
  item: MAWatchListItem;
  onClick?: () => void;
  onResolve: (notes?: string) => void;
  onDismiss: () => void;
}

function WatchListItem({ item, onClick, onResolve, onDismiss }: WatchListItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveInput, setShowResolveInput] = useState(false);

  const priority = item.priority || 'medium';
  const styles = PRIORITY_STYLES[priority];
  const icon = ITEM_TYPE_ICONS[item.item_type];
  const typeLabel = ITEM_TYPE_LABELS[item.item_type];

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  return (
    <div className={`p-4 ${styles.bg} hover:bg-opacity-80 transition-colors`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${styles.text}`}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium ${styles.text}`}>{typeLabel}</span>
            {item.priority === 'high' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                High Priority
              </span>
            )}
          </div>
          
          <h4 className="font-medium text-slate-800 mt-1">{item.title}</h4>
          
          {item.description && (
            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
          )}
          
          {/* Value display */}
          {item.current_value !== undefined && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-slate-500">Current:</span>
              <span className={`font-semibold ${styles.text}`}>
                {formatCurrency(item.current_value)}
              </span>
              {item.threshold_value !== undefined && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Threshold:</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(item.threshold_value)}
                  </span>
                </>
              )}
            </div>
          )}
          
          {/* Due date */}
          {item.due_date && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              Due: {new Date(item.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
              <button
                onClick={() => {
                  setShowResolveInput(true);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
                Mark Resolved
              </button>
              <button
                onClick={() => {
                  onDismiss();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Resolve input */}
      {showResolveInput && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2">
          <input
            type="text"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            placeholder="Resolution notes (optional)"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onResolve(resolveNotes)}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowResolveInput(false)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AddWatchItemFormProps {
  onAdd: (item: Partial<MAWatchListItem>) => void;
  onCancel: () => void;
}

function AddWatchItemForm({ onAdd, onCancel }: AddWatchItemFormProps) {
  const [formData, setFormData] = useState({
    item_type: 'custom' as MAWatchListItem['item_type'],
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_date: '',
    current_value: '',
    threshold_value: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      item_type: formData.item_type,
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      due_date: formData.due_date || undefined,
      current_value: formData.current_value ? parseFloat(formData.current_value) : undefined,
      threshold_value: formData.threshold_value ? parseFloat(formData.threshold_value) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Add Watch Item</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={formData.item_type}
              onChange={(e) => setFormData(prev => ({ ...prev, item_type: e.target.value as any }))}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            >
              <option value="custom">Custom Watch Item</option>
              <option value="debtor">Overdue Debtor</option>
              <option value="creditor">Payment Due</option>
              <option value="kpi_threshold">KPI Alert</option>
              <option value="cash_warning">Cash Warning</option>
              <option value="client_concern">Client Issue</option>
              <option value="renewal">Renewal Due</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Value (£)</label>
              <input
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Threshold (£)</label>
              <input
                type="number"
                value={formData.threshold_value}
                onChange={(e) => setFormData(prev => ({ ...prev, threshold_value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!formData.title}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              Add to Watch List
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WatchListPanel;

