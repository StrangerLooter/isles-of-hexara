'use client';

import React, { useState } from 'react';
import { X, Sword, Shield, Sprout, Coins, Star, Play, ZoomIn, Info } from 'lucide-react';
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
  roadBuildingEdges?: [string, string];
}

interface CardMetadata {
  label: string;
  imageSrc?: string;
  fallbackIcon: React.ReactNode;
  themeColor: string;
  borderGlow: string;
  desc: string;
  detailedEffect: string;
  needsDialog: boolean;
}

const CARD_META: Record<DevCardType, CardMetadata> = {
  knight: {
    label: 'Knight',
    imageSrc: '/cards/knight.jpg',
    fallbackIcon: <Sword className="w-6 h-6" />,
    themeColor: 'from-blue-900 to-indigo-950',
    borderGlow: 'border-blue-500/80 shadow-[0_0_25px_rgba(59,130,246,0.5)]',
    desc: 'Move the robber & steal 1 resource from adjacent settlement owner',
    detailedEffect:
      'Move the robber to any other hex. Steal 1 resource from the owner of a settlement or city adjacent to the robber’s new hex. 3 Knights qualify for Largest Army (+2 VP).',
    needsDialog: false,
  },
  road_building: {
    label: 'Road Building',
    imageSrc: '/cards/road_building.jpg',
    fallbackIcon: <span className="text-2xl">🛤️</span>,
    themeColor: 'from-emerald-900 to-green-950',
    borderGlow: 'border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.5)]',
    desc: 'Place 2 roads on paths for free without resource cost',
    detailedEffect:
      'When you play this card, you may immediately place 2 roads for free on legal paths attached to your network.',
    needsDialog: false,
  },
  year_of_plenty: {
    label: 'Year of Plenty',
    imageSrc: '/cards/year_of_plenty.jpg',
    fallbackIcon: <Sprout className="w-6 h-6" />,
    themeColor: 'from-teal-900 to-cyan-950',
    borderGlow: 'border-teal-500/80 shadow-[0_0_25px_rgba(20,184,166,0.5)]',
    desc: 'Take any 2 resources from the bank supply into your hand',
    detailedEffect:
      'Take any 2 resources of your choice from the bank supply. They can be 2 of the same resource or 2 different resources.',
    needsDialog: true,
  },
  monopoly: {
    label: 'Monopoly',
    imageSrc: '/cards/monopoly.jpg',
    fallbackIcon: <Coins className="w-6 h-6" />,
    themeColor: 'from-amber-900 to-amber-950',
    borderGlow: 'border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.5)]',
    desc: 'Announce 1 resource type: all opponents must surrender all of it',
    detailedEffect:
      'When you play this card, announce 1 type of resource. All other players must immediately give you all of their resources of that type.',
    needsDialog: true,
  },
  victory_point: {
    label: 'Victory Point',
    fallbackIcon: <Star className="w-6 h-6 text-yellow-400" />,
    themeColor: 'from-amber-950 to-yellow-950',
    borderGlow: 'border-yellow-500/80 shadow-[0_0_25px_rgba(234,179,8,0.5)]',
    desc: '+1 Victory Point (remains secret until game win)',
    detailedEffect:
      'Provides 1 hidden Victory Point. Kept face down until you reach the winning total required to claim victory.',
    needsDialog: false,
  },
};

const RESOURCE_ICONS: Record<ResourceType, { icon: string; name: string }> = {
  lumber: { icon: '🪵', name: 'Lumber' },
  brick: { icon: '🧱', name: 'Brick' },
  wool: { icon: '🐑', name: 'Wool' },
  grain: { icon: '🌾', name: 'Grain' },
  ore: { icon: '⛰️', name: 'Ore' },
};

// ─── Sub-Dialog: Monopoly Resource Seizure ────────────────────────────────────

const MonopolyDialog: React.FC<{
  onConfirm: (res: ResourceType) => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<ResourceType>('ore');

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full max-w-md bg-gradient-to-b from-[#2d1b0d] via-[#1a0f07] to-[#120703] border-3 border-amber-500 rounded-3xl p-6 shadow-[0_0_70px_rgba(245,158,11,0.6)] text-center">
        {/* Card Artwork Header Thumbnail */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-20 rounded-lg overflow-hidden border-2 border-amber-400 shadow-lg">
            <img
              src="/cards/monopoly.jpg"
              alt="Monopoly"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black uppercase tracking-wider text-amber-200">
              Monopoly Edict
            </h3>
            <p className="text-xs text-amber-300/70">Declare one resource to seize from all opponents</p>
          </div>
        </div>

        {/* 5 Resource Tiles */}
        <div className="grid grid-cols-5 gap-2 my-5">
          {RESOURCE_TYPES.map((res) => {
            const isSelected = selected === res;
            return (
              <button
                key={res}
                onClick={() => setSelected(res)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-amber-300 bg-gradient-to-b from-amber-600 to-amber-800 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.8)] text-white'
                    : 'border-amber-900/50 bg-[#24130c]/70 hover:border-amber-600 text-amber-200/80 hover:scale-102'
                }`}
              >
                <span className="text-3xl filter drop-shadow">{RESOURCE_ICONS[res].icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wide mt-1">
                  {RESOURCE_ICONS[res].name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-amber-300/70 hover:text-white border border-amber-900/60 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 py-2.5 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Claim All {RESOURCE_ICONS[selected].name}!
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-Dialog: Year of Plenty Bank Draw ─────────────────────────────────────

const YearOfPlentyDialog: React.FC<{
  onConfirm: (res1: ResourceType, res2: ResourceType) => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [picks, setPicks] = useState<ResourceType[]>([]);

  const toggle = (res: ResourceType) => {
    setPicks((prev) => {
      if (prev.includes(res)) {
        const idx = prev.lastIndexOf(res);
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      if (prev.length < 2) return [...prev, res];
      return prev;
    });
  };

  const countOf = (res: ResourceType) => picks.filter((r) => r === res).length;

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full max-w-md bg-gradient-to-b from-[#102d1d] via-[#091a10] to-[#040d08] border-3 border-emerald-500 rounded-3xl p-6 shadow-[0_0_70px_rgba(16,185,129,0.6)] text-center">
        {/* Card Artwork Header Thumbnail */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-20 rounded-lg overflow-hidden border-2 border-emerald-400 shadow-lg">
            <img
              src="/cards/year_of_plenty.jpg"
              alt="Year of Plenty"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black uppercase tracking-wider text-emerald-200">
              Year of Plenty
            </h3>
            <p className="text-xs text-emerald-300/70">
              Select any 2 resources from the bank ({picks.length}/2 picked)
            </p>
          </div>
        </div>

        {/* 5 Resource Tiles */}
        <div className="grid grid-cols-5 gap-2 my-5">
          {RESOURCE_TYPES.map((res) => {
            const cnt = countOf(res);
            return (
              <button
                key={res}
                onClick={() => toggle(res)}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ${
                  cnt > 0
                    ? 'border-emerald-300 bg-gradient-to-b from-emerald-600 to-emerald-800 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.8)] text-white'
                    : 'border-emerald-900/50 bg-[#07190e]/70 hover:border-emerald-600 text-emerald-200/80 hover:scale-102'
                }`}
              >
                <span className="text-3xl filter drop-shadow">{RESOURCE_ICONS[res].icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wide mt-1">
                  {RESOURCE_ICONS[res].name}
                </span>
                {cnt > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-300 text-black text-xs font-black flex items-center justify-center border-2 border-black shadow-md">
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-emerald-300/70 hover:text-white border border-emerald-900/60 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            disabled={picks.length !== 2}
            onClick={() => onConfirm(picks[0] as ResourceType, picks[1] as ResourceType)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
              picks.length === 2
                ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 text-white border-2 border-emerald-300 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-emerald-950/40 text-emerald-400/40 border border-emerald-900/40 cursor-not-allowed'
            }`}
          >
            {picks.length === 2 ? 'Harvest Resources!' : `Choose ${2 - picks.length} More`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Development Card Panel ─────────────────────────────────────────────

export const DevCardPanel: React.FC<DevCardPanelProps> = ({
  isOpen,
  onClose,
  devCards,
  canPlay,
  onPlay,
}) => {
  const [pendingCard, setPendingCard] = useState<DevCardType | null>(null);
  const [inspectedCard, setInspectedCard] = useState<DevCardType | null>(null);

  if (!isOpen) return null;

  // Aggregate counts per card type
  const cardCounts: Partial<Record<DevCardType, number>> = {};
  for (const c of devCards) {
    cardCounts[c] = (cardCounts[c] ?? 0) + 1;
  }
  const uniqueCards = Object.entries(cardCounts) as [DevCardType, number][];

  const handlePlayCard = (card: DevCardType) => {
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
      <div className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-3xl bg-gradient-to-b from-[#241309] via-[#170b05] to-[#0c0502] border-3 border-amber-600/80 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-700/40 bg-gradient-to-r from-amber-950/80 via-[#2a1308] to-amber-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg border border-amber-300">
                <Shield className="w-6 h-6 text-amber-950" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-amber-100 font-serif">
                  Development Cards
                </h2>
                <p className="text-[11px] text-amber-300/70">
                  {devCards.length} card{devCards.length !== 1 ? 's' : ''} currently held in hand
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-amber-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body: Card Hand Gallery */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {devCards.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400/50">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-200/80">
                  No Development Cards in Hand
                </h3>
                <p className="text-xs text-amber-300/50 mt-1 max-w-sm mx-auto">
                  Purchase Development Cards from the Build Menu for 1 Ore, 1 Wool, and 1 Grain to summon Knights, claim Monopolies, or harvest Plenty.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                {uniqueCards.map(([card, count]) => {
                  const meta = CARD_META[card];
                  const isVP = card === 'victory_point';
                  const canPlayThisCard = canPlay && !isVP;

                  return (
                    <div
                      key={card}
                      className="group relative flex flex-col rounded-2xl bg-[#1a0c06] border-2 border-amber-700/50 hover:border-amber-400 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(245,158,11,0.4)]"
                    >
                      {/* Card Image Frame (2:3 Aspect Ratio) */}
                      <div className="relative aspect-[2/3] w-full bg-[#120703] overflow-hidden">
                        {meta.imageSrc ? (
                          <img
                            src={meta.imageSrc}
                            alt={meta.label}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          /* Victory Point Custom Frame */
                          <div className="w-full h-full bg-gradient-to-b from-[#2a1708] via-[#1a0a03] to-[#0c0401] p-3 flex flex-col items-center justify-between border-b border-amber-500/30">
                            <div className="w-full text-center py-1 bg-amber-400/20 rounded-md border border-amber-400/40">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                                Victory Point
                              </span>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.8)] border-2 border-amber-200">
                              <Star className="w-9 h-9 text-amber-950 fill-amber-950" />
                            </div>
                            <span className="text-[10px] font-bold text-amber-200/80 text-center italic">
                              +1 Victory Point
                            </span>
                          </div>
                        )}

                        {/* Count Badge */}
                        {count > 1 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-xs font-black shadow-lg border border-white/60">
                            ×{count}
                          </div>
                        )}

                        {/* Quick Inspect Button Overlay */}
                        <button
                          onClick={() => setInspectedCard(card)}
                          className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                          title="Inspect Card Details"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Card Info & Play Button */}
                      <div className="p-3 flex flex-col justify-between flex-1 bg-gradient-to-b from-[#1e0e07] to-[#120703]">
                        <div className="mb-2">
                          <h4 className="text-xs font-black uppercase text-amber-100 tracking-wide">
                            {meta.label}
                          </h4>
                          <p className="text-[10px] text-amber-300/60 leading-tight mt-0.5 line-clamp-2">
                            {meta.desc}
                          </p>
                        </div>

                        <button
                          disabled={!canPlayThisCard}
                          onClick={() => handlePlayCard(card)}
                          className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                            canPlayThisCard
                              ? 'catan-btn-gold cursor-pointer hover:scale-102 active:scale-95'
                              : 'bg-black/50 text-white/30 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {isVP ? (
                            'Hidden (+1 VP)'
                          ) : !canPlay ? (
                            'Wait Turn'
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" /> Play Card
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Guide Note */}
          <div className="px-6 py-3 border-t border-amber-800/40 bg-black/40 text-center">
            <p className="text-[11px] text-amber-300/60">
              💡 Development cards can be played at any point during your main turn phase before or after building/trading.
            </p>
          </div>
        </div>
      </div>

      {/* Card Inspection Modal */}
      {inspectedCard && (
        <div className="fixed inset-0 z-[85] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-sm w-full bg-[#1c0c04] border-3 border-amber-500 rounded-3xl p-5 shadow-[0_0_80px_rgba(245,158,11,0.6)] text-center">
            <button
              onClick={() => setInspectedCard(null)}
              className="absolute top-3 right-3 p-1.5 text-amber-400 hover:text-white rounded-lg bg-black/50 hover:bg-black transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-48 aspect-[2/3] mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl mb-4">
              {CARD_META[inspectedCard].imageSrc ? (
                <img
                  src={CARD_META[inspectedCard].imageSrc}
                  alt={CARD_META[inspectedCard].label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-[#2a1708] via-[#1a0a03] to-[#0c0401] p-4 flex flex-col items-center justify-center gap-3">
                  <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 animate-pulse" />
                  <span className="text-sm font-black uppercase text-amber-200">Victory Point</span>
                </div>
              )}
            </div>

            <h3 className="text-base font-black uppercase tracking-wider text-amber-100 mb-1">
              {CARD_META[inspectedCard].label}
            </h3>
            <p className="text-xs text-amber-200/80 leading-relaxed mb-4">
              {CARD_META[inspectedCard].detailedEffect}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setInspectedCard(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-amber-300/70 hover:text-white border border-amber-900/60 transition-all"
              >
                Close
              </button>
              {canPlay && inspectedCard !== 'victory_point' && (
                <button
                  onClick={() => {
                    const card = inspectedCard;
                    setInspectedCard(null);
                    handlePlayCard(card);
                  }}
                  className="flex-1 py-2.5 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  Play Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Dialogs */}
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
