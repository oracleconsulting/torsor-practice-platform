import { ArrowRight, Calendar } from 'lucide-react';
import type { TwoPathsNarrative } from '../../types/opportunity-calculations';

interface TwoPathsSectionProps {
  marginOpportunity: number;
  valueGap: number;
  ownerName: string;
  narrative: TwoPathsNarrative;
}

export function TwoPathsSection({ marginOpportunity, valueGap, ownerName, narrative }: TwoPathsSectionProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-8 text-white">
      <h3 className="text-2xl font-bold mb-2">{narrative.headline}</h3>
      
      {/* Two numbers */}
      <div className="grid grid-cols-2 gap-6 my-6">
        <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-3xl font-bold text-emerald-400">
            {formatCurrency(marginOpportunity)}
          </div>
          <div className="text-sm text-blue-200">Annual margin opportunity</div>
          <div className="text-xs text-blue-300 mt-1">Operational improvement</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-3xl font-bold text-amber-400">
            {formatCurrency(valueGap)}
          </div>
          <div className="text-sm text-blue-200">Trapped value</div>
          <div className="text-xs text-blue-300 mt-1">Structural issues</div>
        </div>
      </div>
      
      {/* Connection flow */}
      <div className="flex items-center justify-center gap-2 my-6 text-sm flex-wrap">
        <span className="bg-emerald-500/20 px-3 py-1 rounded border border-emerald-500/30">Better margins</span>
        <ArrowRight className="w-4 h-4 text-blue-300" />
        <span className="bg-blue-500/20 px-3 py-1 rounded border border-blue-500/30">Fund diversification</span>
        <ArrowRight className="w-4 h-4 text-blue-300" />
        <span className="bg-purple-500/20 px-3 py-1 rounded border border-purple-500/30">Reduce risk</span>
        <ArrowRight className="w-4 h-4 text-blue-300" />
        <span className="bg-amber-500/20 px-3 py-1 rounded border border-amber-500/30">Unlock value</span>
      </div>
      
      <p className="text-blue-100 mb-6">{narrative.explanation}</p>
      
      {/* Owner journey */}
      <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {ownerName}'s Path to Optionality
        </h4>
        
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 text-right">
              <span className="text-emerald-400 font-medium">Year 1</span>
            </div>
            <div className="flex-1 text-blue-100 text-sm border-l-2 border-emerald-400/30 pl-4">
              {narrative.ownerJourney.year1}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 text-right">
              <span className="text-blue-400 font-medium">Year 2</span>
            </div>
            <div className="flex-1 text-blue-100 text-sm border-l-2 border-blue-400/30 pl-4">
              {narrative.ownerJourney.year2}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-16 text-right">
              <span className="text-amber-400 font-medium">Year 3</span>
            </div>
            <div className="flex-1 text-blue-100 text-sm border-l-2 border-amber-400/30 pl-4">
              {narrative.ownerJourney.year3}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom line */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-lg font-medium text-center text-blue-100">
          {narrative.bottomLine}
        </p>
      </div>
    </div>
  );
}
