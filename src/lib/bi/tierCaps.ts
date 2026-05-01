export type NormalizedTier = 'clarity' | 'foresight' | 'strategic';

export function normalizeMaTier(tier: string | undefined | null): NormalizedTier {
  const t = tier?.toLowerCase() || '';
  if (t === 'bronze' || t === 'clarity') return 'clarity';
  if (t === 'silver' || t === 'gold' || t === 'foresight') return 'foresight';
  return 'strategic';
}

export function normalizeBiTier(tier: string | undefined | null): NormalizedTier {
  const t = tier?.toLowerCase() || '';
  if (t === 'clarity') return 'clarity';
  if (t === 'foresight') return 'foresight';
  return 'strategic';
}

export function tierFromEngagement(tier: string | undefined | null): NormalizedTier {
  if (!tier) return 'clarity';
  if (['clarity', 'foresight', 'strategic'].includes(tier.toLowerCase())) {
    return tier.toLowerCase() as NormalizedTier;
  }
  return normalizeMaTier(tier);
}

export function catalogCaps(level: NormalizedTier) {
  if (level === 'clarity') return { maxRatios: 5, maxVariances: 3, aiPeriodSummary: false, perpetual: false, driftAlerts: false };
  if (level === 'foresight') return { maxRatios: 12, maxVariances: 8, aiPeriodSummary: true, perpetual: true, driftAlerts: false };
  return { maxRatios: 999, maxVariances: 999, aiPeriodSummary: true, perpetual: true, driftAlerts: true };
}
