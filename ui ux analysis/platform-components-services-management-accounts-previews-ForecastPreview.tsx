import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ForecastPreviewProps {
  weeks?: number;
  criticalDate?: {
    week: string;
    event: string;
    lowestPoint: number;
  };
  // Sample data points for visual
  dataPoints?: Array<{
    week: string;
    amount: number;
  }>;
}

export function ForecastPreview({ 
  weeks = 13, 
  criticalDate,
  dataPoints 
}: ForecastPreviewProps) {
  // Generate sample data if not provided
  const sampleData = dataPoints || [
    { week: 'W1', amount: 65000 },
    { week: 'W2', amount: 58000 },
    { week: 'W3', amount: 72000 },
    { week: 'W4', amount: 55000 },
    { week: 'W5', amount: 48000 },
    { week: 'W6', amount: 42000 },
    { week: 'W7', amount: 38000 },
    { week: 'W8', amount: criticalDate?.lowestPoint || 18370 },
    { week: 'W9', amount: 35000 },
    { week: 'W10', amount: 45000 },
    { week: 'W11', amount: 52000 },
    { week: 'W12', amount: 58000 },
    { week: 'W13', amount: 62000 },
  ];

  const maxAmount = Math.max(...sampleData.map(d => d.amount));
  const minAmount = Math.min(...sampleData.map(d => d.amount));
  const lowestWeek = sampleData.find(d => d.amount === minAmount);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h4 className="font-semibold text-lg mb-4 text-gray-900">
        Your Cash Over the Next {weeks} Weeks
      </h4>
      
      {/* Simple bar chart visualization */}
      <div className="h-48 flex items-end justify-between gap-1 px-2 mb-4 border-b border-gray-200">
        {sampleData.map((point, i) => {
          const height = ((point.amount - minAmount + 5000) / (maxAmount - minAmount + 10000)) * 100;
          const isLowest = point.amount === minAmount;
          
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <div 
                className={`w-full rounded-t transition-all ${
                  isLowest ? 'bg-red-400' : 'bg-blue-400'
                }`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${point.week}: £${point.amount.toLocaleString()}`}
              />
              <span className="text-xs text-gray-400 mt-1 hidden sm:block">
                {i % 2 === 0 ? point.week : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-500 mb-4 px-2">
        <span>£{minAmount.toLocaleString()}</span>
        <span>£{maxAmount.toLocaleString()}</span>
      </div>
      
      {/* Critical date warning */}
      {criticalDate && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              WATCH: Week of {criticalDate.week}
            </p>
            <p className="text-sm text-amber-700">
              {criticalDate.event} - cash drops to £{criticalDate.lowestPoint.toLocaleString()}
            </p>
            <p className="text-sm text-amber-600 mt-1">
              Action: Accelerate debtor collection before this date
            </p>
          </div>
        </div>
      )}

      {!criticalDate && lowestWeek && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">
              Lowest Point: {lowestWeek.week}
            </p>
            <p className="text-sm text-blue-700">
              Cash position reaches £{lowestWeek.amount.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForecastPreview;

