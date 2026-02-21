// ============================================================================
// Goal Alignment Dashboard — Operational view of all GA clients and sprints
// ============================================================================
// One screen, every GA client, colour-coded by status. "Air traffic control" for sprints.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../config/routes';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton, EmptyState } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import {
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Flag,
  Eye,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface GAClientSummary {
  clientId: string;
  name: string;
  email: string;
  company: string;
  tier: 'lite' | 'growth' | 'partner' | 'unknown';
  hasSprint: boolean;
  sprintStartDate: string | null;
  calendarWeek: number;
  activeWeek: number;
  weeksBehind: number;
  totalGeneratedTasks: number;
  totalResolvedTasks: number;
  completedTasks: number;
  skippedTasks: number;
  completionRate: number;
  skipRate: number;
  weekStatuses: Array<{
    weekNumber: number;
    theme: string;
    generatedTaskCount: number;
    completedCount: number;
    skippedCount: number;
    isResolved: boolean;
  }>;
  lastLogin: string | null;
  lastTaskActivity: string | null;
  daysSinceLastActivity: number;
  riskLevel: 'red' | 'amber' | 'green';
  riskFlags: string[];
  clientStage: 'not_started' | 'in_progress' | 'behind' | 'completed' | 'renewal_pending';
}

// ----------------------------------------------------------------------------
// Data fetching
// ----------------------------------------------------------------------------

const GA_SERVICE_CODES = ['365_method', 'goal_alignment'];
const SPRINT_STAGE_TYPES = ['sprint_plan', 'sprint_plan_part1', 'sprint_plan_part2'];

async function fetchGADashboardData(practiceId: string) {
  // 1. Get GA service line id(s)
  const { data: serviceLines } = await supabase
    .from('service_lines')
    .select('id, code')
    .in('code', GA_SERVICE_CODES)
    .limit(1);

  const gaServiceId = serviceLines?.[0]?.id;

  type EnrollmentRow = {
    client_id: string;
    status?: string;
    tier_name?: string | null;
    practice_members: { id: string; name: string; email: string; client_company?: string; program_status?: string; last_portal_login?: string } | { id: string; name: string; email: string; client_company?: string; program_status?: string; last_portal_login?: string }[] | null;
  };

  let enrollments: Array<{
    client_id: string;
    status?: string;
    tier_name?: string | null;
    practice_members: { id: string; name: string; email: string; client_company?: string; program_status?: string; last_portal_login?: string } | null;
  }> = [];

  if (gaServiceId) {
    const { data } = await supabase
      .from('client_service_lines')
      .select(`
        client_id,
        status,
        tier_name,
        practice_members!client_service_lines_client_id_fkey (
          id,
          name,
          email,
          client_company,
          program_status,
          last_portal_login
        )
      `)
      .eq('practice_id', practiceId)
      .eq('service_line_id', gaServiceId);
    const raw = (data || []) as EnrollmentRow[];
    enrollments = raw
      .filter((e) => e.practice_members != null)
      .map((e) => ({
        client_id: e.client_id,
        status: e.status,
        tier_name: e.tier_name,
        practice_members: Array.isArray(e.practice_members) ? e.practice_members[0] ?? null : e.practice_members,
      }))
      .filter((e) => e.practice_members != null);
  }

  let clientIds = enrollments.map((e) => e.client_id);

  // Fallback: clients who have sprint stages but no enrollment
  if (clientIds.length === 0) {
    const { data: sprintStages } = await supabase
      .from('roadmap_stages')
      .select('client_id')
      .eq('practice_id', practiceId)
      .in('stage_type', SPRINT_STAGE_TYPES)
      .in('status', ['generated', 'approved', 'published']);
    const ids = [...new Set((sprintStages || []).map((s) => s.client_id))];
    if (ids.length > 0) {
      const { data: members } = await supabase
        .from('practice_members')
        .select('id, name, email, client_company, program_status, last_portal_login')
        .in('id', ids)
        .eq('member_type', 'client');
      enrollments = (members || []).map((m) => ({
        client_id: m.id,
        practice_members: m,
        tier_name: null,
      }));
      clientIds = ids;
    }
  }

  if (clientIds.length === 0) {
    return { enrollments: [], sprintStages: [], allTasks: [] };
  }

  // 2. Sprint stages (most recent per client)
  const { data: sprintStages } = await supabase
    .from('roadmap_stages')
    .select('client_id, stage_type, status, created_at, published_at, generated_content')
    .in('client_id', clientIds)
    .in('stage_type', SPRINT_STAGE_TYPES)
    .in('status', ['generated', 'approved', 'published'])
    .order('created_at', { ascending: false });

  // 3. All tasks for these clients
  const { data: allTasks } = await supabase
    .from('client_tasks')
    .select('id, client_id, week_number, title, status, completed_at, skipped_at, updated_at, category, completion_feedback')
    .in('client_id', clientIds);

  return {
    enrollments,
    sprintStages: sprintStages || [],
    allTasks: allTasks || [],
  };
}

// ----------------------------------------------------------------------------
// Compute per-client summary
// ----------------------------------------------------------------------------

function computeClientSummary(
  client: { id: string; name: string; email: string; client_company?: string; program_status?: string; last_portal_login?: string },
  enrollment: { tier_name?: string | null } | null,
  sprintStage: { created_at?: string; published_at?: string; generated_content?: any } | null,
  tasks: Array<{ week_number: number; title: string; status: string; completed_at?: string; skipped_at?: string; updated_at?: string }>,
): GAClientSummary {
  const sprintData = sprintStage?.generated_content?.sprint ?? sprintStage?.generated_content;
  const weeks = sprintData?.weeks || [];

  const sprintStartDate =
    sprintStage?.published_at || sprintStage?.created_at || null;

  let calendarWeek = 1;
  if (sprintStartDate) {
    const start = new Date(sprintStartDate).getTime();
    const now = Date.now();
    calendarWeek = Math.max(1, Math.min(12, Math.ceil((now - start) / (7 * 24 * 60 * 60 * 1000))));
  }

  const weekStatuses = weeks.map((week: any, i: number) => {
    const weekNum = i + 1;
    const generatedTasks = week.tasks || [];
    const weekDbTasks = tasks.filter((t) => t.week_number === weekNum);

    const completedCount = weekDbTasks.filter((t) => t.status === 'completed').length;
    const skippedCount = weekDbTasks.filter((t) => t.status === 'skipped').length;

    const isResolved =
      generatedTasks.length > 0 &&
      generatedTasks.every((gt: any) => {
        const dbTask = weekDbTasks.find((t) => t.title === gt.title);
        return dbTask && (dbTask.status === 'completed' || dbTask.status === 'skipped');
      });

    return {
      weekNumber: weekNum,
      theme: week.theme || `Week ${weekNum}`,
      generatedTaskCount: generatedTasks.length,
      completedCount,
      skippedCount,
      isResolved,
    };
  });

  type WeekStatus = { weekNumber: number; theme: string; generatedTaskCount: number; completedCount: number; skippedCount: number; isResolved: boolean };
  const firstUnresolved = weekStatuses.find((w: WeekStatus) => !w.isResolved);
  const activeWeek = firstUnresolved ? firstUnresolved.weekNumber : 13;

  const totalGeneratedTasks = weeks.reduce((sum: number, w: { tasks?: unknown[] }) => sum + (w.tasks?.length || 0), 0);
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const skippedTasks = tasks.filter((t) => t.status === 'skipped').length;
  const totalResolvedTasks = completedTasks + skippedTasks;

  const lastLogin = client.last_portal_login || null;
  const taskActivities = tasks
    .filter((t) => t.status !== 'pending')
    .map((t) => t.updated_at || t.completed_at || t.skipped_at)
    .filter(Boolean) as string[];
  const lastTaskActivity =
    taskActivities.length > 0 ? taskActivities.sort().reverse()[0] : null;

  const lastActivity = [lastLogin, lastTaskActivity].filter(Boolean).sort().reverse()[0] || null;
  const daysSinceLastActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (24 * 60 * 60 * 1000))
    : 999;

  const rawTier = (enrollment?.tier_name?.toLowerCase() || sprintData?.tier || '') as string;
  const tier: GAClientSummary['tier'] =
    rawTier === 'lite' || rawTier === 'growth' || rawTier === 'partner'
      ? rawTier
      : 'unknown';

  const weeksBehind = Math.max(0, calendarWeek - Math.min(activeWeek, 12));

  const riskFlags: string[] = [];
  if (weeksBehind >= 4) riskFlags.push(`${weeksBehind} weeks behind schedule`);
  else if (weeksBehind >= 2) riskFlags.push(`${weeksBehind} weeks behind`);

  if (daysSinceLastActivity > 21) riskFlags.push('No activity in 3+ weeks');
  else if (daysSinceLastActivity > 14) riskFlags.push('No activity in 2+ weeks');

  const skipRate = totalResolvedTasks > 0 ? (skippedTasks / totalResolvedTasks) * 100 : 0;
  if (skipRate > 50 && totalResolvedTasks >= 5) riskFlags.push(`High skip rate (${Math.round(skipRate)}%)`);

  if (
    totalGeneratedTasks > 0 &&
    totalResolvedTasks === 0 &&
    daysSinceLastActivity > 7
  ) {
    riskFlags.push('Sprint not started');
  }

  let riskLevel: 'red' | 'amber' | 'green' = 'green';
  if (weeksBehind >= 4 || daysSinceLastActivity > 21) riskLevel = 'red';
  else if (weeksBehind >= 2 || daysSinceLastActivity > 14 || skipRate > 50) riskLevel = 'amber';

  let clientStage: GAClientSummary['clientStage'] = 'not_started';
  if (activeWeek > 12) clientStage = 'completed';
  else if (weeksBehind >= 3) clientStage = 'behind';
  else if (totalResolvedTasks > 0) clientStage = 'in_progress';

  return {
    clientId: client.id,
    name: client.name,
    email: client.email,
    company: client.client_company || '',
    tier: tier as 'lite' | 'growth' | 'partner' | 'unknown',
    hasSprint: weeks.length > 0,
    sprintStartDate,
    calendarWeek,
    activeWeek: Math.min(activeWeek, 12),
    weeksBehind,
    totalGeneratedTasks,
    totalResolvedTasks,
    completedTasks,
    skippedTasks,
    completionRate:
      totalGeneratedTasks > 0 ? Math.round((completedTasks / totalGeneratedTasks) * 100) : 0,
    skipRate: Math.round(skipRate),
    weekStatuses,
    lastLogin,
    lastTaskActivity,
    daysSinceLastActivity,
    riskLevel,
    riskFlags,
    clientStage,
  };
}

// ----------------------------------------------------------------------------
// UI components
// ----------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'indigo' | 'amber' | 'emerald' | 'slate';
  subtitle?: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ clients }: { clients: GAClientSummary[] }) {
  const activeClients = clients.filter(
    (c) => c.hasSprint && c.clientStage !== 'completed',
  );
  const behindClients = clients.filter(
    (c) => c.riskLevel === 'red' || c.riskLevel === 'amber',
  );
  const avgCompletion =
    activeClients.length > 0
      ? Math.round(
          activeClients.reduce((sum, c) => sum + c.completionRate, 0) /
            activeClients.length,
        )
      : 0;
  const tasksThisWeek = clients.reduce((sum, c) => {
    const currentWeekTasks = c.weekStatuses.find(
      (w) => w.weekNumber === c.activeWeek,
    );
    const resolved =
      (currentWeekTasks?.completedCount || 0) +
      (currentWeekTasks?.skippedCount || 0);
    const total = currentWeekTasks?.generatedTaskCount || 0;
    return sum + Math.max(0, total - resolved);
  }, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="Active Clients"
        value={activeClients.length}
        icon={Users}
        color="indigo"
      />
      <MetricCard
        label="Need Attention"
        value={behindClients.length}
        icon={AlertTriangle}
        color={behindClients.length > 0 ? 'amber' : 'emerald'}
      />
      <MetricCard
        label="Avg Completion"
        value={`${avgCompletion}%`}
        icon={TrendingUp}
        color="emerald"
      />
      <MetricCard
        label="Open Tasks"
        value={tasksThisWeek}
        icon={Flag}
        color="slate"
        subtitle="across all clients"
      />
    </div>
  );
}

function ClientRow({
  client,
  onViewDetail,
}: {
  client: GAClientSummary;
  onViewDetail: (clientId: string) => void;
}) {
  const borderClass =
    client.riskLevel === 'red'
      ? 'border-l-red-500'
      : client.riskLevel === 'amber'
        ? 'border-l-amber-400'
        : 'border-l-emerald-400';
  const dotClass =
    client.riskLevel === 'red'
      ? 'bg-red-500'
      : client.riskLevel === 'amber'
        ? 'bg-amber-400'
        : 'bg-emerald-400';
  const tierClass =
    client.tier === 'partner'
      ? 'bg-purple-100 text-purple-700'
      : client.tier === 'growth'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-slate-100 text-slate-600';

  return (
    <div
      className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-l-4 ${borderClass}`}
    >
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotClass}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate">{client.name}</p>
          {client.tier !== 'unknown' && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierClass}`}
            >
              {client.tier}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate">{client.company}</p>
      </div>

      <div className="hidden md:flex gap-0.5 flex-shrink-0">
        {client.weekStatuses.slice(0, 12).map((week) => {
          const isActive = week.weekNumber === client.activeWeek;
          const allSkipped =
            week.isResolved &&
            week.skippedCount === week.generatedTaskCount;
          const boxClass = allSkipped
            ? 'bg-slate-200 text-slate-400'
            : week.isResolved
              ? 'bg-emerald-500 text-white'
              : isActive
                ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 ring-offset-1'
                : week.weekNumber < client.activeWeek
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-slate-100 text-slate-400';
          return (
            <div
              key={week.weekNumber}
              className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium ${boxClass}`}
              title={`Week ${week.weekNumber}: ${week.theme} — ${week.completedCount + week.skippedCount}/${week.generatedTaskCount}`}
            >
              {week.isResolved ? '✓' : week.weekNumber}
            </div>
          );
        })}
      </div>

      <div className="text-right flex-shrink-0 w-28">
        <p className="text-sm font-medium text-slate-900">
          Week {client.activeWeek} of 12
        </p>
        {client.weeksBehind > 0 ? (
          <p
            className={`text-xs ${client.weeksBehind >= 4 ? 'text-red-600 font-medium' : 'text-amber-600'}`}
          >
            {client.weeksBehind}w behind
          </p>
        ) : client.clientStage === 'completed' ? (
          <p className="text-xs text-emerald-600">Complete</p>
        ) : (
          <p className="text-xs text-emerald-600">On track</p>
        )}
      </div>

      <div className="text-right flex-shrink-0 w-20">
        <p className="text-sm font-medium text-slate-900">
          {client.completionRate}%
        </p>
        <p className="text-xs text-slate-400">
          {client.completedTasks}/{client.totalGeneratedTasks}
        </p>
      </div>

      <div className="text-right flex-shrink-0 w-24 hidden lg:block">
        <p
          className={`text-xs ${
            client.daysSinceLastActivity > 14
              ? 'text-red-500'
              : client.daysSinceLastActivity > 7
                ? 'text-amber-500'
                : 'text-slate-400'
          }`}
        >
          {client.daysSinceLastActivity === 999
            ? 'Never'
            : client.daysSinceLastActivity === 0
              ? 'Today'
              : client.daysSinceLastActivity === 1
                ? 'Yesterday'
                : `${client.daysSinceLastActivity}d ago`}
        </p>
      </div>

      <div className="flex-shrink-0 w-40 hidden xl:block">
        {client.riskFlags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {client.riskFlags.slice(0, 2).map((flag, i) => (
              <span
                key={i}
                className={`text-[10px] px-1.5 py-0.5 rounded ${client.riskLevel === 'red' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}
              >
                {flag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
            All good
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onViewDetail(client.clientId)}
        className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-indigo-600"
        title="View client detail"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
}

function ClientGroup({
  title,
  count,
  color,
  icon: Icon,
  clients,
  onViewDetail,
}: {
  title: string;
  count: number;
  color: 'red' | 'emerald' | 'slate' | 'indigo';
  icon: React.ComponentType<{ className?: string }>;
  clients: GAClientSummary[];
  onViewDetail: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const iconColorClass =
    color === 'red'
      ? 'text-red-500'
      : color === 'emerald'
        ? 'text-emerald-500'
        : color === 'slate'
          ? 'text-slate-500'
          : 'text-indigo-500';
  const badgeClass =
    color === 'red'
      ? 'bg-red-100 text-red-700'
      : color === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : color === 'slate'
          ? 'bg-slate-100 text-slate-700'
          : 'bg-indigo-100 text-indigo-700';

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColorClass}`} />
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
            {count}
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-90'}`}
        />
      </button>

      {!collapsed && (
        <div className="divide-y divide-slate-50">
          {clients.map((client) => (
            <ClientRow
              key={client.clientId}
              client={client}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientList({
  clients,
  onViewDetail,
}: {
  clients: GAClientSummary[];
  onViewDetail: (clientId: string) => void;
}) {
  const needsAttention = clients
    .filter((c) => c.riskLevel === 'red' || c.riskLevel === 'amber')
    .sort(
      (a, b) =>
        b.weeksBehind - a.weeksBehind ||
        b.daysSinceLastActivity - a.daysSinceLastActivity,
    );

  const onTrack = clients
    .filter(
      (c) =>
        c.riskLevel === 'green' &&
        c.clientStage !== 'completed' &&
        c.hasSprint,
    )
    .sort((a, b) => b.completionRate - a.completionRate);

  const completed = clients
    .filter((c) => c.clientStage === 'completed')
    .sort((a, b) => b.completionRate - a.completionRate);

  const notStarted = clients
    .filter(
      (c) =>
        !c.hasSprint ||
        (c.hasSprint &&
          c.totalResolvedTasks === 0 &&
          c.riskLevel === 'green'),
    )
    .filter((c) => c.clientStage !== 'completed');

  return (
    <div className="space-y-6">
      {needsAttention.length > 0 && (
        <ClientGroup
          title="Needs Attention"
          count={needsAttention.length}
          color="red"
          icon={AlertTriangle}
          clients={needsAttention}
          onViewDetail={onViewDetail}
        />
      )}

      {onTrack.length > 0 && (
        <ClientGroup
          title="On Track"
          count={onTrack.length}
          color="emerald"
          icon={CheckCircle}
          clients={onTrack}
          onViewDetail={onViewDetail}
        />
      )}

      {notStarted.length > 0 && (
        <ClientGroup
          title="Not Started"
          count={notStarted.length}
          color="slate"
          icon={Clock}
          clients={notStarted}
          onViewDetail={onViewDetail}
        />
      )}

      {completed.length > 0 && (
        <ClientGroup
          title="Completed"
          count={completed.length}
          color="indigo"
          icon={Flag}
          clients={completed}
          onViewDetail={onViewDetail}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function GADashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [clients, setClients] = useState<GAClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(() => new Date());

  const fetchDashboard = useCallback(async () => {
    const practiceId = currentMember?.practice_id;
    if (!practiceId) return;

    setLoading(true);
    try {
      const { enrollments, sprintStages, allTasks } = await fetchGADashboardData(
        practiceId,
      );

      const summaries: GAClientSummary[] = enrollments.map((enrollment) => {
        const client = enrollment.practice_members as any;
        if (!client) return null;
        const clientSprintStage = sprintStages.find(
          (s) => s.client_id === client.id,
        );
        const clientTasks = allTasks.filter((t) => t.client_id === client.id);
        return computeClientSummary(
          client,
          enrollment,
          clientSprintStage ?? null,
          clientTasks,
        );
      }).filter(Boolean) as GAClientSummary[];

      setClients(summaries);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch GA dashboard:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [currentMember?.practice_id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleViewDetail = (clientId: string) => {
    // Navigate to Client Services; optionally preselect GA and client via sessionStorage
    try {
      sessionStorage.setItem(
        'gaDashboardSelected',
        JSON.stringify({ clientId, serviceLineCode: '365_method' }),
      );
    } catch (_) {}
    navigate(ADMIN_ROUTES.clients);
  };

  if (loading) {
    return (
      <AdminLayout title="Goal Alignment">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  if (clients.length === 0) {
    return (
      <AdminLayout title="Goal Alignment">
        <div className="max-w-6xl mx-auto">
          <EmptyState
            title="No Goal Alignment clients yet"
            description="When clients are enrolled in the Goal Alignment Programme, they'll appear here with their sprint progress and status."
            icon={<Target className="w-12 h-12 text-slate-300" />}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Goal Alignment Dashboard"
      subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''} enrolled`}
      headerActions={
        <>
          <span className="text-xs text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <SummaryCards clients={clients} />
        <ClientList clients={clients} onViewDetail={handleViewDetail} />
      </div>
    </AdminLayout>
  );
}
