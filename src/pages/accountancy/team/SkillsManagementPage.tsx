import React, { useState, useEffect } from 'react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import { advisoryServicesMap } from '@/lib/advisory-services-skills-mapping';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X
} from 'lucide-react';

interface SkillAnalytics {
  skill_id: string;
  skill_name: string;
  skill_description?: string;
  category: string;
  average_level: number;
  average_interest: number;
  total_assessments: number;
  performers: Array<{
    name: string;
    level: number;
  }>;
  firm_required_level: number;
  gap: number;
  advisory_services: string[];
}

interface CategoryStats {
  category: string;
  skill_count: number;
  average_level: number;
  skills_below_target: number;
}

export default function SkillsManagementPage() {
  const { practice } = useAccountancyContext();
  
  const [skillsAnalytics, setSkillsAnalytics] = useState<SkillAnalytics[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRequiredLevel, setEditingRequiredLevel] = useState<string | null>(null);
  const [tempRequiredLevel, setTempRequiredLevel] = useState<number>(3);
  
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    category: '',
    advisory_service: '',
    required_level: 3
  });

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
        .select('id, name, description, category');

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

      // Get firm required levels for this practice
      const { data: requiredLevels, error: requiredError } = await supabase
        .from('skill_required_levels')
        .select('skill_id, required_level')
        .eq('practice_id', practice?.id);

      if (requiredError) throw requiredError;

      // Create a map of skill_id -> required_level
      const requiredLevelsMap = new Map(
        (requiredLevels || []).map(rl => [rl.skill_id, rl.required_level])
      );

      // Process each skill
      const analyticsData: SkillAnalytics[] = skills?.map(skill => {
        const skillAssessments = (assessments || []).filter(
          (a: any) => a.skill_id === skill.id
        );

        if (skillAssessments.length === 0) {
          return {
            skill_id: skill.id,
            skill_name: skill.name,
            skill_description: skill.description,
            category: skill.category,
            average_level: 0,
            average_interest: 0,
            total_assessments: 0,
            performers: [],
            firm_required_level: 3,
            gap: 3,
            advisory_services: getServicesForSkill(skill.name)
          };
        }

        // Calculate averages
        const avgLevel = skillAssessments.reduce((sum, a) => sum + (a.current_level || 0), 0) / skillAssessments.length;
        const avgInterest = skillAssessments.reduce((sum, a) => sum + (a.interest_level || 0), 0) / skillAssessments.length;

        // Get all performers sorted by level
        const sortedPerformers = skillAssessments
          .map((a: any) => ({
            name: a.practice_members?.name || 'Unknown',
            level: a.current_level || 0
          }))
          .sort((a, b) => b.level - a.level);

        const firmRequired = requiredLevelsMap.get(skill.id) || 3; // Default to 3 if not set
        const gap = firmRequired - avgLevel;

        return {
          skill_id: skill.id,
          skill_name: skill.name,
          skill_description: skill.description,
          category: skill.category,
          average_level: avgLevel,
          average_interest: avgInterest,
          total_assessments: skillAssessments.length,
          performers: sortedPerformers,
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

  const getHeatmapColor = (level: number, showBorder: boolean = false) => {
    let bgColor = '';
    let borderColor = '';
    
    if (level >= 4.5) {
      bgColor = 'bg-green-600';
      borderColor = 'border-green-700';
    } else if (level >= 3.5) {
      bgColor = 'bg-green-500';
      borderColor = 'border-green-600';
    } else if (level >= 2.5) {
      bgColor = 'bg-yellow-500';
      borderColor = 'border-yellow-600';
    } else if (level >= 1.5) {
      bgColor = 'bg-orange-500';
      borderColor = 'border-orange-600';
    } else if (level >= 0.5) {
      bgColor = 'bg-red-500';
      borderColor = 'border-red-600';
    } else {
      bgColor = 'bg-gray-300';
      borderColor = 'border-gray-400';
    }

    return showBorder ? `${bgColor} border-4 ${borderColor}` : bgColor;
  };

  const handleAddSkill = async () => {
    try {
      // Add skill to database
      const { data: skill, error } = await supabase
        .from('skills')
        .insert({
          name: newSkill.name,
          description: newSkill.description,
          category: newSkill.category
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Create invitations for all team members to assess this skill
      // TODO: Send push notifications

      // Reload data
      await loadSkillsData();

      // Reset form and close dialog
      setNewSkill({
        name: '',
        description: '',
        category: '',
        advisory_service: '',
        required_level: 3
      });
      setShowAddDialog(false);

      alert(`Skill "${newSkill.name}" added! Team members will be notified to assess it.`);
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill. Please try again.');
    }
  };

  const handleUpdateRequiredLevel = async (skillId: string, newLevel: number) => {
    try {
      // Save to database using upsert
      const { error } = await supabase
        .from('skill_required_levels')
        .upsert({
          practice_id: practice?.id,
          skill_id: skillId,
          required_level: newLevel
        }, {
          onConflict: 'practice_id,skill_id'
        });

      if (error) throw error;

      // Update local state
      setSkillsAnalytics(prev => prev.map(skill => 
        skill.skill_id === skillId 
          ? { ...skill, firm_required_level: newLevel, gap: newLevel - skill.average_level }
          : skill
      ));
      
      // Update category stats to reflect new gap
      setCategoryStats(prev => {
        const skill = skillsAnalytics.find(s => s.skill_id === skillId);
        if (!skill) return prev;
        
        return prev.map(cat => {
          if (cat.category !== skill.category) return cat;
          
          const categorySkills = skillsAnalytics
            .filter(s => s.category === cat.category)
            .map(s => s.skill_id === skillId ? { ...s, firm_required_level: newLevel, gap: newLevel - s.average_level } : s);
          
          return {
            ...cat,
            skills_below_target: categorySkills.filter(s => s.gap > 0).length
          };
        });
      });
      
      setEditingRequiredLevel(null);
    } catch (error) {
      console.error('Error updating required level:', error);
      alert('Failed to update required level. Please try again.');
    }
  };

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    if (!confirm(`Are you sure you want to delete "${skillName}"? This will remove all assessments for this skill.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      await loadSkillsData();
      alert(`Skill "${skillName}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
    }
  };

  const categorySkills = expandedCategory 
    ? skillsAnalytics.filter(s => s.category === expandedCategory)
    : [];

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Management</h1>
            <p className="text-gray-600">
              Comprehensive view of all skills across your firm
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Skill
          </Button>
        </div>

        {/* Category Grid with Inline Expansion */}
        <div className="space-y-4">
          {categoryStats.map((cat) => {
            const isExpanded = expandedCategory === cat.category;
            const categorySkills = skillsAnalytics.filter(s => s.category === cat.category);
            
            return (
              <div key={cat.category}>
                {/* Category Card */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isExpanded ? 'ring-2 ring-amber-500' : ''
                  }`}
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-gray-900">{cat.category}</h3>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-amber-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-900">{cat.average_level.toFixed(1)}</p>
                          <p className="text-xs text-gray-500">Average Level</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-semibold text-gray-700">{cat.skill_count}</p>
                          <p className="text-xs text-gray-500">Skills</p>
                        </div>
                      </div>
                      
                      {cat.skills_below_target > 0 && (
                        <Badge variant="destructive" className="w-full justify-center">
                          {cat.skills_below_target} below target
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded Skills - Appears directly below this category */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 pl-4 border-l-4 border-amber-500">
                            {categorySkills.map((skill) => (
                      <Card key={skill.skill_id} className="overflow-hidden">
                        <CardContent className="p-4">
                          {/* Compact Header Row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">{skill.skill_name}</h3>
                                <div className="flex gap-1">
                                  {skill.advisory_services.slice(0, 2).map((service, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                      {service}
                                    </Badge>
                                  ))}
                                  {skill.advisory_services.length > 2 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      +{skill.advisory_services.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {skill.skill_description && (
                                <p className="text-xs text-gray-600 line-clamp-1">{skill.skill_description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSkill(skill.skill_id, skill.skill_name);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </div>

                          {/* Compact Single Row Layout */}
                          <div className="flex items-center gap-4">
                            {/* Top 2 Performers - Compact */}
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs font-semibold text-gray-700">Top</span>
                              </div>
                              <div className="flex gap-1.5">
                                {skill.performers.slice(0, 2).map((performer, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded border border-green-200">
                                    <span className="text-xs font-medium text-gray-900 truncate max-w-[80px]">{performer.name}</span>
                                    <div className={`w-8 h-8 rounded ${getHeatmapColor(performer.level, true)} flex items-center justify-center flex-shrink-0`}>
                                      <span className="text-white font-bold text-sm">{performer.level}</span>
                                    </div>
                                  </div>
                                ))}
                                {skill.performers.length < 2 && (
                                  <span className="text-xs text-gray-400 italic">Not enough data</span>
                                )}
                              </div>
                            </div>

                            {/* Required Level & Stats - Compact Center */}
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border">
                              {editingRequiredLevel === skill.skill_id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-600">Set:</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                      <button
                                        key={level}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTempRequiredLevel(level);
                                        }}
                                        className={`
                                          w-8 h-8 rounded flex items-center justify-center
                                          font-bold text-sm transition-all
                                          ${tempRequiredLevel === level 
                                            ? `${getHeatmapColor(level, true)} ring-2 ring-amber-500` 
                                            : `${getHeatmapColor(level)} opacity-50 hover:opacity-100`
                                          }
                                        `}
                                      >
                                        <span className="text-white">{level}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateRequiredLevel(skill.skill_id, tempRequiredLevel);
                                    }}
                                    className="h-7 bg-green-600 hover:bg-green-700 px-2"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingRequiredLevel(null);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="text-center">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Required</div>
                                    <div 
                                      className={`w-12 h-12 rounded ${getHeatmapColor(skill.firm_required_level, true)} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingRequiredLevel(skill.skill_id);
                                        setTempRequiredLevel(skill.firm_required_level);
                                      }}
                                    >
                                      <span className="text-white font-bold text-lg">{skill.firm_required_level}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Gap</div>
                                    <Badge className={`
                                      text-xs font-bold px-2 py-1
                                      ${skill.gap <= 0 ? 'bg-green-100 text-green-800' : ''}
                                      ${skill.gap > 0 && skill.gap <= 0.5 ? 'bg-yellow-100 text-yellow-800' : ''}
                                      ${skill.gap > 0.5 && skill.gap <= 1 ? 'bg-orange-100 text-orange-800' : ''}
                                      ${skill.gap > 1 ? 'bg-red-100 text-red-800' : ''}
                                    `}>
                                      {skill.gap > 0 ? `+${skill.gap.toFixed(1)}` : skill.gap.toFixed(1)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-[10px] text-gray-500 mb-0.5">Avg</div>
                                    <div className={`w-12 h-12 rounded ${getHeatmapColor(skill.average_level)} flex items-center justify-center`}>
                                      <span className="text-white font-bold text-sm">{skill.average_level.toFixed(1)}</span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Bottom 2 Performers - Compact */}
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1.5 justify-end">
                                <span className="text-xs font-semibold text-gray-700">Lowest</span>
                                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                              </div>
                              <div className="flex gap-1.5 justify-end">
                                {skill.performers.slice(-2).reverse().map((performer, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded border border-red-200">
                                    <div className={`w-8 h-8 rounded ${getHeatmapColor(performer.level, true)} flex items-center justify-center flex-shrink-0`}>
                                      <span className="text-white font-bold text-sm">{performer.level}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-900 truncate max-w-[80px]">{performer.name}</span>
                                  </div>
                                ))}
                                {skill.performers.length < 2 && (
                                  <span className="text-xs text-gray-400 italic">Not enough data</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Compact Footer */}
                          <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                            <span><strong>{skill.total_assessments}</strong> assessments</span>
                            <span>Interest: <strong>{skill.average_interest.toFixed(1)}/5</strong></span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Skill Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="skill-name">Skill Name *</Label>
                <Input
                  id="skill-name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                  placeholder="e.g., Business Valuation"
                />
              </div>

              <div>
                <Label htmlFor="skill-description">Description</Label>
                <Textarea
                  id="skill-description"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                  placeholder="Describe what this skill involves..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="skill-category">Category *</Label>
                  <Select 
                    value={newSkill.category}
                    onValueChange={(value) => setNewSkill({...newSkill, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryStats.map(cat => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Create New Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="required-level">Firm Required Level *</Label>
                  <Select
                    value={newSkill.required_level.toString()}
                    onValueChange={(value) => setNewSkill({...newSkill, required_level: Number(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Basic</SelectItem>
                      <SelectItem value="2">Level 2 - Developing</SelectItem>
                      <SelectItem value="3">Level 3 - Competent</SelectItem>
                      <SelectItem value="4">Level 4 - Proficient</SelectItem>
                      <SelectItem value="5">Level 5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="advisory-service">Advisory Service Line (Optional)</Label>
                <Select
                  value={newSkill.advisory_service}
                  onValueChange={(value) => setNewSkill({...newSkill, advisory_service: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service line" />
                  </SelectTrigger>
                  <SelectContent>
                    {advisoryServicesMap.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-900">
                  <strong>Note:</strong> When you add this skill, all team members will be notified 
                  to complete an assessment for it.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSkill}
                disabled={!newSkill.name || !newSkill.category}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
