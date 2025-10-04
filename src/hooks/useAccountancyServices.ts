import { useState, useEffect, useCallback } from 'react';
import { 
  accountancyServices,
  ApiResponse,
  AlternateAuditor,
  MTDClient,
  CapacityPlan,
  ESGAssessment,
  ContinuityPlan,
  PracticeValuation,
  SecurityProfile,
  SecurityIncident,
  StaffWellbeing
} from '../services/accountancyApiService';

// Generic hook for managing API state
const useApiState = <T>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Operation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
};

// Alternate Auditor Hooks
export const useAlternateAuditors = (practiceId: string) => {
  const [auditors, setAuditors] = useState<AlternateAuditor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.alternateAuditor.getAll(practiceId);
      if (response.success) {
        setAuditors(response.data);
      } else {
        setError(response.message || 'Failed to fetch auditors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch auditors');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const createAuditor = useCallback(async (data: Partial<AlternateAuditor>) => {
    try {
      const response = await accountancyServices.alternateAuditor.create(practiceId, data);
      if (response.success) {
        setAuditors(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create auditor');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const updateAuditor = useCallback(async (auditorId: string, data: Partial<AlternateAuditor>) => {
    try {
      const response = await accountancyServices.alternateAuditor.update(practiceId, auditorId, data);
      if (response.success) {
        setAuditors(prev => prev.map(auditor => 
          auditor.id === auditorId ? response.data : auditor
        ));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update auditor');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const deleteAuditor = useCallback(async (auditorId: string) => {
    try {
      const response = await accountancyServices.alternateAuditor.delete(practiceId, auditorId);
      if (response.success) {
        setAuditors(prev => prev.filter(auditor => auditor.id !== auditorId));
      } else {
        throw new Error(response.message || 'Failed to delete auditor');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const verifyAuditor = useCallback(async (auditorId: string) => {
    try {
      const response = await accountancyServices.alternateAuditor.verify(practiceId, auditorId);
      if (response.success) {
        setAuditors(prev => prev.map(auditor => 
          auditor.id === auditorId ? response.data : auditor
        ));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to verify auditor');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  useEffect(() => {
    if (practiceId) {
      fetchAuditors();
    }
  }, [practiceId, fetchAuditors]);

  return {
    auditors,
    loading,
    error,
    fetchAuditors,
    createAuditor,
    updateAuditor,
    deleteAuditor,
    verifyAuditor
  };
};

// MTD Capacity Hooks
export const useMTDCapacity = (practiceId: string) => {
  const [clients, setClients] = useState<MTDClient[]>([]);
  const [capacityPlans, setCapacityPlans] = useState<CapacityPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.mtdCapacity.getClients(practiceId);
      if (response.success) {
        setClients(response.data);
      } else {
        setError(response.message || 'Failed to fetch clients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const fetchCapacityPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.mtdCapacity.getCapacityPlans(practiceId);
      if (response.success) {
        setCapacityPlans(response.data);
      } else {
        setError(response.message || 'Failed to fetch capacity plans');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch capacity plans');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const createClient = useCallback(async (data: Partial<MTDClient>) => {
    try {
      const response = await accountancyServices.mtdCapacity.createClient(practiceId, data);
      if (response.success) {
        setClients(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create client');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const createCapacityPlan = useCallback(async (data: Partial<CapacityPlan>) => {
    try {
      const response = await accountancyServices.mtdCapacity.createCapacityPlan(practiceId, data);
      if (response.success) {
        setCapacityPlans(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create capacity plan');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  useEffect(() => {
    if (practiceId) {
      fetchClients();
      fetchCapacityPlans();
    }
  }, [practiceId, fetchClients, fetchCapacityPlans]);

  return {
    clients,
    capacityPlans,
    loading,
    error,
    fetchClients,
    fetchCapacityPlans,
    createClient,
    createCapacityPlan
  };
};

// ESG Reporting Hooks
export const useESGReporting = (practiceId: string) => {
  const [assessments, setAssessments] = useState<ESGAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.esgReporting.getAssessments(practiceId);
      if (response.success) {
        setAssessments(response.data);
      } else {
        setError(response.message || 'Failed to fetch assessments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const createAssessment = useCallback(async (data: Partial<ESGAssessment>) => {
    try {
      const response = await accountancyServices.esgReporting.createAssessment(practiceId, data);
      if (response.success) {
        setAssessments(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create assessment');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const generateReport = useCallback(async (assessmentId: string) => {
    try {
      const response = await accountancyServices.esgReporting.generateReport(practiceId, assessmentId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate report');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  useEffect(() => {
    if (practiceId) {
      fetchAssessments();
    }
  }, [practiceId, fetchAssessments]);

  return {
    assessments,
    loading,
    error,
    fetchAssessments,
    createAssessment,
    generateReport
  };
};

// Continuity Planning Hooks
export const useContinuityPlanning = (practiceId: string) => {
  const [plans, setPlans] = useState<ContinuityPlan[]>([]);
  const [valuation, setValuation] = useState<PracticeValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.continuityPlanning.getPlans(practiceId);
      if (response.success) {
        setPlans(response.data);
      } else {
        setError(response.message || 'Failed to fetch plans');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const fetchValuation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.continuityPlanning.getValuation(practiceId);
      if (response.success) {
        setValuation(response.data);
      } else {
        setError(response.message || 'Failed to fetch valuation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch valuation');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const createPlan = useCallback(async (data: Partial<ContinuityPlan>) => {
    try {
      const response = await accountancyServices.continuityPlanning.createPlan(practiceId, data);
      if (response.success) {
        setPlans(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create plan');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const calculateValue = useCallback(async (methodology: string) => {
    try {
      const response = await accountancyServices.continuityPlanning.calculateValue(practiceId, methodology);
      if (response.success) {
        setValuation(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to calculate value');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  useEffect(() => {
    if (practiceId) {
      fetchPlans();
      fetchValuation();
    }
  }, [practiceId, fetchPlans, fetchValuation]);

  return {
    plans,
    valuation,
    loading,
    error,
    fetchPlans,
    fetchValuation,
    createPlan,
    calculateValue
  };
};

// Cyber Security Hooks
export const useCyberSecurity = (practiceId: string) => {
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.cyberSecurity.getSecurityProfile(practiceId);
      if (response.success) {
        setSecurityProfile(response.data);
      } else {
        setError(response.message || 'Failed to fetch security profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security profile');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.cyberSecurity.getIncidents(practiceId);
      if (response.success) {
        setIncidents(response.data);
      } else {
        setError(response.message || 'Failed to fetch incidents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const runAssessment = useCallback(async () => {
    try {
      const response = await accountancyServices.cyberSecurity.runAssessment(practiceId);
      if (response.success) {
        setSecurityProfile(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to run assessment');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const createIncident = useCallback(async (data: Partial<SecurityIncident>) => {
    try {
      const response = await accountancyServices.cyberSecurity.createIncident(practiceId, data);
      if (response.success) {
        setIncidents(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create incident');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  useEffect(() => {
    if (practiceId) {
      fetchSecurityProfile();
      fetchIncidents();
    }
  }, [practiceId, fetchSecurityProfile, fetchIncidents]);

  return {
    securityProfile,
    incidents,
    loading,
    error,
    fetchSecurityProfile,
    fetchIncidents,
    runAssessment,
    createIncident
  };
};

// Team Wellness Hooks
export const useTeamWellness = (practiceId: string) => {
  const [staffWellbeing, setStaffWellbeing] = useState<StaffWellbeing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffWellbeing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountancyServices.teamWellness.getStaffWellbeing(practiceId);
      if (response.success) {
        setStaffWellbeing(response.data);
      } else {
        setError(response.message || 'Failed to fetch staff wellbeing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff wellbeing');
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  const createStaffMember = useCallback(async (data: Partial<StaffWellbeing>) => {
    try {
      const response = await accountancyServices.teamWellness.createStaffMember(practiceId, data);
      if (response.success) {
        setStaffWellbeing(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create staff member');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  const submitPulseSurvey = useCallback(async (staffId: string, data: any) => {
    try {
      const response = await accountancyServices.teamWellness.submitPulseSurvey(practiceId, staffId, data);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to submit pulse survey');
      }
    } catch (err) {
      throw err;
    }
  }, [practiceId]);

  useEffect(() => {
    if (practiceId) {
      fetchStaffWellbeing();
    }
  }, [practiceId, fetchStaffWellbeing]);

  return {
    staffWellbeing,
    loading,
    error,
    fetchStaffWellbeing,
    createStaffMember,
    submitPulseSurvey
  };
};

// Export all hooks
export const useAccountancyServices = {
  useAlternateAuditors,
  useMTDCapacity,
  useESGReporting,
  useContinuityPlanning,
  useCyberSecurity,
  useTeamWellness
}; 