import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signIn, signUp, hasPortalAccess } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  
  const portalType = searchParams.get('portal') as 'oracle' | 'accountancy' | 'client' | null;
  const redirect = searchParams.get('redirect');
  const from = location.state?.from?.pathname || null;

  // DEBUG: Log component state
  console.log('[Auth Debug] Component rendered:', {
    pageLoaded,
    loading,
    user: user?.email,
    portalType,
    redirect,
    from
  });

  // Add page load detection
  useEffect(() => {
    console.log('[Auth Debug] Setting up page load timer');
    // Set a timeout to ensure the page loads
    const timer = setTimeout(() => {
      console.log('[Auth Debug] Page loaded, setting pageLoaded to true');
      setPageLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('[Auth Debug] Auth state changed:', { pageLoaded, loading, user: user?.email, portalType });
    console.log('[Auth Debug] User metadata:', user?.user_metadata);
    console.log('[Auth Debug] User profile:', user?.id);
    
    // Only check auth after page is loaded and auth is not loading
    if (pageLoaded && !loading && user) {
      console.log('[Auth Debug] User authenticated, checking redirect');
      
      // Clear any old redirect markers to ensure fresh redirects
      const redirectKey = `redirect_processed_${user.id}`;
      sessionStorage.removeItem(redirectKey);
      
      const handleRedirect = async () => {
        // Check if user has accountancy access (check metadata or practice_members)
        const metadata = user.user_metadata || {};
        console.log('[Auth Debug] User metadata:', metadata);
        
        // If it's a client-only user, redirect to client portal
        if (metadata.is_client_only === true) {
          console.log('[Auth Debug] Client user, redirecting to client portal');
          const clientId = metadata.client_id || metadata.portal_id;
          if (clientId) {
            navigate(`/client-portal/${clientId}/dashboard`, { replace: true });
          } else {
            navigate('/auth?portal=client', { replace: true });
          }
          return;
        }
        
        // For all other users, check their role in practice_members
        console.log('[Auth Debug] Checking user role for redirect...');
        
        // Use the authenticated supabase client from lib
        const { supabase } = await import('@/lib/supabase/client');
        
        // Get user's role from practice_members
        const { data: member, error: memberError } = await supabase
          .from('practice_members')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        console.log('[Auth Debug] Query result:', { member, memberError });
        
        console.log('[Auth Debug] User role:', member?.role);
        
        if (!member) {
          console.log('[Auth Debug] No practice member found, using default team member redirect');
          navigate('/team-member', { replace: true });
          return;
        }
        
        // Only redirect to admin if NOT viewing as someone else
        const viewAsParam = new URLSearchParams(location.search).get('viewAs');
        
        const adminRoles = ['owner', 'admin', 'partner', 'director'];
        const isAdmin = member && adminRoles.includes(member.role.toLowerCase());
        
        if (isAdmin && !viewAsParam) {
          console.log('[Auth Debug] Admin user - redirecting to admin dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('[Auth Debug] Regular user - redirecting to team member portal');
          navigate('/team-member', { replace: true });
        }
      };
      
      handleRedirect();
    }
  }, [pageLoaded, loading, user, navigate, location, portalType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    // Emergency quick fix - check portal parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isAccountancyPortal = urlParams.get('portal') === 'accountancy';

    try {
      if (isSignUp) {
        // Determine which portal to assign based on URL parameter
        // Default to 'oracle' if no portal specified
        const signupPortal = portalType || 'oracle';
        
        console.log('[Auth] Signing up for portal:', signupPortal);
        const { error } = await signUp(email, password, signupPortal);
        
        if (!error) {
          toast.success('Account created! Please check your email to verify.');
          // Don't redirect immediately - wait for email verification
          setFormLoading(false);
          setIsSignUp(false); // Switch to sign in mode
          return;
        }
        setFormLoading(false);
      } else {
        const result = await signIn(email, password);
        if (!result.error) {
          toast.success('Welcome back!');
          
          // Don't redirect here - let the useEffect handle it after auth state updates
          // This prevents race conditions and double redirects
          console.log('[Auth] Sign in successful, waiting for auth state to update...');
          setFormLoading(false);
        } else {
          setFormLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'An error occurred');
      setFormLoading(false);
    }
  };

  // DEBUG: Log render conditions
  console.log('[Auth Debug] Render conditions:', {
    pageLoaded,
    loading,
    user: !!user,
    shouldShowLoading: !pageLoaded || loading,
    shouldShowRedirect: !!user
  });

  // Show loading state
  if (!pageLoaded || loading) {
    console.log('[Auth Debug] Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
          <p className="mt-1 text-xs text-gray-400">Debug: pageLoaded={pageLoaded.toString()}, loading={loading.toString()}</p>
        </div>
      </div>
    );
  }

  // If user exists and we're still here, show redirecting
  if (user) {
    console.log('[Auth Debug] Rendering redirect state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <p className="mt-1 text-xs text-gray-400">Debug: User {user.email}</p>
        </div>
      </div>
    );
  }

  console.log('[Auth Debug] Rendering main auth form');

  const getPortalTitle = () => {
    switch (portalType) {
      case 'accountancy':
        return 'Accountancy Portal';
      case 'client':
        return 'Client Portal';
      default:
        return 'Oracle Method';
    }
  };

  const getPortalDescription = () => {
    switch (portalType) {
      case 'accountancy':
        return 'Access your practice management tools';
      case 'client':
        return 'Connect with your accountant';
      default:
        return 'Transform your business with AI';
    }
  };

  // TEMPORARY ADMIN BYPASS FOR TESTING
  const handleAdminBypass = () => {
    console.log('[Auth] Admin bypass activated');
    // Redirect to emergency access page
    window.location.href = '/emergency-access';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      <div className="w-full max-w-md px-4">
        {/* Logo on dark background - outside the card */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/torsor-logo.png" 
              alt="Torsor" 
              className="w-full max-w-md h-auto px-8"
              onError={(e) => {
                // Fallback to text if logo doesn't exist yet
                e.currentTarget.style.display = 'none';
                const textFallback = e.currentTarget.nextElementSibling;
                if (textFallback) textFallback.classList.remove('hidden');
              }}
            />
            <h1 className="text-3xl font-bold text-white hidden">TORSOR</h1>
          </div>
        </div>

        {/* White card for the form */}
        <div className="bg-white shadow-2xl rounded-lg px-8 py-10">
          <div className="text-center mb-8">
            <p className="text-gray-900 text-lg font-semibold">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </p>
            <p className="mt-1 text-sm text-gray-500">{getPortalDescription()}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full"
                placeholder="••••••••"
                minLength={6}
              />
              {isSignUp && (
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={formLoading}
              className="w-full"
            >
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Sign up' : 'Sign in'
              )}
            </Button>
          </form>

          {isSignUp && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You're signing up for Torsor.
                {portalType === 'client' && ' Your accountant will need to approve your access.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}