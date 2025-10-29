import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Eye, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Target,
  Edit,
  Save,
  Ear,
  BookOpen,
  Hand,
  Sparkles
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  category: string;
}

interface TeamMemberSkill {
  memberId: string;
  skillId: string;
  currentLevel: number;
  interestLevel?: number;
  targetLevel: number;
  lastAssessed: Date;
  certifications?: string[];
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: TeamMemberSkill[];
  overallScore?: number;
  learningStyle?: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'multimodal';
  varkCompleted?: boolean;
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: Skill[];
}

interface SkillsMatrixProps {
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
  onSelectMember: (member: TeamMember) => void;
  filterOptions: {
    category: string;
    role: string;
  };
}

interface MatrixCell {
  member: TeamMember;
  skill: Skill;
  assessment: TeamMemberSkill | null;
  gap: number;
  interestLevel: number;
}

const SkillsMatrix: React.FC<SkillsMatrixProps> = ({
  teamMembers,
  skillCategories,
  onSelectMember,
  filterOptions
}) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showInterestLevels, setShowInterestLevels] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'heatmap' | 'table'>('heatmap');
  
  // Admin editing state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<MatrixCell | null>(null);
  const [newLevel, setNewLevel] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Filter and prepare data
  const matrixData = useMemo(() => {
    const filteredMembers = teamMembers.filter(member => {
      // Filter out null/undefined members
      if (!member || !member.id || !member.role) {
        return false;
      }
      if (filterOptions.role !== 'all' && !member.role.toLowerCase().includes(filterOptions.role)) {
        return false;
      }
      if (selectedDepartment !== 'all' && member.department !== selectedDepartment) {
        return false;
      }
      return true;
    });

    const filteredSkills = skillCategories
      .flatMap(cat => cat.skills)
      .filter(skill => {
        if (selectedCategory !== 'all') {
          return skill.category === selectedCategory;
        }
        return true;
      });

    const cells: MatrixCell[] = [];
    
    filteredMembers.forEach(member => {
      filteredSkills.forEach(skill => {
        const assessment = member.skills.find(s => s.skillId === skill.id);
        const gap = skill.requiredLevel - (assessment?.currentLevel || 0);
        const interestLevel = assessment?.interestLevel || 0;
        
        cells.push({
          member,
          skill,
          assessment,
          gap,
          interestLevel
        });
      });
    });

    return cells;
  }, [teamMembers, skillCategories, filterOptions, selectedCategory, selectedDepartment]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    // const totalSkills = skillCategories.flatMap(cat => cat.skills).length;
    const avgSkillLevel = matrixData.reduce((sum, cell) => 
      sum + (cell.assessment?.currentLevel || 0), 0) / matrixData.length;
    
    const criticalGaps = matrixData.filter(cell => cell.gap >= 2).length;
    const highInterestCount = matrixData.filter(cell => cell.interestLevel >= 4).length;
    
    const priorityScore = matrixData.reduce((sum, cell) => {
      const priority = cell.gap * cell.interestLevel;
      return sum + priority;
    }, 0) / 100;

    return {
      avgSkillLevel: avgSkillLevel.toFixed(1),
      criticalGaps,
      highInterestCount,
      priorityScore: priorityScore.toFixed(0)
    };
  }, [matrixData, skillCategories]);

  // Admin edit functions
  const handleCellClick = (cell: MatrixCell) => {
    setEditingCell(cell);
    setNewLevel(cell.assessment?.currentLevel || 0);
    setEditNotes(cell.assessment?.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase/client');

      if (editingCell.assessment) {
        // Update existing assessment
        const updateData = {
          current_level: newLevel,
          notes: editNotes,
          assessed_at: new Date().toISOString()
        };
        // @ts-expect-error - Supabase types not properly generated
        const { error } = await supabase
          .from('skill_assessments')
          .update(updateData)
          .eq('team_member_id', editingCell.member.id)
          .eq('skill_id', editingCell.skill.id);

        if (error) throw error;
      } else {
        // Create new assessment
        const insertData = {
          team_member_id: editingCell.member.id,
          skill_id: editingCell.skill.id,
          current_level: newLevel,
          interest_level: 3, // Default interest
          notes: editNotes,
          assessed_at: new Date().toISOString()
        };
        // @ts-expect-error - Supabase types not properly generated
        const { error } = await supabase
          .from('skill_assessments')
          .insert(insertData);

        if (error) throw error;
      }

      toast({
        title: 'Score Updated',
        description: `${editingCell.skill.name} updated to ${newLevel}/5 for ${editingCell.member.name}. Refresh the page to see changes.`,
      });

      setEditDialogOpen(false);
      // Don't reload - just close dialog. User can manually refresh if needed.
    } catch (error) {
      console.error('Error saving score:', error);
      toast({
        title: 'Error',
        description: 'Failed to update score. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Color scale for skill levels - London Skyline theme
  const getSkillLevelColor = (level: number): string => {
    if (level === 0) return 'bg-slate-800'; // No skill - dark slate
    
    const colors = [
      'bg-red-500',   // 1 - Red
      'bg-red-400',   // 2 - Red-Orange  
      'bg-amber-500', // 3 - Amber
      'bg-emerald-500',  // 4 - Emerald
      'bg-emerald-400'   // 5 - Bright Emerald
    ];
    return colors[Math.max(0, Math.min(4, level - 1))];
  };

  // Interest level indicator
  const getInterestIndicator = (interestLevel: number): string => {
    if (!showInterestLevels) return '';
    if (interestLevel >= 4) return 'border-cyan-500 border-2 ring-2 ring-cyan-500/50';
    if (interestLevel >= 3) return 'border-cyan-400 border-2 ring-2 ring-cyan-400/50';
    if (interestLevel >= 2) return 'border-cyan-300 border-2 ring-2 ring-cyan-300/50';
    return 'border-cyan-200 border border-dashed';
  };

  // Learning style badge
  const getLearningStyleBadge = (learningStyle?: string) => {
    if (!learningStyle) return null;

    const styles: { [key: string]: { icon: React.ReactNode; color: string; label: string } } = {
      visual: { icon: <Eye className="w-3 h-3" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', label: 'V' },
      auditory: { icon: <Ear className="w-3 h-3" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', label: 'A' },
      reading_writing: { icon: <BookOpen className="w-3 h-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/40', label: 'R' },
      kinesthetic: { icon: <Hand className="w-3 h-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', label: 'K' },
      multimodal: { icon: <Sparkles className="w-3 h-3" />, color: 'bg-pink-500/20 text-pink-400 border-pink-500/40', label: 'M' },
    };

    const style = styles[learningStyle];
    if (!style) return null;

    const tooltipText = {
      visual: 'Visual Learner',
      auditory: 'Auditory Learner',
      reading_writing: 'Reading/Writing Learner',
      kinesthetic: 'Kinesthetic Learner',
      multimodal: 'Multimodal Learner',
    }[learningStyle] || learningStyle;

    return (
      <span 
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${style.color}`}
        title={tooltipText}
      >
        {style.icon}
        <span>{style.label}</span>
      </span>
    );
  };

  // Sort members
  const sortedMembers = useMemo(() => {
    const members = [...new Set(matrixData.map(cell => cell.member))];
    
    switch (sortBy) {
      case 'skill-gaps':
        return members.sort((a, b) => {
          const aGaps = matrixData.filter(cell => cell.member.id === a.id && cell.gap > 0).length;
          const bGaps = matrixData.filter(cell => cell.member.id === b.id && cell.gap > 0).length;
          return bGaps - aGaps;
        });
      case 'interest':
        return members.sort((a, b) => {
          const aInterest = matrixData.filter(cell => cell.member.id === a.id).reduce((sum, cell) => sum + cell.interestLevel, 0);
          const bInterest = matrixData.filter(cell => cell.member.id === b.id).reduce((sum, cell) => sum + cell.interestLevel, 0);
          return bInterest - aInterest;
        });
      default:
        return members.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [matrixData, sortBy]);

  // Get unique skills for columns
  const uniqueSkills = useMemo(() => {
    return [...new Set(matrixData.map(cell => cell.skill))];
  }, [matrixData]);

  const StatCard: React.FC<{ title: string; value: string | number; trend?: string; icon?: React.ReactNode }> = ({ 
    title, value, trend, icon 
  }) => (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-card-foreground">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground/70">{trend}</p>
            )}
          </div>
          {icon && <div className="text-blue-500">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );

  if (viewMode === 'table') {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {skillCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {[...new Set(teamMembers.map(m => m.department))].map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="skill-gaps">Skill Gaps</SelectItem>
              <SelectItem value="interest">Interest Level</SelectItem>
            </SelectContent>
          </Select>

          <Toggle pressed={showInterestLevels} onPressedChange={setShowInterestLevels}>
            <Eye className="w-4 h-4 mr-2" />
            Show Interest Levels
          </Toggle>

          <Button 
            variant="outline" 
            onClick={() => setViewMode('heatmap')}
            size="sm"
          >
            Switch to Heatmap
          </Button>
        </div>

        {/* Table View */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Skills Matrix Table
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="sticky left-0 z-20 bg-gray-800 text-left p-4 text-muted-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] min-w-[220px]">Member</th>
                    {uniqueSkills.map(skill => (
                      <th key={skill.id} className="text-center p-3 text-muted-foreground min-w-[140px]">
                        <div className="text-xs font-medium leading-tight h-12 flex items-center justify-center px-2" title={`${skill.description} (Required: ${skill.requiredLevel}/5)`}>
                          <span className="line-clamp-2">{skill.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1">Req: {skill.requiredLevel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map(member => (
                    <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="sticky left-0 z-10 bg-gray-800 p-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] min-w-[200px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-card-foreground font-medium text-sm">{member.name}</span>
                              {getLearningStyleBadge(member.learningStyle)}
                            </div>
                            <div className="text-muted-foreground text-xs">{member.role}</div>
                          </div>
                        </div>
                      </td>
                      {uniqueSkills.map(skill => {
                        const cell = matrixData.find(c => c.member.id === member.id && c.skill.id === skill.id);
                        if (!cell) return <td key={`${member.id}-${skill.id}`} className="p-2" />;

                        return (
                      <td key={`${member.id}-${skill.id}`} className="p-3">
                        <div className="flex justify-center">
                          <div 
                            onClick={() => handleCellClick(cell)}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-base font-bold shadow-md transition-all hover:scale-110 cursor-pointer relative group ${getSkillLevelColor(cell.assessment?.currentLevel || 0)} ${getInterestIndicator(cell.interestLevel)}`}
                            title={`Click to edit\n${skill.name}\nCurrent: ${cell.assessment?.currentLevel || 0}/5\nRequired: ${skill.requiredLevel}/5\nGap: ${cell.gap}${showInterestLevels ? `\nInterest: ${cell.interestLevel}/5` : ''}`}
                          >
                            {cell.assessment?.currentLevel || 0}
                            <Edit className="w-3 h-3 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            title="Avg Skill Level" 
            value={stats.avgSkillLevel} 
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard 
            title="Critical Gaps" 
            value={stats.criticalGaps} 
            trend="down"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <StatCard 
            title="High Interest Areas" 
            value={stats.highInterestCount}
            icon={<Target className="w-5 h-5" />}
          />
          <StatCard 
            title="Development Priority" 
            value={stats.priorityScore}
            icon={<CheckCircle className="w-5 h-5" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {skillCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {[...new Set(teamMembers.map(m => m.department))].map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="skill-gaps">Skill Gaps</SelectItem>
            <SelectItem value="interest">Interest Level</SelectItem>
          </SelectContent>
        </Select>

        <Toggle pressed={showInterestLevels} onPressedChange={setShowInterestLevels}>
          <Eye className="w-4 h-4 mr-2" />
          Show Interest Levels
        </Toggle>

        <Button 
          variant="outline" 
          onClick={() => setViewMode('table')}
          size="sm"
        >
          Switch to Table
        </Button>
      </div>

      {/* Heatmap Grid */}
      <Card className="bg-gray-50 border-gray-300 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between" style={{ color: '#000000', fontWeight: '700' }}>
            Skills Matrix Heatmap
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900 font-semibold">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
            Color indicates skill level (1-5), border indicates interest level. Hover over cells for details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter Badges */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-900 font-bold">Filter by Category:</span>
              {selectedCategory !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory('all')}
                  className="h-6 text-xs"
                >
                  Clear Filter
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => setSelectedCategory('all')}
              >
                All ({uniqueSkills.length})
              </Badge>
              {skillCategories.map(cat => {
                const categorySkillCount = cat.skills.length;
                return (
                  <Badge 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name} ({categorySkillCount})
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-visible">
            <div className="inline-block min-w-full">
              {/* Skill headers */}
              <div className="grid grid-cols-1 gap-3 mb-6" style={{ gridTemplateColumns: `250px repeat(${uniqueSkills.length}, 120px)` }}>
                <div className="font-medium text-muted-foreground sticky left-0 bg-card z-10 pr-4">Team Member</div>
                {uniqueSkills.map(skill => (
                  <div key={skill.id} className="text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1 h-12 flex items-center justify-center px-1" title={`${skill.description} - Required: ${skill.requiredLevel}/5`}>
                      <span className="line-clamp-2">{skill.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground/70 font-semibold">Req: {skill.requiredLevel}</div>
                  </div>
                ))}
              </div>

              {/* Member rows */}
              {sortedMembers.map(member => (
                <div 
                  key={member.id} 
                  className="grid grid-cols-1 gap-3 mb-3 hover:bg-gray-700/30 rounded-lg p-3 cursor-pointer transition-colors"
                  style={{ gridTemplateColumns: `250px repeat(${uniqueSkills.length}, 120px)` }}
                  onClick={() => onSelectMember(member)}
                >
                  <div className="flex items-center gap-2 sticky left-0 bg-card z-10 pr-4 -ml-3 pl-3">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-card-foreground font-medium text-sm">{member.name}</span>
                        {getLearningStyleBadge(member.learningStyle)}
                      </div>
                      <div className="text-muted-foreground text-xs">{member.role}</div>
                    </div>
                  </div>
                  {uniqueSkills.map(skill => {
                    const cell = matrixData.find(c => c.member.id === member.id && c.skill.id === skill.id);
                    if (!cell) return <div key={`${member.id}-${skill.id}`} />;

                    return (
                      <div key={`${member.id}-${skill.id}`} className="flex justify-center">
                        <div className="relative">
                          {/* Main skill level box */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              handleCellClick(cell);
                            }}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer relative group ${getSkillLevelColor(cell.assessment?.currentLevel || 0)} ${getInterestIndicator(cell.interestLevel)}`}
                            title={`Click to edit\n${skill.name} - Current: ${cell.assessment?.currentLevel || 0}/5, Required: ${skill.requiredLevel}/5, Gap: ${cell.gap}${showInterestLevels ? `, Interest: ${cell.interestLevel}/5` : ''}`}
                          >
                            {cell.assessment?.currentLevel || 0}
                            <Edit className="w-3 h-3 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          {/* Interest level bar chart */}
                          {showInterestLevels && cell.interestLevel > 0 && (
                            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-400 transition-all duration-300"
                                style={{ width: `${(cell.interestLevel / 5) * 100}%` }}
                                title={`Interest Level: ${cell.interestLevel}/5`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend - Enhanced with descriptions */}
          <div className="mt-6 p-4 bg-gray-200 rounded-lg border border-gray-400">
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#000000' }}>Color Guide</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs mb-2 font-medium" style={{ color: '#000000' }}>Skill Levels (1-5):</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-800 border border-gray-600"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>0 - No Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>1 - Beginner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-400"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>2 - Basic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-amber-500"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>3 - Competent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>4 - Proficient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-400"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>5 - Expert</span>
                  </div>
                </div>
              </div>
              {showInterestLevels && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#000000' }}>Interest Level:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded border-2 border-cyan-500 ring-2 ring-cyan-500/50"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>High (4-5)</span>
                    <div className="w-4 h-4 rounded border-2 border-cyan-400 ring-2 ring-cyan-400/50"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>Medium (3)</span>
                    <div className="w-4 h-4 rounded border border-cyan-300"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>Low (2)</span>
                    <div className="w-4 h-4 rounded border border-dashed border-cyan-200"></div>
                    <span className="text-xs" style={{ color: '#000000' }}>Minimal (1)</span>
                  </div>
                </div>
              )}
              {showInterestLevels && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#000000' }}>Interest Bar:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-cyan-400"></div>
                    </div>
                    <span className="text-xs" style={{ color: '#000000' }}>Full interest</span>
                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-3/5 h-full bg-cyan-400"></div>
                    </div>
                    <span className="text-xs" style={{ color: '#000000' }}>3/5 interest</span>
                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-1/5 h-full bg-cyan-400"></div>
                    </div>
                    <span className="text-xs" style={{ color: '#000000' }}>1/5 interest</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Avg Skill Level" 
          value={stats.avgSkillLevel} 
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard 
          title="Critical Gaps" 
          value={stats.criticalGaps} 
          trend="down"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard 
          title="High Interest Areas" 
          value={stats.highInterestCount}
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard 
          title="Development Priority" 
          value={stats.priorityScore}
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Admin Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Skill Score
            </DialogTitle>
            <DialogDescription>
              Adjust the skill level for benchmarking and scaling purposes.
              Changes will be saved to the database.
            </DialogDescription>
          </DialogHeader>

          {editingCell && (
            <div className="space-y-4 py-4">
              {/* Member & Skill Info */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Team Member:</span>
                  <span className="text-sm">{editingCell.member.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Skill:</span>
                  <span className="text-sm">{editingCell.skill.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Current Level:</span>
                  <span className="text-sm">{editingCell.assessment?.currentLevel || 0}/5</span>
                </div>
              </div>

              {/* New Level Input */}
              <div className="space-y-2">
                <Label htmlFor="newLevel">New Skill Level (0-5)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="newLevel"
                    type="number"
                    min="0"
                    max="5"
                    value={newLevel}
                    onChange={(e) => setNewLevel(Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-24 text-lg font-bold text-center"
                  />
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        variant={newLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewLevel(level)}
                        className="w-10"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="editNotes">Notes (Optional)</Label>
                <Textarea
                  id="editNotes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add context for this adjustment (e.g., external certification, recent project work)"
                  rows={3}
                />
              </div>

              {/* Visual Preview */}
              <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-100 font-medium mb-2">Preview:</p>
                  <div 
                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg ${getSkillLevelColor(newLevel)}`}
                  >
                    {newLevel}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillsMatrix;
