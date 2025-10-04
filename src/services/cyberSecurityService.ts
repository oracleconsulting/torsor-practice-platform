import { supabase } from '@/lib/supabase/client';

export interface CyberSecurityAssessment {
  company_name: string;
  assessment_date: Date;
  has_security_policy: boolean;
  policy_last_updated?: string;
  has_incident_response_plan: boolean;
  uses_mfa: boolean;
  password_policy_enforced: boolean;
  access_reviews_conducted: boolean;
  data_encrypted_at_rest: boolean;
  data_encrypted_in_transit: boolean;
  has_data_backup_solution: boolean;
  backups_tested_regularly: boolean;
  security_training_provided: boolean;
  training_frequency?: string;
  vulnerability_scans_performed: boolean;
  penetration_tests_conducted: boolean;
  third_party_risk_assessed: boolean;
  additional_comments?: string;
  overall_confidence_score: number;
}

export const cyberSecurityService = {
  async submitAssessment(assessment: CyberSecurityAssessment): Promise<any> {
    try {
      const response = await fetch('/api/accountancy/partners/assessments/cybersecurity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessment),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting cyber security assessment:', error);
      throw error;
    }
  },

  async getAssessmentHistory(): Promise<CyberSecurityAssessment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cyber_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      return [];
    }
  },

  async getLatestAssessment(): Promise<CyberSecurityAssessment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cyber_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
      return null;
    }
  },

  calculateSecurityScore(assessment: CyberSecurityAssessment): number {
    let score = 0;
    let totalQuestions = 0;

    // Policy and Governance (20%)
    if (assessment.has_security_policy) score += 10;
    if (assessment.has_incident_response_plan) score += 10;
    totalQuestions += 2;

    // Access Control (25%)
    if (assessment.uses_mfa) score += 8;
    if (assessment.password_policy_enforced) score += 8;
    if (assessment.access_reviews_conducted) score += 9;
    totalQuestions += 3;

    // Data Protection (25%)
    if (assessment.data_encrypted_at_rest) score += 8;
    if (assessment.data_encrypted_in_transit) score += 8;
    if (assessment.has_data_backup_solution) score += 5;
    if (assessment.backups_tested_regularly) score += 4;
    totalQuestions += 4;

    // Training and Testing (20%)
    if (assessment.security_training_provided) score += 8;
    if (assessment.vulnerability_scans_performed) score += 6;
    if (assessment.penetration_tests_conducted) score += 6;
    totalQuestions += 3;

    // Vendor Management (10%)
    if (assessment.third_party_risk_assessed) score += 10;
    totalQuestions += 1;

    return Math.round((score / (totalQuestions * 10)) * 100);
  },

  getSecurityRecommendations(assessment: CyberSecurityAssessment): string[] {
    const recommendations: string[] = [];

    if (!assessment.has_security_policy) {
      recommendations.push('Develop and implement a comprehensive security policy');
    }

    if (!assessment.has_incident_response_plan) {
      recommendations.push('Create an incident response plan for security breaches');
    }

    if (!assessment.uses_mfa) {
      recommendations.push('Implement Multi-Factor Authentication for all accounts');
    }

    if (!assessment.password_policy_enforced) {
      recommendations.push('Enforce strong password policies across all systems');
    }

    if (!assessment.data_encrypted_at_rest) {
      recommendations.push('Enable encryption for data at rest');
    }

    if (!assessment.data_encrypted_in_transit) {
      recommendations.push('Ensure all data transmission is encrypted');
    }

    if (!assessment.security_training_provided) {
      recommendations.push('Provide regular security awareness training to employees');
    }

    if (!assessment.vulnerability_scans_performed) {
      recommendations.push('Implement regular vulnerability scanning');
    }

    if (!assessment.penetration_tests_conducted) {
      recommendations.push('Conduct periodic penetration testing');
    }

    if (!assessment.third_party_risk_assessed) {
      recommendations.push('Assess security risks from third-party vendors');
    }

    return recommendations;
  }
}; 