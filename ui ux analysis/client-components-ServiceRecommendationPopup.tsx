/**
 * ServiceRecommendationPopup — Universal service recommendation modal
 * Used wherever a service is recommended: Discovery, Benchmarking, Systems Audit, etc.
 * Data from service_catalogue + service_tiers, or override via serviceData prop.
 */

import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface ServiceRecommendationPopupTier {
  tierCode: string;
  tierName: string;
  shortDescription: string;
  priceDisplay: string;
  exampleUrl?: string;
  exampleLabel?: string;
  isRecommended?: boolean;
}

export interface ServiceRecommendationPopupData {
  name: string;
  displayName: string;
  tagline: string;
  shortDescription: string;
  tiers: ServiceRecommendationPopupTier[];
}

export interface ServiceRecommendationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  serviceCode: string;
  onTierSelect?: (tierCode: string) => void;
  serviceData?: ServiceRecommendationPopupData;
}

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
        const { data: catalog, error: catalogError } = await supabase
          .from('service_catalogue')
          .select('id, code, name, display_name, tagline, short_description')
          .eq('code', code)
          .eq('is_active', true)
          .maybeSingle();

        if (catalogError || !catalog) {
          const msg = catalogError?.message ?? 'Service not found';
          const isSchemaError = /schema cache|relation.*does not exist|could not find.*table/i.test(msg);
          if (!cancelled) setError(isSchemaError ? 'Service details will be available soon. Please ask your advisor for more information.' : msg);
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
        if (!cancelled) setError(isSchemaError ? 'Service details will be available soon. Please ask your advisor for more information.' : msg);
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
  const shortDescription = data?.shortDescription ?? '';
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
                  {tiers.map((tier) => {
                    const exampleUrl = getExampleUrl(tier.exampleUrl);
                    return (
                      <div
                        key={tier.tierCode}
                        className="border border-slate-200 dark:border-gray-700 rounded-lg p-4 flex flex-col bg-slate-50/50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {tier.tierName}
                          </h3>
                          {tier.isRecommended && (
                            <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        {tier.shortDescription && (
                          <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                            {tier.shortDescription}
                          </p>
                        )}
                        <p className="text-base font-bold text-slate-900 dark:text-white mb-4">
                          {tier.priceDisplay}
                        </p>
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
                          {onTierSelect && (
                            <button
                              type="button"
                              onClick={() => onTierSelect(tier.tierCode)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceRecommendationPopup;
