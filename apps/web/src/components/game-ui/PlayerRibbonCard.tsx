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
  layout?: 'sidebar' | 'mobile' | 'ribbon' | 'catan-top';
}

export const PlayerRibbonCard: React.FC<PlayerRibbonCardProps> = ({
  player,
  isActive,
  isLocal,
  avatarIcon,
  themeColor,
  reactionEmoji,
  layout = 'ribbon',
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

  if (layout === 'catan-top') {
    return (
      <div
        className={`relative flex items-center h-10 sm:h-11 px-2.5 rounded-xl border-2 transition-all duration-300 shadow-md ${
          isActive
            ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-20'
            : 'border-[#3a2012]/80 bg-[#160c07]/90 hover:border-amber-700/60 opacity-90 hover:opacity-100'
        }`}
        style={{
          backgroundColor: isActive ? '#241209' : '#140a05',
          borderColor: isActive ? ribbonColor : undefined,
        }}
      >
        {/* Floating reaction */}
        {reactionEmoji && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce z-50">
            {reactionEmoji}
          </div>
        )}

        {/* Color Swatch block on left */}
        <div
          className="w-3.5 h-6 rounded-md mr-2 shadow-inner border border-white/20 shrink-0"
          style={{ backgroundColor: ribbonColor }}
        />

        {/* Avatar / Bot icon */}
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <span className="text-base">{getAvatarEmoji()}</span>
          {player.isAi && <span className="text-[10px] text-stone-400">🤖</span>}
        </div>

        {/* Username + Local badge */}
        <div className="flex items-center gap-1 min-w-0 mr-2">
          <span className="text-xs font-black text-white font-serif truncate max-w-[70px] sm:max-w-[100px]">
            {player.username}
          </span>
          {isLocal && (
            <span className="text-[7px] font-black uppercase px-1 py-0.2 bg-amber-400 text-slate-950 rounded font-mono shrink-0">
              YOU
            </span>
          )}
        </div>

        {/* Mini stats: Resources & Dev Cards */}
        <div className="hidden sm:flex items-center gap-1.5 mr-2 text-[10px] font-mono font-bold text-amber-200/70 shrink-0">
          <span title="Resource Cards">🪵{totalResources}</span>
          <span title="Development Cards">🎴{totalDevCards}</span>
        </div>

        {/* VP Trophy Badge */}
        <div
          className="flex items-center gap-1 ml-auto text-xs font-black font-mono shrink-0 px-2 py-0.5 rounded-lg border shadow-inner"
          style={{
            color: ribbonColor,
            borderColor: `${ribbonColor}55`,
            backgroundColor: `${ribbonColor}18`,
          }}
        >
          <span>{player.victoryPoints}</span>
          <span className="text-xs">🏆</span>
        </div>

        {/* Crown for Longest Road / Largest Army */}
        {(player.longestRoad || player.largestArmy) && (
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-current ml-1 shrink-0" />
        )}
      </div>
    );
  }

  if (layout === 'sidebar') {
    return (
      <div
        className={`w-full p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-between border-2 shadow-lg ${
          isActive
            ? 'border-amber-400 bg-gradient-to-r from-amber-950/90 via-[#3a1d12] to-black/90 shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-1 ring-amber-300 scale-[1.02]'
            : 'border-amber-900/40 bg-black/60 hover:border-amber-700/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 shadow shrink-0"
            style={{ borderColor: ribbonColor, backgroundColor: `${ribbonColor}33` }}
          >
            <span>{getAvatarEmoji()}</span>
          </div>
          <div className="flex flex-col text-left truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-100 font-serif truncate">
                {player.username}
              </span>
              {isLocal && (
                <span className="text-[7px] font-black uppercase px-1 py-0.2 bg-amber-400 text-slate-950 rounded font-mono shrink-0">
                  YOU
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-400/90">
              {player.victoryPoints} VP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {(player.longestRoad || player.largestArmy) && (
            <Crown className="w-4 h-4 text-amber-400 fill-current" />
          )}
          {isActive && (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>
      </div>
    );
  }

  if (layout === 'mobile') {
    return (
      <div
        className={`px-2.5 py-1.5 rounded-xl border-2 flex items-center gap-2 transition-all shadow-md shrink-0 ${
          isActive
            ? 'border-amber-400 bg-gradient-to-b from-amber-950 via-[#3a1d12] to-black shadow-[0_0_15px_rgba(245,158,11,0.7)] scale-105'
            : 'border-amber-900/40 bg-black/60'
        }`}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs border shadow shrink-0"
          style={{ borderColor: ribbonColor, backgroundColor: `${ribbonColor}33` }}
        >
          {getAvatarEmoji()}
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-black text-amber-100 font-serif truncate max-w-[65px]">
            {player.username.split(' ')[0]}
          </span>
          <span className="text-[9px] font-mono font-black text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ribbonColor }} />
            {player.victoryPoints} VP
          </span>
        </div>
      </div>
    );
  }

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

          {/* Longest Road / Largest Army Special Honors */}
          {(player.longestRoad || player.largestArmy) && (
            <div className="flex items-center gap-1 mt-1">
              {player.longestRoad && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black border border-amber-200 shadow-sm animate-pulse">
                  🛤️ Longest Road
                </span>
              )}
              {player.largestArmy && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500 text-white border border-red-300 shadow-sm animate-pulse">
                  ⚔️ Largest Army
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
