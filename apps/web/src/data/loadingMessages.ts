/**
 * Centralized Rotating Loading Quotes, Lore, Strategy & Maritime Facts
 * For Isles of Hexara — Maritime Strategy Tabletop
 */

export type LoadingMessageCategory =
  | 'philosophy'
  | 'lore'
  | 'strategy'
  | 'game_fact'
  | 'maritime_fact'
  | 'fun_fact'
  | 'player_tip'
  | 'world_building';

export interface LoadingMessage {
  id: string;
  category: LoadingMessageCategory;
  categoryLabel: string;
  text: string;
  isFictional: boolean;
  source?: string;
}

export const LOADING_MESSAGES: readonly LoadingMessage[] = [
  // CATEGORY A — PHILOSOPHY
  {
    id: 'phil_01',
    category: 'philosophy',
    categoryLabel: 'THE OLD SAILORS SAY...',
    text: 'Every empire begins with one small decision at high tide.',
    isFictional: false,
    source: 'Ancient Maritime Proverb',
  },
  {
    id: 'phil_02',
    category: 'philosophy',
    categoryLabel: 'VOYAGER WISDOM',
    text: 'Trade reveals what you value. War reveals what you fear.',
    isFictional: false,
    source: 'Tabletop Philosophy',
  },
  {
    id: 'phil_03',
    category: 'philosophy',
    categoryLabel: 'THE OLD SAILORS SAY...',
    text: 'Chance opens the harbor gates. Strategy decides which horizon you claim.',
    isFictional: false,
  },
  {
    id: 'phil_04',
    category: 'philosophy',
    categoryLabel: 'VOYAGER WISDOM',
    text: 'The sea neither rewards haste nor forgives hesitation.',
    isFictional: false,
  },
  {
    id: 'phil_05',
    category: 'philosophy',
    categoryLabel: 'THE OLD SAILORS SAY...',
    text: 'A calm sea never made a skilled navigator.',
    isFictional: false,
  },

  // CATEGORY B — HEXARA LORE
  {
    id: 'lore_01',
    category: 'lore',
    categoryLabel: 'HEXARA LORE',
    text: 'The old captains called the central island the Heart of Hexara.',
    isFictional: true,
  },
  {
    id: 'lore_02',
    category: 'lore',
    categoryLabel: 'HEXARA LORE',
    text: 'Beyond the western reefs lie waters no cartographer fully trusts.',
    isFictional: true,
  },
  {
    id: 'lore_03',
    category: 'lore',
    categoryLabel: 'HEXARA LORE',
    text: 'The Beacon of Hexara has burned across two centuries of trade and tempest.',
    isFictional: true,
  },
  {
    id: 'lore_04',
    category: 'lore',
    categoryLabel: 'HEXARA LORE',
    text: 'The Guild of Salt holds the deepest trade secrets of the eastern shoals.',
    isFictional: true,
  },
  {
    id: 'lore_05',
    category: 'lore',
    categoryLabel: 'HEXARA LORE',
    text: 'Ancient stones carved with hexagonal runes still dot the southern coastline.',
    isFictional: true,
  },

  // CATEGORY C — STRATEGY TIPS
  {
    id: 'strat_01',
    category: 'strategy',
    categoryLabel: 'STRATEGY',
    text: 'A road is more than a path. It is a claim on the future.',
    isFictional: false,
  },
  {
    id: 'strat_02',
    category: 'strategy',
    categoryLabel: 'STRATEGY',
    text: 'Ports can turn an ordinary resource surplus into an unstoppable victory.',
    isFictional: false,
  },
  {
    id: 'strat_03',
    category: 'strategy',
    categoryLabel: 'STRATEGY',
    text: 'Diversify your numbers during setup so dry dice streaks never stall your turns.',
    isFictional: false,
  },
  {
    id: 'strat_04',
    category: 'strategy',
    categoryLabel: 'STRATEGY',
    text: 'Controlling 6 and 8 tiles gives you the highest mathematical resource output.',
    isFictional: false,
  },
  {
    id: 'strat_05',
    category: 'strategy',
    categoryLabel: 'STRATEGY',
    text: 'Saving a Knight card allows you to immediately neutralize the Robber on your turn.',
    isFictional: false,
  },

  // CATEGORY D — GAME FACTS
  {
    id: 'gfact_01',
    category: 'game_fact',
    categoryLabel: 'DID YOU KNOW?',
    text: 'The standard Hexara archipelago contains exactly 19 terrain hexes.',
    isFictional: false,
  },
  {
    id: 'gfact_02',
    category: 'game_fact',
    categoryLabel: 'DID YOU KNOW?',
    text: 'The Robber halts all production on its hex until a player rolls a 7 or plays a Knight.',
    isFictional: false,
  },
  {
    id: 'gfact_03',
    category: 'game_fact',
    categoryLabel: 'DID YOU KNOW?',
    text: 'Rolling a 7 forces any captain holding 8 or more resource cards to discard half.',
    isFictional: false,
  },
  {
    id: 'gfact_04',
    category: 'game_fact',
    categoryLabel: 'DID YOU KNOW?',
    text: 'Longest Road requires an unbroken chain of at least 5 road segments to claim.',
    isFictional: false,
  },
  {
    id: 'gfact_05',
    category: 'game_fact',
    categoryLabel: 'DID YOU KNOW?',
    text: 'Largest Army is awarded to the first captain who mobilizes 3 Knight development cards.',
    isFictional: false,
  },

  // CATEGORY E — MARITIME FACTS
  {
    id: 'mfact_01',
    category: 'maritime_fact',
    categoryLabel: 'MARITIME HISTORY',
    text: 'Early navigators measured ship speed using a knotted rope cast astern—origin of the nautical knot.',
    isFictional: false,
  },
  {
    id: 'mfact_02',
    category: 'maritime_fact',
    categoryLabel: 'MARITIME HISTORY',
    text: '"Starboard" comes from the Old Norse "stýriborð", referring to the right-side steering oar.',
    isFictional: false,
  },
  {
    id: 'mfact_03',
    category: 'maritime_fact',
    categoryLabel: 'MARITIME HISTORY',
    text: 'The magnetic compass was first adopted for open ocean navigation in the 11th century.',
    isFictional: false,
  },

  // CATEGORY F — FUN FACTS (Hexagons, Math, Probability)
  {
    id: 'ffact_01',
    category: 'fun_fact',
    categoryLabel: 'HEX MATHEMATICS',
    text: 'Hexagons are the most mathematically efficient shape for tiling a surface with minimal perimeter.',
    isFictional: false,
  },
  {
    id: 'ffact_02',
    category: 'fun_fact',
    categoryLabel: 'PROBABILITY',
    text: 'With two six-sided dice, 7 is the most probable sum, occurring in 6 of 36 roll combinations (16.67%).',
    isFictional: false,
  },
  {
    id: 'ffact_03',
    category: 'fun_fact',
    categoryLabel: 'PROBABILITY',
    text: 'Numbers 2 and 12 each have only a 1 in 36 chance (2.78%) of being rolled.',
    isFictional: false,
  },

  // CATEGORY G — PLAYER TIPS
  {
    id: 'tip_01',
    category: 'player_tip',
    categoryLabel: "CAPTAIN'S TIP",
    text: 'Upgrading a settlement to a City doubles your resource yield on that intersection.',
    isFictional: false,
  },
  {
    id: 'tip_02',
    category: 'player_tip',
    categoryLabel: "CAPTAIN'S TIP",
    text: 'Settlements must strictly maintain a distance of at least two edges from any existing settlement.',
    isFictional: false,
  },
  {
    id: 'tip_03',
    category: 'player_tip',
    categoryLabel: "CAPTAIN'S TIP",
    text: 'Specialized 2:1 ports allow you to trade two of a specific resource for any one desired card.',
    isFictional: false,
  },
  {
    id: 'tip_04',
    category: 'player_tip',
    categoryLabel: "CAPTAIN'S TIP",
    text: 'Development cards cannot be played on the same turn they were bought, except Victory Points.',
    isFictional: false,
  },

  // CATEGORY H — WORLD BUILDING & COMMUNITY
  {
    id: 'world_01',
    category: 'world_building',
    categoryLabel: 'HEXARA FLAVOUR',
    text: 'Watch the gulls at dawn; seasoned captains know they wheel over the richest trade currents.',
    isFictional: true,
  },
  {
    id: 'world_02',
    category: 'world_building',
    categoryLabel: 'HEXARA FLAVOUR',
    text: 'When twilight falls over the harbor, the tavern dice click until the morning bell.',
    isFictional: true,
  },
];

/**
 * Creates a non-repeating message provider for the session.
 */
export class LoadingMessageDeck {
  private pool: LoadingMessage[] = [];
  private history: string[] = [];

  constructor() {
    this.resetDeck();
  }

  private resetDeck() {
    // Shuffle all messages using Fisher-Yates
    const copy = [...LOADING_MESSAGES];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    this.pool = copy;
  }

  public getNext(): LoadingMessage {
    if (this.pool.length === 0) {
      this.resetDeck();
      // Ensure we don't immediately repeat the last message
      if (this.history.length > 0 && this.pool[0].id === this.history[this.history.length - 1]) {
        const first = this.pool.shift()!;
        this.pool.push(first);
      }
    }
    const nextMsg = this.pool.shift()!;
    this.history.push(nextMsg.id);
    if (this.history.length > 20) {
      this.history.shift();
    }
    return nextMsg;
  }
}
