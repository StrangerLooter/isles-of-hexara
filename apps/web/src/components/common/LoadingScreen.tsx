'use client';

import React, { useState, useEffect } from 'react';
import { Compass, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Preparing the Isles...');
  const [loadError, setLoadError] = useState<string | null>(null);

  const startLoading = () => {
    setLoadError(null);
    setProgress(20);
    setStatusText('Charting the archipelago waters...');

    // Asynchronously pre-cache core assets
    const assetsToPreload = ['/lobby-bg.jpg'];
    let loadedCount = 0;

    const checkDone = () => {
      loadedCount++;
      const pct = Math.floor(20 + (loadedCount / (assetsToPreload.length + 1)) * 75);
      setProgress(pct);

      if (loadedCount >= assetsToPreload.length) {
        setStatusText('Anchoring at Hexara Port...');
        setProgress(100);
        setTimeout(() => {
          onLoaded();
        }, 350);
      }
    };

    assetsToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = checkDone;
      img.onerror = () => {
        // Continue even if an optional image fails
        checkDone();
      };
    });

    // Also check backend health without blocking if offline
    fetch('http://localhost:3001/health', { signal: AbortSignal.timeout(1500) })
      .catch(() => {})
      .finally(() => {
        // Health check recorded
      });
  };

  useEffect(() => {
    startLoading();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black select-none overflow-hidden">
      {/* Cinematic Panoramic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-60 scale-105 transition-all duration-1000 animate-in fade-in"
        style={{ backgroundImage: "url('/lobby-bg.jpg')" }}
      />
      {/* Rich Golden & Burgundy Contrast Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />

      {/* Center Branding & Progress */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Animated Compass Crest */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 clip-hex bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 p-[3px] flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            <div className="w-full h-full clip-hex bg-[#1a0c06] flex items-center justify-center">
              <Compass className="w-14 h-14 text-amber-400 animate-spin-slow" />
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#24130b] border border-amber-500/60 px-3 py-0.5 rounded-full shadow-lg">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">HEXARA</span>
          </div>
        </div>

        {/* Title Logo */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-serif">
          Isles of Hexara
        </h1>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] text-amber-300/80 mt-2">
          Build &bull; Trade &bull; Conquer
        </p>

        {/* Progress or Error Container */}
        {loadError ? (
          <div className="mt-8 flex flex-col items-center gap-3 p-4 rounded-2xl bg-red-950/80 border border-red-500/80 text-red-200 w-full animate-in fade-in">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-xs font-bold">{loadError}</p>
            <button
              onClick={startLoading}
              className="catan-btn-gold px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 mt-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="mt-10 w-full flex flex-col items-center gap-3">
            {/* Loading Bar */}
            <div className="w-full h-2.5 rounded-full bg-black/80 border border-amber-500/40 p-[2px] overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-200 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status caption */}
            <div className="flex items-center justify-between w-full px-1 text-[11px] font-bold text-amber-200/80 font-mono">
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright / version */}
      <footer className="absolute bottom-6 text-[10px] uppercase font-mono tracking-widest text-amber-200/40">
        Maritime Strategy Tabletop &bull; Authoritative Engine
      </footer>
    </div>
  );
};
