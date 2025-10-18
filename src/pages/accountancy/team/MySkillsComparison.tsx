import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Award, Users } from 'lucide-react';

interface SkillComparison {
  id: string;
  name: string;
  category: string;
  myLevel: number;
  teamAverage: number;
  topPerformer: string;
  topPerformerLevel: number;
  lowestPerformer: string;
  lowestPerformerLevel: number;
}

export const MySkillsComparison: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState<SkillComparison[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadSkillComparisons();
    }
  }, [user?.id]);

  const loadSkillComparisons = async () => {
    try {
      setLoading(true);

      // Get my member ID
      const { data: member } = await supabase
        .from('practice_members')
        .select('id, name')
        .eq('user_id', user?.id)
        .single();

      if (!member) {
        console.log('[SkillsComparison] No member found');
        setLoading(false);
        return;
      }

      console.log('[SkillsComparison] Loading for member:', (member as any).id);

      // Get MY assessments first - simple query
      const { data: myAssessments, error: assessError } = await supabase
        .from('skill_assessments')
        .select('skill_id, current_level')
        .eq('team_member_id', (member as any).id);

      console.log('[SkillsComparison] My assessments:', myAssessments, 'Error:', assessError);

      if (!myAssessments || myAssessments.length === 0) {
        console.log('[SkillsComparison] No assessments found');
        setLoading(false);
        return;
      }

      // Get skill details separately
      const mySkillIds = (myAssessments as any).map((a: any) => a.skill_id);
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, category')
        .in('id', mySkillIds);

      if (!skillsData) {
        setLoading(false);
        return;
      }

      // Create maps - skills table has category directly
      const skillsMap = new Map((skillsData as any).map((s: any) => [s.id, s]));

      // Get ALL assessments for these specific skills
      const { data: allAssessments } = await supabase
        .from('skill_assessments')
        .select(`
          skill_id,
          team_member_id,
          current_level,
          practice_members!inner(name)
        `)
        .in('skill_id', mySkillIds);

      console.log('[SkillsComparison] All team assessments:', allAssessments);

      // Process comparisons
      const comparisonData: SkillComparison[] = [];
      const categorySet = new Set<string>();

      for (const myAssessment of (myAssessments as any)) {
        const skill = skillsMap.get((myAssessment as any).skill_id);
        if (!skill) continue;

        const category = (skill as any).category || 'Uncategorized';
        categorySet.add(category);

        const skillAssessments = (allAssessments as any)?.filter((a: any) => a.skill_id === (myAssessment as any).skill_id) || [];
        
        if (skillAssessments.length === 0) continue;

        // Calculate team average
        const teamAverage = skillAssessments.reduce((sum: number, a: any) => sum + (a.current_level || 0), 0) / skillAssessments.length;

        // Find top and lowest performers
        const sortedByLevel = [...skillAssessments].sort((a: any, b: any) => (b.current_level || 0) - (a.current_level || 0));
        const topPerformer = sortedByLevel[0] as any;
        const lowestPerformer = sortedByLevel[sortedByLevel.length - 1] as any;

        comparisonData.push({
          id: (skill as any).id,
          name: (skill as any).name,
          category,
          myLevel: (myAssessment as any).current_level || 0,
          teamAverage: teamAverage,
          topPerformer: topPerformer?.practice_members?.name || 'Unknown',
          topPerformerLevel: topPerformer?.current_level || 0,
          lowestPerformer: lowestPerformer?.practice_members?.name || 'Unknown',
          lowestPerformerLevel: lowestPerformer?.current_level || 0
        });
      }

      console.log('[SkillsComparison] Final comparisons:', comparisonData);
      setComparisons(comparisonData);
      setCategories(['all', ...Array.from(categorySet).sort()]);
    } catch (error) {
      console.error('Error loading skill comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComparisons = selectedCategory === 'all' 
    ? comparisons 
    : comparisons.filter(c => c.category === selectedCategory);

  const getPerformanceColor = (myLevel: number, teamAverage: number) => {
    if (myLevel >= teamAverage + 1) return 'text-green-600';
    if (myLevel < teamAverage - 1) return 'text-red-600';
    return 'text-amber-600';
  };

  const getPerformanceBadge = (myLevel: number, teamAverage: number) => {
    if (myLevel >= teamAverage + 1) return <Badge className="bg-green-600">Above Average</Badge>;
    if (myLevel < teamAverage - 1) return <Badge className="bg-red-600">Below Average</Badge>;
    return <Badge className="bg-amber-600">Average</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skill comparisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/team-member/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Skills Comparison</h1>
          <p className="text-gray-600">Compare your skill levels with team averages and top performers</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Skills Comparison Grid */}
        <div className="space-y-4">
          {filteredComparisons.map(comp => (
            <Card key={comp.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Skill Name & Category */}
                  <div className="md:col-span-1">
                    <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                    <p className="text-sm text-gray-600">{comp.category}</p>
                  </div>

                  {/* My Level */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <TrendingUp className={`h-8 w-8 ${getPerformanceColor(comp.myLevel, comp.teamAverage)}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">My Level</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(comp.myLevel, comp.teamAverage)}`}>
                        {comp.myLevel}/5
                      </p>
                    </div>
                  </div>

                  {/* Team Average */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Team Average</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {comp.teamAverage.toFixed(1)}/5
                      </p>
                    </div>
                  </div>

                  {/* Top Performer */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Award className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Top Performer</p>
                      <p className="text-sm font-semibold text-gray-900">{comp.topPerformer}</p>
                      <p className="text-xs text-gray-600">Level {comp.topPerformerLevel}</p>
                    </div>
                  </div>

                  {/* Performance Badge */}
                  <div className="flex justify-end">
                    {getPerformanceBadge(comp.myLevel, comp.teamAverage)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredComparisons.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">No skill comparisons available for this category.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySkillsComparison;

