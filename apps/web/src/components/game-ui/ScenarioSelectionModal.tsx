'use client';

import React, { useState } from 'react';

export interface ScenarioConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  imageBg: string;
  minPlayers: number;
  maxPlayers: number;
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'first_island',
    name: 'The First Island',
    subtitle: 'Classic Archipelago',
    description:
      'Welcome to the First Island! Build your initial settlements, roads, and cities on the rich virgin territory.',
    badge: '3-4 Players',
    imageBg: 'from-amber-700 to-amber-950',
    minPlayers: 3,
    maxPlayers: 4,
  },
  {
    id: 'ore_for_wool',
    name: 'Ore For Wool',
    subtitle: 'Pasture Abundance',
    description:
      'Lots of pasture land and fat sheep, but scarce mountain mines! Ore is the most valuable trading resource.',
    badge: '3-4 Players',
    imageBg: 'from-emerald-700 to-emerald-950',
    minPlayers: 3,
    maxPlayers: 4,
  },
  {
    id: 'harbormaster',
    name: 'The Harbormaster',
    subtitle: 'Maritime Trade Dominance',
    description:
      'Because trade becomes critical, coastal harbors carry supreme importance. Claim harbor mastery to conquer the sea!',
    badge: '3-4 Players',
    imageBg: 'from-sky-700 to-sky-950',
    minPlayers: 3,
    maxPlayers: 4,
  },
  {
    id: 'special_scenarios',
    name: 'Dragon & Desert Scenarios',
    subtitle: 'Lethal Hazards',
    description:
      'Ancient dragons and roaming corsairs terrorize the trade routes. Fortify your cities and claim the hoard!',
    badge: '3-6 Players',
    imageBg: 'from-red-800 to-red-950',
    minPlayers: 3,
    maxPlayers: 6,
  },
];

export interface MatchOptions {
  victoryPoints: number;
  randomPlayerStarts: boolean;
  friendlyRobber: boolean;
  balancedDice: boolean;
  randomMap: boolean;
  aiDifficulty: 'NOVICE' | 'EXPERT' | 'MASTER';
  turnDurationSeconds: number;
}

interface ScenarioSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (scenario: ScenarioConfig, options: MatchOptions) => void;
}

export const ScenarioSelectionModal: React.FC<ScenarioSelectionModalProps> = ({
  isOpen,
  onClose,
  onStartMatch,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig>(SCENARIOS[0]);
  const [vpTarget, setVpTarget] = useState(10);
  const [randomPlayerStarts, setRandomPlayerStarts] = useState(true);
  const [friendlyRobber, setFriendlyRobber] = useState(false);
  const [balancedDice, setBalancedDice] = useState(true);
  const [randomMap, setRandomMap] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<'NOVICE' | 'EXPERT' | 'MASTER'>('MASTER');
  const [turnTimeOption, setTurnTimeOption] = useState<'30' | '60' | '90' | '120' | 'custom'>('60');
  const [customTurnSeconds, setCustomTurnSeconds] = useState(45);

  if (!isOpen) return null;

  const handleStart = () => {
    const finalTurnDuration =
      turnTimeOption === 'custom' ? Math.max(10, Math.min(600, customTurnSeconds)) : Number(turnTimeOption);

    onStartMatch(selectedScenario, {
      victoryPoints: vpTarget,
      randomPlayerStarts,
      friendlyRobber,
      balancedDice,
      randomMap,
      aiDifficulty,
      turnDurationSeconds: finalTurnDuration,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-gradient-to-b from-[#2e0e0e] via-[#1c0a0a] to-[#100505] border-2 border-[#d97706]/70 rounded-2xl shadow-[0_0_60px_rgba(217,119,6,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header matching Images 1 & 2 */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#d97706]/40 bg-[#3a1414]/70">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold text-xs flex items-center gap-1.5 uppercase transition-colors"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h2 className="text-xl font-black tracking-widest text-[#fbbf24] uppercase font-serif drop-shadow-md">
              Scenario Selection — Solo Match
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-amber-300">
            <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40">
              ☀️ 1 Sun Token
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40">
              🪙 0 Gold
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 grid grid-cols-12 gap-8 overflow-y-auto custom-scrollbar">
          {/* Left: Scenario Carousel */}
          <div className="col-span-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Choose Campaign Scenario
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-52 transition-all duration-200 group relative overflow-hidden bg-gradient-to-br ${
                    sc.imageBg
                  } ${
                    selectedScenario.id === sc.id
                      ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-[1.02]'
                      : 'border-amber-900/40 hover:border-amber-600/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/50 text-amber-200 border border-amber-500/30">
                      {sc.badge}
                    </span>
                    <h4 className="text-lg font-black text-white font-serif mt-2 leading-tight">
                      {sc.name}
                    </h4>
                    <p className="text-xs text-amber-200/90 font-medium">{sc.subtitle}</p>
                  </div>
                  <p className="text-[11px] text-gray-200/80 line-clamp-3 leading-relaxed">
                    {sc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Custom Match Settings & AI Bot Roster */}
          <div className="col-span-6 space-y-6 bg-[#180606]/80 p-6 rounded-xl border border-[#d97706]/30">
            {/* Victory Points Target */}
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-200 mb-2 font-serif">
                <span>Victory Points Target</span>
                <span className="text-amber-400 text-base font-black">{vpTarget} VP</span>
              </div>
              <input
                type="range"
                min={8}
                max={16}
                value={vpTarget}
                onChange={(e) => setVpTarget(Number(e.target.value))}
                className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Match Rule Checkboxes matching Image 2 */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={randomPlayerStarts}
                  onChange={(e) => setRandomPlayerStarts(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-200 font-serif">
                  Random player starts
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={friendlyRobber}
                  onChange={(e) => setFriendlyRobber(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-200 font-serif">
                  Friendly robber (No target on 2 VP)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={balancedDice}
                  onChange={(e) => setBalancedDice(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-200 font-serif">
                  Dice mode: Balanced (Fair statistical deck)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={randomMap}
                  onChange={(e) => setRandomMap(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-200 font-serif">
                  Random map topology
                </span>
              </label>
            </div>

              {/* Player Turn Time Configuration */}
              <div className="pt-2 border-t border-amber-900/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Player Turn Time
                  </span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {turnTimeOption === 'custom' ? `${customTurnSeconds}s (Custom)` : `${turnTimeOption}s`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {(['30', '60', '90', '120', 'custom'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTurnTimeOption(opt)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        turnTimeOption === opt
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 font-black shadow-md border border-amber-300'
                          : 'bg-[#260808] text-gray-300 border border-amber-900/30 hover:border-amber-600/50 hover:text-amber-200'
                      }`}
                    >
                      {opt === 'custom' ? 'Custom' : `${opt}s`}
                    </button>
                  ))}
                </div>
                {turnTimeOption === 'custom' && (
                  <div className="flex items-center gap-2 bg-[#1f0909] p-2 rounded-lg border border-amber-700/50 mt-1">
                    <span className="text-xs text-gray-300 font-serif">Seconds:</span>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={customTurnSeconds}
                      onChange={(e) => setCustomTurnSeconds(Math.max(10, Math.min(600, Number(e.target.value) || 10)))}
                      className="w-20 bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-xs text-amber-300 font-mono font-black"
                    />
                    <span className="text-[10px] text-gray-400">(10s – 300s)</span>
                  </div>
                )}
              </div>

            {/* AI Opponents Difficulty */}
            <div className="pt-2 border-t border-amber-900/40">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                AI Opponent Mastery Level
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['NOVICE', 'EXPERT', 'MASTER'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setAiDifficulty(diff)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      aiDifficulty === diff
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 font-black shadow-md'
                        : 'bg-[#260808] text-gray-400 hover:text-amber-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#1a0808] border-t border-[#d97706]/30 flex justify-between items-center">
          <span className="text-xs text-amber-400/80 font-serif">
            Selected: <strong className="text-amber-300">{selectedScenario.name}</strong> ({vpTarget} VP Target)
          </span>
          <button
            onClick={handleStart}
            className="px-8 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-amber-950 font-black rounded-xl border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all active:scale-95 text-sm uppercase tracking-widest font-serif"
          >
            ☀️ Launch Match
          </button>
        </div>
      </div>
    </div>
  );
};
