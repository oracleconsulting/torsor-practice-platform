import React from 'react';
import { Loader2 } from 'lucide-react';

export const SA_PIPELINE_PHASES = [
  { num: 1, label: 'Extract', short: '1' },
  { num: 2, label: 'Analyse', short: '2' },
  { num: 3, label: 'Critical', short: '3' },
  { num: 4, label: 'Findings', short: '4' },
  { num: 5, label: 'Recommend', short: '5' },
  { num: 6, label: 'Maps', short: '6' },
  { num: 7, label: 'Guidance', short: '7' },
  { num: 8, label: 'Assembly', short: '8' },
] as const;

export type SAPhaseReportRow = {
  status?: string | null;
  pass1_data?: Record<string, unknown> | null;
};

function isPass1Assembled(status: string | undefined | null): boolean {
  return (
    status === 'pass1_complete' ||
    status === 'generated' ||
    status === 'approved' ||
    status === 'published' ||
    status === 'delivered'
  );
}

function isPhaseComplete(phaseNum: number, report: SAPhaseReportRow | null | undefined): boolean {
  if (!report) return false;
  if (phaseNum <= 7) {
    const key = `phase${phaseNum}` as const;
    return Boolean(report.pass1_data?.[key]);
  }
  return isPass1Assembled(report.status);
}

export function getSaPhaseVisualStatus(
  phaseNum: number,
  report: SAPhaseReportRow | null | undefined,
  opts?: { isGenerating?: boolean; generatingFromPhase?: number | null }
): 'complete' | 'failed' | 'not_run' | 'running' {
  const st = report?.status ?? '';
  if (st === `phase${phaseNum}_failed`) return 'failed';
  if (isPhaseComplete(phaseNum, report)) return 'complete';

  const gen = st === 'generating' || st === 'regenerating';
  if (opts?.isGenerating) {
    if (opts.generatingFromPhase != null && phaseNum === opts.generatingFromPhase) return 'running';
    if (gen && report) {
      for (let p = 1; p <= 8; p++) {
        if (!isPhaseComplete(p, report)) {
          return phaseNum === p ? 'running' : 'not_run';
        }
      }
    }
  }

  return 'not_run';
}

export function canRunSaPhase(
  phaseNum: number,
  report: SAPhaseReportRow | null | undefined
): boolean {
  if (phaseNum === 1) return true;
  return isPhaseComplete(phaseNum - 1, report);
}

export interface SAPhaseControlsProps {
  report: SAPhaseReportRow | null | undefined;
  disabled?: boolean;
  isGenerating?: boolean;
  generatingFromPhase?: number | null;
  onRunFromPhase: (phase: number) => void;
}

export function SAPhaseControls({
  report,
  disabled,
  isGenerating,
  generatingFromPhase,
  onRunFromPhase,
}: SAPhaseControlsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center mb-3">
      <span className="text-xs text-gray-500 mr-1 shrink-0">Pass 1:</span>
      {SA_PIPELINE_PHASES.map((phase) => {
        const status = getSaPhaseVisualStatus(phase.num, report, {
          isGenerating,
          generatingFromPhase,
        });
        const canRun = canRunSaPhase(phase.num, report);
        const busy = disabled || isGenerating;

        return (
          <button
            key={phase.num}
            type="button"
            onClick={() => {
              if (busy || !canRun) return;
              onRunFromPhase(phase.num);
            }}
            disabled={busy || !canRun}
            className={[
              'px-2 py-1 rounded text-xs font-medium transition-colors border',
              status === 'complete' ? 'bg-green-100 text-green-800 border-green-300' : '',
              status === 'failed' ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' : '',
              status === 'not_run' ? 'bg-gray-100 text-gray-500 border-gray-200' : '',
              status === 'running' ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse' : '',
              !busy && canRun && status !== 'running' ? 'cursor-pointer hover:opacity-90' : '',
              !canRun || busy ? 'opacity-40 cursor-not-allowed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={`Phase ${phase.num}: ${phase.label}${
              status === 'failed' ? ' — failed; click to retry from here' : ''
            }${!canRun && phase.num > 1 ? ' — complete the previous phase first' : ''}`}
          >
            {status === 'complete' && '✓ '}
            {status === 'failed' && '✗ '}
            {status === 'running' && <Loader2 className="w-3 h-3 inline animate-spin mr-0.5" />}
            {phase.short} {phase.label}
          </button>
        );
      })}
    </div>
  );
}
