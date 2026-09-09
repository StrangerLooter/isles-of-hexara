'use client';

import React from 'react';

interface DiceDisplayProps {
  dice1: number;
  dice2: number;
  total: number;
  isRolling?: boolean;
  canRoll?: boolean;
  onClick?: () => void;
}

export const DiceDisplay: React.FC<DiceDisplayProps> = ({
  dice1,
  dice2,
  total,
  isRolling = false,
  canRoll = false,
  onClick,
}) => {
  // Dot positions for standard 6-sided die
  const renderDots = (value: number) => {
    const val = Math.max(1, Math.min(6, value || 1));
    const dotMap: Record<number, [number, number][]> = {
      1: [[50, 50]],
      2: [
        [28, 28],
        [72, 72],
      ],
      3: [
        [28, 28],
        [50, 50],
        [72, 72],
      ],
      4: [
        [28, 28],
        [72, 28],
        [28, 72],
        [72, 72],
      ],
      5: [
        [28, 28],
        [72, 28],
        [50, 50],
        [28, 72],
        [72, 72],
      ],
      6: [
        [28, 26],
        [72, 26],
        [28, 50],
        [72, 50],
        [28, 74],
        [72, 74],
      ],
    };

    const dots = dotMap[val] || dotMap[1];

    return dots.map(([cx, cy], i) => (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r="7"
        fill="#1e1b18"
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
      />
    ));
  };

  return (
    <div
      onClick={canRoll ? onClick : undefined}
      className={`flex items-center gap-2 select-none transition-all duration-300 ${
        canRoll
          ? 'cursor-pointer hover:scale-110 active:scale-95 animate-bounce'
          : 'cursor-default'
      }`}
      title={canRoll ? 'Click to Roll Dice!' : `Dice Total: ${total}`}
    >
      {/* Die 1 */}
      <div
        className={`w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-2 border-[#cbd5e1] shadow-[0_6px_14px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.9)] p-1 flex items-center justify-center transition-transform ${
          isRolling ? 'animate-spin' : ''
        }`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {renderDots(dice1 || 3)}
        </svg>
      </div>

      {/* Die 2 */}
      <div
        className={`w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-2 border-[#cbd5e1] shadow-[0_6px_14px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.9)] p-1 flex items-center justify-center transition-transform ${
          isRolling ? 'animate-spin' : ''
        }`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {renderDots(dice2 || 5)}
        </svg>
      </div>
    </div>
  );
};
