import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface Props {
  data: any;
  period: number;
  onUpdate: (data: any) => void;
}

const ForecastBuilder: React.FC<Props> = ({ data, period, onUpdate }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Forecast Builder</h3>
        <ChartBarIcon className="w-6 h-6 text-gray-400" />
      </div>
      <div className="text-center py-12">
        <p className="text-gray-600">Forecast builder interface coming soon</p>
        <p className="text-sm text-gray-500 mt-2">Build and customize financial forecasts with interactive charts</p>
      </div>
    </div>
  );
};

export default ForecastBuilder;

