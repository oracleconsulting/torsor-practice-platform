import React, { useState } from 'react';
import { AccountingClient } from '../types/accountancy';
import { Eye, Edit, Trash2, Shield, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

interface ClientDetailsProps {
  client: AccountingClient;
  onUpdate: (clientId: string, data: Partial<AccountingClient>) => void;
  onDelete: (clientId: string) => void;
  onTogglePortalAccess: (clientId: string, enabled: boolean) => void;
  onViewPortal: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  onUpdate,
  onDelete,
  onTogglePortalAccess,
  onViewPortal
}) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<AccountingClient>>({ ...client });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(client.id, form);
    setEditMode(false);
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Client Details</h2>
        <div className="flex gap-2">
          <button
            className="text-purple-400 hover:text-purple-600"
            onClick={() => setEditMode(!editMode)}
            title="Edit Client"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            className="text-red-400 hover:text-red-600"
            onClick={() => onDelete(client.id)}
            title="Delete Client"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-2">
            <span className="text-gray-400">Name:</span>
            {editMode ? (
              <input
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                className="ml-2 px-2 py-1 rounded bg-white/10 text-white border border-gray-700"
              />
            ) : (
              <span className="ml-2 text-white font-semibold">{client.name}</span>
            )}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Contact:</span>
            {editMode ? (
              <input
                name="contactName"
                value={form.contactName || ''}
                onChange={handleChange}
                className="ml-2 px-2 py-1 rounded bg-white/10 text-white border border-gray-700"
              />
            ) : (
              <span className="ml-2 text-white">{client.contactName}</span>
            )}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Email:</span>
            {editMode ? (
              <input
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                className="ml-2 px-2 py-1 rounded bg-white/10 text-white border border-gray-700"
              />
            ) : (
              <span className="ml-2 text-white">{client.email}</span>
            )}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Phone:</span>
            {editMode ? (
              <input
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                className="ml-2 px-2 py-1 rounded bg-white/10 text-white border border-gray-700"
              />
            ) : (
              <span className="ml-2 text-white">{client.phone}</span>
            )}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Status:</span>
            {editMode ? (
              <select
                name="status"
                value={form.status || 'active'}
                onChange={handleChange}
                className="ml-2 px-2 py-1 rounded bg-white/10 text-white border border-gray-700"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
                <option value="former">Former</option>
              </select>
            ) : (
              <span className="ml-2 text-white capitalize">{client.status}</span>
            )}
          </div>
        </div>
        <div>
          <div className="mb-2">
            <span className="text-gray-400">Portal Access:</span>
            <label className="inline-flex items-center ml-2 cursor-pointer">
              <input
                type="checkbox"
                checked={client.portalAccess.enabled}
                onChange={e => onTogglePortalAccess(client.id, e.target.checked)}
                className="form-checkbox h-4 w-4 text-purple-600"
              />
              <span className="ml-2 text-white">{client.portalAccess.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Last Login:</span>
            <span className="ml-2 text-white">{client.portalAccess.lastLogin ? new Date(client.portalAccess.lastLogin).toLocaleString() : '-'}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Documents:</span>
            <span className="ml-2 text-white">{client.portalAccess.documentsCount}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Storage Used:</span>
            <span className="ml-2 text-white">{client.portalAccess.storageUsed} MB / {client.portalAccess.storageLimit} MB</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Compliance Risk:</span>
            <span className={`ml-2 font-semibold ${client.compliance.riskLevel === 'high' ? 'text-red-400' : client.compliance.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{client.compliance.riskLevel}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        {editMode && (
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            onClick={handleSave}
          >
            Save
          </button>
        )}
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          onClick={() => setEditMode(false)}
          disabled={!editMode}
        >
          Cancel
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={onViewPortal}
        >
          <ExternalLink className="w-4 h-4 inline-block mr-1" /> View Portal as Admin
        </button>
      </div>
    </div>
  );
}; 