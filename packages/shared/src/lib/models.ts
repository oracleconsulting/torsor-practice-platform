// ============================================================================
// LLM MODEL CONFIGURATION
// ============================================================================
// Centralized model selection for all AI-powered features
// Updated: December 2025 to use Claude 4.5 family
// ============================================================================

/**
 * Available model tiers with their use cases:
 * - premium: Client-facing reports, critical analysis (highest quality)
 * - standard: Structured analysis, chat, most tasks (balanced quality/cost)
 * - fast: Classification, routing, simple tasks (speed optimized)
 * - research: Web-based research with citations
 * - embeddings: Vector embeddings for semantic search
 */
export type ModelTier = 'premium' | 'standard' | 'fast' | 'research' | 'embeddings';

/**
 * Task types that determine model selection
 */
export type AnalysisTaskType = 
  | 'discovery_report'      // Premium: Full discovery analysis report
  | 'pattern_detection'     // Standard: Pre-analysis pattern detection
  | 'fit_assessment'        // Standard: Client fit evaluation
  | 'value_proposition'     // Premium: Value proposition generation
  | 'chat'                  // Standard: Chat completions
  | 'chat_simple'           // Fast: Simple chat responses
  | 'classification'        // Fast: Routing and classification
  | 'routing'               // Fast: Request routing
  | 'research'              // Research: Web search with citations
  | 'roadmap_generation'    // Premium: Roadmap generation
  | 'document_processing'   // Standard: Document parsing
  | 'embeddings';           // Embeddings: Vector generation

/**
 * Model metadata including context window and pricing
 */
export interface ModelMetadata {
  id: string;
  name: string;
  contextWindow: number;
  inputPricePer1M: number;  // USD per 1M tokens
  outputPricePer1M: number; // USD per 1M tokens
  tier: ModelTier;
  capabilities: string[];
}

/**
 * Central model configuration
 * All models are accessed via OpenRouter API
 */
export const MODEL_CONFIG = {
  /**
   * Premium tier - Use for client-facing reports and critical analysis
   * Claude Opus 4.5: Highest quality reasoning, empathy, nuance detection
   */
  premium: 'anthropic/claude-opus-4' as const,
  
  /**
   * Standard tier - Use for structured analysis, chat, and most tasks
   * Claude Sonnet 4: Excellent for structured analysis, 200K context
   */
  standard: 'anthropic/claude-sonnet-4-20250514' as const,
  
  /**
   * Fast tier - Use for classification, routing, and simple tasks
   * Claude Haiku 3.5: Matches Sonnet 3.5 quality at lower cost, good for quick tasks
   */
  fast: 'anthropic/claude-3.5-haiku-20241022' as const,
  
  /**
   * Research tier - Use for web-based research with citations
   * Perplexity Sonar Pro: Real-time web search with source citations
   */
  research: 'perplexity/sonar-pro' as const,
  
  /**
   * Embeddings - Use for vector embeddings (semantic search)
   * OpenAI text-embedding-3-small: Cost-effective, good quality
   */
  embeddings: 'openai/text-embedding-3-small' as const,
} as const;

/**
 * Model metadata for cost tracking and capability checking
 */
export const MODEL_METADATA: Record<string, ModelMetadata> = {
  'anthropic/claude-opus-4': {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    contextWindow: 200000,
    inputPricePer1M: 15.00,
    outputPricePer1M: 75.00,
    tier: 'premium',
    capabilities: ['reasoning', 'analysis', 'empathy', 'creative', 'code', 'vision']
  },
  'anthropic/claude-sonnet-4-20250514': {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    tier: 'standard',
    capabilities: ['reasoning', 'analysis', 'code', 'structured-output']
  },
  'anthropic/claude-3.5-haiku-20241022': {
    id: 'anthropic/claude-3.5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    inputPricePer1M: 0.80,
    outputPricePer1M: 4.00,
    tier: 'fast',
    capabilities: ['classification', 'routing', 'simple-analysis']
  },
  'perplexity/sonar-pro': {
    id: 'perplexity/sonar-pro',
    name: 'Perplexity Sonar Pro',
    contextWindow: 200000,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    tier: 'research',
    capabilities: ['web-search', 'citations', 'real-time']
  },
  'openai/text-embedding-3-small': {
    id: 'openai/text-embedding-3-small',
    name: 'OpenAI Embedding 3 Small',
    contextWindow: 8191,
    inputPricePer1M: 0.02,
    outputPricePer1M: 0,
    tier: 'embeddings',
    capabilities: ['embeddings', 'semantic-search']
  },
  // Legacy models for reference/fallback
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Legacy)',
    contextWindow: 200000,
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    tier: 'standard',
    capabilities: ['reasoning', 'analysis', 'code']
  },
  'anthropic/claude-3-haiku-20240307': {
    id: 'anthropic/claude-3-haiku-20240307',
    name: 'Claude 3 Haiku (Legacy)',
    contextWindow: 200000,
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    tier: 'fast',
    capabilities: ['classification', 'simple-tasks']
  }
};

/**
 * Select the appropriate model for a given task type
 * @param taskType The type of analysis task
 * @returns The model identifier string for OpenRouter
 */
export function selectModel(taskType: AnalysisTaskType): string {
  switch (taskType) {
    // Premium tier tasks - highest quality required
    case 'discovery_report':
    case 'value_proposition':
    case 'roadmap_generation':
      return MODEL_CONFIG.premium;
    
    // Standard tier tasks - balanced quality/cost
    case 'pattern_detection':
    case 'fit_assessment':
    case 'chat':
    case 'document_processing':
      return MODEL_CONFIG.standard;
    
    // Fast tier tasks - speed/cost optimized
    case 'classification':
    case 'routing':
    case 'chat_simple':
      return MODEL_CONFIG.fast;
    
    // Research tier - web search
    case 'research':
      return MODEL_CONFIG.research;
    
    // Embeddings
    case 'embeddings':
      return MODEL_CONFIG.embeddings;
    
    // Default to standard for unknown tasks
    default:
      return MODEL_CONFIG.standard;
  }
}

/**
 * Get the tier for a given model ID
 */
export function getModelTier(modelId: string): ModelTier | null {
  return MODEL_METADATA[modelId]?.tier ?? null;
}

/**
 * Get metadata for a given model ID
 */
export function getModelMetadata(modelId: string): ModelMetadata | null {
  return MODEL_METADATA[modelId] ?? null;
}

/**
 * Calculate the cost for a given usage
 */
export function calculateModelCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const metadata = MODEL_METADATA[modelId];
  if (!metadata) {
    console.warn(`Unknown model for cost calculation: ${modelId}`);
    return 0;
  }
  
  const inputCost = (inputTokens / 1_000_000) * metadata.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * metadata.outputPricePer1M;
  
  return inputCost + outputCost;
}

/**
 * OpenRouter API headers configuration
 */
export function getOpenRouterHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://torsor.co.uk',
    'X-Title': 'Torsor Discovery Analysis'
  };
}
