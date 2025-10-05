import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScaleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const ValuationPage: React.FC = () => {
  const navigate = useNavigate();
  const [valuationPurpose, setValuationPurpose] = useState<string>('sale');

  const purposeOptions = [
    { value: 'sale', label: 'Business Sale' },
    { value: 'investment', label: 'Investment/Fundraising' },
    { value: 'succession', label: 'Succession Planning' },
    { value: 'divorce', label: 'Divorce Proceedings' },
    { value: 'tax', label: 'Tax Planning' },
    { value: 'internal', label: 'Internal Planning' }
  ];

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
              <h1 className="text-3xl font-bold text-gray-900">Business Valuation</h1>
              <p className="mt-1 text-gray-600">Professional business valuation analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={valuationPurpose}
              onChange={(e) => setValuationPurpose(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {purposeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Generate Valuation
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-12">
        <div className="text-center">
          <ScaleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Valuation Coming Soon</h3>
          <p className="text-gray-600">
            This comprehensive valuation tool will include:
          </p>
          <ul className="mt-4 space-y-2 text-left max-w-md mx-auto text-gray-600">
            <li>• Multiple valuation methods</li>
            <li>• Market comparables analysis</li>
            <li>• DCF modeling</li>
            <li>• Asset-based valuation</li>
            <li>• Exit planning scenarios</li>
            <li>• Valuation report & certificate</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValuationPage;

