/**
 * Send Scheduled Report Edge Function
 * Sends scheduled BI reports via email
 * 
 * Can be triggered:
 * 1. By cron job for scheduled deliveries
 * 2. Manually for immediate send
 * 3. On period completion
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledReport {
  id: string;
  engagement_id: string;
  schedule_name: string;
  schedule_type: string;
  report_types: string[];
  include_pdf: boolean;
  include_dashboard_link: boolean;
  delivery_method: string;
  recipients: { type: string; address: string; name?: string }[];
  is_active: boolean;
  next_scheduled_at: string | null;
}

interface SendRequest {
  schedule_id?: string;      // Send specific schedule
  engagement_id?: string;    // Send all schedules for engagement
  period_id?: string;        // Period to report on
  trigger?: 'cron' | 'manual' | 'period_completion';
}

interface Engagement {
  id: string;
  client: { name: string; id: string } | null;
  tier: string;
}

interface Period {
  id: string;
  period_label: string;
  period_end_date: string;
  status: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://app.torsor.io';

const EMAIL_FROM = 'reports@torsor.io';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function getRAGEmoji(status: string): string {
  switch (status?.toLowerCase()) {
    case 'green': return '🟢';
    case 'amber': return '🟡';
    case 'red': return '🔴';
    default: return '⚪';
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function generateSummaryEmail(
  engagement: Engagement,
  period: Period,
  financialData: any,
  insights: any[],
  kpis: any[],
  dashboardUrl: string
): { subject: string; html: string } {
  const clientName = engagement.client?.name || 'Client';
  
  const subject = `📊 ${clientName} - BI Report: ${period.period_label}`;
  
  // Top KPIs section
  const topKpis = kpis.slice(0, 5).map(kpi => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${kpi.kpi_code?.replace(/_/g, ' ')}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${kpi.value?.toLocaleString() || '—'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${getRAGEmoji(kpi.rag_status)}</td>
    </tr>
  `).join('');
  
  // Top insights
  const topInsights = insights.slice(0, 3).map(insight => `
    <li style="margin-bottom: 12px; padding-left: 8px; border-left: 3px solid ${
      insight.priority === 'high' ? '#ef4444' : insight.priority === 'medium' ? '#f59e0b' : '#3b82f6'
    };">
      <strong>${insight.title}</strong><br/>
      <span style="color: #64748b; font-size: 14px;">${insight.summary || ''}</span>
    </li>
  `).join('');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Business Intelligence Report</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${clientName} • ${period.period_label}</p>
  </div>
  
  <!-- True Cash Highlight -->
  <div style="background: #f8fafc; padding: 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
    <div style="text-align: center;">
      <p style="color: #64748b; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">True Cash Position</p>
      <p style="font-size: 36px; font-weight: 700; color: ${(financialData?.true_cash || 0) >= 0 ? '#059669' : '#dc2626'}; margin: 8px 0;">
        ${formatCurrency(financialData?.true_cash || 0)}
      </p>
      ${financialData?.true_cash_runway_months ? `
        <p style="color: #64748b; margin: 0;">
          ${financialData.true_cash_runway_months.toFixed(1)} months runway
        </p>
      ` : ''}
    </div>
  </div>
  
  <!-- Key Metrics -->
  <div style="padding: 24px; background: white; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
    <h2 style="font-size: 18px; margin: 0 0 16px 0; color: #1e293b;">Key Metrics</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Metric</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b;">Value</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #64748b;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${topKpis || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8;">No KPIs available</td></tr>'}
      </tbody>
    </table>
  </div>
  
  <!-- Insights -->
  ${insights.length > 0 ? `
  <div style="padding: 24px; background: #fefce8; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
    <h2 style="font-size: 18px; margin: 0 0 16px 0; color: #1e293b;">💡 Key Insights</h2>
    <ul style="margin: 0; padding: 0; list-style: none;">
      ${topInsights}
    </ul>
  </div>
  ` : ''}
  
  <!-- CTA -->
  <div style="padding: 24px; background: white; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px; text-align: center;">
    <a href="${dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      View Full Dashboard →
    </a>
    <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0 0;">
      This is an automated report from Torsor BI
    </p>
  </div>
  
</body>
</html>
  `;
  
  return { subject, html };
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: string }[]
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('[send-scheduled-report] No RESEND_API_KEY, simulating send to:', to);
    return { success: true };
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
        attachments
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }
    
    return { success: true };
  } catch (err) {
    console.error('[send-scheduled-report] Email error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const body: SendRequest = await req.json();
    const { schedule_id, engagement_id, period_id, trigger = 'manual' } = body;
    
    console.log('[send-scheduled-report] Request:', { schedule_id, engagement_id, period_id, trigger });
    
    // Get schedules to process
    let schedulesQuery = supabase
      .from('bi_report_schedules')
      .select('*')
      .eq('is_active', true);
    
    if (schedule_id) {
      schedulesQuery = schedulesQuery.eq('id', schedule_id);
    } else if (engagement_id) {
      schedulesQuery = schedulesQuery.eq('engagement_id', engagement_id);
    } else if (trigger === 'cron') {
      // Get schedules that are due
      schedulesQuery = schedulesQuery.lte('next_scheduled_at', new Date().toISOString());
    }
    
    const { data: schedules, error: schedulesError } = await schedulesQuery;
    
    if (schedulesError) throw schedulesError;
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No schedules to process' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[send-scheduled-report] Processing ${schedules.length} schedules`);
    
    const results = [];
    
    for (const schedule of schedules as ScheduledReport[]) {
      try {
        // Get engagement
        const { data: engagement } = await supabase
          .from('bi_engagements')
          .select('id, tier, client:clients(id, name)')
          .eq('id', schedule.engagement_id)
          .single();
        
        if (!engagement) {
          results.push({ schedule_id: schedule.id, error: 'Engagement not found' });
          continue;
        }
        
        // Get latest period (or specified period)
        let periodQuery = supabase
          .from('bi_periods')
          .select('*')
          .eq('engagement_id', schedule.engagement_id)
          .order('period_end_date', { ascending: false })
          .limit(1);
        
        if (period_id) {
          periodQuery = supabase
            .from('bi_periods')
            .select('*')
            .eq('id', period_id)
            .single();
        }
        
        const { data: periodData } = await periodQuery;
        const period = Array.isArray(periodData) ? periodData[0] : periodData;
        
        if (!period) {
          results.push({ schedule_id: schedule.id, error: 'No period found' });
          continue;
        }
        
        // Get financial data
        const { data: financialData } = await supabase
          .from('bi_financial_data')
          .select('*')
          .eq('period_id', period.id)
          .single();
        
        // Get insights
        const { data: insights } = await supabase
          .from('bi_insights')
          .select('*')
          .eq('period_id', period.id)
          .eq('status', 'approved')
          .order('priority', { ascending: false })
          .limit(5);
        
        // Get KPIs
        const { data: kpis } = await supabase
          .from('bi_kpi_values')
          .select('*')
          .eq('period_id', period.id)
          .limit(10);
        
        // Generate dashboard URL
        const dashboardUrl = `${APP_URL}/bi/engagements/${engagement.id}/periods/${period.id}`;
        
        // Generate email content
        const { subject, html } = generateSummaryEmail(
          engagement as unknown as Engagement,
          period as Period,
          financialData,
          insights || [],
          kpis || [],
          dashboardUrl
        );
        
        // Send to each recipient
        const deliveryResults = [];
        for (const recipient of schedule.recipients) {
          const result = await sendEmail(recipient.address, subject, html);
          deliveryResults.push({
            recipient: recipient.address,
            status: result.success ? 'delivered' : 'failed',
            error: result.error
          });
        }
        
        // Record history
        await supabase
          .from('bi_scheduled_report_history')
          .insert({
            schedule_id: schedule.id,
            period_id: period.id,
            recipients_count: schedule.recipients.length,
            delivery_status: deliveryResults.every(r => r.status === 'delivered') 
              ? 'sent' 
              : deliveryResults.some(r => r.status === 'delivered') 
                ? 'partial' 
                : 'failed',
            report_types: schedule.report_types,
            delivery_results: deliveryResults
          });
        
        // Update schedule
        await supabase
          .from('bi_report_schedules')
          .update({
            last_sent_at: new Date().toISOString(),
            send_count: (schedule as any).send_count + 1
          })
          .eq('id', schedule.id);
        
        results.push({
          schedule_id: schedule.id,
          success: true,
          recipients: deliveryResults
        });
        
      } catch (err) {
        console.error(`[send-scheduled-report] Error processing schedule ${schedule.id}:`, err);
        results.push({
          schedule_id: schedule.id,
          error: err.message
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      processed: schedules.length,
      results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('[send-scheduled-report] Error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});


