import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Pin, Search, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

interface Service {
  code: string;
  name: string;
  headline: string;
  category: string;
  price_from: number;
  price_to: number;
  price_unit: string;
}

interface EngagementService {
  service_code: string;
  selection_type: 'pinned' | 'blocked' | 'suggested';
  reason?: string;
  include_in_value_calc: boolean;
}

interface ClientPreferences {
  avoidsInternalHires?: boolean;
  prefersExternalSupport?: boolean;
  prefersProjectBasis?: boolean;
  needsSystemsAudit?: boolean;
  needsDocumentation?: boolean;
}

interface ServiceSelectionPanelProps {
  engagementId: string;
  clientName: string;
  contextNotes?: string;
  clientPreferences?: ClientPreferences;
  onSelectionChange?: () => void;
}

// Category display names and order
const CATEGORY_ORDER = [
  { key: 'governance', label: 'Governance & Systems' },
  { key: 'operations', label: 'Operations' },
  { key: 'growth', label: 'Growth & Strategy' },
  { key: 'finance', label: 'Finance' },
  { key: 'exit', label: 'Exit & Succession' },
  { key: 'other', label: 'Other' },
];

export function ServiceSelectionPanel({
  engagementId,
  clientName,
  contextNotes,
  clientPreferences,
  onSelectionChange,
}: ServiceSelectionPanelProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selections, setSelections] = useState<EngagementService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [engagementId]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load all active services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('code, name, headline, category, price_from, price_to, price_unit')
        .eq('status', 'active')
        .order('category', { ascending: true });
      
      if (servicesError) {
        console.error('Error loading services:', servicesError);
      }
      
      // Load current selections for this engagement
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('bm_engagement_services')
        .select('service_code, selection_type, reason, include_in_value_calc')
        .eq('engagement_id', engagementId);
      
      if (selectionsError) {
        console.error('Error loading selections:', selectionsError);
      }
      
      setServices(servicesData || []);
      setSelections(selectionsData || []);
      
      // Generate suggestions based on context
      generateSuggestions();
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = () => {
    const suggested: string[] = [];
    
    // From clientPreferences
    if (clientPreferences?.needsSystemsAudit || clientPreferences?.needsDocumentation) {
      suggested.push('SYSTEMS_AUDIT');
    }
    if (clientPreferences?.avoidsInternalHires || clientPreferences?.prefersExternalSupport) {
      suggested.push('STRATEGIC_ADVISORY');
    }
    
    // From context notes text
    if (contextNotes) {
      const content = contextNotes.toLowerCase();
      
      if (content.includes('loose') || content.includes('documentation') || content.includes('in heads')) {
        if (!suggested.includes('SYSTEMS_AUDIT')) {
          suggested.push('SYSTEMS_AUDIT');
        }
      }
      if (content.includes('external') || content.includes('project basis')) {
        if (!suggested.includes('STRATEGIC_ADVISORY')) {
          suggested.push('STRATEGIC_ADVISORY');
        }
      }
      if (content.includes('exit') || content.includes('succession') || content.includes('sale')) {
        suggested.push('EXIT_READINESS');
      }
      if (content.includes('concentration') || content.includes('diversif')) {
        suggested.push('GOAL_ALIGNMENT');
      }
    }
    
    setSuggestions(suggested);
  };

  const updateSelection = async (
    serviceCode: string, 
    selectionType: 'pinned' | 'blocked' | null,
    reason?: string
  ) => {
    setSaving(serviceCode);
    
    try {
      if (selectionType === null) {
        // Remove selection
        const { error } = await supabase
          .from('bm_engagement_services')
          .delete()
          .eq('engagement_id', engagementId)
          .eq('service_code', serviceCode);
        
        if (error) throw error;
        
        setSelections(prev => prev.filter(s => s.service_code !== serviceCode));
      } else {
        // Upsert selection
        const { data, error } = await supabase
          .from('bm_engagement_services')
          .upsert({
            engagement_id: engagementId,
            service_code: serviceCode,
            selection_type: selectionType,
            reason: reason || null,
            include_in_value_calc: true,
          }, {
            onConflict: 'engagement_id,service_code',
          })
          .select('service_code, selection_type, reason, include_in_value_calc')
          .single();
        
        if (error) throw error;
        
        if (data) {
          setSelections(prev => {
            const existing = prev.findIndex(s => s.service_code === serviceCode);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = data;
              return updated;
            }
            return [...prev, data];
          });
        }
      }
      
      onSelectionChange?.();
    } catch (err) {
      console.error('Error updating selection:', err);
    } finally {
      setSaving(null);
    }
  };

  const getSelectionForService = (code: string) => 
    selections.find(s => s.service_code === code);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedServices = filteredServices.reduce((acc, service) => {
    const category = service.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const pinnedCount = selections.filter(s => s.selection_type === 'pinned').length;
  const blockedCount = selections.filter(s => s.selection_type === 'blocked').length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Service Selection for {clientName}
        </h3>
        <p className="text-sm text-gray-600">
          Pin services to always include them in recommendations, or block services that aren't appropriate for this client.
        </p>
        
        {/* Quick stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <Pin className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-600">{pinnedCount} pinned</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <X className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">{blockedCount} blocked</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Context-based Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">Suggested based on context notes:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(code => {
                const service = services.find(s => s.code === code);
                const selection = getSelectionForService(code);
                if (!service) return null;
                
                return (
                  <button
                    key={code}
                    onClick={() => !selection && updateSelection(code, 'pinned', 'Suggested from context notes')}
                    disabled={!!selection || saving === code}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selection?.selection_type === 'pinned'
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : selection?.selection_type === 'blocked'
                        ? 'bg-red-100 text-red-700 cursor-default'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                    }`}
                  >
                    {saving === code ? (
                      <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                    ) : null}
                    {service.name}
                    {selection?.selection_type === 'pinned' && ' ✓'}
                    {!selection && ' + Pin'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Currently Selected */}
        {selections.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Currently Selected:</h4>
            <div className="flex flex-wrap gap-2">
              {selections.map(selection => {
                const service = services.find(s => s.code === selection.service_code);
                return (
                  <div
                    key={selection.service_code}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      selection.selection_type === 'pinned'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selection.selection_type === 'pinned' ? (
                      <Pin className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    <span>{service?.name || selection.service_code}</span>
                    <button
                      onClick={() => updateSelection(selection.service_code, null)}
                      disabled={saving === selection.service_code}
                      className="ml-1 hover:opacity-70 disabled:opacity-50"
                      title="Remove selection"
                    >
                      {saving === selection.service_code ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        '×'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service List by Category */}
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {CATEGORY_ORDER.map(({ key: category, label }) => {
            const categoryServices = groupedServices[category];
            if (!categoryServices || categoryServices.length === 0) return null;
            
            return (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {label}
                </h4>
                <div className="space-y-2">
                  {categoryServices.map(service => {
                    const selection = getSelectionForService(service.code);
                    const isSuggested = suggestions.includes(service.code);
                    const isSaving = saving === service.code;
                    
                    return (
                      <div
                        key={service.code}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selection?.selection_type === 'pinned'
                            ? 'border-emerald-300 bg-emerald-50'
                            : selection?.selection_type === 'blocked'
                            ? 'border-red-300 bg-red-50'
                            : isSuggested
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            {isSuggested && !selection && (
                              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                                Suggested
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{service.headline}</p>
                          <p className="text-xs text-gray-500">
                            £{service.price_from?.toLocaleString()}-£{service.price_to?.toLocaleString()} {
                              service.price_unit === 'per_month' ? '/month' : 
                              service.price_unit === 'one_off' ? '(one-off)' : 
                              service.price_unit
                            }
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => updateSelection(
                              service.code, 
                              selection?.selection_type === 'pinned' ? null : 'pinned',
                              isSuggested ? 'Suggested from context notes' : undefined
                            )}
                            disabled={isSaving}
                            className={`p-2 rounded-lg transition-colors ${
                              selection?.selection_type === 'pinned'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600'
                            } disabled:opacity-50`}
                            title={selection?.selection_type === 'pinned' ? 'Unpin this service' : 'Pin this service'}
                          >
                            {isSaving && selection?.selection_type === 'pinned' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pin className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => updateSelection(
                              service.code,
                              selection?.selection_type === 'blocked' ? null : 'blocked'
                            )}
                            disabled={isSaving}
                            className={`p-2 rounded-lg transition-colors ${
                              selection?.selection_type === 'blocked'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                            } disabled:opacity-50`}
                            title={selection?.selection_type === 'blocked' ? 'Unblock this service' : 'Block this service'}
                          >
                            {isSaving && selection?.selection_type === 'blocked' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Handle uncategorized services */}
          {Object.entries(groupedServices)
            .filter(([cat]) => !CATEGORY_ORDER.some(c => c.key === cat))
            .map(([category, categoryServices]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryServices.map(service => {
                    const selection = getSelectionForService(service.code);
                    const isSuggested = suggestions.includes(service.code);
                    const isSaving = saving === service.code;
                    
                    return (
                      <div
                        key={service.code}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selection?.selection_type === 'pinned'
                            ? 'border-emerald-300 bg-emerald-50'
                            : selection?.selection_type === 'blocked'
                            ? 'border-red-300 bg-red-50'
                            : isSuggested
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            {isSuggested && !selection && (
                              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                                Suggested
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{service.headline}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => updateSelection(
                              service.code, 
                              selection?.selection_type === 'pinned' ? null : 'pinned'
                            )}
                            disabled={isSaving}
                            className={`p-2 rounded-lg transition-colors ${
                              selection?.selection_type === 'pinned'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600'
                            } disabled:opacity-50`}
                            title="Pin this service"
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateSelection(
                              service.code,
                              selection?.selection_type === 'blocked' ? null : 'blocked'
                            )}
                            disabled={isSaving}
                            className={`p-2 rounded-lg transition-colors ${
                              selection?.selection_type === 'blocked'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                            } disabled:opacity-50`}
                            title="Block this service"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          }
        </div>

        {/* Info Footer */}
        <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>How this works:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li><strong>Pinned</strong> services will always appear in recommendations</li>
                <li><strong>Blocked</strong> services will never be recommended</li>
                <li>Regenerate the analysis after making changes for them to take effect</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceSelectionPanel;
