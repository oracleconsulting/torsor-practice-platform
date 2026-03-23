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

/** Final assembled shape (Phase 8) — may exist without phase1..phase7 keys on legacy rows */
function hasAssembledPass1Shape(pd: Record<string, unknown> | null | undefined): boolean {
  if (!pd || typeof pd !== 'object') return false;
  return Boolean(pd.facts && pd.findings && pd.recommendations);
}

function hasPhaseSegment(report: SAPhaseReportRow | null | undefined, n: number): boolean {
  return Boolean(report?.pass1_data?.[`phase${n}`]);
}

function isPhaseComplete(phaseNum: number, report: SAPhaseReportRow | null | undefined): boolean {
  if (!report) return false;
  if (phaseNum <= 7) {
    if (hasPhaseSegment(report, phaseNum)) return true;
    // Legacy: Phase 8 used to drop phase1..phase7 from pass1_data — treat a finished report as all phases done for display
    if (isPass1Assembled(report.status) && hasAssembledPass1Shape(report.pass1_data ?? undefined)) {
      return true;
    }
    return false;
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

/**
 * True if this phase may be started: phase 1 always; else `pass1_data.phase{N-1}` must exist.
 * Phase 8 assembly now preserves phase1..phase7 in the DB — required for resume. Legacy rows
 * without those keys can only full re-run from phase 1.
 */
export function canRunSaPhase(
  phaseNum: number,
  report: SAPhaseReportRow | null | undefined
): boolean {
  if (phaseNum === 1) return true;
  return hasPhaseSegment(report, phaseNum - 1);
}

export interface SAPhaseControlsProps {
  report: SAPhaseReportRow | null | undefined;
  /** e.g. no engagement — blocks click only, not the same as pipeline busy */
  disabled?: boolean;
  /** Client-side generating flag (poll in flight); combined with report status */
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
        const legacyAssembledNoSegments =
          phase.num > 1 &&
          !hasPhaseSegment(report, 1) &&
          hasAssembledPass1Shape(report?.pass1_data ?? undefined);
        const st = report?.status ?? '';
        const isPipelineBusy =
          st === 'generating' || st === 'regenerating' || !!isGenerating;
        const blockClick = !!disabled || isPipelineBusy || !canRun;

        return (
          <button
            key={phase.num}
            type="button"
            onClick={() => {
              if (blockClick) return;
              onRunFromPhase(phase.num);
            }}
            disabled={isPipelineBusy}
            className={[
              'px-2 py-1 rounded text-xs font-medium transition-colors border',
              status === 'complete' ? 'bg-green-100 text-green-800 border-green-300' : '',
              status === 'failed' ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' : '',
              status === 'not_run' ? 'bg-gray-100 text-gray-500 border-gray-200' : '',
              status === 'running' ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse' : '',
              !isPipelineBusy && canRun && status !== 'running' ? 'cursor-pointer hover:opacity-90' : '',
              !canRun && !isPipelineBusy && status !== 'complete' ? 'opacity-40 cursor-not-allowed' : '',
              !canRun && !isPipelineBusy && status === 'complete' ? 'cursor-not-allowed opacity-75' : '',
              isPipelineBusy ? 'cursor-wait' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={`Phase ${phase.num}: ${phase.label}${
              status === 'failed' ? ' — failed; click to retry from here' : ''
            }${
              legacyAssembledNoSegments
                ? ' — Run full “Regenerate” (phase 1) once after deploy to store phase data; then per-phase resume works.'
                : !canRun && phase.num > 1
                  ? ' — previous phase data missing in pass1_data'
                  : ''
            }`}
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
