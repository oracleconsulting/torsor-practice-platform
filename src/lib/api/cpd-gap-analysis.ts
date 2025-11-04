/**
 * CPD Gap Analysis
 * Identifies which skills are missing level progressions
 */

import { supabase } from '@/lib/supabase/client';

export interface SkillLevelGap {
  skillId: string;
  skillName: string;
  category: string;
  missingLevels: string[]; // e.g., ['1-2', '2-3']
  existingLevels: string[];
  totalResources: number;
  priority: 'high' | 'medium' | 'low';
}

export interface GapAnalysisResult {
  totalSkills: number;
  completeSkills: number; // Have all 4 levels
  partialSkills: number; // Have some levels
  missingSkills: number; // Have no levels
  gaps: SkillLevelGap[];
}

/**
 * Analyze which skills are missing which level progressions
 */
export async function analyzeSkillLevelGaps(): Promise<GapAnalysisResult> {
  console.log('[Gap Analysis] Starting analysis...');

  try {
    // Get all skills
    const { data: allSkills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level')
      .order('name');

    if (skillsError) throw skillsError;
    if (!allSkills || allSkills.length === 0) {
      throw new Error('No skills found');
    }

    console.log(`[Gap Analysis] Analyzing ${allSkills.length} skills...`);

    // Get all knowledge documents with skill level info
    const { data: allDocs, error: docsError } = await supabase
      .from('knowledge_documents')
      .select('title, file_name, skill_level, target_skill_levels');

    if (docsError) throw docsError;

    // Build a map of skill -> levels
    const skillLevelMap = new Map<string, Set<string>>();

    allDocs?.forEach((doc: any) => {
      if (doc.file_name && doc.target_skill_levels && Array.isArray(doc.target_skill_levels)) {
        // Extract skill name from file_name
        // Format: "skill-name-contenttype-levelX-Y.md"
        const contentTypes = ['article', 'webinar', 'video', 'podcast', 'case', 'guide'];
        const parts = doc.file_name.split('-');
        
        let skillParts = [];
        for (let i = 0; i < parts.length; i++) {
          if (contentTypes.includes(parts[i])) {
            break;
          }
          skillParts.push(parts[i]);
        }
        
        if (skillParts.length > 0) {
          const skillSlug = skillParts.join('-');
          const levelKey = `${doc.target_skill_levels[0]}-${doc.target_skill_levels[1]}`;
          
          if (!skillLevelMap.has(skillSlug)) {
            skillLevelMap.set(skillSlug, new Set());
          }
          skillLevelMap.get(skillSlug)!.add(levelKey);
        }
      }
    });

    console.log(`[Gap Analysis] Found ${skillLevelMap.size} skills with resources`);

    // Analyze gaps
    const gaps: SkillLevelGap[] = [];
    const requiredLevels = ['1-2', '2-3', '3-4', '4-5'];

    for (const skill of allSkills as any[]) {
      const skillSlug = skill.name.toLowerCase().replace(/\s+/g, '-');
      const existingLevels = skillLevelMap.get(skillSlug);
      const existingLevelsArray = existingLevels ? Array.from(existingLevels) : [];
      
      const missingLevels = requiredLevels.filter(level => 
        !existingLevelsArray.includes(level)
      );

      if (missingLevels.length > 0) {
        // Determine priority based on how many levels are missing
        let priority: 'high' | 'medium' | 'low' = 'low';
        if (missingLevels.length === 4) {
          priority = 'high'; // No resources at all
        } else if (missingLevels.length >= 2) {
          priority = 'medium'; // Missing multiple levels
        }

        gaps.push({
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          missingLevels,
          existingLevels: existingLevelsArray,
          totalResources: existingLevelsArray.length * 6, // Approx 6 resources per level
          priority
        });
      }
    }

    // Sort gaps by priority (high first) then by number of missing levels
    gaps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.missingLevels.length - a.missingLevels.length;
    });

    const completeSkills = allSkills.length - gaps.length;
    const missingSkills = gaps.filter(g => g.priority === 'high').length;
    const partialSkills = gaps.length - missingSkills;

    const result: GapAnalysisResult = {
      totalSkills: allSkills.length,
      completeSkills,
      partialSkills,
      missingSkills,
      gaps
    };

    console.log('[Gap Analysis] Complete:', {
      total: result.totalSkills,
      complete: result.completeSkills,
      partial: result.partialSkills,
      missing: result.missingSkills
    });

    return result;
  } catch (error: any) {
    console.error('[Gap Analysis] Error:', error);
    throw error;
  }
}

/**
 * Get skills prioritized for next discovery batch
 */
export async function getPrioritizedSkillsForDiscovery(maxSkills: number = 25): Promise<{
  skillId: string;
  skillName: string;
  category: string;
  missingLevels: string[];
}[]> {
  const analysis = await analyzeSkillLevelGaps();
  
  // Prioritize:
  // 1. Skills with no resources (high priority)
  // 2. Skills missing multiple levels (medium priority)
  // 3. Skills missing single levels (low priority)
  
  const prioritized = analysis.gaps
    .slice(0, maxSkills)
    .map(gap => ({
      skillId: gap.skillId,
      skillName: gap.skillName,
      category: gap.category,
      missingLevels: gap.missingLevels
    }));

  return prioritized;
}

/**
 * Check if a skill already has resources for a specific level
 */
export async function hasLevelResources(skillName: string, level: string): Promise<boolean> {
  const skillSlug = skillName.toLowerCase().replace(/\s+/g, '-');
  
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('id')
    .ilike('file_name', `${skillSlug}%level${level.replace('-', '-')}%`)
    .limit(1);

  if (error) {
    console.error('[Gap Analysis] Error checking level:', error);
    return false;
  }

  return (data && data.length > 0);
}

