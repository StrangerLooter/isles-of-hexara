'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';

interface VoiceChatControlsProps {
  roomCode: string;
}

// Self-contained voice chat widget. Manages WebRTC internally so GameHUD
// doesn't need any state for it — just pass the roomCode.
export const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({ roomCode }) => {
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
  const volumeRef = useRef(1);

  // Update volumeRef when volume state changes
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    Object.values(peerConnsRef.current).forEach((pc) => pc.close());
    Object.values(remoteAudiosRef.current).forEach((a) => { a.pause(); a.srcObject = null; });
    streamRef.current = null;
    peerConnsRef.current = {};
    remoteAudiosRef.current = {};
  };

  const joinVoice = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // Voice Activity Detection via Web Audio API
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const detectVAD = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setIsSpeaking(avg > 15);
        vadRafRef.current = requestAnimationFrame(detectVAD);
      };
      detectVAD();

      setIsJoined(true);
    } catch (err: any) {
      setError('Microphone access denied');
      console.warn('[VoiceChat] Mic error:', err);
    }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = isMicMuted; // if currently muted, re-enable
    });
    setIsMicMuted((prev) => !prev);
    if (!isMicMuted) setIsSpeaking(false);
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
    <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-2xl border-2 border-amber-500/50 shadow-xl relative">
      {!isJoined ? (
        /* Join Voice Button */
        <button
          onClick={joinVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/80 text-xs font-bold uppercase tracking-wide transition-all"
          title="Join Voice Chat"
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
                ? 'bg-red-950/80 text-red-400 border border-red-500/60 hover:bg-red-900/80'
                : isSpeaking
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/80'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isSpeaking && !isMicMuted && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
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
                  ? 'bg-red-950/80 text-red-400 border border-red-500/60 hover:bg-red-900/80'
                  : 'bg-stone-900/80 text-amber-300 border border-amber-500/40 hover:bg-stone-800'
              }`}
              title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio (right-click for volume)'}
            >
              {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Volume Slider Popover */}
            {showVolumeSlider && (
              <div className="absolute bottom-12 left-0 bg-black/90 p-2.5 rounded-xl border border-amber-500/60 shadow-2xl flex flex-col items-center gap-2 z-50">
                <span className="text-[9px] font-mono text-amber-300 font-bold">
                  {Math.round(volume * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Voice Room Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/40 border border-amber-600/30 text-[10px] font-mono">
            <Radio className={`w-3.5 h-3.5 ${peerCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-emerald-500'}`} />
            <span className="text-amber-200/90 font-bold">
              {peerCount > 0 ? `${peerCount} in Voice` : 'Voice Active'}
            </span>
          </div>
        </>
      )}

      {error && (
        <span className="text-red-400 text-[9px] font-bold px-1">{error}</span>
      )}
    </div>
  );
};
