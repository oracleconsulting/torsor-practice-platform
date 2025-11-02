/**
 * OpenRouter API Integration Service
 * Provides unified access to multiple LLM providers through OpenRouter
 * Now reads API keys from database (ai_api_keys table) per practice
 */

import { supabase } from '@/lib/supabase/client';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FALLBACK_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY; // Fallback for testing

/**
 * Get OpenRouter API key for a practice from database
 */
async function getOpenRouterApiKey(practiceId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select('api_key')
      .eq('practice_id', practiceId)
      .eq('provider', 'openrouter')
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      console.warn('[OpenRouter] No API key found in database for practice, using fallback');
      return FALLBACK_API_KEY || null;
    }
    
    return data.api_key;
  } catch (error) {
    console.error('[OpenRouter] Error fetching API key:', error);
    return FALLBACK_API_KEY || null;
  }
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface LLMExecutionResult {
  success: boolean;
  output: string;
  tokens_used: number;
  cost_usd: number;
  model: string;
  error?: string;
}

/**
 * Model pricing per 1M tokens (input/output)
 * Prices are approximate and should be updated regularly
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'openai/gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
  'openai/gpt-4': { input: 30.00, output: 60.00 },
  'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'google/gemini-pro': { input: 0.50, output: 1.50 },
  'meta-llama/llama-3-70b-instruct': { input: 0.59, output: 0.79 }
};

/**
 * Calculate cost based on token usage
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0, output: 0 };
  
  const promptCost = (promptTokens / 1000000) * pricing.input;
  const completionCost = (completionTokens / 1000000) * pricing.output;
  
  return promptCost + completionCost;
}

/**
 * Replace template variables in prompt with actual values
 */
function interpolatePrompt(template: string, variables: Record<string, any>): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(placeholder, String(value));
  });
  
  return result;
}

/**
 * Execute LLM request through OpenRouter
 * Now accepts practiceId to fetch API key from database
 */
export async function executeLLMStep(config: {
  model: string;
  prompt: string;
  variables?: Record<string, any>;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
  practiceId?: string; // Optional: if provided, fetches API key from database
}): Promise<LLMExecutionResult> {
  try {
    // Get API key from database if practiceId provided, otherwise use fallback
    let apiKey: string | null;
    
    if (config.practiceId) {
      apiKey = await getOpenRouterApiKey(config.practiceId);
    } else {
      console.warn('[OpenRouter] No practiceId provided, using fallback API key');
      apiKey = FALLBACK_API_KEY || null;
    }
    
    if (!apiKey) {
      return {
        success: false,
        output: '',
        tokens_used: 0,
        cost_usd: 0,
        model: config.model,
        error: 'OpenRouter API key not configured (check ai_api_keys table or environment variable)'
      };
    }

    // Interpolate variables into prompt
    const interpolatedPrompt = config.variables 
      ? interpolatePrompt(config.prompt, config.variables)
      : config.prompt;

    // Build messages array
    const messages: OpenRouterMessage[] = [];
    
    if (config.systemPrompt) {
      messages.push({
        role: 'system',
        content: config.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: interpolatedPrompt
    });

    // Make request to OpenRouter
    const request: OpenRouterRequest = {
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 2000
    };

    console.log('[OpenRouter] Making request:', {
      model: request.model,
      promptLength: interpolatedPrompt.length,
      temperature: request.temperature
    });

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'TORSOR Practice Platform'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter] API error:', errorText);
      return {
        success: false,
        output: '',
        tokens_used: 0,
        cost_usd: 0,
        model: config.model,
        error: `OpenRouter API error: ${response.status} - ${errorText}`
      };
    }

    const data: OpenRouterResponse = await response.json();

    console.log('[OpenRouter] Response received:', {
      model: data.model,
      tokens: data.usage.total_tokens,
      finishReason: data.choices[0]?.finish_reason
    });

    // Calculate cost
    const cost = calculateCost(
      config.model,
      data.usage.prompt_tokens,
      data.usage.completion_tokens
    );

    return {
      success: true,
      output: data.choices[0]?.message?.content || '',
      tokens_used: data.usage.total_tokens,
      cost_usd: cost,
      model: data.model
    };

  } catch (error: any) {
    console.error('[OpenRouter] Execution error:', error);
    return {
      success: false,
      output: '',
      tokens_used: 0,
      cost_usd: 0,
      model: config.model,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Stream LLM response (for future use with real-time streaming)
 */
export async function* streamLLMStep(config: {
  model: string;
  prompt: string;
  variables?: Record<string, any>;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
  practiceId?: string;
}): AsyncGenerator<string, void, unknown> {
  // TODO: Implement streaming when needed
  // For now, yield the complete response
  const result = await executeLLMStep(config);
  if (result.success) {
    yield result.output;
  }
}

/**
 * Available models with metadata
 */
export const AVAILABLE_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    strengths: ['Analysis', 'Reasoning', 'Code'],
    recommended: true
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    contextWindow: 200000,
    strengths: ['Complex reasoning', 'Creative writing'],
    recommended: false
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    contextWindow: 200000,
    strengths: ['Speed', 'Cost-effective'],
    recommended: false
  },
  {
    id: 'openai/gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    contextWindow: 128000,
    strengths: ['General purpose', 'Structured output'],
    recommended: true
  },
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    contextWindow: 8192,
    strengths: ['Reliability', 'Well-tested'],
    recommended: false
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    contextWindow: 16385,
    strengths: ['Speed', 'Cost-effective'],
    recommended: false
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    contextWindow: 32768,
    strengths: ['Multimodal', 'Fast'],
    recommended: false
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    provider: 'Meta',
    contextWindow: 8192,
    strengths: ['Open source', 'Good value'],
    recommended: false
  }
];

/**
 * Test OpenRouter connection
 */
export async function testOpenRouterConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await executeLLMStep({
      model: 'anthropic/claude-3-haiku',
      prompt: 'Say "Hello, TORSOR!"',
      temperature: 0.5,
      max_tokens: 50
    });

    return {
      success: result.success,
      error: result.error
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

