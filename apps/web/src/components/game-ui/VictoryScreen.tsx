'use client';

import React, { useEffect } from 'react';
import { Trophy, Award, RotateCcw, Home, Crown, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState } from '@hexara/game-core';

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
  if (gameState.phase !== 'FINISHED') return null;

  const winnerId = gameState.winnerId || gameState.playerOrder[0];
  const winner = gameState.players[winnerId];
  const isLocalWinner = winnerId === localPlayerId;

  useEffect(() => {
    // Launch celebratory fireworks
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
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

  const handleReturnToLobby = () => {
    window.location.hash = '#/';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#2a1308] via-[#1a0b04] to-[#0d0502] border-4 border-amber-400/90 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.6)] text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="relative mx-auto mb-3 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.8)] border-2 border-amber-200 animate-bounce">
          <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-950 stroke-[2.2]" />
        </div>

        {/* Victory Announcement */}
        <div className="relative mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Realm Master Crowned <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 tracking-tight">
            {isLocalWinner ? '🎉 VICTORY IS YOURS! 🎉' : `${winner?.username || 'Champion'} Victorious!`}
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/70 mt-1">
            Reigned supreme over the Archipelago with {winner?.victoryPoints || 10} Victory Points!
          </p>
        </div>

        {/* Standings Table */}
        <div className="bg-[#140703]/90 rounded-2xl border border-amber-800/50 p-4 mb-6 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-300/80 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Final Realm Standings
          </h3>
          <div className="space-y-2">
            {rankedPlayers.map((p, idx) => {
              const isWinner = idx === 0;
              const isMe = p.id === localPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isWinner
                      ? 'bg-gradient-to-r from-amber-950/80 to-amber-900/60 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-black/40 border-amber-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        isWinner ? 'bg-amber-400 text-black' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-amber-100">
                          {p.username} {isMe && '(You)'}
                        </span>
                        {isWinner && <Crown className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-amber-300/60 mt-0.5">
                        {p.longestRoad && <span className="text-amber-300">🛤️ Longest Road</span>}
                        {p.largestArmy && <span className="text-red-400">⚔️ Largest Army</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black font-mono text-amber-300">{p.victoryPoints}</span>
                    <span className="text-[10px] font-bold text-amber-400/70 uppercase">VP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl catan-btn-gold text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          )}
          <button
            onClick={handleReturnToLobby}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#241710] hover:bg-[#342217] border border-amber-800/60 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4" /> Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
