import { VICTORY_POINTS_TARGET } from '@hexara/shared';
import { GameState } from '../types/index.js';

export function calculatePlayerVictoryPoints(
  gameState: GameState,
  playerId: string
): number {
  const player = gameState.players[playerId];
  if (!player) return 0;

  let points = 0;

  // Points from settlements (1) and cities (2) on the board
  for (const vertex of Object.values(gameState.board.vertices)) {
    if (vertex.building && vertex.building.playerId === playerId) {
      points += vertex.building.type === 'city' ? 2 : 1;
    }
  }

  // Bonus for longest road
  if (player.longestRoad) {
    points += 2;
  }

  // Bonus for largest army
  if (player.largestArmy) {
    points += 2;
  }

  // Points from victory point dev cards
  const vpCards = player.devCards.filter((card) => card === 'victory_point').length;
  points += vpCards;

  return points;
}

export function checkVictoryCondition(gameState: GameState): string | null {
  for (const [pid, player] of Object.entries(gameState.players)) {
    const totalPoints = calculatePlayerVictoryPoints(gameState, pid);
    player.victoryPoints = totalPoints;
    const required = gameState.targetVictoryPoints ?? VICTORY_POINTS_TARGET;
    if (totalPoints >= required) {
      return pid;
    }
  }
  return null;
}
