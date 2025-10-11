import React, { useState, useEffect } from 'react';
import SkillsDashboardV2 from '@/components/accountancy/team/SkillsDashboardV2';
import { Loader2 } from 'lucide-react';

// Wrapper page that loads data and passes to SkillsDashboardV2
const SkillsDashboardV2Page: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [skillCategories, setSkillCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load mock data for now - replace with real API calls
      const mockSkillCategories = getMockSkillCategories();
      const mockTeamMembers = getMockTeamMembers();
      
      setSkillCategories(mockSkillCategories);
      setTeamMembers(mockTeamMembers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockSkillCategories = () => {
    return [
      {
        id: '1',
        name: 'Financial Planning & Analysis',
        description: 'Strategic financial planning and forecasting',
        skills: [
          { id: '1-1', name: 'Cash Flow Forecasting', description: '13-week cash flow', requiredLevel: 4 },
          { id: '1-2', name: 'Scenario Planning', description: 'Multiple scenario modeling', requiredLevel: 3 },
          { id: '1-3', name: 'Budget vs Actual', description: 'Variance analysis', requiredLevel: 3 },
          { id: '1-4', name: 'KPI Design', description: 'Performance indicators', requiredLevel: 4 },
        ]
      },
      {
        id: '2',
        name: 'Business Valuation',
        description: 'Company and asset valuation',
        skills: [
          { id: '2-1', name: 'DCF Modeling', description: 'Discounted cash flow', requiredLevel: 4 },
          { id: '2-2', name: 'Comparable Analysis', description: 'Market comparables', requiredLevel: 3 },
          { id: '2-3', name: 'Exit Planning', description: 'Business exit strategies', requiredLevel: 4 },
        ]
      },
      {
        id: '3',
        name: 'Strategic Advisory',
        description: 'Strategic planning and execution',
        skills: [
          { id: '3-1', name: 'Business Model Canvas', description: 'Strategy frameworks', requiredLevel: 3 },
          { id: '3-2', name: 'Market Analysis', description: 'Competitive analysis', requiredLevel: 3 },
          { id: '3-3', name: 'Growth Strategy', description: 'Scaling businesses', requiredLevel: 4 },
        ]
      },
      {
        id: '4',
        name: 'Risk Management',
        description: 'Risk assessment and mitigation',
        skills: [
          { id: '4-1', name: 'Risk Assessment', description: 'Identify and assess risks', requiredLevel: 3 },
          { id: '4-2', name: 'Controls Design', description: 'Internal controls', requiredLevel: 3 },
          { id: '4-3', name: 'Scenario Testing', description: 'Stress testing', requiredLevel: 4 },
        ]
      },
    ];
  };

  const getMockTeamMembers = () => {
    return [
      {
        id: 'tm-1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'Senior Advisor',
        skills: [
          { skillId: '1-1', currentLevel: 5, interestLevel: 5, targetLevel: 5, lastAssessed: new Date() },
          { skillId: '1-2', currentLevel: 4, interestLevel: 4, targetLevel: 5, lastAssessed: new Date() },
          { skillId: '2-1', currentLevel: 4, interestLevel: 5, targetLevel: 5, lastAssessed: new Date() },
          { skillId: '3-1', currentLevel: 3, interestLevel: 4, targetLevel: 4, lastAssessed: new Date() },
        ],
        overallScore: 4.0
      },
      {
        id: 'tm-2',
        name: 'Michael Chen',
        email: 'michael@example.com',
        role: 'Advisory Consultant',
        skills: [
          { skillId: '1-1', currentLevel: 3, interestLevel: 5, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '1-3', currentLevel: 4, interestLevel: 4, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '2-2', currentLevel: 3, interestLevel: 4, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '4-1', currentLevel: 4, interestLevel: 3, targetLevel: 4, lastAssessed: new Date() },
        ],
        overallScore: 3.5
      },
      {
        id: 'tm-3',
        name: 'Emma Davis',
        email: 'emma@example.com',
        role: 'Junior Advisor',
        skills: [
          { skillId: '1-1', currentLevel: 2, interestLevel: 5, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '1-4', currentLevel: 2, interestLevel: 4, targetLevel: 3, lastAssessed: new Date() },
          { skillId: '3-2', currentLevel: 3, interestLevel: 5, targetLevel: 4, lastAssessed: new Date() },
        ],
        overallScore: 2.3
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading Skills Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SkillsDashboardV2 
      teamMembers={teamMembers}
      skillCategories={skillCategories}
    />
  );
};

export default SkillsDashboardV2Page;

