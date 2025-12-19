// ============================================================================
// INVITATION ACCEPTANCE PAGE
// ============================================================================
// Handles the client invitation flow:
// 1. Validates invitation token from URL
// 2. Shows invitation details (practice, services)
// 3. Collects password to create account
// 4. Auto-logs in and redirects to dashboard
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Target, LineChart, Settings, Users, Compass, Sparkles } from 'lucide-react';

interface InvitationDetails {
  email: string;
  name: string;
  practiceName: string;
  services: string[];
  includeDiscovery: boolean;
}

const serviceIcons: Record<string, React.ComponentType<any>> = {
  'Goal Alignment Program': Target,
  'Management Accounts': LineChart,
  'Systems Audit': Settings,
  'Fractional CFO/COO': Users,
};

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/dashboard');

  // Validate token on mount
  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setValidating(false);
      setLoading(false);
      return;
    }

    try {
      // Use direct fetch for GET-style validation
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invitation?action=validate&token=${token}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await response.json();
      
      if (!data.valid) {
        if (data.expired) {
          setError('This invitation has expired. Please contact your advisor for a new invitation.');
        } else if (data.alreadyAccepted) {
          setError('This invitation has already been accepted. Please sign in instead.');
        } else {
          setError(data.error || 'Invalid invitation');
        }
        setValidating(false);
        setLoading(false);
        return;
      }

      setInvitation(data.invitation);
      setName(data.invitation.name || '');
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate invitation. Please try again.');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('accept-invitation', {
        body: {
          token,
          password,
          name: name || undefined
        }
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      // If we got a session, set it
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.accessToken,
          refresh_token: data.session.refreshToken
        });
        
        // Force refresh of client session after setting auth session
        // This ensures the AuthContext picks up the new practice_members record
        window.location.reload();
        return;
      }

      // Determine redirect destination
      const destination = data.redirectTo || (data.includeDiscovery ? '/discovery' : '/dashboard');
      setRedirectTo(destination);
      setAccepted(true);

      // Redirect after brief delay (with page reload to refresh client session)
      setTimeout(() => {
        window.location.href = destination;
      }, 2000);

    } catch (err) {
      console.error('Accept error:', err);
      setError((err as Error).message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading || validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired invitation)
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Success state
  if (accepted) {
    const isDiscovery = redirectTo === '/discovery';
    
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDiscovery 
          ? 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
          : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
      }`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isDiscovery ? 'bg-indigo-100' : 'bg-emerald-100'
          }`}>
            {isDiscovery ? (
              <Compass className="w-8 h-8 text-indigo-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard!</h1>
          <p className="text-gray-600 mb-6">
            {isDiscovery 
              ? "Your account has been created. Let's discover where you want to go..."
              : "Your account has been created. Redirecting you to your dashboard..."
            }
          </p>
          {isDiscovery && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Starting Destination Discovery</span>
            </div>
          )}
          <Loader2 className={`w-6 h-6 animate-spin mx-auto ${isDiscovery ? 'text-indigo-600' : 'text-emerald-600'}`} />
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">You're Invited</h1>
          <p className="text-indigo-100">
            {invitation?.practiceName} has invited you to join
          </p>
        </div>

        {/* What's Next Section */}
        <div className="px-8 py-6 border-b border-gray-100">
          {invitation?.includeDiscovery ? (
            <>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                <Compass className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">First: Destination Discovery</p>
                  <p className="text-sm text-amber-700 mt-1">
                    A 15-minute questionnaire to understand your goals. We'll then recommend 
                    the best path forward for you.
                  </p>
                </div>
              </div>
              {invitation.services.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Pre-selected services:</h3>
                  <div className="space-y-2">
                    {invitation.services.map((service, i) => {
                      const Icon = serviceIcons[service] || Target;
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Icon className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium text-gray-900">{service}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-500 mb-3">You'll have access to:</h3>
              <div className="space-y-2">
                {invitation?.services.map((service, i) => {
                  const Icon = serviceIcons[service] || Target;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Icon className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-gray-900">{service}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleAccept} className="px-8 py-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={invitation?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={accepting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Your Account...
              </>
            ) : (
              'Accept Invitation & Create Account'
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in instead
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

