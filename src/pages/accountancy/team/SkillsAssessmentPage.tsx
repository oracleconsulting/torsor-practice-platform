import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import SkillsAssessment from '@/components/accountancy/team/SkillsAssessment';
import { supabase } from '@/lib/supabase/client';

/**
 * Skills Assessment Page for Accountancy Portal
 * 
 * Allows team members to complete or update their skills assessment
 * from within the accountancy portal (no separate authentication needed)
 */
const SkillsAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [skillCategories, setSkillCategories] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[SkillsAssessmentPage] No session found, but continuing with empty state');
        setLoading(false);
        return;
      }

      // Get practice member
      const { data: memberData, error: memberError } = await supabase
        .from('practice_members')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (memberError || !memberData) {
        console.error('[SkillsAssessmentPage] Error loading member:', memberError);
        // Don't redirect - show empty state instead
        setLoading(false);
        return;
      }

      setMember(memberData);

      // Load all practice members for context
      const { data: membersData } = await supabase
        .from('practice_members')
        .select('*')
        .eq('practice_id', memberData.practice_id);

      setTeamMembers(membersData || []);

      // Load skills and categories
      const { data: skillsData } = await supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      // Group skills by category
      const categoriesMap: Record<string, any> = {};
      skillsData?.forEach(skill => {
        if (!categoriesMap[skill.category]) {
          categoriesMap[skill.category] = {
            id: skill.category,
            name: skill.category,
            skills: []
          };
        }
        categoriesMap[skill.category].skills.push(skill);
      });

      setSkillCategories(Object.values(categoriesMap));
    } catch (error) {
      console.error('Failed to load assessment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentComplete = () => {
    toast({
      title: 'Assessment Complete!',
      description: 'Your skills have been saved successfully',
    });
    navigate('/accountancy/team');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <Card className="max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Assessment Not Available</CardTitle>
            <CardDescription>
              Unable to load your assessment. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/accountancy/team')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  Skills Assessment
                  <Badge className="bg-purple-500">In Progress</Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Complete your skills assessment to unlock personalized training recommendations
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/accountancy/team')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Assessment Component */}
        <SkillsAssessment
          member={member}
          mode="self"
          teamMembers={teamMembers}
          skillCategories={skillCategories}
          onComplete={handleAssessmentComplete}
        />
      </div>
    </div>
  );
};

export default SkillsAssessmentPage;

