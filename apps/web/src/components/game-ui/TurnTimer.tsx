'use client';

import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

interface TurnTimerProps {
  durationSeconds?: number;
  isActive: boolean;
  isMyTurn: boolean;
  onTimeout?: () => void;
  turnKey: string; // changes every turn to reset timer
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  durationSeconds = 90,
  isActive,
  isMyTurn,
  onTimeout,
  turnKey,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    setTimeLeft(durationSeconds);
  }, [turnKey, durationSeconds]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isMyTurn) {
            onTimeout?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isMyTurn, onTimeout, turnKey]);

  if (!isActive) return null;

  const fraction = timeLeft / durationSeconds;
  const isLow = timeLeft <= 15;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-lg backdrop-blur-md transition-all ${
        isLow
          ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
          : 'bg-black/60 border-amber-600/40 text-amber-200'
      }`}
      title={`Turn Timer: ${timeLeft}s remaining`}
    >
      <Timer className={`w-3.5 h-3.5 ${isLow ? 'text-red-400' : 'text-amber-400'}`} />
      <span className="text-xs font-mono font-black">{timeLeft}s</span>
    </div>
  );
};
