// ============================================================================
// StaffPermissionsPage
// ============================================================================
// Owner-only admin page. Lists all team members in the practice and lets
// the owner toggle per-service-line view/run permissions, plus client_scope.
//
// Wrap with <RequireStaff requireOwner> in the route definition.
//
// Route: /team/permissions
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useAuth } from '../../hooks/useAuth';

const SERVICE_LINES = [
  { code: 'discovery', label: 'Destination Discovery' },
  { code: 'business_intelligence', label: 'Business Intelligence' },
  { code: 'benchmarking', label: 'Benchmarking' },
  { code: 'systems_audit', label: 'Systems Audit' },
  { code: 'goal_alignment', label: 'Goal Alignment (365)' },
  { code: 'business_advisory', label: 'Business Advisory' },
  { code: 'automation', label: 'Automation' },
  { code: 'fractional_cfo', label: 'Fractional CFO' },
  { code: 'fractional_coo', label: 'Fractional COO' },
  { code: 'combined_advisory', label: 'Combined CFO/COO' },
  { code: 'profit_extraction', label: 'Profit Extraction' },
] as const;

type ServiceCode = typeof SERVICE_LINES[number]['code'];

interface PermissionRow {
  service_line_code: ServiceCode;
  can_view: boolean;
  can_run: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  client_scope: 'all' | 'assigned_only';
}

export function StaffPermissionsPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['practice-staff', currentMember?.practice_id],
    queryFn: async (): Promise<StaffMember[]> => {
      if (!currentMember?.practice_id) return [];
      const { data, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role, client_scope')
        .eq('practice_id', currentMember.practice_id)
        .eq('member_type', 'team')
        .order('name');
      if (error) throw error;
      return (data ?? []) as StaffMember[];
    },
    enabled: !!currentMember?.practice_id,
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['member-permissions', selectedMemberId],
    queryFn: async (): Promise<PermissionRow[]> => {
      if (!selectedMemberId) return [];
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('service_line_code, can_view, can_run')
        .eq('practice_member_id', selectedMemberId);
      if (error) throw error;
      return (data ?? []) as PermissionRow[];
    },
    enabled: !!selectedMemberId,
  });

  const permsByCode = useMemo(() => {
    const m = new Map<string, PermissionRow>();
    permissions.forEach((p) => m.set(p.service_line_code, p));
    return m;
  }, [permissions]);

  const selectedMember = staff.find((s) => s.id === selectedMemberId) ?? null;

  useEffect(() => {
    if (!selectedMemberId && staff.length) {
      const nonOwner = staff.find((s) => s.role !== 'owner' && s.role !== 'admin');
      setSelectedMemberId((nonOwner ?? staff[0]).id);
    }
  }, [staff, selectedMemberId]);

  async function togglePermission(
    code: ServiceCode,
    field: 'can_view' | 'can_run',
    nextValue: boolean
  ) {
    if (!selectedMemberId || !selectedMember || !currentMember) return;
    setSaving(true);
    setError(null);

    const existing = permsByCode.get(code);
    const updates: Partial<PermissionRow> = { [field]: nextValue };
    if (field === 'can_view' && !nextValue) {
      updates.can_run = false;
    }
    if (field === 'can_run' && nextValue) {
      updates.can_view = true;
    }

    try {
      if (existing) {
        const { error: updErr } = await supabase
          .from('staff_permissions')
          .update(updates)
          .eq('practice_member_id', selectedMemberId)
          .eq('service_line_code', code);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('staff_permissions')
          .insert({
            practice_member_id: selectedMemberId,
            practice_id: currentMember.practice_id,
            service_line_code: code,
            can_view: updates.can_view ?? false,
            can_run: updates.can_run ?? false,
            granted_by: currentMember.id,
          });
        if (insErr) throw insErr;
      }
      await queryClient.invalidateQueries({
        queryKey: ['member-permissions', selectedMemberId],
      });
      await queryClient.invalidateQueries({ queryKey: ['staff-permissions'] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function updateClientScope(scope: 'all' | 'assigned_only') {
    if (!selectedMemberId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: updErr } = await supabase
        .from('practice_members')
        .update({ client_scope: scope })
        .eq('id', selectedMemberId);
      if (updErr) throw updErr;
      await queryClient.invalidateQueries({
        queryKey: ['practice-staff', currentMember?.practice_id],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (staffLoading) {
    return <div className="p-6 text-gray-600">Loading staff…</div>;
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-semibold mb-2">Staff Permissions</h1>
      <p className="text-gray-600 mb-6">
        Control what each staff member can view and run across service lines,
        and whether they can see all clients or only their assigned ones.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <aside className="border rounded-lg overflow-hidden bg-white">
          <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm">
            Team members ({staff.length})
          </div>
          <ul className="divide-y">
            {staff.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedMemberId(s.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                    selectedMemberId === s.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                  <div className="text-xs text-gray-500 mt-0.5 capitalize">
                    {s.role}
                    {(s.role === 'owner' || s.role === 'admin') && ' · full access'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="border rounded-lg bg-white p-6">
          {!selectedMember ? (
            <p className="text-gray-500">Select a staff member to manage their access.</p>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">{selectedMember.name}</h2>
                <p className="text-sm text-gray-500">{selectedMember.email}</p>
              </div>

              {(selectedMember.role === 'owner' || selectedMember.role === 'admin') && (
                <div className="mb-6 p-3 rounded bg-amber-50 text-amber-900 text-sm">
                  Owners and admins always have full access to all service lines and
                  clients. Permission rows below have no effect for them.
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-sm font-medium mb-2">Client visibility</h3>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="client_scope"
                      checked={selectedMember.client_scope === 'all'}
                      disabled={saving}
                      onChange={() => updateClientScope('all')}
                    />
                    <span>All clients in practice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="client_scope"
                      checked={selectedMember.client_scope === 'assigned_only'}
                      disabled={saving}
                      onChange={() => updateClientScope('assigned_only')}
                    />
                    <span>Only clients assigned to them</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Service line permissions</h3>
                {permsLoading ? (
                  <p className="text-sm text-gray-500">Loading permissions…</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500 border-b">
                        <th className="py-2">Service</th>
                        <th className="py-2 w-24 text-center">View</th>
                        <th className="py-2 w-24 text-center">Run</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {SERVICE_LINES.map((line) => {
                        const p = permsByCode.get(line.code);
                        const v = p?.can_view ?? false;
                        const r = p?.can_run ?? false;
                        return (
                          <tr key={line.code}>
                            <td className="py-2">{line.label}</td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={v}
                                disabled={saving}
                                onChange={(e) =>
                                  togglePermission(line.code, 'can_view', e.target.checked)
                                }
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={r}
                                disabled={saving}
                                onChange={(e) =>
                                  togglePermission(line.code, 'can_run', e.target.checked)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Toggling Run on automatically enables View. Toggling View off
                  also disables Run.
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              {saving && (
                <div className="mt-4 text-sm text-gray-500">Saving…</div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default StaffPermissionsPage;
