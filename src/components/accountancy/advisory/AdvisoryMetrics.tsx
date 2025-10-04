import React, { useEffect, useState } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyPoundIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabase/client';

interface Props {
  practiceId: string;
}

const AdvisoryMetrics: React.FC<Props> = ({ practiceId }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [practiceId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch engagement data for metrics
      const { data: engagements } = await supabase
        .from('advisory_engagements')
        .select('*')
        .eq('practice_id', practiceId);

      const activeEngagements = engagements?.filter(e => e.status === 'active') || [];
      const completedEngagements = engagements?.filter(e => e.status === 'completed') || [];
      
      const totalRevenue = engagements?.reduce((sum, e) => sum + (e.total_value || 0), 0) || 0;
      const avgValue = engagements && engagements.length > 0 
        ? totalRevenue / engagements.length 
        : 0;

      setMetrics({
        totalEngagements: engagements?.length || 0,
        activeEngagements: activeEngagements.length,
        completedEngagements: completedEngagements.length,
        totalRevenue,
        avgValue,
        completionRate: engagements && engagements.length > 0
          ? (completedEngagements.length / engagements.length * 100).toFixed(1)
          : 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center py-12 text-gray-600">Unable to load metrics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                £{metrics.totalRevenue.toLocaleString()}
              </p>
            </div>
            <CurrencyPoundIcon className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Engagement Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                £{metrics.avgValue.toLocaleString()}
              </p>
            </div>
            <ChartBarIcon className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics.completionRate}%
              </p>
            </div>
              <ArrowTrendingUpIcon className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Engagement Status Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="font-medium text-gray-900">Active Engagements</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{metrics.activeEngagements}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({((metrics.activeEngagements / metrics.totalEngagements) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="font-medium text-gray-900">Completed Engagements</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{metrics.completedEngagements}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({((metrics.completedEngagements / metrics.totalEngagements) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="font-medium text-gray-900">Total Engagements</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{metrics.totalEngagements}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryMetrics;

