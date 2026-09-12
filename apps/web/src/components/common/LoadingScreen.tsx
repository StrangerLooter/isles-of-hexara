'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Compass, RefreshCw, AlertCircle, Sparkles, Anchor, Waves } from 'lucide-react';
import { SERVER_URL } from '../../lib/serverUrl';
import { LoadingMessageDeck, LoadingMessage } from '../../data/loadingMessages';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Charting the archipelago waters...');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Centralized rotating message deck
  const messageDeckRef = useRef<LoadingMessageDeck | null>(null);
  if (!messageDeckRef.current) {
    messageDeckRef.current = new LoadingMessageDeck();
  }

  const [currentMessage, setCurrentMessage] = useState<LoadingMessage>(() =>
    messageDeckRef.current!.getNext()
  );
  const [isFading, setIsFading] = useState(false);

  // Rotate quotes every 2.8 seconds with smooth crossfade
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        if (messageDeckRef.current) {
          setCurrentMessage(messageDeckRef.current.getNext());
        }
        setIsFading(false);
      }, 350); // fade transition midpoint
    }, 2800);

    return () => clearInterval(quoteInterval);
  }, []);

  const startLoading = async () => {
    setLoadError(null);
    setProgress(20);
    setStatusText('Charting the archipelago waters...');

    const startTime = Date.now();

    try {
      // Step 1: Preload core image assets
      const assetsToPreload = ['/lobby-bg.jpg'];
      await Promise.all(
        assetsToPreload.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = src;
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Non-fatal
            })
        )
      );

      setProgress(50);
      setStatusText('Scanning harbor beacon (Server health check)...');

      // Step 2: Non-blocking backend health check with 1.8s timeout
      try {
        await fetch(`${SERVER_URL}/health`, {
          signal: AbortSignal.timeout ? AbortSignal.timeout(1800) : undefined,
        });
      } catch {
        // Continue even if backend is starting up or in solo offline mode
      }

      setProgress(80);
      setStatusText('Preparing tabletop hex grid & nautical charts...');

      // Step 3: Brief visual stability minimum (so fast connections do not flicker jarred)
      const elapsed = Date.now() - startTime;
      const minDisplayTimeMs = 1200;
      if (elapsed < minDisplayTimeMs) {
        await new Promise((r) => setTimeout(r, minDisplayTimeMs - elapsed));
      }

      setProgress(100);
      setStatusText('Anchoring at Hexara Port...');

      setTimeout(() => {
        onLoaded();
      }, 400);
    } catch (err: any) {
      setLoadError('Failed to prepare voyage charts. Click retry or proceed offline.');
    }
  };

  useEffect(() => {
    startLoading();
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#080402] select-none overflow-hidden"
    >
      {/* Cinematic Panoramic Background with slow subtle zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-60 scale-105 transition-transform duration-[12000ms] ease-out pointer-events-none"
        style={{ backgroundImage: "url('/lobby-bg.jpg')" }}
      />

      {/* Atmospheric Nautical Vignettes & Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-black/95 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_25%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />

      {/* Top Nautical Header Accent */}
      <header className="relative z-10 pt-8 flex items-center gap-2 text-amber-300/60 text-[11px] font-mono uppercase tracking-[0.3em]">
        <Anchor className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>ARCHIPELAGO EXPEDITION &bull; COORD 14°N 42°W</span>
      </header>

      {/* Center Branding & Progress */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6 text-center my-auto">
        {/* Animated Compass Crest */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 clip-hex bg-gradient-to-b from-amber-300 via-amber-600 to-amber-950 p-[3px] flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.55)]">
            <div className="w-full h-full clip-hex bg-[#1a0c06] flex items-center justify-center">
              <Compass className="w-14 h-14 text-amber-400 animate-spin-slow" />
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#24130b] border border-amber-500/70 px-3.5 py-0.5 rounded-full shadow-xl">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
              HEXARA
            </span>
          </div>
        </div>

        {/* Title Logo */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] font-serif">
          Isles of Hexara
        </h1>
        <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.35em] text-amber-300/80 mt-2 flex items-center gap-2">
          <span>Build</span> &bull; <span>Trade</span> &bull; <span>Conquer</span>
        </p>

        {/* Progress Bar & Status */}
        {loadError ? (
          <div className="mt-8 flex flex-col items-center gap-3 p-4 rounded-2xl bg-red-950/80 border border-red-500/80 text-red-200 w-full animate-in fade-in">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-xs font-bold">{loadError}</p>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={startLoading}
                className="catan-btn-gold px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
              <button
                onClick={onLoaded}
                className="px-5 py-2 rounded-xl bg-black/60 border border-amber-600/60 text-amber-200 hover:text-white text-xs font-black uppercase tracking-wider"
              >
                Continue Offline
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 w-full flex flex-col items-center gap-3">
            {/* Loading Bar with Glow */}
            <div className="w-full h-3 rounded-full bg-black/90 border border-amber-500/50 p-[2px] overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 transition-all duration-300 shadow-[0_0_18px_rgba(245,158,11,0.9)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status caption & Percentage */}
            <div className="flex items-center justify-between w-full px-1 text-[11px] font-bold text-amber-200/90 font-mono">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                {statusText}
              </span>
              <span className="text-amber-300">{progress}%</span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROTATING QUOTES, LORE, STRATEGY & FACTS CONTAINER */}
        {/* ============================================================ */}
        <div className="mt-8 min-h-[90px] w-full max-w-md px-4 py-3 rounded-2xl bg-black/60 border border-amber-600/30 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center text-center transition-all duration-300">
          {/* Category Badge */}
          <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[9px] font-black uppercase tracking-widest text-amber-300">
            <span>{currentMessage.categoryLabel}</span>
            {currentMessage.isFictional ? (
              <span className="text-[8px] opacity-70 border-l border-amber-500/30 pl-1.5">
                ARCHIPELAGO LORE
              </span>
            ) : null}
          </div>

          {/* Message Text with smooth cross-fade */}
          <p
            className={`text-xs sm:text-sm font-serif italic text-amber-100/90 leading-relaxed transition-opacity duration-300 ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            &ldquo;{currentMessage.text}&rdquo;
          </p>
        </div>
      </div>

      {/* Footer copyright / version */}
      <footer className="relative z-10 pb-6 text-[10px] uppercase font-mono tracking-widest text-amber-200/50 flex items-center gap-3">
        <span>Maritime Strategy Tabletop</span>
        <span>&bull;</span>
        <span>Server-Authoritative Engine</span>
      </footer>
    </div>
  );
};
