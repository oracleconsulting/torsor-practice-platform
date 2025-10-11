import React from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showFill?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = 'rgb(59, 130, 246)', // blue-500
  fillColor = 'rgba(59, 130, 246, 0.1)',
  showFill = true,
  className = '',
}) => {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Create SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const fillPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block', className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {showFill && (
        <path
          d={fillPath}
          fill={fillColor}
          strokeWidth="0"
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  color = 'rgb(34, 197, 94)', // green-500
  backgroundColor = 'rgb(229, 231, 235)', // gray-200
  showLabel = false,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute text-xs font-semibold">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  format?: (value: number) => string;
  showArrow?: boolean;
  className?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  previousValue,
  format = (v) => v.toFixed(1),
  showArrow = true,
  className = '',
}) => {
  if (previousValue === undefined) {
    return <span className={className}>{format(value)}</span>;
  }

  const change = value - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="font-semibold">{format(value)}</span>
      {change !== 0 && (
        <span
          className={cn(
            'text-xs flex items-center gap-0.5',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600'
          )}
        >
          {showArrow && (
            <span className="text-[10px]">
              {isPositive ? '↑' : '↓'}
            </span>
          )}
          {Math.abs(percentChange).toFixed(1)}%
        </span>
      )}
    </div>
  );
};

interface MiniBarChartProps {
  data: number[];
  width?: number;
  height?: number;
  barGap?: number;
  color?: string;
  className?: string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  width = 100,
  height = 30,
  barGap = 2,
  color = 'rgb(59, 130, 246)',
  className = '',
}) => {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const barWidth = (width - (data.length - 1) * barGap) / data.length;

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * height;
        const x = index * (barWidth + barGap);
        const y = height - barHeight;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx="1"
          />
        );
      })}
    </svg>
  );
};

