import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { User, MessageSquare, Ban, Search } from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMessages?: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onOpenMessages,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'block'>('profile');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-fade-in">
      <HeaderBar title="FRIENDS" onBack={onClose} onHome={onClose} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 h-[72vh]">
          {/* Left Column: Friends Controls */}
          <div className="md:col-span-4 catan-card-dark rounded-xl p-4 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'profile' ? 'catan-btn-gold' : 'catan-pill-btn'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Show Player Profile</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenMessages?.();
                }}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'messages' ? 'catan-btn-gold' : 'catan-pill-btn'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('block')}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'block' ? 'catan-btn-gold' : 'catan-pill-btn text-red-300'
              }`}
            >
              <Ban className="w-4 h-4 text-red-400" />
              <span>Block List</span>
            </button>
          </div>

          {/* Right Column: Search & Friends List */}
          <div className="md:col-span-8 catan-card-dark rounded-xl p-5 flex flex-col justify-between border-2 border-amber-500/80 shadow-2xl">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 font-semibold text-sm outline-none border-2 border-amber-600/60 focus:border-amber-400"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>

              {/* Friends Feed */}
              <div className="py-8 text-center text-amber-200/60 text-xs">
                <p className="font-semibold">No active voyages found in your contacts.</p>
                <p className="mt-1 text-[11px] opacity-75">Connect with voyagers to sail together.</p>
              </div>
            </div>

            {/* Bottom Action: Search For Players */}
            <button
              onClick={() => alert('Searching for voyagers across the archipelago...')}
              className="w-full py-3 rounded-xl catan-pill-btn font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:border-amber-400"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Search For Players</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
