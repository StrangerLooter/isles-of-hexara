'use client';

import React from 'react';
import { X, ScrollText, BookOpen, Landmark, Trophy, Settings, LogOut, MessageSquare } from 'lucide-react';
import { soundManager } from '../../game/SoundManager';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLog: () => void;
  onOpenRules: () => void;
  onOpenBankTrade: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onLeaveMatch: () => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  onOpenLog,
  onOpenRules,
  onOpenBankTrade,
  onOpenStats,
  onOpenSettings,
  onLeaveMatch,
}) => {
  if (!isOpen) return null;

  const items = [
    {
      label: 'Game Log & Chat',
      icon: <ScrollText className="w-5 h-5 text-amber-400" />,
      action: onOpenLog,
      desc: 'Chronicle of events and crew dispatches',
    },
    {
      label: 'Maritime Rules & Almanac',
      icon: <BookOpen className="w-5 h-5 text-blue-400" />,
      action: onOpenRules,
      desc: 'Building costs, harbor ratios, and guide',
    },
    {
      label: 'Bank & Maritime Trade',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
      action: onOpenBankTrade,
      desc: 'Exchange 4:1 with bank or 3:1/2:1 with harbors',
    },
    {
      label: 'Scoreboard & Statistics',
      icon: <Trophy className="w-5 h-5 text-amber-300" />,
      action: onOpenStats,
      desc: 'Victory points breakdown and dice distribution',
    },
    {
      label: 'Tavern Settings',
      icon: <Settings className="w-5 h-5 text-purple-400" />,
      action: onOpenSettings,
      desc: 'Audio volumes, SFX, and graphics toggles',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
      <div
        className="w-full bg-gradient-to-b from-[#2a160c] via-[#1a0c06] to-[#0c0502] border-t-2 border-amber-600/70 rounded-t-3xl shadow-[0_-12px_36px_rgba(0,0,0,0.9)] p-5 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
      >
        {/* Handle indicator & header */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-1.5 rounded-full bg-amber-700/60 mb-3" />
          <div className="w-full flex items-center justify-between">
            <h3 className="text-base font-black uppercase tracking-wider text-amber-200 font-serif">
              Voyage Controls
            </h3>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1.5 rounded-full bg-black/40 text-amber-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Item List */}
        <div className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                soundManager.playClick();
                onClose();
                item.action();
              }}
              className="w-full p-3 rounded-2xl bg-black/40 border border-amber-900/40 hover:border-amber-500/50 hover:bg-black/60 flex items-center gap-3.5 text-left transition-all active:scale-[0.98]"
            >
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-100 font-serif">{item.label}</div>
                <div className="text-[11px] text-stone-400">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Leave Match */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onClose();
            onLeaveMatch();
          }}
          className="w-full py-3 rounded-2xl bg-red-950/50 border border-red-800/50 text-red-300 hover:bg-red-900/60 hover:text-white flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Abandon Voyage (Leave Match)</span>
        </button>
      </div>
    </div>
  );
};
