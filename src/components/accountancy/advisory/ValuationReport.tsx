import React from 'react';

interface Props {
  valuationData: any;
  weightedValue: number;
  range: { min: number; max: number };
  purpose: string;
}

const ValuationReport: React.FC<Props> = ({ valuationData, weightedValue, range, purpose }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Valuation Report</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">Valuation report generator coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Generate comprehensive valuation reports</p>
      </div>
    </div>
  );
};

export default ValuationReport;

