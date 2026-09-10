'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Mail,
  Sparkles,
  Shield,
  Check,
  X,
  Compass,
  Zap,
} from 'lucide-react';

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  isGuest: boolean;
  token?: string;
  level: number;
  xp: number;
}

const AVATARS = [
  { icon: '⚓', name: 'Captain' },
  { icon: '🏹', name: 'Scout' },
  { icon: '👑', name: 'Monarch' },
  { icon: '🦙', name: 'Merchant' },
  { icon: '⚔️', name: 'Knight' },
  { icon: '🧙', name: 'Mystic' },
  { icon: '🌊', name: 'Corsair' },
  { icon: '🐲', name: 'Dragon Raider' },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'guest' | 'login' | 'signup'>('guest');
  const [guestName, setGuestName] = useState('Captain Amber');
  const [selectedAvatar, setSelectedAvatar] = useState('⚓');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('hexara_username') || sessionStorage.getItem('hexara_username');
      const savedAvatar = localStorage.getItem('hexara_avatar') || '⚓';
      if (savedName) setGuestName(savedName);
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGuestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = guestName.trim() || 'Captain Voyager';
    setIsLoading(true);

    try {
      let playerId = localStorage.getItem('hexara_player_id');
      if (!playerId) {
        playerId = 'guest_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('hexara_player_id', playerId);
      }
      sessionStorage.setItem('hexara_player_id', playerId);

      // Attempt to get token from server guest endpoint
      try {
        const res = await fetch('http://localhost:3001/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanName, guestId: playerId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('hexara_auth_token', data.token);
            sessionStorage.setItem('hexara_auth_token', data.token);
          }
        }
      } catch (err) {
        // Fallback offline token
        const mockToken = 'guest_token_' + Date.now();
        localStorage.setItem('hexara_auth_token', mockToken);
        sessionStorage.setItem('hexara_auth_token', mockToken);
      }

      localStorage.setItem('hexara_username', cleanName);
      sessionStorage.setItem('hexara_username', cleanName);
      localStorage.setItem('hexara_avatar', selectedAvatar);
      sessionStorage.setItem('hexara_avatar', selectedAvatar);

      const profile: UserProfile = {
        id: playerId,
        username: cleanName,
        avatar: selectedAvatar,
        isGuest: true,
        level: 4,
        xp: 1450,
      };

      onAuthSuccess?.(profile);
      setAuthSuccessMsg(`Welcome aboard, ${cleanName}!`);
      setTimeout(() => {
        setAuthSuccessMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setAuthErrorMsg(err.message || 'Error creating guest session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthErrorMsg('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setAuthErrorMsg(null);

    // Create / Sign In simulation with persistence
    setTimeout(() => {
      const cleanName = email.split('@')[0] || 'Captain Voyager';
      const playerId = 'user_' + Math.random().toString(36).substring(2, 9);
      const token = 'jwt_auth_' + Date.now();

      localStorage.setItem('hexara_player_id', playerId);
      sessionStorage.setItem('hexara_player_id', playerId);
      localStorage.setItem('hexara_username', cleanName);
      sessionStorage.setItem('hexara_username', cleanName);
      localStorage.setItem('hexara_auth_token', token);
      sessionStorage.setItem('hexara_auth_token', token);
      localStorage.setItem('hexara_avatar', selectedAvatar);

      const profile: UserProfile = {
        id: playerId,
        username: cleanName,
        avatar: selectedAvatar,
        isGuest: false,
        level: 5,
        xp: 2100,
      };

      onAuthSuccess?.(profile);
      setAuthSuccessMsg(`Logged in as ${cleanName}!`);
      setIsLoading(false);
      setTimeout(() => {
        setAuthSuccessMsg(null);
        onClose();
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2e170d] via-[#1f0f08] to-[#110704] border-2 border-amber-500/70 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden">
        {/* Header Ribbon */}
        <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-[#3d1e10] to-amber-950 border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-200">
                Captain's Registry
              </h2>
              <p className="text-[10px] text-amber-400/80 font-medium">
                Identity & Multiplayer Settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-400 hover:text-white hover:bg-black/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 gap-1.5 bg-black/40 border-b border-amber-500/30">
          <button
            onClick={() => setTab('guest')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'guest'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Play as Guest</span>
          </button>
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {authSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{authSuccessMsg}</span>
            </div>
          )}
          {authErrorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold">
              {authErrorMsg}
            </div>
          )}

          {tab === 'guest' ? (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-amber-200/90 block mb-1.5">
                  Your Voyager Name (shown to other players):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={20}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-black/60 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-black text-amber-100 placeholder:text-stone-600 focus:outline-none shadow-inner"
                  />
                  <div className="absolute right-3 top-2.5 text-amber-400 text-sm font-bold">
                    ⚓
                  </div>
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-[11px] font-bold text-amber-200/90 block mb-2">
                  Select Your Crest Avatar:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av.icon}
                      type="button"
                      onClick={() => setSelectedAvatar(av.icon)}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        selectedAvatar === av.icon
                          ? 'bg-amber-500/20 border-amber-300 ring-2 ring-amber-400/60 scale-105 shadow-md'
                          : 'bg-black/40 border-amber-900/60 hover:border-amber-600/60 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span className="text-2xl">{av.icon}</span>
                      <span className="text-[9px] font-bold text-amber-200/80 truncate w-full text-center">
                        {av.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Play as Guest Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="catan-btn-gold w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all mt-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isLoading ? 'Entering Realm...' : 'Play Instantly as Guest'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleAccountSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-amber-200/90 block mb-1">
                  Email Address:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voyager@hexara.com"
                    required
                    className="w-full bg-black/60 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-200/90 block mb-1">
                  Password:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-black/60 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="catan-btn-gold w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all mt-3"
              >
                <Shield className="w-4 h-4" />
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : tab === 'signup'
                    ? 'Create Voyager Account'
                    : 'Sign In & Load Progress'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
