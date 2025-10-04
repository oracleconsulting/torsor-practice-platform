import { AlternateAuditor, Document, ComplianceTimeline } from '../../types/accountancy';

// Mock API client (replace with actual API client)
const apiClient = {
  get: async (url: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: null };
  },
  post: async (url: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: null };
  },
  put: async (url: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { data: null };
  },
  delete: async (url: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: null };
  }
};

export const alternateAuditorService = {
  // Get alternate auditor data
  getAlternateAuditor: async (practiceId: string): Promise<AlternateAuditor | null> => {
    try {
      const response = await apiClient.get(`/api/accountancy/alternate-auditor/${practiceId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alternate auditor:', error);
      return null;
    }
  },

  // Create or update alternate auditor
  saveAlternateAuditor: async (data: Partial<AlternateAuditor>): Promise<AlternateAuditor> => {
    try {
      const response = await apiClient.post('/api/accountancy/alternate-auditor', data);
      return response.data;
    } catch (error) {
      console.error('Failed to save alternate auditor:', error);
      throw error;
    }
  },

  // Check compliance status
  getComplianceStatus: async (practiceId: string): Promise<ComplianceTimeline> => {
    try {
      const response = await apiClient.get(`/api/accountancy/alternate-auditor/${practiceId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get compliance status:', error);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (practiceId: string, file: File, type: Document['type']): Promise<Document> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await apiClient.post(`/api/accountancy/alternate-auditor/${practiceId}/documents`, formData);
      return response.data;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (practiceId: string, documentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/accountancy/alternate-auditor/${practiceId}/documents/${documentId}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  },

  // Generate evidence pack
  generateEvidencePack: async (practiceId: string): Promise<string> => {
    try {
      const response = await apiClient.get(`/api/accountancy/alternate-auditor/${practiceId}/export`);
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Failed to generate evidence pack:', error);
      throw error;
    }
  },

  // Send notification
  sendNotification: async (practiceId: string, notificationId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/accountancy/alternate-auditor/${practiceId}/notifications/${notificationId}/send`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  },

  // Verify RPB registration
  verifyRPBRegistration: async (rpbNumber: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/api/accountancy/alternate-auditor/verify-rpb/${rpbNumber}`);
      return response.data.valid;
    } catch (error) {
      console.error('Failed to verify RPB registration:', error);
      return false;
    }
  },

  // Get notifications
  getNotifications: async (practiceId: string): Promise<AlternateAuditor['notifications']> => {
    try {
      const response = await apiClient.get(`/api/accountancy/alternate-auditor/${practiceId}/notifications`);
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  },

  // Create alternate auditor
  createAlternateAuditor: async (practiceId: string, data: Partial<AlternateAuditor>): Promise<AlternateAuditor> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newAlternateAuditor: AlternateAuditor = {
      id: `alt-${Date.now()}`,
      practiceId,
      alternateName: data.alternateName || '',
      alternateFirm: data.alternateFirm || '',
      alternateEmail: data.alternateEmail || '',
      alternatePhone: data.alternatePhone || '',
      rpbNumber: data.rpbNumber || '',
      rpbType: data.rpbType || 'ICAEW',
      engagementLetter: {
        url: '',
        uploadedAt: new Date().toISOString(),
        fileName: '',
        fileSize: 0,
        verified: false
      },
      piCertificate: {
        url: '',
        uploadedAt: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        fileName: '',
        fileSize: 0,
        verified: false
      },
      complianceDeadline: data.complianceDeadline || '2025-12-01T23:59:59Z',
      lastVerified: new Date().toISOString(),
      status: data.status || 'not_configured',
      specializations: data.specializations || [],
      reciprocalArrangement: data.reciprocalArrangement || false,
      annualFee: data.annualFee,
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          action: 'created',
          description: 'Alternate auditor created',
          userId: 'current-user',
          timestamp: new Date().toISOString()
        }
      ],
      notifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newAlternateAuditor;
  },

  // Update alternate auditor
  updateAlternateAuditor: async (id: string, data: Partial<AlternateAuditor>): Promise<AlternateAuditor> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedAlternateAuditor: AlternateAuditor = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...data.auditTrail || [],
        {
          id: `audit-${Date.now()}`,
          action: 'updated',
          description: 'Alternate auditor details updated',
          userId: 'current-user',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    return updatedAlternateAuditor;
  },

  // Delete alternate auditor
  deleteAlternateAuditor: async (id: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would delete the alternate auditor
    console.log(`Deleted alternate auditor with ID: ${id}`);
  }
}; 