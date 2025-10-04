import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOracleData } from '@/hooks/useOracleData';
import { Loader2 } from 'lucide-react';

export default function MyJourneyPage() {
  const navigate = useNavigate();
  const { data, loading } = useOracleData();

  useEffect(() => {
    // If they have a roadmap, go to the twelve week plan
    if (!loading && data?.roadmapGenerated) {
      navigate('/oracle/twelve-week-plan');
    } else if (!loading && !data?.intakeComplete) {
      navigate('/assessments');
    }
  }, [loading, data, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Loading your journey...</h2>
        <p className="text-gray-600">Redirecting you to the right place</p>
      </div>
    </div>
  );
} 