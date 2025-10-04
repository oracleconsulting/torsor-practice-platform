import React from 'react';

interface Props {
  baseData: any;
  scenarios: any[];
  onUpdate: (scenarios: any[]) => void;
}

const ScenarioPlanner: React.FC<Props> = ({ baseData, scenarios, onUpdate }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Scenario Planning</h3>
      <div className="text-center py-12">
        <p className="text-gray-600">Scenario planning interface coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Model best/expected/worst case scenarios</p>
      </div>
    </div>
  );
};

export default ScenarioPlanner;

