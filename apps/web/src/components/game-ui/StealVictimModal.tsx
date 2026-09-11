'use client';

import React from 'react';
import { Sword } from 'lucide-react';
import { PlayerState } from '@hexara/game-core';
import { ResourceType } from '@hexara/shared';
import { soundManager } from '../../game/SoundManager';

interface StealVictimModalProps {
  victimIds: string[];
  players: Record<string, PlayerState>;
  activePlayerName: string;
  onSteal: (victimId: string) => void;
}

const DEFAULT_AVATARS = ['🧔', '🏹', '🦙', '👑', '🧙', '⚓'];

const totalCards = (resources: Record<ResourceType, number>) =>
  Object.values(resources || {}).reduce((a, b) => a + (b || 0), 0);

export const StealVictimModal: React.FC<StealVictimModalProps> = ({
  victimIds,
  players,
  activePlayerName,
  onSteal,
}) => {
  const playerOrder = Object.keys(players);

  const handleSelectVictim = (vid: string) => {
    soundManager.playClick();
    onSteal(vid);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#2d1b0d] via-[#1a0f07] to-[#120703] border-2 border-amber-600/80 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.4)] overflow-hidden">
        {/* Header gold/crimson stripe */}
        <div className="h-1.5 bg-gradient-to-r from-red-700 via-amber-400 to-red-700 animate-pulse" />

        {/* Icon + title */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-11 h-11 rounded-xl bg-red-950/80 border border-red-500/80 flex items-center justify-center shadow-inner flex-shrink-0">
            <Sword className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-amber-200">
              Steal a Resource
            </h2>
            <p className="text-[12px] text-amber-200/70">
              {activePlayerName}, choose a victim on this hex
            </p>
          </div>
        </div>

        {/* Victims list */}
        <div className="px-5 pb-5 space-y-2.5">
          {victimIds.map((vid) => {
            const p = players[vid];
            if (!p) return null;
            const idx = playerOrder.indexOf(vid);
            const playerColor = p.color || '#f59e0b';
            const avatar = DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];
            const cardCount = totalCards(p.resources as Record<ResourceType, number>);

            return (
              <button
                key={vid}
                onClick={() => handleSelectVictim(vid)}
                className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[56px] rounded-xl border border-amber-700/40 bg-black/40 hover:bg-amber-950/40 hover:border-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group"
              >
                {/* Avatar with player's actual color accent */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md border-2 flex-shrink-0"
                  style={{
                    backgroundColor: playerColor + '25',
                    borderColor: playerColor,
                    boxShadow: `0 0 12px ${playerColor}40`,
                  }}
                >
                  {avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-amber-100 truncate group-hover:text-amber-300 transition-colors">
                    {p.username}
                  </div>
                  <div className="text-[11px] text-amber-200/60 font-medium">
                    {cardCount} resource card{cardCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Steal action button badge */}
                <div className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-700 to-amber-700 border border-amber-500/60 text-xs font-black text-amber-100 uppercase tracking-wider shadow-sm group-hover:shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-shadow">
                  Steal
                </div>
              </button>
            );
          })}

          {victimIds.length === 0 && (
            <div className="text-center py-5 text-amber-300/60 text-sm font-semibold italic bg-black/20 rounded-xl border border-amber-900/30">
              No players with resources to steal from on this hex.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
