'use client';

import { X, Eye, EyeOff, GripVertical, LayoutDashboard } from 'lucide-react';
import type { SectionId } from '../../../types/ma-dashboard';

interface SectionVisibilityPanelProps {
  sections: SectionId[];
  visibility: Record<SectionId, boolean>;
  onToggle: (sectionId: SectionId) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
  tier: 'clarity' | 'foresight' | 'strategic';
}

const SECTION_CONFIG: Record<SectionId, { label: string; description: string; minTier?: string }> = {
  tuesday_question: {
    label: 'Tuesday Question',
    description: "Client's question of the month with answer",
  },
  true_cash: {
    label: 'True Cash Position',
    description: 'Bank balance vs actual available cash',
  },
  cash_forecast: {
    label: 'Cash Forecast',
    description: '13-week/6-month cash projection with scenarios',
    minTier: 'foresight',
  },
  insights: {
    label: 'Insights & Recommendations',
    description: 'AI-generated and manual insights',
  },
  profitability: {
    label: 'Client Profitability',
    description: 'Revenue and margin by client',
    minTier: 'foresight',
  },
  kpis: {
    label: 'Key Performance Indicators',
    description: 'Selected KPIs with RAG status',
  },
  revenue_trend: {
    label: 'Revenue Trend',
    description: 'Monthly revenue chart',
  },
  documents: {
    label: 'Supporting Documents',
    description: 'Uploaded files and attachments',
  },
};

const TIER_LEVELS = { clarity: 0, foresight: 1, strategic: 2 };

export function SectionVisibilityPanel({
  sections,
  visibility,
  onToggle,
  onReorder,
  onClose,
  tier,
}: SectionVisibilityPanelProps) {
  const tierLevel = TIER_LEVELS[tier];

  const isSectionAvailable = (sectionId: SectionId) => {
    const config = SECTION_CONFIG[sectionId];
    if (!config.minTier) return true;
    const minTierLevel = TIER_LEVELS[config.minTier as keyof typeof TIER_LEVELS];
    return tierLevel >= minTierLevel;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-96 h-full bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Report Sections</h3>
              <p className="text-xs text-slate-500">Drag to reorder, toggle visibility</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sections.map((sectionId, index) => {
            const config = SECTION_CONFIG[sectionId];
            if (!config) return null;
            
            const isAvailable = isSectionAvailable(sectionId);
            const isVisible = visibility[sectionId] !== false && isAvailable;

            return (
              <div
                key={sectionId}
                draggable={isAvailable}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  p-4 rounded-lg border transition-all
                  ${isAvailable 
                    ? 'bg-white border-slate-200 hover:border-slate-300 cursor-move' 
                    : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                  }
                  ${isVisible ? '' : 'opacity-50'}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className={`mt-0.5 ${isAvailable ? 'text-slate-400' : 'text-slate-300'}`}>
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{config.label}</span>
                      {config.minTier && (
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                          {config.minTier}+
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{config.description}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => isAvailable && onToggle(sectionId)}
                    disabled={!isAvailable}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isAvailable 
                        ? isVisible 
                          ? 'text-blue-600 hover:bg-blue-50' 
                          : 'text-slate-400 hover:bg-slate-100'
                        : 'text-slate-300 cursor-not-allowed'
                      }
                    `}
                  >
                    {isVisible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Changes are saved when you click "Save" in the toolbar
          </p>
        </div>
      </div>
    </div>
  );
}

