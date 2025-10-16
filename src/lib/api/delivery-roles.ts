/**
 * Service Delivery Roles API
 * Manages team structure and skill requirements per role
 */

import { supabase } from '../supabase/client';

export interface ServiceDeliveryRole {
  id: string;
  practice_id: string;
  service_id: string;
  seniority: string;
  display_order: number;
  responsibilities: string[];
  estimated_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryRoleSkill {
  id: string;
  delivery_role_id: string;
  skill_id: string;
  minimum_level: number;
  ideal_level: number;
  is_critical: boolean;
  created_at: string;
  skill?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
}

/**
 * Get all delivery roles for a service
 */
export async function getServiceDeliveryRoles(
  practiceId: string,
  serviceId: string
): Promise<ServiceDeliveryRole[]> {
  const { data, error } = await supabase
    .from('service_delivery_roles')
    .select('*')
    .eq('practice_id', practiceId)
    .eq('service_id', serviceId)
    .order('display_order');

  if (error) {
    console.error('Error loading delivery roles:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create or update a delivery role
 */
export async function upsertDeliveryRole(
  practiceId: string,
  serviceId: string,
  seniority: string,
  responsibilities: string[],
  estimatedHours?: number,
  displayOrder: number = 0
): Promise<ServiceDeliveryRole> {
  const { data, error } = await supabase
    .from('service_delivery_roles')
    .upsert({
      practice_id: practiceId,
      service_id: serviceId,
      seniority: seniority,
      responsibilities: responsibilities,
      estimated_hours: estimatedHours,
      display_order: displayOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting delivery role:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a delivery role
 */
export async function deleteDeliveryRole(roleId: string): Promise<void> {
  const { error } = await supabase
    .from('service_delivery_roles')
    .delete()
    .eq('id', roleId);

  if (error) {
    console.error('Error deleting delivery role:', error);
    throw error;
  }
}

/**
 * Get skills for a delivery role
 */
export async function getDeliveryRoleSkills(
  roleId: string
): Promise<DeliveryRoleSkill[]> {
  const { data, error } = await supabase
    .from('service_delivery_role_skills')
    .select(`
      *,
      skill:skills (
        id,
        name,
        category,
        description
      )
    `)
    .eq('delivery_role_id', roleId);

  if (error) {
    console.error('Error loading delivery role skills:', error);
    throw error;
  }

  return (data || []) as DeliveryRoleSkill[];
}

/**
 * Assign a skill to a delivery role
 */
export async function assignSkillToRole(
  roleId: string,
  skillId: string,
  minimumLevel: number,
  idealLevel: number,
  isCritical: boolean = false
): Promise<DeliveryRoleSkill> {
  const { data, error } = await supabase
    .from('service_delivery_role_skills')
    .upsert({
      delivery_role_id: roleId,
      skill_id: skillId,
      minimum_level: minimumLevel,
      ideal_level: idealLevel,
      is_critical: isCritical,
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning skill to role:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a skill from a delivery role
 */
export async function removeSkillFromRole(
  roleId: string,
  skillId: string
): Promise<void> {
  const { error } = await supabase
    .from('service_delivery_role_skills')
    .delete()
    .eq('delivery_role_id', roleId)
    .eq('skill_id', skillId);

  if (error) {
    console.error('Error removing skill from role:', error);
    throw error;
  }
}

/**
 * Bulk assign skills to a role
 */
export async function bulkAssignSkillsToRole(
  roleId: string,
  assignments: Array<{
    skill_id: string;
    minimum_level: number;
    ideal_level: number;
    is_critical: boolean;
  }>
): Promise<DeliveryRoleSkill[]> {
  // First, delete all existing skills for this role
  await supabase
    .from('service_delivery_role_skills')
    .delete()
    .eq('delivery_role_id', roleId);

  // Then insert new assignments
  const records = assignments.map(a => ({
    delivery_role_id: roleId,
    ...a,
  }));

  const { data, error } = await supabase
    .from('service_delivery_role_skills')
    .insert(records)
    .select();

  if (error) {
    console.error('Error bulk assigning skills to role:', error);
    throw error;
  }

  return data || [];
}

/**
 * Sync role skills to service skills
 * Aggregates all role-level skill assignments into service-level requirements
 */
export async function syncRoleSkillsToService(
  practiceId: string,
  serviceId: string
): Promise<void> {
  const { error } = await supabase.rpc('sync_role_skills_to_service', {
    p_practice_id: practiceId,
    p_service_id: serviceId,
  });

  if (error) {
    console.error('Error syncing role skills to service:', error);
    throw error;
  }
}

/**
 * Get aggregated skill requirements from all roles
 * (Client-side alternative to the sync function for preview)
 */
export async function getAggregatedSkillsFromRoles(
  practiceId: string,
  serviceId: string
): Promise<Map<string, { minLevel: number; idealLevel: number; isCritical: boolean; roles: string[] }>> {
  const roles = await getServiceDeliveryRoles(practiceId, serviceId);
  const aggregated = new Map<string, any>();

  for (const role of roles) {
    const roleSkills = await getDeliveryRoleSkills(role.id);
    
    for (const roleSkill of roleSkills) {
      const skillId = roleSkill.skill_id;
      const existing = aggregated.get(skillId);

      if (existing) {
        // Take max levels, OR critical flags, append role
        aggregated.set(skillId, {
          minLevel: Math.max(existing.minLevel, roleSkill.minimum_level),
          idealLevel: Math.max(existing.idealLevel, roleSkill.ideal_level),
          isCritical: existing.isCritical || roleSkill.is_critical,
          roles: [...existing.roles, role.seniority],
          skillName: roleSkill.skill?.name || '',
        });
      } else {
        aggregated.set(skillId, {
          minLevel: roleSkill.minimum_level,
          idealLevel: roleSkill.ideal_level,
          isCritical: roleSkill.is_critical,
          roles: [role.seniority],
          skillName: roleSkill.skill?.name || '',
        });
      }
    }
  }

  return aggregated;
}

