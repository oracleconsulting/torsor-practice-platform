/**
 * Perplexity AI Service for CPD Resource Discovery (via OpenRouter)
 * Automatically sources knowledge documents and courses
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'perplexity/sonar-pro'; // Perplexity Sonar Pro via OpenRouter - better at structured output than deep-research

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
  contentType: 'article' | 'webinar' | 'video' | 'podcast' | 'case_study';
  durationMinutes: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetSkillLevels: number[]; // e.g., [2,3] for moving from level 2 to 3
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
        max_tokens: 8000 // Increased to avoid truncation of JSON responses
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
 * Discover knowledge documents for a skill at a specific level
 */
export async function discoverKnowledgeDocuments(
  skillName: string,
  skillCategory: string,
  currentLevel: number = 1,
  targetLevel: number = 2,
  count: number = 3
): Promise<KnowledgeDocumentDiscovery[]> {
  const levelMap: Record<number, string> = {
    1: 'beginner',
    2: 'developing',
    3: 'competent',
    4: 'proficient',
    5: 'expert'
  };

  const skillLevelMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
    '1-2': 'beginner',
    '2-3': 'intermediate',
    '3-4': 'advanced',
    '4-5': 'expert'
  };

  const currentLevelName = levelMap[currentLevel] || 'beginner';
  const targetLevelName = levelMap[targetLevel] || 'developing';
  const skillLevel = skillLevelMap[`${currentLevel}-${targetLevel}`] || 'intermediate';

  // Define duration expectations per level
  const durationMap: Record<string, string> = {
    '1-2': '40-60 minutes', // Beginner - foundations
    '2-3': '40-60 minutes', // Intermediate - practical application
    '3-4': '90-120 minutes', // Advanced - complex scenarios (2 hours)
    '4-5': '60-180 minutes' // Expert - open-ended, thought leadership
  };

  const expectedDuration = durationMap[`${currentLevel}-${targetLevel}`] || '40-60 minutes';

  console.log(`[Perplexity] Discovering ${skillLevel} resources for: ${skillName} (Level ${currentLevel}→${targetLevel}, Duration: ${expectedDuration})`);

  const systemPrompt = `You are a CPD research assistant for UK accountants. Find resources at the EXACT skill level requested.

CRITICAL: Resources must match the skill level progression AND duration requirements. Respond ONLY with valid JSON.`;

  const userPrompt = `Find ${count} ${skillLevel.toUpperCase()}-level resources for UK accountants learning "${skillName}" (${skillCategory}).

**SKILL LEVEL CONTEXT:**
Current: ${currentLevelName} (Level ${currentLevel}/5)
Target: ${targetLevelName} (Level ${targetLevel}/5)
Difficulty: ${skillLevel.toUpperCase()}
**DURATION REQUIREMENT: ${expectedDuration}**

**Level Requirements:**
${currentLevel === 1 ? '- BEGINNER (1→2): Fundamentals, "What is X?", assumes NO prior knowledge, introductory concepts, basic definitions. DURATION: 40-60 min' : ''}
${currentLevel === 2 ? '- INTERMEDIATE (2→3): Practical application, "How to use X?", common scenarios, building on basics, real-world examples. DURATION: 40-60 min' : ''}
${currentLevel === 3 ? '- ADVANCED (3→4): Complex scenarios, edge cases, optimization, "Mastering X", assumes strong foundation. DURATION: 90-120 min (2 hours)' : ''}
${currentLevel === 4 ? '- EXPERT (4→5): Cutting-edge, research, thought leadership, "Future of X", mastery-level, innovation. DURATION: 60-180 min (flexible)' : ''}

**Content Focus:**
- UK accounting (HMRC, FRS102, Companies House, UK GAAP)
- Professional bodies (ICAEW, ACCA, AAT, CIMA)
- Recent 2024-2025 content
- **Must match duration requirement: ${expectedDuration}**

**Content Types:**
1. Articles - For levels 1-2 and 2-3: 40-60 min; For 3-4: 90-120 min
2. Webinars - Adjust duration based on level
3. Videos - Shorter for basics, longer for advanced
4. Podcasts - Match duration to skill level
5. Case studies - Deep dives for advanced levels

Return JSON array with these EXACT keys:
{
  "title": string,
  "summary": string (150-200 words, level-appropriate),
  "contentType": "article" | "webinar" | "video" | "podcast" | "case_study",
  "durationMinutes": number,
  "skillLevel": "${skillLevel}",
  "targetSkillLevels": [${currentLevel}, ${targetLevel}],
  "sourceUrl": string (real, accessible URL),
  "keyTakeaways": string[] (3-5 points),
  "relevanceScore": number (0-100),
  "tags": string[] (5-7 keywords),
  "skillCategories": string[]
}

ONLY return the JSON array. No markdown, no explanations.`;

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

  // If API key is configured, assume it's working
  // We'll let the actual discovery handle any API errors
  return {
    configured: true,
    working: true
  };
}

