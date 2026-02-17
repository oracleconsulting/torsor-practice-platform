import { Loader2, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export type MatchStatus =
  | 'in_database'      // matched to sa_tech_products
  | 'unknown'          // no match — click to research
  | 'researching'      // research in progress
  | 'added'            // just researched and added
  | 'research_failed'; // AI couldn't find it

interface SystemMatchBadgeProps {
  status: MatchStatus;
  productName?: string | null;
  onResearch?: () => void;
  disabled?: boolean;
}

export function SystemMatchBadge({ status, productName, onResearch, disabled }: SystemMatchBadgeProps) {
  if (status === 'in_database') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <CheckCircle className="w-3.5 h-3.5" />
        In Database
        {productName && <span className="opacity-90">({productName})</span>}
      </span>
    );
  }

  if (status === 'researching') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Researching…
      </span>
    );
  }

  if (status === 'added') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <CheckCircle className="w-3.5 h-3.5" />
        Added to Database
        {productName && <span className="opacity-90">({productName})</span>}
      </span>
    );
  }

  if (status === 'research_failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        Research Failed
      </span>
    );
  }

  // unknown — show "Click to Research" button
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <HelpCircle className="w-3.5 h-3.5" />
        Unknown
      </span>
      {onResearch && (
        <button
          type="button"
          onClick={onResearch}
          disabled={disabled}
          className="text-xs font-medium text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
        >
          Click to Research
        </button>
      )}
    </span>
  );
}
