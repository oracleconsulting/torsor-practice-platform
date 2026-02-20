-- ============================================================================
-- SA TECH PRODUCT INTELLIGENCE: product DB, integrations, middleware, auto-discovery log
-- ============================================================================
-- Tables: sa_tech_products, sa_tech_integrations, sa_middleware_capabilities, sa_auto_discovery_log
-- ============================================================================

-- sa_tech_products: master product database
CREATE TABLE IF NOT EXISTS sa_tech_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  vendor TEXT NOT NULL DEFAULT '',
  product_slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  primary_category TEXT NOT NULL DEFAULT 'other',
  additional_categories TEXT[] DEFAULT '{}',
  can_replace TEXT[] DEFAULT '{}',
  market_position TEXT NOT NULL DEFAULT 'established' CHECK (market_position IN ('market_leader','established','challenger','specialist','emerging')),
  sweet_spot_min_employees INT DEFAULT 1,
  sweet_spot_max_employees INT DEFAULT 200,
  sweet_spot_revenue_min_gbp NUMERIC DEFAULT 0,
  sweet_spot_revenue_max_gbp NUMERIC DEFAULT 0,
  target_industries TEXT[] DEFAULT '{}',
  uk_market_strong BOOLEAN DEFAULT true,
  pricing_model TEXT NOT NULL DEFAULT 'quote_only' CHECK (pricing_model IN ('per_user','flat','tiered','usage_based','freemium','free','quote_only')),
  has_free_tier BOOLEAN DEFAULT false,
  free_tier_limits TEXT,
  price_entry_gbp NUMERIC,
  price_mid_gbp NUMERIC,
  price_top_gbp NUMERIC,
  price_per_user BOOLEAN DEFAULT true,
  pricing_notes TEXT,
  pricing_url TEXT,
  score_ease_of_use SMALLINT DEFAULT 3 CHECK (score_ease_of_use BETWEEN 1 AND 5),
  score_feature_depth SMALLINT DEFAULT 3 CHECK (score_feature_depth BETWEEN 1 AND 5),
  score_integration_ecosystem SMALLINT DEFAULT 3 CHECK (score_integration_ecosystem BETWEEN 1 AND 5),
  score_reporting SMALLINT DEFAULT 3 CHECK (score_reporting BETWEEN 1 AND 5),
  score_scalability SMALLINT DEFAULT 3 CHECK (score_scalability BETWEEN 1 AND 5),
  score_support SMALLINT DEFAULT 3 CHECK (score_support BETWEEN 1 AND 5),
  score_value_for_money SMALLINT DEFAULT 3 CHECK (score_value_for_money BETWEEN 1 AND 5),
  key_strengths TEXT[] DEFAULT '{}',
  key_weaknesses TEXT[] DEFAULT '{}',
  best_for TEXT[] DEFAULT '{}',
  not_ideal_for TEXT[] DEFAULT '{}',
  migration_complexity_from TEXT DEFAULT 'medium' CHECK (migration_complexity_from IN ('low','medium','high','very_high')),
  migration_notes TEXT,
  typical_setup_hours NUMERIC,
  has_zapier BOOLEAN DEFAULT false,
  zapier_trigger_count INT DEFAULT 0,
  zapier_action_count INT DEFAULT 0,
  has_make BOOLEAN DEFAULT false,
  make_module_count INT DEFAULT 0,
  has_native_api BOOLEAN DEFAULT false,
  has_webhooks BOOLEAN DEFAULT false,
  api_quality TEXT DEFAULT 'unknown' CHECK (api_quality IN ('excellent','good','basic','limited','none','unknown')),
  data_source TEXT NOT NULL DEFAULT 'manual' CHECK (data_source IN ('manual','auto_discovered','web_research','vendor_verified')),
  last_reviewed TIMESTAMPTZ DEFAULT NOW(),
  review_confidence TEXT DEFAULT 'medium' CHECK (review_confidence IN ('high','medium','low')),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_tech_products_slug ON sa_tech_products(product_slug);
CREATE INDEX IF NOT EXISTS idx_sa_tech_products_primary_category ON sa_tech_products(primary_category);
CREATE INDEX IF NOT EXISTS idx_sa_tech_products_is_active ON sa_tech_products(is_active);

-- sa_tech_integrations: pairwise integration records (canonical order: a < b to avoid duplicates)
CREATE TABLE IF NOT EXISTS sa_tech_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_slug TEXT NOT NULL,
  product_b_slug TEXT NOT NULL,
  integration_type TEXT NOT NULL DEFAULT 'none' CHECK (integration_type IN ('native','native_deep','zapier','make','api_custom','csv_import','webhook','none')),
  integration_quality TEXT NOT NULL DEFAULT 'basic' CHECK (integration_quality IN ('deep','good','basic','limited','one_way','unreliable')),
  bidirectional BOOLEAN DEFAULT false,
  data_flows TEXT[] DEFAULT '{}',
  setup_complexity TEXT DEFAULT 'configuration_needed' CHECK (setup_complexity IN ('plug_and_play','guided_setup','configuration_needed','developer_needed')),
  setup_time_hours NUMERIC,
  monthly_cost_gbp NUMERIC DEFAULT 0,
  known_limitations TEXT[] DEFAULT '{}',
  known_issues TEXT[] DEFAULT '{}',
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  verification_source TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_a_slug, product_b_slug)
);

CREATE INDEX IF NOT EXISTS idx_sa_tech_integrations_a ON sa_tech_integrations(product_a_slug);
CREATE INDEX IF NOT EXISTS idx_sa_tech_integrations_b ON sa_tech_integrations(product_b_slug);

-- sa_middleware_capabilities: Zapier/Make triggers and actions per product
CREATE TABLE IF NOT EXISTS sa_middleware_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('zapier','make','n8n','native_api','webhooks')),
  triggers TEXT[] DEFAULT '{}',
  actions TEXT[] DEFAULT '{}',
  searches TEXT[] DEFAULT '{}',
  reliability TEXT DEFAULT 'good' CHECK (reliability IN ('excellent','good','fair','poor')),
  rate_limits TEXT,
  notes TEXT,
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_slug, platform)
);

CREATE INDEX IF NOT EXISTS idx_sa_middleware_product ON sa_middleware_capabilities(product_slug);

-- sa_auto_discovery_log: log of unknown products found during audits
CREATE TABLE IF NOT EXISTS sa_auto_discovery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name_raw TEXT NOT NULL,
  matched_product_slug TEXT,
  engagement_id UUID,
  discovered_in TEXT,
  category_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','researching','added','matched_existing','skipped')),
  research_data JSONB,
  added_product_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sa_auto_discovery_status ON sa_auto_discovery_log(status);
CREATE INDEX IF NOT EXISTS idx_sa_auto_discovery_created ON sa_auto_discovery_log(created_at DESC);

-- RLS: service_role has full access; anon/authenticated read-only on products (for client-facing features later)
ALTER TABLE sa_tech_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_tech_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_middleware_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_auto_discovery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY sa_tech_products_service_role ON sa_tech_products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY sa_tech_products_anon_read ON sa_tech_products FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY sa_tech_integrations_service_role ON sa_tech_integrations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY sa_tech_integrations_anon_read ON sa_tech_integrations FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY sa_middleware_service_role ON sa_middleware_capabilities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY sa_middleware_anon_read ON sa_middleware_capabilities FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY sa_auto_discovery_service_role ON sa_auto_discovery_log FOR ALL TO service_role USING (true) WITH CHECK (true);
