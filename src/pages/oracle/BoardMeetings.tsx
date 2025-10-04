import { useOracleData } from '@/hooks/useOracleData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Calendar, MessageSquare, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BoardMeetingsPage() {
  const { data, loading } = useOracleData();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  if (!data?.boardRecommended) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">AI Board Not Yet Generated</h2>
          <p className="text-gray-600 mb-6">Complete your assessment to get your AI board recommendation</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Safe access to board composition
  const boardMembers = data.boardComposition || [];
  const boardType = data.boardType || 'advisory';
  
  // Default board members if none exist
  const defaultMembers = [
    {
      name: 'Strategic Growth Advisor',
      expertise: 'Business Strategy & Scaling',
      focus: 'Help you build scalable systems and processes',
      avatar: '👔'
    },
    {
      name: 'Financial Architect',
      expertise: 'Financial Planning & Analysis',
      focus: 'Optimize cash flow and profitability',
      avatar: '💰'
    },
    {
      name: 'Operations Expert',
      expertise: 'Operational Excellence',
      focus: 'Streamline operations and reduce working hours',
      avatar: '⚙️'
    },
    {
      name: 'Marketing Strategist',
      expertise: 'Growth & Customer Acquisition',
      focus: 'Drive sustainable revenue growth',
      avatar: '📈'
    }
  ];
  
  const displayMembers = boardMembers.length > 0 ? boardMembers : defaultMembers;
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Your AI {boardType.charAt(0).toUpperCase() + boardType.slice(1)} Board</h1>
            <p className="text-gray-600 mt-2">Expert guidance tailored to your business needs</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Board Score Overview */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-xl font-semibold mb-4">Board Type Match Scores</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Advisory Board</p>
            <p className="text-2xl font-bold text-indigo-600">{data.boardScores?.advisory || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Board of Directors</p>
            <p className="text-2xl font-bold text-purple-600">{data.boardScores?.directors || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Advisory Council</p>
            <p className="text-2xl font-bold text-blue-600">{data.boardScores?.advisoryCouncil || 0}%</p>
          </div>
        </div>
      </Card>

      {/* Board Members */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Meet Your Board Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayMembers.map((member, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{member.avatar || '👤'}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <Badge variant="outline" className="mb-2">{member.expertise}</Badge>
                  <p className="text-gray-600 text-sm">{member.focus || member.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Meeting Options */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Board Meeting Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <Calendar className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-2">Weekly Check-ins</h3>
            <p className="text-sm text-gray-600">Quick 30-minute progress reviews</p>
            <Button className="w-full mt-4" variant="outline">Schedule</Button>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">Strategic Sessions</h3>
            <p className="text-sm text-gray-600">Deep dive into specific challenges</p>
            <Button className="w-full mt-4" variant="outline">Schedule</Button>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-green-500">
            <Target className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold mb-2">Quarterly Reviews</h3>
            <p className="text-sm text-gray-600">Comprehensive progress assessment</p>
            <Button className="w-full mt-4" variant="outline">Schedule</Button>
          </Card>
        </div>
      </Card>

      {/* Coming Soon */}
      <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100">
        <h3 className="text-xl font-semibold mb-2">AI Board Meetings Coming Soon!</h3>
        <p className="text-gray-600">
          Interactive AI-powered board meetings tailored to your specific needs are in development.
        </p>
      </Card>
    </div>
  );
} 