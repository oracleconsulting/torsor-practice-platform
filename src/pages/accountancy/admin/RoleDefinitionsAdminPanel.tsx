/**
 * ROLE DEFINITIONS ADMIN PANEL
 * UI for creating and managing role definitions with their requirements
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Target,
  Users,
  Brain,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { RoleDefinition } from '@/lib/api/assessment-insights/types';
import { useToast } from '@/components/ui/use-toast';

export default function RoleDefinitionsAdminPanel() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [practiceId, setPracticeId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    role_title: '',
    role_category: 'technical' as 'technical' | 'advisory' | 'hybrid' | 'leadership',
    seniority_level: 'Junior' as string,
    department: '',
    description: '',
    key_responsibilities: [''],
    min_eq_self_awareness: 50,
    min_eq_self_management: 50,
    min_eq_social_awareness: 50,
    min_eq_relationship_management: 50,
    required_achievement: 50,
    required_affiliation: 50,
    required_autonomy: 50,
    required_influence: 50,
    preferred_communication_style: 'hybrid' as 'sync' | 'async' | 'hybrid',
    client_facing: false,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);

      // Get current user's practice
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: member } = await supabase
        .from('practice_members')
        .select('practice_id')
        .eq('user_id', user.id)
        .single();

      if (!member || !member.practice_id) {
        throw new Error('Practice not found');
      }

      setPracticeId(member.practice_id);

      // Fetch all roles for practice
      const { data: rolesData, error } = await supabase
        .from('role_definitions')
        .select('*')
        .eq('practice_id', member.practice_id)
        .eq('is_active', true)
        .order('seniority_level', { ascending: false });

      if (error) throw error;

      setRoles(rolesData || []);
      console.log('[RoleDefinitions] Loaded roles:', rolesData?.length);

    } catch (error) {
      console.error('[RoleDefinitions] Error loading:', error);
      toast({
        title: 'Error Loading Roles',
        description: 'Unable to load role definitions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({
      role_title: '',
      role_category: 'technical',
      seniority_level: 'Junior',
      department: '',
      description: '',
      key_responsibilities: [''],
      min_eq_self_awareness: 50,
      min_eq_self_management: 50,
      min_eq_social_awareness: 50,
      min_eq_relationship_management: 50,
      required_achievement: 50,
      required_affiliation: 50,
      required_autonomy: 50,
      required_influence: 50,
      preferred_communication_style: 'hybrid',
      client_facing: false,
    });
    setShowDialog(true);
  };

  const openEditDialog = (role: RoleDefinition) => {
    setEditingRole(role);
    setFormData({
      role_title: role.role_title,
      role_category: role.role_category,
      seniority_level: role.seniority_level,
      department: role.department,
      description: role.description,
      key_responsibilities: role.key_responsibilities || [''],
      min_eq_self_awareness: role.min_eq_self_awareness,
      min_eq_self_management: role.min_eq_self_management,
      min_eq_social_awareness: role.min_eq_social_awareness,
      min_eq_relationship_management: role.min_eq_relationship_management,
      required_achievement: role.required_achievement,
      required_affiliation: role.required_affiliation,
      required_autonomy: role.required_autonomy,
      required_influence: role.required_influence,
      preferred_communication_style: role.preferred_communication_style,
      client_facing: role.client_facing,
    });
    setShowDialog(true);
  };

  const saveRole = async () => {
    try {
      if (!formData.role_title || !formData.department) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in role title and department.',
          variant: 'destructive'
        });
        return;
      }

      const roleData = {
        ...formData,
        practice_id: practiceId,
        key_responsibilities: formData.key_responsibilities.filter(r => r.trim() !== ''),
        required_belbin_roles: {},
        required_skills: []
      };

      if (editingRole) {
        // Update existing
        const { error } = await supabase
          .from('role_definitions')
          .update(roleData)
          .eq('id', editingRole.id);

        if (error) throw error;

        toast({
          title: 'Role Updated',
          description: `${formData.role_title} has been updated successfully.`
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('role_definitions')
          .insert(roleData);

        if (error) throw error;

        toast({
          title: 'Role Created',
          description: `${formData.role_title} has been created successfully.`
        });
      }

      setShowDialog(false);
      loadRoles();

    } catch (error) {
      console.error('[RoleDefinitions] Error saving:', error);
      toast({
        title: 'Save Failed',
        description: 'Unable to save role definition. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const deleteRole = async (roleId: string, roleTitle: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleTitle}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('role_definitions')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'Role Deleted',
        description: `${roleTitle} has been removed.`
      });

      loadRoles();

    } catch (error) {
      console.error('[RoleDefinitions] Error deleting:', error);
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete role. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      key_responsibilities: [...prev.key_responsibilities, '']
    }));
  };

  const updateResponsibility = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      key_responsibilities: prev.key_responsibilities.map((r, i) => i === index ? value : r)
    }));
  };

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_responsibilities: prev.key_responsibilities.filter((_, i) => i !== index)
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-blue-100 text-blue-800',
      advisory: 'bg-purple-100 text-purple-800',
      hybrid: 'bg-green-100 text-green-800',
      leadership: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <p className="text-lg font-medium text-gray-900">Loading Role Definitions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Role Definitions
              </CardTitle>
              <CardDescription>
                Define role requirements and competencies for matching against team member assessments
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{roles.length}</div>
            <div className="text-sm text-gray-600 mt-1">Defined Roles</div>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <div className="grid gap-4">
        {roles.map(role => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{role.role_title}</CardTitle>
                    <Badge className={getCategoryColor(role.role_category)}>
                      {role.role_category}
                    </Badge>
                    <Badge variant="outline">{role.seniority_level}</Badge>
                    {role.client_facing && <Badge variant="secondary">Client-Facing</Badge>}
                  </div>
                  <CardDescription>{role.department}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => openEditDialog(role)}
                    variant="outline"
                    size="sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteRole(role.id, role.role_title)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="font-medium text-sm mb-1">Description</h4>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>

              {/* Key Responsibilities */}
              <div>
                <h4 className="font-medium text-sm mb-2">Key Responsibilities</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {role.key_responsibilities.map((resp, idx) => (
                    <li key={idx}>• {resp}</li>
                  ))}
                </ul>
              </div>

              {/* Requirements Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                {/* EQ Requirements */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <h4 className="font-medium text-sm">EQ Requirements</h4>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Self-Awareness: {role.min_eq_self_awareness}</div>
                    <div>Self-Management: {role.min_eq_self_management}</div>
                    <div>Social Awareness: {role.min_eq_social_awareness}</div>
                    <div>Relationship: {role.min_eq_relationship_management}</div>
                  </div>
                </div>

                {/* Motivational Requirements */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-sm">Motivational Drivers</h4>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Achievement: {role.required_achievement}</div>
                    <div>Affiliation: {role.required_affiliation}</div>
                    <div>Autonomy: {role.required_autonomy}</div>
                    <div>Influence: {role.required_influence}</div>
                  </div>
                </div>

                {/* Work Style */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-sm">Work Style</h4>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Communication: {role.preferred_communication_style}</div>
                    <div>Client Facing: {role.client_facing ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role Definition' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              Define the requirements and competencies for this role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role Title *</Label>
                <Input
                  value={formData.role_title}
                  onChange={e => setFormData(prev => ({ ...prev, role_title: e.target.value }))}
                  placeholder="e.g. Senior Auditor"
                />
              </div>
              <div>
                <Label>Department *</Label>
                <Input
                  value={formData.department}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Audit"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.role_category}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, role_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Seniority Level</Label>
                <Select
                  value={formData.seniority_level}
                  onValueChange={value => setFormData(prev => ({ ...prev, seniority_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Assistant Manager">Assistant Manager</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.client_facing}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, client_facing: checked }))}
                  />
                  <span className="text-sm">Client-Facing</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the role..."
                rows={3}
              />
            </div>

            {/* Key Responsibilities */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Key Responsibilities</Label>
                <Button onClick={addResponsibility} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {formData.key_responsibilities.map((resp, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={resp}
                    onChange={e => updateResponsibility(idx, e.target.value)}
                    placeholder="e.g. Lead audit fieldwork and testing"
                  />
                  <Button
                    onClick={() => removeResponsibility(idx)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* EQ Requirements */}
            <div>
              <Label className="mb-3 block">Minimum EQ Requirements (0-100)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Self-Awareness</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.min_eq_self_awareness}
                    onChange={e => setFormData(prev => ({ ...prev, min_eq_self_awareness: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Self-Management</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.min_eq_self_management}
                    onChange={e => setFormData(prev => ({ ...prev, min_eq_self_management: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Social Awareness</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.min_eq_social_awareness}
                    onChange={e => setFormData(prev => ({ ...prev, min_eq_social_awareness: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Relationship Management</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.min_eq_relationship_management}
                    onChange={e => setFormData(prev => ({ ...prev, min_eq_relationship_management: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Motivational Requirements */}
            <div>
              <Label className="mb-3 block">Required Motivational Drivers (0-100)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Achievement</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.required_achievement}
                    onChange={e => setFormData(prev => ({ ...prev, required_achievement: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Affiliation</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.required_affiliation}
                    onChange={e => setFormData(prev => ({ ...prev, required_affiliation: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Autonomy</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.required_autonomy}
                    onChange={e => setFormData(prev => ({ ...prev, required_autonomy: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Influence</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.required_influence}
                    onChange={e => setFormData(prev => ({ ...prev, required_influence: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Communication Style */}
            <div>
              <Label>Preferred Communication Style</Label>
              <Select
                value={formData.preferred_communication_style}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, preferred_communication_style: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">Synchronous (Face-to-face)</SelectItem>
                  <SelectItem value="async">Asynchronous (Written)</SelectItem>
                  <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveRole}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

