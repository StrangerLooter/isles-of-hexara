'use client';

import React from 'react';
import { Sword } from 'lucide-react';
import { PlayerState } from '@hexara/game-core';
import { ResourceType } from '@hexara/shared';

interface StealVictimModalProps {
  victimIds: string[];
  players: Record<string, PlayerState>;
  activePlayerName: string;
  onSteal: (victimId: string) => void;
}

const PLAYER_THEME: { color: string; avatar: string }[] = [
  { color: '#dc2626', avatar: '🧔' },
  { color: '#2563eb', avatar: '🏹' },
  { color: '#d97706', avatar: '🦙' },
  { color: '#059669', avatar: '👑' },
];

const totalCards = (resources: Record<ResourceType, number>) =>
  Object.values(resources).reduce((a, b) => a + b, 0);

export const StealVictimModal: React.FC<StealVictimModalProps> = ({
  victimIds,
  players,
  activePlayerName,
  onSteal,
}) => {
  // playerOrder index used for consistent theme colours
  const playerOrder = Object.keys(players);

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#1a0a2e] via-[#100620] to-[#080415] border-2 border-purple-600/80 rounded-2xl shadow-[0_0_60px_rgba(147,51,234,0.5)] overflow-hidden">

        {/* Header stripe */}
        <div className="h-1 bg-gradient-to-r from-purple-800 via-purple-400 to-purple-800 animate-pulse" />

        {/* Icon + title */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-500 flex items-center justify-center">
            <Sword className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-purple-200">
              Steal a Resource
            </h2>
            <p className="text-[11px] text-purple-300/70">
              {activePlayerName}, choose who to steal from
            </p>
          </div>
        </div>

        {/* Victims list */}
        <div className="px-5 pb-5 space-y-2">
          {victimIds.map((vid) => {
            const p = players[vid];
            if (!p) return null;
            const idx = playerOrder.indexOf(vid);
            const theme = PLAYER_THEME[idx % PLAYER_THEME.length];
            const cardCount = totalCards(p.resources as Record<ResourceType, number>);

            return (
              <button
                key={vid}
                onClick={() => onSteal(vid)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-700/50 bg-purple-950/60 hover:bg-purple-800/60 hover:border-purple-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
              >
                {/* Avatar dot */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-md border-2 border-white/20 flex-shrink-0"
                  style={{ backgroundColor: theme.color + '33', borderColor: theme.color }}
                >
                  {theme.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-purple-100 truncate">{p.username}</div>
                  <div className="text-[11px] text-purple-300/70">
                    {cardCount} resource card{cardCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Steal badge */}
                <div className="flex-shrink-0 px-3 py-1 rounded-lg bg-purple-700/70 border border-purple-500/60 text-xs font-black text-purple-200 uppercase tracking-wide">
                  Steal
                </div>
              </button>
            );
          })}

          {victimIds.length === 0 && (
            <div className="text-center py-4 text-purple-300/60 text-sm font-bold">
              No players to steal from on this hex.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
