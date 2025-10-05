import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ForecastingPage: React.FC = () => {
  const navigate = useNavigate();
  const [forecastPeriod, setForecastPeriod] = useState<6 | 12 | 24>(12);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/accountancy/portal/advisory-services')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Forecasting & Budgets</h1>
              <p className="mt-1 text-gray-600">Comprehensive financial projections and scenario planning</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(Number(e.target.value) as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={24}>24 Months</option>
            </select>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Generate Forecast
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-12">
        <div className="text-center">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Forecasting Coming Soon</h3>
          <p className="text-gray-600">
            This comprehensive forecasting tool will include:
          </p>
          <ul className="mt-4 space-y-2 text-left max-w-md mx-auto text-gray-600">
            <li>• 12-month rolling forecasts</li>
            <li>• Scenario planning (best/worst/expected)</li>
            <li>• Cash flow waterfall analysis</li>
            <li>• Variance analysis vs actuals</li>
            <li>• KPI projections</li>
            <li>• Break-even analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForecastingPage;

