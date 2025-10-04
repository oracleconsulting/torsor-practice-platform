import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

export function SessionExpiryWarning() {
  const { timeUntilExpiry, refreshSession } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [localTimeUntilExpiry, setLocalTimeUntilExpiry] = useState(timeUntilExpiry);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update local time every second for countdown
  useEffect(() => {
    if (!timeUntilExpiry || timeUntilExpiry <= 0 || timeUntilExpiry > 300) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setLocalTimeUntilExpiry(timeUntilExpiry);

    const intervalId = setInterval(() => {
      setLocalTimeUntilExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeUntilExpiry]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      setIsVisible(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  if (!isVisible || !localTimeUntilExpiry) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ zIndex: 9999 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span>
            Your session expires in {formatTime(localTimeUntilExpiry)}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 border-amber-400"
          >
            {isRefreshing ? 'Refreshing...' : 'Stay Logged In'}
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 