// ============================================================================
// SERVICE DETAIL POPUP
// ============================================================================
// Shows service line details when clicking "Enabled by: {Service}" links
// Includes link to PDF manual if available
// ============================================================================

import { useState, useEffect } from 'react';
import { X, FileText, Download, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServiceMetadata {
  code: string;
  name: string;
  display_name?: string;
  core_function?: string;
  problems_addressed?: string[];
  pricing?: {
    tier?: string;
    amount?: number;
    frequency?: string;
  }[];
  key_deliverables?: string[];
  typical_timeline?: string;
  roi_calculation_method?: string;
  manual_file_path?: string;
}

interface ServiceDetailPopupProps {
  serviceCode: string;
  serviceName?: string;
  onClose: () => void;
}

export function ServiceDetailPopup({ serviceCode, serviceName, onClose }: ServiceDetailPopupProps) {
  const [metadata, setMetadata] = useState<ServiceMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualUrl, setManualUrl] = useState<string | null>(null);

  useEffect(() => {
    loadServiceDetails();
  }, [serviceCode]);

  const loadServiceDetails = async () => {
    try {
      // Fetch service metadata
      const { data, error } = await supabase
        .from('service_line_metadata')
        .select('*')
        .eq('code', serviceCode)
        .maybeSingle();

      if (error) {
        console.error('Error loading service metadata:', error);
      }

      if (data) {
        setMetadata(data);
        
        // Get manual URL if available
        if (data.manual_file_path) {
          const { data: urlData } = supabase.storage
            .from('service-manuals')
            .getPublicUrl(data.manual_file_path);
          
          if (urlData?.publicUrl) {
            setManualUrl(urlData.publicUrl);
          }
        }
      }
    } catch (err) {
      console.error('Error in loadServiceDetails:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map service codes to friendly names
  const getDisplayName = () => {
    if (metadata?.display_name) return metadata.display_name;
    if (serviceName) return serviceName;
    
    const nameMap: Record<string, string> = {
      '365_method': 'Goal Alignment Programme',
      '365_alignment': 'Goal Alignment Programme',
      'management_accounts': 'Management Accounts',
      'systems_audit': 'Systems Audit',
      'fractional_cfo': 'Fractional CFO',
      'hidden_value_audit': 'Hidden Value Audit',
      'benchmarking': 'Business Benchmarking',
      'automation': 'Automation & Integration',
      'exit_planning': 'Exit Planning',
    };
    
    return nameMap[serviceCode] || metadata?.name || serviceCode;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{getDisplayName()}</h2>
              {metadata?.core_function && (
                <p className="text-teal-100 text-sm mt-1">{metadata.core_function}</p>
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Problems Addressed */}
              {metadata?.problems_addressed && metadata.problems_addressed.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    What This Solves
                  </h3>
                  <ul className="space-y-2">
                    {metadata.problems_addressed.slice(0, 5).map((problem, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                        <span>{problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Deliverables */}
              {metadata?.key_deliverables && metadata.key_deliverables.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    What You Get
                  </h3>
                  <ul className="space-y-2">
                    {metadata.key_deliverables.map((deliverable, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline */}
              {metadata?.typical_timeline && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Typical Timeline</p>
                    <p className="text-sm font-medium text-gray-800">{metadata.typical_timeline}</p>
                  </div>
                </div>
              )}

              {/* Pricing */}
              {metadata?.pricing && metadata.pricing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Investment
                  </h3>
                  <div className="space-y-2">
                    {metadata.pricing.map((price, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                        <span className="text-sm text-gray-700">{price.tier || 'Standard'}</span>
                        <span className="font-semibold text-teal-700">
                          £{price.amount?.toLocaleString()}{price.frequency === 'monthly' ? '/month' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ROI */}
              {metadata?.roi_calculation_method && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-2">Expected Return</h3>
                  <p className="text-sm text-emerald-700">{metadata.roi_calculation_method}</p>
                </div>
              )}

              {/* Manual Download */}
              {manualUrl && (
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <FileText className="w-6 h-6" />
                  <div className="flex-1">
                    <p className="font-medium">Service Manual</p>
                    <p className="text-sm text-slate-300">View full details and methodology</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-400" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Questions? Your advisor can explain how this fits your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetailPopup;



