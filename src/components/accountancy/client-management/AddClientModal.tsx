import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { AccountingClient } from '../../types/accountancy';

interface AddClientModalProps {
  onClose: () => void;
  onAdd: (clientData: Partial<AccountingClient>) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState<Partial<AccountingClient>>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    status: 'active'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (form.name && form.contactName && form.email && form.phone) {
      onAdd(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md shadow-xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Add New Client</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Name</label>
            <input
              name="name"
              value={form.name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-700"
              placeholder="Client Name"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Contact Name</label>
            <input
              name="contactName"
              value={form.contactName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-700"
              placeholder="Contact Name"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Email</label>
            <input
              name="email"
              value={form.email || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-700"
              placeholder="Email"
              type="email"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-700"
              placeholder="Phone"
              type="tel"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Status</label>
            <select
              name="status"
              value={form.status || 'active'}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-700"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
              <option value="former">Former</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            onClick={handleAdd}
            disabled={!(form.name && form.contactName && form.email && form.phone)}
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>
    </div>
  );
}; 