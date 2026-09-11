'use client';

import React, { useState } from 'react';
import {
  Coins,
  Scroll,
  ArrowLeft,
  Home,
  Check,
  Lock,
  Sparkles,
  ShoppingBag,
  Shield,
  Layers,
  Crown,
  Compass,
  AlertCircle,
  X,
} from 'lucide-react';
import { soundManager } from '../../game/SoundManager';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  scrolls: number;
  onCoinsChange?: (newCoins: number) => void;
  onScrollsChange?: (newScrolls: number) => void;
  onAvatarChange?: (avatar: string) => void;
  currentAvatar?: string;
}

type ShopTab = 'gold' | 'variations' | 'bundles' | 'avatars';

interface CurrencyPackage {
  id: string;
  name: string;
  goldAmount: number;
  bonusAmount?: number;
  priceUsd: string;
  icon: string;
  badge?: string;
  popular?: boolean;
}

interface GameVariation {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  image?: string;
  status: 'owned' | 'locked' | 'coming_soon';
  requiredLevel?: number;
}

interface BundleItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  includes: string[];
  priceUsd: string;
  icon: string;
  isOwned?: boolean;
}

interface AvatarItem {
  id: string;
  name: string;
  title: string;
  avatarIcon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  rarityColor: string;
  priceCoins: number;
  isOwned: boolean;
}

const GOLD_PACKAGES: CurrencyPackage[] = [
  { id: 'gold_tier_1', name: 'Pouch of Gold', goldAmount: 100, priceUsd: '$0.99', icon: '🪙', badge: 'Starter' },
  { id: 'gold_tier_2', name: 'Chest of Gold', goldAmount: 500, bonusAmount: 50, priceUsd: '$4.99', icon: '💰', popular: true, badge: '+10% Bonus' },
  { id: 'gold_tier_3', name: 'Captain’s Vault', goldAmount: 1200, bonusAmount: 200, priceUsd: '$9.99', icon: '💎', badge: '+16% Bonus' },
  { id: 'gold_tier_4', name: 'Emperor’s Treasury', goldAmount: 2500, bonusAmount: 500, priceUsd: '$19.99', icon: '👑', badge: '+20% Best Value' },
];

const GAME_VARIATIONS: GameVariation[] = [
  {
    id: 'first_island',
    title: 'The First Island',
    subtitle: 'Standard Archipelago',
    description: 'The classic 19-hex proving ground with 5 resource biomes, bandit raids, and race to 10 VP.',
    icon: '🏝️',
    status: 'owned',
  },
  {
    id: 'fog_islands',
    title: 'Fog Islands & Seafarers',
    subtitle: 'Unexplored Waters',
    description: 'Venture into the misty sea fog to discover hidden islands, gold rivers, and maritime routes.',
    icon: '🧭',
    status: 'locked',
    requiredLevel: 5,
  },
  {
    id: 'desert_treasures',
    title: 'Desert Treasures & Ruins',
    subtitle: 'Arid Wastes Expansion',
    description: 'Unearth ancient relics and caravan oasis routes across unforgiving desert terrain.',
    icon: '🏺',
    status: 'coming_soon',
  },
  {
    id: 'archipelago_kingdoms',
    title: 'Archipelago Kingdoms',
    subtitle: 'Citadels & Sovereigns',
    description: 'Construct mighty island citadels, recruit knighthood banners, and defend against pirate flotillas.',
    icon: '🏰',
    status: 'coming_soon',
  },
];

const BUNDLE_PACKS: BundleItem[] = [
  {
    id: 'bundle_voyager',
    title: 'Voyager Starter Bundle',
    subtitle: 'Essential Maritime Pack',
    description: 'Everything you need to begin your seafaring dominion with premium style.',
    includes: ['500 Isles Gold', 'Obsidian & Gold Dice Set', 'Kraken Seer Avatar', 'Exclusive Profile Border'],
    priceUsd: '$4.99',
    icon: '📦',
  },
  {
    id: 'bundle_corsair',
    title: 'Corsair Grand Armada',
    subtitle: 'High Seas Pirate Pack',
    description: 'Dominate coastal trade routes with the fiercest cosmetics of the southern archipelago.',
    includes: ['1200 Isles Gold', 'Autumn Gold Board Skin', 'Phoenix Fire Dice Set', 'Pirate Queen Avatar'],
    priceUsd: '$8.99',
    icon: '🏴‍☠️',
  },
  {
    id: 'bundle_celestial',
    title: 'Celestial Emperor Vault',
    subtitle: 'Legendary Sovereign Pack',
    description: 'The ultimate royal vault honoring the master navigators of the Isles of Hexara.',
    includes: ['2500 Isles Gold', 'Celestial Star Map Board', 'Carved Bone Dice', 'Grand Admiral Avatar', '200 Ancient Scrolls'],
    priceUsd: '$16.99',
    icon: '✨',
  },
];

const DEFAULT_AVATARS: AvatarItem[] = [
  { id: 'avatar_amber', name: 'Captain Amber', title: 'Island Pioneer', avatarIcon: '🧙', rarity: 'Common', rarityColor: 'text-stone-300 border-stone-500', priceCoins: 0, isOwned: true },
  { id: 'avatar_william', name: 'William the Bold', title: 'Citadel Knight', avatarIcon: '👑', rarity: 'Rare', rarityColor: 'text-blue-400 border-blue-500', priceCoins: 300, isOwned: true },
  { id: 'avatar_louis', name: 'Louis Navigator', title: 'Maritime Cartographer', avatarIcon: '🧭', rarity: 'Rare', rarityColor: 'text-blue-400 border-blue-500', priceCoins: 400, isOwned: false },
  { id: 'avatar_candamir', name: 'Candamir', title: 'Master Harvester', avatarIcon: '🦙', rarity: 'Rare', rarityColor: 'text-blue-400 border-blue-500', priceCoins: 400, isOwned: false },
  { id: 'avatar_corsair', name: 'Corsair Queen', title: 'Scourge of the Reefs', avatarIcon: '🏹', rarity: 'Epic', rarityColor: 'text-purple-400 border-purple-500', priceCoins: 800, isOwned: false },
  { id: 'avatar_seer', name: 'Kraken High Seer', title: 'Ancient Tide Whisperer', avatarIcon: '🐙', rarity: 'Legendary', rarityColor: 'text-amber-400 border-amber-500', priceCoins: 1500, isOwned: false },
];

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  scrolls,
  onCoinsChange,
  onScrollsChange,
  onAvatarChange,
  currentAvatar = '🧙',
}) => {
  const [activeTab, setActiveTab] = useState<ShopTab>('gold');
  const [avatars, setAvatars] = useState<AvatarItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hexara_owned_avatars');
      if (stored) {
        try {
          const ownedIds: string[] = JSON.parse(stored);
          return DEFAULT_AVATARS.map((a) => ({
            ...a,
            isOwned: a.isOwned || ownedIds.includes(a.id),
          }));
        } catch {}
      }
    }
    return DEFAULT_AVATARS;
  });

  // Purchase Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    price: string;
    icon: string;
    onConfirm: () => void;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Buy Gold Pack
  const handleSelectGoldPack = (pkg: CurrencyPackage) => {
    soundManager.playClick();
    const totalGold = pkg.goldAmount + (pkg.bonusAmount || 0);
    setConfirmDialog({
      isOpen: true,
      title: `Purchase ${pkg.name}`,
      subtitle: `Receive ${totalGold} Isles Gold directly in your treasury.`,
      price: pkg.priceUsd,
      icon: pkg.icon,
      onConfirm: () => {
        soundManager.playVictory();
        const nextCoins = coins + totalGold;
        onCoinsChange?.(nextCoins);
        localStorage.setItem('hexara_coins', nextCoins.toString());
        setConfirmDialog(null);
        showToast(`Purchased ${totalGold} Isles Gold!`);
      },
    });
  };

  // 2. Buy Bundle
  const handleSelectBundle = (bundle: BundleItem) => {
    soundManager.playClick();
    setConfirmDialog({
      isOpen: true,
      title: `Purchase ${bundle.title}`,
      subtitle: bundle.description,
      price: bundle.priceUsd,
      icon: bundle.icon,
      onConfirm: () => {
        soundManager.playVictory();
        setConfirmDialog(null);
        showToast(`Unlocked ${bundle.title}! Items delivered to inventory.`);
      },
    });
  };

  // 3. Buy Avatar
  const handleBuyAvatar = (avatar: AvatarItem) => {
    if (coins < avatar.priceCoins) {
      soundManager.playError();
      showToast(`Not enough Isles Gold! Need ${avatar.priceCoins} 🪙`);
      return;
    }

    soundManager.playClick();
    setConfirmDialog({
      isOpen: true,
      title: `Recruit ${avatar.name}`,
      subtitle: `Unlock this avatar for your captain profile for ${avatar.priceCoins} Isles Gold.`,
      price: `${avatar.priceCoins} 🪙`,
      icon: avatar.avatarIcon,
      onConfirm: () => {
        soundManager.playVictory();
        const nextCoins = coins - avatar.priceCoins;
        onCoinsChange?.(nextCoins);
        localStorage.setItem('hexara_coins', nextCoins.toString());

        const nextAvatars = avatars.map((a) => (a.id === avatar.id ? { ...a, isOwned: true } : a));
        setAvatars(nextAvatars);

        const ownedIds = nextAvatars.filter((a) => a.isOwned).map((a) => a.id);
        localStorage.setItem('hexara_owned_avatars', JSON.stringify(ownedIds));

        setConfirmDialog(null);
        showToast(`Recruited ${avatar.name}! Available to equip.`);
      },
    });
  };

  // 4. Equip Avatar
  const handleEquipAvatar = (avatar: AvatarItem) => {
    soundManager.playClick();
    onAvatarChange?.(avatar.avatarIcon);
    localStorage.setItem('hexara_avatar', avatar.avatarIcon);
    showToast(`Equipped ${avatar.name} as active captain!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#120704] text-amber-100 select-none animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* 1. TOP HEADER BAR: BACK, TITLE, CURRENCIES, HOME             */}
      {/* ============================================================ */}
      <header className="h-16 px-4 sm:px-6 bg-gradient-to-r from-[#2c1308] via-[#1c0a04] to-[#2c1308] border-b-2 border-amber-600/60 flex items-center justify-between shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 hover:text-white transition-all active:scale-95 text-xs font-bold font-serif uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-serif">
              ISLES BAZAAR & STORE
            </h1>
          </div>
        </div>

        {/* Currency Counters & Home */}
        <div className="flex items-center gap-3">
          {/* Ancient Scrolls */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-600/40 shadow-inner">
            <Scroll className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black font-mono text-amber-100">{scrolls}</span>
          </div>

          {/* Isles Gold */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-600/40 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span className="text-xs font-black font-mono text-amber-100">{coins}</span>
          </div>

          {/* Home Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-black/50 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 hover:text-white transition-all active:scale-95"
            title="Return to Home"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT AREA: LARGE HORIZONTAL CARDS                 */}
      {/* ============================================================ */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full flex flex-col justify-between custom-scrollbar">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 border-2 border-amber-400 px-6 py-2.5 rounded-2xl shadow-2xl text-amber-100 font-bold text-xs animate-in slide-in-from-top-2 duration-150 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: ISLES GOLD */}
        {activeTab === 'gold' && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300 font-serif">
                Isles Gold Treasury
              </h2>
              <p className="text-xs text-amber-200/70">
                Acquire Isles Gold to recruit legendary captains, purchase custom dice sets, and unlock cosmetics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {GOLD_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-3xl p-6 bg-gradient-to-b from-[#26120a] via-[#190a05] to-[#100502] border-2 shadow-2xl flex flex-col justify-between transition-all hover:scale-[1.02] ${
                    pkg.popular
                      ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] ring-1 ring-amber-300'
                      : 'border-amber-600/50 hover:border-amber-400'
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 text-[#140804] text-[10px] font-black uppercase tracking-wider shadow">
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-4xl shadow-inner mb-4">
                      {pkg.icon}
                    </div>
                    <h3 className="text-base font-black text-amber-100 font-serif">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1.5 my-2">
                      <span className="text-2xl font-black text-amber-300 font-mono">{pkg.goldAmount}</span>
                      <span className="text-xs font-bold text-amber-200/80 uppercase">Gold</span>
                      {pkg.bonusAmount && (
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          +{pkg.bonusAmount} Bonus
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectGoldPack(pkg)}
                    className="w-full mt-6 py-3 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                  >
                    <span>{pkg.priceUsd}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: GAME VARIATIONS */}
        {activeTab === 'variations' && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300 font-serif">
                Game Variations & Expansions
              </h2>
              <p className="text-xs text-amber-200/70">
                Unlock new island topologies, exploration rules, and victory conditions for your matches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {GAME_VARIATIONS.map((variation) => (
                <div
                  key={variation.id}
                  className="rounded-3xl p-6 bg-gradient-to-b from-[#26120a] via-[#190a05] to-[#100502] border-2 border-amber-600/50 shadow-2xl flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-4xl shrink-0 shadow-inner">
                      {variation.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-amber-100 font-serif">{variation.title}</h3>
                        {variation.status === 'owned' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-[10px] font-bold text-emerald-300">
                            UNLOCKED
                          </span>
                        )}
                        {variation.status === 'locked' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> LEVEL {variation.requiredLevel}
                          </span>
                        )}
                        {variation.status === 'coming_soon' && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-[10px] font-bold text-stone-400">
                            COMING SOON
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-400/80 font-serif mt-0.5">{variation.subtitle}</p>
                      <p className="text-xs text-amber-200/65 mt-2">{variation.description}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-amber-900/40 flex items-center justify-between">
                    <span className="text-[11px] text-amber-300/60 font-mono">
                      {variation.status === 'owned' ? 'Standard Included Expansion' : 'Progression Unlock'}
                    </span>
                    <button
                      disabled={variation.status !== 'owned'}
                      onClick={() => {
                        soundManager.playClick();
                        showToast(`Selected ${variation.title} for upcoming match.`);
                      }}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                        variation.status === 'owned'
                          ? 'bg-emerald-800 border border-emerald-400 text-white shadow hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-black/50 text-stone-500 border border-stone-800 cursor-not-allowed'
                      }`}
                    >
                      {variation.status === 'owned' ? 'Playable' : 'Locked'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: BUNDLES */}
        {activeTab === 'bundles' && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300 font-serif">
                Treasury Bundles
              </h2>
              <p className="text-xs text-amber-200/70">
                Packaged sets containing gold, board skins, dice sets, and exclusive captain cosmetics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {BUNDLE_PACKS.map((bundle) => (
                <div
                  key={bundle.id}
                  className="rounded-3xl p-6 bg-gradient-to-b from-[#26120a] via-[#190a05] to-[#100502] border-2 border-amber-600/50 shadow-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-3xl mb-3 shadow">
                      {bundle.icon}
                    </div>
                    <h3 className="text-base font-black text-amber-100 font-serif">{bundle.title}</h3>
                    <p className="text-xs text-amber-400/80 font-serif mb-3">{bundle.subtitle}</p>
                    <p className="text-xs text-amber-200/70 mb-4">{bundle.description}</p>

                    {/* Included List */}
                    <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-amber-900/40">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Included Items:</p>
                      {bundle.includes.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-amber-200/80">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectBundle(bundle)}
                    className="w-full mt-6 py-3 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                  >
                    <span>Buy Bundle ({bundle.priceUsd})</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: AVATAR COLLECTION */}
        {activeTab === 'avatars' && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300 font-serif">
                Captain Avatars & Personas
              </h2>
              <p className="text-xs text-amber-200/70">
                Choose your captain portrait to display on player cards, ribbon boards, and rankings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {avatars.map((avatar) => {
                const isEquipped = currentAvatar === avatar.avatarIcon;

                return (
                  <div
                    key={avatar.id}
                    className="rounded-3xl p-5 bg-gradient-to-b from-[#26120a] via-[#190a05] to-[#100502] border-2 border-amber-600/50 shadow-2xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border-2 border-amber-400/60 flex items-center justify-center text-4xl shadow">
                          {avatar.avatarIcon}
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${avatar.rarityColor} bg-black/60`}>
                          {avatar.rarity}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-amber-100 font-serif">{avatar.name}</h3>
                      <p className="text-xs text-amber-400/80 font-serif">{avatar.title}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-amber-900/40">
                      {avatar.isOwned ? (
                        <button
                          onClick={() => handleEquipAvatar(avatar)}
                          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-700 border-2 border-emerald-400 text-white'
                              : 'bg-black/60 border border-amber-600/50 text-amber-200 hover:bg-amber-800/40'
                          }`}
                        >
                          {isEquipped ? <Check className="w-4 h-4" /> : null}
                          <span>{isEquipped ? 'Equipped' : 'Equip Avatar'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyAvatar(avatar)}
                          className="w-full py-2.5 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                        >
                          <span>Recruit ({avatar.priceCoins} 🪙)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* 3. BOTTOM NAVIGATION TABS: EXACT TO REFERENCE               */}
      {/* ============================================================ */}
      <nav className="h-16 bg-[#160803] border-t-2 border-amber-600/60 flex items-center justify-around px-2 sm:px-6 shrink-0 z-20">
        <button
          onClick={() => { soundManager.playClick(); setActiveTab('gold'); }}
          className={`flex-1 max-w-[200px] h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'gold'
              ? 'catan-btn-gold shadow-lg font-serif'
              : 'text-amber-200/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Isles Gold</span>
        </button>

        <button
          onClick={() => { soundManager.playClick(); setActiveTab('variations'); }}
          className={`flex-1 max-w-[200px] h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'variations'
              ? 'catan-btn-gold shadow-lg font-serif'
              : 'text-amber-200/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Game Variations</span>
          <span className="sm:hidden">Variations</span>
        </button>

        <button
          onClick={() => { soundManager.playClick(); setActiveTab('bundles'); }}
          className={`flex-1 max-w-[200px] h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'bundles'
              ? 'catan-btn-gold shadow-lg font-serif'
              : 'text-amber-200/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Bundles</span>
        </button>

        <button
          onClick={() => { soundManager.playClick(); setActiveTab('avatars'); }}
          className={`flex-1 max-w-[200px] h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'avatars'
              ? 'catan-btn-gold shadow-lg font-serif'
              : 'text-amber-200/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Avatar Collection</span>
          <span className="sm:hidden">Avatars</span>
        </button>
      </nav>

      {/* ============================================================ */}
      {/* 4. PURCHASE CONFIRMATION MODAL OVERLAY                       */}
      {/* ============================================================ */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-w-md bg-gradient-to-b from-[#2d1b0d] via-[#1a0f07] to-[#120703] border-2 border-amber-500 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.5)] text-center relative">
            <button
              onClick={() => setConfirmDialog(null)}
              className="absolute top-4 right-4 text-amber-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border-2 border-amber-400 mx-auto flex items-center justify-center text-4xl shadow mb-4">
              {confirmDialog.icon}
            </div>

            <h3 className="text-lg font-black uppercase tracking-wider text-amber-100 font-serif mb-1">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-amber-200/70 mb-4">{confirmDialog.subtitle}</p>

            <div className="p-3 bg-black/50 rounded-2xl border border-amber-600/40 mb-6">
              <span className="text-[11px] text-amber-400 uppercase tracking-widest block font-bold">Total Price</span>
              <span className="text-xl font-black text-white font-mono">{confirmDialog.price}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 rounded-xl catan-btn-gold text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 cursor-pointer"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
