import React from 'react';
import { Users, Eye, Trash2, Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { AccountingClient } from '../../../types/accountancy';

interface ClientListProps {
  clients: AccountingClient[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onClientSelect: (client: AccountingClient) => void;
  onDeleteClient: (clientId: string) => void;
  onTogglePortalAccess: (clientId: string, enabled: boolean) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onClientSelect,
  onDeleteClient,
  onTogglePortalAccess
}) => {
  return (
    <div className="bg-white/5 rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
          <option value="former">Former</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Contact</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Portal</th>
              <th className="py-2 px-2">Last Activity</th>
              <th className="py-2 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">No clients found.</td>
              </tr>
            )}
            {clients.map(client => (
              <tr key={client.id} className="border-b border-gray-800 hover:bg-white/10 transition-colors">
                <td className="py-2 px-2 font-semibold text-white cursor-pointer" onClick={() => onClientSelect(client)}>
                  {client.name}
                </td>
                <td className="py-2 px-2 text-gray-300">{client.contactName} <span className="text-gray-500">({client.email})</span></td>
                <td className="py-2 px-2">
                  {client.status === 'active' && <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle className="w-4 h-4" />Active</span>}
                  {client.status === 'inactive' && <span className="inline-flex items-center gap-1 text-gray-400"><Clock className="w-4 h-4" />Inactive</span>}
                  {client.status === 'prospect' && <span className="inline-flex items-center gap-1 text-yellow-400"><AlertTriangle className="w-4 h-4" />Prospect</span>}
                  {client.status === 'former' && <span className="inline-flex items-center gap-1 text-red-400"><Shield className="w-4 h-4" />Former</span>}
                </td>
                <td className="py-2 px-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={client.portalAccess.enabled}
                      onChange={e => onTogglePortalAccess(client.id, e.target.checked)}
                      className="form-checkbox h-4 w-4 text-purple-600"
                    />
                    <span className="ml-2 text-white">{client.portalAccess.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </td>
                <td className="py-2 px-2 text-gray-300">{client.lastActivity ? new Date(client.lastActivity).toLocaleString() : '-'}</td>
                <td className="py-2 px-2 text-right">
                  <button
                    className="text-purple-400 hover:text-purple-600 mr-2"
                    title="View Details"
                    onClick={() => onClientSelect(client)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="text-red-400 hover:text-red-600"
                    title="Delete Client"
                    onClick={() => onDeleteClient(client.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 