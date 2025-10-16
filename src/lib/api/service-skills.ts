/**
 * Service Skills API
 * Manages custom skill assignments for advisory services
 */

import { supabase } from '../supabase/client';

export interface ServiceSkillAssignment {
  id: string;
  practice_id: string;
  service_id: string;
  skill_id: string;
  minimum_level: number;
  ideal_level: number;
  is_critical: boolean;
  required_seniority: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  skill?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
}

export interface WorkflowStageAssignment {
  id: string;
  workflow_id: string;
  stage_index: number;
  stage_name: string;
  assigned_to?: string;
  assigned_role?: string;
  estimated_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_member?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface WorkflowStageSkillRequirement {
  id: string;
  stage_assignment_id: string;
  skill_id: string;
  minimum_level: number;
  created_at: string;
  skill?: {
    id: string;
    name: string;
    category: string;
  };
}

/**
 * Get all skill assignments for a service
 */
export async function getServiceSkillAssignments(
  practiceId: string,
  serviceId: string
): Promise<ServiceSkillAssignment[]> {
  const { data, error } = await supabase
    .from('service_skill_assignments')
    .select(`
      *,
      skill:skills (
        id,
        name,
        category,
        description
      )
    `)
    .eq('practice_id', practiceId)
    .eq('service_id', serviceId)
    .order('skill(name)');

  if (error) {
    console.error('Error loading service skill assignments:', error);
    throw error;
  }

  return (data || []) as ServiceSkillAssignment[];
}

/**
 * Assign a skill to a service
 */
export async function assignSkillToService(
  practiceId: string,
  serviceId: string,
  skillId: string,
  minimumLevel: number,
  idealLevel: number,
  isCritical: boolean = false,
  requiredSeniority: string[] = []
): Promise<ServiceSkillAssignment> {
  const { data, error } = await supabase
    .from('service_skill_assignments')
    .upsert({
      practice_id: practiceId,
      service_id: serviceId,
      skill_id: skillId,
      minimum_level: minimumLevel,
      ideal_level: idealLevel,
      is_critical: isCritical,
      required_seniority: requiredSeniority,
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning skill to service:', error);
    throw error;
  }

  return data;
}

/**
 * Update a service skill assignment
 */
export async function updateServiceSkillAssignment(
  assignmentId: string,
  updates: Partial<ServiceSkillAssignment>
): Promise<ServiceSkillAssignment> {
  const { data, error } = await supabase
    .from('service_skill_assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating service skill assignment:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a skill from a service
 */
export async function removeSkillFromService(
  practiceId: string,
  serviceId: string,
  skillId: string
): Promise<void> {
  const { error } = await supabase
    .from('service_skill_assignments')
    .delete()
    .eq('practice_id', practiceId)
    .eq('service_id', serviceId)
    .eq('skill_id', skillId);

  if (error) {
    console.error('Error removing skill from service:', error);
    throw error;
  }
}

/**
 * Bulk assign multiple skills to a service
 */
export async function bulkAssignSkillsToService(
  practiceId: string,
  serviceId: string,
  assignments: Array<{
    skill_id: string;
    minimum_level: number;
    ideal_level: number;
    is_critical: boolean;
    required_seniority: string[];
  }>
): Promise<ServiceSkillAssignment[]> {
  const records = assignments.map(a => ({
    practice_id: practiceId,
    service_id: serviceId,
    ...a,
  }));

  const { data, error } = await supabase
    .from('service_skill_assignments')
    .upsert(records)
    .select();

  if (error) {
    console.error('Error bulk assigning skills:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get workflow stage assignments
 */
export async function getWorkflowStageAssignments(
  workflowId: string
): Promise<WorkflowStageAssignment[]> {
  const { data, error } = await supabase
    .from('workflow_stage_assignments')
    .select(`
      *,
      assigned_member:practice_members (
        id,
        full_name,
        role
      )
    `)
    .eq('workflow_id', workflowId)
    .order('stage_index');

  if (error) {
    console.error('Error loading workflow stage assignments:', error);
    throw error;
  }

  return (data || []) as WorkflowStageAssignment[];
}

/**
 * Assign a team member to a workflow stage
 */
export async function assignStageToMember(
  workflowId: string,
  stageIndex: number,
  stageName: string,
  assignedTo?: string,
  assignedRole?: string,
  estimatedHours?: number
): Promise<WorkflowStageAssignment> {
  const { data, error } = await supabase
    .from('workflow_stage_assignments')
    .upsert({
      workflow_id: workflowId,
      stage_index: stageIndex,
      stage_name: stageName,
      assigned_to: assignedTo,
      assigned_role: assignedRole,
      estimated_hours: estimatedHours,
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning stage to member:', error);
    throw error;
  }

  return data;
}

/**
 * Get skill requirements for a workflow stage
 */
export async function getStageSkillRequirements(
  stageAssignmentId: string
): Promise<WorkflowStageSkillRequirement[]> {
  const { data, error } = await supabase
    .from('workflow_stage_skill_requirements')
    .select(`
      *,
      skill:skills (
        id,
        name,
        category
      )
    `)
    .eq('stage_assignment_id', stageAssignmentId);

  if (error) {
    console.error('Error loading stage skill requirements:', error);
    throw error;
  }

  return (data || []) as WorkflowStageSkillRequirement[];
}

/**
 * Add skill requirement to a workflow stage
 */
export async function addSkillRequirementToStage(
  stageAssignmentId: string,
  skillId: string,
  minimumLevel: number
): Promise<WorkflowStageSkillRequirement> {
  const { data, error } = await supabase
    .from('workflow_stage_skill_requirements')
    .upsert({
      stage_assignment_id: stageAssignmentId,
      skill_id: skillId,
      minimum_level: minimumLevel,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding skill requirement to stage:', error);
    throw error;
  }

  return data;
}

