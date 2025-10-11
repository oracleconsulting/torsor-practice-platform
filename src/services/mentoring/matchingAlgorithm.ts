/**
 * Automated Mentor-Mentee Matching Algorithm
 * PROMPT 4 Implementation
 * 
 * Features:
 * - Identifies experts (Level 4-5) and learners (Interest 4-5, Level <3)
 * - VARK learning style compatibility
 * - Availability matching
 * - Max 3 mentees per mentor
 * - Match quality scoring
 */

// Types
export interface TeamMemberForMatching {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: SkillForMatching[];
  learningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'multimodal';
  availability?: AvailabilitySlot[];
  currentMentees?: number;
  maxMentees?: number;
}

export interface SkillForMatching {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  interestLevel?: number;
  targetLevel: number;
}

export interface AvailabilitySlot {
  dayOfWeek: string; // 'monday', 'tuesday', etc.
  startTime: string; // '09:00'
  endTime: string; // '17:00'
}

export interface MentorMatch {
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  matchedSkills: string[]; // Skill names
  matchScore: number; // 0-100
  varkCompatibility: number; // 0-100
  availabilityOverlap: number; // 0-100
  rationale: string;
  recommendedMeetingTime?: string;
  suggestedGoals: string[];
}

export interface MentorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  expertiseAreas: string[]; // Skill names where level >= 4
  expertiseLevels: { [skillName: string]: number };
  currentMentees: number;
  maxMentees: number;
  availableSlots: number;
  learningStyle?: string;
  yearsExperience?: number;
}

export interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  learningNeeds: string[]; // Skill names where interest >= 4 and level < 3
  interestLevels: { [skillName: string]: number };
  currentLevel: { [skillName: string]: number };
  learningStyle?: string;
  preferredMeetingTimes?: AvailabilitySlot[];
}

/**
 * Identify team members who are experts (Level 4-5 in at least one skill)
 */
export function identifyMentors(teamMembers: TeamMemberForMatching[]): MentorProfile[] {
  const mentors: MentorProfile[] = [];

  for (const member of teamMembers) {
    const expertSkills = member.skills.filter(s => s.currentLevel >= 4);
    
    if (expertSkills.length > 0) {
      const expertiseAreas = expertSkills.map(s => s.skillName);
      const expertiseLevels: { [key: string]: number } = {};
      expertSkills.forEach(s => {
        expertiseLevels[s.skillName] = s.currentLevel;
      });

      const maxMentees = member.maxMentees || 3;
      const currentMentees = member.currentMentees || 0;

      mentors.push({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        expertiseAreas,
        expertiseLevels,
        currentMentees,
        maxMentees,
        availableSlots: maxMentees - currentMentees,
        learningStyle: member.learningStyle,
        yearsExperience: calculateExperience(member)
      });
    }
  }

  // Sort by expertise (number of expert skills, then by level)
  return mentors.sort((a, b) => {
    const aTotal = Object.values(a.expertiseLevels).reduce((sum, level) => sum + level, 0);
    const bTotal = Object.values(b.expertiseLevels).reduce((sum, level) => sum + level, 0);
    return bTotal - aTotal;
  });
}

/**
 * Identify team members who need mentoring (Interest 4-5, Level <3)
 */
export function identifyLearners(teamMembers: TeamMemberForMatching[]): LearnerProfile[] {
  const learners: LearnerProfile[] = [];

  for (const member of teamMembers) {
    const learningNeeds = member.skills.filter(
      s => (s.interestLevel || 0) >= 4 && s.currentLevel < 3
    );

    if (learningNeeds.length > 0) {
      const needsAreas = learningNeeds.map(s => s.skillName);
      const interestLevels: { [key: string]: number } = {};
      const currentLevels: { [key: string]: number } = {};
      
      learningNeeds.forEach(s => {
        interestLevels[s.skillName] = s.interestLevel || 0;
        currentLevels[s.skillName] = s.currentLevel;
      });

      learners.push({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        learningNeeds: needsAreas,
        interestLevels,
        currentLevel: currentLevels,
        learningStyle: member.learningStyle,
        preferredMeetingTimes: member.availability
      });
    }
  }

  return learners;
}

/**
 * Calculate VARK compatibility score (0-100)
 */
export function calculateVARKCompatibility(
  mentorStyle?: string,
  learnerStyle?: string
): number {
  if (!mentorStyle || !learnerStyle) return 50; // Neutral if unknown

  // Exact match = 100%
  if (mentorStyle === learnerStyle) return 100;

  // Multimodal is compatible with everything
  if (mentorStyle === 'multimodal' || learnerStyle === 'multimodal') return 85;

  // Similar styles (visual/reading_writing have some overlap)
  const similarPairs = [
    ['visual', 'reading_writing'],
    ['auditory', 'reading_writing'],
    ['kinesthetic', 'visual']
  ];

  for (const pair of similarPairs) {
    if ((pair.includes(mentorStyle) && pair.includes(learnerStyle))) {
      return 70;
    }
  }

  // Different styles but can work
  return 50;
}

/**
 * Calculate availability overlap (0-100)
 */
export function calculateAvailabilityOverlap(
  mentorSlots?: AvailabilitySlot[],
  learnerSlots?: AvailabilitySlot[]
): number {
  if (!mentorSlots || !learnerSlots || mentorSlots.length === 0 || learnerSlots.length === 0) {
    return 50; // Neutral if unknown
  }

  let overlapMinutes = 0;
  let totalMinutes = 0;

  for (const mentorSlot of mentorSlots) {
    for (const learnerSlot of learnerSlots) {
      if (mentorSlot.dayOfWeek === learnerSlot.dayOfWeek) {
        const mentorStart = timeToMinutes(mentorSlot.startTime);
        const mentorEnd = timeToMinutes(mentorSlot.endTime);
        const learnerStart = timeToMinutes(learnerSlot.startTime);
        const learnerEnd = timeToMinutes(learnerSlot.endTime);

        const overlapStart = Math.max(mentorStart, learnerStart);
        const overlapEnd = Math.min(mentorEnd, learnerEnd);

        if (overlapEnd > overlapStart) {
          overlapMinutes += overlapEnd - overlapStart;
        }

        totalMinutes += mentorEnd - mentorStart;
      }
    }
  }

  if (totalMinutes === 0) return 0;
  return Math.min(100, (overlapMinutes / totalMinutes) * 100);
}

/**
 * Find best mentor-mentee matches
 */
export function findMentorMatches(
  teamMembers: TeamMemberForMatching[],
  learnerId?: string
): MentorMatch[] {
  const mentors = identifyMentors(teamMembers);
  const learners = identifyLearners(teamMembers);

  // Filter for specific learner if provided
  const targetLearners = learnerId 
    ? learners.filter(l => l.id === learnerId)
    : learners;

  const matches: MentorMatch[] = [];

  for (const learner of targetLearners) {
    const learnerMember = teamMembers.find(m => m.id === learner.id);
    if (!learnerMember) continue;

    for (const mentor of mentors) {
      // Skip if mentor has no available slots
      if (mentor.availableSlots <= 0) continue;

      // Skip if same person
      if (mentor.id === learner.id) continue;

      const mentorMember = teamMembers.find(m => m.id === mentor.id);
      if (!mentorMember) continue;

      // Find matching skills
      const matchedSkills = learner.learningNeeds.filter(
        need => mentor.expertiseAreas.includes(need)
      );

      if (matchedSkills.length === 0) continue;

      // Calculate match score components
      const skillMatchScore = (matchedSkills.length / learner.learningNeeds.length) * 40;
      const expertiseScore = matchedSkills.reduce((sum, skill) => {
        return sum + (mentor.expertiseLevels[skill] - 3) * 10; // Level 4 = 10, Level 5 = 20
      }, 0) / matchedSkills.length;
      
      const varkCompatibility = calculateVARKCompatibility(
        mentor.learningStyle,
        learner.learningStyle
      );
      const varkScore = (varkCompatibility / 100) * 20;

      const availabilityOverlap = calculateAvailabilityOverlap(
        mentorMember.availability,
        learnerMember.availability
      );
      const availabilityScore = (availabilityOverlap / 100) * 20;

      const interestScore = matchedSkills.reduce((sum, skill) => {
        return sum + (learner.interestLevels[skill] / 5) * 20;
      }, 0) / matchedSkills.length;

      const matchScore = Math.round(
        skillMatchScore + expertiseScore + varkScore + availabilityScore + interestScore
      );

      // Generate rationale
      const rationale = generateMatchRationale(
        mentor,
        learner,
        matchedSkills,
        varkCompatibility,
        availabilityOverlap
      );

      // Generate suggested goals
      const suggestedGoals = matchedSkills.map(skill => {
        const currentLevel = learner.currentLevel[skill];
        const targetLevel = Math.min(5, currentLevel + 2);
        return `Improve ${skill} from level ${currentLevel} to ${targetLevel}`;
      });

      matches.push({
        mentorId: mentor.id,
        mentorName: mentor.name,
        menteeId: learner.id,
        menteeName: learner.name,
        matchedSkills,
        matchScore,
        varkCompatibility,
        availabilityOverlap,
        rationale,
        suggestedGoals
      });
    }
  }

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get recommended mentor for a specific skill
 */
export function getRecommendedMentorForSkill(
  teamMembers: TeamMemberForMatching[],
  learnerId: string,
  skillName: string
): MentorMatch | null {
  const allMatches = findMentorMatches(teamMembers, learnerId);
  
  // Filter matches that include this skill
  const skillMatches = allMatches.filter(m => m.matchedSkills.includes(skillName));
  
  return skillMatches.length > 0 ? skillMatches[0] : null;
}

/**
 * Get all mentoring opportunities for a team member
 */
export function getMentoringOpportunities(
  teamMembers: TeamMemberForMatching[],
  memberId: string
): {
  asLearner: MentorMatch[];
  asMentor: MentorMatch[];
} {
  const allMatches = findMentorMatches(teamMembers);

  return {
    asLearner: allMatches.filter(m => m.menteeId === memberId).slice(0, 5),
    asMentor: allMatches.filter(m => m.mentorId === memberId).slice(0, 10)
  };
}

// Helper functions

function calculateExperience(member: TeamMemberForMatching): number {
  // Simple heuristic: average skill level * 2
  const avgLevel = member.skills.length > 0
    ? member.skills.reduce((sum, s) => sum + s.currentLevel, 0) / member.skills.length
    : 0;
  return Math.round(avgLevel * 2);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function generateMatchRationale(
  mentor: MentorProfile,
  learner: LearnerProfile,
  matchedSkills: string[],
  varkCompatibility: number,
  availabilityOverlap: number
): string {
  const parts: string[] = [];

  // Skill match
  if (matchedSkills.length === 1) {
    parts.push(`${mentor.name} is an expert in ${matchedSkills[0]}`);
  } else {
    parts.push(`${mentor.name} is an expert in ${matchedSkills.length} skills you want to learn`);
  }

  // VARK compatibility
  if (varkCompatibility >= 85) {
    parts.push('excellent learning style match');
  } else if (varkCompatibility >= 70) {
    parts.push('good learning style compatibility');
  }

  // Availability
  if (availabilityOverlap >= 70) {
    parts.push('strong schedule compatibility');
  } else if (availabilityOverlap >= 50) {
    parts.push('some schedule overlap');
  }

  // Experience
  if (mentor.yearsExperience && mentor.yearsExperience >= 8) {
    parts.push('highly experienced mentor');
  }

  return parts.join(', ').charAt(0).toUpperCase() + parts.join(', ').slice(1) + '.';
}

/**
 * Validate a potential match before creating relationship
 */
export function validateMatch(
  mentor: TeamMemberForMatching,
  learner: TeamMemberForMatching
): { valid: boolean; reason?: string } {
  // Can't mentor yourself
  if (mentor.id === learner.id) {
    return { valid: false, reason: 'Cannot mentor yourself' };
  }

  // Check mentor capacity
  const currentMentees = mentor.currentMentees || 0;
  const maxMentees = mentor.maxMentees || 3;
  if (currentMentees >= maxMentees) {
    return { valid: false, reason: 'Mentor has reached maximum mentee capacity' };
  }

  // Check for skill overlap
  const mentorExpertise = mentor.skills.filter(s => s.currentLevel >= 4);
  const learnerNeeds = learner.skills.filter(s => (s.interestLevel || 0) >= 4 && s.currentLevel < 3);
  
  const hasOverlap = mentorExpertise.some(ms => 
    learnerNeeds.some(ls => ls.skillId === ms.skillId)
  );

  if (!hasOverlap) {
    return { valid: false, reason: 'No matching skills between mentor expertise and learner needs' };
  }

  return { valid: true };
}

