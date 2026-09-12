'use client';

import React, { useState } from 'react';

export interface GameSettingsState {
  // General
  musicVolume: number;
  soundVolume: number;
  animationSpeed: number;
  aiSpeed: number;
  // Game
  activateVibration: boolean;
  autoCameraMovement: boolean;
  autoCameraZoom: boolean;
  boardPhysics: boolean;
  // Visuals
  diceAnimation: boolean;
  highlightsResourceDistribution: boolean;
  placeBuildingEffect: boolean;
  playerTurnTicker: boolean;
  fastResourceDistribution: boolean;
}

export const DEFAULT_SETTINGS: GameSettingsState = {
  musicVolume: 75,
  soundVolume: 85,
  animationSpeed: 100,
  aiSpeed: 100,
  activateVibration: true,
  autoCameraMovement: true,
  autoCameraZoom: false,
  boardPhysics: false,
  diceAnimation: true,
  highlightsResourceDistribution: true,
  placeBuildingEffect: true,
  playerTurnTicker: true,
  fastResourceDistribution: false,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettingsState;
  onUpdateSettings: (newSettings: GameSettingsState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'game' | 'visuals'>('general');

  if (!isOpen) return null;

  const update = <K extends keyof GameSettingsState>(key: K, val: GameSettingsState[K]) => {
    onUpdateSettings({ ...settings, [key]: val });
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a1010] via-[#1a0c0c] to-[#120808] border-2 border-[#d97706]/70 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.25)] overflow-hidden flex flex-col h-[520px]">
        {/* Header Tabs & Back Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d97706]/40 bg-[#3a1414]/70">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold text-xs flex items-center gap-1 uppercase transition-colors"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('general')}
                className={`text-base font-black tracking-wider uppercase font-serif pb-0.5 transition-all ${
                  activeTab === 'general'
                    ? 'text-[#fbbf24] border-b-2 border-[#fbbf24] drop-shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('game')}
                className={`text-base font-black tracking-wider uppercase font-serif pb-0.5 transition-all ${
                  activeTab === 'game'
                    ? 'text-[#fbbf24] border-b-2 border-[#fbbf24] drop-shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Game
              </button>
              <button
                onClick={() => setActiveTab('visuals')}
                className={`text-base font-black tracking-wider uppercase font-serif pb-0.5 transition-all ${
                  activeTab === 'visuals'
                    ? 'text-[#fbbf24] border-b-2 border-[#fbbf24] drop-shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Visuals
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold flex items-center justify-center transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* 1. GENERAL TAB (Image 16) */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold text-gray-200 mb-2 font-serif">
                  <span>Music volume</span>
                  <span className="text-amber-400">{settings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.musicVolume}
                  onChange={(e) => update('musicVolume', Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold text-gray-200 mb-2 font-serif">
                  <span>Sound volume</span>
                  <span className="text-amber-400">{settings.soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.soundVolume}
                  onChange={(e) => update('soundVolume', Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold text-gray-200 mb-2 font-serif">
                  <span>Animation Speed: {settings.animationSpeed === 100 ? 'default' : `${settings.animationSpeed}%`}</span>
                  <span className="text-amber-400">{settings.animationSpeed}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={settings.animationSpeed}
                  onChange={(e) => update('animationSpeed', Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold text-gray-200 mb-2 font-serif">
                  <span>A.I. Speed: {settings.aiSpeed === 100 ? 'default' : `${settings.aiSpeed}%`}</span>
                  <span className="text-amber-400">{settings.aiSpeed}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={settings.aiSpeed}
                  onChange={(e) => update('aiSpeed', Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 2. GAME TAB (Image 17) */}
          {activeTab === 'game' && (
            <div className="space-y-5">
              {[
                { key: 'activateVibration' as const, label: 'Activate vibration' },
                { key: 'autoCameraMovement' as const, label: 'Automatic camera movement' },
                { key: 'autoCameraZoom' as const, label: 'Automatic camera zoom' },
                { key: 'boardPhysics' as const, label: 'Board physics' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-4 cursor-pointer group select-none"
                >
                  <div
                    onClick={() => update(opt.key, !settings[opt.key])}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      settings[opt.key]
                        ? 'border-amber-400 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'border-gray-600 bg-gray-900/80'
                    }`}
                  >
                    {settings[opt.key] && <div className="w-2.5 h-2.5 rounded-full bg-amber-950" />}
                  </div>
                  <span className="text-sm font-bold text-gray-200 group-hover:text-amber-300 transition-colors font-serif">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* 3. VISUALS TAB (Image 18) */}
          {activeTab === 'visuals' && (
            <div className="space-y-5">
              {[
                { key: 'diceAnimation' as const, label: 'Dice animation' },
                { key: 'highlightsResourceDistribution' as const, label: 'Highlights during resource distribution' },
                { key: 'placeBuildingEffect' as const, label: 'Place building effect' },
                { key: 'playerTurnTicker' as const, label: '"Players Turn" ticker' },
                { key: 'fastResourceDistribution' as const, label: 'Fast resource distribution' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-4 cursor-pointer group select-none"
                >
                  <div
                    onClick={() => update(opt.key, !settings[opt.key])}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      settings[opt.key]
                        ? 'border-amber-400 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'border-gray-600 bg-gray-900/80'
                    }`}
                  >
                    {settings[opt.key] && <div className="w-2.5 h-2.5 rounded-full bg-amber-950" />}
                  </div>
                  <span className="text-sm font-bold text-gray-200 group-hover:text-amber-300 transition-colors font-serif">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-3.5 bg-[#1a0808] border-t border-[#d97706]/30 flex justify-between items-center text-xs text-gray-400">
          <span>Preferences saved to browser storage</span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-amber-950 font-black rounded-lg text-xs uppercase tracking-wider"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
