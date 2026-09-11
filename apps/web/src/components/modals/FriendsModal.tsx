'use client';

import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { User, MessageSquare, Ban, Search, Copy, CheckCircle2, UserPlus, Sparkles } from 'lucide-react';
import { soundManager } from '../../game/SoundManager';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMessages?: () => void;
}

const DEFAULT_FRIENDS = [
  { id: 'f1', name: 'Admiral Vane', avatar: '🌊', status: 'Online in Match', inGame: true },
  { id: 'f2', name: 'Lady Eleanor', avatar: '👑', status: 'Online in Port', inGame: false },
  { id: 'f3', name: 'Master Eldon', avatar: '🧙', status: 'Last seen 2h ago', inGame: false },
];

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onOpenMessages,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'invite' | 'block'>('friends');
  const [friendsList, setFriendsList] = useState(DEFAULT_FRIENDS);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchedNotice, setSearchedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = friendsList.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyInvite = () => {
    soundManager.playClick();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/#/`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSearch = () => {
    soundManager.playClick();
    if (!searchQuery.trim()) {
      setSearchedNotice('Enter a voyager name to search the archipelago.');
    } else {
      setSearchedNotice(`Searching for "${searchQuery.trim()}" across maritime ports...`);
    }
    setTimeout(() => setSearchedNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="Crew Contacts & Friends" onBack={onClose} onHome={onClose} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 h-[72vh]">
          {/* Left Column: Friends Controls */}
          <div className="md:col-span-4 catan-card-dark rounded-2xl p-4 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="space-y-3">
              <button
                onClick={() => { soundManager.playClick(); setActiveTab('friends'); }}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'friends' ? 'catan-btn-gold' : 'catan-pill-btn'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Crew Roster ({friendsList.length})</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onOpenMessages?.();
                }}
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider catan-pill-btn"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Messages</span>
              </button>

              <button
                onClick={handleCopyInvite}
                className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider catan-pill-btn text-amber-200"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copiedLink ? 'Copied Link!' : 'Invite Link'}</span>
              </button>
            </div>

            <button
              onClick={() => { soundManager.playClick(); setActiveTab('block'); }}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'block' ? 'catan-btn-gold' : 'catan-pill-btn text-red-300'
              }`}
            >
              <Ban className="w-4 h-4 text-red-400" />
              <span>Blocked Voyagers (0)</span>
            </button>
          </div>

          {/* Right Column: Search & Friends List */}
          <div className="md:col-span-8 catan-card-dark rounded-2xl p-5 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative w-full flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search voyagers by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 text-amber-100 placeholder:text-stone-500 font-semibold text-sm outline-none border-2 border-amber-600/60 focus:border-amber-400"
                  />
                  <Search className="w-4 h-4 text-amber-400 absolute right-3 top-3.5" />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 rounded-xl catan-btn-gold text-xs font-black uppercase"
                >
                  Search
                </button>
              </div>

              {searchedNotice && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs text-center">
                  {searchedNotice}
                </div>
              )}

              {/* Friends Feed */}
              <div className="space-y-2 max-h-[45vh] overflow-y-auto custom-scrollbar">
                {filtered.length > 0 ? (
                  filtered.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-3 rounded-xl bg-black/40 border border-amber-600/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1.5 rounded-lg bg-black/50 border border-amber-600/40">
                          {friend.avatar}
                        </span>
                        <div>
                          <span className="text-xs font-black text-amber-100 block">{friend.name}</span>
                          <span className="text-[10px] text-amber-300/70">{friend.status}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onClose();
                          onOpenMessages?.();
                        }}
                        className="px-3 py-1 rounded-lg bg-[#2b170c] border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold"
                      >
                        Message
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-amber-200/60 text-xs">
                    <p className="font-semibold">No voyagers match your search query.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCopyInvite}
              className="w-full py-3 rounded-xl catan-btn-gold font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Share Voyage Invitation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
