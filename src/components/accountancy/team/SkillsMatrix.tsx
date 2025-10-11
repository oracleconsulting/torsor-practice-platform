import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Download, 
  Eye, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Target,
  ChevronDown
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showInterestLevels, setShowInterestLevels] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'heatmap' | 'table'>('heatmap');

  // Filter and prepare data
  const matrixData = useMemo(() => {
    const filteredMembers = teamMembers.filter(member => {
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
                          <div>
                            <div className="text-card-foreground font-medium text-sm">{member.name}</div>
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
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-base font-bold shadow-md transition-transform hover:scale-110 ${getSkillLevelColor(cell.assessment?.currentLevel || 0)} ${getInterestIndicator(cell.interestLevel)}`}
                            title={`${skill.name}\nCurrent: ${cell.assessment?.currentLevel || 0}/5\nRequired: ${skill.requiredLevel}/5\nGap: ${cell.gap}${showInterestLevels ? `\nInterest: ${cell.interestLevel}/5` : ''}`}
                          >
                            {cell.assessment?.currentLevel || 0}
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
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Skills Matrix Heatmap
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Color indicates skill level (1-5), border indicates interest level. Hover over cells for details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter Badges */}
          <div className="mb-4 p-3 bg-gray-700/20 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-300">Filter by Category:</span>
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
                    <div>
                      <div className="text-card-foreground font-medium text-sm">{member.name}</div>
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
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110 ${getSkillLevelColor(cell.assessment?.currentLevel || 0)} ${getInterestIndicator(cell.interestLevel)}`}
                            title={`${skill.name} - Current: ${cell.assessment?.currentLevel || 0}/5, Required: ${skill.requiredLevel}/5, Gap: ${cell.gap}${showInterestLevels ? `, Interest: ${cell.interestLevel}/5` : ''}`}
                          >
                            {cell.assessment?.currentLevel || 0}
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
          <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <h4 className="text-sm font-semibold text-white mb-3">Color Guide</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Skill Levels (1-5):</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-800 border border-gray-600"></div>
                    <span className="text-xs text-gray-300">0 - No Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500"></div>
                    <span className="text-xs text-gray-300">1 - Beginner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-400"></div>
                    <span className="text-xs text-gray-300">2 - Basic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-amber-500"></div>
                    <span className="text-xs text-gray-300">3 - Competent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500"></div>
                    <span className="text-xs text-gray-300">4 - Proficient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-400"></div>
                    <span className="text-xs text-gray-300">5 - Expert</span>
                  </div>
                </div>
              </div>
              {showInterestLevels && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Interest Level:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded border-2 border-cyan-500 ring-2 ring-cyan-500/50"></div>
                    <span className="text-xs text-muted-foreground/70">High (4-5)</span>
                    <div className="w-4 h-4 rounded border-2 border-cyan-400 ring-2 ring-cyan-400/50"></div>
                    <span className="text-xs text-muted-foreground/70">Medium (3)</span>
                    <div className="w-4 h-4 rounded border border-cyan-300"></div>
                    <span className="text-xs text-muted-foreground/70">Low (2)</span>
                    <div className="w-4 h-4 rounded border border-dashed border-cyan-200"></div>
                    <span className="text-xs text-muted-foreground/70">Minimal (1)</span>
                  </div>
                </div>
              )}
              {showInterestLevels && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Interest Bar:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-cyan-400"></div>
                    </div>
                    <span className="text-xs text-muted-foreground/70">Full interest</span>
                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-3/5 h-full bg-cyan-400"></div>
                    </div>
                    <span className="text-xs text-muted-foreground/70">3/5 interest</span>
                    <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-1/5 h-full bg-cyan-400"></div>
                    </div>
                    <span className="text-xs text-muted-foreground/70">1/5 interest</span>
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
    </div>
  );
};

export default SkillsMatrix;
