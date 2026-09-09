import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Eye, Zap, Globe, Shield, RefreshCw, LogOut, Check } from 'lucide-react';
import { HeaderBar } from './HeaderBar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [musicVolume, setMusicVolume] = useState<number>(75);
  const [sfxVolume, setSfxVolume] = useState<number>(85);
  const [diceAnimation, setDiceAnimation] = useState<boolean>(true);
  const [roadArrows, setRoadArrows] = useState<boolean>(true);
  const [topDownDefault, setTopDownDefault] = useState<boolean>(false);
  const [fastAi, setFastAi] = useState<boolean>(true);
  const [haptics, setHaptics] = useState<boolean>(true);
  const [tooltips, setTooltips] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('en');
  const [savedToast, setSavedToast] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm catan-bg-burgundy animate-in fade-in duration-200">
      <HeaderBar
        title="Settings & Options"
        onBack={onClose}
        coins={1250}
        scrolls={18}
      />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Audio & Visuals */}
          <div className="flex flex-col gap-6">
            {/* Audio Settings */}
            <div className="catan-card-dark rounded-xl p-5 border border-amber-600/40">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                Audio Controls
              </h3>

              {/* Music Volume */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-amber-100/90 mb-1.5">
                  <span>Music Volume</span>
                  <span className="text-amber-400 font-mono">{musicVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMusicVolume(musicVolume === 0 ? 70 : 0)}
                    className="text-amber-400 hover:text-amber-200"
                  >
                    {musicVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-[#170e08] h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Sound Effects Volume */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-amber-100/90 mb-1.5">
                  <span>Sound Effects</span>
                  <span className="text-amber-400 font-mono">{sfxVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSfxVolume(sfxVolume === 0 ? 80 : 0)}
                    className="text-amber-400 hover:text-amber-200"
                  >
                    {sfxVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume}
                    onChange={(e) => setSfxVolume(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-[#170e08] h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Graphics & Animations */}
            <div className="catan-card-dark rounded-xl p-5 border border-amber-600/40">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                Tabletop Graphics
              </h3>

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">3D Dice Roll Animation</span>
                    <span className="text-[11px] text-amber-200/60">Simulate rolling dice cup in tavern</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={diceAnimation}
                    onChange={(e) => setDiceAnimation(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Road Placement Direction Arrows</span>
                    <span className="text-[11px] text-amber-200/60">Display glowing path vectors on valid edges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={roadArrows}
                    onChange={(e) => setRoadArrows(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Default to Overhead Tactical Camera</span>
                    <span className="text-[11px] text-amber-200/60">Start matches in top-down mode</span>
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
            {/* Gameplay Rules & Automation */}
            <div className="catan-card-dark rounded-xl p-5 border border-amber-600/40">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Gameplay Preferences
              </h3>

              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Fast AI Bots</span>
                    <span className="text-[11px] text-amber-200/60">Accelerate computer moves and rolls</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fastAi}
                    onChange={(e) => setFastAi(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Vibration & Haptics</span>
                    <span className="text-[11px] text-amber-200/60">Tactile pulses when your turn begins</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={haptics}
                    onChange={(e) => setHaptics(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-100">Helpful In-Game Hints</span>
                    <span className="text-[11px] text-amber-200/60">Show tips for trade rates and harbors</span>
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

            {/* Language & Account */}
            <div className="catan-card-dark rounded-xl p-5 border border-amber-600/40">
              <h3 className="text-sm font-black tracking-wider uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                Language & Account
              </h3>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-amber-100">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#170e08] border border-amber-600/50 rounded-lg px-3 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className="pt-3 border-t border-amber-600/30 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-200/60">Account Tag:</span>
                  <span className="font-bold text-amber-200">Captain Amber #HEX-7729</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => alert('Purchases restored successfully.')}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#2b1f18] hover:bg-[#3b2b22] border border-amber-600/40 text-[11px] font-bold text-amber-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    Restore Purchases
                  </button>
                  <button
                    onClick={() => alert('Logged out.')}
                    className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-[11px] font-bold text-red-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    Log Out
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
            {savedToast ? 'Saved!' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
