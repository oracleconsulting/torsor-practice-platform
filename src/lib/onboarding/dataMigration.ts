import { supabase } from '@/lib/supabase/client';

interface MigrationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Calculate business health score based on assessment data
function calculateBusinessHealth(intake: any, intake2: any): number {
  let score = 50; // Base score

  // Factors that increase health
  if (intake?.responses?.commitment_hours === '15 hours +') score += 10;
  if (intake?.responses?.commitment_hours === '10-15 hours') score += 5;
  
  // Check for positive indicators
  if (intake2?.responses?.financial_visibility === 'Real-time dashboards') score += 15;
  if (intake2?.responses?.financial_visibility === 'Monthly reports') score += 10;
  
  if (intake2?.responses?.operational_maturity === 'Optimized') score += 15;
  if (intake2?.responses?.operational_maturity === 'Managed') score += 10;
  
  // Factors that decrease health
  if (intake?.responses?.danger_zone === 'Cash running out') score -= 15;
  if (intake2?.responses?.financial_visibility === 'Flying blind') score -= 20;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Calculate growth percentage based on revenue data
function calculateGrowth(intake2: any): number {
  const currentRevenue = parseInt(intake2?.responses?.current_monthly_revenue || '0');
  const previousRevenue = parseInt(intake2?.responses?.previous_monthly_revenue || currentRevenue.toString());
  
  if (previousRevenue === 0) return 0;
  
  const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  return Math.round(growth * 10) / 10; // Round to 1 decimal place
}

// Extract initial tasks from roadmap
function extractTasksFromRoadmap(roadmap: any): any[] {
  if (!roadmap?.weeks || !Array.isArray(roadmap.weeks)) return [];
  
  const tasks: any[] = [];
  
  // Get first 3 weeks of tasks
  roadmap.weeks.slice(0, 3).forEach((week: any) => {
    if (week.actions && Array.isArray(week.actions)) {
      week.actions.forEach((action: string, index: number) => {
        tasks.push({
          title: action,
          description: `Week ${week.week_number} - ${week.theme}`,
          priority: index === 0 ? 'high' : 'medium',
          status: 'pending',
          due_date: new Date(Date.now() + (week.week_number * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          category: 'roadmap',
          source: 'assessment'
        });
      });
    }
  });
  
  return tasks;
}

// Get default board member name based on role
function getDefaultBoardMemberName(role: string): string {
  const defaultNames: Record<string, string> = {
    'CFO': 'Sarah Chen',
    'CMO': 'Marcus Johnson',
    'COO': 'Elena Rodriguez',
    'CTO': 'Alex Kumar',
    'CHRO': 'Priya Patel',
    'CLO': 'David Thompson'
  };
  
  return defaultNames[role] || `${role} Advisor`;
}

// Main migration function
export async function migrateAssessmentToDashboard(
  userId: string, 
  groupId: string
): Promise<MigrationResult> {
  try {
    console.log('Starting assessment to dashboard migration...', { userId, groupId });

    // 1. Fetch all assessment data
    const [intakeResult, intake2Result, configResult] = await Promise.all([
      supabase.from('client_intake').select('*').eq('group_id', groupId).single(),
      supabase.from('client_intake_part2').select('*').eq('group_id', groupId).single(),
      supabase.from('client_config').select('*').eq('group_id', groupId).single()
    ]);

    if (intakeResult.error) {
      console.error('Error fetching intake data:', intakeResult.error);
      return { success: false, error: 'Failed to fetch assessment data' };
    }

    const intake = intakeResult.data;
    const intake2 = intake2Result.data;
    const config = configResult.data;

    // 2. Calculate metrics
    const businessHealth = calculateBusinessHealth(intake, intake2);
    const growthPercentage = calculateGrowth(intake2);
    const currentRevenue = parseInt(intake2?.responses?.current_monthly_revenue || intake?.responses?.business_turnover?.current_turnover || '0');
    const targetRevenue = config?.roadmap?.summary?.targetRevenue90Days 
      ? parseInt(config.roadmap.summary.targetRevenue90Days.replace(/[^0-9]/g, ''))
      : currentRevenue * 1.5;

    // 3. Create dashboard setup
    const dashboardSetup = {
      user_id: userId,
      initial_revenue: currentRevenue,
      target_revenue: targetRevenue,
      initial_energy: parseInt(intake?.responses?.energy_level || '75'),
      business_health: businessHealth,
      active_widgets: [
        'business-organism',
        'revenue-tracker',
        'energy-meter',
        'todays-focus',
        'board-pulse',
        'quick-actions',
        'performance-metrics',
        'community-activity'
      ],
      preferred_theme: 'auto'
    };

    // 4. Create dashboard metrics entry
    const dashboardMetrics = {
      user_id: userId,
      group_id: groupId,
      revenue: currentRevenue,
      growth_percentage: growthPercentage,
      business_health: businessHealth,
      energy_level: dashboardSetup.initial_energy,
      source: 'assessment' as const
    };

    // 5. Extract tasks from roadmap
    const tasks = extractTasksFromRoadmap(config?.roadmap);
    const tasksWithUserId = tasks.map(task => ({ ...task, user_id: userId }));

    // 6. Create board members
    const boardMembers = config?.board?.map((role: string) => ({
      user_id: userId,
      role,
      name: getDefaultBoardMemberName(role),
      personality_type: config?.rationale?.role_explanations?.[role]?.personality || 'balanced',
      is_active: true,
      expertise_areas: config?.rationale?.role_explanations?.[role]?.expertise || [],
      communication_style: config?.rationale?.role_explanations?.[role]?.style || 'professional'
    })) || [];

    // 7. Save everything to database
    const results = await Promise.all([
      supabase.from('dashboard_setup').upsert(dashboardSetup),
      supabase.from('dashboard_metrics').insert(dashboardMetrics),
      tasksWithUserId.length > 0 ? supabase.from('tasks').insert(tasksWithUserId) : Promise.resolve({ error: null }),
      boardMembers.length > 0 ? supabase.from('board_members').insert(boardMembers) : Promise.resolve({ error: null })
    ]);

    // Check for errors
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      console.error('Migration errors:', errors);
      return { 
        success: false, 
        error: 'Some data failed to migrate', 
        data: { errors } 
      };
    }

    // 8. Update user profile to mark dashboard as configured
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        dashboard_configured: true,
        group_id: groupId,
        business_name: intake?.responses?.company_name,
        full_name: intake?.responses?.full_name
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    console.log('Migration completed successfully');
    return { 
      success: true, 
      data: { 
        dashboardSetup, 
        metricsCount: 1,
        tasksCount: tasksWithUserId.length,
        boardMembersCount: boardMembers.length
      } 
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Check if migration is needed
export async function checkMigrationStatus(userId: string): Promise<{
  needed: boolean;
  hasAssessmentData: boolean;
  hasDashboardSetup: boolean;
}> {
  try {
    // Check if user has a profile with group_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('group_id, dashboard_configured')
      .eq('user_id', userId)
      .single();

    if (!profile?.group_id) {
      return { needed: false, hasAssessmentData: false, hasDashboardSetup: false };
    }

    // Check if dashboard setup exists
    const { data: dashboardSetup } = await supabase
      .from('dashboard_setup')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Check if assessment data exists
    const { data: assessmentData } = await supabase
      .from('client_intake')
      .select('id')
      .eq('group_id', profile.group_id)
      .single();

    return {
      needed: !!assessmentData && !dashboardSetup,
      hasAssessmentData: !!assessmentData,
      hasDashboardSetup: !!dashboardSetup
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { needed: false, hasAssessmentData: false, hasDashboardSetup: false };
  }
} 