import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Mail, Lock, ArrowRight, Shield, CheckCircle, UserPlus, XCircle } from 'lucide-react';
import * as InvitationsAPI from '@/lib/api/invitations';

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = searchParams.get('invite');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(!!inviteCode);

  // Load invitation details if invite code present
  useEffect(() => {
    if (inviteCode) {
      loadInvitation();
    }
  }, [inviteCode]);

  const loadInvitation = async () => {
    try {
      const invite = await InvitationsAPI.getInvitationByCode(inviteCode!);
      
      // Check if invitation is valid
      if (invite.status !== 'pending') {
        setError(`This invitation has been ${invite.status}`);
        setLoadingInvite(false);
        return;
      }
      
      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your team lead for a new invitation.');
        setLoadingInvite(false);
        return;
      }
      
      setInvitation(invite);
      setEmail(invite.email);
      setName(invite.name || '');
      setLoadingInvite(false);
    } catch (err: any) {
      console.error('Error loading invitation:', err);
      setError('Invalid invitation link. Please check your email for the correct link.');
      setLoadingInvite(false);
    }
  };

  const handleInvitationAccept = async () => {
    setLoading(true);
    setError('');

    try {
      // Generate temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
      
      // 1. Create account with temporary password
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: invitation.email,
        password: tempPassword,
        options: {
          data: {
            full_name: invitation.name || 'Team Member',
            is_team_member: true,
            practice_id: invitation.practice_id,
            invite_code: inviteCode,
          },
          emailRedirectTo: `${window.location.origin}/team-portal/assessment`,
        },
      });

      if (signupError) {
        // If user already exists, try to sign them in
        if (signupError.message.includes('already registered')) {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: invitation.email,
            password: tempPassword,
          });
          
          if (loginError) {
            setError('Account already exists. Please contact your team lead for assistance.');
            return;
          }
        } else {
          throw signupError;
        }
      }

      // 2. Accept invitation
      await InvitationsAPI.acceptInvitation(inviteCode!);

      // 3. Track event
      await InvitationsAPI.trackInvitationEvent(invitation.id, 'accepted');

      // 4. Redirect to assessment
      navigate('/team-portal/assessment');
    } catch (err: any) {
      console.error('Invitation acceptance error:', err);
      setError(err.message || 'Failed to accept invitation. Please try again or contact your team lead.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-accept invitation when it loads
  useEffect(() => {
    if (invitation && !loading && !error) {
      handleInvitationAccept();
    }
  }, [invitation]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // If has invitation, accept it
      if (inviteCode && invitation) {
        await InvitationsAPI.acceptInvitation(inviteCode);
        await InvitationsAPI.trackInvitationEvent(invitation.id, 'accepted');
        navigate('/team-portal/assessment');
      } else {
        window.location.href = '/team-portal/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/team-portal/dashboard`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking invitation
  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
          
          <p className="text-gray-300 mb-6">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              Click the link in your email to login securely. The link expires in 1 hour.
            </p>
          </div>
          
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setEmail('');
            }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  // Show processing screen while accepting invitation
  if (invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {error ? (
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">Unable to Accept Invitation</h2>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-300">{error}</p>
              </div>
              
              <p className="text-gray-400 mb-6">
                Please contact your team lead for assistance or request a new invitation link.
              </p>
              
              <button
                onClick={() => window.location.href = 'mailto:hr@rpgcc.co.uk?subject=Skills Portal Access Issue'}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Contact Support
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-10 h-10 text-blue-400 animate-pulse" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">Setting Up Your Access...</h2>
              
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
              
              <p className="text-gray-400 mb-2">
                Welcome, <strong className="text-white">{invitation.name || invitation.email}</strong>
              </p>
              
              <p className="text-sm text-gray-500">
                We're preparing your skills assessment. This will only take a moment...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TORSOR Team Portal</h1>
          <p className="text-gray-400">Access your skills profile and development plan</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Tab Switcher */}
          <div className="flex bg-gray-700/50 rounded-lg p-1 mb-6">
            <button
              onClick={() => setUseMagicLink(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !useMagicLink
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setUseMagicLink(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                useMagicLink
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={useMagicLink ? handleMagicLinkLogin : handlePasswordLogin}>
            {/* Email Field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field (only for password login) */}
            {!useMagicLink && (
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {useMagicLink ? 'Sending...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {useMagicLink ? 'Send Magic Link' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            {!useMagicLink && (
              <button
                onClick={() => window.location.href = '/team-portal/forgot-password'}
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
              >
                Forgot your password?
              </button>
            )}
            
            <p className="text-sm text-gray-500">
              Need access?{' '}
              <a href="mailto:hr@company.com" className="text-blue-400 hover:text-blue-300">
                Contact HR
              </a>
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-2">What you can do:</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>• View and update your skills profile</li>
            <li>• Complete skills assessments</li>
            <li>• Track your development goals</li>
            <li>• Access training resources</li>
            <li>• See team insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

