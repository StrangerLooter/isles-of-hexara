'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { BabylonGame } from './BabylonGame';

interface GameCanvasProps {
  onVertexSelect?: (vertexId: string) => void;
  onEdgeSelect?: (edgeId: string) => void;
  onHexSelect?: (hexId: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onVertexSelect,
  onEdgeSelect,
  onHexSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameInstanceRef = useRef<BabylonGame | null>(null);
  const gameState = useGameStore((s) => s.gameState);
  const buildMode = useGameStore((s) => s.buildMode);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const selectedVertexId = useGameStore((s) => s.selectedVertexId);
  const selectedEdgeId = useGameStore((s) => s.selectedEdgeId);
  const localPlayerId = useGameStore((s) => s.localPlayerId);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new BabylonGame(canvasRef.current, {
      onVertexClick: (vertexId) => onVertexSelect?.(vertexId),
      onEdgeClick: (edgeId) => onEdgeSelect?.(edgeId),
      onHexClick: (hexId) => onHexSelect?.(hexId),
    });
    gameInstanceRef.current = game;
    if (typeof window !== 'undefined') {
      (window as any).__hexara_babylon__ = game;
    }

    if (gameState) {
      game.syncGameState(gameState);
    }

    return () => {
      game.dispose();
      gameInstanceRef.current = null;
      if (typeof window !== 'undefined') {
        delete (window as any).__hexara_babylon__;
      }
    };
  }, []);

  useEffect(() => {
    if (gameInstanceRef.current && gameState) {
      gameInstanceRef.current.syncGameState(gameState);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.setPlacementMode(buildMode);
    }
  }, [buildMode]);

  useEffect(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.setCameraMode(cameraMode);
    }
  }, [cameraMode]);

  // Sync robber move mode highlights
  useEffect(() => {
    if (!gameInstanceRef.current || !gameState) return;
    const isRobberMove = gameState.phase === 'ROBBER_MOVE';
    gameInstanceRef.current.setRobberMoveMode(isRobberMove, gameState.robberHexId);
  }, [gameState?.phase, gameState?.robberHexId]);

  // Sync interactive 3D placement preview and glowing spot
  useEffect(() => {
    if (!gameInstanceRef.current || !gameState) return;

    if (buildMode === 'none') {
      gameInstanceRef.current.clearPlacementPreview();
      return;
    }

    const playerColor = gameState.players[localPlayerId]?.color || '#dc2626';

    if ((buildMode === 'settlement' || buildMode === 'city') && selectedVertexId) {
      gameInstanceRef.current.showPlacementPreview(
        buildMode,
        selectedVertexId,
        playerColor,
        gameState.board
      );
    } else if (buildMode === 'road' && selectedEdgeId) {
      gameInstanceRef.current.showPlacementPreview(
        'road',
        selectedEdgeId,
        playerColor,
        gameState.board
      );
    } else {
      gameInstanceRef.current.clearPlacementPreview();
    }
  }, [buildMode, selectedVertexId, selectedEdgeId, gameState, localPlayerId]);

  return (
    <div className="relative w-full h-full touch-none select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block outline-none cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};

export function zoomInCamera() {
  if (typeof window !== 'undefined' && (window as any).__hexara_babylon__) {
    (window as any).__hexara_babylon__.zoomIn();
  }
}

export function zoomOutCamera() {
  if (typeof window !== 'undefined' && (window as any).__hexara_babylon__) {
    (window as any).__hexara_babylon__.zoomOut();
  }
}

export function resetGameCamera() {
  if (typeof window !== 'undefined' && (window as any).__hexara_babylon__) {
    (window as any).__hexara_babylon__.resetCamera();
  }
}
