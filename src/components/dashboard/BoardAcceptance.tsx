import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, Sparkles, Users, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';

interface BoardAcceptanceProps {
  groupId: string;
  board: string[];
  rationale: Record<string, string>;
  scores: Record<string, number>;
  onAccept: () => void;
  onReject: () => void;
}

const agentDetails: Record<string, { 
  icon: any; 
  color: string; 
  title: string;
  focus: string[];
}> = {
  CEO: { 
    icon: Sparkles, 
    color: 'from-purple-500 to-pink-500',
    title: 'Chief Executive Officer',
    focus: ['Strategic Vision', 'Leadership', 'Stakeholder Management']
  },
  CFO: { 
    icon: Brain, 
    color: 'from-green-500 to-emerald-500',
    title: 'Chief Financial Officer',
    focus: ['Cash Flow', 'Financial Planning', 'Risk Management']
  },
  COO: { 
    icon: Users, 
    color: 'from-blue-500 to-cyan-500',
    title: 'Chief Operating Officer',
    focus: ['Operations', 'Efficiency', 'Process Optimization']
  },
  CMO: { 
    icon: Sparkles, 
    color: 'from-orange-500 to-red-500',
    title: 'Chief Marketing Officer',
    focus: ['Brand Strategy', 'Customer Acquisition', 'Market Positioning']
  },
  CSO: { 
    icon: Brain, 
    color: 'from-indigo-500 to-purple-500',
    title: 'Chief Synthesis Officer',
    focus: ['Integration', 'Holistic Strategy', 'Cross-functional Alignment']
  }
};

export const BoardAcceptance: React.FC<BoardAcceptanceProps> = ({
  groupId,
  board,
  rationale,
  scores,
  onAccept,
  onReject
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.email) throw new Error('User not authenticated');

      // Update client_config to mark board as accepted
      const { error } = await supabase
        .from('client_config')
        .update({ 
          board_accepted: true,
          board_accepted_at: new Date().toISOString()
        } as any) // Temporary type bypass
        .eq('group_id', groupId);

      if (error) throw error;

      toast({
        title: "Board Accepted! 🎉",
        description: "Your AI advisors are being initialized...",
      });
      onAccept();
    } catch (error) {
      console.error('Failed to accept board:', error);
      toast({
        title: "Error",
        description: "Failed to accept board. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Your AI Board of Advisors
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Based on your assessment, we've assembled a personalized board of AI advisors 
            to guide your business journey. Each advisor brings unique expertise tailored to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {board.map((role) => {
            const details = agentDetails[role];
            const Icon = details?.icon || Brain;
            const relevanceScore = scores[role] || 85;
            
            return (
              <motion.div
                key={role}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedAgent(selectedAgent === role ? null : role)}
                className="cursor-pointer"
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all h-full">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${details?.color || 'from-gray-600 to-gray-700'}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">
                          {relevanceScore}%
                        </div>
                        <div className="text-xs text-gray-500">Relevance</div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">{role}</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {details?.title || 'Strategic Advisor'}
                    </p>
                    
                    <AnimatePresence>
                      {selectedAgent === role && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-700"
                        >
                          <p className="text-sm text-gray-300 mb-3">
                            {rationale[role]}
                          </p>
                          <div className="space-y-1">
                            {details?.focus.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-1 h-1 bg-purple-400 rounded-full" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
          >
            {isAccepting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Initializing Board...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Accept Board & Enter Boardroom
              </>
            )}
          </Button>
          
          <Button
            onClick={onReject}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            <X className="w-5 h-5 mr-2" />
            Request Different Advisors
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
