'use client';

import React from 'react';
import { Trophy, Crown, Star, Shield, Award, X, Sparkles } from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import { soundManager } from '../../game/SoundManager';

interface RankingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { username: string; level: number; xp: number };
}

const LEADERBOARD_ENTRIES = [
  { rank: 1, name: 'Admiral Vane', avatar: '🌊', title: 'Grand Sovereign', level: 14, wins: 48, winRate: '68%', vp: 512 },
  { rank: 2, name: 'Lady Eleanor', avatar: '👑', title: 'Silk Merchant Queen', level: 12, wins: 41, winRate: '64%', vp: 448 },
  { rank: 3, name: 'Captain Drake', avatar: '⚓', title: 'High Seas Corsair', level: 11, wins: 37, winRate: '61%', vp: 395 },
  { rank: 4, name: 'Master Eldon', avatar: '🧙', title: 'Archipelago Sage', level: 10, wins: 33, winRate: '59%', vp: 350 },
  { rank: 5, name: 'Baron William', avatar: '⚔️', title: 'Iron Fleet Commander', level: 9, wins: 28, winRate: '54%', vp: 310 },
  { rank: 6, name: 'Rowan the Swift', avatar: '🏹', title: 'Pioneer Scout', level: 8, wins: 24, winRate: '52%', vp: 275 },
  { rank: 7, name: 'Mira of Oakhaven', avatar: '🦙', title: 'Guildmaster', level: 7, wins: 20, winRate: '50%', vp: 230 },
];

export const RankingsModal: React.FC<RankingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="Archipelago Leaderboard & Rankings" onBack={onClose} onHome={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6 custom-scrollbar">
        {/* Top 3 Podium Highlights */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-4 pb-2">
          {/* #2 */}
          <div className="catan-card-dark rounded-2xl p-4 flex flex-col items-center border border-slate-400/50 shadow-xl relative order-1">
            <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center absolute -top-3 shadow">
              2
            </div>
            <span className="text-3xl mt-1">{LEADERBOARD_ENTRIES[1].avatar}</span>
            <span className="text-xs sm:text-sm font-black text-amber-100 mt-2 text-center truncate w-full">
              {LEADERBOARD_ENTRIES[1].name}
            </span>
            <span className="text-[10px] text-slate-300 font-mono font-bold mt-0.5">
              {LEADERBOARD_ENTRIES[1].wins} Wins &bull; {LEADERBOARD_ENTRIES[1].vp} VP
            </span>
          </div>

          {/* #1 */}
          <div className="catan-card-dark rounded-2xl p-5 flex flex-col items-center border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] relative -mt-4 order-2 bg-gradient-to-b from-[#3a1d0d] to-[#1a0c05]">
            <Crown className="w-8 h-8 text-amber-400 animate-bounce -mt-7 mb-1 drop-shadow" />
            <div className="w-8 h-8 rounded-full bg-amber-400 text-black font-black text-sm flex items-center justify-center absolute -top-3 shadow">
              1
            </div>
            <span className="text-4xl">{LEADERBOARD_ENTRIES[0].avatar}</span>
            <span className="text-sm sm:text-base font-black text-amber-200 mt-2 text-center truncate w-full">
              {LEADERBOARD_ENTRIES[0].name}
            </span>
            <span className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
              {LEADERBOARD_ENTRIES[0].wins} Wins &bull; {LEADERBOARD_ENTRIES[0].vp} VP
            </span>
          </div>

          {/* #3 */}
          <div className="catan-card-dark rounded-2xl p-4 flex flex-col items-center border border-amber-800/60 shadow-xl relative order-3">
            <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center absolute -top-3 shadow">
              3
            </div>
            <span className="text-3xl mt-1">{LEADERBOARD_ENTRIES[2].avatar}</span>
            <span className="text-xs sm:text-sm font-black text-amber-100 mt-2 text-center truncate w-full">
              {LEADERBOARD_ENTRIES[2].name}
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono font-bold mt-0.5">
              {LEADERBOARD_ENTRIES[2].wins} Wins &bull; {LEADERBOARD_ENTRIES[2].vp} VP
            </span>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="catan-card-dark rounded-2xl border-2 border-amber-500/70 p-4 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 text-[11px] font-black uppercase tracking-wider text-amber-300">
            <span className="w-12 text-center">Rank</span>
            <span className="flex-1 px-3">Voyager Captain</span>
            <span className="hidden sm:inline w-24 text-center">Title</span>
            <span className="w-16 text-center">Wins</span>
            <span className="w-16 text-center">Win Rate</span>
            <span className="w-20 text-right pr-2">Total VP</span>
          </div>

          <div className="divide-y divide-amber-900/30">
            {LEADERBOARD_ENTRIES.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between py-3 hover:bg-white/5 transition-colors text-xs font-bold text-amber-100"
              >
                <span className="w-12 text-center font-mono font-black text-amber-400">
                  #{entry.rank}
                </span>
                <div className="flex-1 px-3 flex items-center gap-2">
                  <span className="text-lg">{entry.avatar}</span>
                  <div>
                    <span className="font-black text-amber-200">{entry.name}</span>
                    <span className="block text-[10px] text-amber-400/60 font-mono">
                      Level {entry.level}
                    </span>
                  </div>
                </div>
                <span className="hidden sm:inline w-24 text-center text-[10px] text-amber-300/70">
                  {entry.title}
                </span>
                <span className="w-16 text-center font-mono text-emerald-400">{entry.wins}</span>
                <span className="w-16 text-center font-mono text-amber-300">{entry.winRate}</span>
                <span className="w-20 text-right pr-2 font-mono font-black text-amber-400">
                  {entry.vp} VP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
