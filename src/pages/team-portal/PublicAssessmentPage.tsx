import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Star, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

/**
 * Public Skills Assessment Page (No Authentication Required)
 * 
 * Users access this via invitation link, complete assessment, and data is saved.
 * No login required - authentication portal comes later.
 */
export default function PublicAssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inviteCode = searchParams.get('invite');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Map<string, any>>(new Map());
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState(0);

  useEffect(() => {
    if (inviteCode) {
      loadData();
    } else {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'No invitation code provided',
        variant: 'destructive',
      });
    }
  }, [inviteCode]);

  const loadData = async () => {
    try {
      console.log('[PublicAssessment] Loading invitation:', inviteCode);
      
      // Load invitation from backend
      const inviteResponse = await fetch(`/api/invitations/${inviteCode}`);
      if (!inviteResponse.ok) throw new Error('Invitation not found');
      const inviteData = await inviteResponse.json();
      
      if (inviteData.status !== 'pending') {
        toast({
          title: 'Invitation Already Used',
          description: 'This invitation has already been accepted.',
          variant: 'destructive',
        });
        return;
      }
      
      setInvitation(inviteData);
      console.log('[PublicAssessment] Invitation loaded:', inviteData.email);

      // Load skills from backend (bypasses RLS)
      console.log('[PublicAssessment] Loading skills from backend...');
      const skillsResponse = await fetch('/api/skills');
      if (!skillsResponse.ok) {
        throw new Error('Failed to load skills');
      }
      const skillsData = await skillsResponse.json();
      
      setSkills(skillsData || []);

      // Get unique categories
      const uniqueCategories = new Set<string>();
      skillsData?.forEach((s: any) => {
        if (s.category) uniqueCategories.add(s.category);
      });
      const cats = Array.from(uniqueCategories).sort();
      setCategories(cats);
      
      console.log('[PublicAssessment] Loaded', skillsData?.length, 'skills in', cats.length, 'categories');
    } catch (error: any) {
      console.error('[PublicAssessment] Load error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load assessment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentCategorySkills = skills.filter(s => s.category === categories[currentCategory]);
  const totalAssessed = skills.filter(s => assessments.has(s.id) && assessments.get(s.id).current_level > 0).length;
  const overallProgress = skills.length > 0 ? Math.round((totalAssessed / skills.length) * 100) : 0;

  const updateAssessment = (skillId: string, field: string, value: any) => {
    const updated = new Map(assessments);
    const current = updated.get(skillId) || { skill_id: skillId };
    current[field] = value;
    updated.set(skillId, current);
    setAssessments(updated);
  };

  const previousCategory = () => {
    if (currentCategory > 0) {
      setCurrentCategory(currentCategory - 1);
    }
  };

  const nextCategory = async () => {
    // Validate that all skills in current category have both skill level AND interest level
    const incompleteSkills = currentCategorySkills.filter(skill => {
      const assessment = assessments.get(skill.id);
      return !assessment || !assessment.current_level || !assessment.interest_level;
    });

    if (incompleteSkills.length > 0) {
      toast({
        title: 'Please Complete All Skills',
        description: `You must rate both skill level and interest level for all ${currentCategorySkills.length} skills in this category before continuing.`,
        variant: 'destructive',
      });
      return;
    }

    if (currentCategory < categories.length - 1) {
      setCurrentCategory(currentCategory + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Submit final assessment
      await submitAssessment();
    }
  };

  const submitAssessment = async () => {
    setSaving(true);
    
    try {
      console.log('[PublicAssessment] Submitting assessment...');
      
      // Save assessment data via backend endpoint
      const assessmentData = Array.from(assessments.values());
      
      const response = await fetch(`/api/invitations/${inviteCode}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit' }));
        throw new Error(errorData.error || 'Failed to submit assessment');
      }
      
      console.log('[PublicAssessment] Assessment submitted successfully!');
      
      toast({
        title: 'Assessment Complete!',
        description: 'Thank you for completing your skills assessment. Your team lead will be in touch soon.',
      });
      
      // Show success page
      navigate(`/team-portal/assessment-complete`);
      
    } catch (error: any) {
      console.error('[PublicAssessment] Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit assessment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const LevelSelector = ({ skill, value, onChange }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Skill Level</label>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => onChange(skill.id, 'current_level', level)}
            className={`
              p-4 rounded-lg border-2 transition-all text-center
              ${value === level
                ? 'border-blue-600 bg-blue-500 text-white shadow-lg scale-105'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-400 hover:shadow'
              }
            `}
          >
            <div className="text-2xl font-bold">{level}</div>
            <div className={`text-xs mt-1 ${value === level ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
              {['Aware', 'Working', 'Proficient', 'Advanced', 'Master'][level - 1]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const InterestSelector = ({ skill, value, onChange }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Interest Level <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => onChange(skill.id, 'interest_level', level)}
            className={`
              p-3 rounded-full transition-all hover:scale-110
              ${value >= level
                ? 'text-yellow-500 dark:text-yellow-400'
                : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
              }
            `}
          >
            <Star className="w-8 h-8" fill={value >= level ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
        {value === 0 && 'Rate your interest (required)'}
        {value === 1 && 'No Interest'}
        {value === 2 && 'Low Interest'}
        {value === 3 && 'Moderate Interest'}
        {value === 4 && 'High Interest'}
        {value === 5 && 'Passionate'}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Invalid Invitation</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">This invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-gray-900 dark:text-white text-2xl">Skills Assessment</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-lg mt-1">
                  Welcome, {invitation.name}!
                </CardDescription>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 font-medium">
              Category {currentCategory + 1} of {categories.length}: {categories[currentCategory]}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {totalAssessed} of {skills.length} skills assessed ({overallProgress}%)
            </p>
          </CardHeader>
        </Card>

        {/* Skill Cards */}
        <div className="space-y-4">
          {currentCategorySkills.map(skill => {
            const assessment = assessments.get(skill.id) || {};
            const isComplete = assessment.current_level && assessment.interest_level;

            return (
              <Card key={skill.id} className={`bg-white dark:bg-gray-800 border-2 shadow-md ${isComplete ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 dark:text-white">{skill.name}</CardTitle>
                      <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">{skill.description}</CardDescription>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950">
                          Required: Level {skill.required_level}
                        </Badge>
                        {skill.service_line && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            {skill.service_line}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isComplete && (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <LevelSelector
                    skill={skill}
                    value={assessment.current_level}
                    onChange={updateAssessment}
                  />
                  
                  <InterestSelector
                    skill={skill}
                    value={assessment.interest_level}
                    onChange={updateAssessment}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                    <Textarea
                      placeholder="Any additional context, certifications, or experience..."
                      value={assessment.notes || ''}
                      onChange={(e) => updateAssessment(skill.id, 'notes', e.target.value)}
                      rows={2}
                      className="resize-none bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              {currentCategory > 0 && (
                <Button
                  onClick={previousCategory}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={saving}
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button
                onClick={nextCategory}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                disabled={saving}
                size="lg"
              >
                {currentCategory < categories.length - 1 ? (
                  <>
                    Next Category
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Complete Assessment
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-4">
              {currentCategory < categories.length - 1 
                ? 'Both skill level and interest level are required for all skills before continuing.'
                : 'Review your responses, then submit to complete the assessment.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

