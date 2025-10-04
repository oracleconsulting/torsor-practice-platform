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
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(member);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Skill categories for assessment
  const skillCategoriesList = [
    'Technical Accounting & Audit',
    'Digital & Technology',
    'Advisory & Consulting',
    'Sector Specialisation',
    'Regulatory & Compliance',
    'Client & Business Development',
    'Leadership & Management',
    'Soft Skills & Communication'
  ];

  useEffect(() => {
    if (selectedMember) {
      // Initialize assessment data from existing skills
      const initialData: AssessmentData = {};
      selectedMember.skills.forEach(skill => {
        initialData[skill.skillId] = {
          skillLevel: skill.currentLevel,
          interestLevel: skill.interestLevel || 3,
          experience: skill.yearsExperience || 0,
          lastUsed: skill.lastAssessed.toISOString().split('T')[0],
          certifications: skill.certifications || [],
          notes: skill.notes || ''
        };
      });
      setAssessmentData(initialData);
    }
  }, [selectedMember]);

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
    setIsSubmitting(true);
    try {
      // In a real implementation, this would call the API
      console.log('Submitting assessment:', assessmentData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setCompleted(true);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = (): number => {
    return ((currentCategory + 1) / skillCategoriesList.length) * 100;
  };

  const getCompletedSkillsCount = (): number => {
    return Object.keys(assessmentData).filter(skillId => 
      assessmentData[skillId]?.skillLevel > 0
    ).length;
  };

  if (mode === 'view' && !selectedMember) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Select a Team Member</h3>
          <p className="text-gray-400 mb-6">Choose a team member to view their skills assessment</p>
          
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
                    <div className="text-sm text-gray-400">{member.role}</div>
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
          <p className="text-gray-400 mb-6">
            Thank you for completing the skills assessment. Your responses have been saved.
          </p>
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
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
                  <div className="text-sm text-gray-400">Assessment Progress</div>
                  <div className="text-lg font-semibold text-white">
                    {getCompletedSkillsCount()} skills assessed
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
                  <span className="text-gray-400">
                    Category {currentCategory + 1} of {skillCategoriesList.length}
                  </span>
                  <span className="text-white font-medium">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                <div className="text-xs text-gray-500">
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
                  <div key={skill.id} className="space-y-4 py-4 border-b border-gray-700 last:border-b-0">
                    <div>
                      <h4 className="font-medium text-white">{skill.name}</h4>
                      <p className="text-sm text-gray-400">{skill.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Required: {skill.requiredLevel}/5
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Skill Level */}
                      <div>
                        <Label className="text-white font-medium">Current Skill Level</Label>
                        <RadioGroup 
                          value={skillData.skillLevel.toString()}
                          onValueChange={(value) => updateAssessment(skill.id, 'skillLevel', parseInt(value))}
                          className="mt-2"
                        >
                          {[1,2,3,4,5].map(level => (
                            <div key={level} className="flex items-center space-x-2">
                              <RadioGroupItem value={level.toString()} id={`${skill.id}-skill-${level}`} />
                              <Label 
                                htmlFor={`${skill.id}-skill-${level}`}
                                className="text-sm text-gray-300 cursor-pointer"
                              >
                                {level} - {getSkillLevelLabel(level)}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Interest Level */}
                      <div>
                        <Label className="text-white font-medium">Interest Level</Label>
                        <RadioGroup 
                          value={skillData.interestLevel.toString()}
                          onValueChange={(value) => updateAssessment(skill.id, 'interestLevel', parseInt(value))}
                          className="mt-2"
                        >
                          {[1,2,3,4,5].map(level => (
                            <div key={level} className="flex items-center space-x-2">
                              <RadioGroupItem value={level.toString()} id={`${skill.id}-interest-${level}`} />
                              <Label 
                                htmlFor={`${skill.id}-interest-${level}`}
                                className="text-sm text-gray-300 cursor-pointer"
                              >
                                {level} - {getInterestLevelLabel(level)}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${skill.id}-experience`} className="text-white">Years of Experience</Label>
                        <Input 
                          id={`${skill.id}-experience`}
                          type="number" 
                          step="0.5"
                          placeholder="0"
                          value={skillData.experience}
                          onChange={(e) => updateAssessment(skill.id, 'experience', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${skill.id}-lastUsed`} className="text-white">Last Used</Label>
                        <Input 
                          id={`${skill.id}-lastUsed`}
                          type="date"
                          value={skillData.lastUsed}
                          onChange={(e) => updateAssessment(skill.id, 'lastUsed', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Certifications */}
                    <div>
                      <Label htmlFor={`${skill.id}-certifications`} className="text-white">Related Certifications</Label>
                      <Input 
                        id={`${skill.id}-certifications`}
                        placeholder="e.g., CPA, CFA, CTA"
                        value={skillData.certifications.join(', ')}
                        onChange={(e) => updateAssessment(skill.id, 'certifications', e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                        className="mt-1"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor={`${skill.id}-notes`} className="text-white">Notes</Label>
                      <Textarea 
                        id={`${skill.id}-notes`}
                        placeholder="Additional comments or context..."
                        value={skillData.notes}
                        onChange={(e) => updateAssessment(skill.id, 'notes', e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
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
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
                disabled={currentCategory === 0 || isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
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
                <div className="text-2xl font-bold text-white">{getCompletedSkillsCount()}</div>
                <div className="text-sm text-gray-400">Skills Assessed</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {Math.round(getProgressPercentage())}%
                </div>
                <div className="text-sm text-gray-400">Complete</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {skillCategoriesList.length - currentCategory - 1}
                </div>
                <div className="text-sm text-gray-400">Categories Remaining</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillsAssessment;
