'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';

export const RotateOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if portrait mode on mobile/tablet (height > width and width < 900)
      if (typeof window !== 'undefined') {
        const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 900;
        setIsPortrait(portrait);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-fantasy-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        title="Dismiss overlay"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="animate-bounce mb-6">
        <Smartphone className="w-16 h-16 text-fantasy-gold transform rotate-90" />
      </div>
      <h2 className="text-2xl font-bold text-amber-400 mb-2">Rotate to Landscape</h2>
      <p className="text-sm text-slate-300 max-w-xs leading-relaxed mb-6">
        Isles of Hexara is built landscape-first for the most immersive board game experience.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-colors shadow-lg"
      >
        Continue in Current Orientation
      </button>
    </div>
  );
};
