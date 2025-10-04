import { useState, useEffect } from 'react';
import * as api from '../services/api/accountancy';
import { continuityAPI, cyberSecurityAPI } from '../services/accountancy/accountancyApiService';
import type { Practice, HealthScore, Rescue, HandoverComplaint, TeamMember, ContinuitySummary, SecuritySummary } from '../types/accountancy';

export function useAccountancy() {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [complaints, setComplaints] = useState<HandoverComplaint[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [continuityData, setContinuityData] = useState<ContinuitySummary | null>(null);
  const [securityData, setSecurityData] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingContinuity, setLoadingContinuity] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setPractice(await api.getPractice());
      setHealthScore(await api.getHealthScore());
      setRescues(await api.getRescues());
      setComplaints(await api.getComplaints());
      setTeam(await api.getTeam());
      setLoading(false);
    }
    fetchAll();
  }, []);

  useEffect(() => {
    async function fetchContinuityData() {
      setLoadingContinuity(true);
      try {
        const data = await continuityAPI.getContinuitySummary();
        setContinuityData(data);
      } catch (error) {
        console.error('Failed to fetch continuity data:', error);
        // Use mock data if API fails
        setContinuityData({
          currentValue: 1250000,
          growthRate: 12.5,
          readinessScore: 68,
          criticalGaps: [
            'No operations manual documented',
            'Key person dependency risk',
            'Missing succession agreement'
          ],
          lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          executorCount: 2,
          credentialCount: 15
        });
      } finally {
        setLoadingContinuity(false);
      }
    }
    fetchContinuityData();
  }, []);

  useEffect(() => {
    async function fetchSecurityData() {
      setLoadingSecurity(true);
      try {
        const data = await cyberSecurityAPI.getSecuritySummary();
        setSecurityData(data);
      } catch (error) {
        console.error('Failed to fetch security data:', error);
        // Use mock data if API fails
        setSecurityData({
          riskScore: 72,
          alertCount: 19,
          criticalAlerts: 0,
          partnerStatus: 'CyberShield Pro - Active',
          lastIncident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          nextBackup: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
          mfaCoverage: 85,
          patchStatus: 'Good - 12/15 patches applied'
        });
      } finally {
        setLoadingSecurity(false);
      }
    }
    fetchSecurityData();
  }, []);

  return { 
    practice, 
    healthScore, 
    rescues, 
    complaints, 
    team, 
    continuityData,
    securityData,
    loading,
    loadingContinuity,
    loadingSecurity
  };
} 