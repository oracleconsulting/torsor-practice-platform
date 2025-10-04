import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Users, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface BoardIntroStepProps {
  onComplete: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

interface BoardMember {
  role: string;
  name: string;
  personality_type: string;
  expertise_areas: string[];
  avatar?: string;
}

const roleDescriptions: Record<string, { title: string; description: string; avatar: string }> = {
  'CFO': {
    title: 'Chief Financial Officer',
    description: 'Your financial strategist who keeps you profitable and cash-flow positive',
    avatar: '💰'
  },
  'CMO': {
    title: 'Chief Marketing Officer',
    description: 'Your growth catalyst who drives customer acquisition and brand building',
    avatar: '📈'
  },
  'COO': {
    title: 'Chief Operating Officer',
    description: 'Your efficiency expert who streamlines operations and scales systems',
    avatar: '⚙️'
  },
  'CTO': {
    title: 'Chief Technology Officer',
    description: 'Your innovation leader who leverages technology for competitive advantage',
    avatar: '💻'
  },
  'CHRO': {
    title: 'Chief Human Resources Officer',
    description: 'Your culture architect who builds high-performing teams',
    avatar: '👥'
  },
  'CLO': {
    title: 'Chief Legal Officer',
    description: 'Your risk guardian who protects and structures your business',
    avatar: '⚖️'
  }
};

export const BoardIntroStep: React.FC<BoardIntroStepProps> = ({ onComplete, onBack }) => {
  const { user } = useAuth();
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<number>(0);

  useEffect(() => {
    fetchBoardMembers();
  }, [user?.id]);

  const fetchBoardMembers = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      setBoardMembers(data || []);
    } catch (error) {
      console.error('Error fetching board members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-gray-300 text-lg">
          Meet your AI advisory board - expert advisors tailored to your business needs.
        </p>
      </motion.div>

      {boardMembers.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {boardMembers.map((member, index) => {
              const roleInfo = roleDescriptions[member.role] || {
                title: member.role,
                description: 'Your strategic advisor',
                avatar: '👤'
              };
              
              return (
                <motion.button
                  key={member.role}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedMember(index)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedMember === index
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-4xl mb-2">{roleInfo.avatar}</div>
                  <h3 className="text-white font-semibold text-sm">{member.name}</h3>
                  <p className="text-gray-400 text-xs">{member.role}</p>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            key={selectedMember}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">
                {roleDescriptions[boardMembers[selectedMember].role]?.avatar || '👤'}
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-semibold mb-1">
                  {boardMembers[selectedMember].name}
                </h3>
                <p className="text-purple-300 font-medium mb-3">
                  {roleDescriptions[boardMembers[selectedMember].role]?.title || boardMembers[selectedMember].role}
                </p>
                <p className="text-gray-300 mb-4">
                  {roleDescriptions[boardMembers[selectedMember].role]?.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Personality: {boardMembers[selectedMember].personality_type}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center"
        >
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No Board Members Yet</h3>
          <p className="text-gray-400">
            Your AI board will be created based on your assessment results.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h3 className="text-white font-semibold mb-3">How your board works:</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>Each board member provides specialized expertise in their domain</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>They'll send you daily insights and strategic recommendations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>You can chat with them anytime for advice and guidance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>Their personalities adapt to your communication style</span>
          </li>
        </ul>
      </motion.div>

      <div className="flex justify-between">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
        )}
        
        <div className="flex-1 flex justify-end">
          <Button
            onClick={onComplete}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            Continue
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 