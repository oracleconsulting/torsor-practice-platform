/**
 * LLM Service for Profile Generation
 * Handles all AI/LLM calls through OpenRouter
 */

import { supabase } from '@/lib/supabase/client';

interface GenerateProfileParams {
  practiceMemberId: string;
  practiceId: string;
  workingPreferences: any;
  belbinRoles: any;
  motivationalDrivers: any;
  eqLevels: any;
  conflictStyle: any;
  generatedBy: string;
}

interface PromptTemplate {
  id: string;
  system_prompt: string;
  user_prompt_template: string;
  model_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
}

interface GeneratedProfile {
  narrative: string;
  professional_fingerprint: any;
  optimal_environment: string;
  unique_value_proposition: string;
  synergies: string[];
  creative_tensions: string[];
  growth_recommendations: string[];
}

/**
 * Fetches the prompt configuration from the database
 */
async function getPromptConfig(promptKey: string, practiceId: string): Promise<PromptTemplate | null> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('prompt_key', promptKey)
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[LLM] Error fetching prompt config:', error);
    return null;
  }

  return data;
}

/**
 * Gets the OpenRouter API key
 */
async function getOpenRouterKey(practiceId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_api_keys')
    .select('encrypted_key')
    .eq('practice_id', practiceId)
    .eq('provider', 'openrouter')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[LLM] Error fetching API key:', error);
    return null;
  }

  // In production, this should decrypt the key
  // For now, we'll assume it's stored in plaintext (not recommended for production)
  return data.encrypted_key;
}

/**
 * Fills in template placeholders with actual values
 */
function fillTemplate(template: string, values: Record<string, any>): string {
  let filled = template;
  
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{{${key}}}`;
    const replacement = typeof value === 'object' ? JSON.stringify(value) : String(value);
    filled = filled.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return filled;
}

/**
 * Calls the OpenRouter API
 */
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; tokensUsed: number; timeMs: number }> {
  const startTime = Date.now();
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor Practice Platform'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature,
      max_tokens: maxTokens
    })
  });

  const endTime = Date.now();
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || 0,
    timeMs: endTime - startTime
  };
}

/**
 * Parses the LLM response into structured data
 */
function parseProfileResponse(content: string): GeneratedProfile {
  // Extract sections using markdown headers
  const sections = {
    narrative: '',
    optimal_environment: '',
    unique_value_proposition: '',
    synergies: [] as string[],
    creative_tensions: [] as string[],
    growth_recommendations: [] as string[]
  };

  // Extract the main narrative (everything before the first ##)
  const narrativeMatch = content.match(/# Your Professional Fingerprint\n\n([\s\S]*?)(?=\n##|$)/);
  if (narrativeMatch) {
    sections.narrative = narrativeMatch[1].trim();
  }

  // Extract "You Thrive When..." section
  const thriveMatch = content.match(/## You Thrive When...\n\n([\s\S]*?)(?=\n##|$)/);
  if (thriveMatch) {
    sections.optimal_environment = thriveMatch[1].trim();
  }

  // Extract "Others Value You For..." section
  const valueMatch = content.match(/## Others Value You For...\n\n([\s\S]*?)(?=\n##|$)/);
  if (valueMatch) {
    sections.unique_value_proposition = valueMatch[1].trim();
  }

  // Extract "Your Superpowers in Action" section
  const superpowersMatch = content.match(/## Your Superpowers in Action\n\n([\s\S]*?)(?=\n##|$)/);
  if (superpowersMatch) {
    const items = superpowersMatch[1].split('\n').filter(line => line.trim().match(/^[-•\d.]/));
    sections.synergies = items.map(item => item.replace(/^[-•\d.]\s*/, '').trim());
  }

  // Extract "Creative Tensions to Navigate" section
  const tensionsMatch = content.match(/## Creative Tensions to Navigate\n\n([\s\S]*?)(?=\n##|$)/);
  if (tensionsMatch) {
    const items = tensionsMatch[1].split('\n').filter(line => line.trim().match(/^[-•\d.]/));
    sections.creative_tensions = items.map(item => item.replace(/^[-•\d.]\s*/, '').trim());
  }

  // Extract "Growth Opportunities" section
  const growthMatch = content.match(/## Growth Opportunities\n\n([\s\S]*?)(?=\n##|$)/);
  if (growthMatch) {
    const items = growthMatch[1].split('\n').filter(line => line.trim().match(/^[-•\d.]/));
    sections.growth_recommendations = items.map(item => item.replace(/^[-•\d.]\s*/, '').trim());
  }

  return {
    ...sections,
    professional_fingerprint: {
      full_response: content
    }
  };
}

/**
 * Main function: Generates a comprehensive professional profile
 */
export async function generateProfessionalProfile(
  params: GenerateProfileParams
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  try {
    console.log('[LLM] Starting profile generation for:', params.practiceMemberId);

    // 1. Get prompt configuration
    const promptConfig = await getPromptConfig('profile_synthesis', params.practiceId);
    if (!promptConfig) {
      throw new Error('Prompt configuration not found');
    }

    // 2. Get API key
    const apiKey = await getOpenRouterKey(params.practiceId);
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // 3. Prepare template values
    const templateValues = {
      communication_style: params.workingPreferences?.communication_style || 'Not assessed',
      work_style: params.workingPreferences?.work_style || 'Not assessed',
      environment: params.workingPreferences?.environment || 'Not assessed',
      time_management: params.workingPreferences?.time_management || 'Not assessed',
      feedback_preference: params.workingPreferences?.feedback_preference || 'Not assessed',
      collaboration_preference: params.workingPreferences?.collaboration_preference || 'Not assessed',
      primary_role: params.belbinRoles?.primary_role || 'Not assessed',
      secondary_role: params.belbinRoles?.secondary_role || 'Not assessed',
      tertiary_role: params.belbinRoles?.tertiary_role || 'Not assessed',
      primary_driver: params.motivationalDrivers?.primary_driver || 'Not assessed',
      secondary_driver: params.motivationalDrivers?.secondary_driver || 'Not assessed',
      driver_scores: params.motivationalDrivers?.driver_scores || {},
      self_awareness_score: params.eqLevels?.self_awareness_score || 0,
      self_management_score: params.eqLevels?.self_management_score || 0,
      social_awareness_score: params.eqLevels?.social_awareness_score || 0,
      relationship_management_score: params.eqLevels?.relationship_management_score || 0,
      overall_eq: params.eqLevels?.overall_eq || 0,
      eq_level: params.eqLevels?.eq_level || 'Not assessed',
      primary_style: params.conflictStyle?.primary_style || 'Not assessed',
      secondary_style: params.conflictStyle?.secondary_style || 'Not assessed'
    };

    // 4. Fill in the user prompt template
    const userPrompt = fillTemplate(promptConfig.user_prompt_template, templateValues);

    console.log('[LLM] Calling OpenRouter API...');

    // 5. Call the LLM
    const response = await callOpenRouter(
      apiKey,
      promptConfig.model_name,
      promptConfig.system_prompt,
      userPrompt,
      promptConfig.temperature,
      promptConfig.max_tokens
    );

    console.log('[LLM] Response received:', response.tokensUsed, 'tokens in', response.timeMs, 'ms');

    // 6. Parse the response
    const parsedProfile = parseProfileResponse(response.content);

    // 7. Save to database
    const { data: profile, error: saveError } = await supabase
      .from('generated_profiles')
      .insert({
        practice_member_id: params.practiceMemberId,
        practice_id: params.practiceId,
        narrative: parsedProfile.narrative,
        professional_fingerprint: parsedProfile.professional_fingerprint,
        optimal_environment: parsedProfile.optimal_environment,
        unique_value_proposition: parsedProfile.unique_value_proposition,
        synergies: parsedProfile.synergies,
        creative_tensions: parsedProfile.creative_tensions,
        growth_recommendations: parsedProfile.growth_recommendations,
        working_preferences: params.workingPreferences,
        belbin_roles: params.belbinRoles,
        motivational_drivers: params.motivationalDrivers,
        eq_levels: params.eqLevels,
        conflict_style: params.conflictStyle,
        prompt_id: promptConfig.id,
        model_used: promptConfig.model_name,
        tokens_used: response.tokensUsed,
        generation_time_ms: response.timeMs,
        generated_by: params.generatedBy || null  // Allow null for auto-generation
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[LLM] Error saving profile:', saveError);
      throw saveError;
    }

    // 8. Update API key usage stats (non-blocking)
    try {
      await supabase.rpc('increment', {
        table_name: 'ai_api_keys',
        row_id: apiKey,
        column_name: 'total_requests',
        increment_by: 1
      });
    } catch (err) {
      console.warn('[LLM] Could not update usage stats:', err);
    }

    console.log('[LLM] Profile generated successfully:', profile.id);

    return {
      success: true,
      profileId: profile.id
    };

  } catch (error: any) {
    console.error('[LLM] Error generating profile:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Retrieves the current profile for a team member
 */
export async function getCurrentProfile(practiceMemberId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('generated_profiles')
    .select('*')
    .eq('practice_member_id', practiceMemberId)
    .eq('is_current', true)
    .single();

  if (error) {
    console.error('[LLM] Error fetching current profile:', error);
    return null;
  }

  return data;
}

/**
 * Retrieves all profile versions for a team member
 */
export async function getProfileHistory(practiceMemberId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('generated_profiles')
    .select('*')
    .eq('practice_member_id', practiceMemberId)
    .order('generated_at', { ascending: false });

  if (error) {
    console.error('[LLM] Error fetching profile history:', error);
    return [];
  }

  return data || [];
}

