// ============================================================================
// CLIENT SIGNUP PAGE
// ============================================================================
// Secure signup via Edge Function - practice code in URL
// Usage: /signup/rpgcc or /signup (defaults to rpgcc)
// ============================================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Compass, Eye, EyeOff, CheckCircle, ArrowRight, Shield } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    try {
      // Call secure Edge Function
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

      setSuccess(true);

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* RPGCC Logo */}
          <div className="flex items-center justify-center gap-1 mb-8">
            <span className="text-4xl font-black tracking-tight text-black">RPGCC</span>
            <div className="flex gap-1 ml-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome Aboard!
            </h1>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. You can now log in and complete your discovery assessment.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Continue to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* RPGCC Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1 mb-6">
            <span className="text-5xl font-black tracking-tight text-black">RPGCC</span>
            <div className="flex gap-1 ml-1">
              <div className="w-3 h-3 rounded-full bg-[#3B82F6]" /> {/* Blue */}
              <div className="w-3 h-3 rounded-full bg-[#EF4444]" /> {/* Red */}
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]" /> {/* Amber */}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Begin Your Discovery
          </h1>
          <p className="text-gray-500">
            Create your client portal to explore how we can help your business thrive
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-12"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create My Portal'
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
        <div className="mt-4 text-center text-gray-400 text-xs">
          <p>RP Griffiths Chartered Certified Accountants</p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
