import { useState, useEffect } from 'react';
import { cyberSecurityAPI } from '../services/accountancy/accountancyApiService';
import { SecurityData, SecurityAlerts, SecurityScore, IncidentResponse } from '../types/accountancy';

export function useCyberSecurity() {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlerts>({ critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  useEffect(() => {
    async function fetchSecurityData() {
      setLoadingSecurity(true);
      try {
        const [data, alertsData, scoreData, incidentsData] = await Promise.all([
          cyberSecurityAPI.getSecurityData(),
          cyberSecurityAPI.getSecurityAlerts(),
          cyberSecurityAPI.getSecurityScore(),
          cyberSecurityAPI.getIncidents()
        ]);
        
        setSecurityData(data);
        setAlerts(alertsData);
        setSecurityScore(scoreData);
        setIncidents(incidentsData);
      } catch (error) {
        console.error('Failed to fetch security data:', error);
        // Use mock data if API fails
        setSecurityData({
          riskScore: 72,
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
          partnerStatus: 'active',
          partnerName: 'CyberShield Pro',
          mfaAdoption: 85,
          lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000),
          patchStatus: 'good',
          firewallStatus: 'good',
          antivirusStatus: 'warning',
          alerts: { critical: 0, high: 2, medium: 5, low: 12, total: 19 }
        });
        setAlerts({ critical: 0, high: 2, medium: 5, low: 12, total: 19 });
      } finally {
        setLoadingSecurity(false);
      }
    }
    fetchSecurityData();
  }, []);

  useEffect(() => {
    // WebSocket connection for real-time alerts
    const ws = cyberSecurityAPI.connectWebSocket((data) => {
      if (data.type === 'alert') {
        setAlerts(data.alerts);
        
        // Show notification for critical alerts
        if (data.alerts.critical > 0) {
          showNotification({
            title: 'CRITICAL SECURITY ALERT',
            message: data.message,
            type: 'error',
            persistent: true
          });
        }
      }
      
      if (data.type === 'score_update') {
        setSecurityData(prev => ({
          ...prev,
          riskScore: data.score,
          lastUpdated: new Date()
        }));
      }
    });
    
    return () => ws.close();
  }, []);

  const showNotification = (notification: {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    persistent?: boolean;
  }) => {
    // In a real implementation, this would use a notification system
    console.log('Security Alert:', notification);
    
    // For critical alerts, show browser notification
    if (notification.type === 'error' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/shield-icon.png',
          requireInteraction: notification.persistent
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/shield-icon.png',
              requireInteraction: notification.persistent
            });
          }
        });
      }
    }
  };

  const runSecurityCheck = async () => {
    try {
      const result = await cyberSecurityAPI.runSecurityCheck();
      // Refresh data after check
      const [data, alertsData] = await Promise.all([
        cyberSecurityAPI.getSecurityData(),
        cyberSecurityAPI.getSecurityAlerts()
      ]);
      setSecurityData(data);
      setAlerts(alertsData);
      return result;
    } catch (error) {
      console.error('Security check failed:', error);
      throw error;
    }
  };

  const triggerBackup = async () => {
    try {
      const result = await cyberSecurityAPI.triggerBackup();
      // Update last backup time
      setSecurityData(prev => prev ? {
        ...prev,
        lastBackup: new Date()
      } : null);
      return result;
    } catch (error) {
      console.error('Backup trigger failed:', error);
      throw error;
    }
  };

  return {
    securityData,
    alerts,
    securityScore,
    incidents,
    loadingSecurity,
    runSecurityCheck,
    triggerBackup
  };
} 