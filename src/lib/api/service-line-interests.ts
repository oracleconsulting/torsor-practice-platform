/**
 * Service Line Interest Rankings API
 * Manages team member preferences for BSG service lines
 */

import { supabase } from '@/lib/supabase/client';

export interface ServiceLineInterest {
  id: string;
  practice_member_id: string;
  service_line: string;
  interest_rank: number;
  notes?: string;
  current_experience_level: number;
  desired_involvement_pct: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceLineCoverage {
  member_id: string;
  member_name: string;
  role: string;
  service_line: string;
  interest_rank: number;
  current_experience_level: number;
  desired_involvement_pct: number;
  avg_skill_level_in_service_line: number;
  skills_count_in_service_line: number;
  match_score: number;
}

// BSG Service Lines - All 10 Active Services (Including Fractional Executive Services)
export const BSG_SERVICE_LINES = [
  'Automation',
  'Management Accounts',
  'Future Financial Information / Advisory Accelerator',
  'Benchmarking - External and Internal',
  '365 Alignment Programme',
  'Systems Audit',
  'Profit Extraction / Remuneration Strategies',
  'Fractional CFO Services',
  'Fractional COO Services',
  'Combined CFO/COO Advisory'
] as const;

export type BSGServiceLine = typeof BSG_SERVICE_LINES[number];

/**
 * Get service line interests for a team member
 */
export async function getServiceLineInterests(memberId: string): Promise<ServiceLineInterest[]> {
  try {
    const { data, error } = await supabase
      .from('service_line_interests')
      .select('*')
      .eq('practice_member_id', memberId)
      .order('interest_rank', { ascending: true });

    if (error) {
      console.error('[Service Line Interests] Error fetching interests:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('[Service Line Interests] Error fetching interests:', error);
    return [];
  }
}

/**
 * Save or update service line interests for a team member
 */
export async function saveServiceLineInterests(
  memberId: string,
  interests: Array<{
    service_line: string;
    interest_rank: number;
    notes?: string;
    current_experience_level?: number;
    desired_involvement_pct?: number;
  }>
): Promise<boolean> {
  try {
    // Delete existing interests for this member
    const { error: deleteError } = await supabase
      .from('service_line_interests')
      .delete()
      .eq('practice_member_id', memberId);

    if (deleteError && deleteError.code !== 'PGRST116') { // Ignore "no rows found"
      console.error('[Service Line Interests] Error deleting old interests:', deleteError);
    }

    // Insert new interests
    const interestsToInsert = interests.map(interest => ({
      practice_member_id: memberId,
      service_line: interest.service_line,
      interest_rank: interest.interest_rank,
      notes: interest.notes || null,
      current_experience_level: interest.current_experience_level || 0,
      desired_involvement_pct: interest.desired_involvement_pct || 0
    }));

    const { error } = await (supabase
      .from('service_line_interests') as any)
      .insert(interestsToInsert);

    if (error) {
      console.error('[Service Line Interests] Error saving interests:', error);
      return false;
    }

    console.log(`[Service Line Interests] Saved ${interests.length} interests for member ${memberId}`);
    return true;
  } catch (error) {
    console.error('[Service Line Interests] Error saving interests:', error);
    return false;
  }
}

/**
 * Get service line coverage analysis for strategic planning
 */
export async function getServiceLineCoverage(practiceId?: string): Promise<ServiceLineCoverage[]> {
  try {
    let query = supabase
      .from('service_line_coverage')
      .select('*');

    if (practiceId) {
      // Would need to join with practice_members if filtering by practice
      // For now, return all
    }

    const { data, error } = await query.order('match_score', { ascending: false });

    if (error) {
      console.error('[Service Line Coverage] Error fetching coverage:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('[Service Line Coverage] Error fetching coverage:', error);
    return [];
  }
}

/**
 * Get team members interested in a specific service line (for deployment planning)
 */
export async function getTeamForServiceLine(serviceLine: string): Promise<ServiceLineCoverage[]> {
  try {
    const { data, error } = await supabase
      .from('service_line_coverage')
      .select('*')
      .eq('service_line', serviceLine)
      .order('match_score', { ascending: false });

    if (error) {
      console.error('[Service Line Coverage] Error fetching team for service line:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('[Service Line Coverage] Error fetching team for service line:', error);
    return [];
  }
}

/**
 * Get service line interest summary for a practice
 */
export async function getServiceLineInterestSummary(practiceId: string): Promise<{
  serviceLine: string;
  interestedMembers: number;
  avgInterestRank: number;
  avgSkillLevel: number;
  avgExperienceLevel: number;
  totalDesiredInvolvement: number;
}[]> {
  try {
    const { data, error } = await supabase
      .from('service_line_coverage')
      .select('*');

    if (error) {
      console.error('[Service Line Summary] Error fetching summary:', error);
      return [];
    }

    const coverage = (data as any) || [];

    // Group by service line and calculate summaries
    const summaryMap = new Map<string, {
      serviceLine: string;
      interestedMembers: number;
      totalInterestRank: number;
      totalSkillLevel: number;
      totalExperienceLevel: number;
      totalDesiredInvolvement: number;
      count: number;
    }>();

    coverage.forEach((item: ServiceLineCoverage) => {
      if (!item.service_line) return;

      if (!summaryMap.has(item.service_line)) {
        summaryMap.set(item.service_line, {
          serviceLine: item.service_line,
          interestedMembers: 0,
          totalInterestRank: 0,
          totalSkillLevel: 0,
          totalExperienceLevel: 0,
          totalDesiredInvolvement: 0,
          count: 0
        });
      }

      const summary = summaryMap.get(item.service_line)!;
      summary.interestedMembers++;
      summary.totalInterestRank += item.interest_rank || 0;
      summary.totalSkillLevel += item.avg_skill_level_in_service_line || 0;
      summary.totalExperienceLevel += item.current_experience_level || 0;
      summary.totalDesiredInvolvement += item.desired_involvement_pct || 0;
      summary.count++;
    });

    return Array.from(summaryMap.values()).map(summary => ({
      serviceLine: summary.serviceLine,
      interestedMembers: summary.interestedMembers,
      avgInterestRank: summary.count > 0 ? summary.totalInterestRank / summary.count : 0,
      avgSkillLevel: summary.count > 0 ? summary.totalSkillLevel / summary.count : 0,
      avgExperienceLevel: summary.count > 0 ? summary.totalExperienceLevel / summary.count : 0,
      totalDesiredInvolvement: summary.totalDesiredInvolvement
    }));
  } catch (error) {
    console.error('[Service Line Summary] Error fetching summary:', error);
    return [];
  }
}

