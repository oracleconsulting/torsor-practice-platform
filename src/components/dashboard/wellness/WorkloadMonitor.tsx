import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { WellnessApiService } from '@/services/wellness/wellnessApiService';
import type { WorkloadMetrics } from '@/types/wellness';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WorkloadMonitorProps {
  staffId: string;
  className?: string;
}

export const WorkloadMonitor: React.FC<WorkloadMonitorProps> = ({
  staffId,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<WorkloadMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wellnessService = WellnessApiService.getInstance();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days

        const data = await wellnessService.getWorkloadMetrics(staffId, {
          start: startDate,
          end: endDate
        });
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workload data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [staffId]);

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) return null;

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Actual Hours',
        data: [metrics.hours.actual],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Contracted Hours',
        data: [metrics.hours.contracted],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Workload Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 bg-white rounded-lg shadow-md ${className}`}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Workload Monitor</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Current Capacity</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  {metrics.capacity.current}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {metrics.capacity.recommendedMax}% max
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${metrics.capacity.current}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Work Pattern</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Start Time</span>
              <span className="font-medium">{metrics.patterns.averageStartTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">End Time</span>
              <span className="font-medium">{metrics.patterns.averageEndTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Late Nights</span>
              <span className="font-medium">{metrics.patterns.lateNights}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Workload Insights</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          {metrics.patterns.consecutiveDays > 5 && (
            <li>• {metrics.patterns.consecutiveDays} consecutive days without a break</li>
          )}
          {metrics.patterns.weekendWork > 0 && (
            <li>• {metrics.patterns.weekendWork} hours of weekend work</li>
          )}
          {metrics.workloadIndex > 1.2 && (
            <li>• Workload exceeds contracted hours by {(metrics.workloadIndex - 1) * 100}%</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}; 