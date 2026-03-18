// ============================================================================
// usePrePopulateFromBM — Pre-populate GA assessment from completed BM responses
// ============================================================================
// When a client has completed Benchmarking, pull overlapping fields into GA
// Part 1/Part 2 so they can confirm/edit instead of re-entering.
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface BMPrePopData {
  company_name?: string;
  industry?: string;
  industry_niche?: string;
  annual_turnover?: string;
  team_size?: string;
  years_trading?: string;
  region?: string;
  // Context enrichment (for roadmap generation, not shown in form)
  bm_self_rating?: string;
  bm_tracked_metrics?: string[];
  bm_suspected_underperformance?: string;
  bm_money_on_table?: string;
  bm_action_readiness?: string;
  bm_blind_spot_fear?: string;
  bm_investment_areas?: string[];
  bm_cash_held?: string;
  bm_owns_property?: string;
}

function mapBMRevenueToGAFormat(revenue: number | undefined): string | undefined {
  if (revenue == null) return undefined;
  if (revenue < 100000) return 'Under £100k';
  if (revenue < 250000) return '£100k-£250k';
  if (revenue < 500000) return '£250k-£500k';
  if (revenue < 1000000) return '£500k-£1m';
  if (revenue < 2000000) return '£1m-£2m';
  if (revenue < 5000000) return '£2m-£5m';
  return '£5m+';
}

function mapBMEmployeesToGAFormat(employees: number | undefined): string | undefined {
  if (employees == null) return undefined;
  if (employees <= 1) return 'Just me';
  if (employees <= 5) return '2-5';
  if (employees <= 10) return '6-10';
  if (employees <= 25) return '11-25';
  if (employees <= 50) return '26-50';
  return '50+';
}

export function usePrePopulateFromBM() {
  const { clientSession } = useAuth();
  const [bmData, setBmData] = useState<BMPrePopData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBMData() {
      if (!clientSession?.clientId) {
        setLoading(false);
        return;
      }

      try {
        const { data: bmEngagement } = await supabase
          .from('bm_engagements')
          .select('id, assessment_completed_at')
          .eq('client_id', clientSession.clientId)
          .not('assessment_completed_at', 'is', null)
          .order('assessment_completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!bmEngagement?.assessment_completed_at) {
          setLoading(false);
          return;
        }

        const { data: bmResponses } = await supabase
          .from('bm_assessment_responses')
          .select('responses')
          .eq('engagement_id', bmEngagement.id)
          .maybeSingle();

        if (!bmResponses?.responses) {
          setLoading(false);
          return;
        }

        const r = bmResponses.responses as Record<string, unknown>;

        const mapped: BMPrePopData = {
          company_name: (r.bm_business_description as string) || undefined,
          industry: (r.bm_industry as string) || undefined,
          industry_niche: (r.bm_niche as string) || undefined,
          annual_turnover: mapBMRevenueToGAFormat(r.bm_revenue as number | undefined),
          team_size: mapBMEmployeesToGAFormat(r.bm_employees as number | undefined),
          years_trading: (r.bm_years_trading as string) || undefined,
          region: (r.bm_region as string) || undefined,

          bm_self_rating: (r.bm_self_rating as string) || undefined,
          bm_tracked_metrics: Array.isArray(r.bm_tracked_metrics) ? (r.bm_tracked_metrics as string[]) : undefined,
          bm_suspected_underperformance: (r.bm_suspected_underperformance as string) || undefined,
          bm_money_on_table: (r.bm_money_on_table as string) || undefined,
          bm_action_readiness: (r.bm_action_readiness as string) || undefined,
          bm_blind_spot_fear: (r.bm_blind_spot_fear as string) || undefined,
          bm_investment_areas: Array.isArray(r.bm_investment_areas) ? (r.bm_investment_areas as string[]) : undefined,
          bm_cash_held: (r.bm_cash_held as string) || undefined,
          bm_owns_property: (r.bm_owns_property as string) || undefined,
        };

        setBmData(mapped);
      } catch (err) {
        console.error('Error fetching BM pre-population data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBMData();
  }, [clientSession?.clientId]);

  return { bmData, loading };
}
