'use client';

import { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  RefreshCw,
  DollarSign,
  MessageSquare,
  LogOut,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MAClientProfitability, RAGStatus } from '@/types/ma';

interface ClientProfitabilityTableProps {
  periodId: string;
  clients: MAClientProfitability[];
  onUpdate?: (clients: MAClientProfitability[]) => void;
  editable?: boolean;
}

const VERDICT_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  protect_grow: { label: 'Protect & Grow', icon: <Shield className="h-4 w-4" />, bg: 'bg-green-100', text: 'text-green-700' },
  maintain: { label: 'Maintain', icon: <RefreshCw className="h-4 w-4" />, bg: 'bg-blue-100', text: 'text-blue-700' },
  reprice: { label: 'Reprice', icon: <DollarSign className="h-4 w-4" />, bg: 'bg-amber-100', text: 'text-amber-700' },
  renegotiate: { label: 'Renegotiate', icon: <MessageSquare className="h-4 w-4" />, bg: 'bg-orange-100', text: 'text-orange-700' },
  exit: { label: 'Consider Exit', icon: <LogOut className="h-4 w-4" />, bg: 'bg-red-100', text: 'text-red-700' },
};

const RAG_COLORS: Record<RAGStatus, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  grey: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' },
};

export function ClientProfitabilityTable({
  periodId,
  clients,
  onUpdate,
  editable = false
}: ClientProfitabilityTableProps) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MAClientProfitability>>({});
  const [sortField, setSortField] = useState<'revenue' | 'gross_margin_pct' | 'net_margin_pct'>('revenue');
  const [sortDesc, setSortDesc] = useState(true);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Sort clients
  const sortedClients = [...clients].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    return sortDesc ? bVal - aVal : aVal - bVal;
  });

  // Calculate totals
  const totals = clients.reduce(
    (acc, c) => ({
      revenue: acc.revenue + c.revenue,
      directCosts: acc.directCosts + (c.total_direct_costs ?? 0),
      grossProfit: acc.grossProfit + (c.gross_profit ?? 0),
      netProfit: acc.netProfit + (c.net_profit ?? 0),
    }),
    { revenue: 0, directCosts: 0, grossProfit: 0, netProfit: 0 }
  );
  const avgGrossMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;
  const avgNetMargin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

  // Count by verdict
  const verdictCounts = clients.reduce((acc, c) => {
    if (c.verdict) {
      acc[c.verdict] = (acc[c.verdict] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const startEditing = (client: MAClientProfitability) => {
    setEditingClient(client.id);
    setEditData({
      revenue: client.revenue,
      total_direct_costs: client.total_direct_costs,
      allocated_overhead: client.allocated_overhead,
      target_margin_pct: client.target_margin_pct,
      verdict: client.verdict,
      recommended_action: client.recommended_action,
    });
  };

  const handleSave = async (clientId: string) => {
    // Calculate derived fields
    const grossProfit = (editData.revenue ?? 0) - (editData.total_direct_costs ?? 0);
    const grossMarginPct = (editData.revenue ?? 0) > 0 ? (grossProfit / (editData.revenue ?? 0)) * 100 : 0;
    const netProfit = grossProfit - (editData.allocated_overhead ?? 0);
    const netMarginPct = (editData.revenue ?? 0) > 0 ? (netProfit / (editData.revenue ?? 0)) * 100 : 0;
    const marginVsTarget = netMarginPct - (editData.target_margin_pct ?? 0);

    // Determine RAG status
    let ragStatus: RAGStatus = 'grey';
    if (marginVsTarget >= 5) ragStatus = 'green';
    else if (marginVsTarget >= -5) ragStatus = 'amber';
    else ragStatus = 'red';

    const updateData = {
      ...editData,
      gross_profit: grossProfit,
      gross_margin_pct: grossMarginPct,
      net_profit: netProfit,
      net_margin_pct: netMarginPct,
      margin_vs_target: marginVsTarget,
      rag_status: ragStatus,
    };

    const { error } = await supabase
      .from('ma_client_profitability')
      .update(updateData)
      .eq('id', clientId);

    if (!error) {
      // Update local state
      const updatedClients = clients.map(c =>
        c.id === clientId ? { ...c, ...updateData } : c
      );
      onUpdate?.(updatedClients);
      setEditingClient(null);
      setEditData({});
    }
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setEditData({});
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Client Profitability Analysis
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{clients.length} clients analysed</p>
          </div>
          
          {/* Verdict Summary */}
          <div className="flex items-center gap-2">
            {Object.entries(verdictCounts).map(([verdict, count]) => {
              const config = VERDICT_CONFIG[verdict];
              return config ? (
                <span key={verdict} className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text} flex items-center gap-1`}>
                  {config.icon}
                  {count}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 border-b border-slate-200">
        <div className="text-center">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Total Gross Profit</p>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(totals.grossProfit)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Avg Gross Margin</p>
          <p className={`text-lg font-bold ${avgGrossMargin >= 30 ? 'text-green-600' : avgGrossMargin >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
            {formatPercent(avgGrossMargin)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Avg Net Margin</p>
          <p className={`text-lg font-bold ${avgNetMargin >= 15 ? 'text-green-600' : avgNetMargin >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
            {formatPercent(avgNetMargin)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Client</th>
              <th 
                className="px-4 py-3 text-right font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('revenue')}
              >
                <span className="flex items-center justify-end gap-1">
                  Revenue
                  {sortField === 'revenue' && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Direct Costs</th>
              <th 
                className="px-4 py-3 text-right font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('gross_margin_pct')}
              >
                <span className="flex items-center justify-end gap-1">
                  Gross %
                  {sortField === 'gross_margin_pct' && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-right font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('net_margin_pct')}
              >
                <span className="flex items-center justify-end gap-1">
                  Net %
                  {sortField === 'net_margin_pct' && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Verdict</th>
              {editable && <th className="px-4 py-3 text-center font-medium text-slate-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedClients.map(client => {
              const isExpanded = expandedClient === client.id;
              const isEditing = editingClient === client.id;
              const ragColors = RAG_COLORS[client.rag_status || 'grey'];
              const verdictConfig = client.verdict ? VERDICT_CONFIG[client.verdict] : null;

              return (
                <>
                  <tr 
                    key={client.id} 
                    className={`${ragColors.bg} hover:bg-opacity-80 cursor-pointer`}
                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${ragColors.dot}`} />
                        <span className="font-medium text-slate-800">{client.client_name}</span>
                        {client.client_ref && (
                          <span className="text-xs text-slate-400">({client.client_ref})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.revenue ?? ''}
                          onChange={(e) => setEditData({ ...editData, revenue: parseFloat(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded text-right"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        formatCurrency(client.revenue)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.total_direct_costs ?? ''}
                          onChange={(e) => setEditData({ ...editData, total_direct_costs: parseFloat(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded text-right"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        formatCurrency(client.total_direct_costs ?? 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${(client.gross_margin_pct ?? 0) >= 30 ? 'text-green-600' : (client.gross_margin_pct ?? 0) >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                        {formatPercent(client.gross_margin_pct ?? 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={`font-medium ${(client.net_margin_pct ?? 0) >= 15 ? 'text-green-600' : (client.net_margin_pct ?? 0) >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {formatPercent(client.net_margin_pct ?? 0)}
                        </span>
                        {client.margin_vs_target !== undefined && (
                          client.margin_vs_target >= 0 
                            ? <ArrowUpRight className="h-3 w-3 text-green-500" />
                            : <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editData.verdict ?? ''}
                          onChange={(e) => setEditData({ ...editData, verdict: e.target.value as any })}
                          className="px-2 py-1 border rounded text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Select...</option>
                          {Object.entries(VERDICT_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                      ) : verdictConfig ? (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${verdictConfig.bg} ${verdictConfig.text}`}>
                          {verdictConfig.icon}
                          {verdictConfig.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    {editable && (
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSave(client.id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(client)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                  
                  {/* Expanded Row */}
                  {isExpanded && !isEditing && (
                    <tr className={ragColors.bg}>
                      <td colSpan={editable ? 7 : 6} className="px-4 py-4 border-t border-slate-200/50">
                        <div className="grid grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Revenue Breakdown</p>
                            <p><span className="text-slate-600">Period:</span> <span className="font-medium">{formatCurrency(client.revenue)}</span></p>
                            {client.revenue_ytd && (
                              <p><span className="text-slate-600">YTD:</span> <span className="font-medium">{formatCurrency(client.revenue_ytd)}</span></p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Cost Breakdown</p>
                            {client.direct_labour_cost && (
                              <p><span className="text-slate-600">Labour:</span> {formatCurrency(client.direct_labour_cost)}</p>
                            )}
                            {client.subcontractor_cost && (
                              <p><span className="text-slate-600">Subcontractors:</span> {formatCurrency(client.subcontractor_cost)}</p>
                            )}
                            {client.other_direct_costs && (
                              <p><span className="text-slate-600">Other:</span> {formatCurrency(client.other_direct_costs)}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Performance</p>
                            {client.effective_hourly_rate && (
                              <p><span className="text-slate-600">Effective Rate:</span> <span className="font-medium">{formatCurrency(client.effective_hourly_rate)}/hr</span></p>
                            )}
                            {client.target_margin_pct && (
                              <p><span className="text-slate-600">Target Margin:</span> {formatPercent(client.target_margin_pct)}</p>
                            )}
                            {client.margin_vs_target !== undefined && (
                              <p>
                                <span className="text-slate-600">vs Target:</span>{' '}
                                <span className={client.margin_vs_target >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {client.margin_vs_target >= 0 ? '+' : ''}{formatPercent(client.margin_vs_target)}
                                </span>
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Analysis & Action</p>
                            {client.analysis_notes && (
                              <p className="text-slate-600 text-xs mb-2">{client.analysis_notes}</p>
                            )}
                            {client.recommended_action && (
                              <div className="bg-white/50 rounded p-2">
                                <p className="text-xs font-medium text-slate-700">Recommended:</p>
                                <p className="text-xs text-slate-600">{client.recommended_action}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientProfitabilityTable;

