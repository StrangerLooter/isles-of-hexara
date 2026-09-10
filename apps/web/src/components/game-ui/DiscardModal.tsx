'use client';

import React, { useState, useMemo } from 'react';
import { RESOURCE_TYPES, ResourceType } from '@hexara/shared';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';

const RESOURCE_ICONS: Record<ResourceType, { emoji: string; label: string; color: string }> = {
  lumber: { emoji: '🪵', label: 'Lumber',  color: '#4ade80' },
  brick:  { emoji: '🧱', label: 'Brick',   color: '#f87171' },
  wool:   { emoji: '🐑', label: 'Wool',    color: '#e2e8f0' },
  grain:  { emoji: '🌾', label: 'Grain',   color: '#fbbf24' },
  ore:    { emoji: '⛰️', label: 'Ore',     color: '#94a3b8' },
};

interface DiscardModalProps {
  /** Total hand cards this player holds */
  handCounts: Record<ResourceType, number>;
  /** How many cards must be discarded */
  requiredDiscard: number;
  onConfirm: (discards: Record<ResourceType, number>) => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({
  handCounts,
  requiredDiscard,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<Record<ResourceType, number>>({
    lumber: 0,
    brick:  0,
    wool:   0,
    grain:  0,
    ore:    0,
  });

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((s, v) => s + v, 0),
    [selected]
  );

  const remaining = requiredDiscard - totalSelected;
  const isValid = totalSelected === requiredDiscard;

  const adjust = (res: ResourceType, delta: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      const newVal = next[res] + delta;
      // clamp between 0 and available hand count
      if (newVal < 0 || newVal > handCounts[res]) return prev;
      // don't exceed required
      if (delta > 0 && totalSelected >= requiredDiscard) return prev;
      next[res] = newVal;
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#3a0c0c] via-[#200808] to-[#120404] border-2 border-red-600/80 rounded-2xl shadow-[0_0_60px_rgba(220,38,38,0.5)] overflow-hidden">

        {/* Pulsing red top stripe */}
        <div className="h-1 bg-gradient-to-r from-red-700 via-red-400 to-red-700 animate-pulse" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-10 h-10 rounded-xl bg-red-900/80 border border-red-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-red-200">
              Discard Required!
            </h2>
            <p className="text-[11px] text-red-300/70">
              A 7 was rolled — you must discard cards (hand &gt; 7)
            </p>
          </div>
        </div>

        {/* Discard counter pill */}
        <div className="mx-5 mb-4 px-4 py-2 rounded-xl bg-black/50 border border-red-700/50 flex items-center justify-between">
          <span className="text-xs font-bold text-red-300/80">Cards to discard:</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black font-mono ${remaining > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {remaining > 0 ? `-${remaining}` : '✓ Ready'}
            </span>
          </div>
        </div>

        {/* Resource rows */}
        <div className="px-5 space-y-2 pb-4">
          {RESOURCE_TYPES.map((res) => {
            const info = RESOURCE_ICONS[res];
            const owned = handCounts[res];
            const discarding = selected[res];
            if (owned === 0) return null;
            return (
              <div
                key={res}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-black/40 border border-red-900/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{info.emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-amber-100">{info.label}</div>
                    <div className="text-[10px] text-amber-300/60">Have: {owned}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjust(res, -1)}
                    disabled={discarding === 0}
                    className="w-7 h-7 rounded-lg bg-red-900/60 border border-red-700/60 text-red-300 flex items-center justify-center hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className={`w-7 text-center text-sm font-black font-mono ${discarding > 0 ? 'text-red-400' : 'text-amber-200/50'}`}>
                    {discarding}
                  </span>
                  <button
                    onClick={() => adjust(res, +1)}
                    disabled={discarding >= owned || totalSelected >= requiredDiscard}
                    className="w-7 h-7 rounded-lg bg-amber-900/60 border border-amber-700/60 text-amber-300 flex items-center justify-center hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="px-5 pb-5">
          <button
            onClick={() => onConfirm(selected as Record<ResourceType, number>)}
            disabled={!isValid}
            className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isValid
                ? 'bg-gradient-to-b from-red-600 via-red-700 to-red-800 border border-red-400 text-white hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-red-950/60 border border-red-900/40 text-red-400/40 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {isValid
              ? `Discard ${requiredDiscard} Cards`
              : `Select ${remaining} more card${remaining !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};
