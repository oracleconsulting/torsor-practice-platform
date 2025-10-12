import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  category: string;
}

interface TeamMemberSkill {
  memberId: string;
  skillId: string;
  currentLevel: number;
  interestLevel?: number;
  targetLevel: number;
  lastAssessed: Date;
  certifications?: string[];
  notes?: string;
  yearsExperience?: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: TeamMemberSkill[];
  overallScore?: number;
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: Skill[];
}

interface AssessmentData {
  [skillId: string]: {
    skillLevel: number;
    interestLevel: number;
    experience: number;
    lastUsed: string;
    certifications: string[];
    notes: string;
  };
}

interface SkillsAssessmentProps {
  member: TeamMember | null;
  mode: 'view' | 'assess';
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
}

const SkillsAssessment: React.FC<SkillsAssessmentProps> = ({
  member,
  mode,
  teamMembers,
  skillCategories
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(member);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Use ACTUAL categories from the database instead of hardcoded list
  const skillCategoriesList = skillCategories.map(cat => cat.name);

  useEffect(() => {
    if (selectedMember && selectedMember.skills) {
      // Initialize assessment data from existing skills
      const initialData: AssessmentData = {};
      selectedMember.skills.forEach(skill => {
        initialData[skill.skillId] = {
          skillLevel: skill.currentLevel,
          interestLevel: skill.interestLevel || 3,
          experience: skill.yearsExperience || 0,
          lastUsed: skill.lastAssessed ? skill.lastAssessed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          certifications: skill.certifications || [],
          notes: skill.notes || ''
        };
      });
      setAssessmentData(initialData);

      // Auto-jump to first category with incomplete skills
      const firstIncompleteCategory = skillCategoriesList.findIndex(categoryName => {
        const categorySkills = getSkillsForCategory(categoryName);
        return categorySkills.some(skill => !initialData[skill.id] || initialData[skill.id].skillLevel === 0);
      });

      if (firstIncompleteCategory !== -1) {
        console.log('[SkillsAssessment] Jumping to first incomplete category:', skillCategoriesList[firstIncompleteCategory]);
        setCurrentCategory(firstIncompleteCategory);
      }
    }
  }, [selectedMember, skillCategories]);

  const getSkillsForCategory = (categoryName: string): Skill[] => {
    return skillCategories
      .find(cat => cat.name === categoryName)
      ?.skills || [];
  };

  const updateAssessment = (skillId: string, field: string, value: any) => {
    setAssessmentData(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        [field]: value
      }
    }));
  };

  const getSkillLevelLabel = (level: number): string => {
    const labels = [
      'Novice (Basic awareness)',
      'Advanced Beginner (Limited experience)', 
      'Competent (Solid working knowledge)',
      'Proficient (Advanced practitioner)',
      'Expert (Thought leader/trainer)'
    ];
    return labels[level - 1] || '';
  };

  const getInterestLevelLabel = (level: number): string => {
    const labels = [
      'No interest',
      'Mild interest',
      'Moderate interest', 
      'High interest',
      'Passionate/Primary focus area'
    ];
    return labels[level - 1] || '';
  };

  const getCurrentCategorySkills = (): Skill[] => {
    if (currentCategory >= skillCategoriesList.length) return [];
    return getSkillsForCategory(skillCategoriesList[currentCategory]);
  };

  const submitAssessment = async () => {
    if (!selectedMember) {
      toast({
        title: 'Error',
        description: 'No team member selected',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Saving assessment to database:', assessmentData);
      
      // Convert assessmentData to array of upsert records
      const records = Object.entries(assessmentData)
        .filter(([_, data]) => data.skillLevel > 0) // Only save assessed skills
        .map(([skillId, data]) => ({
          team_member_id: selectedMember.id,
          skill_id: skillId,
          current_level: data.skillLevel,
          interest_level: data.interestLevel,
          years_experience: data.experience || 0,
          assessed_at: new Date().toISOString(),
          notes: data.notes || null,
          certifications: data.certifications && data.certifications.length > 0 ? data.certifications : null
        }));

      console.log(`Saving ${records.length} skill assessments for member ${selectedMember.id}`);

      // Delete existing assessments for this member (we'll replace them all)
      const { error: deleteError } = await supabase
        .from('skill_assessments')
        .delete()
        .eq('team_member_id', selectedMember.id);

      if (deleteError) {
        console.error('Error deleting old assessments:', deleteError);
        // Continue anyway - insert will work even if delete fails
      }

      // Insert all new records
      const { error: insertError } = await supabase
        .from('skill_assessments')
        .insert(records);

      if (insertError) {
        console.error('Error saving assessments:', insertError);
        throw insertError;
      }

      console.log('Assessment saved successfully!');
      toast({
        title: 'Success!',
        description: `Saved ${records.length} skill assessments`,
      });

      // Navigate back to team page
      setTimeout(() => {
        navigate('/team');
      }, 1500);

    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assessment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalSkillsCount = (): number => {
    // Count all skills across all categories
    return skillCategories.reduce((total, category) => {
      return total + (category.skills?.length || 0);
    }, 0);
  };

  const getCompletedSkillsCount = (): number => {
    return Object.keys(assessmentData).filter(skillId => 
      assessmentData[skillId]?.skillLevel > 0
    ).length;
  };

  const getProgressPercentage = (): number => {
    const totalSkills = getTotalSkillsCount();
    if (totalSkills === 0) return 0;
    return (getCompletedSkillsCount() / totalSkills) * 100;
  };

  const findNextIncompleteCategory = (): number => {
    // Start searching from the NEXT category after current
    for (let i = currentCategory + 1; i < skillCategoriesList.length; i++) {
      const categorySkills = getSkillsForCategory(skillCategoriesList[i]);
      const hasIncomplete = categorySkills.some(skill => 
        !assessmentData[skill.id] || assessmentData[skill.id].skillLevel === 0
      );
      if (hasIncomplete) {
        return i;
      }
    }
    // If no incomplete found after current, search from beginning
    for (let i = 0; i < currentCategory; i++) {
      const categorySkills = getSkillsForCategory(skillCategoriesList[i]);
      const hasIncomplete = categorySkills.some(skill => 
        !assessmentData[skill.id] || assessmentData[skill.id].skillLevel === 0
      );
      if (hasIncomplete) {
        return i;
      }
    }
    return -1; // No incomplete categories found
  };

  if (mode === 'view' && !selectedMember) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <User className="w-16 h-16 text-gray-100 font-medium mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Select a Team Member</h3>
          <p className="text-white font-medium mb-6">Choose a team member to view their skills assessment</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {teamMembers.map(member => (
              <div 
                key={member.id}
                className="p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-sm text-white font-medium">{member.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Assessment Complete!</h3>
          <p className="text-white font-medium mb-6">
            Thank you for completing the skills assessment. Your responses have been saved.
          </p>
          <div className="space-y-4">
            <div className="text-sm text-white font-medium">
              <p>Skills Assessed: {getCompletedSkillsCount()}</p>
              <p>Completed: {new Date().toLocaleDateString()}</p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Start New Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Selection */}
      {mode === 'assess' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Select Team Member</CardTitle>
            <CardDescription>Choose who you're assessing</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedMember?.id || ''} 
              onValueChange={(value) => {
                const member = teamMembers.find(m => m.id === value);
                setSelectedMember(member || null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name} - {member.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedMember && (
        <>
          {/* Header with member info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {selectedMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-white">{selectedMember.name}</CardTitle>
                    <CardDescription>{selectedMember.role} • {selectedMember.department}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-medium">Assessment Progress</div>
                  <div className="text-lg font-semibold text-white">
                    {getCompletedSkillsCount()}/{getTotalSkillsCount()} skills
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Indicator */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-200">
                    Category {currentCategory + 1} of {skillCategoriesList.length}
                  </span>
                  <span className="text-white font-medium">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                <div className="text-xs text-white font-medium">
                  {skillCategoriesList[currentCategory]}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Form */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">{skillCategoriesList[currentCategory]}</CardTitle>
              <CardDescription>
                Assess current skill level and interest in each area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getCurrentCategorySkills().map(skill => {
                const skillData = assessmentData[skill.id] || {
                  skillLevel: 0,
                  interestLevel: 3,
                  experience: 0,
                  lastUsed: '',
                  certifications: [],
                  notes: ''
                };

                return (
                  <div key={skill.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="mb-3">
                      <h4 className="font-medium text-white text-base">{skill.name}</h4>
                      <p className="text-sm text-white font-medium mt-1">{skill.description}</p>
                    </div>
                    
                    {/* Visual Skill Level Selector */}
                    <div className="mb-3">
                      <Label className="text-white text-sm mb-2 block">Your Skill Level</Label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateAssessment(skill.id, 'skillLevel', level)}
                            className={`flex-1 px-3 py-2 rounded-lg text-center transition-all ${
                              skillData.skillLevel === level
                                ? 'bg-purple-600 text-white font-semibold shadow-lg scale-105'
                                : 'bg-gray-700 text-white font-medium hover:bg-gray-600'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-white font-medium mt-1">
                        {skillData.skillLevel > 0 ? getSkillLevelLabel(skillData.skillLevel) : 'Select your skill level'}
                      </div>
                    </div>

                    {/* Visual Interest Level Selector */}
                    <div>
                      <Label className="text-white text-sm mb-2 block">Interest Level</Label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateAssessment(skill.id, 'interestLevel', level)}
                            className={`flex-1 px-3 py-2 rounded-lg text-center transition-all ${
                              skillData.interestLevel === level
                                ? 'bg-blue-600 text-white font-semibold shadow-lg scale-105'
                                : 'bg-gray-700 text-white font-medium hover:bg-gray-600'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-white font-medium mt-1">
                        {getInterestLevelLabel(skillData.interestLevel)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {getCurrentCategorySkills().length === 0 && (
                <Alert className="bg-yellow-900/20 border-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No skills found for this category. Please check your skill definitions.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
                disabled={currentCategory === 0 || isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {/* Skip to Incomplete Button */}
              <Button 
                variant="secondary"
                onClick={() => {
                  const nextIncomplete = findNextIncompleteCategory();
                  if (nextIncomplete !== -1) {
                    setCurrentCategory(nextIncomplete);
                  }
                }}
                disabled={isSubmitting || findNextIncompleteCategory() === -1}
                className="flex-shrink-0"
              >
                {findNextIncompleteCategory() === -1 ? (
                  'All Complete ✓'
                ) : (
                  <>
                    Skip to Incomplete
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button 
                onClick={() => {
                  if (currentCategory < skillCategoriesList.length - 1) {
                    setCurrentCategory(currentCategory + 1);
                  } else {
                    submitAssessment();
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : currentCategory === skillCategoriesList.length - 1 ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{getCompletedSkillsCount()}/{getTotalSkillsCount()}</div>
                <div className="text-sm text-white font-medium">Skills Assessed</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {Math.round(getProgressPercentage())}%
                </div>
                <div className="text-sm text-white font-medium">Complete</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {skillCategoriesList.length - currentCategory - 1}
                </div>
                <div className="text-sm text-white font-medium">Categories Remaining</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillsAssessment;
