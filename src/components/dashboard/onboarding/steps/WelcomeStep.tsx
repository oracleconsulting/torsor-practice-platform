import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Brain, Target, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleOnboarding } from '@/hooks/useSimpleOnboarding';

interface WelcomeStepProps {
  onComplete: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { stage } = useSimpleOnboarding();
  
  const firstName = user?.email?.split('@')[0] || 'Founder';

  const features = [
    {
      icon: Brain,
      title: 'Living Intelligence',
      description: 'Your dashboard learns and adapts to your business needs'
    },
    {
      icon: Target,
      title: 'Clear Focus',
      description: 'Daily priorities aligned with your 12-week roadmap'
    },
    {
      icon: Users,
      title: 'AI Advisory Board',
      description: 'Expert guidance from your personalized board members'
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">
          Welcome, {firstName}! 🎉
        </h2>
        <p className="text-gray-300 text-lg">
          Your Oracle Dashboard is where your business intelligence comes alive.
          Let's set it up in just a few minutes.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">What happens next?</h3>
            <p className="text-gray-300 text-sm">
              We'll import your assessment data, configure your key metrics, 
              introduce you to your AI board, and set your first priority. 
              The whole process takes less than 5 minutes.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
        >
          Let's Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  );
}; 