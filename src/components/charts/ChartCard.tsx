/**
 * Reusable ChartCard wrapper component
 * Provides consistent card layout for charts with error handling
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  error?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  children,
  error = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center py-8 text-gray-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Unable to display chart. Data may be incomplete.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

