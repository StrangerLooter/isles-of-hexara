'use client';

import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { Radio, Search, Send, MessageSquare, Check, User } from 'lucide-react';
import { soundManager } from '../../game/SoundManager';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFriends?: () => void;
}

interface MessageItem {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe?: boolean;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  onOpenFriends,
}) => {
  const [activeChannel, setActiveChannel] = useState<'news' | 'direct'>('news');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [directMessages, setDirectMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      sender: 'Lady Eleanor',
      text: 'Greetings Captain! Will you be sailing in the evening match?',
      time: '14:15',
      isMe: false,
    },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    soundManager.playClick();
    const newMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      sender: 'You',
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setDirectMessages((prev) => [...prev, newMsg]);
    setMessageText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="Voyage Dispatches & Messages" onBack={onClose} onHome={onClose} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 h-[72vh]">
          {/* Left Column: Channels & Search */}
          <div className="md:col-span-4 catan-card-dark rounded-2xl p-4 flex flex-col space-y-3 border-2 border-amber-500/80 shadow-2xl">
            {/* Server News Channel */}
            <button
              onClick={() => { soundManager.playClick(); setActiveChannel('news'); }}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                activeChannel === 'news'
                  ? 'bg-gradient-to-r from-amber-900/60 to-amber-700/40 border-amber-400'
                  : 'bg-black/30 border-amber-600/30 hover:bg-black/50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-amber-200">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Archipelago Gazette</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </button>

            {/* Direct Messages Channel */}
            <button
              onClick={() => { soundManager.playClick(); setActiveChannel('direct'); }}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                activeChannel === 'direct'
                  ? 'bg-gradient-to-r from-amber-900/60 to-amber-700/40 border-amber-400'
                  : 'bg-black/30 border-amber-600/30 hover:bg-black/50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-amber-200">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Direct Dispatches</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                {directMessages.length}
              </span>
            </button>

            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 text-amber-100 placeholder:text-stone-500 font-semibold text-xs outline-none border border-amber-600/60 focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-2.5" />
            </div>

            <div className="flex-1 overflow-y-auto py-2 text-center text-amber-200/50 text-xs custom-scrollbar">
              <span className="text-[11px]">Direct messages from contacts will appear here.</span>
            </div>
          </div>

          {/* Right Column: Chat Stream & Message Input */}
          <div className="md:col-span-8 catan-card-dark rounded-2xl p-5 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            {/* Conversation Feed */}
            <div className="flex-1 flex flex-col justify-start overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {activeChannel === 'news' ? (
                <div className="space-y-4 max-w-xl mx-auto text-left">
                  <div className="bg-black/40 p-4 rounded-2xl border border-amber-500/30 shadow-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                        Announcement
                      </span>
                      <span className="text-[10px] text-amber-300/60 font-mono">Today</span>
                    </div>
                    <h4 className="text-sm font-black text-amber-200 font-serif">
                      Archipelago Season 1 is Live!
                    </h4>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      Welcome to the Isles of Hexara! Harvest resources, barter with fellow voyagers, lay tactical roads, and construct grand settlements across the 19-hex board.
                    </p>
                  </div>

                  <div className="bg-black/40 p-4 rounded-2xl border border-amber-500/30 shadow-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                        Gameplay Tip
                      </span>
                      <span className="text-[10px] text-amber-300/60 font-mono">Yesterday</span>
                    </div>
                    <h4 className="text-sm font-black text-amber-200 font-serif">
                      Master the Harbor Trades
                    </h4>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      Control 2:1 and 3:1 harbors to out-trade opponents when mountain ore or fertile grain are scarce.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {directMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-md ${
                        msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black text-amber-300">{msg.sender}</span>
                        <span className="text-[9px] text-amber-400/50 font-mono">{msg.time}</span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs font-medium shadow-md ${
                          msg.isMe
                            ? 'bg-amber-600 text-slate-950 font-bold rounded-tr-none'
                            : 'bg-[#2b170c] text-amber-100 border border-amber-600/40 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Message Composer */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-amber-500/20 flex items-center gap-2">
              <input
                type="text"
                placeholder={activeChannel === 'news' ? 'Gazette is read-only announcement' : 'Compose dispatch...'}
                disabled={activeChannel === 'news'}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 text-amber-100 placeholder:text-stone-500 font-medium text-xs outline-none border border-amber-600/60 focus:border-amber-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={activeChannel === 'news' || !messageText.trim()}
                className="px-5 py-2.5 rounded-xl catan-btn-gold flex items-center justify-center text-slate-950 font-bold gap-1 text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5 fill-current" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
