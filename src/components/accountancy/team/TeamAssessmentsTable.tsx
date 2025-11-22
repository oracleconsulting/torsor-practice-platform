/**
 * Simple Team Assessments Table
 * Shows ALL assessment data in one clean table view
 * Replaces the overcomplicated charts and tabs
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { useTeamAssessments } from '@/hooks/useTeamAssessments';

const AssessmentBadge: React.FC<{ complete: boolean; value?: string | number | null }> = ({ complete, value }) => {
  if (!complete) {
    return <Badge variant="outline" className="text-gray-400"><Circle className="w-3 h-3 mr-1" />Pending</Badge>;
  }
  return (
    <Badge variant="default" className="bg-green-100 text-green-800">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      {value || 'Complete'}
    </Badge>
  );
};

export const TeamAssessmentsTable: React.FC = () => {
  const { members, loading, error, refresh } = useTeamAssessments();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team assessments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-600 mb-4">Error loading assessments: {error.message}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Team Assessment Overview</CardTitle>
              <CardDescription>
                Complete assessment status for all team members ({members.length} members)
              </CardDescription>
            </div>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="p-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">Member</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Overall</th>
                  <th className="p-3 text-center font-semibold text-gray-700">VARK</th>
                  <th className="p-3 text-center font-semibold text-gray-700">OCEAN</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Belbin</th>
                  <th className="p-3 text-center font-semibold text-gray-700">EQ</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Motivational</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Conflict</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Working Prefs</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.member_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">{member.role || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-gray-900">{member.completion_percentage}%</div>
                        <div className="text-xs text-gray-500">{member.assessments_completed}/7</div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge complete={member.vark_complete} value={member.vark_style} />
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge 
                        complete={member.ocean_complete} 
                        value={member.ocean_complete ? '✓' : undefined}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge complete={member.belbin_complete} value={member.belbin_primary} />
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge 
                        complete={member.eq_complete} 
                        value={member.overall_eq ? Math.round(member.overall_eq) : undefined}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge complete={member.motivational_complete} value={member.primary_driver} />
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge complete={member.conflict_complete} value={member.conflict_style} />
                    </td>
                    <td className="p-3 text-center">
                      <AssessmentBadge 
                        complete={member.working_prefs_complete} 
                        value={member.communication_style}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {members.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No team members found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Average Completion</div>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(members.reduce((sum, m) => sum + m.completion_percentage, 0) / members.length || 0)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Fully Complete</div>
            <div className="text-3xl font-bold text-green-600">
              {members.filter(m => m.completion_percentage === 100).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600">
              {members.filter(m => m.completion_percentage > 0 && m.completion_percentage < 100).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Not Started</div>
            <div className="text-3xl font-bold text-gray-600">
              {members.filter(m => m.completion_percentage === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

