/**
 * Discovery Responses PDF Generator
 * 
 * Exports the raw discovery assessment questions and answers into a clean,
 * printable PDF format. This is separate from the Analysis PDF - it's just
 * the client's direct responses for external review.
 * 
 * Usage: POST { clientId: string, engagementId?: string }
 * Returns: { success: true, html: string, filename: string }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// DISCOVERY QUESTIONS MAPPING
// Maps field keys to human-readable questions, organized by section
// ============================================================================

const DISCOVERY_QUESTIONS = {
  destination: {
    title: 'Part 1: The Destination',
    subtitle: 'Understanding where you want to go',
    icon: '🎯',
    questions: [
      { key: 'dd_five_year_vision', question: "Picture it: Five years from now, it's a random Tuesday morning. What does your ideal day look like?", label: 'Tuesday Test (5-Year Vision)' },
      { key: 'dd_success_definition', question: 'When you think about the next 3-5 years, how would you define success for yourself personally?', label: 'Success Definition' },
      { key: 'dd_non_negotiables', question: 'What are the non-negotiables in your vision?', label: 'Non-Negotiables' },
      { key: 'dd_magic_fix', question: 'If we could fix just ONE thing in the next 90 days that would make the biggest difference to your day-to-day, what would it be?', label: 'Magic Fix (90 Days)' },
    ]
  },
  reality: {
    title: 'Part 2: The Reality',
    subtitle: 'Understanding where you are now',
    icon: '📍',
    questions: [
      { key: 'dd_weekly_hours', question: 'Roughly how many hours per week do you currently work?', label: 'Weekly Hours' },
      { key: 'dd_owner_hours', question: 'Roughly how many hours per week do you currently work?', label: 'Owner Hours' },
      { key: 'dd_time_allocation', question: 'How would you describe the split of your time between firefighting vs strategic work?', label: 'Time Allocation' },
      { key: 'dd_core_frustration', question: "What's the biggest frustration in your business right now?", label: 'Core Frustration' },
      { key: 'dd_emergency_log', question: 'Think about the last month. What emergencies or unexpected issues pulled you away from what you should have been doing?', label: 'Emergency Log' },
      { key: 'dd_relationship_mirror', question: 'If your relationship with your business was a relationship with a person, what kind would it be?', label: 'Business Relationship' },
      { key: 'dd_external_view', question: 'How do people outside the business perceive it?', label: 'External View' },
      { key: 'dd_sacrifice_list', question: 'What have you sacrificed or put on hold because of the business?', label: 'What You\'ve Sacrificed' },
      { key: 'dd_last_real_break', question: 'When did you last have a proper break (a week or more) without checking in?', label: 'Last Real Break' },
      { key: 'dd_sleep_thief', question: 'What keeps you awake at night about the business?', label: 'Sleep Thief' },
    ]
  },
  truth: {
    title: 'Part 3: The Hard Truth',
    subtitle: 'The conversations that matter',
    icon: '💡',
    questions: [
      { key: 'dd_avoided_conversation', question: "Is there a conversation you've been avoiding? Someone you need to talk to but haven't?", label: 'Avoided Conversation' },
      { key: 'dd_hard_truth', question: "What's the hard truth about your business that you suspect but haven't confirmed?", label: 'Hard Truth' },
      { key: 'dd_if_i_knew', question: 'If you could know one thing with certainty about your business, what would it be?', label: 'If I Knew...' },
      { key: 'dd_suspected_truth', question: "If you had to guess - what do you think your numbers would tell you that you don't currently know?", label: 'Suspected Truth' },
      { key: 'dd_team_secret', question: "What does your team not know about how you're feeling?", label: 'Team Secret' },
      { key: 'dd_scaling_constraint', question: "What's the main constraint stopping you from growing right now?", label: 'Scaling Constraint' },
      { key: 'dd_change_readiness', question: 'How ready are you to make significant changes to how things work?', label: 'Change Readiness' },
    ]
  },
  systems: {
    title: 'Part 4: Systems & Operations',
    subtitle: 'How the business runs',
    icon: '⚙️',
    questions: [
      { key: 'sd_financial_confidence', question: 'How confident are you that your financial data is accurate and up to date?', label: 'Financial Confidence' },
      { key: 'sd_founder_dependency', question: 'If you disappeared for 2 weeks, what would happen to the business?', label: 'Founder Dependency' },
      { key: 'sd_manual_tasks', question: 'Which of these tasks are still largely manual in your business?', label: 'Manual Tasks' },
      { key: 'sd_manual_work', question: "How much of your team's effort is manual vs automated?", label: 'Manual Work' },
      { key: 'sd_plan_clarity', question: 'Do you have a clear business plan?', label: 'Plan Clarity' },
      { key: 'sd_numbers_action_frequency', question: 'How often do you make decisions based on your financial data?', label: 'Data-Driven Decisions' },
      { key: 'sd_documentation_readiness', question: 'If someone needed to understand how your business works, is it documented?', label: 'Documentation Ready' },
      { key: 'sd_operational_frustration', question: 'What processes or systems frustrate you most?', label: 'Operational Frustration' },
      { key: 'sd_growth_blocker', question: "What's blocking your growth right now?", label: 'Growth Blocker' },
      { key: 'sd_competitive_position', question: 'How would you describe your market position?', label: 'Market Position' },
      { key: 'sd_exit_timeline', question: 'Are you thinking about an exit? If so, what\'s your timeline?', label: 'Exit Timeline' },
    ]
  },
  closing: {
    title: 'Part 5: Final Thoughts',
    subtitle: 'Anything else we should know',
    icon: '✨',
    questions: [
      { key: 'dd_final_message', question: "Is there anything else you'd like us to know?", label: 'Final Message' },
      { key: 'dd_final_insight', question: 'What would you most like to get out of this process?', label: 'Desired Outcome' },
    ]
  }
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientId, engagementId } = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'clientId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-discovery-responses-pdf] Generating for client: ${clientId}`);

    // Fetch client info
    let client;
    const { data: memberData } = await supabase
      .from('practice_members')
      .select('*, practice:practices(*)')
      .eq('id', clientId)
      .single();
    
    if (memberData) {
      client = memberData;
    } else {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*, practice:practices(*)')
        .eq('id', clientId)
        .single();
      client = clientData;
    }

    // Fetch discovery engagement with responses
    let discoveryQuery = supabase
      .from('discovery_engagements')
      .select('*, discovery:destination_discovery(*)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (engagementId) {
      discoveryQuery = supabase
        .from('discovery_engagements')
        .select('*, discovery:destination_discovery(*)')
        .eq('id', engagementId);
    }

    const { data: engagement, error: engagementError } = await discoveryQuery.maybeSingle();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'No discovery engagement found for this client' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get responses from destination_discovery or the engagement itself
    const responses = engagement.discovery?.responses || engagement.responses || {};

    if (Object.keys(responses).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No discovery responses found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch report to derive display status (so cover shows "Report Ready" not "In Progress" when done)
    const { data: report } = await supabase
      .from('discovery_reports')
      .select('id, status, destination_report')
      .eq('engagement_id', engagement.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const displayStatus = getDisplayStatus(engagement, report);

    // Build HTML
    const html = buildResponsesHTML({
      client,
      responses,
      engagement,
      practiceName: client?.practice?.name || 'Your Accounting Practice',
      report,
      displayStatus
    });

    // Generate filename
    const clientName = (client?.name || 'Client').replace(/[,;:.!?]+$/, '');
    const date = new Date().toISOString().split('T')[0];
    const filename = `Discovery_Responses_${clientName.replace(/\s+/g, '_')}_${date}`;

    console.log(`[generate-discovery-responses-pdf] Generated: ${filename}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        html,
        filename: `${filename}.pdf`,
        message: 'Open in browser and print to PDF'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-discovery-responses-pdf] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// HTML BUILDER
// ============================================================================

interface BuildHTMLParams {
  client: any;
  responses: Record<string, any>;
  engagement: any;
  practiceName: string;
  report?: any;
  displayStatus?: string;
}

function getDisplayStatus(engagement: any, report: any): string {
  if (report?.status === 'published') return 'Published';
  if (report?.destination_report) return 'Report Ready';
  if (engagement?.status === 'pass2_complete') return 'Analysis Complete';
  if (engagement?.status === 'pass1_complete') return 'Data Processed';
  if (engagement?.discovery?.status === 'completed') return 'Completed';
  if (engagement?.discovery?.responses && Object.keys(engagement.discovery.responses).length > 0) return 'Assessment Complete';
  return 'In Progress';
}

function buildResponsesHTML({ client, responses, engagement, practiceName, report, displayStatus }: BuildHTMLParams): string {
  const clientName = (client?.name || 'Client').replace(/[,;:.!?]+$/, '');
  const companyName = (client?.client_company || clientName).replace(/[,;:.!?]+$/, '') || clientName;
  const completedAt = engagement?.completed_at || engagement?.discovery?.completed_at;
  const completionDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : displayStatus || 'In Progress';

  // Count answered questions
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Discovery Responses - ${companyName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        ${getStyles()}
      </style>
    </head>
    <body>
      ${buildCoverPage(clientName, companyName, practiceName, completionDate)}
      ${buildSectionsHTML(responses)}
    </body>
    </html>
  `;
}

function getStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1e293b;
      background: white;
      text-align: left;
    }
    
    .page {
      page-break-after: always;
      min-height: 100vh;
      padding: 30px 40px;
      position: relative;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
      color: white;
      padding: 60px;
    }
    
    .cover-title {
      font-size: 36pt;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: -1px;
    }
    
    .cover-subtitle {
      font-size: 16pt;
      opacity: 0.9;
      margin-bottom: 60px;
    }
    
    .cover-client {
      font-size: 28pt;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .cover-company {
      font-size: 16pt;
      opacity: 0.85;
    }
    
    .cover-footer {
      position: absolute;
      bottom: 50px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      opacity: 0.8;
    }
    
    /* Section Styles */
    .section {
      margin-bottom: 30px;
    }
    
    .section-header {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 16px;
      border-left: 4px solid #3b82f6;
      text-align: left;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
      text-align: left;
    }
    
    .section-subtitle {
      font-size: 10pt;
      color: #64748b;
      margin: 0;
      text-align: left;
    }
    
    /* Question Styles */
    .question-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 10px;
      page-break-inside: avoid;
      text-align: left;
    }
    
    .question-label {
      font-size: 9pt;
      font-weight: 600;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
      text-align: left;
    }
    
    .question-text {
      font-size: 9pt;
      color: #64748b;
      font-style: italic;
      margin: 0 0 12px 0;
      padding: 0 0 10px 0;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    
    .answer-text {
      font-size: 11pt;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      text-align: left;
      white-space: normal;
      word-wrap: break-word;
    }
    
    /* Page Footer */
    .page-footer {
      position: absolute;
      bottom: 15px;
      left: 40px;
      right: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    
    /* Print Styles */
    @media print {
      .page {
        page-break-after: always;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .question-card {
        break-inside: avoid;
      }
    }
  `;
}

function buildCoverPage(
  clientName: string, 
  companyName: string, 
  practiceName: string,
  completionDate: string
): string {
  return `
    <div class="page cover-page">
      <h1 class="cover-title">Discovery Responses</h1>
      <p class="cover-subtitle">Assessment Questions & Answers</p>
      
      <div class="cover-client">${clientName}</div>
      <div class="cover-company">${companyName}</div>
      
      <div class="cover-footer">
        ${completionDate}<br>
        Prepared by ${practiceName}
      </div>
    </div>
  `;
}

function buildSectionsHTML(responses: Record<string, any>): string {
  let html = '';
  let pageNumber = 2;
  
  for (const [sectionKey, section] of Object.entries(DISCOVERY_QUESTIONS)) {
    // Check if section has any answered questions
    const hasAnswers = section.questions.some(q => {
      const val = responses[q.key];
      return val && (Array.isArray(val) ? val.length > 0 : String(val).trim().length > 0);
    });
    
    if (!hasAnswers) continue;
    
    html += `
      <div class="page">
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">${section.title}</h2>
            <p class="section-subtitle">${section.subtitle}</p>
          </div>
          
          ${section.questions.map(q => {
            let answer = responses[q.key];
            if (Array.isArray(answer)) {
              answer = answer.filter(a => a).join(', ');
            }
            const hasAnswer = answer && String(answer).trim().length > 0;
            
            if (!hasAnswer) return ''; // Skip unanswered questions
            
            // Clean up the answer text - normalize whitespace and remove weird indents
            const cleanedAnswer = String(answer)
              .replace(/\r\n/g, '\n')           // Normalize line endings
              .replace(/\t/g, ' ')              // Replace tabs with spaces
              .replace(/  +/g, ' ')             // Collapse multiple spaces
              .replace(/^\s+/gm, '')            // Remove leading whitespace from each line
              .replace(/\n{3,}/g, '\n\n')       // Max 2 newlines in a row
              .trim();
            
            return `
              <div class="question-card">
                <div class="question-label">${q.label}</div>
                <div class="question-text">"${q.question}"</div>
                <div class="answer-text">${escapeHtml(cleanedAnswer)}</div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="page-footer">
          <span>Discovery Responses</span>
          <span>Page ${pageNumber}</span>
        </div>
      </div>
    `;
    pageNumber++;
  }
  
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

