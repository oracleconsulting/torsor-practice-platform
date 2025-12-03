// ============================================================================
// CLIENT SIGNUP PAGE
// ============================================================================
// Public signup page for clients to create their portal account
// Links directly to practice and enrolls in Discovery service line
// ============================================================================

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Compass, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';

export function SignupPage() {
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // 2. Get practice - try multiple name patterns, then fallback to first practice
      let practiceId: string | null = null;
      
      // Try to find by known names
      const { data: practices } = await supabase
        .from('practices')
        .select('id, name')
        .or('name.ilike.%RPGCC%,name.ilike.%RP Griffiths%,name.ilike.%Torsor%')
        .limit(1);

      if (practices?.[0]) {
        practiceId = practices[0].id;
      } else {
        // Fallback: get any practice
        const { data: anyPractice } = await supabase
          .from('practices')
          .select('id')
          .limit(1)
          .single();
        
        if (anyPractice) {
          practiceId = anyPractice.id;
        }
      }
      
      if (!practiceId) throw new Error('No practice configured. Please contact support.');

      // 3. Create practice member as client
      const { data: member, error: memberError } = await supabase
        .from('practice_members')
        .insert({
          practice_id: practiceId,
          user_id: authData.user.id,
          name,
          email,
          member_type: 'client',
          program_status: 'discovery'
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 4. Get discovery service line
      const { data: discoveryService } = await supabase
        .from('service_lines')
        .select('id')
        .eq('code', 'discovery')
        .single();

      // 5. Enroll in discovery service line
      if (discoveryService && member) {
        await supabase
          .from('client_service_lines')
          .insert({
            client_id: member.id,
            service_line_id: discoveryService.id,
            status: 'pending_discovery'
          });
      }

      setSuccess(true);

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Account Created!
          </h1>
          <p className="text-gray-600 mb-6">
            Check your email to verify your account, then log in to complete your discovery assessment.
          </p>
          <a 
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Continue to Login
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Begin Your Discovery
          </h1>
          <p className="text-slate-400">
            Create your client portal to explore how we can help your business thrive
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Acme Ltd (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password
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
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
              <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                Log in
              </a>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Powered by RPGCC • Your data is secure and confidential</p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;

