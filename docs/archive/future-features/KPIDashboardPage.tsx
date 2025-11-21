import React from 'react';
import { KPIDashboard } from '@/components/accountancy/kpi/KPIDashboard';

const KPIDashboardPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          KPI Dashboard
        </h1>
        <p className="text-gray-400">
          Monitor your practice performance with key metrics and insights
        </p>
      </div>
      <KPIDashboard />
    </div>
  );
};

export default KPIDashboardPage; 