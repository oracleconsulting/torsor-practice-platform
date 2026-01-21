'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MAEngagement, MAPeriod, TierType } from '../../types/ma';
import { TIER_FEATURES } from '../../types/ma';

interface EngagementWithClient {
  id: string;
  client_id: string;
  tier: TierType;
  frequency: string;
  monthly_fee: number;
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  start_date: string;
  created_at: string;
  client?: {
    name: string;
    company_name?: string;
  };
  currentPeriod?: MAPeriod;
  periodsDue?: number;
}

const TIER_COLORS: Record<TierType, { bg: string; text: string; border: string }> = {
  clarity: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  foresight: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  strategic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100' },
  active: { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' },
};

export function MAEngagementsPage() {
  const navigate = useNavigate();
  const [engagements, setEngagements] = useState<EngagementWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<TierType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'paused'>('all');

  useEffect(() => {
    loadEngagements();
  }, []);

  const loadEngagements = async () => {
    setLoading(true);
    try {
      // Fetch engagements with client info
      const { data: engData } = await supabase
        .from('ma_engagements')
        .select(`
          *,
          client:clients(name, company_name)
        `)
        .order('created_at', { ascending: false });

      if (engData) {
        // Fetch current periods for each engagement
        const engagementsWithPeriods = await Promise.all(
          engData.map(async (eng: MAEngagement & { client: { name: string; company_name?: string } }) => {
            const { data: periods } = await supabase
              .from('ma_periods')
              .select('*')
              .eq('engagement_id', eng.id)
              .order('period_end', { ascending: false })
              .limit(1);

            const { count: duePeriods } = await supabase
              .from('ma_periods')
              .select('*', { count: 'exact', head: true })
              .eq('engagement_id', eng.id)
              .in('status', ['pending', 'data_received', 'in_progress']);

            return {
              ...eng,
              currentPeriod: periods?.[0],
              periodsDue: duePeriods || 0,
            };
          })
        );

        setEngagements(engagementsWithPeriods);
      }
    } catch (error) {
      console.error('Error loading engagements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter engagements
  const filteredEngagements = engagements.filter(eng => {
    const matchesSearch = searchQuery === '' || 
      eng.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = filterTier === 'all' || eng.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || eng.status === filterStatus;

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Calculate summary stats
  const stats = {
    total: engagements.length,
    active: engagements.filter(e => e.status === 'active').length,
    periodsDue: engagements.reduce((sum, e) => sum + (e.periodsDue || 0), 0),
    mrr: engagements
      .filter(e => e.status === 'active')
      .reduce((sum, e) => sum + e.monthly_fee, 0),
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Intelligence</h1>
          <p className="text-slate-600 mt-1">Manage client engagements and reporting periods</p>
        </div>
        <button
          onClick={() => navigate('/admin/ma/engagements/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          New Engagement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Clients</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Periods Due</p>
              <p className="text-2xl font-bold text-slate-800">{stats.periodsDue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.mrr)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as TierType | 'all')}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Tiers</option>
            <option value="clarity">Clarity</option>
            <option value="foresight">Foresight</option>
            <option value="strategic">Strategic</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Engagements List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredEngagements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No engagements found</p>
            <p className="text-sm mt-1">
              {searchQuery || filterTier !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first MA engagement to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Tier</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Current Period</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Fee</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEngagements.map(eng => {
                const tierColors = TIER_COLORS[eng.tier];
                const statusConfig = STATUS_CONFIG[eng.status];
                
                return (
                  <tr 
                    key={eng.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/admin/ma/engagements/${eng.id}`)}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-800">
                          {eng.client?.company_name || eng.client?.name || 'Unknown Client'}
                        </p>
                        {eng.client?.company_name && eng.client?.name && (
                          <p className="text-sm text-slate-500">{eng.client.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                        {eng.tier.charAt(0).toUpperCase() + eng.tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {eng.currentPeriod ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{eng.currentPeriod.period_label}</span>
                          {eng.periodsDue && eng.periodsDue > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              {eng.periodsDue} due
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No periods yet</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-medium text-slate-800">{formatCurrency(eng.monthly_fee)}</span>
                      <span className="text-sm text-slate-500">/mo</span>
                    </td>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/ma/engagements/${eng.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/ma/engagements/${eng.id}/settings`)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Stats by Tier */}
      <div className="grid grid-cols-3 gap-4">
        {(['clarity', 'foresight', 'strategic'] as TierType[]).map(tier => {
          const count = engagements.filter(e => e.tier === tier && e.status === 'active').length;
          const tierConfig = TIER_FEATURES[tier];
          const tierColors = TIER_COLORS[tier];
          
          return (
            <div key={tier} className={`border rounded-xl p-4 ${tierColors.border} ${tierColors.bg}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${tierColors.text}`}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                <span className={`text-2xl font-bold ${tierColors.text}`}>{count}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{tierConfig.priceRange[0].toLocaleString()} - £{tierConfig.priceRange[1].toLocaleString()}/mo</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MAEngagementsPage;

