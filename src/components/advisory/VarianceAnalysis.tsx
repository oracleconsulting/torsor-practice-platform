import React from 'react';

interface Props {
  revenue: any[];
  costs: any[];
  period: number;
}

const VarianceAnalysis: React.FC<Props> = ({ revenue, costs, period }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Variance Analysis</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">Variance analysis coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Compare actuals vs forecast</p>
      </div>
    </div>
  );
};

export default VarianceAnalysis;

