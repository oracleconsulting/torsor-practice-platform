import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PASS 2: NARRATIVE WRITING (Opus)
// Reads pass1_data from bm_reports
// Writes compelling narratives using the story arc framework
// Updates report with status 'generated'
// =============================================================================

function buildPass2Prompt(pass1Data: any): string {
  const quotes = pass1Data.clientQuotes || {};
  const overall = pass1Data.overallPosition || {};
  const strengths = Array.isArray(pass1Data.topStrengths) ? pass1Data.topStrengths : [];
  const gaps = Array.isArray(pass1Data.topGaps) ? pass1Data.topGaps : [];
  const metrics = Array.isArray(pass1Data.metricsComparison) ? pass1Data.metricsComparison : [];
  const opportunity = pass1Data.opportunitySizing || {};
  
  return `
You are writing the narrative sections of a Benchmarking report. Your job is to tell a STORY, not list problems.

═══════════════════════════════════════════════════════════════════════════════
THE STORY ARC
═══════════════════════════════════════════════════════════════════════════════

Every good consulting narrative follows this arc:

1. THE POSITION   → Where they actually sit (not where they think)
2. THE STRENGTHS  → What they're doing well (credibility first)
3. THE GAPS       → Where they're behind (connected to their stated concerns)
4. THE PRICE      → What these gaps cost them annually
5. THE PATH       → What closing the gaps would enable (their magic fix)

═══════════════════════════════════════════════════════════════════════════════
THEIR WORDS (USE THESE VERBATIM)
═══════════════════════════════════════════════════════════════════════════════

SUSPECTED UNDERPERFORMANCE: "${quotes.suspectedUnderperformance || 'Not specified'}"
WHERE THEY'RE LEAVING MONEY: "${quotes.leavingMoney || 'Not specified'}"
COMPETITOR ENVY: "${quotes.competitorEnvy || 'Not specified'}"
MAGIC FIX: "${quotes.magicFix || 'Not specified'}"
BLIND SPOT FEAR: "${quotes.blindSpotFear || 'Not specified'}"

${pass1Data.assessmentResponses && Object.keys(pass1Data.assessmentResponses).length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
CLIENT CONTEXT (from assessment — use for quotes and goals when Pass 1 quotes are thin)
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.assessmentResponses.bm_business_description ? `Business description: "${pass1Data.assessmentResponses.bm_business_description}"` : ''}
${pass1Data.assessmentResponses.bm_business_direction ? `Direction: ${pass1Data.assessmentResponses.bm_business_direction}` : ''}
${pass1Data.assessmentResponses.bm_business_direction_context ? `Direction context: "${pass1Data.assessmentResponses.bm_business_direction_context}"` : ''}
${pass1Data.assessmentResponses.bm_exit_timeline ? `Exit timeline: ${pass1Data.assessmentResponses.bm_exit_timeline}` : ''}
${pass1Data.assessmentResponses.bm_exit_timeline_context ? `Exit context: "${pass1Data.assessmentResponses.bm_exit_timeline_context}"` : ''}
${pass1Data.assessmentResponses.bm_pricing_confidence ? `Pricing confidence: ${pass1Data.assessmentResponses.bm_pricing_confidence}` : ''}
${pass1Data.assessmentResponses.bm_pricing_confidence_context ? `Pricing context: "${pass1Data.assessmentResponses.bm_pricing_confidence_context}"` : ''}
${pass1Data.assessmentResponses.bm_action_readiness ? `Action readiness: ${pass1Data.assessmentResponses.bm_action_readiness}` : ''}
${pass1Data.assessmentResponses.bm_investment_plans ? `Investment plans: ${pass1Data.assessmentResponses.bm_investment_plans}` : ''}
${pass1Data.assessmentResponses.bm_investment_plans_context ? `Investment context: "${pass1Data.assessmentResponses.bm_investment_plans_context}"` : ''}
${pass1Data.assessmentResponses.bm_leadership_effectiveness ? `Leadership effectiveness: ${pass1Data.assessmentResponses.bm_leadership_effectiveness}` : ''}
${pass1Data.assessmentResponses.bm_leadership_effectiveness_context ? `Leadership context: "${pass1Data.assessmentResponses.bm_leadership_effectiveness_context}"` : ''}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
PASS 1 ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

OVERALL POSITION: ${overall.percentile || 0}th percentile
STRENGTHS: ${overall.strengthCount || 0} metrics above median
GAPS: ${overall.gapCount || 0} metrics below median
TOTAL OPPORTUNITY: £${(opportunity.totalAnnualOpportunity || 0).toLocaleString()}/year

TOP STRENGTHS:
${strengths.map((s: any) => `- ${s.metric}: ${s.position} - ${s.implication}`).join('\n')}

TOP GAPS:
${gaps.map((g: any) => `- ${g.metric}: ${g.position} (£${g.annualImpact?.toLocaleString()}/year) - ${g.rootCauseHypothesis || 'No hypothesis'}`).join('\n')}

METRIC DETAILS:
${metrics.slice(0, 10).map((m: any) => `${m.metricName}: Client ${m.clientValue} vs Median ${m.p50} (${m.percentile}th percentile, £${m.annualImpact?.toLocaleString()} impact)`).join('\n')}

${Array.isArray(pass1Data.financial_trends) && pass1Data.financial_trends.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
⚠️ FINANCIAL TRENDS - CRITICAL CONTEXT (DO NOT IGNORE)
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.financial_trends.map((t: any) => `
📊 ${t.metric.toUpperCase()}:
   ${t.narrative}
   ${t.isRecovering ? '✅ THIS IS A RECOVERY PATTERN - interpret current metrics positively' : ''}
`).join('')}

${pass1Data.investment_signals?.likelyInvestmentYear ? `
⚠️ INVESTMENT PATTERN DETECTED (Confidence: ${pass1Data.investment_signals.confidence})
Indicators:
${Array.isArray(pass1Data.investment_signals.indicators) ? pass1Data.investment_signals.indicators.map((ind: string) => `  • ${ind}`).join('\n') : '  (none listed)'}

CRITICAL INSTRUCTION: Do NOT describe current margins as "crisis" or "alarming" if 
this is an investment/recovery pattern. Instead, use language like:
- "Margins recovering from strategic investment period"
- "Strong trajectory following capacity building"
- "Financial discipline restored after growth investment"
` : ''}
` : ''}

${pass1Data.balance_sheet ? `
═══════════════════════════════════════════════════════════════════════════════
BALANCE SHEET CONTEXT (Financial Resilience Indicators)
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.balance_sheet.cash ? `- Cash Position: £${(pass1Data.balance_sheet.cash / 1000000).toFixed(2)}M` : ''}
${pass1Data.balance_sheet.net_assets ? `- Net Assets: £${(pass1Data.balance_sheet.net_assets / 1000000).toFixed(2)}M` : ''}
${pass1Data.current_ratio ? `- Current Ratio: ${pass1Data.current_ratio}` : ''}
${pass1Data.cash_months ? `- Cash Runway: ${pass1Data.cash_months} months of revenue` : ''}
${pass1Data.balance_sheet.freehold_property ? `- Freehold Property: £${(pass1Data.balance_sheet.freehold_property / 1000).toFixed(0)}k (hidden value)` : ''}

INTERPRETATION: If balance sheet is strong (high cash, positive net assets), 
do NOT describe the business as "in crisis" even if margins are low. 
Strong balance sheets indicate financial resilience and capacity to invest.
` : ''}

${pass1Data.surplus_cash?.hasData ? `
═══════════════════════════════════════════════════════════════════════════════
SURPLUS CASH ANALYSIS (Hidden Value)
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.surplus_cash.narrative}

| Component | Value |
|-----------|-------|
| Actual Cash | £${pass1Data.surplus_cash.actualCash ? (pass1Data.surplus_cash.actualCash / 1000000).toFixed(2) : '?'}M |
| Required Cash (3-mo buffer + WC) | £${pass1Data.surplus_cash.requiredCash ? (pass1Data.surplus_cash.requiredCash / 1000000).toFixed(2) : '?'}M |
| **SURPLUS CASH** | **£${pass1Data.surplus_cash.surplusCash ? (pass1Data.surplus_cash.surplusCash / 1000000).toFixed(2) : '0.00'}M** |

Breakdown:
- Operating Buffer (3 months): £${pass1Data.surplus_cash.components.operatingBuffer ? (pass1Data.surplus_cash.components.operatingBuffer / 1000000).toFixed(2) : '?'}M
- Working Capital Requirement: £${pass1Data.surplus_cash.components.workingCapitalRequirement ? (pass1Data.surplus_cash.components.workingCapitalRequirement / 1000).toFixed(0) : '0'}k
${pass1Data.surplus_cash.components.netWorkingCapital && pass1Data.surplus_cash.components.netWorkingCapital < 0 ? `- Note: Negative working capital (£${(Math.abs(pass1Data.surplus_cash.components.netWorkingCapital) / 1000000).toFixed(2)}M) = suppliers fund operations` : ''}

Methodology: ${pass1Data.surplus_cash.methodology}
Confidence: ${pass1Data.surplus_cash.confidence}

⚠️ IMPORTANT FOR NARRATIVE:
- If surplus cash is material (>${pass1Data.surplus_cash.surplusAsPercentOfRevenue && pass1Data.surplus_cash.surplusAsPercentOfRevenue > 5 ? 'YES, ' + pass1Data.surplus_cash.surplusAsPercentOfRevenue.toFixed(1) + '% of revenue' : '5% of revenue'}), mention this as a STRENGTH
- State the actual surplus figure (£${pass1Data.surplus_cash.surplusCash ? (pass1Data.surplus_cash.surplusCash / 1000000).toFixed(1) : '0'}M), NOT generic phrases like "healthy cash"
- This surplus sits OUTSIDE normal earnings-based valuations - it's hidden value
` : ''}

${pass1Data.hva && Object.keys(pass1Data.hva).length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
HIDDEN VALUE AUDIT — OPERATIONAL & SUCCESSION INTELLIGENCE
═══════════════════════════════════════════════════════════════════════════════

This data comes from the client's Hidden Value Assessment. It reveals operational
risks, succession gaps, and structural issues that the financial metrics alone
cannot show. USE THIS DATA to enrich your narratives significantly.

FOUNDER & KEY PERSON RISK:
${pass1Data.hva.knowledge_dependency_percentage !== undefined ? `- Knowledge concentrated in founder: ${pass1Data.hva.knowledge_dependency_percentage}%` : ''}
${pass1Data.hva.personal_brand_percentage !== undefined ? `- Revenue tied to founder's personal brand: ${pass1Data.hva.personal_brand_percentage}%` : ''}
${pass1Data.hva.team_advocacy_percentage !== undefined ? `- Team advocacy (would recommend working here): ${pass1Data.hva.team_advocacy_percentage}%` : ''}

AUTONOMY SCORES (what happens WITHOUT the founder):
${pass1Data.hva.autonomy_sales ? `- Sales: ${pass1Data.hva.autonomy_sales}` : ''}
${pass1Data.hva.autonomy_finance ? `- Finance: ${pass1Data.hva.autonomy_finance}` : ''}
${pass1Data.hva.autonomy_hiring ? `- Hiring: ${pass1Data.hva.autonomy_hiring}` : ''}
${pass1Data.hva.autonomy_strategy ? `- Strategy: ${pass1Data.hva.autonomy_strategy}` : ''}
${pass1Data.hva.autonomy_quality ? `- Quality: ${pass1Data.hva.autonomy_quality}` : ''}
${pass1Data.hva.autonomy_delivery ? `- Delivery: ${pass1Data.hva.autonomy_delivery}` : ''}

RISK IF KEY PERSON LEAVES:
${pass1Data.hva.risk_tech_lead ? `- Tech lead departure: ${pass1Data.hva.risk_tech_lead}` : ''}
${pass1Data.hva.risk_sales_lead ? `- Sales lead departure: ${pass1Data.hva.risk_sales_lead}` : ''}
${pass1Data.hva.risk_finance_lead ? `- Finance lead departure: ${pass1Data.hva.risk_finance_lead}` : ''}
${pass1Data.hva.risk_operations_lead ? `- Operations lead departure: ${pass1Data.hva.risk_operations_lead}` : ''}
${pass1Data.hva.risk_customer_lead ? `- Customer lead departure: ${pass1Data.hva.risk_customer_lead}` : ''}

SUCCESSION READINESS:
${pass1Data.hva.succession_sales ? `- Sales succession: ${pass1Data.hva.succession_sales}` : ''}
${pass1Data.hva.succession_operations ? `- Operations succession: ${pass1Data.hva.succession_operations}` : ''}
${pass1Data.hva.succession_technical ? `- Technical succession: ${pass1Data.hva.succession_technical}` : ''}
${pass1Data.hva.succession_customer ? `- Customer succession: ${pass1Data.hva.succession_customer}` : ''}
${pass1Data.hva.succession_your_role ? `- Founder role succession: ${pass1Data.hva.succession_your_role}` : ''}

COMPETITIVE ADVANTAGES:
${pass1Data.hva.competitive_moat ? `- Competitive moat: ${Array.isArray(pass1Data.hva.competitive_moat) ? pass1Data.hva.competitive_moat.join(', ') : pass1Data.hva.competitive_moat}` : ''}
${pass1Data.hva.unique_methods ? `- Unique methods/IP: ${pass1Data.hva.unique_methods}` : ''}
${pass1Data.hva.unique_methods_protection ? `- IP protection status: ${pass1Data.hva.unique_methods_protection}` : ''}
${pass1Data.hva.reputation_build_time ? `- Time to replicate: ${pass1Data.hva.reputation_build_time}` : ''}

SYSTEMS & PROCESSES:
${pass1Data.hva.tech_stack_health_percentage !== undefined ? `- Tech/systems health: ${pass1Data.hva.tech_stack_health_percentage}%` : ''}
${pass1Data.hva.data_re_entry_frequency ? `- Data re-entry frequency: ${pass1Data.hva.data_re_entry_frequency}` : ''}
${pass1Data.hva.critical_processes_undocumented ? `- Undocumented critical processes: ${Array.isArray(pass1Data.hva.critical_processes_undocumented) ? pass1Data.hva.critical_processes_undocumented.join(', ') : pass1Data.hva.critical_processes_undocumented}` : ''}
${pass1Data.hva.quality_control_method ? `- Quality control approach: ${pass1Data.hva.quality_control_method}` : ''}
${pass1Data.hva.culture_preservation_methods ? `- Culture preservation: ${pass1Data.hva.culture_preservation_methods}` : ''}

MARKET & CUSTOMER INTELLIGENCE:
${pass1Data.hva.market_intelligence_methods ? `- Market tracking: ${pass1Data.hva.market_intelligence_methods}` : ''}
${pass1Data.hva.customer_data_unutilized ? `- Unused customer data: ${Array.isArray(pass1Data.hva.customer_data_unutilized) ? pass1Data.hva.customer_data_unutilized.join(', ') : pass1Data.hva.customer_data_unutilized}` : ''}
${pass1Data.hva.active_customer_advocates !== undefined ? `- Active customer advocates: ${pass1Data.hva.active_customer_advocates}` : ''}
${pass1Data.hva.external_channel_percentage !== undefined ? `- Revenue from external channels: ${pass1Data.hva.external_channel_percentage}%` : ''}
${pass1Data.hva.top3_customer_revenue_percentage !== undefined ? `- Top 3 customers: ${pass1Data.hva.top3_customer_revenue_percentage}% of revenue` : ''}

PRICING & REVENUE:
${pass1Data.hva.last_price_increase ? `- Last price increase: ${pass1Data.hva.last_price_increase}` : ''}

UNTAPPED ASSETS:
${pass1Data.hva.content_assets_unleveraged ? `- Unleveraged content: ${Array.isArray(pass1Data.hva.content_assets_unleveraged) ? pass1Data.hva.content_assets_unleveraged.join(', ') : pass1Data.hva.content_assets_unleveraged}` : ''}
${pass1Data.hva.hidden_trust_signals ? `- Trust signals: ${Array.isArray(pass1Data.hva.hidden_trust_signals) ? pass1Data.hva.hidden_trust_signals.join(', ') : pass1Data.hva.hidden_trust_signals}` : ''}
${pass1Data.hva.investability_assets ? `- Investability assets: ${Array.isArray(pass1Data.hva.investability_assets) ? pass1Data.hva.investability_assets.join(', ') : pass1Data.hva.investability_assets}` : ''}

FUNDING AWARENESS:
${pass1Data.hva.explored_equity ? `- Equity funding: ${pass1Data.hva.explored_equity}` : ''}
${pass1Data.hva.explored_grants ? `- Grants: ${pass1Data.hva.explored_grants}` : ''}
${pass1Data.hva.explored_eis_seis ? `- EIS/SEIS: ${pass1Data.hva.explored_eis_seis}` : ''}
${pass1Data.hva.awareness_patent_box ? `- Patent Box: ${pass1Data.hva.awareness_patent_box}` : ''}
${pass1Data.hva.awareness_creative_tax ? `- Creative tax relief: ${pass1Data.hva.awareness_creative_tax}` : ''}
${pass1Data.hva.awareness_innovation_grants ? `- Innovation grants: ${pass1Data.hva.awareness_innovation_grants}` : ''}
${pass1Data.hva.awareness_rd_tax_credits ? `- R&D tax credits: ${pass1Data.hva.awareness_rd_tax_credits}` : ''}

⚠️ HOW TO USE HVA DATA IN NARRATIVES:

1. EXECUTIVE SUMMARY: If founder dependency is high (knowledge >40%, multiple "would fail" autonomy scores), this MUST appear alongside the financial opportunity. The client's stated goal (step back, exit, growth) should be connected to the succession reality.

2. GAP NARRATIVE: Don't just discuss financial gaps. The operational gaps (undocumented processes, tech health contradictions, data re-entry, missing market intelligence) should form a second layer of gap analysis. These are the "invisible" gaps that don't show up in P&L but erode value.

3. OPPORTUNITY NARRATIVE: Connect the financial opportunity to the HVA findings. If the client wants to exit/step back, the succession and documentation gaps ARE the opportunity, not just the margin improvement.

4. STRENGTH NARRATIVE: If competitive_moat is strong, unique_methods are impressive, or investability_assets are present, weave these into the strengths. These are the foundations of value.

DO NOT reference "HVA" or "Hidden Value Assessment" by name in client-facing narratives. Instead, naturally incorporate the insights: "Half of the critical knowledge sits with you personally", not "The HVA shows knowledge_dependency_percentage of 50%".
` : ''}

${pass1Data.collectedData ? `
═══════════════════════════════════════════════════════════════════════════════
COLLECTED DATA - USE THIS TO MAKE RECOMMENDATIONS SPECIFIC
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.client_concentration_top3 ? `
CLIENT CONCENTRATION (CRITICAL):
- Top 3 concentration: ${pass1Data.client_concentration_top3}%
${pass1Data.client_concentration_details ? `- Details: ${pass1Data.client_concentration_details}` : ''}

⚠️ USE THIS: Do NOT suggest generic "diversification". Instead:
- Reference specific clients if known
- Acknowledge relationship lengths
- Suggest specific actions for their situation
- If concentration is above 75%, this is a CRITICAL risk that MUST be addressed prominently
` : ''}

${pass1Data.project_margin ? `
PROJECT MARGINS: ${pass1Data.project_margin}%

⚠️ USE THIS: Reference their actual margin:
- If low (< 20%), connect to pricing or efficiency opportunities
- If decent (20-35%), acknowledge as structural to their model
- Don't compare to irrelevant benchmarks (e.g., pure software vs infrastructure)
` : ''}

${pass1Data.hourly_rate ? `
PRICING DATA:
Average hourly rate: £${pass1Data.hourly_rate}

⚠️ USE THIS: Reference their actual rate in recommendations.
- Compare to industry medians for context
- If below median, discuss pricing power
- If above median, acknowledge their premium positioning
` : ''}

${pass1Data.utilisation_rate ? `
UTILISATION: ${pass1Data.utilisation_rate}%

⚠️ USE THIS: Reference actual utilisation figure in gap analysis.
` : ''}
` : ''}

${pass1Data.industryMismatch ? `
═══════════════════════════════════════════════════════════════════════════════
⚠️ INDUSTRY CONTEXT - HONEST BENCHMARKING
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.industryMismatch.description}

${pass1Data.industryMismatch.acknowledgment || `
IMPORTANT: When discussing gaps, acknowledge where comparisons may not be apples-to-apples.
Example: "While we're benchmarking against [industry median X], your business model 
naturally operates differently. Your [metric] is more aligned with [relevant comparison]."
`}

DO NOT:
- Describe their margins as "alarming" if they match their actual business model
- Compare infrastructure/project businesses to pure services
- Ignore their business description when interpreting benchmarks
` : ''}

${pass1Data.industry_code === 'TELECOM_INFRA' ? `
═══════════════════════════════════════════════════════════════════════════════
🏗️ TELECOM INFRASTRUCTURE CONTRACTOR - CRITICAL CONTEXT
═══════════════════════════════════════════════════════════════════════════════

This client is a TELECOM INFRASTRUCTURE CONTRACTOR, NOT an IT services/MSP business.
They install physical network infrastructure (fibre, 4G/5G, DAS systems).

⚠️ CRITICAL INTERPRETATION GUIDANCE:

1. GROSS MARGIN (expect 12-25%):
   - 16% gross margin is HEALTHY for infrastructure - NOT a gap
   - Hardware pass-through and subcontractor costs compress margins structurally
   - Do NOT compare to 45% MSP benchmarks - that's apples to oranges
   - Frame as: "Your 16% gross margin is solid for infrastructure delivery"

2. REVENUE PER EMPLOYEE (expect £250k-500k):
   - £400k+ per employee is TOP QUARTILE for this sector
   - Field engineers command premium rates but pass through costs
   - This is a STRENGTH, not just "good" - it's exceptional

3. CLIENT CONCENTRATION (expect 60-90%):
   - Infrastructure contractors typically have 60-90% from top 3 clients
   - This is NORMAL for B2B project-based businesses
   - Still a risk worth managing, but don't alarm them unnecessarily
   - Frame as: "Concentration is typical for your sector, but worth de-risking over time"

4. DEBTOR DAYS (expect 45-75):
   - Construction industry has longer payment cycles
   - Certification-based billing creates natural delays
   - 30-45 days is actually EXCELLENT for this sector

5. REVENUE VOLATILITY:
   - Project-based businesses have naturally lumpy revenue
   - -25% decline may reflect project timing, not business problem
   - Look at multi-year trends, not single year comparisons

DO NOT:
- Compare their margins to MSP/IT services benchmarks
- Describe their 16% gross margin as "bottom quartile" or "crisis"
- Suggest they should achieve 40%+ gross margins (structurally impossible)
- Ignore that high revenue per employee is their core strength

INSTEAD:
- Focus on operational metrics (utilisation, project efficiency)
- Acknowledge their concentration risk appropriately (not panic-inducing)
- Highlight their efficiency (revenue/employee) as the standout strength
- Discuss cash management and working capital as key levers
` : ''}

═══════════════════════════════════════════════════════════════════════════════
YOUR OUTPUT
═══════════════════════════════════════════════════════════════════════════════

Return JSON:
{
  "headline": "Under 25 words. Include the £ opportunity and their stated concern.",
  
  "executiveSummary": "3 paragraphs following the story arc. Start with their blind spot fear or suspected underperformance. End with the data-driven opportunity. If a magic fix was specified by the client (not 'Not specified'), reference it; otherwise focus on the numbers.",
  
  "positionNarrative": "2 paragraphs. Where they actually sit. Be honest but constructive. Reference specific percentiles.",
  
  "strengthNarrative": "2 paragraphs. What they're doing well. Build credibility before discussing gaps. Use specific numbers.",
  
  "gapNarrative": "3 paragraphs. Where they're behind. Connect to their stated concerns. Quantify each gap in £.",
  
  "opportunityNarrative": "2 paragraphs. What closing gaps would mean for them. Reference their magic fix. Paint the picture."
}

═══════════════════════════════════════════════════════════════════════════════
TONE: SMART ADVISOR OVER COFFEE, NOT CORPORATE CONSULTANT
═══════════════════════════════════════════════════════════════════════════════

Write like you're explaining this to a smart business owner over coffee. 
They don't need impressing - they need clarity and honesty.

GOOD: "Your team bills 57% of their time. The average agency hits 71%. That gap 
costs you about £184k a year - roughly what you'd pay a senior developer."

BAD: "The benchmarking analysis reveals that utilisation metrics demonstrate 
significant underperformance against industry medians, with the 14 percentage 
point shortfall representing substantial unrealised revenue potential."

WRITE LIKE A PERSON:
- Use contractions (you're, don't, it's)
- Use "you" and "your" liberally - this is THEIR story
- Short sentences. Varied rhythm. 
- Numbers should land like punches, not drown in verbiage
- Acknowledge uncertainty where it exists ("probably", "likely", "suggests")

═══════════════════════════════════════════════════════════════════════════════
BANNED AI-SLOP
═══════════════════════════════════════════════════════════════════════════════

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue the thought)
- Delve, delving (look at, examine, dig into)
- Crucial, pivotal, vital, key as adjective (show why it matters)
- Testament to, underscores, highlights (shows, makes clear)
- Showcases, fostering, garnered (shows, building, got)
- Tapestry, landscape, ecosystem (figurative uses)
- Intricate, vibrant, enduring (puffery)
- Synergy, leverage (verb), value-add (corporate nonsense)
- Streamline, optimize, holistic, impactful, scalable, robust (consultant clichés)
- Best practices, industry-leading, unlock potential, drive growth

BANNED PUNCTUATION:
- Em dashes (—) are COMPLETELY BANNED. Never use them. They are the single biggest tell of AI writing.
  Instead of "X — Y", use one of these alternatives:
  - Period + new sentence: "X. Y"
  - Semicolon: "X; Y"  
  - Comma: "X, Y" (when clauses are short)
  - Colon: "X: Y" (when second part explains first)
  - Parentheses: "X (Y)" (for asides)
  - "which" clause: "X, which Y"
  Example: Instead of "That's not a crisis — that's a business that invested"
  Write: "That's not a crisis. That's a business that invested."
- Do not use en dashes (–) as substitutes for em dashes either.

BANNED STRUCTURES:
- "Not only X but also Y" parallelisms (pick X or Y)
- "It's important to note..." / "In summary..." / "In conclusion..."
- Rule of three lists (pick the best one)
- "Despite challenges, positioned for growth" formula
- "Let me be direct" / "I want to be honest" (just be direct/honest)
- Starting any paragraph with "Your" (vary openings)
- Ending with "-ing" phrases ("ensuring excellence, fostering growth")

THE HUMAN TEST:
If it sounds like an annual report, rewrite it. If it sounds like coffee with a smart friend, keep it.

EXAMPLE TRANSFORMATIONS:
BAD: "The analysis underscores the pivotal importance of enhanced operational efficiency."
GOOD: "You're leaving £47,000 on the table. Here's why."

BAD: "Not only does this represent a significant opportunity, but it also positions you for sustainable growth."
GOOD: "Fix this and you add £47,000/year. That's the gap."

═══════════════════════════════════════════════════════════════════════════════
REQUIRED ELEMENTS
═══════════════════════════════════════════════════════════════════════════════

EVERY narrative must include:
- At least ONE verbatim client quote per section (draw from THEIR WORDS above, or from CLIENT CONTEXT from assessment when those fields are richer)
- At least THREE specific numbers per section
- Their suspected underperformance connected to actual findings
- If the client specified a magic fix (not "Not specified"), reference it in the opportunity section. If it says "Not specified", skip it entirely and focus on the data-driven opportunity instead.
- If their blind spot fear was confirmed, address it directly
- If their perception was wrong, correct it gently with evidence
${pass1Data.hva && Object.keys(pass1Data.hva).length > 0 ? `
- HVA operational data is present: gap_narrative MUST include at least one operational or succession insight alongside financial gaps (undocumented processes, autonomy, tech health, knowledge concentration, etc. as relevant)
- If the client has stated an exit or step-back goal (assessment or quotes), opportunity_narrative MUST connect financial improvements to exit readiness where credible
- If founder dependency is high (e.g. knowledge concentration >40% or multiple autonomy scores of "Would fail"), executive_summary MUST mention this reality alongside the financial story
- Cite specific operational signals (knowledge %, tech health %, succession stance, undocumented processes) in natural language alongside financial metrics — never name "HVA" or field keys in client-facing text
` : ''}

Return ONLY valid JSON.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[BM Pass 2] Starting narrative generation for:', engagementId);
    
    // Fetch report with pass1_data
    const { data: report, error: reportError } = await supabaseClient
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    
    if (reportError || !report) {
      throw new Error(`Failed to fetch report: ${reportError?.message || 'Not found'}`);
    }
    
    if (!report.pass1_data) {
      throw new Error('Pass 1 data not found - run Pass 1 first');
    }

    let pass1Base: Record<string, unknown> =
      typeof report.pass1_data === 'string'
        ? (() => {
            try {
              return JSON.parse(report.pass1_data as string) as Record<string, unknown>;
            } catch {
              throw new Error('Pass 1 data is invalid JSON');
            }
          })()
        : (report.pass1_data as Record<string, unknown>);
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Fetch HVA (Part 3) data for narrative enrichment
    let hvaData: Record<string, unknown> = {};
    try {
      const { data: engagement } = await supabaseClient
        .from('bm_engagements')
        .select('client_id')
        .eq('id', engagementId)
        .single();

      if (engagement?.client_id) {
        const { data: hva } = await supabaseClient
          .from('client_assessments')
          .select('responses')
          .eq('client_id', engagement.client_id)
          .eq('assessment_type', 'part3')
          .maybeSingle();

        if (hva?.responses) {
          hvaData = hva.responses as Record<string, unknown>;
          console.log('[BM Pass 2] Including HVA data in narrative context:', {
            fieldsPresent: Object.keys(hvaData).length,
            hasCompetitiveMoat: !!hvaData.competitive_moat,
            hasUniqueMethods: !!hvaData.unique_methods,
            knowledgeDependency: hvaData.knowledge_dependency_percentage,
            techHealth: hvaData.tech_stack_health_percentage,
          });
        }
      }
    } catch (err) {
      console.log('[BM Pass 2] Could not fetch HVA data (continuing without):', err);
    }

    // Fetch assessment responses for reliable client quotes / direction context
    let assessmentResponses: Record<string, unknown> = {};
    try {
      const { data: assessment } = await supabaseClient
        .from('bm_assessment_responses')
        .select('responses')
        .eq('engagement_id', engagementId)
        .maybeSingle();

      if (assessment?.responses) {
        assessmentResponses = assessment.responses as Record<string, unknown>;
        console.log('[BM Pass 2] Including assessment responses for client context');
      }
    } catch (err) {
      console.log('[BM Pass 2] Could not fetch assessment responses:', err);
    }
    
    // Build and send prompt
    console.log('[BM Pass 2] Calling Opus for narrative generation...');
    const startTime = Date.now();
    
    // Merge pass1_data with additional context from report (balance sheet, trends, surplus cash, collected data, HVA, assessment)
    const enrichedPass1Data = {
      ...pass1Base,
      // Industry code is critical for proper narrative context
      industry_code: report.industry_code,
      balance_sheet: report.balance_sheet,
      financial_trends: report.financial_trends,
      investment_signals: report.investment_signals,
      historical_financials: report.historical_financials,
      current_ratio: report.current_ratio,
      quick_ratio: report.quick_ratio,
      cash_months: report.cash_months,
      surplus_cash: report.surplus_cash,
      // Flag that we have collected data
      collectedData: true,
      // These should already be in pass1_data from enrichment, but ensure they're present
      client_concentration_top3: pass1Base?.client_concentration_top3,
      client_concentration_details: pass1Base?.client_concentration_details,
      project_margin: pass1Base?.project_margin,
      hourly_rate: pass1Base?.hourly_rate,
      utilisation_rate: pass1Base?.utilisation_rate,
      hva: hvaData,
      assessmentResponses,
    };
    
    // Log industry code for debugging
    console.log(`[BM Pass 2] Industry code: ${enrichedPass1Data.industry_code}`);
    
    // Log if we have trend/investment context
    if (enrichedPass1Data.financial_trends?.length > 0) {
      console.log('[BM Pass 2] Including financial trends in narrative context');
    }
    if (enrichedPass1Data.investment_signals?.likelyInvestmentYear) {
      console.log('[BM Pass 2] ⚠️ Investment pattern detected - adjusting narrative tone');
    }
    if (enrichedPass1Data.balance_sheet) {
      console.log('[BM Pass 2] Including balance sheet context in narrative');
    }
    if (enrichedPass1Data.surplus_cash?.hasData) {
      console.log(`[BM Pass 2] Including surplus cash (£${(enrichedPass1Data.surplus_cash.surplusCash / 1000000).toFixed(1)}M) in narrative`);
    }
    if (enrichedPass1Data.client_concentration_top3) {
      console.log(`[BM Pass 2] Including client concentration (${enrichedPass1Data.client_concentration_top3}%) in narrative`);
    }
    
    const prompt = buildPass2Prompt(enrichedPass1Data);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    let content = result.choices[0].message.content;
    
    // Strip markdown code blocks if present (```json ... ```)
    content = content.trim();
    if (content.startsWith('```')) {
      // Remove opening ```json or ```
      content = content.replace(/^```(?:json)?\n?/i, '');
      // Remove closing ```
      content = content.replace(/\n?```$/i, '');
      content = content.trim();
    }
    
    let narratives = JSON.parse(content);
    
    // Sanitise AI writing tells — replace em dashes with periods
    // Also remove any literal "undefined" that leaked from missing client quotes
    const sanitiseNarrative = (text: string): string => {
      if (!text) return text;
      return text
        // Remove "undefined" patterns (e.g. your "undefined" opportunity, their "undefined" in action)
        .replace(/\s*[""\u201C\u201D]undefined[""\u201C\u201D]\s*/gi, ' ')
        .replace(/\bundefined\b/gi, '')  // catch any unquoted "undefined"
        // Em/en dashes: do NOT strip hyphens in number ranges (e.g. 18-24, 7-10 months)
        // Em dash → spaced hyphen; en dash → ASCII hyphen (preserves "18–24" as "18-24")
        .replace(/\u2014/g, ' - ')
        .replace(/\u2013/g, '-')
        .replace(/\.\.\s/g, '. ')
        .replace(/\.\s\./g, '.')
        .replace(/\s{2,}/g, ' ')
        .trim();
    };

    // Apply to all narrative fields
    if (narratives.executiveSummary) narratives.executiveSummary = sanitiseNarrative(narratives.executiveSummary);
    if (narratives.positionNarrative) narratives.positionNarrative = sanitiseNarrative(narratives.positionNarrative);
    if (narratives.strengthNarrative) narratives.strengthNarrative = sanitiseNarrative(narratives.strengthNarrative);
    if (narratives.gapNarrative) narratives.gapNarrative = sanitiseNarrative(narratives.gapNarrative);
    if (narratives.opportunityNarrative) narratives.opportunityNarrative = sanitiseNarrative(narratives.opportunityNarrative);
    if (narratives.headline) narratives.headline = sanitiseNarrative(narratives.headline);
    
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.015; // Approximate cost for Opus 4
    const generationTime = Date.now() - startTime;
    
    console.log('[BM Pass 2] Narrative generation complete. Tokens:', tokensUsed, 'Cost: £', cost.toFixed(4));
    
    // Update report with narratives
    const { error: updateError } = await supabaseClient
      .from('bm_reports')
      .update({
        headline: narratives.headline,
        executive_summary: narratives.executiveSummary,
        position_narrative: narratives.positionNarrative,
        strength_narrative: narratives.strengthNarrative,
        gap_narrative: narratives.gapNarrative,
        opportunity_narrative: narratives.opportunityNarrative,
        status: 'generated',
        llm_model: report.llm_model + ' + claude-opus-4',
        llm_tokens_used: (report.llm_tokens_used || 0) + tokensUsed,
        llm_cost: (report.llm_cost || 0) + cost,
        generation_time_ms: (report.generation_time_ms || 0) + generationTime
      })
      .eq('engagement_id', engagementId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Update engagement status
    await supabaseClient
      .from('bm_engagements')
      .update({ 
        status: 'generated',
        generated_at: new Date().toISOString()
      })
      .eq('id', engagementId);
    
    console.log('[BM Pass 2] Report complete!');
    
    // Trigger opportunity analysis (async, don't wait)
    try {
      const baseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      // Fire and forget - opportunity analysis runs in background
      fetch(`${baseUrl}/functions/v1/generate-bm-opportunities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ engagementId }),
      }).then(() => {
        console.log('[BM Pass 2] Triggered opportunity analysis');
      }).catch((err) => {
        console.error('[BM Pass 2] Failed to trigger opportunity analysis:', err);
      });
    } catch (triggerErr) {
      // Don't fail Pass 2 if opportunity trigger fails
      console.error('[BM Pass 2] Error triggering opportunity analysis:', triggerErr);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        engagementId,
        status: 'generated',
        tokensUsed,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BM Pass 2] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

