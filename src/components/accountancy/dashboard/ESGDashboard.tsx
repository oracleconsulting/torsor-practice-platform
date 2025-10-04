import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Eye, Settings } from 'lucide-react';
import { ESGClient, ESGData, ESGReport } from '../../../types/accountancy';
import { ClientScopingGrid } from './esg/ClientScopingGrid';
import { DataCollectionPortal } from './esg/DataCollectionPortal';
import { ReportBuilder } from './esg/ReportBuilder';
import { InsightsPanel } from './esg/InsightsPanel';

interface ESGDashboardProps {
  onClose: () => void;
}

type ESGTab = 'overview' | 'scoping' | 'data' | 'reports' | 'insights';

export const ESGDashboard: React.FC<ESGDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ESGTab>('overview');
  const [selectedClient, setSelectedClient] = useState<ESGClient | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'scoping', label: 'Client Scoping', icon: '🎯' },
    { id: 'data', label: 'Data Collection', icon: '📝' },
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ];

  const mockClients: ESGClient[] = [
    {
      id: '1',
      name: 'TechStart Ltd',
      industry: 'Technology',
      size: 'medium',
      scope: {
        clientId: '1',
        companySize: { employees: 75, turnover: 8500000 },
        mandatory: true,
        voluntaryBenefits: ['Investment readiness', 'Brand value'],
        materialTopics: ['Carbon emissions', 'Data privacy', 'Diversity'],
        reportingFramework: 'UK_SDS',
        estimatedCost: 8500,
        recommendedActions: ['Conduct materiality assessment', 'Set up data collection systems']
      },
      data: {
        emissions: {
          scope1: { naturalGas: 50000, companyVehicles: 12000, refrigerants: 50 },
          scope2: { electricity: 80000, source: 'grid' },
          scope3: { businessTravel: 25000, commuting: 150000, waste: 12, water: 200 }
        },
        social: {
          totalEmployees: 75,
          femaleEmployees: 35,
          femaleManagers: 8,
          genderPayGap: 8.5,
          trainingHours: 120,
          turnoverRate: 12,
          accidents: 2
        },
        governance: {
          boardMembers: 5,
          independentDirectors: 2,
          sustainabilityPolicy: true,
          codeOfConduct: true,
          whistleblowingPolicy: false,
          dataBreaches: 1
        }
      },
      report: null,
      status: 'data_collection',
      deadline: '2025-12-31',
      revenue: 8500
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-green-400 font-semibold mb-2">Environmental Score</h4>
                <div className="text-3xl font-bold text-green-400">78</div>
                <div className="text-sm text-gray-400">Good performance</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Social Score</h4>
                <div className="text-3xl font-bold text-blue-400">65</div>
                <div className="text-sm text-gray-400">Needs improvement</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2">Governance Score</h4>
                <div className="text-3xl font-bold text-purple-400">82</div>
                <div className="text-sm text-gray-400">Excellent</div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">TechStart Ltd - Data collection completed</span>
                  <span className="text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">GreenBuild Co - Report generated</span>
                  <span className="text-gray-500">1 day ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">EcoRetail Ltd - Scoping assessment</span>
                  <span className="text-gray-500">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'scoping':
        return <ClientScopingGrid clients={mockClients} onClientSelect={setSelectedClient} />;
      
      case 'data':
        return <DataCollectionPortal selectedClient={selectedClient} />;
      
      case 'reports':
        return <ReportBuilder clients={mockClients} />;
      
      case 'insights':
        return <InsightsPanel />;
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">ESG Sustainability Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ESGTab)}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-400 border-b-2 border-green-400 bg-green-400/10'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {renderTabContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 