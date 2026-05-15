/**
 * Merge Hidden Value Audit data onto a bm_reports-shaped object for client-facing dashboards.
 * Matches admin modal Client View precedence: persist rich bm_reports.hva_data when present;
 * otherwise fall back to questionnaire (`client_assessments` responses).
 */

export type HvaStatusLike =
  | { responses?: Record<string, unknown>; [key: string]: unknown }
  | null
  | undefined;

/** Parse bm_reports.hva_data if stored as JSON string */
function normalizeHvaFromReport(rawHva: unknown): Record<string, unknown> | null {
  if (rawHva == null) return null;
  if (typeof rawHva === 'string') {
    try {
      const v = JSON.parse(rawHva) as unknown;
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof rawHva === 'object' && !Array.isArray(rawHva)) return rawHva as Record<string, unknown>;
  return null;
}

function persistHasStructuredHva(fromDb: Record<string, unknown>): boolean {
  return Boolean(
    (Array.isArray(fromDb.competitive_moat) && fromDb.competitive_moat.length > 0) ||
      (typeof fromDb.unique_methods === 'string' && fromDb.unique_methods.trim() !== '') ||
      (typeof fromDb.reputation_build_time === 'string' && String(fromDb.reputation_build_time).trim() !== '') ||
      typeof fromDb.reputation_build_time === 'number' ||
      !!(fromDb as { reputation_build_time_note?: unknown }).reputation_build_time_note ||
      !!(fromDb as { founder_dependency?: unknown }).founder_dependency ||
      !!(fromDb as { ip_and_documentation?: unknown }).ip_and_documentation ||
      !!(fromDb as { operational_autonomy?: unknown }).operational_autonomy ||
      !!(fromDb as { concentration_and_revenue?: unknown }).concentration_and_revenue
  );
}

/**
 * Returns merged `hva_data` to spread onto `{ ...report, hva_data }` or `undefined`
 * when neither DB nor questionnaire has usable data.
 */
export function mergeBenchmarkHvaForClientView(
  report: { hva_data?: unknown; [key: string]: unknown },
  hvaStatus?: HvaStatusLike
): Record<string, unknown> | undefined {
  const fromDb = normalizeHvaFromReport(report?.hva_data);

  const persistHasContent = Boolean(fromDb && persistHasStructuredHva(fromDb));
  if (persistHasContent && fromDb) return fromDb;

  const hvaResponses = hvaStatus?.responses;
  if (!hvaResponses || typeof hvaResponses !== 'object') {
    return fromDb ?? undefined;
  }

  const cm = (hvaResponses as { competitive_moat?: unknown }).competitive_moat;
  return {
    competitive_moat: Array.isArray(cm)
      ? cm
      : typeof cm === 'string'
        ? cm.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    unique_methods:
      typeof (hvaResponses as { unique_methods?: unknown }).unique_methods === 'string'
        ? (hvaResponses as { unique_methods: string }).unique_methods
        : Array.isArray((hvaResponses as { unique_methods?: unknown }).unique_methods)
          ? ((hvaResponses as { unique_methods: unknown[] }).unique_methods).join('; ')
          : undefined,
    reputation_build_time: (hvaResponses as { reputation_build_time?: unknown }).reputation_build_time,
  };
}
