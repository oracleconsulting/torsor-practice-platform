/**
 * BENCHMARKING DATA EXPORT UTILITY
 * 
 * This utility can be used to export all benchmarking data for a given engagement.
 * Can be called from browser console or imported into components.
 * 
 * Usage from browser console:
 *   1. Open the app in browser
 *   2. Open DevTools (F12)
 *   3. Run: await window.exportBenchmarkingData('engagement-id-here')
 * 
 * Or import in your code:
 *   import { exportBenchmarkingData, dumpAllTables } from '@/lib/export-benchmarking-data';
 */

import { supabase } from './supabase';

// =============================================================================
// SUPABASE TABLE REFERENCE
// =============================================================================
// This documents which tables contain which benchmarking data:
//
// CORE BENCHMARKING TABLES:
// -------------------------
// bm_reports              - Main report with narratives, metrics, value_analysis, surplus_cash
// bm_engagements          - Links clients to benchmarking engagements
// bm_assessment_responses - Client's original assessment answers
// bm_metric_comparisons   - Individual metric comparisons with percentiles
// bm_client_scenarios     - Saved "what-if" scenarios
//
// CLIENT DATA TABLES:
// -------------------
// clients                 - Client master data (name, SIC code, description)
// client_accounts_uploads - Uploaded account files
// client_financial_data   - Extracted financial data (multi-year)
//
// OPPORTUNITY & SERVICE TABLES:
// -----------------------------
// client_opportunities    - AI-identified opportunities per engagement
// services               - Service catalogue (what we sell)
// service_concepts       - New service ideas from analysis
// issue_service_mappings - Maps issues to recommended services
//
// HVA TABLES:
// -----------
// hva_assessments        - Hidden Value Audit responses
//
// BENCHMARK REFERENCE:
// --------------------
// industries             - Industry definitions
// industry_benchmarks    - Benchmark values per industry
// benchmark_data         - Alternative benchmark storage
// =============================================================================

interface ExportResult {
  engagement: any;
  report: any;
  assessmentResponses: any;
  metricComparisons: any[];
  clientOpportunities: any[];
  financialData: any[];
  accountUploads: any[];
  scenarios: any[];
  hvaAssessment: any;
  client: any;
  services: any[];
  serviceConcepts: any[];
  industryBenchmarks: any[];
}

/**
 * Export all benchmarking data for a specific engagement
 */
export async function exportBenchmarkingData(engagementId: string): Promise<ExportResult | null> {
  console.log('📊 Starting benchmarking data export for:', engagementId);
  
  try {
    // Get engagement first
    const { data: engagement, error: engError } = await supabase
      .from('bm_engagements')
      .select('*')
      .eq('id', engagementId)
      .single();
    
    if (engError || !engagement) {
      console.error('❌ Engagement not found:', engError);
      return null;
    }
    
    const clientId = engagement.client_id;
    console.log('👤 Client ID:', clientId);
    
    // First fetch the report to get industry_code
    const { data: report } = await supabase
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    
    const industryCode = report?.industry_code || engagement.industry_code || 'DEFAULT';
    
    // Fetch all related data in parallel
    const [
      { data: assessmentResponses },
      { data: metricComparisons },
      { data: clientOpportunities },
      { data: financialData },
      { data: accountUploads },
      { data: scenarios },
      { data: hvaAssessment },
      { data: client },
      { data: services },
      { data: serviceConcepts },
      { data: industryBenchmarks }
    ] = await Promise.all([
      supabase.from('bm_assessment_responses').select('*').eq('client_id', clientId).single(),
      supabase.from('bm_metric_comparisons').select('*').eq('engagement_id', engagementId),
      supabase.from('client_opportunities').select('*, service:services(*), concept:service_concepts(*)').eq('engagement_id', engagementId),
      supabase.from('client_financial_data').select('*').eq('client_id', clientId).order('fiscal_year', { ascending: false }),
      supabase.from('client_accounts_uploads').select('*').eq('client_id', clientId),
      supabase.from('bm_client_scenarios').select('*').eq('engagement_id', engagementId),
      supabase.from('hva_assessments').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('services').select('*').eq('status', 'active'),
      supabase.from('service_concepts').select('*'),
      supabase.from('industry_benchmarks').select('*').eq('industry_code', industryCode)
    ]);
    
    const result: ExportResult = {
      engagement,
      report,
      assessmentResponses,
      metricComparisons: metricComparisons || [],
      clientOpportunities: clientOpportunities || [],
      financialData: financialData || [],
      accountUploads: accountUploads || [],
      scenarios: scenarios || [],
      hvaAssessment,
      client,
      services: services || [],
      serviceConcepts: serviceConcepts || [],
      industryBenchmarks: industryBenchmarks || []
    };
    
    console.log('✅ Export complete!');
    console.log('📋 Summary:');
    console.log('  - Report:', report ? 'Found' : 'Missing');
    console.log('  - Assessment:', assessmentResponses ? 'Found' : 'Missing');
    console.log('  - Metrics:', (metricComparisons || []).length);
    console.log('  - Opportunities:', (clientOpportunities || []).length);
    console.log('  - Financial Years:', (financialData || []).length);
    console.log('  - Scenarios:', (scenarios || []).length);
    console.log('  - HVA:', hvaAssessment ? 'Found' : 'Missing');
    console.log('  - Industry Benchmarks:', (industryBenchmarks || []).length);
    
    return result;
  } catch (error) {
    console.error('❌ Export failed:', error);
    return null;
  }
}

/**
 * Dump all relevant tables for debugging
 */
export async function dumpAllTables() {
  console.log('📊 Dumping all benchmarking-related tables...\n');
  
  const tables = [
    'bm_reports',
    'bm_engagements', 
    'bm_assessment_responses',
    'bm_metric_comparisons',
    'bm_client_scenarios',
    'client_opportunities',
    'service_concepts',
    'services',
    'industries',
    'industry_benchmarks',
    'client_financial_data',
    'client_accounts_uploads',
    'hva_assessments'
  ];
  
  const results: Record<string, any[]> = {};
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(100);
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
        results[table] = [];
      } else {
        console.log(`✅ ${table}: ${count ?? data?.length ?? 0} rows`);
        results[table] = data || [];
      }
    } catch (e) {
      console.log(`❌ ${table}: Table may not exist`);
      results[table] = [];
    }
  }
  
  return results;
}

/**
 * Check which data is being generated but not displayed
 */
export async function checkDataUsage(engagementId: string) {
  const data = await exportBenchmarkingData(engagementId);
  if (!data) return;
  
  console.log('\n📋 DATA USAGE CHECK\n');
  console.log('==================\n');
  
  const report = data.report;
  if (!report) {
    console.log('❌ No report found!');
    return;
  }
  
  // Check pass1_data
  const pass1Data = typeof report.pass1_data === 'string' 
    ? JSON.parse(report.pass1_data) 
    : report.pass1_data;
  
  console.log('📦 pass1_data fields:');
  if (pass1Data) {
    Object.keys(pass1Data).forEach(key => {
      const value = pass1Data[key];
      const hasValue = value !== null && value !== undefined && value !== '';
      console.log(`  ${hasValue ? '✅' : '⚠️'} ${key}: ${hasValue ? (typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' : value) : 'EMPTY'}`);
    });
  } else {
    console.log('  ❌ No pass1_data');
  }
  
  // Check value_analysis
  console.log('\n💰 value_analysis:');
  if (report.value_analysis) {
    console.log('  ✅ Present');
    console.log('  - Baseline EBITDA:', report.value_analysis.baseline?.ebitda);
    console.log('  - Enterprise Value (mid):', report.value_analysis.baseline?.enterpriseValue?.mid);
    console.log('  - Suppressors:', report.value_analysis.suppressors?.length || 0);
    console.log('  - Current Value (mid):', report.value_analysis.currentMarketValue?.mid);
    console.log('  - Exit Readiness:', report.value_analysis.exitReadiness?.score);
  } else {
    console.log('  ❌ Missing - needs regeneration');
  }
  
  // Check surplus_cash
  console.log('\n💵 surplus_cash:');
  if (report.surplus_cash) {
    console.log('  ✅ Present');
    console.log('  - Actual:', report.surplus_cash.actualCash);
    console.log('  - Required:', report.surplus_cash.requiredCash);
    console.log('  - Surplus:', report.surplus_cash.surplusCash);
  } else {
    console.log('  ❌ Missing');
  }
  
  // Check opportunities
  console.log('\n🎯 client_opportunities:');
  if (data.clientOpportunities.length > 0) {
    console.log(`  ✅ ${data.clientOpportunities.length} opportunities`);
    data.clientOpportunities.forEach((opp: any) => {
      console.log(`    - ${opp.title} (${opp.severity}): £${opp.financial_impact_amount?.toLocaleString() || 'N/A'}`);
    });
  } else {
    console.log('  ⚠️ No opportunities - run generate-bm-opportunities');
  }
  
  // Check metrics
  console.log('\n📊 metrics_comparison:');
  const metrics = typeof report.metrics_comparison === 'string'
    ? JSON.parse(report.metrics_comparison)
    : report.metrics_comparison;
  
  if (metrics && metrics.length > 0) {
    console.log(`  ✅ ${metrics.length} metrics`);
    metrics.forEach((m: any) => {
      console.log(`    - ${m.metricName || m.metric_name}: Client ${m.clientValue || m.client_value}, Median ${m.p50}`);
    });
  } else {
    console.log('  ⚠️ No metrics');
  }
  
  // Check HVA
  console.log('\n🔍 HVA Assessment:');
  if (data.hvaAssessment?.responses) {
    const responses = data.hvaAssessment.responses;
    const keys = Object.keys(responses);
    console.log(`  ✅ ${keys.length} responses`);
    keys.slice(0, 5).forEach(key => {
      console.log(`    - ${key}: ${responses[key]}`);
    });
    if (keys.length > 5) console.log(`    ... and ${keys.length - 5} more`);
  } else {
    console.log('  ⚠️ No HVA data');
  }
  
  return {
    pass1Data,
    valueAnalysis: report.value_analysis,
    surplusCash: report.surplus_cash,
    opportunities: data.clientOpportunities,
    metrics,
    hva: data.hvaAssessment?.responses
  };
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).exportBenchmarkingData = exportBenchmarkingData;
  (window as any).dumpAllTables = dumpAllTables;
  (window as any).checkDataUsage = checkDataUsage;
  console.log('🔧 Benchmarking export utilities loaded!');
  console.log('   - exportBenchmarkingData(engagementId)');
  console.log('   - dumpAllTables()');
  console.log('   - checkDataUsage(engagementId)');
}

