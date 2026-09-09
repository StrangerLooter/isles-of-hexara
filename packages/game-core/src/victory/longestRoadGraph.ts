import { BoardState } from '../types/index.js';

interface NodeEdgeMap {
  [vertexId: string]: string[]; // vertexId -> edgeIds
}

/**
 * Calculates the longest continuous road trail for a given player using edge-level DFS backtracking.
 * Properly accounts for:
 * - Branches (takes the single longest trail)
 * - Cycles (never reuses the same road edge in a trail)
 * - Opponent buildings (interrupts road traversal THROUGH that vertex, though the road may terminate there)
 */
export function calculateLongestRoadForPlayer(
  board: BoardState,
  playerId: string
): number {
  // 1. Collect all edge IDs owned by this player
  const playerEdgeIds: string[] = [];
  for (const [edgeId, edge] of Object.entries(board.edges)) {
    if (edge.road && edge.road.playerId === playerId) {
      playerEdgeIds.push(edgeId);
    }
  }

  if (playerEdgeIds.length === 0) return 0;

  // 2. Build adjacency graph of player's roads
  // Map vertexId -> list of player's road edge IDs touching this vertex
  const vertexToEdges: NodeEdgeMap = {};

  for (const edgeId of playerEdgeIds) {
    const edge = board.edges[edgeId];
    const [v1, v2] = edge.vertexIds;

    if (!vertexToEdges[v1]) vertexToEdges[v1] = [];
    if (!vertexToEdges[v2]) vertexToEdges[v2] = [];

    vertexToEdges[v1].push(edgeId);
    vertexToEdges[v2].push(edgeId);
  }

  let maxTrailLength = 0;
  const visitedEdges = new Set<string>();

  // Helper DFS function
  function dfs(currentVertexId: string, currentLength: number): void {
    if (currentLength > maxTrailLength) {
      maxTrailLength = currentLength;
    }

    // Check if current vertex is blocked by an OPPONENT's settlement/city
    const vertex = board.vertices[currentVertexId];
    if (
      vertex &&
      vertex.building &&
      vertex.building.playerId !== playerId
    ) {
      // Traversal THROUGH this vertex is blocked by opponent
      return;
    }

    const candidateEdges = vertexToEdges[currentVertexId] || [];

    for (const edgeId of candidateEdges) {
      if (!visitedEdges.has(edgeId)) {
        visitedEdges.add(edgeId);

        // Find the other vertex at the other end of this edge
        const edge = board.edges[edgeId];
        const nextVertexId =
          edge.vertexIds[0] === currentVertexId
            ? edge.vertexIds[1]
            : edge.vertexIds[0];

        dfs(nextVertexId, currentLength + 1);

        visitedEdges.delete(edgeId); // Backtrack
      }
    }
  }

  // Start DFS from every vertex in the player's road network
  const allTouchedVertices = Object.keys(vertexToEdges);
  for (const startVertexId of allTouchedVertices) {
    dfs(startVertexId, 0);
  }

  return maxTrailLength;
}

/**
 * Evaluates the Longest Road holder across all players according to official Catan rules:
 * - Minimum threshold: 5 road segments
 * - Card transfers if another player STRICTLY exceeds the current holder's length
 * - If current owner's road is broken and tied for longest, they retain the card
 * - If current owner falls behind and 2+ opponents tie for the new highest, card is set aside
 */
export function evaluateLongestRoad(
  board: BoardState,
  playerIds: string[],
  currentOwnerId: string | null
): {
  newOwnerId: string | null;
  playerLengths: Record<string, number>;
} {
  const playerLengths: Record<string, number> = {};
  let maxLength = 0;

  for (const pid of playerIds) {
    const len = calculateLongestRoadForPlayer(board, pid);
    playerLengths[pid] = len;
    if (len > maxLength) {
      maxLength = len;
    }
  }

  if (maxLength < 5) {
    return { newOwnerId: null, playerLengths };
  }

  // Find all players with the maximum length
  const topPlayers = playerIds.filter((pid) => playerLengths[pid] === maxLength);

  if (currentOwnerId) {
    const currentOwnerLength = playerLengths[currentOwnerId] || 0;

    // If another player strictly beats current owner
    if (maxLength > currentOwnerLength && topPlayers.length === 1) {
      return { newOwnerId: topPlayers[0], playerLengths };
    }

    // If current owner is still among the top players (even tied)
    if (topPlayers.includes(currentOwnerId)) {
      return { newOwnerId: currentOwnerId, playerLengths };
    }

    // If current owner has been overtaken, but multiple opponents tie for new max, set card aside
    if (topPlayers.length > 1) {
      return { newOwnerId: null, playerLengths };
    }
  }

  // No previous owner, or clean new leader
  if (topPlayers.length === 1) {
    return { newOwnerId: topPlayers[0], playerLengths };
  }

  return { newOwnerId: null, playerLengths };
}
