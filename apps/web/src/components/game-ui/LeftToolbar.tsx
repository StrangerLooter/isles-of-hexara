'use client';

import React from 'react';
import {
  MessageSquare,
  Smile,
  BarChart2,
  BookOpen,
  Settings,
  X,
} from 'lucide-react';

interface LeftToolbarProps {
  onOpenMessages?: () => void;
  onOpenAlmanac?: () => void;
  onOpenSettings?: () => void;
  onOpenScoreboard?: () => void;
  onOpenEmoji?: () => void;
  onLeaveMatch?: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  onOpenMessages,
  onOpenAlmanac,
  onOpenSettings,
  onOpenScoreboard,
  onOpenEmoji,
  onLeaveMatch,
}) => {
  return (
    <div className="relative flex flex-col gap-2.5 pointer-events-auto select-none z-40 bg-[#1a0808]/70 p-1.5 rounded-2xl border border-amber-900/40 shadow-2xl backdrop-blur-sm">
      {/* 1. Close / Exit Button matching top [X] in reference images */}
      <button
        onClick={onLeaveMatch}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#b91c1c] via-[#991b1b] to-[#7f1d1d] border-2 border-red-400/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all"
        title="Leave Match / Main Menu"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* 2. Settings [⚙] matching Image 16, 17, 18 */}
      <button
        onClick={onOpenSettings}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-110 active:scale-95 transition-all"
        title="Settings (Audio, Game & Visuals)"
      >
        <Settings className="w-5 h-5 text-[#2b170c] stroke-[2.5]" />
      </button>

      {/* 3. Almanac & Rulebook [📖] matching Image 15 */}
      <button
        onClick={onOpenAlmanac}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-110 active:scale-95 transition-all"
        title="Almanac & Rulebook"
      >
        <BookOpen className="w-5 h-5 text-[#2b170c] stroke-[2.5]" />
      </button>

      {/* 4. Chat & Game Log [💬] matching Image 14 */}
      <button
        onClick={onOpenMessages}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-110 active:scale-95 transition-all"
        title="Chat & Chronicle Log"
      >
        <MessageSquare className="w-5 h-5 text-[#2b170c] stroke-[2.5]" />
      </button>

      {/* 5. Hex Face Emoji Reactions [😀] matching Image 13 */}
      <button
        onClick={onOpenEmoji}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-110 active:scale-95 transition-all"
        title="Express Hex Emojis"
      >
        <Smile className="w-5 h-5 text-[#2b170c] stroke-[2.5]" />
      </button>

      {/* 6. Scoreboard & Dice Roll Histogram [📊] matching Image 12 */}
      <button
        onClick={onOpenScoreboard}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-110 active:scale-95 transition-all"
        title="Scoreboard & Dice Histogram"
      >
        <BarChart2 className="w-5 h-5 text-[#2b170c] stroke-[2.5]" />
      </button>
    </div>
  );
};
