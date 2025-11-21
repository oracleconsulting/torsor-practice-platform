import React, { useState } from 'react';
import { Shield, Database, Clock, CheckCircle, AlertTriangle, Phone, Mail } from 'lucide-react';

export const PartnerPortal: React.FC = () => {
  const [activePartner, setActivePartner] = useState<string | null>(null);

  const mockPartners = [
    {
      id: '1',
      partnerName: 'CyberShield Pro',
      services: {
        monitoring: true,
        backups: true,
        patching: true,
        support: true
      },
      status: {
        connection: 'active',
        lastSync: new Date(Date.now() - 30 * 60 * 1000),
        nextSync: new Date(Date.now() + 30 * 60 * 1000)
      },
      metrics: {
        ticketCount: 3,
        avgResponseTime: 45,
        slaCompliance: 98,
        systemUptime: 99.9
      }
    }
  ];

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'disconnected': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const selectedPartner = mockPartners.find(partner => partner.id === activePartner);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Partner Portal</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Add Partner
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner List */}
        <div className="lg:col-span-1">
          <h4 className="text-white font-semibold mb-4">IT Partners</h4>
          <div className="space-y-3">
            {mockPartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => setActivePartner(partner.id)}
                className={`bg-gray-800/50 border rounded-lg p-4 cursor-pointer transition-colors ${
                  activePartner === partner.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{partner.partnerName}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    partner.status.connection === 'active' ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`} />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Shield className="w-4 h-4" />
                  <span>{Object.values(partner.services).filter(Boolean).length} services</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Last sync: {formatTimeAgo(partner.status.lastSync)}</span>
                  <span className={getConnectionColor(partner.status.connection)}>
                    {partner.status.connection}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Details */}
        <div className="lg:col-span-2">
          {selectedPartner ? (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white">{selectedPartner.partnerName}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedPartner.status.connection === 'active' ? 'bg-green-500' : 'bg-red-500'
                    } animate-pulse`} />
                    <span className={getConnectionColor(selectedPartner.status.connection)}>
                      {selectedPartner.status.connection}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Last Sync:</span>
                    <span className="text-white ml-2">{formatTimeAgo(selectedPartner.status.lastSync)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Next Sync:</span>
                    <span className="text-white ml-2">{selectedPartner.status.nextSync.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h5 className="text-white font-semibold mb-4">Services</h5>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedPartner.services).map(([service, enabled]) => (
                    <div key={service} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-white capitalize">{service}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h5 className="text-white font-semibold mb-4">Performance Metrics</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{selectedPartner.metrics.ticketCount}</div>
                    <div className="text-sm text-gray-400">Open Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{selectedPartner.metrics.avgResponseTime}m</div>
                    <div className="text-sm text-gray-400">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{selectedPartner.metrics.slaCompliance}%</div>
                    <div className="text-sm text-gray-400">SLA Compliance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{selectedPartner.metrics.systemUptime}%</div>
                    <div className="text-sm text-gray-400">System Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-gray-300 mb-2">Select a Partner</h4>
              <p className="text-gray-500">Choose a partner from the list to view details and manage services</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 