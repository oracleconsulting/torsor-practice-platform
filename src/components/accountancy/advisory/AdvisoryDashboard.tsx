import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  TrendingUpIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase/client';

interface Props {
  practiceId: string;
}

const AdvisoryDashboard: React.FC<Props> = ({ practiceId }) => {
  const [engagements, setEngagements] = useState<any[]>([]);
  const [upcomingDeliverables, setUpcomingDeliverables] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [practiceId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch active engagements
      const { data: engagementsData } = await supabase
        .from('advisory_engagements')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setEngagements(engagementsData || []);
      
      // Fetch upcoming deliverables
      const { data: deliverablesData } = await supabase
        .from('advisory_deliverables')
        .select('*')
        .eq('practice_id', practiceId)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);
      
      setUpcomingDeliverables(deliverablesData || []);
      
      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('advisory_activity')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setRecentActivity(activityData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Engagements */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Active Engagements</h3>
          <ChartBarIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {engagements.length === 0 ? (
            <p className="text-gray-500 text-sm">No active engagements</p>
          ) : (
            engagements.map((engagement) => (
              <div key={engagement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{engagement.client_name}</p>
                  <p className="text-sm text-gray-600">{engagement.service_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">£{engagement.value?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{engagement.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Deliverables */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Deliverables</h3>
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {upcomingDeliverables.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming deliverables</p>
          ) : (
            upcomingDeliverables.map((deliverable) => (
              <div key={deliverable.id} className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{deliverable.title}</p>
                  <p className="text-sm text-gray-600">{deliverable.client_name}</p>
                  <p className="text-xs text-gray-500">
                    Due: {new Date(deliverable.due_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  deliverable.priority === 'high' 
                    ? 'bg-red-100 text-red-800'
                    : deliverable.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {deliverable.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <DocumentChartBarIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisoryDashboard;

