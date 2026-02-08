/* COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md */
// ============================================================================
// LLM CACHING UTILITY
// ============================================================================
// Provides caching layer for LLM responses to reduce costs by 40-60%
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CacheConfig {
  ttlDays?: number;
  bypassCache?: boolean;
}

interface CachedResponse {
  response: any;
  cached: boolean;
  hitCount?: number;
}

// Create a hash of the prompt for cache key
async function hashPrompt(prompt: string, model: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${model}:${prompt}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check cache for existing response
export async function getCachedResponse(
  supabase: ReturnType<typeof createClient>,
  prompt: string,
  model: string
): Promise<CachedResponse | null> {
  try {
    const promptHash = await hashPrompt(prompt, model);
    
    const { data, error } = await supabase
      .from('llm_response_cache')
      .select('response, hit_count')
      .eq('prompt_hash', promptHash)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return null;
    
    // Update hit count
    await supabase
      .from('llm_response_cache')
      .update({ 
        hit_count: (data.hit_count || 0) + 1,
        last_hit_at: new Date().toISOString()
      })
      .eq('prompt_hash', promptHash);
    
    return {
      response: data.response,
      cached: true,
      hitCount: data.hit_count + 1
    };
  } catch (e) {
    console.log('Cache lookup failed:', e);
    return null;
  }
}

// Store response in cache
export async function cacheResponse(
  supabase: ReturnType<typeof createClient>,
  prompt: string,
  model: string,
  response: any,
  tokensUsed?: number,
  config: CacheConfig = {}
): Promise<void> {
  try {
    const promptHash = await hashPrompt(prompt, model);
    const ttlDays = config.ttlDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    
    await supabase
      .from('llm_response_cache')
      .upsert({
        prompt_hash: promptHash,
        model,
        response,
        tokens_used: tokensUsed,
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      }, {
        onConflict: 'prompt_hash'
      });
  } catch (e) {
    console.log('Cache store failed:', e);
  }
}

// Wrapper for LLM calls with caching
export async function cachedLLMCall(
  supabase: ReturnType<typeof createClient>,
  prompt: string,
  model: string,
  llmFunction: () => Promise<{ response: any; tokensUsed?: number }>,
  config: CacheConfig = {}
): Promise<CachedResponse> {
  // Check cache first (unless bypass)
  if (!config.bypassCache) {
    const cached = await getCachedResponse(supabase, prompt, model);
    if (cached) {
      console.log(`Cache HIT for model ${model} (hits: ${cached.hitCount})`);
      return cached;
    }
  }
  
  // Call LLM
  console.log(`Cache MISS for model ${model} - calling API`);
  const result = await llmFunction();
  
  // Store in cache
  await cacheResponse(supabase, prompt, model, result.response, result.tokensUsed, config);
  
  return {
    response: result.response,
    cached: false
  };
}

// Get cache statistics
export async function getCacheStats(
  supabase: ReturnType<typeof createClient>
): Promise<{ totalEntries: number; totalHits: number; estimatedSavings: number }> {
  try {
    const { data } = await supabase
      .from('llm_response_cache')
      .select('hit_count, tokens_used')
      .gt('expires_at', new Date().toISOString());
    
    if (!data) return { totalEntries: 0, totalHits: 0, estimatedSavings: 0 };
    
    const totalEntries = data.length;
    const totalHits = data.reduce((sum, r) => sum + (r.hit_count || 0), 0);
    const tokensSaved = data.reduce((sum, r) => sum + ((r.hit_count || 0) * (r.tokens_used || 0)), 0);
    const estimatedSavings = (tokensSaved / 1000) * 0.003; // $0.003 per 1k tokens
    
    return { totalEntries, totalHits, estimatedSavings };
  } catch (e) {
    return { totalEntries: 0, totalHits: 0, estimatedSavings: 0 };
  }
}

