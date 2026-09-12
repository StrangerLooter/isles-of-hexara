'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Eye,
  Dices,
  Sparkles,
  Hammer,
  Ship,
  Ban,
  Trophy,
  Scroll,
  Check,
  Copy,
  CheckCircle2,
  Globe,
  Plus,
  Minus,
  Maximize2,
  Menu,
  MessageSquare,
  Users,
  Settings as SettingsIcon,
  HelpCircle,
  Landmark,
  BookOpen,
  Play,
  Flame,
  Volume2,
  Clock,
  Radio,
  BarChart3,
  MoreHorizontal,
  X,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { createInitialGameState, ResourceType } from '@hexara/game-core';
import { useGameStore } from '../../store/gameStore';
import { ScoreboardModal } from './ScoreboardModal';
import { EmojiModal, EmojiReaction } from './EmojiModal';
import { ChatLogModal, ChatMessage } from './ChatLogModal';
import { AlmanacModal } from './AlmanacModal';
import { SettingsModal, DEFAULT_SETTINGS, GameSettingsState } from './SettingsModal';
import { PlayerRibbonCard } from './PlayerRibbonCard';
import { DiceDisplay } from './DiceDisplay';
import { FullscreenButton } from '../common/FullscreenButton';
import { DevCardPanel, DevCardParams } from './DevCardPanel';
import { TurnTimer } from './TurnTimer';
import { VoiceChatControls } from './VoiceChatControls';
import { ResourceFlyAnimation } from './ResourceFlyAnimation';
import { RightSidebarWidget } from './RightSidebarWidget';
import { MobileBottomSheet } from './MobileBottomSheet';
import { ProfileModal } from '../modals/ProfileModal';
import { zoomInCamera, zoomOutCamera, resetGameCamera } from '../../game/GameCanvas';
import type { Socket } from 'socket.io-client';
import { CLIENT_EVENTS } from '@hexara/protocol';
import { soundManager } from '../../game/SoundManager';
import { UserProfile } from '../modals/AuthModal';

interface GameHUDProps {
  socket?: Socket | null;
  chatMessages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  onRollDice?: () => void;
  onEndTurn?: () => void;
  onResetCamera?: () => void;
  onConfirmPlacement?: () => void;
  onPlayDevCard?: (card: string, params?: DevCardParams) => void;
  turnDeadline?: number;
  connectionStatus?: 'connected' | 'reconnecting' | 'disconnected';
}

export const GameHUD: React.FC<GameHUDProps> = ({
  socket,
  chatMessages: externalChatMessages,
  onSendMessage: externalSendMessage,
  onRollDice,
  onEndTurn,
  onResetCamera,
  onConfirmPlacement,
  onPlayDevCard,
  turnDeadline,
  connectionStatus = 'connected',
}) => {
  const {
    gameState,
    localPlayerId,
    buildMode,
    cameraMode,
    toggleCameraMode,
    setBuildMode,
    isBuildModalOpen,
    setBuildModalOpen,
    isTradeModalOpen,
    setTradeModalOpen,
    errorToast,
  } = useGameStore();

  // Modals Open State
  const [isScoreboardOpen, setScoreboardOpen] = useState(false);
  const [isEmojiOpen, setEmojiOpen] = useState(false);
  const [isChatLogOpen, setChatLogOpen] = useState(false);
  const [isAlmanacOpen, setAlmanacOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDevCardPanelOpen, setDevCardPanelOpen] = useState(false);
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [leftDrawer, setLeftDrawer] = useState<'none' | 'chat_log' | 'stats'>('none');
  const [isMenuExpanded, setMenuExpanded] = useState(false);

  // Match Info from sessionStorage
  const scenarioName = typeof window !== 'undefined' ? sessionStorage.getItem('hexara_scenario_name') || 'The First Island' : 'The First Island';
  const vpTarget = typeof window !== 'undefined' ? sessionStorage.getItem('hexara_vp_target') || '10' : '10';
  const matchMode = typeof window !== 'undefined' ? sessionStorage.getItem('hexara_match_mode') || 'solo' : 'solo';
  const roomCode = typeof window !== 'undefined' ? sessionStorage.getItem('hexara_room_code') || '' : '';
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  const handleCopyRoom = () => {
    if (!roomCode) return;
    soundManager.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopiedRoomCode(true);
    setTimeout(() => setCopiedRoomCode(false), 2000);
  };

  // Local User Profile — read from the same persisted localStorage as the main page
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hexara_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.id && parsed.id !== 'guest_ram') return parsed;
        } catch {}
      }
      const id = localStorage.getItem('hexara_player_id') || `guest_${Date.now()}`;
      const username = localStorage.getItem('hexara_username') || 'Voyager';
      return {
        id,
        username,
        avatar: localStorage.getItem('hexara_avatar') || '🧙',
        level: 1,
        xp: 0,
        gamesPlayed: 0,
        wins: 0,
        totalVictoryPoints: 0,
      };
    }
    return {
      id: `guest_${Date.now()}`,
      username: 'Voyager',
      avatar: '🧙',
      level: 1,
      xp: 0,
      gamesPlayed: 0,
      wins: 0,
      totalVictoryPoints: 0,
    };
  });

  // Settings State with Persistence
  const [settings, setSettings] = useState<GameSettingsState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hexara_game_settings');
        if (saved) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const handleUpdateSettings = (newSettings: GameSettingsState) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hexara_game_settings', JSON.stringify(newSettings));
      } catch {}
    }
    soundManager.setMusicVolume(newSettings.musicVolume / 100);
    soundManager.setSfxVolume(newSettings.soundVolume / 100);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('reduced-motion', Boolean(newSettings.reducedMotion));
    }
  };

  useEffect(() => {
    soundManager.setMusicVolume(settings.musicVolume / 100);
    soundManager.setSfxVolume(settings.soundVolume / 100);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('reduced-motion', Boolean(settings.reducedMotion));
    }
  }, []);

  // Dice Roll History for Histogram
  const [diceHistory, setDiceHistory] = useState<number[]>([7, 6, 8, 5, 9, 7, 4, 6, 8, 10, 3]);

  // Floating Player Reactions
  const [playerReactions, setPlayerReactions] = useState<Record<string, string>>({});

  // Internal chat fallback
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'System',
      text: 'Match started on Archipelago Realm! First Island scenario active.',
      timestamp: '12:00',
      isSystem: true,
    },
  ]);

  // Turn Banner
  const [showTurnBanner, setShowTurnBanner] = useState(true);
  const [turnBannerText, setTurnBannerText] = useState({ phase: '', name: '', isMe: false });
  const lastTurnKeyRef = useRef<string>('');

  useEffect(() => {
    if (!gameState) return;
    const activePId = gameState.playerOrder[gameState.currentPlayerIndex];
    const activeP = gameState.players[activePId];
    const isMe = activePId === localPlayerId;
    const turnKey = `${gameState.currentPlayerIndex}_${gameState.phase}_${activePId}`;

    if (lastTurnKeyRef.current !== turnKey) {
      lastTurnKeyRef.current = turnKey;
      const phaseLabel = gameState.phase.replace(/_/g, ' ');
      const nameLabel = isMe ? "It's your turn." : `${activeP?.username || 'Player'}'s Turn`;
      setTurnBannerText({ phase: phaseLabel, name: nameLabel, isMe });
      setShowTurnBanner(true);

      const timer = setTimeout(() => {
        setShowTurnBanner(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase, localPlayerId]);

  useEffect(() => {
    if (gameState?.dice?.rolled && gameState.dice.total > 0) {
      setDiceHistory((prev) => [...prev, gameState.dice.total]);
    }
  }, [gameState?.dice?.total, gameState?.dice?.rolled]);
  const activePlayerId = gameState?.playerOrder?.[gameState?.currentPlayerIndex ?? 0] || '';
  const isMyTurn = activePlayerId === localPlayerId;
  const localPlayer = gameState?.players?.[localPlayerId];

  const canRoll = Boolean(isMyTurn && gameState?.phase === 'ROLLING' && !gameState?.dice?.rolled);
  const canBuild = Boolean(isMyTurn && (gameState?.phase === 'MAIN' || gameState?.phase?.startsWith('SETUP')));
  const canTrade = Boolean(isMyTurn && gameState?.phase === 'MAIN');
  const canEndTurn = Boolean(
    isMyTurn &&
    ((gameState?.phase?.startsWith('SETUP')) ||
      (gameState?.phase === 'MAIN' && gameState?.dice?.rolled))
  );

  // Robber phase state helpers
  const myPendingDiscard = gameState?.pendingDiscards?.[localPlayerId] ?? 0;
  const isRobberDiscard = gameState?.phase === 'ROBBER_DISCARD' && myPendingDiscard > 0;
  const isRobberMove = gameState?.phase === 'ROBBER_MOVE' && isMyTurn;
  const isRobberSteal = gameState?.phase === 'ROBBER_STEAL' && isMyTurn;

  // Phase instruction text
  const getPhaseInstruction = (): string | null => {
    if (!isMyTurn) return null;
    const p = localPlayer;
    if (!p) return null;
    if (gameState.phase === 'SETUP_ROUND_1') {
      if (p.settlementsRemaining === 5) return '🏠 Place your first Settlement';
      if (p.roadsRemaining === 15) return '🛤️ Now place your first Road';
    }
    if (gameState.phase === 'SETUP_ROUND_2') {
      if (p.settlementsRemaining === 4) return '🏠 Place your second Settlement';
      if (p.roadsRemaining === 14) return '🛤️ Place your second Road — then gain resources';
    }
    if (gameState.phase === 'ROLLING') return '🎲 Roll the dice to begin your turn';
    if (gameState.phase === 'MAIN') return '🏗️ Build, Trade, or End Turn';
    return null;
  };
  const phaseInstruction = getPhaseInstruction();

  const handleLeaveMatch = () => {
    soundManager.playClick();
    if (matchMode === 'online' && socket && roomCode) {
      socket.emit(CLIENT_EVENTS.LEAVE_GAME, { code: roomCode });
    }
    sessionStorage.removeItem('hexara_active_game_state');
    sessionStorage.removeItem('hexara_room_code');
    window.location.hash = '#/';
  };

  const handleSelectEmoji = (reaction: EmojiReaction) => {
    setPlayerReactions((prev) => ({
      ...prev,
      [localPlayerId]: reaction.emoji,
    }));

    setTimeout(() => {
      setPlayerReactions((prev) => {
        const next = { ...prev };
        delete next[localPlayerId];
        return next;
      });
    }, 3500);
  };

  const handleSendMessage = (text: string) => {
    if (externalSendMessage) {
      externalSendMessage(text);
      return;
    }
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: localPlayer?.username || 'You',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const activeChatList = externalChatMessages || chatMessages;

  // Global Keyboard Shortcuts (Section 31)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target?.tagName)) return;

      if (e.code === 'Space') {
        if (canRoll) {
          e.preventDefault();
          onRollDice?.();
        }
      } else if (e.code === 'KeyE') {
        if (canEndTurn) {
          e.preventDefault();
          onEndTurn?.();
        }
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setBuildModalOpen(!isBuildModalOpen);
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        setTradeModalOpen(!isTradeModalOpen);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setDevCardPanelOpen((prev) => !prev);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setMenuExpanded((prev) => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (buildMode !== 'none') {
          useGameStore.getState().setSelectedVertexId(null);
          useGameStore.getState().setSelectedEdgeId(null);
          setBuildMode('none');
        } else {
          setBuildModalOpen(false);
          setTradeModalOpen(false);
          setDevCardPanelOpen(false);
          setLeftDrawer('none');
          setSettingsOpen(false);
          setAlmanacOpen(false);
          setMenuExpanded(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canRoll, canEndTurn, isBuildModalOpen, isTradeModalOpen, buildMode, onRollDice, onEndTurn, setBuildMode, setBuildModalOpen, setTradeModalOpen]);

  const themeConfigs = [
    { color: '#dc2626', avatar: '🧔' }, // Red (Silver/Candamir)
    { color: '#2563eb', avatar: '🏹' }, // Blue (Drake/Doomsday)
    { color: '#d97706', avatar: '🦙' }, // Yellow/Amber
    { color: '#059669', avatar: '👑' }, // Green (William)
  ];

  if (!gameState) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between select-none overflow-hidden font-sans pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR: DESKTOP & MOBILE ADAPTIVE                 */}
      {/* ============================================================ */}

      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR: BRAND, COMPACT PLAYER CARDS, TIMER & DICE */}
      {/* ============================================================ */}
      <header className="pointer-events-none flex flex-col w-full px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top))] gap-1.5 z-30 shrink-0">
        {/* Main Top Bar Row */}
        <div className="flex items-center justify-between w-full gap-2">
          {/* Left: Brand, Harbor Back Button & Room Code Badge */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleLeaveMatch}
              aria-label="Return to Harbor / Main Menu"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-red-950/80 border border-amber-600/50 hover:border-red-500/80 text-amber-200 hover:text-red-200 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
              title="Return to Harbor / Main Menu"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-serif">Harbor</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2e1208]/95 to-[#160803]/95 border border-amber-600/50 shadow-lg backdrop-blur-md">
              <span className="text-base">🏔️</span>
              <span className="hidden sm:inline text-xs font-black uppercase font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
                ISLES OF HEXARA
              </span>
              {roomCode && (
                <button
                  onClick={handleCopyRoom}
                  aria-label="Click to copy room code"
                  className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-lg bg-black/60 hover:bg-black/90 border border-amber-600/40 text-amber-300 font-mono text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                  title="Click to copy room code"
                >
                  <span>#{roomCode}</span>
                  {copiedRoomCode ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-amber-400/80" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Center: Compact Player Cards distributed horizontally across top (Desktop & Tablet) */}
          <div className="pointer-events-auto hidden md:flex items-center gap-2 overflow-x-auto custom-scrollbar px-1 py-0.5">
            {gameState.playerOrder.map((pId, idx) => {
              const player = gameState.players[pId];
              if (!player) return null;
              const isActive = pId === activePlayerId;
              const isMe = pId === localPlayerId;
              const theme = themeConfigs[idx % themeConfigs.length];

              return (
                <div key={pId} className="relative flex flex-col items-center">
                  <PlayerRibbonCard
                    player={player}
                    isActive={isActive}
                    isLocal={isMe}
                    themeColor={theme.color}
                    avatarIcon={theme.avatar}
                    layout="catan-top"
                  />
                  {/* Active Player Dice Display directly beneath active card */}
                  {isActive && gameState.dice?.rolled && gameState.dice.total > 0 && (
                    <div className="absolute -bottom-7.5 z-30 animate-in fade-in zoom-in-90 duration-200 filter drop-shadow-lg">
                      <div className="flex items-center gap-1 bg-black/85 px-1.5 py-0.5 rounded-lg border border-amber-500/50 shadow-xl">
                        <DiceDisplay
                          dice1={gameState.dice.dice1}
                          dice2={gameState.dice.dice2}
                          total={gameState.dice.total}
                          canRoll={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Authoritative Turn Timer, Voice, Camera, Chat, Almanac & Settings controls */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Authoritative Server Turn Timer Countdown */}
            <TurnTimer
              isActive={gameState.phase !== 'FINISHED'}
              isMyTurn={isMyTurn}
              turnKey={`${gameState.currentPlayerIndex}_${gameState.turnNumber}_${gameState.phase}`}
              turnDeadline={turnDeadline}
              durationSeconds={Number(sessionStorage.getItem('hexara_turn_duration') || 60)}
              onTimeout={() => {
                if (canRoll) onRollDice?.();
                else if (canEndTurn) onEndTurn?.();
              }}
            />

            {/* Voice Chat Button */}
            {matchMode === 'online' && roomCode && (
              <VoiceChatControls
                roomCode={roomCode}
                socket={socket}
                localPlayerId={localPlayerId}
                username={localPlayer?.username}
              />
            )}

            {/* Camera Zoom & Tactical Controls */}
            <div className="hidden sm:flex items-center gap-0.5 bg-black/60 p-0.5 rounded-xl border border-amber-600/40">
              <button
                onClick={() => zoomInCamera()}
                className="w-7 h-7 rounded-lg hover:bg-black/60 text-amber-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => zoomOutCamera()}
                className="w-7 h-7 rounded-lg hover:bg-black/60 text-amber-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => resetGameCamera()}
                className="w-7 h-7 rounded-lg hover:bg-black/60 text-amber-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Recenter Camera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleCameraMode}
                className="w-7 h-7 rounded-lg hover:bg-black/60 text-amber-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Toggle 3D / Tactical View"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Crew Chat Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setChatLogOpen(true);
              }}
              title="Crew Chat & Game Logs"
              className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-amber-600/40 text-amber-300 hover:text-white flex items-center justify-center transition-all shadow active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Rulebook / Almanac Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setAlmanacOpen(true);
              }}
              title="Catan Rulebook & Maritime Almanac"
              className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-amber-600/40 text-amber-300 hover:text-white flex items-center justify-center transition-all shadow active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Settings button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setSettingsOpen(true);
              }}
              title="Audio & Match Settings"
              className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-amber-600/40 text-amber-300 hover:text-white flex items-center justify-center transition-all shadow active:scale-95 cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Profile Avatar Pill */}
            <button
              onClick={() => {
                soundManager.playClick();
                setProfileOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-xl bg-black/60 border border-amber-500/50 hover:border-amber-400 text-amber-100 hover:scale-105 active:scale-95 transition-all shadow"
              title="Captain Profile"
            >
              <div className="w-6 h-6 rounded-full bg-amber-900/60 border border-amber-400 flex items-center justify-center text-xs shadow">
                {userProfile.avatar}
              </div>
              <span className="text-xs font-black font-serif text-amber-200 truncate max-w-[70px]">
                {userProfile.username}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Player Ribbon (visible on small mobile screens < 768px) */}
        <div className="pointer-events-auto md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar w-full">
          {gameState.playerOrder.map((pId, idx) => {
            const player = gameState.players[pId];
            if (!player) return null;
            const isActive = pId === activePlayerId;
            const isMe = pId === localPlayerId;
            const theme = themeConfigs[idx % themeConfigs.length];

            return (
              <PlayerRibbonCard
                key={pId}
                player={player}
                isActive={isActive}
                isLocal={isMe}
                themeColor={theme.color}
                avatarIcon={theme.avatar}
                layout="catan-top"
              />
            );
          })}
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MIDDLE AREA: LEFT SECONDARY CONTROLS & FOCAL BOARD        */}
      {/* ============================================================ */}
      <div className="relative flex-1 flex items-stretch justify-between w-full overflow-hidden pointer-events-none">
        {/* Left Secondary Controls Sidebar (Desktop) matching Screenshot_20260911-144416 */}
        <div className="pointer-events-auto hidden md:flex items-start gap-2 z-20 pl-2 pt-2">
          {!isMenuExpanded ? (
            /* Collapsed Menu Rail: Single Main Menu Icon */
            <button
              onClick={() => {
                soundManager.playClick();
                setMenuExpanded(true);
              }}
              aria-label="Expand Game Menu"
              className="w-11 h-11 rounded-2xl bg-[#24130c]/95 hover:bg-[#381a10] border-2 border-amber-600/70 hover:border-amber-400 text-amber-300 hover:text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(0,0,0,0.8)] active:scale-95 cursor-pointer"
              title="Expand Game Menu (M)"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            /* Expanded Menu Rail: Icons + Labels with Smooth Overlay */
            <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-[#24130c]/95 border-2 border-amber-600/60 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in slide-in-from-left-2 duration-150 min-w-[200px]">
              {/* Close / Collapse Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setMenuExpanded(false);
                  setLeftDrawer('none');
                }}
                aria-label="Collapse Menu"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/50 hover:bg-black/80 border border-amber-600/40 text-amber-200/80 hover:text-white text-xs font-bold transition-all cursor-pointer mb-1"
                title="Collapse Menu (M or Esc)"
              >
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-amber-400" />
                  <span className="font-serif uppercase tracking-wider text-[11px]">Collapse Menu</span>
                </div>
                <span className="text-[10px] font-mono opacity-50">M</span>
              </button>

              {/* Chat & Game Log */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setLeftDrawer((prev) => (prev === 'chat_log' ? 'none' : 'chat_log'));
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  leftDrawer === 'chat_log'
                    ? 'catan-btn-gold shadow text-slate-950 font-black'
                    : 'bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-amber-200 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Crew Chat & Log</span>
              </button>

              {/* Development Cards */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setDevCardPanelOpen(true);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Scroll className="w-4 h-4 text-purple-400" />
                  <span>My Dev Cards</span>
                </div>
                {(localPlayer?.devCards?.length ?? 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-mono text-[10px] font-black">
                    {localPlayer?.devCards?.length}
                  </span>
                )}
              </button>

              {/* Trade */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setTradeModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-amber-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Ship className="w-4 h-4 text-amber-400" />
                <span>Trading House</span>
              </button>

              {/* Dice Statistics */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setLeftDrawer((prev) => (prev === 'stats' ? 'none' : 'stats'));
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  leftDrawer === 'stats'
                    ? 'catan-btn-gold shadow text-slate-950 font-black'
                    : 'bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-amber-200 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Dice Statistics</span>
              </button>

              {/* Rules / Almanac */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setAlmanacOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-blue-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Rules & Harbors</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSettingsOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-stone-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-stone-400" />
                <span>Audio & Settings</span>
              </button>

              {/* Emotes */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setEmojiOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 hover:bg-amber-900/40 border border-amber-600/30 text-amber-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">😀</span>
                <span>Reactions</span>
              </button>

              {/* Leave Game */}
              <div className="pt-1 mt-1 border-t border-amber-900/50">
                <button
                  onClick={handleLeaveMatch}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Leave Voyage</span>
                </button>
              </div>
            </div>
          )}

          {/* Slide-out Left Drawer Panel */}
          {leftDrawer === 'chat_log' && (
            <div className="animate-in slide-in-from-left duration-200">
              <RightSidebarWidget
                logs={gameState.logs || []}
                chatMessages={activeChatList}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}

          {leftDrawer === 'stats' && (
            <div className="w-72 p-4 rounded-2xl bg-gradient-to-b from-[#24130c]/95 via-[#180b06]/95 to-[#0d0603]/95 border-2 border-amber-600/50 shadow-2xl backdrop-blur-md animate-in slide-in-from-left duration-200 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                <span className="text-xs font-black uppercase text-amber-300 font-serif tracking-wider">
                  📊 Dice Distribution
                </span>
                <button
                  onClick={() => setLeftDrawer('none')}
                  className="text-stone-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                  const count = diceHistory.filter((d) => d === num).length;
                  const pct = diceHistory.length > 0 ? (count / diceHistory.length) * 100 : 0;
                  const isLucky = num === 6 || num === 8;
                  return (
                    <div key={num} className="flex items-center gap-2">
                      <span className={`w-5 text-right font-black ${isLucky ? 'text-red-400' : 'text-amber-200'}`}>
                        {num}
                      </span>
                      <div className="flex-1 h-3.5 bg-black/60 rounded overflow-hidden border border-white/10">
                        <div
                          className={`h-full ${isLucky ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                      <span className="w-8 text-[10px] text-stone-400 text-right">{count}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Center Area: Central Floating Turn Guidance & Banners */}
        <div className="flex-1 relative flex flex-col items-center justify-start pt-2 px-4 pointer-events-none">
          {/* Active Turn Banner */}
          {showTurnBanner && (
            <div
              className={`pointer-events-auto px-6 py-2 rounded-2xl border-2 flex items-center gap-2.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all animate-in fade-in zoom-in-95 ${
                turnBannerText.isMe
                  ? 'bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#7f1d1d] border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                  : 'bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#1c1917] border-stone-600 text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-sm font-black tracking-wide font-serif">
                {turnBannerText.name}
              </span>
            </div>
          )}

          {/* Active Placement Guide Text */}
          {buildMode !== 'none' && (
            <div className="pointer-events-auto mt-2 px-5 py-1.5 rounded-xl border-2 border-amber-400 flex items-center gap-3 bg-gradient-to-r from-[#3a1212] via-[#240a0a] to-[#3a1212] shadow-[0_0_25px_rgba(245,158,11,0.6)]">
              <span className="text-xs font-black text-amber-200 font-serif">
                Select position on board for {buildMode === 'road' ? 'Road' : buildMode === 'settlement' ? 'Settlement' : 'City'}
              </span>
              <button
                onClick={() => setBuildMode('none')}
                className="text-xs uppercase font-bold text-red-400 hover:text-red-200 underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Phase instruction */}
          {buildMode === 'none' && phaseInstruction && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none mt-2 px-4 py-1.5 rounded-xl border border-amber-500/40 bg-black/70 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
            >
              <span className="text-[11px] font-bold text-amber-200">{phaseInstruction}</span>
            </div>
          )}

          {/* Waiting for opponent turn ticker */}
          {buildMode === 'none' && !isMyTurn && gameState.phase !== 'FINISHED' && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none mt-2 px-4 py-1.5 rounded-xl border border-amber-600/40 bg-[#160a05]/85 backdrop-blur-md flex items-center gap-2 shadow-lg animate-pulse"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-amber-200/90 font-medium">
                Waiting for <strong className="text-amber-300 font-bold">{gameState.players[activePlayerId]?.username || 'Opponent'}</strong> to complete turn...
              </span>
            </div>
          )}

          {/* Robber Discard & Move Banners */}
          {isRobberDiscard && (
            <div className="pointer-events-none mt-2 px-5 py-1.5 rounded-xl border-2 border-red-500 bg-red-950/90 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse">
              <span className="text-xs font-black text-red-200">⚠️ Discard {myPendingDiscard} card{myPendingDiscard !== 1 ? 's' : ''}</span>
            </div>
          )}
          {isRobberMove && buildMode === 'none' && (
            <div className="pointer-events-none mt-2 px-5 py-1.5 rounded-xl border-2 border-amber-500 bg-amber-950/90 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse">
              <span className="text-xs font-black text-amber-200">🔴 Move the Robber — Click any fertile hex</span>
            </div>
          )}
          {isRobberSteal && (
            <div className="pointer-events-none mt-2 px-5 py-1.5 rounded-xl border-2 border-purple-500 bg-purple-950/90 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.7)] animate-pulse">
              <span className="text-xs font-black text-purple-200">💀 Choose a victim to plunder from</span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM CONTROLS: COMPACT RESOURCES & PROMINENT ACTIONS   */}
      {/* ============================================================ */}
      <footer className="pointer-events-none flex items-end justify-between w-full px-2 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] gap-2 z-30 shrink-0">
        {/* Left: Mobile Menu / Info Button matching Screenshot_20260911-144413 */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mobile hamburger button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setBottomSheetOpen(true);
            }}
            aria-label="Open Mobile Menu"
            className="md:hidden w-11 h-11 rounded-xl bg-gradient-to-b from-[#d97706] to-[#b45309] border-2 border-amber-200 text-slate-950 flex items-center justify-center shadow-xl active:scale-95"
            title="Open Menu"
          >
            <Menu className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Info / Almanac button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setAlmanacOpen(true);
            }}
            aria-label="Almanac and Rules"
            className="w-10 h-10 rounded-xl bg-black/70 hover:bg-black/90 border border-amber-600/50 text-amber-300 flex items-center justify-center shadow-lg transition-all active:scale-95"
            title="Almanac & Building Costs"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Compact Resource Bar matching Screenshot_20260911-144413 */}
        {localPlayer && (
          <div className="pointer-events-auto bg-gradient-to-b from-[#3a1d12] via-[#24130c] to-[#140a06] rounded-2xl px-3 sm:px-5 py-2 flex items-center gap-3 sm:gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.85)] border-2 border-[#8b4513]/80">
            <div className="flex items-center gap-1 text-amber-100" title="Lumber">
              <span className="text-base sm:text-xl">🪵</span>
              <span className="text-sm sm:text-base font-black font-mono">{localPlayer.resources.lumber}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-100" title="Brick">
              <span className="text-base sm:text-xl">🧱</span>
              <span className="text-sm sm:text-base font-black font-mono">{localPlayer.resources.brick}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-100" title="Wool">
              <span className="text-base sm:text-xl">🐑</span>
              <span className="text-sm sm:text-base font-black font-mono">{localPlayer.resources.wool}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-100" title="Grain">
              <span className="text-base sm:text-xl">🌾</span>
              <span className="text-sm sm:text-base font-black font-mono">{localPlayer.resources.grain}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-100" title="Ore">
              <span className="text-base sm:text-xl">⛰️</span>
              <span className="text-sm sm:text-base font-black font-mono">{localPlayer.resources.ore}</span>
            </div>
          </div>
        )}

        {/* Right: Main Action Buttons (ROLL, BUILD, TRADE, END TURN) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5">
          {buildMode !== 'none' ? (
            <>
              <button
                onClick={() => {
                  useGameStore.getState().setSelectedVertexId(null);
                  useGameStore.getState().setSelectedEdgeId(null);
                  setBuildMode('none');
                }}
                aria-label="Cancel Placement"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#991b1b] to-[#7f1d1d] border-2 border-red-400 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title="Cancel Placement"
              >
                <Ban className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
              <button
                onClick={() => onConfirmPlacement?.()}
                aria-label="Confirm Placement"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 border-2 border-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.9)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-pulse"
                title="Confirm Placement"
              >
                <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5]" />
              </button>
            </>
          ) : (
            <>
              {/* Roll Button */}
              {canRoll && (
                <button
                  onClick={onRollDice}
                  className="h-11 sm:h-13 px-3 sm:px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl border-2 bg-gradient-to-b from-[#f59e0b] to-[#b45309] border-amber-200 text-[#1a0f08] hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-bounce font-black transition-all"
                  title="Roll the Dice"
                >
                  <span className="text-lg sm:text-xl">🎲</span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider font-serif">Roll</span>
                </button>
              )}

              {/* Build Button */}
              <button
                onClick={() => setBuildModalOpen(true)}
                disabled={!canBuild}
                className={`h-11 sm:h-13 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 shadow-xl border-2 transition-all ${
                  canBuild
                    ? 'bg-gradient-to-b from-[#d97706] to-[#92400e] border-amber-300 text-amber-950 hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.5)] font-black'
                    : 'bg-[#241710] border-amber-900/40 text-amber-200/30 cursor-not-allowed opacity-50'
                }`}
                title="Open Build Menu"
              >
                <Hammer className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider font-serif">Build</span>
              </button>

              {/* Trade Button */}
              <button
                onClick={() => setTradeModalOpen(true)}
                disabled={!canTrade}
                className={`h-11 sm:h-13 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 shadow-xl border-2 transition-all ${
                  canTrade
                    ? 'bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] border-amber-200 text-[#2b170c] hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_6px_16px_rgba(245,158,11,0.6)] font-black'
                    : 'bg-[#241710] border-amber-900/40 text-amber-200/30 cursor-not-allowed opacity-50'
                }`}
                title="Trade with Players or Bank"
              >
                <Ship className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider font-serif">Trade</span>
              </button>

              {/* Development Cards Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setDevCardPanelOpen(true);
                }}
                className="relative h-11 sm:h-13 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 shadow-xl border-2 transition-all bg-[#241710] hover:bg-[#381a10] border-amber-600/60 hover:border-amber-400 text-purple-300 hover:text-white cursor-pointer active:scale-95"
                title="Development Cards Hand (C)"
              >
                <Scroll className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 stroke-[2.5]" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider font-serif">Cards</span>
                {(localPlayer?.devCards?.length ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-purple-600 text-white font-mono text-[9px] font-black border border-purple-300">
                    {localPlayer?.devCards?.length}
                  </span>
                )}
              </button>

              {/* Visually Prominent End Turn Button */}
              <button
                onClick={canRoll ? onRollDice : onEndTurn}
                disabled={!canRoll && !canEndTurn}
                className={`h-11 sm:h-13 px-4 sm:px-6 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-2xl border-2 transition-all ${
                  canRoll || canEndTurn
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-amber-100 text-[#1a0f08] hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.85)] ring-2 ring-amber-300/70 font-black animate-pulse'
                    : 'bg-[#241710] border-amber-900/40 text-amber-200/30 cursor-not-allowed opacity-50'
                }`}
                title="End Your Turn"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest font-serif">
                  End Turn
                </span>
              </button>
            </>
          )}
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 4. MODALS & DRAWERS SUITE                                    */}
      {/* ============================================================ */}

      {/* Mobile Slide-Up Drawer */}
      <MobileBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        onOpenLog={() => setChatLogOpen(true)}
        onOpenRules={() => setAlmanacOpen(true)}
        onOpenBankTrade={() => setTradeModalOpen(true)}
        onOpenStats={() => setScoreboardOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLeaveMatch={handleLeaveMatch}
      />

      {/* Modal Dialogs & Panels */}
      <div className="pointer-events-auto">
        {/* Scoreboard / Statistics Modal */}
        <ScoreboardModal
          isOpen={isScoreboardOpen}
          onClose={() => setScoreboardOpen(false)}
          gameState={gameState}
          diceRollHistory={diceHistory}
        />

        {/* Emoji Reactions */}
        <EmojiModal
          isOpen={isEmojiOpen}
          onClose={() => setEmojiOpen(false)}
          onSelectEmoji={handleSelectEmoji}
        />

        {/* Full Chat Log Modal */}
        <ChatLogModal
          isOpen={isChatLogOpen}
          onClose={() => setChatLogOpen(false)}
          logs={gameState.logs || []}
          chatMessages={activeChatList}
          onSendMessage={handleSendMessage}
        />

        {/* Maritime Almanac & Game Rules */}
        <AlmanacModal
          isOpen={isAlmanacOpen}
          onClose={() => setAlmanacOpen(false)}
        />

        {/* Tavern Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Profile & Avatar Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setProfileOpen(false)}
          userProfile={userProfile}
          onProfileUpdated={(updated) => setUserProfile(updated)}
        />

        {/* Development Cards Panel */}
        <DevCardPanel
          isOpen={isDevCardPanelOpen}
          onClose={() => setDevCardPanelOpen(false)}
          devCards={localPlayer?.devCards || []}
          canPlay={isMyTurn && gameState.phase === 'MAIN'}
          hasPlayedDevCardThisTurn={localPlayer?.hasPlayedDevCardThisTurn}
          boughtThisTurn={localPlayer?.boughtDevCardsThisTurn}
          isMyTurn={isMyTurn}
          onPlay={(card, params) => {
            onPlayDevCard?.(card, params);
          }}
        />

        {/* Floating Animated Resource Gains */}
        <ResourceFlyAnimation
          resources={localPlayer?.resources}
          devCardCount={localPlayer?.devCards?.length || 0}
        />
      </div>
    </div>
  );
};
