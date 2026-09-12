'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ScrollText, MessageSquare } from 'lucide-react';
import { ChatMessage } from './ChatLogModal';
import { soundManager } from '../../game/SoundManager';

interface RightSidebarWidgetProps {
  logs: string[];
  chatMessages: ChatMessage[];
  onSendMessage?: (text: string) => void;
  className?: string;
}

export const RightSidebarWidget: React.FC<RightSidebarWidgetProps> = ({
  logs,
  chatMessages,
  onSendMessage,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'chat'>('log');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, chatMessages, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    soundManager.playClick();
    onSendMessage?.(inputText.trim());
    setInputText('');
  };

  const getLogIcon = (log: string) => {
    const l = log.toLowerCase();
    if (l.includes('roll') || l.includes('dice')) return <span className="text-sm">🎲</span>;
    if (l.includes('road')) return <span className="text-sm">🪵</span>;
    if (l.includes('settlement')) return <span className="text-sm">🏠</span>;
    if (l.includes('city')) return <span className="text-sm">🏰</span>;
    if (l.includes('trade')) return <span className="text-sm">🏛️</span>;
    if (l.includes('card') || l.includes('dev')) return <span className="text-sm">🎴</span>;
    if (l.includes('turn')) return <span className="text-sm">⏱️</span>;
    if (l.includes('robber')) return <span className="text-sm">🔴</span>;
    return <span className="text-sm">📜</span>;
  };

  return (
    <div
      className={`pointer-events-auto w-72 xl:w-80 h-[480px] xl:h-[520px] rounded-2xl bg-gradient-to-b from-[#24130c]/95 via-[#180b06]/95 to-[#0d0603]/95 border-2 border-amber-600/50 shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* Header Tabs */}
      <div className="p-2 border-b border-amber-900/40 bg-black/40 flex gap-2">
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setActiveTab('log');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'log'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md border border-amber-300'
              : 'text-amber-300/60 hover:text-amber-100 hover:bg-black/30'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Game Log</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setActiveTab('chat');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-md border border-amber-300'
              : 'text-amber-300/60 hover:text-amber-100 hover:bg-black/30'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {chatMessages.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar text-xs">
        {activeTab === 'log' ? (
          logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-500 font-serif italic text-center px-4">
              Match commenced. Awaiting first turn actions...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-black/30 border border-amber-900/30 hover:border-amber-600/40 transition-colors animate-in fade-in"
              >
                <div className="shrink-0 mt-0.5">{getLogIcon(log)}</div>
                <div className="flex-1 text-stone-200 leading-snug font-serif font-medium text-[11px] xl:text-xs">
                  {log}
                </div>
              </div>
            ))
          )
        ) : chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-stone-500 font-serif italic text-center px-4">
            No messages yet. Send a dispatch to your crew!
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-xl border ${
                msg.isSystem
                  ? 'bg-amber-950/40 border-amber-700/40 text-amber-200 text-center text-[10px]'
                  : 'bg-black/40 border-amber-900/40 text-stone-200 text-[11px]'
              }`}
            >
              {!msg.isSystem && (
                <div className="flex items-center justify-between font-bold text-amber-300 mb-0.5 text-[10px]">
                  <span>{msg.sender}</span>
                  <span className="text-stone-500 font-mono text-[9px]">{msg.timestamp}</span>
                </div>
              )}
              <div className="leading-snug">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <form onSubmit={handleSend} className="p-2 border-t border-amber-900/40 bg-black/50 flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            maxLength={120}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a dispatch..."
            className="flex-1 bg-black/70 border border-amber-600/40 rounded-xl px-3 py-1.5 text-xs text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 font-serif"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 shadow-md border border-amber-400 active:scale-95 transition-all"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
        {inputText.length > 0 && (
          <div className="flex justify-end pr-1">
            <span className={`text-[9px] font-mono ${inputText.length >= 110 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
              {inputText.length}/120
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
