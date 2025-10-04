import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function TeamDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Fetch team data on mount
  useEffect(() => {
    fetchTeamData();
  }, [user]);

  const fetchTeamData = async () => {
    if (!user?.email) return;

    try {
      // Get user's group_id
      const { data: userData } = await supabase
        .from('client_intake')
        .select('group_id')
        .eq('email', user.email)
        .maybeSingle();

      if (!userData?.group_id) {
        setLoading(false);
        return;
      }

      // Get all team members
      const { data: teamMembers } = await supabase
        .from('client_intake')
        .select('*')
        .eq('group_id', userData.group_id);

      // Get Part 2 data for team members using group_id instead of email
      const { data: part2Data } = await supabase
        .from('client_intake_part2')
        .select('*')
        .eq('group_id', userData.group_id);  // Use group_id instead of email

      // Get team roadmap if it exists
      const { data: teamRoadmap } = await supabase
        .from('team_roadmaps')
        .select('*')
        .eq('group_id', userData.group_id)
        .maybeSingle();

      setTeamData({
        groupId: userData.group_id,
        members: teamMembers?.map(member => ({
          ...member,
          part2: part2Data?.[0]  // Since there's only one Part 2 per group_id
        })),
        teamRoadmap
      });
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error loading team data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTeamRoadmap = async () => {
    try {
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/generate-team-roadmap`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'ZKSRzCoMHepQu79yshK2G3I5AnrCP2yGelRjmMBxQec'
        },
        body: JSON.stringify({
          group_id: teamData.groupId,
          team_members: teamData.members
        })
      });

      if (response.ok) {
        toast({ title: "Team roadmap generated successfully!" });
        fetchTeamData(); // Refresh to show new roadmap
      } else {
        throw new Error('Failed to generate roadmap');
      }
    } catch (error) {
      console.error('Error generating team roadmap:', error);
      toast({
        title: "Failed to generate team roadmap",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading team data...</div>
      </div>
    );
  }

  if (!teamData?.members || teamData.members.length <= 1) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Team Members Yet</h3>
            <p className="text-gray-600 mb-4">
              Invite partners or co-founders to build your team dashboard
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMemberData = selectedMember ? teamData.members.find((m: any) => m.email === selectedMember) : null;

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-oracle-navy">Team Dashboard</h1>
          <p className="text-gray-600">Align your team's vision and track collective progress</p>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          Personal Dashboard
        </Button>
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({teamData.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamData.members.map((member: any) => (
              <Card 
                key={member.email}
                className={`cursor-pointer transition-all ${
                  selectedMember === member.email ? 'ring-2 ring-oracle-gold' : ''
                }`}
                onClick={() => setSelectedMember(member.email)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-oracle-navy text-white flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{member.responses?.founder_name || member.email.split('@')[0]}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    {member.email === user?.email && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {/* Part 1 Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        {member.responses ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-orange-500" />
                        )}
                        Part 1
                      </span>
                      <span className={member.responses ? 'text-green-600' : 'text-orange-600'}>
                        {member.responses ? 'Complete' : 'In Progress'}
                      </span>
                    </div>
                    
                    {/* Part 2 Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        {member.part2 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        Part 2
                      </span>
                      <span className={member.part2 ? 'text-green-600' : 'text-gray-600'}>
                        {member.part2 ? 'Complete' : 'Not Started'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Member Details */}
      {selectedMemberData && (
        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="fit-message">Fit Message</TabsTrigger>
            <TabsTrigger value="roadmap">Individual Plan</TabsTrigger>
            <TabsTrigger value="alignment">Alignment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Responses - {selectedMemberData.responses?.founder_name || selectedMemberData.email.split('@')[0]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedMemberData.responses ? (
                    Object.entries(selectedMemberData.responses).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <p className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-gray-600">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No responses recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fit-message">
            <Card>
              <CardHeader>
                <CardTitle>Fit Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {selectedMemberData.fit_message || 'Fit assessment not yet generated'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roadmap">
            <Card>
              <CardHeader>
                <CardTitle>Individual Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Individual roadmap coming soon - complete Part 2 assessment to generate</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alignment">
            <Card>
              <CardHeader>
                <CardTitle>Team Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Goal alignment analysis will appear here once team roadmap is generated</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Team Roadmap Section */}
      <Card className="border-oracle-gold">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Unified Team Roadmap
            </span>
            {!teamData.teamRoadmap && (
              <Button onClick={generateTeamRoadmap} size="sm">
                Generate Team Roadmap
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamData.teamRoadmap ? (
            <div className="space-y-6">
              <div className="bg-oracle-cream/30 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Team Vision Alignment</h3>
                <p className="text-gray-700 mb-4">{teamData.teamRoadmap.vision_statement}</p>
                
                {teamData.teamRoadmap.goal_alignment && (
                  <div className="grid gap-4 md:grid-cols-2 mt-6">
                    {Object.entries(teamData.teamRoadmap.goal_alignment).map(([email, alignment]: [string, any]) => (
                      <div key={email} className="bg-white p-4 rounded-lg">
                        <h4 className="font-medium text-oracle-navy mb-2">{email.split('@')[0]}'s Goals</h4>
                        <p className="text-sm text-gray-600">{alignment.primary_goal}</p>
                        <p className="text-sm mt-2">
                          <strong>Roadmap Impact:</strong> {alignment.roadmap_impact}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Milestones that accommodate team goals */}
              {teamData.teamRoadmap.milestones && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Unified Milestones</h3>
                  <div className="space-y-3">
                    {teamData.teamRoadmap.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-oracle-gold mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Timeline: {milestone.timeline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Generate a unified roadmap that aligns all team members' goals</p>
              <p className="text-sm mt-2">
                The AI will analyse individual assessments and create a cohesive plan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
