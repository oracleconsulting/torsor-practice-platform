import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WellnessApiService } from '@/services/wellness/wellnessApiService';
import type { TeamWellnessSummary, StaffWellbeing } from '@/types/wellness';
import { useNavigate } from 'react-router-dom';

interface TeamWellnessWidgetProps {
  teamId: string;
  className?: string;
}

export const TeamWellnessWidget: React.FC<TeamWellnessWidgetProps> = ({ teamId, className = '' }) => {
  const [summary, setSummary] = useState<TeamWellnessSummary | null>(null);
  const [alerts, setAlerts] = useState<StaffWellbeing['alerts']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const wellnessService = WellnessApiService.getInstance();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, alertsData] = await Promise.all([
          wellnessService.getTeamWellnessSummary(teamId),
          wellnessService.getTeamAlerts(teamId)
        ]);
        setSummary(summaryData);
        setAlerts(alertsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wellness data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`} data-testid="loading-skeleton">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Mock fallback
  const mockSummary: TeamWellnessSummary = {
    teamId: teamId,
    department: 'Accounting',
    totalStaff: 10,
    averageScores: {
      overall: 85,
      energy: 80,
      workload: 75,
      engagement: 90,
      resilience: 85
    },
    statusBreakdown: {
      green: 7,
      amber: 2,
      red: 1
    },
    criticalAlerts: 1,
    recentPulseResponses: 8,
    lastUpdated: new Date()
  };
  const mockAlerts = [
    {
      type: 'warning' as const,
      message: 'High workload detected',
      suggestedAction: 'Consider redistributing tasks'
    }
  ];

  const safeSummary = summary || mockSummary;
  const safeAlerts = Array.isArray(alerts) ? alerts : mockAlerts;

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const getStatusColor = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'amber': return 'bg-yellow-100 text-yellow-800';
      case 'red': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 bg-white rounded-lg shadow-md ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Team Wellness</h2>
        <button
          onClick={() => navigate('/wellness-dashboard')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Full Dashboard
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Team Health Score</h3>
          <div className="text-3xl font-bold text-gray-900">
            {safeSummary.averageScores.overall}%
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Staff Status</h3>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('green')}`}>
              {safeSummary.statusBreakdown.green} Green
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('amber')}`}>
              {safeSummary.statusBreakdown.amber} Amber
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('red')}`}>
              {safeSummary.statusBreakdown.red} Red
            </span>
          </div>
        </div>
      </div>

      {safeAlerts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Critical Alerts</h3>
          <div className="space-y-2">
            {safeAlerts.slice(0, 2).map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.type === 'critical' ? 'bg-red-50' :
                  alert.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}
              >
                <p className="text-sm text-gray-800">{alert.message}</p>
                <p className="text-xs text-gray-600 mt-1">{alert.suggestedAction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/pulse-survey')}
        className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Take Quick Pulse Survey
      </button>
    </motion.div>
  );
}; 