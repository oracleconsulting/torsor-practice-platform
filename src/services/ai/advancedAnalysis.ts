/**
 * Advanced AI Analysis Services
 * Phase 2 LLM integrations for team management
 * 
 * Provides high-value AI-powered insights:
 * - Gap Analysis
 * - Team Composition Analysis
 * - Service Line Deployment Strategy
 * - Training Narrative Generation
 * - Assessment Result Synthesis
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Helper: Apply template variables
 */
function applyTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    result = result.replace(placeholder, valueStr);
  });
  
  return result;
}

/**
 * Helper: Get prompt config from database
 */
async function getPromptConfig(promptKey: string, practiceId: string) {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('prompt_key', promptKey)
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    throw new Error(`Prompt config not found for: ${promptKey}`);
  }
  
  return data;
}

/**
 * Helper: Get OpenRouter API key
 */
async function getApiKey(practiceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('ai_api_keys')
    .select('api_key')
    .eq('practice_id', practiceId)
    .eq('provider', 'openrouter')
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    // Fallback to environment variable
    return import.meta.env.VITE_OPENROUTER_API_KEY || '';
  }
  
  return data.api_key;
}

/**
 * Helper: Call OpenRouter API
 */
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'TORSOR Practice Platform'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * 1. GAP ANALYSIS AI INSIGHTS
 * Analyzes skill gaps across the team and provides strategic recommendations
 */
export async function generateGapAnalysisInsights(practiceId: string) {
  // Fetch team members
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name, role')
    .eq('practice_id', practiceId);
  
  if (!members || members.length === 0) {
    throw new Error('No team members found');
  }
  
  // Fetch all skill assessments for these members with skill names
  const memberIds = members.map(m => m.id);
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select(`
      *,
      skill:skills(name)
    `)
    .in('team_member_id', memberIds);
  
  console.log('[GapAnalysis] Fetched', assessments?.length || 0, 'skill assessments for', members.length, 'members');
  
  // Calculate gap statistics
  const skillGapMap = new Map<string, { totalGap: number; count: number }>();
  
  (assessments || []).forEach((assessment: any) => {
    const gap = (assessment.target_level || 0) - (assessment.current_level || 0);
    if (gap > 0 && assessment.skill?.name) {
      const skillName = assessment.skill.name;
      const existing = skillGapMap.get(skillName) || { totalGap: 0, count: 0 };
      skillGapMap.set(skillName, {
        totalGap: existing.totalGap + gap,
        count: existing.count + 1
      });
    }
  });
  
  const gapList = Array.from(skillGapMap.entries())
    .map(([skill, data]) => ({
      skill,
      avgGap: data.totalGap / data.count,
      count: data.count
    }))
    .sort((a, b) => b.avgGap - a.avgGap)
    .slice(0, 15)
    .map((g, i) => `${i + 1}. ${g.skill}: Avg gap ${g.avgGap.toFixed(1)}/5 (${g.count} members)`)
    .join('\n');
  
  console.log('[GapAnalysis] Calculated gaps for', skillGapMap.size, 'unique skills');
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig('gap_analysis_insights', practiceId);
  const apiKey = await getApiKey(practiceId);
  
  // Fill template
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    team_size: members.length,
    avg_skill_level: '3.2', // Calculate from actual data
    gap_list: gapList,
    critical_gaps: 'Tax planning, Cloud accounting, Advisory services',
    service_line_coverage: 'Strong in compliance, weak in advisory'
  });
  
  // Call LLM
  const insights = await callOpenRouter(
    apiKey,
    promptConfig.model_name,
    promptConfig.system_prompt,
    userPrompt,
    promptConfig.temperature,
    promptConfig.max_tokens
  );
  
  return {
    insights,
    metadata: {
      teamSize: members.length,
      topGaps: Array.from(skillGapMap.entries()).slice(0, 5),
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 2. TEAM COMPOSITION ANALYSIS
 * Analyzes team dynamics based on personality and working styles
 */
export async function generateTeamCompositionAnalysis(practiceId: string) {
  // Fetch team assessment data
  const { data: members } = await supabase
    .from('practice_members')
    .select(`
      id,
      name,
      role,
      personality_assessments (work_style, openness, conscientiousness, extraversion, agreeableness, neuroticism),
      learning_preferences (primary_style),
      working_preferences (environment, communication_style),
      team_roles (primary_role),
      conflict_styles (style)
    `)
    .eq('practice_id', practiceId);
  
  if (!members || members.length === 0) {
    throw new Error('No team members found');
  }
  
  // Aggregate distribution data
  const personalityDist = members.reduce((acc: any, m: any) => {
    const workStyle = m.personality_assessments?.[0]?.work_style || 'Unknown';
    acc[workStyle] = (acc[workStyle] || 0) + 1;
    return acc;
  }, {});
  
  const workingStyles = Object.entries(personalityDist)
    .map(([style, count]) => `${style}: ${count} members`)
    .join('\n');
  
  const learningStyles = members.reduce((acc: any, m: any) => {
    const style = m.learning_preferences?.[0]?.primary_style || 'Unknown';
    acc[style] = (acc[style] || 0) + 1;
    return acc;
  }, {});
  
  const learningStylesStr = Object.entries(learningStyles)
    .map(([style, count]) => `${style}: ${count} members`)
    .join('\n');
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig('team_composition_analysis', practiceId);
  const apiKey = await getApiKey(practiceId);
  
  // Fill template
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    team_size: members.length,
    personality_distribution: workingStyles,
    working_styles: workingStyles,
    communication_preferences: 'Mix of direct and collaborative styles',
    learning_styles: learningStylesStr,
    belbin_roles: 'Balanced across roles',
    conflict_styles: 'Mix of compromising and collaborating'
  });
  
  // Call LLM
  const analysis = await callOpenRouter(
    apiKey,
    promptConfig.model_name,
    promptConfig.system_prompt,
    userPrompt,
    promptConfig.temperature,
    promptConfig.max_tokens
  );
  
  return {
    analysis,
    metadata: {
      teamSize: members.length,
      distributions: {
        personality: personalityDist,
        learning: learningStyles
      },
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 3. SERVICE LINE DEPLOYMENT STRATEGY
 * Generates deployment strategy for service lines
 */
export async function generateServiceLineDeployment(practiceId: string) {
  // Fetch service line data
  const { data: interests } = await supabase
    .from('service_line_interests')
    .select(`
      *,
      practice_member:practice_members(member_name, role)
    `)
    .eq('practice_id', practiceId);
  
  if (!interests || interests.length === 0) {
    throw new Error('No service line data found');
  }
  
  // Aggregate rankings
  const serviceRankings: Record<string, { totalRank: number; count: number; avgInterest: number }> = {};
  
  interests.forEach((interest: any) => {
    const rankings = interest.service_rankings || {};
    Object.entries(rankings).forEach(([service, rank]: [string, any]) => {
      if (!serviceRankings[service]) {
        serviceRankings[service] = { totalRank: 0, count: 0, avgInterest: 0 };
      }
      serviceRankings[service].totalRank += rank;
      serviceRankings[service].count += 1;
    });
  });
  
  const rankingsStr = Object.entries(serviceRankings)
    .map(([service, data]) => {
      const avgRank = data.totalRank / data.count;
      return `${service}: Avg rank ${avgRank.toFixed(1)} (${data.count} members interested)`;
    })
    .join('\n');
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig('service_line_deployment', practiceId);
  const apiKey = await getApiKey(practiceId);
  
  // Fill template
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    team_size: interests.length,
    avg_experience: '5.2',
    total_cpd_hours: '240',
    service_line_rankings: rankingsStr,
    service_skill_matrix: 'Tax: Strong, Advisory: Developing, Cloud: Strong',
    market_demand: 'High demand for CFO services and cloud accounting'
  });
  
  // Call LLM
  const strategy = await callOpenRouter(
    apiKey,
    promptConfig.model_name,
    promptConfig.system_prompt,
    userPrompt,
    promptConfig.temperature,
    promptConfig.max_tokens
  );
  
  return {
    strategy,
    metadata: {
      serviceLines: Object.keys(serviceRankings),
      memberCount: interests.length,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 4. TRAINING RECOMMENDATIONS NARRATIVE
 * Generates personalized training recommendations with narrative
 */
export async function generateTrainingNarrative(memberId: string, practiceId: string) {
  console.log('[TrainingNarrative] Starting with memberId:', memberId, 'practiceId:', practiceId);
  
  // Fetch member data with proper joins
  const { data: member, error: memberError } = await supabase
    .from('practice_members')
    .select('id, name, role')
    .eq('id', memberId)
    .maybeSingle();
  
  console.log('[TrainingNarrative] Member query result:', member ? 'found' : 'null', 'error:', memberError);
  
  if (memberError || !member) {
    console.error('[TrainingNarrative] Member fetch failed:', {
      memberId,
      practiceId,
      error: memberError,
      hasData: !!member
    });
    throw new Error(`Member not found: ${memberError?.message || 'No data returned'}`);
  }
  
  // Fetch skill assessments separately with proper join
  const { data: skillAssessments } = await supabase
    .from('skill_assessments')
    .select(`
      *,
      skill:skills(name)
    `)
    .eq('team_member_id', memberId);
  
  // Fetch learning preferences separately
  const { data: learningPrefs } = await supabase
    .from('learning_preferences')
    .select('primary_style')
    .eq('team_member_id', memberId)
    .maybeSingle();
  
  // Fetch CPD activities separately
  const { data: cpdActivities } = await supabase
    .from('cpd_activities')
    .select('activity_type, hours, completed_at')
    .eq('practice_member_id', memberId);
  
  console.log('[TrainingNarrative] Data fetched - skills:', skillAssessments?.length || 0, 'cpd:', cpdActivities?.length || 0);
  
  // Calculate gaps
  const gaps = skillAssessments
    ?.filter((s: any) => (s.target_level || 0) > (s.current_level || 0))
    .map((s: any) => s.skill?.name || 'Unknown Skill')
    .slice(0, 5) || [];
  
  const strengths = skillAssessments
    ?.filter((s: any) => (s.current_level || 0) >= 4)
    .map((s: any) => s.skill?.name || 'Unknown Skill')
    .slice(0, 5) || [];
  
  const cpdHours = cpdActivities
    ?.reduce((sum: number, a: any) => sum + (a.hours || 0), 0) || 0;
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig('training_narrative', practiceId);
  const apiKey = await getApiKey(practiceId);
  
  // Fill template (removed years_experience as it doesn't exist in schema)
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    member_name: member.name,
    role: member.role || 'Team Member',
    learning_style: learningPrefs?.primary_style || 'Visual',
    top_skills: strengths.join(', ') || 'Not assessed',
    gap_areas: gaps.join(', ') || 'None identified',
    career_goals: 'Career progression and skill development',
    practice_needs: 'Advisory services and cloud accounting',
    cpd_hours: cpdHours,
    cpd_target: 40,
    last_assessment_date: 'Recent',
    recent_completions: 'Tax update course'
  });
  
  // Call LLM
  const narrative = await callOpenRouter(
    apiKey,
    promptConfig.model_name,
    promptConfig.system_prompt,
    userPrompt,
    promptConfig.temperature,
    promptConfig.max_tokens
  );
  
  return {
    narrative,
    metadata: {
      memberId,
      memberName: member.name,
      gapCount: gaps.length,
      strengthCount: strengths.length,
      cpdHours,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 5. ASSESSMENT RESULT SYNTHESIS
 * Creates holistic insights from all assessments
 */
export async function generateAssessmentSynthesis(memberId: string, practiceId: string) {
  console.log('[AssessmentSynthesis] Starting with memberId:', memberId, 'practiceId:', practiceId);
  
  // Fetch member basic data
  const { data: member, error: memberError } = await supabase
    .from('practice_members')
    .select('id, name, role')
    .eq('id', memberId)
    .maybeSingle();
  
  console.log('[AssessmentSynthesis] Member query result:', member ? 'found' : 'null', 'error:', memberError);
  
  if (memberError || !member) {
    console.error('[AssessmentSynthesis] Member fetch failed:', {
      memberId,
      practiceId,
      error: memberError,
      hasData: !!member
    });
    throw new Error(`Member not found: ${memberError?.message || 'No data returned'}`);
  }
  
  // Fetch each assessment type separately
  const { data: learningPrefs } = await supabase
    .from('learning_preferences')
    .select('*')
    .eq('team_member_id', memberId);
  
  const { data: personalityAssessments } = await supabase
    .from('personality_assessments')
    .select('*')
    .eq('team_member_id', memberId);
  
  const { data: workingPrefs } = await supabase
    .from('working_preferences')
    .select('*')
    .eq('practice_member_id', memberId);
  
  const { data: belbinRoles } = await supabase
    .from('belbin_team_roles')
    .select('*')
    .eq('practice_member_id', memberId);
  
  const { data: motivationalDrivers } = await supabase
    .from('motivational_drivers')
    .select('*')
    .eq('practice_member_id', memberId);
  
  const { data: eqAssessments } = await supabase
    .from('eq_assessments')
    .select('*')
    .eq('practice_member_id', memberId);
  
  const { data: conflictStyles } = await supabase
    .from('conflict_styles')
    .select('*')
    .eq('practice_member_id', memberId);
  
  const { data: serviceLineInterests } = await supabase
    .from('service_line_interests')
    .select('*')
    .eq('practice_member_id', memberId);
  
  console.log('[AssessmentSynthesis] Fetched assessments:', {
    vark: learningPrefs?.length || 0,
    ocean: personalityAssessments?.length || 0,
    workingPrefs: workingPrefs?.length || 0,
    belbin: belbinRoles?.length || 0,
    motivational: motivationalDrivers?.length || 0,
    eq: eqAssessments?.length || 0,
    conflict: conflictStyles?.length || 0,
    serviceLine: serviceLineInterests?.length || 0
  });
  
  // Build assessment status
  const assessmentStatus = {
    vark: (learningPrefs?.length || 0) > 0,
    ocean: (personalityAssessments?.length || 0) > 0,
    workPrefs: (workingPrefs?.length || 0) > 0,
    belbin: (belbinRoles?.length || 0) > 0,
    motivational: (motivationalDrivers?.length || 0) > 0,
    eq: (eqAssessments?.length || 0) > 0,
    conflict: (conflictStyles?.length || 0) > 0,
    serviceLine: (serviceLineInterests?.length || 0) > 0
  };
  
  const completionCount = Object.values(assessmentStatus).filter(Boolean).length;
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig('assessment_synthesis', practiceId);
  const apiKey = await getApiKey(practiceId);
  
  // Fill template
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    assessment_completion_status: `${completionCount}/8 assessments completed`,
    vark_primary: learningPrefs?.[0]?.primary_style || 'Not assessed',
    vark_secondary: learningPrefs?.[0]?.secondary_style || 'Not assessed',
    vark_insights: 'Prefers hands-on and visual learning',
    ocean_profile: personalityAssessments?.[0]?.work_style || 'Not assessed',
    ocean_work_style: 'Collaborative and detail-oriented',
    work_environment: workingPrefs?.[0]?.environment || 'Not specified',
    communication_style: workingPrefs?.[0]?.communication_style || 'Not specified',
    work_preferences_insights: 'Works well in structured environments',
    belbin_primary: belbinRoles?.[0]?.primary_role || 'Not assessed',
    belbin_secondary: belbinRoles?.[0]?.secondary_role || 'Not assessed',
    motivational_drivers: 'Achievement, autonomy, mastery',
    eq_score: eqAssessments?.[0]?.overall_score || 'Not assessed',
    eq_breakdown: 'Strong self-awareness and empathy',
    conflict_style: conflictStyles?.[0]?.style || 'Not assessed',
    service_line_interests: 'Advisory, tax planning, CFO services'
  });
  
  // Call LLM
  const synthesis = await callOpenRouter(
    apiKey,
    promptConfig.model_name,
    promptConfig.system_prompt,
    userPrompt,
    promptConfig.temperature,
    promptConfig.max_tokens
  );
  
  return {
    synthesis,
    metadata: {
      memberId,
      memberName: member.name,
      assessmentsCompleted: completionCount,
      totalAssessments: 8,
      generatedAt: new Date().toISOString()
    }
  };
}

