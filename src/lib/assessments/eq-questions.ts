/**
 * Emotional Intelligence (EQ) Assessment
 * Measures four key domains of emotional intelligence
 */

export interface EQQuestion {
  id: number;
  statement: string;
  domain: EQDomain;
  reverse_scored?: boolean; // If true, higher rating = lower EQ
}

export type EQDomain = 
  | 'self_awareness'
  | 'self_management'
  | 'social_awareness'
  | 'relationship_management';

export const eqQuestions: EQQuestion[] = [
  // Self-Awareness (Understanding own emotions) - 6 questions
  {
    id: 1,
    statement: "I am aware of my emotions as I experience them",
    domain: 'self_awareness'
  },
  {
    id: 2,
    statement: "I understand why I feel the way I do in most situations",
    domain: 'self_awareness'
  },
  {
    id: 3,
    statement: "I recognize how my emotions affect my performance",
    domain: 'self_awareness'
  },
  {
    id: 4,
    statement: "I have a clear sense of my strengths and limitations",
    domain: 'self_awareness'
  },
  {
    id: 5,
    statement: "I'm usually unaware of how I'm feeling until someone points it out",
    domain: 'self_awareness',
    reverse_scored: true
  },
  {
    id: 6,
    statement: "I understand what triggers strong emotional reactions in me",
    domain: 'self_awareness'
  },

  // Self-Management (Controlling emotions and adapting) - 7 questions
  {
    id: 7,
    statement: "I stay calm and composed under pressure",
    domain: 'self_management'
  },
  {
    id: 8,
    statement: "I can control my impulses when upset or frustrated",
    domain: 'self_management'
  },
  {
    id: 9,
    statement: "I maintain a positive outlook even when things go wrong",
    domain: 'self_management'
  },
  {
    id: 10,
    statement: "I adapt easily to changing circumstances",
    domain: 'self_management'
  },
  {
    id: 11,
    statement: "I often let my emotions get the better of me",
    domain: 'self_management',
    reverse_scored: true
  },
  {
    id: 12,
    statement: "I can refocus quickly after setbacks",
    domain: 'self_management'
  },
  {
    id: 13,
    statement: "I manage stress effectively without it affecting my work",
    domain: 'self_management'
  },

  // Social Awareness (Understanding others' emotions) - 6 questions
  {
    id: 14,
    statement: "I can easily read other people's emotions",
    domain: 'social_awareness'
  },
  {
    id: 15,
    statement: "I pick up on subtle emotional cues from colleagues",
    domain: 'social_awareness'
  },
  {
    id: 16,
    statement: "I understand the emotional dynamics in my team",
    domain: 'social_awareness'
  },
  {
    id: 17,
    statement: "I sense when someone is upset even if they don't say it",
    domain: 'social_awareness'
  },
  {
    id: 18,
    statement: "I struggle to understand why people react the way they do",
    domain: 'social_awareness',
    reverse_scored: true
  },
  {
    id: 19,
    statement: "I consider how others feel when making decisions",
    domain: 'social_awareness'
  },

  // Relationship Management (Influencing and managing relationships) - 8 questions
  {
    id: 20,
    statement: "I build rapport easily with diverse people",
    domain: 'relationship_management'
  },
  {
    id: 21,
    statement: "I handle conflicts constructively",
    domain: 'relationship_management'
  },
  {
    id: 22,
    statement: "I inspire and motivate others",
    domain: 'relationship_management'
  },
  {
    id: 23,
    statement: "I provide feedback in a way that helps people grow",
    domain: 'relationship_management'
  },
  {
    id: 24,
    statement: "I struggle to influence others or gain their buy-in",
    domain: 'relationship_management',
    reverse_scored: true
  },
  {
    id: 25,
    statement: "I navigate difficult conversations effectively",
    domain: 'relationship_management'
  },
  {
    id: 26,
    statement: "I help resolve conflicts between team members",
    domain: 'relationship_management'
  },
  {
    id: 27,
    statement: "I build and maintain strong professional relationships",
    domain: 'relationship_management'
  },
];

// 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree)
export const eqRatingScale = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export interface EQProfile {
  domain_scores: Record<EQDomain, number>;
  overall_eq: number;
  eq_level: 'developing' | 'competent' | 'strong' | 'exceptional';
  summary: string;
  strengths: string[];
  development_areas: string[];
  workplace_implications: {
    leadership_readiness: string;
    team_dynamics: string;
    client_relationships: string;
    stress_management: string;
  };
  growth_recommendations: string[];
}

const domainDescriptions: Record<EQDomain, {
  name: string;
  description: string;
  high_score_traits: string[];
  low_score_implications: string[];
  development_tips: string[];
}> = {
  self_awareness: {
    name: 'Self-Awareness',
    description: 'Understanding your own emotions, strengths, weaknesses, and triggers',
    high_score_traits: [
      'Recognizes emotional patterns',
      'Understands personal triggers',
      'Aware of strengths and limitations',
      'Receives feedback openly'
    ],
    low_score_implications: [
      'May be surprised by own reactions',
      'Difficulty understanding impact on others',
      'Blind spots in self-perception',
      'May overestimate or underestimate abilities'
    ],
    development_tips: [
      'Practice mindfulness and emotional check-ins',
      'Seek feedback from trusted colleagues',
      'Keep a journal of emotional reactions',
      'Work with a coach or mentor'
    ]
  },
  self_management: {
    name: 'Self-Management',
    description: 'Controlling emotions, maintaining composure, and adapting to change',
    high_score_traits: [
      'Stays calm under pressure',
      'Controls impulses effectively',
      'Maintains positive outlook',
      'Adapts to change smoothly'
    ],
    low_score_implications: [
      'May react emotionally in stressful situations',
      'Difficulty managing frustration',
      'Struggles with change and uncertainty',
      'Emotional volatility affects work'
    ],
    development_tips: [
      'Practice stress management techniques',
      'Develop pause-before-reacting habit',
      'Build resilience through gradual exposure',
      'Learn cognitive reframing techniques'
    ]
  },
  social_awareness: {
    name: 'Social Awareness',
    description: 'Understanding others\' emotions, needs, and perspectives',
    high_score_traits: [
      'Reads emotional cues accurately',
      'Demonstrates empathy',
      'Understands team dynamics',
      'Considers diverse perspectives'
    ],
    low_score_implications: [
      'May miss emotional signals from others',
      'Difficulty understanding others\' viewpoints',
      'Blind to team tensions',
      'May seem insensitive or tone-deaf'
    ],
    development_tips: [
      'Practice active listening',
      'Ask questions to understand perspectives',
      'Observe body language and tone',
      'Seek feedback on your empathy'
    ]
  },
  relationship_management: {
    name: 'Relationship Management',
    description: 'Building relationships, influencing, coaching, and managing conflict',
    high_score_traits: [
      'Builds strong professional relationships',
      'Influences and inspires others',
      'Handles conflict constructively',
      'Provides effective feedback'
    ],
    low_score_implications: [
      'Struggles to build rapport',
      'Difficulty influencing or persuading',
      'Avoids or escalates conflicts',
      'Feedback may be poorly received'
    ],
    development_tips: [
      'Learn conflict resolution frameworks',
      'Practice coaching conversations',
      'Build relationship-building skills',
      'Study influence and persuasion techniques'
    ]
  }
};

export function calculateEQProfile(answers: Record<number, number>): EQProfile {
  const domain_scores: Record<EQDomain, number> = {
    self_awareness: 0,
    self_management: 0,
    social_awareness: 0,
    relationship_management: 0
  };

  const domain_counts: Record<EQDomain, number> = {
    self_awareness: 0,
    self_management: 0,
    social_awareness: 0,
    relationship_management: 0
  };

  // Calculate domain scores
  eqQuestions.forEach(q => {
    const rating = answers[q.id];
    if (rating !== undefined) {
      const score = q.reverse_scored ? (6 - rating) : rating; // Reverse score if needed
      domain_scores[q.domain] += score;
      domain_counts[q.domain]++;
    }
  });

  // Calculate averages (out of 5) and convert to percentages
  let overall_sum = 0;
  let overall_count = 0;

  Object.keys(domain_scores).forEach(domain => {
    const d = domain as EQDomain;
    if (domain_counts[d] > 0) {
      const average = domain_scores[d] / domain_counts[d];
      domain_scores[d] = Math.round((average / 5) * 100); // Convert to percentage
      overall_sum += domain_scores[d];
      overall_count++;
    }
  });

  const overall_eq = Math.round(overall_sum / overall_count);

  // Determine EQ level
  let eq_level: 'developing' | 'competent' | 'strong' | 'exceptional';
  if (overall_eq >= 85) {
    eq_level = 'exceptional';
  } else if (overall_eq >= 70) {
    eq_level = 'strong';
  } else if (overall_eq >= 55) {
    eq_level = 'competent';
  } else {
    eq_level = 'developing';
  }

  // Identify strengths and development areas
  const sortedDomains = Object.entries(domain_scores)
    .sort(([, a], [, b]) => b - a) as [EQDomain, number][];

  const strengths: string[] = [];
  const development_areas: string[] = [];

  sortedDomains.forEach(([domain, score]) => {
    const desc = domainDescriptions[domain];
    if (score >= 75) {
      strengths.push(`${desc.name}: ${desc.high_score_traits.join(', ')}`);
    } else if (score < 60) {
      development_areas.push(`${desc.name}: ${desc.low_score_implications[0]}`);
    }
  });

  // Generate summary
  const strongestDomain = domainDescriptions[sortedDomains[0][0]];
  const weakestDomain = domainDescriptions[sortedDomains[sortedDomains.length - 1][0]];
  
  const summary = `Overall EQ: ${eq_level.charAt(0).toUpperCase() + eq_level.slice(1)} (${overall_eq}/100). Strongest in ${strongestDomain.name}, with development opportunities in ${weakestDomain.name}.`;

  // Workplace implications
  const self_mgmt_score = domain_scores.self_management;
  const social_score = domain_scores.social_awareness;
  const relationship_score = domain_scores.relationship_management;
  const self_aware_score = domain_scores.self_awareness;

  const workplace_implications = {
    leadership_readiness: relationship_score >= 70 
      ? "High leadership readiness - able to inspire and influence others effectively"
      : "Developing leadership capability - focus on relationship and influence skills",
    
    team_dynamics: social_score >= 70 && relationship_score >= 70
      ? "Strong team player who understands and navigates group dynamics well"
      : "May benefit from enhanced awareness of team emotional dynamics",
    
    client_relationships: social_score >= 75 && relationship_score >= 75
      ? "Excellent client-facing capability with strong relationship skills"
      : social_score >= 60 && relationship_score >= 60
        ? "Capable in client relationships with room for growth"
        : "May need support in complex client situations",
    
    stress_management: self_mgmt_score >= 75
      ? "Excellent stress management - remains composed under pressure"
      : self_mgmt_score >= 60
        ? "Adequate stress management with occasional challenges"
        : "Stress management is a development priority"
  };

  // Growth recommendations
  const growth_recommendations: string[] = [];
  
  sortedDomains.forEach(([domain, score]) => {
    if (score < 70) {
      const desc = domainDescriptions[domain];
      growth_recommendations.push(`${desc.name}: ${desc.development_tips[0]}`);
    }
  });

  // Add at least 2 recommendations
  if (growth_recommendations.length < 2) {
    const lowestDomain = sortedDomains[sortedDomains.length - 1][0];
    const desc = domainDescriptions[lowestDomain];
    desc.development_tips.slice(0, 2 - growth_recommendations.length).forEach(tip => {
      growth_recommendations.push(`${desc.name}: ${tip}`);
    });
  }

  return {
    domain_scores,
    overall_eq,
    eq_level,
    summary,
    strengths,
    development_areas,
    workplace_implications,
    growth_recommendations
  };
}

export function getDomainDescription(domain: EQDomain) {
  return domainDescriptions[domain];
}

export function getEQDevelopmentPath(profile: EQProfile): {
  immediate_focus: string;
  six_month_goals: string[];
  long_term_vision: string;
} {
  const sortedDomains = Object.entries(profile.domain_scores)
    .sort(([, a], [, b]) => a - b) as [EQDomain, number][];
  
  const lowestDomain = sortedDomains[0][0];
  const lowestDesc = domainDescriptions[lowestDomain];

  return {
    immediate_focus: `Develop ${lowestDesc.name}: ${lowestDesc.development_tips[0]}`,
    six_month_goals: [
      `Increase ${lowestDesc.name} by 15-20 points through deliberate practice`,
      `Apply ${lowestDesc.name} skills in daily interactions`,
      `Seek feedback from colleagues on progress`,
      `Complete EQ coaching or training program`
    ],
    long_term_vision: profile.overall_eq >= 70
      ? 'Maintain high EQ and become an emotional intelligence coach for others'
      : 'Develop all four EQ domains to 75+ to unlock leadership potential'
  };
}

export function getTeamEQInsights(profiles: EQProfile[]): {
  team_eq_average: number;
  team_eq_range: { low: number; high: number };
  strongest_domain: string;
  weakest_domain: string;
  team_implications: string;
  recommendations: string[];
} {
  if (profiles.length === 0) {
    return {
      team_eq_average: 0,
      team_eq_range: { low: 0, high: 0 },
      strongest_domain: 'N/A',
      weakest_domain: 'N/A',
      team_implications: 'No profiles available',
      recommendations: []
    };
  }

  const team_eq_average = Math.round(
    profiles.reduce((sum, p) => sum + p.overall_eq, 0) / profiles.length
  );

  const eqs = profiles.map(p => p.overall_eq).sort((a, b) => a - b);
  const team_eq_range = { low: eqs[0], high: eqs[eqs.length - 1] };

  // Calculate domain averages
  const domain_averages: Record<EQDomain, number> = {
    self_awareness: 0,
    self_management: 0,
    social_awareness: 0,
    relationship_management: 0
  };

  Object.keys(domain_averages).forEach(domain => {
    const d = domain as EQDomain;
    domain_averages[d] = Math.round(
      profiles.reduce((sum, p) => sum + p.domain_scores[d], 0) / profiles.length
    );
  });

  const sortedDomains = Object.entries(domain_averages)
    .sort(([, a], [, b]) => b - a) as [EQDomain, number][];

  const strongest_domain = domainDescriptions[sortedDomains[0][0]].name;
  const weakest_domain = domainDescriptions[sortedDomains[sortedDomains.length - 1][0]].name;

  let team_implications = '';
  if (team_eq_average >= 75) {
    team_implications = 'High-EQ team with strong emotional intelligence across all domains. Excellent foundation for collaboration and leadership.';
  } else if (team_eq_average >= 65) {
    team_implications = 'Solid EQ foundation with room for targeted development in specific domains.';
  } else if (team_eq_average >= 55) {
    team_implications = 'Moderate EQ with significant development opportunities. Invest in EQ training.';
  } else {
    team_implications = 'Developing EQ team. Prioritize emotional intelligence training and coaching.';
  }

  const recommendations: string[] = [];
  if (domain_averages.relationship_management < 65) {
    recommendations.push('Conflict resolution training for the team');
  }
  if (domain_averages.self_management < 65) {
    recommendations.push('Stress management and resilience workshops');
  }
  if (domain_averages.social_awareness < 65) {
    recommendations.push('Empathy and active listening training');
  }
  if (team_eq_range.high - team_eq_range.low > 30) {
    recommendations.push('Peer coaching to share EQ best practices across the team');
  }

  return {
    team_eq_average,
    team_eq_range,
    strongest_domain,
    weakest_domain,
    team_implications,
    recommendations
  };
}

