'use client';

import { GripVertical, EyeOff, Settings } from 'lucide-react';
import type { SectionId } from '../../../types/ma-dashboard';

interface SectionWrapperProps {
  id: SectionId;
  children: React.ReactNode;
  editMode: boolean;
  onHide: () => void;
  onSettings?: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const SECTION_LABELS: Record<SectionId, string> = {
  tuesday_question: 'Tuesday Question',
  true_cash: 'True Cash',
  cash_forecast: 'Cash Forecast',
  insights: 'Insights',
  profitability: 'Profitability',
  kpis: 'KPIs',
  revenue_trend: 'Revenue Trend',
  documents: 'Documents',
};

export function SectionWrapper({
  id,
  children,
  editMode,
  onHide,
  onSettings,
  isDragging,
  dragHandleProps,
}: SectionWrapperProps) {
  if (!editMode) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative group transition-all ${
        isDragging ? 'opacity-50 scale-[0.98]' : ''
      }`}
    >
      {/* Edit Mode Overlay */}
      <div className="absolute -inset-2 border-2 border-dashed border-transparent group-hover:border-blue-300 rounded-xl pointer-events-none transition-colors" />
      
      {/* Edit Mode Controls */}
      <div className="absolute -top-3 left-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-white rounded-md text-xs font-medium cursor-grab shadow-lg"
        >
          <GripVertical className="w-3 h-3" />
          {SECTION_LABELS[id] || id}
        </div>
        
        {/* Settings */}
        {onSettings && (
          <button
            onClick={onSettings}
            className="p-1.5 bg-slate-800 text-white rounded-md hover:bg-slate-700 shadow-lg"
          >
            <Settings className="w-3 h-3" />
          </button>
        )}
        
        {/* Hide */}
        <button
          onClick={onHide}
          className="p-1.5 bg-slate-800 text-white rounded-md hover:bg-red-600 shadow-lg"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}


