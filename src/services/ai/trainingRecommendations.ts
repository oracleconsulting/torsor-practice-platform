/**
 * AI-Powered Training Recommendations Engine
 * Analyzes skill gaps, interest levels, and VARK learning styles
 * to generate personalized training plans
 */

// Types
export interface SkillGap {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  interestLevel: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: number; // 1-10
}

export interface TeamMemberProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  learningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'multimodal';
  skillGaps: SkillGap[];
  timeAvailability?: number; // Hours per week
  budgetConstraint?: number; // Max cost
}

export interface TrainingRecommendation {
  id: string;
  skillId: string;
  skillName: string;
  title: string;
  description: string;
  provider: 'internal' | 'external';
  providerName: string;
  format: 'video' | 'course' | 'workshop' | 'book' | 'practice' | 'mentoring' | 'mixed';
  learningFormats: string[]; // Specific to VARK
  estimatedHours: number;
  estimatedCost: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  successProbability: number; // 0-100%
  priority: 'quick-win' | 'strategic' | 'group-opportunity' | 'critical';
  rationale: string;
  expectedOutcome: string;
  matchScore: number; // 0-100 how well it matches the learner
  url?: string;
}

export interface LearningPath {
  id: string;
  memberId: string;
  memberName: string;
  createdAt: string;
  duration: number; // months
  totalHours: number;
  totalCost: number;
  recommendations: TrainingRecommendation[];
  milestones: Milestone[];
  successProbability: number;
}

export interface Milestone {
  month: number;
  title: string;
  description: string;
  skills: string[];
  estimatedHours: number;
  expectedLevel: number;
}

export interface RecommendationAnalysis {
  topRecommendations: TrainingRecommendation[];
  quickWins: TrainingRecommendation[];
  strategicInvestments: TrainingRecommendation[];
  groupOpportunities: GroupTrainingOpportunity[];
  totalEstimatedHours: number;
  totalEstimatedCost: number;
  averageSuccessProbability: number;
}

export interface GroupTrainingOpportunity {
  skillName: string;
  members: string[];
  memberCount: number;
  averageGap: number;
  recommendation: TrainingRecommendation;
  costSavings: number; // vs individual training
}

/**
 * Calculate skill criticality based on business impact
 */
function calculateCriticality(
  gap: number,
  requiredLevel: number,
  businessImpact: number
): 'low' | 'medium' | 'high' | 'critical' {
  const criticalityScore = (gap * 2) + (requiredLevel * 1.5) + businessImpact;
  
  if (criticalityScore >= 15) return 'critical';
  if (criticalityScore >= 10) return 'high';
  if (criticalityScore >= 6) return 'medium';
  return 'low';
}

/**
 * Get training format recommendations based on VARK learning style
 */
function getVARKFormats(learningStyle?: string): string[] {
  const formats: { [key: string]: string[] } = {
    visual: [
      'Video tutorials with demonstrations',
      'Infographics and visual guides',
      'Flowcharts and diagrams',
      'Screen recording walkthroughs',
      'Visual case studies'
    ],
    auditory: [
      'Podcasts and audio courses',
      'Live webinars and lectures',
      'Discussion groups',
      'One-on-one mentoring sessions',
      'Q&A sessions'
    ],
    reading_writing: [
      'Written courses and textbooks',
      'Technical documentation',
      'Written exercises and worksheets',
      'Blog posts and articles',
      'Note-taking workshops'
    ],
    kinesthetic: [
      'Hands-on workshops',
      'Practice exercises and labs',
      'Real-world projects',
      'Simulations and role-plays',
      'On-the-job training'
    ],
    multimodal: [
      'Mixed-format comprehensive courses',
      'Blended learning programs',
      'Interactive online courses',
      'Project-based learning',
      'Multi-modal bootcamps'
    ]
  };

  return formats[learningStyle || 'multimodal'] || formats.multimodal;
}

/**
 * Calculate success probability based on multiple factors
 */
function calculateSuccessProbability(
  gap: number,
  interestLevel: number,
  learningStyleMatch: number,
  timeAvailable: number,
  estimatedHours: number
): number {
  // Base probability starts at 50%
  let probability = 50;

  // Interest level impact (0-25 points)
  probability += (interestLevel / 5) * 25;

  // Gap size impact (smaller gaps = higher success)
  const gapFactor = Math.max(0, 5 - gap) / 5;
  probability += gapFactor * 15;

  // Learning style match (0-10 points)
  probability += learningStyleMatch * 10;

  // Time availability (if sufficient time = +10, insufficient = -20)
  if (timeAvailable >= estimatedHours) {
    probability += 10;
  } else {
    probability -= 20;
  }

  return Math.max(0, Math.min(100, Math.round(probability)));
}

/**
 * Calculate match score for a recommendation
 */
function calculateMatchScore(
  gap: SkillGap,
  recommendation: Partial<TrainingRecommendation>,
  learningStyle?: string,
  timeAvailable?: number,
  budget?: number
): number {
  let score = 0;

  // Interest level match (0-30 points)
  score += (gap.interestLevel / 5) * 30;

  // Gap size appropriateness (0-20 points)
  const difficulty = recommendation.difficulty || 'intermediate';
  const gapAppropriate = 
    (gap.gap <= 2 && difficulty === 'beginner') ||
    (gap.gap === 3 && difficulty === 'intermediate') ||
    (gap.gap >= 4 && difficulty === 'advanced');
  score += gapAppropriate ? 20 : 10;

  // Learning style match (0-25 points)
  if (learningStyle && recommendation.format) {
    const varkFormats = getVARKFormats(learningStyle);
    const formatMatch = varkFormats.some(f => 
      f.toLowerCase().includes(recommendation.format || '')
    );
    score += formatMatch ? 25 : 10;
  }

  // Time feasibility (0-15 points)
  if (timeAvailable && recommendation.estimatedHours) {
    const timeFeasible = timeAvailable >= recommendation.estimatedHours / 4; // Can complete in 4 weeks
    score += timeFeasible ? 15 : 5;
  }

  // Budget feasibility (0-10 points)
  if (budget && recommendation.estimatedCost !== undefined) {
    const affordable = recommendation.estimatedCost <= budget;
    score += affordable ? 10 : 0;
  }

  return Math.round(score);
}

/**
 * Generate training recommendations for a skill gap
 */
function generateRecommendationsForSkill(
  gap: SkillGap,
  profile: TeamMemberProfile
): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];
  const varkFormats = getVARKFormats(profile.learningStyle);

  // Determine priority
  let priority: TrainingRecommendation['priority'] = 'strategic';
  if (gap.interestLevel >= 4 && gap.gap <= 2) {
    priority = 'quick-win';
  } else if (gap.criticality === 'critical') {
    priority = 'critical';
  }

  // Generate different types of recommendations based on gap size
  if (gap.gap <= 2) {
    // Small gap - quick courses and practice
    recommendations.push({
      id: `${gap.skillId}-practice`,
      skillId: gap.skillId,
      skillName: gap.skillName,
      title: `${gap.skillName} Practice Exercises`,
      description: `Hands-on exercises to quickly build proficiency in ${gap.skillName}`,
      provider: 'internal',
      providerName: 'Team Resources',
      format: profile.learningStyle === 'kinesthetic' ? 'practice' : 'mixed',
      learningFormats: varkFormats.slice(0, 2),
      estimatedHours: 5 * gap.gap,
      estimatedCost: 0,
      difficulty: 'beginner',
      successProbability: calculateSuccessProbability(
        gap.gap,
        gap.interestLevel,
        1,
        profile.timeAvailability || 10,
        5 * gap.gap
      ),
      priority,
      rationale: `Small skill gap with ${gap.interestLevel >= 4 ? 'high' : 'moderate'} interest level`,
      expectedOutcome: `Achieve level ${gap.currentLevel + gap.gap} in ${gap.skillName}`,
      matchScore: 0
    });
  }

  if (gap.gap >= 2) {
    // Medium/Large gap - comprehensive course
    const courseHours = gap.gap * 15;
    const courseCost = gap.gap * 200;
    
    recommendations.push({
      id: `${gap.skillId}-course`,
      skillId: gap.skillId,
      skillName: gap.skillName,
      title: `Professional ${gap.skillName} Certification`,
      description: `Comprehensive course covering ${gap.skillName} from fundamentals to advanced concepts`,
      provider: 'external',
      providerName: profile.learningStyle === 'reading_writing' ? 'Coursera' : 
                    profile.learningStyle === 'visual' ? 'Udemy' :
                    profile.learningStyle === 'auditory' ? 'MasterClass' : 'LinkedIn Learning',
      format: 'course',
      learningFormats: varkFormats,
      estimatedHours: courseHours,
      estimatedCost: courseCost,
      difficulty: gap.gap <= 2 ? 'intermediate' : 'advanced',
      successProbability: calculateSuccessProbability(
        gap.gap,
        gap.interestLevel,
        1,
        profile.timeAvailability || 10,
        courseHours
      ),
      priority,
      rationale: `Significant skill gap requiring structured learning`,
      expectedOutcome: `Build strong foundation and reach level ${gap.requiredLevel}`,
      matchScore: 0
    });
  }

  // Always include mentoring option for high-criticality skills
  if (gap.criticality === 'critical' || gap.criticality === 'high') {
    recommendations.push({
      id: `${gap.skillId}-mentoring`,
      skillId: gap.skillId,
      skillName: gap.skillName,
      title: `${gap.skillName} Mentoring Program`,
      description: `One-on-one mentoring with an experienced ${gap.skillName} practitioner`,
      provider: 'internal',
      providerName: 'Internal Mentors',
      format: 'mentoring',
      learningFormats: ['Weekly mentoring sessions', 'Project-based learning', 'Real-time feedback'],
      estimatedHours: gap.gap * 10,
      estimatedCost: 0,
      difficulty: gap.currentLevel <= 2 ? 'beginner' : 'intermediate',
      successProbability: calculateSuccessProbability(
        gap.gap,
        gap.interestLevel,
        0.9,
        profile.timeAvailability || 10,
        gap.gap * 10
      ),
      priority: 'strategic',
      rationale: `Critical skill requiring personalized guidance`,
      expectedOutcome: `Rapid skill development with expert support`,
      matchScore: 0
    });
  }

  // Calculate match scores
  recommendations.forEach(rec => {
    rec.matchScore = calculateMatchScore(
      gap,
      rec,
      profile.learningStyle,
      profile.timeAvailability,
      profile.budgetConstraint
    );
  });

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Main function: Generate AI-powered training recommendations
 */
export async function generateTrainingRecommendations(
  profile: TeamMemberProfile
): Promise<RecommendationAnalysis> {
  // Ensure criticality is set for all gaps
  profile.skillGaps = profile.skillGaps.map(gap => ({
    ...gap,
    criticality: gap.criticality || calculateCriticality(
      gap.gap,
      gap.requiredLevel,
      gap.businessImpact || 5
    )
  }));

  // Generate recommendations for each skill gap
  const allRecommendations: TrainingRecommendation[] = [];
  
  for (const gap of profile.skillGaps) {
    if (gap.gap > 0) {
      const recs = generateRecommendationsForSkill(gap, profile);
      allRecommendations.push(...recs);
    }
  }

  // Sort by match score
  allRecommendations.sort((a, b) => b.matchScore - a.matchScore);

  // Categorize recommendations
  const topRecommendations = allRecommendations.slice(0, 5);
  
  const quickWins = allRecommendations.filter(r => 
    r.priority === 'quick-win' && r.successProbability >= 70
  ).slice(0, 3);

  const strategicInvestments = allRecommendations.filter(r =>
    (r.priority === 'strategic' || r.priority === 'critical') &&
    r.estimatedHours >= 20
  ).slice(0, 3);

  // Calculate totals
  const totalEstimatedHours = topRecommendations.reduce((sum, r) => sum + r.estimatedHours, 0);
  const totalEstimatedCost = topRecommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
  const averageSuccessProbability = Math.round(
    topRecommendations.reduce((sum, r) => sum + r.successProbability, 0) / topRecommendations.length
  );

  return {
    topRecommendations,
    quickWins,
    strategicInvestments,
    groupOpportunities: [], // Will be populated by team-wide analysis
    totalEstimatedHours,
    totalEstimatedCost,
    averageSuccessProbability
  };
}

/**
 * Analyze team for group training opportunities
 */
export function identifyGroupTrainingOpportunities(
  team: TeamMemberProfile[]
): GroupTrainingOpportunity[] {
  const skillCounts = new Map<string, {
    members: TeamMemberProfile[];
    totalGap: number;
  }>();

  // Group members by skill gaps
  team.forEach(member => {
    member.skillGaps.forEach(gap => {
      if (gap.gap >= 2) { // Only significant gaps
        const existing = skillCounts.get(gap.skillName) || { members: [], totalGap: 0 };
        existing.members.push(member);
        existing.totalGap += gap.gap;
        skillCounts.set(gap.skillName, existing);
      }
    });
  });

  // Identify skills where 3+ people need training
  const opportunities: GroupTrainingOpportunity[] = [];
  
  skillCounts.forEach((data, skillName) => {
    if (data.members.length >= 3) {
      const averageGap = data.totalGap / data.members.length;
      const individualCost = data.members.length * 500; // Assume £500 per person individual
      const groupCost = 1000 + (data.members.length * 200); // Group rate
      
      opportunities.push({
        skillName,
        members: data.members.map(m => m.name),
        memberCount: data.members.length,
        averageGap,
        recommendation: {
          id: `group-${skillName}`,
          skillId: 'group',
          skillName,
          title: `Team ${skillName} Workshop`,
          description: `Group training workshop for ${data.members.length} team members`,
          provider: 'external',
          providerName: 'Professional Training Provider',
          format: 'workshop',
          learningFormats: ['Interactive workshop', 'Group exercises', 'Team projects'],
          estimatedHours: 16,
          estimatedCost: groupCost,
          difficulty: 'intermediate',
          successProbability: 85,
          priority: 'group-opportunity',
          rationale: `${data.members.length} team members need training in ${skillName}`,
          expectedOutcome: `Team-wide skill improvement with shared learning`,
          matchScore: 95
        },
        costSavings: individualCost - groupCost
      });
    }
  });

  return opportunities.sort((a, b) => b.costSavings - a.costSavings);
}

/**
 * Generate a 6-month learning path
 */
export async function generateLearningPath(
  profile: TeamMemberProfile,
  recommendations: TrainingRecommendation[]
): Promise<LearningPath> {
  const weeklyHours = profile.timeAvailability || 5;
  const path: LearningPath = {
    id: `path-${profile.id}-${Date.now()}`,
    memberId: profile.id,
    memberName: profile.name,
    createdAt: new Date().toISOString(),
    duration: 6,
    totalHours: 0,
    totalCost: 0,
    recommendations: [],
    milestones: [],
    successProbability: 0
  };

  // Sort by priority and match score
  const sortedRecs = [...recommendations].sort((a, b) => {
    const priorityWeight = { 'critical': 4, 'quick-win': 3, 'strategic': 2, 'group-opportunity': 1 };
    const aPriority = priorityWeight[a.priority] || 0;
    const bPriority = priorityWeight[b.priority] || 0;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return b.matchScore - a.matchScore;
  });

  // Allocate recommendations across 6 months
  let currentMonth = 1;
  let monthlyHours = weeklyHours * 4;
  let usedHours = 0;

  const monthlyAllocations: { [key: number]: TrainingRecommendation[] } = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  };

  for (const rec of sortedRecs) {
    // Check if we can fit this in current month
    if (usedHours + rec.estimatedHours <= monthlyHours) {
      monthlyAllocations[currentMonth].push(rec);
      usedHours += rec.estimatedHours;
      path.recommendations.push(rec);
      path.totalHours += rec.estimatedHours;
      path.totalCost += rec.estimatedCost;
    } else {
      // Move to next month
      currentMonth++;
      if (currentMonth > 6) break; // 6-month limit
      usedHours = rec.estimatedHours;
      monthlyAllocations[currentMonth].push(rec);
      path.recommendations.push(rec);
      path.totalHours += rec.estimatedHours;
      path.totalCost += rec.estimatedCost;
    }
  }

  // Generate milestones
  for (let month = 1; month <= 6; month++) {
    const recs = monthlyAllocations[month];
    if (recs.length > 0) {
      path.milestones.push({
        month,
        title: `Month ${month}: ${recs.map(r => r.skillName).join(', ')}`,
        description: recs.map(r => r.title).join(' • '),
        skills: [...new Set(recs.map(r => r.skillName))],
        estimatedHours: recs.reduce((sum, r) => sum + r.estimatedHours, 0),
        expectedLevel: Math.min(5, Math.ceil(month / 2) + 2)
      });
    }
  }

  // Calculate overall success probability
  path.successProbability = Math.round(
    path.recommendations.reduce((sum, r) => sum + r.successProbability, 0) / 
    (path.recommendations.length || 1)
  );

  return path;
}

