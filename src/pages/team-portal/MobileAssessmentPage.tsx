import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MobileSkillCard from '@/components/accountancy/team/MobileSkillCard';
import MobileRatingSelector from '@/components/accountancy/team/MobileRatingSelector';
import MobileProgressIndicator from '@/components/accountancy/team/MobileProgressIndicator';
import { Card, CardContent } from '@/components/ui/card';

// Sample skills data - replace with actual data from your API
const SAMPLE_SKILLS = [
  { id: '1', name: 'Financial Reporting', category: 'Technical', description: 'Preparation of financial statements' },
  { id: '2', name: 'Tax Compliance', category: 'Technical', description: 'Understanding of UK tax regulations' },
  { id: '3', name: 'Excel Advanced', category: 'Technical', description: 'Advanced Excel formulas and functions' },
  { id: '4', name: 'Client Communication', category: 'Soft Skills', description: 'Effective client interaction' },
  { id: '5', name: 'Time Management', category: 'Soft Skills', description: 'Managing multiple priorities' },
];

const MobileAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, { level: number; interest: number }>>({});
  const [showDescription, setShowDescription] = useState(false);

  const currentSkill = SAMPLE_SKILLS[currentSkillIndex];
  const progress = ((currentSkillIndex + 1) / SAMPLE_SKILLS.length) * 100;

  const handleRating = (type: 'level' | 'interest', value: number) => {
    setRatings(prev => ({
      ...prev,
      [currentSkill.id]: {
        ...prev[currentSkill.id],
        [type]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentSkillIndex < SAMPLE_SKILLS.length - 1) {
      setCurrentSkillIndex(prev => prev + 1);
      setShowDescription(false);
    } else {
      // Assessment complete
      alert('Assessment complete! Redirecting to dashboard...');
      navigate('/accountancy/team');
    }
  };

  const handlePrevious = () => {
    if (currentSkillIndex > 0) {
      setCurrentSkillIndex(prev => prev - 1);
      setShowDescription(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      handleNext();
    } else if (direction === 'left') {
      handlePrevious();
    }
  };

  const currentRating = ratings[currentSkill.id] || { level: 0, interest: 0 };

  return (
    <div className="min-h-screen bg-gray-900 pb-safe">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/accountancy/team')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Exit
          </Button>
          <h1 className="text-white font-semibold">Skills Assessment</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <MobileProgressIndicator
          current={currentSkillIndex + 1}
          total={SAMPLE_SKILLS.length}
          progress={progress}
        />
      </div>

      {/* Info Alert */}
      <div className="px-4 pt-4">
        <Alert className="bg-blue-900/20 border-blue-700">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-gray-300 text-sm">
            Swipe right to continue, swipe left to go back. Tap and hold the card to see skill description.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6">
        <MobileSkillCard
          skill={currentSkill}
          onSwipe={handleSwipe}
          showDescription={showDescription}
          onToggleDescription={() => setShowDescription(!showDescription)}
        />

        {/* Rating Selectors */}
        <div className="space-y-6 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <MobileRatingSelector
                label="Current Skill Level"
                value={currentRating.level}
                onChange={(value) => handleRating('level', value)}
                labels={['Beginner', 'Basic', 'Competent', 'Proficient', 'Expert']}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <MobileRatingSelector
                label="Interest Level"
                value={currentRating.interest}
                onChange={(value) => handleRating('interest', value)}
                labels={['No Interest', 'Low', 'Moderate', 'High', 'Very High']}
              />
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSkillIndex === 0}
            className="flex-1 h-12 bg-gray-800 border-gray-700 text-white disabled:opacity-30"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentRating.level === 0 || currentRating.interest === 0}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {currentSkillIndex === SAMPLE_SKILLS.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>

        {/* Skip Button */}
        <Button
          variant="ghost"
          onClick={handleNext}
          className="mt-4 text-gray-400 hover:text-white"
        >
          Skip this skill
        </Button>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-safe" />
    </div>
  );
};

export default MobileAssessmentPage;
