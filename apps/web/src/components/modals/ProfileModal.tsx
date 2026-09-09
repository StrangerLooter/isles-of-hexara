import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { Shirt, Armchair, Shield, Trophy, BarChart3, LogOut, Trash2 } from 'lucide-react';
import { CharacterModelViewer } from '../lobby/CharacterModelViewer';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  username = 'Captain Amber',
}) => {
  const [viewMode, setViewMode] = useState<'avatar' | 'wardrobe'>('avatar');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-fade-in">
      <HeaderBar title="PLAYER PROFILE" onBack={onClose} onHome={onClose} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Character Avatar Framing */}
          <div className="md:col-span-5 catan-card-dark rounded-xl p-4 flex flex-col items-center justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="relative w-full aspect-[3/4] rounded-lg bg-gradient-to-b from-amber-900/40 via-amber-700/20 to-amber-950/60 border border-amber-500/40 overflow-hidden flex flex-col items-center justify-center">
              {/* 3D Character Model Display (Tanjiro) */}
              <CharacterModelViewer modelUrl="/models/tanjiro.glb" className="w-full h-full" />

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 pointer-events-none z-10">
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold bg-black/60 px-3 py-1 rounded-full border border-amber-500/30">
                  Archipelago Pioneer
                </span>
              </div>
            </div>

            {/* Avatar Pose / Wardrobe Action Tabs */}
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <button
                onClick={() => setViewMode('avatar')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 border transition-all ${
                  viewMode === 'avatar'
                    ? 'catan-btn-gold'
                    : 'bg-[#2b1f18] text-amber-300 border-amber-600/40 hover:bg-[#3d2c22]'
                }`}
                title="Stance"
              >
                <Armchair className="w-4 h-4" />
                <span className="text-xs font-bold">Stance</span>
              </button>
              <button
                onClick={() => setViewMode('wardrobe')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 border transition-all ${
                  viewMode === 'wardrobe'
                    ? 'catan-btn-gold'
                    : 'bg-[#2b1f18] text-amber-300 border-amber-600/40 hover:bg-[#3d2c22]'
                }`}
                title="Wardrobe"
              >
                <Shirt className="w-4 h-4" />
                <span className="text-xs font-bold">Outfit</span>
              </button>
            </div>
          </div>

          {/* Right Column: Player Information & Action Stack */}
          <div className="md:col-span-7 catan-card-dark rounded-xl p-6 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow">
                  {username}
                </h3>
                <p className="text-xs text-amber-200/80 font-semibold mt-0.5">Guild: —</p>
              </div>

              {/* Guild Emblems Bar */}
              <div className="flex items-center gap-2 py-2 border-y border-amber-500/20">
                {[1, 2, 3, 4, 5, 6].map((badge) => (
                  <div
                    key={badge}
                    className="w-8 h-8 rounded-full bg-black/40 border border-amber-600/40 flex items-center justify-center text-amber-500/50 text-xs shadow-inner"
                  >
                    <Shield className="w-4 h-4" />
                  </div>
                ))}
              </div>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-2 gap-4 py-1">
                <div className="p-3 rounded-lg bg-black/30 border border-amber-600/30">
                  <span className="text-[11px] text-amber-300/80 block uppercase font-bold">Level</span>
                  <span className="text-2xl font-black text-white">1</span>
                </div>
                <div className="p-3 rounded-lg bg-black/30 border border-amber-600/30">
                  <span className="text-[11px] text-amber-300/80 block uppercase font-bold">Karma</span>
                  <span className="text-2xl font-black text-amber-400">3 ★</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => alert('Voyager Statistics:\nMatches Played: 14\nWins: 6\nWin Rate: 43%\nTotal Victory Points: 118')}
                className="py-3 px-4 rounded-xl catan-pill-btn flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Statistics</span>
              </button>
              <button
                onClick={() => alert('Achievements:\n🏆 First Colony: Complete\n🌊 Master of Tides: Complete\n⚔️ Imperial Fleet: In Progress')}
                className="py-3 px-4 rounded-xl catan-pill-btn flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Achievements</span>
              </button>
              <button
                onClick={() => alert('Account deletion cancelled.')}
                className="py-3 px-4 rounded-xl catan-pill-btn flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider text-red-300 hover:text-red-200"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Account</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl catan-pill-btn flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
