import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Save, 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Network
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  reports_to_id: string | null;
  reports_to_name?: string;
}

interface ReportingLinesManagerProps {
  practiceId: string;
}

export default function ReportingLinesManager({ practiceId }: ReportingLinesManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{ [memberId: string]: string | null }>({});

  useEffect(() => {
    loadTeamMembers();
  }, [practiceId]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Get all team members with their current reporting lines
      const { data, error } = await supabase
        .from('practice_members')
        .select(`
          id,
          name,
          email,
          role,
          reports_to_id,
          manager:practice_members!practice_members_reports_to_id_fkey(name)
        `)
        .eq('practice_id', practiceId)
        .eq('is_active', true)
        .order('role')
        .order('name');

      if (error) {
        console.error('[ReportingLinesManager] Error loading members:', error);
        setErrorMessage('Failed to load team members');
        return;
      }

      // Transform data to include manager name
      const transformedData = (data || []).map(member => ({
        ...member,
        reports_to_name: (member as any).manager?.name || null
      }));

      setMembers(transformedData);
      console.log('[ReportingLinesManager] Loaded members:', transformedData.length);
    } catch (error) {
      console.error('[ReportingLinesManager] Error:', error);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReportingLineChange = (memberId: string, newManagerId: string | null) => {
    // Store pending change (don't save yet)
    setPendingChanges(prev => ({
      ...prev,
      [memberId]: newManagerId
    }));

    // Update local state for immediate UI feedback
    setMembers(prev => prev.map(member => {
      if (member.id === memberId) {
        const newManager = newManagerId ? members.find(m => m.id === newManagerId) : null;
        return {
          ...member,
          reports_to_id: newManagerId,
          reports_to_name: newManager?.name || null
        };
      }
      return member;
    }));
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updates = Object.entries(pendingChanges);
      
      if (updates.length === 0) {
        setSuccessMessage('No changes to save');
        return;
      }

      // Update all changed reporting lines
      for (const [memberId, newManagerId] of updates) {
        const { error } = await supabase
          .from('practice_members')
          .update({ reports_to_id: newManagerId })
          .eq('id', memberId)
          .eq('practice_id', practiceId);

        if (error) {
          console.error('[ReportingLinesManager] Error updating:', error);
          setErrorMessage(`Failed to update reporting line for ${members.find(m => m.id === memberId)?.name}`);
          return;
        }
      }

      setSuccessMessage(`✅ Successfully updated ${updates.length} reporting line${updates.length > 1 ? 's' : ''}!`);
      setPendingChanges({});
      
      // Reload to ensure consistency
      await loadTeamMembers();
    } catch (error) {
      console.error('[ReportingLinesManager] Error saving:', error);
      setErrorMessage('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const clearReportingLine = (memberId: string) => {
    handleReportingLineChange(memberId, null);
  };

  const resetChanges = () => {
    setPendingChanges({});
    loadTeamMembers();
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('partner')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (roleLower.includes('director')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (roleLower.includes('manager')) return 'bg-green-100 text-green-800 border-green-300';
    if (roleLower.includes('senior')) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (roleLower.includes('junior')) return 'bg-gray-100 text-gray-800 border-gray-300';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRoleSortOrder = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('partner')) return 1;
    if (roleLower.includes('director')) return 2;
    if (roleLower.includes('manager') && !roleLower.includes('assistant')) return 3;
    if (roleLower.includes('assistant manager')) return 4;
    if (roleLower.includes('senior')) return 5;
    if (roleLower.includes('junior')) return 6;
    return 7;
  };

  // Group members by role for better visualization
  const groupedMembers = members.reduce((acc, member) => {
    const key = member.role || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  const sortedRoles = Object.keys(groupedMembers).sort((a, b) => 
    getRoleSortOrder(a) - getRoleSortOrder(b)
  );

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team structure...</p>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Network className="w-6 h-6 text-blue-600" />
                Reporting Lines & Organizational Structure
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium mt-2">
                Assign direct reports and oversight responsibilities. Changes will immediately reflect in individual team member portals.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <Card className="bg-amber-50 border-amber-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-gray-900">
                  You have {Object.keys(pendingChanges).length} unsaved change{Object.keys(pendingChanges).length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={resetChanges}
                  variant="outline"
                  size="sm"
                  className="border-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={saveAllChanges}
                  disabled={saving}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="bg-green-50 border-green-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="bg-red-50 border-red-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members by Role */}
      {sortedRoles.map(role => (
        <Card key={role} className="bg-white border-gray-200">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {role} ({groupedMembers[role].length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {groupedMembers[role].map(member => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                    </div>
                    <Badge className={`${getRoleColor(member.role)} border font-medium`}>
                      {member.role}
                    </Badge>
                  </div>

                  {/* Reports To Selection */}
                  <div className="flex items-center gap-3 ml-6">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Reports to:
                    </span>
                    <Select
                      value={member.reports_to_id || 'none'}
                      onValueChange={(value) => handleReportingLineChange(member.id, value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="w-64 bg-white border-gray-300">
                        <SelectValue placeholder="No manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-gray-500 italic">No manager</span>
                        </SelectItem>
                        {members
                          .filter(m => m.id !== member.id) // Can't report to themselves
                          .map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{m.name}</span>
                                <span className="text-xs text-gray-500 ml-2">{m.role}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {member.reports_to_id && (
                      <Button
                        onClick={() => clearReportingLine(member.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    {pendingChanges[member.id] !== undefined && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        Unsaved
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Organizational Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{members.length}</div>
              <div className="text-sm text-gray-600">Total Team Members</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.reports_to_id).length}
              </div>
              <div className="text-sm text-gray-600">With Reporting Lines</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(members.map(m => m.reports_to_id).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Active Managers</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(pendingChanges).length}
              </div>
              <div className="text-sm text-gray-600">Pending Changes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

