import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { UserGroupIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

interface Props {
  practiceId: string;
}

const ClientAdvisoryList: React.FC<Props> = ({ practiceId }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, [practiceId]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('advisory_engagements')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false });
      
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No advisory clients yet</p>
          <p className="text-sm text-gray-500 mt-2">Start engaging clients with advisory services</p>
        </div>
      ) : (
        clients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <BriefcaseIcon className="w-8 h-8 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">{client.client_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{client.service_type}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Started: {new Date(client.start_date).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : client.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">£{client.total_value?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Value</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ClientAdvisoryList;

