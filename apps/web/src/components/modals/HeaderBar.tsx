import React from 'react';
import { ArrowLeft, Home, Coins, Scroll } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  onBack: () => void;
  onHome?: () => void;
  coins?: number;
  scrolls?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onBack,
  onHome,
  coins = 0,
  scrolls = 0,
}) => {
  return (
    <div className="relative z-20 flex items-center justify-between w-full px-4 py-3 bg-gradient-to-b from-black/60 to-black/20 border-b border-amber-500/20">
      {/* Left: Back Button */}
      <button
        onClick={onBack}
        className="w-10 h-8 rounded-lg bg-gradient-to-b from-[#3d2b1f] to-[#241710] border border-amber-500/80 flex items-center justify-center text-amber-300 hover:text-white hover:border-amber-400 shadow-md active:scale-95 transition-all"
        title="Back"
      >
        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Center: Title */}
      <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        {title}
      </h2>

      {/* Right: Currency Pills & Home Button */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#241710] border border-amber-600/40 text-xs font-bold text-amber-200 shadow-inner">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span>{scrolls}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#241710] border border-amber-600/40 text-xs font-bold text-amber-200 shadow-inner">
          <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <span>{coins}</span>
        </div>
        <button
          onClick={onHome || onBack}
          className="w-10 h-8 rounded-lg bg-gradient-to-b from-[#3d2b1f] to-[#241710] border border-amber-500/80 flex items-center justify-center text-amber-300 hover:text-white hover:border-amber-400 shadow-md active:scale-95 transition-all"
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
