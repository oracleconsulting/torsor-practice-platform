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

import type { SupabaseClient } from '@supabase/supabase-js';

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
async function getPromptConfig(supabase: SupabaseClient, promptKey: string, practiceId: string) {
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
async function getApiKey(supabase: SupabaseClient, practiceId: string): Promise<string> {
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
export async function generateGapAnalysisInsights(supabase: SupabaseClient, practiceId: string) {
  // Fetch team members
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name, role')
    .eq('practice_id', practiceId)
    .or('is_test_account.is.null,is_test_account.eq.false'); // Exclude test accounts
  
  if (!members || members.length === 0) {
    throw new Error('No team members found');
  }
  
  const memberIds = members.map(m => m.id);
  
  // Fetch all skill assessments for these members with skill names
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select(`
      *,
      skill:skills(name)
    `)
    .in('team_member_id', memberIds);
  
  console.log('[GapAnalysis] Fetched', assessments?.length || 0, 'skill assessments for', members.length, 'members');
  
  // Calculate skill gap statistics
  const skillGapMap = new Map<string, { totalGap: number; count: number; totalCurrent: number }>();
  
  (assessments || []).forEach((assessment: any) => {
    const current = assessment.self_rating || assessment.current_level || 0;
    const target = assessment.target_level || 0;
    const gap = target - current;
    
    if (assessment.skill?.name) {
      const skillName = assessment.skill.name;
      const existing = skillGapMap.get(skillName) || { totalGap: 0, count: 0, totalCurrent: 0 };
      skillGapMap.set(skillName, {
        totalGap: existing.totalGap + (gap > 0 ? gap : 0),
        count: existing.count + 1,
        totalCurrent: existing.totalCurrent + current
      });
    }
  });
  
  const avgSkillLevel = assessments && assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + (a.self_rating || a.current_level || 0), 0) / assessments.length).toFixed(1)
    : '0.0';
  
  const gapList = Array.from(skillGapMap.entries())
    .map(([skill, data]) => ({
      skill,
      avgGap: data.totalGap / data.count,
      avgCurrent: data.totalCurrent / data.count,
      count: data.count
    }))
    .filter(g => g.avgGap > 0) // Only include skills with gaps
    .sort((a, b) => b.avgGap - a.avgGap)
    .slice(0, 15)
    .map((g, i) => `${i + 1}. ${g.skill}: Current ${g.avgCurrent.toFixed(1)}/5, Gap ${g.avgGap.toFixed(1)}/5 (${g.count} members affected)`)
    .join('\n');
  
  // Fetch REAL Belbin data
  const { data: belbinData } = await supabase
    .from('belbin_assessments')
    .select('primary_role, secondary_role')
    .in('practice_member_id', memberIds);

  const belbinCounts: Record<string, number> = {};
  (belbinData || []).forEach(b => {
    if (b.primary_role) belbinCounts[b.primary_role] = (belbinCounts[b.primary_role] || 0) + 1;
    if (b.secondary_role) belbinCounts[b.secondary_role] = (belbinCounts[b.secondary_role] || 0) + 0.5;
  });

  const belbinIdeal = Math.round(members.length / 9); // Ideal: evenly distributed
  const belbinGaps = ['Plant', 'Monitor Evaluator', 'Specialist', 'Shaper', 'Implementer', 'Completer Finisher', 'Coordinator', 'Teamworker', 'Resource Investigator']
    .map(role => ({
      role,
      current: Math.round(belbinCounts[role] || 0),
      ideal: belbinIdeal
    }))
    .filter(g => g.current < g.ideal)
    .sort((a, b) => (b.ideal - b.current) - (a.ideal - a.current))
    .slice(0, 5);

  const belbinGapsStr = belbinGaps.length > 0
    ? belbinGaps.map(g => `${g.role}: ${g.current}/${g.ideal} ideal`).join(', ')
    : 'Well balanced';

  // Fetch REAL EQ data
  const { data: eqData } = await supabase
    .from('eq_assessments')
    .select('overall_eq, self_awareness_score, social_awareness_score')
    .in('practice_member_id', memberIds);

  const avgEQ = eqData && eqData.length > 0
    ? Math.round(eqData.reduce((sum, e) => sum + (e.overall_eq || 0), 0) / eqData.length)
    : 0;

  const avgSelfAwareness = eqData && eqData.length > 0
    ? Math.round(eqData.reduce((sum, e) => sum + (e.self_awareness_score || 0), 0) / eqData.length)
    : 0;

  // Fetch REAL Motivational Drivers
  const { data: motivData } = await supabase
    .from('motivational_drivers')
    .select('primary_driver')
    .in('practice_member_id', memberIds);

  const motivDrivers: Record<string, number> = {};
  (motivData || []).forEach(m => {
    if (m.primary_driver) motivDrivers[m.primary_driver] = (motivDrivers[m.primary_driver] || 0) + 1;
  });

  const dominantDriver = Object.entries(motivDrivers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Fetch service line preferences
  const { data: servicePrefs } = await supabase
    .from('service_line_interests')
    .select('*')
    .in('practice_member_id', memberIds);

  const serviceLineCount = servicePrefs?.length || 0;
  const serviceCoverage = serviceLineCount > 0
    ? `${serviceLineCount}/${members.length} members have stated preferences`
    : 'No service line data';
  
  console.log('[GapAnalysis] Calculated REAL team data:', {
    skillGaps: skillGapMap.size,
    avgEQ,
    avgSkillLevel,
    belbinGaps: belbinGaps.length,
    dominantDriver
  });
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig(supabase, 'gap_analysis_insights', practiceId);
  const apiKey = await getApiKey(supabase, practiceId);
  
  // Fill template with REAL DATA
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    team_size: members.length,
    avg_skill_level: avgSkillLevel,
    avg_eq: avgEQ,
    avg_self_awareness: avgSelfAwareness,
    dominant_driver: dominantDriver,
    gap_list: gapList || 'No significant skill gaps identified',
    belbin_gaps: belbinGapsStr,
    critical_gaps: Array.from(skillGapMap.entries())
      .sort((a, b) => b[1].totalGap - a[1].totalGap)
      .slice(0, 3)
      .map(([skill]) => skill)
      .join(', ') || 'None identified',
    service_line_coverage: serviceCoverage
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
      avgEQ,
      avgSkillLevel: parseFloat(avgSkillLevel),
      topGaps: Array.from(skillGapMap.entries())
        .sort((a, b) => b[1].totalGap - a[1].totalGap)
        .slice(0, 5)
        .map(([skill, data]) => ({ skill, avgGap: data.totalGap / data.count })),
      belbinGaps,
      dominantDriver,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * 2. TEAM COMPOSITION ANALYSIS
 * Analyzes team dynamics based on personality and working styles
 */
export async function generateTeamCompositionAnalysis(supabase: SupabaseClient, practiceId: string) {
  // Fetch team members (excluding test accounts)
  const { data: members } = await supabase
    .from('practice_members')
    .select('id, name, role')
    .eq('practice_id', practiceId)
    .or('is_test_account.is.null,is_test_account.eq.false');
  
  if (!members || members.length === 0) {
    throw new Error('No team members found');
  }
  
  console.log('[TeamComposition] Found', members.length, 'team members');
  
  const memberIds = members.map(m => m.id);
  
  // Fetch OCEAN assessments
  const { data: oceanAssessments } = await supabase
    .from('ocean_assessments')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch working preferences
  const { data: workingPrefs } = await supabase
    .from('working_preferences')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch Belbin assessments
  const { data: belbinAssessments } = await supabase
    .from('belbin_assessments')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch VARK assessments
  const { data: varkAssessments } = await supabase
    .from('vark_assessments')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch EQ assessments
  const { data: eqAssessments } = await supabase
    .from('eq_assessments')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch motivational drivers
  const { data: motivationalDrivers } = await supabase
    .from('motivational_drivers')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch conflict styles
  const { data: conflictStyles } = await supabase
    .from('conflict_styles')
    .select('*')
    .in('team_member_id', memberIds);
  
  // Fetch service line interests
  const { data: serviceInterests } = await supabase
    .from('service_line_interests')
    .select('*')
    .in('practice_member_id', memberIds);
  
  // Fetch skill assessments
  const { data: skillAssessments } = await supabase
    .from('skill_assessments')
    .select(`
      *,
      skill:skills(name, category)
    `)
    .in('team_member_id', memberIds);
  
  console.log('[TeamComposition] Fetched ALL assessments:', {
    ocean: oceanAssessments?.length || 0,
    working: workingPrefs?.length || 0,
    belbin: belbinAssessments?.length || 0,
    vark: varkAssessments?.length || 0,
    eq: eqAssessments?.length || 0,
    motivational: motivationalDrivers?.length || 0,
    conflict: conflictStyles?.length || 0,
    serviceInterests: serviceInterests?.length || 0,
    skills: skillAssessments?.length || 0
  });
  
  // Calculate DETAILED work style distribution from OCEAN scores
  const personalityDist: Record<string, number> = {};
  const oceanDetails: string[] = [];
  (oceanAssessments || []).forEach((assessment: any) => {
    const member = members.find(m => m.id === assessment.team_member_id);
    const e = assessment.extraversion_score || 0;
    const c = assessment.conscientiousness_score || 0;
    const o = assessment.openness_score || 0;
    const a = assessment.agreeableness_score || 0;
    const n = assessment.neuroticism_score || 0;
    
    let style = 'Balanced';
    if (c > 70) style = 'Structured Worker';
    else if (e > 70) style = 'Collaborative Worker';
    else if (e < 30) style = 'Independent Worker';
    
    personalityDist[style] = (personalityDist[style] || 0) + 1;
    oceanDetails.push(`${member?.name || 'Unknown'} (${member?.role}): O=${o}, C=${c}, E=${e}, A=${a}, N=${n}`);
  });
  
  const workingStyles = Object.entries(personalityDist)
    .map(([style, count]) => `${style}: ${count} members`)
    .join('\n') || 'No OCEAN data available';
  
  // Calculate DETAILED Belbin roles
  const belbinDist: Record<string, string[]> = {};
  (belbinAssessments || []).forEach((assessment: any) => {
    const member = members.find(m => m.id === assessment.team_member_id);
    const role = assessment.primary_role || 'Unassigned';
    if (!belbinDist[role]) belbinDist[role] = [];
    belbinDist[role].push(`${member?.name} (${member?.role})`);
  });
  
  const belbinRolesStr = Object.entries(belbinDist)
    .map(([role, membersList]) => `${role}: ${membersList.join(', ')}`)
    .join('\n') || 'No Belbin assessments completed';
  
  // Calculate DETAILED learning styles from VARK
  const learningStyles: Record<string, string[]> = {};
  (varkAssessments || []).forEach((assessment: any) => {
    const member = members.find(m => m.id === assessment.team_member_id);
    const style = assessment.primary_style || 'Unknown';
    if (!learningStyles[style]) learningStyles[style] = [];
    learningStyles[style].push(`${member?.name} (${member?.role})`);
  });
  
  const learningStylesStr = Object.entries(learningStyles)
    .map(([style, membersList]) => `${style}: ${membersList.join(', ')}`)
    .join('\n') || 'No VARK assessments completed';
  
  // Calculate DETAILED EQ distribution
  const eqDist = (eqAssessments || []).map((assessment: any) => {
    const member = members.find(m => m.id === assessment.team_member_id);
    return `${member?.name} (${member?.role}): Self-Awareness=${assessment.self_awareness_score}, Social Awareness=${assessment.social_awareness_score}, Self-Management=${assessment.self_management_score}, Relationship=${assessment.relationship_management_score}`;
  });
  
  const eqStr = eqDist.length > 0 ? eqDist.join('\n') : 'No EQ assessments completed';
  
  // Calculate DETAILED motivational drivers
  const motivationalDist: Record<string, string[]> = {};
  (motivationalDrivers || []).forEach((assessment: any) => {
    const member = members.find(m => m.id === assessment.team_member_id);
    const driver = assessment.primary_driver || 'Unknown';
    if (!motivationalDist[driver]) motivationalDist[driver] = [];
    motivationalDist[driver].push(`${member?.name} (${member?.role})`);
  });
  
  const motivationalStr = Object.entries(motivationalDist)
    .map(([driver, membersList]) => `${driver}: ${membersList.join(', ')}`)
    .join('\n') || 'No motivational assessments completed';
  
  // Calculate DETAILED conflict styles
  const conflictDist: Record<string, string[]> = {};
  (conflictStyles || []).forEach((assessment: any) => {
    const member = members.find(m => m.id === assessment.team_member_id);
    const style = assessment.style || 'Unknown';
    if (!conflictDist[style]) conflictDist[style] = [];
    conflictDist[style].push(`${member?.name} (${member?.role})`);
  });
  
  const conflictStylesStr = Object.entries(conflictDist)
    .map(([style, membersList]) => `${style}: ${membersList.join(', ')}`)
    .join('\n') || 'No conflict style assessments completed';
  
  // Calculate DETAILED working preferences
  const workingPrefsDist = (workingPrefs || []).map((pref: any) => {
    const member = members.find(m => m.id === pref.team_member_id);
    return `${member?.name} (${member?.role}): Environment=${pref.environment}, Communication=${pref.communication_style}, Autonomy=${pref.autonomy_level}, Supervision=${pref.supervision_preference}`;
  });
  
  const workingPrefsStr = workingPrefsDist.length > 0 ? workingPrefsDist.join('\n') : 'No working preferences data';
  
  // Calculate TOP SKILLS by category
  const skillsByCategory: Record<string, Array<{skill: string, avgLevel: number, memberCount: number}>> = {};
  (skillAssessments || []).forEach((assessment: any) => {
    const skillName = assessment.skill?.name || 'Unknown';
    const category = assessment.skill?.category || 'Other';
    const level = assessment.self_rating || assessment.current_level || 0;
    
    if (!skillsByCategory[category]) skillsByCategory[category] = [];
    
    const existing = skillsByCategory[category].find(s => s.skill === skillName);
    if (existing) {
      existing.avgLevel = ((existing.avgLevel * existing.memberCount) + level) / (existing.memberCount + 1);
      existing.memberCount++;
    } else {
      skillsByCategory[category].push({ skill: skillName, avgLevel: level, memberCount: 1 });
    }
  });
  
  const skillsStr = Object.entries(skillsByCategory)
    .map(([category, skills]) => {
      const topSkills = skills
        .sort((a, b) => b.avgLevel - a.avgLevel)
        .slice(0, 5)
        .map(s => `${s.skill} (avg: ${s.avgLevel.toFixed(1)}/5, ${s.memberCount} members)`)
        .join(', ');
      return `${category}: ${topSkills}`;
    })
    .join('\n') || 'No skills assessments completed';
  
  // Get prompt and API key
  const promptConfig = await getPromptConfig(supabase, 'team_composition_analysis', practiceId);
  const apiKey = await getApiKey(supabase, practiceId);
  
  // Build COMPREHENSIVE user prompt with ALL data
  const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
    team_size: members.length,
    team_roles: members.map(m => `${m.name}: ${m.role}`).join(', '),
    personality_distribution: workingStyles,
    ocean_details: oceanDetails.join('\n'),
    working_styles: workingStyles,
    working_preferences: workingPrefsStr,
    communication_preferences: workingPrefsStr,
    learning_styles: learningStylesStr,
    belbin_roles: belbinRolesStr,
    eq_scores: eqStr,
    motivational_drivers: motivationalStr,
    conflict_styles: conflictStylesStr,
    top_skills: skillsStr
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
export async function generateServiceLineDeployment(supabase: SupabaseClient, practiceId: string) {
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
  const promptConfig = await getPromptConfig(supabase, 'service_line_deployment', practiceId);
  const apiKey = await getApiKey(supabase, practiceId);
  
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
export async function generateTrainingNarrative(supabase: SupabaseClient, memberId: string, practiceId: string) {
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
  const promptConfig = await getPromptConfig(supabase, 'training_narrative', practiceId);
  const apiKey = await getApiKey(supabase, practiceId);
  
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
export async function generateAssessmentSynthesis(supabase: SupabaseClient, memberId: string, practiceId: string) {
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
  const promptConfig = await getPromptConfig(supabase, 'assessment_synthesis', practiceId);
  const apiKey = await getApiKey(supabase, practiceId);
  
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

