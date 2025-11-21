import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Phone, FileText, Users } from 'lucide-react';

export const IncidentResponse: React.FC = () => {
  const [activeIncident, setActiveIncident] = useState<string | null>(null);

  const mockIncidents = [
    {
      id: '1',
      type: 'phishing',
      severity: 'high',
      status: 'investigating',
      description: 'Suspicious email campaign targeting staff',
      detected: new Date(Date.now() - 2 * 60 * 60 * 1000),
      affectedSystems: ['Email Server', 'Workstation-01', 'Workstation-02'],
      affectedData: ['Staff emails', 'Client contact information'],
      response: {
        currentStep: 2,
        totalSteps: 5,
        actions: [
          { step: 1, action: 'Isolate affected systems', status: 'completed', assignee: 'IT Team', deadline: new Date() },
          { step: 2, action: 'Analyze email headers', status: 'in_progress', assignee: 'Security Analyst', deadline: new Date(Date.now() + 2 * 60 * 60 * 1000) },
          { step: 3, action: 'Update firewall rules', status: 'pending', assignee: 'Network Admin', deadline: new Date(Date.now() + 4 * 60 * 60 * 1000) },
          { step: 4, action: 'Notify affected users', status: 'pending', assignee: 'HR Team', deadline: new Date(Date.now() + 6 * 60 * 60 * 1000) },
          { step: 5, action: 'Document incident', status: 'pending', assignee: 'Security Team', deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        ]
      }
    }
  ];

  const emergencyContacts = [
    { name: 'IT Partner', phone: '0800-CYBER-999', email: 'emergency@itsupport.com', available: true, priority: 'primary' },
    { name: 'Cyber Insurance', phone: '0800-CLAIM-NOW', email: 'claims@cyberinsure.com', available: true, priority: 'primary' },
    { name: 'Legal Counsel', phone: '020-7946-0958', email: 'legal@lawfirm.com', available: false, priority: 'secondary' }
  ];

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
      case 'detected': return 'text-red-400';
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

  const selectedIncident = mockIncidents.find(inc => inc.id === activeIncident);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Incident Response</h3>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
          New Incident
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1">
          <h4 className="text-white font-semibold mb-4">Active Incidents</h4>
          <div className="space-y-3">
            {mockIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => setActiveIncident(incident.id)}
                className={`bg-gray-800/50 border rounded-lg p-4 cursor-pointer transition-colors ${
                  activeIncident === incident.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-white font-medium capitalize">{incident.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-2">{incident.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{formatTimeAgo(incident.detected)}</span>
                  <span className={getStatusColor(incident.status)}>{incident.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Details */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h4 className="text-xl font-bold text-white capitalize">{selectedIncident.type} Incident</h4>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(selectedIncident.status)}`}>
                    {selectedIncident.status}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-4">{selectedIncident.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Detected:</span>
                    <span className="text-white ml-2">{formatTimeAgo(selectedIncident.detected)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white ml-2">{selectedIncident.response.currentStep}/{selectedIncident.response.totalSteps}</span>
                  </div>
                </div>
              </div>

              {/* Response Actions */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h5 className="text-white font-semibold mb-4">Response Actions</h5>
                <div className="space-y-3">
                  {selectedIncident.response.actions.map((action) => (
                    <div key={action.step} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          action.status === 'completed' ? 'bg-green-500' :
                          action.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}>
                          {action.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
                          {action.status === 'in_progress' && <Clock className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <div className="text-white font-medium">{action.action}</div>
                          <div className="text-sm text-gray-400">Assigned to: {action.assignee}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-300">
                          {action.status.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-400">
                          Due: {action.deadline.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-gray-300 mb-2">Select an Incident</h4>
              <p className="text-gray-500">Choose an incident from the list to view details and manage response</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h4 className="text-red-400 font-semibold mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          Emergency Contacts
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{contact.name}</span>
                <div className={`w-2 h-2 rounded-full ${
                  contact.available ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="text-gray-400 text-sm">{contact.phone}</div>
              <div className="text-gray-500 text-xs">{contact.email}</div>
              <div className="text-xs text-gray-600 mt-1 capitalize">{contact.priority} contact</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 