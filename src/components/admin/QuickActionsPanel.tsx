import React, { useState } from 'react';
import { 
  RefreshCw, 
  Users, 
  Calendar, 
  RotateCcw, 
  Loader2,
  Download,
  Settings,
  MessageSquare,
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import AdminService, { RegenerationOptions } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';

interface QuickActionsPanelProps {
  userId: string;
  clientEmail: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  userId,
  clientEmail,
  onSuccess,
  onError,
  disabled = false
}) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({
    roadmap: false,
    board: false,
    sprint: false,
    dashboard: false
  });
  const [progress, setProgress] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationType, setConfirmationType] = useState<'roadmap' | 'board' | 'sprint' | 'reset'>('roadmap');
  const [regenerationOptions, setRegenerationOptions] = useState<RegenerationOptions>({
    preserveProgress: true,
    notifyUser: true,
    regenerationReason: 'Admin requested regeneration'
  });

  const handleViewDashboard = async () => {
    if (!clientEmail) return;
    
    try {
      // Get the user's group_id from client_intake
      const { data: intakeData, error: intakeError } = await supabase
        .from('client_intake')
        .select('group_id')
        .eq('email', clientEmail)
        .single();

      if (intakeError || !intakeData?.group_id) {
        console.error('Error fetching user groupId:', intakeError);
        toast.error('Unable to view dashboard - user data incomplete');
        return;
      }

      // Navigate with groupId and email
      const url = `/dashboard?groupId=${intakeData.group_id}&email=${encodeURIComponent(clientEmail)}`;
      console.log('Navigating to:', url);
      window.location.href = url;
      
      // Log the admin action
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'james@ivcaccounting.co.uk';
      console.log(`Admin ${adminEmail} viewed dashboard for ${clientEmail}`);
      
      toast.success('Opening user dashboard in new tab');
    } catch (error) {
      console.error('Error viewing dashboard:', error);
      toast.error('Failed to open user dashboard');
    }
  };

  const handleRegenerate = async (type: 'roadmap' | 'board' | 'sprint') => {
    setLoading({ ...loading, [type]: true });
    setProgress(`Starting ${type} regeneration...`);

    try {
      let success = false;
      
      // Get admin email from auth context or user session
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'james@ivcaccounting.co.uk';

      switch (type) {
        case 'roadmap':
          success = await AdminService.regenerateRoadmap(userId, regenerationOptions, adminEmail);
          break;
        case 'board':
          success = await AdminService.regenerateBoard(userId, regenerationOptions, adminEmail);
          break;
        case 'sprint':
          success = await AdminService.regenerate12WeekSprint(userId, regenerationOptions, adminEmail);
          break;
      }

      if (success) {
        toast.success(`${type} regenerated successfully`);
        onSuccess?.();
      } else {
        throw new Error(`Failed to regenerate ${type}`);
      }
    } catch (error) {
      console.error(`Error regenerating ${type}:`, error);
      toast.error(`Failed to regenerate ${type}`);
      onError?.(error as Error);
    } finally {
      setLoading({ ...loading, [type]: false });
      setProgress('');
      setShowConfirmDialog(false);
    }
  };

  const handleShowConfirm = (type: 'roadmap' | 'board' | 'sprint' | 'reset') => {
    setConfirmationType(type);
    setShowConfirmDialog(true);
  };

  const handleResetPortal = async (resetType: 'soft' | 'hard') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'james@ivcaccounting.co.uk';

      const success = await AdminService.resetUserPortal(
        userId,
        resetType,
        adminEmail,
        'Admin requested reset'
      );

      if (success) {
        toast.success(`Portal ${resetType} reset completed for ${clientEmail}`);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error resetting portal:', error);
      toast.error('Failed to reset portal');
      onError?.(error as Error);
    }
  };

  const getConfirmationContent = () => {
    switch (confirmationType) {
      case 'roadmap':
        return {
          title: 'Confirm Roadmap Regeneration',
          description: 'This will regenerate the entire roadmap and board. Existing data will be archived.'
        };
      case 'board':
        return {
          title: 'Confirm Board Regeneration',
          description: 'This will regenerate the AI board configuration. Existing conversations will be preserved.'
        };
      case 'sprint':
        return {
          title: 'Confirm Sprint Regeneration',
          description: 'This will regenerate the 12-week sprint plan. Progress will be preserved if selected.'
        };
      case 'reset':
        return {
          title: 'Confirm Portal Reset',
          description: 'This will reset the portal to its initial state. This action cannot be undone.'
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        {progress && (
          <span className="text-sm text-gray-400">{progress}</span>
        )}
      </div>

      {/* View Dashboard Button - Always at the top */}
      <Button
        onClick={handleViewDashboard}
        disabled={loading.dashboard}
        className="w-full bg-blue-600 hover:bg-blue-700 justify-between"
      >
        <span className="flex items-center">
          <Eye className={`w-4 h-4 mr-2 ${loading.dashboard ? 'animate-pulse' : ''}`} />
          View User Dashboard
        </span>
        <ExternalLink className="w-4 h-4" />
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => handleShowConfirm('roadmap')}
          disabled={loading.roadmap || disabled}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading.roadmap ? 'animate-spin' : ''}`} />
          Regenerate Roadmap
        </Button>

        <Button
          onClick={() => handleShowConfirm('board')}
          disabled={loading.board || disabled}
          className="w-full bg-pink-600 hover:bg-pink-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading.board ? 'animate-spin' : ''}`} />
          Regenerate Board
        </Button>

        <Button
          onClick={() => handleShowConfirm('sprint')}
          disabled={loading.sprint || disabled}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading.sprint ? 'animate-spin' : ''}`} />
          Regenerate Sprint
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() => {
            if (confirm('This will perform a soft reset (clear preferences and cache). Continue?')) {
              handleResetPortal('soft');
            }
          }}
          className="w-full bg-yellow-600 hover:bg-yellow-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Soft Reset
        </Button>

        <Button
          onClick={() => {
            if (confirm('This will perform a hard reset (clear all except assessments). This cannot be undone. Continue?')) {
              handleResetPortal('hard');
            }
          }}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Hard Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() => toast.info('Export functionality coming soon')}
          className="w-full bg-gray-600 hover:bg-gray-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>

        <Button
          onClick={() => toast.info('Message functionality coming soon')}
          className="w-full bg-gray-600 hover:bg-gray-700"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>

      {showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              <DialogTitle className="text-white text-center">
                {getConfirmationContent().title}
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-center">
                {getConfirmationContent().description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleRegenerate(confirmationType as 'roadmap' | 'board' | 'sprint');
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Proceed
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};