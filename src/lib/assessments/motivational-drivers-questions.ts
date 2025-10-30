/**
 * Motivational Drivers Assessment
 * Identifies what motivates individuals at work based on key psychological needs
 */

export interface MotivationalDriverQuestion {
  id: number;
  question: string;
  options: {
    text: string;
    driver: MotivationalDriver;
    score: number;
  }[];
}

export type MotivationalDriver = 
  | 'achievement' 
  | 'affiliation' 
  | 'power_influence' 
  | 'autonomy' 
  | 'security' 
  | 'variety';

export const motivationalDriverQuestions: MotivationalDriverQuestion[] = [
  {
    id: 1,
    question: "What aspect of work excites you most?",
    options: [
      { text: "Setting and achieving ambitious goals", driver: 'achievement', score: 3 },
      { text: "Building strong relationships with colleagues", driver: 'affiliation', score: 3 },
      { text: "Leading teams and making impactful decisions", driver: 'power_influence', score: 3 },
      { text: "Having freedom to work my own way", driver: 'autonomy', score: 3 },
      { text: "Stable income and reliable work", driver: 'security', score: 3 },
      { text: "Working on diverse, changing projects", driver: 'variety', score: 3 },
    ]
  },
  {
    id: 2,
    question: "When choosing a new role, what matters most?",
    options: [
      { text: "Opportunities for advancement and success", driver: 'achievement', score: 3 },
      { text: "Collaborative team and positive culture", driver: 'affiliation', score: 3 },
      { text: "Authority and ability to shape direction", driver: 'power_influence', score: 3 },
      { text: "Independence and flexible work arrangements", driver: 'autonomy', score: 3 },
      { text: "Job security and consistent benefits", driver: 'security', score: 3 },
      { text: "Diverse responsibilities and new challenges", driver: 'variety', score: 3 },
    ]
  },
  {
    id: 3,
    question: "You feel most satisfied at work when:",
    options: [
      { text: "You exceed targets and accomplish difficult tasks", driver: 'achievement', score: 2 },
      { text: "You have strong connections with teammates", driver: 'affiliation', score: 2 },
      { text: "Your ideas are implemented and you lead change", driver: 'power_influence', score: 2 },
      { text: "You control your schedule and approach", driver: 'autonomy', score: 2 },
      { text: "You have a predictable routine and stability", driver: 'security', score: 2 },
      { text: "Every day brings something different", driver: 'variety', score: 2 },
    ]
  },
  {
    id: 4,
    question: "Which best describes your ideal work environment?",
    options: [
      { text: "Competitive, goal-driven culture", driver: 'achievement', score: 2 },
      { text: "Warm, friendly, team-oriented atmosphere", driver: 'affiliation', score: 2 },
      { text: "Place where I can make strategic decisions", driver: 'power_influence', score: 2 },
      { text: "Minimal supervision, trust-based", driver: 'autonomy', score: 2 },
      { text: "Structured, established organization", driver: 'security', score: 2 },
      { text: "Dynamic, ever-changing environment", driver: 'variety', score: 2 },
    ]
  },
  {
    id: 5,
    question: "What demotivates you most at work?",
    options: [
      { text: "Lack of clear goals or progress metrics", driver: 'achievement', score: 2 },
      { text: "Isolation or poor team dynamics", driver: 'affiliation', score: 2 },
      { text: "No voice in decisions or strategic direction", driver: 'power_influence', score: 2 },
      { text: "Micromanagement and rigid rules", driver: 'autonomy', score: 2 },
      { text: "Uncertainty and frequent organizational changes", driver: 'security', score: 2 },
      { text: "Repetitive, monotonous tasks", driver: 'variety', score: 2 },
    ]
  },
  {
    id: 6,
    question: "In a successful project, what matters most to you?",
    options: [
      { text: "Measurable results and exceeding expectations", driver: 'achievement', score: 3 },
      { text: "Team collaboration and strong relationships formed", driver: 'affiliation', score: 3 },
      { text: "Recognition of my leadership and influence", driver: 'power_influence', score: 3 },
      { text: "Freedom to innovate and work independently", driver: 'autonomy', score: 3 },
      { text: "Smooth execution without major risks", driver: 'security', score: 3 },
      { text: "Learning new skills and tackling new challenges", driver: 'variety', score: 3 },
    ]
  },
  {
    id: 7,
    question: "When considering a career move, you prioritize:",
    options: [
      { text: "Career progression and professional growth", driver: 'achievement', score: 2 },
      { text: "People you'll work with and company culture", driver: 'affiliation', score: 2 },
      { text: "Level of responsibility and decision-making power", driver: 'power_influence', score: 2 },
      { text: "Work-life balance and flexibility", driver: 'autonomy', score: 2 },
      { text: "Financial stability and job permanence", driver: 'security', score: 2 },
      { text: "Breadth of experience and learning opportunities", driver: 'variety', score: 2 },
    ]
  },
  {
    id: 8,
    question: "Your ideal workday involves:",
    options: [
      { text: "Tackling challenging problems and seeing results", driver: 'achievement', score: 2 },
      { text: "Collaborating with colleagues throughout", driver: 'affiliation', score: 2 },
      { text: "Making key decisions that shape outcomes", driver: 'power_influence', score: 2 },
      { text: "Working independently with minimal interruptions", driver: 'autonomy', score: 2 },
      { text: "Following established processes reliably", driver: 'security', score: 2 },
      { text: "Switching between different types of work", driver: 'variety', score: 2 },
    ]
  },
  {
    id: 9,
    question: "What type of feedback energizes you most?",
    options: [
      { text: "Recognition of exceptional performance and results", driver: 'achievement', score: 2 },
      { text: "Appreciation for being a great team player", driver: 'affiliation', score: 2 },
      { text: "Acknowledgment of your strategic impact", driver: 'power_influence', score: 2 },
      { text: "Trust to continue working independently", driver: 'autonomy', score: 2 },
      { text: "Confirmation that you're doing things correctly", driver: 'security', score: 2 },
      { text: "Opportunities to try new approaches", driver: 'variety', score: 2 },
    ]
  },
  {
    id: 10,
    question: "Long-term, you want to be known for:",
    options: [
      { text: "Outstanding achievements and success record", driver: 'achievement', score: 3 },
      { text: "Being a valued colleague and team builder", driver: 'affiliation', score: 3 },
      { text: "Leadership and driving organizational change", driver: 'power_influence', score: 3 },
      { text: "Innovation and independent contributions", driver: 'autonomy', score: 3 },
      { text: "Reliability and consistent excellence", driver: 'security', score: 3 },
      { text: "Versatility and breadth of expertise", driver: 'variety', score: 3 },
    ]
  },
];

export interface MotivationalProfile {
  primary_driver: MotivationalDriver;
  secondary_driver: MotivationalDriver | null;
  driver_scores: Record<MotivationalDriver, number>;
  motivation_intensity: 'low' | 'moderate' | 'high';
  summary: string;
  what_motivates: string[];
  what_demotivates: string[];
  ideal_role_characteristics: string[];
  retention_risks: string[];
}

const driverDescriptions: Record<MotivationalDriver, {
  name: string;
  description: string;
  motivators: string[];
  demotivators: string[];
  ideal_roles: string[];
  retention_risks: string[];
}> = {
  achievement: {
    name: 'Achievement',
    description: 'Driven by accomplishment, success, and exceeding goals',
    motivators: [
      'Clear, measurable goals and targets',
      'Recognition of excellent performance',
      'Opportunities for advancement',
      'Challenging, complex problems',
      'Visible progress and results'
    ],
    demotivators: [
      'Vague or undefined goals',
      'Lack of feedback on performance',
      'Routine, unchallenging work',
      'Limited growth opportunities'
    ],
    ideal_roles: [
      'Project manager with clear deliverables',
      'Sales or business development',
      'Performance-based roles',
      'Leadership positions with targets'
    ],
    retention_risks: [
      'Stagnation in role without growth',
      'Lack of recognition for achievements',
      'No clear path to promotion',
      'Work that doesn\'t challenge them'
    ]
  },
  affiliation: {
    name: 'Affiliation',
    description: 'Driven by relationships, teamwork, and belonging',
    motivators: [
      'Strong team relationships',
      'Collaborative work environment',
      'Positive, supportive culture',
      'Helping and supporting colleagues',
      'Social recognition and appreciation'
    ],
    demotivators: [
      'Isolation or remote work without connection',
      'Competitive, individualistic culture',
      'Conflict or poor team dynamics',
      'Lack of team interaction'
    ],
    ideal_roles: [
      'HR and people development',
      'Team coordination',
      'Client relationship management',
      'Mentoring and coaching roles'
    ],
    retention_risks: [
      'Toxic team culture',
      'Isolation in role',
      'Constant reorganizations disrupting relationships',
      'Lack of team appreciation'
    ]
  },
  power_influence: {
    name: 'Power & Influence',
    description: 'Driven by impact, leadership, and shaping direction',
    motivators: [
      'Decision-making authority',
      'Strategic influence',
      'Leading teams and initiatives',
      'Recognition as a leader',
      'Ability to shape organizational direction'
    ],
    demotivators: [
      'No voice in decisions',
      'Lack of authority or responsibility',
      'Being micromanaged',
      'Limited scope of influence'
    ],
    ideal_roles: [
      'Leadership and management positions',
      'Strategic advisory roles',
      'Change management',
      'Executive positions'
    ],
    retention_risks: [
      'Passed over for promotion',
      'Ideas consistently ignored',
      'Reduced scope or responsibility',
      'No path to leadership'
    ]
  },
  autonomy: {
    name: 'Autonomy',
    description: 'Driven by independence, freedom, and self-direction',
    motivators: [
      'Control over how work is done',
      'Flexible schedule and location',
      'Minimal supervision',
      'Trust-based management',
      'Ability to innovate independently'
    ],
    demotivators: [
      'Micromanagement',
      'Rigid rules and procedures',
      'Constant oversight and check-ins',
      'Lack of flexibility'
    ],
    ideal_roles: [
      'Remote/flexible work arrangements',
      'Independent consultant or specialist',
      'Research and development',
      'Entrepreneurial roles'
    ],
    retention_risks: [
      'Increased oversight or micromanagement',
      'Loss of flexibility',
      'Rigid return-to-office policies',
      'Reduced decision-making power'
    ]
  },
  security: {
    name: 'Security',
    description: 'Driven by stability, predictability, and safety',
    motivators: [
      'Job security and stability',
      'Clear, established processes',
      'Predictable income and benefits',
      'Low-risk environment',
      'Long-term organizational stability'
    ],
    demotivators: [
      'Frequent organizational changes',
      'Uncertainty about job security',
      'High-risk projects',
      'Unstable leadership'
    ],
    ideal_roles: [
      'Established organizations',
      'Process-driven roles',
      'Quality assurance',
      'Compliance and governance'
    ],
    retention_risks: [
      'Layoffs or restructuring',
      'Financial instability',
      'Constant change and uncertainty',
      'Shift to high-risk strategy'
    ]
  },
  variety: {
    name: 'Variety',
    description: 'Driven by novelty, diversity, and new challenges',
    motivators: [
      'Diverse, changing responsibilities',
      'New challenges and learning',
      'Cross-functional projects',
      'Exposure to different areas',
      'Constant innovation'
    ],
    demotivators: [
      'Repetitive, routine tasks',
      'Narrow, specialized work',
      'Lack of learning opportunities',
      'Stagnant role without change'
    ],
    ideal_roles: [
      'Consulting and advisory',
      'Project-based work',
      'Innovation and R&D',
      'Generalist roles'
    ],
    retention_risks: [
      'Role becomes too routine',
      'Limited exposure to new projects',
      'Specialization without variety',
      'Boredom from repetition'
    ]
  }
};

export function calculateMotivationalProfile(answers: Record<number, MotivationalDriver>): MotivationalProfile {
  const driver_scores: Record<MotivationalDriver, number> = {
    achievement: 0,
    affiliation: 0,
    power_influence: 0,
    autonomy: 0,
    security: 0,
    variety: 0
  };

  // Calculate scores
  motivationalDriverQuestions.forEach(q => {
    const selectedDriver = answers[q.id];
    if (selectedDriver) {
      const option = q.options.find(opt => opt.driver === selectedDriver);
      if (option) {
        driver_scores[selectedDriver] += option.score;
      }
    }
  });

  // Find primary and secondary drivers
  const sortedDrivers = Object.entries(driver_scores)
    .sort(([, a], [, b]) => b - a) as [MotivationalDriver, number][];
  
  const primary_driver = sortedDrivers[0][0];
  const secondary_driver = sortedDrivers[1][1] > 0 ? sortedDrivers[1][0] : null;

  // Calculate motivation intensity based on score concentration
  const totalScore = Object.values(driver_scores).reduce((sum, score) => sum + score, 0);
  const primaryPercentage = (sortedDrivers[0][1] / totalScore) * 100;
  
  let motivation_intensity: 'low' | 'moderate' | 'high';
  if (primaryPercentage > 50) {
    motivation_intensity = 'high'; // Very focused motivation
  } else if (primaryPercentage > 35) {
    motivation_intensity = 'moderate'; // Balanced motivation
  } else {
    motivation_intensity = 'low'; // Diffused motivation across many drivers
  }

  const primaryDesc = driverDescriptions[primary_driver];
  const secondaryDesc = secondary_driver ? driverDescriptions[secondary_driver] : null;

  const summary = secondaryDesc
    ? `Primarily driven by ${primaryDesc.name} (${primaryDesc.description.toLowerCase()}), with secondary motivation from ${secondaryDesc.name} (${secondaryDesc.description.toLowerCase()}).`
    : `Strongly driven by ${primaryDesc.name}: ${primaryDesc.description}.`;

  const what_motivates = [...primaryDesc.motivators];
  if (secondaryDesc) {
    what_motivates.push(...secondaryDesc.motivators.slice(0, 2));
  }

  const what_demotivates = [...primaryDesc.demotivators];
  if (secondaryDesc) {
    what_demotivates.push(...secondaryDesc.demotivators.slice(0, 2));
  }

  const ideal_role_characteristics = [...primaryDesc.ideal_roles];
  if (secondaryDesc) {
    ideal_role_characteristics.push(...secondaryDesc.ideal_roles.slice(0, 2));
  }

  const retention_risks = [...primaryDesc.retention_risks];

  return {
    primary_driver,
    secondary_driver,
    driver_scores,
    motivation_intensity,
    summary,
    what_motivates,
    what_demotivates,
    ideal_role_characteristics,
    retention_risks
  };
}

export function getDriverDescription(driver: MotivationalDriver) {
  return driverDescriptions[driver];
}

export function getTeamMotivationInsights(profiles: MotivationalProfile[]): {
  team_balance: string;
  potential_conflicts: string[];
  management_recommendations: string[];
} {
  const driverCounts: Record<MotivationalDriver, number> = {
    achievement: 0,
    affiliation: 0,
    power_influence: 0,
    autonomy: 0,
    security: 0,
    variety: 0
  };

  profiles.forEach(p => {
    driverCounts[p.primary_driver]++;
  });

  const dominantDriver = Object.entries(driverCounts)
    .sort(([, a], [, b]) => b - a)[0][0] as MotivationalDriver;

  let team_balance = '';
  const achievementPct = (driverCounts.achievement / profiles.length) * 100;
  const affiliationPct = (driverCounts.affiliation / profiles.length) * 100;
  const powerPct = (driverCounts.power_influence / profiles.length) * 100;

  if (achievementPct > 50) {
    team_balance = 'Highly achievement-driven team. Competitive, goal-focused culture.';
  } else if (affiliationPct > 50) {
    team_balance = 'Relationship-oriented team. Collaborative, supportive culture.';
  } else if (powerPct > 30) {
    team_balance = 'Leadership-heavy team. Multiple drivers seeking influence.';
  } else {
    team_balance = 'Balanced team with diverse motivational drivers.';
  }

  const potential_conflicts = [];
  if (driverCounts.power_influence > 2 && profiles.length < 8) {
    potential_conflicts.push('Multiple power-driven individuals may compete for leadership');
  }
  if (driverCounts.autonomy > 3 && driverCounts.affiliation > 3) {
    potential_conflicts.push('Tension between autonomy-seekers and collaboration-seekers');
  }
  if (driverCounts.variety > 3 && driverCounts.security > 3) {
    potential_conflicts.push('Conflict between change-seekers and stability-seekers');
  }

  const management_recommendations = [];
  if (achievementPct > 40) {
    management_recommendations.push('Set clear, measurable goals and recognize achievements publicly');
  }
  if (affiliationPct > 30) {
    management_recommendations.push('Invest in team-building and maintain strong social culture');
  }
  if (driverCounts.power_influence > 2) {
    management_recommendations.push('Provide leadership opportunities and influence pathways for multiple individuals');
  }
  if (driverCounts.autonomy > 3) {
    management_recommendations.push('Minimize micromanagement; trust-based delegation essential');
  }
  if (driverCounts.security > 3) {
    management_recommendations.push('Communicate changes clearly and provide stability wherever possible');
  }
  if (driverCounts.variety > 3) {
    management_recommendations.push('Rotate assignments and provide diverse project opportunities');
  }

  return {
    team_balance,
    potential_conflicts,
    management_recommendations
  };
}

