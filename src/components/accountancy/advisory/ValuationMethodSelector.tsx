import React from 'react';

interface Props {
  methods: any[];
  selectedMethods: string[];
  onMethodsChange: (methods: string[]) => void;
  onWeightsChange: (methods: any[]) => void;
}

const ValuationMethodSelector: React.FC<Props> = ({ methods, selectedMethods, onMethodsChange, onWeightsChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Valuation Methods</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">Valuation method selector coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Choose and weight different valuation approaches</p>
      </div>
    </div>
  );
};

export default ValuationMethodSelector;

