// ============================================================================
// EDGE FUNCTION: Generate Value Analysis (Part 3 - Hidden Value Audit)
// ============================================================================
// This runs AFTER the roadmap is generated (Parts 1+2).
// Part 3 is a DYNAMIC assessment that adapts based on business stage.
// 
// Purpose: Uncover hidden value, risks, and untapped opportunities
// Framework: Based on Daniel Priestley's 24 Assets
//
// Asset Categories:
// 1. Intellectual Capital
// 2. Brand & Trust Equity  
// 3. Market Position
// 4. Systems & Scale
// 5. People & Culture
// 6. Financial & Exit Readiness
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

type BusinessStage = 'pre_revenue' | 'early_revenue' | 'growth' | 'scale' | 'mature';

interface StageContext {
  stage: BusinessStage;
  revenue: number;
  revenueBand: string;
  yearsTrading: number;
  teamSize: string;
  industry: string;
  timeCommitment: string;
  biggestPain: string;
  moneyWorry: string;
  ninetyDayPriorities: string[];
}

interface AssetScore {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  opportunities: string[];
  financialImpact: number;
}

interface Risk {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
  cost: number;
  probability?: string;
}

interface ValueGap {
  area: string;
  currentValue: number;
  potentialValue: number;
  gap: number;
  actions: string[];
  timeframe: string;
  effort: 'Low' | 'Medium' | 'High';
}

// ============================================================================
// BUSINESS STAGE DETERMINATION
// ============================================================================

function determineBusinessStage(part1: Record<string, any>, part2: Record<string, any>): StageContext {
  // Parse revenue
  const revenueBand = part2.annual_turnover || '£0';
  let revenue = 0;
  if (revenueBand.includes('Under £100k') || revenueBand === '£0') revenue = 0;
  else if (revenueBand.includes('£100k-£250k')) revenue = 175000;
  else if (revenueBand.includes('£250k-£500k')) revenue = 375000;
  else if (revenueBand.includes('£500k-£1m')) revenue = 750000;
  else if (revenueBand.includes('£1m-£5m')) revenue = 2500000;
  else if (revenueBand.includes('£5m')) revenue = 7500000;
  
  // Parse years trading
  const yearsRaw = part2.years_trading || '0';
  let yearsTrading = 0;
  if (yearsRaw.includes('Less than 1')) yearsTrading = 0.5;
  else if (yearsRaw.includes('1-2')) yearsTrading = 1.5;
  else if (yearsRaw.includes('3-5')) yearsTrading = 4;
  else if (yearsRaw.includes('5+')) yearsTrading = 7;
  else yearsTrading = parseFloat(yearsRaw) || 0;
  
  // Determine stage
  let stage: BusinessStage;
  if (revenue === 0) stage = 'pre_revenue';
  else if (revenue < 250000) stage = 'early_revenue';
  else if (revenue < 1000000) stage = 'growth';
  else if (revenue < 5000000) stage = 'scale';
  else stage = 'mature';
  
  return {
    stage,
    revenue,
    revenueBand,
    yearsTrading,
    teamSize: part2.team_size || 'Just me',
    industry: part2.industry || 'general',
    timeCommitment: part1.commitment_hours || '5-10 hours',
    biggestPain: part1.danger_zone || '',
    moneyWorry: part1.money_worry || '',
    ninetyDayPriorities: part2.ninety_day_priorities || []
  };
}

// ============================================================================
// STAGE-SPECIFIC QUESTIONS
// ============================================================================

function getStageSpecificQuestions(context: StageContext): any[] {
  const { stage, teamSize } = context;
  
  if (stage === 'pre_revenue') {
    return [
      {
        section: "Validation & Market Fit",
        questions: [
          {
            id: "validation_stage",
            fieldName: "validation_stage",
            question: "Where are you in validating your business idea?",
            type: "radio",
            options: [
              "Just an idea - no customer feedback yet",
              "Talked to 1-5 potential customers",
              "Talked to 6-20 potential customers",
              "Have verbal commitments to buy",
              "Have written LOIs or pre-orders",
              "MVP built and being tested"
            ],
            insight: "Most successful businesses validate with 20+ customer conversations"
          },
          {
            id: "first_customer_timeline",
            fieldName: "first_customer_timeline",
            question: "When do you realistically expect your first paying customer?",
            type: "radio",
            options: ["Within 30 days", "1-3 months", "3-6 months", "6-12 months", "More than 12 months", "Don't know"]
          },
          {
            id: "revenue_blockers",
            fieldName: "revenue_blockers",
            question: "What's preventing you from making revenue right now?",
            type: "checkbox",
            options: [
              "Product/service not ready", "Don't know who to sell to", "Don't know how to reach customers",
              "No sales process", "Pricing uncertainty", "Legal/regulatory requirements",
              "Need funding first", "Fear of rejection"
            ]
          }
        ]
      },
      {
        section: "Founder Readiness",
        questions: [
          {
            id: "runway_months",
            fieldName: "runway_months",
            question: "How many months can you survive without revenue?",
            type: "radio",
            options: ["Less than 3 months", "3-6 months", "6-12 months", "12+ months", "Indefinitely (have other income)"],
            insight: "Most founders need 6-9 months to first revenue"
          },
          {
            id: "skills_gaps",
            fieldName: "skills_gaps",
            question: "Which skills do you lack for getting to first revenue?",
            type: "checkbox",
            options: [
              "Sales and closing deals", "Marketing and lead generation", "Product development",
              "Financial planning", "Operations setup", "Legal and compliance",
              "Team building", "None - I have all needed skills"
            ]
          }
        ]
      },
      {
        section: "Quick Revenue Opportunities",
        questions: [
          {
            id: "quick_revenue_paths",
            fieldName: "quick_revenue_paths",
            question: "Which could generate revenue within 30 days?",
            type: "checkbox",
            options: [
              "Consulting or freelancing in my expertise", "Pre-selling the full solution",
              "Offering a simplified/manual version", "Partnering with someone who has customers",
              "Licensing my knowledge/method", "Teaching what I know", "None of these fit"
            ],
            insight: "70% of successful founders generate interim revenue while building"
          }
        ]
      }
    ];
  }
  
  if (stage === 'early_revenue') {
    return [
      {
        section: "Revenue & Customer Foundation",
        questions: [
          {
            id: "revenue_consistency",
            fieldName: "revenue_consistency",
            question: "How predictable is your monthly revenue?",
            type: "radio",
            options: [
              "Completely random", "Varies by 50%+ month to month", "Varies by 20-50%",
              "Fairly stable (±20%)", "Very predictable recurring revenue"
            ]
          },
          {
            id: "customer_acquisition_cost",
            fieldName: "customer_acquisition_cost",
            question: "Do you know how much it costs to acquire a customer?",
            type: "radio",
            options: ["Yes, tracked precisely", "Rough idea", "No idea", "We don't spend on acquisition"]
          },
          {
            id: "customer_count",
            fieldName: "customer_count",
            question: "How many active customers do you have?",
            type: "radio",
            options: ["1-5", "6-20", "21-50", "51-100", "100+"]
          }
        ]
      },
      {
        section: "Systems & Delegation Readiness",
        questions: [
          teamSize === "Just me" ? {
            id: "first_hire_blocker",
            fieldName: "first_hire_blocker",
            question: "What's stopping you from hiring help?",
            type: "checkbox",
            options: [
              "Can't afford it yet", "Don't know what role to hire", "No time to train someone",
              "Fear of losing quality", "Don't know how to hire", "Bad past experiences",
              "Prefer to work alone", "Already hiring"
            ]
          } : {
            id: "delegation_failures",
            fieldName: "delegation_failures",
            question: "What happens when you delegate?",
            type: "checkbox",
            options: [
              "Quality drops significantly", "Takes longer than doing it myself",
              "Constant questions and interruptions", "Things get missed or forgotten",
              "Delegation works well", "Haven't tried delegating yet"
            ]
          },
          {
            id: "documented_processes",
            fieldName: "documented_processes",
            question: "Which core processes are documented?",
            type: "checkbox",
            options: [
              "How we deliver our service/product", "How we onboard new customers",
              "How we handle customer issues", "How we generate leads",
              "How we close sales", "Financial processes", "None documented yet"
            ]
          }
        ]
      },
      {
        section: "Growth Readiness",
        questions: [
          {
            id: "growth_capacity",
            fieldName: "growth_capacity",
            question: "If revenue doubled tomorrow, what would break?",
            type: "checkbox",
            options: [
              "Personal capacity/time", "Delivery/fulfillment", "Customer service",
              "Quality control", "Cash flow", "Technology/systems",
              "Nothing - we could handle it"
            ]
          }
        ]
      }
    ];
  }
  
  if (stage === 'growth') {
    return [
      {
        section: "Market Position & Competition",
        questions: [
          {
            id: "competitive_advantage",
            fieldName: "competitive_advantage",
            question: "What's your genuine competitive advantage?",
            type: "checkbox",
            options: [
              "Unique product features", "Superior service/support", "Better pricing",
              "Stronger relationships", "Faster delivery", "Better technology",
              "Industry expertise", "Brand reputation", "No clear advantage"
            ]
          },
          {
            id: "market_share_growth",
            fieldName: "market_share_growth",
            question: "Is your market share growing, stable, or declining?",
            type: "radio",
            options: ["Growing rapidly", "Growing slowly", "Stable", "Declining slowly", "Declining rapidly", "Don't track this"]
          }
        ]
      },
      {
        section: "Team & Culture Assets",
        questions: [
          {
            id: "key_person_risk",
            fieldName: "key_person_risk",
            question: "How many people could the business not survive losing?",
            type: "radio",
            options: ["Just me (founder)", "2-3 people including me", "4-5 people", "No single point of failure"]
          },
          {
            id: "culture_strength",
            fieldName: "culture_strength",
            question: "How would you rate your company culture?",
            type: "matrix",
            matrixRows: [
              { id: "values", label: "Clear values everyone knows", fieldName: "culture_values" },
              { id: "accountability", label: "High accountability", fieldName: "culture_accountability" },
              { id: "innovation", label: "Innovation encouraged", fieldName: "culture_innovation" },
              { id: "communication", label: "Open communication", fieldName: "culture_communication" }
            ],
            matrixColumns: ["Weak", "Developing", "Strong", "Exceptional"]
          }
        ]
      },
      {
        section: "Systems Maturity",
        questions: [
          {
            id: "system_integration",
            fieldName: "system_integration",
            question: "How integrated are your business systems?",
            type: "radio",
            options: [
              "Everything manual/spreadsheets", "Some systems, not connected",
              "Key systems integrated", "Fully integrated tech stack", "AI/automation throughout"
            ]
          },
          {
            id: "data_utilization",
            fieldName: "data_utilization",
            question: "What data do you collect but don't analyze?",
            type: "checkbox",
            options: [
              "Customer behavior patterns", "Sales conversion metrics", "Employee productivity",
              "Financial trends", "Market intelligence", "Competitor movements",
              "We analyze everything we collect"
            ]
          }
        ]
      }
    ];
  }
  
  if (stage === 'scale') {
    return [
      {
        section: "Business Independence",
        questions: [
          {
            id: "founder_dependency",
            fieldName: "founder_dependency",
            question: "What still requires your personal involvement?",
            type: "checkbox",
            options: [
              "Major sales/BD", "Key client relationships", "Strategic decisions",
              "Financial decisions", "Hiring decisions", "Product development",
              "Quality control", "Nothing critical"
            ]
          },
          {
            id: "vacation_test",
            fieldName: "vacation_test",
            question: "What's the longest you've been away from the business?",
            type: "radio",
            options: ["Never more than a weekend", "1 week", "2 weeks", "3-4 weeks", "More than a month"]
          }
        ]
      },
      {
        section: "Exit Readiness",
        questions: [
          {
            id: "exit_timeline",
            fieldName: "exit_timeline",
            question: "When might you consider exiting?",
            type: "radio",
            options: ["ASAP", "1-2 years", "3-5 years", "5-10 years", "Never - lifestyle business", "Haven't thought about it"]
          },
          {
            id: "valuation_knowledge",
            fieldName: "valuation_knowledge",
            question: "Do you know your business valuation?",
            type: "radio",
            options: ["Yes - professional valuation done", "Yes - based on industry multiples", "Rough idea only", "No idea"]
          },
          {
            id: "acquirer_interest",
            fieldName: "acquirer_interest",
            question: "Have you had acquisition interest?",
            type: "radio",
            options: ["Yes - serious offers", "Yes - informal interest", "No - but competitors watching", "No interest shown", "Don't know"]
          }
        ]
      },
      {
        section: "Transferable Assets",
        questions: [
          {
            id: "ip_assets",
            fieldName: "ip_assets",
            question: "What intellectual property do you own?",
            type: "checkbox",
            options: [
              "Registered trademarks", "Patents filed/granted", "Proprietary software/code",
              "Unique methodologies", "Valuable data sets", "Content library",
              "Trade secrets", "Nothing formal"
            ]
          },
          {
            id: "recurring_revenue_percentage",
            fieldName: "recurring_revenue_percentage",
            question: "What % of revenue is recurring/subscription?",
            type: "slider",
            min: 0,
            max: 100,
            step: 5,
            benchmark: "SaaS businesses target 80%+"
          }
        ]
      }
    ];
  }
  
  // Default / mature - comprehensive hidden value questions
  return [
    {
      section: "Hidden Intellectual Capital",
      questions: [
        {
          id: "critical_processes_undocumented",
          fieldName: "critical_processes_undocumented",
          question: "Which critical processes exist only in people's heads?",
          type: "checkbox",
          options: [
            "Client delivery", "Sales process", "Pricing decisions", "Quality control",
            "Supplier relationships", "Financial reporting", "Customer escalations", "New employee training"
          ]
        },
        {
          id: "knowledge_dependency_percentage",
          fieldName: "knowledge_dependency_percentage",
          question: "What percentage of business knowledge is only in your head?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5
        },
        {
          id: "customer_data_unutilized",
          fieldName: "customer_data_unutilized",
          question: "What customer data do you collect but don't use?",
          type: "checkbox",
          options: [
            "Purchase history patterns", "Communication preferences", "Feedback/complaints",
            "Referral sources", "Lifetime value", "Churn predictors", "None - we use it all"
          ]
        }
      ]
    },
    {
      section: "Brand & Trust Equity",
      questions: [
        {
          id: "hidden_trust_signals",
          fieldName: "hidden_trust_signals",
          question: "Which credibility markers do you NOT display to prospects?",
          type: "checkbox",
          options: [
            "Industry awards/recognition", "Client testimonials", "Media mentions",
            "Professional certifications", "Partnership badges", "Years in business",
            "Team credentials", "Case studies"
          ]
        },
        {
          id: "personal_brand_percentage",
          fieldName: "personal_brand_percentage",
          question: "What % of customers buy because of YOU personally vs the business?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5
        }
      ]
    },
    {
      section: "Market Position Vulnerabilities",
      questions: [
        {
          id: "competitive_moat",
          fieldName: "competitive_moat",
          question: "What makes you genuinely hard to compete with?",
          type: "checkbox",
          options: [
            "Proprietary technology", "Exclusive relationships", "Geographic advantage",
            "Cost structure advantage", "Network effects", "Regulatory barriers",
            "Deep expertise", "Nothing - we compete on price"
          ]
        },
        {
          id: "top3_customer_revenue_percentage",
          fieldName: "top3_customer_revenue_percentage",
          question: "What % of revenue comes from your top 3 customers?",
          type: "slider",
          min: 0,
          max: 100,
          step: 5
        }
      ]
    },
    {
      section: "Systems & Scale Readiness",
      questions: [
        {
          id: "autonomy_sales",
          fieldName: "autonomy_sales",
          question: "If you were unavailable for a month, what would happen to SALES?",
          type: "radio",
          options: ["Would fail", "Would struggle", "Would be okay", "Would run smoothly"]
        },
        {
          id: "autonomy_delivery",
          fieldName: "autonomy_delivery",
          question: "If you were unavailable for a month, what would happen to DELIVERY?",
          type: "radio",
          options: ["Would fail", "Would struggle", "Would be okay", "Would run smoothly"]
        },
        {
          id: "autonomy_finance",
          fieldName: "autonomy_finance",
          question: "If you were unavailable for a month, what would happen to FINANCE?",
          type: "radio",
          options: ["Would fail", "Would struggle", "Would be okay", "Would run smoothly"]
        }
      ]
    },
    {
      section: "People & Succession",
      questions: [
        {
          id: "succession_your_role",
          fieldName: "succession_your_role",
          question: "Who could run the business if you stepped back tomorrow?",
          type: "radio",
          options: ["Nobody", "Someone with 6+ months training", "Someone with coaching", "Someone ready now"]
        },
        {
          id: "risk_key_employee",
          fieldName: "risk_key_employee",
          question: "If your most valuable employee left, what happens?",
          type: "radio",
          options: ["Crisis situation", "Major disruption", "Manageable disruption", "Barely noticeable"]
        }
      ]
    },
    {
      section: "Financial & Exit Readiness",
      questions: [
        {
          id: "documentation_24hr_ready",
          fieldName: "documentation_24hr_ready",
          question: "Which documents could you produce in 24 hours if a buyer asked?",
          type: "checkbox",
          options: [
            "3 years audited accounts", "Customer contracts", "Employee contracts",
            "IP documentation", "Supplier agreements", "Lease/property docs",
            "Insurance certificates", "Org chart with job descriptions"
          ]
        },
        {
          id: "know_business_worth",
          fieldName: "know_business_worth",
          question: "Do you know what your business is worth?",
          type: "radio",
          options: ["Professional valuation done", "Based on industry multiples", "Rough idea only", "No idea at all"]
        }
      ]
    }
  ];
}

// ============================================================================
// VALUE ANALYSIS CALCULATION
// ============================================================================

function calculateAssetScores(responses: Record<string, any>, context: StageContext): AssetScore[] {
  const scores: AssetScore[] = [];
  
  // 1. Intellectual Capital
  let icScore = 60;
  const undocumented = responses.critical_processes_undocumented || [];
  icScore -= undocumented.length * 4;
  if (undocumented.length <= 2) icScore += 15;
  
  const dependency = parseInt(responses.knowledge_dependency_percentage) || 0;
  if (dependency > 80) icScore -= 25;
  else if (dependency > 60) icScore -= 15;
  else if (dependency < 40) icScore += 10;
  
  const unusedData = responses.customer_data_unutilized || [];
  
  scores.push({
    category: 'Intellectual Capital',
    score: Math.max(0, Math.min(100, icScore)),
    maxScore: 100,
    issues: [
      ...(undocumented.length > 2 ? [`${undocumented.length} critical processes undocumented`] : []),
      ...(dependency > 60 ? [`${dependency}% knowledge concentrated in founder`] : [])
    ],
    opportunities: [
      ...(undocumented.length > 0 ? ['Document core processes to reduce risk'] : []),
      ...(dependency > 50 ? ['Cross-train team on critical knowledge'] : []),
      ...(unusedData.length > 2 ? [`Analyze ${unusedData.length} types of unused customer data`] : [])
    ],
    financialImpact: undocumented.length * 50000 + (dependency > 60 ? 100000 : 0) + unusedData.length * 15000
  });
  
  // 2. Brand & Trust
  let btScore = 60;
  const hiddenSignals = responses.hidden_trust_signals || [];
  btScore -= hiddenSignals.length * 3;
  
  const personalBrand = parseInt(responses.personal_brand_percentage) || 0;
  if (personalBrand > 70) btScore -= 25;
  else if (personalBrand > 50) btScore -= 15;
  else if (personalBrand < 30) btScore += 15;
  
  scores.push({
    category: 'Brand & Trust Equity',
    score: Math.max(0, Math.min(100, btScore)),
    maxScore: 100,
    issues: [
      ...(hiddenSignals.length > 3 ? [`${hiddenSignals.length} credibility markers not displayed`] : []),
      ...(personalBrand > 60 ? [`${personalBrand}% buy from you personally (unsellable)`] : [])
    ],
    opportunities: [
      ...(hiddenSignals.length > 0 ? ['Display all trust signals prominently'] : []),
      ...(personalBrand > 40 ? ['Build business brand independent of founder'] : [])
    ],
    financialImpact: hiddenSignals.length * 12000 + (personalBrand > 50 ? 75000 : 0)
  });
  
  // 3. Market Position
  let mpScore = 60;
  const moat = responses.competitive_moat || [];
  if (moat.includes('Nothing - we compete on price')) mpScore -= 30;
  else mpScore += Math.min(moat.length * 5, 25);
  
  const concentration = parseInt(responses.top3_customer_revenue_percentage) || 0;
  if (concentration > 60) mpScore -= 20;
  else if (concentration > 40) mpScore -= 10;
  else if (concentration < 25) mpScore += 10;
  
  scores.push({
    category: 'Market Position',
    score: Math.max(0, Math.min(100, mpScore)),
    maxScore: 100,
    issues: [
      ...(moat.includes('Nothing - we compete on price') ? ['No competitive moat - price competition only'] : []),
      ...(concentration > 50 ? [`${concentration}% revenue from top 3 customers`] : [])
    ],
    opportunities: [
      ...(moat.length < 3 ? ['Build additional competitive advantages'] : []),
      ...(concentration > 40 ? ['Diversify customer base'] : [])
    ],
    financialImpact: (concentration > 40 ? 200000 : 0) + (moat.length < 2 ? 50000 : 0)
  });
  
  // 4. Systems & Scale
  let ssScore = 60;
  let failedProcesses = 0;
  ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance'].forEach(f => {
    if (responses[f] === 'Would fail') failedProcesses++;
  });
  if (failedProcesses > 1) ssScore -= failedProcesses * 12;
  else if (failedProcesses === 0) ssScore += 20;
  
  scores.push({
    category: 'Systems & Scale',
    score: Math.max(0, Math.min(100, ssScore)),
    maxScore: 100,
    issues: failedProcesses > 1 ? [`${failedProcesses} key processes would fail without you`] : [],
    opportunities: failedProcesses > 0 ? ['Systematize operations for scale'] : ['Strong operational foundation'],
    financialImpact: failedProcesses * 40000
  });
  
  // 5. People & Culture
  let pcScore = 60;
  const noSuccession = responses.succession_your_role === 'Nobody';
  if (noSuccession) pcScore -= 25;
  
  const keyPersonRisk = responses.risk_key_employee;
  if (keyPersonRisk === 'Crisis situation') pcScore -= 20;
  else if (keyPersonRisk === 'Major disruption') pcScore -= 10;
  
  scores.push({
    category: 'People & Culture',
    score: Math.max(0, Math.min(100, pcScore)),
    maxScore: 100,
    issues: [
      ...(noSuccession ? ['No succession plan for your role'] : []),
      ...(keyPersonRisk === 'Crisis situation' ? ['Critical key person dependency'] : [])
    ],
    opportunities: [
      ...(noSuccession ? ['Develop succession planning'] : []),
      'Build leadership depth'
    ],
    financialImpact: (noSuccession ? 150000 : 0) + (keyPersonRisk === 'Crisis situation' ? 100000 : 0)
  });
  
  // 6. Financial & Exit
  let feScore = 60;
  const readyDocs = responses.documentation_24hr_ready || [];
  if (readyDocs.length < 4) feScore -= 20;
  else if (readyDocs.length >= 6) feScore += 15;
  
  const valKnowledge = responses.know_business_worth;
  if (valKnowledge === 'No idea at all') feScore -= 15;
  else if (valKnowledge === 'Professional valuation done') feScore += 10;
  
  scores.push({
    category: 'Financial & Exit',
    score: Math.max(0, Math.min(100, feScore)),
    maxScore: 100,
    issues: [
      ...(readyDocs.length < 4 ? [`Only ${readyDocs.length}/8 due diligence documents ready`] : []),
      ...(valKnowledge === 'No idea at all' ? ['Unknown business value'] : [])
    ],
    opportunities: [
      ...(readyDocs.length < 6 ? ['Prepare comprehensive data room'] : []),
      ...(valKnowledge !== 'Professional valuation done' ? ['Get professional valuation'] : [])
    ],
    financialImpact: (readyDocs.length < 4 ? 80000 : 0) + (valKnowledge === 'No idea at all' ? 50000 : 0)
  });
  
  return scores;
}

function identifyValueGaps(responses: Record<string, any>, context: StageContext): ValueGap[] {
  const gaps: ValueGap[] = [];
  
  // Process documentation gap
  const undocumented = responses.critical_processes_undocumented || [];
  if (undocumented.length > 0) {
    gaps.push({
      area: 'Process Documentation',
      currentValue: 0,
      potentialValue: undocumented.length * 50000,
      gap: undocumented.length * 50000,
      actions: [
        `Document "${undocumented[0]}" process first`,
        'Create process template for consistency',
        'Train team on documented processes'
      ],
      timeframe: '4-8 weeks',
      effort: undocumented.length > 4 ? 'High' : 'Medium'
    });
  }
  
  // Customer concentration gap
  const concentration = parseInt(responses.top3_customer_revenue_percentage) || 0;
  if (concentration > 50) {
    gaps.push({
      area: 'Customer Diversification',
      currentValue: 0,
      potentialValue: 200000,
      gap: 200000,
      actions: [
        'Develop customer acquisition strategy',
        'Target 10 new customers in next quarter',
        'Reduce top 3 concentration below 30%'
      ],
      timeframe: '3-6 months',
      effort: 'High'
    });
  }
  
  // Trust signals gap
  const hiddenSignals = responses.hidden_trust_signals || [];
  if (hiddenSignals.length > 0) {
    gaps.push({
      area: 'Trust Signal Optimization',
      currentValue: 0,
      potentialValue: hiddenSignals.length * 12000,
      gap: hiddenSignals.length * 12000,
      actions: [
        'Add trust badges to website header',
        'Create dedicated credibility page',
        'Include testimonials on key pages'
      ],
      timeframe: '1-2 weeks',
      effort: 'Low'
    });
  }
  
  // Data utilization gap
  const unusedData = responses.customer_data_unutilized || [];
  if (unusedData.length > 2) {
    gaps.push({
      area: 'Data Analytics Implementation',
      currentValue: 0,
      potentialValue: 45000,
      gap: 45000,
      actions: [
        'Set up customer analytics dashboard',
        'Analyze purchase patterns monthly',
        'Create data-driven marketing campaigns'
      ],
      timeframe: '2-4 weeks',
      effort: 'Low'
    });
  }
  
  return gaps.sort((a, b) => b.gap - a.gap);
}

function assessRisks(responses: Record<string, any>, context: StageContext): Risk[] {
  const risks: Risk[] = [];
  
  // Key person risk
  const dependency = parseInt(responses.knowledge_dependency_percentage) || 0;
  if (dependency > 75) {
    risks.push({
      title: 'Critical Knowledge Concentration',
      severity: 'Critical',
      impact: `${dependency}% of business knowledge concentrated in founder`,
      mitigation: 'Immediate documentation of critical processes and cross-training',
      cost: 25000
    });
  }
  
  // Succession risk
  if (responses.succession_your_role === 'Nobody') {
    risks.push({
      title: 'No Succession Plan',
      severity: 'High',
      impact: 'Business cannot continue without founder',
      mitigation: 'Develop succession planning and leadership depth',
      cost: 15000
    });
  }
  
  // Customer concentration risk
  const concentration = parseInt(responses.top3_customer_revenue_percentage) || 0;
  if (concentration > 50) {
    risks.push({
      title: 'Extreme Customer Concentration',
      severity: concentration > 70 ? 'Critical' : 'High',
      impact: `${concentration}% revenue from top 3 customers`,
      mitigation: 'Diversify customer base urgently',
      cost: 50000
    });
  }
  
  // Operational fragility
  let failedProcesses = 0;
  ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance'].forEach(f => {
    if (responses[f] === 'Would fail') failedProcesses++;
  });
  if (failedProcesses > 1) {
    risks.push({
      title: 'Operational Fragility',
      severity: 'High',
      impact: `${failedProcesses} processes would fail without founder`,
      mitigation: 'Document SOPs and train backup personnel',
      cost: failedProcesses * 20000
    });
  }
  
  // Exit readiness
  const readyDocs = responses.documentation_24hr_ready || [];
  if (readyDocs.length < 4) {
    risks.push({
      title: 'Poor Exit Readiness',
      severity: 'Medium',
      impact: 'Would take 3+ months to prepare for sale',
      mitigation: 'Create and maintain due diligence data room',
      cost: 10000
    });
  }
  
  return risks.sort((a, b) => {
    const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function calculateValuationImpact(assetScores: AssetScore[], gaps: ValueGap[], context: StageContext): any {
  const currentRevenue = context.revenue || 375000;
  const industryMultiple = 2.5;
  const currentValuation = currentRevenue * industryMultiple;
  
  const totalScore = assetScores.reduce((sum, a) => sum + a.score, 0);
  const maxScore = assetScores.reduce((sum, a) => sum + a.maxScore, 0);
  const scorePercentage = (totalScore / maxScore) * 100;
  
  let multiplierIncrease = 0;
  if (scorePercentage < 40) multiplierIncrease = 1.5;
  else if (scorePercentage < 60) multiplierIncrease = 1.0;
  else multiplierIncrease = 0.5;
  
  const totalValueGap = gaps.reduce((sum, g) => sum + g.gap, 0);
  const revenueIncreasePotential = totalValueGap * 0.3;
  
  const potentialRevenue = currentRevenue + revenueIncreasePotential;
  const potentialMultiple = industryMultiple + multiplierIncrease;
  const potentialValuation = potentialRevenue * potentialMultiple;
  
  return {
    currentValuation,
    potentialValuation,
    valuationIncrease: potentialValuation - currentValuation,
    percentageIncrease: ((potentialValuation / currentValuation) - 1) * 100,
    exitReadinessScore: scorePercentage,
    currentMultiple: industryMultiple,
    potentialMultiple,
    timeframe: '12-18 months'
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { action, clientId, practiceId, part3Responses } = body;

    // Action 1: Get stage-specific questions
    if (action === 'get-questions') {
      // Fetch Parts 1 & 2 to determine stage
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2']);

      const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
      
      const context = determineBusinessStage(part1, part2);
      const questions = getStageSpecificQuestions(context);

      return new Response(
        JSON.stringify({
          success: true,
          businessStage: context.stage,
          questions,
          context: {
            revenue: context.revenueBand,
            teamSize: context.teamSize,
            timeAvailable: context.timeCommitment
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action 2: Generate value analysis from Part 3 responses
    if (action === 'generate-analysis') {
      if (!part3Responses) {
        return new Response(
          JSON.stringify({ error: 'Missing part3Responses' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Generating value analysis for client ${clientId}...`);

      // Get context
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2']);

      const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
      const context = determineBusinessStage(part1, part2);

      // Calculate everything
      const assetScores = calculateAssetScores(part3Responses, context);
      const valueGaps = identifyValueGaps(part3Responses, context);
      const riskRegister = assessRisks(part3Responses, context);
      const valuationImpact = calculateValuationImpact(assetScores, valueGaps, context);

      const overallScore = Math.round(
        assetScores.reduce((sum, s) => sum + s.score, 0) / assetScores.length
      );

      const totalOpportunity = assetScores.reduce((sum, s) => sum + s.financialImpact, 0);

      const valueAnalysis = {
        businessStage: context.stage,
        assetScores,
        overallScore,
        valueGaps,
        riskRegister,
        valuationImpact,
        totalOpportunity,
        generatedAt: new Date().toISOString()
      };

      // Update the roadmap with value analysis
      const { error: updateError } = await supabase
        .from('client_roadmaps')
        .update({ value_analysis: valueAnalysis })
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (updateError) {
        console.error('Failed to update roadmap with value analysis:', updateError);
      }

      // Also save Part 3 responses
      await supabase.from('client_assessments').upsert({
        practice_id: practiceId,
        client_id: clientId,
        assessment_type: 'part3',
        responses: part3Responses,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, { onConflict: 'client_id,assessment_type' });

      console.log('Value analysis complete!');

      return new Response(
        JSON.stringify({
          success: true,
          valueAnalysis,
          summary: {
            overallScore,
            totalOpportunity,
            criticalRisks: riskRegister.filter(r => r.severity === 'Critical').length,
            quickWins: valueGaps.filter(g => g.effort === 'Low').length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "get-questions" or "generate-analysis"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
