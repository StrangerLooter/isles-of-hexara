'use client';

import React, { useState } from 'react';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface ChatLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isMultiplayer?: boolean;
}

export const ChatLogModal: React.FC<ChatLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  chatMessages,
  onSendMessage,
  isMultiplayer = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'log'>('chat');
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a1010] via-[#1a0c0c] to-[#120808] border-2 border-[#d97706]/70 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.25)] overflow-hidden flex flex-col h-[min(520px,86vh)] max-h-[86vh] my-auto">
        {/* Header with Tabs & Back Button */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3.5 border-b border-[#d97706]/40 bg-[#3a1414]/70">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold text-xs flex items-center gap-1 uppercase transition-colors"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-sm sm:text-base font-black tracking-wider uppercase font-serif pb-0.5 transition-all ${
                  activeTab === 'chat'
                    ? 'text-[#fbbf24] border-b-2 border-[#fbbf24] drop-shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('log')}
                className={`text-sm sm:text-base font-black tracking-wider uppercase font-serif pb-0.5 transition-all ${
                  activeTab === 'log'
                    ? 'text-[#fbbf24] border-b-2 border-[#fbbf24] drop-shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Game Log
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold flex items-center justify-center transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between min-h-0">
          {activeTab === 'chat' ? (
            <div className="space-y-3 flex-1 flex flex-col justify-end min-h-0">
              {!isMultiplayer && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 text-xs italic">
                  [System]: You are currently playing in Offline Solo Mode with AI opponents.
                </div>
              )}
              <div className="space-y-2 overflow-y-auto max-h-[calc(86vh-170px)] sm:max-h-[300px] pr-1">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No messages yet. Send a greeting to the table!
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-lg text-sm ${
                        msg.isSystem
                          ? 'bg-amber-900/30 text-amber-200 border-l-2 border-amber-400'
                          : 'bg-[#220c0c] text-gray-200 border border-amber-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span className="font-bold text-amber-400">{msg.sender}</span>
                        <span className="font-mono text-[10px]">{msg.timestamp}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto max-h-[380px] font-mono text-xs text-gray-300 pr-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-[#1e0808]/70 border border-amber-950/60 hover:bg-[#2a0c0c] transition-colors"
                >
                  <span className="text-amber-500/80 mr-2">›</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Input Bar (visible on chat tab) */}
        {activeTab === 'chat' && (
          <form
            onSubmit={handleSend}
            className="p-4 bg-[#1a0808] border-t border-[#d97706]/30 flex flex-col gap-1.5"
          >
            <div className="flex gap-3">
              <input
                type="text"
                maxLength={120}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Send a dispatch to table..."
                className="flex-1 px-4 py-2.5 bg-[#0e0404] border border-[#d97706]/40 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm shadow-inner"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-xl border border-amber-400 shadow-md transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                Send
              </button>
            </div>
            <div className="flex justify-end pr-1">
              <span className={`text-[10px] font-mono ${inputVal.length >= 110 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                {inputVal.length}/120
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
