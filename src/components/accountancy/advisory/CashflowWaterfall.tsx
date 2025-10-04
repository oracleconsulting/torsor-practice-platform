import React from 'react';

interface Props {
  data: any[];
  period: number;
}

const CashflowWaterfall: React.FC<Props> = ({ data, period }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Cashflow Waterfall Analysis</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">Cashflow waterfall chart coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Visualize cash movements over time</p>
      </div>
    </div>
  );
};

export default CashflowWaterfall;

