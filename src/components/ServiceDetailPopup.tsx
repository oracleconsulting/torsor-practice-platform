import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, DollarSign, ArrowRight, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServiceDetail {
  code: string;
  display_name: string;
  short_description: string;
  core_function: string;
  key_deliverables: string[];
  pricing: { tier: string; amount: number; frequency: string }[];
  typical_timeline: string;
  roi_calculation_method: string;
  prerequisites: string[];
  complementary_services: string[];
  manual_content: string | null;
  manual_file_path: string | null;
  problems_addressed: string[];
}

interface ServiceDetailPopupProps {
  serviceCode: string;
  serviceName?: string; // Optional override
  onClose: () => void;
}

export function ServiceDetailPopup({ serviceCode, serviceName, onClose }: ServiceDetailPopupProps) {
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .rpc('get_service_detail', { p_code: serviceCode });

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setService(data[0]);
        } else {
          setError('Service not found');
        }
      } catch (err) {
        console.error('Error fetching service detail:', err);
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetail();
  }, [serviceCode]);

  // Format price display
  const formatPrice = (pricing: ServiceDetail['pricing']) => {
    if (!pricing || pricing.length === 0) return 'Contact for pricing';
    
    const primary = pricing[0];
    const amount = primary.amount.toLocaleString();
    
    if (primary.frequency === 'monthly') return `£${amount}/month`;
    if (primary.frequency === 'annual') return `£${amount}/year`;
    if (primary.frequency === 'one-time') return `£${amount} one-time`;
    return `£${amount}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {serviceName || service?.display_name || 'Service Details'}
              </h2>
              {service?.short_description && (
                <p className="text-indigo-100 mt-1">
                  {service.short_description}
                </p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : service ? (
            <div className="space-y-6">
              {/* Price & Timeline */}
              <div className="flex gap-4">
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Investment</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {formatPrice(service.pricing)}
                  </p>
                  {service.pricing?.length > 1 && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      {service.pricing.length} pricing options available
                    </p>
                  )}
                </div>
                
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Timeline</span>
                  </div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {service.typical_timeline || 'Varies by scope'}
                  </p>
                </div>
              </div>

              {/* What You Get */}
              {service.key_deliverables && service.key_deliverables.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    What You Get
                  </h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {service.key_deliverables.map((item, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ROI */}
              {service.roi_calculation_method && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                    Return on Investment
                  </h3>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {service.roi_calculation_method}
                  </p>
                </div>
              )}

              {/* Problems Addressed */}
              {service.problems_addressed && service.problems_addressed.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Problems This Solves
                  </h3>
                  <ul className="space-y-2">
                    {service.problems_addressed.slice(0, 5).map((problem, idx) => (
                      <li 
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Manual/Documentation Link */}
              {service.manual_file_path && (
                <a
                  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/service-manuals/${service.manual_file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Service Manual</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download full documentation (PDF)
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </a>
              )}

              {/* Manual Content (if markdown) */}
              {service.manual_content && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Service Details
                  </h3>
                  <div 
                    className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: service.manual_content }}
                  />
                </div>
              )}

              {/* Prerequisites */}
              {service.prerequisites && service.prerequisites.length > 0 && (
                <div className="border-t pt-4 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Prerequisites:</strong> {service.prerequisites.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Clickable "Enabled by: Service" component
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

