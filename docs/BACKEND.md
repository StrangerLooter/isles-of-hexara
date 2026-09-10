# 🌊 Isles of Hexara — Authoritative Multiplayer Backend Documentation

## 1. Architecture

The Isles of Hexara multiplayer backend is built with **Fastify**, **Socket.IO 4**, and **Zod**, communicating directly with the deterministic rules engine in `@hexara/game-core`.

```
┌─────────────────────────────────┐
│     Client (React + 3D Canvas)  │
└───────────────┬─────────────────┘
                │ Socket Intents (e.g. client:build_road)
                ▼
┌─────────────────────────────────┐
│     Socket.IO Handshake Auth    │ ◄── JWT Token (HS256)
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│       Rate Limiting Check       │ ◄── Max 20 actions / 10s, 5 chats / 10s
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│     Action Registry (Zod)       │ ◄── Schema validation & turn ownership check
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  @hexara/game-core Game Engine  │ ◄── executeGameAction(state, action)
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│      Authoritative Broadcast    │ ──► io.to('game:CODE').emit('server:game_state', newState)
└─────────────────────────────────┘
```

---

## 2. Event Contract Table

### Client Events (`@hexara/protocol`)

| Event Name | Schema Payload | Requires Turn | Description |
| :--- | :--- | :--- | :--- |
| `client:create_game` | `{ scenarioId, scenarioName?, targetVictoryPoints, maxPlayers, mode, seed? }` | No | Creates a new lobby with a 6-char room code |
| `client:join_game` | `{ code?, gameId?, playerId?, username? }` | No | Joins an existing lobby or reconnects to an active match |
| `client:leave_game` | `{ code?, gameId? }` | No | Leaves the lobby or marks disconnected |
| `client:set_ready` | `{ ready: boolean, code? }` | No | Toggles player ready status in lobby |
| `client:kick_seat` | `{ seatPlayerId, code? }` | No | Host kicks a seated player |
| `client:start_game` | `{ code? }` | No | Host starts match; fills empty seats with AI personas |
| `client:roll_dice` | `{ gameId? }` | Yes | Rolls the 2d6 dice |
| `client:build_road` | `{ edgeId, gameId? }` | Yes (in normal play) | Builds a road on the specified edge |
| `client:build_settlement` | `{ vertexId, gameId? }` | Yes (in normal play) | Builds a settlement on the specified vertex |
| `client:build_city` | `{ vertexId, gameId? }` | Yes | Upgrades an existing settlement to a city |
| `client:move_robber` | `{ hexId, gameId? }` | Yes | Moves robber to non-desert hex |
| `client:discard_resources` | `{ resources: { ... }, gameId? }` | No (discards phase) | Discards half of hand when holding >7 cards on a 7-roll |
| `client:steal_resource` | `{ victimId, gameId? }` | Yes | Steals a random resource card from victim |
| `client:buy_dev_card` | `{ gameId? }` | Yes | Purchases a development card |
| `client:play_dev_card` | `{ card, params?, gameId? }` | Yes | Plays knight, year of plenty, monopoly, or road building |
| `client:trade_bank` | `{ giving, receiving, gameId? }` | Yes | 4:1 bank trade |
| `client:trade_maritime` | `{ giving, receiving, gameId? }` | Yes | 3:1 generic or 2:1 harbor trade |
| `client:trade_propose` | `{ offer, request, gameId? }` | Yes | Proposes a trade offer to all other players |
| `client:trade_accept` | `{ gameId? }` | No | Non-turn player accepts trade proposal |
| `client:trade_cancel` | `{ gameId? }` | No | Cancels active trade proposal |
| `client:end_turn` | `{ gameId? }` | Yes | Passes turn to next player |
| `client:send_chat` | `{ message, gameId? }` | No | Sends room-scoped chat message |

---

### Server Events (`@hexara/protocol`)

| Event Name | Payload Shape | Description |
| :--- | :--- | :--- |
| `server:lobby_state` | `{ code, hostId, seats, settings, status }` | Broadcast on lobby changes |
| `server:game_state` | Authoritative `GameState` object | Broadcast on every state transition |
| `server:game_sync` | `{ state: GameState }` | Targeted resync to reconnecting player |
| `server:player_joined` | `{ playerId, username }` | Presence notification when player joins |
| `server:player_left` | `{ playerId, reason? }` | Presence notification when player leaves/disconnects |
| `server:trade_update` | `{ activeTrade }` | Real-time update for player trade offers |
| `server:turn_expired` | `{ playerId }` | Emitted on turn timer expiration |
| `server:chat_message` | `{ playerId, username, message, timestamp }` | Broadcast chat messages |
| `server:error` | `{ code: string, message: string }` | Structured error messages (`INVALID_PAYLOAD`, `NOT_YOUR_TURN`, etc.) |

---

## 3. Reconnection & Disconnect Policy

1. When a client socket disconnects unexpectedly during an active game:
   - Player's `isConnected` is set to `false`.
   - `server:player_left` is broadcast to the room.
   - A **60-second grace timer** is started for that player.
2. If the player reconnects with their authenticated JWT within 60 seconds:
   - Grace timer is cancelled.
   - `isConnected` is restored to `true`.
   - A targeted `server:game_sync` event sends the full authoritative `GameState` to the player.
3. If the 60-second grace timer expires without reconnection:
   - The seat is converted to an autonomous AI controller (`isAi = true`).
   - The game continues uninterrupted without stranding the remaining players.

---

## 4. Autonomous Server AI Controller

The server includes an `AiController` covering every game phase:
- **Setup Phases (`SETUP_ROUND_1` & `SETUP_ROUND_2`)**: Evaluates vertex pip yields and resource variety; attaches roads toward optimal expansion paths.
- **Rolling Phase**: Rolls dice.
- **Robber Discard Phase**: Automatically discards excess cards when hand > 7.
- **Robber Move Phase**: Blocks opponents' highest-producing hexes while avoiding friendly hexes.
- **Robber Steal Phase**: Steals from the richest victim on the blocked hex.
- **Main Phase**: Prioritizes city upgrades, settlement construction, dev card purchases, road expansion, bank/harbor trades, and knight card plays.
- **Turn Watchdog**: A 30-second per-room watchdog ensures rooms never stall on AI turns.

---

## 5. Storage Modes

- **MongoDB Mode**: When `MONGODB_URI` is provided, user accounts, profiles, and game records are saved in MongoDB collections.
- **In-Memory Mode**: When running without external infrastructure, the server automatically defaults to high-performance in-memory repositories with full zero-docker compatibility.
