import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Commitment {
  id: string;
  commitment_type: string;
  description: string;
  amount: number;
  frequency: string | null;
  next_due_date: string | null;
  end_date: string | null;
  include_in_forecast: boolean;
  confidence: string;
}

interface WeeklyForecast {
  week_ending: string;
  opening_balance: number;
  expected_receipts: number;
  expected_payments: number;
  closing_balance: number;
  confidence: 'high' | 'medium' | 'low';
  key_events: string[];
}

interface CriticalDate {
  date: string;
  event: string;
  impact: number;
  resulting_balance: number;
  action_needed: string;
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isWithinWeek(targetDate: string, weekEnding: Date): boolean {
  const target = new Date(targetDate);
  const weekStart = new Date(weekEnding);
  weekStart.setDate(weekStart.getDate() - 6);
  return target >= weekStart && target <= weekEnding;
}

function getMonthFromDate(date: Date): number {
  return date.getMonth() + 1;
}

async function generateForecast(
  supabaseClient: any,
  engagementId: string,
  currentPeriod: any,
  commitments: Commitment[],
  historicalData: any[]
): Promise<{
  weeks: WeeklyForecast[];
  lowestPointAmount: number;
  lowestPointWeek: string;
  cashRunwayWeeks: number;
  avgWeeklyBurn: number;
  criticalDates: CriticalDate[];
  assumptions: any;
}> {
  const openingCash = parseFloat(currentPeriod.bank_balance?.toString() || '0');
  const openingTrueCash = parseFloat(currentPeriod.true_cash?.toString() || '0');
  const currentDebtors = parseFloat(currentPeriod.debtors_total?.toString() || '0');
  const debtorDays = parseFloat(currentPeriod.debtors_days?.toString() || '50');
  
  // Calculate averages from historical data
  const avgMonthlyRevenue = historicalData.length > 0
    ? historicalData.reduce((sum, p) => sum + parseFloat(p.revenue?.toString() || '0'), 0) / historicalData.length
    : parseFloat(currentPeriod.revenue?.toString() || '0');
  
  const avgMonthlyExpenses = historicalData.length > 0
    ? historicalData.reduce((sum, p) => sum + parseFloat(p.overheads?.toString() || '0'), 0) / historicalData.length
    : parseFloat(currentPeriod.overheads?.toString() || '0');
  
  // Calculate revenue volatility
  const revenueValues = historicalData.map(p => parseFloat(p.revenue?.toString() || '0'));
  const revenueMean = revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length;
  const revenueVariance = revenueValues.reduce((acc, val) => acc + Math.pow(val - revenueMean, 2), 0) / revenueValues.length;
  const revenueStdDev = Math.sqrt(revenueVariance);
  const revenueCoeffOfVariation = revenueMean > 0 ? (revenueStdDev / revenueMean) * 100 : 0;
  
  let revenueVolatility: 'low' | 'medium' | 'high';
  if (revenueCoeffOfVariation < 10) revenueVolatility = 'low';
  else if (revenueCoeffOfVariation < 25) revenueVolatility = 'medium';
  else revenueVolatility = 'high';
  
  // Seasonal factors (simplified - in production, calculate from historical data)
  const seasonalFactors: Record<number, number> = {
    1: 0.92, 2: 0.95, 3: 1.0, 4: 1.05,
    5: 1.08, 6: 1.05, 7: 0.98, 8: 0.95,
    9: 1.0, 10: 1.02, 11: 1.05, 12: 1.15
  };
  
  const weeks: WeeklyForecast[] = [];
  let runningCash = openingCash;
  const criticalDates: CriticalDate[] = [];
  
  for (let week = 1; week <= 13; week++) {
    const weekEnding = addWeeks(new Date(), week);
    const month = getMonthFromDate(weekEnding);
    
    // Expected receipts
    const seasonalFactor = seasonalFactors[month] || 1.0;
    const weeklyRevenue = (avgMonthlyRevenue * seasonalFactor) / 4.33;
    
    // Adjust for collection timing based on debtor days
    const collectionLag = Math.floor(debtorDays / 7); // weeks
    let expectedReceipts: number;
    if (week > collectionLag) {
      expectedReceipts = weeklyRevenue * 0.9; // 90% collection rate
    } else {
      expectedReceipts = weeklyRevenue * 0.5; // Slower collection in early weeks
    }
    
    // Expected payments
    const weeklyExpenses = avgMonthlyExpenses / 4.33;
    
    // Add known commitments falling this week
    const weekCommitments = commitments
      .filter(c => c.include_in_forecast && c.next_due_date && isWithinWeek(c.next_due_date, weekEnding))
      .reduce((sum, c) => sum + parseFloat(c.amount?.toString() || '0'), 0);
    
    const expectedPayments = weeklyExpenses + weekCommitments;
    
    // Calculate closing balance
    const closingCash = runningCash + expectedReceipts - expectedPayments;
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low';
    if (week <= 4 && revenueVolatility === 'low') {
      confidence = 'high';
    } else if (week <= 8) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    // Flag key events
    const keyEvents: string[] = [];
    commitments
      .filter(c => c.include_in_forecast && c.next_due_date && isWithinWeek(c.next_due_date, weekEnding))
      .forEach(c => {
        keyEvents.push(`${c.description}: £${parseFloat(c.amount?.toString() || '0').toLocaleString()}`);
      });
    
    // Check for critical dates (large negative impact)
    if (expectedPayments > expectedReceipts * 1.5 && closingCash < openingTrueCash * 0.5) {
      criticalDates.push({
        date: formatDate(weekEnding),
        event: keyEvents.join(', ') || 'Large payment week',
        impact: expectedPayments - expectedReceipts,
        resulting_balance: closingCash,
        action_needed: `Accelerate at least £${Math.round((expectedPayments - expectedReceipts) * 1.2).toLocaleString()} of debtor collection before this date`
      });
    }
    
    weeks.push({
      week_ending: formatDate(weekEnding),
      opening_balance: runningCash,
      expected_receipts: expectedReceipts,
      expected_payments: expectedPayments,
      closing_balance: closingCash,
      confidence,
      key_events: keyEvents
    });
    
    runningCash = closingCash;
  }
  
  // Calculate summary metrics
  const lowestPoint = weeks.reduce((min, w) => 
    w.closing_balance < min.closing_balance ? w : min
  );
  
  const avgWeeklyBurn = (avgMonthlyExpenses / 4.33) - (avgMonthlyRevenue / 4.33);
  const cashRunway = avgWeeklyBurn < 0 
    ? Math.floor(openingTrueCash / Math.abs(avgWeeklyBurn))
    : 999; // Cash positive
  
  // Assumptions
  const assumptions = {
    revenue_assumption: `Based on ${historicalData.length}-month average of £${Math.round(avgMonthlyRevenue).toLocaleString()}/month, adjusted for seasonality`,
    collection_assumption: `${Math.round(debtorDays)} days based on current debtor days`,
    known_commitments_included: commitments.filter(c => c.include_in_forecast).length,
    seasonality_applied: true,
    model_confidence: revenueVolatility === 'low' ? 'high' : revenueVolatility === 'medium' ? 'medium' : 'low'
  };
  
  return {
    weeks,
    lowestPointAmount: lowestPoint.closing_balance,
    lowestPointWeek: lowestPoint.week_ending,
    cashRunwayWeeks: cashRunway,
    avgWeeklyBurn,
    criticalDates,
    assumptions
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId, periodId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[MA Forecast] Generating forecast for engagement:', engagementId);
    
    // Fetch current period data
    const { data: period, error: periodError } = await supabaseClient
      .from('ma_periods')
      .select('*, ma_extracted_financials(*)')
      .eq('id', periodId)
      .single();
    
    if (periodError || !period) {
      throw new Error(`Failed to fetch period: ${periodError?.message || 'Not found'}`);
    }
    
    const extractedFinancials = period.ma_extracted_financials;
    if (!extractedFinancials) {
      throw new Error('No extracted financials found for this period');
    }
    
    // Fetch known commitments
    const { data: commitments, error: commitmentsError } = await supabaseClient
      .from('ma_known_commitments')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('include_in_forecast', true)
      .order('next_due_date', { ascending: true });
    
    if (commitmentsError) {
      console.warn('[MA Forecast] Error fetching commitments:', commitmentsError);
    }
    
    // Fetch historical data (last 6 periods for averages)
    const { data: historicalPeriods, error: historicalError } = await supabaseClient
      .from('ma_trend_data')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('period_end', { ascending: false })
      .limit(6);
    
    if (historicalError) {
      console.warn('[MA Forecast] Error fetching historical data:', historicalError);
    }
    
    // Generate forecast
    const forecast = await generateForecast(
      supabaseClient,
      engagementId,
      extractedFinancials,
      commitments || [],
      historicalPeriods || []
    );
    
    // Generate narrative (simplified - in production, use LLM)
    let narrative = '';
    let overallSentiment: 'comfortable' | 'tight' | 'concerning' | 'critical' = 'comfortable';
    
    if (forecast.cashRunwayWeeks < 8) {
      overallSentiment = 'critical';
      narrative = `Cash runway is ${forecast.cashRunwayWeeks} weeks. Immediate action required.`;
    } else if (forecast.cashRunwayWeeks < 13) {
      overallSentiment = 'concerning';
      narrative = `Cash runway is ${forecast.cashRunwayWeeks} weeks. The squeeze point is w/c ${forecast.lowestPointWeek} when cash will dip to £${Math.round(forecast.lowestPointAmount).toLocaleString()}.`;
    } else if (forecast.lowestPointAmount < openingTrueCash * 0.6) {
      overallSentiment = 'tight';
      narrative = `Cash runway is ${forecast.cashRunwayWeeks} weeks. The squeeze point is w/c ${forecast.lowestPointWeek} when cash will dip to £${Math.round(forecast.lowestPointAmount).toLocaleString()}.`;
    } else {
      overallSentiment = 'comfortable';
      narrative = `Cash position looks comfortable with ${forecast.cashRunwayWeeks} weeks runway.`;
    }
    
    // Save forecast to database
    const { data: savedForecast, error: saveError } = await supabaseClient
      .from('ma_cash_forecasts')
      .upsert({
        engagement_id: engagementId,
        period_id: periodId,
        opening_cash: parseFloat(extractedFinancials.bank_balance?.toString() || '0'),
        opening_true_cash: parseFloat(extractedFinancials.true_cash?.toString() || '0'),
        weekly_forecast: forecast.weeks,
        lowest_point_amount: forecast.lowestPointAmount,
        lowest_point_week: forecast.lowestPointWeek,
        cash_runway_weeks: forecast.cashRunwayWeeks,
        avg_weekly_burn: forecast.avgWeeklyBurn,
        critical_dates: forecast.criticalDates,
        assumptions: forecast.assumptions,
        narrative,
        overall_sentiment: overallSentiment
      }, { onConflict: 'engagement_id,period_id' })
      .select()
      .single();
    
    if (saveError) {
      console.error('[MA Forecast] Error saving forecast:', saveError);
      throw saveError;
    }
    
    // Update period with forecast reference
    await supabaseClient
      .from('ma_periods')
      .update({ forecast_id: savedForecast.id })
      .eq('id', periodId);
    
    return new Response(
      JSON.stringify({
        success: true,
        forecastId: savedForecast.id,
        weeks: forecast.weeks.length,
        lowestPoint: {
          amount: forecast.lowestPointAmount,
          week: forecast.lowestPointWeek
        },
        cashRunwayWeeks: forecast.cashRunwayWeeks,
        criticalDates: forecast.criticalDates.length,
        sentiment: overallSentiment
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[MA Forecast] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


