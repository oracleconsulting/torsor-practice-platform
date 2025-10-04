import React from 'react';
import { AccountingClient, ClientPortalStats } from '../types/accountancy';
import { ArrowLeft, FileText, Shield, Users, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

interface ClientPortalViewProps {
  client: AccountingClient;
  portalStats: ClientPortalStats;
  onBack: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ client, portalStats, onBack }) => {
  return (
    <div className="bg-white/5 rounded-xl p-6 shadow-lg">
      <button
        className="mb-4 flex items-center gap-2 text-purple-400 hover:text-purple-600"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Client Details
      </button>
      <h2 className="text-xl font-bold text-white mb-2">{client.name} Portal Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-2 text-gray-400">Portal Enabled: <span className="text-white font-semibold">{portalStats.portalEnabled ? 'Yes' : 'No'}</span></div>
          <div className="mb-2 text-gray-400">Last Login: <span className="text-white">{portalStats.lastLogin ? new Date(portalStats.lastLogin).toLocaleString() : '-'}</span></div>
          <div className="mb-2 text-gray-400">Login Count: <span className="text-white">{portalStats.loginCount}</span></div>
          <div className="mb-2 text-gray-400">Documents: <span className="text-white">{portalStats.documentsCount}</span></div>
          <div className="mb-2 text-gray-400">Storage Used: <span className="text-white">{portalStats.storageUsed} MB / {portalStats.storageLimit} MB</span></div>
        </div>
        <div>
          <div className="mb-2 text-gray-400">Compliance Status: <span className={`font-semibold ml-2 ${portalStats.complianceStatus.riskLevel === 'high' ? 'text-red-400' : portalStats.complianceStatus.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{portalStats.complianceStatus.riskLevel}</span></div>
          <div className="mb-2 text-gray-400">Outstanding Actions: <span className="text-white">{portalStats.complianceStatus.outstandingActions.length}</span></div>
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Recent Activity</h3>
        <ul className="space-y-2">
          {portalStats.recentActivity.length === 0 && (
            <li className="text-gray-400">No recent activity.</li>
          )}
          {portalStats.recentActivity.map(activity => (
            <li key={activity.id} className="text-gray-300">
              <span className="font-semibold text-white">{activity.type.replace('_', ' ')}</span> - {activity.description} <span className="text-gray-500">({new Date(activity.timestamp).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 