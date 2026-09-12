import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { BookOpen, Search, Sparkles, Award, Shield, Compass, Dices } from 'lucide-react';

interface AlmanacModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlmanacModal: React.FC<AlmanacModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'rules' | 'almanac' | 'expansions'>('rules');
  const [selectedTopic, setSelectedTopic] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const rulesTopics = [
    { id: 'overview', title: 'Game Overview & Flow' },
    { id: 'twoplayer', title: 'Two-Player Duel Rules & Balancing' },
    { id: 'setup', title: 'Setup Phase & Snake Draft' },
    { id: 'production', title: 'Resource Production & Dice' },
    { id: 'odds', title: 'Dice Roll Probabilities' },
    { id: 'trade', title: 'Domestic & Maritime Trade' },
    { id: 'building', title: 'Building & Distance Rule' },
    { id: 'robber', title: 'Rolling a 7 & The Robber' },
    { id: 'devcards', title: 'Development Cards' },
    { id: 'special', title: 'Longest Road & Largest Army' },
    { id: 'victory', title: 'Winning the Game (10 VP)' },
  ];

  const almanacTopics = [
    { id: 'cities_alm', title: 'Cities (Double Harvest)' },
    { id: 'coast_harbors', title: 'Coast & Harbor Locations' },
    { id: 'combined_phase', title: 'Combined Trade/Build Phase' },
    { id: 'desert_alm', title: 'The Desert' },
    { id: 'intersections', title: 'Intersections & Paths' },
    { id: 'knight_cards', title: 'Knight Cards & Timing' },
    { id: 'progress_cards', title: 'Progress Cards (Monopoly, etc)' },
    { id: 'tactics', title: 'Tactics & Beginner Tips' },
  ];

  const expansionTopics = [
    { id: 'ext_56', title: '5-6 Player Extension & Special Build' },
    { id: 'helpers', title: 'Helpers of Hexara (10 Characters)' },
    { id: 'seafarers_preview', title: 'Seafarers Expansion' },
    { id: 'cities_preview', title: 'Cities & Strongholds Expansion' },
  ];

  const currentTopics =
    activeCategory === 'rules'
      ? rulesTopics
      : activeCategory === 'almanac'
      ? almanacTopics
      : expansionTopics;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col catan-bg-burgundy select-none animate-in fade-in duration-200">
      <HeaderBar title="ALMANAC & GAME RULES" onBack={onClose} onHome={onClose} coins={1250} scrolls={18} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-5 h-[80vh]">
          {/* Left Column: Category Tabs, Search & Topic List */}
          <div className="md:col-span-4 catan-card-dark rounded-2xl p-4 flex flex-col space-y-3 border-2 border-amber-500/80 shadow-2xl overflow-hidden">
            {/* 3 Category Switchers */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setActiveCategory('rules');
                  setSelectedTopic('overview');
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeCategory === 'rules' ? 'catan-btn-gold shadow-md' : 'bg-black/40 text-amber-200/60 hover:text-amber-100'
                }`}
              >
                Rules
              </button>
              <button
                onClick={() => {
                  setActiveCategory('almanac');
                  setSelectedTopic('cities_alm');
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeCategory === 'almanac' ? 'catan-btn-gold shadow-md' : 'bg-black/40 text-amber-200/60 hover:text-amber-100'
                }`}
              >
                Almanac
              </button>
              <button
                onClick={() => {
                  setActiveCategory('expansions');
                  setSelectedTopic('ext_56');
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeCategory === 'expansions' ? 'catan-btn-gold shadow-md' : 'bg-black/40 text-amber-200/60 hover:text-amber-100'
                }`}
              >
                Scenarios
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search rule keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#170905] text-amber-100 placeholder:text-amber-200/40 font-bold text-xs outline-none border border-amber-600/50 focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-2.5" />
            </div>

            {/* Topic List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {currentTopics
                .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedTopic === topic.id
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-300 shadow-md font-black'
                        : 'bg-[#2b170c]/60 text-amber-200/70 border-amber-800/40 hover:bg-[#382012] hover:text-amber-100'
                    }`}
                  >
                    {topic.title}
                  </button>
                ))}
            </div>
          </div>

          {/* Right Column: Detailed Parchment Rule Reader */}
          <div className="md:col-span-8 catan-parchment-box rounded-2xl p-6 md:p-8 overflow-y-auto border-2 border-amber-700/60 shadow-2xl text-[#26150c] leading-relaxed text-xs md:text-sm">
            {/* OVERVIEW */}
            {selectedTopic === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Game Overview & Core Flow
                </h3>
                <p>
                  The island of the archipelago consists of <strong>19 terrain hexes</strong> surrounded by ocean. Your goal is to settle the island and expand your maritime colony until you reach <strong>10 Victory Points</strong> on your turn.
                </p>
                <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647] my-3">
                  <h4 className="font-bold text-sm mb-1 text-[#5c1e08]">Terrain Types & Resource Yields:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Forests</strong> produce 🪵 <strong>Lumber</strong></li>
                    <li><strong>Hills</strong> produce 🧱 <strong>Brick</strong></li>
                    <li><strong>Pastures</strong> produce 🐑 <strong>Wool</strong></li>
                    <li><strong>Fields</strong> produce 🌾 <strong>Grain</strong></li>
                    <li><strong>Mountains</strong> produce ⛰️ <strong>Ore</strong></li>
                    <li><strong>Desert</strong> produces <em>nothing</em> (the Robber starts here)</li>
                  </ul>
                </div>
                <h4 className="font-bold text-[#7a2e0e]">The 3-Step Turn Sequence:</h4>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li><strong>Resource Production:</strong> Roll both dice. The sum indicates which hexes produce resources for all players.</li>
                  <li><strong>Trade:</strong> Trade resources with other players (domestic trade) or with the supply/harbors (maritime trade).</li>
                  <li><strong>Build:</strong> Spend resource combinations to build roads, settlements, cities, or buy development cards.</li>
                </ol>
                <p className="text-xs italic text-[#5c3a21]">
                  Tip: In modern and tournament play (Combined Trade/Build Phase), players can trade and build interchangeably in any order!
                </p>
              </div>
            )}

            {/* TWO-PLAYER DUEL MODE */}
            {selectedTopic === 'twoplayer' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Two-Player Online Duel Rules & Balancing
                </h3>
                <p>
                  In <strong>Isles of Hexara Two-Player Duel Mode</strong>, exactly two real captains contest the archipelago. No artificial bot fillers are injected into online rooms.
                </p>
                <div className="bg-[#ebdcb9] p-3.5 rounded-xl border border-[#b88647] space-y-2">
                  <h4 className="font-bold text-sm text-[#5c1e08]">Key Duel Mechanics:</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>
                      <strong>Turn Rotation & Snake Draft:</strong> Initial setup follows P1 &rarr; P2 &rarr; P2 &rarr; P1. Turns then alternate smoothly between both captains.
                    </li>
                    <li>
                      <strong>Direct Trade Negotiation:</strong> Domestic trades occur exclusively between the two captains. If your adversary declines, domestic barter cannot proceed&mdash;making coastal <strong>Harbors (3:1 and 2:1)</strong> exceptionally valuable!
                    </li>
                    <li>
                      <strong>Robber Dynamics:</strong> Rolling a 7 or playing a Knight card directs the Robber onto your adversary's terrain. The victim loses 1 random resource card (if holding cards) and production on that hex is halted.
                    </li>
                    <li>
                      <strong>Longest Road & Largest Army:</strong> Still require a minimum of 5 road segments and 3 knights respectively (+2 VP each). Contesting these trophies is decisive in 1v1 duels!
                    </li>
                    <li>
                      <strong>Victory Target:</strong> Standard goal is 10 Victory Points (host configurable to 8 VP for lightning duels or 12 VP for prolonged wars of attrition).
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl border-l-4 border-amber-600 text-xs">
                  <strong>Captain's Strategic Advice:</strong> In a 2-player duel, early territory claiming is critical. Expand rapidly towards specialized coastal harbors (2:1 Ore or Grain) to bypass reliance on your opponent's trade consent.
                </div>
              </div>
            )}

            {/* SETUP */}
            {selectedTopic === 'setup' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Setup Phase & Snake Draft
                </h3>
                <p>
                  Each player starts with <strong>5 settlements, 4 cities, and 15 roads</strong>. Initial placement takes place in two rounds:
                </p>
                <div className="space-y-3">
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h4 className="font-bold text-[#5c1e08]">Round One (Clockwise):</h4>
                    <p>
                      Each player places 1 settlement on an unoccupied intersection of their choice, then places 1 connected road adjacent to that settlement.
                    </p>
                  </div>
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h4 className="font-bold text-[#5c1e08]">Round Two (Counter-Clockwise Snake):</h4>
                    <p>
                      The player who went last in Round 1 places their second settlement and second connected road first! The draft then proceeds counter-clockwise back to the starting player.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl border-l-4 border-amber-600 text-xs">
                    <strong>Starting Resources:</strong> Each player receives 1 resource card for each terrain hex adjacent to their <strong>second settlement</strong>. (Starting players do not get resources for their first settlement).
                  </div>
                </div>
              </div>
            )}

            {/* ODDS */}
            {selectedTopic === 'odds' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Dice Roll Probabilities (2d6)
                </h3>
                <p>
                  The probability of rolling a given sum determines how frequently a terrain hex produces resources. Number tokens feature dots (pips) indicating frequency:
                </p>
                <div className="overflow-x-auto my-3">
                  <table className="w-full text-left border-collapse border border-[#b88647]">
                    <thead>
                      <tr className="bg-[#dcc79b] text-[#3d1808] font-black uppercase text-xs">
                        <th className="p-2 border border-[#b88647]">Dice Total</th>
                        <th className="p-2 border border-[#b88647]">Combinations</th>
                        <th className="p-2 border border-[#b88647]">Pips (Dots)</th>
                        <th className="p-2 border border-[#b88647]">Probability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#b88647]/50 font-semibold">
                      <tr><td className="p-2 border border-[#b88647]">7 (The Robber)</td><td className="p-2 border border-[#b88647]">6 / 36</td><td className="p-2 border border-[#b88647]">None</td><td className="p-2 border border-[#b88647] font-bold text-red-700">16.7% (1 in 6)</td></tr>
                      <tr className="bg-red-50"><td className="p-2 border border-[#b88647] font-black text-red-700">6 & 8</td><td className="p-2 border border-[#b88647]">5 / 36 each</td><td className="p-2 border border-[#b88647]">••••• (5 pips)</td><td className="p-2 border border-[#b88647] font-bold text-red-700">13.9% each</td></tr>
                      <tr><td className="p-2 border border-[#b88647]">5 & 9</td><td className="p-2 border border-[#b88647]">4 / 36 each</td><td className="p-2 border border-[#b88647]">•••• (4 pips)</td><td className="p-2 border border-[#b88647]">11.1% each</td></tr>
                      <tr><td className="p-2 border border-[#b88647]">4 & 10</td><td className="p-2 border border-[#b88647]">3 / 36 each</td><td className="p-2 border border-[#b88647]">••• (3 pips)</td><td className="p-2 border border-[#b88647]">8.3% each</td></tr>
                      <tr><td className="p-2 border border-[#b88647]">3 & 11</td><td className="p-2 border border-[#b88647]">2 / 36 each</td><td className="p-2 border border-[#b88647]">•• (2 pips)</td><td className="p-2 border border-[#b88647]">5.6% each</td></tr>
                      <tr><td className="p-2 border border-[#b88647]">2 & 12</td><td className="p-2 border border-[#b88647]">1 / 36 each</td><td className="p-2 border border-[#b88647]">• (1 pip)</td><td className="p-2 border border-[#b88647]">2.8% each</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TRADE */}
            {selectedTopic === 'trade' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Domestic & Maritime Trading
                </h3>
                <h4 className="font-bold text-[#5c1e08]">1. Domestic Trade (Between Players):</h4>
                <p>
                  The player whose turn it is can trade resource cards with any other player. Other players cannot trade among themselves without the active player. No cards may be given away as gifts, and trading like resources (e.g. 2 wool for 1 wool) is prohibited.
                </p>
                <h4 className="font-bold text-[#5c1e08] mt-3">2. Maritime Trade (With the Supply / Bank):</h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Standard 4:1 Trade:</strong> You can always exchange 4 identical resources for any 1 resource of choice. No harbor needed!</li>
                  <li><strong>Generic Harbor (3:1):</strong> If you have a settlement or city at a 3:1 harbor, you can trade 3 identical resources for 1 of choice.</li>
                  <li><strong>Special Harbor (2:1):</strong> If you control a specific resource harbor (e.g., Ore 2:1), you can trade 2 of that resource for any 1 other card.</li>
                </ul>
              </div>
            )}

            {/* BUILDING */}
            {selectedTopic === 'building' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Building Costs & The Distance Rule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">🛣️ Road</h5>
                    <p className="text-xs">Cost: 1 Lumber + 1 Brick</p>
                    <p className="text-[11px] text-[#5c3a21] mt-1">Must connect to your existing road, settlement, or city. Max 15.</p>
                  </div>
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">🏠 Settlement (1 VP)</h5>
                    <p className="text-xs">Cost: 1 Lumber + 1 Brick + 1 Wool + 1 Grain</p>
                    <p className="text-[11px] text-[#5c3a21] mt-1">Produces 1 resource when bordering hexes roll. Max 5.</p>
                  </div>
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">🏰 City (2 VP)</h5>
                    <p className="text-xs">Cost: 3 Ore + 2 Grain</p>
                    <p className="text-[11px] text-[#5c3a21] mt-1">Replaces a settlement. Produces 2 resources. Returns settlement piece to pool! Max 4.</p>
                  </div>
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">📜 Development Card</h5>
                    <p className="text-xs">Cost: 1 Ore + 1 Wool + 1 Grain</p>
                    <p className="text-[11px] text-[#5c3a21] mt-1">Drawn from the 25-card deck. Keep hidden in hand.</p>
                  </div>
                </div>
                <div className="p-3 bg-red-100/80 rounded-xl border-l-4 border-red-600 text-xs">
                  <strong>The Distance Rule:</strong> You may only build a settlement at an intersection if ALL 3 adjacent intersections are completely vacant (no settlements or cities from any player).
                </div>
              </div>
            )}

            {/* ROBBER */}
            {selectedTopic === 'robber' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Rolling a 7 & Activating the Robber
                </h3>
                <p>When a 7 is rolled on 2d6, no resources are produced anywhere on the board:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Hand Limit Check:</strong> Every player who has <strong>more than 7 resource cards</strong> (8 or more) must choose and discard half (rounded down). For example, 9 cards means discarding 4.
                  </li>
                  <li>
                    <strong>Moving the Robber:</strong> The player who rolled the 7 must move the robber away from its current hex to any other terrain hex or the desert.
                  </li>
                  <li>
                    <strong>Stealing:</strong> The active player steals 1 random resource card from an opponent with a settlement or city bordering the robber's new hex.
                  </li>
                  <li>
                    <strong>Blocking:</strong> While the robber remains on a hex, that hex produces <em>zero</em> resources when its number is rolled!
                  </li>
                </ol>
              </div>
            )}

            {/* DEVCARDS */}
            {selectedTopic === 'devcards' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Development Cards (25 Total)
                </h3>
                <p>
                  You may only play 1 development card per turn, and you cannot play a card on the turn it was purchased (except victory point cards to win):
                </p>
                <div className="space-y-2.5">
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">⚔️ 14 Knight Cards:</h5>
                    <p className="text-xs">Immediately move the robber and steal 1 card from an adjacent player. Face-up knights count toward Largest Army. Can be played <em>before</em> rolling dice!</p>
                  </div>
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">🟢 6 Progress Cards (2 of each):</h5>
                    <ul className="text-xs list-disc pl-5 mt-1 space-y-1">
                      <li><strong>Road Building (2):</strong> Immediately place 2 free roads on the board.</li>
                      <li><strong>Year of Plenty (2):</strong> Take any 2 resource cards from the bank into your hand.</li>
                      <li><strong>Monopoly (2):</strong> Name 1 resource; all other players must give you all cards of that type!</li>
                    </ul>
                  </div>
                  <div className="bg-[#ebdcb9] p-3 rounded-xl border border-[#b88647]">
                    <h5 className="font-black text-[#5c1e08]">👑 5 Victory Point Cards (1 VP each):</h5>
                    <p className="text-xs">University, Market, Library, Chapel, Great Hall. Kept strictly hidden until you reach 10 VP on your turn to declare victory!</p>
                  </div>
                </div>
              </div>
            )}

            {/* SPECIAL CARDS */}
            {selectedTopic === 'special' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Special Cards: Longest Road & Largest Army
                </h3>
                <div className="bg-[#ebdcb9] p-4 rounded-xl border border-[#b88647] space-y-2">
                  <h4 className="font-black text-sm text-[#5c1e08]">🛣️ Longest Road (2 Victory Points):</h4>
                  <p className="text-xs">
                    Awarded to the first player to construct a continuous unbroken road of at least <strong>5 segments</strong> (branch roads do not count).
                  </p>
                  <p className="text-xs">
                    If another player builds a longer road, they claim the card (creating a <strong>4 VP swing</strong>!). An opponent can also break your road by legally building a settlement on an unoccupied intersection along your path!
                  </p>
                </div>
                <div className="bg-[#ebdcb9] p-4 rounded-xl border border-[#b88647] space-y-2">
                  <h4 className="font-black text-sm text-[#5c1e08]">🛡️ Largest Army (2 Victory Points):</h4>
                  <p className="text-xs">
                    Awarded to the first player to have <strong>3 Knight cards</strong> face up in front of them. If another player plays more knights, they claim the card and its 2 Victory Points.
                  </p>
                </div>
              </div>
            )}

            {/* VICTORY */}
            {selectedTopic === 'victory' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Winning the Game (10 Victory Points)
                </h3>
                <p>
                  The first player to reach <strong>10 or more Victory Points on their turn</strong> immediately wins the game!
                </p>
                <div className="bg-[#ebdcb9] p-4 rounded-xl border border-[#b88647]">
                  <h4 className="font-bold text-sm mb-2 text-[#5c1e08]">Victory Point Breakdown:</h4>
                  <ul className="space-y-1.5 font-semibold text-xs">
                    <li>🏠 Each Settlement = 1 VP</li>
                    <li>🏰 Each City = 2 VP</li>
                    <li>🛣️ Longest Road = 2 VP</li>
                    <li>🛡️ Largest Army = 2 VP</li>
                    <li>📜 Each Victory Point Card = 1 VP</li>
                  </ul>
                  <p className="text-xs italic text-[#5c3a21] mt-3">
                    Note: Since every player starts with 2 settlements, you begin with 2 VP and only need 8 more to triumph!
                  </p>
                </div>
              </div>
            )}

            {/* TACTICS */}
            {selectedTopic === 'tactics' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Tactics & Strategy Guidelines
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li><strong>Lumber & Brick are Crucial Early:</strong> You need both to pave roads and place settlements. Try to secure at least one high-producing forest or hill in your initial placements.</li>
                  <li><strong>Harbors Enable Specialization:</strong> A player with heavy grain production should prioritize reaching the 2:1 Grain Harbor. This frees you from having to rely on opponents for trades.</li>
                  <li><strong>City Upgrades are Essential:</strong> With only 5 settlements in your supply, you cannot win without upgrading to cities (settlements alone cap at 5 VP). Upgrading also frees the settlement piece to build elsewhere!</li>
                  <li><strong>Beware of Entrapment:</strong> Placing starting settlements too close to the island center can get you boxed in by opponent roads and cut off from the coast.</li>
                </ul>
              </div>
            )}

            {/* 5-6 PLAYER EXTENSION */}
            {selectedTopic === 'ext_56' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  5-6 Player Extension & Special Build Phase
                </h3>
                <p>
                  To accommodate 5 or 6 voyagers, the island expands to <strong>30 land hexes, 11 harbors, and 28 number tokens</strong>.
                </p>
                <div className="bg-[#ebdcb9] p-4 rounded-xl border border-[#b88647]">
                  <h4 className="font-black text-sm text-[#5c1e08]">The Special Building Phase:</h4>
                  <p className="text-xs mt-1">
                    Occurs at the end of each player's turn, between turns. In clockwise order, all other players may build roads, settlements, cities, or buy development cards using the cards in their hand.
                  </p>
                  <p className="text-xs mt-2 text-[#5c3a21]">
                    <em>Prohibitions during Special Build:</em> No trading, no maritime trade, and no playing development cards. This phase prevents excessive hand-size buildup (&gt; 7 cards) before your turn arrives!
                  </p>
                </div>
              </div>
            )}

            {/* HELPERS */}
            {selectedTopic === 'helpers' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Helpers of Hexara (10 Character Cards)
                </h3>
                <p>
                  Players acquire a Helper card upon placing their second settlement. Each Helper offers an asymmetric advantage and flips from side A to side B after use:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Candamir:</strong> Substitute 1 dev card resource; draw top 3, pick 1.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Hilde:</strong> Look at leader's resource hand and take 1 card.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Jean:</strong> 2:1 supply trade for 1 chosen resource all turn.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Lin:</strong> Move robber to desert; receive vacated hex's resource.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Louis:</strong> Move and rebuild 1 free disconnected road.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Marianne:</strong> If a non-7 roll gives you no cards, take 1 resource of choice.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Nassir:</strong> Name resource; force 1-2 opponents to trade it 1:1.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Sean:</strong> On 7 roll, no discard if &gt; 7 cards; or take 1 resource if ≤ 7.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>Vincent:</strong> Discard knight to discount settlement or city.</div>
                  <div className="bg-[#ebdcb9] p-2.5 rounded-lg border border-[#b88647]"><strong>William:</strong> Build road substituting lumber or brick with any resource.</div>
                </div>
              </div>
            )}

            {/* Default fallback for other topics */}
            {['cities_alm', 'coast_harbors', 'combined_phase', 'desert_alm', 'intersections', 'knight_cards', 'progress_cards', 'seafarers_preview', 'cities_preview'].includes(selectedTopic) && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-wider text-[#7a2e0e] border-b-2 border-[#b88647]/50 pb-2">
                  Almanac Reference: {currentTopics.find((t) => t.id === selectedTopic)?.title}
                </h3>
                <p>
                  Detailed tactical and ruling notes from Klaus Teuber's official Almanac, explaining official game resolution and player interaction.
                </p>
                <div className="bg-[#ebdcb9] p-4 rounded-xl border border-[#b88647] space-y-2 text-xs">
                  <p><strong>Timing of Development Cards:</strong> You can play a Knight card on your turn <em>before</em> rolling the dice to chase the robber off your productive wheat or ore hex.</p>
                  <p><strong>Unused Settlement Recycling:</strong> Upgrading to a City returns the settlement piece to your supply immediately. You can place it on a new coastal intersection later in the game.</p>
                  <p><strong>Harbor Acquisition:</strong> You can use a newly built harbor on the very same turn you construct the settlement on its intersection.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
