'use client';

import { Socket } from 'socket.io-client';

export interface VoicePeer {
  peerId: string;
  username: string;
  socketId: string;
  connection: RTCPeerConnection;
  audioStream?: MediaStream;
  isSpeaking: boolean;
}

export type VoiceStateChangeCallback = (state: {
  isMicMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  activePeers: Record<string, { username: string; isSpeaking: boolean }>;
}) => void;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCVoiceManager {
  private socket: Socket | null = null;
  private roomCode: string = '';
  private localPlayerId: string = '';
  private localUsername: string = '';

  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: any = null;

  private isMicMuted: boolean = false;
  private isDeafened: boolean = false;
  private isLocalSpeaking: boolean = false;

  private peers = new Map<string, VoicePeer>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private listeners = new Set<VoiceStateChangeCallback>();

  constructor() {}

  public subscribe(cb: VoiceStateChangeCallback): () => void {
    this.listeners.add(cb);
    this.notifyState();
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyState(): void {
    const activePeers: Record<string, { username: string; isSpeaking: boolean }> = {};
    this.peers.forEach((peer, pId) => {
      activePeers[pId] = { username: peer.username, isSpeaking: peer.isSpeaking };
    });

    const state = {
      isMicMuted: this.isMicMuted,
      isDeafened: this.isDeafened,
      isSpeaking: this.isLocalSpeaking,
      activePeers,
    };

    this.listeners.forEach((cb) => cb(state));
  }

  public async initVoice(
    socket: Socket,
    roomCode: string,
    localPlayerId: string,
    username: string
  ): Promise<boolean> {
    this.socket = socket;
    this.roomCode = roomCode;
    this.localPlayerId = localPlayerId;
    this.localUsername = username;

    try {
      // 1. Get user microphone stream
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });

          // Set up AudioContext Voice Activity Detection (VAD)
          this.setupVAD(this.localStream);
        } catch (mediaErr) {
          console.warn('Microphone access denied or unavailable:', mediaErr);
          this.isMicMuted = true;
        }
      }

      // 2. Attach socket signaling listeners
      this.setupSocketListeners(socket);

      // 3. Announce presence to room
      socket.emit('voice:join', { roomCode });
      this.notifyState();
      return true;
    } catch (err) {
      console.warn('Failed to initialize WebRTC Voice:', err);
      return false;
    }
  }

  private setupVAD(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);

      this.vadInterval = setInterval(() => {
        if (!this.analyser || this.isMicMuted) {
          if (this.isLocalSpeaking) {
            this.isLocalSpeaking = false;
            this.socket?.emit('voice:speaking', { isSpeaking: false });
            this.notifyState();
          }
          return;
        }

        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const speakingNow = avg > 14;

        if (speakingNow !== this.isLocalSpeaking) {
          this.isLocalSpeaking = speakingNow;
          this.socket?.emit('voice:speaking', { isSpeaking: speakingNow });
          this.notifyState();
        }
      }, 120);
    } catch (e) {
      console.warn('VAD initialization error:', e);
    }
  }

  private setupSocketListeners(socket: Socket): void {
    socket.on('voice:peer-joined', async (data: { peerId: string; socketId: string; username: string }) => {
      if (data.peerId === this.localPlayerId) return;
      await this.createPeerConnection(data.peerId, data.socketId, data.username, true);
    });

    socket.on('voice:signal', async (data: { senderPeerId: string; senderSocketId: string; senderUsername: string; signal: any }) => {
      if (data.senderPeerId === this.localPlayerId) return;

      let peer = this.peers.get(data.senderPeerId);
      if (!peer) {
        peer = await this.createPeerConnection(data.senderPeerId, data.senderSocketId, data.senderUsername, false);
      }

      if (data.signal.type === 'offer') {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        socket.emit('voice:signal', {
          targetSocketId: data.senderSocketId,
          targetPeerId: data.senderPeerId,
          signal: answer,
        });
      } else if (data.signal.type === 'answer') {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(data.signal));
      } else if (data.signal.candidate) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        } catch (e) {
          console.warn('Error adding ICE candidate:', e);
        }
      }
    });

    socket.on('voice:speaking-status', (data: { peerId: string; isSpeaking: boolean }) => {
      const peer = this.peers.get(data.peerId);
      if (peer) {
        peer.isSpeaking = data.isSpeaking;
        this.notifyState();
      }
    });

    socket.on('voice:peer-left', (data: { peerId: string }) => {
      this.removePeer(data.peerId);
    });
  }

  private async createPeerConnection(
    peerId: string,
    socketId: string,
    username: string,
    isInitiator: boolean
  ): Promise<VoicePeer> {
    const existing = this.peers.get(peerId);
    if (existing) {
      existing.connection.close();
      this.peers.delete(peerId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local audio tracks if available
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    const peer: VoicePeer = {
      peerId,
      socketId,
      username,
      connection: pc,
      isSpeaking: false,
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('voice:signal', {
          targetSocketId: socketId,
          targetPeerId: peerId,
          signal: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      peer.audioStream = remoteStream;

      let audioEl = this.audioElements.get(peerId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        this.audioElements.set(peerId, audioEl);
      }
      audioEl.srcObject = remoteStream;
      audioEl.muted = this.isDeafened;
      audioEl.play().catch((err) => console.warn('Audio play prevented:', err));
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket?.emit('voice:signal', {
        targetSocketId: socketId,
        targetPeerId: peerId,
        signal: offer,
      });
    }

    this.peers.set(peerId, peer);
    this.notifyState();
    return peer;
  }

  private removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(peerId);
    }
    const audioEl = this.audioElements.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      this.audioElements.delete(peerId);
    }
    this.notifyState();
  }

  public toggleMic(): boolean {
    this.isMicMuted = !this.isMicMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMicMuted;
      });
    }
    if (this.isMicMuted && this.isLocalSpeaking) {
      this.isLocalSpeaking = false;
      this.socket?.emit('voice:speaking', { isSpeaking: false });
    }
    this.notifyState();
    return this.isMicMuted;
  }

  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    this.audioElements.forEach((audioEl) => {
      audioEl.muted = this.isDeafened;
    });
    this.notifyState();
    return this.isDeafened;
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.audioElements.forEach((audioEl) => {
      audioEl.volume = clamped;
    });
  }

  public dispose(): void {
    if (this.vadInterval) clearInterval(this.vadInterval);
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }
    this.peers.forEach((peer) => peer.connection.close());
    this.peers.clear();
    this.audioElements.forEach((el) => {
      el.srcObject = null;
      el.remove();
    });
    this.audioElements.clear();
    this.socket?.emit('voice:leave');
  }
}
