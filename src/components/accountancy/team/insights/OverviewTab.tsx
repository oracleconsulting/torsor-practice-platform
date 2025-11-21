/**
 * Overview Tab - Assessment Completion Status
 * Displays which team members have completed their assessments
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import type { AssessmentCompletion, TeamMember } from '@/types/team-insights';
import { getCompletionColor } from '@/utils/team-insights/helpers';

interface OverviewTabProps {
  loading: boolean;
  completionStatus: AssessmentCompletion[];
  teamMembers: TeamMember[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  loading,
  completionStatus,
  teamMembers,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assessment Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Assessment Completion Status
          </CardTitle>
          <CardDescription>
            Track which team members have completed their professional assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completionStatus.map((member) => (
              <div key={member.memberId} className="flex items-center gap-4">
                <div className="w-48 font-medium text-gray-900">{member.name}</div>
                <div className="flex-1">
                  <Progress value={Number(member.completionRate) || 0} className="h-2" />
                </div>
                <Badge className={getCompletionColor(member.completionRate)}>
                  {member.completionRate}%
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Assessment Type Summary */}
          <div className="mt-6 grid grid-cols-7 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-700">VARK</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.vark).length}/{teamMembers.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">OCEAN</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.ocean).length}/{teamMembers.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Working</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.workingPrefs).length}/{teamMembers.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Belbin</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.belbin).length}/{teamMembers.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Motivate</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.motivational).length}/{teamMembers.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">EQ</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.eq).length}/{teamMembers.length}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Conflict</div>
              <div className="text-gray-600">
                {completionStatus.filter(c => c.conflict).length}/{teamMembers.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

