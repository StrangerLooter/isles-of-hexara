'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Users,
  Bot,
  Globe,
  Compass,
  ArrowRight,
  Shield,
  Sparkles,
  SlidersHorizontal,
  Anchor,
  Swords,
  Clock,
  Trophy,
} from 'lucide-react';
import { HeaderBar } from '../modals/HeaderBar';
import { soundManager } from '../../game/SoundManager';

interface StrategicPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickPlay: () => void;
  onCreateOnline: (playerCount: 2 | 3 | 4, scenarioId: string, victoryPoints: number) => void;
  onJoinRoom: (roomCode: string) => void;
  onStartSolo: (playerCount: 2 | 3 | 4) => void;
  onOpenAdvancedScenarios: () => void;
}

export const StrategicPlayModal: React.FC<StrategicPlayModalProps> = ({
  isOpen,
  onClose,
  onQuickPlay,
  onCreateOnline,
  onJoinRoom,
  onStartSolo,
  onOpenAdvancedScenarios,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'solo'>('create');
  const [onlinePlayerCount, setOnlinePlayerCount] = useState<2 | 3 | 4>(2);
  const [soloPlayerCount, setSoloPlayerCount] = useState<2 | 3 | 4>(4);
  const [selectedScenario, setSelectedScenario] = useState('first_island');
  const [targetVp, setTargetVp] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Universal Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const clean = joinCode.trim().toUpperCase();
    if (clean.length < 4) {
      soundManager.playError();
      setJoinError('Please enter a valid room code (e.g. AB12CD)');
      return;
    }
    setJoinError(null);
    onJoinRoom(clean);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="strategic-play-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#2a170f] via-[#1a0c06] to-[#0f0703] border-2 border-amber-600/70 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header Bar */}
        <HeaderBar
          title="EXPEDITIONS OF HEXARA"
          onBack={() => {
            soundManager.playClick();
            onClose();
          }}
        />

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Quick Play Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700/40 via-amber-600/20 to-orange-700/30 border border-amber-500/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 flex-shrink-0 shadow">
                <Zap className="w-6 h-6 fill-amber-400/40" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-100 flex items-center gap-2 justify-center sm:justify-start">
                  <span>Quick Play</span>
                  <span className="text-[9px] bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.2 rounded-full font-mono">
                    FAST MATCH
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Instant launch into a standard archipelago match with default settings.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onQuickPlay();
              }}
              className="catan-btn-gold px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 flex-shrink-0 shadow-lg active:scale-95 transition-all"
            >
              <span>Sail Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Tabs: Create Online / Join Code / Play Solo */}
          <div className="grid grid-cols-3 gap-2 bg-black/60 p-1.5 rounded-2xl border border-amber-600/40">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('create');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 shadow-md border border-amber-400/60'
                  : 'text-amber-300/70 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Create Online</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('join');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 shadow-md border border-amber-400/60'
                  : 'text-amber-300/70 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>Join Room</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('solo');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === 'solo'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 shadow-md border border-amber-400/60'
                  : 'text-amber-300/70 hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Play Solo</span>
            </button>
          </div>

          {/* TAB 1: CREATE ONLINE */}
          {activeTab === 'create' && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {/* Player Count Selector with Strategic Implications */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Captain Count (Real Players)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 2 Players */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setOnlinePlayerCount(2);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      onlinePlayerCount === 2
                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-black/50 border-amber-600/30 hover:border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-100 flex items-center gap-1">
                        <Swords className="w-3.5 h-3.5 text-amber-400" /> 2 Players
                      </span>
                      <span className="text-[9px] bg-red-950 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                        DUEL
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-200/70 mt-2 leading-tight">
                      Fast 1v1 match. Maximum rivalry, aggressive expansion, high robber tension.
                    </p>
                  </div>

                  {/* 3 Players */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setOnlinePlayerCount(3);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      onlinePlayerCount === 3
                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-black/50 border-amber-600/30 hover:border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-100 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-400" /> 3 Players
                      </span>
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                        RACE
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-200/70 mt-2 leading-tight">
                      Triangular competition. Great board balance, dynamic trade leverage.
                    </p>
                  </div>

                  {/* 4 Players */}
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setOnlinePlayerCount(4);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      onlinePlayerCount === 4
                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-black/50 border-amber-600/30 hover:border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-100 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" /> 4 Players
                      </span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                        CLASSIC
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-200/70 mt-2 leading-tight">
                      Traditional 4-captain board game experience with full trade diplomacy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scenario & Victory Points Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-amber-300 mb-1.5 block">
                    Scenario / Map
                  </label>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full bg-black/70 border border-amber-600/50 rounded-xl px-3 py-2 text-xs font-bold text-amber-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="first_island">The First Island (Standard Archipelago)</option>
                    <option value="ore_for_wool">Ore For Wool (Mountain Scarcity)</option>
                    <option value="harbormaster">The Harbormaster (Maritime Ports)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-amber-300 mb-1.5 block">
                    Victory Goal
                  </label>
                  <div className="flex items-center gap-2">
                    {[8, 10, 12].map((vp) => (
                      <button
                        key={vp}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setTargetVp(vp);
                        }}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                          targetVp === vp
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-black/60 border border-amber-600/40 text-amber-200 hover:border-amber-400'
                        }`}
                      >
                        {vp} VP
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Create Lobby Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onOpenAdvancedScenarios();
                  }}
                  className="text-xs text-amber-400/80 hover:text-amber-300 underline flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Advanced Map Settings & Board Seeds</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onCreateOnline(onlinePlayerCount, selectedScenario, targetVp);
                  }}
                  className="catan-btn-gold px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                  <span>Create Lobby</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: JOIN ROOM */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4 animate-in fade-in py-2">
              <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                <Globe className="w-12 h-12 text-amber-400 mb-2 animate-spin-slow" />
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-100">
                  Enter Expedition Room Code
                </h4>
                <p className="text-xs text-amber-200/70 mt-1">
                  Enter the 6-character voyage code shared by your host captain.
                </p>

                <div className="mt-4 w-full flex flex-col items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      setJoinError(null);
                    }}
                    placeholder="E.G. 7K4M2P"
                    className="w-48 bg-black/80 border-2 border-amber-500/70 rounded-2xl px-4 py-3 text-center text-lg font-black tracking-widest text-amber-300 placeholder:text-stone-700 uppercase focus:outline-none focus:border-amber-300 font-mono shadow-inner"
                  />
                  {joinError && <p className="text-xs text-red-400 font-bold">{joinError}</p>}
                </div>

                <button
                  type="submit"
                  className="catan-btn-gold mt-4 w-48 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg"
                >
                  Join Expedition
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PLAY SOLO (VS BOTS) */}
          {activeTab === 'solo' && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mb-2">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Captains (You + Autonomous AI Bots)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setSoloPlayerCount(2);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      soloPlayerCount === 2
                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-black/50 border-amber-600/30 hover:border-amber-500/60'
                    }`}
                  >
                    <span className="text-xs font-black uppercase text-amber-100">
                      2 Captains (1v1 Bot)
                    </span>
                    <p className="text-[10px] text-amber-200/70 mt-1">
                      Fast tactical duel against an intelligent bot adversary.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setSoloPlayerCount(3);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      soloPlayerCount === 3
                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-black/50 border-amber-600/30 hover:border-amber-500/60'
                    }`}
                  >
                    <span className="text-xs font-black uppercase text-amber-100">
                      3 Captains (You + 2 Bots)
                    </span>
                    <p className="text-[10px] text-amber-200/70 mt-1">
                      Triangular solo training with dynamic trade opportunities.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      soundManager.playClick();
                      setSoloPlayerCount(4);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      soloPlayerCount === 4
                        ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-black/50 border-amber-600/30 hover:border-amber-500/60'
                    }`}
                  >
                    <span className="text-xs font-black uppercase text-amber-100">
                      4 Captains (Full Board)
                    </span>
                    <p className="text-[10px] text-amber-200/70 mt-1">
                      Standard 4-player game against three AI captains.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onStartSolo(soloPlayerCount);
                  }}
                  className="catan-btn-gold px-7 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                  <Bot className="w-4 h-4" />
                  <span>Start Solo Voyage</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
