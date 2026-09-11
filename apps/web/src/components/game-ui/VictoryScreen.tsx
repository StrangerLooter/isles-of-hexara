'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Award, RotateCcw, Home, Crown, Star, Sparkles, Eye, Shield, MapPin, Building } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState } from '@hexara/game-core';
import { soundManager } from '../../game/SoundManager';

interface VictoryScreenProps {
  gameState: GameState;
  localPlayerId: string;
  onPlayAgain?: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  gameState,
  localPlayerId,
  onPlayAgain,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (gameState.phase !== 'FINISHED') return null;

  const winnerId = gameState.winnerId || gameState.playerOrder[0];
  const winner = gameState.players[winnerId];
  const isLocalWinner = winnerId === localPlayerId;

  useEffect(() => {
    soundManager.playVictory();

    // Launch fireworks
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Sort players by VP descending
  const rankedPlayers = Object.values(gameState.players).sort(
    (a, b) => b.victoryPoints - a.victoryPoints
  );

  const handleReturnHome = () => {
    soundManager.playClick();
    sessionStorage.removeItem('hexara_active_game_state');
    sessionStorage.removeItem('hexara_room_code');
    window.location.hash = '#/';
  };

  // Count winner settlements & cities on the board
  let winnerSettlements = 0;
  let winnerCities = 0;
  for (const v of Object.values(gameState.board.vertices)) {
    if (v.building && v.building.playerId === winnerId) {
      if (v.building.type === 'settlement') winnerSettlements++;
      if (v.building.type === 'city') winnerCities++;
    }
  }

  // Minimized Bar when user wants to view the final board
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-950/95 via-[#2b170c]/95 to-amber-950/95 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)] backdrop-blur-md animate-in slide-in-from-bottom-5">
        <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
        <span className="text-xs font-black uppercase tracking-wider text-amber-100">
          Winner: {winner?.username} ({winner?.victoryPoints || 10} VP)
        </span>
        <button
          onClick={() => { soundManager.playClick(); setIsMinimized(false); }}
          className="catan-btn-gold px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider"
        >
          View Ceremony
        </button>
        <button
          onClick={handleReturnHome}
          className="px-4 py-1.5 rounded-xl bg-black/60 border border-amber-600/50 text-amber-200 text-xs font-bold hover:text-white"
        >
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300 select-none">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#2a1308] via-[#1a0b04] to-[#0d0502] border-4 border-amber-400/90 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.6)] text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="relative mx-auto mb-3 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.8)] border-2 border-amber-200 animate-bounce">
          <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-950 stroke-[2.2]" />
        </div>

        {/* Victory Announcement Ceremony */}
        <div className="relative mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" /> ARCHIPELAGO CONQUERED <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 tracking-tight">
            {isLocalWinner ? '🎉 VICTORY IS YOURS! 🎉' : `${winner?.username || 'Champion'} Victorious!`}
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/80 font-bold mt-1">
            Achieved {winner?.victoryPoints || 10} Victory Points &bull; Sovereign of the Isles
          </p>
        </div>

        {/* Winner Achievements Showcase */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="p-2.5 rounded-xl bg-[#140703] border border-amber-600/40 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-300/70 block">Settlements</span>
            <span className="text-lg font-black text-amber-100 font-mono">🏠 {winnerSettlements}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#140703] border border-amber-600/40 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-300/70 block">Cities</span>
            <span className="text-lg font-black text-amber-100 font-mono">🏰 {winnerCities}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#140703] border border-amber-600/40 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-300/70 block">Longest Road</span>
            <span className="text-lg font-black text-amber-100 font-mono">
              {winner?.longestRoad ? '🛤️ Active (+2)' : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#140703] border border-amber-600/40 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-300/70 block">Largest Army</span>
            <span className="text-lg font-black text-amber-100 font-mono">
              {winner?.largestArmy ? '⚔️ Active (+2)' : '—'}
            </span>
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-[#140703]/90 rounded-2xl border border-amber-800/50 p-4 mb-5 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-300/80 mb-2.5 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Final Match Standings
          </h3>
          <div className="space-y-1.5">
            {rankedPlayers.map((p, idx) => {
              const isWinner = idx === 0;
              const isMe = p.id === localPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    isWinner
                      ? 'bg-gradient-to-r from-amber-950/80 to-amber-900/60 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-black/40 border-amber-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] ${
                        isWinner ? 'bg-amber-400 text-black' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-amber-100">
                          {p.username} {isMe && '(You)'}
                        </span>
                        {isWinner && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-base font-black font-mono text-amber-300">{p.victoryPoints}</span>
                    <span className="text-[9px] font-bold text-amber-400/70 uppercase">VP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
          {onPlayAgain && (
            <button
              onClick={() => {
                soundManager.playClick();
                onPlayAgain();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Rematch
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playClick();
              setIsMinimized(true);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#241710] hover:bg-[#342217] border border-amber-700/60 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4" /> View Game Board
          </button>

          <button
            onClick={handleReturnHome}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#241710] hover:bg-[#342217] border border-amber-700/60 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4" /> Return Home
          </button>
        </div>
      </div>
    </div>
  );
};
