import { Target, Clock, Wallet, TrendingUp } from 'lucide-react';
import type { ExitReadinessScore } from '../../types/opportunity-calculations';

interface ExitReadinessBreakdownProps {
  data: ExitReadinessScore;
}

export function ExitReadinessBreakdown({ data }: ExitReadinessBreakdownProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };
  
  const levelColors: Record<ExitReadinessScore['level'], string> = {
    not_ready: 'bg-red-100 text-red-700 border-red-300',
    needs_work: 'bg-orange-100 text-orange-700 border-orange-300',
    progressing: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    credibly_ready: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    exit_ready: 'bg-green-100 text-green-700 border-green-300'
  };
  
  const progressBarColor = () => {
    if (data.totalScore >= 65) return 'bg-emerald-500';
    if (data.totalScore >= 50) return 'bg-yellow-500';
    if (data.totalScore >= 35) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Exit Readiness Score</h3>
            <p className="text-slate-400 text-sm">How prepared is your business for a sale or transition?</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{data.totalScore}</div>
            <div className="text-slate-400">/ {data.maxScore}</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${progressBarColor()}`}
              style={{ width: `${(data.totalScore / data.maxScore) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>Not Ready</span>
            <span>Needs Work</span>
            <span>Progressing</span>
            <span>Credibly Ready</span>
            <span>Exit Ready</span>
          </div>
        </div>
        
        <div className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-medium border ${levelColors[data.level]}`}>
          {data.levelLabel}
        </div>
      </div>
      
      {/* Component breakdown */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-4">Score Breakdown</h4>
        
        <div className="space-y-4">
          {data.components.map((component) => (
            <div key={component.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900">{component.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    component.currentScore >= component.targetScore ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {component.currentScore}
                  </span>
                  <span className="text-slate-400">/ {component.maxScore}</span>
                </div>
              </div>
              
              {/* Mini progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full ${
                    component.currentScore >= component.targetScore ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${(component.currentScore / component.maxScore) * 100}%` }}
                />
              </div>
              
              {/* Gap and actions */}
              {component.currentScore < component.targetScore && (
                <div className="mt-2">
                  <div className="text-sm text-orange-600 font-medium">{component.gap}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Target: {component.targetScore}/{component.maxScore} • Gap: {component.targetScore - component.currentScore} points
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Path to 70 */}
      {data.totalScore < 70 && (
        <div className="p-6 bg-emerald-50 border-t">
          <h4 className="text-sm font-semibold text-emerald-800 uppercase mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Path to Credibly Exit Ready (70/100)
          </h4>
          
          <ol className="space-y-2 mb-4">
            {data.pathTo70.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ol>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-200">
            <div className="text-center">
              <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-emerald-800">{data.pathTo70.timeframe}</div>
              <div className="text-xs text-emerald-600">Timeline</div>
            </div>
            <div className="text-center">
              <Wallet className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-emerald-800">{formatCurrency(data.pathTo70.investment)}</div>
              <div className="text-xs text-emerald-600">Investment</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-sm font-medium text-emerald-800">{formatCurrency(data.pathTo70.valueUnlocked)}</div>
              <div className="text-xs text-emerald-600">Value Unlocked</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
