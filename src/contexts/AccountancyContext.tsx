import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { Practice, HealthScore, Rescue, TeamMember, AdvisoryProgress, HandoverComplaint, AlternateAuditor } from '../types/accountancy';
import { MockAccountancyAPI } from '../services/accountancy/mockApi';
import { AccountancyStorage } from '../services/accountancy/storage';
import { DashboardLayout } from '../components/accountancy/dashboard/DashboardGrid';

// Widget data types
interface AlternateAuditorData {
  id: string;
  name: string;
  registrationNumber: string;
  status: 'active' | 'pending' | 'expired';
  expiryDate: string;
  specializations: string[];
  lastAudit: string;
}

interface MTDCapacityData {
  currentCapacity: number;
  targetCapacity: number;
  readinessScore: number;
  trainingProgress: number;
  systemIntegration: number;
  clientOnboarding: number;
}

interface ESGData {
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  overallScore: number;
  lastAssessment: string;
  nextReview: string;
}

interface ContinuityData {
  planStatus: 'complete' | 'in_progress' | 'outdated';
  lastReview: string;
  nextReview: string;
  riskScore: number;
  recoveryTime: number;
  criticalFunctions: string[];
}

interface SecurityData {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastScan: string;
  vulnerabilities: number;
  complianceScore: number;
  securityScore: number;
}

interface WellnessData {
  overallScore: number;
  stressLevel: 'low' | 'medium' | 'high';
  burnoutRisk: number;
  workLifeBalance: number;
  teamSatisfaction: number;
  lastSurvey: string;
}

interface AccountancyContextType {
  practice: Practice | null;
  practiceId: string | null;
  memberRole: string | null;
  healthScore: HealthScore | null;
  rescues: Rescue[];
  team: TeamMember[];
  advisoryProgress: AdvisoryProgress | null;
  complaints: HandoverComplaint[];
  loading: boolean;
  error: string | null;
  subscriptionTier: 'free' | 'professional' | 'excellence' | 'enterprise';
  alternateAuditor: AlternateAuditor | null;
  mtdCapacity: MTDCapacityData | null;
  esgReporting: ESGData | null;
  continuityPlan: ContinuityData | null;
  cyberSecurity: SecurityData | null;
  teamWellness: WellnessData | null;
  widgetLayout: DashboardLayout | null;
  isUsingMockData: boolean;
  updatePractice: (data: Partial<Practice>) => Promise<void>;
  refreshHealthScore: () => Promise<void>;
  refreshRescues: () => Promise<void>;
  refreshTeam: () => Promise<void>;
  updateRescueProgress: (rescueId: string, progress: number) => Promise<void>;
  initializePractice: () => Promise<void>;
  updateWidgetLayout: (layout: DashboardLayout) => void;
  refreshWidgetData: (widgetId: string) => Promise<void>;
  refreshAlternateAuditor: () => Promise<void>;
  refreshMTDCapacity: () => Promise<void>;
  refreshESGReporting: () => Promise<void>;
  refreshContinuityPlan: () => Promise<void>;
  refreshCyberSecurity: () => Promise<void>;
  refreshTeamWellness: () => Promise<void>;
  clearMockData: () => void;
}

const AccountancyContext = createContext<AccountancyContextType | undefined>(undefined);

export const AccountancyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Core state
  const [practice, setPractice] = useState<Practice | null>(null);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [practiceInitialized, setPracticeInitialized] = useState(false);

  // Feature state
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [advisoryProgress, setAdvisoryProgress] = useState<AdvisoryProgress | null>(null);
  const [complaints, setComplaints] = useState<HandoverComplaint[]>([]);

  // Widget state
  const [alternateAuditor, setAlternateAuditor] = useState<AlternateAuditor | null>(null);
  const [mtdCapacity, setMTDCapacity] = useState<MTDCapacityData | null>(null);
  const [esgReporting, setESGReporting] = useState<ESGData | null>(null);
  const [continuityPlan, setContinuityPlan] = useState<ContinuityData | null>(null);
  const [cyberSecurity, setCyberSecurity] = useState<SecurityData | null>(null);
  const [teamWellness, setTeamWellness] = useState<WellnessData | null>(null);
  const [widgetLayout, setWidgetLayout] = useState<DashboardLayout | null>(null);

  useEffect(() => {
    if (user && !practiceInitialized) {
      console.log('[AccountancyContext] User authenticated, loading practice...');
      loadPracticeData();
      setPracticeInitialized(true);
    } else if (!user) {
      // Clear practice data when user logs out
      setPractice(null);
      setPracticeId(null);
      setPracticeInitialized(false);
      AccountancyStorage.clearAll();
    }
  }, [user?.id]); // Only re-run when user ID changes

  const loadPracticeData = async () => {
    if (!user) {
      console.log('[AccountancyContext] No user, skipping practice load');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[AccountancyContext] Loading practice for user:', user.id);

      // For demo purposes, always create mock practice immediately
      console.log('[AccountancyContext] Creating mock practice for demo');
      
      const mockPractice: Practice = {
        id: '6d0a4f47-1a98-4bba-be4e-26c439b1358d',
        name: 'IVC Accounting - Demo',
        email: 'james@ivcaccounting.co.uk',
        contactName: 'James Howard',
        teamSize: 5,
        subscription: 'enterprise',
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setPractice(mockPractice);
      setPracticeId(mockPractice.id);
      setMemberRole('owner');
      setLoading(false);
      
      // Store in cache for persistence
      AccountancyStorage.savePractice(mockPractice);
      
      console.log('[AccountancyContext] Mock practice created and set:', mockPractice);
      return;

    } catch (error: any) {
      console.error('[AccountancyContext] Unexpected error:', error);
      setError('Unable to load practice data. Please try refreshing the page.');
      
      // Create mock practice as fallback even on error
      const mockPractice: Practice = {
        id: '6d0a4f47-1a98-4bba-be4e-26c439b1358d',
        name: 'IVC Accounting - Demo',
        email: 'james@ivcaccounting.co.uk',
        contactName: 'James Howard',
        teamSize: 5,
        subscription: 'enterprise',
        subscription_tier: 'enterprise',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setPractice(mockPractice);
      setPracticeId(mockPractice.id);
      setMemberRole('owner');
      setLoading(false);
      
      // Store in cache for persistence
      AccountancyStorage.savePractice(mockPractice);
      
      console.log('[AccountancyContext] Mock practice created as fallback:', mockPractice);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = async () => {
    try {
      // DON'T use mock data in production
      const savedPractice = AccountancyStorage.getPractice();
      if (savedPractice && !savedPractice.id.startsWith('practice-')) {
        // Only use saved practice if it has a real UUID, not mock ID
        setPractice(savedPractice);
        setPracticeId(savedPractice.id);
        await loadFeatureData();
      } else {
        // Don't fall back to mock data - show error instead
        console.warn('[AccountancyContext] No valid practice found in localStorage');
        setError('No practice found. Please refresh the page.');
        // Clear any invalid saved data
        AccountancyStorage.clearAll();
      }
    } catch (error) {
      console.error('Failed to load local data:', error);
      setError('Failed to load practice data');
    } finally {
      setLoading(false);
    }
  };

  const loadFeatureData = async () => {
    try {
      // Load saved or mock data
      const savedHealthScore = AccountancyStorage.getHealthScore();
      const savedRescues = AccountancyStorage.getRescues();
      const savedTeam = AccountancyStorage.getTeam();

      if (savedHealthScore) {
        setHealthScore(savedHealthScore);
      } else {
        const newHealthScore = await MockAccountancyAPI.getHealthScore();
        setHealthScore(newHealthScore);
      }

      if (savedRescues.length > 0) {
        setRescues(savedRescues);
      } else {
        const newRescues = await MockAccountancyAPI.getRescues();
        setRescues(newRescues);
      }

      if (savedTeam.length > 0) {
        setTeam(savedTeam);
      } else {
        const newTeam = await MockAccountancyAPI.getTeam();
        setTeam(newTeam);
      }

      // Update team size
      if (practice) {
        setPractice(prev => prev ? { ...prev, teamSize: team.length } : null);
      }

      const progress = await MockAccountancyAPI.getAdvisoryProgress();
      setAdvisoryProgress(progress);

      if (MockAccountancyAPI.getComplaints) {
        const newComplaints = await MockAccountancyAPI.getComplaints();
        setComplaints(newComplaints);
      }

      // Load widget data
      await loadWidgetData();

      // Initialize default widget layout
      const savedLayout = localStorage.getItem('accountancy-widget-layout');
      if (savedLayout) {
        setWidgetLayout(JSON.parse(savedLayout));
      } else {
        const defaultLayout: DashboardLayout = {
          widgets: [
            { id: 'health-score', gridArea: '1 / 1 / 2 / 2', visible: true, expanded: false, order: 1 },
            { id: 'advisory-progress', gridArea: '1 / 2 / 2 / 3', visible: true, expanded: false, order: 2 },
            { id: 'quick-actions', gridArea: '2 / 1 / 3 / 3', visible: true, expanded: false, order: 3 },
            { id: 'active-rescues', gridArea: '3 / 1 / 4 / 2', visible: true, expanded: false, order: 4 },
            { id: 'team-cpd', gridArea: '3 / 2 / 4 / 3', visible: true, expanded: false, order: 5 },
            { id: 'handover-complaints', gridArea: '4 / 1 / 5 / 3', visible: true, expanded: false, order: 6 }
          ],
          columns: 2,
          rows: 4
        };
        setWidgetLayout(defaultLayout);
      }
    } catch (error) {
      console.error('Failed to load feature data:', error);
    }
  };

  const loadWidgetData = async () => {
    // Mock data for widgets - replace with real data later
    setAlternateAuditor({
      id: 'auditor-1',
      practiceId: practiceId || 'practice-1',
      alternateName: 'John Smith',
      alternateFirm: ' ACCOUNTING',
      alternateEmail: 'john@smithassociates.co.uk',
      alternatePhone: '+44 20 7123 4567',
      rpbNumber: 'AUD123456',
      rpbType: 'ICAEW',
      engagementLetter: {
        url: '/documents/engagement-letter.pdf',
        uploadedAt: '2024-12-01T10:00:00Z',
        fileName: 'Engagement Letter.pdf',
        fileSize: 245760,
        verified: true
      },
      piCertificate: {
        url: '/documents/pi-certificate.pdf',
        uploadedAt: '2024-12-01T10:00:00Z',
        expiryDate: '2025-12-31',
        fileName: 'PI Certificate.pdf',
        fileSize: 189440,
        verified: true
      },
      complianceDeadline: '2025-12-01',
      lastVerified: '2024-12-01T10:00:00Z',
      status: 'compliant',
      specializations: ['SME', 'Charities', 'Property'],
      reciprocalArrangement: true,
      annualFee: 2500,
      auditTrail: [],
      notifications: [],
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z'
    });

    setMTDCapacity({
      currentCapacity: 75,
      targetCapacity: 100,
      readinessScore: 68,
      trainingProgress: 60,
      systemIntegration: 80,
      clientOnboarding: 70
    });

    setESGReporting({
      environmentalScore: 72,
      socialScore: 85,
      governanceScore: 78,
      overallScore: 78,
      lastAssessment: '2024-12-01',
      nextReview: '2025-06-01'
    });

    setContinuityPlan({
      planStatus: 'in_progress',
      lastReview: '2024-10-15',
      nextReview: '2025-04-15',
      riskScore: 65,
      recoveryTime: 48,
      criticalFunctions: ['Client Services', 'Payroll', 'Tax Returns']
    });

    setCyberSecurity({
      threatLevel: 'medium',
      lastScan: '2024-12-10',
      vulnerabilities: 3,
      complianceScore: 85,
      securityScore: 78
    });

    setTeamWellness({
      overallScore: 72,
      stressLevel: 'medium',
      burnoutRisk: 35,
      workLifeBalance: 68,
      teamSatisfaction: 75,
      lastSurvey: '2024-11-30'
    });
  };

  const updatePractice = async (data: Partial<Practice>) => {
    if (!practice || !practiceId) return;

    try {
      const updated = { ...practice, ...data, updatedAt: new Date() };
      setPractice(updated);
      AccountancyStorage.savePractice(updated);

      // Update in database if user is authenticated
      if (user && practiceId) {
        const { error } = await supabase
          .from('practices')
          .update({
            name: data.name,
            email: data.email,
            subscription_tier: data.subscription,
            updated_at: new Date().toISOString()
          })
          .eq('owner_id', user.id);

        if (error) {
          console.error('[AccountancyContext] Update practice error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Check for specific RLS error
          if (error.code === '42501') {
            toast.error('Permission denied. You do not have access to update this practice.');
          } else if (error.message?.includes('violates row-level security policy')) {
            toast.error('Access denied by security policy. Only practice owners can make changes.');
          } else {
            toast.error(`Failed to save changes: ${error.message}`);
          }
        } else {
          toast.success('Practice updated successfully');
        }
      }
    } catch (error) {
      console.error('Failed to update practice:', error);
      toast.error('Failed to update practice');
    }
  };

  // Mock refresh functions - implement with real data later
  const refreshHealthScore = async () => {
    try {
      const newHealthScore = await MockAccountancyAPI.getHealthScore();
      setHealthScore(newHealthScore);
      AccountancyStorage.saveHealthScore(newHealthScore);
    } catch (error) {
      console.error('Failed to refresh health score:', error);
    }
  };

  const refreshRescues = async () => {
    try {
      const newRescues = await MockAccountancyAPI.getRescues();
      setRescues(newRescues);
      AccountancyStorage.saveRescues(newRescues);
    } catch (error) {
      console.error('Failed to refresh rescues:', error);
    }
  };

  const refreshTeam = async () => {
    try {
      const newTeam = await MockAccountancyAPI.getTeam();
      setTeam(newTeam);
      AccountancyStorage.saveTeam(newTeam);
    } catch (error) {
      console.error('Failed to refresh team:', error);
    }
  };

  const updateRescueProgress = async (rescueId: string, progress: number) => {
    try {
      await MockAccountancyAPI.updateRescueProgress(rescueId, progress);
      const updatedRescues = rescues.map(rescue =>
        rescue.id === rescueId
          ? { ...rescue, progress, updatedAt: new Date().toISOString() }
          : rescue
      );
      setRescues(updatedRescues);
      AccountancyStorage.saveRescues(updatedRescues);
    } catch (error) {
      console.error('Failed to update rescue progress:', error);
    }
  };

  const initializePractice = async () => {
    if (practiceInitialized || !user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[AccountancyContext] Initializing practice for user:', user.id);

      // First, check if user has a practice as owner
      let { data: existingPractice, error: practiceError } = await supabase
        .from('practices')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existingPractice && !practiceError) {
        console.log('[AccountancyContext] Found existing practice as owner:', existingPractice.id);
        
        // Map database fields to Practice type
        const practiceData: Practice = {
          id: existingPractice.id,
          name: existingPractice.name,
          email: existingPractice.email,
          contactName: existingPractice.name.split(' ')[0],
          teamSize: 1,
          subscription: (existingPractice.subscription_tier || 'professional') as any,
          createdAt: new Date(existingPractice.created_at),
          updatedAt: new Date(existingPractice.updated_at)
        };
        
        setPractice(practiceData);
        setPracticeId(practiceData.id);
        setPracticeInitialized(true);
        await loadPracticeData();
        return;
      }

      // If no practice as owner, check accountancy_users for practice membership
      console.log('[AccountancyContext] No practice as owner, checking accountancy_users for membership');
      
      const { data: accountancyUser, error: userError } = await supabase
        .from('accountancy_users')
        .select('practice_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (accountancyUser?.practice_id) {
        // User is a member of a practice, load that practice
        const { data: memberPractice, error: memberError } = await supabase
          .from('practices')
          .select('*')
          .eq('id', accountancyUser.practice_id)
          .single();

        if (memberPractice && !memberError) {
          console.log('[AccountancyContext] Found practice as member:', memberPractice.id);
          
          const practiceData: Practice = {
            id: memberPractice.id,
            name: memberPractice.name,
            email: memberPractice.email,
            contactName: memberPractice.name.split(' ')[0],
            teamSize: 1,
            subscription: (memberPractice.subscription_tier || 'professional') as any,
            createdAt: new Date(memberPractice.created_at),
            updatedAt: new Date(memberPractice.updated_at)
          };
          
          setPractice(practiceData);
          setPracticeId(practiceData.id);
          setPracticeInitialized(true);
          await loadPracticeData();
          return;
        }
      }

      // If no practice exists, create a new one
      console.log('[AccountancyContext] No practice found, creating new practice');
      
      const { data: fullAccountancyUser, error: fullUserError } = await supabase
        .from('accountancy_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fullAccountancyUser) {
        // If user has practice_id, try to load that practice (should have been caught above)
        if (fullAccountancyUser.practice_id) {
          const { data: practiceById } = await supabase
            .from('practices')
            .select('*')
            .eq('id', fullAccountancyUser.practice_id)
            .single();
            
          if (practiceById) {
            const practiceData: Practice = {
              id: practiceById.id,
              name: practiceById.name,
              email: practiceById.email,
              contactName: practiceById.name.split(' ')[0],
              teamSize: 1,
              subscription: (practiceById.subscription_tier || 'professional') as any,
              createdAt: new Date(practiceById.created_at),
              updatedAt: new Date(practiceById.updated_at)
            };
            
            setPractice(practiceData);
            setPracticeId(practiceData.id);
            setPracticeInitialized(true);
            await loadPracticeData();
            return;
          }
        }
        
        // Create a new practice for this user
        console.log('[AccountancyContext] Creating new practice');
        const newPracticeData = {
          owner_id: user.id,
          name: fullAccountancyUser.practice_name || user.user_metadata?.practiceName || `${user.email}'s Practice`,
          email: fullAccountancyUser.email || user.email,
          phone: fullAccountancyUser.phone || user.user_metadata?.phone,
          address: fullAccountancyUser.address,
          city: fullAccountancyUser.city || 'London',
          country: fullAccountancyUser.country || 'UK',
          subscription_tier: fullAccountancyUser.subscription_tier || 'professional',
          subscription_status: 'active'
        };

        const { data: newPractice, error: createError } = await supabase
          .from('practices')
          .insert([newPracticeData])
          .select()
          .single();

        if (createError) {
          console.error('[AccountancyContext] Error creating practice:', createError);
          throw createError;
        }

        if (newPractice) {
          // Update accountancy_users with the new practice_id
          await supabase
            .from('accountancy_users')
            .update({ practice_id: newPractice.id })
            .eq('user_id', user.id);

          const practiceData: Practice = {
            id: newPractice.id,
            name: newPractice.name,
            email: newPractice.email,
            contactName: newPractice.name.split(' ')[0],
            teamSize: 1,
            subscription: (newPractice.subscription_tier || 'professional') as any,
            createdAt: new Date(newPractice.created_at),
            updatedAt: new Date(newPractice.updated_at)
          };
          
          setPractice(practiceData);
          setPracticeId(practiceData.id);
          setPracticeInitialized(true);
          await loadPracticeData();
        }
      }
    } catch (err: any) {
      console.error('[AccountancyContext] Error initializing practice:', err);
      setError(err.message);
      
      // Use mock data as last resort
      console.log('[AccountancyContext] Falling back to mock data');
      const mockPractice = await MockAccountancyAPI.initializePractice();
      setPractice(mockPractice);
      setPracticeId(mockPractice.id);
      setPracticeInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const updateWidgetLayout = (layout: DashboardLayout) => {
    setWidgetLayout(layout);
    localStorage.setItem('accountancy-widget-layout', JSON.stringify(layout));
  };

  const refreshWidgetData = async (widgetId: string) => {
    // Implement specific refresh logic for each widget
    console.log(`Refreshing widget: ${widgetId}`);
  };

  // Stub functions for widget refreshes
  const refreshAlternateAuditor = async () => console.log('Refreshing alternate auditor data...');
  const refreshMTDCapacity = async () => console.log('Refreshing MTD capacity data...');
  const refreshESGReporting = async () => console.log('Refreshing ESG reporting data...');
  const refreshContinuityPlan = async () => console.log('Refreshing continuity plan data...');
  const refreshCyberSecurity = async () => console.log('Refreshing cybersecurity data...');
  const refreshTeamWellness = async () => console.log('Refreshing team wellness data...');

  // Add a helper to check if using mock data
  const isUsingMockData = () => {
    return practiceId?.startsWith('practice-') || false;
  };

  return (
    <AccountancyContext.Provider value={{
      practice,
      practiceId,
      memberRole,
      healthScore,
      rescues,
      team,
      advisoryProgress,
      complaints,
      loading,
      error,
      subscriptionTier: practice?.subscription_tier || practice?.subscription || 'free',
      alternateAuditor,
      mtdCapacity,
      esgReporting,
      continuityPlan,
      cyberSecurity,
      teamWellness,
      widgetLayout,
      isUsingMockData: isUsingMockData(),
      updatePractice,
      refreshHealthScore,
      refreshRescues,
      refreshTeam,
      updateRescueProgress,
      initializePractice,
      updateWidgetLayout,
      refreshWidgetData,
      refreshAlternateAuditor,
      refreshMTDCapacity,
      refreshESGReporting,
      refreshContinuityPlan,
      refreshCyberSecurity,
      refreshTeamWellness,
      clearMockData: () => {
        if (isUsingMockData()) {
          AccountancyStorage.clearAll();
          setPractice(null);
          setPracticeId(null);
          // Reload to get real data
          window.location.reload();
        }
      }
    }}>
      {children}
    </AccountancyContext.Provider>
  );
};

export const useAccountancyContext = () => {
  const context = useContext(AccountancyContext);
  if (!context) {
    throw new Error('useAccountancyContext must be used within AccountancyProvider');
  }
  return context;
};