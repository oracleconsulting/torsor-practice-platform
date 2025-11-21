/**
 * Reusable PieChartCard component
 * Handles pie charts with automatic fallbacks for small datasets
 */

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { LucideIcon } from 'lucide-react';
import { CHART_COLORS } from '@/utils/team-insights/helpers';

interface DataItem {
  [key: string]: string | number;
}

interface PieChartCardProps {
  title: string;
  description?: string | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  data: DataItem[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  height?: number;
  singleItemColor?: string;
  fallbackMessage?: string;
}

export const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  data,
  dataKey,
  nameKey,
  colors = CHART_COLORS,
  height = 300,
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
              <div className="text-lg font-medium text-gray-900">{item[nameKey]}</div>
            </div>
            {fallbackMessage && (
              <p className="text-sm text-gray-600 mt-4">{fallbackMessage}</p>
            )}
          </div>
        </ChartCard>
      );
    }

    // Small dataset - use list view (2-3 items)
    if (validData.length <= 3) {
      return (
        <ChartCard title={title} description={description} icon={icon} iconColor={iconColor}>
          <div className="space-y-4">
            {validData.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 ${singleItemColor.split(' ')[0]} rounded-lg`}
              >
                <span className="font-medium text-gray-900">{item[nameKey]}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${singleItemColor.split(' ')[1]}`}>
                    {item[dataKey]}
                  </span>
                  <span className="text-sm text-gray-600">
                    item{Number(item[dataKey]) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      );
    }

    // Full pie chart for 4+ items
    return (
      <ChartCard title={title} description={description} icon={icon} iconColor={iconColor}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={validData}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(100, height / 3)}
              isAnimationActive={false}
              label={false}
            >
              {validData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Legend />
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  } catch (error) {
    console.error(`[PieChartCard] Error rendering ${title}:`, error);
    return <ChartCard title={title} description={description} icon={icon} iconColor={iconColor} error />;
  }
};

