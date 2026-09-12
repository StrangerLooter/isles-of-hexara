'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Play,
  Compass,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  Check,
  Shuffle,
  Shield,
  Dices,
  Sliders,
  Flame,
  Copy,
  CheckCircle2,
  Link2,
  Globe,
  Radio,
} from 'lucide-react';
import { HeaderBar } from '../modals/HeaderBar';

export interface ScenarioItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  unlocked: boolean;
  price?: string;
  imageBg: string;
  rules: string[];
}

const ROOM_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateRandomRoomCode(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
  }
  return result;
}

export const CAMPAIGN_SCENARIOS: ScenarioItem[] = [
  {
    id: 'first_island',
    name: 'The First Island',
    subtitle: 'Classic Hexara Archipelago',
    unlocked: true,
    badge: '2-4 Voyagers',
    imageBg: 'from-amber-700/80 via-amber-800/70 to-amber-950/90',
    description:
      'The foundational maritime contest. Settle the fertile central island, balance agriculture and ore mining, pave the Longest Road, and claim 10 Victory Points.',
    rules: [
      '10 Victory Points to Win',
      'Standard 19-Hex Island Layout',
      'Harbor Trading 3:1 & 2:1 Specific',
      'Knight / Largest Army Bonus (+2 VP)',
      'Longest Road Bonus (+2 VP)',
    ],
  },
  {
    id: 'ore_for_wool',
    name: 'Ore For Wool',
    subtitle: 'Pasture Abundance & Mountain Scarcity',
    unlocked: true,
    badge: '2-4 Voyagers',
    imageBg: 'from-emerald-700/80 via-emerald-800/70 to-emerald-950/90',
    description:
      'Lush emerald pastures produce endless wool, but mountain ore is scarce and precious! Master domestic barter and maritime shipping to secure city upgrades.',
    rules: [
      '10-12 Victory Points to Win',
      'Abundant Pastures (Wool Surplus)',
      'Scarse Mountain Mines (High Trade Value)',
      'Wool Harbor 2:1 High-Speed Conversion',
    ],
  },
  {
    id: 'harbormaster',
    name: 'The Harbormaster',
    subtitle: 'Maritime Trade Dominance',
    unlocked: true,
    badge: '2-4 Voyagers',
    imageBg: 'from-sky-700/80 via-sky-800/70 to-sky-950/90',
    description:
      'Coastal colonies carry supreme strategic importance. Settle strategic ports, control coastal waterways, and claim the coveted Harbormaster trophy.',
    rules: [
      '11 Victory Points to Win',
      'Harbormaster Bonus Card (+2 VP for 3 Harbor Points)',
      'All 9 Coastal Harbors Active',
      'Enhanced Maritime Exchange Rates',
    ],
  },
  {
    id: 'dragon_desert',
    name: 'Dragon & Desert Scenarios',
    subtitle: 'Lethal Hazards & High-Stakes Conquest',
    unlocked: true,
    badge: '3-6 Voyagers',
    imageBg: 'from-red-800/80 via-red-900/70 to-stone-950/90',
    description:
      'Ancient horrors and roaming reapers haunt the arid wastes. Fortify your settlements against sudden raids and harvest rare desert gold caches.',
    rules: [
      '12 Victory Points to Win',
      'Grim Reaper Active from Turn 1',
      'Expanded Island Topology',
      'Dangerous Barren Wasteland Hexes',
    ],
  },
];

export interface PreMatchLaunchOptions {
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
  turnDurationSeconds?: number;
}

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchGame: (options: PreMatchLaunchOptions) => void;
  initialMode?: 'solo' | 'online';
  initialRoomCode?: string;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onLaunchGame,
  initialMode = 'solo',
  initialRoomCode,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('first_island');
  const [gameMode, setGameMode] = useState<'solo' | 'online'>(initialMode);
  const [onlineSubMode, setOnlineSubMode] = useState<'create' | 'join'>('create');
  const [createdRoomCode, setCreatedRoomCode] = useState<string>(() => generateRandomRoomCode());
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState<string>(initialRoomCode || '');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const [playerCount, setPlayerCount] = useState<number>(4);
  const [aiDifficulty, setAiDifficulty] = useState<'NOVICE' | 'EXPERT' | 'MASTER'>('MASTER');
  const [vpTarget, setVpTarget] = useState<number>(10);
  const [randomPlayerStarts, setRandomPlayerStarts] = useState<boolean>(true);
  const [friendlyRobber, setFriendlyRobber] = useState<boolean>(false);
  const [balancedDice, setBalancedDice] = useState<boolean>(true);
  const [randomMapTopology, setRandomMapTopology] = useState<boolean>(true);
  const [boardSeed, setBoardSeed] = useState<number>(() => Math.floor(100000 + Math.random() * 900000));
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [turnTimeOption, setTurnTimeOption] = useState<'30' | '60' | '90' | '120' | 'custom'>('60');
  const [customTurnSeconds, setCustomTurnSeconds] = useState<number>(45);

  useEffect(() => {
    if (initialMode) setGameMode(initialMode);
    if (initialRoomCode) {
      setGameMode('online');
      setOnlineSubMode('join');
      setJoinRoomCodeInput(initialRoomCode.toUpperCase());
    }
  }, [initialMode, initialRoomCode, isOpen]);

  if (!isOpen) return null;

  const currentScenario =
    CAMPAIGN_SCENARIOS.find((s) => s.id === selectedScenarioId) || CAMPAIGN_SCENARIOS[0];

  const isHost = gameMode !== 'online' || onlineSubMode === 'create';

  const handleShuffleBoard = () => {
    if (!isHost) return;
    setIsShuffling(true);
    const newSeed = Math.floor(100000 + Math.random() * 900000);
    setBoardSeed(newSeed);
    setTimeout(() => {
      setIsShuffling(false);
    }, 400);
  };

  const handleRegenerateRoomCode = () => {
    setCreatedRoomCode(generateRandomRoomCode());
  };

  const handleCopyRoomCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = (codeToCopy: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/#/game?code=${codeToCopy}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunch = () => {
    const activeRoomCode =
      gameMode === 'online'
        ? onlineSubMode === 'join'
          ? joinRoomCodeInput.trim().toUpperCase() || 'HEXARA'
          : createdRoomCode
        : undefined;

    const finalTurnDuration =
      turnTimeOption === 'custom' ? Math.max(10, Math.min(600, customTurnSeconds)) : Number(turnTimeOption);

    onLaunchGame({
      scenarioId: currentScenario.id,
      scenarioName: currentScenario.name,
      mode: gameMode,
      playerCount,
      aiDifficulty,
      victoryPoints: vpTarget,
      randomPlayerStarts,
      friendlyRobber,
      balancedDice,
      randomMapTopology,
      boardSeed,
      roomCode: activeRoomCode,
      turnDurationSeconds: finalTurnDuration,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md catan-bg-burgundy animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Top Header Bar */}
      <HeaderBar
        title="Match Setup & Scenario Configuration"
        onBack={onClose}
        coins={1250}
        scrolls={18}
      />

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 max-w-7xl mx-auto w-full flex flex-col gap-5 custom-scrollbar">
        {/* Scenario Carousel Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Select Scenario (Locked After Match Launch)</span>
            </h3>
            <span className="text-[11px] text-amber-200/70 font-bold">
              Choose your terrain rules & island configuration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {CAMPAIGN_SCENARIOS.map((scen) => {
              const isSelected = selectedScenarioId === scen.id;
              return (
                <div
                  key={scen.id}
                  onClick={() => {
                    if (isHost) setSelectedScenarioId(scen.id);
                  }}
                  className={`relative rounded-xl overflow-hidden ${
                    isHost ? 'cursor-pointer' : 'cursor-default'
                  } transition-all duration-200 border-2 flex flex-col justify-between p-4 bg-gradient-to-b ${
                    scen.imageBg
                  } ${
                    isSelected
                      ? 'border-amber-300 ring-2 ring-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-[1.02]'
                      : isHost
                      ? 'border-amber-900/60 opacity-85 hover:opacity-100 hover:border-amber-500/70'
                      : 'border-amber-950/40 opacity-50'
                  }`}
                >
                  {/* Scenario Header Info */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-amber-200 border border-amber-500/30">
                        {scen.badge}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                          ✓
                        </div>
                      )}
                    </div>
                    <h4 className="text-base font-black text-white font-serif leading-tight">
                      {scen.name}
                    </h4>
                    <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                      {scen.subtitle}
                    </p>
                  </div>

                  {/* Scenario Description */}
                  <p className="text-[11px] text-amber-100/85 line-clamp-3 leading-relaxed my-2.5">
                    {scen.description}
                  </p>

                  {/* Selection Tab */}
                  <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between text-[11px]">
                    <span className="text-amber-300 font-bold">
                      {isSelected ? 'Active Scenario' : 'Select Scenario'}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-amber-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Scenario Details & Pre-Game Controls Grid */}
        <div className="catan-card-dark rounded-2xl p-5 md:p-6 border-2 border-amber-600/60 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Scenario Lore & Mechanics Checklist */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 font-black shadow-md border border-amber-300">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-amber-100">
                    {currentScenario.name}
                  </h2>
                  <p className="text-xs text-amber-400 font-bold">{currentScenario.subtitle}</p>
                </div>
              </div>

              <div className="catan-parchment-box p-3.5 rounded-xl border border-amber-700/50 text-xs text-amber-100/90 leading-relaxed">
                {currentScenario.description}
              </div>

              {/* Rules Checklist */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2">
                  Active Scenario Objectives:
                </h4>
                <div className="space-y-1.5">
                  {currentScenario.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-semibold text-amber-200/90 bg-black/30 px-3 py-1.5 rounded-lg border border-amber-600/20"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Board Topology & Shuffler Box */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-amber-600/40 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono text-amber-400/80 font-bold">
                  Island Layout Seed
                </span>
                <span className="text-sm font-black text-amber-100 font-mono">
                  #HEX-{boardSeed}
                </span>
              </div>
              <button
                onClick={handleShuffleBoard}
                disabled={isShuffling}
                className="catan-btn-gold px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all"
                title="Shuffle hexes, numbers, and harbor positions"
              >
                <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                <span>Shuffle Board</span>
              </button>
            </div>
          </div>

          {/* Right Column: Pre-Match Customizations & Launch Button */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-black/40 rounded-xl p-5 border border-amber-600/30 gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-600/30 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Pre-Match Game Configuration</span>
                </h4>
                <div className="flex items-center gap-2">
                  {isHost ? (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                      👑 Room Host
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                      🛡️ Guest Voyager (Host Configured)
                    </span>
                  )}
                  <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">
                    Official Catan 25th Anniv. Engine
                  </span>
                </div>
              </div>

              {/* Mode & Player Count in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mode: Solo vs Online */}
                <div>
                  <label className="text-[11px] font-bold text-amber-200/80 block mb-1.5">
                    Game Environment
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGameMode('solo')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        gameMode === 'solo'
                          ? 'bg-amber-600 text-white border-amber-300 shadow-md'
                          : 'bg-[#2b170c] text-amber-200/70 border-amber-800/60 hover:bg-[#3d2315]'
                      }`}
                    >
                      Solo vs AI
                    </button>
                    <button
                      onClick={() => setGameMode('online')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        gameMode === 'online'
                          ? 'bg-blue-600 text-white border-blue-300 shadow-md'
                          : 'bg-[#101e2b] text-blue-200/70 border-blue-800/60 hover:bg-[#182c40]'
                      }`}
                    >
                      Online Room
                    </button>
                  </div>
                </div>

                {/* Player Count */}
                <div>
                  <label className="text-[11px] font-bold text-amber-200/80 block mb-1.5">
                    Voyagers (2, 3 or 4 Players)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPlayerCount(2)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        playerCount === 2
                          ? 'bg-amber-700 text-white border-amber-300 shadow'
                          : 'bg-[#24140c] text-amber-200/60 border-amber-900/60'
                      }`}
                    >
                      2 Voyagers
                    </button>
                    <button
                      onClick={() => setPlayerCount(3)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        playerCount === 3
                          ? 'bg-amber-700 text-white border-amber-300 shadow'
                          : 'bg-[#24140c] text-amber-200/60 border-amber-900/60'
                      }`}
                    >
                      3 Voyagers
                    </button>
                    <button
                      onClick={() => setPlayerCount(4)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                        playerCount === 4
                          ? 'bg-amber-700 text-white border-amber-300 shadow'
                          : 'bg-[#24140c] text-amber-200/60 border-amber-900/60'
                      }`}
                    >
                      4 Voyagers
                    </button>
                  </div>
                </div>
              </div>

              {/* Online Room Code & Invite Panel */}
              {gameMode === 'online' && (
                <div className="bg-gradient-to-br from-blue-950/60 via-[#101e2b] to-black/80 p-4 rounded-xl border-2 border-blue-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-black uppercase text-blue-200 tracking-wider">
                        Online Matchmaking & Friends Room
                      </span>
                    </div>
                    {/* Submode Switcher */}
                    <div className="flex bg-black/50 p-0.5 rounded-lg border border-blue-500/30">
                      <button
                        onClick={() => setOnlineSubMode('create')}
                        className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                          onlineSubMode === 'create'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-blue-300/70 hover:text-blue-100'
                        }`}
                      >
                        Create Room
                      </button>
                      <button
                        onClick={() => setOnlineSubMode('join')}
                        className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                          onlineSubMode === 'join'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-blue-300/70 hover:text-blue-100'
                        }`}
                      >
                        Join with Code
                      </button>
                    </div>
                  </div>

                  {onlineSubMode === 'create' ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 p-3 rounded-lg border border-blue-500/30">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-blue-300 font-bold block">
                            Your 6-Character Room Code
                          </span>
                          <span className="text-2xl font-black font-mono tracking-widest text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                            {createdRoomCode}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleCopyRoomCode(createdRoomCode)}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                            title="Copy Room Code to share with friends"
                          >
                            {copiedCode ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                <span className="text-emerald-200">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleCopyInviteLink(createdRoomCode)}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                            title="Copy Direct Invite Link"
                          >
                            {copiedLink ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                <span className="text-emerald-200">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-4 h-4" />
                                <span>Invite Link</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleRegenerateRoomCode}
                            className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-blue-300 border border-blue-500/30 transition-all"
                            title="Generate another room code"
                          >
                            <Shuffle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-200/70 leading-relaxed">
                        Share this 6-letter room code or invite link with your friends. When they enter the room code on their screen, they will join your live game!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-blue-200 block">
                        Enter Friend's 6-Character Room Code:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={8}
                          value={joinRoomCodeInput}
                          onChange={(e) => setJoinRoomCodeInput(e.target.value.toUpperCase())}
                          placeholder="e.g. 7KK8RU"
                          className="flex-1 bg-black/60 border-2 border-blue-400/60 rounded-xl px-4 py-2 font-mono text-lg font-black text-amber-300 tracking-widest uppercase focus:outline-none focus:border-amber-400 placeholder:text-gray-600"
                        />
                        {joinRoomCodeInput && (
                          <button
                            onClick={() => handleCopyRoomCode(joinRoomCodeInput)}
                            className="px-3 py-2 rounded-xl bg-blue-600/60 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 border border-blue-400/40"
                            title="Copy code"
                          >
                            {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-200/70">
                        Paste or type the 6-character room code given to you by your game host.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Player Turn Time Configuration */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-amber-600/20">
                <div className="flex justify-between items-center text-xs font-bold text-gray-200 mb-2">
                  <span className="text-amber-300 uppercase tracking-wider">Player Turn Time</span>
                  <span className="text-amber-400 font-mono font-black">
                    {turnTimeOption === 'custom' ? `${customTurnSeconds}s (Custom)` : `${turnTimeOption}s`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {(['30', '60', '90', '120', 'custom'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTurnTimeOption(opt)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        turnTimeOption === opt
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 font-black shadow border border-amber-300'
                          : 'bg-[#24140c] text-amber-200/70 border border-amber-900/60 hover:text-amber-200'
                      }`}
                    >
                      {opt === 'custom' ? 'Custom' : `${opt}s`}
                    </button>
                  ))}
                </div>
                {turnTimeOption === 'custom' && (
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-amber-700/50 mt-1">
                    <span className="text-xs text-amber-200/80">Custom Seconds:</span>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={customTurnSeconds}
                      onChange={(e) => setCustomTurnSeconds(Math.max(10, Math.min(600, Number(e.target.value) || 10)))}
                      className="w-20 bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-xs text-amber-300 font-mono font-black"
                    />
                    <span className="text-[10px] text-gray-400">(10s – 300s)</span>
                  </div>
                )}
              </div>

              {/* Victory Points Slider */}
              <div className={`bg-black/30 p-3.5 rounded-xl border border-amber-600/20 ${!isHost ? 'opacity-60' : ''}`}>
                <div className="flex justify-between text-xs font-bold text-gray-200 mb-1.5">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Award className="w-4 h-4 text-amber-400" />
                    Victory Points Target:
                    {!isHost && <span className="text-[10px] text-blue-300 ml-1">(Host controlled)</span>}
                  </span>
                  <span className="text-amber-400 text-sm font-black">{vpTarget} VP</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={16}
                  value={vpTarget}
                  disabled={!isHost}
                  onChange={(e) => setVpTarget(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[9px] text-amber-400/60 font-mono mt-1">
                  <span>8 VP (Fast)</span>
                  <span>10 VP (Standard)</span>
                  <span>16 VP (Epic)</span>
                </div>
              </div>

              {/* Match Rule Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={randomPlayerStarts}
                    onChange={(e) => setRandomPlayerStarts(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Random starting player
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={friendlyRobber}
                    onChange={(e) => setFriendlyRobber(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Friendly robber (No rob ≤ 2 VP)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={balancedDice}
                    onChange={(e) => setBalancedDice(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Balanced dice deck (Statistical)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-black/20 p-2 rounded-lg border border-amber-600/20 hover:border-amber-500/40">
                  <input
                    type="checkbox"
                    checked={randomMapTopology}
                    onChange={(e) => setRandomMapTopology(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    Randomized hex topology
                  </span>
                </label>
              </div>

              {/* AI Opponent Mastery Level */}
              {gameMode === 'solo' && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-amber-200/80 block mb-1.5">
                    AI Opponent Mastery Level
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['NOVICE', 'EXPERT', 'MASTER'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setAiDifficulty(diff)}
                        className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                          aiDifficulty === diff
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-950 font-black shadow-md border border-amber-300'
                            : 'bg-[#260808] text-gray-400 hover:text-amber-300 border border-amber-900/40'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action Button */}
            <button
              onClick={handleLaunch}
              className="catan-btn-gold w-full py-4 rounded-xl text-base font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {gameMode === 'online' && onlineSubMode === 'join'
                  ? `Join Room (${joinRoomCodeInput || 'HEXARA'})`
                  : `Launch Match • ${currentScenario.name}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
