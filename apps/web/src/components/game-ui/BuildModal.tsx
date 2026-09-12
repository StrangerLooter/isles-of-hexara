'use client';

import React from 'react';
import { BUILDING_COSTS, BuildingType } from '@hexara/shared';
import { Hammer, Home, Landmark, Scroll, X, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { BuyDevCardModal } from './BuyDevCardModal';

interface BuildModalProps {
  onBuyDevCard?: () => void;
}

export const BuildModal: React.FC<BuildModalProps> = ({ onBuyDevCard }) => {
  const {
    isBuildModalOpen,
    setBuildModalOpen,
    gameState,
    localPlayerId,
    setBuildMode,
  } = useGameStore();

  const [isBuyModalOpen, setBuyModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isBuildModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setBuildModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBuildModalOpen, setBuildModalOpen]);

  if (!isBuildModalOpen || !gameState) return null;

  const player = gameState.players[localPlayerId];
  if (!player) return null;

  const isMainPhase = gameState.phase === 'MAIN';
  const isSetup = gameState.phase.startsWith('SETUP');
  const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === localPlayerId;

  const items: {
    type: BuildingType | 'dev_card';
    label: string;
    icon: React.ReactNode;
    cost: Record<string, number>;
    remaining: number;
    description: string;
  }[] = [
    {
      type: 'road',
      label: 'Coastal Road',
      icon: <Hammer className="w-5 h-5 text-amber-300" />,
      cost: BUILDING_COSTS.road,
      remaining: player.roadsRemaining,
      description: 'Connects settlements across island paths (15 max).',
    },
    {
      type: 'settlement',
      label: 'Settlement Colony',
      icon: <Home className="w-5 h-5 text-amber-300" />,
      cost: BUILDING_COSTS.settlement,
      remaining: player.settlementsRemaining,
      description: 'Yields 1 resource from adjacent hexes. Worth 1 VP.',
    },
    {
      type: 'city',
      label: 'Fortified City',
      icon: <Landmark className="w-5 h-5 text-amber-300" />,
      cost: BUILDING_COSTS.city,
      remaining: player.citiesRemaining,
      description: 'Upgrades a settlement. Yields 2 resources. Worth 2 VP.',
    },
    {
      type: 'dev_card',
      label: 'Development Card',
      icon: <Scroll className="w-5 h-5 text-purple-300" />,
      cost: BUILDING_COSTS.dev_card,
      remaining: gameState.developmentDeck.length,
      description: 'Draw Knights, Progress cards, or hidden Victory Points.',
    },
  ];

  const handleSelect = (type: BuildingType | 'dev_card') => {
    if (type === 'dev_card') {
      setBuyModalOpen(true);
    } else {
      setBuildMode(type);
      setBuildModalOpen(false);
    }
  };

  const [activeTab, setActiveTab] = React.useState<'build' | 'card'>('build');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="catan-card-dark w-full max-w-lg rounded-2xl p-6 shadow-2xl border-2 border-amber-600/60 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 border-b border-amber-600/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 font-black shadow">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-amber-100">
                Building Costs & Guide
              </h3>
              <p className="text-[11px] text-amber-300/70">Official Catan Rules & Recipes</p>
            </div>
          </div>
          <button
            onClick={() => setBuildModalOpen(false)}
            className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'build'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-black/40 text-amber-300/70 hover:bg-white/5'
            }`}
          >
            Quick Build & Buy
          </button>
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'card'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-black/40 text-amber-300/70 hover:bg-white/5'
            }`}
          >
            📜 High-Res Card View
          </button>
        </div>

        {activeTab === 'card' ? (
          <div className="flex flex-col items-center">
            <div className="rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl max-w-sm w-full bg-black">
              <img
                src="/textures/cards/building_costs_yellow.jpg"
                alt="Building Costs & Development Card"
                className="w-full h-auto object-contain block select-none"
              />
            </div>
            <p className="text-[11px] text-amber-200/80 mt-3 text-center">
              Official reference guide showing exact resource combinations for Roads, Settlements, Cities, and Development Cards.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isDevCard = item.type === 'dev_card';
              const canAfford = Object.entries(item.cost).every(
                ([res, count]) => (player.resources[res as keyof typeof player.resources] ?? 0) >= count
              );

              const canBuild =
                isMyTurn &&
                ((isSetup && (item.type === 'road' || item.type === 'settlement')) ||
                  (isMainPhase && canAfford && item.remaining > 0));

              const getDisabledReason = () => {
                if (!isMyTurn) return 'Not your turn';
                if (isSetup) {
                  if (item.type !== 'road' && item.type !== 'settlement') {
                    return 'Setup Phase: Roads & Settlements only';
                  }
                }
                if (item.remaining <= 0) {
                  return isDevCard ? 'Deck is depleted' : 'Piece supply limit reached';
                }
                if (!canAfford) {
                  const missing = Object.entries(item.cost)
                    .filter(([res, count]) => (player.resources[res as keyof typeof player.resources] ?? 0) < count)
                    .map(([res, count]) => {
                      const have = player.resources[res as keyof typeof player.resources] ?? 0;
                      return `${count - have} ${res}`;
                    })
                    .join(', ');
                  return `Missing: ${missing}`;
                }
                return null;
              };

              const disabledReason = getDisabledReason();

              return (
                <div
                  key={item.type}
                  onClick={() => canBuild && handleSelect(item.type)}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    canBuild
                      ? 'border-amber-600/50 hover:border-amber-400 bg-[#2b170c]/80 hover:bg-[#3d2315] cursor-pointer shadow-lg hover:scale-101'
                      : 'border-amber-950/40 bg-[#170905]/60 opacity-60 cursor-not-allowed'
                  }`}
                  title={disabledReason || item.label}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-[#3d2315] border border-amber-600/40 text-amber-300">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-100 text-sm">{item.label}</span>
                        <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-black/40 border border-amber-600/30">
                          {item.remaining} {isDevCard ? 'in deck' : 'left'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/70 mt-0.5">{item.description}</p>
                      
                      {/* Cost Badges or Disabled Reason */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {Object.entries(item.cost).map(([res, count]) => (
                          <span
                            key={res}
                            className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            {count} {res}
                          </span>
                        ))}
                        {disabledReason && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                            ⚠️ {disabledReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!canBuild}
                    title={disabledReason || ''}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 ml-2 ${
                      canBuild
                        ? 'catan-btn-gold cursor-pointer hover:scale-105 active:scale-95'
                        : 'bg-[#241710] text-amber-200/40 border border-amber-900/40 cursor-not-allowed'
                    }`}
                  >
                    {isDevCard
                      ? canBuild
                        ? 'Draw Card'
                        : !canAfford
                        ? 'Need Cards'
                        : 'Empty'
                      : canBuild
                      ? 'Place'
                      : !canAfford
                      ? 'Need Cards'
                      : 'Maxed'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <BuyDevCardModal
          isOpen={isBuyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          onConfirmBuy={() => {
            onBuyDevCard?.();
            setBuildModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};
