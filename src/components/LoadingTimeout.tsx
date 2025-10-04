import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoadingTimeoutProps {
  timeout?: number;
  message?: string;
  showReturnButton?: boolean;
}

export const LoadingTimeout: React.FC<LoadingTimeoutProps> = ({ 
  timeout = 5000, 
  message = "Loading is taking longer than expected",
  showReturnButton = true 
}) => {
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [timeout]);
  
  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{message}</p>
        {showReturnButton && (
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
};