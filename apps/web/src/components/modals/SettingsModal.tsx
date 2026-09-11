'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Eye, Zap, Globe, RefreshCw, LogOut, Check, Sliders } from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import { soundManager } from '../../game/SoundManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout }) => {
  const initialSettings = soundManager.getSettings();
  const [musicVolume, setMusicVolume] = useState<number>(Math.round(initialSettings.music * 100));
  const [sfxVolume, setSfxVolume] = useState<number>(Math.round(initialSettings.sfx * 100));
  const [diceAnimation, setDiceAnimation] = useState<boolean>(true);
  const [roadArrows, setRoadArrows] = useState<boolean>(true);
  const [topDownDefault, setTopDownDefault] = useState<boolean>(false);
  const [fastAi, setFastAi] = useState<boolean>(true);
  const [haptics, setHaptics] = useState<boolean>(true);
  const [tooltips, setTooltips] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('en');
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const storedUsername = typeof window !== 'undefined'
    ? localStorage.getItem('hexara_username') || 'Captain Voyager'
    : 'Captain Voyager';

  if (!isOpen) return null;

  const handleMusicChange = (val: number) => {
    setMusicVolume(val);
    soundManager.setMusicVolume(val / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVolume(val);
    soundManager.setSfxVolume(val / 100);
    soundManager.playClick();
  };

  const handleSave = () => {
    soundManager.playClick();
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 500);
  };

  const handleLogoutClick = () => {
    soundManager.playClick();
    localStorage.removeItem('hexara_auth_token');
    sessionStorage.removeItem('hexara_auth_token');
    localStorage.removeItem('hexara_user_profile');
    sessionStorage.removeItem('hexara_user_profile');
    localStorage.removeItem('hexara_username');
    sessionStorage.removeItem('hexara_username');
    localStorage.removeItem('hexara_avatar');
    sessionStorage.removeItem('hexara_avatar');
    onClose();
    onLogout?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm catan-bg-burgundy animate-in fade-in duration-200 select-none">
      <HeaderBar title="Options & Settings" onBack={onClose} onHome={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full flex flex-col justify-between custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Audio & Visuals */}
          <div className="flex flex-col gap-6">
            {/* Audio Settings */}
            <div className="catan-card-dark rounded-2xl p-5 border-2 border-amber-600/40 shadow-xl">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2 font-serif">
                <Volume2 className="w-4 h-4 text-amber-400" />
                Audio & Acoustics
              </h3>

              {/* Music Volume */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-amber-100/90 mb-1.5">
                  <span>Maritime Music Volume</span>
                  <span className="text-amber-400 font-mono">{musicVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMusicChange(musicVolume === 0 ? 60 : 0)}
                    className="text-amber-400 hover:text-amber-200"
                  >
                    {musicVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolume}
                    onChange={(e) => handleMusicChange(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-[#170e08] h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-amber-100/90 mb-1.5">
                  <span>Sound Effects (Chimes, Dice, Builds)</span>
                  <span className="text-amber-400 font-mono">{sfxVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSfxChange(sfxVolume === 0 ? 80 : 0)}
                    className="text-amber-400 hover:text-amber-200"
                  >
                    {sfxVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume}
                    onChange={(e) => handleSfxChange(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-[#170e08] h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Graphics & Animations */}
            <div className="catan-card-dark rounded-2xl p-5 border-2 border-amber-600/40 shadow-xl">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2 font-serif">
                <Eye className="w-4 h-4 text-amber-400" />
                Tabletop Graphics
              </h3>

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">3D Dice Roll Animation</span>
                    <span className="text-[11px] text-amber-200/60">Simulate physical wooden dice tumble</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={diceAnimation}
                    onChange={(e) => setDiceAnimation(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Road Placement Vector Guides</span>
                    <span className="text-[11px] text-amber-200/60">Display glowing pathways on valid edges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={roadArrows}
                    onChange={(e) => setRoadArrows(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Default to Overhead Tactical Camera</span>
                    <span className="text-[11px] text-amber-200/60">Begin matches in overhead map mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={topDownDefault}
                    onChange={(e) => setTopDownDefault(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Gameplay, Language, Account */}
          <div className="flex flex-col gap-6">
            <div className="catan-card-dark rounded-2xl p-5 border-2 border-amber-600/40 shadow-xl">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2 font-serif">
                <Zap className="w-4 h-4 text-amber-400" />
                Gameplay Preferences
              </h3>

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Fast AI Decision Rate</span>
                    <span className="text-[11px] text-amber-200/60">Accelerate computer moves and rolls</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fastAi}
                    onChange={(e) => setFastAi(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Helpful Maritime Hints</span>
                    <span className="text-[11px] text-amber-200/60">Highlight harbor exchange ratios</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tooltips}
                    onChange={(e) => setTooltips(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Account & Session Controls */}
            <div className="catan-card-dark rounded-2xl p-5 border-2 border-amber-600/40 shadow-xl">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2 font-serif">
                <Globe className="w-4 h-4 text-amber-400" />
                Voyager Identity & Session
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-200/60">Current Voyager:</span>
                  <span className="font-bold text-amber-200">{storedUsername}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-200/60">Language:</span>
                  <span className="font-bold text-amber-200">English (Maritime)</span>
                </div>

                <div className="pt-3 border-t border-amber-600/30">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Log Out / Switch Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-600/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-amber-200/50 font-mono">
            Isles of Hexara &bull; Engine v1.0.0-gold &bull; WebGL Tabletop
          </span>

          <button
            onClick={handleSave}
            className="catan-btn-gold px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg"
          >
            {savedToast ? <Check className="w-4 h-4" /> : null}
            <span>{savedToast ? 'Saved!' : 'Save & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
