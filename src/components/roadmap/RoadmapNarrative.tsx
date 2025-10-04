
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Target, Clock, BarChart3, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapNarrativeProps {
  narrative: any;
}

export const RoadmapNarrative: React.FC<RoadmapNarrativeProps> = ({ narrative }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!narrative) return null;

  // Extract key metrics from narrative with fallbacks
  const roiPotential = narrative.roi_potential || narrative.expected_roi || "£25,000-50,000";
  const sprintPlan = narrative.sprint_plan || narrative.timeline || "12";
  const keyActions = narrative.key_actions || narrative.total_actions || "36";
  const timeCommitment = narrative.time_commitment || narrative.weekly_hours || "15+ hours";

  // Extract story components with fallbacks
  const currentReality = narrative.current_reality || 
    narrative.your_story?.current_reality ||
    "James, I see you. 5am, eyes barely open, and already your mind's racing through OracleAI code while a small person demands breakfast and another needs their PE kit. It's go go go from the moment you wake, with no off switch in sight.";

  const vision = narrative.vision || 
    narrative.your_story?.vision ||
    "Now imagine this: It's 90 days from now, and it's a Tuesday. You still wake at 5am, but there's a calmness in the routine, no racing thoughts. You're present with your kids, enjoying the little moments over breakfast. OracleAI has a CTO steering the ship, and the marketing support across all 4 businesses means no more constant fires to put out. You're working 9-12 or 5-8, whatever suits your life, not the other way around. This is the freedom you've been craving.";

  const promise = narrative.promise || 
    narrative.your_story?.promise ||
    "Every task in this roadmap can be done in 15+ hours. No 3am hustle. No missing bedtime. Just focused sprints that fit between school runs. Because I get it, James. I've been there. And I promise, we'll get you to that Tuesday feeling, one focused step at a time.";

  return (
    <Card className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 border-purple-700/50 mb-6">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-300" />
            <div>
              <CardTitle className="text-white text-xl">OracleConsulting.AI Transformation</CardTitle>
              <p className="text-purple-200 text-sm mt-1">
                Your journey from overwhelmed solopreneur to thriving UK tech leader
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/20 text-purple-200 border-purple-500/30">
              AI-Powered Transformation
            </Badge>
            <div className="text-right text-purple-200">
              <p className="text-sm">Time commitment</p>
              <p className="font-semibold">{timeCommitment}</p>
              <p className="text-xs">Just 2 hours per day</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-purple-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-300" />
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <CardContent>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-800/30 backdrop-blur-sm rounded-lg p-4 border border-purple-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    <span className="text-purple-200 text-sm">ROI Potential</span>
                  </div>
                  <p className="text-white text-xl font-bold">{roiPotential}</p>
                  <p className="text-purple-300 text-xs">annual value</p>
                </div>

                <div className="bg-purple-800/30 backdrop-blur-sm rounded-lg p-4 border border-purple-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-purple-200 text-sm">Sprint Plan</span>
                  </div>
                  <p className="text-white text-xl font-bold">{sprintPlan}</p>
                  <p className="text-purple-300 text-xs">weeks mapped</p>
                </div>

                <div className="bg-purple-800/30 backdrop-blur-sm rounded-lg p-4 border border-purple-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-200 text-sm">Actions</span>
                  </div>
                  <p className="text-white text-xl font-bold">{keyActions}</p>
                  <p className="text-purple-300 text-xs">key tasks</p>
                </div>

                <div className="bg-purple-800/30 backdrop-blur-sm rounded-lg p-4 border border-purple-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-purple-200 text-sm">Progress</span>
                  </div>
                  <p className="text-white text-xl font-bold">0%</p>
                  <p className="text-purple-300 text-xs">complete</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <Button 
                  variant="outline" 
                  className="border-purple-500/50 text-purple-200 hover:bg-purple-700/50"
                  onClick={() => {
                    // Scroll to roadmap details
                    const roadmapElement = document.querySelector('[data-roadmap-details]');
                    if (roadmapElement) {
                      roadmapElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  View Your Journey Details
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Transformation Story */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Your Transformation Story</h3>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h4 className="font-semibold text-white mb-3">Your Current Reality</h4>
                  <p className="text-purple-100 leading-relaxed">
                    {currentReality}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h4 className="font-semibold text-white mb-3">Your Vision</h4>
                  <p className="text-purple-100 leading-relaxed">
                    {vision}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <h4 className="font-semibold text-white mb-3">Our Promise to You</h4>
                  <p className="text-purple-100 leading-relaxed">
                    {promise}
                  </p>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
