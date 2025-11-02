/**
 * Perplexity AI Service for CPD Resource Discovery (via OpenRouter)
 * Automatically sources knowledge documents and courses
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'perplexity/sonar-deep-research'; // Perplexity Deep Research via OpenRouter - live web search!

export interface PerplexityResponse {
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

export interface KnowledgeDocumentDiscovery {
  title: string;
  summary: string;
  sourceUrl: string;
  keyTakeaways: string[];
  relevanceScore: number; // 0-100
  tags: string[];
  skillCategories: string[];
}

export interface CourseDiscovery {
  title: string;
  provider: string;
  url: string;
  description: string;
  durationHours: number;
  cost: number;
  currency: string;
  accreditation: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  relevanceScore: number; // 0-100
  skillCategories: string[];
}

/**
 * Make API call to Perplexity via OpenRouter
 */
async function callPerplexity(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY environment variable.');
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'TORSOR CPD Discovery'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.2, // Lower temp for more consistent results
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    console.log('[Perplexity via OpenRouter] API Usage:', data.usage);
    
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('[Perplexity via OpenRouter] API call failed:', error);
    throw error;
  }
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseAIJSON<T>(content: string): T {
  try {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    
    // Remove ```json ... ``` blocks
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Remove ``` ... ``` blocks
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Parse JSON
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[Perplexity] Failed to parse JSON:', content);
    throw new Error(`Failed to parse AI response as JSON: ${error}`);
  }
}

/**
 * Discover knowledge documents for a skill
 */
export async function discoverKnowledgeDocuments(
  skillName: string,
  skillCategory: string,
  count: number = 3
): Promise<KnowledgeDocumentDiscovery[]> {
  console.log(`[Perplexity] Discovering knowledge documents for: ${skillName} (${skillCategory})`);

  const systemPrompt = `You are a CPD research assistant for UK accountants. Your job is to find the latest, most relevant professional development content.

IMPORTANT: You must respond ONLY with valid JSON. No other text, no explanations, just the JSON array.`;

  const userPrompt = `Find ${count} high-quality, recent (2024-2025) resources for UK accountants to learn about "${skillName}" in the "${skillCategory}" category.

Focus on:
- UK accounting regulations (HMRC, FRS102, Companies House)
- Professional body guidance (ICAEW, ACCA, AAT, CIMA)
- Industry best practices
- Recent updates and changes
- Practical guides and case studies

For each resource, provide:
1. Title (clear, professional)
2. Summary (150-200 words, UK-focused)
3. Source URL (must be a real, accessible URL)
4. Key takeaways (3-5 bullet points)
5. Relevance score (0-100, how relevant to the skill)
6. Tags (5-7 keywords)
7. Skill categories (which accounting skill categories this covers)

Respond with a JSON array of objects with these exact keys:
{
  "title": string,
  "summary": string,
  "sourceUrl": string,
  "keyTakeaways": string[],
  "relevanceScore": number,
  "tags": string[],
  "skillCategories": string[]
}

ONLY return the JSON array, nothing else.`;

  try {
    const response = await callPerplexity(systemPrompt, userPrompt);
    const discoveries = parseAIJSON<KnowledgeDocumentDiscovery[]>(response);
    
    console.log(`[Perplexity] Discovered ${discoveries.length} knowledge documents`);
    
    // Validate and filter results
    return discoveries
      .filter(d => d.sourceUrl && d.title && d.summary)
      .filter(d => d.relevanceScore >= 60) // Only high-relevance content
      .slice(0, count);
  } catch (error) {
    console.error('[Perplexity] Knowledge document discovery failed:', error);
    return [];
  }
}

/**
 * Discover training courses for a skill gap
 */
export async function discoverTrainingCourses(
  skillName: string,
  skillCategory: string,
  currentLevel: number,
  targetLevel: number,
  count: number = 5
): Promise<CourseDiscovery[]> {
  console.log(`[Perplexity] Discovering courses for: ${skillName} (${currentLevel} → ${targetLevel})`);

  const levelMap: Record<number, string> = {
    0: 'complete beginner',
    1: 'beginner',
    2: 'intermediate',
    3: 'intermediate-advanced',
    4: 'advanced',
    5: 'expert'
  };

  const currentLevelName = levelMap[currentLevel] || 'beginner';
  const targetLevelName = levelMap[targetLevel] || 'advanced';

  const systemPrompt = `You are a CPD course discovery specialist for UK accountants. Your job is to find the best professional training courses.

IMPORTANT: You must respond ONLY with valid JSON. No other text, no explanations, just the JSON array.`;

  const userPrompt = `Find ${count} professional CPD courses for UK accountants to improve their "${skillName}" skills in the "${skillCategory}" category.

Current Skill Level: ${currentLevel}/5 (${currentLevelName})
Target Skill Level: ${targetLevel}/5 (${targetLevelName})

Requirements:
- UK-based providers or online courses suitable for UK accountants
- Accredited by professional bodies (ICAEW, ACCA, AAT, CIMA, CIPFA) OR reputable providers
- Duration: 2-10 hours (suitable for CPD)
- Cost: £50-£500 (affordable for small practices)
- Available in 2024-2025 (not expired or outdated)
- Appropriate for skill level ${currentLevel} → ${targetLevel}

For each course, provide:
1. Course title
2. Provider name
3. URL (must be real, bookable course)
4. Description (100-150 words)
5. Duration in hours (decimal, e.g., 6.5)
6. Cost in GBP (number only, e.g., 295)
7. Accreditation (e.g., "ICAEW Approved" or "CPD Certified")
8. Skill level (beginner/intermediate/advanced)
9. Relevance score (0-100)
10. Skill categories covered

Respond with a JSON array of objects with these exact keys:
{
  "title": string,
  "provider": string,
  "url": string,
  "description": string,
  "durationHours": number,
  "cost": number,
  "currency": "GBP",
  "accreditation": string,
  "skillLevel": "beginner" | "intermediate" | "advanced",
  "relevanceScore": number,
  "skillCategories": string[]
}

ONLY return the JSON array, nothing else.`;

  try {
    const response = await callPerplexity(systemPrompt, userPrompt);
    const discoveries = parseAIJSON<CourseDiscovery[]>(response);
    
    console.log(`[Perplexity] Discovered ${discoveries.length} courses`);
    
    // Validate and filter results
    return discoveries
      .filter(c => c.url && c.title && c.provider)
      .filter(c => c.durationHours >= 1 && c.durationHours <= 20)
      .filter(c => c.cost >= 0 && c.cost <= 1000)
      .filter(c => c.relevanceScore >= 70) // Only highly relevant courses
      .slice(0, count);
  } catch (error) {
    console.error('[Perplexity] Course discovery failed:', error);
    return [];
  }
}

/**
 * Quick search for any CPD topic (general purpose)
 */
export async function quickSearchCPD(
  searchQuery: string
): Promise<{ summary: string; sources: string[] }> {
  console.log(`[Perplexity] Quick search: ${searchQuery}`);

  const systemPrompt = 'You are a helpful assistant specializing in UK accounting and CPD.';

  const userPrompt = `Provide a concise summary (100-150 words) of: ${searchQuery}

Focus on practical, actionable information for UK accountants. Include recent updates if relevant.`;

  try {
    const response = await callPerplexity(systemPrompt, userPrompt);
    
    // Extract URLs from response
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const sources = response.match(urlRegex) || [];
    
    return {
      summary: response,
      sources: [...new Set(sources)] // Remove duplicates
    };
  } catch (error) {
    console.error('[Perplexity] Quick search failed:', error);
    return {
      summary: 'Search failed. Please try again.',
      sources: []
    };
  }
}

/**
 * Check if Perplexity is configured (via OpenRouter)
 */
export function isPerplexityConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY);
}

/**
 * Get Perplexity API status (via OpenRouter)
 */
export async function checkPerplexityStatus(): Promise<{
  configured: boolean;
  working: boolean;
  error?: string;
}> {
  if (!isPerplexityConfigured()) {
    return {
      configured: false,
      working: false,
      error: 'OpenRouter API key not configured (VITE_OPENROUTER_API_KEY)'
    };
  }

  try {
    // Test with simple query
    await quickSearchCPD('test');
    return {
      configured: true,
      working: true
    };
  } catch (error: any) {
    return {
      configured: true,
      working: false,
      error: error.message
    };
  }
}

