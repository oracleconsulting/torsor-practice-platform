// ============================================================================
// DISCOVERY PORTAL - Simple, Clean Client Experience
// ============================================================================
// Single-purpose page: Complete your discovery assessment
// No complex navigation - just the task at hand
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Compass, ChevronRight, LogOut, CheckCircle, 
  Clock, Building2, User, Loader2 
} from 'lucide-react';

export default function DiscoveryPortalPage() {
  const { user, clientSession, signOut } = useAuth();
  const navigate = useNavigate();
  const [discoveryStatus, setDiscoveryStatus] = useState<'pending' | 'in_progress' | 'complete'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientSession?.clientId) {
      checkDiscoveryStatus();
    } else {
      setLoading(false);
    }
  }, [clientSession?.clientId]);

  const checkDiscoveryStatus = async () => {
    try {
      // Check if they have a discovery service line and its status
      const { data } = await supabase
        .from('client_service_lines')
        .select(`
          status,
          service_line:service_lines(code)
        `)
        .eq('client_id', clientSession?.clientId)
        .single();

      if (data) {
        const sl = data.service_line as any;
        const serviceCode = Array.isArray(sl) ? sl[0]?.code : sl?.code;
        
        if (serviceCode === 'discovery') {
          if (data.status === 'discovery_complete' || data.status === 'complete') {
            setDiscoveryStatus('complete');
          } else if (data.status === 'in_progress') {
            setDiscoveryStatus('in_progress');
          }
        }
      }
    } catch (err) {
      // No service line yet - that's fine
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleStartDiscovery = () => {
    navigate('/discovery');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Get first name for greeting
  const firstName = clientSession?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* RPGCC Logo */}
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tight text-black">RPGCC</span>
            <div className="flex gap-1 ml-1">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{clientSession?.name}</p>
              <p className="text-xs text-gray-500">{clientSession?.company || user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Let's discover what makes your business unique and where we can help.
          </p>
        </div>

        {/* Client Info Card */}
        {clientSession?.company && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{clientSession.company}</p>
              <p className="text-sm text-gray-500">Your business</p>
            </div>
          </div>
        )}

        {/* Discovery Assessment Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold">Destination Discovery</h2>
            </div>
            <p className="text-blue-100 text-sm">
              A guided assessment to help us understand your business goals, challenges, and opportunities.
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {discoveryStatus === 'complete' ? (
              // Completed State
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Discovery Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Thank you for completing your discovery assessment. 
                  Your advisor will be in touch shortly to discuss your results.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  <Clock className="w-4 h-4" />
                  Awaiting advisor review
                </div>
              </div>
            ) : (
              // Not Started / In Progress State
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated time</p>
                    <p className="font-medium text-gray-900">10-15 minutes</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {discoveryStatus === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                        <Clock className="w-3 h-3" />
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        <Compass className="w-3 h-3" />
                        Ready to Start
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Tell us about your business and what you do</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Share your goals and where you want to be</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Identify challenges and opportunities</span>
                  </div>
                </div>

                <button
                  onClick={handleStartDiscovery}
                  className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  {discoveryStatus === 'in_progress' ? 'Continue Assessment' : 'Start Assessment'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm">
            If you have any questions about the discovery process, contact us at{' '}
            <a href="mailto:hello@rpgcc.co.uk" className="text-blue-600 hover:text-blue-700 font-medium">
              hello@rpgcc.co.uk
            </a>
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="mt-auto py-6 text-center text-gray-400 text-xs">
        <p>RP Griffiths Chartered Certified Accountants</p>
      </footer>
    </div>
  );
}

