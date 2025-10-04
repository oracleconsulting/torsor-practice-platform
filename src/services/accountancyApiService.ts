import { 
  ESGScope, 
  ESGData, 
  ESGClient, 
  ESGSummary,
  CarbonResults,
  Benchmark,
  PracticeValuation,
  ExecutorPack,
  ReadinessAssessment,
  ContinuitySummary,
  SecurityScore,
  SecurityAlerts,
  IncidentResponse,
  PartnerIntegration,
  SecurityData,
  SecuritySummary
} from '../../types/accountancy';

// Use production API URL
const API_URL = 'https://oracle-api-server-production.up.railway.app/api/accountancy';

// Define mock data for continuity and security
const mockContinuitySummary = {
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
};
const mockSecuritySummary = {
  riskScore: 72,
  alertCount: 19,
  criticalAlerts: 0,
  partnerStatus: 'CyberShield Pro - Active',
  lastIncident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  nextBackup: new Date(Date.now() + 18 * 60 * 60 * 1000),
  mfaCoverage: 85,
  patchStatus: 'Good - 12/15 patches applied'
};

// ESG Lite API Methods
export const esgAPI = {
  // Scoping
  assessScope: async (clientId: string) => {
    const response = await fetch(`${API_URL}/esg-reporting/assess-scope`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId })
    });
    
    if (!response.ok) {
      throw new Error(`ESG scope assessment failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Data collection
  saveEmissionsData: async (clientId: string, data: ESGData) => {
    const response = await fetch(`${API_URL}/esg-reporting/emissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId, data })
    });
    
    if (!response.ok) {
      throw new Error(`Save emissions data failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Calculations
  calculateCarbon: async (data: ESGData['emissions']): Promise<CarbonResults> => {
    const response = await fetch(`${API_URL}/esg-reporting/calculate-carbon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Carbon calculation failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Benchmarking
  getBenchmarks: async (industry: string, size: string): Promise<Benchmark> => {
    const response = await fetch(`${API_URL}/esg-reporting/benchmarks?industry=${industry}&size=${size}`);
    
    if (!response.ok) {
      throw new Error(`Get benchmarks failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Reporting
  generateReport: async (assessmentId: string) => {
    const response = await fetch(`${API_URL}/esg-reporting/report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assessmentId })
    });
    
    if (!response.ok) {
      throw new Error(`Generate report failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Client management
  getESGClients: async (): Promise<ESGClient[]> => {
    const response = await fetch(`${API_URL}/esg-reporting/clients`);
    
    if (!response.ok) {
      throw new Error(`Get ESG clients failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  updateESGClient: async (clientId: string, data: Partial<ESGClient>): Promise<ESGClient> => {
    const response = await fetch(`${API_URL}/esg-reporting/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Update ESG client failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Summary data
  getESGSummary: async (): Promise<ESGSummary> => {
    const response = await fetch(`${API_URL}/esg-reporting/summary`);
    
    if (!response.ok) {
      throw new Error(`Get ESG summary failed: ${response.status}`);
    }
    
    return await response.json();
  }
};

// Continuity Scorecard API Methods
export const continuityAPI = {
  // Valuation
  calculateValue: async (data: Partial<PracticeValuation>) => {
    const response = await fetch(`${API_URL}/continuity/valuation/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Valuation calculation failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  getValuationHistory: async (): Promise<PracticeValuation[]> => {
    const response = await fetch(`${API_URL}/continuity/valuation/history`);
    
    if (!response.ok) {
      throw new Error(`Get valuation history failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Executor vault
  saveCredential: async (credential: any) => {
    const response = await fetch(`${API_URL}/continuity/vault/credential`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credential)
    });
    
    if (!response.ok) {
      throw new Error(`Save credential failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  updateExecutor: async (executor: any) => {
    const response = await fetch(`${API_URL}/continuity/vault/executor`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(executor)
    });
    
    if (!response.ok) {
      throw new Error(`Update executor failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  getExecutorPack: async (): Promise<ExecutorPack> => {
    const response = await fetch(`${API_URL}/continuity/vault/executor-pack`);
    
    if (!response.ok) {
      throw new Error(`Get executor pack failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Readiness
  assessReadiness: async (): Promise<ReadinessAssessment> => {
    const response = await fetch(`${API_URL}/continuity/readiness/assess`);
    
    if (!response.ok) {
      throw new Error(`Assess readiness failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  updateReadinessItem: async (category: string, item: string, status: boolean) => {
    const response = await fetch(`${API_URL}/continuity/readiness`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ category, item, status })
    });
    
    if (!response.ok) {
      throw new Error(`Update readiness item failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Summary
  getContinuitySummary: async (): Promise<ContinuitySummary> => {
    try {
      const response = await fetch(`${API_URL}/continuity/summary`);
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (e) {
      return mockContinuitySummary;
    }
  },
  
  // Export
  generateSuccessionPack: async () => {
    const response = await fetch(`${API_URL}/continuity/export/succession-pack`);
    
    if (!response.ok) {
      throw new Error(`Generate succession pack failed: ${response.status}`);
    }
    
    return await response.json();
  }
};

// Cyber Shield Security API Methods
export const cyberSecurityAPI = {
  // Security monitoring
  getSecurityScore: async (): Promise<SecurityScore> => {
    const response = await fetch(`${API_URL}/cybersecurity/score`);
    
    if (!response.ok) {
      throw new Error(`Get security score failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  getSecurityAlerts: async (): Promise<SecurityAlerts> => {
    const response = await fetch(`${API_URL}/cybersecurity/alerts`);
    
    if (!response.ok) {
      throw new Error(`Get security alerts failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  getSecurityData: async (): Promise<SecurityData> => {
    const response = await fetch(`${API_URL}/cybersecurity/data`);
    
    if (!response.ok) {
      throw new Error(`Get security data failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Incident response
  createIncident: async (incident: Partial<IncidentResponse>) => {
    const response = await fetch(`${API_URL}/cybersecurity/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incident)
    });
    
    if (!response.ok) {
      throw new Error(`Create incident failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  updateIncident: async (incidentId: string, updates: Partial<IncidentResponse>) => {
    const response = await fetch(`${API_URL}/cybersecurity/incidents/${incidentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Update incident failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  getIncidents: async (): Promise<IncidentResponse[]> => {
    const response = await fetch(`${API_URL}/cybersecurity/incidents`);
    
    if (!response.ok) {
      throw new Error(`Get incidents failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Partner integration
  getPartnerIntegrations: async (): Promise<PartnerIntegration[]> => {
    const response = await fetch(`${API_URL}/cybersecurity/partners`);
    
    if (!response.ok) {
      throw new Error(`Get partner integrations failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  updatePartnerStatus: async (partnerId: string, status: any) => {
    const response = await fetch(`${API_URL}/cybersecurity/partners/${partnerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(status)
    });
    
    if (!response.ok) {
      throw new Error(`Update partner status failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Security actions
  runSecurityCheck: async () => {
    const response = await fetch(`${API_URL}/cybersecurity/check`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Run security check failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  triggerBackup: async () => {
    const response = await fetch(`${API_URL}/cybersecurity/backup`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Trigger backup failed: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Summary
  getSecuritySummary: async (): Promise<SecuritySummary> => {
    try {
      const response = await fetch(`${API_URL}/cybersecurity/summary`);
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (e) {
      return mockSecuritySummary;
    }
  },
  
  // WebSocket connection for real-time alerts
  connectWebSocket: (onMessage: (data: any) => void) => {
    const ws = new WebSocket('wss://oracle-api-server-production.up.railway.app/api/accountancy/cybersecurity/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  }
}; 