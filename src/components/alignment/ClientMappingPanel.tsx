import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { clientMappingService, type ClientMapping } from '../../services/alignmentEnhancementsService';

interface ClientMappingPanelProps {
  practiceId: string;
  onMappingSelected?: (mapping: ClientMapping) => void;
}

export function ClientMappingPanel({ practiceId, onMappingSelected }: ClientMappingPanelProps) {
  const [mappings, setMappings] = useState<ClientMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ClientMapping | null>(null);

  useEffect(() => {
    loadMappings();
  }, [practiceId]);

  const loadMappings = async () => {
    setLoading(true);
    const data = await clientMappingService.getMappings(practiceId);
    setMappings(data);
    setLoading(false);
  };

  const handleDelete = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    
    const success = await clientMappingService.deleteMapping(mappingId);
    if (success) {
      setMappings(prev => prev.filter(m => m.id !== mappingId));
    } else {
      alert('Failed to delete mapping');
    }
  };

  const handleToggleStatus = async (mapping: ClientMapping) => {
    const newStatus = mapping.mapping_status === 'active' ? 'inactive' : 'active';
    const success = await clientMappingService.updateMappingStatus(mapping.id, newStatus);
    
    if (success) {
      setMappings(prev => prev.map(m => 
        m.id === mapping.id ? { ...m, mapping_status: newStatus } : m
      ));
    }
  };

  const filteredMappings = mappings.filter(m =>
    m.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.oracle_group_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client mappings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Mappings</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Link TORSOR clients to Oracle Method Portal accounts
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name, email, or group ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Mappings Table */}
          {filteredMappings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No client mappings found</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                Create Your First Mapping
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oracle Group ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mapped
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMappings.map((mapping) => (
                    <tr
                      key={mapping.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onMappingSelected?.(mapping)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {mapping.business_name || 'Unnamed Business'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{mapping.client_email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-500">
                          {mapping.oracle_group_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(mapping.mapping_status)}>
                          {mapping.mapping_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(mapping.mapped_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(mapping);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title={mapping.mapping_status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {mapping.mapping_status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMapping(mapping);
                              setShowAddModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(mapping.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {mappings.filter(m => m.mapping_status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {mappings.filter(m => m.mapping_status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{mappings.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal (Simplified - you can expand this) */}
      {showAddModal && (
        <AddMappingModal
          practiceId={practiceId}
          mapping={editingMapping}
          onClose={() => {
            setShowAddModal(false);
            setEditingMapping(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingMapping(null);
            loadMappings();
          }}
        />
      )}
    </>
  );
}

// Add Mapping Modal Component
function AddMappingModal({
  practiceId,
  mapping,
  onClose,
  onSuccess
}: {
  practiceId: string;
  mapping: ClientMapping | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    torsorClientId: mapping?.torsor_client_id || '',
    oracleGroupId: mapping?.oracle_group_id || '',
    clientEmail: mapping?.client_email || '',
    businessName: mapping?.business_name || '',
    notes: mapping?.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await clientMappingService.createMapping(
        practiceId,
        formData.torsorClientId,
        formData.oracleGroupId,
        formData.clientEmail,
        formData.businessName,
        formData.notes
      );

      if (result) {
        onSuccess();
      } else {
        alert('Failed to create mapping');
      }
    } catch (error) {
      alert('Error creating mapping');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {mapping ? 'Edit Mapping' : 'Add Client Mapping'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TORSOR Client ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.torsorClientId}
              onChange={(e) => setFormData({ ...formData, torsorClientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter TORSOR client UUID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Oracle Group ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.oracleGroupId}
              onChange={(e) => setFormData({ ...formData, oracleGroupId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Oracle Method Portal group_id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Client's business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Optional notes about this mapping..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : mapping ? 'Update Mapping' : 'Create Mapping'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

