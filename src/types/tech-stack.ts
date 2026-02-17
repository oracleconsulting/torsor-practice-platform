export interface TechProduct {
  id: string;
  product_name: string;
  vendor: string;
  product_slug: string;
  website_url: string | null;
  primary_category: string;
  additional_categories: string[];
  can_replace: string[];
  market_position: 'market_leader' | 'established' | 'challenger' | 'specialist' | 'emerging';
  sweet_spot_min_employees: number;
  sweet_spot_max_employees: number;
  sweet_spot_revenue_min_gbp?: number;
  sweet_spot_revenue_max_gbp?: number;
  target_industries?: string[];
  uk_market_strong: boolean;
  pricing_model: 'per_user' | 'flat' | 'tiered' | 'usage_based' | 'freemium' | 'free' | 'quote_only';
  has_free_tier: boolean;
  free_tier_limits: string | null;
  price_entry_gbp: number | null;
  price_mid_gbp: number | null;
  price_top_gbp: number | null;
  price_per_user: boolean;
  pricing_notes: string | null;
  pricing_url?: string | null;
  score_ease_of_use: number;
  score_feature_depth: number;
  score_integration_ecosystem: number;
  score_reporting: number;
  score_scalability: number;
  score_support: number;
  score_value_for_money: number;
  key_strengths: string[];
  key_weaknesses: string[];
  best_for: string[];
  not_ideal_for: string[];
  migration_complexity_from?: 'low' | 'medium' | 'high' | 'very_high';
  migration_notes?: string | null;
  typical_setup_hours: number | null;
  has_zapier: boolean;
  zapier_trigger_count?: number;
  zapier_action_count?: number;
  has_make: boolean;
  make_module_count?: number;
  has_native_api: boolean;
  has_webhooks: boolean;
  api_quality: 'excellent' | 'good' | 'basic' | 'limited' | 'none' | 'unknown';
  data_source: 'manual' | 'auto_discovered' | 'web_research' | 'vendor_verified';
  last_reviewed: string;
  review_confidence: 'high' | 'medium' | 'low';
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechIntegration {
  id: string;
  product_a_slug: string;
  product_b_slug: string;
  integration_type: 'native' | 'native_deep' | 'zapier' | 'make' | 'api_custom' | 'csv_import' | 'webhook' | 'none';
  integration_quality: 'deep' | 'good' | 'basic' | 'limited' | 'one_way' | 'unreliable';
  bidirectional: boolean;
  data_flows: string[];
  setup_complexity: 'plug_and_play' | 'guided_setup' | 'configuration_needed' | 'developer_needed';
  setup_time_hours?: number | null;
  monthly_cost_gbp: number;
  known_limitations: string[];
  known_issues: string[];
  last_verified: string;
  verification_source?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MiddlewareCapability {
  id: string;
  product_slug: string;
  platform: 'zapier' | 'make' | 'n8n' | 'native_api' | 'webhooks';
  triggers: string[];
  actions: string[];
  searches?: string[];
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
  rate_limits?: string | null;
  notes?: string | null;
  last_verified: string;
  created_at: string;
}

export interface AutoDiscoveryLog {
  id: string;
  product_name_raw: string;
  matched_product_slug: string | null;
  engagement_id: string | null;
  discovered_in: string | null;
  category_code: string | null;
  status: 'pending' | 'researching' | 'added' | 'matched_existing' | 'skipped';
  research_data: unknown;
  added_product_id: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface DiscoverProductRequest {
  product_name_raw: string;
  category_code?: string;
  engagement_id?: string;
  mode: 'match_only' | 'full_research';
}

export interface DiscoverProductResponse {
  status: 'matched' | 'discovered' | 'not_found' | 'error';
  product_slug?: string;
  product_name?: string;
  confidence: 'high' | 'medium' | 'low';
  is_new: boolean;
  message?: string;
}
