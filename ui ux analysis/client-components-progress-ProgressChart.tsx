// ============================================================================
// ProgressChart — Recharts area chart with completion + life score
// ============================================================================

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface ProgressChartProps {
  data: Array<{ week: string; completionRate: number; lifeScore: number | null }>;
  showAllTime: boolean;
  onToggle: (allTime: boolean) => void;
}

export function ProgressChart({ data, showAllTime, onToggle }: ProgressChartProps) {
  const hasLife = data.some(d => d.lifeScore != null);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => onToggle(false)}
            className={`px-3 py-1.5 rounded-full text-sm ${!showAllTime ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            This Sprint
          </button>
          <button
            type="button"
            onClick={() => onToggle(true)}
            className={`px-3 py-1.5 rounded-full text-sm ${showAllTime ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            All Time
          </button>
        </div>
        <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
          Complete your first week to see progress
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${!showAllTime ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          This Sprint
        </button>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${showAllTime ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All Time
        </button>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            formatter={(value: number) => [value, '']}
            labelFormatter={(label) => `Week ${label}`}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]?.payload as { week: string; completionRate: number; lifeScore: number | null };
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
                  <p className="font-medium text-gray-900">{p?.week ?? label}</p>
                  <p className="text-indigo-600">Tasks: {p?.completionRate ?? 0}%</p>
                  {p?.lifeScore != null && <p className="text-rose-600">Life: {Math.round(p.lifeScore)}</p>}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="completionRate"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
            name="Completion %"
          />
          {hasLife && (
            <Area
              type="monotone"
              dataKey="lifeScore"
              stroke="#f43f5e"
              fill="#f43f5e"
              fillOpacity={0.3}
              name="Life score"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
