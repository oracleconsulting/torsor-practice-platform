import React from 'react';

interface Props {
  financialData: any;
  onUpdate: (data: any) => void;
}

const DCFCalculator: React.FC<Props> = ({ financialData, onUpdate }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">DCF Calculator</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">DCF calculator coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Discounted cash flow valuation modeling</p>
      </div>
    </div>
  );
};

export default DCFCalculator;

