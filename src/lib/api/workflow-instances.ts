/**
 * Workflow Instances API
 * Manages actual client engagements and team assignments
 */

import { supabase } from '../supabase/client';

export type WorkflowInstanceStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'blocked';

export interface WorkflowInstance {
  id: string;
  practice_id: string;
  service_id: string;
  client_name: string;
  client_id?: string;
  status: WorkflowInstanceStatus;
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  total_estimated_hours?: number;
  total_actual_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WorkflowInstanceAssignment {
  id: string;
  workflow_instance_id: string;
  practice_member_id: string;
  role_seniority: string;
  stage_name?: string;
  estimated_hours?: number;
  actual_hours?: number;
  status: AssignmentStatus;
  start_date?: string;
  completion_date?: string;
  notes?: string;
  feedback_score?: number;
  feedback_notes?: string;
  created_at: string;
  updated_at: string;
  practice_member?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

/**
 * Get all workflow instances for a practice
 */
export async function getWorkflowInstances(
  practiceId: string,
  serviceId?: string,
  status?: WorkflowInstanceStatus
): Promise<WorkflowInstance[]> {
  let query = supabase
    .from('workflow_instances')
    .select('*')
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false });

  if (serviceId) {
    query = query.eq('service_id', serviceId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading workflow instances:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single workflow instance with assignments
 */
export async function getWorkflowInstance(instanceId: string): Promise<{
  instance: WorkflowInstance;
  assignments: WorkflowInstanceAssignment[];
}> {
  const { data: instance, error: instanceError } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('id', instanceId)
    .single();

  if (instanceError) {
    console.error('Error loading workflow instance:', instanceError);
    throw instanceError;
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('workflow_instance_assignments')
    .select(`
      *,
      practice_member:practice_members (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('workflow_instance_id', instanceId);

  if (assignmentsError) {
    console.error('Error loading assignments:', assignmentsError);
    throw assignmentsError;
  }

  return {
    instance,
    assignments: (assignments || []) as WorkflowInstanceAssignment[]
  };
}

/**
 * Create a new workflow instance
 */
export async function createWorkflowInstance(
  practiceId: string,
  serviceId: string,
  clientName: string,
  startDate?: string,
  targetCompletionDate?: string,
  notes?: string
): Promise<WorkflowInstance> {
  const { data, error } = await supabase
    .from('workflow_instances')
    .insert({
      practice_id: practiceId,
      service_id: serviceId,
      client_name: clientName,
      start_date: startDate,
      target_completion_date: targetCompletionDate,
      notes: notes,
      status: 'planned'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workflow instance:', error);
    throw error;
  }

  return data;
}

/**
 * Update a workflow instance
 */
export async function updateWorkflowInstance(
  instanceId: string,
  updates: Partial<WorkflowInstance>
): Promise<WorkflowInstance> {
  const { data, error } = await supabase
    .from('workflow_instances')
    .update(updates)
    .eq('id', instanceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workflow instance:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a workflow instance
 */
export async function deleteWorkflowInstance(instanceId: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_instances')
    .delete()
    .eq('id', instanceId);

  if (error) {
    console.error('Error deleting workflow instance:', error);
    throw error;
  }
}

/**
 * Assign a team member to a workflow instance
 */
export async function assignTeamMember(
  instanceId: string,
  memberId: string,
  roleSeniority: string,
  estimatedHours?: number,
  stageName?: string
): Promise<WorkflowInstanceAssignment> {
  const { data, error } = await supabase
    .from('workflow_instance_assignments')
    .upsert({
      workflow_instance_id: instanceId,
      practice_member_id: memberId,
      role_seniority: roleSeniority,
      estimated_hours: estimatedHours,
      stage_name: stageName,
      status: 'assigned'
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning team member:', error);
    throw error;
  }

  return data;
}

/**
 * Update an assignment
 */
export async function updateAssignment(
  assignmentId: string,
  updates: Partial<WorkflowInstanceAssignment>
): Promise<WorkflowInstanceAssignment> {
  const { data, error } = await supabase
    .from('workflow_instance_assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }

  return data;
}

/**
 * Remove an assignment
 */
export async function removeAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_instance_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error removing assignment:', error);
    throw error;
  }
}

/**
 * Get assignments for a team member
 */
export async function getMemberAssignments(
  memberId: string,
  status?: AssignmentStatus
): Promise<WorkflowInstanceAssignment[]> {
  let query = supabase
    .from('workflow_instance_assignments')
    .select(`
      *,
      workflow_instance:workflow_instances (
        id,
        service_id,
        client_name,
        status,
        start_date,
        target_completion_date
      )
    `)
    .eq('practice_member_id', memberId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading member assignments:', error);
    throw error;
  }

  return (data || []) as WorkflowInstanceAssignment[];
}

/**
 * Log actual hours for an assignment
 */
export async function logHours(
  assignmentId: string,
  hours: number,
  notes?: string
): Promise<WorkflowInstanceAssignment> {
  // Get current actual hours
  const { data: current } = await supabase
    .from('workflow_instance_assignments')
    .select('actual_hours')
    .eq('id', assignmentId)
    .single();

  const newTotal = (current?.actual_hours || 0) + hours;

  return updateAssignment(assignmentId, {
    actual_hours: newTotal,
    notes: notes ? (current?.notes ? `${current.notes}\n${notes}` : notes) : current?.notes
  });
}

/**
 * Submit feedback for an assignment
 */
export async function submitFeedback(
  assignmentId: string,
  score: number,
  notes?: string
): Promise<WorkflowInstanceAssignment> {
  return updateAssignment(assignmentId, {
    feedback_score: score,
    feedback_notes: notes,
    status: 'completed',
    completion_date: new Date().toISOString()
  });
}

