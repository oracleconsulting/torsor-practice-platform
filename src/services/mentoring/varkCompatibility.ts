/**
 * Enhanced VARK Compatibility Scoring
 * Uses comprehensive VARK profile data with percentages for more accurate matching
 */

export interface VARKPercentages {
  visual: number;
  auditory: number;
  readWrite: number;
  kinesthetic: number;
}

export interface VARKProfileForMatching {
  percentages: VARKPercentages;
  dominantStyles: string[];
  learningType: string;
}

/**
 * Calculate enhanced VARK compatibility using percentage-based profiles
 * 
 * Scoring criteria:
 * - Same dominant style: +30 points
 * - Complementary styles (mentor multimodal): +20 points
 * - High overlap in percentages: +50 points max
 * 
 * @returns Score from 0-100
 */
export function calculateEnhancedVARKCompatibility(
  mentorProfile?: VARKProfileForMatching,
  menteeProfile?: VARKProfileForMatching
): number {
  // If either profile is missing, return neutral score
  if (!mentorProfile || !menteeProfile) return 50;

  let compatibilityScore = 0;

  // 1. Check for shared dominant styles (30 points per shared style, max 60)
  const sharedStyles = mentorProfile.dominantStyles.filter(style =>
    menteeProfile.dominantStyles.includes(style)
  );
  compatibilityScore += Math.min(sharedStyles.length * 30, 60);

  // 2. Multimodal mentor bonus (can adapt to mentee's style) - +20 points
  const mentorIsMultimodal = mentorProfile.dominantStyles.length >= 2;
  if (mentorIsMultimodal) {
    compatibilityScore += 20;
  }

  // 3. Calculate percentage overlap (0-50 points based on similarity)
  const percentageOverlap = calculatePercentageOverlap(
    mentorProfile.percentages,
    menteeProfile.percentages
  );
  compatibilityScore += Math.round(percentageOverlap * 50);

  // 4. Bimodal/Trimodal compatibility bonus
  const menteeIsMultimodal = menteeProfile.dominantStyles.length >= 2;
  if (mentorIsMultimodal && menteeIsMultimodal) {
    compatibilityScore += 10; // Both flexible learners
  }

  // Cap at 100
  return Math.min(100, compatibilityScore);
}

/**
 * Calculate how similar two VARK percentage profiles are
 * Returns a value from 0 (completely different) to 1 (identical)
 */
function calculatePercentageOverlap(
  profile1: VARKPercentages,
  profile2: VARKPercentages
): number {
  // Calculate the absolute difference for each style
  const visualDiff = Math.abs(profile1.visual - profile2.visual);
  const auditoryDiff = Math.abs(profile1.auditory - profile2.auditory);
  const readWriteDiff = Math.abs(profile1.readWrite - profile2.readWrite);
  const kinestheticDiff = Math.abs(profile1.kinesthetic - profile2.kinesthetic);

  // Average difference (0-100)
  const avgDifference = (visualDiff + auditoryDiff + readWriteDiff + kinestheticDiff) / 4;

  // Convert to similarity score (0-1)
  // 0% difference = 1.0 similarity, 100% difference = 0.0 similarity
  return 1 - (avgDifference / 100);
}

/**
 * Get detailed compatibility insights for display
 */
export function getVARKCompatibilityInsights(
  mentorProfile: VARKProfileForMatching,
  menteeProfile: VARKProfileForMatching
): {
  score: number;
  sharedStyles: string[];
  mentorStrengths: string[];
  recommendations: string[];
} {
  const score = calculateEnhancedVARKCompatibility(mentorProfile, menteeProfile);
  
  const sharedStyles = mentorProfile.dominantStyles.filter(style =>
    menteeProfile.dominantStyles.includes(style)
  );

  const mentorStrengths: string[] = [];
  const recommendations: string[] = [];

  // Identify mentor's teaching strengths based on their profile
  Object.entries(mentorProfile.percentages).forEach(([style, percentage]) => {
    if (percentage >= 40) {
      mentorStrengths.push(style);
    }
  });

  // Generate specific recommendations
  if (sharedStyles.length > 0) {
    recommendations.push(`Strong compatibility! You both prefer ${sharedStyles.join(' and ')} learning.`);
  }

  if (mentorProfile.dominantStyles.length >= 2) {
    recommendations.push(`Your mentor has a flexible teaching style and can adapt to your preferences.`);
  }

  if (menteeProfile.percentages.visual >= 40 && mentorProfile.percentages.visual >= 40) {
    recommendations.push(`Both of you are visual learners - expect lots of diagrams and demonstrations!`);
  }

  if (menteeProfile.percentages.kinesthetic >= 40 && mentorProfile.percentages.kinesthetic >= 40) {
    recommendations.push(`You both prefer hands-on learning - expect practical exercises and real-world projects.`);
  }

  if (menteeProfile.percentages.auditory >= 40) {
    recommendations.push(`Consider scheduling regular discussion sessions - you learn best through talking.`);
  }

  if (menteeProfile.percentages.readWrite >= 40) {
    recommendations.push(`Ask your mentor for written summaries and detailed documentation.`);
  }

  if (score < 50) {
    recommendations.push(`Different learning styles can work well - communicate your preferences early!`);
  }

  return {
    score,
    sharedStyles,
    mentorStrengths,
    recommendations
  };
}

/**
 * Suggest meeting format based on VARK profiles
 */
export function suggestMeetingFormat(
  mentorProfile: VARKProfileForMatching,
  menteeProfile: VARKProfileForMatching
): {
  format: 'in-person' | 'video-call' | 'phone' | 'async';
  reason: string;
} {
  const { percentages } = menteeProfile;

  // Kinesthetic learners benefit most from in-person
  if (percentages.kinesthetic >= 50) {
    return {
      format: 'in-person',
      reason: 'Kinesthetic learners benefit most from hands-on, in-person guidance.'
    };
  }

  // Visual learners work well with video
  if (percentages.visual >= 50) {
    return {
      format: 'video-call',
      reason: 'Visual learners can benefit from screen sharing and visual demonstrations.'
    };
  }

  // Auditory learners are fine with phone
  if (percentages.auditory >= 50) {
    return {
      format: 'phone',
      reason: 'Auditory learners learn effectively through verbal discussion.'
    };
  }

  // Read/Write learners can work async
  if (percentages.readWrite >= 50) {
    return {
      format: 'async',
      reason: 'Read/Write learners benefit from written communication and documentation.'
    };
  }

  // Default to video for multimodal
  return {
    format: 'video-call',
    reason: 'Video calls offer flexibility for multiple learning styles.'
  };
}

/**
 * Get mentor training recommendations based on mentee's VARK profile
 */
export function getMentorTrainingTips(
  menteeProfile: VARKProfileForMatching
): string[] {
  const tips: string[] = [];
  const { percentages } = menteeProfile;

  if (percentages.visual >= 40) {
    tips.push('📊 Use visual aids, diagrams, and screen sharing during sessions');
    tips.push('🎨 Encourage them to create visual summaries and mind maps');
  }

  if (percentages.auditory >= 40) {
    tips.push('🗣️ Spend time discussing concepts verbally');
    tips.push('🎧 Recommend podcasts and audio materials');
    tips.push('💬 Encourage them to explain concepts back to you');
  }

  if (percentages.readWrite >= 40) {
    tips.push('📝 Provide written summaries after each session');
    tips.push('📚 Share detailed documentation and reading materials');
    tips.push('✍️ Ask them to write reflection notes after meetings');
  }

  if (percentages.kinesthetic >= 40) {
    tips.push('🤲 Include hands-on exercises and real-world tasks');
    tips.push('🚶 Consider walking meetings or active sessions');
    tips.push('🎯 Let them practice immediately after learning');
  }

  return tips;
}

