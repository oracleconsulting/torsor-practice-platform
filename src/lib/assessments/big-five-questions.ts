/**
 * Big Five (OCEAN) Professional Personality Assessment
 * 30 questions measuring Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
 * Designed specifically for professional/workplace context
 */

export interface PersonalityQuestion {
  id: number;
  trait: 'O' | 'C' | 'E' | 'A' | 'N';
  facet: string;
  question: string;
  reverse_scored: boolean;
}

export interface BigFiveProfile {
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  emotionalStability: number;
  facets: Record<string, number>;
  profile: string;
  dominant_traits: string[];
  work_style: string;
  communication_style: string;
}

// Complete 30-question assessment (6 questions per trait)
export const professionalBigFiveQuestions: PersonalityQuestion[] = [
  // ============================================
  // OPENNESS TO EXPERIENCE (Questions 1-6)
  // ============================================
  {
    id: 1,
    trait: 'O',
    facet: 'intellectual_curiosity',
    question: "I enjoy exploring new approaches to solve client problems",
    reverse_scored: false
  },
  {
    id: 2,
    trait: 'O',
    facet: 'creativity',
    question: "I prefer following established procedures rather than creating new ones",
    reverse_scored: true
  },
  {
    id: 3,
    trait: 'O',
    facet: 'aesthetic_appreciation',
    question: "I value innovative solutions even if they challenge traditional methods",
    reverse_scored: false
  },
  {
    id: 4,
    trait: 'O',
    facet: 'adventurousness',
    question: "I feel uncomfortable when processes or systems change at work",
    reverse_scored: true
  },
  {
    id: 5,
    trait: 'O',
    facet: 'abstract_thinking',
    question: "I enjoy discussions about theoretical concepts and future possibilities",
    reverse_scored: false
  },
  {
    id: 6,
    trait: 'O',
    facet: 'intellectual_flexibility',
    question: "I find it difficult to adapt when industry regulations or standards change",
    reverse_scored: true
  },

  // ============================================
  // CONSCIENTIOUSNESS (Questions 7-12)
  // ============================================
  {
    id: 7,
    trait: 'C',
    facet: 'orderliness',
    question: "I keep detailed records and documentation for all my work",
    reverse_scored: false
  },
  {
    id: 8,
    trait: 'C',
    facet: 'self_discipline',
    question: "I sometimes miss deadlines when work gets overwhelming",
    reverse_scored: true
  },
  {
    id: 9,
    trait: 'C',
    facet: 'achievement_striving',
    question: "I consistently set and work toward ambitious professional goals",
    reverse_scored: false
  },
  {
    id: 10,
    trait: 'C',
    facet: 'dutifulness',
    question: "I occasionally take shortcuts if they won't significantly impact the outcome",
    reverse_scored: true
  },
  {
    id: 11,
    trait: 'C',
    facet: 'deliberation',
    question: "I thoroughly review all details before submitting any deliverable",
    reverse_scored: false
  },
  {
    id: 12,
    trait: 'C',
    facet: 'self_efficacy',
    question: "I often feel overwhelmed by complex multi-step projects",
    reverse_scored: true
  },

  // ============================================
  // EXTRAVERSION (Questions 13-18)
  // ============================================
  {
    id: 13,
    trait: 'E',
    facet: 'assertiveness',
    question: "I feel energized after client meetings and presentations",
    reverse_scored: false
  },
  {
    id: 14,
    trait: 'E',
    facet: 'sociability',
    question: "I prefer working independently rather than in team settings",
    reverse_scored: true
  },
  {
    id: 15,
    trait: 'E',
    facet: 'enthusiasm',
    question: "I actively seek opportunities to lead team discussions and projects",
    reverse_scored: false
  },
  {
    id: 16,
    trait: 'E',
    facet: 'gregariousness',
    question: "I find networking events and professional gatherings draining",
    reverse_scored: true
  },
  {
    id: 17,
    trait: 'E',
    facet: 'activity_level',
    question: "I thrive in fast-paced environments with multiple concurrent projects",
    reverse_scored: false
  },
  {
    id: 18,
    trait: 'E',
    facet: 'positive_emotions',
    question: "I prefer to keep professional interactions formal and task-focused",
    reverse_scored: true
  },

  // ============================================
  // AGREEABLENESS (Questions 19-24)
  // ============================================
  {
    id: 19,
    trait: 'A',
    facet: 'trust',
    question: "I believe most colleagues have good intentions and can be relied upon",
    reverse_scored: false
  },
  {
    id: 20,
    trait: 'A',
    facet: 'cooperation',
    question: "I find it important to stand my ground even when it creates tension",
    reverse_scored: true
  },
  {
    id: 21,
    trait: 'A',
    facet: 'altruism',
    question: "I regularly offer to help colleagues even when it's not my responsibility",
    reverse_scored: false
  },
  {
    id: 22,
    trait: 'A',
    facet: 'modesty',
    question: "I make sure my contributions and achievements are recognized",
    reverse_scored: true
  },
  {
    id: 23,
    trait: 'A',
    facet: 'sympathy',
    question: "I consider how decisions will affect team members' workload and wellbeing",
    reverse_scored: false
  },
  {
    id: 24,
    trait: 'A',
    facet: 'straightforwardness',
    question: "Sometimes being strategic with information sharing is necessary for success",
    reverse_scored: true
  },

  // ============================================
  // NEUROTICISM / EMOTIONAL STABILITY (Questions 25-30)
  // ============================================
  {
    id: 25,
    trait: 'N',
    facet: 'anxiety',
    question: "I remain calm and focused even when facing tight deadlines",
    reverse_scored: true
  },
  {
    id: 26,
    trait: 'N',
    facet: 'anger',
    question: "I get frustrated when colleagues don't meet my quality standards",
    reverse_scored: false
  },
  {
    id: 27,
    trait: 'N',
    facet: 'depression',
    question: "I maintain a positive outlook even during challenging projects",
    reverse_scored: true
  },
  {
    id: 28,
    trait: 'N',
    facet: 'self_consciousness',
    question: "I worry about how others perceive my professional performance",
    reverse_scored: false
  },
  {
    id: 29,
    trait: 'N',
    facet: 'vulnerability',
    question: "I handle unexpected changes and crises with confidence",
    reverse_scored: true
  },
  {
    id: 30,
    trait: 'N',
    facet: 'stress_tolerance',
    question: "Work pressures often affect my mood outside of office hours",
    reverse_scored: false
  }
];

// Response scale
export const responseScale = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" }
];

// Trait labels for UI
export const traitLabels = {
  'O': 'Openness',
  'C': 'Conscientiousness',
  'E': 'Extraversion',
  'A': 'Agreeableness',
  'N': 'Emotional Stability' // Note: We show inverse for user-friendliness
};

/**
 * Calculate Big Five scores from responses
 */
export function calculateBigFiveScores(responses: number[]): BigFiveProfile {
  if (responses.length !== 30) {
    throw new Error('All 30 questions must be answered');
  }

  const scores = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0
  };
  
  const facetScores: Record<string, number[]> = {};
  
  professionalBigFiveQuestions.forEach((question, index) => {
    let score = responses[index];
    
    // Apply reverse scoring where needed
    if (question.reverse_scored) {
      score = 6 - score; // Reverses 1-5 scale to 5-1
    }
    
    // Map trait letter to full name
    const traitName = 
      question.trait === 'O' ? 'openness' :
      question.trait === 'C' ? 'conscientiousness' :
      question.trait === 'E' ? 'extraversion' :
      question.trait === 'A' ? 'agreeableness' : 'neuroticism';
    
    // Add to trait total
    scores[traitName] += score;
    
    // Track facet scores
    if (!facetScores[question.facet]) {
      facetScores[question.facet] = [];
    }
    facetScores[question.facet].push(score);
  });
  
  // Convert to 0-100 scale (6 questions * 5 max score = 30 per trait)
  Object.keys(scores).forEach(trait => {
    scores[trait as keyof typeof scores] = Math.round((scores[trait as keyof typeof scores] / 30) * 100);
  });
  
  // Calculate facet averages (each facet has 1 question, so score is already the value)
  const facetAverages: Record<string, number> = {};
  Object.keys(facetScores).forEach(facet => {
    const values = facetScores[facet];
    facetAverages[facet] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 20); // Scale to 0-100
  });
  
  // Determine emotional stability (inverse of neuroticism)
  const emotionalStability = 100 - scores.neuroticism;
  
  // Get dominant traits
  const dominant_traits = getTopTraits(scores);
  
  // Determine work style
  const work_style = determineWorkStyle(scores);
  
  // Determine communication style
  const communication_style = determineCommunicationStyle(scores);
  
  // Generate profile description
  const profile = generateProfileDescription(scores);
  
  return {
    traits: scores,
    emotionalStability,
    facets: facetAverages,
    profile,
    dominant_traits,
    work_style,
    communication_style
  };
}

/**
 * Get top 2 traits
 */
function getTopTraits(traits: Record<string, number>): string[] {
  return Object.entries(traits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait);
}

/**
 * Determine work style based on trait combination
 */
function determineWorkStyle(traits: Record<string, number>): string {
  const { openness, conscientiousness, extraversion } = traits;
  
  if (openness > 70 && extraversion > 60) return 'innovator-collaborator';
  if (conscientiousness > 70 && extraversion < 40) return 'analytical-independent';
  if (conscientiousness > 70 && extraversion > 60) return 'structured-leader';
  if (openness > 70 && extraversion < 40) return 'creative-specialist';
  if (conscientiousness > 60 && openness > 60) return 'strategic-executor';
  return 'adaptive-balanced';
}

/**
 * Determine communication style
 */
function determineCommunicationStyle(traits: Record<string, number>): string {
  const { extraversion, agreeableness } = traits;
  
  if (extraversion > 60 && agreeableness > 60) return 'expressive-supportive';
  if (extraversion > 60 && agreeableness < 40) return 'direct-assertive';
  if (extraversion < 40 && agreeableness > 60) return 'thoughtful-diplomatic';
  if (extraversion < 40 && agreeableness < 40) return 'analytical-reserved';
  return 'balanced-flexible';
}

/**
 * Generate human-readable profile description
 */
function generateProfileDescription(traits: Record<string, number>): string {
  const descriptions = [];
  
  if (traits.openness > 70) {
    descriptions.push("Highly innovative and adaptable");
  } else if (traits.openness < 30) {
    descriptions.push("Values tradition and proven methods");
  }
  
  if (traits.conscientiousness > 70) {
    descriptions.push("extremely organized and detail-oriented");
  } else if (traits.conscientiousness < 30) {
    descriptions.push("flexible and spontaneous");
  }
  
  if (traits.extraversion > 70) {
    descriptions.push("energized by collaboration");
  } else if (traits.extraversion < 30) {
    descriptions.push("prefers independent work");
  }
  
  if (traits.agreeableness > 70) {
    descriptions.push("highly collaborative and supportive");
  } else if (traits.agreeableness < 30) {
    descriptions.push("direct and results-focused");
  }
  
  const emotionalStability = 100 - traits.neuroticism;
  if (emotionalStability > 70) {
    descriptions.push("emotionally stable under pressure");
  } else if (emotionalStability < 30) {
    descriptions.push("sensitive to workplace stress");
  }
  
  return descriptions.join(", ") + ".";
}

/**
 * Get trait interpretation for display
 */
export function getTraitInterpretation(trait: string, score: number): {
  level: 'high' | 'moderate' | 'low';
  description: string;
  workplace_implications: string;
} {
  const level = score > 70 ? 'high' : score > 30 ? 'moderate' : 'low';
  
  const interpretations: Record<string, Record<string, any>> = {
    openness: {
      high: {
        description: "You thrive on innovation and embrace new approaches. You're comfortable with ambiguity and enjoy exploring creative solutions.",
        workplace_implications: "Ideal for innovation projects, strategic planning, and adapting to change. May get bored with repetitive tasks."
      },
      moderate: {
        description: "You balance innovation with practicality. You're open to new ideas but appreciate proven methods.",
        workplace_implications: "Versatile - can handle both creative and structured work. Good at evaluating new vs. traditional approaches."
      },
      low: {
        description: "You value tradition and proven methods. You prefer clarity and established procedures.",
        workplace_implications: "Excellent at maintaining quality standards and following established processes. Provides stability to teams."
      }
    },
    conscientiousness: {
      high: {
        description: "You're highly organized and detail-oriented. You set high standards and consistently meet deadlines.",
        workplace_implications: "Reliable for complex projects requiring attention to detail. Natural at quality control and planning."
      },
      moderate: {
        description: "You balance structure with flexibility. You're reliable but adapt when situations require it.",
        workplace_implications: "Can handle both structured and flexible work environments. Good at prioritizing."
      },
      low: {
        description: "You prefer flexibility over rigid structure. You're adaptable but may need support with detailed planning.",
        workplace_implications: "Thrives in dynamic environments. Benefits from project management support and clear deadlines."
      }
    },
    extraversion: {
      high: {
        description: "You're energized by collaboration and thrive in team settings. You naturally take the lead in group discussions.",
        workplace_implications: "Excellent for client-facing roles, team leadership, and collaborative projects. May need quiet time to recharge."
      },
      moderate: {
        description: "You balance social interaction with independent work. You contribute well in both team and solo settings.",
        workplace_implications: "Versatile - comfortable in various work environments. Can switch between collaborative and independent work."
      },
      low: {
        description: "You prefer focused, independent work. You're thoughtful in discussions and value depth over breadth in relationships.",
        workplace_implications: "Ideal for roles requiring deep focus and independent analysis. Contributes meaningfully in small groups."
      }
    },
    agreeableness: {
      high: {
        description: "You prioritize harmony and collaboration. You're naturally supportive and build strong team relationships.",
        workplace_implications: "Excellent mediator and team builder. Creates positive work environment. May need support with conflict situations."
      },
      moderate: {
        description: "You balance cooperation with assertiveness. You collaborate well while standing firm on important issues.",
        workplace_implications: "Can build relationships while maintaining boundaries. Good at constructive disagreement."
      },
      low: {
        description: "You're direct and results-focused. You prioritize efficiency and aren't afraid to challenge ideas.",
        workplace_implications: "Valuable for critical analysis and objective decision-making. Ensures accountability and standards."
      }
    },
    neuroticism: {
      high: {
        description: "You're sensitive to your environment and deeply invested in outcomes. You may benefit from stress management strategies.",
        workplace_implications: "High attention to risks and details. Benefits from supportive environment and clear expectations."
      },
      moderate: {
        description: "You experience normal stress levels. You care about results but maintain perspective.",
        workplace_implications: "Balanced approach to workplace challenges. Can handle moderate stress effectively."
      },
      low: {
        description: "You remain calm under pressure. You handle stress well and maintain stability in challenging situations.",
        workplace_implications: "Ideal for high-pressure roles and crisis management. Provides stability during organizational changes."
      }
    }
  };
  
  return {
    level,
    ...interpretations[trait]?.[level] || {
      description: "Score in normal range",
      workplace_implications: "Typical workplace behavior"
    }
  };
}






