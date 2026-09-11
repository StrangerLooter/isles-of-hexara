import {
  ResourceType,
  TerrainType,
  BuildingType,
  DevCardType,
  GamePhase,
  Harbor,
} from '@hexara/shared';

export type { ResourceType, TerrainType, BuildingType, DevCardType, GamePhase, Harbor };

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexTile {
  id: string;
  q: number;
  r: number;
  x: number;
  z: number;
  terrain: TerrainType;
  diceNumber: number | null;
  pips: number;
  vertexIds: string[];
  edgeIds: string[];
}

export interface Building {
  type: 'settlement' | 'city';
  playerId: string;
}

export interface Road {
  playerId: string;
}

export interface BoardVertex {
  id: string;
  x: number;
  z: number;
  hexIds: string[];
  adjacentVertexIds: string[];
  adjacentEdgeIds: string[];
  building: Building | null;
  harborId: string | null;
}

export interface BoardEdge {
  id: string;
  x: number;
  z: number;
  vertexIds: [string, string];
  hexIds: string[];
  adjacentEdgeIds: string[];
  road: Road | null;
}

export interface BoardState {
  hexes: Record<string, HexTile>;
  vertices: Record<string, BoardVertex>;
  edges: Record<string, BoardEdge>;
  harbors: Record<string, Harbor>;
  robberHexId: string;
}

export type ResourceInventory = Record<ResourceType, number>;

export interface PlayerState {
  id: string;
  username: string;
  color: string;
  victoryPoints: number;
  resources: ResourceInventory;
  roadsRemaining: number;
  settlementsRemaining: number;
  citiesRemaining: number;
  devCards: DevCardType[];
  boughtDevCardsThisTurn?: DevCardType[];
  hasPlayedDevCardThisTurn?: boolean;
  playedKnights: number;
  longestRoad: boolean;
  largestArmy: boolean;
  controlledHarbors: string[];
  isReady: boolean;
  isConnected: boolean;
  isAi?: boolean;
}

export interface DiceState {
  dice1: number;
  dice2: number;
  total: number;
  rolled: boolean;
}

export interface ActiveTrade {
  id: string;
  fromPlayerId: string;
  offer: Partial<ResourceInventory>;
  request: Partial<ResourceInventory>;
  acceptedBy: string[];
}

export interface GameState {
  id: string;
  version: number;
  phase: GamePhase;
  turnNumber: number;
  currentPlayerIndex: number;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  board: BoardState;
  dice: DiceState;
  robberHexId: string;
  resourceSupply: ResourceInventory;
  developmentDeck: DevCardType[];
  playedDevelopmentCards: { card: DevCardType; playerId: string; turnPlayed: number }[];
  longestRoadOwnerId: string | null;
  largestArmyOwnerId: string | null;
  longestRoadLength: number;
  pendingDiscards: Record<string, number>;
  robberEligibleVictimIds: string[];
  returnPhaseAfterRobber?: GamePhase;
  activeTrade: ActiveTrade | null;
  winnerId: string | null;
  targetVictoryPoints?: number;
  scenarioId?: string;
  logs: string[];
  createdAt: number;
  updatedAt: number;
}

export type GameAction =
  | { type: 'ROLL_DICE'; playerId: string }
  | { type: 'BUILD_ROAD'; playerId: string; edgeId: string }
  | { type: 'BUILD_SETTLEMENT'; playerId: string; vertexId: string }
  | { type: 'BUILD_CITY'; playerId: string; vertexId: string }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'MOVE_ROBBER'; playerId: string; hexId: string }
  | { type: 'STEAL_RESOURCE'; playerId: string; victimId: string }
  | { type: 'DISCARD_RESOURCES'; playerId: string; resources: Partial<ResourceInventory> }
  | { type: 'BUY_DEV_CARD'; playerId: string }
  | {
      type: 'PLAY_DEV_CARD';
      playerId: string;
      card: DevCardType;
      params?: {
        targetHexId?: string;
        victimId?: string;
        monopolyResource?: ResourceType;
        yearOfPlentyResources?: [ResourceType, ResourceType];
        roadBuildingEdges?: [string, string];
      };
    }
  | {
      type: 'TRADE_BANK';
      playerId: string;
      giving: ResourceType;
      receiving: ResourceType;
    }
  | {
      type: 'TRADE_MARITIME';
      playerId: string;
      giving: ResourceType;
      receiving: ResourceType;
    }
  | {
      type: 'TRADE_PROPOSE';
      playerId: string;
      offer: Partial<ResourceInventory>;
      request: Partial<ResourceInventory>;
    }
  | {
      type: 'TRADE_ACCEPT';
      playerId: string;
    }
  | {
      type: 'TRADE_CANCEL';
      playerId: string;
    };

