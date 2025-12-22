import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface NarrativeSectionProps {
  type: 'position' | 'strengths' | 'gaps' | 'opportunity';
  title: string;
  content: string;
  highlights?: string[];
  expandable?: boolean;
}

const sectionConfig = {
  position: {
    icon: Target,
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  strengths: {
    icon: TrendingUp,
    color: 'emerald',
    bgGradient: 'from-emerald-50 to-emerald-100/50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200'
  },
  gaps: {
    icon: AlertTriangle,
    color: 'rose',
    bgGradient: 'from-rose-50 to-rose-100/50',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200'
  },
  opportunity: {
    icon: Lightbulb,
    color: 'amber',
    bgGradient: 'from-amber-50 to-amber-100/50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200'
  }
};

export function NarrativeSection({
  type,
  title,
  content,
  highlights,
  expandable = true
}: NarrativeSectionProps) {
  const [expanded, setExpanded] = useState(!expandable);
  const config = sectionConfig[type];
  const Icon = config.icon;
  
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const preview = paragraphs[0];
  const rest = paragraphs.slice(1);

  return (
    <div className={`rounded-xl border ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.bgGradient} p-6`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.iconBg}`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
            
            {/* Preview Paragraph */}
            <p className="text-slate-700 leading-relaxed">{preview}</p>
            
            {/* Highlights */}
            {highlights && highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {highlights.map((highlight, i) => (
                  <span 
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${config.iconBg} ${config.iconColor}`}
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Expandable Content */}
      {expandable && rest.length > 0 && (
        <>
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
            <div className="p-6 pt-0 space-y-4">
              {rest.map((paragraph, i) => (
                <p key={i} className="text-slate-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Read more
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

