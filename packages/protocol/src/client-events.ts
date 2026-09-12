export const CLIENT_EVENTS = {
  // Lobby Events
  CREATE_GAME: 'client:create_game',
  JOIN_GAME: 'client:join_game',
  LEAVE_GAME: 'client:leave_game',
  SET_READY: 'client:set_ready',
  SET_COLOR: 'client:set_color',
  ADD_AI: 'client:add_ai',
  KICK_SEAT: 'client:kick_seat',
  START_GAME: 'client:start_game',

  // Game Action Events
  ROLL_DICE: 'client:roll_dice',
  BUILD_ROAD: 'client:build_road',
  BUILD_SETTLEMENT: 'client:build_settlement',
  BUILD_CITY: 'client:build_city',
  MOVE_ROBBER: 'client:move_robber',
  DISCARD_RESOURCES: 'client:discard_resources',
  STEAL_RESOURCE: 'client:steal_resource',
  BUY_DEV_CARD: 'client:buy_dev_card',
  PLAY_DEV_CARD: 'client:play_dev_card',
  TRADE_BANK: 'client:trade_bank',
  TRADE_MARITIME: 'client:trade_maritime',
  TRADE_PROPOSE: 'client:trade_propose',
  TRADE_ACCEPT: 'client:trade_accept',
  TRADE_CANCEL: 'client:trade_cancel',
  END_TURN: 'client:end_turn',
  SEND_CHAT: 'client:send_chat',
  REMATCH_VOTE: 'client:rematch_vote',
} as const;

export type ClientEventName = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
