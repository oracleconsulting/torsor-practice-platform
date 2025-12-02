// ============================================================================
// SERVICE CONFIGURATION PAGE
// ============================================================================
// Edit service lines, workflow phases, tiers, and deliverables
// ============================================================================

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, Plus, ChevronRight,
  Target, TrendingUp, Settings, LineChart, Briefcase,
  BarChart3, Shield, Edit2, GripVertical, Check,
  Layers, Workflow, DollarSign, Package
} from 'lucide-react';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments' | 'delivery' | 'config';

interface ServiceConfigPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface ServiceLine {
  code: string;
  name: string;
  icon: any;
  color: string;
}

interface WorkflowPhase {
  id: string;
  phase_code: string;
  phase_name: string;
  description: string;
  typical_duration: string;
  display_order: number;
  icon: string;
  color: string;
}

interface ServiceTier {
  id: string;
  tier_code: string;
  tier_name: string;
  description: string;
  display_order: number;
  monthly_fee: number;
  setup_fee: number;
  included_hours_per_month: number;
  is_popular: boolean;
}

interface Deliverable {
  id: string;
  code: string;
  name: string;
  description: string;
  workflow_phase_code: string;
  included_in_tiers: string[];
  is_addon: boolean;
  addon_price: number;
  estimated_hours_per_cycle: number;
  delivery_frequency: string;
}

const SERVICE_LINES: ServiceLine[] = [
  { code: '365_method', name: '365 Alignment', icon: Target, color: 'indigo' },
  { code: 'management_accounts', name: 'Management Accounts', icon: LineChart, color: 'emerald' },
  { code: 'fractional_cfo', name: 'Fractional CFO', icon: TrendingUp, color: 'blue' },
  { code: 'fractional_coo', name: 'Fractional COO', icon: Briefcase, color: 'violet' },
  { code: 'systems_audit', name: 'Systems Audit', icon: Settings, color: 'amber' },
  { code: 'business_advisory', name: 'Business Advisory', icon: Shield, color: 'rose' },
  { code: 'benchmarking', name: 'Benchmarking', icon: BarChart3, color: 'teal' },
];

type Tab = 'workflow' | 'tiers' | 'deliverables';

export function ServiceConfigPage({ currentPage, onNavigate }: ServiceConfigPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('workflow');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);
  const [tiers, setTiers] = useState<ServiceTier[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  
  // Edit states
  const [editingPhase, setEditingPhase] = useState<WorkflowPhase | null>(null);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);

  useEffect(() => {
    if (selectedService && currentMember?.practice_id) {
      loadServiceData();
    }
  }, [selectedService, currentMember?.practice_id]);

  const loadServiceData = async () => {
    if (!selectedService) return;
    setLoading(true);
    
    try {
      const [phasesRes, tiersRes, deliverablesRes] = await Promise.all([
        supabase
          .from('service_workflow_phases')
          .select('*')
          .or(`practice_id.is.null,practice_id.eq.${currentMember?.practice_id}`)
          .eq('service_line_code', selectedService)
          .order('display_order'),
        supabase
          .from('service_tiers')
          .select('*')
          .or(`practice_id.is.null,practice_id.eq.${currentMember?.practice_id}`)
          .eq('service_line_code', selectedService)
          .order('display_order'),
        supabase
          .from('service_deliverables')
          .select('*')
          .eq('service_line_code', selectedService)
          .order('display_order')
      ]);

      setPhases(phasesRes.data || []);
      setTiers(tiersRes.data || []);
      setDeliverables(deliverablesRes.data || []);
    } catch (err) {
      console.error('Error loading service data:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePhase = async (phase: WorkflowPhase) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('service_workflow_phases')
        .upsert({
          ...phase,
          practice_id: currentMember?.practice_id,
          service_line_code: selectedService,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setEditingPhase(null);
      loadServiceData();
    } catch (err) {
      console.error('Error saving phase:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveTier = async (tier: ServiceTier) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('service_tiers')
        .upsert({
          ...tier,
          practice_id: currentMember?.practice_id,
          service_line_code: selectedService,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setEditingTier(null);
      loadServiceData();
    } catch (err) {
      console.error('Error saving tier:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateDeliverableTiers = async (deliverableId: string, tierCodes: string[]) => {
    try {
      await supabase
        .from('service_deliverables')
        .update({ included_in_tiers: tierCodes })
        .eq('id', deliverableId);
      
      loadServiceData();
    } catch (err) {
      console.error('Error updating deliverable:', err);
    }
  };

  const updateDeliverablePhase = async (deliverableId: string, phaseCode: string) => {
    try {
      await supabase
        .from('service_deliverables')
        .update({ workflow_phase_code: phaseCode })
        .eq('id', deliverableId);
      
      loadServiceData();
    } catch (err) {
      console.error('Error updating deliverable:', err);
    }
  };

  const serviceInfo = SERVICE_LINES.find(s => s.code === selectedService);

  // Service selection view
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage={currentPage} onNavigate={onNavigate} />
        
        <main className="ml-64 p-8">
          <button
            onClick={() => onNavigate('delivery')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Delivery Management</span>
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Service Configuration</h1>
            <p className="text-gray-600 mt-1">
              Configure workflow phases, pricing tiers, and deliverables
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_LINES.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.code}
                  onClick={() => setSelectedService(service.code)}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-${service.color}-100`}>
                      <Icon className={`w-6 h-6 text-${service.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Configure service</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  const Icon = serviceInfo?.icon || Target;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedService(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-${serviceInfo?.color}-100`}>
                <Icon className={`w-6 h-6 text-${serviceInfo?.color}-600`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{serviceInfo?.name}</h1>
                <p className="text-sm text-gray-500">Service Configuration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'workflow' as Tab, label: 'Workflow Phases', icon: Workflow },
              { id: 'tiers' as Tab, label: 'Pricing Tiers', icon: Layers },
              { id: 'deliverables' as Tab, label: 'Deliverables', icon: Package },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Workflow Tab */}
                {activeTab === 'workflow' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Workflow Phases</h3>
                      <button
                        onClick={() => setEditingPhase({
                          id: '',
                          phase_code: '',
                          phase_name: '',
                          description: '',
                          typical_duration: '',
                          display_order: phases.length + 1,
                          icon: 'Circle',
                          color: 'gray'
                        })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Phase
                      </button>
                    </div>

                    <div className="space-y-2">
                      {phases.map((phase, index) => (
                        <div 
                          key={phase.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg group"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div className={`w-8 h-8 rounded-lg bg-${phase.color}-100 flex items-center justify-center text-${phase.color}-600 font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{phase.phase_name}</h4>
                            <p className="text-sm text-gray-500">{phase.description}</p>
                          </div>
                          <span className="text-sm text-gray-400">{phase.typical_duration}</span>
                          <button
                            onClick={() => setEditingPhase(phase)}
                            className="p-2 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tiers Tab */}
                {activeTab === 'tiers' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Pricing Tiers</h3>
                      <button
                        onClick={() => setEditingTier({
                          id: '',
                          tier_code: '',
                          tier_name: '',
                          description: '',
                          display_order: tiers.length + 1,
                          monthly_fee: 0,
                          setup_fee: 0,
                          included_hours_per_month: 0,
                          is_popular: false
                        })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Tier
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {tiers.map((tier) => (
                        <div 
                          key={tier.id}
                          className={`relative p-6 rounded-xl border-2 ${
                            tier.is_popular 
                              ? 'border-indigo-500 bg-indigo-50/50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          {tier.is_popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                                Popular
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{tier.tier_name}</h4>
                              <p className="text-sm text-gray-500">{tier.description}</p>
                            </div>
                            <button
                              onClick={() => setEditingTier(tier)}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">
                              £{tier.monthly_fee?.toLocaleString()}
                            </span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-500" />
                              {tier.included_hours_per_month}h included
                            </div>
                            {tier.setup_fee > 0 && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                £{tier.setup_fee} setup
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables Tab */}
                {activeTab === 'deliverables' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Deliverables by Phase</h3>
                    
                    {phases.map((phase) => {
                      const phaseDeliverables = deliverables.filter(d => d.workflow_phase_code === phase.phase_code);
                      
                      return (
                        <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className={`px-4 py-3 bg-${phase.color}-50 border-b border-${phase.color}-100`}>
                            <h4 className={`font-medium text-${phase.color}-800`}>{phase.phase_name}</h4>
                          </div>
                          
                          <div className="p-4 space-y-2">
                            {phaseDeliverables.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">No deliverables assigned</p>
                            ) : (
                              phaseDeliverables.map((del) => (
                                <div key={del.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{del.name}</h5>
                                    <p className="text-sm text-gray-500">{del.description}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {tiers.map((tier) => {
                                      const isIncluded = del.included_in_tiers?.includes(tier.tier_code);
                                      return (
                                        <button
                                          key={tier.id}
                                          onClick={() => {
                                            const newTiers = isIncluded
                                              ? del.included_in_tiers.filter(t => t !== tier.tier_code)
                                              : [...(del.included_in_tiers || []), tier.tier_code];
                                            updateDeliverableTiers(del.id, newTiers);
                                          }}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            isIncluded
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                          }`}
                                          title={isIncluded ? `Included in ${tier.tier_name}` : `Not in ${tier.tier_name}`}
                                        >
                                          {tier.tier_name.substring(0, 3)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Unassigned deliverables */}
                    {deliverables.filter(d => !d.workflow_phase_code).length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                          <h4 className="font-medium text-gray-600">Unassigned</h4>
                        </div>
                        <div className="p-4 space-y-2">
                          {deliverables.filter(d => !d.workflow_phase_code).map((del) => (
                            <div key={del.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{del.name}</h5>
                              </div>
                              <select
                                value=""
                                onChange={(e) => updateDeliverablePhase(del.id, e.target.value)}
                                className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
                              >
                                <option value="">Assign to phase...</option>
                                {phases.map((phase) => (
                                  <option key={phase.id} value={phase.phase_code}>
                                    {phase.phase_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit Phase Modal */}
        {editingPhase && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingPhase.id ? 'Edit Phase' : 'Add Phase'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phase Name</label>
                  <input
                    type="text"
                    value={editingPhase.phase_name}
                    onChange={(e) => setEditingPhase({...editingPhase, phase_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={editingPhase.phase_code}
                    onChange={(e) => setEditingPhase({...editingPhase, phase_code: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="e.g., discovery, design, deliver"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingPhase.description}
                    onChange={(e) => setEditingPhase({...editingPhase, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typical Duration</label>
                  <input
                    type="text"
                    value={editingPhase.typical_duration}
                    onChange={(e) => setEditingPhase({...editingPhase, typical_duration: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="e.g., 1-2 weeks, Monthly, Ongoing"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setEditingPhase(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => savePhase(editingPhase)}
                  disabled={saving || !editingPhase.phase_name || !editingPhase.phase_code}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {saving ? 'Saving...' : 'Save Phase'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tier Modal */}
        {editingTier && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingTier.id ? 'Edit Tier' : 'Add Tier'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                    <input
                      type="text"
                      value={editingTier.tier_name}
                      onChange={(e) => setEditingTier({...editingTier, tier_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={editingTier.tier_code}
                      onChange={(e) => setEditingTier({...editingTier, tier_code: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editingTier.description}
                    onChange={(e) => setEditingTier({...editingTier, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (£)</label>
                    <input
                      type="number"
                      value={editingTier.monthly_fee}
                      onChange={(e) => setEditingTier({...editingTier, monthly_fee: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Setup Fee (£)</label>
                    <input
                      type="number"
                      value={editingTier.setup_fee}
                      onChange={(e) => setEditingTier({...editingTier, setup_fee: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Hours/Month</label>
                  <input
                    type="number"
                    value={editingTier.included_hours_per_month}
                    onChange={(e) => setEditingTier({...editingTier, included_hours_per_month: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_popular"
                    checked={editingTier.is_popular}
                    onChange={(e) => setEditingTier({...editingTier, is_popular: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="is_popular" className="text-sm text-gray-700">Mark as recommended/popular tier</label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveTier(editingTier)}
                  disabled={saving || !editingTier.tier_name || !editingTier.tier_code}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {saving ? 'Saving...' : 'Save Tier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ServiceConfigPage;

