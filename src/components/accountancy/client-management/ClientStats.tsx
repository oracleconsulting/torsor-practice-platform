import React from 'react';
import { ClientManagementSummary } from '../../../types/accountancy';
import { Users, CheckCircle, AlertTriangle, FileText, Shield } from 'lucide-react';

interface ClientStatsProps {
  summary: ClientManagementSummary;
}

export const ClientStats: React.FC<ClientStatsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center">
        <Users className="w-6 h-6 text-purple-400 mb-2" />
        <div className="text-2xl font-bold text-white">{summary.totalClients}</div>
        <div className="text-gray-400">Total Clients</div>
      </div>
      <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center">
        <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
        <div className="text-2xl font-bold text-white">{summary.activeClients}</div>
        <div className="text-gray-400">Active Clients</div>
      </div>
      <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center">
        <FileText className="w-6 h-6 text-blue-400 mb-2" />
        <div className="text-2xl font-bold text-white">{summary.clientsWithPortals}</div>
        <div className="text-gray-400">Portals Enabled</div>
      </div>
      <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center">
        <Shield className="w-6 h-6 text-yellow-400 mb-2" />
        <div className="text-2xl font-bold text-white">{summary.complianceAlerts}</div>
        <div className="text-gray-400">Compliance Alerts</div>
      </div>
    </div>
  );
}; 