/**
 * Simplified Team Assessments Page
 * Shows all assessment data in one clean view
 * Replaces the overcomplicated TeamAssessmentInsights component
 */

import React from 'react';
import { TeamAssessmentsTable } from '@/components/accountancy/team/TeamAssessmentsTable';

const TeamAssessmentsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Team Assessments</h1>
        <p className="text-gray-600 mt-2">
          Complete overview of all team member assessments and completion status
        </p>
      </div>

      <TeamAssessmentsTable />
    </div>
  );
};

export default TeamAssessmentsPage;

