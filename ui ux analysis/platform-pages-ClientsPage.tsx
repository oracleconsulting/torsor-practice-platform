import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useClients, Client } from '@/hooks/useClients';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Users,
  Calendar,
  MapPin,
  Loader2
} from 'lucide-react';

export default function ClientsPage() {
  const { clients, fetchClients, loading } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'with_roadmap' && client.hasRoadmap) ||
      (statusFilter === 'no_roadmap' && !client.hasRoadmap) ||
      (statusFilter === 'in_progress' && !client.hasRoadmap && 
        (client.assessments.part1 !== 'not_started' || client.assessments.part2 !== 'not_started'));

    return matchesSearch && matchesStatus;
  });

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'in_progress': return 'bg-amber-500';
      default: return 'bg-slate-200';
    }
  };

  const getProgressLabel = (client: Client) => {
    if (client.hasRoadmap) return 'Roadmap Generated';
    if (client.assessments.part2 === 'completed') return 'Ready for Roadmap';
    if (client.assessments.part2 === 'in_progress') return 'Part 2 In Progress';
    if (client.assessments.part1 === 'completed') return 'Part 1 Complete';
    if (client.assessments.part1 === 'in_progress') return 'Part 1 In Progress';
    return 'Not Started';
  };

  return (
    <Layout 
      title="Clients" 
      subtitle="Manage your 365 Alignment Program clients"
      breadcrumbs={[{ label: 'Clients' }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
              <p className="text-sm text-slate-500">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.filter(c => c.hasRoadmap).length}
              </p>
              <p className="text-sm text-slate-500">With Roadmap</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.filter(c => !c.hasRoadmap && c.assessments.part1 !== 'not_started').length}
              </p>
              <p className="text-sm text-slate-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.filter(c => c.assessments.part1 === 'not_started').length}
              </p>
              <p className="text-sm text-slate-500">Not Started</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Clients</option>
              <option value="with_roadmap">With Roadmap</option>
              <option value="in_progress">In Progress</option>
              <option value="no_roadmap">No Roadmap</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Progress</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Assessments</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Advisor</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Last Active</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{client.name}</p>
                        <p className="text-sm text-slate-500">{client.email}</p>
                        {client.company && (
                          <p className="text-sm text-slate-400">{client.company}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {client.hasRoadmap ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Roadmap Generated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            {getProgressLabel(client)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getProgressColor(client.assessments.part1)} ${client.assessments.part1 === 'completed' ? 'text-white' : 'text-slate-500'}`}
                          title="Part 1"
                        >
                          1
                        </div>
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getProgressColor(client.assessments.part2)} ${client.assessments.part2 === 'completed' ? 'text-white' : 'text-slate-500'}`}
                          title="Part 2"
                        >
                          2
                        </div>
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getProgressColor(client.assessments.part3)} ${client.assessments.part3 === 'completed' ? 'text-white' : 'text-slate-500'}`}
                          title="Part 3"
                        >
                          3
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.assignedAdvisor ? (
                        <span className="text-sm text-slate-600">{client.assignedAdvisor.name}</span>
                      ) : (
                        <span className="text-sm text-slate-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {client.lastLogin ? (
                        <span className="text-sm text-slate-600">
                          {new Date(client.lastLogin).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No clients found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

