/**
 * Isles of Hexara — Procedural Web Audio Synthesizer
 * Provides crisp, lag-free maritime sound effects and ambient soundscape
 * without external audio asset downloads or autoplay restriction crashes.
 */

class SoundManagerService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isInitialized = false;

  private masterVol = 0.8;
  private sfxVol = 0.85;
  private musicVol = 0.6;
  private isMuted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMaster = localStorage.getItem('hexara_vol_master');
      const savedSfx = localStorage.getItem('hexara_vol_sfx');
      const savedMusic = localStorage.getItem('hexara_vol_music');
      const savedMute = localStorage.getItem('hexara_vol_muted');

      if (savedMaster !== null) this.masterVol = Number(savedMaster);
      if (savedSfx !== null) this.sfxVol = Number(savedSfx);
      if (savedMusic !== null) this.musicVol = Number(savedMusic);
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);

      this.applyVolumes();
      this.isInitialized = true;
    } catch {
      // Audio context may not be supported or allowed yet
    }
  }

  public userInteracted() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVol = Math.max(0, Math.min(1, vol));
    localStorage.setItem('hexara_vol_master', String(this.masterVol));
    this.applyVolumes();
  }

  public setSfxVolume(vol: number) {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    localStorage.setItem('hexara_vol_sfx', String(this.sfxVol));
    this.applyVolumes();
  }

  public setMusicVolume(vol: number) {
    this.musicVol = Math.max(0, Math.min(1, vol));
    localStorage.setItem('hexara_vol_music', String(this.musicVol));
    this.applyVolumes();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('hexara_vol_muted', String(muted));
    this.applyVolumes();
  }

  public getSettings() {
    return {
      master: this.masterVol,
      sfx: this.sfxVol,
      music: this.musicVol,
      muted: this.isMuted,
    };
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const effectiveMaster = this.isMuted ? 0 : this.masterVol;
    this.masterGain.gain.setValueAtTime(effectiveMaster, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVol, now);
    this.musicGain.gain.setValueAtTime(this.musicVol * 0.35, now);
  }

  // --- Sound Effects ---

  public playClick() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  public playHover() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  public playDiceRoll() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Quick rattling sound bursts
      for (let i = 0; i < 5; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.06;

        osc.type = 'square';
        osc.frequency.setValueAtTime(160 + Math.random() * 180, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.04);
      }

      // Settling clack
      const clackOsc = this.ctx.createOscillator();
      const clackGain = this.ctx.createGain();
      const settleTime = now + 0.35;
      clackOsc.type = 'triangle';
      clackOsc.frequency.setValueAtTime(240, settleTime);
      clackOsc.frequency.exponentialRampToValueAtTime(110, settleTime + 0.08);

      clackGain.gain.setValueAtTime(0.35, settleTime);
      clackGain.gain.exponentialRampToValueAtTime(0.001, settleTime + 0.08);

      clackOsc.connect(clackGain);
      clackGain.connect(this.sfxGain);

      clackOsc.start(settleTime);
      clackOsc.stop(settleTime + 0.08);
    } catch {}
  }

  public playBuild() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Hammer / Wood placement chord: Low thud + bright wooden chime
      const freqs = [180, 270, 540];
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.22);

        gain.gain.setValueAtTime(0.25 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch {}
  }

  public playPlacement() {
    this.playBuild();
  }

  public playDevCard() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Magical mystical shimmer
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch {}
  }

  public playTurnChime() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Ship's bell chime (E5 and B5)
      [659.25, 987.77].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.5);
      });
    } catch {}
  }

  public playVictory() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Fanfare arpeggio: C4, G4, C5, E5, G5
      const fanfare = [261.63, 392.0, 523.25, 659.25, 783.99];
      fanfare.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.6);
      });
    } catch {}
  }

  public playError() {
    this.userInteracted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }
}

export const soundManager = new SoundManagerService();
