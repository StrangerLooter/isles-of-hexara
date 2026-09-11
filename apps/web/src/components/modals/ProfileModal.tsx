'use client';

import React, { useState, useEffect } from 'react';
import { HeaderBar } from './HeaderBar';
import { Shirt, Armchair, Shield, Trophy, BarChart3, LogOut, Check, Edit2, Save, Sparkles } from 'lucide-react';
import { CharacterModelViewer } from '../lobby/CharacterModelViewer';
import { CREST_AVATARS, UserProfile } from './AuthModal';
import { soundManager } from '../../game/SoundManager';
import { SERVER_URL } from '../../lib/serverUrl';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onProfileUpdated?: (updated: UserProfile) => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.username || 'Captain Voyager');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || '🧙');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [statsTab, setStatsTab] = useState<'overview' | 'achievements'>('overview');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.username);
      setSelectedAvatar(userProfile.avatar);
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const currentLevel = userProfile?.level || 1;
  const currentXp = userProfile?.xp || 0;
  const gamesPlayed = userProfile?.gamesPlayed || 0;
  const wins = userProfile?.wins || 0;
  const losses = Math.max(0, gamesPlayed - wins);
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  const totalVp = userProfile?.totalVictoryPoints || 0;

  const handleSaveProfile = async () => {
    soundManager.playClick();
    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length < 3) return;

    setIsSaving(true);
    const updated: UserProfile = {
      ...(userProfile || { id: 'local_' + Date.now(), isGuest: true }),
      username: cleanName,
      avatar: selectedAvatar,
      level: currentLevel,
      xp: currentXp,
      gamesPlayed,
      wins,
      totalVictoryPoints: totalVp,
    };

    localStorage.setItem('hexara_user_profile', JSON.stringify(updated));
    sessionStorage.setItem('hexara_user_profile', JSON.stringify(updated));
    localStorage.setItem('hexara_username', cleanName);
    sessionStorage.setItem('hexara_username', cleanName);
    localStorage.setItem('hexara_avatar', selectedAvatar);
    sessionStorage.setItem('hexara_avatar', selectedAvatar);

    // Call server API PATCH /api/profiles/me if token available
    const token = localStorage.getItem('hexara_auth_token') || sessionStorage.getItem('hexara_auth_token');
    if (token) {
      try {
        await fetch(`${SERVER_URL}/api/profiles/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: cleanName,
            avatarId: selectedAvatar,
          }),
        });
      } catch {}
    }

    setIsSaving(false);
    setIsEditing(false);
    setSaveToast(true);
    soundManager.playTurnChime();
    onProfileUpdated?.(updated);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleLogOut = () => {
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
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="Captain's Registry & Profile" onBack={onClose} onHome={onClose} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center custom-scrollbar">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Character Avatar Framing */}
          <div className="md:col-span-5 catan-card-dark rounded-2xl p-5 flex flex-col items-center justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="relative w-full aspect-[3/4] rounded-xl bg-gradient-to-b from-amber-900/40 via-amber-700/20 to-amber-950/60 border border-amber-500/40 overflow-hidden flex flex-col items-center justify-center">
              {/* 3D Character Model Display */}
              <CharacterModelViewer modelUrl="/models/tanjiro.glb" className="w-full h-full" />

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 pointer-events-none z-10">
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-black bg-black/70 px-3.5 py-1 rounded-full border border-amber-500/40 shadow">
                  Level {currentLevel} Voyager
                </span>
              </div>
            </div>

            {/* Avatar Selector if Editing */}
            {isEditing ? (
              <div className="w-full mt-3">
                <span className="text-[11px] font-black uppercase text-amber-300 block mb-1">
                  Choose Crest Avatar:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {CREST_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedAvatar(av.icon);
                      }}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        selectedAvatar === av.icon
                          ? 'bg-amber-500/30 border-amber-300 ring-1 ring-amber-400 scale-105'
                          : 'bg-black/50 border-amber-900/60 opacity-80'
                      }`}
                    >
                      <span className="text-xl">{av.icon}</span>
                      <span className="text-[8px] font-bold text-amber-200 block truncate">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-3xl p-2 rounded-xl bg-black/40 border border-amber-500/40 shadow">
                  {selectedAvatar}
                </span>
                <div className="text-left">
                  <span className="text-xs font-black uppercase text-amber-200 block">Active Crest</span>
                  <span className="text-[10px] text-amber-400/70 font-mono">Synced to Board</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Player Information, Stats & Action Stack */}
          <div className="md:col-span-7 catan-card-dark rounded-2xl p-6 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="space-y-4">
              {/* Name & Edit Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      maxLength={24}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-black/60 border-2 border-amber-400 rounded-xl px-3 py-1.5 text-base font-black text-amber-100 focus:outline-none w-full"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="catan-btn-gold px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-300 font-serif">
                      {userProfile?.username || displayName}
                    </h3>
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setIsEditing(true);
                      }}
                      className="p-1.5 rounded-lg bg-[#2b170c] border border-amber-600/50 text-amber-300 hover:text-white hover:border-amber-400 transition-colors"
                      title="Edit Voyager Name & Crest"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {saveToast && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" /> Saved
                  </span>
                )}
              </div>

              {/* XP & Level Progression Bar */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-600/40">
                <div className="flex justify-between items-center text-xs font-bold text-amber-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Level {currentLevel} Progress
                  </span>
                  <span className="font-mono text-amber-400">
                    {currentXp % 1000} / 1000 XP
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/80 border border-amber-500/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-200 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((currentXp % 1000) / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 py-1">
                <div className="p-3 rounded-xl bg-black/40 border border-amber-600/30 text-center">
                  <span className="text-[10px] text-amber-300/80 block uppercase font-bold">Games</span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">{gamesPlayed}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-amber-600/30 text-center">
                  <span className="text-[10px] text-amber-300/80 block uppercase font-bold">Wins</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{wins}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-amber-600/30 text-center">
                  <span className="text-[10px] text-amber-300/80 block uppercase font-bold">Win Rate</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{winRate}%</span>
                </div>
              </div>

              {/* Achievements Showcase */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-600/40 space-y-2">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Voyager Achievements
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-lg bg-[#24130b] border border-amber-600/40 text-amber-200">
                    🏆 First Colony
                  </div>
                  <div className="p-2 rounded-lg bg-[#24130b] border border-amber-600/40 text-amber-200">
                    🌊 Tides Master
                  </div>
                  <div className="p-2 rounded-lg bg-[#24130b] border border-amber-600/40 text-amber-400/50">
                    ⚔️ Grand Armada
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-amber-500/30">
              <button
                onClick={handleLogOut}
                className="py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-200 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Log Out</span>
              </button>

              <button
                onClick={onClose}
                className="catan-btn-gold py-2.5 px-8 rounded-xl font-black text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
