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
} from 'lucide-react';
import { createInitialGameState } from '@hexara/game-core';
import { useGameStore } from '../../store/gameStore';
import { ScoreboardModal } from './ScoreboardModal';
import { EmojiModal, EmojiReaction } from './EmojiModal';
import { ChatLogModal, ChatMessage } from './ChatLogModal';
import { AlmanacModal } from './AlmanacModal';
import { SettingsModal, DEFAULT_SETTINGS, GameSettingsState } from './SettingsModal';
import { PlayerRibbonCard } from './PlayerRibbonCard';
import { DiceDisplay } from './DiceDisplay';
import { LeftToolbar } from './LeftToolbar';
import { FullscreenButton } from '../common/FullscreenButton';
import { DevCardPanel, DevCardParams } from './DevCardPanel';
import { TurnTimer } from './TurnTimer';

interface GameHUDProps {
  onRollDice?: () => void;
  onEndTurn?: () => void;
  onResetCamera?: () => void;
  onConfirmPlacement?: () => void;
  onPlayDevCard?: (card: string, params?: DevCardParams) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  onRollDice,
  onEndTurn,
  onResetCamera,
  onConfirmPlacement,
  onPlayDevCard,
}) => {
  const {
    gameState,
    localPlayerId,
    buildMode,
    cameraMode,
    toggleCameraMode,
    setBuildMode,
    setBuildModalOpen,
    setTradeModalOpen,
    errorToast,
  } = useGameStore();

  // Modal Open States
  const [isScoreboardOpen, setScoreboardOpen] = useState(false);
  const [isEmojiOpen, setEmojiOpen] = useState(false);
  const [isChatLogOpen, setChatLogOpen] = useState(false);
  const [isAlmanacOpen, setAlmanacOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDevCardPanelOpen, setDevCardPanelOpen] = useState(false);

  // Match Info from sessionStorage
  const scenarioName = typeof window !== 'undefined' ? sessionStorage.getItem('hexara_scenario_name') || 'The First Island' : 'The First Island';
  const vpTarget = typeof window !== 'undefined' ? sessionStorage.getItem('hexara_vp_target') || '10' : '10';

  // Settings State
  const [settings, setSettings] = useState<GameSettingsState>(DEFAULT_SETTINGS);

  // Dice Roll History for Histogram
  const [diceHistory, setDiceHistory] = useState<number[]>([7, 6, 8, 5, 9, 7, 4, 6, 8, 10, 3]);

  // Floating Player Reactions
  const [playerReactions, setPlayerReactions] = useState<Record<string, string>>({});

  // Chat messages
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

  // Record dice roll when dice total changes
  useEffect(() => {
    if (gameState?.dice?.rolled && gameState.dice.total > 0) {
      setDiceHistory((prev) => [...prev, gameState.dice.total]);
    }
  }, [gameState?.dice?.total, gameState?.dice?.rolled]);

  if (!gameState) return null;

  const activePlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
  const isMyTurn = activePlayerId === localPlayerId;
  const localPlayer = gameState.players[localPlayerId];

  const canRoll = isMyTurn && gameState.phase === 'ROLLING' && !gameState.dice.rolled;
  const canBuild = isMyTurn && (gameState.phase === 'MAIN' || gameState.phase.startsWith('SETUP'));
  const canTrade = isMyTurn && gameState.phase === 'MAIN';
  const canEndTurn =
    isMyTurn &&
    ((gameState.phase.startsWith('SETUP')) ||
      (gameState.phase === 'MAIN' && gameState.dice.rolled));

  // Robber phase state helpers
  const myPendingDiscard = gameState.pendingDiscards?.[localPlayerId] ?? 0;
  const isRobberDiscard = gameState.phase === 'ROBBER_DISCARD' && myPendingDiscard > 0;
  const isRobberMove = gameState.phase === 'ROBBER_MOVE' && isMyTurn;
  const isRobberSteal = gameState.phase === 'ROBBER_STEAL' && isMyTurn;

  // Phase instruction text
  type SetupPhase = 'SETUP_ROUND_1' | 'SETUP_ROUND_2';
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
    if (confirm('Are you sure you want to return to the Main Menu?')) {
      window.location.hash = '#/';
    }
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
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: localPlayer?.username || 'You',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 select-none">
      {/* ============================================================ */}
      {/* 1. Header: Top Player Ribbons & Match Info / Camera Controls */}
      {/* ============================================================ */}
      <header className="flex items-start justify-between w-full pt-1">
        {/* Player Banner List matching Reference Images 4, 8 */}
        <div className="pointer-events-auto flex items-start gap-3 md:gap-4 overflow-x-auto pb-2 max-w-[70vw]">
          {gameState.playerOrder.map((pId, idx) => {
            const player = gameState.players[pId];
            if (!player) return null;
            const isActive = pId === activePlayerId;
            const isMe = pId === localPlayerId;

            const themeConfigs = [
              { color: '#dc2626', avatar: '🧔' }, // Red (Silver/Candamir)
              { color: '#2563eb', avatar: '🏹' }, // Blue (Drake/Doomsday)
              { color: '#d97706', avatar: '🦙' }, // Yellow/Amber
              { color: '#059669', avatar: '👑' }, // Green (William)
            ];
            const theme = themeConfigs[idx % themeConfigs.length];

            return (
              <PlayerRibbonCard
                key={pId}
                player={player}
                isActive={isActive}
                isLocal={isMe}
                themeColor={theme.color}
                avatarIcon={theme.avatar}
                reactionEmoji={playerReactions[pId]}
              />
            );
          })}
        </div>

        {/* Top-Right Action Controls (Active Scenario Badge & Camera Switchers) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Active Scenario Badge (Locked Match Rules) */}
          <div className="hidden md:flex flex-col items-end px-3 py-1.5 rounded-xl border border-amber-500/40 bg-black/60 backdrop-blur-md shadow-lg">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-300">
              {scenarioName}
            </span>
            <span className="text-[9px] font-black text-amber-400/80 font-serif">
              Goal: {vpTarget} VP Target
            </span>
          </div>

          {/* Turn Timer */}
          <TurnTimer
            isActive={gameState.phase === 'MAIN' || gameState.phase === 'ROLLING'}
            isMyTurn={isMyTurn}
            turnKey={`${gameState.currentPlayerIndex}_${gameState.turnNumber}`}
            onTimeout={() => {
              if (canRoll) onRollDice?.();
              else if (canEndTurn) onEndTurn?.();
            }}
          />

          {/* Fullscreen App Mode Toggle */}
          <FullscreenButton />

          {/* Camera View Mode Switcher */}
          <button
            onClick={toggleCameraMode}
            title={cameraMode === 'perspective' ? 'Switch to Overhead Tactical View' : 'Switch to 3D Angled View'}
            className="w-10 h-10 rounded-xl border-2 border-amber-400/80 bg-gradient-to-b from-[#451a03] to-[#200c02] text-amber-300 shadow-xl flex items-center justify-center hover:border-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Eye className="w-5 h-5 text-amber-400" />
          </button>

          {/* Camera Reset */}
          {onResetCamera && (
            <button
              onClick={onResetCamera}
              title="Reset Camera Position"
              className="w-10 h-10 rounded-xl border-2 border-amber-400/80 bg-gradient-to-b from-[#451a03] to-[#200c02] text-amber-300 shadow-xl flex items-center justify-center hover:border-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. Middle Body: Left Toolbar, Placement Guides & Turn Banner */}
      {/* ============================================================ */}
      <div className="relative flex-1 flex items-center justify-between w-full pointer-events-none">
        {/* Left Vertical Tool Rail (Images 5, 12, 13, 14, 15, 16) */}
        <LeftToolbar
          onOpenMessages={() => setChatLogOpen(true)}
          onOpenAlmanac={() => setAlmanacOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenScoreboard={() => setScoreboardOpen(true)}
          onOpenEmoji={() => setEmojiOpen(true)}
          onLeaveMatch={handleLeaveMatch}
        />

        {/* Center Indicators (Turn Banner / Placement Guides) */}
        <div className="flex flex-col items-center gap-2 mx-auto">
          {/* Turn Banner matching Reference Image 5 */}
          {showTurnBanner && (
            <div
              className={`px-8 py-2.5 rounded-2xl border-2 flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95 ${
                turnBannerText.isMe
                  ? 'bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#7f1d1d] border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                  : 'bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#1c1917] border-stone-600 text-stone-200'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <span className="text-base font-black tracking-wide font-serif">
                {turnBannerText.name}
              </span>
            </div>
          )}

          {/* Active Placement Guide Text matching Reference Images 6 & 7 */}
          {buildMode !== 'none' && (
            <div className="pointer-events-auto px-6 py-2 rounded-xl border-2 border-amber-400 flex items-center gap-4 bg-gradient-to-r from-[#3a1212] via-[#240a0a] to-[#3a1212] shadow-[0_0_25px_rgba(245,158,11,0.6)]">
              <span className="text-sm font-black text-amber-200 font-serif">
                Select position for {buildMode === 'road' ? 'Road' : buildMode === 'settlement' ? 'Settlement' : 'City'}
              </span>
              <button
                onClick={() => setBuildMode('none')}
                className="text-xs uppercase font-bold text-red-400 hover:text-red-200 underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Phase-specific instruction ribbon */}
          {buildMode === 'none' && phaseInstruction && (
            <div className="pointer-events-none px-6 py-1.5 rounded-xl border border-amber-500/40 bg-black/60 backdrop-blur-md flex items-center gap-2 shadow-lg">
              <span className="text-xs font-bold text-amber-200">{phaseInstruction}</span>
            </div>
          )}

          {/* ROBBER DISCARD Banner */}
          {isRobberDiscard && (
            <div className="pointer-events-none px-6 py-2 rounded-xl border-2 border-red-500 bg-red-950/90 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse">
              <span className="text-sm font-black text-red-200">⚠️ Discard {myPendingDiscard} card{myPendingDiscard !== 1 ? 's' : ''} — check the discard dialog</span>
            </div>
          )}

          {/* ROBBER MOVE Banner */}
          {isRobberMove && buildMode === 'none' && (
            <div className="pointer-events-none px-6 py-2.5 rounded-xl border-2 border-amber-500 bg-amber-950/90 backdrop-blur-md flex items-center gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse">
              <span className="text-lg">🔴</span>
              <span className="text-sm font-black text-amber-200">Move the Robber — Click a highlighted hex</span>
            </div>
          )}

          {/* ROBBER STEAL Banner */}
          {isRobberSteal && (
            <div className="pointer-events-none px-6 py-2 rounded-xl border-2 border-purple-500 bg-purple-950/90 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.7)] animate-pulse">
              <span className="text-lg">💀</span>
              <span className="text-sm font-black text-purple-200">Choose a player to steal from</span>
            </div>
          )}

          {errorToast && (
            <div className="px-5 py-2 rounded-xl border border-red-500 bg-red-950/95 text-red-200 text-xs font-bold shadow-2xl">
              {errorToast}
            </div>
          )}
        </div>

        {/* Left Piece Supply Box during Placement (matching Reference Image 1 & 2) */}
        {buildMode !== 'none' && localPlayer && (
          <div className="pointer-events-auto absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-black/90 to-black/70 border-2 border-stone-800 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-in slide-in-from-left-4 backdrop-blur-md">
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/20"
                style={{ backgroundColor: localPlayer.color || '#dc2626' }}
              >
                <span className="text-2xl drop-shadow-md">
                  {buildMode === 'road' ? '🪵' : buildMode === 'settlement' ? '🏠' : '🏰'}
                </span>
              </div>
              <span className="text-xs font-mono font-black text-amber-200 mt-1.5 drop-shadow">
                {buildMode === 'road'
                  ? `${localPlayer.roadsRemaining}/15`
                  : buildMode === 'settlement'
                  ? `${localPlayer.settlementsRemaining}/5`
                  : `${localPlayer.citiesRemaining}/4`}
              </span>
            </div>
            {/* Small red/gold pointer tab pointing toward board */}
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-red-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. Footer: Resources Inventory Dock & Action Controls */}
      {/* ============================================================ */}
      <footer className="flex items-end justify-between w-full gap-3 pb-1">
        {/* Left supply breakdown */}
        <div className="pointer-events-auto flex items-center">
          {localPlayer && (
            <div className="hidden lg:flex items-center gap-2 bg-[#20130b]/95 px-3.5 py-1.5 rounded-2xl border border-amber-600/40 text-xs font-bold text-amber-200 shadow-xl">
              <span className="text-[10px] uppercase font-black text-amber-400/80 mr-0.5">Supply:</span>
              <span title="Roads Remaining">🛣️ {localPlayer.roadsRemaining}</span>
              <span className="text-amber-700">&bull;</span>
              <span title="Settlements Remaining">🏠 {localPlayer.settlementsRemaining}</span>
              <span className="text-amber-700">&bull;</span>
              <span title="Cities Remaining">🏰 {localPlayer.citiesRemaining}</span>
            </div>
          )}
        </div>

        {/* Bottom Center: Resource Inventory Dock (Matching Screenshot) */}
        {localPlayer && (
          <div className="pointer-events-auto bg-gradient-to-b from-[#3a1d12] via-[#24130c] to-[#140a06] rounded-2xl px-5 py-2.5 flex items-center gap-4 md:gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-2 border-[#8b4513]/70">
            {/* Lumber */}
            <div className="flex items-center gap-1.5 text-amber-100" title="Lumber">
              <span className="text-xl">🪵</span>
              <span className="text-base font-black font-mono">{localPlayer.resources.lumber}</span>
            </div>

            {/* Brick */}
            <div className="flex items-center gap-1.5 text-amber-100" title="Brick">
              <span className="text-xl">🧱</span>
              <span className="text-base font-black font-mono">{localPlayer.resources.brick}</span>
            </div>

            {/* Wool */}
            <div className="flex items-center gap-1.5 text-amber-100" title="Wool">
              <span className="text-xl">🐑</span>
              <span className="text-base font-black font-mono">{localPlayer.resources.wool}</span>
            </div>

            {/* Grain */}
            <div className="flex items-center gap-1.5 text-amber-100" title="Grain">
              <span className="text-xl">🌾</span>
              <span className="text-base font-black font-mono">{localPlayer.resources.grain}</span>
            </div>

            {/* Ore */}
            <div className="flex items-center gap-1.5 text-amber-100" title="Ore">
              <span className="text-xl">⛰️</span>
              <span className="text-base font-black font-mono">{localPlayer.resources.ore}</span>
            </div>

            <div className="h-6 w-[1px] bg-amber-600/40 mx-1" />

            {/* Victory Points */}
            <div className="flex items-center gap-1 text-amber-300" title="Victory Points">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-base font-black font-mono">{localPlayer.victoryPoints}</span>
            </div>

            {/* Dev Cards */}
            <div className="flex items-center gap-1 text-amber-200/90" title="Development Cards">
              <Scroll className="w-5 h-5 text-amber-300" />
              <span className="text-base font-black font-mono">{localPlayer.devCards?.length || 0}</span>
            </div>
          </div>
        )}

        {/* Bottom Right: Dice Display & Action Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Pair of Realistic 3D-styled SVG Dice & Roll Button */}
          <div className="flex items-center gap-2">
            {canRoll && (
              <button
                onClick={onRollDice}
                className="px-4 py-2 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-bounce"
              >
                <span>🎲</span>
                <span>Roll Dice</span>
              </button>
            )}
            <DiceDisplay
              dice1={gameState.dice.dice1}
              dice2={gameState.dice.dice2}
              total={gameState.dice.total}
              canRoll={canRoll}
              onClick={onRollDice}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Green Checkmark [✓] Confirmation Button during Placement (Matching Image 2) */}
            {buildMode !== 'none' ? (
              <>
                <button
                  onClick={() => {
                    useGameStore.getState().setSelectedVertexId(null);
                    useGameStore.getState().setSelectedEdgeId(null);
                    setBuildMode('none');
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-b from-[#991b1b] to-[#7f1d1d] border-2 border-red-400 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  title="Cancel Placement"
                >
                  <Ban className="w-6 h-6 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => {
                    onConfirmPlacement?.();
                  }}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 border-2 border-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.9)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-pulse"
                  title="Confirm Structure Placement"
                >
                  <Check className="w-8 h-8 stroke-[3.5]" />
                </button>
              </>
            ) : (
              <>
                {/* Build Menu Button */}
                <button
                  onClick={() => setBuildModalOpen(true)}
                  disabled={!canBuild}
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-xl border-2 transition-all ${
                    canBuild
                      ? 'bg-gradient-to-b from-[#d97706] to-[#92400e] border-amber-300 text-amber-950 hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.5)]'
                      : 'bg-[#241710] border-amber-900/40 text-amber-200/30 cursor-not-allowed opacity-50'
                  }`}
                  title="Build Structures (Road, Settlement, City, Dev Card)"
                >
                  <Hammer className="w-6 h-6 stroke-[2.5]" />
                </button>

                {/* Trade Button (Ship) */}
                <button
                  onClick={() => setTradeModalOpen(true)}
                  disabled={!canTrade}
                  className={`h-12 md:h-14 px-3 md:px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl border-2 transition-all ${
                    canTrade
                      ? 'bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#b45309] border-amber-200 text-[#2b170c] hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_6px_16px_rgba(245,158,11,0.6)]'
                      : 'bg-[#241710] border-amber-900/40 text-amber-200/30 cursor-not-allowed opacity-50'
                  }`}
                  title="Maritime & Harbor Trade"
                >
                  <Ship className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-xs font-black uppercase tracking-wide">Trade</span>
                </button>

                {/* Dev Cards Button */}
                <button
                  onClick={() => setDevCardPanelOpen(true)}
                  className={`relative h-12 md:h-14 px-3 md:px-4 rounded-xl flex items-center justify-center gap-2 shadow-xl border-2 transition-all ${
                    (localPlayer?.devCards?.length ?? 0) > 0
                      ? 'bg-gradient-to-b from-[#7c3aed] to-[#5b21b6] border-purple-300 text-purple-100 hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_12px_rgba(147,51,234,0.5)]'
                      : 'bg-[#241710] border-amber-900/40 text-amber-200/50 hover:border-purple-700/50 cursor-pointer'
                  }`}
                  title={`Development Cards (${localPlayer?.devCards?.length ?? 0} in hand)`}
                >
                  <Scroll className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-xs font-black uppercase tracking-wide">Dev Cards</span>
                  {(localPlayer?.devCards?.length ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-[10px] font-black flex items-center justify-center shadow-md border border-white/40">
                      {localPlayer?.devCards?.length}
                    </span>
                  )}
                </button>

                {/* End Turn Action Button */}
                <button
                  onClick={canRoll ? onRollDice : onEndTurn}
                  disabled={!canRoll && !canEndTurn}
                  className={`px-4 h-12 md:h-14 rounded-2xl flex items-center justify-center gap-2 shadow-xl border-2 transition-all ${
                    canRoll || canEndTurn
                      ? 'bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] border-amber-100 text-[#1a0f08] hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_6px_20px_rgba(245,158,11,0.7)]'
                      : 'bg-[#241710] border-amber-900/40 text-amber-200/30 cursor-not-allowed opacity-50'
                  }`}
                  title={canRoll ? 'Roll Dice' : canEndTurn ? 'End Turn' : 'Waiting for Turn'}
                >
                  <RotateCcw className="w-5 h-5 stroke-[3] transform -scale-x-100" />
                  <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                    {canRoll ? 'Roll' : canEndTurn ? 'End Turn' : 'Turn'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 4. Complete Modals Suite matching All Reference Images */}
      {/* ============================================================ */}
      <ScoreboardModal
        isOpen={isScoreboardOpen}
        onClose={() => setScoreboardOpen(false)}
        gameState={gameState}
        diceRollHistory={diceHistory}
      />

      <EmojiModal
        isOpen={isEmojiOpen}
        onClose={() => setEmojiOpen(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      <ChatLogModal
        isOpen={isChatLogOpen}
        onClose={() => setChatLogOpen(false)}
        logs={gameState.logs || []}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      <AlmanacModal
        isOpen={isAlmanacOpen}
        onClose={() => setAlmanacOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <DevCardPanel
        isOpen={isDevCardPanelOpen}
        onClose={() => setDevCardPanelOpen(false)}
        devCards={localPlayer?.devCards || []}
        canPlay={isMyTurn && gameState.phase === 'MAIN'}
        onPlay={(card, params) => {
          onPlayDevCard?.(card, params);
        }}
      />
    </div>
  );
};
