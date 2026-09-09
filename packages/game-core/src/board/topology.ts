import { TerrainType, BOARD_RADIUS, Harbor, HarborType, ResourceType } from '@hexara/shared';
import { BoardEdge, BoardState, BoardVertex, HexTile } from '../types/index.js';

const HEX_RADIUS = 2.0; // Distance from center to vertex in 3D units

export function getPipCount(diceNumber: number | null): number {
  if (!diceNumber || diceNumber === 7) return 0;
  return 6 - Math.abs(7 - diceNumber);
}

/**
 * Checks if two hex tiles are adjacent in axial coordinates
 */
function areHexesAdjacent(h1: { q: number; r: number }, h2: { q: number; r: number }): boolean {
  const dq = h1.q - h2.q;
  const dr = h1.r - h2.r;
  return (
    (Math.abs(dq) === 1 && dr === 0) ||
    (dq === 0 && Math.abs(dr) === 1) ||
    (dq === 1 && dr === -1) ||
    (dq === -1 && dr === 1)
  );
}

export function generateBoardTopology(customSeed?: number): BoardState {
  const hexCoords: { q: number; r: number }[] = [];

  // Generate 19 axial coords for radius 2 (center + 2 concentric rings)
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
    const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
    for (let r = r1; r <= r2; r++) {
      hexCoords.push({ q, r });
    }
  }

  // Exact 19 standard terrain distribution
  const terrains: TerrainType[] = [
    'forest',
    'forest',
    'forest',
    'forest',
    'hills',
    'hills',
    'hills',
    'pasture',
    'pasture',
    'pasture',
    'pasture',
    'fields',
    'fields',
    'fields',
    'fields',
    'mountains',
    'mountains',
    'mountains',
    'desert',
  ];

  // Exact 18 number tokens
  const numbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

  let s = customSeed !== undefined ? customSeed : Math.floor(Math.random() * 233280);
  const rng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const shuffledTerrains = [...terrains];
  for (let i = shuffledTerrains.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledTerrains[i], shuffledTerrains[j]] = [shuffledTerrains[j], shuffledTerrains[i]];
  }

  // Shuffle numbers, ensuring 6 and 8 are NEVER adjacent
  let shuffledNumbers = [...numbers];
  let validNumberArrangement = false;
  let attempts = 0;

  while (!validNumberArrangement && attempts < 100) {
    attempts++;
    // Shuffle
    for (let i = shuffledNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffledNumbers[i], shuffledNumbers[j]] = [shuffledNumbers[j], shuffledNumbers[i]];
    }

    // Verify red numbers (6 and 8) are not adjacent
    let redAdjacent = false;
    let nIdx = 0;
    const assignedTokens: { coord: { q: number; r: number }; num: number }[] = [];

    for (let i = 0; i < hexCoords.length; i++) {
      if (shuffledTerrains[i] !== 'desert') {
        const num = shuffledNumbers[nIdx++];
        if (num === 6 || num === 8) {
          for (const prev of assignedTokens) {
            if ((prev.num === 6 || prev.num === 8) && areHexesAdjacent(prev.coord, hexCoords[i])) {
              redAdjacent = true;
              break;
            }
          }
        }
        assignedTokens.push({ coord: hexCoords[i], num });
      }
      if (redAdjacent) break;
    }

    if (!redAdjacent) {
      validNumberArrangement = true;
    }
  }

  const hexes: Record<string, HexTile> = {};
  const vertices: Record<string, BoardVertex> = {};
  const edges: Record<string, BoardEdge> = {};

  const vertexKeyMap = new Map<string, string>(); // Quantized key to vertexId
  let vertexCounter = 0;
  let numberIndex = 0;
  let robberHexId = '';

  for (let i = 0; i < hexCoords.length; i++) {
    const { q, r } = hexCoords[i];
    const hexId = `hex_${q}_${r}`;
    const terrain = shuffledTerrains[i];

    // Cartesian center (pointy-topped hex orientation)
    const x = HEX_RADIUS * Math.sqrt(3) * (q + r / 2);
    const z = HEX_RADIUS * (3 / 2) * r;

    let diceNumber: number | null = null;
    let pips = 0;

    if (terrain === 'desert') {
      robberHexId = hexId;
    } else {
      diceNumber = shuffledNumbers[numberIndex++];
      pips = getPipCount(diceNumber);
    }

    const hexVertexIds: string[] = [];

    // Exactly 6 vertices per hex
    for (let vIdx = 0; vIdx < 6; vIdx++) {
      const angle = Math.PI / 6 + (vIdx * Math.PI) / 3;
      const vx = Number((x + HEX_RADIUS * Math.cos(angle)).toFixed(2));
      const vz = Number((z + HEX_RADIUS * Math.sin(angle)).toFixed(2));
      const vKey = `${vx}_${vz}`;

      let vId = vertexKeyMap.get(vKey);
      if (!vId) {
        vId = `v_${vertexCounter++}`;
        vertexKeyMap.set(vKey, vId);
        vertices[vId] = {
          id: vId,
          x: vx,
          z: vz,
          hexIds: [],
          adjacentVertexIds: [],
          adjacentEdgeIds: [],
          building: null,
          harborId: null,
        };
      }

      if (!vertices[vId].hexIds.includes(hexId)) {
        vertices[vId].hexIds.push(hexId);
      }
      hexVertexIds.push(vId);
    }

    const hexEdgeIds: string[] = [];

    // Exactly 6 edges (paths) per hex
    for (let eIdx = 0; eIdx < 6; eIdx++) {
      const v1Id = hexVertexIds[eIdx];
      const v2Id = hexVertexIds[(eIdx + 1) % 6];
      const sortedVertexPair: [string, string] = [v1Id, v2Id].sort() as [string, string];
      const edgeKey = `e_${sortedVertexPair[0]}_${sortedVertexPair[1]}`;

      if (!edges[edgeKey]) {
        const v1 = vertices[v1Id];
        const v2 = vertices[v2Id];
        edges[edgeKey] = {
          id: edgeKey,
          x: Number(((v1.x + v2.x) / 2).toFixed(2)),
          z: Number(((v1.z + v2.z) / 2).toFixed(2)),
          vertexIds: sortedVertexPair,
          hexIds: [hexId],
          adjacentEdgeIds: [],
          road: null,
        };

        // Connect vertices to each other
        if (!v1.adjacentVertexIds.includes(v2Id)) v1.adjacentVertexIds.push(v2Id);
        if (!v2.adjacentVertexIds.includes(v1Id)) v2.adjacentVertexIds.push(v1Id);

        // Connect vertices to this edge
        if (!v1.adjacentEdgeIds.includes(edgeKey)) v1.adjacentEdgeIds.push(edgeKey);
        if (!v2.adjacentEdgeIds.includes(edgeKey)) v2.adjacentEdgeIds.push(edgeKey);
      } else {
        if (!edges[edgeKey].hexIds.includes(hexId)) {
          edges[edgeKey].hexIds.push(hexId);
        }
      }

      hexEdgeIds.push(edgeKey);
    }

    hexes[hexId] = {
      id: hexId,
      q,
      r,
      x: Number(x.toFixed(2)),
      z: Number(z.toFixed(2)),
      terrain,
      diceNumber,
      pips,
      vertexIds: hexVertexIds,
      edgeIds: hexEdgeIds,
    };
  }

  // Populate adjacentEdgeIds for all edges
  for (const edge of Object.values(edges)) {
    const [v1Id, v2Id] = edge.vertexIds;
    const v1 = vertices[v1Id];
    const v2 = vertices[v2Id];
    const adjEdges = new Set<string>();

    v1.adjacentEdgeIds.forEach((e) => {
      if (e !== edge.id) adjEdges.add(e);
    });
    v2.adjacentEdgeIds.forEach((e) => {
      if (e !== edge.id) adjEdges.add(e);
    });

    edge.adjacentEdgeIds = Array.from(adjEdges);
  }

  // ============================================================
  // ATTACH 9 HARBORS TO COASTAL INTERSECTIONS
  // ============================================================
  // Coastal vertices have fewer than 3 adjacent hexes
  const coastalVertices = Object.values(vertices).filter((v) => v.hexIds.length < 3);

  // Find coastal edges (edges with exactly 1 adjacent hex)
  const coastalEdges = Object.values(edges).filter((e) => e.hexIds.length === 1);

  // Sort coastal edges by polar angle around board center (0,0) to place 9 harbors evenly
  coastalEdges.sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));

  const harborConfigs: { type: HarborType; resourceType: ResourceType | null }[] = [
    { type: 'GENERIC_3_TO_1', resourceType: null },
    { type: 'RESOURCE_2_TO_1', resourceType: 'grain' },
    { type: 'RESOURCE_2_TO_1', resourceType: 'ore' },
    { type: 'GENERIC_3_TO_1', resourceType: null },
    { type: 'RESOURCE_2_TO_1', resourceType: 'wool' },
    { type: 'GENERIC_3_TO_1', resourceType: null },
    { type: 'RESOURCE_2_TO_1', resourceType: 'lumber' },
    { type: 'RESOURCE_2_TO_1', resourceType: 'brick' },
    { type: 'GENERIC_3_TO_1', resourceType: null },
  ];

  const harbors: Record<string, Harbor> = {};
  const totalCoastal = coastalEdges.length;
  const step = Math.floor(totalCoastal / 9);

  for (let i = 0; i < 9; i++) {
    const edgeIdx = (i * step) % totalCoastal;
    const harborEdge = coastalEdges[edgeIdx];
    const harborId = `harbor_${i + 1}`;
    const [v1Id, v2Id] = harborEdge.vertexIds;

    harbors[harborId] = {
      id: harborId,
      type: harborConfigs[i].type,
      resourceType: harborConfigs[i].resourceType,
      adjacentIntersectionIds: [v1Id, v2Id],
    };

    // Link harbor to vertices
    if (vertices[v1Id]) vertices[v1Id].harborId = harborId;
    if (vertices[v2Id]) vertices[v2Id].harborId = harborId;
  }

  return {
    hexes,
    vertices,
    edges,
    harbors,
    robberHexId,
  };
}
