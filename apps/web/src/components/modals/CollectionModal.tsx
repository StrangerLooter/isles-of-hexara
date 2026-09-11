'use client';

import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Coins, Scroll, Check, Lock, Palette, Dices, Shield, Layers } from 'lucide-react';
import { HeaderBar } from './HeaderBar';
import { soundManager } from '../../game/SoundManager';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins?: number;
  scrolls?: number;
}

const SKINS = [
  { id: 'classic', name: 'Original Isle Terrains', type: 'Hex Board', badge: 'Default', unlocked: true, icon: '🏝️' },
  { id: 'autumn', name: 'Autumn Gold Archipelago', type: 'Hex Board', badge: '500 Coins', unlocked: true, icon: '🍁' },
  { id: 'celestial', name: 'Celestial Star Map', type: 'Hex Board', badge: '1000 Coins', unlocked: false, icon: '✨' },
  { id: 'bone_dice', name: 'Carved Bone Dice', type: 'Dice Set', badge: 'Default', unlocked: true, icon: '🎲' },
  { id: 'obsidian_dice', name: 'Obsidian & Gold Dice', type: 'Dice Set', badge: '750 Coins', unlocked: false, icon: '💎' },
  { id: 'phoenix_dice', name: 'Phoenix Fire Dice', type: 'Dice Set', badge: '1200 Coins', unlocked: false, icon: '🔥' },
];

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  coins = 1250,
  scrolls = 18,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'board' | 'dice'>('all');
  const [activeSkin, setActiveSkin] = useState('classic');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="Cosmetic Bazaar & Collection" onBack={onClose} onHome={onClose} coins={coins} scrolls={scrolls} />

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full flex flex-col gap-6 custom-scrollbar">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-amber-500/30 pb-3">
          <button
            onClick={() => { soundManager.playClick(); setSelectedCategory('all'); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'all'
                ? 'catan-btn-gold'
                : 'bg-black/40 text-amber-200/60 hover:text-white border border-amber-600/30'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => { soundManager.playClick(); setSelectedCategory('board'); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'board'
                ? 'catan-btn-gold'
                : 'bg-black/40 text-amber-200/60 hover:text-white border border-amber-600/30'
            }`}
          >
            Hex Terrain Skins
          </button>
          <button
            onClick={() => { soundManager.playClick(); setSelectedCategory('dice'); }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'dice'
                ? 'catan-btn-gold'
                : 'bg-black/40 text-amber-200/60 hover:text-white border border-amber-600/30'
            }`}
          >
            Dice Sets
          </button>
        </div>

        {/* Cosmetics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SKINS.filter((s) => {
            if (selectedCategory === 'board') return s.type === 'Hex Board';
            if (selectedCategory === 'dice') return s.type === 'Dice Set';
            return true;
          }).map((skin) => (
            <div
              key={skin.id}
              className="catan-card-dark rounded-2xl p-5 border-2 border-amber-500/60 shadow-xl flex flex-col justify-between relative group hover:border-amber-400 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{skin.icon}</span>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {skin.type}
                  </span>
                </div>
                <h4 className="text-sm font-black text-amber-100">{skin.name}</h4>
                <p className="text-[11px] text-amber-200/60 mt-1 font-mono">{skin.badge}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-600/20">
                {skin.unlocked ? (
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setActiveSkin(skin.id);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      activeSkin === skin.id
                        ? 'bg-emerald-800 border border-emerald-400 text-white'
                        : 'bg-black/50 border border-amber-600/50 text-amber-200 hover:bg-amber-800/40'
                    }`}
                  >
                    {activeSkin === skin.id ? <Check className="w-4 h-4" /> : null}
                    <span>{activeSkin === skin.id ? 'Equipped' : 'Equip Skin'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      alert(`Unlock ${skin.name} using ${skin.badge}!`);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-black/60 border border-stone-700 text-stone-400 flex items-center justify-center gap-1.5 hover:border-amber-500 hover:text-amber-200"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock ({skin.badge})</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
