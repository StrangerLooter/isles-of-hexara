'use client';

import React from 'react';
import { Scroll, X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { BUILDING_COSTS } from '@hexara/shared';
import { useGameStore } from '../../store/gameStore';
import { soundManager } from '../../game/SoundManager';

interface BuyDevCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBuy: () => void;
}

export const BuyDevCardModal: React.FC<BuyDevCardModalProps> = ({
  isOpen,
  onClose,
  onConfirmBuy,
}) => {
  const { gameState, localPlayerId } = useGameStore();

  if (!isOpen || !gameState) return null;

  const player = gameState.players[localPlayerId];
  if (!player) return null;

  const cost = BUILDING_COSTS.dev_card; // { wool: 1, grain: 1, ore: 1 }
  const reqWool = cost.wool ?? 1;
  const reqGrain = cost.grain ?? 1;
  const reqOre = cost.ore ?? 1;
  const hasWool = (player.resources.wool ?? 0) >= reqWool;
  const hasGrain = (player.resources.grain ?? 0) >= reqGrain;
  const hasOre = (player.resources.ore ?? 0) >= reqOre;
  const canAfford = hasWool && hasGrain && hasOre;

  const remainingDeck = gameState.developmentDeck?.length ?? 0;
  const hasCardsRemaining = remainingDeck > 0;
  const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === localPlayerId;
  const isMainPhase = gameState.phase === 'MAIN';

  const canBuy = canAfford && hasCardsRemaining && isMyTurn && isMainPhase;

  const handleBuy = () => {
    if (!canBuy) {
      soundManager.playError();
      return;
    }
    soundManager.playDevCard();
    onConfirmBuy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150 select-none font-sans">
      <div className="w-full max-w-md bg-gradient-to-b from-[#2d1b0d] via-[#1a0f07] to-[#120703] border-3 border-amber-500 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.6)] text-center relative">
        {/* Close button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-amber-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Artwork Header Icon */}
        <div className="w-16 h-20 rounded-2xl bg-gradient-to-b from-purple-900 to-indigo-950 border-2 border-purple-400 mx-auto flex flex-col items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-4">
          <Scroll className="w-8 h-8 text-purple-300" />
          <span className="text-[9px] font-black uppercase text-purple-200 mt-1">Isle Deck</span>
        </div>

        <h3 className="text-xl font-black uppercase tracking-wider text-amber-100 font-serif mb-1">
          Buy Development Card
        </h3>
        <p className="text-xs text-amber-200/80 mb-4">
          Do you want to draw a secret development card from the island deck?
        </p>

        {/* Resource Cost Matrix */}
        <div className="p-4 bg-black/50 rounded-2xl border border-amber-600/40 mb-4">
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block mb-2.5">
            Required Resources:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {/* Wool */}
            <div
              className={`p-2 rounded-xl border flex flex-col items-center transition-all ${
                hasWool
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <span className="text-xl mb-0.5">🐑</span>
              <span className="text-[11px] font-bold">Wool ×1</span>
              <span className="text-[10px] font-mono opacity-80">
                ({player.resources.wool ?? 0}/1)
              </span>
            </div>

            {/* Grain */}
            <div
              className={`p-2 rounded-xl border flex flex-col items-center transition-all ${
                hasGrain
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <span className="text-xl mb-0.5">🌾</span>
              <span className="text-[11px] font-bold">Grain ×1</span>
              <span className="text-[10px] font-mono opacity-80">
                ({player.resources.grain ?? 0}/1)
              </span>
            </div>

            {/* Ore */}
            <div
              className={`p-2 rounded-xl border flex flex-col items-center transition-all ${
                hasOre
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <span className="text-xl mb-0.5">⛰️</span>
              <span className="text-[11px] font-bold">Ore ×1</span>
              <span className="text-[10px] font-mono opacity-80">
                ({player.resources.ore ?? 0}/1)
              </span>
            </div>
          </div>
        </div>

        {/* Deck Supply Status */}
        <div className="flex items-center justify-center gap-1.5 mb-6 text-xs">
          {hasCardsRemaining ? (
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {remainingDeck} cards remaining in the deck
            </span>
          ) : (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              No development cards remaining in deck.
            </span>
          )}
        </div>

        {/* Actions: CANCEL and BUY */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-black/60 hover:bg-stone-900 border border-stone-700 text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleBuy}
            disabled={!canBuy}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
              canBuy
                ? 'catan-btn-gold hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                : 'bg-black/60 border border-stone-800 text-stone-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{!canAfford ? 'Need Resources' : !hasCardsRemaining ? 'Deck Empty' : 'Confirm Buy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
