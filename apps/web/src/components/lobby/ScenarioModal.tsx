'use client';

import React, { useState } from 'react';
import {
  Lock,
  Play,
  Compass,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  Check,
  Shuffle,
  Shield,
  Dices,
  Sliders,
  Flame,
} from 'lucide-react';
import { HeaderBar } from '../modals/HeaderBar';

export interface ScenarioItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  unlocked: boolean;
  price?: string;
  imageBg: string;
  rules: string[];
}

export const CAMPAIGN_SCENARIOS: ScenarioItem[] = [
  {
    id: 'first_island',
    name: 'The First Island',
    subtitle: 'Classic Hexara Archipelago',
    unlocked: true,
    badge: '3-4 Voyagers',
    imageBg: 'from-amber-700/80 via-amber-800/70 to-amber-950/90',
    description:
      'The foundational maritime contest. Settle the fertile central island, balance agriculture and ore mining, pave the Longest Road, and claim 10 Victory Points.',
    rules: [
      '10 Victory Points to Win',
      'Standard 19-Hex Island Layout',
      'Harbor Trading 3:1 & 2:1 Specific',
      'Knight / Largest Army Bonus (+2 VP)',
      'Longest Road Bonus (+2 VP)',
    ],
  },
  {
    id: 'ore_for_wool',
    name: 'Ore For Wool',
    subtitle: 'Pasture Abundance & Mountain Scarcity',
    unlocked: true,
    badge: '3-4 Voyagers',
    imageBg: 'from-emerald-700/80 via-emerald-800/70 to-emerald-950/90',
    description:
      'Lush emerald pastures produce endless wool, but mountain ore is scarce and precious! Master domestic barter and maritime shipping to secure city upgrades.',
    rules: [
      '10-12 Victory Points to Win',
      'Abundant Pastures (Wool Surplus)',
      'Scarse Mountain Mines (High Trade Value)',
      'Wool Harbor 2:1 High-Speed Conversion',
    ],
  },
  {
    id: 'harbormaster',
    name: 'The Harbormaster',
    subtitle: 'Maritime Trade Dominance',
    unlocked: true,
    badge: '3-4 Voyagers',
    imageBg: 'from-sky-700/80 via-sky-800/70 to-sky-950/90',
    description:
      'Coastal colonies carry supreme strategic importance. Settle strategic ports, control coastal waterways, and claim the coveted Harbormaster trophy.',
    rules: [
      '11 Victory Points to Win',
      'Harbormaster Bonus Card (+2 VP for 3 Harbor Points)',
      'All 9 Coastal Harbors Active',
      'Enhanced Maritime Exchange Rates',
    ],
  },
  {
    id: 'dragon_desert',
    name: 'Dragon & Desert Scenarios',
    subtitle: 'Lethal Hazards & High-Stakes Conquest',
    unlocked: true,
    badge: '3-6 Voyagers',
    imageBg: 'from-red-800/80 via-red-900/70 to-stone-950/90',
    description:
      'Ancient horrors and roaming reapers haunt the arid wastes. Fortify your settlements against sudden raids and harvest rare desert gold caches.',
    rules: [
      '12 Victory Points to Win',
      'Grim Reaper Active from Turn 1',
      'Expanded Island Topology',
      'Dangerous Barren Wasteland Hexes',
    ],
  },
];

export interface PreMatchLaunchOptions {
  scenarioId: string;
  scenarioName: string;
  mode: 'solo' | 'online';
  playerCount: number;
  aiDifficulty: 'NOVICE' | 'EXPERT' | 'MASTER';
  victoryPoints: number;
  randomPlayerStarts: boolean;
  friendlyRobber: boolean;
  balancedDice: boolean;
  randomMapTopology: boolean;
  boardSeed: number;
}

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchGame: (options: PreMatchLaunchOptions) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onLaunchGame,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('first_island');
  const [gameMode, setGameMode] = useState<'solo' | 'online'>('solo');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [aiDifficulty, setAiDifficulty] = useState<'NOVICE' | 'EXPERT' | 'MASTER'>('MASTER');
  const [vpTarget, setVpTarget] = useState<number>(10);
  const [randomPlayerStarts, setRandomPlayerStarts] = useState<boolean>(true);
  const [friendlyRobber, setFriendlyRobber] = useState<boolean>(false);
  const [balancedDice, setBalancedDice] = useState<boolean>(true);
  const [randomMapTopology, setRandomMapTopology] = useState<boolean>(true);
  const [boardSeed, setBoardSeed] = useState<number>(() => Math.floor(100000 + Math.random() * 900000));
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentScenario =
    CAMPAIGN_SCENARIOS.find((s) => s.id === selectedScenarioId) || CAMPAIGN_SCENARIOS[0];

  const handleShuffleBoard = () => {
    setIsShuffling(true);
    const newSeed = Math.floor(100000 + Math.random() * 900000);
    setBoardSeed(newSeed);
    setTimeout(() => {
      setIsShuffling(false);
    }, 400);
  };

  const handleLaunch = () => {
    onLaunchGame({
      scenarioId: currentScenario.id,
      scenarioName: currentScenario.name,
      mode: gameMode,
      playerCount,
      aiDifficulty,
      victoryPoints: vpTarget,
      randomPlayerStarts,
      friendlyRobber,
      balancedDice,
      randomMapTopology,
      boardSeed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md catan-bg-burgundy animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Top Header Bar */}
      <HeaderBar
        title="Match Setup & Scenario Configuration"
        onBack={onClose}
        coins={1250}
        scrolls={18}
      />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 max-w-7xl mx-auto w-full flex flex-col gap-5 custom-scrollbar">
        {/* Scenario Carousel Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Select Scenario (Locked After Match Launch)</span>
            </h3>
            <span className="text-[11px] text-amber-200/70 font-bold">
              Choose your terrain rules & island configuration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {CAMPAIGN_SCENARIOS.map((scen) => {
              const isSelected = selectedScenarioId === scen.id;
              return (
                <div
                  key={scen.id}
                  onClick={() => setSelectedScenarioId(scen.id)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 flex flex-col justify-between p-4 bg-gradient-to-b ${
                    scen.imageBg
                  } ${
                    isSelected
                      ? 'border-amber-300 ring-2 ring-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-[1.02]'
                      : 'border-amber-900/60 opacity-85 hover:opacity-100 hover:border-amber-500/70'
                  }`}
                >
                  {/* Scenario Header Info */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-amber-200 border border-amber-500/30">
                        {scen.badge}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                          ✓
                        </div>
                      )}
                    </div>
                    <h4 className="text-base font-black text-white font-serif leading-tight">
                      {scen.name}
                    </h4>
                    <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                      {scen.subtitle}
                    </p>
                  </div>

                  {/* Scenario Description */}
                  <p className="text-[11px] text-amber-100/85 line-clamp-3 leading-relaxed my-2.5">
                    {scen.description}
                  </p>

                  {/* Selection Tab */}
                  <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between text-[11px]">
                    <span className="text-amber-300 font-bold">
                      {isSelected ? 'Active Scenario' : 'Select Scenario'}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-amber-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Scenario Details & Pre-Game Controls Grid */}
        <div className="catan-card-dark rounded-2xl p-5 md:p-6 border-2 border-amber-600/60 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Scenario Lore & Mechanics Checklist */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 font-black shadow-md border border-amber-300">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-amber-100">
                    {currentScenario.name}
                  </h2>
                  <p className="text-xs text-amber-400 font-bold">{currentScenario.subtitle}</p>
                </div>
              </div>

              <div className="catan-parchment-box p-3.5 rounded-xl border border-amber-700/50 text-xs text-amber-100/90 leading-relaxed">
                {currentScenario.description}
              </div>

              {/* Rules Checklist */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2">
                  Active Scenario Objectives:
                </h4>
                <div className="space-y-1.5">
                  {currentScenario.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-semibold text-amber-200/90 bg-black/30 px-3 py-1.5 rounded-lg border border-amber-600/20"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Board Topology & Shuffler Box */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-amber-600/40 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono text-amber-400/80 font-bold">
                  Island Layout Seed
                </span>
                <span className="text-sm font-black text-amber-100 font-mono">
                  #HEX-{boardSeed}
                </span>
              </div>
              <button
                onClick={handleShuffleBoard}
                disabled={isShuffling}
                className="catan-btn-gold px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all"
                title="Shuffle hexes, numbers, and harbor positions"
              >
                <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                <span>Shuffle Board</span>
              </button>
            </div>
          </div>

          {/* Right Column: Pre-Match Customizations & Launch Button */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-black/40 rounded-xl p-5 border border-amber-600/30 gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-600/30 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Pre-Match Game Configuration</span>
                </h4>
                <span className="text-[10px] text-amber-400/80 font-mono">
                  Official Catan 25th Anniv. Engine
                </span>
              </div>

              {/* Mode & Player Count in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mode: Solo vs Online */}
                <div>
                  <label className="text-[11px] font-bold text-amber-200/80 block mb-1.5">
                    Game Environment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGameMode('solo')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        gameMode === 'solo'
                          ? 'bg-amber-600 text-white border-amber-300 shadow-md'
                          : 'bg-[#2b170c] text-amber-200/70 border-amber-800/60 hover:bg-[#3d2315]'
                      }`}
                    >
                      Solo vs AI
                    </button>
                    <button
                      onClick={() => setGameMode('online')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        gameMode === 'online'
                          ? 'bg-blue-600 text-white border-blue-300 shadow-md'
                          : 'bg-[#101e2b] text-blue-200/70 border-blue-800/60 hover:bg-[#182c40]'
                      }`}
                    >
                      Online Room
                    </button>
                  </div>
                </div>

                {/* Player Count */}
                <div>
                  <label className="text-[11px] font-bold text-amber-200/80 block mb-1.5">
                    Voyagers (3 or 4 Players)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPlayerCount(3)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        playerCount === 3
                          ? 'bg-amber-700 text-white border-amber-300 shadow'
                          : 'bg-[#24140c] text-amber-200/60 border-amber-900/60'
                      }`}
                    >
                      3 Voyagers
                    </button>
                    <button
                      onClick={() => setPlayerCount(4)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        playerCount === 4
                          ? 'bg-amber-700 text-white border-amber-300 shadow'
                          : 'bg-[#24140c] text-amber-200/60 border-amber-900/60'
                      }`}
                    >
                      4 Voyagers
                    </button>
                  </div>
                </div>
              </div>

              {/* Victory Points Slider */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-amber-600/20">
                <div className="flex justify-between text-xs font-bold text-gray-200 mb-1.5">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Award className="w-4 h-4 text-amber-400" />
                    Victory Points Target:
                  </span>
                  <span className="text-amber-400 text-sm font-black">{vpTarget} VP</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={16}
                  value={vpTarget}
                  onChange={(e) => setVpTarget(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-amber-400/60 font-mono mt-1">
                  <span>8 VP (Fast)</span>
                  <span>10 VP (Standard)</span>
                  <span>16 VP (Epic)</span>
                </div>
              </div>

              {/* Match Rule Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={randomPlayerStarts}
                    onChange={(e) => setRandomPlayerStarts(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Random starting player
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={friendlyRobber}
                    onChange={(e) => setFriendlyRobber(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Friendly robber (No rob ≤ 2 VP)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={balancedDice}
                    onChange={(e) => setBalancedDice(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Balanced dice deck (Statistical)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={randomMapTopology}
                    onChange={(e) => setRandomMapTopology(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Randomized hex topology
                  </span>
                </label>
              </div>

              {/* AI Opponent Mastery Level */}
              {gameMode === 'solo' && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-amber-200/80 block mb-1.5">
                    AI Opponent Mastery Level
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['NOVICE', 'EXPERT', 'MASTER'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setAiDifficulty(diff)}
                        className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                          aiDifficulty === diff
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 font-black shadow-md border border-amber-300'
                            : 'bg-[#260808] text-gray-400 hover:text-amber-300 border border-amber-900/40'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action Button */}
            <button
              onClick={handleLaunch}
              className="catan-btn-gold w-full py-4 rounded-xl text-base font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Match • {currentScenario.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
