import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SkillAssessment {
  skill_id: string;
  skill_name: string;
  category: string;
  current_level: number;
  interest_level: number;
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

      console.log('[MySkillsHeatmap] Loading skills for member:', member.id);

      // Get all skill assessments with skill details
      const { data: assessmentsData, error } = await supabase
        .from('skill_assessments')
        .select(`
          skill_id,
          current_level,
          interest_level,
          skills (
            id,
            name,
            skill_categories (
              name
            )
          )
        `)
        .eq('practice_member_id', member.id);

      console.log('[MySkillsHeatmap] Assessments data:', assessmentsData, 'Error:', error);

      if (assessmentsData) {
        const formattedAssessments: SkillAssessment[] = assessmentsData.map((a: any) => ({
          skill_id: a.skill_id,
          skill_name: a.skills.name,
          category: a.skills.skill_categories?.name || 'Uncategorized',
          current_level: a.current_level,
          interest_level: a.interest_level
        }));

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

        {/* Legend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Color Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2 text-black">Skill Levels (background color):</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded"></div>
                    <span className="text-black">0 - Not Assessed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-300 border border-gray-300 rounded"></div>
                    <span className="text-black">1 - Beginner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-300 border border-gray-300 rounded"></div>
                    <span className="text-black">2 - Basic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-300 border border-gray-300 rounded"></div>
                    <span className="text-black">3 - Competent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-lime-300 border border-gray-300 rounded"></div>
                    <span className="text-black">4 - Proficient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-400 border border-gray-300 rounded"></div>
                    <span className="text-black">5 - Expert</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-2 text-black">Interest Levels (border color):</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded"></div>
                    <span className="text-black">0 - No Interest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 border-2 border-red-400 rounded"></div>
                    <span className="text-black">1 - Low Interest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 border-2 border-orange-400 rounded"></div>
                    <span className="text-black">2 - Some Interest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 border-2 border-yellow-400 rounded"></div>
                    <span className="text-black">3 - Moderate Interest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 border-2 border-lime-400 rounded"></div>
                    <span className="text-black">4 - High Interest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 border-2 border-green-500 rounded"></div>
                    <span className="text-black">5 - Very High Interest</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">
              {selectedCategory === 'All' ? 'All Skills' : selectedCategory}
            </CardTitle>
            <CardDescription className="text-black">
              {filteredAssessments.length} skills assessed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredAssessments.map(skill => (
                <div
                  key={skill.skill_id}
                  className={`
                    ${getSkillLevelColor(skill.current_level)}
                    border-2 ${getInterestBorderColor(skill.interest_level)}
                    rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer
                    group relative
                  `}
                  title={`${skill.skill_name}\nSkill Level: ${skill.current_level}/5\nInterest: ${skill.interest_level}/5`}
                >
                  <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                    {skill.skill_name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-700">
                    <span className="font-bold">{skill.current_level}/5</span>
                    <span className="text-gray-600">❤️ {skill.interest_level}</span>
                  </div>
                  
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <p className="font-semibold">{skill.skill_name}</p>
                      <p>Skill Level: {skill.current_level}/5</p>
                      <p>Interest: {skill.interest_level}/5</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssessments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-black">No skills assessed in this category yet.</p>
                <Button
                  onClick={() => navigate('/team-member/skills-assessment')}
                  className="mt-4"
                >
                  Start Skills Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

