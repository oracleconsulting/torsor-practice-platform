import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Download, Award, Edit, ChevronDown } from 'lucide-react';
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
  top_performers?: Array<{ name: string; level: number }>;
}

export default function MySkillsHeatmap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<number>(0);

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
        .select('id, name, category, description')
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
            
            // Find top 2 performers
            const sortedByLevel = [...teamAssessmentsForSkill].sort((a: any, b: any) => (b.current_level || 0) - (a.current_level || 0));
            const topPerformers = sortedByLevel.slice(0, 2).map((performer: any) => ({
              name: performer?.practice_members?.name || 'Unknown',
              level: performer?.current_level || 0
            }));
            
            return {
              skill_id: a.skill_id,
              skill_name: (skill as any).name,
              category: (skill as any).category || 'Uncategorized',
              current_level: a.current_level,
              interest_level: a.interest_level,
              description: (skill as any).description || 'No description available',
              team_average: teamAverage,
              target_average: 3, // Default target for all skills
              top_performers: topPerformers
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

  // Sort assessments: Red (level 1) on left to Green (level 5) on right - COLUMN-WISE
  // CSS Grid with gridAutoFlow: 'column' will handle the column layout
  // We just need to sort by level, then alphabetically
  const sortedByLevel = [...filteredAssessments].sort((a, b) => {
    if (a.current_level !== b.current_level) {
      return a.current_level - b.current_level; // Lower levels first (red -> green)
    }
    return a.skill_name.localeCompare(b.skill_name); // Alphabetical within same level
  });

  const scrollToSkill = (skillId: string) => {
    const element = document.getElementById(`skill-${skillId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the card briefly
      element.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  const handleEditSkill = async (skillId: string, newLevel: number) => {
    try {
      // Get member ID
      const { data: member } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!member) return;

      // Update skill assessment
      const { error } = await supabase
        .from('skill_assessments')
        .update({ current_level: newLevel })
        .eq('team_member_id', (member as any).id)
        .eq('skill_id', skillId);

      if (error) throw error;

      // Update local state
      setAssessments(prev => prev.map(skill => 
        skill.skill_id === skillId 
          ? { ...skill, current_level: newLevel }
          : skill
      ));

      setEditingSkill(null);
    } catch (error) {
      console.error('Error updating skill:', error);
    }
  };

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

        {/* Category Filter Buttons with Mini Heatmaps */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              key="All"
              variant={selectedCategory === 'All' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('All')}
              size="sm"
              className="flex items-center gap-2"
            >
              <span>All Categories</span>
              <div className="flex gap-0.5">
                {/* Show mini heatmap for all skills */}
                {[1, 2, 3, 4, 5].map(level => {
                  const count = assessments.filter(a => a.current_level === level).length;
                  if (count === 0) return null;
                  return (
                    <div 
                      key={level}
                      className={`w-2 h-6 ${getSkillLevelColor(level)} rounded-sm`}
                      title={`Level ${level}: ${count} skills`}
                      style={{ width: `${Math.max(8, count * 2)}px` }}
                    />
                  );
                })}
              </div>
            </Button>
            
            {categories.filter(cat => cat !== 'All').map(cat => {
              const catSkills = assessments.filter(a => a.category === cat);
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <span>{cat}</span>
                  <div className="flex gap-0.5">
                    {/* Show mini heatmap for this category */}
                    {[1, 2, 3, 4, 5].map(level => {
                      const count = catSkills.filter(s => s.current_level === level).length;
                      if (count === 0) return null;
                      return (
                        <div 
                          key={level}
                          className={`w-2 h-6 ${getSkillLevelColor(level)} rounded-sm`}
                          title={`Level ${level}: ${count} skills`}
                          style={{ width: `${Math.max(8, count * 2)}px` }}
                        />
                      );
                    })}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Compact Visual Heatmap */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Visual Overview</CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Quick glance at your skills portfolio - {sortedByLevel.length} skills assessed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Grid layout that fills COLUMNS first (top to bottom), then moves right */}
            {/* Overflow-x-auto allows horizontal scrolling on small screens, but prevents items from escaping viewport */}
            <div className="overflow-x-auto">
              <div 
                className="grid gap-2 w-fit"
                style={{
                  gridTemplateRows: 'repeat(5, minmax(0, 1fr))',
                  gridAutoFlow: 'column',
                  gridAutoColumns: '3rem' // w-12 equivalent (48px)
                }}
              >
                {sortedByLevel.map(skill => (
                  <div
                    key={skill.skill_id}
                    onClick={() => scrollToSkill(skill.skill_id)}
                    className={`
                      ${getSkillLevelColor(skill.current_level)}
                      w-12 h-12 rounded-md hover:scale-110 transition-transform cursor-pointer
                      group relative hover:ring-2 hover:ring-blue-500
                    `}
                    title={skill.skill_name}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                        <p className="font-semibold">{skill.skill_name}</p>
                        <p>Level: {skill.current_level}/5</p>
                        <p className="text-blue-300 text-[10px]">Click to view details</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Detailed Skills List by Category - Accordion Style */}
        <Accordion type="multiple" className="space-y-2">
          {categories.filter(cat => cat !== 'All').map(category => {
            const categorySkills = (selectedCategory === 'All' 
              ? assessments.filter(a => a.category === category)
              : sortedByLevel.filter(a => a.category === category))
              // Sort within category: red to green (level 1 to 5), then alphabetically
              .sort((a, b) => {
                if (a.current_level !== b.current_level) {
                  return a.current_level - b.current_level;
                }
                return a.skill_name.localeCompare(b.skill_name);
              });
            
            if (categorySkills.length === 0) return null;

            return (
              <AccordionItem key={category} value={category} className="border rounded-lg bg-white">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                        <p className="text-sm text-gray-600 font-medium">{categorySkills.length} skills in this category</p>
                      </div>
                    </div>
                    
                    {/* Mini heatmap showing skill level distribution */}
                    <div className="flex gap-1 ml-4">
                      {[1, 2, 3, 4, 5].map(level => {
                        const count = categorySkills.filter(s => s.current_level === level).length;
                        if (count === 0) return null;
                        return (
                          <div key={level} className="flex flex-col items-center">
                            <div 
                              className={`w-8 ${getSkillLevelColor(level)} rounded`}
                              style={{ height: `${Math.max(20, count * 8)}px` }}
                              title={`${count} skill${count > 1 ? 's' : ''} at level ${level}`}
                            />
                            <span className="text-xs text-gray-600 mt-1">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-3 mt-2">
                    {categorySkills.map(skill => (
                      <div
                        key={skill.skill_id}
                        id={`skill-${skill.skill_id}`}
                        className="border rounded-lg p-4 hover:shadow-md transition-all bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-900">{skill.skill_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingSkill === skill.skill_id ? (
                              <>
                                <select
                                  value={editingLevel}
                                  onChange={(e) => setEditingLevel(Number(e.target.value))}
                                  className="border rounded px-2 py-1 text-sm"
                                >
                                  {[0, 1, 2, 3, 4, 5].map(level => (
                                    <option key={level} value={level}>{level}/5</option>
                                  ))}
                                </select>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditSkill(skill.skill_id, editingLevel)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSkill(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className={`
                                  ${getSkillLevelColor(skill.current_level)}
                                  px-4 py-2 rounded-lg font-bold text-gray-900 min-w-[60px] text-center
                                `}>
                                  {skill.current_level}/5
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSkill(skill.skill_id);
                                    setEditingLevel(skill.current_level);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </>
                            )}
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
                            <div className="text-gray-600 font-medium">Top Performers</div>
                            <div className="mt-1 space-y-1">
                              {skill.top_performers?.map((performer, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-900">{performer.name}</span>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {performer.level}/5
                                  </Badge>
                                </div>
                              ))}
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {sortedByLevel.length === 0 && (
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

