// ============================================================================
// SYSTEMS AUDIT - STAGE 2: SYSTEM INVENTORY
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Settings, Plus, Edit2, Trash2, Save, X, CheckCircle,
  Loader2, AlertCircle
} from 'lucide-react';

interface SystemCategory {
  id: string;
  category_code: string;
  category_name: string;
  common_systems: string[];
}

interface SystemInventory {
  id: string;
  system_name: string;
  category_code: string;
  sub_category?: string;
  vendor?: string;
  website_url?: string;
  primary_users: string[];
  number_of_users?: number;
  usage_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  usage_frequency_context?: string;
  criticality: 'critical' | 'important' | 'nice_to_have';
  pricing_model: 'monthly' | 'annual' | 'per_user' | 'one_time' | 'free';
  monthly_cost?: number;
  annual_cost?: number;
  cost_trend: 'increasing' | 'stable' | 'decreasing' | 'dont_know';
  cost_trend_context?: string;
  integrates_with?: string[];
  integrates_with_names?: string[];
  integration_method: 'native' | 'zapier_make' | 'custom_api' | 'manual' | 'none';
  manual_transfer_required: boolean;
  manual_hours_monthly?: number;
  manual_process_description?: string;
  data_quality_score?: number;
  data_entry_method?: 'single_point' | 'duplicated' | 'dont_know';
  data_entry_context?: string;
  user_satisfaction?: number;
  fit_for_purpose?: number;
  would_recommend?: 'yes' | 'maybe' | 'no';
  known_issues?: string;
  workarounds_in_use?: string;
  change_one_thing?: string;
  future_plan: 'keep' | 'replace' | 'upgrade' | 'unsure';
  future_plan_context?: string;
  replacement_candidate?: string;
  contract_end_date?: string;
  created_at: string;
}

export default function SystemInventoryPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [engagementId, setEngagementId] = useState<string | null>(null);
  const [systems, setSystems] = useState<SystemInventory[]>([]);
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SystemInventory>>({
    system_name: '',
    category_code: '',
    usage_frequency: 'daily',
    criticality: 'important',
    pricing_model: 'monthly',
    cost_trend: 'stable',
    integration_method: 'none',
    manual_transfer_required: false,
    future_plan: 'keep',
    primary_users: [],
    data_entry_method: 'single_point',
    would_recommend: 'yes'
  });

  useEffect(() => {
    loadData();
  }, [clientSession?.clientId]);

  const loadData = async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading Systems Audit engagement for client:', clientSession.clientId);
      
      // Fetch engagement - try to find existing one
      let { data: engagement, error: engError } = await supabase
        .from('sa_engagements')
        .select('id, status, stage_1_completed_at')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      console.log('📊 Engagement query result:', { engagement, engError });

      // If error, log it but try to create engagement
      if (engError) {
        console.error('⚠️ Error fetching engagement:', engError);
        // Continue to try creating one
      }

      // If no engagement found, create one (shouldn't happen if Stage 1 was completed, but handle it)
      if (!engagement) {
        console.log('📝 No engagement found, attempting to create new one...');
        console.log('📝 Client ID:', clientSession.clientId);
        console.log('📝 Practice ID:', clientSession.practiceId);
        
        const { data: newEngagement, error: createError } = await supabase
          .from('sa_engagements')
          .insert({
            client_id: clientSession.clientId,
            practice_id: clientSession.practiceId,
            status: 'stage_1_complete',
            stage_1_completed_at: new Date().toISOString()
          })
          .select('id, status, stage_1_completed_at')
          .single();

        console.log('📊 Create engagement result:', { newEngagement, createError });

        if (createError) {
          console.error('❌ Error creating engagement:', createError);
          console.error('❌ Error details:', JSON.stringify(createError, null, 2));
          setLoading(false);
          return;
        }

        engagement = newEngagement;
        console.log('✅ Created new engagement:', engagement);
      }

      if (!engagement?.id) {
        console.error('❌ No engagement ID available');
        setLoading(false);
        return;
      }

      setEngagementId(engagement.id);
      console.log('✅ Engagement ID set:', engagement.id);

      // Fetch existing systems
      const { data: systemsData, error: systemsError } = await supabase
        .from('sa_system_inventory')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('created_at', { ascending: false });

      if (systemsError) {
        console.error('Error fetching systems:', systemsError);
      } else {
        setSystems(systemsData || []);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('sa_system_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSystem = () => {
    setFormData({
      system_name: '',
      category_code: '',
      usage_frequency: 'daily',
      criticality: 'important',
      pricing_model: 'monthly',
      cost_trend: 'stable',
      integration_method: 'none',
      manual_transfer_required: false,
      future_plan: 'keep',
      primary_users: [],
      data_entry_method: 'single_point',
      would_recommend: 'yes'
    });
    setEditingId(null);
    setShowAddForm(true);
  };

  const handleEditSystem = (system: SystemInventory) => {
    setFormData({
      system_name: system.system_name,
      category_code: system.category_code,
      sub_category: system.sub_category,
      vendor: system.vendor,
      website_url: system.website_url,
      primary_users: system.primary_users || [],
      number_of_users: system.number_of_users,
      usage_frequency: system.usage_frequency,
      criticality: system.criticality,
      pricing_model: system.pricing_model,
      monthly_cost: system.monthly_cost,
      annual_cost: system.annual_cost,
      cost_trend: system.cost_trend,
      integrates_with: system.integrates_with || [],
      integrates_with_names: system.integrates_with_names || [],
      integration_method: system.integration_method,
      manual_transfer_required: system.manual_transfer_required,
      manual_hours_monthly: system.manual_hours_monthly,
      manual_process_description: system.manual_process_description,
      data_quality_score: system.data_quality_score,
      data_entry_method: system.data_entry_method || 'single_point',
      user_satisfaction: system.user_satisfaction,
      fit_for_purpose: system.fit_for_purpose,
      would_recommend: system.would_recommend || 'yes',
      known_issues: system.known_issues,
      workarounds_in_use: system.workarounds_in_use,
      change_one_thing: system.change_one_thing,
      future_plan: system.future_plan,
      replacement_candidate: system.replacement_candidate,
      contract_end_date: system.contract_end_date
    });
    setEditingId(system.id);
    setShowAddForm(true);
  };

  const handleSaveSystem = async () => {
    if (!engagementId || !formData.system_name || !formData.category_code) {
      alert('Please fill in at least System Name and Category');
      return;
    }

    setSaving(true);
    try {
      const systemData = {
        engagement_id: engagementId,
        system_name: formData.system_name,
        category_code: formData.category_code,
        sub_category: formData.sub_category || null,
        vendor: formData.vendor || null,
        website_url: formData.website_url || null,
        primary_users: formData.primary_users || [],
        number_of_users: formData.number_of_users || null,
        usage_frequency: formData.usage_frequency || 'daily',
        usage_frequency_context: formData.usage_frequency_context || null,
        criticality: formData.criticality || 'important',
        pricing_model: formData.pricing_model || 'monthly',
        monthly_cost: formData.monthly_cost || null,
        annual_cost: formData.annual_cost || null,
        cost_trend: formData.cost_trend || 'stable',
        cost_trend_context: formData.cost_trend_context || null,
        integrates_with: formData.integrates_with || null,
        integrates_with_names: formData.integrates_with_names || null,
        integration_method: formData.integration_method || 'none',
        manual_transfer_required: formData.manual_transfer_required || false,
        manual_hours_monthly: formData.manual_hours_monthly || null,
        manual_process_description: formData.manual_process_description || null,
        data_quality_score: formData.data_quality_score || null,
        data_entry_method: formData.data_entry_method || 'single_point',
        data_entry_context: formData.data_entry_context || null,
        user_satisfaction: formData.user_satisfaction || null,
        fit_for_purpose: formData.fit_for_purpose || null,
        would_recommend: formData.would_recommend || 'yes',
        known_issues: formData.known_issues || null,
        workarounds_in_use: formData.workarounds_in_use || null,
        change_one_thing: formData.change_one_thing || null,
        future_plan: formData.future_plan || 'keep',
        future_plan_context: formData.future_plan_context || null,
        replacement_candidate: formData.replacement_candidate || null,
        contract_end_date: formData.contract_end_date || null
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('sa_system_inventory')
          .update(systemData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('sa_system_inventory')
          .insert(systemData);

        if (error) throw error;
      }

      await loadData();
      setShowAddForm(false);
      setEditingId(null);
    } catch (err: any) {
      console.error('Error saving system:', err);
      alert(`Error saving system: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSystem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this system?')) return;

    try {
      const { error } = await supabase
        .from('sa_system_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (err: any) {
      console.error('Error deleting system:', err);
      alert(`Error deleting system: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCompleteStage2 = async () => {
    if (systems.length === 0) {
      alert('Please add at least one system before completing Stage 2');
      return;
    }

    if (!engagementId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sa_engagements')
        .update({
          status: 'stage_2_complete',
          stage_2_completed_at: new Date().toISOString()
        })
        .eq('id', engagementId);

      if (error) throw error;

      // Navigate to Stage 3 (Process Deep Dives)
      navigate('/service/systems_audit/process-deep-dives');
    } catch (err: any) {
      console.error('Error completing stage 2:', err);
      alert(`Error completing stage: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.category_code === formData.category_code);
  const primaryUserOptions = ['Admin', 'Everyone', 'Finance', 'HR', 'Operations', 'Owner', 'Sales'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!engagementId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Engagement Found</h2>
          <p className="text-gray-600 mb-6">Please complete Stage 1 first.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Systems Audit - Stage 2</h1>
                <p className="text-gray-600">System Inventory</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddSystem}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add System
              </button>
              {systems.length > 0 && (
                <button
                  onClick={handleCompleteStage2}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Complete Stage 2
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit System' : 'Add New System'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* System Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.system_name || ''}
                  onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Xero, HubSpot, Slack"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_code || ''}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a category</option>
                  {[...categories]
                    .sort((a, b) => a.category_name.localeCompare(b.category_name))
                    .map(cat => (
                      <option key={cat.id} value={cat.category_code}>
                        {cat.category_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor || ''}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Xero Limited"
                />
              </div>

              {/* Usage Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.usage_frequency || 'daily'}
                  onChange={(e) => setFormData({ ...formData, usage_frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="rarely">Rarely</option>
                  <option value="weekly">Weekly</option>
                </select>
                <input
                  type="text"
                  value={formData.usage_frequency_context || ''}
                  onChange={(e) => setFormData({ ...formData, usage_frequency_context: e.target.value })}
                  className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Optional: e.g., supposed to be daily — actual compliance ~60%"
                />
              </div>

              {/* Criticality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criticality <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.criticality || 'important'}
                  onChange={(e) => setFormData({ ...formData, criticality: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="critical">Critical</option>
                  <option value="important">Important</option>
                  <option value="nice_to_have">Nice to Have</option>
                </select>
              </div>

              {/* Primary Users */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Users</label>
                <div className="flex flex-wrap gap-2">
                  {primaryUserOptions.map(user => (
                    <label key={user} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.primary_users || []).includes(user)}
                        onChange={(e) => {
                          const current = formData.primary_users || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, primary_users: [...current, user] });
                          } else {
                            setFormData({ ...formData, primary_users: current.filter(u => u !== user) });
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{user}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Number of Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Users</label>
                <input
                  type="number"
                  value={formData.number_of_users || ''}
                  onChange={(e) => setFormData({ ...formData, number_of_users: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 5"
                />
              </div>

              {/* Pricing Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing Model <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.pricing_model || 'monthly'}
                  onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="annual">Annual</option>
                  <option value="free">Free</option>
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One-time</option>
                  <option value="per_user">Per User</option>
                </select>
              </div>

              {/* Monthly Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Cost (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_cost || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 29.99"
                />
              </div>

              {/* Annual Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Cost (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.annual_cost || ''}
                  onChange={(e) => setFormData({ ...formData, annual_cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 299.99"
                />
              </div>

              {/* Cost Trend */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Trend <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.cost_trend || 'stable'}
                  onChange={(e) => setFormData({ ...formData, cost_trend: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="decreasing">Decreasing</option>
                  <option value="dont_know">Don't Know</option>
                  <option value="increasing">Increasing</option>
                  <option value="stable">Stable</option>
                </select>
                <input
                  type="text"
                  value={formData.cost_trend_context || ''}
                  onChange={(e) => setFormData({ ...formData, cost_trend_context: e.target.value })}
                  className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Optional: e.g., adding seats as team grows"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., https://xero.com"
                />
              </div>
            </div>

            {/* Integration Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration & Manual Processes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Integration Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Integration Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.integration_method || 'none'}
                    onChange={(e) => setFormData({ ...formData, integration_method: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="custom_api">Custom API</option>
                    <option value="manual">Manual</option>
                    <option value="native">Native Integration</option>
                    <option value="none">None</option>
                    <option value="zapier_make">Zapier/Make</option>
                  </select>
                </div>

                {/* Integrates With (text input for now - can be enhanced later) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Integrates With</label>
                  <input
                    type="text"
                    value={formData.integrates_with_names?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      integrates_with_names: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Dext, Stripe, GoCardless (comma separated)"
                  />
                </div>

                {/* Manual Transfer Required */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.manual_transfer_required || false}
                    onChange={(e) => setFormData({ ...formData, manual_transfer_required: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Manual Transfer Required</label>
                </div>

                {/* Manual Hours Monthly */}
                {formData.manual_transfer_required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manual Hours/Month</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.manual_hours_monthly || ''}
                      onChange={(e) => setFormData({ ...formData, manual_hours_monthly: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 6"
                    />
                  </div>
                )}

                {/* Manual Process Description */}
                {formData.manual_transfer_required && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manual Process Description</label>
                    <textarea
                      value={formData.manual_process_description || ''}
                      onChange={(e) => setFormData({ ...formData, manual_process_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="e.g., Tagging revenue/costs to service lines + exporting to spreadsheets for reporting"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Data Quality Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality & Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Quality Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Quality Score (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.data_quality_score || ''}
                    onChange={(e) => setFormData({ ...formData, data_quality_score: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1-5"
                  />
                </div>

                {/* Data Entry Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Entry Method</label>
                  <select
                    value={formData.data_entry_method || 'single_point'}
                    onChange={(e) => setFormData({ ...formData, data_entry_method: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="dont_know">Don't Know</option>
                    <option value="duplicated">Duplicated</option>
                    <option value="single_point">Single Point</option>
                  </select>
                </div>

                {/* Data entry context (e.g. what's duplicated) - shown when Duplicated selected */}
                {formData.data_entry_method === 'duplicated' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What&apos;s being duplicated?
                    </label>
                    <textarea
                      value={formData.data_entry_context || ''}
                      onChange={(e) => setFormData({ ...formData, data_entry_context: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      placeholder="e.g., Maria enters things in both Xero and the Master Tracker"
                    />
                    <p className="text-xs text-gray-500 mt-1">This helps us understand where duplication happens for ongoing analysis.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Satisfaction Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Satisfaction</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* User Satisfaction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Satisfaction (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.user_satisfaction || ''}
                    onChange={(e) => setFormData({ ...formData, user_satisfaction: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1-5"
                  />
                </div>

                {/* Fit for Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fit for Purpose (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.fit_for_purpose || ''}
                    onChange={(e) => setFormData({ ...formData, fit_for_purpose: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1-5"
                  />
                </div>

                {/* Would Recommend */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Would Recommend</label>
                  <select
                    value={formData.would_recommend || 'yes'}
                    onChange={(e) => setFormData({ ...formData, would_recommend: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="maybe">Maybe</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pain Points Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points & Improvements</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Known Issues */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Known Issues</label>
                  <textarea
                    value={formData.known_issues || ''}
                    onChange={(e) => setFormData({ ...formData, known_issues: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="e.g., Tracking categories not set up cleanly; month-end journals inconsistent"
                  />
                </div>

                {/* Workarounds in Use */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workarounds in Use</label>
                  <textarea
                    value={formData.workarounds_in_use || ''}
                    onChange={(e) => setFormData({ ...formData, workarounds_in_use: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="e.g., Spreadsheet packs, manual accruals notes"
                  />
                </div>

                {/* Change One Thing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">If You Could Change One Thing</label>
                  <textarea
                    value={formData.change_one_thing || ''}
                    onChange={(e) => setFormData({ ...formData, change_one_thing: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="e.g., Service-line margin visibility via tracking categories + rules"
                  />
                </div>
              </div>
            </div>

            {/* Future Planning Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Future Planning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Future Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Future Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.future_plan || 'keep'}
                    onChange={(e) => setFormData({ ...formData, future_plan: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="keep">Keep</option>
                    <option value="replace">Replace</option>
                    <option value="unsure">Unsure</option>
                    <option value="upgrade">Upgrade</option>
                  </select>
                  <input
                    type="text"
                    value={formData.future_plan_context || ''}
                    onChange={(e) => setFormData({ ...formData, future_plan_context: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Optional: e.g., but open to replacing if something better exists"
                  />
                </div>

                {/* Replacement Candidate */}
                {formData.future_plan === 'replace' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Candidate</label>
                    <input
                      type="text"
                      value={formData.replacement_candidate || ''}
                      onChange={(e) => setFormData({ ...formData, replacement_candidate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., QuickBooks, Sage"
                    />
                  </div>
                )}

                {/* Contract End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract End Date</label>
                  <input
                    type="date"
                    value={formData.contract_end_date || ''}
                    onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSystem}
                disabled={saving || !formData.system_name || !formData.category_code}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Update' : 'Add'} System
              </button>
            </div>
          </div>
        )}

        {/* Systems List */}
        {systems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Systems Added Yet</h3>
            <p className="text-gray-600 mb-6">
              Start by adding the software tools and systems your business uses.
            </p>
            <button
              onClick={handleAddSystem}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Add Your First System
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {systems.map((system) => {
              const category = categories.find(c => c.category_code === system.category_code);
              return (
                <div key={system.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{system.system_name}</h3>
                        {category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            {category.category_name}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          system.criticality === 'critical' ? 'bg-red-100 text-red-700' :
                          system.criticality === 'important' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {system.criticality}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Usage:</span> {system.usage_frequency}
                        </div>
                        <div>
                          <span className="font-medium">Users:</span> {system.number_of_users || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span> {
                            system.monthly_cost ? `£${system.monthly_cost}/mo` :
                            system.annual_cost ? `£${system.annual_cost}/yr` :
                            'Free'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Plan:</span> {system.future_plan}
                        </div>
                      </div>
                      {system.primary_users && system.primary_users.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">Users: </span>
                          <span className="text-sm text-gray-900">{system.primary_users.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditSystem(system)}
                        className="p-2 text-gray-400 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSystem(system.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
