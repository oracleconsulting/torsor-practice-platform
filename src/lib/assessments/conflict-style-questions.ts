/**
 * Thomas-Kilmann Conflict Style Assessment
 * Identifies preferred conflict-handling modes based on assertiveness and cooperativeness
 */

export interface ConflictStyleQuestion {
  id: number;
  scenario: string;
  options: {
    text: string;
    value: ConflictStyle;
    score: number;
  }[];
}

export type ConflictStyle = 
  | 'competing' 
  | 'collaborating' 
  | 'compromising' 
  | 'avoiding' 
  | 'accommodating';

export const conflictStyleQuestions: ConflictStyleQuestion[] = [
  {
    id: 1,
    scenario: "When you and a colleague disagree on an important project decision, you typically:",
    options: [
      { text: "Push for your solution because you believe it's best", value: 'competing', score: 3 },
      { text: "Work together to find a solution that fully satisfies both", value: 'collaborating', score: 3 },
      { text: "Suggest a middle-ground solution that partially satisfies both", value: 'compromising', score: 3 },
      { text: "Let it go and avoid the conflict if possible", value: 'avoiding', score: 3 },
      { text: "Go along with their preference to maintain harmony", value: 'accommodating', score: 3 },
    ]
  },
  {
    id: 2,
    scenario: "During a heated team discussion where tensions are rising, you're most likely to:",
    options: [
      { text: "Stand firm on your position and argue your case", value: 'competing', score: 2 },
      { text: "Encourage everyone to voice concerns and find common ground", value: 'collaborating', score: 2 },
      { text: "Propose a quick compromise to move forward", value: 'compromising', score: 2 },
      { text: "Stay quiet and wait for the tension to subside", value: 'avoiding', score: 2 },
      { text: "Support others' ideas to reduce conflict", value: 'accommodating', score: 2 },
    ]
  },
  {
    id: 3,
    scenario: "Your manager assigns you a task that conflicts with your current priorities. You:",
    options: [
      { text: "Explain why your current approach is better and push back", value: 'competing', score: 2 },
      { text: "Discuss both priorities to find a solution that addresses everything", value: 'collaborating', score: 2 },
      { text: "Negotiate to adjust both tasks to fit", value: 'compromising', score: 2 },
      { text: "Accept it without discussion to avoid conflict", value: 'avoiding', score: 2 },
      { text: "Agree to do it their way even if it's challenging", value: 'accommodating', score: 2 },
    ]
  },
  {
    id: 4,
    scenario: "Two team members come to you with a dispute. You:",
    options: [
      { text: "Make a quick decision on who's right", value: 'competing', score: 2 },
      { text: "Facilitate a discussion to help them find a win-win solution", value: 'collaborating', score: 2 },
      { text: "Suggest they each give a little to resolve it", value: 'compromising', score: 2 },
      { text: "Tell them to work it out themselves", value: 'avoiding', score: 2 },
      { text: "Side with one to resolve it quickly", value: 'accommodating', score: 2 },
    ]
  },
  {
    id: 5,
    scenario: "When someone criticizes your work in a meeting, you typically:",
    options: [
      { text: "Defend your work and challenge their criticism", value: 'competing', score: 3 },
      { text: "Engage in dialogue to understand their perspective and address concerns", value: 'collaborating', score: 3 },
      { text: "Acknowledge some points while defending others", value: 'compromising', score: 3 },
      { text: "Stay silent and address it later or not at all", value: 'avoiding', score: 3 },
      { text: "Accept the criticism and agree to change", value: 'accommodating', score: 3 },
    ]
  },
  {
    id: 6,
    scenario: "You and a peer both want to lead the same high-profile project. You:",
    options: [
      { text: "Make your case to management for why you should lead", value: 'competing', score: 3 },
      { text: "Propose co-leading to leverage both your strengths", value: 'collaborating', score: 3 },
      { text: "Suggest alternating leadership on different phases", value: 'compromising', score: 3 },
      { text: "Withdraw your interest to avoid the conflict", value: 'avoiding', score: 3 },
      { text: "Let them lead even though you want to", value: 'accommodating', score: 3 },
    ]
  },
  {
    id: 7,
    scenario: "A client is unhappy with a deliverable and wants major changes. You believe the work meets requirements. You:",
    options: [
      { text: "Stand by your work and explain why it meets the brief", value: 'competing', score: 2 },
      { text: "Listen to their concerns and work together on improvements", value: 'collaborating', score: 2 },
      { text: "Make some requested changes while keeping core elements", value: 'compromising', score: 2 },
      { text: "Pass it to someone else to handle", value: 'avoiding', score: 2 },
      { text: "Redo it completely to their specifications", value: 'accommodating', score: 2 },
    ]
  },
  {
    id: 8,
    scenario: "In a negotiation where you want outcome A and they want outcome B, you:",
    options: [
      { text: "Push hard for outcome A", value: 'competing', score: 3 },
      { text: "Explore creative solutions that achieve both A and B", value: 'collaborating', score: 3 },
      { text: "Settle on outcome C that's between A and B", value: 'compromising', score: 3 },
      { text: "Drop your request to avoid the difficult conversation", value: 'avoiding', score: 3 },
      { text: "Accept outcome B to keep the relationship strong", value: 'accommodating', score: 3 },
    ]
  },
  {
    id: 9,
    scenario: "When you notice a process isn't working well but others seem satisfied, you:",
    options: [
      { text: "Argue for change and push for your alternative", value: 'competing', score: 2 },
      { text: "Raise concerns and collaborate on improvements", value: 'collaborating', score: 2 },
      { text: "Suggest small tweaks that address some concerns", value: 'compromising', score: 2 },
      { text: "Keep quiet since others seem fine with it", value: 'avoiding', score: 2 },
      { text: "Go along with the current process", value: 'accommodating', score: 2 },
    ]
  },
  {
    id: 10,
    scenario: "Under tight deadlines, when conflict arises, you tend to:",
    options: [
      { text: "Make executive decisions to keep moving", value: 'competing', score: 2 },
      { text: "Quickly brainstorm solutions that work for everyone", value: 'collaborating', score: 2 },
      { text: "Find fast compromises to maintain momentum", value: 'compromising', score: 2 },
      { text: "Table the discussion for later", value: 'avoiding', score: 2 },
      { text: "Defer to others' preferences to save time", value: 'accommodating', score: 2 },
    ]
  },
];

export interface ConflictStyleProfile {
  primary_style: ConflictStyle;
  secondary_style: ConflictStyle | null;
  style_scores: Record<ConflictStyle, number>;
  assertiveness_level: 'low' | 'moderate' | 'high';
  cooperativeness_level: 'low' | 'moderate' | 'high';
  summary: string;
  when_effective: string[];
  when_ineffective: string[];
  growth_recommendations: string[];
  flexibility_score: number; // How balanced across all styles
}

const conflictStyleDescriptions: Record<ConflictStyle, {
  name: string;
  assertiveness: 'low' | 'moderate' | 'high';
  cooperativeness: 'low' | 'moderate' | 'high';
  description: string;
  when_appropriate: string[];
  when_inappropriate: string[];
  characteristics: string[];
  overuse_risks: string[];
  underuse_risks: string[];
}> = {
  competing: {
    name: 'Competing',
    assertiveness: 'high',
    cooperativeness: 'low',
    description: 'Assertive and uncooperative. Pursues own concerns at the expense of others.',
    when_appropriate: [
      'When quick, decisive action is vital (emergencies)',
      'On important issues where unpopular action is needed',
      'Against people who take advantage of non-competitive behavior',
      'When you know you\'re right and it\'s critical'
    ],
    when_inappropriate: [
      'When relationship is more important than the issue',
      'When you don\'t have all the information',
      'With direct reports (can damage morale)',
      'In situations requiring buy-in and collaboration'
    ],
    characteristics: [
      'Direct and assertive',
      'Willing to argue their position',
      'Focused on winning',
      'Can be seen as aggressive'
    ],
    overuse_risks: [
      'Damages relationships and trust',
      'Reduces team collaboration',
      'Misses creative solutions from others',
      'Creates win-lose culture'
    ],
    underuse_risks: [
      'May be taken advantage of',
      'Important issues go unaddressed',
      'Lack of leadership in crises',
      'Team lacks clear direction'
    ]
  },
  collaborating: {
    name: 'Collaborating',
    assertiveness: 'high',
    cooperativeness: 'high',
    description: 'Both assertive and cooperative. Works to find solutions that fully satisfy both parties.',
    when_appropriate: [
      'When both perspectives are too important to compromise',
      'When goal is to learn and test assumptions',
      'When gaining commitment by incorporating concerns',
      'On strategic issues affecting multiple stakeholders'
    ],
    when_inappropriate: [
      'In emergencies requiring immediate action',
      'When issue is trivial or temporary',
      'When other party is untrustworthy or competitive',
      'When time doesn\'t allow for full exploration'
    ],
    characteristics: [
      'Seeks win-win solutions',
      'Excellent listener',
      'Creative problem-solver',
      'Builds consensus'
    ],
    overuse_risks: [
      'Time-consuming process',
      'May over-analyze simple issues',
      'Can be exploited by competitive opponents',
      'Decision paralysis on time-sensitive issues'
    ],
    underuse_risks: [
      'Misses creative solutions',
      'Lower team commitment',
      'Relationship opportunities lost',
      'Leaves value on the table'
    ]
  },
  compromising: {
    name: 'Compromising',
    assertiveness: 'moderate',
    cooperativeness: 'moderate',
    description: 'Moderately assertive and cooperative. Seeks expedient, mutually acceptable solution.',
    when_appropriate: [
      'When goals are important but not worth potential disruption',
      'Between opponents with equal power on mutually exclusive goals',
      'To achieve temporary settlement of complex issues',
      'As backup when collaboration or competing fails'
    ],
    when_inappropriate: [
      'When one side is clearly right',
      'On matters of principle that shouldn\'t be compromised',
      'When creative win-win solution is possible',
      'When compromise would lead to inadequate solution'
    ],
    characteristics: [
      'Pragmatic and fair',
      'Finds middle ground',
      'Values efficiency',
      'Diplomatic'
    ],
    overuse_risks: [
      'Suboptimal solutions (no one fully satisfied)',
      'Misses win-win opportunities',
      'Creates "splitting the baby" culture',
      'Principles may be compromised'
    ],
    underuse_risks: [
      'Gets stuck in all-or-nothing thinking',
      'Wastes time when simple split would work',
      'Seen as inflexible',
      'Unnecessary conflicts escalate'
    ]
  },
  avoiding: {
    name: 'Avoiding',
    assertiveness: 'low',
    cooperativeness: 'low',
    description: 'Neither assertive nor cooperative. Sidesteps or postpones the issue.',
    when_appropriate: [
      'When issue is trivial or other issues more important',
      'When you have no chance of satisfying concerns',
      'When potential damage of confronting outweighs benefits',
      'To let people cool down and regain perspective',
      'When others can resolve conflict more effectively'
    ],
    when_inappropriate: [
      'On important issues requiring action',
      'When avoidance will make situation worse',
      'When you have responsibility to address it',
      'When people need closure or resolution'
    ],
    characteristics: [
      'Diplomatic',
      'Values harmony',
      'Strategic about timing',
      'Can seem passive or withdrawn'
    ],
    overuse_risks: [
      'Issues fester and grow',
      'Seen as weak or uncommitted',
      'Important decisions postponed',
      'Others lose respect'
    ],
    underuse_risks: [
      'Jumps into every conflict',
      'Wastes energy on trivial matters',
      'Doesn\'t give people space',
      'Creates conflict fatigue'
    ]
  },
  accommodating: {
    name: 'Accommodating',
    assertiveness: 'low',
    cooperativeness: 'high',
    description: 'Unassertive and cooperative. Neglects own concerns to satisfy the other person.',
    when_appropriate: [
      'When you realize you\'re wrong',
      'When issue is more important to the other person',
      'To build social credit for later issues',
      'When maintaining harmony is most important',
      'When you\'re outmatched and losing'
    ],
    when_inappropriate: [
      'On issues important to you or your team',
      'When other party is wrong or acting unethically',
      'When it will set bad precedent',
      'When you need to stand up for principles'
    ],
    characteristics: [
      'Supportive and selfless',
      'Values relationships highly',
      'Generous and yielding',
      'Can be seen as pushover'
    ],
    overuse_risks: [
      'Own needs perpetually unmet',
      'Lose influence and respect',
      'Resentment builds internally',
      'Others\' bad behavior enabled'
    ],
    underuse_risks: [
      'Damages relationships unnecessarily',
      'Misses opportunities to build goodwill',
      'Fights battles not worth winning',
      'Seen as stubborn or inflexible'
    ]
  }
};

export function calculateConflictStyleProfile(answers: Record<number, ConflictStyle>): ConflictStyleProfile {
  const style_scores: Record<ConflictStyle, number> = {
    competing: 0,
    collaborating: 0,
    compromising: 0,
    avoiding: 0,
    accommodating: 0
  };

  // Calculate scores
  conflictStyleQuestions.forEach(q => {
    const selectedStyle = answers[q.id];
    if (selectedStyle) {
      const option = q.options.find(opt => opt.value === selectedStyle);
      if (option) {
        style_scores[selectedStyle] += option.score;
      }
    }
  });

  // Find primary and secondary styles
  const sortedStyles = Object.entries(style_scores)
    .sort(([, a], [, b]) => b - a) as [ConflictStyle, number][];
  
  const primary_style = sortedStyles[0][0];
  const secondary_style = sortedStyles[1][1] > 0 ? sortedStyles[1][0] : null;

  // Calculate assertiveness and cooperativeness
  const assertiveness_score = 
    style_scores.competing * 2 + 
    style_scores.collaborating * 2 + 
    style_scores.compromising;
  
  const cooperativeness_score = 
    style_scores.accommodating * 2 + 
    style_scores.collaborating * 2 + 
    style_scores.compromising;

  const assertiveness_level: 'low' | 'moderate' | 'high' = 
    assertiveness_score > 20 ? 'high' : assertiveness_score > 12 ? 'moderate' : 'low';
  
  const cooperativeness_level: 'low' | 'moderate' | 'high' = 
    cooperativeness_score > 20 ? 'high' : cooperativeness_score > 12 ? 'moderate' : 'low';

  // Calculate flexibility (how balanced across styles)
  const totalScore = Object.values(style_scores).reduce((sum, score) => sum + score, 0);
  const maxScore = sortedStyles[0][1];
  const flexibility_score = Math.round(100 - ((maxScore / totalScore) * 100));

  const primaryDesc = conflictStyleDescriptions[primary_style];
  const secondaryDesc = secondary_style ? conflictStyleDescriptions[secondary_style] : null;

  const summary = secondaryDesc
    ? `Primary conflict style: ${primaryDesc.name} - ${primaryDesc.description}. Secondary: ${secondaryDesc.name}.`
    : `Dominant conflict style: ${primaryDesc.name} - ${primaryDesc.description}`;

  const when_effective = [...primaryDesc.when_appropriate];
  const when_ineffective = [...primaryDesc.when_inappropriate];

  const growth_recommendations: string[] = [];
  
  // Add recommendations based on low-scoring styles
  const lowestStyles = sortedStyles.slice(-2);
  lowestStyles.forEach(([style, score]) => {
    if (score < 8) {
      const desc = conflictStyleDescriptions[style];
      growth_recommendations.push(
        `Develop ${desc.name}: ${desc.underuse_risks[0]}`
      );
    }
  });

  // Add flexibility recommendation if too rigid
  if (flexibility_score < 30) {
    growth_recommendations.push(
      `Increase flexibility: You heavily rely on one style. Practice adapting your approach based on the situation.`
    );
  }

  // Add overuse warning for primary style
  if (sortedStyles[0][1] > 18) {
    growth_recommendations.push(
      `Avoid overusing ${primaryDesc.name}: ${primaryDesc.overuse_risks[0]}`
    );
  }

  return {
    primary_style,
    secondary_style,
    style_scores,
    assertiveness_level,
    cooperativeness_level,
    summary,
    when_effective,
    when_ineffective,
    growth_recommendations,
    flexibility_score
  };
}

export function getConflictStyleDescription(style: ConflictStyle) {
  return conflictStyleDescriptions[style];
}

export function getIdealConflictApproach(situation: string): ConflictStyle {
  const situationMap: Record<string, ConflictStyle> = {
    'emergency': 'competing',
    'strategic_issue': 'collaborating',
    'time_pressure': 'compromising',
    'trivial_matter': 'avoiding',
    'relationship_priority': 'accommodating'
  };
  return situationMap[situation] || 'collaborating';
}

export function getTeamConflictInsights(profiles: ConflictStyleProfile[]): {
  team_dynamics: string;
  conflict_climate: string;
  collaboration_potential: string;
  risks: string[];
  recommendations: string[];
} {
  if (profiles.length === 0) {
    return {
      team_dynamics: 'No data available',
      conflict_climate: 'N/A',
      collaboration_potential: 'N/A',
      risks: [],
      recommendations: []
    };
  }

  const styleCounts: Record<ConflictStyle, number> = {
    competing: 0,
    collaborating: 0,
    compromising: 0,
    avoiding: 0,
    accommodating: 0
  };

  profiles.forEach(p => {
    styleCounts[p.primary_style]++;
  });

  const avgFlexibility = profiles.reduce((sum, p) => sum + p.flexibility_score, 0) / profiles.length;
  const highAssertive = profiles.filter(p => p.assertiveness_level === 'high').length;
  const highCooperative = profiles.filter(p => p.cooperativeness_level === 'high').length;

  let team_dynamics = '';
  if (styleCounts.collaborating >= profiles.length * 0.4) {
    team_dynamics = 'Collaboration-oriented team. Strong problem-solving culture with high engagement.';
  } else if (styleCounts.competing >= profiles.length * 0.4) {
    team_dynamics = 'Competitive team. High drive but potential for conflict escalation.';
  } else if (styleCounts.avoiding >= profiles.length * 0.4) {
    team_dynamics = 'Conflict-avoidant team. Harmony-focused but issues may go unaddressed.';
  } else {
    team_dynamics = 'Diverse conflict styles. Team will need clear conflict norms.';
  }

  let conflict_climate = '';
  if (avgFlexibility > 60) {
    conflict_climate = 'Healthy conflict climate with adaptive approaches.';
  } else if (avgFlexibility > 40) {
    conflict_climate = 'Moderate flexibility. Some adaptation but room for growth.';
  } else {
    conflict_climate = 'Rigid conflict approaches. Team may struggle with different situations.';
  }

  let collaboration_potential = '';
  if (highCooperative >= profiles.length * 0.6) {
    collaboration_potential = 'High collaboration potential. Team values working together.';
  } else if (highCooperative >= profiles.length * 0.4) {
    collaboration_potential = 'Moderate collaboration. Mix of collaborative and individualistic approaches.';
  } else {
    collaboration_potential = 'Lower collaboration orientation. May need facilitation for teamwork.';
  }

  const risks: string[] = [];
  if (styleCounts.competing > profiles.length * 0.5) {
    risks.push('Multiple competing styles may lead to power struggles');
  }
  if (styleCounts.avoiding > profiles.length * 0.5) {
    risks.push('Avoidant culture may let problems fester');
  }
  if (highAssertive > profiles.length * 0.7 && highCooperative < profiles.length * 0.3) {
    risks.push('High assertiveness without cooperation may create toxic environment');
  }

  const recommendations: string[] = [
    'Establish team conflict norms and escalation procedures',
    'Practice different conflict styles through role-playing',
    'Provide conflict resolution training',
    'Create safe spaces for addressing concerns'
  ];

  if (avgFlexibility < 50) {
    recommendations.push('Focus on developing flexibility in conflict approaches');
  }
  if (styleCounts.collaborating < 3) {
    recommendations.push('Train team on collaborative problem-solving techniques');
  }

  return {
    team_dynamics,
    conflict_climate,
    collaboration_potential,
    risks,
    recommendations
  };
}

