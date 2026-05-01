'use client';

export function RatioRadial({ value, target }: { value: number | null; target: number | null }) {
  const pct =
    value != null && target != null && target !== 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 65;
  const angle = (pct / 100) * 360;
  return (
    <div className="mt-2 flex justify-center">
      <div
        className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700"
        style={{
          background: `conic-gradient(rgb(16 185 129) ${angle}deg, rgb(226 232 240) 0)`,
        }}
      >
        <span className="bg-white rounded-full w-10 h-10 flex items-center justify-center">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
