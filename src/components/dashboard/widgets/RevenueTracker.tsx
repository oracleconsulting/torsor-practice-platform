import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueTrackerProps {
  metrics?: {
    revenue: number;
    growth: number;
    health: number;
    energy: number;
  };
}

export function RevenueTracker({ metrics }: RevenueTrackerProps) {
  // Use actual data from metrics, with fallbacks
  const revenue = metrics?.revenue || 0;
  const growth = metrics?.growth || 0;
  const isPositiveGrowth = growth >= 0;

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">
          💰 Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-white">
            £{revenue.toLocaleString()}
          </div>
          <div className={`flex items-center text-sm ${
            isPositiveGrowth ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositiveGrowth ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {Math.abs(growth)}% from last month
          </div>
          {revenue === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              No revenue data available. Add financial data in settings.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 