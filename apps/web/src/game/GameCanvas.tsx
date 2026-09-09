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

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new BabylonGame(canvasRef.current, {
      onVertexClick: (vertexId) => onVertexSelect?.(vertexId),
      onEdgeClick: (edgeId) => onEdgeSelect?.(edgeId),
      onHexClick: (hexId) => onHexSelect?.(hexId),
    });
    gameInstanceRef.current = game;

    if (gameState) {
      game.syncGameState(gameState);
    }

    return () => {
      game.dispose();
      gameInstanceRef.current = null;
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

  return (
    <div className="relative w-full h-full touch-none select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block outline-none cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
