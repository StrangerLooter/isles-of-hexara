'use client';

import React from 'react';
import { PlayerState } from '@hexara/game-core';
import { Bot, User, Crown, Dices } from 'lucide-react';

interface PlayerRibbonCardProps {
  player: PlayerState;
  isActive: boolean;
  isLocal: boolean;
  avatarIcon?: string;
  themeColor?: string;
  reactionEmoji?: string | null;
}

export const PlayerRibbonCard: React.FC<PlayerRibbonCardProps> = ({
  player,
  isActive,
  isLocal,
  avatarIcon,
  themeColor,
  reactionEmoji,
}) => {
  const totalResources = Object.values(player.resources).reduce((a, b) => a + b, 0);
  const totalDevCards = player.devCards?.length || 0;
  const ribbonColor = themeColor || player.color || '#d97706';

  const getAvatarEmoji = () => {
    if (avatarIcon) return avatarIcon;
    const name = player.username.toLowerCase();
    if (name.includes('amber') || name.includes('mia')) return '🦙';
    if (name.includes('drake') || name.includes('nassir')) return '⚔️';
    if (name.includes('anne') || name.includes('jean')) return '🏹';
    if (name.includes('silver') || name.includes('candamir')) return '🧔';
    return player.isAi ? '🤖' : '🧑‍✈️';
  };

  return (
    <div className="relative flex flex-col items-start select-none transition-all duration-300">
      {/* Floating Reaction Emoji above Avatar */}
      {reactionEmoji && (
        <div className="absolute -top-10 left-6 text-3xl animate-bounce z-40 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          {reactionEmoji}
        </div>
      )}

      {/* Main Player HUD Card matching Reference Images 4, 8 */}
      <div
        className={`relative flex items-center p-2 rounded-xl transition-all duration-300 shadow-xl border ${
          isActive
            ? 'ring-2 ring-amber-400 border-amber-300 scale-105 shadow-[0_0_25px_rgba(245,158,11,0.7)]'
            : 'border-amber-950/60 hover:brightness-110'
        }`}
        style={{
          background: `linear-gradient(135deg, ${ribbonColor}cc 0%, #1e0a0a 100%)`,
          minWidth: '190px',
        }}
      >
        {/* Active Turn Indicator Badge */}
        {isActive && (
          <div className="absolute -top-2.5 -right-2.5 bg-amber-400 text-amber-950 p-1 rounded-full shadow-lg border border-amber-200 animate-spin">
            <Dices className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Avatar Portrait Square */}
        <div
          className="w-11 h-11 rounded-lg bg-[#24130c]/90 border-2 flex items-center justify-center shadow-inner mr-2.5 flex-shrink-0 relative overflow-hidden"
          style={{ borderColor: ribbonColor }}
        >
          <span className="text-2xl filter drop-shadow">{getAvatarEmoji()}</span>
          {(player.largestArmy || player.longestRoad) && (
            <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 text-[8px] shadow">
              <Crown className="w-3 h-3 text-amber-950" />
            </div>
          )}
        </div>

        {/* Player Name and Stats Grid */}
        <div className="flex-1 flex flex-col text-left justify-center">
          {/* Top Row: Name + Local/AI badge + VP */}
          <div className="flex items-center justify-between gap-1 leading-tight mb-1">
            <div className="flex items-center gap-1 truncate max-w-[95px]">
              <span className="text-xs font-black text-white drop-shadow font-serif">
                {player.username}
              </span>
              {isLocal && (
                <span className="text-[7px] font-black uppercase px-1 py-0.2 bg-amber-400 text-slate-950 rounded font-mono shadow-sm">
                  YOU
                </span>
              )}
            </div>

            {/* Victory Points Trophy */}
            <div className="flex items-center gap-0.5 text-xs font-black text-amber-300 drop-shadow">
              <span>{player.victoryPoints}</span>
              <span className="text-[11px]">🏆</span>
            </div>
          </div>

          {/* Stats Grid Icons: Knights, Road, Cards matching Image 8 */}
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-gray-200 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
            <span title="Knights Played" className="flex items-center gap-0.5">
              ⚔️{player.playedKnights || 0}
            </span>
            <span title="Road Segments Built" className="flex items-center gap-0.5">
              🛣️{15 - player.roadsRemaining}
            </span>
            <span title="Resource Cards Held" className="flex items-center gap-0.5">
              🂠{totalResources}
            </span>
            <span title="Development Cards Held" className="flex items-center gap-0.5">
              🂡{totalDevCards}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
