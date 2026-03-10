/**
 * ServiceRecommendationPopup — Universal service recommendation modal
 * Used wherever a service is recommended: Discovery, Benchmarking, Systems Audit, etc.
 * Data from service_catalogue + service_tiers, or override via serviceData prop.
 */

import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface ServiceRecommendationPopupTier {
  tierCode?: string;
  tierName?: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  priceDisplay?: string;
  price?: string;
  tagline?: string;
  exampleUrl?: string;
  exampleLabel?: string;
  isRecommended?: boolean;
}

export interface ServiceRecommendationPopupData {
  name: string;
  displayName?: string;
  tagline?: string;
  shortDescription?: string;
  description?: string;
  scopeNote?: string;
  tiers: ServiceRecommendationPopupTier[];
}

export interface ServiceRecommendationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  serviceCode: string;
  onTierSelect?: (tierCode: string) => void;
  serviceData?: ServiceRecommendationPopupData;
}

/** Static fallback: rich, destination-focused content when service_catalogue is sparse or missing. */
const STATIC_SERVICE_FALLBACK: Record<string, ServiceRecommendationPopupData> = {

  // =========================================================================
  // INDUSTRY BENCHMARKING
  // =========================================================================
  benchmarking: {
    name: 'Industry Benchmarking (Full Package)',
    tagline: "You'll Know Where You Stand",
    description: 'A detailed comparison of your business against industry peers. Not generic averages — specific, quantified insight into where you\'re outperforming, where you\'re leaving money on the table, and what\'s dragging down your valuation. This is the data your FD would start with.',
    tiers: [
      {
        tierCode: 'tier_1',
        name: 'Tier 1',
        description: 'Your key performance metrics compared to industry benchmarks: gross margin, revenue per employee, staff cost ratio, overhead structure, and debtor/creditor efficiency. Includes an indicative business valuation baseline and a clear picture of where you sit relative to peers. Delivered as a written report with a 30-minute walkthrough call.',
        price: '£2,000',
      },
      {
        tierCode: 'tier_2',
        name: 'Tier 2',
        description: 'Everything in Tier 1 plus a deep-dive into project-type profitability, subcontractor dependency analysis, hidden value identification (what\'s suppressing your exit multiple), and a prioritised 90-day action plan. Includes a 2-hour strategy session to walk through findings, agree priorities, and build the roadmap for what comes next.',
        price: '£4,500',
      },
    ],
    scopeNote: 'Provides the data and analysis. Won\'t directly implement operational changes — you\'ll need internal buy-in to execute on the findings. But you\'ll know exactly where to focus.',
  },

  // =========================================================================
  // BUSINESS INTELLIGENCE
  // =========================================================================
  business_intelligence: {
    name: 'Business Intelligence',
    tagline: 'Know Your Numbers — Before It\'s Too Late',
    description: 'Monthly financial clarity that tells you which projects are making money, where cash will be tight, and what to do about it. Not a spreadsheet dump — a concise pack you can review in 10 minutes, backed by a monthly call to turn the numbers into decisions. Like having the FD you know you need, without the £100k salary.',
    tiers: [
      {
        tierCode: 'clarity',
        name: 'Clarity',
        description: 'Monthly P&L with trend analysis and variance commentary. True Cash position showing what you actually have vs what the bank says. Project-level margin tracking — estimated vs actual, with alerts when a job is going off track. KPI dashboard benchmarked against your industry peers. Plus a monthly review call with your dedicated analyst to discuss what the numbers mean and what to do about them.',
        price: '£3,500/month',
        tagline: 'See where you are',
      },
      {
        tierCode: 'foresight',
        name: 'Foresight',
        description: 'Everything in Clarity, plus a 90-day rolling cash flow forecast so you can see the danger points before they hit. Scenario modelling for the decisions that keep you up at night — "what if we lose that subcontractor?", "what if the big job slips by 3 months?", "what happens if we hire two more people?". Quarterly performance review with your advisor to connect the financial data to your strategic priorities.',
        price: '£4,500/month',
        tagline: 'See where you could be',
      },
      {
        tierCode: 'strategic',
        name: 'Strategic',
        description: 'Full CFO-level financial partnership. Board-ready reporting that you\'d be proud to show an investor or acquirer. Strategic pricing analysis to find the margin you\'re leaving on the table. Acquisition and exit financial modelling when you need it. A dedicated financial strategist who knows your business inside out and is in your corner for the decisions that matter most.',
        price: 'from £7,000/month',
        tagline: 'Your financial partner',
      },
    ],
    scopeNote: 'Provides financial visibility and analysis. Does not include bookkeeping, tax compliance, or operational implementation of changes. Pairs with Goal Alignment for strategic execution support.',
  },

  // =========================================================================
  // GOAL ALIGNMENT PROGRAMME
  // =========================================================================
  goal_alignment: {
    name: 'Goal Alignment Programme',
    tagline: 'Align Your Business With Your Life',
    description: 'Most business advice starts with the business. We start with you. What does your life look like when the business is working properly? What does your Tuesday morning look like in five years? We build the business strategy backwards from there — because profit isn\'t the destination, it\'s the fuel that gets you to yours.',
    tiers: [
      {
        tierCode: 'lite',
        name: 'Lite',
        description: 'Your North Star articulated — the clear, specific vision of what you\'re building towards and why. A 12-month priority plan that connects business actions to personal goals. One quarterly review to check you\'re still heading in the right direction. For business owners who know what they want but need the framework and accountability to actually get there.',
        price: '£1,500/year',
        tagline: 'The compass',
      },
      {
        tierCode: 'growth',
        name: 'Growth',
        description: 'Everything in Lite, plus quarterly accountability sessions where we review progress, adjust priorities, and tackle the decisions you\'ve been avoiding. 12-week sprint planning that breaks the big vision into actions you can execute this quarter. Milestone tracking tied to your exit timeline or growth goals. Ad-hoc strategic support between sessions for the decisions that can\'t wait. Your thinking partner for 12 months.',
        price: '£4,500/year',
        tagline: 'The co-pilot',
      },
      {
        tierCode: 'partner',
        name: 'Partner',
        description: 'The full strategic partnership. Everything in Growth, plus an annual strategy day with your leadership team. Integration with your Business Intelligence and benchmarking data so every strategic conversation is grounded in real numbers. Team alignment sessions to get everyone pulling in the same direction. Priority access to the advisory team when opportunities or crises hit. For business owners who are serious about transformation — not just planning it, but executing it.',
        price: '£9,000/year',
        tagline: 'The strategic partner',
      },
    ],
    scopeNote: 'Strategic framework and accountability. Does not include technical execution like legal structuring, tax planning, or buyer negotiations — but we\'ll make sure the right specialists are in place when you need them.',
  },

};

function getExampleUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = (import.meta as any).env?.VITE_SUPABASE_URL;
  if (base && url.startsWith('/storage/')) {
    const path = url.replace(/^\/storage\/service-examples\/?/, '');
    const { data } = supabase.storage.from('service-examples').getPublicUrl(path);
    return data?.publicUrl ?? url;
  }
  return url;
}

export function ServiceRecommendationPopup({
  isOpen,
  onClose,
  serviceCode,
  onTierSelect,
  serviceData: serviceDataOverride,
}: ServiceRecommendationPopupProps) {
  const [loading, setLoading] = useState(false);
  const [serviceData, setServiceData] = useState<ServiceRecommendationPopupData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !serviceCode) {
      setServiceData(null);
      setError(null);
      return;
    }
    if (serviceDataOverride) {
      setServiceData(serviceDataOverride);
      setError(null);
      return;
    }
    const code = (serviceCode || '').trim().toLowerCase();
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (STATIC_SERVICE_FALLBACK[code]) {
          if (!cancelled) {
            setServiceData(STATIC_SERVICE_FALLBACK[code]);
            setError(null);
            setLoading(false);
          }
          return;
        }
        const { data: catalog, error: catalogError } = await supabase
          .from('service_catalogue')
          .select('id, code, name, display_name, tagline, short_description')
          .eq('code', code)
          .eq('is_active', true)
          .maybeSingle();

        if (catalogError || !catalog) {
          const msg = catalogError?.message ?? 'Service not found';
          const isSchemaError = /schema cache|relation.*does not exist|could not find.*table/i.test(msg);
          if (!cancelled) setError(isSchemaError ? 'Service catalogue not set up yet. Run the service_catalogue migration in Supabase.' : msg);
          return;
        }

        const { data: tiers, error: tiersError } = await supabase
          .from('service_tiers')
          .select('tier_code, tier_name, short_description, price_display, example_url, example_label, is_recommended, display_order')
          .eq('service_id', catalog.id)
          .order('display_order', { ascending: true });

        if (tiersError || !tiers) {
          if (!cancelled) setServiceData({
            name: catalog.name,
            displayName: catalog.display_name || catalog.name,
            tagline: catalog.tagline || '',
            shortDescription: catalog.short_description || '',
            tiers: [],
          });
          return;
        }

        if (!cancelled) {
          setServiceData({
            name: catalog.name,
            displayName: catalog.display_name || catalog.name,
            tagline: catalog.tagline || '',
            shortDescription: catalog.short_description || '',
            tiers: tiers.map((t: any) => ({
              tierCode: t.tier_code,
              tierName: t.tier_name,
              shortDescription: t.short_description || '',
              priceDisplay: t.price_display,
              exampleUrl: t.example_url,
              exampleLabel: t.example_label || 'View Example',
              isRecommended: t.is_recommended || false,
            })),
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        const isSchemaError = /schema cache|relation.*does not exist|could not find.*table/i.test(msg);
        if (!cancelled) setError(isSchemaError ? 'Service catalogue not set up yet. Run the service_catalogue migration in Supabase.' : msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, serviceCode, serviceDataOverride]);

  if (!isOpen) return null;

  const data = serviceDataOverride ?? serviceData;
  const displayName = data?.displayName ?? data?.name ?? serviceCode;
  const tagline = data?.tagline ?? '';
  const shortDescription = data?.description ?? data?.shortDescription ?? '';
  const scopeNote = data?.scopeNote;
  const tiers = data?.tiers ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-popup-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h2 id="service-popup-title" className="text-xl font-bold text-slate-900 dark:text-white pr-8">
              {displayName}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <p className="text-slate-500 text-sm">Loading…</p>
          )}

          {error && !loading && (
            <p className="text-amber-600 text-sm">{error}</p>
          )}

          {data && !loading && !error && (
            <>
              {tagline && (
                <p className="text-teal-600 dark:text-teal-400 font-medium text-sm mb-2">
                  {tagline}
                </p>
              )}
              {shortDescription && (
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  {shortDescription}
                </p>
              )}

              {tiers.length > 0 ? (
                <div className={`grid gap-4 ${tiers.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {tiers.map((tier, idx) => {
                    const exampleUrl = getExampleUrl(tier.exampleUrl);
                    const tierName = tier.tierName ?? tier.name ?? '';
                    const tierDesc = tier.shortDescription ?? tier.description ?? '';
                    const priceDisplay = tier.priceDisplay ?? tier.price ?? '';
                    const tierKey = tier.tierCode ?? tier.name ?? String(idx);
                    return (
                      <div
                        key={tierKey}
                        className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 flex flex-col bg-slate-50/50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {tierName}
                          </h3>
                          {tier.isRecommended && (
                            <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        {tier.tagline && (
                          <p className="text-sm text-teal-600 dark:text-teal-400 mb-2">
                            {tier.tagline}
                          </p>
                        )}
                        {tierDesc && (
                          <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                            {tierDesc}
                          </p>
                        )}
                        {priceDisplay && (
                          <p className="text-base font-bold text-slate-900 dark:text-white mb-4">
                            {priceDisplay}
                          </p>
                        )}
                        <div className="mt-auto space-y-2">
                          {exampleUrl && (
                            <a
                              href={exampleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              {tier.exampleLabel ?? 'View Example'}
                            </a>
                          )}
                          {onTierSelect && (tier.tierCode ?? tier.name) && (
                            <button
                              type="button"
                              onClick={() => onTierSelect(tier.tierCode ?? tier.name ?? '')}
                              className="w-full px-4 py-2 border border-teal-600 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-sm font-medium transition-colors"
                            >
                              Select this tier
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !serviceDataOverride && (
                <p className="text-slate-500 text-sm">No tiers configured for this service.</p>
              )}
              {scopeNote && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 italic">
                  {scopeNote}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceRecommendationPopup;
