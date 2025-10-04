
import { BadgeStatus } from '@/types/accountancy';

export function severityToBadgeStatus(severity: 'critical' | 'high' | 'medium' | 'low'): BadgeStatus {
  switch (severity) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
    case 'low':
      return 'good';
    default:
      return 'warning';
  }
}
