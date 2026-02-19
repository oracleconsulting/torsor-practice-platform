/**
 * Generate Benchmarking Report PDF
 * 
 * Uses Puppeteer (via cloud browser service) to render HTML templates to PDF
 * Supports Tier 1 (Insight) and Tier 2 (Clarity) reports with customizable sections
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// TYPES
// =============================================================================

interface SectionConfig {
  id: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface PdfSettings {
  pageSize: 'A4' | 'Letter';
  margins: { top: number; right: number; bottom: number; left: number };
  headerFooter: boolean;
  coverPage: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
}

interface PdfConfig {
  sections: SectionConfig[];
  pdfSettings: PdfSettings;
  tier: 1 | 2;
}

// =============================================================================
// SECTION RENDERERS
// =============================================================================

const RPGCC_COLORS = {
  navyDark: '#0f172a',
  navy: '#1e293b',
  blueLight: '#94a3b8',
  teal: '#0d9488',
  tealLight: '#14b8a6',
  orange: '#f59e0b',
  red: '#dc2626',
  green: '#059669',
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `£${Math.round(value / 1000)}k`;
  return `£${Math.round(value)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Normalize any suppressor to a common display format (handles enhanced + value_analysis structures)
function normalizeSuppressor(s: any): {
  name: string; severity: string; evidence: string; whyThisDiscount: string; currentLabel: string; targetLabel: string;
  discountPercent: number; discountValue: number; waterfallAmount: number; recoveryValue: number; recoveryTimeframe: string; pathToFixSummary: string;
  pathToFixSteps: string[]; investment: string | number | null; roi: string | null; dependencies: string | null;
} {
  const pathToFix = s.pathToFix || {};
  const steps = Array.isArray(pathToFix.steps) ? pathToFix.steps : [];
  const investment = pathToFix.estimatedInvestment ?? pathToFix.investment ?? null;
  const recoveryVal = s.recovery?.valueRecoverable ?? 0;
  const invNum = typeof investment === 'string' ? parseFloat(String(investment).replace(/[^\d.-]/g, '')) : Number(investment);
  const roi = invNum > 0 && recoveryVal > 0 ? `${Math.round(recoveryVal / invNum)}x` : (pathToFix.roi ?? null);
  const deps = pathToFix.dependencies;
  const dependencies = deps == null ? null : Array.isArray(deps) ? deps.join('; ') : String(deps);

  const waterfallAmt = s.waterfallAmount ?? s.current?.waterfallAmount ?? 0;

  // Already in enhanced format
  if (s.current && typeof s.current === 'object' && (s.current.value !== undefined || s.current.discountValue !== undefined)) {
    const currVal = s.current.value;
    const currMetric = s.current.metric || '';
    const targVal = s.target?.value;
    const targMetric = s.target?.metric || '';
    return {
      name: s.name || 'Unknown',
      severity: (s.severity || 'medium').toUpperCase(),
      evidence: s.evidence || '',
      whyThisDiscount: s.whyThisDiscount || '',
      currentLabel: (typeof currVal === 'string' || typeof currVal === 'number' ? `${currVal} ${currMetric}`.trim() : currMetric || '—') || '—',
      targetLabel: (targVal !== undefined && targVal !== null && typeof targVal !== 'object' ? `${targVal} ${targMetric}`.trim() : targMetric || '') || 'Improved',
      discountPercent: s.current.discountPercent || 0,
      discountValue: s.current.discountValue || 0,
      waterfallAmount: waterfallAmt,
      recoveryValue: recoveryVal,
      recoveryTimeframe: s.recovery?.timeframe || '',
      pathToFixSummary: pathToFix.summary || '',
      pathToFixSteps: steps,
      investment: investment,
      roi: roi,
      dependencies: dependencies,
    };
  }
  // Value analysis format
  const midDiscount = s.discountPercent
    ? (typeof s.discountPercent === 'object' ? ((s.discountPercent.low || 0) + (s.discountPercent.high || 0)) / 2 : s.discountPercent)
    : 0;
  const midImpact = s.impactAmount
    ? (typeof s.impactAmount === 'object' ? ((s.impactAmount.low || 0) + (s.impactAmount.high || 0)) / 2 : s.impactAmount)
    : 0;
  return {
    name: s.name || 'Unknown',
    severity: (s.severity || 'medium').toUpperCase(),
    evidence: s.evidence || '',
    whyThisDiscount: s.whyThisDiscount || s.talkingPoint || '',
    currentLabel: s.evidence || s.hvaValue || '—',
    targetLabel: s.remediationService ? `Fixable via ${s.remediationService}` : '',
    discountPercent: Math.round(midDiscount),
    discountValue: Math.round(midImpact),
    waterfallAmount: waterfallAmt,
    recoveryValue: 0,
    recoveryTimeframe: s.remediationTimeMonths ? `${s.remediationTimeMonths} months` : '',
    pathToFixSummary: s.remediationService || '',
    pathToFixSteps: steps,
    investment: investment,
    roi: roi,
    dependencies: dependencies,
  };
}

function normalizeSuppressorKey(s: any): string {
  const raw = (s.code || s.id || s.category || s.name || '').toLowerCase();
  if (raw.includes('concentrat') || raw.includes('customer')) return 'concentration';
  if (raw.includes('founder') || raw.includes('knowledge') || raw.includes('dependency')) return 'founder';
  if (raw.includes('succession')) return 'succession';
  if (raw.includes('predictab') || raw.includes('recurring') || raw.includes('revenue_predict')) return 'revenue_predictability';
  if (raw.includes('document') || raw.includes('undocumented') || raw.includes('ip_process')) return 'documentation';
  return raw.replace(/[\s\/&]+/g, '_');
}

// Cover Page
function renderCover(data: any, config: any): string {
  const logoUrl = data.siteUrl ? `${data.siteUrl}/logos/rpgcc-logo-light.png` : null;
  return `
    <div class="page cover-page">
      <div class="cover-header">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="RPGCC" class="logo-img" />`
          : '<div class="logo">RPGCC</div>'}
        <div class="tagline">Chartered Accountants, Auditors, Tax & Business Advisers</div>
      </div>
      <div class="cover-content">
        <div class="report-type">BENCHMARKING ${data.tier === 1 ? 'INSIGHT' : 'CLARITY'} REPORT</div>
        <h1 class="cover-title">Company Benchmarking Analysis</h1>
        <div class="client-name">${data.clientName || 'Client'}</div>
        <div class="report-date">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div class="hero-box">
          <div class="hero-value">${data.overallPercentile || 50}th</div>
          <div class="hero-label">Overall Percentile</div>
        </div>
      </div>
      <div class="cover-footer">
        <p>Confidential · Prepared exclusively for ${data.clientName || 'Client'}</p>
        <p>RPG Crouch Chapman LLP · Registered to carry on audit work by ICAEW</p>
      </div>
    </div>
  `;
}

// Executive Summary
function renderExecutiveSummary(data: any, config: any): string {
  const showHero = config.showHeroMetrics !== false;
  const totalOpp = data.totalOpportunity || data.annualOpportunity || 0;
  const pct = data.overallPercentile || 55;
  const heroCaption = (data.headline || data.executiveSummaryHeadline || data.opportunityNarrative || '').substring(0, 200);
  
  return `
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      ${showHero ? `
        <div class="hero-metrics">
          <div class="hero-metric">
            <div class="metric-value teal">${pct}th</div>
            <div class="metric-label">Overall Percentile</div>
          </div>
          <div class="hero-metric">
            <div class="metric-value teal">${formatCurrency(totalOpp)}</div>
            <div class="metric-label">Annual Opportunity</div>
          </div>
          <div class="hero-metric">
            <div class="metric-value green">${formatCurrency(data.surplusCash || 0)}</div>
            <div class="metric-label">Surplus Cash</div>
          </div>
        </div>
      ` : ''}
      <div class="narrative-text">${data.executiveSummary || ''}</div>
      ${showHero && totalOpp > 0 ? `
        <div class="hero-opportunity">
          <div class="hero-label">ANNUAL OPPORTUNITY IDENTIFIED</div>
          <div class="hero-amount">${formatCurrency(totalOpp)}</div>
          ${heroCaption ? `<div class="hero-caption">${heroCaption}</div>` : ''}
          <div class="hero-percentile-bar">
            <div class="hero-bar-fill" style="left: ${Math.min(Math.max(pct, 2), 98)}%"></div>
          </div>
          <div class="hero-percentile-label">${pct}th Percentile · ${pct >= 50 ? 'Above Median' : 'Below Median'}</div>
        </div>
      ` : ''}
    </div>
  `;
}

// Surplus Cash Breakdown
function renderSurplusCashBreakdown(data: any, config: any): string {
  const sc = data.surplusCashBreakdown;
  if (!sc || sc.actualCash == null) return '';

  const c = sc.components || {};
  const netWC = c.netWorkingCapital ?? 0;
  const isNegativeWC = netWC < 0;

  return `
    <div class="section surplus-cash-section">
      <div class="surplus-hero">
        <h2>Surplus Cash Identified</h2>
        <p class="surplus-subtitle">Cash above operating requirements</p>
        <div class="surplus-amount">${formatCurrency(sc.surplusCash || 0)}</div>
        <span class="surplus-pct">(${(sc.surplusAsPercentOfRevenue || 0).toFixed(1)}% of revenue)</span>
        ${isNegativeWC ? `<div class="surplus-bonus">Bonus: Suppliers fund ${formatCurrency(Math.abs(netWC))} of your working capital</div>` : ''}
      </div>

      <table class="surplus-table">
        <tbody>
          <tr><td>Cash at bank</td><td class="amount">${formatCurrency(sc.actualCash)}</td></tr>
          <tr><td>Less: 3-month operating buffer</td><td class="amount negative">(${formatCurrency(c.operatingBuffer || 0)})</td></tr>
          <tr><td>Less: Working capital requirement</td><td class="amount negative">(${formatCurrency(c.workingCapitalRequirement || 0)})</td></tr>
          <tr class="surplus-total"><td><strong>Surplus available</strong></td><td class="amount positive"><strong>${formatCurrency(sc.surplusCash || 0)}</strong></td></tr>
        </tbody>
      </table>

      ${(c.debtors || c.creditors) ? `
        <div class="wc-breakdown">
          <h4>Working Capital Components</h4>
          <table class="surplus-table small">
            <tbody>
              <tr><td>Debtors (cash owed to you)</td><td class="amount">+${formatCurrency(c.debtors || 0)}</td></tr>
              <tr><td>Stock</td><td class="amount">+${formatCurrency(c.stock || 0)}</td></tr>
              <tr><td>Creditors (you owe them)</td><td class="amount negative">-${formatCurrency(c.creditors || 0)}</td></tr>
              <tr class="wc-total"><td>Net working capital</td><td class="amount ${netWC < 0 ? 'negative' : ''}">${netWC < 0 ? '-' : '+'}${formatCurrency(Math.abs(netWC))}</td></tr>
            </tbody>
          </table>
          ${isNegativeWC ? `
            <div class="wc-explanation">
              <strong>Why negative is good:</strong> Your creditors (suppliers) are funding your operations. You collect from customers faster than you pay suppliers. This is free working capital.
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="surplus-methodology">
        <strong>Methodology:</strong> ${sc.methodology || ''}<br>
        <strong>Confidence:</strong> ${sc.confidence || 'medium'}
      </div>
    </div>
  `;
}

// Hidden Value Section
function renderHiddenValue(data: any, config: any): string {
  if (!data.surplusCash && !data.freeholdProperty) return '';
  
  return `
    <div class="section highlight-section green">
      <h2 class="section-title">Hidden Value Identified</h2>
      <p class="intro-text">Beyond your operating performance, we've identified assets that sit outside normal earnings-based valuations:</p>
      <div class="value-grid">
        ${data.surplusCash ? `
          <div class="value-card">
            <div class="value-amount">${formatCurrency(data.surplusCash)}</div>
            <div class="value-label">Surplus Cash</div>
            <div class="value-detail">Above operating requirements</div>
          </div>
        ` : ''}
        ${data.freeWorkingCapital ? `
          <div class="value-card">
            <div class="value-amount">${formatCurrency(data.freeWorkingCapital)}</div>
            <div class="value-label">Free Working Capital</div>
            <div class="value-detail">Suppliers funding your operations</div>
          </div>
        ` : ''}
        ${data.freeholdProperty ? `
          <div class="value-card">
            <div class="value-amount">${formatCurrency(data.freeholdProperty)}</div>
            <div class="value-label">Property Value</div>
            <div class="value-detail">Freehold assets on balance sheet</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Key Metrics - aligned with actual metrics_comparison JSONB structure
function renderKeyMetrics(data: any, config: any): string {
  const metrics = data.metrics || [];
  const layout = config.layout || 'detailed';
  
  // Format detection from metricCode - matches browser's getMetricFormat()
  function getMetricFormat(metricCode: string): 'currency' | 'percent' | 'number' | 'days' {
    if (!metricCode) return 'number';
    const code = metricCode.toLowerCase();
    if (code.includes('days') || code.includes('debtor') || code.includes('creditor')) return 'days';
    if (code.includes('margin') || code.includes('rate') || code.includes('utilisation') || 
        code.includes('concentration') || code.includes('growth') || code.includes('retention') || 
        code.includes('turnover') || code.includes('percentage') || code.includes('pct') || 
        code.includes('ratio')) return 'percent';
    if (code.includes('revenue') || code.includes('profit') || code.includes('ebitda') || 
        code.includes('hourly') || code.includes('salary') || code.includes('cost') || 
        code.includes('fee') || code.includes('price') || code.includes('value') || 
        code.includes('per_employee')) return 'currency';
    return 'number';
  }

  // Filter out concentration metrics (shown in risk section) and metrics without valid benchmarks
  const filteredMetrics = metrics.filter((m: any) => {
    const code = (m.metricCode || m.metric_code || '').toLowerCase();
    if (code.includes('concentration')) return false;
    const p50 = m.p50 ?? m.median ?? null;
    if (p50 == null || p50 === 0) return false;
    return true;
  });

  if (filteredMetrics.length === 0) return '';

  return `
    <div class="section">
      <h2 class="section-title">Key Metrics</h2>
      <p class="section-subtitle">How you compare to industry benchmarks</p>
      <div class="metrics-grid ${layout}">
        ${filteredMetrics.map((m: any) => {
          const metricCode = (m.metricCode || m.metric_code || '').toLowerCase();
          const fmt = getMetricFormat(metricCode);
          const clientVal = Number(m.clientValue ?? m.client_value ?? m.value ?? 0);
          const medianVal = Number(m.p50 ?? m.median ?? 0);
          
          // Round gap to 1 decimal to avoid floating point issues
          const gap = Math.round((clientVal - medianVal) * 10) / 10;
          const absGap = Math.abs(gap);
          
          // Higher is better for most metrics, except days
          const higherIsBetter = !(metricCode.includes('days') || metricCode.includes('debtor') || 
            metricCode.includes('creditor') || metricCode.includes('turnover'));
          const isGap = higherIsBetter ? clientVal < medianVal : clientVal > medianVal;
          
          // Format display values
          const formatDisplay = (val: number): string => {
            switch (fmt) {
              case 'currency':
                if (Math.abs(val) >= 1000000) return `£${(val / 1000000).toFixed(1)}M`;
                if (Math.abs(val) >= 1000) return `£${Math.round(val).toLocaleString()}`;
                return `£${Math.round(val)}`;
              case 'percent': return `${Math.round(val * 10) / 10}%`;
              case 'days': return `${Math.round(val)} days`;
              default: return `${Math.round(val * 10) / 10}`;
            }
          };

          const p25Val = Number(m.p25 ?? m.benchmark_p25 ?? m.p50 ?? 0);
          const p75Val = Number(m.p75 ?? m.benchmark_p75 ?? m.p50 ?? 0);

          // Smart scale bounds matching web client
          const minVal = Math.min(clientVal, p25Val);
          const maxVal = Math.max(clientVal, p75Val);
          const scaleRange_raw = maxVal - minVal;
          const padding = scaleRange_raw * 0.15;
          let roundTo: number;
          if (fmt === 'percent') roundTo = scaleRange_raw > 50 ? 10 : 5;
          else if (fmt === 'days') roundTo = scaleRange_raw > 50 ? 10 : 5;
          else roundTo = scaleRange_raw > 100000 ? 10000 : scaleRange_raw > 10000 ? 5000 : scaleRange_raw > 1000 ? 500 : 100;

          let scaleMin = Math.floor((minVal - padding) / roundTo) * roundTo;
          let scaleMax = Math.ceil((maxVal + padding) / roundTo) * roundTo;
          if ((fmt === 'percent' || fmt === 'days') && scaleMin < 0) scaleMin = 0;
          const scaleRangeCalc = scaleMax - scaleMin || 1;

          const clientPos = Math.min(Math.max(((clientVal - scaleMin) / scaleRangeCalc) * 100, 2), 98);
          const medianPos = Math.min(Math.max(((medianVal - scaleMin) / scaleRangeCalc) * 100, 2), 98);
          const p25Pos = ((p25Val - scaleMin) / scaleRangeCalc) * 100;
          const p75Pos = ((p75Val - scaleMin) / scaleRangeCalc) * 100;

          const pctile = m.percentile || 50;
          const hasValidPercentile = pctile > 0;
          const pctileNum = Math.round(pctile);
          let suffix = 'th';
          if (pctileNum % 100 >= 11 && pctileNum % 100 <= 13) suffix = 'th';
          else if (pctileNum % 10 === 1) suffix = 'st';
          else if (pctileNum % 10 === 2) suffix = 'nd';
          else if (pctileNum % 10 === 3) suffix = 'rd';
          
          // Gap text
          let gapText = '';
          let gapClass = '';
          if (absGap < 0.05) {
            gapText = 'At median';
            gapClass = 'neutral';
          } else if (isGap) {
            const gapDisplay = fmt === 'currency' ? formatCurrency(absGap) : 
              fmt === 'days' ? `${Math.round(absGap)} days` :
              fmt === 'percent' ? `${absGap.toFixed(1)}%` : absGap.toFixed(1);
            gapText = `-${gapDisplay} GAP`;
            gapClass = 'gap';
          } else {
            const advDisplay = fmt === 'currency' ? formatCurrency(absGap) :
              fmt === 'days' ? `${Math.round(absGap)} days` :
              fmt === 'percent' ? `${absGap.toFixed(1)}%` : absGap.toFixed(1);
            gapText = `+${advDisplay} ADVANTAGE`;
            gapClass = 'advantage';
          }

          const displayName = m.metricName || m.metric_name || m.name || m.metric || 'Metric';
          const displayValue = formatDisplay(clientVal);
          const displayMedian = formatDisplay(medianVal);

          return `
            <div class="metric-card ${gapClass}">
              <div class="metric-header">
                <span class="metric-name">${displayName}</span>
                <span class="metric-percentile">${hasValidPercentile ? pctileNum + suffix + ' percentile' : '<em style="color:#94a3b8">Benchmark data limited</em>'}</span>
              </div>
              
              <!-- Visual Bar -->
              <div class="metric-bar-area">
                <div class="bar-track-rich">
                  <div class="bar-iqr" style="left: ${p25Pos}%; width: ${Math.max(0, p75Pos - p25Pos)}%"></div>
                  <div class="bar-median-line" style="left: ${medianPos}%"></div>
                  <div class="bar-client-marker ${gapClass}" style="left: ${clientPos}%">
                    ${isGap ? '↘' : '↗'}
                  </div>
                </div>
                <div class="bar-scale-labels">
                  <span>${formatDisplay(scaleMin)}</span>
                  <span>P25: ${formatDisplay(p25Val)}</span>
                  <span>Median: ${formatDisplay(medianVal)}</span>
                  <span>P75: ${formatDisplay(p75Val)}</span>
                  <span>${formatDisplay(scaleMax)}</span>
                </div>
              </div>
              
              <!-- Value Comparison Footer -->
              <div class="metric-footer">
                <div class="mf-item">
                  <div class="mf-value">${displayValue}</div>
                  <div class="mf-label">YOUR VALUE</div>
                </div>
                <div class="mf-arrow">→</div>
                <div class="mf-item">
                  <div class="mf-value mf-median">${displayMedian}</div>
                  <div class="mf-label">MEDIAN</div>
                </div>
                <div class="mf-arrow">→</div>
                <div class="mf-item">
                  <div class="mf-value ${gapClass === 'gap' ? 'mf-gap' : gapClass === 'advantage' ? 'mf-advantage' : ''}">${gapText}</div>
                  <div class="mf-label">${absGap < 0.05 ? '' : isGap ? 'GAP' : 'ADVANTAGE'}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Narrative Section (generic)
function renderNarrative(title: string, content: string, highlights?: string[]): string {
  if (!content) return '';
  
  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      ${highlights ? `
        <div class="highlights">
          ${highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
        </div>
      ` : ''}
      <div class="narrative-text">${content}</div>
    </div>
  `;
}

// Compact continuation narrative — uses h3 subheading instead of full section with h2+border
// Saves ~28px per block vs renderNarrative (no section margin, no border, smaller title)
function renderNarrativeContinuation(title: string, content: string, highlights?: string[]): string {
  if (!content) return '';
  
  return `
    <div class="narrative-continuation">
      <h3 class="subsection-heading">${title}</h3>
      ${highlights ? `
        <div class="highlights compact">
          ${highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
        </div>
      ` : ''}
      <div class="narrative-text">${content}</div>
    </div>
  `;
}

// Recommendations
function renderRecommendations(data: any, config: any): string {
  const rawRecommendations = data.recommendations || [];
  const heroTotal = data.totalOpportunity || 0;

  // Normalize annualValues to sum to hero total (same as BenchmarkingClientReport.tsx)
  let recommendations = rawRecommendations;
  if (rawRecommendations.length > 0 && heroTotal > 0) {
    const currentSum = rawRecommendations.reduce(
      (sum: number, rec: any) => sum + (rec.annualValue || 0),
      0
    );
    if (currentSum > 0 && Math.abs(currentSum - heroTotal) / heroTotal > 0.05) {
      const scaleFactor = heroTotal / currentSum;
      recommendations = rawRecommendations.map((rec: any) => ({
        ...rec,
        annualValue: Math.round((rec.annualValue || 0) * scaleFactor),
      }));
    }
  }

  const detailLevel = config.detailLevel || 'standard';
  const showSteps = config.showImplementationSteps !== false && detailLevel === 'full';
  const showStartWeek = config.showStartThisWeek !== false && detailLevel === 'full';
  
  return `
    <div class="section">
      <h2 class="section-title">Recommendations</h2>
      <div class="total-opportunity">
        Total Opportunity: <strong>${formatCurrency(data.totalOpportunity || 0)}</strong>
      </div>
      <div class="recommendations-list">
        ${recommendations.map((rec: any, i: number) => {
          const steps = rec.implementationSteps || rec.howTo || [];
          const quickWins = rec.quickWins || rec.startThisWeek || [];
          const annualVal = rec.annualValue ?? rec.value;
          return `
          <div class="recommendation-card">
            <div class="rec-header">
              <span class="rec-number">${i + 1}</span>
              <div class="rec-title">${rec.title}</div>
              ${annualVal ? `<span class="rec-value">${formatCurrency(Number(annualVal))} <span class="rec-value-label">annual value</span></span>` : ''}
            </div>
            ${detailLevel !== 'summary' ? `
              <div class="rec-description">${rec.description || ''}</div>
              <div class="rec-meta">
                <span class="effort-badge ${(rec.effort || 'medium').toLowerCase()}">${rec.effort || 'Medium'}</span>
                <span class="timeframe">${rec.timeframe || '12 months'}</span>
              </div>
            ` : ''}
            ${steps.length > 0 ? `
              <div class="rec-implementation">
                <strong>How to implement:</strong>
                <ol>
                  ${steps.map((step: string) => `<li>${step}</li>`).join('')}
                </ol>
              </div>
            ` : ''}
            ${quickWins.length > 0 ? `
              <div class="rec-quickwins">
                <strong>⚡ START THIS WEEK</strong>
                ${quickWins.map((w: string) => `<div class="quickwin-item">→ ${w}</div>`).join('')}
              </div>
            ` : ''}
            ${rec.whatWeCanHelp ? `
              <div class="rec-help">
                <strong>How we can help:</strong> ${rec.whatWeCanHelp}
              </div>
            ` : ''}
            ${rec.linkedService ? `
              <div class="rec-service">→ ${rec.linkedService}</div>
            ` : ''}
          </div>
        `; }).join('')}
      </div>
    </div>
  `;
}

// Business Valuation
function renderValuation(data: any, config: any): string {
  const val = data.valuation || {};
  const baselineValue = val.baseline?.enterpriseValue?.mid ?? val.baseline?.enterpriseValue ?? 0;
  const currentValue = val.currentMarketValue?.mid ?? val.current ?? 0;
  const gapValue = val.valueGap?.mid ?? val.gap ?? 0;
  const gapPercent = val.valueGapPercent ?? 0;
  const multiple = val.baseline?.multipleRange?.mid ?? 5;
  const surplusCash = val.baseline?.surplusCash ?? 0;

  return `
    <div class="section">
      <h2 class="section-title">Business Valuation Analysis</h2>
      <p class="section-subtitle">What your business could be worth, and what's holding back the value</p>
      <div class="valuation-summary">
        <div class="val-box baseline">
          <div class="val-label">Baseline Value</div>
          <div class="val-amount">${formatCurrency(baselineValue)}</div>
          <div class="val-note">${multiple}x EBITDA</div>
        </div>
        <div class="val-arrow">→</div>
        <div class="val-box current">
          <div class="val-label">Current Value</div>
          <div class="val-amount">${formatCurrency(currentValue)}</div>
          <div class="val-note">After discounts</div>
        </div>
        <div class="val-arrow">=</div>
        <div class="val-box gap">
          <div class="val-label">Value Gap</div>
          <div class="val-amount">${formatCurrency(gapValue)}</div>
          <div class="val-note">${Math.round(gapPercent)}% trapped</div>
        </div>
      </div>
      ${surplusCash > 0 ? `
        <div class="surplus-note">
          Plus: ${formatCurrency(surplusCash)} surplus cash adds to any sale price
        </div>
      ` : ''}
    </div>
  `;
}

// Value Waterfall (Where Your Value Is Going)
function renderValueWaterfall(data: any, config: any): string {
  const val = data.valuation || {};
  const baselineValue = val.baseline?.enterpriseValue?.mid ?? 0;
  const surplusCash = val.baseline?.surplusCash ?? data.surplusCash ?? 0;
  const adjustedEV = val.adjustedEV?.mid ?? (val.currentMarketValue?.mid != null && surplusCash != null ? val.currentMarketValue.mid - surplusCash : 0);
  const currentValue = val.currentMarketValue?.mid ?? 0;
  const suppressors = data.suppressors || [];
  const multiple = val.baseline?.multipleRange?.mid ?? 5;

  if (baselineValue === 0) return '';

  return `
    <div class="section waterfall-section">
      <h2 class="section-title">Where Your Value Is Going</h2>
      
      <div class="waterfall-item baseline-item">
        <div class="wf-left">
          <strong>Baseline Enterprise Value</strong>
          <div class="wf-detail">${multiple}x EBITDA</div>
        </div>
        <div class="wf-amount positive">${formatCurrency(baselineValue)}</div>
      </div>
      
      ${suppressors.map((s: any) => {
        const n = normalizeSuppressor(s);
        const severity = n.severity.toLowerCase();
        const displayAmount = n.waterfallAmount || n.discountValue;
        return `
          <div class="waterfall-item suppressor-item severity-${severity}">
            <div class="wf-left">
              <strong>${n.name}</strong>
              <span class="severity-badge ${severity}">${n.severity}</span>
              ${n.evidence ? `<div class="wf-evidence">${n.evidence}</div>` : ''}
              ${n.pathToFixSummary ? `<div class="wf-remedy">Fixable via ${n.pathToFixSummary}</div>` : n.recoveryTimeframe ? `<div class="wf-remedy">Fixable in ~${n.recoveryTimeframe}</div>` : ''}
            </div>
            <div class="wf-amount negative">-${formatCurrency(displayAmount)}</div>
          </div>
        `;
      }).join('')}
      
      <div class="waterfall-item adjusted-ev-item">
        <div class="wf-left">
          <strong>Adjusted Enterprise Value</strong>
          <div class="wf-detail">After operating-risk discounts</div>
        </div>
        <div class="wf-amount">${formatCurrency(adjustedEV)}</div>
      </div>
      
      ${surplusCash > 0 ? `
        <div class="waterfall-item surplus-item">
          <div class="wf-left">
            <strong>Surplus Cash</strong>
            <div class="wf-detail">Added to equity value (not subject to operating discounts)</div>
          </div>
          <div class="wf-amount positive">+${formatCurrency(surplusCash)}</div>
        </div>
      ` : ''}
      
      <div class="waterfall-item current-item">
        <div class="wf-left">
          <strong>Current Market Value</strong>
          <div class="wf-detail">What a buyer would likely pay today</div>
        </div>
        <div class="wf-amount">${formatCurrency(currentValue)}</div>
      </div>
      ${(val.aggregateDiscount?.methodology) ? `
      <div class="valuation-methodology-note">
        <strong>Valuation methodology:</strong> ${val.aggregateDiscount.methodology}
      </div>
      <p class="valuation-disclaimer">This is indicative analysis, not a formal valuation opinion. Discount ranges are grounded in practitioner frameworks (e.g. Pratt, Damodaran, BDO PCPI) and industry calibration; individual outcomes vary by buyer and deal structure.</p>
      ` : ''}
    </div>
  `;
}

// Value Suppressors (table for Tier 1, cards for Tier 2)
function renderSuppressors(data: any, config: any): string {
  const suppressors = data.suppressors || [];
  if (suppressors.length === 0) {
    return '<div class="section"><p>No value suppressors identified.</p></div>';
  }

  const layout = config.layout || 'cards';

  // ===== TABLE LAYOUT (compact, for Tier 1) =====
  if (layout === 'table') {
    return `
      <div class="section">
        <h2 class="section-title">Value Suppressors</h2>
        <table class="suppressor-table-compact">
          <thead>
            <tr>
              <th style="width: 24%;">Suppressor</th>
              <th style="width: 10%;">Severity</th>
              <th style="width: 9%;">Discount</th>
              <th style="width: 12%;">Impact</th>
              <th style="width: 45%;">Summary</th>
            </tr>
          </thead>
          <tbody>
            ${suppressors.map((s: any) => {
              const n = normalizeSuppressor(s);
              const severity = n.severity.toLowerCase();
              return `
                <tr>
                  <td><strong>${n.name}</strong></td>
                  <td><span class="severity-badge ${severity}">${n.severity}</span></td>
                  <td class="discount-value">-${n.discountPercent}%</td>
                  <td class="discount-value">${formatCurrency(n.discountValue)}</td>
                  <td>${n.evidence || n.whyThisDiscount || ''}${n.pathToFixSummary ? `<br><span class="suppressor-remedy">Fix: ${n.pathToFixSummary}</span>` : ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ===== CARDS LAYOUT (detailed, for Tier 2) =====
  return `
    <div class="section">
      <h2 class="section-title">Value Suppressor Details</h2>
      <div class="suppressors-grid">
        ${suppressors.map((s: any) => {
          const n = normalizeSuppressor(s);
          const severity = n.severity.toLowerCase();
          return `
            <div class="suppressor-card severity-${severity}">
              <div class="supp-header">
                <span class="supp-name">${n.name}</span>
                <span class="severity-badge ${severity}">${n.severity}</span>
              </div>
              <div class="supp-impact">
                <span class="discount">-${n.discountPercent}%</span>
                <span class="value-loss">${formatCurrency(n.discountValue)}</span>
              </div>
              ${config.showTargetStates !== false ? `
                <div class="supp-states">
                  <div class="current-state"><strong>Current:</strong> ${n.currentLabel}</div>
                  ${n.targetLabel ? `<div class="target-state"><strong>Target:</strong> ${n.targetLabel}</div>` : ''}
                </div>
              ` : ''}
              ${config.showRecoveryTimelines !== false && (n.recoveryValue > 0 || n.recoveryTimeframe) ? `
                <div class="supp-recovery">
                  <span class="recoverable">${n.recoveryValue > 0 ? formatCurrency(n.recoveryValue) : ''}</span>
                  <span class="timeframe">${n.recoveryTimeframe || ''}</span>
                </div>
              ` : ''}
              ${n.evidence ? `<div class="supp-evidence">${n.evidence}</div>` : ''}
              ${n.whyThisDiscount ? `<div class="supp-why">${n.whyThisDiscount}</div>` : ''}
              ${n.pathToFixSummary ? `<div class="supp-remedy">Fixable via ${n.pathToFixSummary}</div>` : ''}
              ${n.pathToFixSteps?.length > 0 ? `
                <div class="supp-fix-steps">
                  <strong>Path to fix:</strong>
                  <ol>${n.pathToFixSteps.map((step: string) => `<li>${step}</li>`).join('')}</ol>
                </div>
              ` : ''}
              ${n.investment ? `
                <div class="supp-investment">
                  <span>Investment: ${typeof n.investment === 'number' ? formatCurrency(n.investment) : n.investment}</span>
                  ${n.roi ? `<span>ROI: ${n.roi}</span>` : ''}
                </div>
              ` : ''}
              ${n.dependencies ? `<div class="supp-dependencies"><strong>Dependencies:</strong> ${n.dependencies}</div>` : ''}
              ${(s.methodology && (s.methodology.sources?.length || s.methodology.calibrationNote)) ? `
                <div class="supp-methodology">
                  <strong>Methodology &amp; sources:</strong>
                  ${s.methodology.calibrationNote ? `<p class="supp-methodology-note">${s.methodology.calibrationNote}</p>` : ''}
                  ${s.methodology.sources?.length ? `<ul class="supp-sources">${s.methodology.sources.map((src: string) => `<li>${src}</li>`).join('')}</ul>` : ''}
                  ${s.methodology.limitationsNote ? `<p class="supp-limitations italic">${s.methodology.limitationsNote}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Value Protectors
function renderValueProtectors(data: any, config: any): string {
  const valuation = data.valuation || {};
  const enhancers = valuation.enhancers || [];
  const surplusCash = valuation.baseline?.surplusCash || data.surplusCash || 0;

  const protectors = enhancers.length > 0 ? enhancers : [
    {
      name: 'Significant Surplus Cash',
      evidence: `${formatCurrency(surplusCash)} surplus above operating requirements`,
      value: surplusCash,
    },
    {
      name: 'High Revenue per Employee',
      evidence: `${formatCurrency(data.metrics?.find((m: any) => (m.metricCode || m.metric_code || m.id) === 'revenue_per_employee')?.clientValue || data.metrics?.find((m: any) => (m.metricCode || m.metric_code || '').includes('revenue'))?.clientValue || 483000)} per employee - indicates efficient operations`,
    },
  ].filter((p: any) => (p.value || 0) > 0 || (p.evidence || p.description));

  if (protectors.length === 0) return '';

  return `
    <div class="section value-protectors">
      <h3 class="subsection-title">✨ Value Protectors</h3>
      <div class="protectors-grid">
        ${protectors.map((p: any) => `
          <div class="protector-card">
            <div class="protector-name">${p.name}</div>
            <div class="protector-desc">${p.evidence || p.description || ''}</div>
            ${(p.value && p.value > 0) ? `<div class="protector-impact">+${formatCurrency(p.value)} to value</div>` : p.impactLabel ? `<div class="protector-impact">${p.impactLabel}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Path to Full Value
function renderPathToValue(data: any, config: any): string {
  const valuation = data.valuation || {};
  const pathToValue = valuation.pathToValue || {};
  const potentialValue = valuation.potentialValue?.mid ?? valuation.potential ?? 0;
  const currentValue = valuation.currentMarketValue?.mid ?? valuation.current ?? 0;
  const uplift = potentialValue - currentValue;

  const keyActions = pathToValue.keyActions || [
    'Goal Alignment Programme + Succession Planning',
    'Revenue Diversification Programme',
    'Systems Audit + Process Documentation',
    'Exit Readiness Programme',
    'Revenue Model Optimisation',
  ];

  if (keyActions.length === 0 && potentialValue === 0) return '';

  return `
    <div class="section path-to-value">
      <h3 class="subsection-title">Path to Full Value</h3>
      <p class="path-intro">Over the next ${pathToValue.timeframeMonths || 24} months, addressing these structural issues could unlock <strong>${formatCurrency(uplift)}</strong> in hidden value.</p>
      <ol class="path-actions">
        ${keyActions.map((action: string, i: number) => `
          <li class="path-action">
            <span class="action-number">${i + 1}</span>
            <span class="action-text">${action}</span>
          </li>
        `).join('')}
      </ol>
      <div class="potential-value-box">
        <div class="pv-label">Potential Future Value</div>
        <div class="pv-sublabel">After addressing key issues</div>
        <div class="pv-amount">${formatCurrency(potentialValue)}</div>
        <div class="pv-uplift">+${formatCurrency(uplift)} uplift</div>
      </div>
    </div>
  `;
}

// Exit Readiness
function renderExitReadiness(data: any, config: any): string {
  const exit = data.exitReadiness || {};
  const score = exit.totalScore ?? exit.score ?? 0;
  const maxScore = exit.maxScore ?? 100;
  const status = exit.levelLabel ?? exit.status ?? 'Not Exit Ready';
  const components = exit.components || [];
  const pathTo70 = exit.pathTo70 || {};

  return `
    <div class="section">
      <h2 class="section-title">Exit Readiness Score</h2>
      <div class="exit-score-display">
        <div class="score-circle ${score < 40 ? 'red' : score < 70 ? 'amber' : 'green'}">
          <span class="score-value">${score}</span>
          <span class="score-max">/${maxScore}</span>
        </div>
        <div class="score-status">${status}</div>
      </div>
      ${config.showComponentBreakdown !== false && components.length > 0 ? `
        <div class="exit-components">
          <h3>Score Breakdown</h3>
          ${components.map((c: any) => {
            const compScore = c.currentScore ?? c.score ?? 0;
            const compMax = c.maxScore ?? c.max ?? 25;
            const compTarget = c.targetScore ?? 20;
            const compAction = c.gap ?? c.action ?? '';
            const gapPoints = compTarget - compScore;
            return `
              <div class="exit-component">
                <div class="comp-main">
                  <span class="comp-name">${c.name || c.id || 'Unknown'}</span>
                  <span class="comp-score">${compScore}/${compMax}</span>
                </div>
                <div class="comp-bar-row">
                  <div class="comp-bar">
                    <div class="comp-bar-fill" style="width: ${(compScore / compMax) * 100}%"></div>
                  </div>
                </div>
                ${compAction ? `<div class="comp-action">${compAction}</div>` : ''}
                <div class="comp-target">Target: ${compTarget}/${compMax} · Gap: ${gapPoints} points</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      ${config.showPathTo70 !== false && (pathTo70.timeframe || pathTo70.timeline || (pathTo70.actions && pathTo70.actions.length > 0)) ? `
        <div class="path-to-exit">
          <h3>PATH TO CREDIBLY EXIT READY (70/100)</h3>
          ${(pathTo70.actions && pathTo70.actions.length > 0) ? `
            <div class="path-steps">
              ${pathTo70.actions.map((action: string, i: number) => `
                <div class="path-step">
                  <span class="step-number">${i + 1}</span>
                  <span class="step-text">${action}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="path-metrics">
            <div class="path-metric">
              <div class="path-metric-value">${pathTo70.timeframe || pathTo70.timeline || '18-24 months'}</div>
              <div class="path-metric-label">Timeline</div>
            </div>
            <div class="path-metric">
              <div class="path-metric-value">${formatCurrency(pathTo70.investment || 150000)}</div>
              <div class="path-metric-label">Investment</div>
            </div>
            <div class="path-metric">
              <div class="path-metric-value">${formatCurrency(pathTo70.valueUnlocked || 0)}</div>
              <div class="path-metric-label">Value Unlocked</div>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Scenario Explorer (static PDF version of web ScenarioExplorer - Margin, Pricing, Cash, Efficiency, Diversification)
function renderScenarioExplorer(data: any, config: any): string {
  const metrics = data.metrics || [];
  const revenue = data.revenue || 63328519;
  const ebitdaMultiple = data.valuation?.baseline?.multipleRange?.mid || 5;
  const pass1 = data.pass1Data || {};
  const netMargin = pass1.net_margin ?? pass1.netMargin ?? 5;
  const netProfit = pass1.net_profit ?? pass1.netProfit ?? (revenue * (netMargin / 100));
  const headcount = pass1.employee_count ?? pass1.employeeCount ?? pass1._enriched_employee_count ?? Math.max(1, Math.round(revenue / 350000));

  const findByCode = (pattern: string | string[]) => {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    return metrics.find((m: any) => {
      const code = (m.metricCode || m.metric_code || '').toLowerCase();
      return patterns.some((p) => code.includes(p));
    });
  };

  const gmMetric = findByCode('gross_margin');
  const debtorMetric = findByCode(['debtor_days', 'days_sales_outstanding']);
  const rpeMetric = findByCode('revenue_per_employee');
  const concMetric = findByCode(['client_concentration_top3', 'client_concentration', 'concentration']);

  const currentGM = gmMetric ? Number(gmMetric.clientValue ?? gmMetric.client_value ?? 0) : 0;
  const medianGM = gmMetric ? Number(gmMetric.p50 ?? gmMetric.median ?? 18) : 18;
  const debtorDays = debtorMetric ? Number(debtorMetric.clientValue ?? debtorMetric.client_value ?? 45) : 45;
  const medianDebtorDays = debtorMetric ? Number(debtorMetric.p50 ?? debtorMetric.median ?? 60) : 60;
  const currentRPE = rpeMetric ? Number(rpeMetric.clientValue ?? rpeMetric.client_value ?? 0) : revenue / headcount;
  const medianRPE = rpeMetric ? Number(rpeMetric.p50 ?? rpeMetric.median ?? 350000) : 350000;
  const concentrationRaw = concMetric?.clientValue ?? concMetric?.client_value ?? 50;
  const concentration = typeof concentrationRaw === 'string'
    ? parseFloat(String(concentrationRaw).replace(/[^\d.-]/g, '')) || 50
    : Number(concentrationRaw) || 50;

  const scenarioPanels: string[] = [];

  // 1. Margin — show if currentGM < medianGM
  if (gmMetric && currentGM > 0 && currentGM < medianGM) {
    const marginGap = medianGM - currentGM;
    const additionalGrossProfit = revenue * (marginGap / 100);
    const flowThrough = 0.45;
    const netProfitImpact = additionalGrossProfit * flowThrough;
    const businessValueImpact = netProfitImpact * ebitdaMultiple;
    scenarioPanels.push(`
      <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
      <div class="margin-scenario">
        <div class="scenario-left">
          <h3>What if you improved gross margin?</h3>
          <div class="scenario-target">
            <span>Target Gross Margin</span>
            <strong>${medianGM.toFixed(1)}%</strong>
          </div>
          <div class="scenario-current">Current: ${currentGM.toFixed(1)}% · Industry median: ${medianGM.toFixed(1)}%</div>
        </div>
        <div class="scenario-right">
          <h3>Projected Impact</h3>
          <div class="impact-hero">
            <div class="impact-label">Additional Gross Profit</div>
            <div class="impact-value">${formatCurrency(additionalGrossProfit)} <span>additional annually</span></div>
          </div>
          <div class="impact-row">
            <span>Net Profit Impact</span>
            <span class="impact-detail">At ${Math.round(flowThrough * 100)}% flow-through after overheads</span>
            <strong>${formatCurrency(netProfitImpact)}</strong>
          </div>
          <div class="impact-row">
            <span>Business Value Impact</span>
            <span class="impact-detail">At ${ebitdaMultiple}x EBITDA multiple</span>
            <strong>${formatCurrency(businessValueImpact)}</strong>
          </div>
          <div class="impact-row">
            <span>Margin Improvement</span>
            <span class="impact-detail">From ${currentGM.toFixed(1)}% to ${medianGM.toFixed(1)}%</span>
            <strong>${marginGap.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
      <div class="how-to-achieve">
        <strong>How to achieve this</strong>
        <div>→ Review pricing structure: when did you last increase rates?</div>
        <div>→ Analyse project profitability by client and service type</div>
        <div>→ Identify and eliminate margin-diluting work</div>
        <div>→ Negotiate better terms with suppliers and subcontractors</div>
      </div>
      </div>
    `);
  }

  // 2. Pricing Power — ALWAYS show
  const rateIncrease = 5;
  const volumeRetention = 95;
  const marginImpact = revenue * (rateIncrease / 100) * (volumeRetention / 100);
  const breakEvenVolumeLoss = (1 - 1 / (1 + rateIncrease / 100)) * 100;
  const valueImpact = marginImpact * ebitdaMultiple;
  scenarioPanels.push(`
    <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
    <div class="margin-scenario pricing-scenario">
      <div class="scenario-left">
        <h3>What if you increased rates by ${rateIncrease}%?</h3>
        <div class="scenario-target">
          <span>Pricing Power Scenario</span>
          <strong>${rateIncrease}% rate increase</strong>
        </div>
        <div class="scenario-current">Assumption: ${volumeRetention}% client retention. You could lose up to ${breakEvenVolumeLoss.toFixed(1)}% volume and still be better off.</div>
      </div>
      <div class="scenario-right">
        <h3>Projected Impact</h3>
        <div class="impact-hero">
          <div class="impact-label">Direct Margin Impact</div>
          <div class="impact-value">${formatCurrency(marginImpact)} <span>additional annually</span></div>
        </div>
        <div class="impact-row">
          <span>Break-even Volume Loss</span>
          <span class="impact-detail">You could lose up to ${breakEvenVolumeLoss.toFixed(1)}% and still be better off</span>
          <strong>${breakEvenVolumeLoss.toFixed(1)}%</strong>
        </div>
        <div class="impact-row">
          <span>Business Value Impact</span>
          <span class="impact-detail">At ${ebitdaMultiple}x EBITDA multiple</span>
          <strong>${formatCurrency(valueImpact)}</strong>
        </div>
      </div>
    </div>
    <div class="how-to-achieve">
      <strong>How to achieve this</strong>
      <div>→ Communicate value delivered before discussing price</div>
      <div>→ Start increases with new clients, then existing relationships</div>
      <div>→ Consider tiered pricing for different service levels</div>
      <div>→ Focus on results delivered, not hours worked</div>
    </div>
    </div>
  `);

  // 3. Cash Flow — show as OPPORTUNITY if debtorDays > medianDebtorDays, or as STRENGTH if better
  if (debtorMetric) {
    if (debtorDays > medianDebtorDays) {
    const dailyRevenue = revenue / 365;
    const cashReleased = dailyRevenue * (debtorDays - medianDebtorDays);
    const interestSaving = cashReleased * 0.08;
    scenarioPanels.push(`
      <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
      <div class="margin-scenario">
        <div class="scenario-left">
          <h3>What if you improved debtor days?</h3>
          <div class="scenario-target">
            <span>Target Debtor Days</span>
            <strong>${medianDebtorDays} days</strong>
          </div>
          <div class="scenario-current">Current: ${debtorDays} days · Industry median: ${medianDebtorDays} days</div>
        </div>
        <div class="scenario-right">
          <h3>Projected Impact</h3>
          <div class="impact-hero">
            <div class="impact-label">Working Capital Released</div>
            <div class="impact-value">${formatCurrency(cashReleased)}</div>
          </div>
          <div class="impact-row">
            <span>Annual Interest Saving</span>
            <span class="impact-detail">At 8% effective borrowing rate</span>
            <strong>${formatCurrency(interestSaving)}</strong>
          </div>
        </div>
      </div>
      <div class="how-to-achieve">
        <strong>How to achieve this</strong>
        <div>→ Implement proactive credit control process</div>
        <div>→ Send invoices immediately on milestone completion</div>
        <div>→ Review payment terms on new contracts</div>
        <div>→ Consider early payment discounts</div>
      </div>
      </div>
    `);
    } else if (debtorDays < medianDebtorDays) {
      // Strength: client is BETTER than median (e.g. Ian 30 vs 60)
      const dailyRevenue = revenue / 365;
      const cashAdvantage = dailyRevenue * (medianDebtorDays - debtorDays);
      const interestSaving = cashAdvantage * 0.08;
      scenarioPanels.push(`
      <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
      <div class="margin-scenario cash-strength">
        <div class="scenario-left">
          <h3>Your cash advantage</h3>
          <div class="scenario-target">
            <span>What you're already saving</span>
            <strong>${debtorDays} days vs ${medianDebtorDays}-day sector median</strong>
          </div>
          <div class="scenario-current">Your ${debtorDays}-day collection releases ${formatCurrency(cashAdvantage)} in working capital vs a typical peer.</div>
        </div>
        <div class="scenario-right">
          <h3>Value of Your Advantage</h3>
          <div class="impact-hero">
            <div class="impact-label">Working Capital Advantage</div>
            <div class="impact-value">${formatCurrency(cashAdvantage)}</div>
          </div>
          <div class="impact-row">
            <span>Equivalent Interest Saving</span>
            <span class="impact-detail">At 8% effective borrowing rate</span>
            <strong>${formatCurrency(interestSaving)} annually</strong>
          </div>
        </div>
      </div>
      <div class="how-to-achieve">
        <strong>Keep this strength</strong>
        <div>→ Maintain your proactive credit control</div>
        <div>→ Document processes so this doesn't slip as you scale</div>
      </div>
      </div>
    `);
    }
  }

  // 4. Efficiency — show as OPPORTUNITY if RPE < medianRPE, or as STRENGTH if better
  if (rpeMetric && currentRPE > 0) {
    if (currentRPE < medianRPE) {
    const additionalRevenue = (medianRPE - currentRPE) * headcount;
    const additionalProfit = additionalRevenue * (netMargin / 100);
    const efficientHeadcount = Math.ceil(revenue / medianRPE);
    const headcountReduction = headcount - efficientHeadcount;
    const costSaving = headcountReduction > 0 ? headcountReduction * 55000 : 0;
    scenarioPanels.push(`
      <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
      <div class="margin-scenario">
        <div class="scenario-left">
          <h3>What if you improved revenue per employee?</h3>
          <div class="scenario-target">
            <span>Target Revenue per Employee</span>
            <strong>${formatCurrency(medianRPE)}</strong>
          </div>
          <div class="scenario-current">Current: ${formatCurrency(currentRPE)} · Industry median: ${formatCurrency(medianRPE)}</div>
        </div>
        <div class="scenario-right">
          <h3>Projected Impact</h3>
          <div class="impact-hero">
            <div class="impact-label">Revenue Capacity Unlocked</div>
            <div class="impact-value">${formatCurrency(additionalRevenue)}</div>
          </div>
          <div class="impact-row">
            <span>Additional Profit (if capacity filled)</span>
            <span class="impact-detail">At ${netMargin.toFixed(1)}% net margin</span>
            <strong>${formatCurrency(additionalProfit)}</strong>
          </div>
          ${costSaving > 0 ? `
          <div class="impact-row">
            <span>Alternative: Cost Saving</span>
            <span class="impact-detail">Deliver current revenue with ${headcountReduction} fewer people</span>
            <strong>${formatCurrency(costSaving)}</strong>
          </div>
          ` : ''}
        </div>
      </div>
      <div class="how-to-achieve">
        <strong>How to achieve this</strong>
        <div>→ Improve utilisation through better resource planning</div>
        <div>→ Reduce non-billable time and admin burden</div>
        <div>→ Automate repetitive tasks</div>
        <div>→ Focus team on higher-value work</div>
      </div>
      </div>
    `);
    } else {
      // Strength: client is BETTER than median (e.g. Ian £483k vs £350k)
      const additionalValue = (currentRPE - medianRPE) * headcount;
      const efficientHeadcount = Math.ceil(revenue / medianRPE);
      const equivalentHeadcount = Math.max(0, efficientHeadcount - headcount);
      scenarioPanels.push(`
      <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
      <div class="margin-scenario efficiency-strength">
        <div class="scenario-left">
          <h3>Your productivity advantage</h3>
          <div class="scenario-target">
            <span>What your efficiency is worth</span>
            <strong>${formatCurrency(currentRPE - medianRPE)} more per head than sector median</strong>
          </div>
          <div class="scenario-current">Your team generates ${formatCurrency(additionalValue)} more annually than a typical peer with the same headcount.</div>
        </div>
        <div class="scenario-right">
          <h3>Value of Your Advantage</h3>
          <div class="impact-hero">
            <div class="impact-label">Additional Value Generated</div>
            <div class="impact-value">${formatCurrency(additionalValue)} annually</div>
          </div>
          <div class="impact-row">
            <span>Equivalent Headcount</span>
            <span class="impact-detail">Same output with ~${equivalentHeadcount} fewer people</span>
            <strong>~${formatCurrency(equivalentHeadcount * 55000)} cost advantage</strong>
          </div>
        </div>
      </div>
      <div class="how-to-achieve">
        <strong>Keep this strength</strong>
        <div>→ Document what drives your utilisation</div>
        <div>→ Protect against margin drift as you scale</div>
      </div>
      </div>
    `);
    }
  }

  // 5. Customer Diversification — show if concentration > 60%
  if (concentration > 60) {
    const targetConcentration = 60;
    const currentDiscount = concentration >= 80 ? 25 : concentration >= 60 ? 15 : 5;
    const targetDiscount = targetConcentration >= 80 ? 25 : targetConcentration >= 60 ? 15 : 5;
    const baseValue = netProfit * ebitdaMultiple;
    const valueImprovement = baseValue * (currentDiscount - targetDiscount) / 100;
    const currentRevenueAtRisk = revenue * (concentration / 100) / 3;
    const targetRevenueAtRisk = revenue * (targetConcentration / 100) / 3;
    const riskReduction = currentRevenueAtRisk - targetRevenueAtRisk;
    scenarioPanels.push(`
      <div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 8px;">
      <div class="margin-scenario diversification-scenario">
        <div class="scenario-left">
          <h3>What if you diversified your client base?</h3>
          <div class="scenario-target">
            <span>Target Concentration</span>
            <strong>${targetConcentration}% from top 3</strong>
          </div>
          <div class="scenario-current">Current: ${concentration}% from top 3 clients · High concentration triggers valuation discounts</div>
        </div>
        <div class="scenario-right">
          <h3>Projected Impact</h3>
          <div class="impact-hero">
            <div class="impact-label">Risk Reduction per Major Client</div>
            <div class="impact-value">${formatCurrency(riskReduction)}</div>
          </div>
          <div class="impact-row">
            <span>Valuation Discount Reduction</span>
            <span class="impact-detail">Buyers penalise high concentration</span>
            <strong>${currentDiscount - targetDiscount} points</strong>
          </div>
          <div class="impact-row">
            <span>Business Value Improvement</span>
            <span class="impact-detail">From reduced concentration discount</span>
            <strong>${formatCurrency(valueImprovement)}</strong>
          </div>
        </div>
      </div>
      <div class="how-to-achieve">
        <strong>How to achieve this</strong>
        <div>→ Proactively develop relationships with new target clients</div>
        <div>→ Expand services within existing smaller accounts</div>
        <div>→ Target adjacent sectors or industries</div>
        <div>→ Consider small acquisitions to diversify client base</div>
      </div>
      </div>
    `);
  }

  if (scenarioPanels.length === 0) return '';

  return `
    <div class="section margin-impact-section">
      <h2 class="section-title">Explore Improvement Scenarios</h2>
      <p class="section-subtitle">Use your actual data to see the impact of potential improvements</p>
      ${scenarioPanels.join('')}
    </div>
  `;
}

// Scenario Planning (table for Tier 1, sequential blocks for Tier 2)
function renderScenarioPlanning(data: any, config: any): string {
  const scenarios = data.scenarios || [];
  if (scenarios.length === 0) return '';

  const layout = config.layout || 'sequential';

  // ===== TABLE LAYOUT (compact, for Tier 1) =====
  if (layout === 'table') {
    return `
      <div class="section">
        <h2 class="section-title">Scenario Planning</h2>
        <p class="section-subtitle">What happens depending on the path you choose</p>
        <table class="scenario-table-compact">
          <thead>
            <tr>
              <th style="width: 18%;">Scenario</th>
              <th style="width: 20%;">Metric</th>
              <th style="width: 13%;">Today</th>
              <th style="width: 13%;">Projected</th>
              <th style="width: 36%;">Impact</th>
            </tr>
          </thead>
          <tbody>
            ${scenarios.map((scenario: any, sIdx: number) => {
              const metrics = scenario.metrics || [];
              if (metrics.length === 0) return '';
              return `
                ${metrics.map((m: any, mIdx: number) => `
                  <tr>
                    ${mIdx === 0 ? `
                      <td class="scenario-name-cell" rowspan="${metrics.length}">
                        <strong>${scenario.title || scenario.name || 'Scenario'}</strong>
                        ${scenario.timeframe ? `<br><span style="font-size: 8px; color: #64748b;">${scenario.timeframe}</span>` : ''}
                      </td>
                    ` : ''}
                    <td>${m.label || m.name || ''}</td>
                    <td>${m.current ?? '-'}</td>
                    <td>${m.projected ?? '-'}</td>
                    <td>${m.impact || ''}</td>
                  </tr>
                `).join('')}
                ${sIdx < scenarios.length - 1 ? '<tr><td colspan="5" style="height: 4px; border: none;"></td></tr>' : ''}
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ===== SEQUENTIAL LAYOUT (detailed, for Tier 2) =====
  return `
    <div class="section">
      <h2 class="section-title">Scenario Planning</h2>
      <p class="section-subtitle">What happens depending on the path you choose</p>
      ${scenarios.map((scenario: any) => `
        <div class="scenario-card ${scenario.id || ''}">
          <h3 class="scenario-title">${scenario.title || scenario.name || 'Scenario'}</h3>
          <p class="scenario-desc">${scenario.description || ''}</p>
          ${scenario.timeframe ? `<div class="scenario-timeframe">Timeframe: ${scenario.timeframe}</div>` : ''}
          ${scenario.metrics?.length > 0 ? `
            <table class="scenario-metrics">
              <thead><tr><th>Metric</th><th>Today</th><th>Projected</th><th>Impact</th></tr></thead>
              <tbody>
                ${scenario.metrics.map((m: any) => `
                  <tr>
                    <td>${m.label || m.name || ''}</td>
                    <td>${m.current ?? '-'}</td>
                    <td>${m.projected ?? '-'}</td>
                    <td>${m.impact || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          ${scenario.risks?.length > 0 ? `
            <div class="scenario-risks">
              <h4>What You Risk</h4>
              <ul>${scenario.risks.map((r: string) => `<li>${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${scenario.requirements?.length > 0 && config.showRequirements !== false ? `
            <div class="scenario-requirements">
              <h4>What This Requires</h4>
              <ul>${scenario.requirements.map((r: string) => `<li>${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${scenario.considerations?.length > 0 ? `
            <div class="scenario-considerations">
              <h4>Considerations</h4>
              <ul>${scenario.considerations.map((c: string) => `<li>${c}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// Generate services from suppressors when none provided
function generateServicesFromSuppressors(data: any): any[] {
  const suppressors = data.suppressors || [];
  const services: any[] = [];

  const founderDep = suppressors.find((s: any) =>
    s.name?.toLowerCase().includes('founder') || s.code === 'FOUNDER_DEPENDENCY'
  );
  if (founderDep) {
    services.push({
      name: 'Systems Audit',
      tagline: 'Comprehensive systems review',
      priceRange: '£2,000 – £5,000 (one-off)',
      frequency: 'One-off',
      duration: '2-4 weeks',
      whyThisMatters: `Founder dependency is your biggest structural risk. ${founderDep.evidence || '70% of operational knowledge is concentrated in the founder'}, costing ${formatCurrency(founderDep.current?.discountValue || 5700000)} in valuation discount. A systems audit maps what's documented vs what's assumed, creating the roadmap to de-risk.`,
      whatYouGet: [
        'Process dependency map: who knows what, and what happens if they leave',
        'Documentation gap analysis with severity ratings',
        'Knowledge transfer priority assessment',
        'Systemisation roadmap with quick wins',
        'Founder de-risking action plan',
      ],
      expectedOutcome: `Addresses issues worth ${formatCurrency((founderDep.current?.discountValue || 5700000) + 150000)} in potential value. Creates the foundation to reduce founder dependency from 70% toward <30%.`,
      addressesValue: (founderDep.current?.discountValue || 5700000) + 150000,
    });
  }

  const baselineMid = data.valuation?.baseline?.enterpriseValue?.mid || 63300000;
  const hasConcentration = suppressors.some((s: any) => s.code === 'CUSTOMER_CONCENTRATION');
  services.push({
    name: 'Quarterly BI & Benchmarking',
    tagline: 'Turn your management accounts into strategic intelligence',
    priceRange: '£500 – £1,000/month or £1,500 – £3,000/quarter',
    frequency: 'Monthly or Quarterly',
    duration: 'Ongoing',
    whyThisMatters: `With ${formatCurrency(baselineMid)} revenue and margins recovering, ongoing benchmarking tracks your recovery against industry peers and catches margin drift early. Quarterly tracking is especially important with ${hasConcentration ? '99% client concentration' : 'your client mix'}. Early warning on margin erosion gives you time to act.`,
    expectedOutcome: 'Addresses issues worth £750k in potential value',
    addressesValue: 750000,
  });

  if (data.surplusCash > 1000000) {
    services.push({
      name: 'Profit Extraction Strategy',
      tagline: 'Tax-efficient value extraction',
      priceRange: '£1,500 – £3,000 (one-off)',
      frequency: 'One-off',
      duration: '1-2 weeks',
      whyThisMatters: `You have ${formatCurrency(data.surplusCash)} surplus cash sitting idle. We can help structure tax-efficient extraction.`,
      addressesValue: data.surplusCash,
    });
  }

  return services;
}

// Service Recommendations (Tier 2 only) / How We Can Help
function renderServices(data: any, config: any): string {
  const services = data.services || [];
  const generatedServices = services.length > 0 ? services : generateServicesFromSuppressors(data);
  const primaryServices = generatedServices.filter((s: any) => s.isPrimary !== false);
  const additionalServices = generatedServices.filter((s: any) => s.isPrimary === false);
  const hasPrimary = primaryServices.length > 0;
  const hasAdditional = additionalServices.length > 0;

  if (generatedServices.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">How We Can Help</h2>
        <p>Based on your analysis, we've identified specific services that address your key challenges.</p>
        <p class="cta">Contact your advisor to discuss tailored support options.</p>
      </div>
    `;
  }

  const renderServiceCard = (service: any) => `
          <div class="service-card">
            <div class="service-header">
              <span class="service-price">${service.priceRange || '£TBC'}</span>
              <span class="service-frequency">${service.frequency || 'One-off'}</span>
            </div>
            <h3 class="service-name">${service.name}</h3>
            <p class="service-tagline">${service.tagline || ''}</p>
            ${service.whyThisMatters ? `
              <div class="service-why">
                <h4>Why This Matters For You</h4>
                <p>${service.whyThisMatters}</p>
              </div>
            ` : ''}
            ${service.whatYouGet?.length > 0 ? `
              <div class="service-deliverables">
                <h4>What You Get</h4>
                <ul>${service.whatYouGet.map((item: string) => `<li>${item}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${service.expectedOutcome ? `
              <div class="service-outcome">
                <h4>Expected Outcome</h4>
                <p>${service.expectedOutcome}</p>
              </div>
            ` : ''}
            <div class="service-meta">
              <span class="service-duration">${service.duration || ''}</span>
              ${service.addressesValue ? `<span class="service-value">Total value at stake: ${service.addressesValue >= 1000 ? formatCurrency(service.addressesValue) : service.addressesValue > 0 ? formatCurrency(service.addressesValue * 1000) + ' (est.)' : ''}</span>` : ''}
            </div>
          </div>
        `;

  const servicesToRender = hasPrimary ? primaryServices : generatedServices;
  const additionalBlock = hasAdditional && hasPrimary ? `
        <h3 class="subsection-title">Additional Support Options</h3>
        <div class="services-grid additional-services">
          ${additionalServices.map(renderServiceCard).join('')}
        </div>
      ` : hasAdditional ? additionalServices.map(renderServiceCard).join('') : '';

  return `
    <div class="section">
      <h2 class="section-title">How We Can Help</h2>
      <p class="section-subtitle">Based on your analysis, we've identified specific services that address your key challenges.</p>
      <div class="services-grid">
        ${servicesToRender.map(renderServiceCard).join('')}
      </div>
      ${additionalBlock}
    </div>
  `;
}

// Closing Summary
function renderClosing(data: any, config: any): string {
  return `
    <div class="section closing-section">
      <h2 class="section-title">Your Position: Summed Up</h2>
      <div class="closing-box">
        <p>${data.closingSummary || ''}</p>
      </div>
      ${config.showContactCTA ? `
        <div class="contact-cta">
          <h3>Ready to Take Action?</h3>
          <p>Contact your advisor to discuss next steps.</p>
          <div class="contact-details">
            <p><strong>RPGCC</strong></p>
            <p>enquiries@rpgcc.co.uk | 020 7870 9050</p>
            <p>30 City Road, London EC1Y 2AB</p>
          </div>
          ${config.showDataSources && data.dataSources ? `
            <div class="data-sources-inline">
              Benchmark Data Sources: ${data.dataSources.join(', ')}
            </div>
          ` : ''}
        </div>
      ` : config.showDataSources && data.dataSources ? `
        <div class="data-sources">
          <strong>Benchmark Data Sources:</strong>
          <p>${data.dataSources.join(', ')}</p>
        </div>
      ` : ''}
    </div>
  `;
}

// =============================================================================
// MAIN HTML GENERATOR
// =============================================================================

function generateReportHTML(data: any, pdfConfig: PdfConfig): string {
  const { sections, pdfSettings, tier } = pdfConfig;
  const density = pdfSettings?.density || (tier === 1 ? 'compact' : 'comfortable');
  
  // Build sections HTML
  let sectionsHTML = '';
  
  for (const section of sections) {
    if (!section.enabled) continue;

    // Add page break only for Tier 2 when configured (Tier 1 flows without forced breaks)
    if (tier === 2 && section.config?.pageBreakBefore) {
      sectionsHTML += '<div class="page-break-before"></div>';
    }

    switch (section.id) {
      case 'cover':
        sectionsHTML += renderCover({ ...data, tier }, section.config);
        break;
      case 'executiveSummary':
        sectionsHTML += renderExecutiveSummary(data, section.config);
        break;
      case 'hiddenValue':
        sectionsHTML += renderHiddenValue(data, section.config);
        break;
      case 'surplusCashBreakdown':
        sectionsHTML += renderSurplusCashBreakdown(data, section.config);
        break;
      case 'keyMetrics':
        sectionsHTML += renderKeyMetrics(data, section.config);
        break;
      case 'positionNarrative':
        sectionsHTML += renderNarrative('Where You Stand', data.positionNarrative, [`${data.overallPercentile}th percentile`]);
        break;
      case 'strengthsNarrative':
        sectionsHTML += renderNarrativeContinuation('Your Strengths', data.strengthsNarrative);
        break;
      case 'gapsNarrative':
        sectionsHTML += renderNarrativeContinuation('Performance Gaps', data.gapsNarrative, [`${data.gapCount || 0} gaps identified`]);
        break;
      case 'opportunityNarrative':
        sectionsHTML += renderNarrativeContinuation('The Opportunity', data.opportunityNarrative, [`${formatCurrency(data.totalOpportunity || 0)} potential`]);
        break;
      case 'scenarioExplorer':
        sectionsHTML += renderScenarioExplorer(data, section.config);
        break;
      case 'twoPaths':
        if (data.twoPathsNarrative) {
          sectionsHTML += renderNarrative('Two Paths Forward', data.twoPathsNarrative);
        }
        break;
      case 'recommendations':
        sectionsHTML += renderRecommendations(data, section.config);
        break;
      case 'valuationAnalysis':
        sectionsHTML += renderValuation(data, section.config);
        break;
      case 'valueWaterfall':
        sectionsHTML += renderValueWaterfall(data, section.config);
        break;
      case 'valueSuppressors':
        sectionsHTML += renderSuppressors(data, section.config);
        break;
      case 'valueProtectors':
        sectionsHTML += renderValueProtectors(data, section.config);
        break;
      case 'pathToValue':
        sectionsHTML += renderPathToValue(data, section.config);
        break;
      case 'exitReadiness':
        sectionsHTML += renderExitReadiness(data, section.config);
        break;
      case 'scenarioPlanning':
        sectionsHTML += renderScenarioPlanning(data, section.config);
        break;
      case 'serviceRecommendations':
        sectionsHTML += renderServices(data, section.config);
        break;
      case 'closingSummary':
        sectionsHTML += renderClosing(data, section.config);
        break;
      // Add more section renderers as needed
    }
  }
  
  // Generate full HTML document with styles
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Benchmarking Report - ${data.clientName || 'Client'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    :root {
      --navy-dark: ${RPGCC_COLORS.navyDark};
      --navy: ${RPGCC_COLORS.navy};
      --blue-light: ${RPGCC_COLORS.blueLight};
      --teal: ${RPGCC_COLORS.teal};
      --teal-light: ${RPGCC_COLORS.tealLight};
      --orange: ${RPGCC_COLORS.orange};
      --red: ${RPGCC_COLORS.red};
      --green: ${RPGCC_COLORS.green};
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: ${density === 'compact' ? '9pt' : density === 'spacious' ? '11pt' : '10pt'};
      line-height: 1.45;
      color: #1e293b;
      background: white;
    }
    
    @page {
      size: ${pdfSettings?.pageSize || 'A4'};
      margin: ${pdfSettings?.margins?.top || 12}mm ${pdfSettings?.margins?.right || 12}mm ${pdfSettings?.margins?.bottom || 12}mm ${pdfSettings?.margins?.left || 12}mm;
    }
    
    /* =========================== COVER PAGE =========================== */
    .cover-page {
      page-break-after: always;
      background: linear-gradient(180deg, var(--navy-dark) 0%, var(--navy) 100%);
      min-height: 100vh;
      padding: 40px;
      display: flex;
      flex-direction: column;
      color: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .cover-header { margin-bottom: 60px; }
    .cover-header .logo { font-size: 24px; font-weight: 700; }
    .cover-header .logo-img { height: 36px; width: auto; object-fit: contain; display: block; }
    .cover-header .tagline { font-size: 11px; color: var(--blue-light); margin-top: 4px; }
    
    .cover-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    
    .report-type {
      font-size: 12px;
      letter-spacing: 2px;
      color: var(--teal-light);
      margin-bottom: 16px;
    }
    
    .cover-title {
      font-size: 36px;
      font-weight: 300;
      margin-bottom: 24px;
    }
    
    .client-name {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .report-date {
      font-size: 14px;
      color: var(--blue-light);
      margin-bottom: 40px;
    }
    
    .hero-box {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 24px 48px;
    }
    
    .hero-box .hero-value {
      font-size: 48px;
      font-weight: 700;
      color: var(--teal-light);
    }
    
    .hero-box .hero-label {
      font-size: 12px;
      color: var(--blue-light);
      margin-top: 4px;
    }
    
    .cover-footer {
      text-align: center;
      font-size: 10px;
      color: rgba(255,255,255,0.6);
    }
    
    .cover-footer p { margin: 4px 0; }
    
    /* =========================== SECTIONS =========================== */
    .section {
      margin-bottom: 12px;
    }
    
    .section-title {
      font-size: ${density === 'compact' ? '15px' : '17px'};
      font-weight: 600;
      color: var(--navy-dark);
      margin-bottom: ${density === 'compact' ? '6px' : '8px'};
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      break-after: avoid;
    }
    
    .section-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: -6px;
      margin-bottom: 8px;
    }
    
    .narrative-text {
      font-size: ${density === 'compact' ? '8.5pt' : density === 'spacious' ? '10.5pt' : '9.5pt'};
      line-height: 1.45;
      color: #334155;
    }
    
    /* =========================== HERO METRICS =========================== */
    .hero-metrics {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      background: var(--navy-dark);
      padding: 16px;
      border-radius: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .hero-metric {
      flex: 1;
      text-align: center;
      color: white;
    }
    
    .hero-metric .metric-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .hero-metric .metric-value.teal { color: var(--teal-light); }
    .hero-metric .metric-value.green { color: #4ade80; }
    
    .hero-opportunity {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      color: white;
      margin: 24px 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hero-opportunity .hero-label {
      font-size: 0.75em;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .hero-opportunity .hero-amount {
      font-size: 2.5em;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .hero-opportunity .hero-caption {
      font-size: 0.9em;
      color: #94a3b8;
      max-width: 500px;
      margin: 0 auto 16px;
    }
    .hero-percentile-bar {
      height: 8px;
      background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #94a3b8);
      border-radius: 4px;
      position: relative;
      max-width: 300px;
      margin: 0 auto;
    }
    .hero-bar-fill {
      position: absolute;
      top: -4px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: translateX(-50%);
    }
    .hero-percentile-label {
      font-size: 0.85em;
      margin-top: 8px;
    }
    
    .hero-metric .metric-label {
      font-size: 10px;
      color: var(--blue-light);
      margin-top: 4px;
    }
    
    /* =========================== VALUATION SUMMARY =========================== */
    .valuation-summary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 12px;
      padding: 28px 24px;
      margin-bottom: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .val-box {
      flex: 1;
      text-align: center;
      color: white;
    }
    .val-label {
      font-size: 0.7em;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .val-amount {
      font-size: 2em;
      font-weight: 800;
      line-height: 1.1;
    }
    .val-box.baseline .val-amount { color: #4ade80; }
    .val-box.current .val-amount { color: #60a5fa; }
    .val-box.gap .val-amount { color: #f87171; }
    .val-note {
      font-size: 0.8em;
      color: #94a3b8;
      margin-top: 4px;
    }
    .val-arrow {
      color: #475569;
      font-size: 1.5em;
      padding: 0 4px;
    }
    .surplus-note {
      text-align: center;
      font-size: 0.9em;
      color: #059669;
      margin-top: 8px;
      padding: 8px;
      background: #f0fdf4;
      border-radius: 6px;
    }
    
    /* =========================== METRICS GRID =========================== */
    .metrics-grid {
      display: grid;
      gap: 12px;
    }
    .metrics-grid.compact,
    .metrics-grid.detailed { grid-template-columns: repeat(2, 1fr); }
    .metrics-grid.full { grid-template-columns: 1fr; }

    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      break-inside: avoid;
    }
    .metric-card.gap { border-left: 3px solid #dc2626; }
    .metric-card.advantage { border-left: 3px solid #059669; }

    .metric-header { margin-bottom: 6px; }
    .metric-name { font-weight: 600; font-size: 13px; display: block; }
    .metric-percentile { font-size: 10px; color: #64748b; display: block; margin-top: 2px; }

    /* Rich bar area */
    .metric-bar-area { margin-bottom: 6px; }
    .bar-track-rich {
      position: relative;
      height: 28px;
      background: #f1f5f9;
      border-radius: 6px;
      overflow: visible;
    }
    .bar-iqr {
      position: absolute;
      top: 0;
      height: 100%;
      background: #e2e8f0;
      border-radius: 8px;
    }
    .bar-median-line {
      position: absolute;
      top: 0;
      height: 100%;
      width: 2px;
      background: #94a3b8;
      transform: translateX(-50%);
    }
    .bar-client-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .bar-client-marker.gap { background: #f43f5e; }
    .bar-client-marker.advantage { background: #10b981; }
    .bar-client-marker.neutral { background: #64748b; }

    .bar-scale-labels {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
      margin-top: 4px;
      padding: 0 2px;
    }

    /* Value comparison footer */
    .metric-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border-radius: 6px;
      padding: 6px 10px;
    }
    .mf-item { text-align: center; flex: 1; }
    .mf-value { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.2; }
    .mf-median { color: #475569; }
    .mf-gap { color: #dc2626; }
    .mf-advantage { color: #059669; }
    .mf-label { font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin-top: 2px; }
    .mf-arrow { color: #cbd5e1; font-size: 16px; padding: 0 4px; }
    
    /* =========================== RECOMMENDATIONS =========================== */
    .total-opportunity {
      background: var(--teal);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 16px;
      font-size: 14px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .recommendation-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      break-inside: avoid;
    }
    
    .rec-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .rec-number {
      width: 24px;
      height: 24px;
      background: var(--teal);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .rec-title { font-weight: 600; flex: 1; }
    .rec-value { color: var(--teal); font-weight: 600; }
    
    .rec-description {
      font-size: 11px;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .rec-meta {
      display: flex;
      gap: 12px;
      font-size: 10px;
    }
    
    .effort-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .effort-badge.medium { background: #fef3c7; color: #d97706; }
    .effort-badge.strategic { background: #ede9fe; color: #7c3aed; }
    .effort-badge.quick { background: #d1fae5; color: #059669; }
    
    .rec-steps, .rec-immediate {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
    }
    
    .rec-steps ul, .rec-immediate ul {
      margin-top: 6px;
      padding-left: 20px;
    }
    
    .rec-steps li, .rec-immediate li {
      margin-bottom: 4px;
    }
    
    .rec-value { font-size: 1.2em; font-weight: 700; color: #0f766e; text-align: right; }
    .rec-value-label { font-size: 0.7em; font-weight: 400; color: #64748b; }
    .rec-implementation { margin-top: 8px; }
    .rec-implementation ol { padding-left: 18px; margin: 4px 0; }
    .rec-implementation li { margin: 2px 0; font-size: 0.85em; color: #334155; }
    .rec-quickwins { background: #ecfdf5; border-radius: 6px; padding: 8px 12px; margin-top: 8px; }
    .rec-quickwins strong { color: #059669; font-size: 0.85em; text-transform: uppercase; }
    .quickwin-item { color: #047857; font-size: 0.9em; margin: 4px 0; }
    .rec-help { background: #eff6ff; border-radius: 6px; padding: 8px 12px; margin-top: 6px; font-size: 0.85em; color: #1e40af; }
    .rec-service { font-size: 0.85em; color: #6366f1; margin-top: 8px; }
    
    /* =========================== VALUE BRIDGE =========================== */
    .value-bridge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: var(--navy-dark);
      padding: 14px;
      border-radius: 8px;
      color: white;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .bridge-item {
      padding: 8px 14px;
    }
    
    .bridge-value {
      font-size: 20px;
      font-weight: 700;
    }
    
    .bridge-item.current .bridge-value { color: var(--orange); }
    .bridge-item.gap .bridge-value { color: #f87171; }
    
    .bridge-label {
      font-size: 10px;
      color: var(--blue-light);
      margin-top: 4px;
    }
    
    .bridge-detail {
      font-size: 9px;
      color: rgba(255,255,255,0.6);
    }
    
    .bridge-arrow {
      font-size: 20px;
      color: var(--blue-light);
    }
    
    .surplus-add {
      margin-top: 8px;
      padding: 8px 10px;
      background: #d1fae5;
      border-radius: 6px;
      font-size: 10px;
      color: #065f46;
    }
    
    /* =========================== SUPPRESSORS =========================== */
    .suppressors-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .suppressor-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      break-inside: avoid;
    }
    
    .suppressor-card.severity-critical { border-left: 3px solid var(--red); background: #fef2f2; }
    .suppressor-card.severity-high { border-left: 3px solid var(--orange); background: #fffbeb; }
    
    .supp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .supp-name { font-weight: 600; font-size: 12px; }
    
    .severity-badge {
      font-size: 9px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    .severity-critical .severity-badge { background: var(--red); color: white; }
    .severity-high .severity-badge { background: var(--orange); color: white; }
    
    .supp-impact {
      display: flex;
      gap: 10px;
      margin-bottom: 5px;
    }
    
    .discount { font-size: 18px; font-weight: 700; color: var(--red); }
    .value-loss { font-size: 12px; color: #64748b; }
    
    .supp-states {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .supp-recovery {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    
    .recoverable { color: var(--green); font-weight: 600; }
    
    .supp-evidence { font-size: 0.82em; color: #475569; margin: 5px 0; font-style: italic; }
    .supp-why { font-size: 0.82em; color: #64748b; margin: 3px 0; }
    .supp-remedy { font-size: 0.82em; color: #059669; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; }
    .supp-fix-steps { font-size: 0.82em; margin-top: 6px; }
    .supp-fix-steps ol { margin: 3px 0 0 16px; padding: 0; }
    .supp-investment { display: flex; gap: 12px; font-size: 0.82em; margin-top: 6px; }
    .supp-dependencies { font-size: 0.82em; margin-top: 6px; color: #64748b; }
    .supp-methodology { font-size: 0.78em; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; color: #64748b; }
    .supp-methodology-note { margin: 4px 0; }
    .supp-sources { margin: 4px 0 0 0.8em; padding-left: 0.4em; }
    .supp-limitations { margin-top: 6px; font-style: italic; color: #94a3b8; }
    .valuation-methodology-note { font-size: 0.8em; margin-top: 12px; padding: 8px 0; color: #64748b; }
    .valuation-disclaimer { font-size: 0.75em; color: #94a3b8; margin-top: 8px; font-style: italic; }
    
    /* =========================== COMPACT SUPPRESSOR TABLE (TIER 1) =========================== */
    .suppressor-table-compact {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 6px;
    }
    .suppressor-table-compact th {
      background: var(--navy-dark);
      color: white;
      padding: 5px 7px;
      text-align: left;
      font-weight: 600;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .suppressor-table-compact td {
      padding: 5px 7px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }
    .suppressor-table-compact tr:nth-child(even) td {
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .suppressor-table-compact .discount-value { font-weight: 700; color: var(--red); }
    .suppressor-remedy { font-size: 8px; color: var(--green); }
    
    /* =========================== COMPACT SCENARIO TABLE (TIER 1) =========================== */
    .scenario-table-compact {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 6px;
    }
    .scenario-table-compact th {
      background: var(--navy-dark);
      color: white;
      padding: 5px 7px;
      text-align: left;
      font-weight: 600;
      font-size: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .scenario-table-compact td {
      padding: 4px 7px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }
    .scenario-table-compact .scenario-name-cell {
      font-weight: 600;
      background: #f1f5f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* =========================== EXIT READINESS =========================== */
    .exit-score-display {
      text-align: center;
      padding: 10px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 6px;
    }
    
    .score-circle {
      display: inline-block;
    }
    
    .score-circle .score-value {
      font-size: 32px;
      font-weight: 700;
    }
    
    .score-circle.red .score-value { color: var(--red); }
    .score-circle.amber .score-value { color: var(--orange); }
    .score-circle.green .score-value { color: var(--green); }
    
    .score-circle .score-max {
      font-size: 18px;
      color: #94a3b8;
    }
    
    .score-status {
      font-size: 13px;
      font-weight: 600;
      margin-top: 4px;
    }
    
    .score-circle.red + .score-status { color: var(--red); }
    
    .exit-components {
      margin-top: 8px;
    }
    
    .exit-component {
      padding: 5px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
    }
    
    .comp-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .comp-name { font-weight: 500; }
    .comp-score { font-weight: 600; }
    
    .comp-bar-row { margin: 3px 0; }
    
    .comp-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .comp-bar-fill {
      height: 100%;
      background: var(--teal);
      border-radius: 4px;
    }
    
    .comp-target { font-size: 0.8em; color: #94a3b8; margin-top: 2px; }
    .comp-action { font-size: 0.85em; color: #dc2626; margin-top: 4px; }
    
    .path-to-exit {
      margin-top: 10px;
      background: var(--teal);
      color: white;
      padding: 14px;
      border-radius: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .path-to-exit h3 {
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: white;
      margin-bottom: 8px;
    }
    
    .path-steps { margin-bottom: 10px; }
    .path-step { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      color: white;
      font-size: 0.8em;
      font-weight: 700;
      flex-shrink: 0;
    }
    .step-text { color: white; font-size: 0.9em; opacity: 0.95; }
    
    .path-metrics {
      display: flex;
      justify-content: space-around;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    
    .path-metric {
      text-align: center;
    }
    
    .path-metric-value { font-size: 1.3em; font-weight: 800; }
    .path-metric-label { font-size: 0.75em; opacity: 0.8; margin-top: 2px; }
    
    /* =========================== SCENARIOS =========================== */
    .scenarios-sequential {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .scenario-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--navy-dark);
    }
    
    .scenario-timeframe {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .scenario-metrics {
      display: grid;
      gap: 8px;
    }
    
    .scenario-metric {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      padding: 6px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .sm-name { width: 140px; font-weight: 500; }
    .sm-today { color: #64748b; }
    .sm-arrow { color: #94a3b8; }
    .sm-projected { font-weight: 600; color: var(--navy-dark); }
    
    .scenario-requirements {
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
    }
    
    .scenario-requirements ul {
      margin-top: 6px;
      padding-left: 16px;
    }
    
    /* =========================== SERVICES =========================== */
    .services-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .service-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      break-inside: avoid;
    }
    
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .service-name { font-size: 14px; font-weight: 600; }
    .service-price { color: var(--teal); font-weight: 600; }
    
    .service-meta {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .service-meta span:not(:last-child)::after { content: ' · '; }
    
    .service-why, .service-outcomes {
      margin-bottom: 6px;
      font-size: 10px;
    }
    
    .service-deliverables ul { margin: 2px 0; padding-left: 14px; }
    .service-deliverables li { margin-bottom: 1px; font-size: 10px; }
    .service-outcome { margin-bottom: 6px; }
    .service-outcome p { font-size: 10px; }
    
    .service-why p, .service-outcomes ul {
      margin-top: 4px;
      color: #475569;
    }
    
    .service-outcomes ul {
      padding-left: 0;
      list-style: none;
    }
    
    .service-outcomes li {
      margin-bottom: 4px;
    }
    
    .service-value {
      font-size: 11px;
      padding: 8px 12px;
      background: #d1fae5;
      border-radius: 6px;
      color: #065f46;
    }
    
    /* =========================== CLOSING =========================== */
    .closing-box {
      background: var(--navy-dark);
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .closing-box p {
      font-size: 11px;
      line-height: 1.5;
    }
    
    .contact-cta {
      text-align: center;
      padding: 8px;
      background: var(--teal);
      color: white;
      border-radius: 8px;
      margin-bottom: 4px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .contact-cta h3 {
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .contact-details {
      margin-top: 6px;
      font-size: 10px;
    }
    
    .data-sources {
      font-size: 8px;
      color: #64748b;
      padding: 4px 10px;
      background: #f1f5f9;
      border-radius: 4px;
      line-height: 1.3;
    }
    .data-sources-inline {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid rgba(255,255,255,0.2);
      font-size: 7.5px;
      opacity: 0.7;
      line-height: 1.3;
    }
    
    /* =========================== HIGHLIGHT SECTIONS =========================== */
    .highlight-section {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .highlight-section.green {
      background: #d1fae5;
      border: 1px solid #a7f3d0;
    }
    
    .highlight-section .section-title {
      color: #065f46;
      border-bottom-color: #a7f3d0;
    }
    
    .value-grid {
      display: flex;
      gap: 16px;
    }
    
    .value-card {
      flex: 1;
      background: white;
      padding: 10px;
      border-radius: 8px;
      text-align: center;
    }
    
    .value-amount {
      font-size: 20px;
      font-weight: 700;
      color: var(--green);
    }
    
    .value-label {
      font-size: 12px;
      font-weight: 600;
      color: #065f46;
      margin-top: 4px;
    }
    
    .value-detail {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
    }
    
    /* =========================== HIGHLIGHTS =========================== */
    .highlights {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .highlights.compact {
      margin-bottom: 6px;
    }
    
    /* Narrative continuation — lighter than full section */
    .narrative-continuation {
      margin-top: 8px;
      margin-bottom: 2px;
    }
    .subsection-heading {
      font-size: ${density === 'compact' ? '13px' : '14px'};
      font-weight: 600;
      color: var(--navy-dark);
      margin-bottom: 4px;
      break-after: avoid;
    }
    
    .highlight-tag {
      font-size: 10px;
      padding: 4px 10px;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 12px;
      font-weight: 500;
    }
    
    /* =========================== TABLES =========================== */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    th, td {
      padding: 6px 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: var(--navy);
      color: white;
      font-weight: 600;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    /* Page breaks for proper print layout */
    .page-break-before { page-break-before: always; }
    
    /* Value Waterfall */
    .waterfall-section { page-break-inside: avoid; }
    .waterfall-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .waterfall-item:last-child { border-bottom: 2px solid #1e293b; }
    .wf-left { flex: 1; }
    .wf-detail { font-size: 0.85em; color: #64748b; margin-top: 2px; }
    .wf-evidence { font-size: 0.82em; color: #475569; margin-top: 4px; }
    .wf-remedy { font-size: 0.82em; color: #059669; margin-top: 2px; }
    .wf-amount { font-weight: 700; font-size: 1.1em; min-width: 80px; text-align: right; }
    .wf-amount.positive { color: #059669; }
    .wf-amount.negative { color: #dc2626; }
    .baseline-item { background: #f8fafc; border-radius: 8px 8px 0 0; }
    .surplus-item { background: #f0fdf4; }
    .current-item { background: #eff6ff; border-radius: 0 0 8px 8px; font-size: 1.1em; }
    .suppressor-item { border-left: 3px solid #e2e8f0; }
    .suppressor-item.severity-critical { border-left-color: #dc2626; }
    .suppressor-item.severity-high { border-left-color: #f59e0b; }
    .suppressor-item.severity-medium { border-left-color: #3b82f6; }

    /* Surplus Cash Breakdown */
    .surplus-hero { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
    .surplus-amount { font-size: 1.7em; font-weight: 800; color: #059669; }
    .surplus-pct { font-size: 0.9em; color: #64748b; }
    .surplus-bonus { background: #065f46; color: white; border-radius: 8px; padding: 8px 16px; margin-top: 12px; font-size: 0.9em; }
    .surplus-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .surplus-table td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
    .surplus-table .amount { text-align: right; font-weight: 600; }
    .surplus-table .amount.negative { color: #dc2626; }
    .surplus-table .amount.positive { color: #059669; }
    .surplus-total { background: #f0fdf4; }
    .surplus-total td { border-top: 2px solid #059669; font-size: 1.1em; }
    .wc-breakdown { margin-top: 10px; }
    .wc-breakdown h4 { font-size: 0.85em; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    .surplus-table.small td { padding: 4px 12px; font-size: 0.9em; }
    .wc-total td { border-top: 1px solid #94a3b8; }
    .wc-explanation { background: #ecfdf5; padding: 10px 14px; border-radius: 8px; margin-top: 8px; font-size: 0.85em; color: #047857; }
    .surplus-methodology { font-size: 0.78em; color: #94a3b8; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; }

    /* Margin Impact / Scenario Explorer */
    .margin-impact-section { /* panels handle own breaks */ }
    .margin-scenario { display: flex; gap: 12px; margin: 8px 0; break-inside: avoid; }
    .scenario-left, .scenario-right { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .scenario-target { display: flex; justify-content: space-between; align-items: center; margin: 8px 0; }
    .scenario-target strong { font-size: 1.2em; color: #059669; }
    .scenario-current { font-size: 0.82em; color: #64748b; }
    .impact-hero { background: #059669; color: white; border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; }
    .impact-hero .impact-value { font-size: 1.3em; font-weight: 800; }
    .impact-hero .impact-value span { font-size: 0.5em; font-weight: 400; }
    .impact-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.88em; }
    .impact-detail { font-size: 0.78em; color: #94a3b8; }
    .how-to-achieve { margin-top: 6px; font-size: 0.82em; margin-bottom: 8px; }
    .how-to-achieve div { color: #334155; margin: 2px 0; }

    /* =========================== PAGINATION CONTROL =========================== */
    /* NO forced page breaks. Content flows. break-inside:avoid on atomic blocks. */
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    p, .narrative-text { orphans: 3; widows: 3; }
    .section-title, h2, h3 { break-after: avoid; }
    .metric-card, .suppressor-card, .recommendation-card,
    .scenario-card, .service-card, .waterfall-item,
    .margin-scenario, .exit-score-display, .path-to-exit,
    .value-protectors, .path-to-value, .surplus-hero,
    .hero-metrics, .closing-box, .contact-cta,
    .potential-value-box, .highlight-section,
    .exit-component, .protector-card {
      break-inside: avoid;
    }
    .page-break-before { break-before: page; }

    /* Value Protectors */
    .value-protectors { background: #f0fdf4; border-radius: 8px; padding: 12px; margin: 10px 0; }
    .protectors-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .protector-card { background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #059669; }
    .protector-name { font-weight: 600; color: #065f46; }
    .protector-desc { font-size: 0.9em; color: #374151; margin: 4px 0; }
    .protector-impact { color: #059669; font-weight: 600; }

    /* Path to Full Value */
    .path-to-value { background: #eff6ff; border-radius: 8px; padding: 12px; margin: 10px 0; }
    .path-actions { list-style: none; padding: 0; }
    .path-action { display: flex; align-items: center; gap: 10px; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
    .action-number { width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8em; }
    .potential-value-box { background: white; padding: 12px; border-radius: 8px; text-align: center; margin-top: 10px; }
    .pv-amount { font-size: 1.6em; font-weight: 700; color: #059669; }
    .pv-uplift { color: #059669; }

    /* Scenario enhancements */
    .scenario-card { break-inside: avoid; padding: 10px; }
    .scenario-card th, .scenario-card td { padding: 4px 8px; font-size: 9.5px; }
    .scenario-card table { margin: 6px 0; }
    .scenario-card h3 { margin: 0 0 4px 0; font-size: 13px; }
    .scenario-card > p { margin: 0 0 4px 0; font-size: 10px; }
    .scenario-card ul { margin: 2px 0; padding-left: 14px; }
    .scenario-card li { margin-bottom: 1px; font-size: 9.5px; }
    .scenario-risks { background: #fef2f2; padding: 6px 10px; border-radius: 6px; margin: 6px 0; }
    .scenario-risks h4 { color: #dc2626; margin: 0 0 3px 0; font-size: 10px; }
    .scenario-considerations { background: #fffbeb; padding: 6px 10px; border-radius: 6px; margin: 6px 0; }
    .scenario-considerations h4 { color: #d97706; margin: 0 0 3px 0; font-size: 10px; }

    /* Services */
    .services-grid { display: flex; flex-direction: column; gap: 12px; }
    .service-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; break-inside: avoid; }
    .service-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .service-price { font-weight: 600; color: #0f172a; }
    .service-frequency { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
    .service-name { font-size: 1.2em; font-weight: 600; margin: 0 0 4px 0; }
    .service-tagline { color: #64748b; margin: 0 0 12px 0; }
    .service-why, .service-deliverables, .service-outcome { margin: 6px 0; }
    .service-why h4, .service-deliverables h4, .service-outcome h4 { font-size: 0.9em; color: #475569; margin: 0 0 4px 0; }
    .service-meta { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 0.85em; color: #64748b; }
    .service-value { font-weight: 600; color: #059669; }
  </style>
</head>
<body>
  ${sectionsHTML}
</body>
</html>
  `;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { reportId, pdfConfig, returnHtml, siteUrl } = await req.json();

    if (!reportId) {
      throw new Error('reportId is required');
    }

    console.log('[PDF Export] Starting for reportId:', reportId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: report, error: reportError } = await supabase
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', reportId)
      .single();

    if (reportError || !report) {
      console.error('[PDF Export] Report not found:', reportError);
      throw new Error(`Report not found: ${reportError?.message || 'No data'}`);
    }

    console.log('[PDF Export] Report found:', {
      engagement_id: report.engagement_id,
      has_value_analysis: !!report.value_analysis,
      has_enhanced_suppressors: !!report.enhanced_suppressors,
      has_exit_readiness: !!report.exit_readiness_breakdown,
      suppressor_count: report.enhanced_suppressors?.length || 0,
    });

    let clientName = 'Client';
    const { data: engagement } = await supabase
      .from('bm_engagements')
      .select('client_id')
      .eq('id', reportId)
      .single();

    if (engagement?.client_id) {
      const { data: client } = await supabase
        .from('practice_members')
        .select('name')
        .eq('id', engagement.client_id)
        .single();
      clientName = client?.name || 'Client';
    }

    console.log('[PDF Export] Client name:', clientName);

    // Primary: recommended_services from report (same source as web client)
    let clientServices: any[] = [];
    const recommendedServices = report.recommended_services;
    if (Array.isArray(recommendedServices) && recommendedServices.length > 0) {
      clientServices = recommendedServices.map((r: any) => ({
        name: r.serviceName || r.name,
        tagline: r.headline || r.tagline || '',
        priceRange: r.priceRange || r.price_range || 'Price on application',
        frequency: r.frequency || (r.pricePeriod === 'one-off' ? 'One-off' : r.pricePeriod === 'monthly' ? 'Monthly' : 'One-off'),
        whyThisMatters: r.whyThisMatters || r.fitRationale || '',
        whatYouGet: r.whatYouGet || r.deliverables || [],
        expectedOutcome: r.expectedOutcome || '',
        addressesValue: r.totalValueAtStake || r.addressesValue || 0,
        isPrimary: r.isPrimary !== false,
        addressesIssues: r.addressesIssues || [],
      }));
      console.log('[PDF Export] Services from recommended_services:', clientServices.length);
    }

    // Fallback: client_opportunities
    if (clientServices.length === 0) {
    try {
      const { data: opportunities } = await supabase
        .from('client_opportunities')
        .select('*, service:services(code, name, headline, price_from, price_to, price_period, price_unit, price_display, deliverables)')
        .eq('engagement_id', reportId)
        .order('financial_impact_amount', { ascending: false });

      if (opportunities && opportunities.length > 0) {
        const serviceMap = new Map<string, any>();
        for (const opp of opportunities) {
          const svc = opp.service;
          if (!svc) continue;
          const key = svc.code || svc.name;
          if (!serviceMap.has(key)) {
            serviceMap.set(key, {
              name: svc.name || key,
              tagline: svc.headline || '',
              priceRange: svc.price_from != null && svc.price_to != null
                ? `${formatCurrency(Number(svc.price_from))} – ${formatCurrency(Number(svc.price_to))}`
                : svc.price_from != null
                ? `From ${formatCurrency(Number(svc.price_from))}`
                : svc.price_display || 'Price on application',
              frequency: svc.price_period === 'one-off' ? 'One-off' :
                svc.price_period === 'quarterly' ? 'Quarterly' :
                svc.price_period === 'monthly' ? 'Monthly' :
                (svc.price_unit || '').includes('month') ? 'Monthly' :
                (svc.price_unit || '').includes('project') ? 'One-off' : 'Monthly',
              whyThisMatters: opp.talking_point || opp.data_evidence || '',
              whatYouGet: Array.isArray(svc.deliverables) ? svc.deliverables : [],
              expectedOutcome: opp.impact_calculation || `Addresses issues worth ${formatCurrency(Number(opp.financial_impact_amount) || 0)} in potential value`,
              addressesValue: Number(opp.financial_impact_amount) || 0,
            });
          } else {
            const existing = serviceMap.get(key)!;
            existing.addressesValue += (Number(opp.financial_impact_amount) || 0);
          }
        }
        clientServices = Array.from(serviceMap.values());
        console.log('[PDF Export] Services from opportunities:', clientServices.length);
      }
    } catch (e) {
      console.log('[PDF Export] Could not fetch client_opportunities:', e);
    }
    }

    // Normalise BI/Benchmarking to show both monthly and quarterly options
    const isBIOrBenchmarking = (s: any) => {
      const n = (s.name || '').toLowerCase();
      const c = (s.code || '').toLowerCase();
      return n.includes('bi') || n.includes('benchmarking') || c === 'business_intelligence' || c === 'benchmarking';
    };
    clientServices = clientServices.map((s: any) =>
      isBIOrBenchmarking(s)
        ? { ...s, priceRange: '£500 – £1,000/month or £1,500 – £3,000/quarter', frequency: 'Monthly or Quarterly' }
        : s
    );

    let effectiveConfig: PdfConfig;
    if (pdfConfig) {
      effectiveConfig = pdfConfig;
    } else if (report.pdf_config) {
      effectiveConfig = report.pdf_config;
    } else {
      effectiveConfig = {
        sections: [
          { id: 'cover', enabled: true, config: {} },
          { id: 'executiveSummary', enabled: true, config: { showHeroMetrics: true } },
          { id: 'hiddenValue', enabled: true, config: { showBreakdown: true } },
          { id: 'surplusCashBreakdown', enabled: true, config: {} },
          { id: 'keyMetrics', enabled: true, config: { layout: 'detailed', showPercentileBars: true, showGapIndicators: true } },
          { id: 'positionNarrative', enabled: true, config: {} },
          { id: 'strengthsNarrative', enabled: true, config: {} },
          { id: 'gapsNarrative', enabled: true, config: {} },
          { id: 'opportunityNarrative', enabled: true, config: {} },
          { id: 'recommendations', enabled: true, config: { detailLevel: 'full', showImplementationSteps: true, showStartThisWeek: true } },
          { id: 'valuationAnalysis', enabled: true, config: { showSurplusCashAdd: true } },
          { id: 'valueWaterfall', enabled: true, config: {} },
          { id: 'valueSuppressors', enabled: true, config: { layout: 'cards', showRecoveryTimelines: true, showTargetStates: true } },
          { id: 'valueProtectors', enabled: true, config: {} },
          { id: 'pathToValue', enabled: true, config: {} },
          { id: 'exitReadiness', enabled: true, config: { showComponentBreakdown: true, showPathTo70: true } },
          { id: 'scenarioPlanning', enabled: true, config: { layout: 'sequential', showRequirements: true } },
          { id: 'serviceRecommendations', enabled: true, config: { showPricing: true, showValueAtStake: true, showOutcomes: true } },
          { id: 'closingSummary', enabled: true, config: { showContactCTA: true, showDataSources: true } },
        ],
        pdfSettings: { pageSize: 'A4', margins: { top: 12, right: 12, bottom: 12, left: 12 }, headerFooter: true, coverPage: true, density: 'comfortable' },
        tier: 2,
      };
    }

    const valueAnalysis = report.value_analysis || {};
    const baseline = valueAnalysis.baseline || {};
    const exitReadinessFromVal = valueAnalysis.exitReadiness || {};
    const enhancedSuppressors = report.enhanced_suppressors || [];
    const exitBreakdown = report.exit_readiness_breakdown || {};
    const valueAnalysisSuppressors = (report.value_analysis?.suppressors || []).map((s: any) => ({
      code: s.code || s.id,
      name: s.name,
      severity: s.severity,
      current: {
        value: s.evidence?.split(' ')[0] || '',
        metric: '',
        discountPercent: s.discountPercent?.mid ?? ((s.discountPercent?.low || 0) + (s.discountPercent?.high || 0)) / 2,
        discountValue: s.impactAmount?.mid ?? ((s.impactAmount?.low || 0) + (s.impactAmount?.high || 0)) / 2,
      },
      target: { value: '', metric: '' },
      recovery: {
        valueRecoverable: 0,
        timeframe: s.remediationTimeMonths ? `${s.remediationTimeMonths} months` : '12-24 months',
      },
      evidence: s.evidence || '',
      whyThisDiscount: s.whyThisDiscount || '',
      pathToFix: { summary: s.remediationService || '', steps: [], investment: 0, dependencies: [] },
      impactAmount: s.impactAmount,
      discountPercent: s.discountPercent,
      remediationService: s.remediationService,
      remediationTimeMonths: s.remediationTimeMonths,
    }));

    // Merge suppressors: enhanced are richer, add only genuinely missing items from value_analysis
    const enhancedKeys = new Set(enhancedSuppressors.map((s: any) => normalizeSuppressorKey(s)));
    const missingFromValueAnalysis = valueAnalysisSuppressors.filter((s: any) => {
      const key = normalizeSuppressorKey(s);
      return !enhancedKeys.has(key);
    });
    const allSuppressors = [...enhancedSuppressors, ...missingFromValueAnalysis];
    console.log('[PDF Export] Suppressor merge:', {
      enhancedKeys: Array.from(enhancedKeys),
      enhancedCount: enhancedSuppressors.length,
      missingCount: missingFromValueAnalysis.length,
      missingNames: missingFromValueAnalysis.map((s: any) => s.name),
      totalCount: allSuppressors.length,
    });

    const currentValue = valueAnalysis.currentMarketValue?.mid || 0;
    const potentialValue = valueAnalysis.potentialValue?.mid || 0;
    const exitScore = exitBreakdown.totalScore || 0;
    const enrichedRevenue = report.pass1_data?._enriched_revenue || 63300000;

    console.log('[PDF Export] Enhanced suppressors:', enhancedSuppressors.length);
    console.log('[PDF Export] All suppressors:', allSuppressors.length);
    console.log('[PDF Export] Exit readiness:', exitScore);

    const reportData = {
      clientName,
      siteUrl: siteUrl || Deno.env.get('SITE_URL') || undefined,
      tier: 2,
      overallPercentile: report.overall_percentile || 50,
      totalOpportunity: parseFloat(report.total_annual_opportunity) || 0,
      surplusCash: report.surplus_cash?.surplusCash || report.pass1_data?.surplus_cash?.surplusCash || 0,
      freeWorkingCapital: Math.abs(report.surplus_cash?.components?.netWorkingCapital || 0),
      freeholdProperty: report.balance_sheet?.freehold_property || report.pass1_data?.balance_sheet?.freeholdProperty || 0,
      executiveSummary: report.executive_summary || '',
      headline: report.headline || report.pass1_data?.headline || '',
      positionNarrative: report.position_narrative || '',
      strengthsNarrative: report.strength_narrative || '',
      gapsNarrative: report.gap_narrative || '',
      opportunityNarrative: report.opportunity_narrative || '',
      twoPathsNarrative: report.two_paths_narrative?.operational || report.two_paths_narrative?.overview || '',
      closingSummary: report.closing_summary || report.position_summed_up || report.opportunity_narrative || report.executive_summary || '',
      gapCount: report.gap_count || 0,
      strengthCount: report.strength_count || 0,
      metrics: report.metrics_comparison || [],
      recommendations: Array.isArray(report.recommendations) ? report.recommendations : (typeof report.recommendations === 'string' ? JSON.parse(report.recommendations || '[]') : []),
      surplusCashBreakdown: report.surplus_cash_breakdown || report.surplus_cash || report.pass1_data?.surplus_cash_breakdown || report.pass1_data?.surplus_cash || null,
      revenue: report.pass1_data?.revenue || report.pass1_data?.financials?.revenue || report.pass1_data?._enriched_revenue || 63328519,
      pass1Data: report.pass1_data || {},
      valuation: {
        baseline: {
          enterpriseValue: baseline.enterpriseValue || { low: 0, mid: 0, high: 0 },
          multipleRange: baseline.multipleRange || { low: 0, mid: 5, high: 0 },
          surplusCash: baseline.surplusCash || 0,
          totalBaseline: baseline.totalBaseline,
          multipleJustification: baseline.multipleJustification || '',
        },
        adjustedEV: valueAnalysis.adjustedEV || { low: 0, mid: 0, high: 0 },
        currentMarketValue: valueAnalysis.currentMarketValue || { low: 0, mid: 0, high: 0 },
        valueGap: valueAnalysis.valueGap || { low: 0, mid: 0, high: 0 },
        valueGapPercent: valueAnalysis.valueGapPercent || 0,
        potentialValue: valueAnalysis.potentialValue || { low: 0, mid: 0, high: 0 },
        suppressors: valueAnalysis.suppressors || [],
        enhancers: valueAnalysis.enhancers || [],
        exitReadiness: {
          score: exitReadinessFromVal.score || 0,
          verdict: exitReadinessFromVal.verdict || 'not_ready',
          blockers: exitReadinessFromVal.blockers || [],
          strengths: exitReadinessFromVal.strengths || [],
        },
        pathToValue: valueAnalysis.pathToValue || { timeframeMonths: 24, recoverableValue: { low: 0, mid: 0, high: 0 }, keyActions: [] },
        aggregateDiscount: valueAnalysis.aggregateDiscount || { percentRange: { low: 0, mid: 0, high: 0 }, methodology: '' },
      },
      suppressors: allSuppressors.map((s: any) => ({
        code: s.code || s.id || '',
        name: s.name || '',
        severity: s.severity || 'MEDIUM',
        current: {
          value: s.current?.value || '0%',
          metric: s.current?.metric || '',
          discountPercent: s.current?.discountPercent ?? 0,
          discountValue: s.current?.discountValue ?? 0,
          waterfallAmount: s.waterfallAmount ?? s.current?.waterfallAmount,
        },
        target: { value: s.target?.value || '', metric: s.target?.metric || '' },
        recovery: { valueRecoverable: s.recovery?.valueRecoverable ?? 0, timeframe: s.recovery?.timeframe || '12-24 months' },
        evidence: s.evidence || '',
        whyThisDiscount: s.whyThisDiscount || '',
        industryContext: s.industryContext || '',
        pathToFix: s.pathToFix || { summary: '', steps: [], investment: 0, dependencies: [] },
        waterfallAmount: s.waterfallAmount ?? s.current?.waterfallAmount,
        methodology: s.methodology || null,
      })),
      exitReadiness: {
        totalScore: exitBreakdown.totalScore || 0,
        maxScore: exitBreakdown.maxScore || 100,
        level: exitBreakdown.level || 'not_ready',
        levelLabel: exitBreakdown.levelLabel || 'Not Exit Ready',
        components: (exitBreakdown.components || []).map((c: any) => ({
          id: c.id || '',
          name: c.name || '',
          currentScore: c.currentScore || 0,
          maxScore: c.maxScore || 25,
          targetScore: c.targetScore || 20,
          gap: c.gap || '',
        })),
        pathTo70: exitBreakdown.pathTo70 || { actions: [], timeframe: '18-24 months', investment: 150000, valueUnlocked: 0 },
      },
      scenarios: [
        {
          id: 'do_nothing',
          title: 'If You Do Nothing',
          description: 'Continue current operations without structural changes',
          timeframe: '24 months',
          metrics: [
            { label: 'Client Concentration', current: '99%', projected: '99%', impact: 'Unchanged - risk remains' },
            { label: 'Business Value', current: formatCurrency(currentValue), projected: formatCurrency(currentValue), impact: 'No improvement - discount persists' },
            { label: 'Owner Freedom', current: 'Trapped', projected: 'Still trapped', impact: 'Cannot step back without successor' },
            { label: 'Risk Exposure', current: 'Critical', projected: 'Critical', impact: 'One client loss = existential' },
          ],
          risks: [
            'Loss of any major client is existential crisis',
            'Owner health issue = business crisis',
            'Market downturn hits concentrated revenue hard',
            'Business remains unsellable at fair value',
          ],
        },
        {
          id: 'diversify',
          title: 'If You Actively Diversify',
          description: 'Use surplus cash to build broader client base',
          timeframe: '24-36 months',
          metrics: [
            { label: 'Client Concentration', current: '99%', projected: '60-70%', impact: 'Reduced by 30+ points' },
            { label: 'Revenue', current: formatCurrency(enrichedRevenue), projected: formatCurrency(enrichedRevenue * 1.15), impact: '+15% from new clients' },
            { label: 'Business Value', current: formatCurrency(currentValue), projected: formatCurrency(potentialValue * 0.95), impact: `+${formatCurrency(Math.round(potentialValue * 0.95 - currentValue))} unlocked` },
            { label: 'Risk Profile', current: 'Existential', projected: 'Manageable', impact: "Losing one client hurts but doesn't kill" },
          ],
          requirements: [
            'Deploy £2-3M of the £7.7M surplus into BD or acquisition',
            'Hire dedicated business development resource',
            'Target adjacent sectors (new frameworks, new industries)',
            'Accept lower margins on new clients initially',
          ],
          considerations: [
            'New client acquisition takes 12-18 months to show results',
            'Requires management attention alongside existing delivery',
            'New clients may have different margin profiles',
          ],
        },
        {
          id: 'exit_prep',
          title: 'If You Prepare for Exit',
          description: 'Make the business sellable within 3 years',
          timeframe: '24-36 months',
          metrics: [
            { label: 'Documentation', current: 'In heads', projected: 'Fully documented', impact: 'IP becomes transferable asset' },
            { label: 'Owner Dependency', current: '70-80%', projected: '<40%', impact: 'Successor in place and trained' },
            { label: 'Exit Readiness', current: `${exitScore}/100`, projected: '70+/100', impact: 'Attractive to trade buyers or PE' },
            { label: 'Business Value', current: formatCurrency(currentValue), projected: formatCurrency(potentialValue * 0.9), impact: `+${formatCurrency(Math.round(potentialValue * 0.9 - currentValue))} exit premium` },
          ],
          requirements: [
            'Document core methodology and IP',
            'Run systems audit to identify and document critical processes',
            'Identify successor pathway (internal development or structured transition)',
            'Engage strategic advisor to support leadership transition',
            'Build client relationships beyond founder',
            'Formalise contract terms with all majors',
          ],
          considerations: [
            'Concentration still impacts valuation even with other fixes',
            'Internal succession pathway requires right candidate',
            'Requires 2-3 years minimum commitment',
          ],
        },
      ],
      services: clientServices,
      dataSources: report.data_sources || [],
    };

    console.log('[PDF Export] Report data built:', {
      clientName: reportData.clientName,
      overallPercentile: reportData.overallPercentile,
      totalOpportunity: reportData.totalOpportunity,
      suppressorCount: reportData.suppressors.length,
      exitScore: reportData.exitReadiness.totalScore,
      hasValuation: !!reportData.valuation.baseline.enterpriseValue.mid,
    });

    const html = generateReportHTML(reportData, effectiveConfig);
    
    // If returnHtml is true, just return the HTML for preview/browser print
    if (returnHtml) {
      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Otherwise, use Puppeteer/browser service to generate PDF
    // For now, we'll use a cloud browser service endpoint
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    
    if (!browserlessApiKey) {
      // Fall back to returning HTML if no browser service configured
      console.log('No BROWSERLESS_API_KEY configured, returning HTML');
      return new Response(JSON.stringify({ 
        html,
        message: 'PDF generation requires BROWSERLESS_API_KEY. Returning HTML for browser print.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Call Browserless v2 PDF endpoint (London for lower latency)
    const browserlessEndpoint = Deno.env.get('BROWSERLESS_ENDPOINT') || 'https://production-lon.browserless.io';
    console.log(`[PDF Export] Calling Browserless at ${browserlessEndpoint}/pdf`);

    const pdfResponse = await fetch(
      `${browserlessEndpoint}/pdf?token=${browserlessApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          options: {
            format: effectiveConfig.pdfSettings?.pageSize || 'A4',
            margin: {
              top: `${effectiveConfig.pdfSettings?.margins?.top || 12}mm`,
              right: `${effectiveConfig.pdfSettings?.margins?.right || 12}mm`,
              bottom: `${effectiveConfig.pdfSettings?.margins?.bottom || 12}mm`,
              left: `${effectiveConfig.pdfSettings?.margins?.left || 12}mm`,
            },
            printBackground: true,
            preferCSSPageSize: true,
          },
        }),
      }
    );

    if (!pdfResponse.ok) {
      const errorBody = await pdfResponse.text();
      console.error(`[PDF Export] Browserless error: ${pdfResponse.status} - ${errorBody}`);
      // Fall back to HTML on Browserless failure
      return new Response(JSON.stringify({
        html,
        error: `PDF generation failed (${pdfResponse.status}). Falling back to browser print.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`[PDF Export] PDF generated: ${pdfBuffer.byteLength} bytes`);

    try {
      await supabase
        .from('bm_reports')
        .update({ updated_at: new Date().toISOString() })
        .eq('engagement_id', reportId);
    } catch (e) {
      console.log('[PDF Export] Could not update timestamp:', e);
    }

    // Return PDF as base64 JSON (supabase.functions.invoke can't handle binary)
    const uint8 = new Uint8Array(pdfBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Pdf = btoa(binary);

    return new Response(JSON.stringify({
      pdf: base64Pdf,
      filename: `${reportData.clientName}-Benchmarking-Report.pdf`,
      size: pdfBuffer.byteLength,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
