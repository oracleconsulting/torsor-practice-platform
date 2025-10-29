import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Award, BookOpen, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DirectReport {
  id: string;
  name: string;
  email: string;
  role: string;
  skillsAssessed: number;
  averageLevel: number;
  cpdHours: number;
  recentActivity?: string;
}

interface DirectReportsPanelProps {
  managerId: string;
  practiceId: string;
}

export default function DirectReportsPanel({ managerId, practiceId }: DirectReportsPanelProps) {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DirectReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<DirectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    loadDirectReports();
  }, [managerId, practiceId]);

  useEffect(() => {
    if (selectedReportId) {
      const report = reports.find(r => r.id === selectedReportId);
      setSelectedReport(report || null);
      loadReportDetails(selectedReportId);
    }
  }, [selectedReportId, reports]);

  const loadDirectReports = async () => {
    try {
      setLoading(true);

      // Get all direct reports
      const { data: members, error } = await supabase
        .from('practice_members')
        .select('id, name, email, role')
        .eq('reports_to_id', managerId)
        .eq('practice_id', practiceId)
        .order('name');

      if (error) {
        console.error('[DirectReportsPanel] Error loading reports:', error);
        return;
      }

      if (!members || members.length === 0) {
        console.log('[DirectReportsPanel] No direct reports found');
        setReports([]);
        return;
      }

      // For each report, get their stats
      const reportsWithStats = await Promise.all(
        members.map(async (member) => {
          // Get assessment data from invitations
          const { data: invitation } = await supabase
            .from('invitations')
            .select('assessment_data')
            .ilike('email', member.email)
            .eq('practice_id', practiceId)
            .eq('status', 'accepted')
            .single();

          const assessments = invitation?.assessment_data as any[] || [];
          const avgLevel = assessments.length > 0
            ? assessments.reduce((sum, a) => sum + (a.current_level || 0), 0) / assessments.length
            : 0;

          // Get CPD data
          const { data: cpdData } = await supabase
            .from('cpd_activities')
            .select('hours_claimed')
            .eq('practice_member_id', member.id);

          const totalCpdHours = cpdData?.reduce((sum, cpd) => sum + (cpd.hours_claimed || 0), 0) || 0;

          return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            skillsAssessed: assessments.length,
            averageLevel: avgLevel,
            cpdHours: totalCpdHours,
            recentActivity: 'Active'
          };
        })
      );

      setReports(reportsWithStats);
      console.log('[DirectReportsPanel] Loaded reports:', reportsWithStats.length);
    } catch (error) {
      console.error('[DirectReportsPanel] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetails = async (reportId: string) => {
    try {
      const member = reports.find(r => r.id === reportId);
      if (!member) return;

      // Load their skills heatmap data
      const { data: invitation } = await supabase
        .from('invitations')
        .select('assessment_data')
        .ilike('email', member.email)
        .eq('practice_id', practiceId)
        .eq('status', 'accepted')
        .single();

      const assessments = invitation?.assessment_data as any[] || [];
      
      // Get skills metadata
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name, category');

      const skillsMap = Object.fromEntries(
        (skills || []).map(s => [s.id, { name: s.name, category: s.category }])
      );

      // Transform into heatmap format (grouped by level)
      const levelGroups = {
        1: [] as any[],
        2: [] as any[],
        3: [] as any[],
        4: [] as any[],
        5: [] as any[]
      };

      assessments.forEach(skill => {
        const skillInfo = skillsMap[skill.skill_id];
        if (skillInfo) {
          const level = skill.current_level || 1;
          levelGroups[level as keyof typeof levelGroups].push({
            id: skill.skill_id,
            name: skillInfo.name,
            category: skillInfo.category,
            level
          });
        }
      });

      setHeatmapData(Object.entries(levelGroups).map(([level, skills]) => ({
        level: parseInt(level),
        count: skills.length,
        skills
      })));
    } catch (error) {
      console.error('[DirectReportsPanel] Error loading report details:', error);
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-lime-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Basic';
      case 3: return 'Competent';
      case 4: return 'Proficient';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading direct reports...</div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return null; // Don't show panel if no reports
  }

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Users className="w-5 h-5 text-blue-600" />
          Your Direct Reports
        </CardTitle>
        <CardDescription className="text-gray-700 font-medium">
          Oversee team members' skills, CPD progress, and development
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Report Selector */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">
            Select Team Member:
          </label>
          <Select value={selectedReportId || ''} onValueChange={setSelectedReportId}>
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="Choose a team member to view" />
            </SelectTrigger>
            <SelectContent>
              {reports.map(report => (
                <SelectItem key={report.id} value={report.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{report.name}</span>
                    <span className="text-xs text-gray-500 ml-4">{report.role}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Report Overview */}
        {selectedReport && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">Skills Assessed</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{selectedReport.skillsAssessed}</div>
                <div className="text-xs text-gray-600">out of 111</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-gray-700">Average Level</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{selectedReport.averageLevel.toFixed(1)}</div>
                <div className="text-xs text-gray-600">out of 5.0</div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-700">CPD Hours</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{selectedReport.cpdHours}</div>
                <div className="text-xs text-gray-600">logged</div>
              </div>
            </div>

            {/* Compact Skills Heatmap */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills Overview</h4>
              <div className="grid grid-cols-5 gap-2">
                {heatmapData.map(levelGroup => (
                  <div key={levelGroup.level} className="text-center">
                    <div 
                      className={`h-16 ${getLevelColor(levelGroup.level)} rounded-lg flex items-center justify-center text-white font-bold text-2xl`}
                    >
                      {levelGroup.count}
                    </div>
                    <div className="text-xs font-medium text-gray-700 mt-1">
                      {getLevelLabel(levelGroup.level)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/team-member?viewAs=${selectedReport.id}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Full Dashboard
              </Button>
              
              <Button
                onClick={() => navigate(`/team-member/cpd-log?viewAs=${selectedReport.id}`)}
                variant="outline"
                className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Suggest CPD
              </Button>
              
              <Button
                onClick={() => navigate(`/team-member/mentoring?viewAs=${selectedReport.id}`)}
                variant="outline"
                className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Suggest Mentor
              </Button>
            </div>
          </div>
        )}

        {/* Team Summary (when no report selected) */}
        {!selectedReport && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Team Summary</h4>
            {reports.map(report => (
              <div 
                key={report.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => setSelectedReportId(report.id)}
              >
                <div>
                  <div className="font-semibold text-gray-900">{report.name}</div>
                  <div className="text-xs text-gray-600">{report.role}</div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{report.skillsAssessed}</div>
                    <div className="text-gray-600">skills</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{report.averageLevel.toFixed(1)}</div>
                    <div className="text-gray-600">avg</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{report.cpdHours}h</div>
                    <div className="text-gray-600">CPD</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

