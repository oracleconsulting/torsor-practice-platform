/**
 * Alerts Panel Component
 * Displays and manages KPI alerts
 */

'use client';

import { useState } from 'react';
import { 
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingDown,
  Zap,
  Filter
} from 'lucide-react';
import type { KPIAlert } from '../../hooks/useAlerts';

// ============================================================================
// TYPES
// ============================================================================

interface AlertsPanelProps {
  alerts: KPIAlert[];
  unacknowledgedCount: number;
  onAcknowledge: (alertId: string) => Promise<void>;
  onAcknowledgeAll: () => Promise<void>;
  loading?: boolean;
}

type FilterType = 'all' | 'unacknowledged' | 'critical' | 'high';

// ============================================================================
// CONSTANTS
// ============================================================================

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: AlertTriangle,
    badge: 'bg-red-600'
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    icon: AlertCircle,
    badge: 'bg-orange-500'
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Info,
    badge: 'bg-amber-500'
  },
  low: {
    label: 'Low',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    badge: 'bg-blue-500'
  }
};

const ALERT_TYPE_CONFIG = {
  threshold_breach: {
    label: 'Threshold Breach',
    icon: Target,
    description: 'KPI exceeded acceptable threshold'
  },
  trend_change: {
    label: 'Trend Change',
    icon: TrendingDown,
    description: 'Significant change in trend direction'
  },
  target_miss: {
    label: 'Target Miss',
    icon: Target,
    description: 'KPI missed its target'
  },
  anomaly: {
    label: 'Anomaly Detected',
    icon: Zap,
    description: 'Unusual pattern detected'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatValue = (value: number | null): string => {
  if (value === null) return '—';
  if (Math.abs(value) >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `£${(value / 1000).toFixed(0)}K`;
  }
  return value.toFixed(1);
};

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ============================================================================
// ALERT CARD
// ============================================================================

function AlertCard({ 
  alert, 
  onAcknowledge,
  isExpanded,
  onToggle 
}: { 
  alert: KPIAlert;
  onAcknowledge: () => Promise<void>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [acknowledging, setAcknowledging] = useState(false);
  
  const severityConfig = SEVERITY_CONFIG[alert.severity];
  const alertTypeConfig = ALERT_TYPE_CONFIG[alert.alert_type];
  const SeverityIcon = severityConfig.icon;
  const TypeIcon = alertTypeConfig.icon;
  
  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledging(true);
    try {
      await onAcknowledge();
    } finally {
      setAcknowledging(false);
    }
  };
  
  return (
    <div 
      className={`rounded-lg border-2 transition-all ${
        alert.is_acknowledged 
          ? 'bg-slate-50 border-slate-200 opacity-60' 
          : severityConfig.bg
      }`}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${alert.is_acknowledged ? 'bg-slate-200' : 'bg-white/80'}`}>
            <SeverityIcon className={`w-5 h-5 ${alert.is_acknowledged ? 'text-slate-400' : severityConfig.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold ${alert.is_acknowledged ? 'text-slate-500' : 'text-slate-800'}`}>
                {alert.title}
              </h4>
              {!alert.is_acknowledged && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${severityConfig.badge}`}>
                  {severityConfig.label.toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <TypeIcon className="w-3.5 h-3.5" />
                {alertTypeConfig.label}
              </span>
              <span>•</span>
              <span>{alert.kpi_code.replace(/_/g, ' ')}</span>
              <span>•</span>
              <span>{formatTimeAgo(alert.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!alert.is_acknowledged && (
              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Acknowledge"
              >
                {acknowledging ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-200/50">
          <div className="pt-4 space-y-4">
            {/* Description */}
            {alert.description && (
              <p className="text-sm text-slate-600">{alert.description}</p>
            )}
            
            {/* Values */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/60 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">Current</div>
                <div className="text-lg font-bold text-slate-800">{formatValue(alert.current_value)}</div>
              </div>
              {alert.threshold_value !== null && (
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Threshold</div>
                  <div className="text-lg font-bold text-slate-800">{formatValue(alert.threshold_value)}</div>
                </div>
              )}
              {alert.previous_value !== null && (
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Previous</div>
                  <div className="text-lg font-bold text-slate-800">{formatValue(alert.previous_value)}</div>
                </div>
              )}
            </div>
            
            {/* Recommendation */}
            {alert.recommendation && (
              <div className="bg-white/60 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Recommendation
                </div>
                <p className="text-sm text-slate-700">{alert.recommendation}</p>
              </div>
            )}
            
            {/* Acknowledged info */}
            {alert.is_acknowledged && alert.acknowledged_at && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Acknowledged {formatTimeAgo(alert.acknowledged_at)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AlertsPanel({ 
  alerts, 
  unacknowledgedCount,
  onAcknowledge,
  onAcknowledgeAll,
  loading: _loading 
}: AlertsPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [acknowledgingAll, setAcknowledgingAll] = useState(false);
  
  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unacknowledged':
        return !alert.is_acknowledged;
      case 'critical':
        return alert.severity === 'critical';
      case 'high':
        return alert.severity === 'critical' || alert.severity === 'high';
      default:
        return true;
    }
  });
  
  const toggleExpanded = (alertId: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };
  
  const handleAcknowledgeAll = async () => {
    setAcknowledgingAll(true);
    try {
      await onAcknowledgeAll();
    } finally {
      setAcknowledgingAll(false);
    }
  };
  
  // Count by severity
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_acknowledged).length;
  const highCount = alerts.filter(a => a.severity === 'high' && !a.is_acknowledged).length;
  
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">All Clear!</h3>
        <p className="text-slate-500">No KPI alerts at this time</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              KPI Alerts
              {unacknowledgedCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                  {unacknowledgedCount}
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {alerts.length} total • {unacknowledgedCount} require attention
            </p>
          </div>
          
          {unacknowledgedCount > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              disabled={acknowledgingAll}
              className="px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 rounded-lg flex items-center gap-2"
            >
              {acknowledgingAll ? (
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              Acknowledge All
            </button>
          )}
        </div>
      </div>
      
      {/* Severity Summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-700">{criticalCount} Critical</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-orange-700">{highCount} High Priority</span>
            </div>
          )}
        </div>
      )}
      
      {/* Filter */}
      <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'unacknowledged', label: 'Unacknowledged' },
            { value: 'critical', label: 'Critical Only' },
            { value: 'high', label: 'High & Critical' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as FilterType)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Alerts List */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={() => onAcknowledge(alert.id)}
              isExpanded={expandedAlerts.has(alert.id)}
              onToggle={() => toggleExpanded(alert.id)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            No alerts match the current filter
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsPanel;

