import React, { useState, useEffect } from 'react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import { advisoryServicesMap } from '@/lib/advisory-services-skills-mapping';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface SkillAnalytics {
  skill_id: string;
  skill_name: string;
  category: string;
  average_level: number;
  average_interest: number;
  total_assessments: number;
  top_performer: string | null;
  top_performer_level: number;
  lowest_performer: string | null;
  lowest_performer_level: number;
  firm_required_level: number;
  gap: number;
  advisory_services: string[];
}

interface CategoryStats {
  category: string;
  skill_count: number;
  average_level: number;
  average_interest: number;
  skills_below_target: number;
}

export default function SkillsManagementPage() {
  const { practice } = useAccountancyContext();
  
  const [skillsAnalytics, setSkillsAnalytics] = useState<SkillAnalytics[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'gap'>('name');

  useEffect(() => {
    if (practice?.id) {
      loadSkillsData();
    }
  }, [practice?.id]);

  const loadSkillsData = async () => {
    try {
      setLoading(true);

      // Get all skills with their assessments
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category');

      if (skillsError) throw skillsError;

      // Get all assessments for this practice
      const { data: assessments, error: assessError } = await supabase
        .from('skill_assessments')
        .select(`
          skill_id,
          current_level,
          interest_level,
          team_member_id,
          practice_members!inner(name, practice_id)
        `)
        .eq('practice_members.practice_id', practice?.id);

      if (assessError) throw assessError;

      // Process each skill
      const analyticsData: SkillAnalytics[] = skills?.map(skill => {
        const skillAssessments = (assessments || []).filter(
          (a: any) => a.skill_id === skill.id
        );

        if (skillAssessments.length === 0) {
          return {
            skill_id: skill.id,
            skill_name: skill.name,
            category: skill.category,
            average_level: 0,
            average_interest: 0,
            total_assessments: 0,
            top_performer: null,
            top_performer_level: 0,
            lowest_performer: null,
            lowest_performer_level: 0,
            firm_required_level: 3, // Default target
            gap: 3,
            advisory_services: getServicesForSkill(skill.name)
          };
        }

        // Calculate averages
        const avgLevel = skillAssessments.reduce((sum, a) => sum + (a.current_level || 0), 0) / skillAssessments.length;
        const avgInterest = skillAssessments.reduce((sum, a) => sum + (a.interest_level || 0), 0) / skillAssessments.length;

        // Find top and lowest performers
        const sortedByLevel = [...skillAssessments].sort((a, b) => (b.current_level || 0) - (a.current_level || 0));
        const topPerformer = sortedByLevel[0];
        const lowestPerformer = sortedByLevel[sortedByLevel.length - 1];

        const firmRequired = 3; // TODO: Make this configurable per skill
        const gap = firmRequired - avgLevel;

        return {
          skill_id: skill.id,
          skill_name: skill.name,
          category: skill.category,
          average_level: avgLevel,
          average_interest: avgInterest,
          total_assessments: skillAssessments.length,
          top_performer: (topPerformer as any)?.practice_members?.name || null,
          top_performer_level: topPerformer?.current_level || 0,
          lowest_performer: (lowestPerformer as any)?.practice_members?.name || null,
          lowest_performer_level: lowestPerformer?.current_level || 0,
          firm_required_level: firmRequired,
          gap: gap,
          advisory_services: getServicesForSkill(skill.name)
        };
      }) || [];

      setSkillsAnalytics(analyticsData);

      // Calculate category stats
      const categories = [...new Set(analyticsData.map(s => s.category))];
      const catStats: CategoryStats[] = categories.map(category => {
        const categorySkills = analyticsData.filter(s => s.category === category);
        return {
          category,
          skill_count: categorySkills.length,
          average_level: categorySkills.reduce((sum, s) => sum + s.average_level, 0) / categorySkills.length,
          average_interest: categorySkills.reduce((sum, s) => sum + s.average_interest, 0) / categorySkills.length,
          skills_below_target: categorySkills.filter(s => s.gap > 0).length
        };
      });

      setCategoryStats(catStats);

    } catch (error) {
      console.error('Error loading skills data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServicesForSkill = (skillName: string): string[] => {
    const services: string[] = [];
    advisoryServicesMap.forEach(service => {
      const hasSkill = service.requiredSkills.some(req => req.skillName === skillName);
      if (hasSkill) {
        services.push(service.name);
      }
    });
    return services;
  };

  // Filter and sort skills
  const filteredSkills = skillsAnalytics
    .filter(skill => {
      const matchesSearch = skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           skill.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.skill_name.localeCompare(b.skill_name);
        case 'level':
          return b.average_level - a.average_level;
        case 'gap':
          return b.gap - a.gap;
        default:
          return 0;
      }
    });

  const getGapColor = (gap: number) => {
    if (gap <= 0) return 'text-green-600 bg-green-50';
    if (gap <= 0.5) return 'text-yellow-600 bg-yellow-50';
    if (gap <= 1) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-500';
    if (level >= 3) return 'bg-blue-500';
    if (level >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Management</h1>
          <p className="text-gray-600">
            Comprehensive view of all skills across your firm
          </p>
        </div>

        {/* Category Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categoryStats.slice(0, 4).map((cat, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-600 mb-2">{cat.category}</p>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{cat.average_level.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Avg Level</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-700">{cat.skill_count}</p>
                    <p className="text-xs text-gray-500">Skills</p>
                  </div>
                </div>
                {cat.skills_below_target > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {cat.skills_below_target} below target
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryStats.map(cat => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="level">Sort by Level</SelectItem>
                  <SelectItem value="gap">Sort by Gap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Skills List */}
        <div className="space-y-3">
          {filteredSkills.map((skill) => (
            <Card key={skill.skill_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Skill Name & Category */}
                  <div className="lg:col-span-3">
                    <h3 className="font-bold text-gray-900 mb-1">{skill.skill_name}</h3>
                    <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                  </div>

                  {/* Firm Metrics */}
                  <div className="lg:col-span-2 flex flex-col gap-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Firm Average</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${getLevelColor(skill.average_level)} h-2 rounded-full`}
                            style={{ width: `${(skill.average_level / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{skill.average_level.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Interest: {skill.average_interest.toFixed(1)}/5</p>
                    </div>
                  </div>

                  {/* Required Level & Gap */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Required</p>
                        <Badge variant="outline" className="font-bold">
                          Level {skill.firm_required_level}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Gap</p>
                        <Badge className={getGapColor(skill.gap)}>
                          {skill.gap > 0 ? `+${skill.gap.toFixed(1)}` : skill.gap.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Top & Lowest Performers */}
                  <div className="lg:col-span-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-600">Top:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {skill.top_performer || 'N/A'} ({skill.top_performer_level})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-gray-600">Lowest:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {skill.lowest_performer || 'N/A'} ({skill.lowest_performer_level})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Advisory Services */}
                  <div className="lg:col-span-2">
                    <p className="text-xs text-gray-600 mb-2">Used in:</p>
                    <div className="flex flex-wrap gap-1">
                      {skill.advisory_services.length > 0 ? (
                        skill.advisory_services.map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                            {service.split(' ')[0]}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No skills found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

