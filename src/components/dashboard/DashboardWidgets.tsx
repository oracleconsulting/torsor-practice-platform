
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  Clock, 
  Target, 
  TrendingDown, 
  Lightbulb, 
  Zap, 
  Brain,
  FileText,
  Grid,
  Calendar,
  PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStepProps {
  title: string;
  status: 'completed' | 'current' | 'locked';
  description: string;
}

export const ProgressStep = ({ title, status, description }: ProgressStepProps) => {
  const Icon = status === 'completed' ? CheckCircle : status === 'locked' ? Lock : Circle;
  
  return (
    <div className={cn(
      "flex items-start space-x-3 p-3 rounded-lg",
      status === 'current' && "bg-oracle-navy/5 border border-oracle-navy/20"
    )}>
      <Icon className={cn(
        "h-5 w-5 mt-0.5",
        status === 'completed' ? "text-green-600" : 
        status === 'current' ? "text-oracle-navy" : "text-gray-400"
      )} />
      <div className="flex-1">
        <h4 className={cn(
          "font-medium",
          status === 'locked' ? "text-gray-400" : "text-gray-900"
        )}>
          {title}
        </h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

export const StatCard = ({ title, value, subtitle, icon: Icon }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-oracle-navy">{value}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <Icon className="h-8 w-8 text-oracle-navy/60" />
        </div>
      </CardContent>
    </Card>
  );
};

interface InsightItemProps {
  title: string;
  content: string;
  icon: React.ElementType;
}

export const InsightItem = ({ title, content, icon: Icon }: InsightItemProps) => {
  return (
    <div className="flex items-start space-x-3 p-4 bg-oracle-gold/5 rounded-lg border border-oracle-gold/20">
      <Icon className="h-5 w-5 text-oracle-gold mt-0.5" />
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{content}</p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action}
    </div>
  );
};

interface ResourceCardProps {
  title: string;
  type: string;
  description: string;
  icon: React.ElementType;
}

export const ResourceCard = ({ title, type, description, icon: Icon }: ResourceCardProps) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-oracle-navy mt-1" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <Badge variant="secondary" className="text-xs">{type}</Badge>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};
