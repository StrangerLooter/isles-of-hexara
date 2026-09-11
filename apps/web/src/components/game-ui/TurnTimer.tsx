'use client';

import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { soundManager } from '../../game/SoundManager';

interface TurnTimerProps {
  durationSeconds?: number;
  turnDeadline?: number;
  isActive: boolean;
  isMyTurn: boolean;
  onTimeout?: () => void;
  turnKey: string;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  durationSeconds = 60,
  turnDeadline,
  isActive,
  isMyTurn,
  onTimeout,
  turnKey,
}) => {
  const calculateRemaining = () => {
    if (turnDeadline && turnDeadline > Date.now()) {
      return Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
    }
    return durationSeconds;
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemaining);

  useEffect(() => {
    setTimeLeft(calculateRemaining());
  }, [turnKey, turnDeadline, durationSeconds]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let current = prev;
        if (turnDeadline && turnDeadline > 0) {
          current = Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
        } else {
          current = Math.max(0, prev - 1);
        }

        if (current <= 0) {
          clearInterval(interval);
          if (isMyTurn) {
            onTimeout?.();
          }
          return 0;
        }

        // Low time sound warning at 10s and 5s
        if (isMyTurn && (current === 10 || current === 5)) {
          soundManager.playError();
        }

        return current;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isMyTurn, onTimeout, turnKey, turnDeadline]);

  if (!isActive) return null;

  const isCritical = timeLeft <= 10;
  const isLow = timeLeft <= 15;
  const totalDuration = durationSeconds || 60;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
  const strokeDashoffset = 100 - progressPercent;

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 shadow-xl backdrop-blur-md transition-all select-none ${
        isCritical
          ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-red-500 text-red-100 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.85)] ring-2 ring-red-400'
          : isLow
          ? 'bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
          : 'bg-gradient-to-r from-[#24130c]/95 via-[#180b06]/95 to-[#24130c]/95 border-amber-600/60 text-amber-200 shadow-lg'
      }`}
      title={`Server Authoritative Turn Timer: ${timeLeft}s remaining`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/10"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <Timer className={`w-2.5 h-2.5 absolute ${isCritical ? 'text-red-300' : 'text-amber-300'}`} />
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-sm font-mono font-black tracking-tight ${isCritical ? 'text-white' : 'text-amber-100'}`}>
          {timeLeft}
        </span>
        <span className="text-[10px] font-mono font-bold opacity-75">s</span>
      </div>
      {isCritical && (
        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-600 text-white animate-ping">
          LOW
        </span>
      )}
    </div>
  );
};
