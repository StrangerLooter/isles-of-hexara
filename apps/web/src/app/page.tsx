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
} from 'lucide-react';
import { ProfileModal } from '../components/modals/ProfileModal';
import { FriendsModal } from '../components/modals/FriendsModal';
import { MessagesModal } from '../components/modals/MessagesModal';
import { AlmanacModal } from '../components/modals/AlmanacModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { ScenarioModal } from '../components/lobby/ScenarioModal';
import { CharacterModelViewer } from '../components/lobby/CharacterModelViewer';
import { FullscreenButton } from '../components/common/FullscreenButton';

export default function HomePage() {
  // Modal states
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isFriendsOpen, setFriendsOpen] = useState(false);
  const [isMessagesOpen, setMessagesOpen] = useState(false);
  const [isAlmanacOpen, setAlmanacOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isScenarioOpen, setScenarioOpen] = useState(false);

  // Mode selection state
  const [lobbyMode, setLobbyMode] = useState<'solo' | 'online'>('solo');
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [coins, setCoins] = useState(1250);
  const [scrolls, setScrolls] = useState(18);

  // Check for URL parameters (?room=XYZ or ?code=XYZ)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const codeParam = urlParams.get('room') || urlParams.get('code') || hashParams.get('room') || hashParams.get('code');
    if (codeParam) {
      setLobbyMode('online');
      setInitialRoomCode(codeParam.toUpperCase());
      setScenarioOpen(true);
    }
  }, []);

  const handleLaunchGame = (options: {
    scenarioId: string;
    scenarioName: string;
    mode: 'solo' | 'online';
    playerCount: number;
    aiDifficulty: 'NOVICE' | 'EXPERT' | 'MASTER';
    victoryPoints: number;
    randomPlayerStarts: boolean;
    friendlyRobber: boolean;
    balancedDice: boolean;
    randomMapTopology: boolean;
    boardSeed: number;
    roomCode?: string;
  }) => {
    // Store match preferences in sessionStorage for GameHUD and BabylonGame
    sessionStorage.setItem('hexara_scenario_id', options.scenarioId);
    sessionStorage.setItem('hexara_scenario_name', options.scenarioName);
    sessionStorage.setItem('hexara_match_mode', options.mode);
    sessionStorage.setItem('hexara_player_count', String(options.playerCount));
    sessionStorage.setItem('hexara_ai_diff', options.aiDifficulty);
    sessionStorage.setItem('hexara_vp_target', String(options.victoryPoints));
    sessionStorage.setItem('hexara_friendly_robber', String(options.friendlyRobber));
    sessionStorage.setItem('hexara_balanced_dice', String(options.balancedDice));
    sessionStorage.setItem('hexara_board_seed', String(options.boardSeed));
    sessionStorage.setItem('hexara_random_topology', String(options.randomMapTopology));
    if (options.roomCode) {
      sessionStorage.setItem('hexara_room_code', options.roomCode);
    }
    
    // Clear any previous game state to ensure clean start
    sessionStorage.removeItem('hexara_active_game_state');
    window.location.hash = '#/game';
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden select-none flex flex-col justify-between">
      {/* High-Resolution Sunset Landscape Panoramic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transform scale-100"
        style={{ backgroundImage: "url('/lobby-bg.jpg')" }}
      />
      {/* Vignette & Contrast Overlays for Crisp Text & Buttons */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(0,0,0,0.55)_100%)] pointer-events-none" />

      {/* ============================================================ */}
      {/* TOP HEADER: Profile Hex Badge (Left) & Currency / Shop (Right) */}
      {/* ============================================================ */}
      <header className="relative z-20 flex items-center justify-between px-6 pt-4 w-full">
        {/* Top-Left: Player Profile Hex Badge */}
        <button
          onClick={() => setProfileOpen(true)}
          className="group flex items-center gap-3 bg-gradient-to-r from-black/80 to-black/40 p-1.5 pr-4 rounded-full border border-amber-500/40 hover:border-amber-400 transition-all hover:scale-105 shadow-xl"
        >
          <div className="relative">
            {/* Hexagon Avatar */}
            <div className="w-13 h-13 clip-hex bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 p-[3px] flex items-center justify-center shadow-lg">
              <div className="w-full h-full clip-hex bg-[#2b170c] flex items-center justify-center text-amber-200 font-black text-lg">
                ⚓
              </div>
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-amber-200 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
              4
            </div>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-100 uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                Captain Amber
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono font-bold">#HEX-7729</span>
            </div>
            {/* XP Bar */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-1.5 rounded-full bg-black/60 border border-amber-500/30 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-200 w-3/4 rounded-full" />
              </div>
              <span className="text-[9px] text-amber-200/80 font-bold">1,450 / 2,000</span>
            </div>
          </div>
        </button>

        {/* Top Center: Game Title Logo */}
        <div className="hidden md:flex flex-col items-center">
          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-400 animate-spin-slow inline" />
            Isles of Hexara
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-amber-200/60">
            Real-Time Maritime Colonization
          </span>
        </div>

        {/* Top-Right: Currency Pills & Shop Button */}
        <div className="flex items-center gap-3">
          {/* Scrolls */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241710]/90 border border-amber-600/50 shadow-inner">
            <Scroll className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-100">{scrolls}</span>
          </div>

          {/* Gold Coins */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241710]/90 border border-amber-600/50 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="text-xs font-black text-amber-100">{coins}</span>
          </div>

          {/* Shop / Bazaar Button */}
          <button
            onClick={() => alert('Cosmetic Bazaar: Avatars, Custom Hex Skins, and Dice Sets coming soon!')}
            className="catan-btn-gold px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
            title="Open Bazaar"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Shop</span>
          </button>

          {/* Fullscreen App Mode Button */}
          <FullscreenButton />
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN STAGE: Left Navigation, Character Center, Right Navigation */}
      {/* ============================================================ */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-between px-4 md:px-12 py-2 overflow-hidden">
        {/* Left Side Navigation Pill Stack (Matches 01_main_menu_lobby.png) */}
        <div className="hidden md:flex flex-col gap-3.5 z-20">
          <button
            onClick={() => setMessagesOpen(true)}
            className="catan-pill-btn px-4 py-2 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg relative"
          >
            <MessageSquare className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Messages</span>
            {/* Unread badge */}
            <div className="ml-auto w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border border-amber-200">
              3
            </div>
          </button>

          <button
            onClick={() => setFriendsOpen(true)}
            className="catan-pill-btn px-4 py-2 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Users className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Friends</span>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => alert('Guilds & Trading Fleets: Level 5 required.')}
            className="catan-pill-btn px-4 py-2 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Guilds</span>
          </button>
        </div>

        {/* Center Stage: 3D Character Hero Model on Pedestal & Invite Slots */}
        <div className="flex flex-col items-center justify-center relative my-auto">
          {/* Glowing Aura Behind 3D Character */}
          <div className="absolute -top-12 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/15 to-transparent blur-3xl pointer-events-none" />

          {/* Stylized 3D Pedestal Platform with 3D Character Model */}
          <div className="relative flex flex-col items-center">
            {/* 3D Model Viewport Box */}
            <div className="w-56 h-72 sm:w-64 sm:h-80 md:w-72 md:h-96 relative flex flex-col items-center justify-end pb-2 group">
              {/* 3D Character Canvas */}
              <div className="w-full h-full relative z-10 flex items-center justify-center">
                <CharacterModelViewer
                  modelUrl="/models/tanjiro.glb"
                  className="w-full h-full"
                  onModelClick={() => setProfileOpen(true)}
                />
              </div>

              {/* Character Identity Pill Badge */}
              <div 
                onClick={() => setProfileOpen(true)}
                className="absolute top-2 z-20 px-3.5 py-1 rounded-full bg-gradient-to-r from-black/80 via-[#2b170c]/90 to-black/80 border border-amber-500/50 backdrop-blur-md shadow-lg cursor-pointer hover:border-amber-400 hover:scale-105 transition-all text-center"
              >
                <span className="text-[11px] font-black uppercase text-amber-200 tracking-wider block">
                  Captain Amber
                </span>
                <span className="text-[9px] text-amber-300/80 font-bold block">
                  Grand Navigator
                </span>
              </div>

              {/* Stone Pedestal Base */}
              <div className="w-48 sm:w-56 h-10 rounded-full bg-gradient-to-b from-[#4a3224] via-[#241710] to-[#120a06] border-2 border-amber-500/70 shadow-[0_15px_30px_rgba(0,0,0,0.9)] -mt-5 z-0 flex items-center justify-center">
                <span className="text-[9px] uppercase tracking-[0.25em] font-black text-amber-300/80">
                  Isles of Hexara
                </span>
              </div>
            </div>

            {/* Companion Slots (2 slots matching 01_main_menu_lobby.png) */}
            <div className="flex items-center gap-6 -mt-2 z-10">
              <button
                onClick={() => setFriendsOpen(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 clip-hex bg-gradient-to-b from-black/80 to-black/50 backdrop-blur-sm border border-amber-400/80 flex flex-col items-center justify-center text-amber-300 hover:text-white hover:border-amber-300 hover:scale-110 shadow-lg transition-all"
                title="Invite Ally"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setFriendsOpen(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 clip-hex bg-gradient-to-b from-black/80 to-black/50 backdrop-blur-sm border border-amber-400/80 flex flex-col items-center justify-center text-amber-300 hover:text-white hover:border-amber-300 hover:scale-110 shadow-lg transition-all"
                title="Invite Ally"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Navigation Pill Stack (Matches 01_main_menu_lobby.png) */}
        <div className="hidden md:flex flex-col gap-3.5 z-20">
          <button
            onClick={() => alert('Global Voyager Rankings: Top 100 Leaderboards')}
            className="catan-pill-btn px-4 py-2 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Rankings</span>
          </button>

          <button
            onClick={() => setAlmanacOpen(true)}
            className="catan-pill-btn px-4 py-2 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Almanac</span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="catan-pill-btn px-4 py-2 rounded-xl flex items-center gap-3 min-w-[150px] shadow-lg"
          >
            <Settings className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Options</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM BAR: Solo/Online Switcher (Left) & Large PLAY Button (Right) */}
      {/* ============================================================ */}
      <footer className="relative z-20 flex items-center justify-between px-6 pb-6 w-full">
        {/* Bottom-Left: Mode Toggle (Solo vs Online) */}
        <div className="flex items-center bg-[#241710]/95 p-1 rounded-2xl border border-amber-600/50 shadow-xl">
          <button
            onClick={() => setLobbyMode('solo')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              lobbyMode === 'solo'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            Solo Play
          </button>
          <button
            onClick={() => setLobbyMode('online')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              lobbyMode === 'online'
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-amber-950 shadow-md border border-amber-300'
                : 'text-amber-200/60 hover:text-amber-100'
            }`}
          >
            Online Play
          </button>
        </div>

        {/* Bottom-Right: Massive Embossed Gold PLAY Button (01_main_menu_lobby.png) */}
        <button
          onClick={() => setScenarioOpen(true)}
          className="catan-btn-gold px-10 py-4 rounded-2xl text-lg md:text-xl font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
        >
          <span className="text-2xl">🎲</span>
          <span>Play Match</span>
        </button>
      </footer>

      {/* ============================================================ */}
      {/* MODAL DIALOGS */}
      {/* ============================================================ */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      <FriendsModal isOpen={isFriendsOpen} onClose={() => setFriendsOpen(false)} />
      <MessagesModal isOpen={isMessagesOpen} onClose={() => setMessagesOpen(false)} />
      <AlmanacModal isOpen={isAlmanacOpen} onClose={() => setAlmanacOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <ScenarioModal
        isOpen={isScenarioOpen}
        onClose={() => setScenarioOpen(false)}
        onLaunchGame={handleLaunchGame}
        initialMode={lobbyMode}
        initialRoomCode={initialRoomCode}
      />
    </main>
  );
}
