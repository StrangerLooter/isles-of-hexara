export const CLIENT_EVENTS = {
  JOIN_GAME: 'client:join_game',
  ROLL_DICE: 'client:roll_dice',
  BUILD_ROAD: 'client:build_road',
  BUILD_SETTLEMENT: 'client:build_settlement',
  BUILD_CITY: 'client:build_city',
  MOVE_ROBBER: 'client:move_robber',
  TRADE_BANK: 'client:trade_bank',
  END_TURN: 'client:end_turn',
  SEND_CHAT: 'client:send_chat',
} as const;

export type ClientEventName = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
