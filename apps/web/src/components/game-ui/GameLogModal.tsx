'use client';

import React from 'react';
import { ScrollText, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const GameLogModal: React.FC = () => {
  const { isLogModalOpen, setLogModalOpen, gameState } = useGameStore();

  if (!isLogModalOpen || !gameState) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="catan-card-dark w-full max-w-lg rounded-2xl p-6 shadow-2xl border-2 border-amber-600/60 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4 border-b border-amber-600/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 font-black shadow">
              <ScrollText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-amber-100">
              Archipelago Chronicle
            </h3>
          </div>
          <button
            onClick={() => setLogModalOpen(false)}
            className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {gameState.logs.length === 0 ? (
            <p className="text-xs text-amber-200/60 italic text-center py-4">
              The chronicle awaits the first dice roll...
            </p>
          ) : (
            gameState.logs.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#170905]/80 border border-amber-700/30 text-xs text-amber-100 font-semibold leading-relaxed"
              >
                <span className="text-amber-500 font-mono mr-2">[{idx + 1}]</span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
