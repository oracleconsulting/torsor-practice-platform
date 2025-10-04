import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, Users, Database } from 'lucide-react';
import { RiskScorePanel } from './cybersecurity/RiskScorePanel';
import { ThreatMonitor } from './cybersecurity/ThreatMonitor';
import { IncidentResponse } from './cybersecurity/IncidentResponse';
import { PartnerPortal } from './cybersecurity/PartnerPortal';

interface CyberSecurityDashboardProps {
  onClose: () => void;
}

type CyberSecurityTab = 'risk' | 'threats' | 'incidents' | 'partners';

export const CyberSecurityDashboard: React.FC<CyberSecurityDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<CyberSecurityTab>('risk');

  const tabs = [
    { id: 'risk', label: 'Risk Assessment', icon: '🛡️' },
    { id: 'threats', label: 'Threat Monitor', icon: '🚨' },
    { id: 'incidents', label: 'Incident Response', icon: '⚡' },
    { id: 'partners', label: 'Partner Portal', icon: '🤝' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'risk':
        return <RiskScorePanel />;
      case 'threats':
        return <ThreatMonitor />;
      case 'incidents':
        return <IncidentResponse />;
      case 'partners':
        return <PartnerPortal />;
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
            <h2 className="text-2xl font-bold text-white">Cyber Security Dashboard</h2>
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
                onClick={() => setActiveTab(tab.id as CyberSecurityTab)}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/10'
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