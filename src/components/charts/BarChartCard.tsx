/**
 * Reusable BarChartCard component
 * Handles bar charts with automatic fallbacks for small datasets
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import { ChartCard } from './ChartCard';
import { LucideIcon } from 'lucide-react';

interface DataItem {
  [key: string]: string | number;
}

interface BarChartCardProps {
  title: string;
  description?: string | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  data: DataItem[];
  dataKey: string;
  xAxisKey: string;
  barColor?: string;
  height?: number;
  singleItemColor?: string;
  fallbackMessage?: string;
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  data,
  dataKey,
  xAxisKey,
  barColor = '#3b82f6',
  height = 250,
  singleItemColor = 'bg-blue-100 text-blue-600',
  fallbackMessage
}) => {
  try {
    // Validate data
    const validData = data.filter(item => {
      const value = Number(item[dataKey]);
      return Number.isFinite(value) && value > 0;
    });

    if (validData.length === 0) {
      return (
        <ChartCard title={title} description={description} icon={icon} iconColor={iconColor} error>
          <div className="text-center py-8 text-gray-600">
            No data available to display
          </div>
        </ChartCard>
      );
    }

    // Single item fallback
    if (validData.length === 1) {
      const item = validData[0];
      return (
        <ChartCard title={title} description={description} icon={icon} iconColor={iconColor}>
          <div className="text-center py-8">
            <div className={`inline-block px-8 py-4 ${singleItemColor} rounded-lg`}>
              <div className="text-3xl font-bold mb-2">{item[dataKey]}</div>
              <div className="text-lg font-medium text-gray-900">{item[xAxisKey]}</div>
            </div>
            {fallbackMessage && (
              <p className="text-sm text-gray-600 mt-4">{fallbackMessage}</p>
            )}
          </div>
        </ChartCard>
      );
    }

    // Full bar chart
    return (
      <ChartCard title={title} description={description} icon={icon} iconColor={iconColor}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={validData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis allowDecimals={false} />
            <RechartsTooltip />
            <Bar dataKey={dataKey} fill={barColor} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  } catch (error) {
    console.error(`[BarChartCard] Error rendering ${title}:`, error);
    return <ChartCard title={title} description={description} icon={icon} iconColor={iconColor} error />;
  }
};

