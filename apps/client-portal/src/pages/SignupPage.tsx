// ============================================================================
// CLIENT SIGNUP PAGE - SIMPLE AUTO-LOGIN FLOW
// ============================================================================
// 1. User enters details
// 2. Edge Function creates account + assigns to RPGCC
// 3. Auto-login and redirect to discovery portal
// ============================================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function SignupPage() {
  const { practiceCode = 'rpgcc' } = useParams<{ practiceCode?: string }>();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setStatus('Creating your account...');

    try {
      // Step 1: Create account via Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('client-signup', {
        body: {
          practiceCode,
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          company: company.trim() || undefined,
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Signup failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Step 2: Auto-login with the same credentials
      setStatus('Logging you in...');
      
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        throw new Error('Account created but login failed. Please try logging in manually.');
      }

      // Step 3: Redirect to portal
      setStatus('Welcome! Redirecting...');
      
      // Small delay for UX, then navigate to portal
      setTimeout(() => {
        navigate('/portal');
      }, 500);

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
      setStatus('');
  }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* RPGCC Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Logo variant="light" size="xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Begin Your Discovery
          </h1>
          <p className="text-gray-500">
            Create your account to start your business discovery assessment
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Acme Ltd (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {status || 'Please wait...'}
                </span>
              ) : (
                'Get Started'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Log in
              </a>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Shield className="w-4 h-4" />
          <span>Secure signup • Your data is protected</span>
        </div>
        
        {/* Footer */}
        <div className="mt-4 text-center text-slate-500 text-xs">
          <p className="font-medium text-slate-600">RPGCC</p>
          <p className="mt-1 text-slate-400">RPGCC is a trading name of RPG Crouch Chapman LLP</p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
