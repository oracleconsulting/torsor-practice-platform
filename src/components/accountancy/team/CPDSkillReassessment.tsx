/**
 * CPD Skill Reassessment Component
 * Prompts users to reassess their skill levels after completing CPD
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Award, Target, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { createCPDSkillMapping, trackSkillImprovement } from '@/lib/api/cpd-skills-bridge';

interface Skill {
  id: string;
  name: string;
  category: string;
  current_level: number;
}

interface CPDSkillReassessmentProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  cpdActivityId: string;
  selectedSkillIds: string[];
  cpdHours: number;
  cpdTitle: string;
}

export const CPDSkillReassessment: React.FC<CPDSkillReassessmentProps> = ({
  isOpen,
  onClose,
  memberId,
  cpdActivityId,
  selectedSkillIds,
  cpdHours,
  cpdTitle
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newLevels, setNewLevels] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen && selectedSkillIds.length > 0) {
      loadSkills();
    }
  }, [isOpen, selectedSkillIds]);

  const loadSkills = async () => {
    try {
      setLoadingSkills(true);
      
      // Get skill assessments for selected skills
      const { data: assessments } = await supabase
        .from('skill_assessments')
        .select('skill_id, current_level')
        .eq('team_member_id', memberId)
        .in('skill_id', selectedSkillIds);

      if (!assessments || assessments.length === 0) {
        setSkills([]);
        setLoadingSkills(false);
        return;
      }

      // Get skill details
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, category_id')
        .in('id', selectedSkillIds);

      // Get categories
      const categoryIds = [...new Set(skillsData?.map(s => s.category_id) || [])];
      const { data: categories } = await supabase
        .from('skill_categories')
        .select('id, name')
        .in('id', categoryIds);

      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

      // Combine data
      const skillsList: Skill[] = (skillsData || []).map(skill => {
        const assessment = assessments.find(a => a.skill_id === skill.id);
        const currentLevel = assessment?.current_level || 0;
        return {
          id: skill.id,
          name: skill.name,
          category: categoryMap.get(skill.category_id) || 'General',
          current_level: currentLevel
        };
      });

      setSkills(skillsList);
      
      // Initialize new levels to current levels
      const initialLevels: Record<string, number> = {};
      skillsList.forEach(skill => {
        initialLevels[skill.id] = skill.current_level;
      });
      setNewLevels(initialLevels);
    } catch (error) {
      console.error('Error loading skills:', error);
      setSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleLevelChange = (skillId: string, value: number[]) => {
    setNewLevels(prev => ({
      ...prev,
      [skillId]: value[0]
    }));
  };

  const handleNext = () => {
    if (currentStep < skills.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSkip = () => {
    const currentSkill = skills[currentStep];
    // Keep current level (no change)
    setNewLevels(prev => ({
      ...prev,
      [currentSkill.id]: currentSkill.current_level
    }));
    
    if (currentStep < skills.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updates = [];
      const improvements = [];
      
      for (const skill of skills) {
        const oldLevel = skill.current_level;
        const newLevel = newLevels[skill.id] || oldLevel;
        
        // Create CPD-Skill mapping
        await createCPDSkillMapping(
          cpdActivityId,
          skill.id,
          memberId,
          oldLevel,
          newLevel
        );

        // If level changed, update assessment and track improvement
        if (newLevel !== oldLevel) {
          updates.push({
            skillId: skill.id,
            newLevel
          });

          // Track improvement
          await trackSkillImprovement({
            memberId,
            skillId: skill.id,
            levelBefore: oldLevel,
            levelAfter: newLevel,
            changeReason: 'cpd_completion',
            cpdActivityId,
            investmentHours: cpdHours,
            evidenceNotes: `Completed: ${cpdTitle}`
          });

          improvements.push({
            skillName: skill.name,
            oldLevel,
            newLevel,
            change: newLevel - oldLevel
          });
        }
      }

      // Update skill assessments in database
      for (const update of updates) {
        await supabase
          .from('skill_assessments')
          .update({ current_level: update.newLevel })
          .eq('team_member_id', memberId)
          .eq('skill_id', update.skillId);
      }

      // Show success message
      if (improvements.length > 0) {
        const improvementSummary = improvements
          .map(i => `${i.skillName}: ${i.oldLevel} → ${i.newLevel} (${i.change > 0 ? '+' : ''}${i.change})`)
          .join('\n');
        
        toast({
          title: '🎉 Skill Levels Updated!',
          description: `You've improved ${improvements.length} skill(s):\n${improvementSummary}`,
        });
      } else {
        toast({
          title: 'Assessment Complete',
          description: 'Your skill levels have been recorded.',
        });
      }

      onClose();
    } catch (error) {
      console.error('Error submitting reassessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update skill levels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingSkills) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (skills.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">No Skills to Reassess</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentSkill = skills[currentStep];
  const currentNewLevel = newLevels[currentSkill.id] || currentSkill.current_level;
  const levelChange = currentNewLevel - currentSkill.current_level;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Reassess Your Skills
          </DialogTitle>
          <DialogDescription className="text-white font-medium">
            Now that you've completed "{cpdTitle}", let's measure your progress!
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {skills.map((skill, idx) => (
            <div
              key={skill.id}
              className={`flex-1 h-2 rounded-full ${
                idx < currentStep
                  ? 'bg-green-500'
                  : idx === currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="space-y-6">
          {/* Current Skill Card */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{currentSkill.name}</h3>
                  <Badge variant="outline" className="text-gray-300">
                    {currentSkill.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Step {currentStep + 1} of {skills.length}</div>
                </div>
              </div>

              {/* Before/After Comparison */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Before CPD</div>
                  <div className="text-3xl font-bold text-gray-300">{currentSkill.current_level}/5</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg border-2 border-blue-500">
                  <div className="text-sm text-gray-400 mb-1">After CPD</div>
                  <div className={`text-3xl font-bold ${
                    levelChange > 0 ? 'text-green-400' :
                    levelChange < 0 ? 'text-red-400' :
                    'text-gray-300'
                  }`}>
                    {currentNewLevel}/5
                    {levelChange !== 0 && (
                      <span className="text-sm ml-2">
                        ({levelChange > 0 ? '+' : ''}{levelChange})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Label className="text-white font-medium">
                  What's your skill level now?
                </Label>
                <Slider
                  value={[currentNewLevel]}
                  onValueChange={(value) => handleLevelChange(currentSkill.id, value)}
                  min={0}
                  max={5}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0 - None</span>
                  <span>1 - Beginner</span>
                  <span>2 - Basic</span>
                  <span>3 - Competent</span>
                  <span>4 - Proficient</span>
                  <span>5 - Expert</span>
                </div>
              </div>

              {/* Improvement Message */}
              {levelChange > 0 && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">
                    Great progress! You've improved by {levelChange} level{levelChange !== 1 ? 's' : ''}!
                  </span>
                </div>
              )}
              {levelChange < 0 && (
                <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
                  <span className="text-amber-300 font-medium">
                    Note: Your skill level decreased. This might indicate you discovered more complexity in this area.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="text-gray-300"
          >
            No Change
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : currentStep < skills.length - 1 ? 'Next Skill' : 'Complete Assessment'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CPDSkillReassessment;

