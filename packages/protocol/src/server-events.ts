import type { ActiveTrade, GameState } from '@hexara/game-core';

export const SERVER_EVENTS = {
  LOBBY_STATE: 'server:lobby_state',
  GAME_STATE: 'server:game_state',
  GAME_SYNC: 'server:game_sync',
  PLAYER_JOINED: 'server:player_joined',
  PLAYER_LEFT: 'server:player_left',
  TRADE_UPDATE: 'server:trade_update',
  TURN_EXPIRED: 'server:turn_expired',
  TURN_TIMER: 'server:turn_timer',
  ERROR: 'server:error',
  CHAT_MESSAGE: 'server:chat_message',
  COUNTDOWN: 'server:countdown',
} as const;

export type ServerEventName = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

export interface ServerLobbySeat {
  playerId: string;
  username: string;
  color: string;
  ready: boolean;
  isAi: boolean;
  isConnected: boolean;
}

export interface ServerLobbySettings {
  scenarioId: string;
  scenarioName?: string;
  targetVictoryPoints: number;
  maxPlayers: 3 | 4;
  mode: 'solo' | 'online';
  seed?: number;
  turnDurationSeconds?: number;
}

export interface ServerLobbyStatePayload {
  code: string;
  hostId: string;
  seats: ServerLobbySeat[];
  settings: ServerLobbySettings;
  status: 'waiting' | 'playing' | 'finished';
}

export interface ServerGameSyncPayload {
  state: GameState;
}

export interface ServerPlayerJoinedPayload {
  playerId: string;
  username: string;
}

export interface ServerPlayerLeftPayload {
  playerId: string;
  reason?: string;
}

export interface ServerTradeUpdatePayload {
  activeTrade: ActiveTrade | null;
}

export interface ServerTurnExpiredPayload {
  playerId: string;
}

export interface ServerTurnTimerPayload {
  currentPlayerId: string;
  turnDeadline: number;
  turnId: number;
  durationSeconds: number;
}

export interface ServerErrorPayload {
  code: string;
  message: string;
}

export interface ServerChatPayload {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}

export interface ServerCountdownPayload {
  count: number;
  message?: string;
}
