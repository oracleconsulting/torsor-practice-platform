/**
 * Client Profitability Chart Component
 * Displays client/segment profitability analysis
 */

'use client';

import { useState, useMemo } from 'react';
import { 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  PieChart,
  BarChart3
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ClientProfitability {
  id: string;
  name: string;
  segment?: string;
  revenue: number;
  directCosts: number;
  grossProfit: number;
  grossMarginPct: number;
  allocatedOverheads?: number;
  netContribution?: number;
  netMarginPct?: number;
  trend?: 'up' | 'down' | 'flat';
  status?: 'top_performer' | 'average' | 'needs_attention' | 'at_risk';
  metrics?: {
    hoursWorked?: number;
    effectiveRate?: number;
    recoveryRate?: number;
  };
}

interface ClientProfitabilityChartProps {
  clients: ClientProfitability[];
  totalRevenue?: number;
  totalCosts?: number;
  showSegments?: boolean;
  showDetails?: boolean;
  onClientClick?: (clientId: string) => void;
}

type SortField = 'name' | 'revenue' | 'grossProfit' | 'grossMarginPct' | 'netContribution';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'chart';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const getStatusConfig = (status: ClientProfitability['status']) => {
  switch (status) {
    case 'top_performer':
      return { label: 'Top Performer', color: 'bg-emerald-100 text-emerald-700', icon: Star };
    case 'needs_attention':
      return { label: 'Needs Attention', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    case 'at_risk':
      return { label: 'At Risk', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    default:
      return { label: 'Average', color: 'bg-slate-100 text-slate-600', icon: Users };
  }
};

const getMarginColor = (margin: number): string => {
  if (margin >= 50) return 'text-emerald-600';
  if (margin >= 30) return 'text-blue-600';
  if (margin >= 15) return 'text-amber-600';
  return 'text-red-600';
};

const getMarginBg = (margin: number): string => {
  if (margin >= 50) return 'bg-emerald-500';
  if (margin >= 30) return 'bg-blue-500';
  if (margin >= 15) return 'bg-amber-500';
  return 'bg-red-500';
};

// ============================================================================
// HORIZONTAL BAR CHART
// ============================================================================

function HorizontalBarChart({ clients, maxRevenue }: { clients: ClientProfitability[]; maxRevenue: number }) {
  return (
    <div className="space-y-3">
      {clients.slice(0, 10).map(client => {
        const revenueWidth = (client.revenue / maxRevenue) * 100;
        const profitWidth = (client.grossProfit / maxRevenue) * 100;
        
        return (
          <div key={client.id} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{client.name}</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(client.revenue)}</span>
            </div>
            <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
              {/* Revenue bar */}
              <div 
                className="absolute inset-y-0 left-0 bg-blue-200 rounded-full"
                style={{ width: `${revenueWidth}%` }}
              />
              {/* Profit bar */}
              <div 
                className={`absolute inset-y-0 left-0 rounded-full ${getMarginBg(client.grossMarginPct)}`}
                style={{ width: `${profitWidth}%` }}
              />
              {/* Margin label */}
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-xs font-semibold text-white drop-shadow-sm">
                  {formatPercentage(client.grossMarginPct)} margin
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SEGMENT BREAKDOWN
// ============================================================================

function SegmentBreakdown({ clients }: { clients: ClientProfitability[] }) {
  const segments = useMemo(() => {
    const segmentMap = new Map<string, { revenue: number; profit: number; count: number }>();
    
    clients.forEach(client => {
      const segment = client.segment || 'Other';
      const existing = segmentMap.get(segment) || { revenue: 0, profit: 0, count: 0 };
      segmentMap.set(segment, {
        revenue: existing.revenue + client.revenue,
        profit: existing.profit + client.grossProfit,
        count: existing.count + 1
      });
    });
    
    return Array.from(segmentMap.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        marginPct: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [clients]);
  
  const totalRevenue = segments.reduce((sum, s) => sum + s.revenue, 0);
  
  // Colors for segments
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  
  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="h-8 flex rounded-full overflow-hidden">
        {segments.map((segment, idx) => (
          <div
            key={segment.name}
            className={`${colors[idx % colors.length]} flex items-center justify-center`}
            style={{ width: `${(segment.revenue / totalRevenue) * 100}%` }}
            title={`${segment.name}: ${formatCurrency(segment.revenue)}`}
          >
            {(segment.revenue / totalRevenue) * 100 > 10 && (
              <span className="text-xs font-semibold text-white truncate px-1">
                {segment.name}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {segments.map((segment, idx) => (
          <div key={segment.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{segment.name}</div>
              <div className="text-xs text-slate-500">
                {formatCurrency(segment.revenue)} • {segment.count} clients
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PROFITABILITY TABLE
// ============================================================================

function ProfitabilityTable({ 
  clients, 
  sortField, 
  sortDirection, 
  onSort,
  onClientClick 
}: { 
  clients: ClientProfitability[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onClientClick?: (id: string) => void;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th 
              className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 cursor-pointer hover:bg-slate-50"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1">
                Client <SortIcon field="name" />
              </div>
            </th>
            <th 
              className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 cursor-pointer hover:bg-slate-50"
              onClick={() => onSort('revenue')}
            >
              <div className="flex items-center justify-end gap-1">
                Revenue <SortIcon field="revenue" />
              </div>
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
              Direct Costs
            </th>
            <th 
              className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 cursor-pointer hover:bg-slate-50"
              onClick={() => onSort('grossProfit')}
            >
              <div className="flex items-center justify-end gap-1">
                Gross Profit <SortIcon field="grossProfit" />
              </div>
            </th>
            <th 
              className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 cursor-pointer hover:bg-slate-50"
              onClick={() => onSort('grossMarginPct')}
            >
              <div className="flex items-center justify-end gap-1">
                Margin <SortIcon field="grossMarginPct" />
              </div>
            </th>
            <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
              Trend
            </th>
            <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map(client => {
            const statusConfig = getStatusConfig(client.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <tr 
                key={client.id} 
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => onClientClick?.(client.id)}
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-800">{client.name}</div>
                  {client.segment && (
                    <div className="text-xs text-slate-500">{client.segment}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800">
                  {formatCurrency(client.revenue)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600">
                  {formatCurrency(client.directCosts)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800">
                  {formatCurrency(client.grossProfit)}
                </td>
                <td className={`py-3 px-4 text-right font-bold ${getMarginColor(client.grossMarginPct)}`}>
                  {formatPercentage(client.grossMarginPct)}
                </td>
                <td className="py-3 px-4 text-center">
                  {client.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto" />}
                  {client.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600 mx-auto" />}
                  {client.trend === 'flat' && <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClientProfitabilityChart({ 
  clients, 
  totalRevenue: _totalRevenue,
  totalCosts: _totalCosts,
  showSegments = true,
  showDetails: _showDetails = true,
  onClientClick 
}: ClientProfitabilityChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Sort and filter clients
  const processedClients = useMemo(() => {
    let filtered = filterStatus === 'all' 
      ? clients 
      : clients.filter(c => c.status === filterStatus);
    
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [clients, sortField, sortDirection, filterStatus]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Calculate summary stats
  const totalClientRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const totalClientProfit = clients.reduce((sum, c) => sum + c.grossProfit, 0);
  const avgMargin = totalClientRevenue > 0 ? (totalClientProfit / totalClientRevenue) * 100 : 0;
  const topPerformers = clients.filter(c => c.status === 'top_performer').length;
  const atRisk = clients.filter(c => c.status === 'at_risk').length;
  
  const maxRevenue = Math.max(...clients.map(c => c.revenue));
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Client Profitability Analysis
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {clients.length} clients analyzed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'chart' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PieChart className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Clients</option>
              <option value="top_performer">Top Performers</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="at_risk">At Risk</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
            <div className="text-xl font-bold text-slate-900">{formatCurrency(totalClientRevenue)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Gross Profit</div>
            <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalClientProfit)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Avg Margin</div>
            <div className={`text-xl font-bold ${getMarginColor(avgMargin)}`}>{formatPercentage(avgMargin)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Top Performers</div>
            <div className="text-xl font-bold text-emerald-600">{topPerformers}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">At Risk</div>
            <div className="text-xl font-bold text-red-600">{atRisk}</div>
          </div>
        </div>
      </div>
      
      {/* Segment Breakdown */}
      {showSegments && viewMode === 'chart' && (
        <div className="p-6 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            Revenue by Segment
          </h4>
          <SegmentBreakdown clients={clients} />
        </div>
      )}
      
      {/* Main Content */}
      <div className="p-6">
        {viewMode === 'table' ? (
          <ProfitabilityTable 
            clients={processedClients}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onClientClick={onClientClick}
          />
        ) : (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Top 10 Clients by Revenue
            </h4>
            <HorizontalBarChart clients={processedClients} maxRevenue={maxRevenue} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientProfitabilityChart;

