import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendDataPoint {
  period_end: string;
  revenue: number;
  gross_margin_pct: number;
  operating_margin_pct: number;
  net_margin_pct: number;
  true_cash: number;
  debtor_days: number;
  revenue_per_head: number;
  staff_cost_pct: number;
}

interface TrendAnalysis {
  direction: 'growing' | 'stable' | 'declining' | 'improving' | 'eroding' | 'building' | 'depleting' | 'worsening';
  avgChange: number;
  volatility?: 'low' | 'medium' | 'high';
  narrative: string;
}

function calculateTrendDirection(
  dataPoints: { date: string; value: number }[],
  type: 'revenue' | 'margin' | 'cash' | 'debtor' | 'efficiency'
): TrendAnalysis {
  if (dataPoints.length < 3) {
    return {
      direction: 'stable',
      avgChange: 0,
      narrative: 'Insufficient data for trend analysis (need at least 3 periods)'
    };
  }

  const n = dataPoints.length;
  const recent = dataPoints.slice(-6); // Focus on last 6 periods
  
  // Calculate average period-over-period change
  let totalChange = 0;
  let changeCount = 0;
  
  for (let i = 1; i < recent.length; i++) {
    if (recent[i-1].value > 0) {
      const change = ((recent[i].value - recent[i-1].value) / recent[i-1].value) * 100;
      totalChange += change;
      changeCount++;
    }
  }
  
  const avgChange = changeCount > 0 ? totalChange / changeCount : 0;
  
  // Determine direction based on type
  let direction: TrendAnalysis['direction'];
  if (type === 'revenue') {
    if (avgChange > 2) direction = 'growing';
    else if (avgChange < -2) direction = 'declining';
    else direction = 'stable';
  } else if (type === 'margin') {
    if (avgChange > 0.5) direction = 'improving';
    else if (avgChange < -0.5) direction = 'eroding';
    else direction = 'stable';
  } else if (type === 'cash') {
    if (avgChange > 5) direction = 'building';
    else if (avgChange < -5) direction = 'depleting';
    else direction = 'stable';
  } else if (type === 'debtor') {
    // For debtor days, lower is better
    if (avgChange < -1) direction = 'improving';
    else if (avgChange > 1) direction = 'worsening';
    else direction = 'stable';
  } else {
    // efficiency metrics
    if (avgChange > 2) direction = 'improving';
    else if (avgChange < -2) direction = 'declining';
    else direction = 'stable';
  }
  
  // Calculate volatility
  const values = recent.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const coeffOfVariation = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
  
  let volatility: 'low' | 'medium' | 'high';
  if (coeffOfVariation < 10) volatility = 'low';
  else if (coeffOfVariation < 25) volatility = 'medium';
  else volatility = 'high';
  
  return { direction, avgChange, volatility, narrative: '' };
}

function detectSeasonality(dataPoints: { month: number; value: number }[]): {
  detected: boolean;
  pattern: string | null;
  peakMonths: number[];
  troughMonths: number[];
  peakTroughDelta: number;
  confidence: 'low' | 'medium' | 'high';
} {
  if (dataPoints.length < 12) {
    return {
      detected: false,
      pattern: null,
      peakMonths: [],
      troughMonths: [],
      peakTroughDelta: 0,
      confidence: 'low'
    };
  }
  
  // Group by month
  const monthlyAverages: Record<number, number[]> = {};
  dataPoints.forEach(dp => {
    if (!monthlyAverages[dp.month]) monthlyAverages[dp.month] = [];
    monthlyAverages[dp.month].push(dp.value);
  });
  
  const monthlyMeans: Record<number, number> = {};
  Object.keys(monthlyAverages).forEach(month => {
    const m = parseInt(month);
    monthlyMeans[m] = monthlyAverages[m].reduce((a, b) => a + b, 0) / monthlyAverages[m].length;
  });
  
  const overallMean = Object.values(monthlyMeans).reduce((a, b) => a + b, 0) / 12;
  
  // Find peak and trough months
  const sorted = Object.entries(monthlyMeans)
    .map(([month, value]) => ({ month: parseInt(month), value }))
    .sort((a, b) => b.value - a.value);
  
  const peakMonths = sorted.slice(0, 3).map(s => s.month);
  const troughMonths = sorted.slice(-3).map(s => s.month);
  const peakTroughDelta = ((sorted[0].value - sorted[sorted.length - 1].value) / overallMean) * 100;
  
  // Determine confidence
  let confidence: 'low' | 'medium' | 'high';
  if (dataPoints.length >= 24) confidence = 'high';
  else if (dataPoints.length >= 18) confidence = 'medium';
  else confidence = 'low';
  
  // Determine pattern
  let pattern: string | null = null;
  if (peakTroughDelta > 20) {
    if (peakMonths.includes(11) || peakMonths.includes(12) || peakMonths.includes(1)) {
      pattern = 'Q4 spike';
    } else if (peakMonths.includes(3) || peakMonths.includes(4) || peakMonths.includes(5)) {
      pattern = 'Q2 peak';
    } else {
      pattern = 'Seasonal variation';
    }
  }
  
  return {
    detected: peakTroughDelta > 15,
    pattern,
    peakMonths,
    troughMonths,
    peakTroughDelta,
    confidence
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
    
    console.log('[MA Trends] Calculating trends for engagement:', engagementId);
    
    // Fetch all historical trend data for this engagement
    const { data: periods, error: periodsError } = await supabaseClient
      .from('ma_trend_data')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('period_end', { ascending: true });
    
    if (periodsError) {
      throw new Error(`Failed to fetch trend data: ${periodsError.message}`);
    }
    
    if (!periods || periods.length < 3) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Need at least 3 periods for meaningful trend analysis',
          available: false,
          periodCount: periods?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate revenue trend
    const revenueTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.revenue?.toString() || '0') })),
      'revenue'
    );
    
    // Calculate margin trends
    const grossMarginTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.gross_margin_pct?.toString() || '0') })),
      'margin'
    );
    
    const operatingMarginTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.operating_margin_pct?.toString() || '0') })),
      'margin'
    );
    
    // Calculate cash trend
    const cashTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.true_cash?.toString() || '0') })),
      'cash'
    );
    
    // Calculate debtor days trend
    const debtorTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.debtor_days?.toString() || '0') })),
      'debtor'
    );
    
    // Calculate efficiency trends
    const revenuePerHeadTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.revenue_per_head?.toString() || '0') })),
      'efficiency'
    );
    
    const staffCostTrend = calculateTrendDirection(
      periods.map(p => ({ date: p.period_end, value: parseFloat(p.staff_cost_pct?.toString() || '0') })),
      'efficiency'
    );
    
    // Detect seasonality (needs 12+ months)
    const seasonality = periods.length >= 12
      ? detectSeasonality(periods.map(p => {
          const date = new Date(p.period_end);
          return {
            month: date.getMonth() + 1,
            value: parseFloat(p.revenue?.toString() || '0')
          };
        }))
      : null;
    
    // Update the current period's trend data
    if (periodId) {
      const currentPeriod = periods[periods.length - 1];
      
      const { error: updateError } = await supabaseClient
        .from('ma_trend_data')
        .update({
          revenue_trend: revenueTrend.direction,
          revenue_trend_pct: revenueTrend.avgChange,
          margin_trend: grossMarginTrend.direction,
          margin_trend_pp: grossMarginTrend.avgChange,
          debtor_days_trend: debtorTrend.direction
        })
        .eq('id', currentPeriod.id);
      
      if (updateError) {
        console.error('[MA Trends] Error updating trend data:', updateError);
      }
    }
    
    // Generate narratives (simplified - in production, use LLM)
    revenueTrend.narrative = generateRevenueNarrative(revenueTrend, periods);
    grossMarginTrend.narrative = generateMarginNarrative(grossMarginTrend, periods);
    cashTrend.narrative = generateCashNarrative(cashTrend, periods);
    debtorTrend.narrative = generateDebtorNarrative(debtorTrend, periods);
    
    return new Response(
      JSON.stringify({
        success: true,
        periodCount: periods.length,
        trends: {
          revenue: revenueTrend,
          grossMargin: grossMarginTrend,
          operatingMargin: operatingMarginTrend,
          cash: cashTrend,
          debtorDays: debtorTrend,
          revenuePerHead: revenuePerHeadTrend,
          staffCostRatio: staffCostTrend
        },
        seasonality
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[MA Trends] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateRevenueNarrative(trend: TrendAnalysis, periods: any[]): string {
  const latest = periods[periods.length - 1];
  const revenue = parseFloat(latest.revenue?.toString() || '0');
  
  if (trend.direction === 'growing') {
    const monthsToTarget = trend.avgChange > 0 
      ? Math.ceil(Math.log(400000 / revenue) / Math.log(1 + trend.avgChange / 100))
      : 0;
    return `Revenue growing consistently at ${trend.avgChange.toFixed(1)}% month-on-month. At this rate, you'll hit £400k/month within ${monthsToTarget} months.`;
  } else if (trend.direction === 'declining') {
    return `Revenue declining at ${Math.abs(trend.avgChange).toFixed(1)}% per month. This needs attention.`;
  } else {
    return `Revenue holding steady—no significant growth or decline.`;
  }
}

function generateMarginNarrative(trend: TrendAnalysis, periods: any[]): string {
  if (trend.direction === 'improving') {
    return `Margin improving steadily—your cost discipline is working.`;
  } else if (trend.direction === 'eroding') {
    return `Margin eroding at ${Math.abs(trend.avgChange).toFixed(1)} percentage points per month. Address cost structure or pricing.`;
  } else {
    return `Margin holding steady as you scale—unusual and impressive.`;
  }
}

function generateCashNarrative(trend: TrendAnalysis, periods: any[]): string {
  const latest = periods[periods.length - 1];
  const cash = parseFloat(latest.true_cash?.toString() || '0');
  const avgBurn = parseFloat(latest.avg_weekly_burn?.toString() || '0') * 4.33;
  
  if (trend.direction === 'building') {
    return `Cash position building—you're in a strong position.`;
  } else if (trend.direction === 'depleting') {
    const runway = avgBurn < 0 ? Math.floor(cash / Math.abs(avgBurn)) : 0;
    return `Cash depleting. At current burn, runway is ${runway} months.`;
  } else {
    return `Cash position stable.`;
  }
}

function generateDebtorNarrative(trend: TrendAnalysis, periods: any[]): string {
  const latest = periods[periods.length - 1];
  const debtorDays = parseFloat(latest.debtor_days?.toString() || '0');
  const debtors = parseFloat(latest.debtors?.toString() || '0');
  
  if (trend.direction === 'worsening') {
    const improvement = debtorDays - 30;
    const cashRelease = debtors * (improvement / debtorDays);
    return `Debtor days have crept from ${(debtorDays - (trend.avgChange * periods.length)).toFixed(0)} to ${debtorDays.toFixed(0)} over the last ${periods.length} months. At this rate, you'll hit ${(debtorDays + (trend.avgChange * 6)).toFixed(0)} days by next quarter—that's £${Math.round(cashRelease).toLocaleString()} more tied up. Address now.`;
  } else if (trend.direction === 'improving') {
    return `Debtor days improving—collection is getting better.`;
  } else {
    return `Debtor days stable.`;
  }
}


