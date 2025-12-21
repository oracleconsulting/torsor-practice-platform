/**
 * Industry Taxonomy for Benchmarking Service
 * 
 * Comprehensive hierarchical industry taxonomy with 75+ industries across 14 categories.
 * Each industry includes SIC codes, keywords for AI classification, and benchmark profiles.
 */

export interface IndustryMetric {
  code: string;
  name: string;
  unit: 'percent' | 'currency' | 'days' | 'ratio' | 'number';
}

export interface MetricRange {
  metricCode: string;
  p25: number;
  p50: number;
  p75: number;
}

export interface BenchmarkProfile {
  primaryMetrics: string[];
  secondaryMetrics: string[];
  industrySpecificMetrics?: IndustryMetric[];
  typicalRanges?: MetricRange[];
}

export interface Industry {
  code: string;
  name: string;
  category: string;
  sicCodes: string[];
  description?: string;
  benchmarkProfile: BenchmarkProfile;
  keywords: string[];
  ukSpecific?: boolean;
  subSectors?: Industry[];
}

export interface IndustryCategory {
  category: string;
  name: string;
  industries: Industry[];
}

export const INDUSTRY_TAXONOMY: IndustryCategory[] = [
  // ═══════════════════════════════════════════════════════════════
  // PROFESSIONAL SERVICES
  // ═══════════════════════════════════════════════════════════════
  {
    category: "professional_services",
    name: "Professional Services",
    industries: [
      {
        code: "ACCT",
        name: "Accountancy & Tax Services",
        sicCodes: ["69201", "69202"],
        keywords: ["accountant", "tax", "audit", "bookkeeping", "payroll"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_partner", "revenue_per_employee", "fee_per_client", "client_retention"],
          secondaryMetrics: ["utilisation_rate", "recovery_rate", "wip_days", "debtor_days"],
          industrySpecificMetrics: [
            { code: "chargeable_hours_ratio", name: "Chargeable Hours Ratio", unit: "percent" },
            { code: "recurring_revenue_percent", name: "Recurring Revenue %", unit: "percent" },
            { code: "avg_fee_per_client", name: "Average Fee per Client", unit: "currency" },
          ]}
      },
      {
        code: "LEGAL",
        name: "Legal Services",
        sicCodes: ["69101", "69102", "69109"],
        keywords: ["solicitor", "lawyer", "law firm", "legal", "barrister", "conveyancing"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_partner", "profit_per_equity_partner", "revenue_per_lawyer"],
          secondaryMetrics: ["utilisation_rate", "realisation_rate", "leverage_ratio"],
          industrySpecificMetrics: [
            { code: "pep", name: "Profit per Equity Partner", unit: "currency" },
            { code: "matters_per_fee_earner", name: "Matters per Fee Earner", unit: "number" },
          ]}
      },
      {
        code: "CONSULT",
        category: "professional_services",
        name: "Management Consultancy",
        sicCodes: ["70229"],
        keywords: ["consultant", "consulting", "advisory", "strategy"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_consultant", "utilisation_rate", "day_rate"],
          secondaryMetrics: ["project_margin", "repeat_client_rate", "pipeline_coverage"]
        }
      },
      {
        code: "ARCH",
        category: "professional_services",
        name: "Architecture & Design",
        sicCodes: ["71111"],
        keywords: ["architect", "architecture", "building design", "planning"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_architect", "project_margin", "win_rate"],
          secondaryMetrics: ["wip_days", "debtor_days", "repeat_client_rate"]
        }
      },
      {
        code: "ENG",
        category: "professional_services",
        name: "Engineering Consultancy",
        sicCodes: ["71121", "71122", "71129"],
        keywords: ["engineer", "engineering", "structural", "civil", "mechanical"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_engineer", "project_margin", "utilisation_rate"],
          secondaryMetrics: ["order_book_months", "variation_rate"]
        }
      },
      {
        code: "SURVEY",
        category: "professional_services",
        name: "Surveying & Valuation",
        sicCodes: ["71111"],
        keywords: ["surveyor", "valuation", "RICS", "property survey"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_surveyor", "instructions_per_month", "avg_fee"],
          secondaryMetrics: ["debtor_days", "repeat_client_rate"]
        }
      },
      {
        code: "RECRUIT",
        category: "professional_services",
        name: "Recruitment & Staffing",
        sicCodes: ["78109", "78200", "78300"],
        keywords: ["recruitment", "staffing", "headhunter", "executive search", "temp agency"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_consultant", "gross_margin", "placement_rate"],
          secondaryMetrics: ["fill_rate", "time_to_fill", "candidate_nps"],
          industrySpecificMetrics: [
            { code: "perm_to_temp_ratio", name: "Perm to Temp Ratio", unit: "ratio" },
            { code: "nfr_rate", name: "Net Fee Revenue per Head", unit: "currency" },
          ]}
      },
      {
        code: "MARKET",
        category: "professional_services",
        name: "Marketing & PR Agencies",
        sicCodes: ["73110", "73120", "70210"],
        keywords: ["marketing", "PR", "public relations", "advertising", "branding", "digital marketing"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_head", "gross_margin", "client_retention"],
          secondaryMetrics: ["avg_retainer_value", "project_profitability"]
        }
      },
      {
        code: "HR",
        category: "professional_services",
        name: "HR Consultancy",
        sicCodes: ["70229", "78100"],
        keywords: ["HR", "human resources", "people", "talent", "L&D", "training"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_consultant", "day_rate", "repeat_business"],
          secondaryMetrics: ["utilisation_rate", "client_satisfaction"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY & DIGITAL
  // ═══════════════════════════════════════════════════════════════
  {
    category: "technology",
    name: "Technology & Digital",
    industries: [
      {
        code: "SAAS",
        category: "technology",
        name: "SaaS / Software Products",
        sicCodes: ["62011", "62012"],
        keywords: ["SaaS", "software", "subscription", "platform", "app"],
        benchmarkProfile: {
          primaryMetrics: ["arr", "mrr", "net_revenue_retention", "cac_payback"],
          secondaryMetrics: ["ltv_cac_ratio", "gross_margin", "churn_rate"],
          industrySpecificMetrics: [
            { code: "arr", name: "Annual Recurring Revenue", unit: "currency" },
            { code: "nrr", name: "Net Revenue Retention", unit: "percent" },
            { code: "magic_number", name: "Magic Number", unit: "ratio" },
          ]}
      },
      {
        code: "AGENCY_DEV",
        category: "technology",
        name: "Software Development Agency",
        sicCodes: ["62020"],
        keywords: ["software development", "web development", "app development", "coding", "programming"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_developer", "utilisation_rate", "project_margin"],
          secondaryMetrics: ["day_rate", "repeat_client_rate", "delivery_on_time"]
        }
      },
      {
        code: "ITSERV",
        category: "technology",
        name: "IT Services & MSP",
        sicCodes: ["62020", "62030", "62090"],
        keywords: ["IT support", "managed services", "MSP", "helpdesk", "infrastructure"],
        benchmarkProfile: {
          primaryMetrics: ["mrr_per_endpoint", "revenue_per_technician", "ticket_resolution_time"],
          secondaryMetrics: ["client_retention", "gross_margin", "nps"],
          industrySpecificMetrics: [
            { code: "endpoints_per_tech", name: "Endpoints per Technician", unit: "number" },
            { code: "mrr_per_endpoint", name: "MRR per Endpoint", unit: "currency" },
          ]}
      },
      {
        code: "ECOMM",
        category: "technology",
        name: "E-commerce & Online Retail",
        sicCodes: ["47910"],
        keywords: ["ecommerce", "online shop", "dropshipping", "amazon seller", "shopify"],
        benchmarkProfile: {
          primaryMetrics: ["conversion_rate", "aov", "cac", "roas"],
          secondaryMetrics: ["return_rate", "repeat_purchase_rate", "gross_margin"],
          industrySpecificMetrics: [
            { code: "aov", name: "Average Order Value", unit: "currency" },
            { code: "roas", name: "Return on Ad Spend", unit: "ratio" },
          ]}
      },
      {
        code: "CYBER",
        category: "technology",
        name: "Cybersecurity",
        sicCodes: ["62090"],
        keywords: ["cybersecurity", "security", "penetration testing", "compliance", "GDPR"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_consultant", "mrr", "utilisation_rate"],
          secondaryMetrics: ["certification_coverage", "incident_response_time"]
        }
      },
      {
        code: "DATA",
        category: "technology",
        name: "Data & Analytics",
        sicCodes: ["63110"],
        keywords: ["data", "analytics", "BI", "business intelligence", "data science"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_analyst", "project_margin", "repeat_business"],
          secondaryMetrics: ["utilisation_rate", "tool_revenue_share"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // CREATIVE INDUSTRIES
  // ═══════════════════════════════════════════════════════════════
  {
    category: "creative",
    name: "Creative Industries",
    industries: [
      {
        code: "DESIGN",
        category: "creative",
        name: "Graphic & Brand Design",
        sicCodes: ["74100"],
        keywords: ["design", "graphic design", "branding", "logo", "creative"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_designer", "project_margin", "client_retention"],
          secondaryMetrics: ["avg_project_value", "repeat_client_rate"]
    }
      },
      {
        code: "PHOTO",
        category: "creative",
        name: "Photography & Videography",
        sicCodes: ["74201", "59111"],
        keywords: ["photographer", "videographer", "film", "production", "content creation"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_creative", "avg_project_value", "bookings_per_month"],
          secondaryMetrics: ["equipment_utilisation", "post_production_time"]
        }
      },
      {
        code: "MEDIA",
        category: "creative",
        name: "Media Production",
        sicCodes: ["59111", "59112", "59120"],
        keywords: ["production", "film", "TV", "broadcast", "media"],
        benchmarkProfile: {
          primaryMetrics: ["project_margin", "crew_utilisation", "revenue_per_project"],
          secondaryMetrics: ["post_production_efficiency", "equipment_roi"]
        }
      },
      {
        code: "GAMES",
        category: "creative",
        name: "Games Development",
        sicCodes: ["62011", "58210"],
        keywords: ["games", "gaming", "game development", "indie", "studio"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_developer", "project_completion_rate", "user_acquisition_cost"],
          secondaryMetrics: ["arpu", "retention_d7", "monetisation_rate"]
        }
      },
      {
        code: "MUSIC",
        category: "creative",
        name: "Music & Audio Production",
        sicCodes: ["59200", "90030"],
        keywords: ["music", "audio", "recording", "studio", "sound"],
        benchmarkProfile: {
          primaryMetrics: ["studio_utilisation", "avg_project_value", "repeat_client_rate"],
          secondaryMetrics: ["revenue_per_engineer", "royalty_income_percent"]
        }
      },
      {
        code: "PUBLISH",
        category: "creative",
        name: "Publishing & Content",
        sicCodes: ["58110", "58130", "58140"],
        keywords: ["publishing", "content", "editorial", "magazine", "books"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_title", "subscriber_retention", "content_margin"],
          secondaryMetrics: ["digital_vs_print_ratio", "advertising_yield"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // CONSTRUCTION & PROPERTY
  // ═══════════════════════════════════════════════════════════════
  {
    category: "construction_property",
    name: "Construction & Property",
    industries: [
      {
        code: "CONST_MAIN",
        category: "construction_property",
        name: "Main Contractor / Builder",
        sicCodes: ["41201", "41202"],
        keywords: ["builder", "contractor", "construction", "building"],
        benchmarkProfile: {
          primaryMetrics: ["gross_margin", "revenue_per_employee", "order_book_months"],
          secondaryMetrics: ["project_overrun_rate", "retention_release_days", "subcontractor_ratio"],
          industrySpecificMetrics: [
            { code: "retention_held", name: "Retention Held", unit: "currency" },
            { code: "certified_vs_claimed", name: "Certified vs Claimed %", unit: "percent" },
          ]}
      },
      {
        code: "CONST_SPEC",
        category: "construction_property",
        name: "Specialist Contractor",
        sicCodes: ["43210", "43220", "43290", "43310", "43320", "43341", "43390"],
        keywords: ["electrical", "plumbing", "HVAC", "roofing", "flooring", "specialist"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_operative", "gross_margin", "job_completion_rate"],
          secondaryMetrics: ["callback_rate", "material_wastage", "utilisation"]
        }
      },
      {
        code: "PROP_DEV",
        category: "construction_property",
        name: "Property Development",
        sicCodes: ["41100"],
        keywords: ["property developer", "development", "housing", "residential"],
        benchmarkProfile: {
          primaryMetrics: ["gross_development_value", "development_margin", "land_bank_months"],
          secondaryMetrics: ["planning_success_rate", "build_cost_per_sqft", "sales_velocity"]
        }
      },
      {
        code: "ESTATE",
        category: "construction_property",
        name: "Estate Agency",
        sicCodes: ["68310"],
        keywords: ["estate agent", "property sales", "lettings", "real estate"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_negotiator", "avg_fee", "market_share"],
          secondaryMetrics: ["listings_to_sales", "time_on_market", "fall_through_rate"],
          industrySpecificMetrics: [
            { code: "avg_sale_price", name: "Average Sale Price", unit: "currency" },
            { code: "instructions_per_month", name: "Instructions per Month", unit: "number" },
          ]}
      },
      {
        code: "PROP_MGMT",
        category: "construction_property",
        name: "Property Management",
        sicCodes: ["68320"],
        keywords: ["property management", "lettings", "block management", "landlord"],
        benchmarkProfile: {
          primaryMetrics: ["units_under_management", "revenue_per_unit", "void_rate"],
          secondaryMetrics: ["arrears_rate", "maintenance_response_time", "tenant_retention"]
        }
      },
      {
        code: "TRADES",
        category: "construction_property",
        name: "Trade Services (Plumber, Electrician, etc.)",
        sicCodes: ["43210", "43220"],
        keywords: ["plumber", "electrician", "tradesman", "gas engineer", "heating"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_engineer", "jobs_per_day", "avg_job_value"],
          secondaryMetrics: ["first_time_fix_rate", "callback_rate", "parts_margin"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // HEALTHCARE & WELLBEING
  // ═══════════════════════════════════════════════════════════════
  {
    category: "healthcare",
    name: "Healthcare & Wellbeing",
    industries: [
      {
        code: "DENTAL",
        category: "healthcare",
        name: "Dental Practice",
        sicCodes: ["86230"],
        keywords: ["dentist", "dental", "orthodontics", "oral health"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_surgery", "revenue_per_dentist", "patient_retention"],
          secondaryMetrics: ["nhs_vs_private_ratio", "hygiene_revenue_percent", "fta_rate"],
          industrySpecificMetrics: [
            { code: "uda_value", name: "UDA Value", unit: "currency" },
            { code: "chair_utilisation", name: "Chair Utilisation", unit: "percent" },
          ]}
      },
      {
        code: "VET",
        category: "healthcare",
        name: "Veterinary Practice",
        sicCodes: ["75000"],
        keywords: ["vet", "veterinary", "animal", "pet"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_vet", "avg_transaction_value", "client_retention"],
          secondaryMetrics: ["plan_penetration", "retail_revenue_percent", "emergency_revenue_percent"]
        }
      },
      {
        code: "OPTOM",
        category: "healthcare",
        name: "Optometry Practice",
        sicCodes: ["86900"],
        keywords: ["optician", "optometrist", "eye care", "glasses", "contact lenses"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_optom", "avg_dispense_value", "conversion_rate"],
          secondaryMetrics: ["contact_lens_revenue_percent", "recall_compliance"]
        }
      },
      {
        code: "PHARMA",
        category: "healthcare",
        name: "Pharmacy",
        sicCodes: ["47730"],
        keywords: ["pharmacy", "chemist", "dispensing", "prescription"],
        benchmarkProfile: {
          primaryMetrics: ["items_dispensed", "revenue_per_employee", "otc_percent"],
          secondaryMetrics: ["dispensing_accuracy", "mur_completion_rate"]
        }
      },
      {
        code: "CARE",
        category: "healthcare",
        name: "Care Home / Domiciliary Care",
        sicCodes: ["87100", "87200", "87300", "88100"],
        keywords: ["care home", "nursing home", "domiciliary", "home care", "elderly care"],
        benchmarkProfile: {
          primaryMetrics: ["occupancy_rate", "fee_per_resident_week", "staff_turnover"],
          secondaryMetrics: ["cqc_rating", "agency_staff_percent", "fee_uplifts"]
        }
      },
      {
        code: "PRIVATE_HEALTH",
        category: "healthcare",
        name: "Private Healthcare / Clinic",
        sicCodes: ["86210", "86220", "86900"],
        keywords: ["clinic", "private hospital", "cosmetic", "aesthetics", "specialist"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_consultant", "avg_treatment_value", "patient_satisfaction"],
          secondaryMetrics: ["consultation_to_treatment_rate", "repeat_patient_rate"]
        }
      },
      {
        code: "FITNESS",
        category: "healthcare",
        name: "Gym / Fitness",
        sicCodes: ["93130"],
        keywords: ["gym", "fitness", "personal trainer", "health club", "studio"],
        benchmarkProfile: {
          primaryMetrics: ["member_count", "revenue_per_member", "member_retention"],
          secondaryMetrics: ["secondary_spend", "pt_attach_rate", "attrition_rate"]
        }
      },
      {
        code: "WELLNESS",
        category: "healthcare",
        name: "Wellness & Therapy",
        sicCodes: ["86900", "96040"],
        keywords: ["therapy", "counselling", "massage", "spa", "wellness"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_therapist", "avg_session_value", "client_retention"],
          secondaryMetrics: ["rebooking_rate", "package_uptake"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // HOSPITALITY & LEISURE
  // ═══════════════════════════════════════════════════════════════
  {
    category: "hospitality",
    name: "Hospitality & Leisure",
    industries: [
      {
        code: "RESTAURANT",
        category: "hospitality",
        name: "Restaurant / Café",
        sicCodes: ["56101", "56102", "56103"],
        keywords: ["restaurant", "cafe", "dining", "food service"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_cover", "gp_percent", "labour_percent"],
          secondaryMetrics: ["covers_per_day", "avg_spend", "table_turn"],
          industrySpecificMetrics: [
            { code: "food_cost_percent", name: "Food Cost %", unit: "percent" },
            { code: "beverage_cost_percent", name: "Beverage Cost %", unit: "percent" },
          ]}
      },
      {
        code: "PUB",
        category: "hospitality",
        name: "Pub / Bar",
        sicCodes: ["56301", "56302"],
        keywords: ["pub", "bar", "inn", "tavern"],
        benchmarkProfile: {
          primaryMetrics: ["wet_vs_dry_split", "gp_percent", "barrelage"],
          secondaryMetrics: ["food_revenue_percent", "gaming_revenue", "avg_transaction"]
        }
      },
      {
        code: "HOTEL",
        category: "hospitality",
        name: "Hotel / B&B",
        sicCodes: ["55100", "55201", "55202"],
        keywords: ["hotel", "B&B", "accommodation", "boutique hotel"],
        benchmarkProfile: {
          primaryMetrics: ["occupancy_rate", "adr", "revpar"],
          secondaryMetrics: ["direct_booking_percent", "f_and_b_capture", "trevpar"],
          industrySpecificMetrics: [
            { code: "adr", name: "Average Daily Rate", unit: "currency" },
            { code: "revpar", name: "Revenue per Available Room", unit: "currency" },
          ]}
      },
      {
        code: "CATERING",
        category: "hospitality",
        name: "Catering / Events",
        sicCodes: ["56210"],
        keywords: ["catering", "events", "wedding", "corporate catering"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_event", "gp_percent", "events_per_month"],
          secondaryMetrics: ["avg_covers_per_event", "repeat_client_rate"]
        }
      },
      {
        code: "LEISURE",
        category: "hospitality",
        name: "Leisure & Entertainment",
        sicCodes: ["93110", "93210", "93290"],
        keywords: ["leisure", "entertainment", "bowling", "cinema", "attractions"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_visitor", "secondary_spend", "capacity_utilisation"],
          secondaryMetrics: ["peak_vs_offpeak_ratio", "membership_revenue_percent"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // RETAIL
  // ═══════════════════════════════════════════════════════════════
  {
    category: "retail",
    name: "Retail",
    industries: [
      {
        code: "RETAIL_GEN",
        category: "retail",
        name: "General Retail",
        sicCodes: ["47190"],
        keywords: ["shop", "retail", "store", "high street"],
        benchmarkProfile: {
          primaryMetrics: ["sales_per_sqft", "gross_margin", "stock_turn"],
          secondaryMetrics: ["conversion_rate", "avg_basket", "shrinkage"],
          industrySpecificMetrics: [
            { code: "like_for_like_growth", name: "Like-for-Like Growth", unit: "percent" },
            { code: "footfall", name: "Footfall", unit: "number" }
          ]}
      },
      {
        code: "RETAIL_FOOD",
        category: "retail",
        name: "Food Retail / Convenience",
        sicCodes: ["47110", "47210", "47220", "47230", "47240", "47250", "47290"],
        keywords: ["convenience store", "grocery", "newsagent", "off-licence"],
        benchmarkProfile: {
          primaryMetrics: ["sales_per_sqft", "gross_margin", "basket_size"],
          secondaryMetrics: ["waste_percent", "stock_days", "service_revenue_percent"]
        }
      },
      {
        code: "RETAIL_SPEC",
        category: "retail",
        name: "Specialist Retail",
        sicCodes: ["47410", "47510", "47530", "47540", "47590", "47710", "47720", "47750", "47770", "47780", "47790"],
        keywords: ["specialist", "boutique", "niche retail"],
        benchmarkProfile: {
          primaryMetrics: ["sales_per_sqft", "gross_margin", "avg_transaction"],
          secondaryMetrics: ["ecommerce_percent", "return_rate", "vip_customer_percent"]
        }
      },
      {
        code: "AUTO_RETAIL",
        category: "retail",
        name: "Motor Trade / Dealership",
        sicCodes: ["45111", "45112", "45200", "45310", "45320", "45400"],
        keywords: ["car dealer", "motor trade", "garage", "dealership", "used cars"],
        benchmarkProfile: {
          primaryMetrics: ["units_sold", "gross_profit_per_unit", "aftersales_revenue"],
          secondaryMetrics: ["f_and_i_penetration", "service_absorption", "stock_days"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // MANUFACTURING & ENGINEERING
  // ═══════════════════════════════════════════════════════════════
  {
    category: "manufacturing",
    name: "Manufacturing & Engineering",
    industries: [
      {
        code: "MFG_GEN",
        category: "manufacturing",
        name: "General Manufacturing",
        sicCodes: ["10000-33000"],
        keywords: ["manufacturing", "factory", "production", "maker"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_employee", "gross_margin", "oee"],
          secondaryMetrics: ["inventory_turns", "on_time_delivery", "scrap_rate"],
          industrySpecificMetrics: [
            { code: "oee", name: "Overall Equipment Effectiveness", unit: "percent" },
            { code: "capacity_utilisation", name: "Capacity Utilisation", unit: "percent" }
          ]}
      },
      {
        code: "MFG_FOOD",
        category: "manufacturing",
        name: "Food & Beverage Manufacturing",
        sicCodes: ["10110-10890", "11010-11070"],
        keywords: ["food manufacturing", "beverage", "bakery", "food production"],
        benchmarkProfile: {
          primaryMetrics: ["yield_percent", "gross_margin", "volume_growth"],
          secondaryMetrics: ["waste_percent", "brcgs_compliance", "customer_complaints_ppm"]
        }
      },
      {
        code: "MFG_PREC",
        category: "manufacturing",
        name: "Precision Engineering",
        sicCodes: ["25620", "28410", "28990"],
        keywords: ["precision engineering", "CNC", "machining", "toolmaking"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_machine_hour", "utilisation", "rework_rate"],
          secondaryMetrics: ["quote_win_rate", "on_time_delivery", "scrap_rate"]
        }
      },
      {
        code: "PRINT",
        category: "manufacturing",
        name: "Print & Packaging",
        sicCodes: ["17210", "17230", "17290", "18110", "18120", "18130", "18140"],
        keywords: ["print", "printing", "packaging", "labels"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_employee", "gross_margin", "press_utilisation"],
          secondaryMetrics: ["makeready_time", "waste_percent", "digital_vs_litho"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // WHOLESALE & DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════
  {
    category: "wholesale",
    name: "Wholesale & Distribution",
    industries: [
      {
        code: "WHOLESALE",
        category: "wholesale",
        name: "Wholesale Distribution",
        sicCodes: ["46110-46900"],
        keywords: ["wholesale", "distributor", "trade supplier"],
        benchmarkProfile: {
          primaryMetrics: ["gross_margin", "inventory_turns", "revenue_per_employee"],
          secondaryMetrics: ["order_accuracy", "fill_rate", "delivery_cost_percent"],
          industrySpecificMetrics: [
            { code: "gmroi", name: "Gross Margin Return on Inventory", unit: "ratio" }
          ]}
      },
      {
        code: "LOGISTICS",
        category: "wholesale",
        name: "Logistics & Haulage",
        sicCodes: ["49410", "49420", "52100", "52210", "52290"],
        keywords: ["logistics", "haulage", "transport", "courier", "freight"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_vehicle", "empty_running_percent", "fuel_cost_percent"],
          secondaryMetrics: ["on_time_delivery", "driver_turnover", "maintenance_cost_per_mile"]
        }
      },
      {
        code: "IMPORT_EXPORT",
        category: "wholesale",
        name: "Import/Export Trading",
        sicCodes: ["46900"],
        keywords: ["import", "export", "trading", "international trade"],
        benchmarkProfile: {
          primaryMetrics: ["gross_margin", "currency_exposure", "supplier_concentration"],
          secondaryMetrics: ["lead_time_days", "customs_clearance_time"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // ENERGY & ENVIRONMENT
  // ═══════════════════════════════════════════════════════════════
  {
    category: "energy",
    name: "Energy & Environment",
    industries: [
      {
        code: "RENEW",
        category: "energy",
        name: "Renewable Energy",
        sicCodes: ["35110", "35120", "35130"],
        keywords: ["solar", "wind", "renewable", "green energy", "EV charging"],
        benchmarkProfile: {
          primaryMetrics: ["capacity_factor", "revenue_per_mw", "ppa_coverage"],
          secondaryMetrics: ["maintenance_cost_per_mw", "availability"]
    }
      },
      {
        code: "INSTALL_ENERGY",
        category: "energy",
        name: "Energy Installation (Solar, HVAC, etc.)",
        sicCodes: ["43210", "43220"],
        keywords: ["solar installer", "heat pump", "HVAC", "boiler"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_installer", "jobs_per_month", "avg_job_value"],
          secondaryMetrics: ["installation_time", "callback_rate", "finance_penetration"]
        }
      },
      {
        code: "WASTE",
        category: "energy",
        name: "Waste Management & Recycling",
        sicCodes: ["38110", "38120", "38210", "38220", "38310", "38320"],
        keywords: ["waste", "recycling", "skip hire", "refuse"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_vehicle", "diversion_rate", "gate_fee"],
          secondaryMetrics: ["route_efficiency", "contamination_rate"]
        }
      },
      {
        code: "ENVIRON",
        category: "energy",
        name: "Environmental Consultancy",
        sicCodes: ["71200"],
        keywords: ["environmental", "ecology", "sustainability", "ESG"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_consultant", "utilisation_rate", "project_margin"],
          secondaryMetrics: ["repeat_client_rate", "certification_success_rate"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // CHARITIES & SOCIAL ENTERPRISE
  // ═══════════════════════════════════════════════════════════════
  {
    category: "charity",
    name: "Charities & Social Enterprise",
    industries: [
      {
        code: "CHARITY",
        category: "charity",
        name: "Charity / Non-Profit",
        sicCodes: ["88990", "94110", "94120", "94200", "94910", "94920", "94990"],
        keywords: ["charity", "non-profit", "NGO", "foundation", "trust"],
        benchmarkProfile: {
          primaryMetrics: ["fundraising_roi", "charitable_spending_ratio", "reserves_months"],
          secondaryMetrics: ["donor_retention", "volunteer_hours", "grant_success_rate"],
          industrySpecificMetrics: [
            { code: "cost_to_raise_pound", name: "Cost to Raise £1", unit: "currency" },
            { code: "charitable_ratio", name: "Charitable Spend Ratio", unit: "percent" }
          ]}
      },
      {
        code: "SOCIAL_ENT",
        category: "charity",
        name: "Social Enterprise",
        sicCodes: ["88990"],
        keywords: ["social enterprise", "CIC", "community interest", "impact"],
        benchmarkProfile: {
          primaryMetrics: ["social_impact_metric", "trading_income_percent", "sustainability_ratio"],
          secondaryMetrics: ["grant_dependency", "beneficiary_reach"]
        }
      },
      {
        code: "EDUCATION",
        category: "charity",
        name: "Education & Training Provider",
        sicCodes: ["85310", "85320", "85410", "85420", "85590"],
        keywords: ["training", "education", "courses", "academy", "school"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_learner", "completion_rate", "satisfaction_score"],
          secondaryMetrics: ["cost_per_learner", "progression_rate", "utilisation"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL & TOURISM
  // ═══════════════════════════════════════════════════════════════
  {
    category: "travel",
    name: "Travel & Tourism",
    industries: [
      {
        code: "TRAVEL_AGENT",
        category: "travel",
        name: "Travel Agency / Tour Operator",
        sicCodes: ["79110", "79120"],
        keywords: ["travel agent", "tour operator", "holidays", "travel"],
        benchmarkProfile: {
          primaryMetrics: ["commission_margin", "revenue_per_consultant", "booking_value"],
          secondaryMetrics: ["ancillary_attach_rate", "repeat_booking_rate"]
    }
      },
      {
        code: "TOUR",
        category: "travel",
        name: "Tours & Experiences",
        sicCodes: ["79120", "79900"],
        keywords: ["tours", "experiences", "activities", "sightseeing"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_tour", "capacity_utilisation", "margin_per_guest"],
          secondaryMetrics: ["tripadvisor_rating", "repeat_guest_rate"]
        }
      },
      {
        code: "TRANSPORT",
        category: "travel",
        name: "Passenger Transport",
        sicCodes: ["49100", "49310", "49320", "49390"],
        keywords: ["coach", "taxi", "minibus", "private hire", "chauffeur"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_vehicle", "utilisation", "fuel_cost_percent"],
          secondaryMetrics: ["driver_turnover", "on_time_performance"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // AGRICULTURE & RURAL
  // ═══════════════════════════════════════════════════════════════
  {
    category: "agriculture",
    name: "Agriculture & Rural",
    industries: [
      {
        code: "FARM",
        category: "agriculture",
        name: "Farming / Agriculture",
        sicCodes: ["01110-01640"],
        keywords: ["farm", "agriculture", "arable", "livestock", "dairy"],
        benchmarkProfile: {
          primaryMetrics: ["yield_per_hectare", "margin_per_hectare", "output_per_lu"],
          secondaryMetrics: ["bps_dependency", "diversification_income", "tenancy_percent"]
    }
      },
      {
        code: "GARDEN",
        category: "agriculture",
        name: "Landscaping & Garden Services",
        sicCodes: ["81300"],
        keywords: ["landscaping", "garden", "groundscare", "lawn"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_operative", "job_margin", "contract_vs_adhoc"],
          secondaryMetrics: ["material_markup", "equipment_utilisation"]
        }
      },
      {
        code: "EQUINE",
        category: "agriculture",
        name: "Equine / Equestrian",
        sicCodes: ["01430", "93190"],
        keywords: ["equestrian", "livery", "horse", "riding school"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_horse", "livery_occupancy", "lesson_utilisation"],
          secondaryMetrics: ["feed_cost_percent", "vet_cost_per_horse"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANCIAL SERVICES
  // ═══════════════════════════════════════════════════════════════
  {
    category: "financial_services",
    name: "Financial Services",
    industries: [
      {
        code: "IFA",
        category: "financial_services",
        name: "Financial Advice / IFA",
        sicCodes: ["66190"],
        keywords: ["IFA", "financial adviser", "wealth management", "financial planning"],
        benchmarkProfile: {
          primaryMetrics: ["aum_per_adviser", "recurring_revenue_percent", "client_retention"],
          secondaryMetrics: ["new_client_acquisition", "avg_case_size", "trail_income_percent"]
    }
      },
      {
        code: "MORTGAGE",
        category: "financial_services",
        name: "Mortgage Broker",
        sicCodes: ["66190"],
        keywords: ["mortgage broker", "mortgage adviser", "home loans"],
        benchmarkProfile: {
          primaryMetrics: ["cases_per_adviser", "avg_proc_fee", "completion_rate"],
          secondaryMetrics: ["pipeline_value", "protection_attach_rate"]
        }
      },
      {
        code: "INSURANCE",
        category: "financial_services",
        name: "Insurance Broker",
        sicCodes: ["66220"],
        keywords: ["insurance broker", "commercial insurance", "insurance"],
        benchmarkProfile: {
          primaryMetrics: ["gwp_per_account_exec", "retention_rate", "commission_rate"],
          secondaryMetrics: ["claims_ratio", "new_business_gwp"]
        }
      },
      {
        code: "FINTECH",
        category: "financial_services",
        name: "Fintech / Payments",
        sicCodes: ["64190", "66190"],
        keywords: ["fintech", "payments", "financial technology"],
        benchmarkProfile: {
          primaryMetrics: ["tpv", "take_rate", "customer_acquisition_cost"],
          secondaryMetrics: ["churn_rate", "net_revenue_retention"]
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // OTHER SERVICES
  // ═══════════════════════════════════════════════════════════════
  {
    category: "other_services",
    name: "Other Services",
    industries: [
      {
        code: "SECURITY",
        category: "other_services",
        name: "Security Services",
        sicCodes: ["80100", "80200", "80300"],
        keywords: ["security", "guarding", "door supervision", "CCTV"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_officer", "gross_margin", "contract_retention"],
          secondaryMetrics: ["absence_rate", "training_hours_per_officer"]
    }
      },
      {
        code: "CLEANING",
        category: "other_services",
        name: "Cleaning Services",
        sicCodes: ["81210", "81220", "81290"],
        keywords: ["cleaning", "janitorial", "commercial cleaning", "window cleaning"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_operative", "contract_margin", "retention_rate"],
          secondaryMetrics: ["supervision_ratio", "equipment_cost_percent"]
        }
      },
      {
        code: "FUNERAL",
        category: "other_services",
        name: "Funeral Services",
        sicCodes: ["96030"],
        keywords: ["funeral", "undertaker", "cremation"],
        benchmarkProfile: {
          primaryMetrics: ["avg_funeral_value", "funerals_per_month", "market_share"],
          secondaryMetrics: ["pre_need_percent", "ancillary_revenue"]
        }
      },
      {
        code: "PERSONAL",
        category: "other_services",
        name: "Personal Services (Hair, Beauty, etc.)",
        sicCodes: ["96020", "96040"],
        keywords: ["salon", "hairdresser", "beauty", "barber", "nails"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_stylist", "avg_ticket", "rebooking_rate"],
          secondaryMetrics: ["retail_percent", "no_show_rate", "client_retention"]
        }
      },
      {
        code: "PET",
        category: "other_services",
        name: "Pet Services",
        sicCodes: ["96090"],
        keywords: ["dog grooming", "pet sitting", "kennels", "cattery", "dog walking"],
        benchmarkProfile: {
          primaryMetrics: ["revenue_per_employee", "capacity_utilisation", "repeat_rate"],
          secondaryMetrics: ["avg_booking_value", "seasonal_variance"]
        }
      },
      {
        code: "CHILDCARE",
        category: "other_services",
        name: "Childcare / Nursery",
        sicCodes: ["88910"],
        keywords: ["nursery", "childcare", "preschool", "daycare"],
        benchmarkProfile: {
          primaryMetrics: ["occupancy_rate", "revenue_per_place", "staff_ratio"],
          secondaryMetrics: ["ofsted_rating", "funded_hours_percent", "staff_turnover"]
        }
      }
    ]
  }
];

// Helper functions to work with the taxonomy
export function getIndustryByCode(code: string): Industry | undefined {
  for (const category of INDUSTRY_TAXONOMY) {
    const industry = category.industries.find(ind => ind.code === code);
    if (industry) return industry;
  }
  return undefined;
}

export function getAllIndustries(): Industry[] {
  return INDUSTRY_TAXONOMY.flatMap(category => category.industries);
}

export function getIndustriesByCategory(category: string): Industry[] {
  const cat = INDUSTRY_TAXONOMY.find(c => c.category === category);
  return cat ? cat.industries : [];
}

export function searchIndustriesByKeyword(keyword: string): Industry[] {
  const lowerKeyword = keyword.toLowerCase();
  return getAllIndustries().filter(industry =>
    industry.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
    industry.name.toLowerCase().includes(lowerKeyword)
  );
}

