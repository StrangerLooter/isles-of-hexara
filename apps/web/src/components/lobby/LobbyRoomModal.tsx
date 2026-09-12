'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Copy,
  CheckCircle2,
  Play,
  LogOut,
  Sparkles,
  Shield,
  Clock,
  Crown,
  UserX,
  MessageSquare,
  Send,
  Compass,
  ChevronLeft,
  X,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  ServerLobbyStatePayload,
  ServerLobbySeat,
  ServerErrorPayload,
} from '@hexara/protocol';
import { soundManager } from '../../game/SoundManager';
import { SERVER_URL } from '../../lib/serverUrl';

interface LobbyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isHost: boolean;
  userProfile: { id: string; username: string; avatar: string };
  onGameStarted: (code: string) => void;
  socket?: Socket | null;
  createOptions?: {
    scenarioId?: string;
    scenarioName?: string;
    targetVictoryPoints?: number;
    maxPlayers?: number;
    seed?: number;
    turnDurationSeconds?: number;
    mode?: 'solo' | 'online';
  };
  onRoomCodeAssigned?: (code: string) => void;
}

export const LobbyRoomModal: React.FC<LobbyRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  isHost,
  userProfile,
  onGameStarted,
  socket: externalSocket,
  createOptions,
  onRoomCodeAssigned,
}) => {
  const isSolo = createOptions?.mode === 'solo' || roomCode === 'SOLO';

  const [lobbyState, setLobbyState] = useState<ServerLobbyStatePayload | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);

  // Solo mode local state
  const [soloSeats, setSoloSeats] = useState<ServerLobbySeat[]>([
    {
      playerId: userProfile.id,
      username: userProfile.username,
      color: '#e11d48',
      ready: true,
      isAi: false,
      isConnected: true,
    },
    {
      playerId: 'ai_1',
      username: 'Candamir (Bot)',
      color: '#ef4444',
      ready: true,
      isAi: true,
      isConnected: true,
    },
    {
      playerId: 'ai_2',
      username: 'Louis (Bot)',
      color: '#3b82f6',
      ready: true,
      isAi: true,
      isConnected: true,
    },
    {
      playerId: 'ai_3',
      username: 'William (Bot)',
      color: '#10b981',
      ready: true,
      isAi: true,
      isConnected: true,
    },
  ]);
  const [soloTurnDuration, setSoloTurnDuration] = useState<number>(createOptions?.turnDurationSeconds || 60);
  const [soloTargetVp, setSoloTargetVp] = useState<number>(createOptions?.targetVictoryPoints || 10);

  const displayRoomCode = isSolo ? 'SOLO' : (lobbyState?.code || roomCode);

  // In-lobby chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: `Voyage room created. Welcome aboard, Captain!`, time: 'Now' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showCustomTurnInput, setShowCustomTurnInput] = useState(false);
  const [customTurnVal, setCustomTurnVal] = useState(45);

  const socketRef = useRef<Socket | null>(null);

  // Reset and initialize solo state when opened
  useEffect(() => {
    if (isOpen && isSolo) {
      const maxP = createOptions?.maxPlayers || 4;
      const initial: ServerLobbySeat[] = [
        {
          playerId: userProfile.id,
          username: userProfile.username,
          color: '#e11d48',
          ready: true,
          isAi: false,
          isConnected: true,
        },
        {
          playerId: 'ai_1',
          username: 'Candamir (Bot)',
          color: '#ef4444',
          ready: true,
          isAi: true,
          isConnected: true,
        },
        {
          playerId: 'ai_2',
          username: 'Louis (Bot)',
          color: '#3b82f6',
          ready: true,
          isAi: true,
          isConnected: true,
        },
      ];
      if (maxP >= 4) {
        initial.push({
          playerId: 'ai_3',
          username: 'William (Bot)',
          color: '#10b981',
          ready: true,
          isAi: true,
          isConnected: true,
        });
      }
      setSoloSeats(initial);
      setSoloTurnDuration(createOptions?.turnDurationSeconds || 60);
      setSoloTargetVp(createOptions?.targetVictoryPoints || 10);
      setChatMessages([
        { sender: 'System', text: 'Solo Expedition lobby created. Prepare your strategy vs the bot crew!', time: 'Now' },
      ]);
    }
  }, [isOpen, isSolo, createOptions?.maxPlayers, createOptions?.turnDurationSeconds, createOptions?.targetVictoryPoints, userProfile.id, userProfile.username]);

  // Online socket connection
  useEffect(() => {
    if (!isOpen || !roomCode || isSolo) return;

    let socket = externalSocket;
    let ownsSocket = false;

    if (!socket || !socket.connected) {
      ownsSocket = true;
      const token = localStorage.getItem('hexara_auth_token') || sessionStorage.getItem('hexara_auth_token') || undefined;
      socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token,
          username: userProfile.username,
          playerId: userProfile.id,
        },
      });
    }
    socketRef.current = socket;

    const initializeRoom = () => {
      if (isHost) {
        socket?.emit(CLIENT_EVENTS.CREATE_GAME, {
          code: roomCode,
          roomCode: roomCode,
          scenarioId: createOptions?.scenarioId || 'first_island',
          scenarioName: createOptions?.scenarioName || 'First Island',
          targetVictoryPoints: createOptions?.targetVictoryPoints || 10,
          maxPlayers: createOptions?.maxPlayers || 4,
          mode: 'online',
          seed: createOptions?.seed,
          turnDurationSeconds: createOptions?.turnDurationSeconds || 60,
        });
      } else {
        socket?.emit(CLIENT_EVENTS.JOIN_GAME, {
          code: roomCode,
          gameId: roomCode,
          playerId: userProfile.id,
          username: userProfile.username,
        });
      }
    };

    if (socket.connected) {
      initializeRoom();
    } else {
      socket.on('connect', initializeRoom);
    }

    socket.on(SERVER_EVENTS.LOBBY_STATE, (state: ServerLobbyStatePayload) => {
      setLobbyState(state);
      setErrorMsg(null);
      if (state.code) {
        sessionStorage.setItem('hexara_room_code', state.code);
        onRoomCodeAssigned?.(state.code);
      }
      if (state.status === 'playing') {
        soundManager.playTurnChime();
        onGameStarted(state.code || displayRoomCode);
      }
    });

    socket.on(SERVER_EVENTS.GAME_STATE, () => {
      soundManager.playTurnChime();
      onGameStarted(displayRoomCode);
    });

    socket.on(SERVER_EVENTS.PLAYER_JOINED, (payload: { playerId: string; username: string }) => {
      soundManager.playClick();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: `${payload.username} joined the crew!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    socket.on(SERVER_EVENTS.PLAYER_LEFT, (payload: { playerId: string; reason?: string }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: `A voyager left the room (${payload.reason || 'departed'}).`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    socket.on(SERVER_EVENTS.COUNTDOWN, (payload: { count: number }) => {
      setCountdownNumber(payload.count);
      setIsStarting(true);
      if (payload.count > 0) {
        soundManager.playClick();
      } else {
        soundManager.playTurnChime();
      }
    });

    socket.on(SERVER_EVENTS.ERROR, (err: ServerErrorPayload) => {
      // If we tried to CREATE but the room already exists, auto-switch to JOIN
      if ((err as any).code === 'ROOM_ALREADY_EXISTS') {
        socket?.emit(CLIENT_EVENTS.JOIN_GAME, {
          code: roomCode,
          gameId: roomCode,
          playerId: userProfile.id,
          username: userProfile.username,
        });
        return; // Don't surface this error to the user — transparent recovery
      }
      soundManager.playError();
      setErrorMsg(err.message || 'Room error');
      setIsStarting(false);
      setCountdownNumber(null);
    });

    socket.on(SERVER_EVENTS.CHAT_MESSAGE, (payload: { playerId: string; username: string; message: string; timestamp: number }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: payload.username,
          text: payload.message,
          time: new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    return () => {
      if (ownsSocket) {
        socket?.disconnect();
      }
      setLobbyState(null);
      setErrorMsg(null);
      setIsStarting(false);
      setCountdownNumber(null);
    };
  }, [isOpen, roomCode, isHost, isSolo, userProfile.id, userProfile.username]);

  if (!isOpen) return null;

  const currentSocket = socketRef.current || externalSocket;
  const amHost = isSolo ? true : (lobbyState ? lobbyState.hostId === userProfile.id : isHost);
  const maxPlayers = isSolo ? (createOptions?.maxPlayers || 4) : (lobbyState?.settings.maxPlayers || 4);
  const seats = isSolo ? soloSeats : (lobbyState?.seats || [
    {
      playerId: userProfile.id,
      username: userProfile.username,
      color: '#e11d48',
      ready: isHost,
      isAi: false,
      isConnected: true,
    },
  ]);
  const mySeat = seats.find((s) => s.playerId === userProfile.id);
  const activeTurnDuration = isSolo ? soloTurnDuration : (lobbyState?.settings.turnDurationSeconds || 60);
  const activeTargetVp = isSolo ? soloTargetVp : (lobbyState?.settings.targetVictoryPoints || 10);
  const activeScenarioName = createOptions?.scenarioName || lobbyState?.settings.scenarioName || 'The First Island';

  const handleCopyCode = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(displayRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    soundManager.playClick();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/#/game?code=${displayRoomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleReady = () => {
    soundManager.playClick();
    if (isSolo) {
      setSoloSeats((prev) =>
        prev.map((s) => (s.playerId === userProfile.id ? { ...s, ready: !s.ready } : s))
      );
      return;
    }
    if (!currentSocket) return;
    const nextReady = !(mySeat?.ready ?? false);
    currentSocket.emit(CLIENT_EVENTS.SET_READY, {
      code: displayRoomCode,
      ready: nextReady,
    });
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    soundManager.playClick();
    if (isSolo) {
      setSoloSeats((prev) => prev.filter((s) => s.playerId !== targetPlayerId));
      return;
    }
    if (!currentSocket || !amHost) return;
    currentSocket.emit(CLIENT_EVENTS.KICK_SEAT, {
      code: displayRoomCode,
      seatPlayerId: targetPlayerId,
    });
  };

  const handleAddAi = () => {
    soundManager.playClick();
    if (isSolo) {
      if (soloSeats.length < maxPlayers) {
        const extraBots = [
          { id: 'ai_extra_1', name: 'Captain Drake (Bot)', color: '#f59e0b' },
          { id: 'ai_extra_2', name: 'Lady Eleanor (Bot)', color: '#8b5cf6' },
        ];
        const next = extraBots[soloSeats.length % extraBots.length];
        setSoloSeats((prev) => [
          ...prev,
          {
            playerId: `${next.id}_${Date.now()}`,
            username: next.name,
            color: next.color,
            ready: true,
            isAi: true,
            isConnected: true,
          },
        ]);
      }
      return;
    }
    currentSocket?.emit(CLIENT_EVENTS.ADD_AI, { code: roomCode });
  };

  const handleSetColor = (color: string) => {
    soundManager.playClick();
    if (isSolo) {
      setSoloSeats((prev) =>
        prev.map((s) => (s.playerId === userProfile.id ? { ...s, color } : s))
      );
      return;
    }
    currentSocket?.emit(CLIENT_EVENTS.SET_COLOR, { code: displayRoomCode, color });
  };

  const handleUpdateTurnDuration = (sec: number) => {
    soundManager.playClick();
    if (isSolo) {
      setSoloTurnDuration(sec);
      sessionStorage.setItem('hexara_turn_duration', String(sec));
    } else {
      currentSocket?.emit('client:update_lobby_settings', {
        code: displayRoomCode,
        settings: { turnDurationSeconds: sec },
      });
    }
  };

  const handleUpdateTargetVp = (vp: number) => {
    soundManager.playClick();
    if (isSolo) {
      setSoloTargetVp(vp);
      sessionStorage.setItem('hexara_vp_target', String(vp));
    } else {
      currentSocket?.emit('client:update_lobby_settings', {
        code: displayRoomCode,
        settings: { targetVictoryPoints: vp },
      });
    }
  };

  const handleApplyCustomTurn = () => {
    const val = Math.max(10, Math.min(600, customTurnVal));
    soundManager.playClick();
    handleUpdateTurnDuration(val);
    setShowCustomTurnInput(false);
  };

  const handleStartGame = () => {
    soundManager.playClick();
    if (isSolo) {
      setIsStarting(true);
      sessionStorage.setItem('hexara_match_mode', 'solo');
      sessionStorage.setItem('hexara_player_count', String(soloSeats.length));
      sessionStorage.setItem('hexara_turn_duration', String(soloTurnDuration));
      sessionStorage.setItem('hexara_vp_target', String(soloTargetVp));
      sessionStorage.setItem('hexara_scenario_name', createOptions?.scenarioName || 'The First Island');
      sessionStorage.setItem('hexara_scenario_id', createOptions?.scenarioId || 'first_island');
      sessionStorage.setItem('hexara_board_seed', String(createOptions?.seed || Math.floor(100000 + Math.random() * 900000)));
      sessionStorage.removeItem('hexara_active_game_state');
      sessionStorage.removeItem('hexara_room_code');

      soundManager.playTurnChime();
      onGameStarted('SOLO');
      return;
    }

    if (!currentSocket || !amHost) return;
    setIsStarting(true);
    setErrorMsg(null);
    currentSocket.emit(CLIENT_EVENTS.START_GAME, {
      code: displayRoomCode,
    });
  };

  const handleLeave = () => {
    soundManager.playClick();
    if (!isSolo && currentSocket) {
      currentSocket.emit(CLIENT_EVENTS.LEAVE_GAME, {
        code: displayRoomCode,
      });
    }
    onClose();
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundManager.playClick();
    const text = chatInput.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSolo) {
      setChatMessages((prev) => [...prev, { sender: userProfile.username, text, time: nowStr }]);
      setChatInput('');
      setTimeout(() => {
        const aiReplies = [
          'Ready to set sail, Captain!',
          'May the dice roll favorably on Hexara.',
          'Keep your sights set on the longest road!',
          'Harbor trade will decide our fates.',
        ];
        const botReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'Candamir (Bot)',
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 500);
    } else {
      if (!currentSocket) return;
      currentSocket.emit(CLIENT_EVENTS.SEND_CHAT, {
        message: text,
        gameId: displayRoomCode,
      });
      setChatInput('');
    }
  };

  // Check if match can be started (at least 2 players, and all human players ready)
  const allReady = seats.every((s) => s.ready || s.isAi);
  const canStart = amHost && allReady && seats.length >= 1;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#2a1308] via-[#1a0c05] to-[#0f0602] border-2 border-amber-500/70 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.4)] overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-[#3a1c0e] to-amber-950 border-b border-amber-500/40">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 hover:text-white font-bold text-xs flex items-center gap-1.5 uppercase transition-colors cursor-pointer"
              title="Return to Port"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-amber-100 font-serif">
                  Archipelago Voyage Lobby
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                    isSolo
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                      : 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {isSolo ? 'SOLO EXPEDITION' : 'ONLINE'}
                </span>
              </div>
              <p className="text-[11px] text-amber-300/70 font-medium">
                {isSolo ? 'Prepare your bot crew and configure match targets' : 'Assemble your crew before setting sail'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLeave}
            className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 hover:text-white font-bold flex items-center justify-center transition-colors text-xs cursor-pointer"
            title="Leave Lobby"
          >
            ✕
          </button>
        </div>

        {/* Room Code Showcase Box */}
        <div className="px-6 py-4 bg-black/40 border-b border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-widest font-mono">
                {isSolo ? 'MODE' : 'ROOM CODE'}
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600">
                {displayRoomCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isSolo && (
              <>
                <button
                  onClick={handleCopyCode}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#2b170c] border border-amber-500/60 text-amber-200 hover:text-white hover:border-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#2b170c] border border-amber-500/60 text-amber-200 hover:text-white hover:border-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Invite Link'}</span>
                </button>
              </>
            )}
            {isSolo && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs font-mono font-medium">
                Offline AI Bots Expedition
              </div>
            )}
          </div>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Waiting for crew banner */}
        {amHost && !allReady && seats.length > 1 && (
          <div className="mx-6 mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs font-medium text-center flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>Waiting for all crew members to toggle &ldquo;Ready&rdquo; before setting sail</span>
          </div>
        )}

        {/* Dramatic Synchronized 3-2-1 Countdown Overlay */}
        {countdownNumber !== null && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-6 text-center animate-in fade-in duration-300">
            <div className="relative flex flex-col items-center justify-center">
              <div className="text-amber-400/80 font-serif font-black uppercase tracking-[0.3em] text-sm mb-4 animate-pulse">
                All Voyagers Ready
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-48 h-48 rounded-full bg-amber-500/20 blur-2xl animate-ping" />
                <div className="w-36 h-36 rounded-full border-4 border-amber-400/70 bg-gradient-to-br from-amber-950/90 via-black to-amber-950/90 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)]">
                  {countdownNumber > 0 ? (
                    <span
                      key={countdownNumber}
                      className="text-7xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 animate-in zoom-in-75 duration-200"
                    >
                      {countdownNumber}
                    </span>
                  ) : (
                    <span
                      key="embark"
                      className="text-2xl sm:text-3xl font-black font-serif uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 via-emerald-400 to-emerald-600 animate-in zoom-in-75 duration-200"
                    >
                      Set Sail!
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-6 text-xs text-amber-200/90 font-mono tracking-widest uppercase">
                {countdownNumber > 0 ? 'Embarking to Hexara Archipelago...' : 'Entering Ocean Waters...'}
              </div>
            </div>
          </div>
        )}

        {/* Body: Player Slots (Left) & Chat / Match Info (Right) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start overflow-y-auto max-h-[55vh] custom-scrollbar">
          {/* Left Column: Player Slots */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-300/80 mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Crew Roster ({seats.length} / {maxPlayers})
              </span>
              <div className="flex items-center gap-2">
                {amHost && seats.length < maxPlayers && (
                  <button
                    type="button"
                    onClick={handleAddAi}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>+ Add AI</span>
                  </button>
                )}
                <span className="text-[10px] font-mono text-amber-400/60">
                  {amHost ? 'You are Host' : 'Voyager'}
                </span>
              </div>
            </div>

            {/* Render Filled Seats */}
            {seats.map((seat, idx) => {
              const isMe = seat.playerId === userProfile.id;
              const isSeatHost = isSolo ? idx === 0 : (lobbyState ? seat.playerId === lobbyState.hostId : idx === 0);

              return (
                <div
                  key={seat.playerId || idx}
                  className="p-3.5 rounded-2xl bg-black/50 border border-amber-600/40 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {/* Color Orb & Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 shadow-inner"
                      style={{
                        backgroundColor: `${seat.color || '#e11d48'}33`,
                        borderColor: seat.color || '#e11d48',
                      }}
                    >
                      {seat.playerId === userProfile.id ? userProfile.avatar : (seat.isAi ? '🤖' : '⚓')}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-100">
                          {seat.username}
                        </span>
                        {isMe && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                            YOU
                          </span>
                        )}
                        {isSeatHost && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black flex items-center gap-0.5 shadow">
                            <Crown className="w-3 h-3" /> HOST
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-300/60 font-mono">
                        Seat #{idx + 1} &bull; {seat.isAi ? 'AI Persona' : (seat.isConnected ? 'Connected' : 'Reconnecting...')}
                      </span>
                      {isMe && !seat.ready && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-amber-300/70 font-bold uppercase tracking-wider">Color:</span>
                          {['#f59e0b', '#3b82f6', '#10b981', '#ef4444'].map((color) => {
                            const isTaken = seats.some((s) => s.playerId !== seat.playerId && s.color?.toLowerCase() === color.toLowerCase());
                            const isSelected = seat.color?.toLowerCase() === color.toLowerCase();
                            return (
                              <button
                                key={color}
                                type="button"
                                disabled={isTaken}
                                onClick={() => handleSetColor(color)}
                                style={{ backgroundColor: color }}
                                title={isTaken ? 'Color taken by another player' : 'Select color'}
                                className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-white scale-125 border-white shadow-sm'
                                    : isTaken
                                    ? 'opacity-20 cursor-not-allowed border-black'
                                    : 'border-black/60 hover:scale-110 opacity-80 hover:opacity-100'
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Ready badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${
                        seat.ready
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                          : 'bg-amber-950/60 text-amber-400/70 border-amber-700/40'
                      }`}
                    >
                      {seat.ready ? '✓ Ready' : 'Waiting'}
                    </span>

                    {/* Host Kick Button */}
                    {amHost && !isMe && (
                      <button
                        onClick={() => handleKickPlayer(seat.playerId)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer"
                        title="Kick Seat"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Render Empty Waiting Slots */}
            {Array.from({ length: Math.max(0, maxPlayers - seats.length) }).map((_, i) => (
              <div
                key={`empty_${i}`}
                className="p-3.5 rounded-2xl bg-black/30 border border-dashed border-amber-600/30 flex items-center justify-between opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-600 text-sm font-bold">
                    {seats.length + i + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-200/60">
                      Waiting for voyager...
                    </span>
                    <span className="text-[10px] text-amber-400/40 font-mono">
                      (Or fills with AI persona at match start)
                    </span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-400/40 animate-ping" />
              </div>
            ))}
          </div>

          {/* Right Column: In-Lobby Chat & Match Rules */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Match Rules Card */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-600/40 space-y-2 text-xs">
              <h4 className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5 tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Match Settings
              </h4>
              <div className="flex justify-between text-[11px] text-amber-200/80">
                <span>Scenario:</span>
                <span className="font-bold text-amber-100">{activeScenarioName}</span>
              </div>

              {/* Victory Target with Dynamic Host Options */}
              <div className="flex flex-col gap-1 pt-1 border-t border-amber-900/30">
                <div className="flex justify-between text-[11px] text-amber-200/80">
                  <span>Victory Target:</span>
                  <span className="font-bold text-amber-300 font-mono">{activeTargetVp} VP</span>
                </div>
                {amHost && (
                  <div className="grid grid-cols-3 gap-1 mt-0.5">
                    {[10, 12, 14].map((vp) => (
                      <button
                        key={vp}
                        type="button"
                        onClick={() => handleUpdateTargetVp(vp)}
                        className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          activeTargetVp === vp
                            ? 'bg-amber-600 text-amber-950 border-amber-300 font-black shadow'
                            : 'bg-black/50 text-amber-200/70 border-amber-900/60 hover:text-white hover:border-amber-600/50'
                        }`}
                      >
                        {vp} VP
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Turn Duration with Dynamic Presets & Custom Input */}
              {amHost && (
                <div className="pt-2 border-t border-amber-900/40 mt-1">
                  <div className="flex justify-between items-center text-[10px] text-amber-300 font-bold mb-1.5">
                    <span>Host: Turn Duration</span>
                    <span className="font-mono text-amber-400 font-black">
                      {activeTurnDuration}s
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[30, 60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setShowCustomTurnInput(false);
                          handleUpdateTurnDuration(sec);
                        }}
                        className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          !showCustomTurnInput && activeTurnDuration === sec
                            ? 'bg-amber-600 text-amber-950 border-amber-300 font-black shadow'
                            : 'bg-black/50 text-amber-200/70 border-amber-900/60 hover:text-white hover:border-amber-600/50'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomTurnInput(true)}
                      className={`py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        showCustomTurnInput || ![30, 60, 90, 120].includes(activeTurnDuration)
                          ? 'bg-amber-600 text-amber-950 border-amber-300 font-black shadow'
                          : 'bg-black/50 text-amber-200/70 border-amber-900/60 hover:text-white hover:border-amber-600/50'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {showCustomTurnInput && (
                    <div className="flex items-center gap-2 mt-1.5 bg-black/60 p-1.5 rounded-lg border border-amber-500/40">
                      <input
                        type="number"
                        min={10}
                        max={600}
                        value={customTurnVal}
                        onChange={(e) => setCustomTurnVal(Math.max(10, Math.min(600, Number(e.target.value) || 10)))}
                        className="w-16 bg-black border border-amber-500/60 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono font-black"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomTurn}
                        className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-black text-[10px] uppercase cursor-pointer"
                      >
                        Apply
                      </button>
                      <span className="text-[9px] text-amber-400/60 font-mono">(10s–600s)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Box */}
            <div className="flex flex-col h-48 bg-black/60 rounded-2xl border border-amber-600/40 p-2.5">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-amber-600/20 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Crew Chat
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 py-1 text-xs custom-scrollbar">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className="text-[11px] leading-tight">
                    <span className="font-bold text-amber-300">{m.sender}: </span>
                    <span className="text-amber-100/90">{m.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-1 pt-1.5 border-t border-amber-600/20">
                <input
                  type="text"
                  maxLength={120}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message crew..."
                  className="flex-1 bg-black/60 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-amber-600/40 hover:bg-amber-500 text-amber-200 hover:text-white transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-black/50 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleLeave}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#241710] hover:bg-[#342217] border border-amber-800/60 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Non-host Ready Toggle */}
            {!amHost && (
              <button
                onClick={handleToggleReady}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                  mySeat?.ready
                    ? 'bg-emerald-800 border-emerald-400 text-white shadow-lg'
                    : 'catan-btn-gold'
                }`}
              >
                {mySeat?.ready ? '✓ I am Ready' : 'Set Ready'}
              </button>
            )}

            {/* Host Start Match Button */}
            {amHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart || isStarting || countdownNumber !== null}
                className={`w-full sm:w-auto px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  canStart && !isStarting && countdownNumber === null
                    ? 'catan-btn-gold shadow-[0_6px_25px_rgba(245,158,11,0.6)] cursor-pointer'
                    : 'bg-[#2b1f18] text-stone-500 border border-stone-800 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {isStarting || countdownNumber !== null
                    ? 'Launching Match...'
                    : !allReady && seats.length > 1
                    ? 'Waiting for Crew Ready'
                    : 'Set Sail (Start Match)'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
