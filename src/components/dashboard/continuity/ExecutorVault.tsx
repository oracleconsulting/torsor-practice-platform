import React, { useState } from 'react';
import { Shield, User, Key, FileText, Plus } from 'lucide-react';

export const ExecutorVault: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'executors' | 'credentials' | 'contacts' | 'documents'>('executors');

  const mockExecutors = {
    primary: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+44 7700 900123',
      relationship: 'Solicitor',
      accessDelay: 24
    },
    secondary: {
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+44 7700 900456',
      relationship: 'Business Partner',
      accessDelay: 48
    }
  };

  const mockCredentials = [
    {
      id: '1',
      service: 'Xero',
      username: 'practice@oracle.com',
      encryptedPassword: '********',
      importance: 'critical' as const,
      lastUpdated: new Date(),
      notes: 'Main accounting software'
    },
    {
      id: '2',
      service: 'HMRC Gateway',
      username: 'practice@oracle.com',
      encryptedPassword: '********',
      importance: 'critical' as const,
      lastUpdated: new Date(),
      notes: 'Tax submissions'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Digital Executor Vault</h3>
        <div className="flex gap-2">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
            <Plus className="w-4 h-4 mr-1 inline" />
            Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'executors', label: 'Executors', icon: User },
          { id: 'credentials', label: 'Credentials', icon: Key },
          { id: 'contacts', label: 'Contacts', icon: User },
          { id: 'documents', label: 'Documents', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'executors' && (
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-3">Primary Executor</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{mockExecutors.primary.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{mockExecutors.primary.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone:</span>
                <span className="text-white">{mockExecutors.primary.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Relationship:</span>
                <span className="text-white">{mockExecutors.primary.relationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Access Delay:</span>
                <span className="text-white">{mockExecutors.primary.accessDelay} hours</span>
              </div>
            </div>
          </div>

          {mockExecutors.secondary && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-3">Secondary Executor</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{mockExecutors.secondary.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{mockExecutors.secondary.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white">{mockExecutors.secondary.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Relationship:</span>
                  <span className="text-white">{mockExecutors.secondary.relationship}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Access Delay:</span>
                  <span className="text-white">{mockExecutors.secondary.accessDelay} hours</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="space-y-4">
          {mockCredentials.map((credential) => (
            <div key={credential.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{credential.service}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  credential.importance === 'critical' ? 'bg-red-500/20 text-red-400' :
                  credential.importance === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {credential.importance}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <span className="text-white">{credential.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Password:</span>
                  <span className="text-white">{credential.encryptedPassword}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white">{credential.lastUpdated.toLocaleDateString()}</span>
                </div>
                {credential.notes && (
                  <div className="text-gray-400 italic">{credential.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-gray-300 mb-2">Critical Contacts</h4>
          <p className="text-gray-500">Manage important business contacts for succession planning</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-gray-300 mb-2">Important Documents</h4>
          <p className="text-gray-500">Store and manage critical documents for business continuity</p>
        </div>
      )}
    </div>
  );
}; 