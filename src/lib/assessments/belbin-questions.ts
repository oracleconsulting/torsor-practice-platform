/**
 * Belbin Team Roles Assessment
 * Identifies preferred team roles based on the Belbin model (9 roles across 3 domains)
 */

export interface BelbinQuestion {
  id: number;
  statement: string;
  options: {
    text: string;
    value: BelbinRole;
    score: number;
  }[];
}

export type BelbinRole = 
  | 'plant' | 'monitor_evaluator' | 'specialist' // Thought-oriented
  | 'coordinator' | 'teamworker' | 'resource_investigator' // People-oriented
  | 'shaper' | 'implementer' | 'completer_finisher'; // Action-oriented

export const belbinQuestions: BelbinQuestion[] = [
  {
    id: 1,
    statement: "When working on a team project, I tend to:",
    options: [
      { text: "Generate creative, unconventional ideas", value: 'plant', score: 3 },
      { text: "Analyze options objectively and spot flaws", value: 'monitor_evaluator', score: 3 },
      { text: "Provide deep expertise in my specialist area", value: 'specialist', score: 3 },
      { text: "Coordinate the team and delegate effectively", value: 'coordinator', score: 3 },
      { text: "Build consensus and maintain harmony", value: 'teamworker', score: 3 },
      { text: "Network externally and explore opportunities", value: 'resource_investigator', score: 3 },
      { text: "Challenge the team and drive for results", value: 'shaper', score: 3 },
      { text: "Turn ideas into practical, workable plans", value: 'implementer', score: 3 },
      { text: "Perfect details and ensure high quality", value: 'completer_finisher', score: 3 },
    ]
  },
  {
    id: 2,
    statement: "My colleagues would describe me as someone who:",
    options: [
      { text: "Thinks outside the box and solves problems creatively", value: 'plant', score: 2 },
      { text: "Makes strategic, well-judged decisions", value: 'monitor_evaluator', score: 2 },
      { text: "Is the go-to expert for specific knowledge", value: 'specialist', score: 2 },
      { text: "Clarifies goals and promotes decision-making", value: 'coordinator', score: 2 },
      { text: "Listens well and prevents conflicts", value: 'teamworker', score: 2 },
      { text: "Is enthusiastic and explores new ideas", value: 'resource_investigator', score: 2 },
      { text: "Has the drive to overcome obstacles", value: 'shaper', score: 2 },
      { text: "Gets things done reliably and on time", value: 'implementer', score: 2 },
      { text: "Delivers thorough, polished work", value: 'completer_finisher', score: 2 },
    ]
  },
  {
    id: 3,
    statement: "In team meetings, I'm most likely to:",
    options: [
      { text: "Propose innovative solutions others haven't considered", value: 'plant', score: 3 },
      { text: "Weigh pros and cons before committing", value: 'monitor_evaluator', score: 3 },
      { text: "Share specialized knowledge and technical insights", value: 'specialist', score: 3 },
      { text: "Keep discussion on track and ensure everyone contributes", value: 'coordinator', score: 3 },
      { text: "Support others' ideas and build on them", value: 'teamworker', score: 3 },
      { text: "Share external contacts and market intelligence", value: 'resource_investigator', score: 3 },
      { text: "Push the team to make decisions and take action", value: 'shaper', score: 3 },
      { text: "Focus on what's realistic and achievable", value: 'implementer', score: 3 },
      { text: "Highlight potential errors and quality issues", value: 'completer_finisher', score: 3 },
    ]
  },
  {
    id: 4,
    statement: "When facing a difficult challenge, I:",
    options: [
      { text: "Step back and approach it from a new angle", value: 'plant', score: 2 },
      { text: "Analyze it thoroughly before acting", value: 'monitor_evaluator', score: 2 },
      { text: "Apply deep technical knowledge to solve it", value: 'specialist', score: 2 },
      { text: "Organize resources and delegate appropriately", value: 'coordinator', score: 2 },
      { text: "Rally the team and maintain morale", value: 'teamworker', score: 2 },
      { text: "Seek external help and new resources", value: 'resource_investigator', score: 2 },
      { text: "Confront it head-on with determination", value: 'shaper', score: 2 },
      { text: "Create a systematic plan and execute it", value: 'implementer', score: 2 },
      { text: "Work persistently until it's resolved perfectly", value: 'completer_finisher', score: 2 },
    ]
  },
  {
    id: 5,
    statement: "My strength in team contributions is:",
    options: [
      { text: "Imaginative thinking and original ideas", value: 'plant', score: 3 },
      { text: "Strategic thinking and sound judgment", value: 'monitor_evaluator', score: 3 },
      { text: "Specialized skills and dedicated focus", value: 'specialist', score: 3 },
      { text: "Mature, confident leadership", value: 'coordinator', score: 3 },
      { text: "Flexibility and diplomatic support", value: 'teamworker', score: 3 },
      { text: "Enthusiasm and external networking", value: 'resource_investigator', score: 3 },
      { text: "Drive, courage, and overcoming obstacles", value: 'shaper', score: 3 },
      { text: "Discipline, reliability, and efficiency", value: 'implementer', score: 3 },
      { text: "Perfectionism and attention to detail", value: 'completer_finisher', score: 3 },
    ]
  },
  {
    id: 6,
    statement: "A weakness I sometimes have in teams is:",
    options: [
      { text: "Being too absorbed in ideas to communicate effectively", value: 'plant', score: 1 },
      { text: "Over-analyzing and struggling to inspire others", value: 'monitor_evaluator', score: 1 },
      { text: "Focusing narrowly and missing the bigger picture", value: 'specialist', score: 1 },
      { text: "Delegating my own workload to others", value: 'coordinator', score: 1 },
      { text: "Being indecisive in critical situations", value: 'teamworker', score: 1 },
      { text: "Losing interest once initial enthusiasm fades", value: 'resource_investigator', score: 1 },
      { text: "Being impatient and potentially offending others", value: 'shaper', score: 1 },
      { text: "Being inflexible and slow to respond to new opportunities", value: 'implementer', score: 1 },
      { text: "Worrying unduly and finding it hard to delegate", value: 'completer_finisher', score: 1 },
    ]
  },
  {
    id: 7,
    statement: "I contribute most effectively when:",
    options: [
      { text: "I can work on complex problems independently", value: 'plant', score: 2 },
      { text: "I'm evaluating options and providing balanced advice", value: 'monitor_evaluator', score: 2 },
      { text: "My specialized knowledge is needed", value: 'specialist', score: 2 },
      { text: "I'm guiding and coordinating diverse contributions", value: 'coordinator', score: 2 },
      { text: "I'm helping team members work together smoothly", value: 'teamworker', score: 2 },
      { text: "I'm connecting with people and finding resources", value: 'resource_investigator', score: 2 },
      { text: "There's a need for drive and urgent action", value: 'shaper', score: 2 },
      { text: "Plans need to be executed efficiently", value: 'implementer', score: 2 },
      { text: "Work needs to meet the highest standards", value: 'completer_finisher', score: 2 },
    ]
  },
  {
    id: 8,
    statement: "Under pressure, I tend to:",
    options: [
      { text: "Withdraw to think and innovate", value: 'plant', score: 2 },
      { text: "Remain objective and analytical", value: 'monitor_evaluator', score: 2 },
      { text: "Focus on my area of expertise", value: 'specialist', score: 2 },
      { text: "Stay calm and delegate effectively", value: 'coordinator', score: 2 },
      { text: "Support stressed team members", value: 'teamworker', score: 2 },
      { text: "Seek help from external contacts", value: 'resource_investigator', score: 2 },
      { text: "Take charge and push forward", value: 'shaper', score: 2 },
      { text: "Focus on delivering what's promised", value: 'implementer', score: 2 },
      { text: "Worry about details and perfectionism", value: 'completer_finisher', score: 2 },
    ]
  },
];

export interface BelbinProfile {
  primary_role: BelbinRole;
  secondary_role: BelbinRole | null;
  role_scores: Record<BelbinRole, number>;
  domain_scores: {
    thought_oriented: number; // Plant, Monitor Evaluator, Specialist
    people_oriented: number; // Coordinator, Teamworker, Resource Investigator
    action_oriented: number; // Shaper, Implementer, Completer Finisher
  };
  summary: string;
  strengths: string[];
  allowable_weaknesses: string[];
  ideal_team_contributions: string;
}

const belbinRoleDescriptions: Record<BelbinRole, {
  name: string;
  category: string;
  description: string;
  strengths: string[];
  allowable_weaknesses: string[];
  team_contribution: string;
}> = {
  plant: {
    name: 'Plant',
    category: 'Thought-Oriented',
    description: 'Creative innovator who generates new ideas and solves difficult problems',
    strengths: ['Creative', 'Imaginative', 'Problem-solver', 'Thinks outside the box'],
    allowable_weaknesses: ['May be too preoccupied to communicate effectively', 'May ignore practical constraints'],
    team_contribution: 'Brings innovation and creative problem-solving to complex challenges'
  },
  monitor_evaluator: {
    name: 'Monitor Evaluator',
    category: 'Thought-Oriented',
    description: 'Strategic thinker who analyzes options objectively',
    strengths: ['Analytical', 'Strategic', 'Discerning', 'Sees all options'],
    allowable_weaknesses: ['May lack drive and ability to inspire', 'Can be overly critical'],
    team_contribution: 'Provides balanced analysis and sound judgment on key decisions'
  },
  specialist: {
    name: 'Specialist',
    category: 'Thought-Oriented',
    description: 'Dedicated expert who provides specialized knowledge and skills',
    strengths: ['Expert knowledge', 'Dedicated', 'Self-starting', 'Single-minded'],
    allowable_weaknesses: ['May contribute only on narrow front', 'May dwell on technicalities'],
    team_contribution: 'Brings deep expertise and technical knowledge to the team'
  },
  coordinator: {
    name: 'Coordinator',
    category: 'People-Oriented',
    description: 'Mature, confident leader who clarifies goals and delegates effectively',
    strengths: ['Confident', 'Clarifies goals', 'Delegates well', 'Recognizes talent'],
    allowable_weaknesses: ['May be seen as manipulative', 'May offload personal work'],
    team_contribution: 'Guides the team towards goals and ensures everyone contributes effectively'
  },
  teamworker: {
    name: 'Teamworker',
    category: 'People-Oriented',
    description: 'Cooperative, diplomatic team player who builds consensus',
    strengths: ['Cooperative', 'Diplomatic', 'Perceptive', 'Listens well'],
    allowable_weaknesses: ['May be indecisive in crunch situations', 'May avoid confrontation'],
    team_contribution: 'Maintains team harmony and supports others to work together effectively'
  },
  resource_investigator: {
    name: 'Resource Investigator',
    category: 'People-Oriented',
    description: 'Enthusiastic networker who explores opportunities and develops contacts',
    strengths: ['Enthusiastic', 'Communicative', 'Explores opportunities', 'Develops contacts'],
    allowable_weaknesses: ['May lose interest once initial enthusiasm fades', 'Can be over-optimistic'],
    team_contribution: 'Brings external ideas, resources, and opportunities to the team'
  },
  shaper: {
    name: 'Shaper',
    category: 'Action-Oriented',
    description: 'Dynamic, challenging individual who drives the team forward',
    strengths: ['Dynamic', 'Thrives on pressure', 'Has drive to overcome obstacles', 'Courageous'],
    allowable_weaknesses: ['May be provocative', 'May hurt people\'s feelings'],
    team_contribution: 'Provides drive and courage to tackle obstacles and meet challenges'
  },
  implementer: {
    name: 'Implementer',
    category: 'Action-Oriented',
    description: 'Disciplined, reliable executor who turns ideas into practical action',
    strengths: ['Practical', 'Reliable', 'Efficient', 'Turns ideas into action'],
    allowable_weaknesses: ['May be inflexible', 'May be slow to respond to new opportunities'],
    team_contribution: 'Converts plans into practical actions and organizes work efficiently'
  },
  completer_finisher: {
    name: 'Completer Finisher',
    category: 'Action-Oriented',
    description: 'Perfectionist who ensures thorough, high-quality completion',
    strengths: ['Perfectionist', 'Conscientious', 'Delivers on time', 'Attentive to detail'],
    allowable_weaknesses: ['May worry unduly', 'May be reluctant to delegate'],
    team_contribution: 'Ensures thorough, polished work and catches errors before completion'
  }
};

export function calculateBelbinProfile(answers: Record<number, BelbinRole>): BelbinProfile {
  const role_scores: Record<BelbinRole, number> = {
    plant: 0,
    monitor_evaluator: 0,
    specialist: 0,
    coordinator: 0,
    teamworker: 0,
    resource_investigator: 0,
    shaper: 0,
    implementer: 0,
    completer_finisher: 0
  };

  // Calculate scores for each role
  belbinQuestions.forEach(q => {
    const selectedRole = answers[q.id];
    if (selectedRole) {
      const option = q.options.find(opt => opt.value === selectedRole);
      if (option) {
        role_scores[selectedRole] += option.score;
      }
    }
  });

  // Find primary and secondary roles
  const sortedRoles = Object.entries(role_scores)
    .sort(([, a], [, b]) => b - a) as [BelbinRole, number][];
  
  const primary_role = sortedRoles[0][0];
  const secondary_role = sortedRoles[1][1] > 0 ? sortedRoles[1][0] : null;

  // Calculate domain scores
  const domain_scores = {
    thought_oriented: role_scores.plant + role_scores.monitor_evaluator + role_scores.specialist,
    people_oriented: role_scores.coordinator + role_scores.teamworker + role_scores.resource_investigator,
    action_oriented: role_scores.shaper + role_scores.implementer + role_scores.completer_finisher
  };

  const primaryDesc = belbinRoleDescriptions[primary_role];
  const secondaryDesc = secondary_role ? belbinRoleDescriptions[secondary_role] : null;

  const summary = secondaryDesc
    ? `Primary: ${primaryDesc.name} (${primaryDesc.category}) - ${primaryDesc.description}. Secondary: ${secondaryDesc.name} - ${secondaryDesc.description}`
    : `${primaryDesc.name} (${primaryDesc.category}) - ${primaryDesc.description}`;

  return {
    primary_role,
    secondary_role,
    role_scores,
    domain_scores,
    summary,
    strengths: primaryDesc.strengths,
    allowable_weaknesses: primaryDesc.allowable_weaknesses,
    ideal_team_contributions: primaryDesc.team_contribution
  };
}

export function getBelbinRoleDescription(role: BelbinRole) {
  return belbinRoleDescriptions[role];
}

export function getIdealTeamComposition(): string[] {
  return [
    'Balanced teams typically need 7-9 roles covered (can overlap with multi-role individuals)',
    'Thought-oriented: At least one Plant for innovation, one Monitor Evaluator for analysis',
    'People-oriented: One Coordinator for leadership, one Teamworker for harmony',
    'Action-oriented: One Shaper for drive, one Implementer for execution, one Completer Finisher for quality',
    'Small teams (3-5): Prioritize Plant, Coordinator, and Implementer',
    'Avoid: All Shapers (too much conflict), all Teamworkers (no drive), all Plants (no execution)'
  ];
}

