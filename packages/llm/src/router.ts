// LLM Model Router
// Routes requests to appropriate models based on task type

import OpenAI from 'openai';
import type { 
  LLMTaskType, 
  ModelTier, 
  ModelConfig, 
  LLMResult, 
  LLMContext,
  ChatMessage,
  ChatContext 
} from './types';
import { buildChatSystemPrompt } from './prompts';

// Model configurations
const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  fast: {
    model: 'anthropic/claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.3,
    fallback: 'openai/gpt-4o-mini',
    costPerMillion: { input: 0.25, output: 1.25 },
  },
  balanced: {
    model: 'anthropic/claude-sonnet-4-20250514',
    maxTokens: 4000,
    temperature: 0.7,
    fallback: 'openai/gpt-4-turbo',
    costPerMillion: { input: 3, output: 15 },
  },
  premium: {
    model: 'anthropic/claude-opus-4-5-20250514',
    maxTokens: 8000,
    temperature: 0.7,
    costPerMillion: { input: 15, output: 75 },
  },
};

// Task to tier mapping
const TASK_TO_TIER: Record<LLMTaskType, ModelTier> = {
  fit_assessment: 'fast',
  roadmap_generation: 'balanced',
  value_analysis: 'balanced',
  chat_completion: 'fast', // May upgrade based on complexity
  meeting_agenda: 'fast',
  task_breakdown: 'balanced',
  document_summary: 'fast',
  quarterly_review: 'premium',
  pdf_generation: 'premium',
};

// OpenRouter client factory
function createOpenRouterClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}

// Calculate cost from usage
function calculateCost(
  usage: { prompt_tokens: number; completion_tokens: number } | undefined,
  costPerMillion: { input: number; output: number }
): number {
  if (!usage) return 0;
  const inputCost = (usage.prompt_tokens / 1_000_000) * costPerMillion.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * costPerMillion.output;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimals
}

// Main generation function with routing
export async function generateWithRouting(
  taskType: LLMTaskType,
  prompt: string,
  context?: LLMContext,
  options?: {
    apiKey?: string;
    logUsage?: (log: LLMUsageLog) => Promise<void>;
  }
): Promise<LLMResult> {
  const apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const client = createOpenRouterClient(apiKey);
  const tier = TASK_TO_TIER[taskType];
  const config = MODEL_CONFIGS[tier];
  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: 'user', content: prompt }],
      // Request structured JSON for non-text outputs
      ...(taskType !== 'pdf_generation' && {
        response_format: { type: 'json_object' },
      }),
    });

    const duration = Date.now() - startTime;
    const usage = response.usage;
    const cost = calculateCost(usage, config.costPerMillion);

    // Log usage if callback provided
    if (options?.logUsage && context) {
      await options.logUsage({
        practiceId: context.practiceId,
        clientId: context.clientId,
        taskType,
        model: config.model,
        tokensInput: usage?.prompt_tokens || 0,
        tokensOutput: usage?.completion_tokens || 0,
        costCents: Math.round(cost * 100),
        durationMs: duration,
        success: true,
      });
    }

    return {
      success: true,
      content: response.choices[0].message.content,
      model: config.model,
      usage: usage
        ? {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
          }
        : undefined,
      cost,
      duration,
    };
  } catch (error) {
    // Try fallback model if available
    if (config.fallback) {
      console.log(`Primary model failed, trying fallback: ${config.fallback}`);
      return generateWithFallback(client, config.fallback, prompt, context, taskType, options);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed attempt
    if (options?.logUsage && context) {
      await options.logUsage({
        practiceId: context.practiceId,
        clientId: context.clientId,
        taskType,
        model: config.model,
        tokensInput: 0,
        tokensOutput: 0,
        costCents: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorMessage,
      });
    }

    return {
      success: false,
      content: null,
      model: config.model,
      cost: 0,
      duration: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

// Fallback generation
async function generateWithFallback(
  client: OpenAI,
  fallbackModel: string,
  prompt: string,
  context: LLMContext | undefined,
  taskType: LLMTaskType,
  options?: {
    logUsage?: (log: LLMUsageLog) => Promise<void>;
  }
): Promise<LLMResult> {
  const startTime = Date.now();
  
  try {
    const response = await client.chat.completions.create({
      model: fallbackModel,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = Date.now() - startTime;
    const usage = response.usage;
    // Estimate cost for fallback (use balanced tier pricing as approximation)
    const cost = calculateCost(usage, MODEL_CONFIGS.balanced.costPerMillion);

    if (options?.logUsage && context) {
      await options.logUsage({
        practiceId: context.practiceId,
        clientId: context.clientId,
        taskType,
        model: fallbackModel,
        tokensInput: usage?.prompt_tokens || 0,
        tokensOutput: usage?.completion_tokens || 0,
        costCents: Math.round(cost * 100),
        durationMs: duration,
        success: true,
      });
    }

    return {
      success: true,
      content: response.choices[0].message.content,
      model: fallbackModel,
      usage: usage
        ? {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
          }
        : undefined,
      cost,
      duration,
    };
  } catch (error) {
    return {
      success: false,
      content: null,
      model: fallbackModel,
      cost: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Fallback failed',
    };
  }
}

// Chat-specific routing with complexity detection
export async function routeChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  clientContext: ChatContext,
  options?: {
    apiKey?: string;
    logUsage?: (log: LLMUsageLog) => Promise<void>;
    practiceId?: string;
    clientId?: string;
  }
): Promise<LLMResult> {
  // Detect complexity to decide model tier
  const complexity = detectMessageComplexity(message, conversationHistory);
  const taskType: LLMTaskType = complexity === 'complex' ? 'quarterly_review' : 'chat_completion';

  // Build full prompt with context
  const systemPrompt = buildChatSystemPrompt(clientContext);
  const fullPrompt = buildConversationalPrompt(systemPrompt, conversationHistory, message);

  return generateWithRouting(
    taskType,
    fullPrompt,
    options?.practiceId && options?.clientId
      ? { practiceId: options.practiceId, clientId: options.clientId }
      : undefined,
    options
  );
}

// Complexity detection for chat
function detectMessageComplexity(
  message: string,
  history: ChatMessage[]
): 'simple' | 'complex' {
  const complexIndicators = [
    message.length > 500,
    message.toLowerCase().includes('explain'),
    message.toLowerCase().includes('why'),
    message.toLowerCase().includes('compare'),
    message.toLowerCase().includes('strategy'),
    message.toLowerCase().includes('financial'),
    history.length > 10,
    /\d{4,}/.test(message), // Contains large numbers
  ];

  const complexCount = complexIndicators.filter(Boolean).length;
  return complexCount >= 2 ? 'complex' : 'simple';
}

// Build conversational prompt from history
function buildConversationalPrompt(
  systemPrompt: string,
  history: ChatMessage[],
  currentMessage: string
): string {
  let prompt = `SYSTEM:\n${systemPrompt}\n\n`;
  
  prompt += 'CONVERSATION HISTORY:\n';
  for (const msg of history.slice(-10)) { // Last 10 messages
    prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
  }
  
  prompt += `\nUSER: ${currentMessage}\n\n`;
  prompt += 'Please respond as the assistant. Be helpful, concise, and reference the client\'s specific situation when relevant.';
  
  return prompt;
}

// Usage log interface
export interface LLMUsageLog {
  practiceId: string;
  clientId: string;
  taskType: LLMTaskType;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costCents: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}

// Export model configs for reference
export { MODEL_CONFIGS, TASK_TO_TIER };

