import { Sun } from 'lucide-react';

interface TuesdayCheckInCardProps {
  checkInPrompt: string;
  weekNumber: number;
  weekTheme?: string;
  isActiveWeek: boolean;
}

export function TuesdayCheckInCard({
  checkInPrompt,
  weekNumber,
  weekTheme,
  isActiveWeek,
}: TuesdayCheckInCardProps) {
  if (!isActiveWeek || !checkInPrompt?.trim()) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-center gap-2">
        <Sun className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
          Your Tuesday Check-In
        </span>
      </div>
      {weekTheme ? (
        <p className="text-xs text-amber-600 mt-1">
          Week {weekNumber}: {weekTheme}
        </p>
      ) : (
        <p className="text-xs text-amber-600 mt-1">Week {weekNumber}</p>
      )}
      <p className="text-lg text-amber-900 font-medium italic leading-relaxed mt-4">
        &ldquo;{checkInPrompt}&rdquo;
      </p>
      <div className="border-t border-amber-200 mt-4 pt-3">
        <p className="text-xs text-amber-600">
          Take a moment to sit with this. No right answer — just honest reflection.
        </p>
      </div>
    </div>
  );
}
