'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  MessageSquare,
  Users,
  Shield,
  Trophy,
  BookOpen,
  Settings,
  ShoppingBag,
  Coins,
  Scroll,
  Plus,
  Play,
  Volume2,
  Sparkles,
  Award,
  LogIn,
  UserPlus,
  Zap,
  RotateCcw,
  ArrowRight,
  Globe,
  Bot,
} from 'lucide-react';
import { ProfileModal } from '../components/modals/ProfileModal';
import { FriendsModal } from '../components/modals/FriendsModal';
import { MessagesModal } from '../components/modals/MessagesModal';
import { AlmanacModal } from '../components/modals/AlmanacModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { RankingsModal } from '../components/modals/RankingsModal';
import { CollectionModal } from '../components/modals/CollectionModal';
import { ShopModal } from '../components/modals/ShopModal';
import { GuildsModal } from '../components/modals/GuildsModal';
import { ScenarioModal } from '../components/lobby/ScenarioModal';
import { LobbyRoomModal } from '../components/lobby/LobbyRoomModal';
import { CharacterModelViewer } from '../components/lobby/CharacterModelViewer';
import { FullscreenButton } from '../components/common/FullscreenButton';
import { AuthModal, UserProfile } from '../components/modals/AuthModal';
import { soundManager } from '../game/SoundManager';
import { CLIENT_EVENTS } from '@hexara/protocol';
import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../lib/serverUrl';

const ROOM_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateRoomCode(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
  }
  return result;
}

export default function HomePage() {
  // Modals state
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isFriendsOpen, setFriendsOpen] = useState(false);
  const [isMessagesOpen, setMessagesOpen] = useState(false);
  const [isAlmanacOpen, setAlmanacOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isRankingsOpen, setRankingsOpen] = useState(false);
  const [isCollectionOpen, setCollectionOpen] = useState(false);
  const [isShopOpen, setShopOpen] = useState(false);
  const [isGuildsOpen, setGuildsOpen] = useState(false);
  const [isScenarioOpen, setScenarioOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);

  // Online Multiplayer Lobby Modal state
  const [isLobbyModalOpen, setLobbyModalOpen] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState('');
  const [isRoomHost, setIsRoomHost] = useState(false);

  // Quick room join input
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [quickJoinError, setQuickJoinError] = useState<string | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hexara_user_profile');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      const savedName = localStorage.getItem('hexara_username') || 'Ram';
      const savedAvatar = localStorage.getItem('hexara_avatar') || '🧙';
      const savedId = localStorage.getItem('hexara_player_id') || 'guest_ram';
      return {
        id: savedId,
        username: savedName,
        avatar: savedAvatar,
        isGuest: true,
        level: 3,
        xp: 1450,
        gamesPlayed: 8,
        wins: 4,
        totalVictoryPoints: 68,
      };
    }
    return {
      id: 'guest_ram',
      username: 'Ram',
      avatar: '🧙',
      isGuest: true,
      level: 3,
      xp: 1450,
      gamesPlayed: 8,
      wins: 4,
      totalVictoryPoints: 68,
    };
  });

  const [coins, setCoins] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hexara_coins');
      if (saved) return Number(saved);
    }
    return 1250;
  });

  const [scrolls, setScrolls] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hexara_scrolls');
      if (saved) return Number(saved);
    }
    return 18;
  });
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [activeGameRoom, setActiveGameRoom] = useState('');

  // Check URL parameters & local active games
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user has active game to continue
    const savedRoom = sessionStorage.getItem('hexara_room_code');
    const savedState = sessionStorage.getItem('hexara_active_game_state');
    if (savedRoom || savedState) {
      setHasActiveGame(true);
      setActiveGameRoom(savedRoom || 'HEXARA');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const codeParam = urlParams.get('room') || urlParams.get('code') || hashParams.get('room') || hashParams.get('code');

    if (codeParam) {
      const code = codeParam.toUpperCase();
      setActiveRoomCode(code);
      setIsRoomHost(false);
      setLobbyModalOpen(true);
    }
  }, []);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    setAuthOpen(false);
  };

  const handleStartSolo = () => {
    soundManager.playClick();
    sessionStorage.setItem('hexara_match_mode', 'solo');
    sessionStorage.setItem('hexara_scenario_id', 'first_island');
    sessionStorage.setItem('hexara_scenario_name', 'The First Island');
    sessionStorage.setItem('hexara_player_count', '4');
    sessionStorage.setItem('hexara_vp_target', '10');
    sessionStorage.setItem('hexara_board_seed', String(Math.floor(100000 + Math.random() * 900000)));
    sessionStorage.removeItem('hexara_active_game_state');
    sessionStorage.removeItem('hexara_room_code');
    window.location.hash = '#/game';
  };

  const handleOpenCreateOnline = () => {
    soundManager.playClick();
    setScenarioOpen(true);
  };

  const handleLaunchFromScenario = (options: {
    scenarioId: string;
    scenarioName: string;
    mode: 'solo' | 'online';
    playerCount: number;
    victoryPoints: number;
    boardSeed: number;
    roomCode?: string;
    turnDurationSeconds?: number;
  }) => {
    setScenarioOpen(false);
    const turnDuration = options.turnDurationSeconds || 60;
    sessionStorage.setItem('hexara_turn_duration', String(turnDuration));

    if (options.mode === 'solo') {
      sessionStorage.setItem('hexara_match_mode', 'solo');
      sessionStorage.setItem('hexara_scenario_id', options.scenarioId);
      sessionStorage.setItem('hexara_scenario_name', options.scenarioName);
      sessionStorage.setItem('hexara_player_count', String(options.playerCount));
      sessionStorage.setItem('hexara_vp_target', String(options.victoryPoints));
      sessionStorage.setItem('hexara_board_seed', String(options.boardSeed));
      sessionStorage.removeItem('hexara_active_game_state');
      sessionStorage.removeItem('hexara_room_code');
      window.location.hash = '#/game';
    } else {
      // Create Online Room Code and Open Lobby
      const code = options.roomCode || generateRoomCode();
      setActiveRoomCode(code);
      setIsRoomHost(true);
      sessionStorage.setItem('hexara_match_mode', 'online');
      sessionStorage.setItem('hexara_room_code', code);
      sessionStorage.setItem('hexara_scenario_id', options.scenarioId);
      sessionStorage.setItem('hexara_scenario_name', options.scenarioName);
      sessionStorage.setItem('hexara_player_count', String(options.playerCount));
      sessionStorage.setItem('hexara_vp_target', String(options.victoryPoints));
      sessionStorage.setItem('hexara_board_seed', String(options.boardSeed));

      // Emit create_game to server
      const token = localStorage.getItem('hexara_auth_token') || sessionStorage.getItem('hexara_auth_token');
      const socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        auth: { token, username: userProfile.username, playerId: userProfile.id },
      });

      socket.emit(CLIENT_EVENTS.CREATE_GAME, {
        scenarioId: options.scenarioId,
        scenarioName: options.scenarioName,
        targetVictoryPoints: options.victoryPoints,
        maxPlayers: options.playerCount,
        mode: 'online',
        seed: options.boardSeed,
        turnDurationSeconds: turnDuration,
      });

      setLobbyModalOpen(true);
    }
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const clean = quickJoinCode.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      soundManager.playError();
      setQuickJoinError('Please enter a valid 6-character room code');
      return;
    }

    setQuickJoinError(null);
    setActiveRoomCode(clean);
    setIsRoomHost(false);
    sessionStorage.setItem('hexara_match_mode', 'online');
    sessionStorage.setItem('hexara_room_code', clean);
    setLobbyModalOpen(true);
  };

  const handleGameStartedFromLobby = (code: string) => {
    setLobbyModalOpen(false);
    sessionStorage.setItem('hexara_match_mode', 'online');
    sessionStorage.setItem('hexara_room_code', code);
    window.location.hash = '#/game';
  };

  const handleContinueVoyage = () => {
    soundManager.playClick();
    window.location.hash = '#/game';
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden select-none flex flex-col justify-between">
      {/* High-Resolution Sunset Panoramic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transform scale-100"
        style={{ backgroundImage: "url('/lobby-bg.jpg')" }}
      />
      {/* Vignette Overlays for Depth & Crisp Typography */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.6)_100%)] pointer-events-none" />

      {/* ============================================================ */}
      {/* TOP HEADER: Player Profile Badge (Left) & Currency / Shop (Right) */}
      {/* ============================================================ */}
      <header className="relative z-20 flex items-center justify-between px-6 pt-4 w-full">
        {/* Top-Left: Player Profile Badge */}
        <button
          onClick={() => {
            soundManager.playClick();
            setProfileOpen(true);
          }}
          className="group flex items-center gap-3 bg-gradient-to-r from-black/85 to-black/50 p-1.5 pr-4 rounded-full border border-amber-500/50 hover:border-amber-400 transition-all hover:scale-105 shadow-xl"
        >
          <div className="relative">
            {/* Hexagon Avatar */}
            <div className="w-12 h-12 clip-hex bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 p-[3px] flex items-center justify-center shadow-lg">
              <div className="w-full h-full clip-hex bg-[#2b170c] flex items-center justify-center text-xl">
                {userProfile.avatar}
              </div>
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-amber-200 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
              {userProfile.level || 1}
            </div>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-100 uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                {userProfile.username}
              </span>
              {userProfile.isGuest ? (
                <span className="text-[9px] bg-amber-700/50 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">GUEST</span>
              ) : (
                <span className="text-[9px] bg-emerald-700/50 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">VOYAGER</span>
              )}
            </div>
            {/* XP Bar */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-1.5 rounded-full bg-black/60 border border-amber-500/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full"
                  style={{ width: `${Math.min(100, ((userProfile.xp || 0) % 1000) / 10)}%` }}
                />
              </div>
              <span className="text-[9px] text-amber-200/80 font-mono font-bold">
                {(userProfile.xp || 0).toLocaleString()} XP
              </span>
            </div>
          </div>
        </button>

        {/* Top Center: Game Title Logo */}
        <div className="hidden md:flex flex-col items-center">
          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] flex items-center gap-2 font-serif">
            <Compass className="w-6 h-6 text-amber-400 animate-spin-slow inline" />
            Isles of Hexara
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-amber-200/60">
            Build &bull; Trade &bull; Conquer
          </span>
        </div>

        {/* Top-Right: Currency Pills & Modals */}
        <div className="flex items-center gap-3">
          {/* Scrolls */}
          <button
            onClick={() => { soundManager.playClick(); setShopOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241710]/90 hover:bg-[#341d14] border border-amber-600/50 shadow-inner cursor-pointer transition-all"
            title="Ancient Scrolls Treasury"
          >
            <Scroll className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-100">{scrolls}</span>
          </button>

          {/* Gold Coins */}
          <button
            onClick={() => { soundManager.playClick(); setShopOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241710]/90 hover:bg-[#341d14] border border-amber-600/50 shadow-inner cursor-pointer transition-all"
            title="Isles Gold Treasury"
          >
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="text-xs font-black text-amber-100">{coins}</span>
          </button>

          {/* Shop / Bazaar Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShopOpen(true);
            }}
            className="catan-btn-gold px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
            title="Open Isles Bazaar"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Bazaar</span>
          </button>

          {/* Captain's Registry / Switch Account */}
          <button
            onClick={() => {
              soundManager.playClick();
              setAuthOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all border-amber-600/50 bg-[#241710]/90 text-amber-200 hover:bg-amber-800/60 hover:border-amber-400"
            title="Captain's Registry"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">{userProfile.isGuest ? 'Sign In' : 'Account'}</span>
          </button>

          {/* Fullscreen Mode */}
          <FullscreenButton />
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN COMMAND CENTER: Navigation, 3D Hero Stage, Play Controls */}
      {/* ============================================================ */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-between px-4 md:px-12 py-2 overflow-hidden">
        {/* Left Side Navigation Pill Stack */}
        <div className="hidden md:flex flex-col gap-3 z-20">
          <button
            onClick={() => { soundManager.playClick(); setMessagesOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg relative"
          >
            <MessageSquare className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Messages</span>
            <div className="ml-auto w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border border-amber-200">
              1
            </div>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setFriendsOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Users className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Friends</span>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => { soundManager.playClick(); setGuildsOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Guilds</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setShopOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg cursor-pointer"
            title="Open Isles Bazaar & Store"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Bazaar</span>
          </button>
        </div>

        {/* Center Stage: 3D Character Hero on Stone Pedestal */}
        <div className="flex flex-col items-center justify-center relative my-auto">
          {/* Glowing Hero Aura */}
          <div className="absolute -top-12 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/15 to-transparent blur-3xl pointer-events-none" />

          {/* Continue Voyage Banner if active session */}
          {hasActiveGame && (
            <div
              onClick={handleContinueVoyage}
              className="absolute -top-16 z-30 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-950/90 via-[#451e0e]/95 to-amber-950/90 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer hover:scale-105 transition-all flex items-center gap-2.5 animate-pulse"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-black text-amber-300 tracking-wider block">
                  Active Voyage Available
                </span>
                <span className="text-[9px] text-amber-100 font-bold font-mono">
                  Room: {activeGameRoom} &bull; Click to Resume
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-300 ml-1" />
            </div>
          )}

          {/* 3D Character Viewport Box */}
          <div className="w-56 h-72 sm:w-64 sm:h-80 md:w-72 md:h-96 relative flex flex-col items-center justify-end pb-2 group">
            {/* 3D Model Canvas */}
            <div className="w-full h-full relative z-10 flex items-center justify-center">
              <CharacterModelViewer
                modelUrl="/models/tanjiro.glb"
                className="w-full h-full"
                onModelClick={() => setProfileOpen(true)}
              />
            </div>

            {/* Character Identity Pill Badge */}
            <div
              onClick={() => { soundManager.playClick(); setProfileOpen(true); }}
              className="absolute top-2 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-black/85 via-[#2b170c]/95 to-black/85 border border-amber-500/60 backdrop-blur-md shadow-lg cursor-pointer hover:border-amber-300 hover:scale-105 transition-all text-center"
            >
              <span className="text-xs font-black uppercase text-amber-200 tracking-wider flex items-center gap-1.5 justify-center">
                <span>{userProfile.avatar}</span>
                <span>{userProfile.username}</span>
              </span>
              <span className="text-[9px] text-amber-300/80 font-bold block">
                Welcome back, Captain
              </span>
            </div>

            {/* Stone Pedestal Base */}
            <div className="w-48 sm:w-56 h-10 rounded-full bg-gradient-to-b from-[#4a3224] via-[#241710] to-[#120a06] border-2 border-amber-500/70 shadow-[0_15px_30px_rgba(0,0,0,0.9)] -mt-5 z-0 flex items-center justify-center">
              <span className="text-[9px] uppercase tracking-[0.25em] font-black text-amber-300/80">
                Isles of Hexara
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Navigation Pill Stack */}
        <div className="hidden md:flex flex-col gap-3 z-20">
          <button
            onClick={() => { soundManager.playClick(); setRankingsOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Rankings</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setAlmanacOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Almanac</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setSettingsOpen(true); }}
            className="catan-pill-btn px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Settings className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Options</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM COMMAND BAR: Play Solo, Play Online, Join with Code */}
      {/* ============================================================ */}
      <footer className="relative z-20 flex flex-col md:flex-row items-center justify-between px-6 pb-6 gap-4 w-full">
        {/* Left: Your Journey Statistics Pill */}
        <div className="flex items-center gap-4 bg-[#241710]/95 px-5 py-2.5 rounded-2xl border border-amber-600/50 shadow-xl">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-amber-400/80">Your Journey</span>
            <span className="text-xs font-bold text-amber-100">
              {userProfile.gamesPlayed || 8} Matches &bull; {userProfile.wins || 4} Wins
            </span>
          </div>
          <div className="h-6 w-[1px] bg-amber-600/40" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-amber-400/80">Best Score</span>
            <span className="text-xs font-bold text-amber-300 font-mono">10 VP</span>
          </div>
        </div>

        {/* Center: Quick Join by Room Code */}
        <form onSubmit={handleQuickJoin} className="flex items-center gap-2 bg-[#1f0f08]/95 p-1.5 rounded-2xl border border-amber-500/60 shadow-xl">
          <Globe className="w-4 h-4 text-amber-400 ml-2" />
          <input
            type="text"
            maxLength={6}
            value={quickJoinCode}
            onChange={(e) => {
              setQuickJoinCode(e.target.value.toUpperCase());
              setQuickJoinError(null);
            }}
            placeholder="ENTER CODE"
            className="w-28 bg-black/60 border border-amber-600/50 rounded-xl px-2.5 py-2 text-center text-xs font-black tracking-widest text-amber-200 placeholder:text-stone-600 uppercase focus:outline-none focus:border-amber-400 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider shadow"
          >
            Join
          </button>
        </form>

        {/* Right: Primary Action Buttons (Play Solo & Play Online) */}
        <div className="flex items-center gap-3">
          {/* Play Solo Button */}
          <button
            onClick={handleStartSolo}
            className="px-6 py-3.5 rounded-2xl bg-[#2b170c] hover:bg-[#3d2212] border-2 border-amber-500/70 text-amber-200 hover:text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95"
            title="Start Match vs AI Bots"
          >
            <Bot className="w-5 h-5 text-amber-400" />
            <span>Play Solo</span>
          </button>

          {/* Massive Embossed Gold PLAY ONLINE Button */}
          <button
            onClick={handleOpenCreateOnline}
            className="catan-btn-gold px-8 py-3.5 rounded-2xl text-base md:text-lg font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.6)] active:scale-95 transition-all"
          >
            <span className="text-xl">⚔️</span>
            <span>Play Online</span>
          </button>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* ALL MODAL DIALOGS */}
      {/* ============================================================ */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setProfileOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={(updated) => setUserProfile(updated)}
        onLogout={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
      />
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setFriendsOpen(false)}
        onOpenMessages={() => setMessagesOpen(true)}
      />
      <MessagesModal
        isOpen={isMessagesOpen}
        onClose={() => setMessagesOpen(false)}
        onOpenFriends={() => setFriendsOpen(true)}
      />
      <AlmanacModal isOpen={isAlmanacOpen} onClose={() => setAlmanacOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => {
          setSettingsOpen(false);
          setAuthOpen(true);
        }}
      />
      <RankingsModal
        isOpen={isRankingsOpen}
        onClose={() => setRankingsOpen(false)}
        currentUser={userProfile}
      />
      <CollectionModal
        isOpen={isCollectionOpen}
        onClose={() => setCollectionOpen(false)}
        coins={coins}
        scrolls={scrolls}
      />
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setShopOpen(false)}
        coins={coins}
        scrolls={scrolls}
        onCoinsChange={(c) => {
          setCoins(c);
          localStorage.setItem('hexara_coins', c.toString());
        }}
        onScrollsChange={(s) => {
          setScrolls(s);
          localStorage.setItem('hexara_scrolls', s.toString());
        }}
        onAvatarChange={(av) => {
          setUserProfile((prev) => ({ ...prev, avatar: av }));
          localStorage.setItem('hexara_avatar', av);
        }}
        currentAvatar={userProfile.avatar}
      />
      <GuildsModal
        isOpen={isGuildsOpen}
        onClose={() => setGuildsOpen(false)}
      />
      <ScenarioModal
        isOpen={isScenarioOpen}
        onClose={() => setScenarioOpen(false)}
        onLaunchGame={handleLaunchFromScenario}
        initialMode="online"
      />
      <LobbyRoomModal
        isOpen={isLobbyModalOpen}
        onClose={() => setLobbyModalOpen(false)}
        roomCode={activeRoomCode}
        isHost={isRoomHost}
        userProfile={userProfile}
        onGameStarted={handleGameStartedFromLobby}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}
