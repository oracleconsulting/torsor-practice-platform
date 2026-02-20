// ============================================================================
// WinWall — Grid of client wins
// ============================================================================

import { Award } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  team: 'border-l-blue-500',
  financial: 'border-l-emerald-500',
  systems: 'border-l-purple-500',
  life: 'border-l-rose-500',
  personal: 'border-l-amber-500',
  general: 'border-l-gray-500',
};

export interface WinWallWin {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  sprint_number: number;
  week_number?: number | null;
  is_highlighted: boolean;
  created_at: string;
}

export interface WinWallProps {
  wins: WinWallWin[];
}

export function WinWall({ wins }: WinWallProps) {
  const borderClass = (cat: string) => CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.general;

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Award className="w-5 h-5 text-amber-500" />
        Your Wins
      </h2>
      {wins.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
          Your wins will appear here as you complete sprint milestones 🎯
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wins.map((win) => (
            <div
              key={win.id}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 border-l-4 ${borderClass(win.category)} ${win.is_highlighted ? 'bg-amber-50/50' : ''}`}
            >
              <h3 className="font-semibold text-slate-900">{win.title}</h3>
              {win.description && <p className="text-sm text-gray-600 mt-1">{win.description}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {win.category}
                </span>
                <span className="text-xs text-gray-400">
                  Sprint {win.sprint_number}{win.week_number != null ? `, Week ${win.week_number}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
