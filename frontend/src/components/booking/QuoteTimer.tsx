import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface QuoteTimerProps {
  validUntil: string;
  onExpired?: () => void;
}

export const QuoteTimer: React.FC<QuoteTimerProps> = ({ validUntil, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const seconds = differenceInSeconds(new Date(validUntil), new Date());
      return Math.max(0, seconds);
    };

    const updateTimer = () => {
      const seconds = calculateTimeLeft();
      setTimeLeft(seconds);
      
      if (seconds === 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }
    };

    // Initial calculation
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [validUntil, onExpired, isExpired]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeLeft <= 60) return 'text-red-600';
    if (timeLeft <= 300) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (isExpired) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span className="text-sm font-medium">Quote Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <svg className={`w-5 h-5 ${getTimerColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <div className="text-sm">
        <span className="text-gray-500">Valid for: </span>
        <span className={`font-medium ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};