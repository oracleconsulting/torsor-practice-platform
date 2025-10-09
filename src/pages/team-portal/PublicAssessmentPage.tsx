import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Star, CheckCircle, Save, ArrowRight, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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
      const cats = Array.from(new Set(skillsData?.map((s: any) => s.category) || [])).sort();
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

  const nextCategory = async () => {
    if (currentCategory < categories.length - 1) {
      setCurrentCategory(currentCategory + 1);
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
      <label className="text-sm font-medium">Current Skill Level</label>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => onChange(skill.id, 'current_level', level)}
            className={`
              p-4 rounded-lg border-2 transition-all text-center
              ${value === level
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {['Aware', 'Working', 'Proficient', 'Advanced', 'Master'][level - 1]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const InterestSelector = ({ skill, value, onChange }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Interest Level</label>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            onClick={() => onChange(skill.id, 'interest_level', level)}
            className={`
              p-3 rounded-full transition-all
              ${value >= level
                ? 'text-yellow-500'
                : 'text-gray-300 dark:text-gray-700'
              }
            `}
          >
            <Star className="w-8 h-8" fill={value >= level ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-white">Skills Assessment</CardTitle>
                <CardDescription className="text-gray-400">
                  Welcome, {invitation.name}!
                </CardDescription>
              </div>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <p className="text-sm text-gray-400 mt-2">
              Category {currentCategory + 1} of {categories.length}: {categories[currentCategory]}
            </p>
            <p className="text-xs text-gray-500">
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
              <Card key={skill.id} className={`bg-gray-800 border-gray-700 ${isComplete ? 'border-green-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white">{skill.name}</CardTitle>
                      <CardDescription className="mt-1 text-gray-400">{skill.description}</CardDescription>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          Required: Level {skill.required_level}
                        </Badge>
                        {skill.service_line && (
                          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
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
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      placeholder="Any additional context, certifications, or experience..."
                      value={assessment.notes || ''}
                      onChange={(e) => updateAssessment(skill.id, 'notes', e.target.value)}
                      rows={2}
                      className="resize-none bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <Button
              onClick={nextCategory}
              className="w-full"
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
            <p className="text-xs text-center text-gray-500 mt-4">
              No login required. Your responses are automatically saved when you complete the assessment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

