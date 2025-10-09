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
  BookOpen,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAccountancy } from '@/contexts/AccountancyContext';
import {
  getCPDActivities,
  getTeamCPDSummary,
  getCPDRequirements,
  getCPDExternalResources,
  createCPDActivity,
  updateCPDActivity,
  type CPDActivity,
  type TeamCPDSummary,
  type CPDRequirement,
  type CPDExternalResource,
  type CPDActivityInput
} from '@/lib/api/cpd';

const CPDTrackerPage: React.FC = () => {
  const { practice, practiceMembers } = useAccountancy();
  
  const [activities, setActivities] = useState<CPDActivity[]>([]);
  const [teamSummary, setTeamSummary] = useState<TeamCPDSummary[]>([]);
  const [requirements, setRequirements] = useState<CPDRequirement[]>([]);
  const [externalResources, setExternalResources] = useState<CPDExternalResource[]>([]);
  
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newActivity, setNewActivity] = useState<Partial<CPDActivityInput>>({
    type: 'course',
    verifiable: true,
    status: 'planned',
    activity_date: new Date().toISOString().split('T')[0],
    currency: 'GBP'
  });

  // Load all CPD data
  useEffect(() => {
    async function loadCPDData() {
      if (!practice?.id) return;

      try {
        setLoading(true);
        setError(null);

        const [activitiesData, summaryData, requirementsData, resourcesData] = await Promise.all([
          getCPDActivities(practice.id),
          getTeamCPDSummary(practice.id),
          getCPDRequirements(),
          getCPDExternalResources()
        ]);

        setActivities(activitiesData);
        setTeamSummary(summaryData);
        setRequirements(requirementsData);
        setExternalResources(resourcesData);
      } catch (err) {
        console.error('Error loading CPD data:', err);
        setError('Failed to load CPD data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadCPDData();
  }, [practice?.id]);

  const categories = [
    'technical-accounting-audit',
    'taxation-advisory',
    'regulatory-compliance',
    'business-strategy-advisory',
    'digital-technology',
    'client-management',
    'leadership-people-management',
    'professional-ethics'
  ];

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.hours_claimed || !newActivity.practice_member_id) {
      return;
    }

    try {
      const activityData: CPDActivityInput = {
        practice_member_id: newActivity.practice_member_id!,
        title: newActivity.title!,
        type: newActivity.type as CPDActivity['type'],
        provider: newActivity.provider,
        activity_date: newActivity.activity_date!,
        hours_claimed: newActivity.hours_claimed!,
        cost: newActivity.cost,
        currency: newActivity.currency || 'GBP',
        category: newActivity.category,
        description: newActivity.description,
        learning_objectives: newActivity.learning_objectives,
        key_takeaways: newActivity.key_takeaways,
        external_link: newActivity.external_link,
        status: newActivity.status!,
        verifiable: newActivity.verifiable!
      };

      const created = await createCPDActivity(activityData);
      setActivities([created, ...activities]);
      
      // Refresh team summary
      if (practice?.id) {
        const summaryData = await getTeamCPDSummary(practice.id);
        setTeamSummary(summaryData);
      }

      setNewActivity({
        type: 'course',
        verifiable: true,
        status: 'planned',
        activity_date: new Date().toISOString().split('T')[0],
        currency: 'GBP'
      });
      setShowAddActivity(false);
    } catch (err) {
      console.error('Error creating CPD activity:', err);
      setError('Failed to create activity. Please try again.');
    }
  };

  const getTeamProgress = () => {
    if (teamSummary.length === 0) return 0;
    const totalRequired = teamSummary.reduce((sum, member) => sum + member.required_hours, 0);
    const totalCompleted = teamSummary.reduce((sum, member) => sum + member.completed_hours, 0);
    return totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    const daysRemaining = Math.floor((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

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
              {teamSummary.reduce((sum, m) => sum + m.completed_hours, 0)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {teamSummary.reduce((sum, m) => sum + m.verifiable_hours, 0)} verifiable
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
              {teamSummary.filter(m => m.completed_hours >= m.required_hours).length}/{teamSummary.length}
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
          {teamSummary.some(m => m.progress_percentage < 70) && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Attention Required</AlertTitle>
              <AlertDescription>
                {teamSummary.filter(m => m.progress_percentage < 70).length} team members 
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
              {teamSummary.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No team members found. Invite team members to get started.</p>
              ) : (
                teamSummary.map((member) => {
                  const progress = member.progress_percentage;
                  const isAtRisk = progress < 70;
                  
                  return (
                    <div key={member.member_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{member.member_name}</p>
                          <p className="text-sm text-gray-400">{member.member_role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {member.completed_hours}/{member.required_hours} hours
                          </p>
                          <p className="text-sm text-gray-400">
                            {member.verifiable_hours} verifiable
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-2 ${isAtRisk ? 'bg-red-900' : ''}`}
                      />
                      {isAtRisk && (
                        <p className="text-xs text-yellow-500">
                          ⚠️ Behind schedule - needs {Math.round(member.required_hours - member.completed_hours)} more hours
                        </p>
                      )}
                    </div>
                  );
                })
              )}
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
                {activities.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No activities found. Add CPD activities to track progress.</p>
                ) : (
                  activities
                    .filter(a => a.status === 'planned' && new Date(a.activity_date) > new Date())
                    .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime())
                    .slice(0, 5)
                    .map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-400">
                            {activity.provider || 'No provider'} • {formatDate(new Date(activity.activity_date))}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{activity.hours_claimed} hours</Badge>
                          <Badge variant={activity.verifiable ? "default" : "secondary"}>
                            {activity.verifiable ? 'Verifiable' : 'Non-verifiable'}
                          </Badge>
                        </div>
                      </div>
                    ))
                )}
                {activities.filter(a => a.status === 'planned' && new Date(a.activity_date) > new Date()).length === 0 && activities.length > 0 && (
                  <p className="text-center text-gray-400 py-4">No upcoming activities scheduled.</p>
                )}
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
                  {teamSummary.map((member) => (
                    <SelectItem key={member.member_id} value={member.member_id}>
                      {member.member_name}
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
                    <Label>Team Member *</Label>
                    <Select 
                      value={newActivity.practice_member_id} 
                      onValueChange={(value) => setNewActivity({...newActivity, practice_member_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamSummary.map((member) => (
                          <SelectItem key={member.member_id} value={member.member_id}>
                            {member.member_name} ({member.member_role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Activity Title *</Label>
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
                      placeholder="e.g., ACCA, ICAEW"
                    />
                  </div>
                  <div>
                    <Label>Type *</Label>
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
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="certification">Certification</SelectItem>
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
                    <Label>Hours *</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={newActivity.hours_claimed || ''}
                      onChange={(e) => setNewActivity({...newActivity, hours_claimed: parseFloat(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newActivity.activity_date || ''}
                      onChange={(e) => setNewActivity({...newActivity, activity_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Cost (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newActivity.cost || ''}
                      onChange={(e) => setNewActivity({...newActivity, cost: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>External Link (Optional)</Label>
                    <Input
                      value={newActivity.external_link || ''}
                      onChange={(e) => setNewActivity({...newActivity, external_link: e.target.value})}
                      placeholder="https://example.com/course"
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
                {activities.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No activities found. Add your first CPD activity above.</p>
                ) : (
                  activities
                    .filter(a => selectedMember === 'all' || a.practice_member_id === selectedMember)
                    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
                    .map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium">{activity.title}</h4>
                            <Badge variant={
                              activity.status === 'completed' ? 'default' : 
                              activity.status === 'in_progress' ? 'secondary' : 'outline'
                            }>
                              {activity.status.replace('_', ' ')}
                            </Badge>
                            {activity.external_link && (
                              <a 
                                href={activity.external_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-orange-500 hover:text-orange-400 text-xs flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" />
                                Link
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {activity.practice_member?.name || 'Unknown'} • {activity.provider || 'No provider'} • {activity.category || 'Uncategorized'} • {formatDate(new Date(activity.activity_date))}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                          )}
                          {activity.cost && (
                            <p className="text-xs text-gray-500 mt-1">Cost: £{activity.cost.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{activity.hours_claimed} hours</p>
                            {activity.hours_verified && activity.hours_verified !== activity.hours_claimed && (
                              <p className="text-xs text-green-400">{activity.hours_verified} verified</p>
                            )}
                            <p className="text-sm text-gray-400">
                              {activity.verifiable ? 'Verifiable' : 'Non-verifiable'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                )}
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
                    {teamSummary.map((member) => {
                      const progress = member.progress_percentage;
                      const status = progress >= 100 ? 'compliant' : progress >= 70 ? 'on-track' : 'at-risk';
                      
                      return (
                        <tr key={member.member_id} className="border-b border-gray-800">
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{member.member_name}</p>
                              <p className="text-sm text-gray-400">{member.member_role}</p>
                            </div>
                          </td>
                          <td className="text-center py-4">{member.required_hours}</td>
                          <td className="text-center py-4">{member.completed_hours}</td>
                          <td className="text-center py-4">{member.verifiable_hours}</td>
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedMember(member.member_id)}
                            >
                              View Activities
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
                {requirements.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No CPD requirements configured.</p>
                ) : (
                  requirements.map((req) => {
                    const verifiablePercentage = req.verifiable_hours_minimum > 0 
                      ? Math.round((req.verifiable_hours_minimum / req.annual_hours_required) * 100)
                      : 0;
                    
                    return (
                      <div key={req.id} className="border-b border-gray-800 pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold capitalize">{req.role}</h3>
                            <p className="text-sm text-gray-400">Deadline: 31 December (Year End)</p>
                            {req.description && (
                              <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                            )}
                          </div>
                          <Award className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">Annual Requirement</p>
                            <p className="text-2xl font-bold">{req.annual_hours_required} hours</p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">Verifiable CPD</p>
                            <p className="text-2xl font-bold">{req.verifiable_hours_minimum} hrs</p>
                            <p className="text-xs text-gray-500">({verifiablePercentage}% minimum)</p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">Members Affected</p>
                            <p className="text-2xl font-bold">
                              {teamSummary.filter(m => m.member_role?.toLowerCase() === req.role.toLowerCase()).length}
                            </p>
                            <p className="text-xs text-gray-500">team members</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Key Requirements:</h4>
                          <ul className="space-y-1 text-sm text-gray-400">
                            <li>• Maintain evidence of all CPD activities</li>
                            <li>• Complete annual declaration by deadline</li>
                            <li>• Ensure {req.verifiable_hours_minimum} hours is verifiable CPD</li>
                            <li>• Keep records for minimum 5 years</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>External CPD Resources</CardTitle>
              <CardDescription>Curated training and development opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {externalResources.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No external resources available yet.</p>
                ) : (
                  externalResources.slice(0, 10).map((resource) => (
                    <div key={resource.id} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{resource.title}</h4>
                          <p className="text-sm text-gray-400">
                            {resource.provider}
                            {resource.cpd_hours && ` • ${resource.cpd_hours} hours`}
                            {resource.accredited_by && ` • Accredited by ${resource.accredited_by}`}
                          </p>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-400 capitalize">
                          {resource.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-500 mb-3">{resource.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {resource.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {resource.duration}
                            </span>
                          )}
                          {resource.cost && resource.cost > 0 ? (
                            <span className="flex items-center gap-1">
                              £{resource.cost.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-green-400">Free</span>
                          )}
                          {resource.skill_categories && resource.skill_categories.length > 0 && (
                            <span className="text-xs">
                              {resource.skill_categories.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            View Resource
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))
                )}
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