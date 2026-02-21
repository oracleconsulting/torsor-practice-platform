/**
 * Client Profitability Section
 * Horizontal bar chart showing client margins
 * Foresight+ tiers only
 */

import { useState } from 'react';
import { 
  AlertTriangle, 
  Users, 
  ChevronDown, 
  ChevronUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { BIClientProfitability, ProfitabilityStatus } from '../../types/business-intelligence';

interface ClientProfitabilitySectionProps {
  data: BIClientProfitability[];
  editable?: boolean;
}

export function ClientProfitabilitySection({ 
  data
}: ClientProfitabilitySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'revenue' | 'margin'>('revenue');
  
  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'margin') {
      return (b.gross_margin_percentage || 0) - (a.gross_margin_percentage || 0);
    }
    return (b.revenue || 0) - (a.revenue || 0);
  });
  
  // Calculate totals
  const totalRevenue = data.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const weightedMargin = totalRevenue > 0
    ? data.reduce((sum, c) => sum + ((c.revenue || 0) * (c.gross_margin_percentage || 0)), 0) / totalRevenue
    : 0;
  
  // Status counts
  const statusCounts = {
    highly_profitable: data.filter(c => c.profitability_status === 'highly_profitable').length,
    profitable: data.filter(c => c.profitability_status === 'profitable').length,
    marginal: data.filter(c => c.profitability_status === 'marginal').length,
    loss_making: data.filter(c => c.profitability_status === 'loss_making').length
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const getStatusColor = (status: ProfitabilityStatus | null) => {
    switch (status) {
      case 'highly_profitable': return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' };
      case 'profitable': return { bg: 'bg-emerald-400', text: 'text-emerald-700', light: 'bg-emerald-50' };
      case 'marginal': return { bg: 'bg-amber-400', text: 'text-amber-700', light: 'bg-amber-50' };
      case 'loss_making': return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' };
      default: return { bg: 'bg-gray-300', text: 'text-gray-700', light: 'bg-gray-50' };
    }
  };
  
  const maxRevenue = Math.max(...data.map(c => c.revenue || 0));
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Client Profitability</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {data.length} clients analysed
          </p>
        </div>
        
        {/* Sort toggle */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sort by:</span>
          <button
            onClick={() => setSortBy('revenue')}
            className={`px-2 py-1 rounded ${
              sortBy === 'revenue' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setSortBy('margin')}
            className={`px-2 py-1 rounded ${
              sortBy === 'margin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Margin
          </button>
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        {statusCounts.highly_profitable > 0 && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            {statusCounts.highly_profitable} highly profitable
          </span>
        )}
        {statusCounts.profitable > 0 && (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            {statusCounts.profitable} profitable
          </span>
        )}
        {statusCounts.marginal > 0 && (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {statusCounts.marginal} marginal
          </span>
        )}
        {statusCounts.loss_making > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {statusCounts.loss_making} loss making
          </span>
        )}
      </div>
      
      {/* Client Bars */}
      <div className="space-y-3">
        {(expanded ? sortedData : sortedData.slice(0, 5)).map((client) => {
          const statusColors = getStatusColor(client.profitability_status);
          const barWidth = maxRevenue > 0 ? ((client.revenue || 0) / maxRevenue) * 100 : 0;
          
          return (
            <div key={client.id} className="group">
              {/* Client Row */}
              <div className="flex items-center gap-3">
                {/* Name & Revenue */}
                <div className="w-32 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900 truncate" title={client.client_name}>
                    {client.client_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(client.revenue || 0)}/mo
                  </div>
                </div>
                
                {/* Bar */}
                <div className="flex-1 relative h-8">
                  <div className="absolute inset-0 bg-gray-100 rounded overflow-hidden">
                    <div 
                      className={`h-full ${statusColors.bg} transition-all duration-300`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  
                  {/* Margin label on bar */}
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-sm font-medium text-white drop-shadow-sm">
                      {(client.gross_margin_percentage || 0).toFixed(0)}% margin
                    </span>
                  </div>
                </div>
                
                {/* Risk indicators */}
                <div className="w-16 flex justify-end gap-1">
                  {client.concentration_risk && (
                    <span title="Concentration risk (>20% revenue)" className="text-amber-500">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                  )}
                  {client.actual_payment_days && client.payment_terms_days && 
                   client.actual_payment_days > client.payment_terms_days && (
                    <span title="Pays late" className="text-red-500">
                      <Clock className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
              
              {/* Notes (on hover or expanded) */}
              {(client.client_notes || client.team_notes) && expanded && (
                <div className="mt-1 ml-32 pl-3 text-xs text-gray-500 italic border-l-2 border-gray-200">
                  {client.client_notes || client.team_notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Show More/Less */}
      {data.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 border-t"
        >
          {expanded ? (
            <>Show less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show all {data.length} clients <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-gray-500">Total Monthly</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {weightedMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Weighted Margin</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.length}
          </div>
          <div className="text-xs text-gray-500">Active Clients</div>
        </div>
      </div>
      
      {/* Action recommendation for loss-making clients */}
      {statusCounts.loss_making > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {statusCounts.loss_making} client{statusCounts.loss_making !== 1 ? 's are' : ' is'} costing you money
              </p>
              <p className="text-sm text-red-600 mt-1">
                Consider reviewing pricing, scope, or whether to continue the relationship.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

