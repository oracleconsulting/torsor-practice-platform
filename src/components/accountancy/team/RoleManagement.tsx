// src/components/accountancy/team/RoleManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  ShieldCheck,
  UserCog,
  Users,
  AlertTriangle,
  Check,
  X,
  Info,
  Crown,
  Briefcase,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { useAuth } from '@/contexts/AuthContext';

// Define role types
type UserRole = 'staff' | 'manager' | 'director' | 'partner' | 'admin';

interface TeamMemberWithPermissions {
  id: string;
  email: string;
  name: string;
  role: string; // Job title
  permission_role: UserRole;
  can_manage_team: boolean;
  can_invite_members: boolean;
  can_edit_assessments: boolean;
  can_delete_data: boolean;
  is_admin: boolean;
}

interface RoleDefinition {
  value: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  permissions: string[];
}

const roleDefinitions: RoleDefinition[] = [
  {
    value: 'staff',
    label: 'Staff',
    icon: Users,
    color: 'bg-gray-500',
    description: 'Standard team member - assessment access only',
    permissions: ['Complete own assessments', 'View own skill profile'],
  },
  {
    value: 'manager',
    label: 'Manager',
    icon: ClipboardList,
    color: 'bg-blue-500',
    description: 'Can view team reports and metrics',
    permissions: [
      'All Staff permissions',
      'View team skills matrix',
      'View team analytics',
      'View development plans',
    ],
  },
  {
    value: 'director',
    label: 'Director',
    icon: Briefcase,
    color: 'bg-purple-500',
    description: 'Can manage team and invite members',
    permissions: [
      'All Manager permissions',
      'Invite team members',
      'Manage team settings',
      'Create development plans',
    ],
  },
  {
    value: 'partner',
    label: 'Partner',
    icon: Crown,
    color: 'bg-amber-500',
    description: 'Full admin access except practice deletion',
    permissions: [
      'All Director permissions',
      'Edit any assessment',
      'Manage all team data',
      'View audit logs',
      'Configure system settings',
    ],
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: 'bg-red-500',
    description: 'Full system access including practice deletion',
    permissions: [
      'All Partner permissions',
      'Delete practice data',
      'Manage billing',
      'Transfer ownership',
    ],
  },
];

const RoleManagement: React.FC = () => {
  const { practice } = useAccountancyContext();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithPermissions | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [changeReason, setChangeReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load team members with permissions
  useEffect(() => {
    loadTeamMembers();
  }, [practice?.id]);

  const loadTeamMembers = async () => {
    if (!practice?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Query the v_team_permissions view we created
      const { data, error: queryError } = await supabase
        .from('v_team_permissions')
        .select('*')
        .eq('practice_id', practice.id)
        .order('permission_role', { ascending: true });

      if (queryError) throw queryError;

      setTeamMembers(data || []);
    } catch (err: any) {
      console.error('Error loading team permissions:', err);
      setError(err.message || 'Failed to load team permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !practice?.id || !user?.email) return;

    try {
      setError(null);
      setSuccess(null);

      // Update the member's role
      const { error: updateError } = await supabase
        .from('practice_members')
        .update({ permission_role: newRole })
        .eq('id', selectedMember.id);

      if (updateError) throw updateError;

      // Log the change
      const { error: logError } = await supabase
        .from('role_changes_log')
        .insert({
          practice_id: practice.id,
          member_email: selectedMember.email,
          member_name: selectedMember.name,
          previous_role: selectedMember.permission_role,
          new_role: newRole,
          changed_by: user.email,
          reason: changeReason || 'No reason provided',
        });

      if (logError) {
        console.warn('Failed to log role change:', logError);
        // Don't fail the operation if logging fails
      }

      setSuccess(
        `Successfully updated ${selectedMember.name}'s role to ${
          roleDefinitions.find((r) => r.value === newRole)?.label
        }`
      );
      setShowConfirmDialog(false);
      setSelectedMember(null);
      setChangeReason('');
      loadTeamMembers(); // Refresh list
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role');
    }
  };

  const openRoleDialog = (member: TeamMemberWithPermissions) => {
    setSelectedMember(member);
    setNewRole(member.permission_role);
    setChangeReason('');
    setShowConfirmDialog(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const def = roleDefinitions.find((r) => r.value === role);
    if (!def) return null;

    const Icon = def.icon;
    return (
      <Badge className={`${def.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {def.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading team permissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <CardTitle className="text-2xl">Role Management</CardTitle>
              <CardDescription className="text-white/80">
                Manage team member permissions and access levels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Info Box */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Role-Based Access:</strong> Assign different permission levels to team members.
          This allows partners and directors to access admin features without needing separate
          accounts.
        </AlertDescription>
      </Alert>

      {/* Role Definitions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Role Definitions</CardTitle>
          <CardDescription>
            Understanding what each role can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleDefinitions.map((roleDef) => {
              const Icon = roleDef.icon;
              return (
                <div
                  key={roleDef.value}
                  className="border border-border rounded-lg p-4 bg-background/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded ${roleDef.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-card-foreground">{roleDef.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{roleDef.description}</p>
                  <div className="space-y-1">
                    {roleDef.permissions.map((perm, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Team Member Permissions</CardTitle>
          <CardDescription>
            {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-background/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Job Title</th>
                  <th scope="col" className="px-6 py-3">Permission Role</th>
                  <th scope="col" className="px-6 py-3">Permissions</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border hover:bg-background/30 transition-colors"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-card-foreground whitespace-nowrap"
                    >
                      {member.name}
                      {member.is_admin && (
                        <ShieldCheck className="inline ml-2 h-4 w-4 text-red-500" />
                      )}
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{member.role}</td>
                    <td className="px-6 py-4">{getRoleBadge(member.permission_role)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.can_manage_team && (
                          <Badge variant="outline" className="text-xs">
                            <UserCog className="h-3 w-3 mr-1" />
                            Manage
                          </Badge>
                        )}
                        {member.can_invite_members && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Invite
                          </Badge>
                        )}
                        {member.can_edit_assessments && (
                          <Badge variant="outline" className="text-xs">
                            Edit
                          </Badge>
                        )}
                        {member.can_delete_data && (
                          <Badge variant="outline" className="text-xs text-red-500">
                            Delete
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleDialog(member)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Change Permission Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update {selectedMember?.name}'s access level and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Role */}
            <div>
              <Label className="text-muted-foreground text-sm">Current Role</Label>
              <div className="mt-1">
                {selectedMember && getRoleBadge(selectedMember.permission_role)}
              </div>
            </div>

            {/* New Role Selection */}
            <div>
              <Label htmlFor="new-role" className="text-card-foreground">
                New Role
              </Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger id="new-role" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleDefinitions.map((roleDef) => {
                    const Icon = roleDef.icon;
                    return (
                      <SelectItem key={roleDef.value} value={roleDef.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{roleDef.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {newRole && (
                <p className="text-xs text-muted-foreground mt-1">
                  {roleDefinitions.find((r) => r.value === newRole)?.description}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason" className="text-card-foreground">
                Reason for Change (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Promoted to partner, needs team management access..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Warning for Admin/Partner roles */}
            {(newRole === 'admin' || newRole === 'partner') && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This role grants extensive permissions including the
                  ability to manage all team data and settings.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={newRole === selectedMember?.permission_role}>
              <Check className="h-4 w-4 mr-2" />
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;

