import React, { useState } from 'react';
import { AlertTriangle, Clock, Shield, Bug, Database } from 'lucide-react';

export const ThreatMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'threats' | 'vulnerabilities' | 'patches'>('threats');

  const mockThreats = [
    {
      id: '1',
      type: 'phishing',
      severity: 'high',
      description: 'Suspicious email detected with malicious attachment',
      detected: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'investigating',
      affectedSystems: ['Email Server', 'Workstation-01']
    },
    {
      id: '2',
      type: 'malware',
      severity: 'medium',
      description: 'Potential malware signature detected in downloads folder',
      detected: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'contained',
      affectedSystems: ['Workstation-03']
    }
  ];

  const mockVulnerabilities = [
    {
      id: '1',
      name: 'CVE-2023-1234',
      severity: 'critical',
      description: 'Remote code execution vulnerability in web server',
      affectedSystems: ['Web Server'],
      patchAvailable: true,
      patchStatus: 'pending'
    },
    {
      id: '2',
      name: 'CVE-2023-5678',
      severity: 'high',
      description: 'SQL injection vulnerability in database',
      affectedSystems: ['Database Server'],
      patchAvailable: true,
      patchStatus: 'applied'
    }
  ];

  const mockPatchStatus = {
    total: 15,
    applied: 12,
    pending: 2,
    failed: 1,
    lastPatch: new Date(Date.now() - 24 * 60 * 60 * 1000)
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'text-yellow-400';
      case 'contained': return 'text-blue-400';
      case 'resolved': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Threat Monitor</h3>
        <div className="flex gap-2">
          {[
            { id: 'threats', label: 'Active Threats', icon: AlertTriangle },
            { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
            { id: 'patches', label: 'Patch Status', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3 py-1 rounded text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'threats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{mockThreats.length}</div>
              <div className="text-sm text-gray-400">Active Threats</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">1</div>
              <div className="text-sm text-gray-400">High Severity</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">1</div>
              <div className="text-sm text-gray-400">Medium Severity</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">1</div>
              <div className="text-sm text-gray-400">Contained</div>
            </div>
          </div>

          <div className="space-y-4">
            {mockThreats.map((threat) => (
              <div key={threat.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h4 className="text-white font-semibold capitalize">{threat.type}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                      {threat.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTimeAgo(threat.detected)}</span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-3">{threat.description}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-400">Affected Systems: </span>
                    <span className="text-white text-sm">{threat.affectedSystems.join(', ')}</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(threat.status)}`}>
                    {threat.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vulnerabilities' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">1</div>
              <div className="text-sm text-gray-400">Critical</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">1</div>
              <div className="text-sm text-gray-400">High</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">1</div>
              <div className="text-sm text-gray-400">Patched</div>
            </div>
          </div>

          <div className="space-y-4">
            {mockVulnerabilities.map((vuln) => (
              <div key={vuln.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Bug className="w-5 h-5 text-red-400" />
                    <h4 className="text-white font-semibold">{vuln.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vuln.patchAvailable && (
                      <span className="text-green-400 text-sm">Patch Available</span>
                    )}
                    <span className={`text-sm font-medium ${
                      vuln.patchStatus === 'applied' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {vuln.patchStatus}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-3">{vuln.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Affected: {vuln.affectedSystems.join(', ')}
                  </span>
                  {vuln.patchStatus === 'pending' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                      Apply Patch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'patches' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{mockPatchStatus.total}</div>
              <div className="text-sm text-gray-400">Total Patches</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{mockPatchStatus.applied}</div>
              <div className="text-sm text-gray-400">Applied</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{mockPatchStatus.pending}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{mockPatchStatus.failed}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Patch Status Overview</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Applied Patches</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(mockPatchStatus.applied / mockPatchStatus.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">{mockPatchStatus.applied}/{mockPatchStatus.total}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Patch Applied</span>
                <span className="text-white text-sm">{formatTimeAgo(mockPatchStatus.lastPatch)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Next Scheduled</span>
                <span className="text-white text-sm">Tomorrow 02:00 AM</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
              Run Patch Scan
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
              Apply All Pending
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 