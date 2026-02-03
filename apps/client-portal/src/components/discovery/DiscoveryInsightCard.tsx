// DiscoveryInsightCard.tsx
// Color-coded insight/recommendation cards for Discovery Assessment
// Matches the visual quality of Business Intelligence reports

import { AlertTriangle, CheckCircle, Info, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

export type InsightPriority = 'critical' | 'warning' | 'opportunity' | 'info' | 'action';

interface DiscoveryInsightCardProps {
  title: string;
  description: string;
  priority?: InsightPriority;
  cost?: string;
  action?: string;
  icon?: React.ReactNode;
}

const priorityConfig: Record<InsightPriority, {
  borderColor: string;
  bgColor: string;
  iconBg: string;
  iconColor: string;
  Icon: typeof AlertTriangle;
}> = {
  critical: {
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    Icon: AlertTriangle,
  },
  opportunity: {
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Icon: TrendingUp,
  },
  info: {
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    Icon: Info,
  },
  action: {
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    Icon: Lightbulb,
  },
};

export function DiscoveryInsightCard({
  title,
  description,
  priority = 'info',
  cost,
  action,
  icon,
}: DiscoveryInsightCardProps) {
  const config = priorityConfig[priority];
  const IconComponent = config.Icon;
  
  return (
    <div 
      className={`
        rounded-xl border-l-4 ${config.borderColor} ${config.bgColor}
        shadow-sm hover:shadow-md transition-shadow duration-200
        overflow-hidden
      `}
    >
      <div className="p-5 md:p-6">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
            {icon || <IconComponent className={`w-5 h-5 ${config.iconColor}`} />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 text-base md:text-lg mb-2">
              {title}
            </h4>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              {description}
            </p>
            
            {/* Cost indicator */}
            {cost && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cost:</span>
                <span className="font-semibold text-red-600">{cost}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action section */}
        {action && (
          <div className="mt-4 pt-4 border-t border-white/50">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-700">
                <span className="font-medium text-emerald-700">Recommended:</span> {action}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Gap Analysis Card - specific variant for displaying gaps
interface GapCardProps {
  gap: string;
  impact: string;
  cost?: string;
  severity?: 'high' | 'medium' | 'low';
}

export function GapCard({ gap, impact, cost, severity = 'medium' }: GapCardProps) {
  const severityColors = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-amber-500 bg-amber-50',
    low: 'border-l-blue-500 bg-blue-50',
  };
  
  return (
    <div className={`rounded-xl border-l-4 ${severityColors[severity]} p-5 md:p-6 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 mb-2">{gap}</h4>
          <p className="text-slate-600 text-sm">{impact}</p>
        </div>
        {cost && (
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Annual Cost</div>
            <div className="font-bold text-red-600 text-lg">{cost}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Cost of Inaction Card - prominent warning display
interface CostOfInactionCardProps {
  annualCost: string;
  description?: string;
  personalCost?: string;
}

export function CostOfInactionCard({ annualCost, description, personalCost }: CostOfInactionCardProps) {
  return (
    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full transform -translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
            Cost of Inaction
          </span>
        </div>
        
        <div className="text-4xl md:text-5xl font-bold mb-4">
          {annualCost}
        </div>
        
        {description && (
          <p className="text-white/90 text-base md:text-lg leading-relaxed mb-4">
            {description}
          </p>
        )}
        
        {personalCost && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-white/80 text-sm italic">
              {personalCost}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Service Recommendation Card
interface ServiceRecommendationCardProps {
  serviceName: string;
  tier?: string;
  investment: string;
  rationale: string;
  priority: number;
  onClick?: () => void;
}

export function ServiceRecommendationCard({
  serviceName,
  tier,
  investment,
  rationale,
  priority,
  onClick,
}: ServiceRecommendationCardProps) {
  return (
    <div 
      className={`
        bg-white rounded-xl border border-slate-200 shadow-sm 
        hover:shadow-md hover:border-emerald-300 
        transition-all duration-200 cursor-pointer overflow-hidden
      `}
      onClick={onClick}
    >
      {/* Priority indicator */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              {priority}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{serviceName}</h4>
              {tier && <span className="text-xs text-slate-500">{tier}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-emerald-600">{investment}</div>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 leading-relaxed">
          {rationale}
        </p>
      </div>
    </div>
  );
}

