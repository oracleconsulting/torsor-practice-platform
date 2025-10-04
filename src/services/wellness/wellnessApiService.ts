import { supabase } from '@/lib/supabase/client';
import type { 
  WorkloadMetrics, 
  PulseSurvey, 
  StaffWellbeing,
  TeamWellnessSummary 
} from '@/types/wellness';

export class WellnessApiService {
  private static instance: WellnessApiService;
  
  private constructor() {}
  
  public static getInstance(): WellnessApiService {
    if (!WellnessApiService.instance) {
      WellnessApiService.instance = new WellnessApiService();
    }
    return WellnessApiService.instance;
  }

  async getTeamWellnessSummary(teamId: string): Promise<TeamWellnessSummary> {
    const { data, error } = await supabase
      .from('team_wellness_summary')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error) throw error;
    return data;
  }

  async getStaffWellbeing(staffId: string): Promise<StaffWellbeing> {
    const { data, error } = await supabase
      .from('staff_wellbeing')
      .select('*')
      .eq('staff_id', staffId)
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkloadMetrics(staffId: string, period: { start: Date; end: Date }): Promise<WorkloadMetrics> {
    const { data, error } = await supabase
      .from('workload_metrics')
      .select('*')
      .eq('staff_id', staffId)
      .gte('period.start', period.start.toISOString())
      .lte('period.end', period.end.toISOString())
      .single();

    if (error) throw error;
    return data;
  }

  async submitPulseSurvey(survey: Omit<PulseSurvey, 'id'>): Promise<PulseSurvey> {
    const { data, error } = await supabase
      .from('pulse_surveys')
      .insert(survey)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPulseHistory(staffId: string, limit: number = 10): Promise<PulseSurvey[]> {
    const { data, error } = await supabase
      .from('pulse_surveys')
      .select('*')
      .eq('staff_id', staffId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async updateStaffWellbeing(staffId: string, updates: Partial<StaffWellbeing>): Promise<StaffWellbeing> {
    const { data, error } = await supabase
      .from('staff_wellbeing')
      .update(updates)
      .eq('staff_id', staffId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTeamAlerts(teamId: string): Promise<StaffWellbeing['alerts']> {
    const { data, error } = await supabase
      .from('staff_wellbeing')
      .select('alerts')
      .eq('team_id', teamId)
      .order('status.current', { ascending: false });

    if (error) throw error;
    return data.flatMap(staff => staff.alerts);
  }
} 