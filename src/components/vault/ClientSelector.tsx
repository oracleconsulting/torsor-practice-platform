import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { supabase } from '../../lib/supabase/client';

interface Client {
  id: string;
  name: string;
  company_number?: string;
  status: string;
}

interface ClientSelectorProps {
  onClientSelect: (clientId: string) => void;
  practiceId: string;
}

const ClientSelector = ({ onClientSelect, practiceId }: ClientSelectorProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, [practiceId]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accountancy_clients')
        .select('id, name, company_number, status')
        .eq('practice_id', practiceId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company_number && client.company_number.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Select Client</CardTitle>
          <p className="text-gray-600 mt-2">
            Choose a client to view their vault
          </p>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onClientSelect(client.id)}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    {client.company_number && (
                      <p className="text-sm text-gray-500">
                        Company No: {client.company_number}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Vault →
                </Button>
              </button>
            ))}

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No clients found matching your search' : 'No clients available'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSelector;

