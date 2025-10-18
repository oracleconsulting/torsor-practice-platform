import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SkillAssessment {
  skill_id: string;
  skill_name: string;
  category: string;
  current_level: number;
  interest_level: number;
  description?: string;
  team_average?: number;
  target_average?: number;
  top_performer?: string;
  top_performer_level?: number;
}

export default function MySkillsHeatmap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (user?.id) {
      loadMySkills();
    }
  }, [user?.id]);

  const loadMySkills = async () => {
    try {
      setLoading(true);

      // Get practice member
      const { data: member } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!member) {
        console.log('[MySkillsHeatmap] No practice member found');
        setLoading(false);
        return;
      }

      console.log('[MySkillsHeatmap] Loading skills for member:', (member as any).id);

      // Get all skill assessments for this member
      const { data: assessmentsData, error: assessError } = await supabase
        .from('skill_assessments')
        .select('skill_id, current_level, interest_level')
        .eq('team_member_id', (member as any).id);

      console.log('[MySkillsHeatmap] Assessments data:', assessmentsData, 'Error:', assessError);

      if (!assessmentsData || assessmentsData.length === 0) {
        console.log('[MySkillsHeatmap] No assessments found');
        setLoading(false);
        return;
      }

      // Get skill IDs
      const skillIds = (assessmentsData as any).map((a: any) => a.skill_id);

      // Get skill details with descriptions
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category, description, target_level')
        .in('id', skillIds);

      console.log('[MySkillsHeatmap] Skills data:', skillsData, 'Error:', skillsError);

      if (!skillsData) {
        setLoading(false);
        return;
      }

      // Get ALL team assessments for comparison
      const { data: allTeamAssessments } = await supabase
        .from('skill_assessments')
        .select(`
          skill_id,
          current_level,
          practice_members!inner(name)
        `)
        .in('skill_id', skillIds);

      console.log('[MySkillsHeatmap] Team assessments:', allTeamAssessments);

      // Create lookup maps
      const skillsMap = new Map(skillsData.map((s: any) => [s.id, s]));

      if (assessmentsData) {
        const formattedAssessments: SkillAssessment[] = assessmentsData
          .map((a: any) => {
            const skill = skillsMap.get(a.skill_id);
            if (!skill) return null;

            // Calculate team stats for this skill
            const teamAssessmentsForSkill = (allTeamAssessments as any)?.filter((ta: any) => ta.skill_id === a.skill_id) || [];
            const teamLevels = teamAssessmentsForSkill.map((ta: any) => ta.current_level || 0);
            const teamAverage = teamLevels.length > 0 
              ? teamLevels.reduce((sum: number, level: number) => sum + level, 0) / teamLevels.length 
              : 0;
            
            // Find top performer
            const sortedByLevel = [...teamAssessmentsForSkill].sort((a: any, b: any) => (b.current_level || 0) - (a.current_level || 0));
            const topPerformer = sortedByLevel[0] as any;
            
            return {
              skill_id: a.skill_id,
              skill_name: (skill as any).name,
              category: (skill as any).category || 'Uncategorized',
              current_level: a.current_level,
              interest_level: a.interest_level,
              description: (skill as any).description || 'No description available',
              team_average: teamAverage,
              target_average: (skill as any).target_level || 3,
              top_performer: topPerformer?.practice_members?.name || 'N/A',
              top_performer_level: topPerformer?.current_level || 0
            };
          })
          .filter(Boolean) as SkillAssessment[];

        console.log('[MySkillsHeatmap] Formatted assessments:', formattedAssessments.length);
        setAssessments(formattedAssessments);

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(formattedAssessments.map(a => a.category)));
        setCategories(['All', ...uniqueCategories.sort()]);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = selectedCategory === 'All'
    ? assessments
    : assessments.filter(a => a.category === selectedCategory);

  const getSkillLevelColor = (level: number) => {
    if (level === 0) return 'bg-gray-200';
    if (level === 1) return 'bg-red-300';
    if (level === 2) return 'bg-orange-300';
    if (level === 3) return 'bg-yellow-300';
    if (level === 4) return 'bg-lime-300';
    if (level === 5) return 'bg-green-400';
    return 'bg-gray-200';
  };

  const getInterestBorderColor = (interest: number) => {
    if (interest === 0) return 'border-gray-300';
    if (interest === 1) return 'border-red-400';
    if (interest === 2) return 'border-orange-400';
    if (interest === 3) return 'border-yellow-400';
    if (interest === 4) return 'border-lime-400';
    if (interest === 5) return 'border-green-500';
    return 'border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/team-member/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">My Skills Heatmap</h1>
            <p className="text-gray-600 mt-2">
              Visual overview of your skill levels and interests
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Compact Visual Heatmap */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Visual Overview</CardTitle>
            <CardDescription>
              Quick glance at your skills portfolio - {filteredAssessments.length} skills assessed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filteredAssessments.map(skill => (
                <div
                  key={skill.skill_id}
                  className={`
                    ${getSkillLevelColor(skill.current_level)}
                    w-12 h-12 rounded-md hover:scale-110 transition-transform cursor-pointer
                    group relative
                  `}
                  title={skill.skill_name}
                >
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <p className="font-semibold">{skill.skill_name}</p>
                      <p>Level: {skill.current_level}/5</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Color Legend - Compact */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-300 rounded"></div>
                <span>Beginner</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-300 rounded"></div>
                <span>Basic</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                <span>Competent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-lime-300 rounded"></div>
                <span>Proficient</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span>Expert</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Skills List by Category */}
        <div className="space-y-4">
          {categories.filter(cat => cat !== 'All').map(category => {
            const categorySkills = selectedCategory === 'All' 
              ? assessments.filter(a => a.category === category)
              : filteredAssessments.filter(a => a.category === category);
            
            if (categorySkills.length === 0) return null;

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-xl">{category}</CardTitle>
                  <CardDescription>{categorySkills.length} skills in this category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categorySkills.map(skill => (
                      <div
                        key={skill.skill_id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-900">{skill.skill_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                          </div>
                          <div className={`
                            ${getSkillLevelColor(skill.current_level)}
                            px-4 py-2 rounded-lg font-bold text-gray-900 min-w-[60px] text-center
                          `}>
                            {skill.current_level}/5
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 font-medium">Your Level</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-bold text-gray-900">{skill.current_level}/5</span>
                              {skill.current_level >= skill.target_average! && (
                                <Award className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-600 font-medium">Team Average</div>
                            <div className="text-lg font-bold text-gray-900 mt-1">
                              {skill.team_average?.toFixed(1) || '0.0'}/5
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-600 font-medium">Target Average</div>
                            <div className="text-lg font-bold text-blue-600 mt-1">
                              {skill.target_average}/5
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-600 font-medium">Top Performer</div>
                            <div className="mt-1">
                              <div className="font-semibold text-gray-900">{skill.top_performer}</div>
                              <div className="text-xs text-gray-600">Level {skill.top_performer_level}/5</div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress to Target</span>
                            <span>{Math.round((skill.current_level / skill.target_average!) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                skill.current_level >= skill.target_average!
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min((skill.current_level / skill.target_average!) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAssessments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">No skills assessed yet.</p>
              <Button
                onClick={() => navigate('/team-member/skills-assessment')}
              >
                Start Skills Assessment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

