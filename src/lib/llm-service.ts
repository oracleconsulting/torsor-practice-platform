/**
 * LLM Service for AI-powered assessment analysis
 * Integrates with OpenAI/Anthropic for advanced insights
 */

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

export interface AssessmentAnalysisInput {
  teamMemberId: string;
  teamMemberName: string;
  assessments: {
    vark?: any;
    ocean?: any;
    belbin?: any;
    eq?: any;
    motivational?: any;
    conflict?: any;
    workingPrefs?: any;
    skills?: any[];
  };
  context?: {
    role?: string;
    seniority?: string;
    serviceLines?: string[];
  };
}

export interface AssessmentInsights {
  strengthsSummary: string;
  developmentAreas: string[];
  careerPathRecommendations: string[];
  teamFitAnalysis: string;
  learningStyleOptimization: string;
  conflictManagementTips: string[];
  leadershipPotential?: string;
  retentionRisk?: 'low' | 'medium' | 'high';
  burnoutRisk?: 'low' | 'medium' | 'high';
  idealRoles: string[];
}

export interface TeamCompatibilityInput {
  members: {
    id: string;
    name: string;
    assessments: AssessmentAnalysisInput['assessments'];
  }[];
  serviceLineContext?: string;
}

export interface TeamCompatibilityAnalysis {
  overallChemistry: number; // 0-100
  strengthsAsTeam: string[];
  potentialFrictions: {
    member1: string;
    member2: string;
    reason: string;
    mitigation: string;
  }[];
  roleRecommendations: {
    memberId: string;
    memberName: string;
    suggestedRole: string;
    reason: string;
  }[];
  communicationStrategy: string;
  optimalTeamSize: number;
}

export interface ServiceDeliveryInsights {
  serviceName: string;
  readiness: number;
  idealTeamComposition: {
    lead: { id: string; name: string; reason: string };
    support: { id: string; name: string; reason: string }[];
  };
  clientMatchingGuidance: string;
  deliveryRisks: string[];
  successPredictors: string[];
}

/**
 * Generate individual assessment insights using LLM
 */
export async function generateIndividualInsights(
  _input: AssessmentAnalysisInput,
  _config: LLMConfig
): Promise<AssessmentInsights> {
  // This will call the LLM API with structured prompts
  // For now, return a mock structure
  return {
    strengthsSummary: 'Analysis pending - LLM integration in progress',
    developmentAreas: [],
    careerPathRecommendations: [],
    teamFitAnalysis: '',
    learningStyleOptimization: '',
    conflictManagementTips: [],
    idealRoles: []
  };
}

/**
 * Analyze team compatibility and chemistry
 */
export async function analyzeTeamCompatibility(
  _input: TeamCompatibilityInput,
  _config: LLMConfig
): Promise<TeamCompatibilityAnalysis> {
  // LLM-powered team dynamics analysis
  return {
    overallChemistry: 0,
    strengthsAsTeam: [],
    potentialFrictions: [],
    roleRecommendations: [],
    communicationStrategy: '',
    optimalTeamSize: 0
  };
}

/**
 * Generate service delivery insights
 */
export async function generateServiceInsights(
  serviceName: string,
  _teamMembers: AssessmentAnalysisInput[],
  _config: LLMConfig
): Promise<ServiceDeliveryInsights> {
  // LLM-powered service delivery recommendations
  return {
    serviceName,
    readiness: 0,
    idealTeamComposition: {
      lead: { id: '', name: '', reason: '' },
      support: []
    },
    clientMatchingGuidance: '',
    deliveryRisks: [],
    successPredictors: []
  };
}

/**
 * Prompt templates for LLM
 */
export const PROMPT_TEMPLATES = {
  individualAnalysis: (data: AssessmentAnalysisInput) => `
You are an expert organizational psychologist analyzing professional assessment data.

Team Member: ${data.teamMemberName}
Role: ${data.context?.role || 'Not specified'}

Assessment Data:
${JSON.stringify(data.assessments, null, 2)}

Please provide:
1. A concise strengths summary (2-3 sentences)
2. Top 3-5 development areas
3. Career path recommendations
4. Team fit analysis
5. Learning style optimization tips
6. Conflict management strategies
7. Leadership potential assessment
8. Retention risk (low/medium/high) with reasoning
9. Burnout risk (low/medium/high) with reasoning
10. 3-5 ideal roles for this person

Format as JSON matching the AssessmentInsights interface.
`,

  teamCompatibility: (data: TeamCompatibilityInput) => `
You are an expert in team dynamics and organizational psychology.

Team Members: ${data.members.length}
Service Context: ${data.serviceLineContext || 'General advisory'}

Team Assessment Data:
${JSON.stringify(data.members, null, 2)}

Analyze:
1. Overall team chemistry score (0-100)
2. Team strengths (complementary skills, personality balance, etc.)
3. Potential friction points (personality clashes, communication mismatches)
4. Role recommendations for each member
5. Optimal communication strategy for this team
6. Optimal team size for this service

Format as JSON matching the TeamCompatibilityAnalysis interface.
`,

  serviceDelivery: (serviceName: string, teamData: any) => `
You are an expert in professional services delivery and team optimization.

Service Line: ${serviceName}
Team Data: ${JSON.stringify(teamData, null, 2)}

Provide:
1. Ideal team composition (who should lead, who should support, and why)
2. Client matching guidance (what type of clients this team is best suited for)
3. Delivery risks (based on team composition and skill gaps)
4. Success predictors (what indicates this team will deliver well)

Format as JSON matching the ServiceDeliveryInsights interface.
`
};

