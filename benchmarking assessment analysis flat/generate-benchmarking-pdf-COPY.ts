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

// Cover Page
function renderCover(data: any, config: any): string {
  return `
    <div class="page cover-page">
      <div class="cover-header">
        <div class="logo">RPGCC</div>
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
  
  return `
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      ${showHero ? `
        <div class="hero-metrics">
          <div class="hero-metric">
            <div class="metric-value teal">${data.overallPercentile || 50}th</div>
            <div class="metric-label">Overall Percentile</div>
          </div>
          <div class="hero-metric">
            <div class="metric-value teal">${formatCurrency(data.totalOpportunity || 0)}</div>
            <div class="metric-label">Annual Opportunity</div>
          </div>
          <div class="hero-metric">
            <div class="metric-value green">${formatCurrency(data.surplusCash || 0)}</div>
            <div class="metric-label">Surplus Cash</div>
          </div>
        </div>
      ` : ''}
      <div class="narrative-text">${data.executiveSummary || ''}</div>
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

// Key Metrics
function renderKeyMetrics(data: any, config: any): string {
  const metrics = data.metrics || [];
  const layout = config.layout || 'detailed';
  const showBars = config.showPercentileBars !== false;
  
  return `
    <div class="section">
      <h2 class="section-title">Key Metrics</h2>
      <p class="section-subtitle">How you compare to industry benchmarks</p>
      <div class="metrics-grid ${layout}">
        ${metrics.map((m: any) => {
          const clientVal = Number(m.value ?? m.clientValue ?? 0);
          const medianVal = Number(m.median ?? m.p50 ?? 0);
          const gap = clientVal - medianVal;
          const fmt = m.format || '';
          const isPercentage = fmt === 'percent' || m.unit === '%' || m.id?.includes('margin') || m.id?.includes('growth');
          const isCurrency = fmt === 'currency' || m.unit === '£' || m.id?.includes('revenue_per');
          const isDays = m.id?.includes('days') || m.unit === 'days';
          const lowerIsBetter = m.lowerIsBetter === true;

          let statusText = '';
          if (Math.abs(gap) < 0.01) {
            statusText = 'At median';
          } else if (lowerIsBetter) {
            statusText = gap < 0
              ? `+${isDays ? Math.abs(gap).toFixed(0) : Math.abs(gap).toFixed(1)}${isDays ? ' days' : isPercentage ? '%' : ''} Advantage`
              : `${isDays ? gap.toFixed(0) : gap.toFixed(1)}${isDays ? ' days' : isPercentage ? '%' : ''} Gap`;
          } else {
            statusText = gap > 0
              ? `+${isCurrency ? formatCurrency(gap) : (isPercentage ? gap.toFixed(1) : gap.toFixed(0)) + (isPercentage ? '%' : '')} Advantage`
              : `${isCurrency ? formatCurrency(Math.abs(gap)) : (isPercentage ? Math.abs(gap).toFixed(1) : Math.abs(gap).toFixed(0)) + (isPercentage ? '%' : '')} Gap`;
          }
          const statusClass = gap < 0 ? 'gap' : gap > 0 ? 'advantage' : 'neutral';
          const displayValue = isCurrency ? formatCurrency(clientVal) : `${clientVal.toFixed(isPercentage ? 1 : 0)}${isPercentage ? '%' : isDays ? ' days' : ''}`;
          const displayMedian = isCurrency ? formatCurrency(medianVal) : `${medianVal}${isPercentage ? '%' : isDays ? ' days' : ''}`;

          return `
            <div class="metric-card ${statusClass}">
              <div class="metric-header">
                <span class="metric-name">${m.name || m.metricName}</span>
                <span class="metric-percentile">${m.percentile || 50}th percentile</span>
              </div>
              <div class="metric-values">
                <div class="your-value">${displayValue}</div>
                <div class="median-value">Median: ${displayMedian}</div>
              </div>
              ${showBars ? `
                <div class="percentile-bar">
                  <div class="bar-fill" style="width: ${m.percentile || 50}%"></div>
                  <div class="bar-marker" style="left: ${m.percentile || 50}%"></div>
                </div>
              ` : ''}
              <div class="metric-status ${statusClass}">${statusText}</div>
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

// Recommendations
function renderRecommendations(data: any, config: any): string {
  const recommendations = data.recommendations || [];
  const detailLevel = config.detailLevel || 'standard';
  const showSteps = config.showImplementationSteps && detailLevel === 'full';
  const showStartWeek = config.showStartThisWeek && detailLevel === 'full';
  
  return `
    <div class="section">
      <h2 class="section-title">Recommendations</h2>
      <div class="total-opportunity">
        Total Opportunity: <strong>${formatCurrency(data.totalOpportunity || 0)}</strong>
      </div>
      <div class="recommendations-list">
        ${recommendations.map((rec: any, i: number) => `
          <div class="recommendation-card">
            <div class="rec-header">
              <span class="rec-number">${i + 1}</span>
              <div class="rec-title">${rec.title}</div>
              ${rec.value ? `<span class="rec-value">${formatCurrency(rec.value)}/yr</span>` : ''}
            </div>
            ${detailLevel !== 'summary' ? `
              <div class="rec-description">${rec.description || ''}</div>
              <div class="rec-meta">
                <span class="effort-badge ${rec.effort?.toLowerCase()}">${rec.effort || 'Medium'}</span>
                <span class="timeframe">${rec.timeframe || '12 months'}</span>
              </div>
            ` : ''}
            ${showSteps && rec.howTo ? `
              <div class="rec-steps">
                <strong>How to implement:</strong>
                <ul>
                  ${rec.howTo.map((step: string) => `<li>${step}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${showStartWeek && rec.startThisWeek ? `
              <div class="rec-immediate">
                <strong>Start this week:</strong>
                <ul>
                  ${rec.startThisWeek.map((action: string) => `<li>→ ${action}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
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

// Value Suppressors
function renderSuppressors(data: any, config: any): string {
  const suppressors = data.suppressors || [];

  if (suppressors.length === 0) {
    return '<div class="section"><p>No value suppressors identified.</p></div>';
  }

  return `
    <div class="section">
      <h2 class="section-title">Where Your Value Is Going</h2>
      <div class="suppressors-grid">
        ${suppressors.map((s: any) => {
          const discountPct = s.current?.discountPercent ?? s.discount ?? 0;
          const discountVal = s.current?.discountValue ?? s.valueLoss ?? 0;
          const currentState = s.current?.value
            ? `${s.current.value}${s.current.metric ? ' ' + s.current.metric : ''}`
            : (s.current || s.evidence || '');
          const targetState = s.target?.value
            ? `${s.target.value}${s.target.metric ? ' ' + s.target.metric : ''}`
            : (s.target || '');
          const recoverable = s.recovery?.valueRecoverable ?? s.recoverable ?? 0;
          const timeframe = s.recovery?.timeframe ?? s.timeframe ?? '12-24 months';
          return `
            <div class="suppressor-card severity-${(s.severity || 'medium').toLowerCase()}">
              <div class="supp-header">
                <span class="supp-name">${s.name || 'Unknown'}</span>
                <span class="severity-badge ${(s.severity || 'MEDIUM').toLowerCase()}">${s.severity || 'MEDIUM'}</span>
              </div>
              <div class="supp-impact">
                <span class="discount">-${discountPct}%</span>
                <span class="value-loss">${formatCurrency(discountVal)}</span>
              </div>
              ${config.showTargetStates !== false ? `
                <div class="supp-states">
                  <div class="current-state"><strong>Current:</strong> ${currentState}</div>
                  <div class="target-state"><strong>Target:</strong> ${targetState}</div>
                </div>
              ` : ''}
              ${config.showRecoveryTimelines !== false ? `
                <div class="supp-recovery">
                  <span class="recoverable">${formatCurrency(recoverable)}</span>
                  <span class="timeframe">${timeframe}</span>
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
      description: `${formatCurrency(surplusCash)} surplus above operating requirements`,
      impact: surplusCash,
      impactLabel: `+${formatCurrency(surplusCash)} to value`,
    },
    {
      name: 'High Revenue per Employee',
      description: `${formatCurrency(data.metrics?.find((m: any) => m.id === 'revenue_per_employee')?.clientValue || 483000)} per employee - indicates efficient operations`,
      impact: 0,
      impactLabel: '',
    },
  ].filter((p: any) => p.impact > 0 || p.description);

  if (protectors.length === 0) return '';

  return `
    <div class="section value-protectors">
      <h3 class="subsection-title">✨ Value Protectors</h3>
      <div class="protectors-grid">
        ${protectors.map((p: any) => `
          <div class="protector-card">
            <div class="protector-name">${p.name}</div>
            <div class="protector-desc">${p.description}</div>
            ${p.impactLabel ? `<div class="protector-impact">${p.impactLabel}</div>` : ''}
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
            const compAction = c.gap ?? c.action ?? '';
            return `
              <div class="component-row">
                <span class="comp-name">${c.name || c.id || 'Unknown'}</span>
                <div class="comp-bar">
                  <div class="comp-fill" style="width: ${(compScore / compMax) * 100}%"></div>
                </div>
                <span class="comp-score">${compScore}/${compMax}</span>
                ${compAction ? `<span class="comp-action">${compAction}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      ${config.showPathTo70 !== false && (pathTo70.timeframe || pathTo70.timeline) ? `
        <div class="path-to-70">
          <h3>Path to Exit Ready (70/100)</h3>
          <div class="path-metrics">
            <div class="path-item">
              <span class="path-label">Timeline</span>
              <span class="path-value">${pathTo70.timeframe || pathTo70.timeline || '18-24 months'}</span>
            </div>
            <div class="path-item">
              <span class="path-label">Investment</span>
              <span class="path-value">${formatCurrency(pathTo70.investment || 150000)}</span>
            </div>
            <div class="path-item highlight">
              <span class="path-label">Value Unlocked</span>
              <span class="path-value">${formatCurrency(pathTo70.valueUnlocked || 0)}</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Scenario Planning
function renderScenarioPlanning(data: any, config: any): string {
  const scenarios = data.scenarios || [];

  if (scenarios.length === 0) return '';

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
              <thead>
                <tr><th>Metric</th><th>Today</th><th>Projected</th><th>Impact</th></tr>
              </thead>
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
              <h4>⚠️ What You Risk</h4>
              <ul>${scenario.risks.map((r: string) => `<li>⚠ ${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${scenario.requirements?.length > 0 ? `
            <div class="scenario-requirements">
              <h4>✓ What This Requires</h4>
              <ul>${scenario.requirements.map((r: string) => `<li>✓ ${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
          ${scenario.considerations?.length > 0 ? `
            <div class="scenario-considerations">
              <h4>⚠ Considerations</h4>
              <ul>${scenario.considerations.map((c: string) => `<li>• ${c}</li>`).join('')}</ul>
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
    priceRange: '£500 – £1,000/month',
    frequency: 'Monthly',
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

  if (generatedServices.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">How We Can Help</h2>
        <p>Based on your analysis, we've identified specific services that address your key challenges.</p>
        <p class="cta">Contact your advisor to discuss tailored support options.</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2 class="section-title">How We Can Help</h2>
      <p class="section-subtitle">Based on your analysis, we've identified specific services that address your key challenges.</p>
      <div class="services-grid">
        ${generatedServices.map((service: any) => `
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
              ${service.addressesValue ? `<span class="service-value">Total value at stake: ${formatCurrency(service.addressesValue)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
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
        </div>
      ` : ''}
      ${config.showDataSources && data.dataSources ? `
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
  const density = pdfSettings?.density || 'comfortable';
  
  // Build sections HTML
  let sectionsHTML = '';
  
  for (const section of sections) {
    if (!section.enabled) continue;
    
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
      case 'keyMetrics':
        sectionsHTML += renderKeyMetrics(data, section.config);
        break;
      case 'positionNarrative':
        sectionsHTML += renderNarrative('Where You Stand', data.positionNarrative, [`${data.overallPercentile}th percentile`]);
        break;
      case 'strengthsNarrative':
        sectionsHTML += renderNarrative('Your Strengths', data.strengthsNarrative);
        break;
      case 'gapsNarrative':
        sectionsHTML += renderNarrative('Performance Gaps', data.gapsNarrative, [`${data.gapCount || 0} gaps identified`]);
        break;
      case 'opportunityNarrative':
        sectionsHTML += renderNarrative('The Opportunity', data.opportunityNarrative, [`${formatCurrency(data.totalOpportunity || 0)} potential`]);
        break;
      case 'recommendations':
        sectionsHTML += renderRecommendations(data, section.config);
        break;
      case 'valuationAnalysis':
        sectionsHTML += renderValuation(data, section.config);
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
      line-height: 1.5;
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
      margin-bottom: ${density === 'compact' ? '16px' : density === 'spacious' ? '32px' : '24px'};
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: ${density === 'compact' ? '16px' : '18px'};
      font-weight: 600;
      color: var(--navy-dark);
      margin-bottom: ${density === 'compact' ? '8px' : '12px'};
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .section-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: -8px;
      margin-bottom: 12px;
    }
    
    .narrative-text {
      font-size: ${density === 'compact' ? '9pt' : '10pt'};
      line-height: 1.6;
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
    
    .hero-metric .metric-label {
      font-size: 10px;
      color: var(--blue-light);
      margin-top: 4px;
    }
    
    /* =========================== METRICS GRID =========================== */
    .metrics-grid {
      display: grid;
      gap: ${density === 'compact' ? '8px' : '12px'};
    }
    
    .metrics-grid.compact { grid-template-columns: repeat(2, 1fr); }
    .metrics-grid.detailed { grid-template-columns: repeat(2, 1fr); }
    .metrics-grid.full { grid-template-columns: 1fr; }
    
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: ${density === 'compact' ? '10px' : '14px'};
    }
    
    .metric-card.gap { border-left: 3px solid var(--red); }
    .metric-card.advantage { border-left: 3px solid var(--green); }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .metric-name { font-weight: 600; font-size: 12px; }
    .metric-percentile { font-size: 10px; color: #64748b; }
    
    .metric-values {
      display: flex;
      gap: 16px;
      align-items: baseline;
      margin-bottom: 8px;
    }
    
    .your-value { font-size: 20px; font-weight: 700; color: var(--navy-dark); }
    .median-value { font-size: 11px; color: #64748b; }
    
    .percentile-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      position: relative;
      margin-bottom: 8px;
    }
    
    .bar-fill {
      height: 100%;
      background: var(--teal);
      border-radius: 3px;
    }
    
    .bar-marker {
      position: absolute;
      top: -2px;
      width: 10px;
      height: 10px;
      background: var(--teal);
      border-radius: 50%;
      transform: translateX(-50%);
    }
    
    .metric-status {
      font-size: 10px;
      font-weight: 600;
    }
    
    .metric-status.gap { color: var(--red); }
    .metric-status.advantage { color: var(--green); }
    .metric-status.neutral { color: #64748b; }
    
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
      padding: 14px;
      page-break-inside: avoid;
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
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
    }
    
    .rec-steps ul, .rec-immediate ul {
      margin-top: 6px;
      padding-left: 20px;
    }
    
    .rec-steps li, .rec-immediate li {
      margin-bottom: 4px;
    }
    
    /* =========================== VALUE BRIDGE =========================== */
    .value-bridge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: var(--navy-dark);
      padding: 20px;
      border-radius: 8px;
      color: white;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .bridge-item {
      padding: 12px 20px;
    }
    
    .bridge-value {
      font-size: 24px;
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
      margin-top: 12px;
      padding: 12px;
      background: #d1fae5;
      border-radius: 6px;
      font-size: 11px;
      color: #065f46;
    }
    
    /* =========================== SUPPRESSORS =========================== */
    .suppressors-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .suppressor-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      page-break-inside: avoid;
    }
    
    .suppressor-card.severity-critical { border-left: 3px solid var(--red); background: #fef2f2; }
    .suppressor-card.severity-high { border-left: 3px solid var(--orange); background: #fffbeb; }
    
    .supp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
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
      gap: 12px;
      margin-bottom: 8px;
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
    
    /* =========================== EXIT READINESS =========================== */
    .exit-score-display {
      text-align: center;
      padding: 24px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .score-circle {
      display: inline-block;
    }
    
    .score-circle .score-value {
      font-size: 48px;
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
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .score-circle.red + .score-status { color: var(--red); }
    
    .exit-components {
      margin-top: 16px;
    }
    
    .component-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    
    .comp-name { width: 140px; font-weight: 500; }
    
    .comp-bar {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .comp-fill {
      height: 100%;
      background: var(--teal);
      border-radius: 4px;
    }
    
    .comp-score { width: 50px; text-align: right; font-weight: 600; }
    .comp-action { width: 180px; color: #64748b; font-size: 10px; }
    
    .path-to-70 {
      margin-top: 20px;
      background: var(--teal);
      color: white;
      padding: 16px;
      border-radius: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .path-to-70 h3 {
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .path-metrics {
      display: flex;
      justify-content: space-around;
    }
    
    .path-item {
      text-align: center;
    }
    
    .path-label { font-size: 10px; opacity: 0.8; }
    .path-value { font-size: 18px; font-weight: 700; }
    .path-item.highlight .path-value { color: #fef08a; }
    
    /* =========================== SCENARIOS =========================== */
    .scenarios-sequential {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .scenario-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      page-break-inside: avoid;
    }
    
    .scenario-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--navy-dark);
    }
    
    .scenario-timeframe {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 12px;
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
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
    }
    
    .scenario-requirements ul {
      margin-top: 6px;
      padding-left: 16px;
    }
    
    /* =========================== SERVICES =========================== */
    .services-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .service-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      page-break-inside: avoid;
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
      margin-bottom: 12px;
    }
    
    .service-meta span:not(:last-child)::after { content: ' · '; }
    
    .service-why, .service-outcomes {
      margin-bottom: 12px;
      font-size: 11px;
    }
    
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
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .closing-box p {
      font-size: 12px;
      line-height: 1.7;
    }
    
    .contact-cta {
      text-align: center;
      padding: 20px;
      background: var(--teal);
      color: white;
      border-radius: 8px;
      margin-bottom: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .contact-cta h3 {
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    .contact-details {
      margin-top: 12px;
      font-size: 11px;
    }
    
    .data-sources {
      font-size: 10px;
      color: #64748b;
      padding: 12px;
      background: #f1f5f9;
      border-radius: 6px;
    }
    
    /* =========================== HIGHLIGHT SECTIONS =========================== */
    .highlight-section {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
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
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    
    .value-amount {
      font-size: 24px;
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
      margin-bottom: 12px;
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
      padding: 8px 12px;
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
    
    /* =========================== PRINT SPECIFIC =========================== */
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .page { page-break-after: always; }
      .section { page-break-inside: avoid; }
      .no-break { page-break-inside: avoid; }
    }

    /* Value Protectors */
    .value-protectors { background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .protectors-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .protector-card { background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #059669; }
    .protector-name { font-weight: 600; color: #065f46; }
    .protector-desc { font-size: 0.9em; color: #374151; margin: 4px 0; }
    .protector-impact { color: #059669; font-weight: 600; }

    /* Path to Full Value */
    .path-to-value { background: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .path-actions { list-style: none; padding: 0; }
    .path-action { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .action-number { width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8em; }
    .potential-value-box { background: white; padding: 16px; border-radius: 8px; text-align: center; margin-top: 16px; }
    .pv-amount { font-size: 2em; font-weight: 700; color: #059669; }
    .pv-uplift { color: #059669; }

    /* Scenario enhancements */
    .scenario-risks { background: #fef2f2; padding: 12px; border-radius: 6px; margin: 12px 0; }
    .scenario-risks h4 { color: #dc2626; margin: 0 0 8px 0; }
    .scenario-considerations { background: #fffbeb; padding: 12px; border-radius: 6px; margin: 12px 0; }
    .scenario-considerations h4 { color: #d97706; margin: 0 0 8px 0; }

    /* Services */
    .services-grid { display: flex; flex-direction: column; gap: 16px; }
    .service-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .service-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .service-price { font-weight: 600; color: #0f172a; }
    .service-frequency { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
    .service-name { font-size: 1.2em; font-weight: 600; margin: 0 0 4px 0; }
    .service-tagline { color: #64748b; margin: 0 0 12px 0; }
    .service-why, .service-deliverables, .service-outcome { margin: 12px 0; }
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
    const { reportId, pdfConfig, returnHtml } = await req.json();

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

    let effectiveConfig: PdfConfig;
    if (pdfConfig) {
      effectiveConfig = pdfConfig;
    } else if (report.pdf_config) {
      effectiveConfig = report.pdf_config;
    } else {
      effectiveConfig = {
        sections: [],
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
    }));
    const allSuppressors = enhancedSuppressors.length > 0 ? enhancedSuppressors : valueAnalysisSuppressors;

    const currentValue = valueAnalysis.currentMarketValue?.mid || 0;
    const potentialValue = valueAnalysis.potentialValue?.mid || 0;
    const exitScore = exitBreakdown.totalScore || 0;
    const enrichedRevenue = report.pass1_data?._enriched_revenue || 63300000;

    console.log('[PDF Export] Enhanced suppressors:', enhancedSuppressors.length);
    console.log('[PDF Export] All suppressors:', allSuppressors.length);
    console.log('[PDF Export] Exit readiness:', exitScore);

    const reportData = {
      clientName,
      tier: 2,
      overallPercentile: report.overall_percentile || 50,
      totalOpportunity: parseFloat(report.total_annual_opportunity) || 0,
      surplusCash: report.surplus_cash?.surplusCash || report.pass1_data?.surplus_cash?.surplusCash || 0,
      freeWorkingCapital: Math.abs(report.surplus_cash?.components?.netWorkingCapital || 0),
      freeholdProperty: report.balance_sheet?.freehold_property || report.pass1_data?.balance_sheet?.freeholdProperty || 0,
      executiveSummary: report.executive_summary || '',
      positionNarrative: report.position_narrative || '',
      strengthsNarrative: report.strength_narrative || '',
      gapsNarrative: report.gap_narrative || '',
      opportunityNarrative: report.opportunity_narrative || '',
      closingSummary: '',
      gapCount: report.gap_count || 0,
      strengthCount: report.strength_count || 0,
      metrics: report.metrics_comparison || [],
      recommendations: report.recommendations || [],
      valuation: {
        baseline: {
          enterpriseValue: baseline.enterpriseValue || { low: 0, mid: 0, high: 0 },
          multipleRange: baseline.multipleRange || { low: 0, mid: 5, high: 0 },
          surplusCash: baseline.surplusCash || 0,
          multipleJustification: baseline.multipleJustification || '',
        },
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
        },
        target: { value: s.target?.value || '', metric: s.target?.metric || '' },
        recovery: { valueRecoverable: s.recovery?.valueRecoverable ?? 0, timeframe: s.recovery?.timeframe || '12-24 months' },
        evidence: s.evidence || '',
        whyThisDiscount: s.whyThisDiscount || '',
        industryContext: s.industryContext || '',
        pathToFix: s.pathToFix || { summary: '', steps: [], investment: 0, dependencies: [] },
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
            { label: 'Business Value', current: formatCurrency(currentValue), projected: formatCurrency(potentialValue * 0.95), impact: `+${formatCurrency(potentialValue * 0.95 - currentValue)} unlocked` },
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
            { label: 'Business Value', current: formatCurrency(currentValue), projected: formatCurrency(potentialValue * 0.9), impact: `+${formatCurrency(potentialValue * 0.9 - currentValue)} exit premium` },
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
      services: [] as any[],
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
    
    // Call Browserless PDF endpoint
    const pdfResponse = await fetch('https://chrome.browserless.io/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(browserlessApiKey + ':')}`,
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
    });
    
    if (!pdfResponse.ok) {
      throw new Error(`PDF generation failed: ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();

    try {
      await supabase
        .from('bm_reports')
        .update({ updated_at: new Date().toISOString() })
        .eq('engagement_id', reportId);
    } catch (e) {
      console.log('[PDF Export] Could not update timestamp:', e);
    }

    // Return PDF
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportData.clientName}-Benchmarking-Report.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
