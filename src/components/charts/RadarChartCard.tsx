/**
 * Reusable RadarChartCard component
 * Handles radar charts with data validation
 */

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { ChartCard } from './ChartCard';
import { LucideIcon } from 'lucide-react';

interface DataItem {
  [key: string]: string | number;
}

interface RadarChartCardProps {
  title: string;
  description?: string | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  data: DataItem[];
  dataKey: string;
  angleKey: string;
  radarColor?: string;
  radarFillOpacity?: number;
  height?: number;
  domainMax?: number;
}

export const RadarChartCard: React.FC<RadarChartCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  data,
  dataKey,
  angleKey,
  radarColor = '#3b82f6',
  radarFillOpacity = 0.6,
  height = 400,
  domainMax
}) => {
  try {
    // Validate data
    const validData = data.filter(item => {
      const value = Number(item[dataKey]);
      return Number.isFinite(value) && value >= 0 && item[angleKey];
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

    // Need at least 3 points for a meaningful radar chart
    if (validData.length < 3) {
      return (
        <ChartCard title={title} description={description} icon={icon} iconColor={iconColor}>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Not enough data points for radar chart</p>
            <div className="space-y-2">
              {validData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <span className="font-medium">{item[angleKey]}</span>
                  <span className="text-blue-600 font-bold">{item[dataKey]}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      );
    }

    return (
      <ChartCard title={title} description={description} icon={icon} iconColor={iconColor}>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={validData}>
            <PolarGrid />
            <PolarAngleAxis dataKey={angleKey} />
            {domainMax && <PolarRadiusAxis domain={[0, domainMax]} />}
            <Radar
              name={dataKey}
              dataKey={dataKey}
              stroke={radarColor}
              fill={radarColor}
              fillOpacity={radarFillOpacity}
              isAnimationActive={false}
            />
            <RechartsTooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  } catch (error) {
    console.error(`[RadarChartCard] Error rendering ${title}:`, error);
    return <ChartCard title={title} description={description} icon={icon} iconColor={iconColor} error />;
  }
};

