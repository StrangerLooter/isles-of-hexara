'use client';

import React, { useState } from 'react';
import { X, Sword, Shield, Sprout, Coins, Star } from 'lucide-react';
import { DevCardType, ResourceType } from '@hexara/shared';
import { RESOURCE_TYPES } from '@hexara/shared';

interface DevCardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  devCards: DevCardType[];
  canPlay: boolean; // false if not MAIN phase or not your turn
  onPlay: (card: DevCardType, params?: DevCardParams) => void;
}

export interface DevCardParams {
  monopolyResource?: ResourceType;
  yearOfPlentyResources?: [ResourceType, ResourceType];
  targetHexId?: string;
}

const CARD_META: Record<DevCardType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  border: string;
  desc: string;
  needsDialog: boolean;
}> = {
  knight: {
    label: 'Knight',
    icon: <Sword className="w-6 h-6" />,
    color: 'text-red-300',
    bgGradient: 'from-red-950 to-red-900',
    border: 'border-red-600/60',
    desc: 'Move the Robber & steal a resource',
    needsDialog: false,
  },
  road_building: {
    label: 'Road Building',
    icon: <span className="text-2xl">🛤️</span>,
    color: 'text-amber-300',
    bgGradient: 'from-amber-950 to-amber-900',
    border: 'border-amber-600/60',
    desc: 'Place 2 roads for free',
    needsDialog: false,
  },
  year_of_plenty: {
    label: 'Year of Plenty',
    icon: <Sprout className="w-6 h-6" />,
    color: 'text-green-300',
    bgGradient: 'from-green-950 to-green-900',
    border: 'border-green-600/60',
    desc: 'Take any 2 resources from the bank',
    needsDialog: true,
  },
  monopoly: {
    label: 'Monopoly',
    icon: <Coins className="w-6 h-6" />,
    color: 'text-purple-300',
    bgGradient: 'from-purple-950 to-purple-900',
    border: 'border-purple-600/60',
    desc: 'Seize all of one resource from all players',
    needsDialog: true,
  },
  victory_point: {
    label: 'Victory Point',
    icon: <Star className="w-6 h-6" />,
    color: 'text-yellow-300',
    bgGradient: 'from-yellow-950 to-yellow-900',
    border: 'border-yellow-600/60',
    desc: '+1 Victory Point (revealed on win)',
    needsDialog: false,
  },
};

const RESOURCE_ICONS: Record<ResourceType, string> = {
  lumber: '🪵',
  brick: '🧱',
  wool: '🐑',
  grain: '🌾',
  ore: '⛰️',
};

// ─── Sub-dialogs ────────────────────────────────────────────────────────────

const MonopolyDialog: React.FC<{
  onConfirm: (res: ResourceType) => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<ResourceType>('lumber');
  return (
    <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#2a0a3a] to-[#14051f] border-2 border-purple-600/80 rounded-2xl p-5 shadow-[0_0_60px_rgba(147,51,234,0.5)]">
        <h3 className="text-base font-black uppercase tracking-wider text-purple-200 mb-1 flex items-center gap-2">
          <Coins className="w-5 h-5" /> Monopoly — Pick Resource
        </h3>
        <p className="text-[11px] text-purple-300/70 mb-4">Seize ALL of this resource from every opponent</p>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {RESOURCE_TYPES.map((res) => (
            <button
              key={res}
              onClick={() => setSelected(res)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                selected === res
                  ? 'border-purple-400 bg-purple-700/60 scale-105 shadow-[0_0_12px_rgba(147,51,234,0.8)]'
                  : 'border-purple-900/40 bg-purple-950/40 hover:border-purple-600'
              }`}
            >
              <span className="text-2xl">{RESOURCE_ICONS[res]}</span>
              <span className="text-[9px] font-bold text-purple-300 uppercase capitalize">{res}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-bold text-purple-300/70 hover:text-white border border-purple-900/40 hover:border-purple-600 transition-all">
            Cancel
          </button>
          <button onClick={() => onConfirm(selected)} className="flex-1 py-2 rounded-xl bg-gradient-to-b from-purple-600 to-purple-800 border border-purple-400 text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all">
            Seize {selected}!
          </button>
        </div>
      </div>
    </div>
  );
};

const YearOfPlentyDialog: React.FC<{
  onConfirm: (res1: ResourceType, res2: ResourceType) => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [picks, setPicks] = useState<ResourceType[]>([]);

  const toggle = (res: ResourceType) => {
    setPicks((prev) => {
      if (prev.includes(res) && prev.lastIndexOf(res) !== -1) {
        // remove one occurrence
        const idx = prev.lastIndexOf(res);
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      if (prev.length < 2) return [...prev, res];
      return prev;
    });
  };

  const countOf = (res: ResourceType) => picks.filter((r) => r === res).length;

  return (
    <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#0a2a12] to-[#051408] border-2 border-green-600/80 rounded-2xl p-5 shadow-[0_0_60px_rgba(34,197,94,0.5)]">
        <h3 className="text-base font-black uppercase tracking-wider text-green-200 mb-1 flex items-center gap-2">
          <Sprout className="w-5 h-5" /> Year of Plenty
        </h3>
        <p className="text-[11px] text-green-300/70 mb-4">
          Take any 2 resources from the bank ({picks.length}/2 selected)
        </p>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {RESOURCE_TYPES.map((res) => {
            const cnt = countOf(res);
            return (
              <button
                key={res}
                onClick={() => toggle(res)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all relative ${
                  cnt > 0
                    ? 'border-green-400 bg-green-700/60 scale-105 shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                    : 'border-green-900/40 bg-green-950/40 hover:border-green-600'
                }`}
              >
                <span className="text-2xl">{RESOURCE_ICONS[res]}</span>
                <span className="text-[9px] font-bold text-green-300 uppercase capitalize">{res}</span>
                {cnt > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-green-400 text-black text-[10px] font-black flex items-center justify-center">
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-xs font-bold text-green-300/70 hover:text-white border border-green-900/40 hover:border-green-600 transition-all">
            Cancel
          </button>
          <button
            disabled={picks.length !== 2}
            onClick={() => onConfirm(picks[0] as ResourceType, picks[1] as ResourceType)}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
              picks.length === 2
                ? 'bg-gradient-to-b from-green-600 to-green-800 border-green-400 text-white hover:brightness-110'
                : 'bg-green-950/40 border-green-900/40 text-green-400/40 cursor-not-allowed'
            }`}
          >
            {picks.length === 2 ? 'Take Resources!' : `Pick ${2 - picks.length} more`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Panel ─────────────────────────────────────────────────────────────

export const DevCardPanel: React.FC<DevCardPanelProps> = ({
  isOpen,
  onClose,
  devCards,
  canPlay,
  onPlay,
}) => {
  const [pendingCard, setPendingCard] = useState<DevCardType | null>(null);

  if (!isOpen) return null;

  // Count unique cards
  const cardCounts: Partial<Record<DevCardType, number>> = {};
  for (const c of devCards) {
    cardCounts[c] = (cardCounts[c] ?? 0) + 1;
  }

  const uniqueCards = Object.entries(cardCounts) as [DevCardType, number][];

  const handlePlay = (card: DevCardType) => {
    const meta = CARD_META[card];
    if (meta.needsDialog) {
      setPendingCard(card);
    } else {
      onPlay(card);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[65] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-sm bg-gradient-to-b from-[#1a1025] via-[#100a1a] to-[#080510] border-2 border-violet-600/70 rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.4)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-violet-600/30 bg-violet-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-violet-200">
                  Development Cards
                </h3>
                <p className="text-[10px] text-violet-300/60">{devCards.length} card{devCards.length !== 1 ? 's' : ''} in hand</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-violet-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cards list */}
          <div className="px-4 py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {devCards.length === 0 && (
              <div className="text-center py-6 text-violet-300/50 text-sm font-bold">
                No development cards in hand.
              </div>
            )}
            {uniqueCards.map(([card, count]) => {
              const meta = CARD_META[card];
              const isVP = card === 'victory_point';
              return (
                <div
                  key={card}
                  className={`flex items-center justify-between p-3.5 rounded-xl border bg-gradient-to-r ${meta.bgGradient} ${meta.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${meta.color} flex-shrink-0`}>{meta.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                        {count > 1 && (
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-white">
                            ×{count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-200/60 mt-0.5">{meta.desc}</p>
                    </div>
                  </div>

                  <button
                    disabled={!canPlay || isVP}
                    onClick={() => handlePlay(card)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      canPlay && !isVP
                        ? 'bg-gradient-to-b from-violet-500 to-violet-700 border border-violet-300 text-white hover:brightness-110 hover:scale-105 active:scale-95 shadow-md'
                        : 'bg-black/40 border border-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {isVP ? 'Hidden' : !canPlay ? 'Wait' : 'Play'}
                  </button>
                </div>
              );
            })}

            {!canPlay && devCards.length > 0 && (
              <p className="text-center text-[11px] text-violet-300/50 pt-2">
                Dev cards can only be played during your MAIN turn phase
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sub-dialogs */}
      {pendingCard === 'monopoly' && (
        <MonopolyDialog
          onConfirm={(res) => {
            onPlay('monopoly', { monopolyResource: res });
            setPendingCard(null);
            onClose();
          }}
          onCancel={() => setPendingCard(null)}
        />
      )}
      {pendingCard === 'year_of_plenty' && (
        <YearOfPlentyDialog
          onConfirm={(r1, r2) => {
            onPlay('year_of_plenty', { yearOfPlentyResources: [r1, r2] });
            setPendingCard(null);
            onClose();
          }}
          onCancel={() => setPendingCard(null)}
        />
      )}
    </>
  );
};
