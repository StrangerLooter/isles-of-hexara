'use client';

import React, { useState } from 'react';
import { RESOURCE_TYPES, ResourceType } from '@hexara/shared';
import { getMaritimeTradeRate } from '@hexara/game-core';
import { ArrowRight, Ship, Users, X, Plus, Minus, CheckCircle, Ban } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface TradeModalProps {
  onBankTrade?: (giving: ResourceType, receiving: ResourceType) => void;
  onProposeTrade?: (offer: Partial<Record<ResourceType, number>>, request: Partial<Record<ResourceType, number>>) => void;
  onCancelTrade?: () => void;
}

const RESOURCE_ICONS: Record<ResourceType, string> = {
  lumber: '🪵',
  brick: '🧱',
  wool: '🐑',
  grain: '🌾',
  ore: '⛰️',
};

export const TradeModal: React.FC<TradeModalProps> = ({
  onBankTrade,
  onProposeTrade,
  onCancelTrade,
}) => {
  const { isTradeModalOpen, setTradeModalOpen, gameState, localPlayerId } = useGameStore();

  const [activeTab, setActiveTab] = useState<'maritime' | 'player'>('maritime');

  // Maritime Trade State
  const [giving, setGiving] = useState<ResourceType>('lumber');
  const [receiving, setReceiving] = useState<ResourceType>('grain');

  // Player Trade State
  const [offer, setOffer] = useState<Record<ResourceType, number>>({
    lumber: 0,
    brick: 0,
    wool: 0,
    grain: 0,
    ore: 0,
  });

  const [request, setRequest] = useState<Record<ResourceType, number>>({
    lumber: 0,
    brick: 0,
    wool: 0,
    grain: 0,
    ore: 0,
  });

  React.useEffect(() => {
    if (!isTradeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setTradeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTradeModalOpen, setTradeModalOpen]);

  if (!isTradeModalOpen || !gameState) return null;

  const player = gameState.players[localPlayerId];
  if (!player) return null;

  const isTwoPlayer = gameState.playerOrder.length === 2;
  const otherPlayerId = gameState.playerOrder.find((id) => id !== localPlayerId);
  const otherPlayer = otherPlayerId ? gameState.players[otherPlayerId] : null;

  // Compute actual maritime trade rate using harbors
  const maritimeRate = getMaritimeTradeRate(gameState, localPlayerId, giving);
  const givingCount = player.resources[giving] ?? 0;
  const hasEnoughMaritime = givingCount >= maritimeRate;
  const canMaritimeTrade = hasEnoughMaritime && giving !== receiving;

  const handleMaritimeConfirm = () => {
    if (!canMaritimeTrade) return;
    onBankTrade?.(giving, receiving);
    setTradeModalOpen(false);
  };

  // Player Trade Calculations
  const totalOffered = Object.values(offer).reduce((sum, n) => sum + n, 0);
  const totalRequested = Object.values(request).reduce((sum, n) => sum + n, 0);
  const canPropose = totalOffered > 0 && totalRequested > 0;

  const handleAdjustOffer = (res: ResourceType, delta: number) => {
    const current = offer[res] || 0;
    const max = player.resources[res] || 0;
    const nextVal = Math.max(0, Math.min(max, current + delta));
    setOffer((prev) => ({ ...prev, [res]: nextVal }));
  };

  const handleAdjustRequest = (res: ResourceType, delta: number) => {
    const current = request[res] || 0;
    const nextVal = Math.max(0, current + delta);
    setRequest((prev) => ({ ...prev, [res]: nextVal }));
  };

  const handleProposeTrade = () => {
    if (!canPropose) return;
    const cleanOffer: Partial<Record<ResourceType, number>> = {};
    const cleanRequest: Partial<Record<ResourceType, number>> = {};

    for (const [res, count] of Object.entries(offer) as [ResourceType, number][]) {
      if (count > 0) cleanOffer[res] = count;
    }
    for (const [res, count] of Object.entries(request) as [ResourceType, number][]) {
      if (count > 0) cleanRequest[res] = count;
    }

    onProposeTrade?.(cleanOffer, cleanRequest);
    setTradeModalOpen(false);
  };

  const isMyActiveTrade = gameState.activeTrade?.fromPlayerId === localPlayerId;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="catan-card-dark w-full max-w-lg rounded-2xl p-6 shadow-2xl border-2 border-amber-600/70">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-amber-600/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 font-black shadow">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-amber-100">
                Trading House
              </h3>
              <p className="text-[10px] text-amber-300/70">Exchange resources via Merchant Harbors or Fellow Players</p>
            </div>
          </div>
          <button
            onClick={() => setTradeModalOpen(false)}
            className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 bg-[#1a0a06] rounded-xl border border-amber-900/60 mb-5">
          <button
            onClick={() => setActiveTab('maritime')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'maritime'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 shadow-md'
                : 'text-amber-200/60 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Ship className="w-4 h-4" /> Maritime / Bank
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 shadow-md'
                : 'text-amber-200/60 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" /> Player Trade
          </button>
        </div>

        {/* Tab 1: Maritime / Harbor Trade */}
        {activeTab === 'maritime' && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs text-amber-200/80 font-medium">
                Your Rate for <span className="font-bold uppercase text-amber-300">{giving}</span>:
              </span>
              <span
                className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  maritimeRate === 2
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : maritimeRate === 3
                    ? 'bg-sky-950 text-sky-300 border-sky-500'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                }`}
              >
                {maritimeRate === 2
                  ? '⚓ 2:1 Special Port'
                  : maritimeRate === 3
                  ? '⚓ 3:1 Generic Port'
                  : '🏛️ 4:1 Bank Rate'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 mb-6 bg-[#170905]/90 p-4 rounded-xl border border-amber-800/40">
              {/* Giving */}
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-300/80 block mb-1.5">
                  Give ({maritimeRate} units)
                </label>
                <select
                  value={giving}
                  onChange={(e) => setGiving(e.target.value as ResourceType)}
                  className="w-full bg-[#2b170c] border border-amber-600/50 text-amber-100 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-amber-400 capitalize"
                >
                  {RESOURCE_TYPES.map((res) => (
                    <option key={res} value={res}>
                      {RESOURCE_ICONS[res]} {res} ({player.resources[res] ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-5">
                <ArrowRight className="w-5 h-5 text-amber-400" />
              </div>

              {/* Receiving */}
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-300/80 block mb-1.5">
                  Receive (1 unit)
                </label>
                <select
                  value={receiving}
                  onChange={(e) => setReceiving(e.target.value as ResourceType)}
                  className="w-full bg-[#2b170c] border border-amber-600/50 text-amber-100 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-amber-400 capitalize"
                >
                  {RESOURCE_TYPES.map((res) => (
                    <option key={res} value={res} disabled={res === giving}>
                      {RESOURCE_ICONS[res]} {res}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTradeModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-amber-200/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleMaritimeConfirm}
                disabled={!canMaritimeTrade}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                  canMaritimeTrade
                    ? 'catan-btn-gold cursor-pointer hover:scale-105 active:scale-95'
                    : 'bg-[#241710] text-amber-200/40 border border-amber-900/40 cursor-not-allowed'
                }`}
              >
                {!hasEnoughMaritime
                  ? `Need ${maritimeRate} ${giving}`
                  : giving === receiving
                  ? 'Pick Different'
                  : `Trade ${maritimeRate} ${giving} → 1 ${receiving}`}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Player Trade Proposal */}
        {activeTab === 'player' && (
          <div>
            {isMyActiveTrade ? (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 text-center mb-4">
                <p className="text-xs font-bold text-amber-200 mb-2">You currently have an active trade offer pending with other players.</p>
                <button
                  onClick={() => {
                    onCancelTrade?.();
                    setTradeModalOpen(false);
                  }}
                  className="px-4 py-2 bg-red-900/60 hover:bg-red-800 border border-red-500 text-red-100 text-xs font-bold rounded-lg transition-all"
                >
                  Cancel Active Offer
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Offer Column */}
                  <div className="bg-[#170905]/90 p-3 rounded-xl border border-amber-800/40">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-2">
                      I Offer ({totalOffered})
                    </h4>
                    <div className="space-y-1.5">
                      {RESOURCE_TYPES.map((res) => {
                        const owned = player.resources[res] ?? 0;
                        const count = offer[res] || 0;
                        return (
                          <div key={res} className="flex items-center justify-between text-xs bg-black/40 px-2 py-1 rounded-lg">
                            <span className="flex items-center gap-1 text-amber-100 capitalize">
                              <span>{RESOURCE_ICONS[res]}</span> {res}
                              <span className="text-[10px] text-amber-300/50 font-mono">({owned})</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAdjustOffer(res, -1)}
                                disabled={count === 0}
                                className="w-5 h-5 rounded bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-200 disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold w-4 text-center text-amber-100">{count}</span>
                              <button
                                onClick={() => handleAdjustOffer(res, 1)}
                                disabled={count >= owned}
                                className="w-5 h-5 rounded bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-200 disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Request Column */}
                  <div className="bg-[#170905]/90 p-3 rounded-xl border border-amber-800/40">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-sky-400 mb-2">
                      I Want ({totalRequested})
                    </h4>
                    <div className="space-y-1.5">
                      {RESOURCE_TYPES.map((res) => {
                        const count = request[res] || 0;
                        return (
                          <div key={res} className="flex items-center justify-between text-xs bg-black/40 px-2 py-1 rounded-lg">
                            <span className="flex items-center gap-1 text-amber-100 capitalize">
                              <span>{RESOURCE_ICONS[res]}</span> {res}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAdjustRequest(res, -1)}
                                disabled={count === 0}
                                className="w-5 h-5 rounded bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-200 disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold w-4 text-center text-amber-100">{count}</span>
                              <button
                                onClick={() => handleAdjustRequest(res, 1)}
                                className="w-5 h-5 rounded bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-200"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setTradeModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-amber-200/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProposeTrade}
                    disabled={!canPropose}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                      canPropose
                        ? 'catan-btn-gold cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-[#241710] text-amber-200/40 border border-amber-900/40 cursor-not-allowed'
                    }`}
                  >
                    {totalOffered === 0
                      ? 'Select Offer'
                      : totalRequested === 0
                      ? 'Select Request'
                      : isTwoPlayer && otherPlayer
                      ? `Send Offer to ${otherPlayer.username}`
                      : 'Send Trade Offer'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
