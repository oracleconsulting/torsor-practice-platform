import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

export type SessionStatus = 'active' | 'expiring' | 'expired';

interface SessionMonitorState {
  sessionExpiresAt: Date | null;
  timeUntilExpiry: number | null;
  sessionStatus: SessionStatus;
  shouldShowWarning: boolean;
}

export function useSessionMonitor(session: Session | null): SessionMonitorState {
  const [state, setState] = useState<SessionMonitorState>({
    sessionExpiresAt: null,
    timeUntilExpiry: null,
    sessionStatus: 'active',
    shouldShowWarning: false,
  });

  useEffect(() => {
    // Function to calculate session state
    const calculateSessionState = () => {
      if (!session?.expires_at) {
        setState({
          sessionExpiresAt: null,
          timeUntilExpiry: null,
          sessionStatus: 'active',
          shouldShowWarning: false,
        });
        return;
      }

      const expiresAt = new Date(session.expires_at);
      const now = new Date();
      const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      // Determine session status
      let status: SessionStatus = 'active';
      if (timeUntilExpiry <= 0) {
        status = 'expired';
      } else if (timeUntilExpiry <= 600) { // 10 minutes
        status = 'expiring';
      }

      setState({
        sessionExpiresAt: expiresAt,
        timeUntilExpiry,
        sessionStatus: status,
        shouldShowWarning: timeUntilExpiry > 0 && timeUntilExpiry <= 300, // 5 minutes
      });
    };

    // Initial calculation
    calculateSessionState();

    // Set up interval to recalculate every 30 seconds
    const intervalId = setInterval(calculateSessionState, 30000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [session]);

  return state;
} 