import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Target, Users, BookOpen, Activity, 
  Trophy, Brain, Smartphone, BarChart2 
} from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Training Recommendations',
      description: 'AI-powered learning paths',
      path: '/accountancy/team-portal/training-recommendations',
      color: 'purple'
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Find a Mentor',
      description: 'Connect with experts',
      path: '/accountancy/team-portal/mentoring',
      color: 'blue'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'CPD Impact',
      description: 'Track skills improvement',
      path: '/accountancy/team-portal/cpd-skills-impact',
      color: 'green'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      label: 'VARK Assessment',
      description: 'Discover learning style',
      path: '/accountancy/team-portal/vark-assessment',
      color: 'yellow'
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      label: 'Analytics',
      description: 'Team insights & trends',
      path: '/accountancy/team-portal/analytics',
      color: 'indigo'
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      label: 'Mobile Assessment',
      description: 'Optimized for mobile',
      path: '/accountancy/team-portal/mobile-assessment',
      color: 'pink'
    }
  ];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.path}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-700 border-gray-600 text-left"
              onClick={() => navigate(action.path)}
            >
              <div className={`text-${action.color}-500`}>
                {action.icon}
              </div>
              <div className="text-center w-full">
                <div className="font-medium text-sm text-white">
                  {action.label}
                </div>
                <div className="text-xs text-white font-medium mt-1">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;

