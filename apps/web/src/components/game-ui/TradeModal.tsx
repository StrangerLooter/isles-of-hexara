'use client';

import React, { useState } from 'react';
import { RESOURCE_TYPES, ResourceType } from '@hexara/shared';
import { ArrowRight, Ship, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface TradeModalProps {
  onBankTrade?: (giving: ResourceType, receiving: ResourceType) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ onBankTrade }) => {
  const { isTradeModalOpen, setTradeModalOpen, gameState, localPlayerId } = useGameStore();

  const [giving, setGiving] = useState<ResourceType>('lumber');
  const [receiving, setReceiving] = useState<ResourceType>('grain');

  if (!isTradeModalOpen || !gameState) return null;

  const player = gameState.players[localPlayerId];
  if (!player) return null;

  const hasEnoughGiving = (player.resources[giving] ?? 0) >= 4;
  const canTrade = hasEnoughGiving && giving !== receiving;

  const handleConfirm = () => {
    if (!canTrade) return;
    onBankTrade?.(giving, receiving);
    setTradeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="catan-card-dark w-full max-w-md rounded-2xl p-6 shadow-2xl border-2 border-amber-600/60">
        <div className="flex items-center justify-between mb-4 border-b border-amber-600/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black shadow">
              <Ship className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-amber-100">
              Merchant Fleet Trade
            </h3>
          </div>
          <button
            onClick={() => setTradeModalOpen(false)}
            className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-amber-200/80 mb-5">
          Trade with offshore merchant galleons at the maritime harbor rate of 4 identical resources for 1 of your choice.
        </p>

        <div className="flex items-center justify-between gap-3 mb-6 bg-[#170905]/80 p-4 rounded-xl border border-amber-800/40">
          {/* Giving 4 */}
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-300/80 block mb-1.5">
              Give (4 units)
            </label>
            <select
              value={giving}
              onChange={(e) => setGiving(e.target.value as ResourceType)}
              className="w-full bg-[#2b170c] border border-amber-600/50 text-amber-100 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-amber-400 capitalize"
            >
              {RESOURCE_TYPES.map((res) => (
                <option key={res} value={res}>
                  {res} ({player.resources[res] ?? 0} owned)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-5">
            <ArrowRight className="w-5 h-5 text-amber-400" />
          </div>

          {/* Receiving 1 */}
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
                  {res}
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
            onClick={handleConfirm}
            disabled={!canTrade}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
              canTrade
                ? 'catan-btn-gold cursor-pointer'
                : 'bg-[#241710] text-amber-200/40 border border-amber-900/40 cursor-not-allowed'
            }`}
          >
            {!hasEnoughGiving ? 'Need 4 Cards' : giving === receiving ? 'Pick Different' : 'Confirm Trade'}
          </button>
        </div>
      </div>
    </div>
  );
};
