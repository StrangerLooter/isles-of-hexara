'use client';

import React from 'react';
import { ActiveTrade, PlayerState, ResourceType } from '@hexara/game-core';
import { Handshake, Check, X } from 'lucide-react';

interface TradeOfferNotificationProps {
  activeTrade: ActiveTrade | null;
  players: Record<string, PlayerState>;
  localPlayerId: string;
  onAccept: () => void;
  onDecline?: () => void;
}

const RESOURCE_ICONS: Record<ResourceType, string> = {
  lumber: '🪵',
  brick: '🧱',
  wool: '🐑',
  grain: '🌾',
  ore: '⛰️',
};

export const TradeOfferNotification: React.FC<TradeOfferNotificationProps> = ({
  activeTrade,
  players,
  localPlayerId,
  onAccept,
  onDecline,
}) => {
  if (!activeTrade) return null;
  if (activeTrade.fromPlayerId === localPlayerId) return null;

  const fromPlayer = players[activeTrade.fromPlayerId];
  const localPlayer = players[localPlayerId];
  if (!fromPlayer || !localPlayer) return null;

  // Check if local player has the requested cards
  let hasRequestedResources = true;
  for (const [res, count] of Object.entries(activeTrade.request) as [ResourceType, number][]) {
    if ((localPlayer.resources[res] ?? 0) < (count ?? 0)) {
      hasRequestedResources = false;
      break;
    }
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-200">
      <div className="bg-gradient-to-r from-[#2a1308] via-[#1c0c04] to-[#2a1308] border-2 border-amber-500 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-4 max-w-lg backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-black flex-shrink-0 shadow">
          <Handshake className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-black uppercase text-amber-200">{fromPlayer.username}</span>
            <span className="text-[10px] text-amber-300/70">offers a trade:</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Gives */}
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              Gives:
              {Object.entries(activeTrade.offer).map(([res, cnt]) => (
                <span key={res} className="bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[11px] text-white font-mono">
                  {RESOURCE_ICONS[res as ResourceType]} {cnt} {res}
                </span>
              ))}
            </span>

            <span className="text-amber-400 font-black">↔</span>

            {/* Wants */}
            <span className="text-sky-400 font-bold flex items-center gap-1">
              Wants:
              {Object.entries(activeTrade.request).map(([res, cnt]) => (
                <span key={res} className="bg-sky-950/80 border border-sky-500/40 px-1.5 py-0.5 rounded text-[11px] text-white font-mono">
                  {RESOURCE_ICONS[res as ResourceType]} {cnt} {res}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onAccept}
            disabled={!hasRequestedResources}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition-all ${
              hasRequestedResources
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white border border-emerald-300 hover:brightness-110 shadow-md active:scale-95'
                : 'bg-black/50 text-white/30 border border-white/10 cursor-not-allowed'
            }`}
            title={hasRequestedResources ? 'Accept Trade' : 'Missing Requested Resources'}
          >
            <Check className="w-4 h-4 stroke-[3]" /> Accept
          </button>
          {onDecline && (
            <button
              onClick={onDecline}
              className="p-2 rounded-xl bg-black/40 hover:bg-black/70 text-amber-300/70 hover:text-white border border-amber-800/40 transition-all"
              title="Decline"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
