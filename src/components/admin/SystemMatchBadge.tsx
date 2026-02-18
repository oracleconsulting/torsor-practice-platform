import { Loader2, AlertTriangle, CheckCircle, HelpCircle, Database } from 'lucide-react';

export type MatchStatus =
  | 'in_database'      // matched to sa_tech_products
  | 'unknown'          // no match — click to research
  | 'researching'      // research in progress
  | 'added'            // just researched and added
  | 'research_failed'; // AI couldn't find it

interface SystemMatchBadgeProps {
  /** Stage 1: use found + integrationCount for simple In Database / Not in Database badge */
  found?: boolean;
  integrationCount?: number;
  /** Show disabled "Research Product" button (admin stub) when !found */
  showResearchButton?: boolean;
  onResearch?: () => void;
  researchDisabled?: boolean;
  /** Legacy: status-based display when found is undefined */
  status?: MatchStatus;
  productName?: string | null;
  disabled?: boolean;
}

export function SystemMatchBadge({
  found,
  integrationCount = 0,
  showResearchButton,
  onResearch,
  researchDisabled = true,
  status,
  productName,
  disabled,
}: SystemMatchBadgeProps) {
  // Stage 1: simple found / not found badge
  if (typeof found === 'boolean') {
    if (found) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
          <Database className="w-3 h-3" />
          In Database · {integrationCount} integrations
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          Not in Database
        </span>
        {showResearchButton && (
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onResearch}
            disabled={researchDisabled}
          >
            Research Product
          </button>
        )}
      </span>
    );
  }

  // Legacy status-based display
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
