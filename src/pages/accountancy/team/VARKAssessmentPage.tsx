import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import VARKAssessment from '@/components/accountancy/team/VARKAssessment';
import { useAuth } from '@/contexts/AuthContext';

const VARKAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const teamMemberId = searchParams.get('member_id') || user?.id || '';
  const teamMemberName = searchParams.get('member_name') || undefined;

  const handleComplete = () => {
    // Navigate back to team management or skills page
    navigate('/accountancy/team');
  };

  const handleBack = () => {
    navigate('/accountancy/team');
  };

  return (
    <div className="min-h-screen bg-[#0f1419] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
        }} />
      </div>

      {/* Page Header */}
      <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-12 border-b border-gray-800">
        <div className="container mx-auto px-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-white font-medium hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team Portal
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">
            VARK Learning Style Assessment
          </h1>
          <p className="text-white font-medium text-lg">
            Discover your learning preferences to personalize your development path
          </p>
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl">
        {/* Info Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-3">About VARK</h2>
            <p className="text-white font-medium mb-4">
              VARK stands for Visual, Auditory, Reading/Writing, and Kinesthetic learning preferences. 
              This assessment helps identify how you prefer to take in and process information.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-white mb-2">What to expect:</h3>
                <ul className="text-white font-medium space-y-1 list-disc list-inside">
                  <li>16 scenario-based questions</li>
                  <li>Takes approximately 5-10 minutes</li>
                  <li>No right or wrong answers</li>
                  <li>Your answers are auto-saved</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">You'll receive:</h3>
                <ul className="text-white font-medium space-y-1 list-disc list-inside">
                  <li>Your learning style profile</li>
                  <li>Personalized learning strategies</li>
                  <li>Recommendations for CPD activities</li>
                  <li>Tips for effective skill development</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Component */}
        <VARKAssessment
          teamMemberId={teamMemberId}
          teamMemberName={teamMemberName}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default VARKAssessmentPage;

