/**
 * CPD Discovery Service
 * Integrates Perplexity AI with database to auto-populate resources
 */

import { supabase } from '@/lib/supabase/client';
import {
  discoverKnowledgeDocuments,
  discoverTrainingCourses,
  type KnowledgeDocumentDiscovery,
  type CourseDiscovery
} from '@/lib/ai/perplexity-service';

export interface DiscoveryResult {
  success: boolean;
  knowledgeDocsCreated: number;
  coursesCreated: number;
  errors: string[];
}

/**
 * Discover and add resources for a specific skill
 */
export async function discoverResourcesForSkill(
  skillId: string,
  skillName: string,
  skillCategory: string,
  currentLevel: number = 0,
  targetLevel: number = 4
): Promise<DiscoveryResult> {
  console.log(`[CPD Discovery] Starting discovery for: ${skillName}`);

  const result: DiscoveryResult = {
    success: false,
    knowledgeDocsCreated: 0,
    coursesCreated: 0,
    errors: []
  };

  try {
    // Discover knowledge documents
    console.log(`[CPD Discovery] Searching for knowledge documents...`);
    const knowledgeDocs = await discoverKnowledgeDocuments(skillName, skillCategory, 2);
    
    // Discover training courses
    console.log(`[CPD Discovery] Searching for training courses...`);
    const courses = await discoverTrainingCourses(skillName, skillCategory, currentLevel, targetLevel, 3);

    console.log(`[CPD Discovery] Found: ${knowledgeDocs.length} docs, ${courses.length} courses`);

    // Get current user for attribution
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      result.errors.push('User not authenticated');
      return result;
    }

    // Get practice member ID
    const { data: member } = await supabase
      .from('practice_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      result.errors.push('Practice member not found');
      return result;
    }

    // Insert knowledge documents
    for (const doc of knowledgeDocs) {
      try {
        // Determine document type based on content
        let documentType = 'guide';
        const titleLower = doc.title.toLowerCase();
        if (titleLower.includes('case study') || titleLower.includes('example')) {
          documentType = 'case_study';
        } else if (titleLower.includes('template') || titleLower.includes('framework')) {
          documentType = 'template';
        } else if (titleLower.includes('best practice') || titleLower.includes('guidance')) {
          documentType = 'guide';
        } else if (titleLower.includes('update') || titleLower.includes('news')) {
          documentType = 'notes';
        }

        const { error } = await (supabase
          .from('knowledge_documents') as any)
          .insert({
            uploaded_by: (member as any).id,
            title: doc.title,
            summary: doc.summary,
            document_type: documentType,
            file_name: `${skillName.toLowerCase().replace(/\s+/g, '-')}-${documentType}.md`,
            file_path: doc.sourceUrl, // Store source URL in file_path
            tags: doc.tags,
            skill_categories: doc.skillCategories.length > 0 ? doc.skillCategories : [skillCategory],
            is_public: true,
            approved_by: (member as any).id, // Auto-approve AI discoveries
            approved_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('[CPD Discovery] Error creating knowledge doc:', error);
          result.errors.push(`Knowledge doc "${doc.title}": ${error.message}`);
        } else {
          result.knowledgeDocsCreated++;
          console.log(`[CPD Discovery] ✅ Created knowledge doc: ${doc.title}`);
        }
      } catch (error: any) {
        result.errors.push(`Knowledge doc error: ${error.message}`);
      }
    }

    // Insert external courses
    for (const course of courses) {
      try {
        const { error } = await (supabase
          .from('cpd_external_resources') as any)
          .insert({
            title: course.title,
            provider: course.provider,
            url: course.url,
            description: course.description,
            type: 'course',
            cost: course.cost,
            currency: course.currency,
            duration: `${course.durationHours} hours`,
            skill_categories: course.skillCategories.length > 0 ? course.skillCategories : [skillCategory],
            recommended_for: [course.skillLevel],
            accredited_by: course.accreditation,
            cpd_hours: course.durationHours,
            is_active: true,
            added_by: (member as any).id,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('[CPD Discovery] Error creating course:', error);
          result.errors.push(`Course "${course.title}": ${error.message}`);
        } else {
          result.coursesCreated++;
          console.log(`[CPD Discovery] ✅ Created course: ${course.title}`);
        }
      } catch (error: any) {
        result.errors.push(`Course error: ${error.message}`);
      }
    }

    result.success = (result.knowledgeDocsCreated + result.coursesCreated) > 0;

    console.log(`[CPD Discovery] ✅ Complete: ${result.knowledgeDocsCreated} docs, ${result.coursesCreated} courses`);
    
    return result;
  } catch (error: any) {
    console.error('[CPD Discovery] Fatal error:', error);
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

/**
 * Discover resources for all skills that don't have any
 */
export async function discoverResourcesForAllSkills(maxSkills: number = 10): Promise<{
  processed: number;
  totalResources: number;
  errors: string[];
}> {
  console.log(`[CPD Discovery] Starting batch discovery for up to ${maxSkills} skills`);

  const summary = {
    processed: 0,
    totalResources: 0,
    errors: [] as string[]
  };

  try {
    // Get all skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level')
      .order('category')
      .limit(maxSkills);

    if (skillsError) {
      summary.errors.push(`Failed to fetch skills: ${skillsError.message}`);
      return summary;
    }

    if (!skills || skills.length === 0) {
      summary.errors.push('No skills found in database');
      return summary;
    }

    console.log(`[CPD Discovery] Found ${skills.length} skills to process`);

    // Process each skill
    for (const skill of skills as any[]) {
      try {
        console.log(`[CPD Discovery] Processing skill: ${skill.name}`);

        const result = await discoverResourcesForSkill(
          skill.id,
          skill.name,
          skill.category,
          0,
          skill.required_level || 4
        );

        summary.processed++;
        summary.totalResources += result.knowledgeDocsCreated + result.coursesCreated;
        
        if (result.errors.length > 0) {
          summary.errors.push(`${skill.name}: ${result.errors.join(', ')}`);
        }

        // Rate limiting - wait 2 seconds between API calls
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        summary.errors.push(`${skill.name}: ${error.message}`);
      }
    }

    console.log(`[CPD Discovery] ✅ Batch complete: ${summary.processed} skills, ${summary.totalResources} resources`);
    
    // Log summary for debugging
    if (summary.errors.length > 0) {
      console.warn(`[CPD Discovery] ⚠️ Encountered ${summary.errors.length} errors:`, summary.errors);
    }

    return summary;
  } catch (error: any) {
    console.error('[CPD Discovery] Batch discovery failed:', error);
    summary.errors.push(`Batch error: ${error.message}`);
    return summary;
  }
}

/**
 * Discover resources specifically for a member's skill gaps
 */
export async function discoverResourcesForMember(memberId: string): Promise<DiscoveryResult> {
  console.log(`[CPD Discovery] Starting member-specific discovery: ${memberId}`);

  const result: DiscoveryResult = {
    success: false,
    knowledgeDocsCreated: 0,
    coursesCreated: 0,
    errors: []
  };

  try {
    // Get member's skill gaps (current_level < 4)
    const { data: gaps, error: gapsError } = await supabase
      .from('skill_assessments')
      .select(`
        skill_id,
        current_level,
        skills:skill_id (
          id,
          name,
          category,
          required_level
        )
      `)
      .eq('team_member_id', memberId)
      .lt('current_level', 4)
      .limit(5); // Process top 5 gaps only

    if (gapsError) {
      result.errors.push(`Failed to fetch skill gaps: ${gapsError.message}`);
      return result;
    }

    if (!gaps || gaps.length === 0) {
      result.errors.push('No skill gaps found for member');
      return result;
    }

    console.log(`[CPD Discovery] Found ${gaps.length} skill gaps for member`);

    // Discover resources for each gap
    for (const gap of gaps as any[]) {
      const skill = gap.skills;
      if (!skill) continue;

      try {
        const gapResult = await discoverResourcesForSkill(
          skill.id,
          skill.name,
          skill.category,
          gap.current_level,
          skill.required_level || 4
        );

        result.knowledgeDocsCreated += gapResult.knowledgeDocsCreated;
        result.coursesCreated += gapResult.coursesCreated;
        result.errors.push(...gapResult.errors);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        result.errors.push(`${skill.name}: ${error.message}`);
      }
    }

    result.success = (result.knowledgeDocsCreated + result.coursesCreated) > 0;

    console.log(`[CPD Discovery] ✅ Member discovery complete: ${result.knowledgeDocsCreated} docs, ${result.coursesCreated} courses`);

    return result;
  } catch (error: any) {
    console.error('[CPD Discovery] Member discovery failed:', error);
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

/**
 * Get statistics on discovered resources
 */
export async function getDiscoveryStats(): Promise<{
  totalKnowledgeDocs: number;
  totalExternalCourses: number;
  skillsCovered: number;
  categoriesRepresented: string[];
}> {
  try {
    // Count knowledge documents
    const { count: docsCount } = await supabase
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true });

    // Count external courses
    const { count: coursesCount } = await supabase
      .from('cpd_external_resources')
      .select('*', { count: 'exact', head: true });

    // Get unique skill categories
    const { data: docs } = await supabase
      .from('knowledge_documents')
      .select('skill_categories');

    const { data: courses } = await supabase
      .from('cpd_external_resources')
      .select('skill_categories');

    const allCategories = new Set<string>();
    
    (docs as any)?.forEach((doc: any) => {
      doc.skill_categories?.forEach((cat: string) => allCategories.add(cat));
    });
    
    (courses as any)?.forEach((course: any) => {
      course.skill_categories?.forEach((cat: string) => allCategories.add(cat));
    });

    return {
      totalKnowledgeDocs: docsCount || 0,
      totalExternalCourses: coursesCount || 0,
      skillsCovered: allCategories.size,
      categoriesRepresented: Array.from(allCategories).sort()
    };
  } catch (error) {
    console.error('[CPD Discovery] Failed to get stats:', error);
    return {
      totalKnowledgeDocs: 0,
      totalExternalCourses: 0,
      skillsCovered: 0,
      categoriesRepresented: []
    };
  }
}

