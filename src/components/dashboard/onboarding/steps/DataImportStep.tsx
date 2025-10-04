import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Database, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleOnboarding } from '@/hooks/useSimpleOnboarding';
import { migrateAssessmentToDashboard, checkMigrationStatus } from '@/lib/onboarding/dataMigration';
import { toast } from 'sonner';

interface DataImportStepProps {
  onComplete: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

export const DataImportStep: React.FC<DataImportStepProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const { groupId } = useSimpleOnboarding();
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importDetails, setImportDetails] = useState<any>(null);

  useEffect(() => {
    // Check if migration is needed
    checkStatus();
  }, [user?.id]);

  const checkStatus = async () => {
    if (!user?.id) return;
    
    const status = await checkMigrationStatus(user.id);
    if (status.hasDashboardSetup) {
      setImportStatus('success');
      setImportDetails({
        alreadyImported: true,
        message: 'Your data has already been imported!'
      });
    }
  };

  const handleImport = async () => {
    if (!user?.id || !groupId) {
      toast.error('Missing required data. Please complete your assessment first.');
      return;
    }

    setIsImporting(true);
    setImportStatus('importing');

    try {
      const result = await migrateAssessmentToDashboard(user.id, groupId);
      
      if (result.success) {
        setImportStatus('success');
        setImportDetails(result.data);
        toast.success('Your assessment data has been imported successfully!');
      } else {
        setImportStatus('error');
        toast.error(result.error || 'Failed to import data');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      toast.error('An unexpected error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const importSteps = [
    { label: 'Business Information', key: 'business' },
    { label: 'Financial Metrics', key: 'metrics' },
    { label: 'AI Board Members', key: 'board' },
    { label: 'Initial Tasks', key: 'tasks' }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-gray-300 text-lg">
          We'll now import your assessment data to set up your personalized dashboard.
        </p>
      </motion.div>

      {importStatus === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Database className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-white text-xl font-semibold mb-2">Ready to Import</h3>
              <p className="text-gray-400">
                Click the button below to import your assessment data. This includes:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {importSteps.map((step) => (
                <div key={step.key} className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {importStatus === 'importing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
            <div>
              <h3 className="text-white text-xl font-semibold mb-2">Importing Your Data</h3>
              <p className="text-gray-400">This usually takes just a few seconds...</p>
            </div>
            <div className="space-y-2 w-full max-w-md">
              {importSteps.map((step, index) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm">{step.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {importStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-green-500/20"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h3 className="text-white text-xl font-semibold mb-2">Import Complete!</h3>
              <p className="text-gray-400">
                {importDetails?.alreadyImported 
                  ? 'Your data was previously imported and is ready to use.'
                  : 'Your assessment data has been successfully imported.'}
              </p>
            </div>
            {importDetails && !importDetails.alreadyImported && (
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{importDetails.metricsCount || 1}</p>
                  <p className="text-sm text-gray-400">Metrics Set</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{importDetails.boardMembersCount || 0}</p>
                  <p className="text-sm text-gray-400">Board Members</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{importDetails.tasksCount || 0}</p>
                  <p className="text-sm text-gray-400">Initial Tasks</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">8</p>
                  <p className="text-sm text-gray-400">Widgets Ready</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {importStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 backdrop-blur-sm rounded-xl p-8 border border-red-500/20"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div>
              <h3 className="text-white text-xl font-semibold mb-2">Import Failed</h3>
              <p className="text-gray-400">
                We couldn't import your data. Please try again or contact support.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
        )}
        
        <div className="flex-1 flex justify-end">
          {importStatus === 'idle' && (
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Import My Data
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          
          {importStatus === 'success' && (
            <Button
              onClick={onComplete}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          
          {importStatus === 'error' && (
            <Button
              onClick={handleImport}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Try Again
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 