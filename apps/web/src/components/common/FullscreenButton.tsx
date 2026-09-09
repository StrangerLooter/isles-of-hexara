'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenButtonProps {
  className?: string;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ className = '' }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkSupport = () => {
      const doc = document as any;
      return !!(
        doc.fullscreenEnabled ||
        doc.webkitFullscreenEnabled ||
        doc.mozFullScreenEnabled ||
        doc.msFullscreenEnabled
      );
    };

    setIsSupported(checkSupport());

    const handleFullscreenChange = () => {
      const doc = document as any;
      const fullscreenElem =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;
      setIsFullscreen(!!fullscreenElem);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;

      if (!isFullscreen) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={toggleFullscreen}
      className={`w-9 h-9 md:w-10 md:h-10 rounded-xl border-2 border-amber-400/80 bg-gradient-to-b from-[#451a03] to-[#200c02] text-amber-300 shadow-xl flex items-center justify-center hover:border-amber-300 hover:text-amber-100 hover:scale-105 active:scale-95 transition-all ${className}`}
      title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen App Mode'}
      aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
    >
      {isFullscreen ? (
        <Minimize2 className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
      ) : (
        <Maximize2 className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
      )}
    </button>
  );
};
