import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Calendar,
  AlertCircle,
  Star
} from 'lucide-react';

export default function DashboardPage() {
  const { teamMember } = useAuth();
  const { clients, fetchClients, loading } = useClients();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clientsWithRoadmap = clients.filter(c => c.hasRoadmap);
  const clientsInProgress = clients.filter(c => !c.hasRoadmap && c.assessments.part1 !== 'not_started');
  const clientsNotStarted = clients.filter(c => c.assessments.part1 === 'not_started');
  const recentlyActive = clients
    .filter(c => c.lastLogin)
    .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())
    .slice(0, 5);

  return (
    <Layout 
      title={`Good ${getTimeOfDay()}, ${teamMember?.name?.split(' ')[0]}`}
      subtitle="Here's what's happening with your 365 clients"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Clients"
          value={clients.length}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Roadmaps Generated"
          value={clientsWithRoadmap.length}
          icon={CheckCircle}
          color="emerald"
          trend={clients.length > 0 ? `${Math.round((clientsWithRoadmap.length / clients.length) * 100)}%` : undefined}
        />
        <StatCard
          title="In Progress"
          value={clientsInProgress.length}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Not Started"
          value={clientsNotStarted.length}
          icon={AlertCircle}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients Needing Attention */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Clients Needing Attention</h2>
            <p className="text-sm text-slate-500 mt-1">Started but haven't completed</p>
          </div>
          <div className="divide-y divide-slate-100">
            {clientsInProgress.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p>All clients are on track!</p>
              </div>
            ) : (
              clientsInProgress.slice(0, 5).map((client) => (
                <a
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{client.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{client.company || client.email}</span>
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                          {client.assessments.part1 === 'completed' ? 'Part 2 pending' : 'Part 1 in progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </a>
              ))
            )}
          </div>
          {clientsInProgress.length > 5 && (
            <a
              href="/clients?status=in_progress"
              className="block p-4 text-center text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              View all {clientsInProgress.length} clients in progress
            </a>
          )}
        </div>

        {/* Recently Active */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Recently Active</h2>
            <p className="text-sm text-slate-500 mt-1">Last portal logins</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentlyActive.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentlyActive.map((client) => (
                <a
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-medium">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{client.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatRelativeTime(new Date(client.lastLogin!))}
                    </p>
                  </div>
                  {client.hasRoadmap && (
                    <Star className="w-4 h-4 text-emerald-500" />
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/clients"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <Users className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-medium text-slate-900 group-hover:text-indigo-600">View All Clients</h3>
            <p className="text-sm text-slate-500 mt-1">Manage 365 program clients</p>
          </a>
          <a
            href="/clients?status=with_roadmap"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <CheckCircle className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-medium text-slate-900 group-hover:text-emerald-600">Review Roadmaps</h3>
            <p className="text-sm text-slate-500 mt-1">See completed transformations</p>
          </a>
          <a
            href="/clients?status=in_progress"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <TrendingUp className="w-8 h-8 text-amber-600 mb-3" />
            <h3 className="font-medium text-slate-900 group-hover:text-amber-600">Track Progress</h3>
            <p className="text-sm text-slate-500 mt-1">Follow client journeys</p>
          </a>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: 'indigo' | 'emerald' | 'amber' | 'slate';
  trend?: string;
}) {
  const colors = {
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-100', icon: 'text-amber-600' },
    slate: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 ${colors[color].bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors[color].icon}`} />
        </div>
        {trend && (
          <span className="text-sm font-medium text-emerald-600">{trend}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-4">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

