import { PLAYER_COLORS } from '@hexara/shared';
import {
  ServerLobbySeat,
  ServerLobbySettings,
  ServerLobbyStatePayload,
} from '@hexara/protocol';
import { generateUniqueRoomCode } from './roomCodeGenerator.js';

export interface Lobby {
  code: string;
  hostId: string;
  seats: ServerLobbySeat[];
  settings: ServerLobbySettings;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

const AI_PERSONAS = [
  { id: 'ai_1', username: 'Candamir (Bot)', isAi: true },
  { id: 'ai_2', username: 'Louis (Bot)', isAi: true },
  { id: 'ai_3', username: 'William (Bot)', isAi: true },
];

export class LobbyManager {
  private lobbies = new Map<string, Lobby>();
  private playerToLobbyCode = new Map<string, string>();

  isCodeTaken(code: string): boolean {
    return this.lobbies.has(code.toUpperCase());
  }

  getLobby(code: string): Lobby | undefined {
    return this.lobbies.get(code.toUpperCase());
  }

  getLobbyByPlayerId(playerId: string): Lobby | undefined {
    const code = this.playerToLobbyCode.get(playerId);
    if (!code) return undefined;
    return this.lobbies.get(code);
  }

  createLobby(
    host: { playerId: string; username: string },
    settings: ServerLobbySettings,
    preferredCode?: string
  ): Lobby {
    // If player is in existing lobby, leave first
    const existingCode = this.playerToLobbyCode.get(host.playerId);
    if (existingCode) {
      this.leaveLobby(existingCode, host.playerId);
    }

    const cleanPreferred = preferredCode?.trim().toUpperCase();
    const code =
      cleanPreferred && cleanPreferred.length >= 4 && !this.isCodeTaken(cleanPreferred)
        ? cleanPreferred
        : generateUniqueRoomCode((c) => this.isCodeTaken(c));
    const hostSeat: ServerLobbySeat = {
      playerId: host.playerId,
      username: host.username,
      color: PLAYER_COLORS[0],
      ready: true, // Host is ready by default
      isAi: false,
      isConnected: true,
    };

    const lobby: Lobby = {
      code,
      hostId: host.playerId,
      seats: [hostSeat],
      settings: {
        ...settings,
        maxPlayers: settings.maxPlayers === 3 ? 3 : 4,
        targetVictoryPoints: settings.targetVictoryPoints || 10,
        scenarioId: settings.scenarioId || 'first_island',
        turnDurationSeconds: settings.turnDurationSeconds || 60,
      },
      status: 'waiting',
      createdAt: Date.now(),
    };

    this.lobbies.set(code, lobby);
    this.playerToLobbyCode.set(host.playerId, code);

    return lobby;
  }

  joinLobby(
    code: string,
    player: { playerId: string; username: string }
  ): { success: boolean; lobby?: Lobby; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (lobby.status !== 'waiting') {
      // If already playing, check if this is an existing player reconnecting
      const existingSeat = lobby.seats.find((s) => s.playerId === player.playerId);
      if (existingSeat) {
        existingSeat.isConnected = true;
        this.playerToLobbyCode.set(player.playerId, formattedCode);
        return { success: true, lobby };
      }
      return { success: false, error: 'GAME_ALREADY_STARTED' };
    }

    // Check if player is already seated
    const existingIndex = lobby.seats.findIndex((s) => s.playerId === player.playerId);
    if (existingIndex !== -1) {
      lobby.seats[existingIndex].isConnected = true;
      lobby.seats[existingIndex].username = player.username;
      this.playerToLobbyCode.set(player.playerId, formattedCode);
      return { success: true, lobby };
    }

    // Capacity check
    if (lobby.seats.length >= lobby.settings.maxPlayers) {
      return { success: false, error: 'ROOM_FULL' };
    }

    const nextColorIndex = lobby.seats.length % PLAYER_COLORS.length;
    const newSeat: ServerLobbySeat = {
      playerId: player.playerId,
      username: player.username,
      color: PLAYER_COLORS[nextColorIndex],
      ready: false,
      isAi: false,
      isConnected: true,
    };

    lobby.seats.push(newSeat);
    this.playerToLobbyCode.set(player.playerId, formattedCode);

    return { success: true, lobby };
  }

  leaveLobby(
    code: string,
    playerId: string
  ): { success: boolean; lobby?: Lobby; roomClosed?: boolean; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    this.playerToLobbyCode.delete(playerId);

    if (lobby.status === 'playing') {
      // Mark disconnected if in-game
      const seat = lobby.seats.find((s) => s.playerId === playerId);
      if (seat) {
        seat.isConnected = false;
      }
      return { success: true, lobby, roomClosed: false };
    }

    // If waiting in lobby: remove seat
    lobby.seats = lobby.seats.filter((s) => s.playerId !== playerId);

    if (lobby.seats.length === 0) {
      // No one left, delete lobby
      this.lobbies.delete(formattedCode);
      return { success: true, roomClosed: true };
    }

    // If host left, assign new host to next player
    if (lobby.hostId === playerId) {
      lobby.hostId = lobby.seats[0].playerId;
      lobby.seats[0].ready = true;
    }

    // Re-assign colors based on seat index
    lobby.seats.forEach((seat, idx) => {
      seat.color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    });

    return { success: true, lobby, roomClosed: false };
  }

  setReady(
    code: string,
    playerId: string,
    ready: boolean
  ): { success: boolean; lobby?: Lobby; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    const seat = lobby.seats.find((s) => s.playerId === playerId);
    if (!seat) {
      return { success: false, error: 'NOT_IN_ROOM' };
    }

    seat.ready = ready;
    return { success: true, lobby };
  }

  setColor(
    code: string,
    playerId: string,
    color: string
  ): { success: boolean; lobby?: Lobby; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (lobby.status !== 'waiting') {
      return { success: false, error: 'GAME_ALREADY_STARTED' };
    }

    const seat = lobby.seats.find((s) => s.playerId === playerId);
    if (!seat) {
      return { success: false, error: 'NOT_IN_ROOM' };
    }

    // Check if another seat already picked this color
    const existingTaken = lobby.seats.find(
      (s) => s.playerId !== playerId && s.color.toLowerCase() === color.toLowerCase()
    );
    if (existingTaken) {
      return { success: false, error: 'COLOR_ALREADY_TAKEN' };
    }

    seat.color = color;
    return { success: true, lobby };
  }

  addAi(
    code: string,
    hostPlayerId: string
  ): { success: boolean; lobby?: Lobby; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (lobby.hostId !== hostPlayerId) {
      return { success: false, error: 'HOST_ONLY_ACTION' };
    }

    if (lobby.status !== 'waiting') {
      return { success: false, error: 'GAME_ALREADY_STARTED' };
    }

    if (lobby.seats.length >= lobby.settings.maxPlayers) {
      return { success: false, error: 'ROOM_FULL' };
    }

    const aiCount = lobby.seats.filter((s) => s.isAi).length;
    const persona = AI_PERSONAS[aiCount % AI_PERSONAS.length];
    const aiId = `ai_${aiCount + 1}`;

    // Find first unused color
    const usedColors = new Set(lobby.seats.map((s) => s.color));
    const availableColor = PLAYER_COLORS.find((c) => !usedColors.has(c)) || PLAYER_COLORS[lobby.seats.length % PLAYER_COLORS.length];

    lobby.seats.push({
      playerId: aiId,
      username: persona.username,
      color: availableColor,
      ready: true,
      isAi: true,
      isConnected: true,
    });

    return { success: true, lobby };
  }

  kickSeat(
    code: string,
    hostPlayerId: string,
    seatPlayerId: string
  ): { success: boolean; lobby?: Lobby; kickedPlayerId?: string; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (lobby.hostId !== hostPlayerId) {
      return { success: false, error: 'HOST_ONLY_ACTION' };
    }

    if (seatPlayerId === hostPlayerId) {
      return { success: false, error: 'CANNOT_KICK_HOST' };
    }

    const seatIndex = lobby.seats.findIndex((s) => s.playerId === seatPlayerId);
    if (seatIndex === -1) {
      return { success: false, error: 'SEAT_NOT_FOUND' };
    }

    lobby.seats.splice(seatIndex, 1);
    this.playerToLobbyCode.delete(seatPlayerId);

    // Reassign colors
    lobby.seats.forEach((seat, idx) => {
      seat.color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    });

    return { success: true, lobby, kickedPlayerId: seatPlayerId };
  }

  updateLobbySettings(
    code: string,
    hostPlayerId: string,
    updates: Partial<ServerLobbySettings>
  ): { success: boolean; lobby?: Lobby; error?: string } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);
    if (!lobby) return { success: false, error: 'ROOM_NOT_FOUND' };
    if (lobby.hostId !== hostPlayerId) return { success: false, error: 'HOST_ONLY_ACTION' };

    lobby.settings = {
      ...lobby.settings,
      ...updates,
    };
    return { success: true, lobby };
  }

  startGame(
    code: string,
    hostPlayerId: string
  ): {
    success: boolean;
    lobby?: Lobby;
    error?: string;
    players?: Array<{ id: string; username: string; isAi?: boolean }>;
  } {
    const formattedCode = code.toUpperCase();
    const lobby = this.lobbies.get(formattedCode);

    if (!lobby) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (lobby.hostId !== hostPlayerId) {
      return { success: false, error: 'HOST_ONLY_ACTION' };
    }

    if (lobby.status !== 'waiting') {
      return { success: false, error: 'GAME_ALREADY_STARTED' };
    }

    // Validate that all joined crew members are ready
    const unreadySeat = lobby.seats.find((s) => !s.isAi && !s.ready && s.playerId !== hostPlayerId);
    if (unreadySeat) {
      return { success: false, error: 'NOT_ALL_PLAYERS_READY' };
    }

    // Fill remaining seats with AI if solo or not enough human players
    const targetPlayerCount = lobby.settings.maxPlayers;
    const finalPlayers: Array<{ id: string; username: string; isAi?: boolean }> = [];

    // Add seated players
    for (const seat of lobby.seats) {
      finalPlayers.push({
        id: seat.playerId,
        username: seat.username,
        isAi: seat.isAi ?? false,
      });
    }

    // Fill remaining seats with AI personas
    let aiIndex = 0;
    while (finalPlayers.length < targetPlayerCount) {
      const persona = AI_PERSONAS[aiIndex % AI_PERSONAS.length];
      const aiId = `ai_${aiIndex + 1}`;
      finalPlayers.push({
        id: aiId,
        username: persona.username,
        isAi: true,
      });

      // Also add to lobby seats for consistency
      lobby.seats.push({
        playerId: aiId,
        username: persona.username,
        color: PLAYER_COLORS[lobby.seats.length % PLAYER_COLORS.length],
        ready: true,
        isAi: true,
        isConnected: true,
      });

      aiIndex++;
    }

    lobby.status = 'playing';

    return {
      success: true,
      lobby,
      players: finalPlayers,
    };
  }

  toPayload(lobby: Lobby): ServerLobbyStatePayload {
    return {
      code: lobby.code,
      hostId: lobby.hostId,
      seats: lobby.seats,
      settings: lobby.settings,
      status: lobby.status,
    };
  }
}
