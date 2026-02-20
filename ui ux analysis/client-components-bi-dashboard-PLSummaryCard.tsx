'use client';

interface PLSummaryProps {
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
}

export function PLSummaryCard({
  revenue,
  grossProfit,
  operatingProfit,
  netProfit,
  grossMargin,
  operatingMargin,
  netMargin
}: PLSummaryProps) {
  const getMarginStatus = (margin: number, target: number): 'good' | 'warning' | 'critical' => {
    if (margin >= target) return 'good';
    if (margin >= target * 0.8) return 'warning';
    return 'critical';
  };
  
  const margins = [
    { label: 'Gross', value: grossMargin, target: 50, amount: grossProfit },
    { label: 'Operating', value: operatingMargin, target: 15, amount: operatingProfit },
    { label: 'Net', value: netMargin, target: 10, amount: netProfit }
  ];
  
  const formatCurrency = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}m`;
    }
    return `£${value.toLocaleString()}`;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 P&L Summary
      </h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Revenue</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(revenue)}
        </p>
      </div>
      
      <div className="space-y-4">
        {margins.map(margin => {
          const status = getMarginStatus(margin.value, margin.target);
          const statusColors = {
            good: 'bg-emerald-500',
            warning: 'bg-amber-500',
            critical: 'bg-red-500'
          };
          
          return (
            <div key={margin.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-gray-600">{margin.label} Margin</span>
                <span className="font-semibold">
                  {margin.value.toFixed(1)}%
                  <span className="text-gray-400 font-normal ml-2">
                    ({formatCurrency(margin.amount)})
                  </span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${statusColors[status]}`}
                  style={{ width: `${Math.min(Math.max(margin.value, 0), 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Target: {margin.target}%+</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PLSummaryCard;


