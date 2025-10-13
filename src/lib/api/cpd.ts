import { supabase } from '@/lib/supabase/client';

// =====================================================
// CPD ACTIVITIES
// =====================================================

export interface CPDActivity {
  id: string;
  practice_member_id: string;
  title: string;
  type: 'course' | 'seminar' | 'webinar' | 'reading' | 'conference' | 'workshop' | 'certification' | 'other';
  provider: string | null;
  activity_date: string;
  hours_claimed: number;
  hours_verified: number | null;
  cost: number | null;
  currency: string;
  category: string | null;
  description: string | null;
  learning_objectives: string | null;
  key_takeaways: string | null;
  certificate_url: string | null;
  external_link: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  verifiable: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  practice_member?: {
    name: string;
    email: string;
    role: string;
  };
}

export interface CPDActivityInput {
  practice_member_id: string;
  title: string;
  type: CPDActivity['type'];
  provider?: string;
  activity_date: string;
  hours_claimed: number;
  cost?: number;
  currency?: string;
  category?: string;
  description?: string;
  learning_objectives?: string;
  key_takeaways?: string;
  certificate_url?: string;
  external_link?: string;
  status: CPDActivity['status'];
  verifiable: boolean;
}

export async function getCPDActivities(practiceId?: string) {
  let query = supabase
    .from('cpd_activities')
    .select(`
      *,
      practice_member:practice_members(name, email, role, practice_id)
    `)
    .order('activity_date', { ascending: false });

  if (practiceId) {
    // Filter by practice via the practice_member relationship
    query = query.filter('practice_member.practice_id', 'eq', practiceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching CPD activities:', error);
    throw error;
  }

  return data as CPDActivity[];
}

export async function getCPDActivitiesByMember(memberId: string) {
  const { data, error } = await supabase
    .from('cpd_activities')
    .select('*')
    .eq('practice_member_id', memberId)
    .order('activity_date', { ascending: false });

  if (error) {
    console.error('Error fetching member CPD activities:', error);
    throw error;
  }

  return data as CPDActivity[];
}

export async function createCPDActivity(activity: CPDActivityInput) {
  const { data, error } = await supabase
    .from('cpd_activities')
    .insert(activity)
    .select()
    .single();

  if (error) {
    console.error('Error creating CPD activity:', error);
    throw error;
  }

  return data as CPDActivity;
}

export async function updateCPDActivity(id: string, updates: Partial<CPDActivityInput>) {
  const { data, error } = await supabase
    .from('cpd_activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating CPD activity:', error);
    throw error;
  }

  return data as CPDActivity;
}

export async function deleteCPDActivity(id: string) {
  const { error } = await supabase
    .from('cpd_activities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting CPD activity:', error);
    throw error;
  }
}

// =====================================================
// CPD REQUIREMENTS
// =====================================================

export interface CPDRequirement {
  id: string;
  role: string;
  annual_hours_required: number;
  verifiable_hours_minimum: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCPDRequirements() {
  const { data, error } = await supabase
    .from('cpd_requirements')
    .select('*')
    .order('annual_hours_required', { ascending: false });

  if (error) {
    console.error('Error fetching CPD requirements:', error);
    throw error;
  }

  return data as CPDRequirement[];
}

export async function getCPDRequirementByRole(role: string) {
  const { data, error } = await supabase
    .from('cpd_requirements')
    .select('*')
    .eq('role', role.toLowerCase())
    .single();

  if (error) {
    console.error('Error fetching CPD requirement:', error);
    return null; // Return null if not found
  }

  return data as CPDRequirement;
}

// =====================================================
// EXTERNAL CPD RESOURCES
// =====================================================

export interface CPDExternalResource {
  id: string;
  title: string;
  provider: string;
  url: string;
  description: string | null;
  type: 'course' | 'certification' | 'webinar_series' | 'training_platform' | 'professional_body' | 'other';
  cost: number | null;
  currency: string;
  duration: string | null;
  skill_categories: string[] | null;
  recommended_for: string[] | null;
  accredited_by: string | null;
  cpd_hours: number | null;
  is_active: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CPDExternalResourceInput {
  title: string;
  provider: string;
  url: string;
  description?: string;
  type: CPDExternalResource['type'];
  cost?: number;
  currency?: string;
  duration?: string;
  skill_categories?: string[];
  recommended_for?: string[];
  accredited_by?: string;
  cpd_hours?: number;
}

export async function getCPDExternalResources() {
  const { data, error } = await supabase
    .from('cpd_external_resources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching external CPD resources:', error);
    throw error;
  }

  return data as CPDExternalResource[];
}

export async function createCPDExternalResource(resource: CPDExternalResourceInput) {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('cpd_external_resources')
    .insert({
      ...resource,
      added_by: userData?.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating external CPD resource:', error);
    throw error;
  }

  return data as CPDExternalResource;
}

// =====================================================
// KNOWLEDGE DOCUMENTS
// =====================================================

export interface KnowledgeDocument {
  id: string;
  cpd_activity_id: string | null;
  uploaded_by: string;
  title: string;
  summary: string;
  document_type: 'cpd_summary' | 'case_study' | 'guide' | 'template' | 'notes' | 'other' | null;
  file_name: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  file_type: string | null;
  tags: string[] | null;
  skill_categories: string[] | null;
  is_public: boolean;
  download_count: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    name: string;
    email: string;
  };
}

export interface KnowledgeDocumentInput {
  cpd_activity_id?: string;
  uploaded_by: string;
  title: string;
  summary: string;
  document_type?: KnowledgeDocument['document_type'];
  file_name?: string;
  file_path?: string;
  file_size_bytes?: number;
  file_type?: string;
  tags?: string[];
  skill_categories?: string[];
  is_public?: boolean;
}

export async function getKnowledgeDocuments(practiceId?: string) {
  let query = supabase
    .from('knowledge_documents')
    .select(`
      *,
      uploader:practice_members!knowledge_documents_uploaded_by_fkey(name, email, practice_id)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (practiceId) {
    query = query.filter('uploader.practice_id', 'eq', practiceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching knowledge documents:', error);
    throw error;
  }

  return data as KnowledgeDocument[];
}

export async function createKnowledgeDocument(document: KnowledgeDocumentInput) {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert(document)
    .select()
    .single();

  if (error) {
    console.error('Error creating knowledge document:', error);
    throw error;
  }

  return data as KnowledgeDocument;
}

// =====================================================
// DEVELOPMENT PLAN CPD LINKS
// =====================================================

export interface DevelopmentPlanCPD {
  id: string;
  development_plan_id: string;
  cpd_activity_id: string | null;
  cpd_resource_id: string | null;
  is_recommended: boolean;
  recommended_by: string | null;
  notes: string | null;
  created_at: string;
}

export async function linkCPDToDevelopmentPlan(
  developmentPlanId: string,
  cpdActivityId?: string,
  cpdResourceId?: string,
  isRecommended: boolean = false,
  notes?: string
) {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('development_plan_cpd')
    .insert({
      development_plan_id: developmentPlanId,
      cpd_activity_id: cpdActivityId || null,
      cpd_resource_id: cpdResourceId || null,
      is_recommended: isRecommended,
      recommended_by: isRecommended ? userData?.user?.id : null,
      notes
    })
    .select()
    .single();

  if (error) {
    console.error('Error linking CPD to development plan:', error);
    throw error;
  }

  return data as DevelopmentPlanCPD;
}

export async function getCPDLinksForDevelopmentPlan(developmentPlanId: string) {
  const { data, error } = await supabase
    .from('development_plan_cpd')
    .select(`
      *,
      cpd_activity:cpd_activities(*),
      cpd_resource:cpd_external_resources(*)
    `)
    .eq('development_plan_id', developmentPlanId);

  if (error) {
    console.error('Error fetching CPD links:', error);
    throw error;
  }

  return data;
}

// =====================================================
// ANALYTICS & SUMMARY
// =====================================================

export interface TeamCPDSummary {
  member_id: string;
  member_name: string;
  member_role: string;
  required_hours: number;
  completed_hours: number;
  verifiable_hours: number;
  planned_hours: number;
  progress_percentage: number;
  last_activity_date: string | null;
}

export async function getTeamCPDSummary(practiceId: string): Promise<TeamCPDSummary[]> {
  // Get all practice members
  const { data: members, error: membersError } = await supabase
    .from('practice_members')
    .select('id, name, email, role')
    .eq('practice_id', practiceId);

  if (membersError) {
    console.error('Error fetching practice members:', membersError);
    throw membersError;
  }

  if (!members || members.length === 0) {
    return [];
  }

  // Deduplicate members by email (keep the one with highest priority role)
  const rolesPriority: { [key: string]: number } = {
    'owner': 6,
    'partner': 6,  // Same as owner
    'director': 5,
    'associate director': 4,
    'senior manager': 3,
    'manager': 2,
    'team member': 1
  };
  
  const uniqueMembers = members.reduce((acc, member) => {
    const existing = acc.find(m => m.email === member.email);
    if (!existing) {
      acc.push(member);
    } else {
      // Keep the member with higher priority role
      const existingPriority = rolesPriority[existing.role?.toLowerCase() || ''] || 0;
      const newPriority = rolesPriority[member.role?.toLowerCase() || ''] || 0;
      if (newPriority > existingPriority) {
        // Replace with higher priority role
        const index = acc.indexOf(existing);
        acc[index] = member;
      }
    }
    return acc;
  }, [] as typeof members);
  
  console.log(`[CPD] Found ${members.length} members, deduplicated to ${uniqueMembers.length}`);

  // Get CPD requirements for each role
  const { data: requirements } = await supabase
    .from('cpd_requirements')
    .select('*');

  const requirementsMap = new Map(
    (requirements || []).map((req: CPDRequirement) => [req.role.toLowerCase(), req])
  );

  // Get all CPD activities for these members
  const { data: activities } = await supabase
    .from('cpd_activities')
    .select('*')
    .in('practice_member_id', uniqueMembers.map(m => m.id));

  // Calculate summary for each member
  const summary: TeamCPDSummary[] = uniqueMembers.map(member => {
    const memberActivities = (activities || []).filter(
      a => a.practice_member_id === member.id
    );

    const completedActivities = memberActivities.filter(a => a.status === 'completed');
    const plannedActivities = memberActivities.filter(a => a.status === 'planned');

    const completedHours = completedActivities.reduce((sum, a) => sum + (a.hours_verified || a.hours_claimed), 0);
    const verifiableHours = completedActivities
      .filter(a => a.verifiable)
      .reduce((sum, a) => sum + (a.hours_verified || a.hours_claimed), 0);
    const plannedHours = plannedActivities.reduce((sum, a) => sum + a.hours_claimed, 0);

    const requirement = requirementsMap.get(member.role?.toLowerCase() || '');
    const requiredHours = requirement?.annual_hours_required || 40;

    const lastActivity = memberActivities.length > 0
      ? memberActivities.sort((a, b) => 
          new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
        )[0].activity_date
      : null;

    return {
      member_id: member.id,
      member_name: member.name,
      member_role: member.role || 'Unknown',
      required_hours: requiredHours,
      completed_hours: completedHours,
      verifiable_hours: verifiableHours,
      planned_hours: plannedHours,
      progress_percentage: (completedHours / requiredHours) * 100,
      last_activity_date: lastActivity
    };
  });

  return summary;
}

