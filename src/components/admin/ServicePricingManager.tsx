// ============================================================================
// SERVICE PRICING MANAGER
// ============================================================================
// Admin component for managing service line pricing
// Replaces hardcoded pricing in edge functions
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import {
  Plus,
  Trash2,
  Save,
  Edit2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Check,
  DollarSign,
  RefreshCw
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ServicePricingTier {
  id?: string;
  tier_name: string;
  tier_code: string;
  price: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annual';
  description: string;
  features: string[];
  display_order: number;
  is_popular: boolean;
  is_active: boolean;
}

interface ServicePricing {
  id?: string;
  service_code: string;
  service_name: string;
  description: string;
  category: 'financial' | 'operational' | 'strategic' | 'implementation' | 'analysis';
  pricing_model: 'tiered' | 'fixed' | 'hourly' | 'custom';
  display_order: number;
  is_active: boolean;
  exclude_from_recommendations: boolean;
  tiers: ServicePricingTier[];
}

// ============================================================================
// CATEGORY OPTIONS
// ============================================================================

const CATEGORY_OPTIONS = [
  { value: 'financial', label: 'Financial', color: 'emerald' },
  { value: 'operational', label: 'Operational', color: 'blue' },
  { value: 'strategic', label: 'Strategic', color: 'purple' },
  { value: 'implementation', label: 'Implementation', color: 'amber' },
  { value: 'analysis', label: 'Analysis', color: 'rose' },
];

const FREQUENCY_OPTIONS = [
  { value: 'one_time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicePricingManager() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServicePricing | null>(null);
  const [editingTier, setEditingTier] = useState<{ serviceCode: string; tier: ServicePricingTier } | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddTier, setShowAddTier] = useState<string | null>(null);

  // ========================================
  // Data fetching
  // ========================================

  const fetchPricing = async () => {
    if (!currentMember?.practice_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('practice_id', currentMember.practice_id)
        .order('display_order', { ascending: true });

      if (servicesError) throw servicesError;

      // Fetch tiers for all services
      const { data: tiersData, error: tiersError } = await supabase
        .from('service_pricing_tiers')
        .select('*, service_pricing!inner(practice_id)')
        .eq('service_pricing.practice_id', currentMember.practice_id)
        .order('display_order', { ascending: true });

      if (tiersError) throw tiersError;

      // Combine services with their tiers
      const combined = (servicesData || []).map(service => ({
        ...service,
        tiers: (tiersData || [])
          .filter((t: any) => t.service_pricing_id === service.id)
          .map((t: any) => ({
            id: t.id,
            tier_name: t.tier_name,
            tier_code: t.tier_code,
            price: parseFloat(t.price),
            frequency: t.frequency,
            description: t.description || '',
            features: t.features || [],
            display_order: t.display_order,
            is_popular: t.is_popular,
            is_active: t.is_active,
          }))
      }));

      setServices(combined);
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      setError(err.message || 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [currentMember?.practice_id]);

  // ========================================
  // Seed defaults
  // ========================================

  const seedDefaults = async () => {
    if (!currentMember?.practice_id) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { error } = await supabase.rpc('seed_default_service_pricing', {
        p_practice_id: currentMember.practice_id,
        p_user_id: user?.id
      });

      if (error) throw error;

      setSuccess('Default pricing loaded successfully');
      await fetchPricing();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error seeding defaults:', err);
      setError(err.message || 'Failed to load defaults');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Service CRUD
  // ========================================

  const handleSaveService = async (service: ServicePricing) => {
    if (!currentMember?.practice_id) return;
    
    setSaving(true);
    setError(null);

    try {
      if (service.id) {
        // Update existing
        const { error } = await supabase
          .from('service_pricing')
          .update({
            service_code: service.service_code,
            service_name: service.service_name,
            description: service.description,
            category: service.category,
            pricing_model: service.pricing_model,
            display_order: service.display_order,
            is_active: service.is_active,
            exclude_from_recommendations: service.exclude_from_recommendations || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id);

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('service_pricing')
          .insert({
            practice_id: currentMember.practice_id,
            service_code: service.service_code,
            service_name: service.service_name,
            description: service.description,
            category: service.category,
            pricing_model: service.pricing_model,
            display_order: service.display_order,
            is_active: service.is_active,
            exclude_from_recommendations: service.exclude_from_recommendations || false,
            created_by: user?.id
          });

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
      }

      setSuccess('Service saved successfully');
      setEditingService(null);
      setShowAddService(false);
      await fetchPricing();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving service:', err);
      setError(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Delete this service and all its tiers? This cannot be undone.')) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('service_pricing')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setSuccess('Service deleted');
      await fetchPricing();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting service:', err);
      setError(err.message || 'Failed to delete service');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Tier CRUD
  // ========================================

  const handleSaveTier = async (serviceId: string, tier: ServicePricingTier) => {
    setSaving(true);
    setError(null);

    try {
      if (tier.id) {
        // Update existing
        const { error } = await supabase
          .from('service_pricing_tiers')
          .update({
            tier_name: tier.tier_name,
            tier_code: tier.tier_code,
            price: tier.price,
            frequency: tier.frequency,
            description: tier.description,
            features: tier.features,
            display_order: tier.display_order,
            is_popular: tier.is_popular,
            is_active: tier.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', tier.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('service_pricing_tiers')
          .insert({
            service_pricing_id: serviceId,
            tier_name: tier.tier_name,
            tier_code: tier.tier_code,
            price: tier.price,
            frequency: tier.frequency,
            description: tier.description,
            features: tier.features,
            display_order: tier.display_order,
            is_popular: tier.is_popular,
            is_active: tier.is_active
          });

        if (error) throw error;
      }

      setSuccess('Tier saved successfully');
      setEditingTier(null);
      setShowAddTier(null);
      await fetchPricing();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving tier:', err);
      setError(err.message || 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Delete this pricing tier?')) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('service_pricing_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;

      setSuccess('Tier deleted');
      await fetchPricing();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting tier:', err);
      setError(err.message || 'Failed to delete tier');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Render
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Service Pricing
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage pricing for your service lines. Changes apply to all future reports.
          </p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <button
              onClick={seedDefaults}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              Load Defaults
            </button>
          )}
          <button
            onClick={() => {
              setShowAddService(true);
              setEditingService({
                service_code: '',
                service_name: '',
                description: '',
                category: 'strategic' as any,
                pricing_model: 'tiered',
                display_order: services.length * 10 + 10,
                is_active: true,
                exclude_from_recommendations: false,
                tiers: []
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
          <Check className="h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Empty state */}
      {services.length === 0 && !showAddService && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No pricing configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click "Load Defaults" to import standard pricing, or add services manually.
          </p>
        </div>
      )}

      {/* Add/Edit Service Form */}
      {(showAddService || editingService) && editingService && (
        <ServiceForm
          service={editingService}
          onSave={handleSaveService}
          onCancel={() => {
            setShowAddService(false);
            setEditingService(null);
          }}
          saving={saving}
        />
      )}

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.id || service.service_code}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Service Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
              onClick={() => setExpandedService(
                expandedService === service.service_code ? null : service.service_code
              )}
            >
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  CATEGORY_OPTIONS.find(c => c.value === service.category)?.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                  CATEGORY_OPTIONS.find(c => c.value === service.category)?.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                  CATEGORY_OPTIONS.find(c => c.value === service.category)?.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                  CATEGORY_OPTIONS.find(c => c.value === service.category)?.color === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                }`}>
                  {service.category}
                </span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {service.service_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {service.tiers.length} tier{service.tiers.length !== 1 ? 's' : ''} • 
                    {service.tiers.length > 0 && ` £${Math.min(...service.tiers.map(t => t.price))} - £${Math.max(...service.tiers.map(t => t.price))}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!service.is_active && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    Inactive
                  </span>
                )}
                {service.exclude_from_recommendations && (
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded">
                    Paused
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingService(service);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    service.id && handleDeleteService(service.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {expandedService === service.service_code ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Tiers */}
            {expandedService === service.service_code && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-850">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Pricing Tiers
                  </h4>
                  <button
                    onClick={() => setShowAddTier(service.service_code)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Tier
                  </button>
                </div>

                {/* Add Tier Form */}
                {showAddTier === service.service_code && (
                  <TierForm
                    tier={{
                      tier_name: '',
                      tier_code: '',
                      price: 0,
                      frequency: 'one_time',
                      description: '',
                      features: [],
                      display_order: service.tiers.length + 1,
                      is_popular: false,
                      is_active: true
                    }}
                    onSave={(tier) => service.id && handleSaveTier(service.id, tier)}
                    onCancel={() => setShowAddTier(null)}
                    saving={saving}
                  />
                )}

                {/* Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {service.tiers.map((tier) => (
                    <div
                      key={tier.id || tier.tier_code}
                      className={`p-4 bg-white dark:bg-gray-800 rounded-lg border ${
                        tier.is_popular 
                          ? 'border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900' 
                          : 'border-gray-200 dark:border-gray-700'
                      } ${!tier.is_active ? 'opacity-50' : ''}`}
                    >
                      {editingTier?.serviceCode === service.service_code && editingTier?.tier.id === tier.id ? (
                        <TierForm
                          tier={editingTier.tier}
                          onSave={(t) => service.id && handleSaveTier(service.id, t)}
                          onCancel={() => setEditingTier(null)}
                          saving={saving}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              {tier.is_popular && (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  MOST POPULAR
                                </span>
                              )}
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {tier.tier_name}
                              </h5>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingTier({ serviceCode: service.service_code, tier })}
                                className="p-1 text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => tier.id && handleDeleteTier(tier.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            £{tier.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-500">
                              /{tier.frequency.replace('_', ' ')}
                            </span>
                          </div>
                          {tier.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {tier.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SERVICE FORM
// ============================================================================

function ServiceForm({
  service,
  onSave,
  onCancel,
  saving
}: {
  service: ServicePricing;
  onSave: (service: ServicePricing) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(service);

  // Reset form when service changes (important for editing different services)
  useEffect(() => {
    setForm(service);
  }, [service.id, service.service_code]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">
        {service.id ? 'Edit Service' : 'Add New Service'}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Name</label>
          <input
            type="text"
            value={form.service_name}
            onChange={(e) => setForm({ ...form, service_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="e.g., Management Accounts"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Service Code</label>
          <input
            type="text"
            value={form.service_code}
            onChange={(e) => setForm({ ...form, service_code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="e.g., management_accounts"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Brief description of the service"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Display Order</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="col-span-2 flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.exclude_from_recommendations || false}
              onChange={(e) => setForm({ ...form, exclude_from_recommendations: e.target.checked })}
              className="rounded border-amber-300"
            />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Exclude from AI recommendations
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.service_name || !form.service_code}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Service
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// TIER FORM
// ============================================================================

function TierForm({
  tier,
  onSave,
  onCancel,
  saving
}: {
  tier: ServicePricingTier;
  onSave: (tier: ServicePricingTier) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(tier);

  // Reset form when tier changes
  useEffect(() => {
    setForm(tier);
  }, [tier.id, tier.tier_code]);

  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Tier Name</label>
          <input
            type="text"
            value={form.tier_name}
            onChange={(e) => setForm({ ...form, tier_name: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="e.g., Growth"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Tier Code</label>
          <input
            type="text"
            value={form.tier_code}
            onChange={(e) => setForm({ ...form, tier_code: e.target.value.toLowerCase() })}
            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="e.g., growth"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Price (£)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}
            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            {FREQUENCY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="What's included in this tier"
          />
        </div>
        <div className="col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
              className="rounded"
            />
            Most Popular
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded"
            />
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.tier_name || !form.price}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Save
        </button>
      </div>
    </div>
  );
}

export default ServicePricingManager;

