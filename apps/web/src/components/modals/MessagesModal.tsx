import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { Radio, Search, Send } from 'lucide-react';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFriends?: () => void;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  onOpenFriends,
}) => {
  const [activeChannel, setActiveChannel] = useState<'news' | 'direct'>('news');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-fade-in">
      <HeaderBar title="MESSAGES" onBack={onClose} onHome={onClose} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 h-[72vh]">
          {/* Left Column: Channels & Search */}
          <div className="md:col-span-4 catan-card-dark rounded-xl p-4 flex flex-col space-y-3 border-2 border-amber-500/80 shadow-2xl">
            {/* Server News Pill */}
            <button
              onClick={() => setActiveChannel('news')}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                activeChannel === 'news'
                  ? 'bg-gradient-to-r from-amber-900/60 to-amber-700/40 border-amber-400'
                  : 'bg-black/30 border-amber-600/30 hover:bg-black/50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-amber-200">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Server News</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </button>

            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 font-semibold text-xs outline-none border border-amber-600/60 focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>

            <div className="flex-1 overflow-y-auto py-2 text-center text-amber-200/50 text-xs">
              <span className="text-[11px]">Direct messages will appear here.</span>
            </div>
          </div>

          {/* Right Column: Chat Stream & Message Input */}
          <div className="md:col-span-8 catan-card-dark rounded-xl p-5 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            {/* Conversation Feed */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {activeChannel === 'news' ? (
                <div className="space-y-3 max-w-md text-left bg-black/30 p-4 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">Announcement</span>
                    <span className="text-[10px] text-slate-400">Today, 22:30</span>
                  </div>
                  <h4 className="text-sm font-bold text-amber-300">Archipelago Season 1 is Live!</h4>
                  <p className="text-xs text-amber-100/80 leading-relaxed">
                    Welcome to the Isles of Hexara! Harvest raw resources, barter with fellow voyagers, lay tactical roads, and construct grand cities.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-amber-200/80 font-medium">
                    Once you add your friends, you can message them here.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFriends?.();
                    }}
                    className="px-6 py-2.5 rounded-xl catan-pill-btn font-bold text-xs uppercase tracking-wider hover:border-amber-400 inline-flex items-center gap-2"
                  >
                    <span>Search For Players</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Message Composer */}
            <div className="pt-3 border-t border-amber-500/20 flex items-center gap-2">
              <input
                type="text"
                placeholder="Message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && messageText.trim()) {
                    alert(`Message sent: ${messageText}`);
                    setMessageText('');
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 font-medium text-xs outline-none border border-amber-600/60 focus:border-amber-400"
              />
              <button
                onClick={() => {
                  if (messageText.trim()) {
                    alert(`Message sent: ${messageText}`);
                    setMessageText('');
                  }
                }}
                className="w-10 h-9 rounded-lg catan-btn-gold flex items-center justify-center text-slate-950 font-bold"
                title="Send Message"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
