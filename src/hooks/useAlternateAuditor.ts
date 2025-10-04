import { useState, useEffect, useCallback } from 'react';
import { AlternateAuditor, ComplianceTimeline } from '../types/accountancy';
import { alternateAuditorService } from '../services/api/alternateAuditor.service';
import { useAccountancyContext } from '../contexts/AccountancyContext';

export const useAlternateAuditor = () => {
  const { practice } = useAccountancyContext();
  const [alternateAuditor, setAlternateAuditor] = useState<AlternateAuditor | null>(null);
  const [complianceTimeline, setComplianceTimeline] = useState<ComplianceTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const practiceId = practice?.id;

  // Calculate days remaining until December 1, 2025
  const deadline = new Date('2025-12-01');
  const daysRemaining = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Determine compliance status
  const complianceStatus = alternateAuditor?.status || 'not_configured';

  // Check if setup is complete
  const isSetupComplete = alternateAuditor !== null && alternateAuditor.status !== 'not_configured';

  // Load alternate auditor data
  const loadAlternateAuditor = useCallback(async () => {
    if (!practiceId) return;

    setLoading(true);
    setError('');

    try {
      const data = await alternateAuditorService.getAlternateAuditor(practiceId);
      setAlternateAuditor(data);
      
      // Generate compliance timeline
      const timeline: ComplianceTimeline = {
        deadline: '2025-12-01',
        daysRemaining,
        status: data?.status || 'not_configured',
        nextAction: getNextAction(data),
        lastAction: data?.lastVerified ? new Date(data.lastVerified).toLocaleDateString() : 'Not verified',
        milestones: generateMilestones(data)
      };
      setComplianceTimeline(timeline);
    } catch (err) {
      setError('Failed to load alternate auditor data');
      console.error('Error loading alternate auditor:', err);
    } finally {
      setLoading(false);
    }
  }, [practiceId, daysRemaining]);

  const createAlternateAuditor = async (data: Partial<AlternateAuditor>) => {
    if (!practiceId) throw new Error('Practice ID not found');

    try {
      setLoading(true);
      setError('');
      const newAlternateAuditor = await alternateAuditorService.createAlternateAuditor(practiceId, data);
      setAlternateAuditor(newAlternateAuditor);
      await loadAlternateAuditor(); // Refresh data
      return newAlternateAuditor;
    } catch (err) {
      setError('Failed to create alternate auditor');
      console.error('Error creating alternate auditor:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAlternateAuditor = async (id: string, data: Partial<AlternateAuditor>) => {
    try {
      setLoading(true);
      setError('');
      const updatedAlternateAuditor = await alternateAuditorService.updateAlternateAuditor(id, data);
      setAlternateAuditor(updatedAlternateAuditor);
      await loadAlternateAuditor(); // Refresh data
      return updatedAlternateAuditor;
    } catch (err) {
      setError('Failed to update alternate auditor');
      console.error('Error updating alternate auditor:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlternateAuditor = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      await alternateAuditorService.deleteAlternateAuditor(id);
      setAlternateAuditor(null);
      setComplianceTimeline(null);
    } catch (err) {
      setError('Failed to delete alternate auditor');
      console.error('Error deleting alternate auditor:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, type: 'engagement_letter' | 'pi_certificate') => {
    if (!practiceId) throw new Error('Practice ID not found');

    try {
      setLoading(true);
      setError('');
      const uploadedDoc = await alternateAuditorService.uploadDocument(practiceId, file, type);
      
      // Update local state
      if (alternateAuditor) {
        const updated = { ...alternateAuditor };
        if (type === 'engagement_letter') {
          updated.engagementLetter = {
            url: uploadedDoc.url,
            uploadedAt: uploadedDoc.uploadedAt,
            fileName: uploadedDoc.name,
            fileSize: uploadedDoc.fileSize || 0,
            verified: false
          };
        } else if (type === 'pi_certificate') {
          updated.piCertificate = {
            url: uploadedDoc.url,
            uploadedAt: uploadedDoc.uploadedAt,
            expiryDate: new Date().toISOString(), // This will be set from form data
            fileName: uploadedDoc.name,
            fileSize: uploadedDoc.fileSize || 0,
            verified: false
          };
        }
        setAlternateAuditor(updated);
      }
      
      return uploadedDoc;
    } catch (err) {
      setError('Failed to upload document');
      console.error('Error uploading document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateEvidencePack = async () => {
    if (!practiceId) throw new Error('Practice ID not found');

    try {
      setLoading(true);
      setError('');
      const evidencePack = await alternateAuditorService.generateEvidencePack(practiceId);
      return evidencePack;
    } catch (err) {
      setError('Failed to generate evidence pack');
      console.error('Error generating evidence pack:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyRPBRegistration = async (rpbNumber: string) => {
    try {
      const isValid = await alternateAuditorService.verifyRPBRegistration(rpbNumber);
      return isValid;
    } catch (err) {
      console.error('Error verifying RPB registration:', err);
      return false;
    }
  };

  const clearError = () => {
    setError('');
  };

  // Helper functions
  const getNextAction = (data: AlternateAuditor | null): string => {
    if (!data) return 'Setup alternate auditor';
    if (!data.engagementLetter) return 'Upload engagement letter';
    if (!data.piCertificate) return 'Upload PI certificate';
    if (new Date(data.piCertificate.expiryDate) <= new Date()) return 'Renew PI certificate';
    return 'All requirements met';
  };

  const generateMilestones = (data: AlternateAuditor | null) => {
    const milestones = [
      {
        id: '1',
        title: 'Setup alternate auditor',
        date: '2025-12-01',
        completed: !!data,
        critical: true
      },
      {
        id: '2',
        title: 'Upload engagement letter',
        date: '2025-12-01',
        completed: !!data?.engagementLetter,
        critical: true
      },
      {
        id: '3',
        title: 'Upload PI certificate',
        date: '2025-12-01',
        completed: !!data?.piCertificate,
        critical: true
      },
      {
        id: '4',
        title: 'Verify PI certificate not expired',
        date: data?.piCertificate?.expiryDate || '2025-12-01',
        completed: data?.piCertificate ? new Date(data.piCertificate.expiryDate) > new Date() : false,
        critical: true
      }
    ];
    return milestones;
  };

  useEffect(() => {
    loadAlternateAuditor();
  }, [loadAlternateAuditor]);

  return {
    alternateAuditor,
    complianceTimeline,
    loading,
    error,
    daysRemaining,
    complianceStatus,
    isSetupComplete,
    loadAlternateAuditor,
    createAlternateAuditor,
    updateAlternateAuditor,
    deleteAlternateAuditor,
    uploadDocument,
    generateEvidencePack,
    verifyRPBRegistration,
    clearError
  };
}; 