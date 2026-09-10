'use client';

import React, { useEffect, useRef } from 'react';
import { ScrollText, X, Dices, Hammer, Shield, Trophy, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const GameLogModal: React.FC = () => {
  const { isLogModalOpen, setLogModalOpen, gameState } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLogModalOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLogModalOpen, gameState?.logs.length]);

  if (!isLogModalOpen || !gameState) return null;

  const getLogIcon = (log: string) => {
    if (log.includes('Rolled') || log.includes('dice')) return <Dices className="w-3.5 h-3.5 text-amber-400" />;
    if (log.includes('built') || log.includes('upgraded') || log.includes('purchased')) return <Hammer className="w-3.5 h-3.5 text-emerald-400" />;
    if (log.includes('Knight') || log.includes('Army')) return <Shield className="w-3.5 h-3.5 text-red-400" />;
    if (log.includes('traded') || log.includes('Monopoly') || log.includes('Plenty')) return <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />;
    if (log.includes('won') || log.includes('Victory')) return <Trophy className="w-3.5 h-3.5 text-yellow-400" />;
    if (log.includes('Robber') || log.includes('stole') || log.includes('discard')) return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    return <ScrollText className="w-3.5 h-3.5 text-amber-300" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="catan-card-dark w-full max-w-lg rounded-2xl p-6 shadow-2xl border-2 border-amber-600/70 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4 border-b border-amber-600/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 font-black shadow">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-amber-100">
                Archipelago Chronicle
              </h3>
              <p className="text-[10px] text-amber-300/70">Complete history of realm actions & dice rolls</p>
            </div>
          </div>
          <button
            onClick={() => setLogModalOpen(false)}
            className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {gameState.logs.length === 0 ? (
            <p className="text-xs text-amber-200/60 italic text-center py-6">
              The chronicle awaits the first dice roll...
            </p>
          ) : (
            gameState.logs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#170905]/90 border border-amber-800/40 text-xs text-amber-100 font-medium leading-relaxed hover:border-amber-600/60 transition-colors"
              >
                <div className="p-1 rounded-md bg-black/40 border border-white/5 flex-shrink-0 mt-0.5">
                  {getLogIcon(log)}
                </div>
                <div className="flex-1">
                  <span className="text-amber-400/60 font-mono text-[10px] mr-1.5 font-bold">#{idx + 1}</span>
                  {log}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};
