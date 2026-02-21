/**
 * True Cash Waterfall
 * Visual breakdown of True Cash position
 * Shows the journey from bank balance to actual available cash
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import type { BIFinancialData, RAGStatus } from '../../types/business-intelligence';

interface TrueCashWaterfallProps {
  financialData: BIFinancialData | null;
  trueCash?: number;
  cashRunway?: number;
  editable?: boolean;
  onEdit?: () => void;
}

export function TrueCashWaterfall({
  financialData,
  trueCash: providedTrueCash,
  cashRunway: providedRunway,
  editable,
  onEdit
}: TrueCashWaterfallProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!financialData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">True Cash Position</h3>
        <p className="text-gray-500">No financial data available yet.</p>
      </div>
    );
  }
  
  // Calculate values
  const cashAtBank = financialData.cash_at_bank || 0;
  const vatLiability = financialData.vat_liability || 0;
  const payeLiability = financialData.paye_liability || 0;
  const corpTaxLiability = financialData.corporation_tax_liability || 0;
  const committedPayments = financialData.committed_payments || 0;
  const confirmedReceivables = financialData.confirmed_receivables || 0;
  const monthlyOpCosts = financialData.monthly_operating_costs || 1;
  
  const totalLiabilities = vatLiability + payeLiability + corpTaxLiability + committedPayments;
  const trueCash = providedTrueCash ?? (cashAtBank - totalLiabilities + confirmedReceivables);
  const runway = providedRunway ?? (monthlyOpCosts > 0 ? trueCash / monthlyOpCosts : 0);
  const trueCashPercentage = cashAtBank > 0 ? (trueCash / cashAtBank) * 100 : 0;
  
  // Determine RAG status
  let ragStatus: RAGStatus = 'green';
  if (runway < 1 || trueCash < 0) ragStatus = 'red';
  else if (runway < 3) ragStatus = 'amber';
  
  const ragColors = {
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' },
    amber: { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' },
    neutral: { bg: 'bg-gray-400', text: 'text-gray-600', light: 'bg-gray-50', border: 'border-gray-200' }
  };
  
  const colors = ragColors[ragStatus];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Runway message
  const getRunwayMessage = () => {
    if (runway < 1) {
      const days = Math.max(0, Math.round(runway * 30));
      return { text: `${days} days`, urgent: true };
    }
    return { text: `${runway.toFixed(1)} months`, urgent: false };
  };
  
  const runwayInfo = getRunwayMessage();
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">True Cash Position</h3>
          <p className="text-sm text-gray-500">What you actually have available</p>
        </div>
        
        <div className="flex items-center gap-2">
          {ragStatus === 'red' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Critical</span>
            </div>
          )}
          {ragStatus === 'amber' && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Warning</span>
            </div>
          )}
          {editable && (
            <button onClick={onEdit} className="text-gray-400 hover:text-gray-600 p-1">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Visual Waterfall */}
      <div className="relative h-16 mb-6 rounded-lg overflow-hidden">
        {/* Bank balance (full width background) */}
        <div className="absolute inset-0 bg-blue-100 flex items-center px-4">
          <span className="text-blue-800 font-medium text-sm md:text-base">
            Bank: {formatCurrency(cashAtBank)}
          </span>
        </div>
        
        {/* Liabilities overlay (from right) */}
        {totalLiabilities > 0 && cashAtBank > 0 && (
          <div 
            className="absolute right-0 top-0 bottom-0 bg-red-200 flex items-center justify-end px-4"
            style={{ width: `${Math.min((totalLiabilities / cashAtBank) * 100, 100)}%` }}
          >
            <span className="text-red-800 font-medium text-sm">
              -{formatCurrency(totalLiabilities)}
            </span>
          </div>
        )}
        
        {/* True cash indicator */}
        <div 
          className={`absolute left-0 top-0 bottom-0 ${colors.bg} flex items-center px-4 transition-all duration-500`}
          style={{ width: `${Math.max(Math.min(trueCashPercentage, 100), 10)}%` }}
        >
          <span className="text-white font-bold text-sm md:text-base truncate">
            {formatCurrency(trueCash)}
          </span>
        </div>
      </div>
      
      {/* True Cash Value */}
      <div className="text-center mb-6">
        <div className={`text-4xl md:text-5xl font-bold ${colors.text}`}>
          {formatCurrency(trueCash)}
        </div>
        <div className="text-gray-500 mt-1">True Cash</div>
        
        {/* Runway */}
        <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.light} ${colors.border} border`}>
          {runwayInfo.urgent ? (
            <TrendingDown className={`w-4 h-4 ${colors.text}`} />
          ) : (
            <TrendingUp className="w-4 h-4 text-gray-500" />
          )}
          <span className={`font-semibold ${runwayInfo.urgent ? colors.text : 'text-gray-700'}`}>
            {runwayInfo.text}
          </span>
          <span className="text-gray-500">runway</span>
        </div>
      </div>
      
      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2 border-t"
      >
        <span className="text-sm">{expanded ? 'Hide breakdown' : 'Show breakdown'}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {/* Breakdown */}
      {expanded && (
        <div className="mt-4 space-y-3 pt-4 border-t">
          {/* Starting point */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Cash at bank</span>
            <span className="font-semibold text-blue-600">{formatCurrency(cashAtBank)}</span>
          </div>
          
          {/* Deductions */}
          <div className="border-l-2 border-red-200 pl-3 space-y-2 ml-2">
            {vatLiability > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Less: VAT liability</span>
                <span className="font-medium text-red-600">-{formatCurrency(vatLiability)}</span>
              </div>
            )}
            {payeLiability > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Less: PAYE liability</span>
                <span className="font-medium text-red-600">-{formatCurrency(payeLiability)}</span>
              </div>
            )}
            {corpTaxLiability > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Less: Corporation Tax</span>
                <span className="font-medium text-red-600">-{formatCurrency(corpTaxLiability)}</span>
              </div>
            )}
            {committedPayments > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Less: Committed payments</span>
                <span className="font-medium text-red-600">-{formatCurrency(committedPayments)}</span>
              </div>
            )}
          </div>
          
          {/* Additions */}
          {confirmedReceivables > 0 && (
            <div className="border-l-2 border-green-200 pl-3 ml-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Add: Confirmed receivables</span>
                <span className="font-medium text-green-600">+{formatCurrency(confirmedReceivables)}</span>
              </div>
            </div>
          )}
          
          {/* Total */}
          <div className="flex justify-between items-center text-sm font-bold border-t pt-3 mt-3">
            <span>True Cash</span>
            <span className={colors.text}>{formatCurrency(trueCash)}</span>
          </div>
          
          {/* Calculation note */}
          <p className="text-xs text-gray-400 mt-2">
            True Cash = Bank - (VAT + PAYE + Corp Tax + Committed) + Confirmed Receivables
          </p>
        </div>
      )}
    </div>
  );
}

