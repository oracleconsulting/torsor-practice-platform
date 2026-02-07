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
          const isGap = m.gap && m.gap < -1;
          const isAdvantage = m.advantage && m.advantage > 0;
          const statusClass = isGap ? 'gap' : isAdvantage ? 'advantage' : 'neutral';
          const statusText = isGap ? `${m.gap.toFixed(1)}% gap` : isAdvantage ? `+${formatCurrency(m.advantage)} advantage` : 'At median';
          
          return `
            <div class="metric-card ${statusClass}">
              <div class="metric-header">
                <span class="metric-name">${m.name || m.metricName}</span>
                <span class="metric-percentile">${m.percentile || 50}th percentile</span>
              </div>
              <div class="metric-values">
                <div class="your-value">${m.format === 'currency' ? formatCurrency(m.value || m.clientValue) : m.format === 'percent' ? formatPercent(m.value || m.clientValue) : m.value || m.clientValue}</div>
                <div class="median-value">Median: ${m.format === 'currency' ? formatCurrency(m.median || m.p50) : m.format === 'percent' ? formatPercent(m.median || m.p50) : m.median || m.p50}</div>
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
  
  return `
    <div class="section">
      <h2 class="section-title">Business Valuation Analysis</h2>
      <div class="value-bridge">
        <div class="bridge-item baseline">
          <div class="bridge-value">${formatCurrency(val.baseline || 0)}</div>
          <div class="bridge-label">Baseline Value</div>
          <div class="bridge-detail">5x EBITDA</div>
        </div>
        <div class="bridge-arrow">→</div>
        <div class="bridge-item current">
          <div class="bridge-value">${formatCurrency(val.current || 0)}</div>
          <div class="bridge-label">Current Value</div>
          <div class="bridge-detail">After discounts</div>
        </div>
        <div class="bridge-arrow">=</div>
        <div class="bridge-item gap">
          <div class="bridge-value">${formatCurrency(val.gap || 0)}</div>
          <div class="bridge-label">Trapped Value</div>
          <div class="bridge-detail">${val.gapPct || 0}% discount</div>
        </div>
      </div>
      ${config.showSurplusCashAdd && data.surplusCash ? `
        <div class="surplus-add">
          <strong>Plus:</strong> ${formatCurrency(data.surplusCash)} surplus cash adds to any sale price
        </div>
      ` : ''}
    </div>
  `;
}

// Value Suppressors
function renderSuppressors(data: any, config: any): string {
  const suppressors = data.suppressors || [];
  const layout = config.layout || 'cards';
  
  if (layout === 'table') {
    return `
      <div class="section">
        <h2 class="section-title">Value Suppressors</h2>
        <table class="suppressors-table">
          <thead>
            <tr>
              <th>Factor</th>
              <th>Severity</th>
              <th>Discount</th>
              <th>Value Impact</th>
              ${config.showRecoveryTimelines ? '<th>Recovery</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${suppressors.map((s: any) => `
              <tr class="severity-${s.severity?.toLowerCase()}">
                <td>${s.name}</td>
                <td><span class="severity-badge">${s.severity}</span></td>
                <td>-${s.discount}%</td>
                <td>${formatCurrency(s.valueLoss || 0)}</td>
                ${config.showRecoveryTimelines ? `<td>${formatCurrency(s.recoverable || 0)} in ${s.timeframe || '12-24 months'}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  return `
    <div class="section">
      <h2 class="section-title">Where Your Value Is Going</h2>
      <div class="suppressors-grid">
        ${suppressors.map((s: any) => `
          <div class="suppressor-card severity-${s.severity?.toLowerCase()}">
            <div class="supp-header">
              <span class="supp-name">${s.name}</span>
              <span class="severity-badge">${s.severity}</span>
            </div>
            <div class="supp-impact">
              <span class="discount">-${s.discount}%</span>
              <span class="value-loss">${formatCurrency(s.valueLoss || 0)}</span>
            </div>
            ${config.showTargetStates ? `
              <div class="supp-states">
                <div class="current-state">Current: ${s.current}</div>
                <div class="target-state">Target: ${s.target}</div>
              </div>
            ` : ''}
            ${config.showRecoveryTimelines ? `
              <div class="supp-recovery">
                <span class="recoverable">${formatCurrency(s.recoverable || 0)}</span>
                <span class="timeframe">${s.timeframe || '12-24 months'}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Exit Readiness
function renderExitReadiness(data: any, config: any): string {
  const exit = data.exitReadiness || {};
  const components = exit.components || [];
  
  return `
    <div class="section">
      <h2 class="section-title">Exit Readiness Score</h2>
      <div class="exit-score-display">
        <div class="score-circle ${exit.score < 40 ? 'red' : exit.score < 70 ? 'amber' : 'green'}">
          <span class="score-value">${exit.score || 0}</span>
          <span class="score-max">/100</span>
        </div>
        <div class="score-status">${exit.status || 'Not Exit Ready'}</div>
      </div>
      ${config.showComponentBreakdown && components.length > 0 ? `
        <div class="exit-components">
          <h3>Score Breakdown</h3>
          ${components.map((c: any) => `
            <div class="component-row">
              <span class="comp-name">${c.name}</span>
              <div class="comp-bar">
                <div class="comp-fill" style="width: ${(c.score / c.max) * 100}%"></div>
              </div>
              <span class="comp-score">${c.score}/${c.max}</span>
              <span class="comp-action">${c.action}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${config.showPathTo70 && exit.pathTo70 ? `
        <div class="path-to-70">
          <h3>Path to Exit Ready (70/100)</h3>
          <div class="path-metrics">
            <div class="path-item">
              <span class="path-label">Timeline</span>
              <span class="path-value">${exit.pathTo70.timeline || '18-24 months'}</span>
            </div>
            <div class="path-item">
              <span class="path-label">Investment</span>
              <span class="path-value">${formatCurrency(exit.pathTo70.investment || 0)}</span>
            </div>
            <div class="path-item highlight">
              <span class="path-label">Value Unlocked</span>
              <span class="path-value">${formatCurrency(exit.pathTo70.valueUnlocked || 0)}</span>
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
  const layout = config.layout || 'sequential';
  
  if (layout === 'table') {
    return `
      <div class="section">
        <h2 class="section-title">Scenario Planning</h2>
        <table class="scenarios-table">
          <thead>
            <tr>
              <th>Metric</th>
              ${scenarios.map((s: any) => `<th>${s.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${['Business Value', 'Client Concentration', 'Exit Readiness', 'Timeline'].map(metric => `
              <tr>
                <td>${metric}</td>
                ${scenarios.map((s: any) => {
                  const m = s.metrics?.find((m: any) => m.name.includes(metric.split(' ')[0]));
                  return `<td>${m?.projected || '-'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  return `
    <div class="section">
      <h2 class="section-title">Scenario Planning</h2>
      <p class="section-subtitle">What happens depending on the path you choose</p>
      <div class="scenarios-sequential">
        ${scenarios.map((scenario: any) => `
          <div class="scenario-block">
            <h3 class="scenario-name">${scenario.name}</h3>
            <div class="scenario-timeframe">${scenario.timeframe}</div>
            <div class="scenario-metrics">
              ${scenario.metrics?.map((m: any) => `
                <div class="scenario-metric">
                  <span class="sm-name">${m.name}</span>
                  <span class="sm-today">${m.today}</span>
                  <span class="sm-arrow">→</span>
                  <span class="sm-projected">${m.projected}</span>
                </div>
              `).join('')}
            </div>
            ${config.showRequirements && scenario.requirements ? `
              <div class="scenario-requirements">
                <strong>Requirements:</strong>
                <ul>
                  ${scenario.requirements.map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Service Recommendations (Tier 2 only)
function renderServices(data: any, config: any): string {
  const services = data.services || [];
  
  return `
    <div class="section">
      <h2 class="section-title">How We Can Help</h2>
      <p class="section-subtitle">Based on your analysis, we've identified specific services that address your key challenges.</p>
      <div class="services-list">
        ${services.map((service: any) => `
          <div class="service-card">
            <div class="service-header">
              <h3 class="service-name">${service.name}</h3>
              ${config.showPricing ? `<span class="service-price">${service.price}</span>` : ''}
            </div>
            <div class="service-meta">
              <span>${service.frequency || 'one-off'}</span>
              <span>${service.duration || ''}</span>
            </div>
            <div class="service-why">
              <strong>Why this matters:</strong>
              <p>${service.why || ''}</p>
            </div>
            ${config.showOutcomes && service.outcomes ? `
              <div class="service-outcomes">
                <strong>What you get:</strong>
                <ul>
                  ${service.outcomes.map((o: string) => `<li>✓ ${o}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${config.showValueAtStake && service.totalValue ? `
              <div class="service-value">
                Addresses issues worth <strong>${formatCurrency(service.totalValue)}</strong> in potential value
              </div>
            ` : ''}
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
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch report from correct table using engagement_id as primary key
    const { data: report, error: reportError } = await supabase
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', reportId)
      .single();
    
    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message}`);
    }
    
    // Fetch client name via engagement -> practice_members
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
    
    // Get PDF config (use provided, or fall back to report's config, or default)
    let effectiveConfig: PdfConfig;
    
    if (pdfConfig) {
      effectiveConfig = pdfConfig;
    } else if (report.pdf_config) {
      effectiveConfig = report.pdf_config;
    } else {
      // Get default template (wrap in try/catch in case table doesn't exist yet)
      let template: any = null;
      try {
        const { data } = await supabase
          .from('benchmarking_report_templates')
          .select('*')
          .is('practice_id', null)
          .eq('tier', 2)
          .eq('is_default', true)
          .single();
        template = data;
      } catch (e) {
        console.log('No template table yet, using defaults');
      }
      
      effectiveConfig = template ? {
        sections: template.sections,
        pdfSettings: template.pdf_settings,
        tier: template.tier,
      } : {
        sections: [],
        pdfSettings: { pageSize: 'A4', margins: { top: 12, right: 12, bottom: 12, left: 12 }, headerFooter: true, coverPage: true, density: 'comfortable' },
        tier: 2,
      };
    }
    
    // Build report data object (column names match bm_reports / top-level)
    const reportData = {
      clientName,
      overallPercentile: report.overall_percentile || 50,
      totalOpportunity: parseFloat(report.total_annual_opportunity) || 0,
      surplusCash: report.surplus_cash?.surplusCash || report.pass1_data?.surplus_cash?.surplusCash || 0,
      freeWorkingCapital: report.surplus_cash?.components?.netWorkingCapital || report.pass1_data?.surplus_cash?.components?.netWorkingCapital || 0,
      freeholdProperty: report.balance_sheet?.freehold_property || report.pass1_data?.balance_sheet?.freeholdProperty || 0,
      executiveSummary: report.executive_summary || '',
      positionNarrative: report.position_narrative || '',
      strengthsNarrative: report.strength_narrative || '',
      gapsNarrative: report.gap_narrative || '',
      opportunityNarrative: report.opportunity_narrative || '',
      closingSummary: report.opportunity_narrative?.split('.').slice(-2).join('.') || '',
      gapCount: report.gap_count || 0,
      strengthCount: report.strength_count || 0,
      metrics: report.metrics_comparison || [],
      recommendations: report.recommendations || [],
      valuation: report.value_analysis || {},
      suppressors: report.enhanced_suppressors || [],
      exitReadiness: report.exit_readiness_breakdown || {},
      twoPaths: (report as any).two_paths_narrative ?? null,
      scenarios: report.value_analysis ? [
        { id: 'do_nothing', title: 'If You Do Nothing', description: 'Current trajectory without intervention' },
        { id: 'diversify', title: 'If You Actively Diversify', description: 'Use surplus cash to build broader client base' },
        { id: 'exit_prep', title: 'If You Prepare for Exit', description: 'Systematic value unlock program' },
      ] : [],
      services: [] as any[],
      dataSources: report.data_sources || [],
      tier: 2,
    };
    
    // Generate HTML
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

    // Note: last_pdf_generated_at column may not exist yet - use updated_at and wrap in try/catch
    try {
      await supabase
        .from('bm_reports')
        .update({ updated_at: new Date().toISOString() })
        .eq('engagement_id', reportId);
    } catch (e) {
      console.log('Could not update timestamp:', e);
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
