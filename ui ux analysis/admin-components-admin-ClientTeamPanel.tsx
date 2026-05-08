import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useAuth } from '../../hooks/useAuth';

interface ClientTeamPanelProps {
  clientId: string;
  practiceId: string;
}

interface TeamRow {
  assignment_id: string;
  staff_member_id: string;
  staff_name: string;
  staff_email: string;
  role_label: string;
  is_primary: boolean;
}

export function ClientTeamPanel({ clientId, practiceId }: ClientTeamPanelProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const queryClient = useQueryClient();
  const isOwner = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const [adding, setAdding] = useState(false);
  const [newStaffId, setNewStaffId] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('Manager');
  const [error, setError] = useState<string | null>(null);

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['client-team', clientId],
    queryFn: async (): Promise<TeamRow[]> => {
      const { data, error } = await supabase
        .from('client_team_view')
        .select('assignment_id, staff_member_id, staff_name, staff_email, role_label, is_primary')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamRow[];
    },
  });

  const { data: availableStaff = [] } = useQuery({
    queryKey: ['available-staff', practiceId, team.map((t) => t.staff_member_id).join(',')],
    queryFn: async () => {
      const assignedIds = team.map((t) => t.staff_member_id);
      let q = supabase
        .from('practice_members')
        .select('id, name, email')
        .eq('practice_id', practiceId)
        .eq('member_type', 'team')
        .order('name');
      if (assignedIds.length) {
        q = q.not('id', 'in', `(${assignedIds.join(',')})`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: isOwner && adding,
  });

  async function addAssignment() {
    if (!newStaffId || !currentMember) return;
    setError(null);
    try {
      const { error } = await supabase.from('client_assignments').insert({
        client_id: clientId,
        staff_member_id: newStaffId,
        practice_id: practiceId,
        role_label: newRoleLabel || 'Staff',
        is_primary: false,
        assigned_by: currentMember.id,
      });
      if (error) throw error;
      setNewStaffId('');
      setNewRoleLabel('Manager');
      setAdding(false);
      await queryClient.invalidateQueries({ queryKey: ['client-team', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['scoped-clients'] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to assign');
    }
  }

  async function updateRoleLabel(assignmentId: string, label: string) {
    setError(null);
    try {
      const { error } = await supabase
        .from('client_assignments')
        .update({ role_label: label })
        .eq('id', assignmentId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['client-team', clientId] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  async function removeAssignment(assignmentId: string, isPrimary: boolean) {
    if (isPrimary) {
      if (!confirm('This person is the primary partner. Removing them only removes the assignment row — the client_owner_id is unchanged. Continue?')) return;
    } else {
      if (!confirm('Remove this team member from the client?')) return;
    }
    setError(null);
    try {
      const { error } = await supabase
        .from('client_assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['client-team', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['scoped-clients'] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  }

  return (
    <section className="border rounded-lg bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Engagement team</h3>
        {isOwner && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add team member
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading team…</p>
      ) : team.length === 0 ? (
        <p className="text-sm text-gray-500">No team members assigned yet.</p>
      ) : (
        <ul className="divide-y">
          {team.map((row) => (
            <li key={row.assignment_id} className="py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{row.staff_name}</div>
                <div className="text-xs text-gray-500">{row.staff_email}</div>
              </div>
              {isOwner ? (
                <input
                  type="text"
                  defaultValue={row.role_label}
                  onBlur={(e) => {
                    if (e.target.value !== row.role_label) {
                      updateRoleLabel(row.assignment_id, e.target.value);
                    }
                  }}
                  className="text-sm border rounded px-2 py-1 w-32"
                />
              ) : (
                <span className="text-sm text-gray-700">{row.role_label}</span>
              )}
              {row.is_primary && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  Primary
                </span>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => removeAssignment(row.assignment_id, row.is_primary)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="flex gap-2 items-center">
            <select
              value={newStaffId}
              onChange={(e) => setNewStaffId(e.target.value)}
              className="text-sm border rounded px-2 py-1 flex-1"
            >
              <option value="">Select staff member…</option>
              {availableStaff.map((s: { id: string; name: string; email: string }) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newRoleLabel}
              onChange={(e) => setNewRoleLabel(e.target.value)}
              placeholder="Role (e.g. Manager)"
              className="text-sm border rounded px-2 py-1 w-40"
            />
            <button
              type="button"
              onClick={addAssignment}
              disabled={!newStaffId}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
                setNewStaffId('');
              }}
              className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </section>
  );
}
