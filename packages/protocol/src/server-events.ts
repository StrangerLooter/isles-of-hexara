export const SERVER_EVENTS = {
  GAME_STATE: 'server:game_state',
  ERROR: 'server:error',
  CHAT_MESSAGE: 'server:chat_message',
  PLAYER_JOINED: 'server:player_joined',
} as const;

export type ServerEventName = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

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
