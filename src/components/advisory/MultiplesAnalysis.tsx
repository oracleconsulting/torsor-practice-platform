import React from 'react';

interface Props {
  comparables: any[];
  financialData: any;
  onUpdate: (value: number) => void;
}

const MultiplesAnalysis: React.FC<Props> = ({ comparables, financialData, onUpdate }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Multiples Analysis</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">Multiples analysis coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Compare against market comparables</p>
      </div>
    </div>
  );
};

export default MultiplesAnalysis;

