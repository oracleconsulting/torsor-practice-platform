import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  GraduationCap, 
  Clock, 
  TrendingUp, 
  Award, 
  AlertCircle,
  Plus,
  Calendar as CalendarIcon,
  FileText,
  Download,
  Upload,
  Target,
  Users,
  BarChart,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CPDActivity {
  id: string;
  title: string;
  type: 'course' | 'seminar' | 'webinar' | 'reading' | 'other';
  provider: string;
  date: Date;
  hours: number;
  verifiable: boolean;
  category: string;
  description: string;
  certificate?: string;
  status: 'planned' | 'completed' | 'in-progress';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  requiredHours: number;
  completedHours: number;
  verifiableHours: number;
  lastActivity?: Date;
}

interface CPDRequirement {
  body: string;
  annualHours: number;
  verifiablePercentage: number;
  deadline: string;
}

const CPDTrackerPage: React.FC = () => {
  const [activities, setActivities] = useState<CPDActivity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state
  const [newActivity, setNewActivity] = useState<Partial<CPDActivity>>({
    type: 'course',
    verifiable: true,
    status: 'planned',
    date: new Date()
  });

  // Mock data - replace with API calls
  useEffect(() => {
    // Load team members
    setTeamMembers([
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'Senior Manager',
        requiredHours: 40,
        completedHours: 28,
        verifiableHours: 21,
        lastActivity: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'James Wilson',
        role: 'Accountant',
        requiredHours: 35,
        completedHours: 32,
        verifiableHours: 26,
        lastActivity: new Date('2024-01-20')
      },
      {
        id: '3',
        name: 'Emma Davis',
        role: 'Junior Accountant',
        requiredHours: 35,
        completedHours: 15,
        verifiableHours: 10,
        lastActivity: new Date('2024-01-10')
      }
    ]);

    // Load activities
    setActivities([
      {
        id: '1',
        title: 'Advanced Tax Planning Strategies',
        type: 'course',
        provider: 'ICAEW',
        date: new Date('2024-01-15'),
        hours: 6,
        verifiable: true,
        category: 'Taxation',
        description: 'Comprehensive course on advanced tax planning for high-net-worth individuals',
        status: 'completed'
      },
      {
        id: '2',
        title: 'Digital Transformation in Accounting',
        type: 'webinar',
        provider: 'ACCA',
        date: new Date('2024-02-01'),
        hours: 2,
        verifiable: true,
        category: 'Technology',
        description: 'Exploring the impact of AI and automation on accounting practices',
        status: 'planned'
      }
    ]);
  }, []);

  const requirements: CPDRequirement[] = [
    {
      body: 'ICAEW',
      annualHours: 40,
      verifiablePercentage: 60,
      deadline: '31 December'
    },
    {
      body: 'ACCA',
      annualHours: 35,
      verifiablePercentage: 50,
      deadline: '31 December'
    }
  ];

  const categories = [
    'Accounting & Reporting',
    'Audit & Assurance',
    'Business Advisory',
    'Ethics',
    'Leadership & Management',
    'Regulatory & Compliance',
    'Taxation',
    'Technology'
  ];

  const handleAddActivity = () => {
    if (newActivity.title && newActivity.hours) {
      const activity: CPDActivity = {
        id: Date.now().toString(),
        title: newActivity.title!,
        type: newActivity.type as CPDActivity['type'],
        provider: newActivity.provider || '',
        date: newActivity.date!,
        hours: newActivity.hours!,
        verifiable: newActivity.verifiable!,
        category: newActivity.category || '',
        description: newActivity.description || '',
        status: newActivity.status as CPDActivity['status']
      };
      
      setActivities([...activities, activity]);
      setNewActivity({
        type: 'course',
        verifiable: true,
        status: 'planned',
        date: new Date()
      });
      setShowAddActivity(false);
    }
  };

  const getTeamProgress = () => {
    const totalRequired = teamMembers.reduce((sum, member) => sum + member.requiredHours, 0);
    const totalCompleted = teamMembers.reduce((sum, member) => sum + member.completedHours, 0);
    return (totalCompleted / totalRequired) * 100;
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    const daysRemaining = Math.floor((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CPD Tracker</h1>
        <p className="text-gray-400">Track and manage continuing professional development across your team</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Progress</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(getTeamProgress())}%</div>
            <Progress value={getTeamProgress()} className="mt-2" />
            <p className="text-xs text-gray-400 mt-2">of annual requirements</p>
          </CardContent>
        </Card>

        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.reduce((sum, m) => sum + m.completedHours, 0)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {teamMembers.reduce((sum, m) => sum + m.verifiableHours, 0)} verifiable
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.completedHours >= m.requiredHours).length}/{teamMembers.length}
            </div>
            <p className="text-xs text-gray-400 mt-2">members compliant</p>
          </CardContent>
        </Card>

        <Card className="border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <CalendarIcon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUpcomingDeadlines()}</div>
            <p className="text-xs text-gray-400 mt-2">until year end</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* At-Risk Members Alert */}
          {teamMembers.some(m => m.completedHours < m.requiredHours * 0.7) && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Attention Required</AlertTitle>
              <AlertDescription>
                {teamMembers.filter(m => m.completedHours < m.requiredHours * 0.7).length} team members 
                are behind on their CPD requirements and need immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Team Member Progress */}
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Team Member Progress</CardTitle>
              <CardDescription>Individual CPD completion status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.map((member) => {
                const progress = (member.completedHours / member.requiredHours) * 100;
                const isAtRisk = progress < 70;
                
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {member.completedHours}/{member.requiredHours} hours
                        </p>
                        <p className="text-sm text-gray-400">
                          {member.verifiableHours} verifiable
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-2 ${isAtRisk ? 'bg-red-900' : ''}`}
                    />
                    {isAtRisk && (
                      <p className="text-xs text-yellow-500">
                        ⚠️ Behind schedule - needs {member.requiredHours - member.completedHours} more hours
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Activities */}
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Upcoming CPD Activities</CardTitle>
              <CardDescription>Scheduled training and development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities
                  .filter(a => a.status === 'planned' && a.date > new Date())
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 5)
                  .map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-400">
                          {activity.provider} • {formatDate(activity.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{activity.hours} hours</Badge>
                        <Badge variant={activity.verifiable ? "default" : "secondary"}>
                          {activity.verifiable ? 'Verifiable' : 'Non-verifiable'}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setShowAddActivity(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>

          {/* Add Activity Form */}
          {showAddActivity && (
            <Card className="border-gray-700 mb-6">
              <CardHeader>
                <CardTitle>Add CPD Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Activity Title</Label>
                    <Input
                      value={newActivity.title || ''}
                      onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                      placeholder="e.g., Tax Update Seminar"
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={newActivity.provider || ''}
                      onChange={(e) => setNewActivity({...newActivity, provider: e.target.value})}
                      placeholder="e.g., ICAEW"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select 
                      value={newActivity.type} 
                      onValueChange={(value) => setNewActivity({...newActivity, type: value as CPDActivity['type']})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={newActivity.category} 
                      onValueChange={(value) => setNewActivity({...newActivity, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      value={newActivity.hours || ''}
                      onChange={(e) => setNewActivity({...newActivity, hours: parseFloat(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newActivity.date?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setNewActivity({...newActivity, date: new Date(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newActivity.description || ''}
                    onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                    placeholder="Brief description of the activity..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newActivity.verifiable}
                      onChange={(e) => setNewActivity({...newActivity, verifiable: e.target.checked})}
                      className="rounded"
                    />
                    <span>Verifiable CPD</span>
                  </label>
                  <Select 
                    value={newActivity.status} 
                    onValueChange={(value) => setNewActivity({...newActivity, status: value as CPDActivity['status']})}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setShowAddActivity(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddActivity} className="bg-orange-500 hover:bg-orange-600">
                    Add Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activities List */}
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>CPD Activities Log</CardTitle>
              <CardDescription>Complete record of all CPD activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          <Badge variant={
                            activity.status === 'completed' ? 'default' : 
                            activity.status === 'in-progress' ? 'secondary' : 'outline'
                          }>
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          {activity.provider} • {activity.category} • {formatDate(activity.date)}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{activity.hours} hours</p>
                          <p className="text-sm text-gray-400">
                            {activity.verifiable ? 'Verifiable' : 'Non-verifiable'}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Team CPD Overview</CardTitle>
              <CardDescription>Monitor and manage team development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3">Team Member</th>
                      <th className="text-center py-3">Required</th>
                      <th className="text-center py-3">Completed</th>
                      <th className="text-center py-3">Verifiable</th>
                      <th className="text-center py-3">Progress</th>
                      <th className="text-center py-3">Status</th>
                      <th className="text-center py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => {
                      const progress = (member.completedHours / member.requiredHours) * 100;
                      const status = progress >= 100 ? 'compliant' : progress >= 70 ? 'on-track' : 'at-risk';
                      
                      return (
                        <tr key={member.id} className="border-b border-gray-800">
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-400">{member.role}</p>
                            </div>
                          </td>
                          <td className="text-center py-4">{member.requiredHours}</td>
                          <td className="text-center py-4">{member.completedHours}</td>
                          <td className="text-center py-4">{member.verifiableHours}</td>
                          <td className="py-4">
                            <div className="w-full max-w-[100px] mx-auto">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-center mt-1">{Math.round(progress)}%</p>
                            </div>
                          </td>
                          <td className="text-center py-4">
                            <Badge variant={
                              status === 'compliant' ? 'default' :
                              status === 'on-track' ? 'secondary' : 'destructive'
                            }>
                              {status}
                            </Badge>
                          </td>
                          <td className="text-center py-4">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Team Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle>CPD by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.slice(0, 5).map((category) => {
                    const categoryHours = activities
                      .filter(a => a.category === category && a.status === 'completed')
                      .reduce((sum, a) => sum + a.hours, 0);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{categoryHours} hrs</span>
                          <div className="w-24">
                            <Progress value={(categoryHours / 40) * 100} className="h-2" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-[200px]">
                  {[...Array(6)].map((_, i) => {
                    const height = Math.random() * 100 + 20;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div 
                          className="w-8 bg-orange-500 rounded-t"
                          style={{ height: `${height}px` }}
                        />
                        <span className="text-xs text-gray-400">
                          {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Professional Body Requirements</CardTitle>
              <CardDescription>CPD requirements by regulatory body</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {requirements.map((req) => (
                  <div key={req.body} className="border-b border-gray-800 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{req.body}</h3>
                        <p className="text-sm text-gray-400">Deadline: {req.deadline}</p>
                      </div>
                      <Award className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Annual Requirement</p>
                        <p className="text-2xl font-bold">{req.annualHours} hours</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Verifiable CPD</p>
                        <p className="text-2xl font-bold">{req.verifiablePercentage}%</p>
                        <p className="text-xs text-gray-500">minimum required</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">Members Affected</p>
                        <p className="text-2xl font-bold">
                          {teamMembers.filter(m => m.requiredHours === req.annualHours).length}
                        </p>
                        <p className="text-xs text-gray-500">team members</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Key Requirements:</h4>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• Maintain evidence of all CPD activities</li>
                        <li>• Complete annual declaration by deadline</li>
                        <li>• Ensure {req.verifiablePercentage}% is verifiable CPD</li>
                        <li>• Keep records for minimum 5 years</li>
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Recommended Courses</CardTitle>
              <CardDescription>Tailored CPD opportunities based on team needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Making Tax Digital Advanced Workshop</h4>
                      <p className="text-sm text-gray-400">ICAEW • 8 hours • Verifiable</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Essential training for the upcoming MTD changes. Perfect for team members 
                    working with VAT-registered clients.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        15 Feb 2024
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        3 team members need this
                      </span>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Book Now
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">ESG Reporting Fundamentals</h4>
                      <p className="text-sm text-gray-400">ACCA • 6 hours • Verifiable</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">New Topic</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Stay ahead with sustainability reporting. Growing client demand for ESG 
                    advisory services makes this essential learning.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        22 Feb 2024
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        High demand topic
                      </span>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Book Now
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">AI in Audit: Practical Applications</h4>
                      <p className="text-sm text-gray-400">Online • 4 hours • Verifiable</p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400">Technology</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Learn how to leverage AI tools in audit processes. Includes hands-on 
                    exercises with popular audit software.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        Self-paced
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Whole team benefit
                      </span>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Enroll Team
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Paths */}
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Suggested Learning Paths</CardTitle>
              <CardDescription>Structured development programs for career progression</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Advisory Excellence Path</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Transform from compliance to advisory professional
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Business Advisory Fundamentals</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-gray-500" />
                      <span>Financial Modeling & Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-gray-500" />
                      <span>Strategic Planning Workshop</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Path
                  </Button>
                </div>

                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Digital Transformation Path</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Master technology and automation tools
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-gray-500" />
                      <span>Cloud Accounting Mastery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-gray-500" />
                      <span>Data Analytics for Accountants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-gray-500" />
                      <span>Process Automation Tools</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Path
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CPDTrackerPage; 