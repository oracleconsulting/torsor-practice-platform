import { CheckCircle, Clock, AlertCircle, Loader2, XCircle } from 'lucide-react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Map raw DB status values to human-readable labels and variants */
const STATUS_MAP: Record<string, { label: string; variant: Variant }> = {
  // Client statuses
  pending_onboarding: { label: 'Getting Started', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  assessment_complete: { label: 'Assessment Complete', variant: 'success' },
  report_pending: { label: 'Report Being Prepared', variant: 'warning' },
  report_complete: { label: 'Report Ready', variant: 'success' },
  paused: { label: 'Paused', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  // Sprint statuses
  not_started: { label: 'Not Started', variant: 'neutral' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
  // Service statuses
  enrolled: { label: 'Enrolled', variant: 'info' },
  assessment_in_progress: { label: 'Assessment In Progress', variant: 'warning' },
  delivery: { label: 'In Delivery', variant: 'info' },
  // Report statuses
  draft: { label: 'Draft', variant: 'neutral' },
  generating: { label: 'Generating...', variant: 'warning' },
  ready: { label: 'Ready', variant: 'success' },
  shared: { label: 'Shared with Client', variant: 'success' },
  error: { label: 'Error', variant: 'danger' },
};

const variantIcons = {
  success: CheckCircle,
  warning: Clock,
  danger: XCircle,
  info: Loader2,
  neutral: AlertCircle,
};

interface StatusBadgeProps {
  /** Raw status string from database, or a variant name */
  status: string;
  /** Override the display label */
  label?: string;
  /** Show icon */
  showIcon?: boolean;
}

export function StatusBadge({ status, label: overrideLabel, showIcon = true }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status] || { label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), variant: 'neutral' as Variant };
  const displayLabel = overrideLabel ?? mapped.label;
  const Icon = variantIcons[mapped.variant];

  return (
    <span className={`status-badge status-badge--${mapped.variant}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {displayLabel}
    </span>
  );
}
