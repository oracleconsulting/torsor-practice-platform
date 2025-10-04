// API endpoints for skills matrix management
// Base API configuration would be imported here
// import { api } from './base';

// Mock API for demonstration
const api = {
  get: async (url: string, config?: any) => ({ data: [] }),
  post: async (url: string, data?: any) => ({ data: {} }),
  put: async (url: string, data?: any) => ({ data: {} }),
  delete: async (url: string) => Promise.resolve()
};

// Types
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillAssessment {
  id: string;
  teamMemberId: string;
  skillId: string;
  currentLevel: number;
  interestLevel: number;
  yearsExperience: number;
  lastUsedDate: string;
  certifications: string[];
  assessedBy: string;
  assessmentType: 'self' | 'manager' | '360';
  assessmentDate: string;
  notes: string;
}

export interface DevelopmentPlan {
  id: string;
  teamMemberId: string;
  skillId: string;
  targetLevel: number;
  targetDate: string;
  trainingMethod: string;
  status: 'planned' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  priority: number;
  budget?: number;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamSkillRequirement {
  id: string;
  department: string;
  role: string;
  skillId: string;
  requiredLevel: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface GapAnalysisParams {
  teamId?: string;
  department?: string;
  minGap?: number;
  category?: string;
}

export interface GapAnalysisResult {
  skillId: string;
  skillName: string;
  category: string;
  requiredLevel: number;
  avgCurrentLevel: number;
  gap: number;
  memberCount: number;
  avgInterest: number;
  priority: number;
  businessImpact: 'high' | 'medium' | 'low';
  affectedMembers: Array<{
    id: string;
    name: string;
    role: string;
    currentLevel: number;
    interestLevel: number;
  }>;
}

export interface TeamMetrics {
  capabilityScore: number;
  avgSkillLevel: number;
  criticalGaps: number;
  highInterestCount: number;
  successionRisk: number;
  trainingROI: number;
  categoryBreakdown: Array<{
    category: string;
    score: number;
    benchmark?: number;
  }>;
}

export interface ProgressUpdate {
  planId: string;
  milestoneId?: string;
  progress: number;
  notes?: string;
  completedAt?: string;
}

// Skills Management API
export const skillsApi = {
  // Get all skills
  getAllSkills: async (): Promise<Skill[]> => {
    const response = await api.get('/skills');
    return response.data;
  },

  // Get skills by category
  getSkillsByCategory: async (category: string): Promise<Skill[]> => {
    const response = await api.get(`/skills/category/${category}`);
    return response.data;
  },

  // Create new skill
  createSkill: async (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> => {
    const response = await api.post('/skills', skill);
    return response.data;
  },

  // Update skill
  updateSkill: async (id: string, skill: Partial<Skill>): Promise<Skill> => {
    const response = await api.put(`/skills/${id}`, skill);
    return response.data;
  },

  // Delete skill
  deleteSkill: async (id: string): Promise<void> => {
    await api.delete(`/skills/${id}`);
  },

  // Get skill categories
  getSkillCategories: async (): Promise<string[]> => {
    const response = await api.get('/skills/categories');
    return response.data;
  }
};

// Assessments API
export const assessmentsApi = {
  // Create new assessment
  createAssessment: async (assessment: Omit<SkillAssessment, 'id' | 'assessmentDate'>): Promise<SkillAssessment> => {
    const response = await api.post('/assessments', assessment);
    return response.data;
  },

  // Get team assessments
  getTeamAssessments: async (teamId?: string): Promise<SkillAssessment[]> => {
    const url = teamId ? `/assessments/team/${teamId}` : '/assessments/team';
    const response = await api.get(url);
    return response.data;
  },

  // Get member assessments
  getMemberAssessments: async (memberId: string): Promise<SkillAssessment[]> => {
    const response = await api.get(`/assessments/member/${memberId}`);
    return response.data;
  },

  // Bulk assessment import
  bulkAssessment: async (assessments: Omit<SkillAssessment, 'id' | 'assessmentDate'>[]): Promise<SkillAssessment[]> => {
    const response = await api.post('/assessments/bulk', { assessments });
    return response.data;
  },

  // Update assessment
  updateAssessment: async (id: string, assessment: Partial<SkillAssessment>): Promise<SkillAssessment> => {
    const response = await api.put(`/assessments/${id}`, assessment);
    return response.data;
  },

  // Delete assessment
  deleteAssessment: async (id: string): Promise<void> => {
    await api.delete(`/assessments/${id}`);
  }
};

// Gap Analysis API
export const gapAnalysisApi = {
  // Get gap analysis
  getGapAnalysis: async (params: GapAnalysisParams): Promise<GapAnalysisResult[]> => {
    const response = await api.post('/analysis/gaps', params);
    return response.data;
  },

  // Get priority matrix data
  getPriorityMatrix: async (): Promise<Array<{
    skillId: string;
    skillName: string;
    gap: number;
    interest: number;
    priority: number;
    memberCount: number;
  }>> => {
    const response = await api.get('/analysis/priority-matrix');
    return response.data;
  },

  // Get succession risks
  getSuccessionRisks: async (): Promise<Array<{
    skillId: string;
    skillName: string;
    expertsCount: number;
    experts: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    risk: 'high' | 'medium' | 'low';
  }>> => {
    const response = await api.get('/analysis/succession-risks');
    return response.data;
  }
};

// Development Planning API
export const developmentApi = {
  // Create development plan
  createDevelopmentPlan: async (plan: Omit<DevelopmentPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DevelopmentPlan> => {
    const response = await api.post('/development/plans', plan);
    return response.data;
  },

  // Get development plans for member
  getMemberPlans: async (memberId: string): Promise<DevelopmentPlan[]> => {
    const response = await api.get(`/development/plans/member/${memberId}`);
    return response.data;
  },

  // Get all development plans
  getAllPlans: async (): Promise<DevelopmentPlan[]> => {
    const response = await api.get('/development/plans');
    return response.data;
  },

  // Update development plan
  updateDevelopmentPlan: async (id: string, plan: Partial<DevelopmentPlan>): Promise<DevelopmentPlan> => {
    const response = await api.put(`/development/plans/${id}`, plan);
    return response.data;
  },

  // Track progress
  trackProgress: async (planId: string, progress: ProgressUpdate): Promise<void> => {
    await api.post(`/development/plans/${planId}/progress`, progress);
  },

  // Get recommendations
  getRecommendations: async (memberId: string): Promise<Array<{
    skillId: string;
    skillName: string;
    priority: 'high' | 'medium' | 'low';
    trainingType: string;
    provider: string;
    duration: string;
    cost?: number;
    description: string;
    learningPath: string[];
  }>> => {
    const response = await api.get(`/development/recommendations/${memberId}`);
    return response.data;
  },

  // Complete development plan
  completePlan: async (id: string, notes?: string): Promise<DevelopmentPlan> => {
    const response = await api.post(`/development/plans/${id}/complete`, { notes });
    return response.data;
  }
};

// Team Requirements API
export const requirementsApi = {
  // Get team skill requirements
  getTeamRequirements: async (): Promise<TeamSkillRequirement[]> => {
    const response = await api.get('/requirements');
    return response.data;
  },

  // Create team requirement
  createRequirement: async (requirement: Omit<TeamSkillRequirement, 'id' | 'createdAt'>): Promise<TeamSkillRequirement> => {
    const response = await api.post('/requirements', requirement);
    return response.data;
  },

  // Update team requirement
  updateRequirement: async (id: string, requirement: Partial<TeamSkillRequirement>): Promise<TeamSkillRequirement> => {
    const response = await api.put(`/requirements/${id}`, requirement);
    return response.data;
  },

  // Delete team requirement
  deleteRequirement: async (id: string): Promise<void> => {
    await api.delete(`/requirements/${id}`);
  }
};

// Metrics & Reporting API
export const metricsApi = {
  // Get team metrics
  getTeamMetrics: async (): Promise<TeamMetrics> => {
    const response = await api.get('/metrics/team');
    return response.data;
  },

  // Get capability score
  getCapabilityScore: async (): Promise<{
    overall: number;
    byCategory: Array<{ category: string; score: number }>;
    trend: number;
  }> => {
    const response = await api.get('/metrics/capability-score');
    return response.data;
  },

  // Get benchmarks
  getBenchmarks: async (industry?: string): Promise<{
    industry: string;
    benchmarks: Array<{
      category: string;
      average: number;
      topQuartile: number;
      bottomQuartile: number;
    }>;
  }> => {
    const params = industry ? { industry } : {};
    const response = await api.get('/metrics/benchmarks', { params });
    return response.data;
  },

  // Get development trends
  getDevelopmentTrends: async (period: 'monthly' | 'quarterly' | 'yearly'): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  }> => {
    const response = await api.get('/metrics/development-trends', { params: { period } });
    return response.data;
  },

  // Get ROI metrics
  getROIMetrics: async (): Promise<{
    totalInvestment: number;
    skillsImproved: number;
    avgLevelIncrease: number;
    roi: number;
    trend: number;
  }> => {
    const response = await api.get('/metrics/roi');
    return response.data;
  }
};

// Export API
export const exportApi = {
  // Export skills matrix
  exportMatrix: async (format: 'csv' | 'xlsx' | 'pdf'): Promise<Blob> => {
    const response = await api.get(`/export/matrix.${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export gap analysis
  exportGapAnalysis: async (format: 'csv' | 'xlsx' | 'pdf'): Promise<Blob> => {
    const response = await api.get(`/export/gap-analysis.${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export development plans
  exportDevelopmentPlans: async (format: 'csv' | 'xlsx' | 'pdf'): Promise<Blob> => {
    const response = await api.get(`/export/development-plans.${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export team metrics
  exportTeamMetrics: async (format: 'csv' | 'xlsx' | 'pdf'): Promise<Blob> => {
    const response = await api.get(`/export/team-metrics.${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Utility functions
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export all APIs
export const skillsMatrixApi = {
  skills: skillsApi,
  assessments: assessmentsApi,
  gapAnalysis: gapAnalysisApi,
  development: developmentApi,
  requirements: requirementsApi,
  metrics: metricsApi,
  export: exportApi
};

export default skillsMatrixApi;
