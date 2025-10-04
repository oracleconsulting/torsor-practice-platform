/**
 * Pre-built Workflow Templates for Advisory Services
 * These can be used as starting points for practices to customize
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  service_type: string;
  category: string;
  steps: WorkflowStepTemplate[];
}

export interface WorkflowStepTemplate {
  step_order: number;
  step_type: 'llm' | 'conditional' | 'transform' | 'user_input' | 'api_call';
  name: string;
  description: string;
  config: any;
  input_mapping?: any;
  output_schema?: any;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // 1. FINANCIAL FORECASTING WORKFLOW
  {
    id: 'forecasting-standard',
    name: 'Standard Financial Forecasting',
    description: 'Comprehensive 12-month financial forecast with scenario analysis',
    service_type: 'forecasting',
    category: 'Financial Planning',
    steps: [
      {
        step_order: 1,
        step_type: 'llm',
        name: 'Analyze Historical Performance',
        description: 'Review and analyze the last 12-24 months of financial data',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `You are a financial analyst reviewing {{client_name}}'s historical financial performance.

Historical Data:
{{historical_data}}

Please provide:
1. Revenue trends and patterns
2. Expense analysis and cost structure
3. Profitability trends
4. Key financial ratios
5. Seasonal patterns or cyclical trends
6. Notable changes or anomalies

Format your response as structured JSON with these sections.`,
          temperature: 0.5,
          max_tokens: 3000,
          input_variables: ['client_name', 'historical_data']
        }
      },
      {
        step_order: 2,
        step_type: 'llm',
        name: 'Generate Base Case Forecast',
        description: 'Create realistic 12-month forecast based on historical trends',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Based on the historical analysis for {{client_name}}, create a 12-month base case financial forecast.

Historical Analysis:
{{step_1_output}}

Client Information:
- Industry: {{industry}}
- Current Revenue: {{current_revenue}}
- Growth Stage: {{growth_stage}}

Create a month-by-month forecast including:
1. Revenue projections with growth assumptions
2. Cost of sales/COGS
3. Operating expenses by category
4. EBITDA and net profit
5. Cash flow projections
6. Key assumptions used

Format as structured JSON with monthly breakdowns.`,
          temperature: 0.6,
          max_tokens: 4000,
          input_variables: ['client_name', 'industry', 'current_revenue', 'growth_stage']
        }
      },
      {
        step_order: 3,
        step_type: 'llm',
        name: 'Best Case Scenario Analysis',
        description: 'Create optimistic forecast scenario',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create a "best case" scenario forecast for {{client_name}} where things go better than expected.

Base Case Forecast:
{{step_2_output}}

Consider:
- Revenue growth 20-30% higher
- Better cost management (5-10% savings)
- Faster customer acquisition
- Higher average transaction value
- Improved margins

Provide the same structured output as the base case, but with optimistic assumptions clearly stated.`,
          temperature: 0.7,
          max_tokens: 3000,
          input_variables: ['client_name']
        }
      },
      {
        step_order: 4,
        step_type: 'llm',
        name: 'Worst Case Scenario Analysis',
        description: 'Create conservative/pessimistic forecast scenario',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create a "worst case" scenario forecast for {{client_name}} to stress-test the business.

Base Case Forecast:
{{step_2_output}}

Consider:
- Revenue decline or slower growth (20-30% lower)
- Cost increases (inflation, supply chain)
- Market challenges
- Customer churn
- Margin pressure

Provide the same structured output as the base case, with risk factors clearly stated.`,
          temperature: 0.7,
          max_tokens: 3000,
          input_variables: ['client_name']
        }
      },
      {
        step_order: 5,
        step_type: 'llm',
        name: 'Generate Executive Summary & Recommendations',
        description: 'Create comprehensive summary with actionable insights',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create an executive summary of the financial forecast for {{client_name}}.

Historical Analysis:
{{step_1_output}}

Base Case Forecast:
{{step_2_output}}

Best Case:
{{step_3_output}}

Worst Case:
{{step_4_output}}

Create a professional executive summary including:
1. Current Financial Position (1-2 paragraphs)
2. Forecast Overview (key numbers for all 3 scenarios)
3. Critical Assumptions
4. Key Risks & Opportunities
5. Strategic Recommendations (3-5 specific actions)
6. Monitoring Dashboard (KPIs to track)
7. Next Steps

Format this as a professional document ready for client presentation.`,
          temperature: 0.7,
          max_tokens: 4000,
          input_variables: ['client_name']
        }
      }
    ]
  },

  // 2. BUSINESS VALUATION WORKFLOW
  {
    id: 'valuation-standard',
    name: 'Comprehensive Business Valuation',
    description: 'Multi-method business valuation with comparables analysis',
    service_type: 'valuation',
    category: 'Valuation',
    steps: [
      {
        step_order: 1,
        step_type: 'llm',
        name: 'Financial Normalization',
        description: 'Normalize financials and calculate adjusted EBITDA',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Analyze and normalize the financials for {{client_name}} to prepare for valuation.

Financial Data:
{{financial_data}}

Identify and adjust for:
1. Non-recurring expenses
2. Owner/related party compensation
3. Discretionary expenses
4. Below-market rent or costs
5. One-time events

Calculate:
- Adjusted EBITDA
- Normalized revenue
- Sustainable profit margins
- Working capital requirements

Provide detailed adjustments with rationale.`,
          temperature: 0.5,
          max_tokens: 3000,
          input_variables: ['client_name', 'financial_data']
        }
      },
      {
        step_order: 2,
        step_type: 'llm',
        name: 'Market Comparables Analysis',
        description: 'Research and analyze comparable company transactions',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Analyze market comparables for valuing {{client_name}}.

Company Details:
- Industry: {{industry}}
- Revenue: {{revenue}}
- EBITDA: {{ebitda}}
- Location: {{location}}

Based on typical market multiples for this industry and size:
1. Revenue multiples (0.5x - 3x range)
2. EBITDA multiples (3x - 8x range)
3. Comparable transaction analysis
4. Industry-specific factors
5. Size and growth adjustments

Recommend appropriate multiple ranges with justification.`,
          temperature: 0.6,
          max_tokens: 3000,
          input_variables: ['client_name', 'industry', 'revenue', 'ebitda', 'location']
        }
      },
      {
        step_order: 3,
        step_type: 'llm',
        name: 'DCF Valuation Model',
        description: 'Build discounted cash flow valuation model',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create a DCF valuation for {{client_name}}.

Normalized Financials:
{{step_1_output}}

Project 5-year cash flows considering:
1. Revenue growth trajectory
2. Margin trends
3. Working capital needs
4. CapEx requirements
5. Tax considerations

Calculate:
- WACC (weighted average cost of capital)
- Terminal value
- Present value of cash flows
- Enterprise value
- Equity value

Provide detailed DCF model with assumptions.`,
          temperature: 0.6,
          max_tokens: 4000,
          input_variables: ['client_name']
        }
      },
      {
        step_order: 4,
        step_type: 'llm',
        name: 'Generate Valuation Report',
        description: 'Compile comprehensive valuation report with recommendations',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create a comprehensive valuation report for {{client_name}}.

Normalized Financials:
{{step_1_output}}

Market Comparables:
{{step_2_output}}

DCF Analysis:
{{step_3_output}}

Create a professional report including:
1. Executive Summary
2. Company Overview
3. Financial Normalization Summary
4. Valuation Methodologies:
   - Market Approach (comparables)
   - Income Approach (DCF)
   - Reconciliation of values
5. Final Valuation Conclusion (range)
6. Key Value Drivers & Risks
7. Recommendations for Value Enhancement

Format for client presentation.`,
          temperature: 0.7,
          max_tokens: 5000,
          input_variables: ['client_name']
        }
      }
    ]
  },

  // 3. INDUSTRY BENCHMARKING WORKFLOW
  {
    id: 'benchmarking-standard',
    name: 'Industry Benchmarking Analysis',
    description: 'Compare client performance against industry peers',
    service_type: 'benchmarking',
    category: 'Performance Analysis',
    steps: [
      {
        step_order: 1,
        step_type: 'llm',
        name: 'Calculate Key Metrics',
        description: 'Calculate standardized financial and operational KPIs',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Calculate key performance metrics for {{client_name}}.

Financial Data:
{{financial_data}}

Operational Data:
{{operational_data}}

Calculate:
1. Financial Ratios:
   - Gross margin %
   - Net margin %
   - EBITDA margin %
   - Revenue per employee
   - Revenue growth rate

2. Operational Metrics:
   - Customer acquisition cost
   - Customer lifetime value
   - Inventory turnover (if applicable)
   - Days sales outstanding
   - Working capital ratio

3. Efficiency Metrics:
   - Sales per square foot (if retail)
   - Utilization rate (if services)
   - Operating leverage

Provide all metrics in a structured format.`,
          temperature: 0.3,
          max_tokens: 3000,
          input_variables: ['client_name', 'financial_data', 'operational_data']
        }
      },
      {
        step_order: 2,
        step_type: 'llm',
        name: 'Industry Benchmark Comparison',
        description: 'Compare metrics against industry standards',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Compare {{client_name}}'s metrics against industry benchmarks.

Client Metrics:
{{step_1_output}}

Industry: {{industry}}
Company Size: {{company_size}}

Provide benchmark comparison showing:
1. Each metric vs industry average
2. Percentile ranking (25th, 50th, 75th, 90th percentiles)
3. Gap analysis (above/below benchmark by %)
4. Industry leaders' metrics for reference

Highlight:
- Areas of strength (top quartile)
- Areas needing improvement (bottom quartile)
- Opportunities for quick wins`,
          temperature: 0.6,
          max_tokens: 3500,
          input_variables: ['client_name', 'industry', 'company_size']
        }
      },
      {
        step_order: 3,
        step_type: 'llm',
        name: 'Generate Action Plan',
        description: 'Create targeted improvement recommendations',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create an action plan for {{client_name}} based on benchmarking results.

Metrics & Benchmarks:
{{step_1_output}}
{{step_2_output}}

For each underperforming area, provide:
1. Current state vs target
2. Root cause analysis
3. Specific actions to improve
4. Expected impact
5. Timeline
6. Resources needed
7. Success metrics

Prioritize recommendations by:
- Impact (high/medium/low)
- Effort (high/medium/low)
- Quick wins vs long-term initiatives

Format as an actionable roadmap.`,
          temperature: 0.7,
          max_tokens: 4000,
          input_variables: ['client_name']
        }
      }
    ]
  },

  // 4. PROFIT EXTRACTION PLANNING
  {
    id: 'profit-extraction-standard',
    name: 'Tax-Efficient Profit Extraction',
    description: 'Optimize director remuneration and tax efficiency',
    service_type: 'profit-extraction',
    category: 'Tax Planning',
    steps: [
      {
        step_order: 1,
        step_type: 'llm',
        name: 'Analyze Current Position',
        description: 'Review current remuneration structure and tax position',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Analyze the current profit extraction strategy for {{client_name}}.

Current Structure:
{{current_structure}}

Personal Tax Details:
{{tax_details}}

Review:
1. Current salary vs dividend split
2. Total tax burden (income tax + NI + corporation tax)
3. Personal allowance utilization
4. Dividend allowance usage
5. Pension contributions
6. Other benefits (company car, health insurance, etc.)

Calculate:
- Effective tax rate
- Total take-home after all taxes
- Potential savings opportunities

Provide detailed breakdown.`,
          temperature: 0.5,
          max_tokens: 3000,
          input_variables: ['client_name', 'current_structure', 'tax_details']
        }
      },
      {
        step_order: 2,
        step_type: 'llm',
        name: 'Optimize Salary/Dividend Mix',
        description: 'Calculate optimal balance of salary and dividends',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Calculate the optimal salary and dividend mix for {{client_name}}.

Current Analysis:
{{step_1_output}}

Target Income: {{target_income}}
Company Profit: {{company_profit}}

Consider:
1. National Insurance thresholds
2. Personal allowance (£12,570)
3. Dividend allowance (£500)
4. Higher rate threshold (£50,270)
5. Additional rate threshold (£125,140)

Model 3-4 scenarios:
- Conservative (minimum tax)
- Balanced (optimal mix)
- Aggressive (maximum extraction)

For each, show:
- Salary amount
- Dividend amount
- Total income tax
- Total NI (employee + employer)
- Corporation tax savings
- Net take-home
- Overall tax efficiency

Recommend the best approach.`,
          temperature: 0.5,
          max_tokens: 4000,
          input_variables: ['client_name', 'target_income', 'company_profit']
        }
      },
      {
        step_order: 3,
        step_type: 'llm',
        name: 'Pension Optimization',
        description: 'Analyze pension contribution opportunities',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Analyze pension contribution strategy for {{client_name}}.

Optimal Salary/Dividend:
{{step_2_output}}

Current Pension: {{current_pension}}
Age: {{age}}

Calculate:
1. Annual allowance available (£60,000)
2. Carry forward from previous 3 years
3. Tapering (if income >£200k)
4. Corporation tax relief
5. Personal tax relief
6. NI savings

Model pension contribution scenarios:
- Employer contributions
- Personal contributions
- Combination approach

Show:
- Net cost after tax relief
- Long-term value
- Impact on current income
- Retirement projection

Recommend optimal strategy.`,
          temperature: 0.6,
          max_tokens: 3500,
          input_variables: ['client_name', 'current_pension', 'age']
        }
      },
      {
        step_order: 4,
        step_type: 'llm',
        name: 'Generate Comprehensive Plan',
        description: 'Create detailed implementation plan',
        config: {
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          prompt: `Create a comprehensive profit extraction plan for {{client_name}}.

Current Analysis:
{{step_1_output}}

Optimal Salary/Dividend:
{{step_2_output}}

Pension Strategy:
{{step_3_output}}

Create plan including:
1. Executive Summary
2. Current vs Proposed (comparison table)
3. Total Tax Savings
4. Recommended Monthly/Annual Amounts:
   - Salary payments
   - Dividend declarations
   - Pension contributions
5. Implementation Steps & Timeline
6. Payroll changes needed
7. Documentation requirements
8. Review schedule (quarterly/annual)

Format as a clear, actionable plan for the client to implement.`,
          temperature: 0.7,
          max_tokens: 4500,
          input_variables: ['client_name']
        }
      }
    ]
  }
];

/**
 * Get template by service type
 */
export function getTemplateByServiceType(serviceType: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.service_type === serviceType);
}

/**
 * Get all templates
 */
export function getAllTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

