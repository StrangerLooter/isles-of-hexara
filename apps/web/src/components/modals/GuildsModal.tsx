'use client';

import React from 'react';
import { Shield, Anchor, Users, Trophy, Star, Sparkles } from 'lucide-react';
import { HeaderBar } from './HeaderBar';

interface GuildsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUILDS = [
  {
    name: 'Archipelago Navigators',
    motto: 'By Chart and Compass, We Command the Seas',
    level: 7,
    members: 24,
    sigil: '⚓',
    role: 'Open Guild',
  },
  {
    name: 'Iron & Timber Syndicate',
    motto: 'Forged in Mountain Fire, Rooted in Deep Woods',
    level: 6,
    members: 18,
    sigil: '⚒️',
    role: 'Trading Fleet',
  },
  {
    name: 'Silk Harbor Barterers',
    motto: 'Prosperity Through Fair Trade and Swift Ships',
    level: 5,
    members: 21,
    sigil: '🦙',
    role: 'Merchant Coalition',
  },
];

export const GuildsModal: React.FC<GuildsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="Guilds & Maritime Fleets" onBack={onClose} onHome={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6 custom-scrollbar">
        <div className="catan-card-dark rounded-2xl p-6 border-2 border-amber-500/70 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-3xl shadow">
              🛡️
            </div>
            <div>
              <h3 className="text-base font-black text-amber-200 font-serif">
                Join or Command a Maritime Fleet
              </h3>
              <p className="text-xs text-amber-200/70 mt-1">
                Guilds enable cooperative fleet bonuses, shared trading leagues, and seasonal guild wars.
              </p>
            </div>
          </div>
          <button className="catan-btn-gold px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-lg">
            Create Fleet
          </button>
        </div>

        {/* Guilds Roster */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Active Maritime Fleets
          </h4>
          {GUILDS.map((g) => (
            <div
              key={g.name}
              className="catan-card-dark rounded-2xl p-4 border border-amber-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-black/40 border border-amber-600/40">
                  {g.sigil}
                </span>
                <div>
                  <h5 className="text-sm font-black text-amber-100">{g.name}</h5>
                  <p className="text-[11px] text-amber-300/70 italic">{g.motto}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-amber-200/80 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-mono">Level {g.level}</span>
                <span className="font-mono">{g.members} Voyagers</span>
                <button className="px-4 py-1.5 rounded-xl bg-[#2b170c] border border-amber-500/50 text-amber-200 hover:text-white hover:border-amber-300 font-black text-xs uppercase tracking-wider">
                  Request Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
