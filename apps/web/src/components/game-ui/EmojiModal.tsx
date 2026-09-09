'use client';

import React from 'react';

export interface EmojiReaction {
  id: string;
  label: string;
  emoji: string;
  svgIcon?: string;
  bgHexColor: string;
}

export const EMOJI_REACTIONS: EmojiReaction[] = [
  { id: 'angry', label: 'Angry', emoji: '😡', bgHexColor: '#ea580c' },
  { id: 'cool', label: 'Cool', emoji: '😎', bgHexColor: '#f59e0b' },
  { id: 'shrug', label: 'Shrug', emoji: '🤷', bgHexColor: '#d97706' },
  { id: 'clap', label: 'Clap', emoji: '👏', bgHexColor: '#d97706' },
  { id: 'think', label: 'Thinking', emoji: '🤔', bgHexColor: '#f59e0b' },
  { id: 'laugh', label: 'Laugh', emoji: '😄', bgHexColor: '#eab308' },
  { id: 'heart', label: 'Love', emoji: '😍', bgHexColor: '#ec4899' },
  { id: 'thumbs_down', label: 'Dislike', emoji: '👎', bgHexColor: '#ef4444' },
  { id: 'thumbs_up', label: 'Like', emoji: '👍', bgHexColor: '#10b981' },
  { id: 'coffee', label: 'Sip', emoji: '☕', bgHexColor: '#b45309' },
  { id: 'smirk', label: 'Smirk', emoji: '😏', bgHexColor: '#f59e0b' },
  { id: 'wink', label: 'Wink', emoji: '😉', bgHexColor: '#eab308' },
];

interface EmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: EmojiReaction) => void;
}

export const EmojiModal: React.FC<EmojiModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a1010] via-[#1a0c0c] to-[#120808] border-2 border-[#d97706]/70 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.25)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d97706]/40 bg-[#3a1414]/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">😀</span>
            <h2 className="text-2xl font-black tracking-wider text-[#fbbf24] uppercase font-serif drop-shadow-md">
              Emoji Reactions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 12 Hexagon Emoji Grid */}
        <div className="p-8 grid grid-cols-4 gap-6 place-items-center">
          {EMOJI_REACTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectEmoji(item);
                onClose();
              }}
              className="group relative flex flex-col items-center justify-center p-2 transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none"
            >
              {/* Hexagonal Background Shape */}
              <div
                className="w-20 h-20 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: `linear-gradient(135deg, ${item.bgHexColor} 0%, #b45309 100%)`,
                  border: '2px solid rgba(254, 240, 138, 0.4)',
                }}
              >
                <span className="text-3xl select-none filter drop-shadow-md transition-transform duration-200 group-hover:scale-125">
                  {item.emoji}
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-200/90 mt-2 tracking-wide uppercase font-serif group-hover:text-amber-300">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#1a0808] border-t border-[#d97706]/30 flex justify-between items-center text-xs text-gray-400">
          <span>Click any reaction to express yourself on the tabletop</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#d97706]/20 hover:bg-[#d97706]/40 text-amber-300 font-bold rounded-lg border border-amber-500/40 transition-all text-xs uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
