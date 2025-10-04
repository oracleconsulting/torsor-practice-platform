import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  deadline: Date | string;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline, className }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const end = typeof deadline === 'string' ? new Date(deadline) : deadline;
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setRemaining('Expired');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setRemaining(`${days}d ${hours}h ${minutes}m`);
    }, 1000 * 30);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`font-mono text-sm text-white ${className || ''}`}>{remaining}</span>
  );
}; 