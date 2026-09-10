'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Smile,
  BarChart2,
  BookOpen,
  Settings,
  X,
  LogOut,
  AlertTriangle,
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
  const [showLeavePrompt, setShowLeavePrompt] = useState(false);

  return (
    <>
      <div className="relative flex flex-col gap-2.5 pointer-events-auto select-none z-30 bg-[#1a0808]/85 p-1.5 rounded-2xl border-2 border-amber-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* 1. Close / Exit Button */}
        <button
          onClick={() => setShowLeavePrompt(true)}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#b91c1c] via-[#991b1b] to-[#7f1d1d] border-2 border-red-400/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-white hover:brightness-125 active:scale-95 transition-all cursor-pointer group"
          title="Leave Match / Return to Lobby"
        >
          <X className="w-5 h-5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* 2. Settings [⚙] */}
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-125 active:scale-95 transition-all cursor-pointer group"
          title="Settings (Audio, Graphics & Board Controls)"
        >
          <Settings className="w-5 h-5 text-[#2b170c] stroke-[2.5] group-hover:rotate-45 transition-transform duration-200" />
        </button>

        {/* 3. Almanac & Rulebook [📖] */}
        <button
          onClick={onOpenAlmanac}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-125 active:scale-95 transition-all cursor-pointer group"
          title="Almanac & Rulebook"
        >
          <BookOpen className="w-5 h-5 text-[#2b170c] stroke-[2.5] group-hover:scale-110 transition-transform" />
        </button>

        {/* 4. Chat & Game Log [💬] */}
        <button
          onClick={onOpenMessages}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-125 active:scale-95 transition-all cursor-pointer group"
          title="Chat & Chronicle Log"
        >
          <MessageSquare className="w-5 h-5 text-[#2b170c] stroke-[2.5] group-hover:scale-110 transition-transform" />
        </button>

        {/* 5. Hex Face Emoji Reactions [😀] */}
        <button
          onClick={onOpenEmoji}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-125 active:scale-95 transition-all cursor-pointer group"
          title="Express Hex Emojis"
        >
          <Smile className="w-5 h-5 text-[#2b170c] stroke-[2.5] group-hover:scale-110 transition-transform" />
        </button>

        {/* 6. Scoreboard & Dice Roll Histogram [📊] */}
        <button
          onClick={onOpenScoreboard}
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] border-2 border-amber-300/80 shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-950 hover:brightness-125 active:scale-95 transition-all cursor-pointer group"
          title="Scoreboard & Dice Histogram"
        >
          <BarChart2 className="w-5 h-5 text-[#2b170c] stroke-[2.5] group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Leave Match Confirmation Modal */}
      {showLeavePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#2a1010] via-[#1a0c0c] to-[#120808] border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500/80 flex items-center justify-center text-red-400 shadow-xl">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-100 font-serif">Leave Current Match?</h3>
              <p className="text-xs text-amber-200/70 mt-1">
                Are you sure you want to forfeit this session and return to the main harbor lobby?
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowLeavePrompt(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:bg-stone-800 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Stay & Play
              </button>
              <button
                onClick={() => {
                  setShowLeavePrompt(false);
                  onLeaveMatch?.();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-red-600 to-red-800 border border-red-400 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Match</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
