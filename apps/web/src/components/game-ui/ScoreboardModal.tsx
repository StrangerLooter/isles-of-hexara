'use client';

import React, { useState } from 'react';
import { GameState } from '@hexara/game-core';
import { Trophy, BarChart3, Shield, Award, Users, ChevronLeft, Dices, Layers } from 'lucide-react';

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  diceRollHistory?: number[];
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isOpen,
  onClose,
  gameState,
  diceRollHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState<'histogram' | 'standings'>('histogram');

  if (!isOpen) return null;

  // Calculate dice roll frequency histogram for sums 2 through 12
  const rollCounts: Record<number, number> = {};
  for (let i = 2; i <= 12; i++) {
    rollCounts[i] = 0;
  }
  diceRollHistory.forEach((val) => {
    if (val >= 2 && val <= 12) {
      rollCounts[val] = (rollCounts[val] || 0) + 1;
    }
  });

  const totalRolls = diceRollHistory.length;
  const maxRollCount = Math.max(1, ...Object.values(rollCounts));

  // Official Catan theoretical probabilities & pip dot counts
  const DICE_ODDS: Record<number, { pips: number; theoreticalPct: string; dots: string }> = {
    2: { pips: 1, theoreticalPct: '2.8%', dots: '•' },
    3: { pips: 2, theoreticalPct: '5.6%', dots: '••' },
    4: { pips: 3, theoreticalPct: '8.3%', dots: '•••' },
    5: { pips: 4, theoreticalPct: '11.1%', dots: '••••' },
    6: { pips: 5, theoreticalPct: '13.9%', dots: '•••••' },
    7: { pips: 6, theoreticalPct: '16.7%', dots: '••••••' },
    8: { pips: 5, theoreticalPct: '13.9%', dots: '•••••' },
    9: { pips: 4, theoreticalPct: '11.1%', dots: '••••' },
    10: { pips: 3, theoreticalPct: '8.3%', dots: '•••' },
    11: { pips: 2, theoreticalPct: '5.6%', dots: '••' },
    12: { pips: 1, theoreticalPct: '2.8%', dots: '•' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#2e0e0e] via-[#1c0a0a] to-[#100505] border-2 border-[#d97706]/70 rounded-2xl shadow-[0_0_60px_rgba(217,119,6,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d97706]/40 bg-[#3a1414]/70">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold text-xs flex items-center gap-1.5 uppercase transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-xl font-black tracking-widest text-[#fbbf24] uppercase font-serif drop-shadow-md flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>Scoreboard & Dice Histogram</span>
            </h2>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-black/50 p-1 rounded-xl border border-amber-600/40">
            <button
              onClick={() => setActiveTab('histogram')}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === 'histogram'
                  ? 'bg-amber-600 text-slate-950 font-black shadow'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Dice Histogram
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === 'standings'
                  ? 'bg-amber-600 text-slate-950 font-black shadow'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Standings
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
          {activeTab === 'histogram' ? (
            <div className="space-y-5">
              {/* Dice Statistics Histogram Card */}
              <div className="bg-[#1e0a0a]/90 border border-[#d97706]/40 rounded-xl p-5 shadow-inner">
                <div className="flex items-center justify-between mb-4 border-b border-amber-600/20 pb-2">
                  <div>
                    <span className="text-sm font-black text-amber-200 uppercase tracking-wider block font-serif">
                      Dice Frequency Distribution (2–12)
                    </span>
                    <span className="text-[11px] text-amber-400/70 font-semibold">
                      Live statistical roll distribution throughout the match
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50 font-mono font-bold">
                      Total Rolls: {totalRolls}
                    </span>
                  </div>
                </div>

                {/* Histogram Bars */}
                <div className="flex items-end justify-between gap-2 h-44 pt-4 pb-2 px-2 border-b border-gray-700/60">
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((sum) => {
                    const count = rollCounts[sum] || 0;
                    const heightPercent = (count / maxRollCount) * 100;
                    const actualPct = totalRolls > 0 ? ((count / totalRolls) * 100).toFixed(1) + '%' : '0%';
                    const isHighProb = sum === 6 || sum === 8;
                    const isSeven = sum === 7;
                    const odds = DICE_ODDS[sum];

                    return (
                      <div key={sum} className="flex-1 flex flex-col items-center h-full justify-end group">
                        {/* Actual Count Label */}
                        <span className="text-[11px] font-black text-amber-100 mb-1 group-hover:text-amber-300">
                          {count}
                        </span>

                        {/* Bar Shape */}
                        <div className="w-full max-w-[32px] bg-black/60 rounded-t-lg overflow-hidden flex flex-col justify-end h-full border border-amber-900/40">
                          <div
                            style={{ height: `${Math.max(count > 0 ? 10 : 0, heightPercent)}%` }}
                            className={`w-full transition-all duration-300 rounded-t-md ${
                              isSeven
                                ? 'bg-gradient-to-t from-gray-600 to-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : isHighProb
                                ? 'bg-gradient-to-t from-red-700 via-red-500 to-amber-300 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                                : 'bg-gradient-to-t from-amber-700 to-amber-400'
                            }`}
                          />
                        </div>

                        {/* Sum Number */}
                        <span
                          className={`text-sm font-black mt-2 ${
                            isHighProb ? 'text-red-400' : isSeven ? 'text-gray-200' : 'text-amber-300'
                          }`}
                        >
                          {sum}
                        </span>

                        {/* Pip Dots */}
                        <span className="text-[9px] text-amber-400 font-bold -mt-0.5 leading-none">
                          {odds?.dots}
                        </span>

                        {/* Percentage */}
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                          {actualPct}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend & Theoretical Odds Note */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-amber-600/20 text-[10px] text-amber-200/80 font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-600" />
                    <span>Red 6 & 8: High Frequency (13.9% each)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-300" />
                    <span>7: Robber Strike (16.7% odds)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span>2–12: Terrain Resource Production</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standings Table */
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Voyager Standings & Victory Point Breakdown
              </h3>
              <div className="space-y-3">
                {Object.values(gameState.players).map((p) => {
                  const activePlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
                  const isCurrent = activePlayerId === p.id;
                  const resourceTotal = Object.values(p.resources).reduce((a, b) => a + b, 0);

                  // Count settlements and cities
                  let settlementsCount = 0;
                  let citiesCount = 0;
                  Object.values(gameState.board.vertices).forEach((v) => {
                    if (v.building && v.building.playerId === p.id) {
                      if (v.building.type === 'city') citiesCount++;
                      else settlementsCount++;
                    }
                  });

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : 'bg-[#1a0808]/80 border-amber-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-12 rounded-lg shadow-sm"
                            style={{ backgroundColor: p.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white font-serif text-lg">
                                {p.username}
                              </span>
                              {p.isAi && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/40 font-mono font-bold">
                                  AI BOT
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 font-bold animate-pulse">
                                  CURRENT TURN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-amber-200/80 font-semibold">
                              <span>🏡 Settlements: {settlementsCount}</span>
                              <span>🏰 Cities: {citiesCount}</span>
                              <span>⚔️ Knights: {p.playedKnights || 0}</span>
                              <span>🂠 Hand: {resourceTotal} cards</span>
                              <span>🂡 Dev Cards: {p.devCards?.length || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Victory Points Badge */}
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-amber-400 font-serif">
                            {p.victoryPoints} VP
                          </span>
                          <span className="text-[10px] uppercase font-mono text-amber-200/60 font-bold">
                            Goal: {gameState.targetVictoryPoints || 10} VP
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#1a0808] border-t border-[#d97706]/30 flex justify-between items-center text-xs text-amber-200/70">
          <span>Official Klaus Teuber 25th Anniversary Scoring Rules</span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-xl border border-amber-300 transition-all text-xs uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
