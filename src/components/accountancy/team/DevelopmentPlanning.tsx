import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Target,
  BookOpen,
  Plus,
  Edit2,
  Lightbulb,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface DevelopmentPlan {
  id: string;
  memberId: string;
  skillId: string;
  targetLevel: number;
  targetDate: Date;
  trainingMethod: string;
  status: 'planned' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  priority: number;
  budget?: number;
  notes?: string;
  milestones?: DevelopmentMilestone[];
  createdAt: Date;
  completedAt?: Date;
}

interface DevelopmentMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

interface TrainingRecommendation {
  skillId: string;
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  trainingType: string;
  provider: string;
  duration: string;
  cost?: number;
  description: string;
  learningPath: string[];
}

interface DevelopmentPlanningProps {
  member: TeamMember | null;
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
  autoRecommendations: boolean;
}

const DevelopmentPlanning: React.FC<DevelopmentPlanningProps> = ({
  member,
  teamMembers,
  skillCategories,
  autoRecommendations
}) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(member);
  const [developmentPlans, setDevelopmentPlans] = useState<DevelopmentPlan[]>([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DevelopmentPlan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    skillId: '',
    targetLevel: 3,
    targetDate: new Date(),
    trainingMethod: '',
    priority: 3,
    budget: 0,
    notes: ''
  });

  // Generate automatic recommendations
  const recommendations = useMemo((): TrainingRecommendation[] => {
    if (!selectedMember || !autoRecommendations) return [];

    const recommendations: TrainingRecommendation[] = [];
    
    selectedMember.skills.forEach(skill => {
      const skillInfo = skillCategories
        .flatMap(cat => cat.skills)
        .find(s => s.id === skill.skillId);

      if (skillInfo && skill.currentLevel < skill.targetLevel) {
        const gap = skill.targetLevel - skill.currentLevel;
        const priority = gap >= 2 ? 'high' : gap === 1 ? 'medium' : 'low';
        
        // Determine training method based on skill category and gap
        let trainingMethod = 'Workshop';
        let provider = 'Internal Training';
        let duration = '1 day';
        let cost = 500;

        if (skillInfo.category === 'Technical Accounting & Audit') {
          if (gap >= 2) {
            trainingMethod = 'Intensive Course';
            provider = 'Professional Body';
            duration = '5 days';
            cost = 2500;
          } else {
            trainingMethod = 'Specialized Workshop';
            provider = 'Industry Expert';
            duration = '2 days';
            cost = 1200;
          }
        } else if (skillInfo.category === 'Digital & Technology') {
          trainingMethod = 'Online Certification';
          provider = 'Technology Provider';
          duration = '4 weeks';
          cost = 800;
        } else if (skillInfo.category === 'Leadership & Management') {
          trainingMethod = 'Executive Coaching';
          provider = 'Leadership Institute';
          duration = '6 months';
          cost = 5000;
        }

        recommendations.push({
          skillId: skill.skillId,
          skillName: skillInfo.name,
          priority,
          trainingType: trainingMethod,
          provider,
          duration,
          cost,
          description: `Develop ${skillInfo.name} from level ${skill.currentLevel} to ${skill.targetLevel}`,
          learningPath: [
            'Assess current knowledge',
            'Complete foundational training',
            'Apply skills in practice',
            'Seek feedback and coaching',
            'Demonstrate competency'
          ]
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [selectedMember, skillCategories, autoRecommendations]);

  // Get skills with gaps for selected member
  const skillsWithGaps = useMemo(() => {
    if (!selectedMember) return [];

    return selectedMember.skills
      .filter(skill => skill.currentLevel < skill.targetLevel)
      .map(skill => {
        const skillInfo = skillCategories
          .flatMap(cat => cat.skills)
          .find(s => s.id === skill.skillId);
        
        return {
          ...skill,
          skillInfo,
          gap: skill.targetLevel - skill.currentLevel
        };
      })
      .filter(item => item.skillInfo)
      .sort((a, b) => b.gap - a.gap);
  }, [selectedMember, skillCategories]);

  const createDevelopmentPlan = () => {
    if (!selectedMember || !planFormData.skillId) return;

    const newPlan: DevelopmentPlan = {
      id: `plan-${Date.now()}`,
      memberId: selectedMember.id,
      skillId: planFormData.skillId,
      targetLevel: planFormData.targetLevel,
      targetDate: planFormData.targetDate,
      trainingMethod: planFormData.trainingMethod,
      status: 'planned',
      priority: planFormData.priority,
      budget: planFormData.budget,
      notes: planFormData.notes,
      milestones: [],
      createdAt: new Date()
    };

    setDevelopmentPlans(prev => [...prev, newPlan]);
    setShowCreatePlan(false);
    setPlanFormData({
      skillId: '',
      targetLevel: 3,
      targetDate: new Date(),
      trainingMethod: '',
      priority: 3,
      budget: 0,
      notes: ''
    });
  };

  const updatePlanStatus = (planId: string, status: DevelopmentPlan['status']) => {
    setDevelopmentPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, status, completedAt: status === 'completed' ? new Date() : undefined }
        : plan
    ));
  };

  const getStatusColor = (status: DevelopmentPlan['status']) => {
    const colors = {
      planned: 'bg-blue-900 text-blue-300 border-blue-700',
      in_progress: 'bg-yellow-900 text-yellow-300 border-yellow-700',
      completed: 'bg-green-900 text-green-300 border-green-700',
      paused: 'bg-gray-900 text-white font-medium border-gray-700',
      cancelled: 'bg-red-900 text-red-300 border-red-700'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-400';
    if (priority >= 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getMemberPlans = () => {
    if (!selectedMember) return [];
    return developmentPlans.filter(plan => plan.memberId === selectedMember.id);
  };

  const calculateProgress = (plan: DevelopmentPlan) => {
    if (!plan.milestones || plan.milestones.length === 0) return 0;
    const completed = plan.milestones.filter(m => m.completed).length;
    return Math.round((completed / plan.milestones.length) * 100);
  };

  if (!selectedMember) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-gray-100 font-medium mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Select a Team Member</h3>
          <p className="text-white mb-6">Choose a team member to create development plans</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {teamMembers.map(member => (
              <div 
                key={member.id}
                className="p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-sm text-white">{member.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {selectedMember.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-white">{selectedMember.name}</CardTitle>
                <CardDescription>{selectedMember.role} • {selectedMember.department}</CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowCreatePlan(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Auto Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI-Powered Recommendations
            </CardTitle>
            <CardDescription>
              Based on skill gaps and interest levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{rec.skillName}</h4>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' : 
                          rec.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-white mb-3">{rec.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-white font-semibold">Method:</span>
                          <p className="text-white">{rec.trainingType}</p>
                        </div>
                        <div>
                          <span className="text-white font-semibold">Provider:</span>
                          <p className="text-white">{rec.provider}</p>
                        </div>
                        <div>
                          <span className="text-white font-semibold">Duration:</span>
                          <p className="text-white">{rec.duration}</p>
                        </div>
                        <div>
                          <span className="text-white font-semibold">Cost:</span>
                          <p className="text-white">£{rec.cost}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Plan
                    </Button>
                  </div>
                  
                  {/* Learning Path */}
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <h5 className="text-sm font-medium text-white mb-2">Learning Path:</h5>
                    <div className="flex flex-wrap gap-2">
                      {rec.learningPath.map((step, stepIndex) => (
                        <Badge key={stepIndex} variant="outline" className="text-xs">
                          {stepIndex + 1}. {step}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills with Gaps */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Skills Requiring Development
          </CardTitle>
          <CardDescription>
            Skills where current level is below target level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillsWithGaps.map((skill, index) => (
              <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{skill.skillInfo?.name}</h4>
                      <Badge variant="outline">{skill.skillInfo?.category}</Badge>
                    </div>
                    <p className="text-sm text-white mb-3">{skill.skillInfo?.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-white font-semibold">Current:</span>
                        <span className="text-white ml-1">{skill.currentLevel}/5</span>
                      </div>
                      <div>
                        <span className="text-white font-semibold">Target:</span>
                        <span className="text-white ml-1">{skill.targetLevel}/5</span>
                      </div>
                      <div>
                        <span className="text-white font-semibold">Gap:</span>
                        <span className="text-yellow-400 ml-1">{skill.gap}</span>
                      </div>
                      <div>
                        <span className="text-white font-semibold">Interest:</span>
                        <span className="text-blue-400 ml-1">{skill.interestLevel || 0}/5</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm">
                    <Target className="w-4 h-4 mr-2" />
                    Plan Development
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Plans */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Development Plans
          </CardTitle>
          <CardDescription>
            Active and planned development activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getMemberPlans().map(plan => {
              const skillInfo = skillCategories
                .flatMap(cat => cat.skills)
                .find(s => s.id === plan.skillId);
              
              const progress = calculateProgress(plan);
              
              return (
                <div key={plan.id} className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{skillInfo?.name}</h4>
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(plan.priority)}>
                          Priority {plan.priority}/5
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-white font-semibold">Target Level:</span>
                          <p className="text-white">{plan.targetLevel}/5</p>
                        </div>
                        <div>
                          <span className="text-white font-semibold">Method:</span>
                          <p className="text-white">{plan.trainingMethod}</p>
                        </div>
                        <div>
                          <span className="text-white font-semibold">Target Date:</span>
                          <p className="text-white">{format(plan.targetDate, 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-white font-semibold">Budget:</span>
                          <p className="text-white">£{plan.budget || 0}</p>
                        </div>
                      </div>
                      
                      {plan.notes && (
                        <p className="text-sm text-white font-medium mb-3">{plan.notes}</p>
                      )}
                      
                      {/* Progress Bar */}
                      {plan.milestones && plan.milestones.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-white font-medium">Progress</span>
                            <span className="text-white">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingPlan(plan)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Select value={plan.status} onValueChange={(status) => updatePlanStatus(plan.id, status as DevelopmentPlan['status'])}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {getMemberPlans().length === 0 && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-100 font-medium mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Development Plans</h3>
                <p className="text-white font-medium mb-4">Create a development plan to start building skills</p>
                <Button onClick={() => setShowCreatePlan(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Plan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      {showCreatePlan && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Create Development Plan</CardTitle>
            <CardDescription>Define a structured approach to skill development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="skill">Skill to Develop</Label>
              <Select value={planFormData.skillId} onValueChange={(value) => setPlanFormData(prev => ({ ...prev, skillId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skillsWithGaps.map((skill, index) => (
                    <SelectItem key={index} value={skill.skillId}>
                      {skill.skillInfo?.name} (Current: {skill.currentLevel}/5 → Target: {skill.targetLevel}/5)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetLevel">Target Level</Label>
                <Select value={planFormData.targetLevel.toString()} onValueChange={(value) => setPlanFormData(prev => ({ ...prev, targetLevel: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={planFormData.priority.toString()} onValueChange={(value) => setPlanFormData(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(priority => (
                      <SelectItem key={priority} value={priority.toString()}>
                        Priority {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !planFormData.targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {planFormData.targetDate ? format(planFormData.targetDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={planFormData.targetDate}
                    onSelect={(date) => date && setPlanFormData(prev => ({ ...prev, targetDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="trainingMethod">Training Method</Label>
              <Select value={planFormData.trainingMethod} onValueChange={(value) => setPlanFormData(prev => ({ ...prev, trainingMethod: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal_training">Internal Training</SelectItem>
                  <SelectItem value="external_course">External Course</SelectItem>
                  <SelectItem value="online_learning">Online Learning</SelectItem>
                  <SelectItem value="mentoring">Mentoring</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">Budget (£)</Label>
              <Input
                id="budget"
                type="number"
                value={planFormData.budget}
                onChange={(e) => setPlanFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={planFormData.notes}
                onChange={(e) => setPlanFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional details about the development plan..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreatePlan(false)}>
              Cancel
            </Button>
            <Button onClick={createDevelopmentPlan}>
              Create Plan
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{getMemberPlans().length}</div>
            <div className="text-sm text-white font-medium">Total Plans</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {getMemberPlans().filter(p => p.status === 'in_progress').length}
            </div>
            <div className="text-sm text-white font-medium">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {getMemberPlans().filter(p => p.status === 'completed').length}
            </div>
            <div className="text-sm text-white font-medium">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              £{getMemberPlans().reduce((sum, plan) => sum + (plan.budget || 0), 0)}
            </div>
            <div className="text-sm text-white font-medium">Total Budget</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevelopmentPlanning;
