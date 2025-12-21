// ============================================================================
// BENCHMARKING ASSESSMENT CONFIGURATION
// ============================================================================

import { AssessmentConfig, Question, Section } from '../../types/assessments';

export const benchmarkingDiscoveryConfig: AssessmentConfig = {
  id: 'bm_discovery',
  name: 'Benchmarking Assessment',
  description: 'Help us understand your business so we can find the right comparisons',
  estimatedMinutes: 20,
  totalQuestions: 20,
  aiAnchors: 8,
  
  sections: [
    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: INDUSTRY CLASSIFICATION
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'classification',
      title: 'About Your Business',
      description: 'Help us understand your business so we can find the right comparisons',
      questions: [
        {
          id: 'q1_1',
          field: 'business_description',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'Describe what your business does in 2-3 sentences',
          placeholder: 'e.g., "We run a chain of 4 dental practices in Manchester, offering NHS and private dentistry. About 60% of our revenue is NHS."',
          maxLength: 500,
        },
        {
          id: 'q1_2',
          field: 'industry_suggestion',
          type: 'industry_select', // Custom component with search + "other"
          required: true,
          label: 'Which industry best describes your business?',
          helpText: 'Start typing to search, or select "Other" if you don\'t see your industry',
        },
        {
          id: 'q1_3',
          field: 'sub_sector',
          type: 'free_text',
          required: false,
          label: 'Any specific niche or specialisation?',
          placeholder: 'e.g., "Cosmetic dentistry", "SaaS for recruitment agencies", "Vegan restaurant"',
          maxLength: 200,
        },
        {
          id: 'q1_4',
          field: 'sic_code',
          type: 'free_text',
          required: false,
          label: 'SIC code (if known)',
          placeholder: 'e.g., 69201',
          helpText: 'You can find this on Companies House',
          maxLength: 10,
        },
      ],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: BUSINESS SIZE & CONTEXT
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'size_context',
      title: 'Size & Context',
      description: 'This helps us compare you to similar-sized businesses',
      questions: [
        {
          id: 'q2_1',
          field: 'revenue_band',
          type: 'single_choice',
          required: true,
          label: 'What is your annual revenue/turnover?',
          options: [
            { value: 'under_250k', label: 'Under £250k' },
            { value: '250k_500k', label: '£250k - £500k' },
            { value: '500k_1m', label: '£500k - £1m' },
            { value: '1m_2m', label: '£1m - £2m' },
            { value: '2m_5m', label: '£2m - £5m' },
            { value: '5m_10m', label: '£5m - £10m' },
            { value: '10m_plus', label: '£10m+' },
          ],
        },
        {
          id: 'q2_2',
          field: 'employee_count',
          type: 'number',
          required: true,
          label: 'How many employees (including owners)?',
          min: 1,
          max: 10000,
        },
        {
          id: 'q2_3',
          field: 'business_age',
          type: 'single_choice',
          required: true,
          label: 'How long has the business been trading?',
          options: [
            { value: 'under_2', label: 'Under 2 years' },
            { value: '2_5', label: '2-5 years' },
            { value: '5_10', label: '5-10 years' },
            { value: '10_plus', label: '10+ years' },
          ],
        },
        {
          id: 'q2_4',
          field: 'location_type',
          type: 'single_choice',
          required: true,
          label: 'Where do you primarily operate?',
          options: [
            { value: 'london', label: 'London' },
            { value: 'south_east', label: 'South East England' },
            { value: 'midlands', label: 'Midlands' },
            { value: 'north', label: 'North of England' },
            { value: 'scotland', label: 'Scotland' },
            { value: 'wales', label: 'Wales' },
            { value: 'ni', label: 'Northern Ireland' },
            { value: 'national', label: 'National/Multi-region' },
            { value: 'international', label: 'International' },
          ],
        },
      ],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: CURRENT PERFORMANCE (Self-Assessment)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'self_assessment',
      title: 'Your Current Performance',
      description: 'We\'ll compare these against industry benchmarks',
      questions: [
        {
          id: 'q3_1',
          field: 'performance_perception',
          type: 'single_choice',
          required: true,
          aiAnchor: true,
          label: 'How do you currently rate your business performance vs competitors?',
          options: [
            { value: 'top_10', label: 'Top 10% - Industry leader' },
            { value: 'top_25', label: 'Top 25% - Above average' },
            { value: 'middle', label: 'Middle of the pack' },
            { value: 'below_avg', label: 'Below average' },
            { value: 'dont_know', label: "Honestly, I don't know" },
          ],
        },
        {
          id: 'q3_2',
          field: 'current_tracking',
          type: 'multiple_choice',
          required: true,
          label: 'Which metrics do you currently track regularly?',
          options: [
            { value: 'revenue', label: 'Revenue/Turnover' },
            { value: 'gross_profit', label: 'Gross Profit %' },
            { value: 'net_profit', label: 'Net Profit %' },
            { value: 'cash_flow', label: 'Cash Flow' },
            { value: 'debtor_days', label: 'Debtor Days' },
            { value: 'headcount_metrics', label: 'Revenue per Employee' },
            { value: 'customer_metrics', label: 'Customer Retention / LTV' },
            { value: 'industry_specific', label: 'Industry-specific KPIs' },
            { value: 'none', label: "We don't track many metrics" },
          ],
        },
        {
          id: 'q3_3',
          field: 'comparison_method',
          type: 'free_text',
          required: true,
          label: 'How do you currently compare yourself to competitors?',
          placeholder: "e.g., 'We look at their pricing', 'We don't really', 'Industry surveys'",
          maxLength: 300,
        },
      ],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SECTION 4: PAIN POINTS & PRIORITIES
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'pain_priority',
      title: 'What Matters Most',
      description: 'Help us focus the analysis on what would be most valuable',
      questions: [
        {
          id: 'q4_1',
          field: 'suspected_underperformance',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'Which area of your business do you SUSPECT underperforms vs industry?',
          placeholder: 'Be specific - "I think our gross margins are lower than they should be" or "Our debtor days feel too long"',
          maxLength: 400,
        },
        {
          id: 'q4_2',
          field: 'leaving_money',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'Where do you feel you might be leaving money on the table?',
          placeholder: 'Pricing too low? Costs too high? Missing revenue streams?',
          maxLength: 400,
        },
        {
          id: 'q4_3',
          field: 'top_quartile_ambition',
          type: 'multiple_choice',
          required: true,
          label: 'Where would you most like to be TOP QUARTILE? (Select up to 3)',
          maxSelections: 3,
          options: [
            { value: 'profitability', label: 'Profitability (margins)' },
            { value: 'growth', label: 'Revenue Growth' },
            { value: 'efficiency', label: 'Efficiency (revenue per head)' },
            { value: 'cash', label: 'Cash Management' },
            { value: 'customer', label: 'Customer Retention' },
            { value: 'pricing', label: 'Pricing Power' },
            { value: 'scale', label: 'Scalability' },
          ],
        },
        {
          id: 'q4_4',
          field: 'competitor_envy',
          type: 'free_text',
          required: false,
          aiAnchor: true,
          label: 'What would your best competitor do differently to you?',
          placeholder: "Think about someone in your industry you admire - what do they do that you don't?",
          maxLength: 400,
        },
      ],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // SECTION 5: MAGIC FIX & ACTION INTENT
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'magic_action',
      title: 'What Would You Do?',
      description: 'This helps us make the analysis actionable',
      questions: [
        {
          id: 'q5_1',
          field: 'benchmark_magic_fix',
          type: 'free_text',
          required: true,
          aiAnchor: true,
          label: 'If you could see EXACTLY how you compare to the best in your industry, what would you do with that information?',
          placeholder: 'Be specific - "I\'d restructure our pricing", "I\'d have an honest conversation with my team about productivity"',
          maxLength: 500,
        },
        {
          id: 'q5_2',
          field: 'action_readiness',
          type: 'single_choice',
          required: true,
          label: 'If the benchmarking reveals clear improvement opportunities, how ready are you to act?',
          options: [
            { value: 'immediate', label: 'Ready to act immediately' },
            { value: 'planning', label: 'Will feed into planning for next quarter' },
            { value: 'awareness', label: 'Just want awareness for now' },
            { value: 'team', label: 'Need to share with team/board first' },
          ],
        },
        {
          id: 'q5_3',
          field: 'blind_spot_fear',
          type: 'free_text',
          required: false,
          aiAnchor: true,
          label: 'What blind spot are you most afraid this might reveal?',
          placeholder: 'The thing you hope ISN\'T true about your business...',
          maxLength: 300,
        },
      ],
    },
  ],
};

