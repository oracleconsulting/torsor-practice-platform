import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building, 
  TrendingUp, 
  Shield, 
  Eye, 
  Download,
  Filter,
  Search,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';
import { StatusBadge } from '@/components/accountancy/ui/StatusBadge';
import { safeJsonToRecord } from '@/types/supabase-extensions';

interface PracticeData {
  id: string;
  name: string;
  email: string;
  contactName?: string;
  teamSize: string;
  subscription: 'free' | 'professional' | 'excellence';
  registeredAt: string;
  lastActive?: string;
  healthScore?: number;
  hasCompletedAssessment: boolean;
  totalLogins: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  permissions: Record<string, any>;
  is_active: boolean;
}

const AccountancyAdminDashboard = () => {
  const [practices, setPractices] = useState<PracticeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [selectedPractice, setSelectedPractice] = useState<PracticeData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is an admin
      const { data: adminData, error } = await supabase
        .from('accountancy_admins')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (error || !adminData) {
        console.error('Admin access check failed:', error);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      // Convert the permissions using the helper function
      const convertedAdminData: AdminUser = {
        ...adminData,
        permissions: safeJsonToRecord(adminData.permissions)
      };
      setAdminUser(convertedAdminData);
      await loadPracticesData();
    } catch (error) {
      console.error('Error checking admin access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPracticesData = async () => {
    // Generate mock data for demonstration including the test client
    const mockPractices: PracticeData[] = [
      {
        id: 'practice-test',
        name: 'Test Practice - James Howard',
        email: 'jameshowardivc@googlemail.com',
        contactName: 'James Howard',
        teamSize: '1-5',
        subscription: 'professional',
        registeredAt: '2024-01-20T10:30:00Z',
        lastActive: '2024-01-21T14:22:00Z',
        healthScore: 65,
        hasCompletedAssessment: true,
        totalLogins: 5
      },
      {
        id: 'practice-1',
        name: 'IVC ACCOUNTING',
        email: 'info@ivcaccounting.co.uk',
        contactName: 'James Howard',
        teamSize: '6-10',
        subscription: 'professional',
        registeredAt: '2024-01-15T10:30:00Z',
        lastActive: '2024-01-20T14:22:00Z',
        healthScore: 72,
        hasCompletedAssessment: true,
        totalLogins: 8
      },
      {
        id: 'practice-2',
        name: 'Johnson Accountants',
        email: 'sarah@johnsonaccountants.co.uk',
        contactName: 'Sarah Johnson',
        teamSize: '11-20',
        subscription: 'excellence',
        registeredAt: '2024-01-12T09:15:00Z',
        lastActive: '2024-01-21T11:45:00Z',
        healthScore: 85,
        hasCompletedAssessment: true,
        totalLogins: 15
      },
      {
        id: 'practice-3',
        name: 'Williams & Co',
        email: 'mike@williamsco.co.uk',
        contactName: 'Mike Williams',
        teamSize: '1-5',
        subscription: 'free',
        registeredAt: '2024-01-18T16:20:00Z',
        lastActive: '2024-01-19T10:10:00Z',
        healthScore: 45,
        hasCompletedAssessment: false,
        totalLogins: 3
      },
      {
        id: 'practice-4',
        name: 'Brown Financial Services',
        email: 'lisa@brownfs.co.uk',
        contactName: 'Lisa Brown',
        teamSize: '21-50',
        subscription: 'professional',
        registeredAt: '2024-01-10T08:45:00Z',
        lastActive: '2024-01-21T16:30:00Z',
        healthScore: 91,
        hasCompletedAssessment: true,
        totalLogins: 22
      }
    ];

    // Try to load any real practice data from localStorage
    const realPractice = localStorage.getItem('accountancy-practice');
    if (realPractice) {
      try {
        const practice = JSON.parse(realPractice);
        const realPracticeData: PracticeData = {
          id: practice.id || 'real-practice',
          name: practice.name || 'Your Practice',
          email: practice.email || 'test@example.com',
          contactName: practice.contactName,
          teamSize: practice.teamSize || '1-5',
          subscription: practice.subscription || 'free',
          registeredAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          healthScore: 0,
          hasCompletedAssessment: false,
          totalLogins: 1
        };
        mockPractices.push(realPracticeData);
      } catch (e) {
        console.error('Error loading real practice data:', e);
      }
    }

    setPractices(mockPractices);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
        <GlassCard className="max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-6">
              You don't have permission to access the accountancy admin dashboard.
            </p>
            <p className="text-sm text-gray-400">
              Please contact an administrator if you believe this is an error.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const filteredPractices = practices.filter(practice => {
    const matchesSearch = practice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         practice.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSubscription === 'all' || practice.subscription === filterSubscription;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalPractices: practices.length,
    activePractices: practices.filter(p => p.lastActive && 
      new Date(p.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    completedAssessments: practices.filter(p => p.hasCompletedAssessment).length,
    averageHealthScore: Math.round(
      practices.filter(p => p.healthScore).reduce((sum, p) => sum + (p.healthScore || 0), 0) /
      practices.filter(p => p.healthScore).length
    )
  };

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'excellence': return 'text-purple-400 bg-purple-400/20';
      case 'professional': return 'text-blue-400 bg-blue-400/20';
      case 'free': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-gold-400" />
                Accountancy Portal Admin
              </h1>
              <p className="text-gray-400 mt-2">
                Welcome back, {adminUser?.full_name || adminUser?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
                <Download className="w-4 h-4 mr-2 inline" />
                Export Data
              </button>
              <button className="px-4 py-2 bg-gold-400 text-black rounded-lg hover:bg-gold-500 transition-all">
                <Settings className="w-4 h-4 mr-2 inline" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Practices</p>
                <p className="text-3xl font-bold text-white">{stats.totalPractices}</p>
              </div>
              <Building className="w-8 h-8 text-blue-400" />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active This Week</p>
                <p className="text-3xl font-bold text-white">{stats.activePractices}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Completed Assessments</p>
                <p className="text-3xl font-bold text-white">{stats.completedAssessments}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Avg Health Score</p>
                <p className="text-3xl font-bold text-white">{stats.averageHealthScore}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-amber-400" />
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search practices..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold-400"
                value={filterSubscription}
                onChange={(e) => setFilterSubscription(e.target.value)}
              >
                <option value="all">All Subscriptions</option>
                <option value="free">Free</option>
                <option value="professional">Professional</option>
                <option value="excellence">Excellence</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Practices List */}
        <GlassCard>
          <h2 className="text-xl font-bold text-white mb-6">Registered Practices</h2>
          
          <div className="space-y-4">
            {filteredPractices.map((practice) => (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-white font-semibold text-lg">{practice.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionColor(practice.subscription)}`}>
                        {practice.subscription.charAt(0).toUpperCase() + practice.subscription.slice(1)}
                      </span>
                      {practice.hasCompletedAssessment && (
                        <StatusBadge status="good" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Contact: </span>
                        <span className="text-white">{practice.contactName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Email: </span>
                        <span className="text-white">{practice.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Team Size: </span>
                        <span className="text-white">{practice.teamSize}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Health Score: </span>
                        <span className="text-white">{practice.healthScore || 'N/A'}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-400">Registered: </span>
                        <span className="text-white">{new Date(practice.registeredAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Active: </span>
                        <span className="text-white">
                          {practice.lastActive ? new Date(practice.lastActive).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Logins: </span>
                        <span className="text-white">{practice.totalLogins}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPractice(practice)}
                      className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredPractices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No practices found matching your criteria</p>
            </div>
          )}
        </GlassCard>

        {/* Practice Detail Modal */}
        {selectedPractice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-navy-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{selectedPractice.name} - Detailed View</h3>
                <button
                  onClick={() => setSelectedPractice(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Practice Name</label>
                    <p className="text-white font-medium">{selectedPractice.name}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Contact Name</label>
                    <p className="text-white font-medium">{selectedPractice.contactName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white font-medium">{selectedPractice.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Team Size</label>
                    <p className="text-white font-medium">{selectedPractice.teamSize}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Subscription</label>
                    <p className="text-white font-medium">{selectedPractice.subscription}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Health Score</label>
                    <p className="text-white font-medium">{selectedPractice.healthScore || 'Not assessed'}%</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Assessment Status</label>
                  <p className="text-white font-medium">
                    {selectedPractice.hasCompletedAssessment ? 'Completed' : 'Not completed'}
                  </p>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                    View Dashboard
                  </button>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
                    Send Message
                  </button>
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all">
                    Update Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountancyAdminDashboard;
