'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Edit2
} from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  revenue: number;
  directCosts: number;
  allocatedOverhead: number;
  profit: number;
  margin: number;
  hoursWorked: number;
  effectiveRate: number;
  targetMargin: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  notes?: string;
}

interface ClientProfitabilitySectionProps {
  clients: ClientData[];
  totalRevenue: number;
  totalProfit: number;
  editMode?: boolean;
  onEditClient?: (client: ClientData) => void;
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  }
  return `£${value.toLocaleString()}`;
};

const RISK_STYLES = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
};

export function ClientProfitabilitySection({
  clients,
  totalRevenue,
  totalProfit,
  editMode = false,
  onEditClient,
}: ClientProfitabilitySectionProps) {
  const [sortBy, setSortBy] = useState<'margin' | 'revenue' | 'profit' | 'risk'>('margin');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(true);

  // Sort clients
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      let compare = 0;
      switch (sortBy) {
        case 'margin':
          compare = a.margin - b.margin;
          break;
        case 'revenue':
          compare = a.revenue - b.revenue;
          break;
        case 'profit':
          compare = a.profit - b.profit;
          break;
        case 'risk':
          const riskOrder = { low: 0, medium: 1, high: 2 };
          compare = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
      }
      return sortAsc ? compare : -compare;
    });
  }, [clients, sortBy, sortAsc]);

  // Calculate stats
  const stats = useMemo(() => {
    const profitable = clients.filter(c => c.margin >= c.targetMargin).length;
    const unprofitable = clients.filter(c => c.margin < 0).length;
    const atRisk = clients.filter(c => c.riskLevel === 'high').length;
    const avgMargin = clients.length > 0 
      ? clients.reduce((acc, c) => acc + c.margin, 0) / clients.length 
      : 0;
    
    return { profitable, unprofitable, atRisk, avgMargin };
  }, [clients]);

  // Bar chart calculation
  const maxRevenue = Math.max(...clients.map(c => c.revenue), 1);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-700 mb-2">No Client Data Available</h3>
        <p className="text-slate-500">
          Client profitability data will appear here once financial data is entered.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Client Profitability</h2>
            <p className="text-sm text-slate-500">{clients.length} clients analyzed</p>
          </div>
        </div>
        <button
          onClick={() => setShowChart(!showChart)}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
        >
          <BarChart3 className="w-4 h-4" />
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border-b border-slate-200">
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Profit</p>
          <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">Avg Margin</p>
          <p className={`text-xl font-bold ${stats.avgMargin >= 20 ? 'text-emerald-600' : stats.avgMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {stats.avgMargin.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">At Risk</p>
          <p className={`text-xl font-bold ${stats.atRisk > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {stats.atRisk} clients
          </p>
        </div>
      </div>

      {/* Visual Chart */}
      {showChart && (
        <div className="p-4 border-b border-slate-200">
          <div className="space-y-3">
            {sortedClients.slice(0, 8).map((client) => {
              const widthPct = (client.revenue / maxRevenue) * 100;
              
              return (
                <div key={client.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-slate-700 truncate" title={client.name}>
                    {client.name}
                  </div>
                  <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                    {/* Revenue bar */}
                    <div
                      className={`h-full rounded-lg transition-all ${
                        client.margin >= client.targetMargin ? 'bg-emerald-500' :
                        client.margin >= 0 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                    {/* Profit marker */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className={`text-xs font-bold ${
                        client.margin >= client.targetMargin ? 'text-emerald-700' :
                        client.margin >= 0 ? 'text-amber-700' : 'text-red-700'
                      }`}>
                        {client.margin.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-slate-600">
                    {formatCurrency(client.revenue)}
                  </div>
                </div>
              );
            })}
          </div>
          {clients.length > 8 && (
            <p className="text-sm text-slate-500 text-center mt-3">
              +{clients.length - 8} more clients
            </p>
          )}
        </div>
      )}

      {/* Client Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Client</th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center justify-end gap-1">
                  Revenue
                  {sortBy === 'revenue' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('profit')}
              >
                <div className="flex items-center justify-end gap-1">
                  Profit
                  {sortBy === 'profit' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('margin')}
              >
                <div className="flex items-center justify-end gap-1">
                  Margin
                  {sortBy === 'margin' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Eff. Rate</th>
              <th 
                className="px-4 py-3 text-center text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                onClick={() => handleSort('risk')}
              >
                <div className="flex items-center justify-center gap-1">
                  Risk
                  {sortBy === 'risk' && (sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Trend</th>
              {editMode && <th className="px-4 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedClients.map((client) => {
              const riskStyle = RISK_STYLES[client.riskLevel];
              const isExpanded = expandedClient === client.id;
              const marginStatus = client.margin >= client.targetMargin 
                ? 'good' 
                : client.margin >= 0 
                  ? 'warning' 
                  : 'bad';

              return (
                <>
                  <tr 
                    key={client.id} 
                    className={`hover:bg-slate-50 cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-8 rounded-full ${
                            marginStatus === 'good' ? 'bg-emerald-500' :
                            marginStatus === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                        />
                        <div>
                          <p className="font-medium text-slate-800">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.hoursWorked}h worked</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {formatCurrency(client.revenue)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      client.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(client.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold ${
                          marginStatus === 'good' ? 'text-emerald-600' :
                          marginStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {client.margin.toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400">/ {client.targetMargin}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      £{client.effectiveRate}/hr
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskStyle.badge}`}>
                        {client.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.trend === 'up' && <ArrowUpRight className="w-5 h-5 text-emerald-500 mx-auto" />}
                      {client.trend === 'down' && <ArrowDownRight className="w-5 h-5 text-red-500 mx-auto" />}
                      {client.trend === 'stable' && <Minus className="w-5 h-5 text-slate-400 mx-auto" />}
                    </td>
                    {editMode && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClient?.(client);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  
                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr key={`${client.id}-expanded`}>
                      <td colSpan={editMode ? 8 : 7} className="px-4 py-4 bg-slate-50">
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Cost Breakdown</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Direct Costs</span>
                                <span className="font-medium text-slate-700">{formatCurrency(client.directCosts)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Allocated Overhead</span>
                                <span className="font-medium text-slate-700">{formatCurrency(client.allocatedOverhead)}</span>
                              </div>
                              <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                                <span className="text-slate-600 font-medium">Total Costs</span>
                                <span className="font-bold text-slate-800">{formatCurrency(client.directCosts + client.allocatedOverhead)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Margin Analysis</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      client.margin >= client.targetMargin ? 'bg-emerald-500' :
                                      client.margin >= 0 ? 'bg-amber-400' : 'bg-red-400'
                                    }`}
                                    style={{ width: `${Math.max(0, Math.min(100, (client.margin / client.targetMargin) * 100))}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500">
                                  {((client.margin / client.targetMargin) * 100).toFixed(0)}% of target
                                </span>
                              </div>
                              {client.margin < client.targetMargin && (
                                <p className="text-sm text-amber-600">
                                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                                  {(client.targetMargin - client.margin).toFixed(1)}% below target margin
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Notes</h4>
                            {client.notes ? (
                              <p className="text-sm text-slate-600">{client.notes}</p>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No notes added</p>
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

      {/* Footer Summary */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-slate-500">
            <span className="inline-block w-3 h-3 bg-emerald-500 rounded mr-1" />
            {stats.profitable} above target
          </span>
          <span className="text-slate-500">
            <span className="inline-block w-3 h-3 bg-amber-400 rounded mr-1" />
            {clients.length - stats.profitable - stats.unprofitable} below target
          </span>
          <span className="text-slate-500">
            <span className="inline-block w-3 h-3 bg-red-400 rounded mr-1" />
            {stats.unprofitable} unprofitable
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Info className="w-4 h-4" />
          <span>Click a row for details</span>
        </div>
      </div>
    </div>
  );
}

