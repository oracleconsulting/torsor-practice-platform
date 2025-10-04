import React from 'react';
import { motion } from 'framer-motion';
import { 
  BusinessOrganism,
  RevenueTracker,
  EnergyMeter,
  TodaysFocus,
  BoardPulse,
  QuickActions,
  PerformanceMetrics,
  CommunityActivity
} from './widgets';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function CommandCenter() {
  const { data, loading, error } = useDashboardData();
  const { user } = useAuth ? useAuth() : { user: null }; // fallback if not available

  // Debug logging
  console.log('Dashboard Data:', {
    tasks: data.tasks,
    boardMembers: data.boardMembers,
    metrics: data.metrics,
    config: data.clientConfig
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data.userOnboarded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <h2 className="text-2xl font-bold text-white">Welcome to Oracle Dashboard</h2>
        <p className="text-gray-400 text-center max-w-md">
          Complete your assessment to unlock your personalized dashboard and AI board members.
        </p>
        <a 
          href="/assessment" 
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Start Assessment
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Center Column - Business Organism */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <BusinessOrganism />
          </motion.div>
        </div>

        {/* Right Column - Stack */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <RevenueTracker metrics={data.metrics} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EnergyMeter energy={data.metrics.energy} />
          </motion.div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TodaysFocus tasks={data.tasks} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BoardPulse members={data.boardMembers} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <QuickActions />
        </motion.div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <PerformanceMetrics />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <CommunityActivity activities={data.activity} />
        </motion.div>
      </div>

      {/* Debug Section - Toggle with Shift+D */}
      {(() => {
        const [showDebug, setShowDebug] = React.useState(false);
        React.useEffect(() => {
          const handleKeyPress = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'D') {
              setShowDebug(prev => !prev);
            }
          };
          window.addEventListener('keydown', handleKeyPress);
          return () => window.removeEventListener('keydown', handleKeyPress);
        }, []);

        if (!showDebug) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
              <h2 className="text-lg font-bold text-yellow-400">🔍 Debug Panel (Press Shift+D to hide)</h2>
              <button
                onClick={() => setShowDebug(false)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Current User</h3>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify({ email: user?.email, id: user?.id }, null, 2)}
                </pre>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Dashboard Data Summary</h3>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify({
                    tasksCount: data.tasks.length,
                    boardMembersCount: data.boardMembers.length,
                    hasConfig: !!data.clientConfig,
                    metrics: data.metrics
                  }, null, 2)}
                </pre>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Client Config</h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-60">
                  {JSON.stringify(data.clientConfig, null, 2)}
                </pre>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Board Members</h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                  {JSON.stringify(data.boardMembers, null, 2)}
                </pre>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Tasks</h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                  {JSON.stringify(data.tasks, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}