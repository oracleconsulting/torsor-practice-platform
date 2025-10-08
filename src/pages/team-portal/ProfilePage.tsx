import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  User,
  Star,
  TrendingUp,
  Download,
  Edit,
  ChevronDown,
  ChevronRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SkillWithAssessment {
  skill: any;
  assessment: any;
  gap: number;
}

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, SkillWithAssessment[]>>({});
  const [stats, setStats] = useState({
    totalSkills: 0,
    assessedSkills: 0,
    averageLevel: 0,
    topSkills: [] as any[],
    developmentAreas: [] as any[]
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'interest'>('name');
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get practice member
      const { data: memberData } = await supabase
        .from('practice_members')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!memberData) return;
      setMember(memberData);

      // Get all skills with assessments
      const { data: assessments } = await supabase
        .from('skill_assessments')
        .select(`
          *,
          skill:skill_id (*)
        `)
        .eq('team_member_id', memberData.id);

      // Get all skills
      const { data: allSkills } = await supabase
        .from('skills')
        .select('*');

      // Organize by category
      const byCategory: Record<string, SkillWithAssessment[]> = {};
      const assessmentMap = new Map(assessments?.map(a => [a.skill_id, a]) || []);

      allSkills?.forEach(skill => {
        if (!byCategory[skill.category]) {
          byCategory[skill.category] = [];
        }

        const assessment = assessmentMap.get(skill.id);
        const gap = assessment 
          ? Math.max(0, (skill.required_level || 0) - (assessment.current_level || 0))
          : (skill.required_level || 0);

        byCategory[skill.category].push({
          skill,
          assessment: assessment || null,
          gap
        });
      });

      setSkillsByCategory(byCategory);

      // Calculate stats
      const assessedCount = assessments?.length || 0;
      const totalCount = allSkills?.length || 0;
      const avgLevel = assessedCount > 0
        ? (assessments?.reduce((sum, a) => sum + (a.current_level || 0), 0) || 0) / assessedCount
        : 0;

      // Top skills (level 4-5)
      const topSkills = (assessments || [])
        .filter(a => (a.current_level || 0) >= 4)
        .sort((a, b) => (b.current_level || 0) - (a.current_level || 0))
        .slice(0, 10);

      // Development areas (high interest, lower skill)
      const developmentAreas = (assessments || [])
        .filter(a => (a.interest_level || 0) > (a.current_level || 0))
        .sort((a, b) => 
          ((b.interest_level || 0) - (b.current_level || 0)) - 
          ((a.interest_level || 0) - (a.current_level || 0))
        )
        .slice(0, 5);

      setStats({
        totalSkills: totalCount,
        assessedSkills: assessedCount,
        averageLevel: avgLevel,
        topSkills,
        developmentAreas
      });

      // Expand all categories by default
      setExpandedCategories(new Set(Object.keys(byCategory)));

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getSkillLevelColor = (level: number) => {
    if (level === 0) return 'bg-gray-600';
    if (level === 1) return 'bg-red-500';
    if (level === 2) return 'bg-orange-500';
    if (level === 3) return 'bg-yellow-500';
    if (level === 4) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getSkillLevelLabel = (level: number) => {
    return ['Not Assessed', 'Awareness', 'Working', 'Proficient', 'Advanced', 'Master'][level] || 'N/A';
  };

  const getCategoryStats = (category: string) => {
    const skills = skillsByCategory[category] || [];
    const assessed = skills.filter(s => s.assessment).length;
    const avgLevel = assessed > 0
      ? skills.reduce((sum, s) => sum + (s.assessment?.current_level || 0), 0) / assessed
      : 0;
    return { total: skills.length, assessed, avgLevel };
  };

  const sortSkills = (skills: SkillWithAssessment[]) => {
    return [...skills].sort((a, b) => {
      if (sortBy === 'name') {
        return a.skill.name.localeCompare(b.skill.name);
      } else if (sortBy === 'level') {
        return (b.assessment?.current_level || 0) - (a.assessment?.current_level || 0);
      } else {
        return (b.assessment?.interest_level || 0) - (a.assessment?.interest_level || 0);
      }
    });
  };

  const filterSkills = (skills: SkillWithAssessment[]) => {
    if (filterLevel === null) return skills;
    return skills.filter(s => (s.assessment?.current_level || 0) === filterLevel);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {member?.user_id ? 'Your Skills Profile' : 'Skills Profile'}
              </h1>
              <p className="text-gray-400">
                {member?.role || 'Team Member'} • Last updated: {
                  stats.assessedSkills > 0 ? 'Recently' : 'Never'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/team-portal/assessment')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Update Skills
            </button>
            <button
              onClick={() => {/* TODO: Generate PDF */}}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Skills</div>
          <div className="text-3xl font-bold text-white">{stats.totalSkills}</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Assessed</div>
          <div className="text-3xl font-bold text-green-400">{stats.assessedSkills}</div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((stats.assessedSkills / stats.totalSkills) * 100)}% complete
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Average Level</div>
          <div className="text-3xl font-bold text-blue-400">{stats.averageLevel.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Out of 5.0</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Expert Skills</div>
          <div className="text-3xl font-bold text-purple-400">{stats.topSkills.length}</div>
          <div className="text-xs text-gray-500 mt-1">Level 4-5</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Skills List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters & Sort */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Filter:</span>
                <select
                  value={filterLevel === null ? 'all' : filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value === 'all' ? null : Number(e.target.value))}
                  className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="0">Not Assessed</option>
                  <option value="1">Awareness (1)</option>
                  <option value="2">Working (2)</option>
                  <option value="3">Proficient (3)</option>
                  <option value="4">Advanced (4)</option>
                  <option value="5">Master (5)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="level">Skill Level</option>
                  <option value="interest">Interest</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (expandedCategories.size === Object.keys(skillsByCategory).length) {
                    setExpandedCategories(new Set());
                  } else {
                    setExpandedCategories(new Set(Object.keys(skillsByCategory)));
                  }
                }}
                className="ml-auto text-sm text-blue-400 hover:text-blue-300"
              >
                {expandedCategories.size === Object.keys(skillsByCategory).length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>

          {/* Skills by Category */}
          {Object.entries(skillsByCategory).map(([category, skills]) => {
            const isExpanded = expandedCategories.has(category);
            const categoryStats = getCategoryStats(category);
            const filteredSkills = filterSkills(sortSkills(skills));

            return (
              <div key={category} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">{category}</h3>
                      <p className="text-sm text-gray-400">
                        {categoryStats.assessed}/{categoryStats.total} assessed • Avg: {categoryStats.avgLevel.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(categoryStats.assessed / categoryStats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 min-w-[3rem] text-right">
                      {Math.round((categoryStats.assessed / categoryStats.total) * 100)}%
                    </span>
                  </div>
                </button>

                {/* Skills List */}
                {isExpanded && (
                  <div className="border-t border-gray-700">
                    {filteredSkills.length > 0 ? (
                      <div className="p-4 space-y-2">
                        {filteredSkills.map(({ skill, assessment, gap }) => (
                          <div 
                            key={skill.id}
                            className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{skill.name}</p>
                              <p className="text-sm text-gray-400 truncate">{skill.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-4 ml-4">
                              {/* Current Level */}
                              <div className="text-center">
                                <div className={`
                                  w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white
                                  ${getSkillLevelColor(assessment?.current_level || 0)}
                                `}>
                                  {assessment?.current_level || 0}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Level</div>
                              </div>

                              {/* Interest */}
                              {assessment && (
                                <div className="text-center">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < (assessment.interest_level || 0)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">Interest</div>
                                </div>
                              )}

                              {/* Gap */}
                              {gap > 0 && (
                                <div className="text-center">
                                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center font-bold text-orange-400">
                                    -{gap}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">Gap</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400">
                        No skills match the current filter
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar - Top Skills & Development */}
        <div className="space-y-6">
          {/* Top Skills */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Top Strengths
            </h3>
            
            {stats.topSkills.length > 0 ? (
              <div className="space-y-3">
                {stats.topSkills.slice(0, 5).map((assessment, idx) => (
                  <div key={assessment.skill_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {assessment.skill?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < assessment.current_level
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Complete your assessment to see your top skills</p>
            )}
          </div>

          {/* Development Areas */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Development Focus
            </h3>
            
            {stats.developmentAreas.length > 0 ? (
              <div className="space-y-3">
                {stats.developmentAreas.map((assessment) => (
                  <div key={assessment.skill_id} className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-white text-sm font-medium mb-2">
                      {assessment.skill?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400">
                        Skill: <span className="text-orange-400">{assessment.current_level}/5</span>
                      </span>
                      <span className="text-gray-400">
                        Interest: <span className="text-green-400">{assessment.interest_level}/5</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Set interest levels to see development recommendations</p>
            )}

            <button
              onClick={() => navigate('/team-portal/development')}
              className="mt-4 w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
            >
              Create Development Goals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

