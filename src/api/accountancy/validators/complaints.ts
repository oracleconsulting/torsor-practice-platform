import type { HandoverComplaint } from '../../../types/accountancy';

export function validateComplaint(complaint: Omit<HandoverComplaint, 'id' | 'createdAt' | 'updatedAt'>): string | null {
  // Required fields
  if (!complaint.clientName?.trim()) {
    return 'Client name is required';
  }

  if (!complaint.previousAccountant?.trim()) {
    return 'Previous accountant details are required';
  }

  if (!complaint.regulatoryBody) {
    return 'Regulatory body must be specified';
  }

  if (!['ICAEW', 'ACCA', 'AAT'].includes(complaint.regulatoryBody)) {
    return 'Invalid regulatory body';
  }

  if (!complaint.severity) {
    return 'Severity level must be specified';
  }

  if (!['critical', 'high', 'medium', 'low'].includes(complaint.severity)) {
    return 'Invalid severity level';
  }

  if (!complaint.status) {
    return 'Status must be specified';
  }

  if (!['draft', 'submitted', 'investigating', 'resolved', 'escalated'].includes(complaint.status)) {
    return 'Invalid status';
  }

  // Issues validation
  if (!Array.isArray(complaint.issues) || complaint.issues.length === 0) {
    return 'At least one issue must be specified';
  }

  for (const issue of complaint.issues) {
    if (!issue.category) {
      return 'Issue category is required';
    }

    if (!['documentation', 'communication', 'compliance', 'technical', 'ethical'].includes(issue.category)) {
      return 'Invalid issue category';
    }

    if (!issue.description?.trim()) {
      return 'Issue description is required';
    }

    if (!issue.impact?.trim()) {
      return 'Issue impact is required';
    }

    if (!issue.priority) {
      return 'Issue priority is required';
    }

    if (!['critical', 'high', 'medium', 'low'].includes(issue.priority)) {
      return 'Invalid issue priority';
    }
  }

  // Evidence validation
  if (complaint.evidence) {
    for (const evidence of complaint.evidence) {
      if (!evidence.type) {
        return 'Evidence type is required';
      }

      if (!['document', 'email', 'screenshot', 'recording', 'other'].includes(evidence.type)) {
        return 'Invalid evidence type';
      }

      if (!evidence.title?.trim()) {
        return 'Evidence title is required';
      }

      if (!evidence.fileUrl?.trim()) {
        return 'Evidence file URL is required';
      }
    }
  }

  // Timeline validation
  if (complaint.timeline) {
    for (const event of complaint.timeline) {
      if (!event.type) {
        return 'Timeline event type is required';
      }

      if (!['issue_created', 'evidence_added', 'status_changed', 'note_added', 'escalated'].includes(event.type)) {
        return 'Invalid timeline event type';
      }

      if (!event.description?.trim()) {
        return 'Timeline event description is required';
      }

      if (!event.actor?.trim()) {
        return 'Timeline event actor is required';
      }
    }
  }

  return null;
} 