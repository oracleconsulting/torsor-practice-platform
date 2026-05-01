/** RAG styling aligned with KPITrendChart / ClientProfitabilityChart */

export function ragText(status: string | undefined): string {
  switch (status) {
    case 'green':
      return 'text-emerald-600';
    case 'amber':
      return 'text-amber-600';
    case 'red':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
}

export function ragBorderBg(status: string | undefined): string {
  switch (status) {
    case 'green':
      return 'bg-emerald-50 border-emerald-200';
    case 'amber':
      return 'bg-amber-50 border-amber-200';
    case 'red':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
}

export const CARD_SHELL = 'rounded-xl border border-slate-200 bg-white shadow-sm p-4';
