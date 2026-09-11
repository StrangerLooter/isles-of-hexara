'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  Sparkles,
  Shield,
  Check,
  X,
  Compass,
  Zap,
  User,
  AlertCircle,
} from 'lucide-react';
import { soundManager } from '../../game/SoundManager';

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  isGuest: boolean;
  token?: string;
  level: number;
  xp: number;
  gamesPlayed?: number;
  wins?: number;
  totalVictoryPoints?: number;
}

export const CREST_AVATARS = [
  { id: 'captain', icon: '⚓', name: 'Captain' },
  { id: 'scout', icon: '🏹', name: 'Scout' },
  { id: 'monarch', icon: '👑', name: 'Monarch' },
  { id: 'merchant', icon: '🦙', name: 'Merchant' },
  { id: 'knight', icon: '⚔️', name: 'Knight' },
  { id: 'mystic', icon: '🧙', name: 'Mystic' },
  { id: 'corsair', icon: '🌊', name: 'Corsair' },
  { id: 'dragon', icon: '🐲', name: 'Dragon Raider' },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (profile: UserProfile) => void;
}

const API_BASE = 'http://localhost:3001';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'guest' | 'login' | 'signup'>('guest');
  const [guestName, setGuestName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧙'); // Default Mystic matching user reference
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('hexara_username') || sessionStorage.getItem('hexara_username');
      const savedAvatar = localStorage.getItem('hexara_avatar') || '🧙';
      if (savedName) setGuestName(savedName);
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateName = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return 'Please enter your Voyager Name';
    if (trimmed.length < 3) return 'Voyager Name must be at least 3 characters';
    if (trimmed.length > 24) return 'Voyager Name cannot exceed 24 characters';
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
      return 'Only letters, numbers, spaces, underscores, and hyphens allowed';
    }
    return null;
  };

  const saveProfileLocally = (profile: UserProfile, token?: string) => {
    localStorage.setItem('hexara_user_profile', JSON.stringify(profile));
    sessionStorage.setItem('hexara_user_profile', JSON.stringify(profile));
    localStorage.setItem('hexara_player_id', profile.id);
    sessionStorage.setItem('hexara_player_id', profile.id);
    localStorage.setItem('hexara_username', profile.username);
    sessionStorage.setItem('hexara_username', profile.username);
    localStorage.setItem('hexara_avatar', profile.avatar);
    sessionStorage.setItem('hexara_avatar', profile.avatar);

    if (token) {
      localStorage.setItem('hexara_auth_token', token);
      sessionStorage.setItem('hexara_auth_token', token);
    }
  };

  const handleGuestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundManager.playClick();
    setAuthErrorMsg(null);

    const nameError = validateName(guestName);
    if (nameError) {
      soundManager.playError();
      setAuthErrorMsg(nameError);
      return;
    }

    const cleanName = guestName.trim();
    setIsLoading(true);

    try {
      let token: string | undefined;
      let userId: string = 'guest_' + Math.random().toString(36).substring(2, 9);
      let level = 1;
      let xp = 0;
      let gamesPlayed = 0;
      let wins = 0;
      let totalVictoryPoints = 0;

      try {
        const res = await fetch(`${API_BASE}/api/auth/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanName, avatarId: selectedAvatar }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.token) token = data.token;
          if (data.user?.id) userId = data.user.id;
          if (data.profile) {
            level = data.profile.level || 1;
            xp = data.profile.experience || 0;
            gamesPlayed = data.profile.gamesPlayed || 0;
            wins = data.profile.wins || 0;
            totalVictoryPoints = data.profile.totalVictoryPoints || 0;
          }
        }
      } catch {
        // In offline mode, create local guest session
        token = 'guest_offline_' + Date.now();
      }

      const profile: UserProfile = {
        id: userId,
        username: cleanName,
        avatar: selectedAvatar,
        isGuest: true,
        token,
        level,
        xp,
        gamesPlayed,
        wins,
        totalVictoryPoints,
      };

      saveProfileLocally(profile, token);
      soundManager.playTurnChime();
      setAuthSuccessMsg(`Welcome aboard, ${cleanName}!`);
      onAuthSuccess?.(profile);

      setTimeout(() => {
        setAuthSuccessMsg(null);
        onClose();
      }, 500);
    } catch (err: any) {
      soundManager.playError();
      setAuthErrorMsg(err.message || 'Error initializing guest session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    setAuthErrorMsg(null);

    const nameError = validateName(guestName);
    if (nameError) {
      soundManager.playError();
      setAuthErrorMsg(nameError);
      return;
    }
    if (!email || !email.includes('@')) {
      soundManager.playError();
      setAuthErrorMsg('Please provide a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      soundManager.playError();
      setAuthErrorMsg('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: guestName.trim(),
          email: email.trim().toLowerCase(),
          password,
          avatarId: selectedAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const profile: UserProfile = {
        id: data.user.id,
        username: data.user.username,
        avatar: selectedAvatar,
        isGuest: false,
        token: data.token,
        level: data.profile.level || 1,
        xp: data.profile.experience || 0,
        gamesPlayed: data.profile.gamesPlayed || 0,
        wins: data.profile.wins || 0,
        totalVictoryPoints: data.profile.totalVictoryPoints || 0,
      };

      saveProfileLocally(profile, data.token);
      soundManager.playTurnChime();
      setAuthSuccessMsg(`Voyager Account Registered! Welcome, ${profile.username}`);
      onAuthSuccess?.(profile);

      setTimeout(() => {
        setAuthSuccessMsg(null);
        onClose();
      }, 600);
    } catch (err: any) {
      soundManager.playError();
      setAuthErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    setAuthErrorMsg(null);

    if (!email) {
      soundManager.playError();
      setAuthErrorMsg('Please enter your email or voyager name');
      return;
    }
    if (!password) {
      soundManager.playError();
      setAuthErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      const avatar = data.profile?.avatarId || selectedAvatar;
      const profile: UserProfile = {
        id: data.user.id,
        username: data.user.username,
        avatar,
        isGuest: false,
        token: data.token,
        level: data.profile.level || 1,
        xp: data.profile.experience || 0,
        gamesPlayed: data.profile.gamesPlayed || 0,
        wins: data.profile.wins || 0,
        totalVictoryPoints: data.profile.totalVictoryPoints || 0,
      };

      saveProfileLocally(profile, data.token);
      soundManager.playTurnChime();
      setAuthSuccessMsg(`Welcome back, ${profile.username}!`);
      onAuthSuccess?.(profile);

      setTimeout(() => {
        setAuthSuccessMsg(null);
        onClose();
      }, 600);
    } catch (err: any) {
      soundManager.playError();
      setAuthErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none p-4">
      {/* Centered Dark Fantasy / Maritime Panel matching Reference Image 2 */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#2e170d] via-[#1f0f08] to-[#110704] border-2 border-amber-500/70 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.4)] overflow-hidden">
        {/* Header Bar */}
        <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-[#3d1e10] to-amber-950 border-b border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-amber-200 font-serif">
                Captain's Registry
              </h2>
              <p className="text-[10px] text-amber-400/80 font-medium tracking-wide">
                Identity & Multiplayer Settings
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-amber-400 hover:text-white hover:bg-black/40 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ornate Tabs */}
        <div className="flex p-2 gap-1.5 bg-black/40 border-b border-amber-500/30">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setTab('guest');
              setAuthErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'guest'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Play as Guest</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setTab('login');
              setAuthErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setTab('signup');
              setAuthErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {authSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {authErrorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{authErrorMsg}</span>
            </div>
          )}

          {tab === 'guest' && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-1.5">
                  Your Voyager Name (shown to other players):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={24}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name (e.g. Ram)"
                    className="w-full bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-black text-amber-100 placeholder:text-stone-600 focus:outline-none shadow-inner"
                    autoFocus
                  />
                  <div className="absolute right-3.5 top-3.5 text-amber-400 text-base">
                    ⚓
                  </div>
                </div>
              </div>

              {/* Crest Avatar Selector (8 Options) */}
              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-2">
                  Select Your Crest Avatar:
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {CREST_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedAvatar(av.icon);
                      }}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        selectedAvatar === av.icon
                          ? 'bg-amber-500/25 border-amber-300 ring-2 ring-amber-400/70 scale-105 shadow-lg'
                          : 'bg-black/50 border-amber-900/60 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <span className="text-2xl">{av.icon}</span>
                      <span className="text-[10px] font-bold text-amber-200/90 truncate w-full text-center">
                        {av.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="catan-btn-gold w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all mt-3"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isLoading ? 'Preparing Voyage...' : 'Play Instantly as Guest'}</span>
              </button>
            </form>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-1.5">
                  Email or Voyager Name:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voyager@hexara.com or Ram"
                    required
                    className="w-full bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-1.5">
                  Password:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="catan-btn-gold w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isLoading ? 'Verifying...' : 'Sign In & Load Progress'}</span>
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-1">
                  Voyager Display Name:
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Ram"
                  required
                  className="w-full bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2 text-sm font-black text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-1">
                  Email Address:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voyager@hexara.com"
                    required
                    className="w-full bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2 text-sm font-bold text-amber-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-amber-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-200/90 block mb-1">
                  Password (min 6 characters):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-black/70 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2 text-sm font-bold text-amber-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-amber-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-200/90 block mb-1">
                  Select Crest Avatar:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CREST_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedAvatar(av.icon);
                      }}
                      className={`p-1.5 rounded-lg border flex flex-col items-center ${
                        selectedAvatar === av.icon
                          ? 'bg-amber-500/25 border-amber-300 ring-1 ring-amber-400'
                          : 'bg-black/50 border-amber-900/60'
                      }`}
                    >
                      <span className="text-lg">{av.icon}</span>
                      <span className="text-[9px] font-bold text-amber-200/90 truncate">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="catan-btn-gold w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isLoading ? 'Registering...' : 'Create Voyager Account'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
