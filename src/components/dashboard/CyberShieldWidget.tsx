import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Database, Package, Bug } from 'lucide-react';
import { useCyberSecurity } from '../../../hooks/useCyberSecurity';
import { SecurityData, SecurityAlerts } from '../types/accountancy';
import { CyberSecurityDashboard } from './CyberSecurityDashboard';

interface CyberShieldWidgetProps {
  className?: string;
}

export const CyberShieldWidget: React.FC<CyberShieldWidgetProps> = ({ className = '' }) => {
  const { securityData, alerts, loadingSecurity } = useCyberSecurity();
  const [showIncident, setShowIncident] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10';
    if (score >= 40) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const mockSecurityData: SecurityData = {
    riskScore: 72,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    partnerStatus: 'active',
    partnerName: 'CyberShield Pro',
    mfaAdoption: 85,
    lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    patchStatus: 'good',
    firewallStatus: 'good',
    antivirusStatus: 'warning',
    alerts: {
      critical: 0,
      high: 2,
      medium: 5,
      low: 12,
      total: 19
    }
  };

  const mockAlerts: SecurityAlerts = {
    critical: 0,
    high: 2,
    medium: 5,
    low: 12,
    total: 19
  };

  const data = securityData || mockSecurityData;
  const currentAlerts = alerts || mockAlerts;

  const runSecurityCheck = async () => {
    // Mock security check - in real implementation, this would call the API
    console.log('Running security check...');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 transition-all
        ${currentAlerts.critical > 0 ? 'border-2 border-red-500 shadow-red-500/20' : 'border border-gray-800'}
        hover:shadow-xl hover:shadow-purple-500/10 ${className}
      `}
    >
      {/* Emergency Alert Banner */}
      {currentAlerts.critical > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 -mx-6 -mt-6 p-4 bg-red-900/50 border-b border-red-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="text-red-400 font-medium">
                {currentAlerts.critical} Critical Alert{currentAlerts.critical > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setShowIncident(true)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Respond Now →
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-purple-400" />
          Cyber Security
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            data.partnerStatus === 'active' ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`} />
          <span className="text-xs text-gray-500">
            {data.partnerName || 'No Partner'}
          </span>
        </div>
      </div>

      {/* Risk Score */}
      <div className="mb-4">
        <div className={`
          flex items-center justify-between p-4 rounded-lg
          ${getScoreColor(data.riskScore)}
        `}>
          <div>
            <div className="text-3xl font-bold">
              {data.riskScore}/100
            </div>
            <div className="text-sm opacity-80">Security Score</div>
          </div>
          {getScoreIcon(data.riskScore)}
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">{currentAlerts.critical}</div>
          <div className="text-xs text-gray-400">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-400">{currentAlerts.high}</div>
          <div className="text-xs text-gray-400">High</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">{currentAlerts.medium}</div>
          <div className="text-xs text-gray-400">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{currentAlerts.low}</div>
          <div className="text-xs text-gray-400">Low</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">MFA Coverage</span>
            <Users className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-lg font-semibold text-white">
            {data.mfaAdoption}%
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Last Backup</span>
            <Database className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-lg font-semibold text-white">
            {formatDistanceToNow(data.lastBackup)}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="space-y-2 mb-4">
        <StatusItem
          label="Patches"
          status={data.patchStatus}
          icon={<Package className="w-4 h-4" />}
        />
        <StatusItem
          label="Firewall"
          status={data.firewallStatus}
          icon={<Shield className="w-4 h-4" />}
        />
        <StatusItem
          label="Antivirus"
          status={data.antivirusStatus}
          icon={<Bug className="w-4 h-4" />}
        />
      </div>

      {/* Last Updated */}
      <div className="mb-4 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-400">Last Updated</span>
          <span className="text-sm text-gray-300">
            {formatDistanceToNow(data.lastUpdated)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => window.open('/cyber-dashboard', '_blank')}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          View Dashboard
        </button>
        <button
          onClick={runSecurityCheck}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Run Check
        </button>
      </div>

      {/* Incident Response Modal */}
      {showIncident && (
        <IncidentResponseModal
          onClose={() => setShowIncident(false)}
          alerts={currentAlerts}
        />
      )}
    </motion.div>
  );
};

// Status indicator component
const StatusItem: React.FC<{
  label: string;
  status: 'good' | 'warning' | 'error' | 'unknown';
  icon: React.ReactNode;
}> = ({ label, status, icon }) => {
  const statusConfig = {
    good: { color: 'text-green-400', bg: 'bg-green-400/10', text: 'Active' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', text: 'Check' },
    error: { color: 'text-red-400', bg: 'bg-red-400/10', text: 'Error' },
    unknown: { color: 'text-gray-400', bg: 'bg-gray-400/10', text: 'Unknown' }
  };
  
  const config = statusConfig[status || 'unknown'];
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded ${config.bg} ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

// Incident Response Modal
const IncidentResponseModal: React.FC<{ 
  onClose: () => void; 
  alerts: SecurityAlerts;
}> = ({ onClose, alerts }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const emergencyContacts = [
    { name: 'IT Partner', phone: '0800-CYBER-999', available: true },
    { name: 'Cyber Insurance', phone: '0800-CLAIM-NOW', available: true },
    { name: 'Legal Counsel', phone: '020-7946-0958', available: false },
    { name: 'PR Agency', phone: '020-7946-0847', available: false }
  ];
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border-2 border-red-500 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Emergency Header */}
        <div className="mb-6 pb-6 border-b border-red-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-red-400 flex items-center">
              <AlertTriangle className="w-8 h-8 mr-3 animate-pulse" />
              INCIDENT RESPONSE ACTIVE
            </h2>
            <div className="text-red-400">
              Started: {formatTime(new Date())}
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <h3 className="text-lg font-semibold text-red-400 mb-3">Active Alerts</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">{alerts.critical}</div>
              <div className="text-sm text-gray-400">Critical</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{alerts.high}</div>
              <div className="text-sm text-gray-400">High</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{alerts.medium}</div>
              <div className="text-sm text-gray-400">Medium</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{alerts.low}</div>
              <div className="text-sm text-gray-400">Low</div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">
            Emergency Contacts
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{contact.name}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    contact.available ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                <div className="text-gray-400 text-sm">{contact.phone}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {contact.available ? 'Available' : 'Unavailable'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              // Trigger incident response workflow
              console.log('Starting incident response...');
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Start Response
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 