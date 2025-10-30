import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  isRequired?: boolean; // If true, user cannot dismiss without changing password
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  isRequired = false
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const isChangingPassword = useRef(false); // Track if password change is in progress

  // Prevent component unmount from interrupting password change
  useEffect(() => {
    return () => {
      if (isChangingPassword.current) {
        console.log('[PasswordChangeModal] Component unmounting but password change in progress - letting it complete');
      }
    };
  }, []);

  // Password validation
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }
    return { valid: true, message: '' };
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(false);

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setLoading(true);
      setError('');
      isChangingPassword.current = true; // Mark as in progress
      console.log('[PasswordChangeModal] Attempting to change password for:', userEmail);

      // Update password in Supabase Auth
      console.log('[PasswordChangeModal] Calling supabase.auth.updateUser...');
      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      console.log('[PasswordChangeModal] Auth update completed, checking for errors...');

      if (updateError) {
        console.error('[PasswordChangeModal] Error updating password:', updateError);
        throw updateError;
      }

      console.log('[PasswordChangeModal] ✅ Password updated successfully in auth');
      console.log('[PasswordChangeModal] User data:', userData?.user?.email);

      // Mark password as changed in practice_members
      // Try RPC first (if it exists), then fall back to direct update
      console.log('[PasswordChangeModal] Updating database flag for email:', userEmail);
      
      const { error: rpcError } = await supabase.rpc('mark_password_changed', {
        user_email: userEmail
      });

      if (rpcError) {
        console.warn('[PasswordChangeModal] RPC failed, using direct update:', rpcError.message);
        
        // Fallback: Direct update with better logging
        const { data: updateData, error: dbError } = await supabase
          .from('practice_members')
          .update({
            password_change_required: false,
            last_password_change: new Date().toISOString()
          })
          .eq('email', userEmail)
          .select();

        if (dbError) {
          console.error('[PasswordChangeModal] Database update error:', dbError);
          // Don't throw - password was changed successfully, this is just a flag update
        } else if (updateData && updateData.length > 0) {
          console.log('[PasswordChangeModal] ✅ Password change flag updated successfully. Rows affected:', updateData.length);
          console.log('[PasswordChangeModal] Updated member:', updateData[0].name, updateData[0].email);
        } else {
          console.error('[PasswordChangeModal] ❌ No rows updated! Email may not match:', userEmail);
        }
      } else {
        console.log('[PasswordChangeModal] ✅ Password change flag updated via RPC');
      }

      console.log('[PasswordChangeModal] Setting success state...');
      setSuccess(true);
      toast({
        title: 'Password Changed!',
        description: 'Your password has been successfully updated.',
      });

      // Close modal after 2 seconds
      console.log('[PasswordChangeModal] Scheduling modal close...');
      setTimeout(() => {
        console.log('[PasswordChangeModal] Closing modal...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(false);
        isChangingPassword.current = false; // Mark as complete
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('[PasswordChangeModal] Error:', err);
      setError(err.message || 'Failed to change password');
      toast({
        title: 'Error',
        description: err.message || 'Failed to change password',
        variant: 'destructive',
      });
      isChangingPassword.current = false; // Mark as complete even on error
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: '', color: '', percentage: 0 };

    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    if (score < 40) return { strength: 'Weak', color: 'bg-red-500', percentage: score };
    if (score < 70) return { strength: 'Fair', color: 'bg-orange-500', percentage: score };
    if (score < 90) return { strength: 'Good', color: 'bg-yellow-500', percentage: score };
    return { strength: 'Strong', color: 'bg-green-500', percentage: score };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Dialog open={isOpen} onOpenChange={isRequired ? undefined : onClose}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={isRequired ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isRequired ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Lock className="w-5 h-5 text-blue-600" />
            {isRequired ? 'Password Change Required' : 'Change Password'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isRequired ? (
              <>
                <span className="font-semibold text-orange-600">Action Required:</span> For security reasons, please change your password before continuing.
              </>
            ) : (
              'Create a strong password to secure your account'
            )}
          </DialogDescription>
        </DialogHeader>

        {isRequired && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              This is your first login. You must change the default password to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-gray-900">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10 text-gray-900 bg-white"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-gray-900">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10 text-gray-900 bg-white"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-semibold ${
                    passwordStrength.strength === 'Strong' ? 'text-green-600' :
                    passwordStrength.strength === 'Good' ? 'text-yellow-600' :
                    passwordStrength.strength === 'Fair' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-gray-900">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10 text-gray-900 bg-white"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-2">Password Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <span className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>•</span>
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <span className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>•</span>
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>•</span>
                One lowercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>•</span>
                One number
              </li>
              <li className="flex items-center gap-2">
                <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>•</span>
                One special character (!@#$%^&*)
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password changed successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {!isRequired && (
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="text-gray-900"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleChangePassword}
            disabled={loading || success}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

