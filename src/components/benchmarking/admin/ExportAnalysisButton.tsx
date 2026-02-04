import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { ValueAnalysis } from '../../../types/benchmarking';

// =============================================================================
// COMPREHENSIVE BENCHMARKING EXPORT
// =============================================================================
// This component exports ALL analysis data to a markdown file, including:
// - Admin view data (conversation script, risk flags, services, opportunities, valuation)
// - Client view data (narratives, metrics, recommendations)
// - Raw database content for debugging
// - Supabase table reference guide
// =============================================================================

interface ExportAnalysisButtonProps {
  engagementId: string;
  clientId: string;
  clientName: string;
  reportData: any;
  clientData: any;
  founderRisk?: any;
  industryMapping?: any;
  hvaData?: any;
  supplementaryData?: Record<string, any>;
}

// Helper to safely parse JSON
const safeJsonParse = <T,>(value: string | T | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

// Format currency - handles strings and numbers
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value == null || value === '') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  if (Math.abs(num) >= 1_000_000) return `£${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `£${(num / 1_000).toFixed(0)}k`;
  return `£${num.toFixed(0)}`;
};

// Format percentage - handles strings and numbers
const formatPercent = (value: number | string | null | undefined): string => {
  if (value == null || value === '') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  return `${num.toFixed(1)}%`;
};

export function ExportAnalysisButton({
  engagementId,
  clientId,
  clientName,
  reportData,
  clientData,
  founderRisk,
  industryMapping,
  hvaData,
  supplementaryData = {}
}: ExportAnalysisButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToMarkdown = async () => {
    setExporting(true);
    
    try {
      // Fetch additional data from Supabase
      const [
        { data: opportunities },
        { data: serviceConcepts },
        { data: financialData },
        { data: scenarios },
        { data: assessmentData }
      ] = await Promise.all([
        supabase.from('client_opportunities').select('*, service:services(*), concept:service_concepts(*)').eq('engagement_id', engagementId),
        supabase.from('service_concepts').select('*').order('times_identified', { ascending: false }),
        supabase.from('client_financial_data').select('*').eq('client_id', clientId).order('fiscal_year', { ascending: false }),
        supabase.from('bm_client_scenarios').select('*').eq('engagement_id', engagementId),
        supabase.from('bm_assessment_responses').select('*').eq('client_id', clientId).single()
      ]);

      // Parse report data
      const talkingPoints = safeJsonParse(reportData.admin_talking_points, []);
      const questionsToAsk = safeJsonParse(reportData.admin_questions_to_ask, []);
      const dataCollectionScript = safeJsonParse(reportData.admin_data_collection_script, []);
      const nextSteps = safeJsonParse(reportData.admin_next_steps, []);
      const tasks = safeJsonParse(reportData.admin_tasks, []);
      const riskFlags = safeJsonParse(reportData.admin_risk_flags, []);
      const pass1Data = safeJsonParse(reportData.pass1_data, {});
      const metrics = safeJsonParse(reportData.metrics_comparison, []);
      const recommendations = safeJsonParse(reportData.recommendations, []);
      const valueAnalysis: ValueAnalysis | null = reportData.value_analysis || pass1Data?.valueAnalysis || null;

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Build the markdown content
      let md = `# Benchmarking Analysis Export
**Client:** ${clientName}
**Engagement ID:** ${engagementId}
**Client ID:** ${clientId}
**Exported:** ${now}
**Industry:** ${industryMapping?.name || reportData.industry_code || 'Unknown'} (${industryMapping?.code || reportData.industry_code || 'N/A'})

---

`;

      // =======================================================================
      // SECTION 1: EXECUTIVE SUMMARY
      // =======================================================================
      md += `## 1. EXECUTIVE SUMMARY

### Headline
${reportData.headline || 'Not generated'}

### Summary
${reportData.executive_summary || 'Not generated'}

### Key Metrics
| Metric | Value |
|--------|-------|
| Overall Percentile | ${reportData.overall_percentile ? `${reportData.overall_percentile}th` : 'N/A'} |
| Total Annual Opportunity | ${reportData.total_annual_opportunity || 'N/A'} |
| Strength Count | ${reportData.strength_count ?? 'N/A'} |
| Gap Count | ${reportData.gap_count ?? 'N/A'} |
| Founder Risk Level | ${founderRisk?.level || pass1Data?.founderRiskLevel || 'N/A'} |
| Founder Risk Score | ${founderRisk?.score || pass1Data?.founderRiskScore || 'N/A'}/100 |

---

`;

      // =======================================================================
      // SECTION 2: CLIENT FINANCIAL DATA
      // =======================================================================
      md += `## 2. CLIENT FINANCIAL DATA

### Current Year Metrics
| Metric | Value | Source |
|--------|-------|--------|
| Revenue | ${formatCurrency(clientData.revenue)} | Assessment/Accounts |
| Employees | ${clientData.employees || 'N/A'} | Assessment/Accounts |
| Revenue per Employee | ${formatCurrency(clientData.revenuePerEmployee)} | Calculated |
| Gross Margin | ${formatPercent(clientData.grossMargin)} | Accounts |
| Net Margin | ${formatPercent(clientData.netMargin)} | Accounts |
| EBITDA Margin | ${formatPercent(clientData.ebitdaMargin)} | Accounts |
| Debtor Days | ${clientData.debtorDays || 'N/A'} days | Accounts |
| Creditor Days | ${clientData.creditorDays || 'N/A'} days | Accounts |
| Client Concentration (Top 3) | ${clientData.clientConcentration ? `${clientData.clientConcentration}%` : 'N/A'} | Assessment |

### Balance Sheet
| Item | Value |
|------|-------|
| Cash | ${formatCurrency(reportData.balance_sheet?.cash)} |
| Net Assets | ${formatCurrency(reportData.balance_sheet?.net_assets)} |
| Freehold Property | ${formatCurrency(reportData.balance_sheet?.freehold_property)} |

### Surplus Cash Analysis
${reportData.surplus_cash?.hasData ? `
| Item | Value |
|------|-------|
| Actual Cash | ${formatCurrency(reportData.surplus_cash.actualCash)} |
| Required Cash | ${formatCurrency(reportData.surplus_cash.requiredCash)} |
| **Surplus Cash** | ${formatCurrency(reportData.surplus_cash.surplusCash)} |
| Surplus as % Revenue | ${formatPercent(reportData.surplus_cash.surplusAsPercentOfRevenue)} |
| Confidence | ${reportData.surplus_cash.confidence || 'N/A'} |

**Methodology:** ${reportData.surplus_cash.methodology || 'N/A'}

**Narrative:** ${reportData.surplus_cash.narrative || 'N/A'}
` : 'No surplus cash data available'}

### Historical Financials
${financialData && financialData.length > 0 ? `
| Year | Revenue | Gross Margin | EBITDA Margin | Net Margin | Debtor Days | Employees |
|------|---------|--------------|---------------|------------|-------------|-----------|
${financialData.map(f => `| ${f.fiscal_year} | ${formatCurrency(f.revenue)} | ${formatPercent(f.gross_margin_pct)} | ${formatPercent(f.ebitda_margin_pct)} | ${formatPercent(f.net_margin_pct)} | ${f.debtor_days || 'N/A'} | ${f.employee_count || 'N/A'} |`).join('\n')}
` : 'No historical financial data available'}

---

`;

      // =======================================================================
      // SECTION 3: BENCHMARKING METRICS COMPARISON
      // =======================================================================
      md += `## 3. BENCHMARKING METRICS COMPARISON

| Metric | Client Value | 25th %ile | Median | 75th %ile | Percentile | Gap | Annual Impact |
|--------|-------------|-----------|--------|-----------|------------|-----|---------------|
`;
      if (metrics && metrics.length > 0) {
        metrics.forEach((m: any) => {
          const name = m.metricName || m.metric_name || m.metricCode || 'Unknown';
          const clientVal = m.clientValue ?? m.client_value ?? 'N/A';
          const p25 = m.p25 ?? 'N/A';
          const p50 = m.p50 ?? 'N/A';
          const p75 = m.p75 ?? 'N/A';
          const pct = m.percentile ?? 'N/A';
          const gap = m.gap ?? 'N/A';
          const impact = m.annualImpact ?? m.annual_impact;
          md += `| ${name} | ${clientVal} | ${p25} | ${p50} | ${p75} | ${pct} | ${gap} | ${impact ? formatCurrency(impact) : 'N/A'} |\n`;
        });
      } else {
        md += '| No metrics available | | | | | | | |\n';
      }

      md += `\n---\n\n`;

      // =======================================================================
      // SECTION 4: NARRATIVES (CLIENT VIEW)
      // =======================================================================
      md += `## 4. NARRATIVES (Client Report)

### Position Narrative
${reportData.position_narrative || 'Not generated'}

### Strength Narrative
${reportData.strength_narrative || 'Not generated'}

### Gap Narrative
${reportData.gap_narrative || 'Not generated'}

### Opportunity Narrative
${reportData.opportunity_narrative || 'Not generated'}

---

`;

      // =======================================================================
      // SECTION 5: RISK FLAGS
      // =======================================================================
      md += `## 5. RISK FLAGS

`;
      if (riskFlags && riskFlags.length > 0) {
        riskFlags.forEach((flag: any, i: number) => {
          md += `### ${i + 1}. ${flag.title || flag.metric || 'Risk Flag'}
- **Severity:** ${flag.severity || flag.level || 'Unknown'}
- **Value:** ${flag.value || 'N/A'}
- **Message:** ${flag.message || flag.narrative || flag.description || 'N/A'}
- **Recommendation:** ${flag.recommendation || 'N/A'}

`;
        });
      } else {
        md += 'No risk flags identified.\n\n';
      }

      md += `### Founder Risk Assessment
- **Level:** ${founderRisk?.level || pass1Data?.founderRiskLevel || 'N/A'}
- **Score:** ${founderRisk?.score || pass1Data?.founderRiskScore || 'N/A'}/100
- **Valuation Impact:** ${founderRisk?.valuationImpact || pass1Data?.valuationImpact || 'N/A'}
- **Factors:**
${(founderRisk?.factors || []).map((f: string) => `  - ${f}`).join('\n') || '  - None identified'}

---

`;

      // =======================================================================
      // SECTION 6: VALUE ANALYSIS
      // =======================================================================
      md += `## 6. BUSINESS VALUATION ANALYSIS

`;
      if (valueAnalysis) {
        md += `### Baseline Valuation
| Item | Low | Mid | High |
|------|-----|-----|------|
| EBITDA | - | ${formatCurrency(valueAnalysis.baseline.ebitda)} | - |
| EBITDA Margin | - | ${formatPercent(valueAnalysis.baseline.ebitdaMargin)} | - |
| Base Value | ${formatCurrency(valueAnalysis.baseline.baseValue.low)} | ${formatCurrency(valueAnalysis.baseline.baseValue.mid)} | ${formatCurrency(valueAnalysis.baseline.baseValue.high)} |
| Multiple Range | ${valueAnalysis.baseline.multipleRange.low}x | ${valueAnalysis.baseline.multipleRange.mid}x | ${valueAnalysis.baseline.multipleRange.high}x |
| Surplus Cash | - | ${formatCurrency(valueAnalysis.baseline.surplusCash)} | - |
| **Enterprise Value** | ${formatCurrency(valueAnalysis.baseline.enterpriseValue.low)} | ${formatCurrency(valueAnalysis.baseline.enterpriseValue.mid)} | ${formatCurrency(valueAnalysis.baseline.enterpriseValue.high)} |

**Multiple Justification:** ${valueAnalysis.baseline.multipleJustification}

### Value Suppressors (Discounts)
`;
        if (valueAnalysis.suppressors && valueAnalysis.suppressors.length > 0) {
          valueAnalysis.suppressors.forEach((s, i) => {
            md += `
#### ${i + 1}. ${s.name} (${s.severity.toUpperCase()})
- **Category:** ${s.category}
- **HVA Field:** ${s.hvaField}
- **HVA Value:** ${s.hvaValue}
- **Evidence:** ${s.evidence}
- **Discount Range:** ${s.discountPercent.low}% - ${s.discountPercent.high}%
- **Impact Amount:** ${formatCurrency(s.impactAmount.low)} - ${formatCurrency(s.impactAmount.high)}
- **Remediable:** ${s.remediable ? 'Yes' : 'No'}
${s.remediationService ? `- **Remediation Service:** ${s.remediationService}` : ''}
${s.remediationTimeMonths ? `- **Remediation Time:** ${s.remediationTimeMonths} months` : ''}
${s.talkingPoint ? `- **Talking Point:** ${s.talkingPoint}` : ''}
${s.questionToAsk ? `- **Question to Ask:** ${s.questionToAsk}` : ''}
`;
          });
        } else {
          md += 'No suppressors identified.\n';
        }

        md += `
### Aggregate Discount
- **Low:** ${formatPercent(valueAnalysis.aggregateDiscount.percentRange.low)}
- **Mid:** ${formatPercent(valueAnalysis.aggregateDiscount.percentRange.mid)}
- **High:** ${formatPercent(valueAnalysis.aggregateDiscount.percentRange.high)}
- **Methodology:** ${valueAnalysis.aggregateDiscount.methodology}

### Current Market Value
| | Low | Mid | High |
|---|-----|-----|------|
| **Current Value** | ${formatCurrency(valueAnalysis.currentMarketValue.low)} | ${formatCurrency(valueAnalysis.currentMarketValue.mid)} | ${formatCurrency(valueAnalysis.currentMarketValue.high)} |
| **Value Gap** | ${formatCurrency(valueAnalysis.valueGap.low)} | ${formatCurrency(valueAnalysis.valueGap.mid)} | ${formatCurrency(valueAnalysis.valueGap.high)} |

**Value Gap Percent:** ${formatPercent(valueAnalysis.valueGapPercent)}

### Exit Readiness
- **Score:** ${valueAnalysis.exitReadiness.score}/100
- **Verdict:** ${valueAnalysis.exitReadiness.verdict}
- **Blockers:** ${valueAnalysis.exitReadiness.blockers.length > 0 ? valueAnalysis.exitReadiness.blockers.join(', ') : 'None'}
- **Strengths:** ${valueAnalysis.exitReadiness.strengths.length > 0 ? valueAnalysis.exitReadiness.strengths.join(', ') : 'None'}

### Path to Value
- **Timeframe:** ${valueAnalysis.pathToValue.timeframeMonths} months
- **Recoverable Value (Mid):** ${formatCurrency(valueAnalysis.pathToValue.recoverableValue.mid)}
- **Key Actions:** ${valueAnalysis.pathToValue.keyActions.join(', ') || 'None specified'}

### Value Enhancers
`;
        if (valueAnalysis.enhancers && valueAnalysis.enhancers.length > 0) {
          valueAnalysis.enhancers.forEach((e, i) => {
            md += `${i + 1}. **${e.name}** (${e.impact}) - ${e.evidence}\n`;
          });
        } else {
          md += 'No enhancers identified.\n';
        }
      } else {
        md += 'Value analysis not yet generated. Regenerate the report to calculate business valuation.\n';
      }

      md += `\n---\n\n`;

      // =======================================================================
      // SECTION 7: OPPORTUNITIES (from generate-bm-opportunities)
      // =======================================================================
      md += `## 7. IDENTIFIED OPPORTUNITIES

`;
      if (opportunities && opportunities.length > 0) {
        opportunities.forEach((opp: any, i: number) => {
          md += `### ${i + 1}. ${opp.title} (${opp.opportunity_code})
- **Category:** ${opp.category}
- **Severity:** ${opp.severity}
- **Financial Impact:** ${formatCurrency(opp.financial_impact_amount)}
- **Data Evidence:** ${opp.data_evidence || 'N/A'}
- **Talking Point:** ${opp.talking_point || 'N/A'}
- **Question to Ask:** ${opp.question_to_ask || 'N/A'}
- **Quick Win:** ${opp.quick_win || 'N/A'}
- **Life Impact:** ${opp.life_impact || 'N/A'}

**Recommended Service:** ${opp.service?.name || 'None mapped'}
${opp.service ? `  - Price: ${opp.service.price_from ? `£${opp.service.price_from}` : 'Contact'} - ${opp.service.price_to ? `£${opp.service.price_to}` : ''} ${opp.service.price_unit || ''}` : ''}

**New Service Concept:** ${opp.concept?.suggested_name || 'None'}
${opp.concept ? `  - Problem it solves: ${opp.concept.problem_it_solves || 'N/A'}` : ''}

`;
        });
      } else {
        md += 'No opportunities identified yet. Click "Regenerate Analysis" in the Opportunities tab.\n\n';
      }

      md += `---\n\n`;

      // =======================================================================
      // SECTION 7B: RECOMMENDED SERVICES SUMMARY (Full Details)
      // =======================================================================
      const servicesWithDetails = opportunities?.filter((o: any) => o.service) || [];
      const uniqueServices = new Map<string, any>();
      servicesWithDetails.forEach((opp: any) => {
        if (opp.service?.code && !uniqueServices.has(opp.service.code)) {
          uniqueServices.set(opp.service.code, {
            service: opp.service,
            opportunities: [opp]
          });
        } else if (opp.service?.code) {
          uniqueServices.get(opp.service.code)!.opportunities.push(opp);
        }
      });

      if (uniqueServices.size > 0) {
        md += `## 7B. RECOMMENDED SERVICES SUMMARY

Based on the analysis above, we recommend the following services to address the identified issues:

`;
        let serviceIdx = 1;
        uniqueServices.forEach((entry: any) => {
          const svc = entry.service;
          const opps = entry.opportunities;
          const totalImpact = opps.reduce((sum: number, o: any) => sum + (o.financial_impact_amount || 0), 0);
          
          md += `### ${serviceIdx}. ${svc.name}
**Code:** ${svc.code}
**Category:** ${svc.category || 'General'}
**Price:** ${svc.price_from ? `£${svc.price_from.toLocaleString()}` : 'Contact'} - ${svc.price_to ? `£${svc.price_to.toLocaleString()}` : ''} ${svc.price_unit || ''}
**Typical Duration:** ${svc.typical_duration || 'Varies by scope'}

**Headline:** ${svc.headline || 'N/A'}

**Description:** ${svc.description || 'Contact for details'}

`;
          // Deliverables
          if (svc.deliverables && svc.deliverables.length > 0) {
            md += `**What You'll Receive:**
`;
            svc.deliverables.forEach((d: string) => {
              md += `- ${d}
`;
            });
            md += `
`;
          }

          // Why recommended
          md += `**Why This Service Is Recommended:**
This service directly addresses ${opps.length} identified ${opps.length === 1 ? 'issue' : 'issues'}:
`;
          opps.forEach((opp: any) => {
            md += `- **${opp.severity?.toUpperCase() || 'MEDIUM'}:** ${opp.title}${opp.financial_impact_amount ? ` (£${opp.financial_impact_amount.toLocaleString()} impact)` : ''}
`;
          });
          
          if (opps[0].service_fit_rationale) {
            md += `
**Service Fit Rationale:** ${opps[0].service_fit_rationale}
`;
          }

          if (totalImpact > 0) {
            md += `
**Combined Potential Impact:** £${totalImpact.toLocaleString()}
`;
          }

          md += `
---

`;
          serviceIdx++;
        });
      }

      // =======================================================================
      // SECTION 8: ADMIN CONVERSATION SCRIPT
      // =======================================================================
      md += `## 8. ADMIN CONVERSATION SCRIPT

### Opening Statement
${reportData.admin_opening_statement || 'Not generated'}

### Talking Points
${talkingPoints.length > 0 ? talkingPoints.map((p: any, i: number) => `${i + 1}. **${p.topic || p.title || 'Point'}**: ${p.content || p.script || p.message || JSON.stringify(p)}`).join('\n') : 'None'}

### Questions to Ask
${questionsToAsk.length > 0 ? questionsToAsk.map((q: any, i: number) => `${i + 1}. ${q.question || q.content || q}`).join('\n') : 'None'}

### Data Collection Script
${dataCollectionScript.length > 0 ? dataCollectionScript.map((d: any, i: number) => `${i + 1}. **${d.metric || d.field || 'Item'}**: ${d.question || d.script || d.prompt || JSON.stringify(d)}`).join('\n') : 'None'}

### Closing Script
${reportData.admin_closing_script || 'Not generated'}

---

`;

      // =======================================================================
      // SECTION 9: RECOMMENDATIONS
      // =======================================================================
      md += `## 9. RECOMMENDATIONS

`;
      if (recommendations && recommendations.length > 0) {
        recommendations.forEach((rec: any, i: number) => {
          md += `### ${i + 1}. ${rec.title || rec.action || 'Recommendation'}
- **Priority:** ${rec.priority || 'N/A'}
- **Impact:** ${rec.impact || 'N/A'}
- **Timeframe:** ${rec.timeframe || 'N/A'}
- **Description:** ${rec.description || rec.rationale || rec.content || JSON.stringify(rec)}

`;
        });
      } else {
        md += 'No recommendations generated.\n\n';
      }

      md += `---\n\n`;

      // =======================================================================
      // SECTION 10: NEXT STEPS & TASKS
      // =======================================================================
      md += `## 10. NEXT STEPS & TASKS

### Next Steps
${nextSteps.length > 0 ? nextSteps.map((n: any, i: number) => `${i + 1}. ${n.step || n.action || n.title || n}`).join('\n') : 'None'}

### Tasks
${tasks.length > 0 ? tasks.map((t: any) => `- [ ] ${t.task || t.description || t.title || t}`).join('\n') : 'None'}

---

`;

      // =======================================================================
      // SECTION 11: HVA RESPONSES
      // =======================================================================
      md += `## 11. HIDDEN VALUE AUDIT (HVA) RESPONSES

`;
      if (hvaData?.responses) {
        md += '| Question/Field | Response |\n|----------------|----------|\n';
        Object.entries(hvaData.responses).forEach(([key, value]) => {
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
          md += `| ${key.replace(/_/g, ' ')} | ${displayValue} |\n`;
        });
      } else {
        md += 'No HVA responses recorded.\n';
      }

      md += `\n---\n\n`;

      // =======================================================================
      // SECTION 12: SUPPLEMENTARY DATA
      // =======================================================================
      md += `## 12. SUPPLEMENTARY DATA (Practitioner Collected)

`;
      if (Object.keys(supplementaryData).length > 0) {
        md += '| Field | Value |\n|-------|-------|\n';
        Object.entries(supplementaryData).forEach(([key, value]) => {
          md += `| ${key} | ${value} |\n`;
        });
      } else {
        md += 'No supplementary data collected.\n';
      }

      md += `\n---\n\n`;

      // =======================================================================
      // SECTION 13: SAVED SCENARIOS
      // =======================================================================
      md += `## 13. SAVED SCENARIOS

`;
      if (scenarios && scenarios.length > 0) {
        scenarios.forEach((s: any, i: number) => {
          md += `### Scenario ${i + 1}: ${s.name || 'Unnamed'}
- **Gross Margin Change:** ${s.gross_margin_change}%
- **Revenue per Employee Change:** ${s.rev_per_employee_change}%
- **Debtor Days Change:** ${s.debtor_days_change} days
- **Client Concentration Change:** ${s.client_concentration_change}%
- **Projected GP Change:** ${formatCurrency(s.projected_gp_change)}
- **Created:** ${s.created_at}

`;
        });
      } else {
        md += 'No scenarios saved.\n\n';
      }

      md += `---\n\n`;

      // =======================================================================
      // SECTION 14: SERVICE CONCEPTS (NEW IDEAS)
      // =======================================================================
      md += `## 14. NEW SERVICE CONCEPTS IDENTIFIED

`;
      if (serviceConcepts && serviceConcepts.length > 0) {
        serviceConcepts.forEach((c: any, i: number) => {
          md += `### ${i + 1}. ${c.suggested_name}
- **Problem it Solves:** ${c.problem_it_solves || 'N/A'}
- **Times Identified:** ${c.times_identified}
- **Total Opportunity Value:** ${formatCurrency(c.total_opportunity_value)}
- **Review Status:** ${c.review_status}

`;
        });
      } else {
        md += 'No new service concepts identified yet.\n\n';
      }

      md += `---\n\n`;

      // =======================================================================
      // SECTION 15: DATA SOURCES
      // =======================================================================
      md += `## 15. DATA SOURCES & BENCHMARK INFORMATION

### Data Sources Used
${(reportData.data_sources || []).map((s: string) => `- ${s}`).join('\n') || '- None recorded'}

### Benchmark Data As Of
${reportData.benchmark_data_as_of || 'Not recorded'}

### Benchmark Sources Detail
${reportData.benchmark_sources_detail ? `
- **Total Metrics:** ${reportData.benchmark_sources_detail.totalMetrics || 'N/A'}
- **Live Search Count:** ${reportData.benchmark_sources_detail.liveSearchCount || 0}
- **Manual Data Count:** ${reportData.benchmark_sources_detail.manualDataCount || 0}
- **Overall Confidence:** ${reportData.benchmark_sources_detail.overallConfidence || 'N/A'}%
- **Market Context:** ${reportData.benchmark_sources_detail.marketContext || 'N/A'}
- **Data Quality Notes:** ${reportData.benchmark_sources_detail.dataQualityNotes || 'N/A'}
` : 'No detailed source information available.'}

---

`;

      // =======================================================================
      // SECTION 16: DATABASE REFERENCE
      // =======================================================================
      md += `## 16. SUPABASE DATABASE REFERENCE

### Core Tables for Benchmarking Data

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| \`bm_reports\` | Main report storage | headline, executive_summary, metrics_comparison, pass1_data, value_analysis, surplus_cash, founder_risk_* |
| \`bm_engagements\` | Links clients to benchmarking | client_id, practice_id, status, started_at |
| \`bm_assessment_responses\` | Client assessment answers | responses (JSONB), industry_code |
| \`bm_metric_comparisons\` | Per-metric comparisons | metric_code, client_value, p25, p50, p75, percentile, annual_impact |
| \`bm_client_scenarios\` | Saved "what-if" scenarios | scenario data, projected outcomes |

### Client Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| \`client_accounts_uploads\` | Uploaded account files | file_name, status, fiscal_year, extraction_confidence |
| \`client_financial_data\` | Extracted financial data | fiscal_year, revenue, margins, debtor_days, etc. |
| \`clients\` | Client master data | name, sic_code, business_description |

### Opportunity & Service Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| \`client_opportunities\` | AI-identified opportunities | title, category, severity, financial_impact_amount, talking_point, life_impact |
| \`services\` | Service catalogue | code, name, headline, price_from, price_to, deliverables |
| \`service_concepts\` | New service ideas | suggested_name, problem_it_solves, times_identified |
| \`issue_service_mappings\` | Issue to service mappings | issue_code, service_code, rationale |

### HVA Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| \`hva_assessments\` | HVA responses | responses (JSONB), assessment_type |

### Benchmark Reference Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| \`industries\` | Industry definitions | code, name, description |
| \`industry_benchmarks\` / \`benchmark_data\` | Benchmark values | industry_code, metric_code, p25, p50, p75 |

---

`;

      // =======================================================================
      // SECTION 17: RAW DATABASE CONTENT
      // =======================================================================
      md += `## 17. RAW DATABASE CONTENT (For Debugging)

### pass1_data (JSONB from bm_reports)
\`\`\`json
${JSON.stringify(pass1Data, null, 2)}
\`\`\`

### metrics_comparison (JSONB from bm_reports)
\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

### value_analysis (JSONB from bm_reports)
\`\`\`json
${JSON.stringify(valueAnalysis, null, 2)}
\`\`\`

### surplus_cash (JSONB from bm_reports)
\`\`\`json
${JSON.stringify(reportData.surplus_cash, null, 2)}
\`\`\`

### HVA Responses (JSONB)
\`\`\`json
${JSON.stringify(hvaData?.responses || {}, null, 2)}
\`\`\`

### Assessment Data
\`\`\`json
${JSON.stringify(assessmentData, null, 2)}
\`\`\`

### Client Opportunities (from client_opportunities table)
\`\`\`json
${JSON.stringify(opportunities, null, 2)}
\`\`\`

---

*Export generated by Torsor Practice Platform*
*For support: support@torsor.co.uk*
`;

      // Download the file
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_benchmarking_export_${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportToMarkdown}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export Full Analysis
        </>
      )}
    </button>
  );
}

