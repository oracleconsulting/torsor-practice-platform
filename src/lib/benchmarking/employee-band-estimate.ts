/**
 * Pass 1 (`generate-bm-report-pass1`) uses underscore bands: 1_5, 6_10, …, 100_plus.
 * Legacy UI / older rows may use hyphen bands: 1-10, 11-50, etc.
 * Client dashboard baseline revenue uses count × rev/employee when explicit revenue is missing;
 * unknown bands used to resolve to 0 and broke parity with admin (which has raw assessment numbers).
 */

const PASS1_BAND_MIDPOINT: Record<string, number> = {
  '1_5': 3,
  '6_10': 8,
  '11_25': 18,
  '26_50': 38,
  '51_100': 75,
  '100_plus': 150,
};

const LEGACY_BAND_MIDPOINT: Record<string, number> = {
  '1-10': 5,
  '11-50': 30,
  '51-250': 131,
  '251+': 300,
};

/**
 * Best-effort headcount from free-text (e.g. "3 full-time and 4 contractors") or numeric string.
 */
export function coerceEmployeeCount(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return Math.max(0, Math.round(raw));
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const leading = parseInt(trimmed, 10);
    if (!Number.isNaN(leading) && leading > 0 && /^\d+(\s|$)/.test(trimmed)) {
      return leading;
    }
    const nums = trimmed.match(/\d+/g)?.map((s) => parseInt(s, 10)).filter((n) => n > 0 && n < 500_000) ?? [];
    if (nums.length === 0) return 0;
    if (nums.length <= 4) return nums.reduce((a, b) => a + b, 0);
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) || nums[0] || 0;
  }
  return 0;
}

export function estimateEmployeesFromBand(band: string | undefined | null): number {
  if (!band || typeof band !== 'string') return 0;
  const b = band.trim();
  if (PASS1_BAND_MIDPOINT[b] != null) return PASS1_BAND_MIDPOINT[b];
  if (LEGACY_BAND_MIDPOINT[b] != null) return LEGACY_BAND_MIDPOINT[b];
  const lower = b.toLowerCase();
  if (lower.includes('100') && (lower.includes('plus') || lower.includes('_'))) return PASS1_BAND_MIDPOINT['100_plus'];
  return 0;
}
