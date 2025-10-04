import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

const steps = [
  'Business Info',
  'Current Revenue',
  'Energy Check-In',
  'First Task',
  'AI Board Selection',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [revenue, setRevenue] = useState('');
  const [energy, setEnergy] = useState(70);
  const [task, setTask] = useState('');
  const [board, setBoard] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Save user profile
      await supabase.from('user_profiles').upsert({
        user_id: userId,
        business_name: businessName,
        business_type: businessType,
        onboarding_completed: true,
      });
      // Save metrics
      await supabase.from('dashboard_metrics').insert({
        user_id: userId,
        revenue: revenue ? Number(revenue) : null,
        business_health: 80,
        energy_level: energy,
      });
      // Save first task
      if (task) {
        await supabase.from('tasks').insert({
          user_id: userId,
          title: task,
          urgency: 'medium',
          duration_minutes: 30,
          completed: false,
        });
      }
      // Save board members
      for (const role of board) {
        await supabase.from('board_members').insert({
          user_id: userId,
          role,
          name: role,
          personality_type: 'default',
          is_active: true,
        });
      }
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error saving onboarding data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="mb-4 flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
          ))}
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{steps[step]}</h2>
        <div className="mb-4">
          {step === 0 && (
            <div className="space-y-3">
              <input
                className="w-full p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
                placeholder="Business Name"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
              />
              <input
                className="w-full p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
                placeholder="Business Type (e.g. SaaS, Agency)"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
              />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <input
                className="w-full p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
                placeholder="Current Revenue (£)"
                type="number"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-gray-700 dark:text-gray-200">How is your energy today?</label>
              <input
                type="range"
                min={0}
                max={100}
                value={energy}
                onChange={e => setEnergy(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-lg font-bold text-purple-600">{energy}%</div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <input
                className="w-full p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
                placeholder="What's your main focus today?"
                value={task}
                onChange={e => setTask(e.target.value)}
              />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Choose your AI board members:</label>
              <div className="flex flex-wrap gap-2">
                {['CFO', 'CMO', 'COO', 'CTO'].map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`px-3 py-2 rounded-lg border font-medium transition ${board.includes(role) ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => setBoard(board.includes(role) ? board.filter(r => r !== role) : [...board, role])}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
            onClick={handleBack}
            disabled={step === 0 || loading}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium shadow hover:bg-purple-600 transition"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium shadow hover:bg-green-600 transition"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Finish'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}; 