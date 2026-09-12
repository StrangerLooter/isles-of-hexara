'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio, Users } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface VoiceChatControlsProps {
  roomCode: string;
  socket?: Socket | null;
  localPlayerId?: string;
  username?: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

function getIceServers(): RTCConfiguration {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];
  const env = (import.meta as any).env ?? {};
  if (env.VITE_TURN_SERVER_URL) {
    const turnConfig: RTCIceServer = {
      urls: env.VITE_TURN_SERVER_URL,
    };
    if (env.VITE_TURN_USERNAME) turnConfig.username = env.VITE_TURN_USERNAME;
    if (env.VITE_TURN_CREDENTIAL) turnConfig.credential = env.VITE_TURN_CREDENTIAL;
    servers.push(turnConfig);
  }
  return { iceServers: servers };
}

export const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  roomCode,
  socket,
  localPlayerId,
  username,
  onSpeakingChange,
}) => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const peerConnsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteAudiosRef = useRef<Record<string, HTMLAudioElement>>({});
  const peerIdToSocketRef = useRef<Record<string, string>>({});
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const volumeRef = useRef(1);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Clean up on unmount or room leave
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (socket && isJoined) {
      socket.emit('voice:leave');
    }
    if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    Object.values(peerConnsRef.current).forEach((pc) => pc.close());
    peerConnsRef.current = {};

    Object.values(remoteAudiosRef.current).forEach((a) => {
      a.pause();
      a.srcObject = null;
    });
    remoteAudiosRef.current = {};
    peerIdToSocketRef.current = {};
    pendingCandidatesRef.current = {};
    setIsJoined(false);
    setPeerCount(0);
  };

  // Socket signaling event listeners
  useEffect(() => {
    if (!socket || !isJoined) return;

    // 1. A new peer joined the voice room -> create WebRTC offer
    const handlePeerJoined = async (data: { peerId: string; socketId: string; username: string }) => {
      if (!streamRef.current || data.peerId === localPlayerId) return;

      peerIdToSocketRef.current[data.peerId] = data.socketId;
      const pc = createPeerConnection(data.socketId);
      peerConnsRef.current[data.socketId] = pc;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice:signal', {
          targetSocketId: data.socketId,
          signal: offer,
        });
        setPeerCount(Object.keys(peerConnsRef.current).length);
      } catch (err) {
        console.warn('[VoiceChat] Offer error:', err);
      }
    };

    // 2. Incoming WebRTC signal (offer, answer, or candidate)
    const handleSignal = async (data: {
      senderPeerId: string;
      senderSocketId: string;
      signal: any;
    }) => {
      if (data.senderPeerId === localPlayerId) return;

      peerIdToSocketRef.current[data.senderPeerId] = data.senderSocketId;
      let pc = peerConnsRef.current[data.senderSocketId];
      if (!pc) {
        pc = createPeerConnection(data.senderSocketId);
        peerConnsRef.current[data.senderSocketId] = pc;
      }

      try {
        if (data.signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          // Apply any buffered early ICE candidates
          const queued = pendingCandidatesRef.current[data.senderSocketId] || [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          pendingCandidatesRef.current[data.senderSocketId] = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice:signal', {
            targetSocketId: data.senderSocketId,
            signal: answer,
          });
          setPeerCount(Object.keys(peerConnsRef.current).length);
        } else if (data.signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          // Apply any buffered early ICE candidates
          const queued = pendingCandidatesRef.current[data.senderSocketId] || [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          pendingCandidatesRef.current[data.senderSocketId] = [];
        } else if (data.signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate)).catch(() => {});
          } else {
            if (!pendingCandidatesRef.current[data.senderSocketId]) {
              pendingCandidatesRef.current[data.senderSocketId] = [];
            }
            pendingCandidatesRef.current[data.senderSocketId].push(data.signal.candidate);
          }
        }
      } catch (err) {
        console.warn('[VoiceChat] Signal handling error:', err);
      }
    };

    // 3. Peer left voice - selectively close only the leaving peer
    const handlePeerLeft = (data: { peerId: string; socketId?: string }) => {
      const targetSockId =
        data.socketId ||
        peerIdToSocketRef.current[data.peerId] ||
        Object.keys(peerConnsRef.current).find((sockId) => sockId === data.socketId);

      if (targetSockId) {
        const pc = peerConnsRef.current[targetSockId];
        if (pc) {
          pc.close();
          delete peerConnsRef.current[targetSockId];
        }
        const audio = remoteAudiosRef.current[targetSockId];
        if (audio) {
          audio.pause();
          audio.srcObject = null;
          delete remoteAudiosRef.current[targetSockId];
        }
        delete pendingCandidatesRef.current[targetSockId];
      }
      delete peerIdToSocketRef.current[data.peerId];
      setPeerCount(Object.keys(peerConnsRef.current).length);
    };

    socket.on('voice:peer-joined', handlePeerJoined);
    socket.on('voice:signal', handleSignal);
    socket.on('voice:peer-left', handlePeerLeft);

    return () => {
      socket.off('voice:peer-joined', handlePeerJoined);
      socket.off('voice:signal', handleSignal);
      socket.off('voice:peer-left', handlePeerLeft);
    };
  }, [socket, isJoined, localPlayerId]);

  const createPeerConnection = (targetSocketId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(getIceServers());

    // Add local mic audio track
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current!);
      });
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:signal', {
          targetSocketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    // Incoming remote audio track
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = remoteAudiosRef.current[targetSocketId];
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          audioEl.volume = isDeafened ? 0 : volumeRef.current;
          remoteAudiosRef.current[targetSocketId] = audioEl;
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(() => {});
      }
    };

    return pc;
  };

  const joinVoice = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = stream;

      // Voice Activity Detection via Web Audio API
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      let prevSpeaking = false;
      const detectVAD = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const speakingNow = avg > 14 && !isMicMuted;

        setIsSpeaking(speakingNow);
        if (speakingNow !== prevSpeaking) {
          prevSpeaking = speakingNow;
          onSpeakingChange?.(speakingNow);
          if (socket) {
            socket.emit('voice:speaking', { isSpeaking: speakingNow });
          }
        }

        vadRafRef.current = requestAnimationFrame(detectVAD);
      };
      detectVAD();

      setIsJoined(true);

      // Notify room via socket if online
      if (socket) {
        socket.emit('voice:join', { roomCode });
      }
    } catch (err: any) {
      setError('Mic access required for Voice');
      console.warn('[VoiceChat] Mic error:', err);
    }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    const newMuted = !isMicMuted;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !newMuted;
    });
    setIsMicMuted(newMuted);
    if (newMuted) {
      setIsSpeaking(false);
      onSpeakingChange?.(false);
      if (socket) {
        socket.emit('voice:speaking', { isSpeaking: false });
      }
    }
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    Object.values(remoteAudiosRef.current).forEach((a) => {
      a.volume = newDeafened ? 0 : volumeRef.current;
    });
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (!isDeafened) {
      Object.values(remoteAudiosRef.current).forEach((a) => {
        a.volume = newVol;
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-2xl border-2 border-amber-500/60 shadow-xl relative select-none">
      {!isJoined ? (
        /* Join Voice Button */
        <button
          onClick={joinVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-emerald-100 border border-emerald-400/60 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95"
          title="Connect to Real-time Team Voice Chat"
        >
          <Mic className="w-4 h-4" />
          <span className="hidden sm:inline">Join Voice</span>
        </button>
      ) : (
        <>
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
              isMicMuted
                ? 'bg-red-950 text-red-300 border border-red-500/80 hover:bg-red-900'
                : isSpeaking
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-pulse'
                : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isSpeaking && !isMicMuted && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
            )}
          </button>

          {/* Deafen / Volume Toggle */}
          <div className="relative">
            <button
              onClick={toggleDeafen}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowVolumeSlider((v) => !v);
              }}
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                isDeafened
                  ? 'bg-red-950 text-red-300 border border-red-500/80 hover:bg-red-900'
                  : 'bg-stone-900 text-amber-300 border border-amber-500/50 hover:bg-stone-800'
              }`}
              title={isDeafened ? 'Undeafen Voice Audio' : 'Deafen Voice Audio (right-click for volume)'}
            >
              {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Volume Slider Popover */}
            {showVolumeSlider && (
              <div className="absolute bottom-12 left-0 bg-black/95 p-3 rounded-2xl border-2 border-amber-500/80 shadow-2xl flex flex-col items-center gap-2 z-50">
                <span className="text-[10px] font-mono text-amber-300 font-bold">
                  Voice Vol: {Math.round(volume * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-24 accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Voice Room Live Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-emerald-500/40 text-[10px] font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-200 font-bold">
              {peerCount > 0 ? `${peerCount + 1} Voyagers in Voice` : 'Live Voice Ready'}
            </span>
          </div>

          {/* Disconnect Voice */}
          <button
            onClick={cleanup}
            className="text-[10px] uppercase font-bold text-red-400 hover:text-red-200 px-1.5 py-0.5 hover:bg-red-950/60 rounded"
            title="Leave Voice Channel"
          >
            Leave
          </button>
        </>
      )}

      {error && (
        <span className="text-red-400 text-[9px] font-bold px-1.5">{error}</span>
      )}
    </div>
  );
};
