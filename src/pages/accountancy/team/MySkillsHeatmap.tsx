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

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[MySkillsHeatmap] Loading timeout after 10 seconds - forcing loading state to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  const loadMySkills = async () => {
    try {
      console.log('[MySkillsHeatmap] Starting to load skills for user:', user?.id);
      setLoading(true);

      // Get practice member info (for name, email, practice_id)
      const { data: member, error: memberError } = await supabase
        .from('practice_members')
        .select('id, email, name, role, practice_id')
        .eq('user_id', user?.id)
        .single();

      if (memberError) {
        console.error('[MySkillsHeatmap] Error fetching practice member:', memberError);
        setLoading(false);
        return;
      }

      if (!member) {
        console.log('[MySkillsHeatmap] No practice member found');
        setLoading(false);
        return;
      }

      console.log('[MySkillsHeatmap] Loading skills for:', member.name, member.email);

      /**
       * DATA SOURCE: skill_assessments table (SINGLE SOURCE OF TRUTH)
       * Load current member's skill assessments with skill details
       */
      const { data: myAssessments, error: assessError } = await supabase
        .from('skill_assessments')
        .select(`
          id,
          skill_id,
          current_level,
          interest_level,
          assessed_at,
          skill:skills!inner(
            id,
            name,
            category,
            description
          )
        `)
        .eq('team_member_id', member.id);

      console.log('[MySkillsHeatmap] My assessments:', myAssessments?.length || 0, 'skills', 'Error:', assessError);

      if (assessError) {
        console.error('[MySkillsHeatmap] Error fetching assessments:', assessError);
        setLoading(false);
        return;
      }

      if (!myAssessments || myAssessments.length === 0) {
        console.log('[MySkillsHeatmap] No assessment data found - setting empty state');
        setAssessments([]);
        setCategories(['All']);
        setLoading(false);
        return;
      }

      // Get ALL team assessments for team comparison (top performers, average)
      const { data: allTeamAssessments, error: teamError } = await supabase
        .from('skill_assessments')
        .select(`
          id,
          team_member_id,
          skill_id,
          current_level,
          interest_level,
          practice_members!inner(
            id,
            name,
            email,
            practice_id
          )
        `)
        .eq('practice_members.practice_id', member.practice_id);

      if (teamError) {
        console.error('[MySkillsHeatmap] Error fetching team assessments:', teamError);
      }

      console.log('[MySkillsHeatmap] Team assessments:', allTeamAssessments?.length || 0, 'total');

      // Transform assessments to match our interface
      const formattedAssessments = (myAssessments as any[])
        .map(assessment => {
          const skill = assessment.skill;
          
          if (!skill) {
            console.warn('[MySkillsHeatmap] Skill not found:', assessment.skill_id);
            return null;
          }

          // Calculate team stats for this skill
          const teamSkillData = (allTeamAssessments || [])
            .filter((a: any) => a.skill_id === assessment.skill_id);

          const teamLevels = teamSkillData.map((a: any) => a.current_level || 0);
          const teamAverage = teamLevels.length > 0 
            ? teamLevels.reduce((sum, level) => sum + level, 0) / teamLevels.length 
            : 0;
          
          // Find top 2 performers
          const performersWithNames = teamSkillData
            .map((a: any) => ({
              level: a.current_level || 0,
              name: a.practice_members?.name || 'Unknown'
            }))
            .sort((a, b) => b.level - a.level)
            .slice(0, 2);
          
          return {
            skill_id: assessment.skill_id,
            skill_name: skill.name,
            category: skill.category,
            current_level: assessment.current_level || 0,
            interest_level: assessment.interest_level || 3,
            description: skill.description || 'No description available',
            team_average: teamAverage,
            target_average: 3,
            top_performers: performersWithNames
          };
        })
        .filter(Boolean) as SkillAssessment[];

      console.log('[MySkillsHeatmap] Formatted assessments:', formattedAssessments.length);
      
      // Debug: Check skill level distribution
      const levelCounts = formattedAssessments.reduce((acc, a) => {
        acc[a.current_level] = (acc[a.current_level] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      console.log('[MySkillsHeatmap] Skill level distribution:', levelCounts);
      console.log('[MySkillsHeatmap] Sample skills:', formattedAssessments.slice(0, 5).map(a => ({
        name: a.skill_name,
        level: a.current_level,
        interest: a.interest_level
      })));
      
      setAssessments(formattedAssessments);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(formattedAssessments.map(a => a.category)));
      setCategories(['All', ...uniqueCategories.sort()]);
      
      console.log('[MySkillsHeatmap] Categories set:', uniqueCategories.length);
      
      console.log('[MySkillsHeatmap] Data loading complete');
    } catch (error) {
      console.error('[MySkillsHeatmap] Error loading skills:', error);
    } finally {
      console.log('[MySkillsHeatmap] Setting loading to false');
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
          <CardContent className="relative pt-16 pb-2">
            {/* Grid layout that fills COLUMNS first (top to bottom), then moves right */}
            <div className="overflow-x-auto pb-20">
              <div 
                className="grid gap-2 w-fit relative"
                style={{
                  gridTemplateRows: 'repeat(5, minmax(0, 1fr))',
                  gridAutoFlow: 'column',
                  gridAutoColumns: '3rem' // w-12 equivalent (48px)
                }}
              >
                {sortedByLevel.map((skill, index) => {
                  // Calculate which row this skill is in (0-4)
                  const row = index % 5;
                  const isTopRow = row === 0;
                  
                  return (
                    <div
                      key={skill.skill_id}
                      onClick={() => scrollToSkill(skill.skill_id)}
                      className="group relative"
                      style={{ overflow: 'visible' }}
                    >
                      {/* The colored square */}
                      <div
                        className={`
                          ${getSkillLevelColor(skill.current_level)}
                          w-12 h-12 rounded-md hover:scale-110 transition-transform cursor-pointer
                          hover:ring-2 hover:ring-blue-500 hover:z-[100]
                        `}
                        title={skill.skill_name}
                      />
                      
                      {/* Tooltip - appears below for top row, above for other rows */}
                      <div className={`invisible group-hover:visible absolute left-1/2 -translate-x-1/2 ${isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'} z-[200] pointer-events-none whitespace-nowrap`}>
                        <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 shadow-xl">
                          <div className="font-semibold">{skill.skill_name}</div>
                          <div className="text-xs text-gray-300">Level: {skill.current_level}/5</div>
                        </div>
                        {/* Arrow pointing to the square - direction changes based on position */}
                        <div className={`absolute left-1/2 -translate-x-1/2 ${isTopRow ? '-top-1' : '-bottom-1'}`}>
                          <div className={`w-0 h-0 border-l-4 border-r-4 ${isTopRow ? 'border-b-4 border-b-gray-900' : 'border-t-4 border-t-gray-900'} border-l-transparent border-r-transparent`}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    
                    {/* Mini heatmap grid - squares flowing left to right (red to green) */}
                    <div className="flex gap-1 ml-4">
                      {categorySkills.map(skill => (
                        <div
                          key={skill.skill_id}
                          className={`
                            ${getSkillLevelColor(skill.current_level)}
                            w-6 h-6 rounded flex-shrink-0
                          `}
                          title={`${skill.skill_name}: ${skill.current_level}/5`}
                        />
                      ))}
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

