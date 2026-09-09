export const RESOURCE_TYPES = ['lumber', 'brick', 'wool', 'grain', 'ore'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const TERRAIN_TYPES = [
  'forest',
  'hills',
  'pasture',
  'fields',
  'mountains',
  'desert',
  'water',
] as const;
export type TerrainType = (typeof TERRAIN_TYPES)[number];

export const BUILDING_TYPES = ['road', 'settlement', 'city'] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

export const DEV_CARD_TYPES = [
  'knight',
  'victory_point',
  'road_building',
  'year_of_plenty',
  'monopoly',
] as const;
export type DevCardType = (typeof DEV_CARD_TYPES)[number];

export const HARBOR_TYPES = ['GENERIC_3_TO_1', 'RESOURCE_2_TO_1'] as const;
export type HarborType = (typeof HARBOR_TYPES)[number];

export interface Harbor {
  id: string;
  type: HarborType;
  resourceType: ResourceType | null;
  adjacentIntersectionIds: [string, string];
}

export const GAME_PHASES = [
  'WAITING',
  'SETUP_ROUND_1',
  'SETUP_ROUND_2',
  'ROLLING',
  'ROBBER_DISCARD',
  'ROBBER_MOVE',
  'ROBBER_STEAL',
  'MAIN',
  'FINISHED',
] as const;
export type GamePhase = (typeof GAME_PHASES)[number];

export const PLAYER_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'] as const; // Amber, Sapphire, Emerald, Ruby
export const PLAYER_COLOR_NAMES = ['Amber', 'Sapphire', 'Emerald', 'Ruby'] as const;

export type ResourceCost = Partial<Record<ResourceType, number>>;

export const BUILDING_COSTS: Record<BuildingType | 'dev_card', ResourceCost> = {
  road: { lumber: 1, brick: 1 },
  settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { grain: 2, ore: 3 },
  dev_card: { wool: 1, grain: 1, ore: 1 },
};

export const TERRAIN_TO_RESOURCE: Record<TerrainType, ResourceType | null> = {
  forest: 'lumber',
  hills: 'brick',
  pasture: 'wool',
  fields: 'grain',
  mountains: 'ore',
  desert: null,
  water: null,
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  forest: '#2d6a4f',
  hills: '#b05d3b',
  pasture: '#70e000',
  fields: '#f4a261',
  mountains: '#6c757d',
  desert: '#e9c46a',
  water: '#1d3557',
};

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const VICTORY_POINTS_TARGET = 10;

export const INITIAL_PIECE_LIMITS = {
  roads: 15,
  settlements: 5,
  cities: 4,
} as const;

export const BANK_CARDS_PER_RESOURCE = 19; // 95 total resource cards
export const TOTAL_DEV_CARDS_COUNT = 25;

export const DEV_CARD_DECK_COUNTS: Record<DevCardType, number> = {
  knight: 14,
  victory_point: 5,
  road_building: 2,
  year_of_plenty: 2,
  monopoly: 2,
};

export const BOARD_RADIUS = 2; // 19 hex tiles total
