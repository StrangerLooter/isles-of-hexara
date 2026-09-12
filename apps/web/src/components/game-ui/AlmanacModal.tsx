'use client';

import React, { useState } from 'react';
import { BookOpen, Search, ChevronLeft, Check, Sparkles, Filter } from 'lucide-react';

interface RuleSection {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  content: string;
}

const RULE_SECTIONS: RuleSection[] = [
  {
    id: 'setup_phase',
    category: 'Rules',
    title: 'Set-up Phase & Snake Order',
    subtitle: 'Initial Placement & Starting Resources',
    content:
      'The game begins with two setup rounds. In Round 1, players place 1 settlement and 1 road in clockwise order. In Round 2, the player who went last places their 2nd settlement and 2nd road first, and the order snakes counter-clockwise back to the starting player. Immediately after building the 2nd settlement, the player receives 1 resource card for each terrain hex adjacent to that 2nd settlement.',
  },
  {
    id: 'distance_rule',
    category: 'Buildings',
    title: 'Distance Rule (2-Edge Minimum Spacing)',
    subtitle: 'Mandatory Intersection Spacing',
    content:
      'You may only build a settlement on an unoccupied intersection if all 3 adjacent intersections connected by paths are vacant (i.e. none are occupied by any settlements or cities, even your own). This rule strictly applies both during initial setup and throughout the entire game.',
  },
  {
    id: 'resource_production',
    category: 'Resources',
    title: 'Resource Production (Dice Rolls 2–12)',
    subtitle: 'Harvesting Land Hex Yields',
    content:
      'On your turn, roll both dice. The sum determines which terrain hexes produce resources: Forest produces Lumber, Hills produce Brick, Pasture produces Wool, Fields produce Grain, and Mountains produce Ore. Each player with a settlement adjacent to a producing hex receives 1 resource card. Each city receives 2 resource cards. If the Robber is on that hex, no resources are produced.',
  },
  {
    id: 'robber_seven',
    category: 'Rules',
    title: 'Rolling a "7" & Activating the Robber',
    subtitle: 'Discarding & Hex Blocking',
    content:
      'If you roll a 7, no hexes produce resources. Every player with more than 7 resource cards in hand (8 or more) must choose and discard half of their cards (rounded down) to the supply. Then you must move the Robber to any other terrain hex or desert, and steal 1 random resource card from an opponent with a settlement or city bordering the new hex.',
  },
  {
    id: 'building_costs',
    category: 'Buildings',
    title: 'Building Costs & Pool Limits',
    subtitle: 'Structures & Supply Caps',
    content:
      'Building costs: Road = 1 Lumber + 1 Brick (max 15 roads); Settlement = 1 Lumber + 1 Brick + 1 Wool + 1 Grain (max 5 settlements, 1 VP); City = 3 Ore + 2 Grain (upgrades settlement, returns settlement to supply, 2 VP); Development Card = 1 Ore + 1 Wool + 1 Grain (from 25-card deck).',
  },
  {
    id: 'cities_upgrade',
    category: 'Buildings',
    title: 'Cities (Double Harvest Power)',
    subtitle: '2 Victory Points & 2x Yields',
    content:
      'You cannot build a city directly from scratch; you must upgrade an existing settlement on the board. When you upgrade, replace the settlement piece with a city piece and return the settlement to your pool. Cities produce double resources (2 cards per production roll) and are worth 2 Victory Points.',
  },
  {
    id: 'domestic_trade',
    category: 'Trade',
    title: 'Domestic Trade (Player-to-Player Barter)',
    subtitle: 'Negotiating Resource Exchanges',
    content:
      'On your turn, you may trade resource cards with other players. You announce which resources you need and what you are willing to give. Other players can make counteroffers. Important: Trades must always involve the player whose turn it is; other players cannot trade among themselves.',
  },
  {
    id: 'maritime_trade',
    category: 'Trade',
    title: 'Maritime Trade & Coastal Harbors',
    subtitle: '4:1 Bank, 3:1 Generic, 2:1 Special Harbors',
    content:
      'During your turn, you can trade with the bank at 4:1 (4 matching cards for 1 of choice). If you control a settlement or city at a 3:1 Generic Harbor, you may trade 3 matching cards for 1 of choice. If you control a 2:1 Special Harbor (Lumber, Brick, Wool, Grain, or Ore), you can trade 2 cards of that specific resource for any 1 resource.',
  },
  {
    id: 'development_cards',
    category: 'Development Cards',
    title: 'Development Cards (Knights & Progress)',
    subtitle: '25-Card Strategic Deck',
    content:
      'The dev deck contains: 14 Knight cards (moves robber and steals card), 2 Road Building cards (places 2 free roads), 2 Year of Plenty cards (draws 2 free resources from bank), 2 Monopoly cards (claims all cards of a chosen resource from all players), and 5 Victory Point cards (+1 VP hidden until game win). You may only play 1 dev card per turn.',
  },
  {
    id: 'longest_road',
    category: 'Rules',
    title: 'Longest Road Special Card (+2 VP)',
    subtitle: 'Minimum 5 Continuous Road Segments',
    content:
      'The first player to build a continuous, unbroken road network of at least 5 segments receives the "Longest Road" special card worth 2 Victory Points. If another player builds a strictly longer road, they immediately claim the card. Opponent settlements built on unoccupied intersections along your road will break your continuous route!',
  },
  {
    id: 'largest_army',
    category: 'Rules',
    title: 'Largest Army Special Card (+2 VP)',
    subtitle: 'Minimum 3 Face-Up Knight Cards',
    content:
      'The first player to play 3 Knight cards face-up receives the "Largest Army" special card worth 2 Victory Points. If another player plays strictly more Knight cards, they immediately seize the card and its 2 bonus points.',
  },
  {
    id: 'winning_game',
    category: 'Rules',
    title: 'Ending the Game & Victory Declaration',
    subtitle: 'Target Victory Points Reached',
    content:
      'If you have 10 or more Victory Points (or the match scenario target VP) during your active turn, the game ends immediately and you are declared the winner! If you reach 10 points when it is not your turn, you must wait until your next turn to claim victory.',
  },
  {
    id: 'tactics',
    category: 'Rules',
    title: 'Tactics & Strategic Advice',
    subtitle: 'Expansion & Port Dominance',
    content:
      'Lumber and Brick are vital in early turns to claim territory and expand road connections. Do not underestimate coastal harbors: pairing high agricultural production with a 2:1 Grain or Wool port creates an unstoppable engine. Always expand toward diverse numbers (avoid stacking on one number).',
  },
];

const CATEGORIES = [
  'ALL',
  'Rules',
  'Buildings',
  'Resources',
  'Trade',
  'Development Cards',
];

interface AlmanacModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlmanacModal: React.FC<AlmanacModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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

  if (!isOpen) return null;

  const filtered = RULE_SECTIONS.filter((sec) => {
    const matchCat = selectedCategory === 'ALL' || sec.category === selectedCategory;
    const matchSearch =
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sec.subtitle && sec.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#2e0e0e] via-[#1c0a0a] to-[#100505] border-2 border-[#d97706]/70 rounded-2xl shadow-[0_0_60px_rgba(217,119,6,0.3)] overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        {/* Header with Title & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-[#d97706]/40 bg-[#3a1414]/70 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold text-xs flex items-center gap-1.5 uppercase transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-xl font-black tracking-widest text-[#fbbf24] uppercase font-serif drop-shadow-md flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Catan Almanac & Rulebook</span>
            </h2>
          </div>

          {/* Search Input Box & Close Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-amber-400/80 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rules, harbor, robber..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/60 border border-amber-600/50 text-amber-100 placeholder-amber-400/40 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#d97706]/20 hover:bg-[#d97706]/40 border border-[#d97706]/50 text-[#fbbf24] font-bold flex items-center justify-center transition-colors text-xs cursor-pointer shrink-0"
              title="Close Almanac"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#200a0a] border-b border-amber-900/40 overflow-x-auto custom-scrollbar">
          <Filter className="w-3.5 h-3.5 text-amber-400/70 flex-shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-slate-950 border-amber-300 font-black shadow-md'
                  : 'bg-black/30 text-amber-200/60 border-amber-900/50 hover:text-amber-100 hover:border-amber-600/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Rules Content List */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <span className="text-3xl">🔍</span>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                No matching rules found
              </h3>
              <p className="text-xs text-amber-200/60">
                Try searching for keywords like "settlement", "robber", "harbor", or "knight".
              </p>
            </div>
          ) : (
            filtered.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-xl bg-[#1b0a0a]/90 border border-[#d97706]/35 shadow-md space-y-2 hover:border-amber-500/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-amber-300 font-serif">
                      {sec.title}
                    </h3>
                    {sec.subtitle && (
                      <p className="text-[11px] text-amber-400/80 font-bold uppercase tracking-wide">
                        {sec.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-black/60 text-amber-200 border border-amber-600/30">
                    {sec.category}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed catan-parchment-box p-3 rounded-lg border border-amber-900/40">
                  {sec.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#1a0808] border-t border-[#d97706]/30 flex justify-between items-center text-xs text-amber-200/70">
          <span>Klaus Teuber’s Official 25th Anniversary Rules Almanac</span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-xl border border-amber-300 transition-all text-xs uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
