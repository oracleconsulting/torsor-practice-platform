
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AssessmentStart = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard where assessment is now handled
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Redirecting to dashboard...</div>
    </div>
  );
};

export default AssessmentStart;
