import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TeamWellnessWidget } from './TeamWellnessWidget';
import { PulseSurvey } from './PulseSurvey';
import { WorkloadMonitor } from './WorkloadMonitor';
import { Header } from '@/components/common/Header';

interface WellnessDashboardProps {
  teamId: string;
  staffId: string;
  className?: string;
}

export const WellnessDashboard: React.FC<WellnessDashboardProps> = ({
  teamId,
  staffId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pulse' | 'workload'>('overview');

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Wellness Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor team wellbeing, track workload patterns, and prevent burnout
          </p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-4">
            {[
              { id: 'overview', label: 'Team Overview' },
              { id: 'pulse', label: 'Pulse Survey' },
              { id: 'workload', label: 'Workload Monitor' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <TeamWellnessWidget teamId={teamId} />
          )}

          {activeTab === 'pulse' && (
            <PulseSurvey
              staffId={staffId}
              onComplete={() => setActiveTab('overview')}
            />
          )}

          {activeTab === 'workload' && (
            <WorkloadMonitor staffId={staffId} />
          )}
        </motion.div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Wellness Resources</h2>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="mr-2">📚</span>
                  Managing Work-Life Balance Guide
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="mr-2">🧘</span>
                  Stress Management Techniques
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <span className="mr-2">💪</span>
                  Building Resilience Workshop
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Support Contacts</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="mr-2">👥</span>
                <div>
                  <p className="font-medium">HR Support</p>
                  <p className="text-sm text-gray-600">hr.support@company.com</p>
                </div>
              </li>
              <li className="flex items-center">
                <span className="mr-2">💬</span>
                <div>
                  <p className="font-medium">Employee Assistance Program</p>
                  <p className="text-sm text-gray-600">eap@company.com</p>
                </div>
              </li>
              <li className="flex items-center">
                <span className="mr-2">👨‍💼</span>
                <div>
                  <p className="font-medium">Line Manager</p>
                  <p className="text-sm text-gray-600">manager@company.com</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}; 