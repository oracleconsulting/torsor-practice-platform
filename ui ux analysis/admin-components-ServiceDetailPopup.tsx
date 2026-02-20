import { useState } from 'react';
import { FileText, MessageCircle, X } from 'lucide-react';
import { SERVICE_REGISTRY, LEGACY_CODE_MAP } from '../lib/service-registry';
import { supabase } from '../lib/supabase';

interface ServiceDetailPopupProps {
  serviceCode: string;
  serviceName?: string;
  onClose: () => void;
}

function getExamplePdfUrl(tierExamplePdfUrl: string | undefined): string | null {
  if (!tierExamplePdfUrl) return null;
  const base = (import.meta as any).env?.VITE_SUPABASE_URL;
  if (!base) return tierExamplePdfUrl.startsWith('http') ? tierExamplePdfUrl : null;
  const path = tierExamplePdfUrl.replace(/^\/storage\/service-examples\/?/, '');
  const { data } = supabase.storage.from('service-examples').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export function ServiceDetailPopup({ serviceCode, serviceName, onClose }: ServiceDetailPopupProps) {
  const resolvedCode = LEGACY_CODE_MAP[serviceCode] ?? serviceCode;
  const service = SERVICE_REGISTRY[resolvedCode];

  if (!service) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{serviceName ?? serviceCode}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">More details coming soon.</p>
        </div>
      </div>
    );
  }

  const popupTiers = service.tiers.filter(t => t.showInPopup);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg mx-auto w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{service.displayName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-teal-600 dark:text-teal-400 font-medium text-sm mb-3">{service.outcome}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{service.description}</p>

          <div className={`grid gap-4 ${popupTiers.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {popupTiers.map((tier) => {
              const pdfUrl = getExamplePdfUrl(tier.examplePdfUrl);
              return (
                <div key={tier.name} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{tier.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">{tier.tagline}</p>

                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {tier.pricingModel === 'fixed' ? tier.priceFormatted : tier.priceFromFormatted}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{tier.periodLabel}</span>
                  </p>

                  <div className="mt-auto pt-3">
                    {pdfUrl ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        {tier.popupCtaLabel ?? 'View Example'}
                      </a>
                    ) : (
                      <a
                        href="/appointments"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {tier.popupCtaLabel ?? 'Talk to us'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EnabledByLinkProps {
  serviceCode: string;
  serviceName: string;
  price?: string;
}

export function EnabledByLink({ serviceCode, serviceName, price }: EnabledByLinkProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPopup(true)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
      >
        Enabled by: {serviceName}{price ? ` (${price})` : ''}
      </button>
      {showPopup && (
        <ServiceDetailPopup
          serviceCode={serviceCode}
          serviceName={serviceName}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
}
