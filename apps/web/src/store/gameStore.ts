import { GameState, ResourceInventory } from '@hexara/game-core';
import { BuildingType } from '@hexara/shared';
import { create } from 'zustand';

export type BuildMode = 'none' | BuildingType;
export type CameraMode = 'perspective' | 'tactical';

interface GameStore {
  gameState: GameState | null;
  localPlayerId: string;
  buildMode: BuildMode;
  cameraMode: CameraMode;
  selectedVertexId: string | null;
  selectedEdgeId: string | null;
  isBuildModalOpen: boolean;
  isTradeModalOpen: boolean;
  isLogModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isAlmanacModalOpen: boolean;
  isScoreboardExpanded: boolean;
  errorToast: string | null;

  setGameState: (state: GameState) => void;
  setLocalPlayerId: (id: string) => void;
  setBuildMode: (mode: BuildMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  setSelectedVertexId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setBuildModalOpen: (open: boolean) => void;
  setTradeModalOpen: (open: boolean) => void;
  setLogModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setAlmanacModalOpen: (open: boolean) => void;
  setScoreboardExpanded: (expanded: boolean) => void;
  toggleScoreboardExpanded: () => void;
  setErrorToast: (msg: string | null) => void;
}

// Persistent per-browser player ID — stored in localStorage so the same
// browser always gets the same identity across refreshes, but different
// browsers (or incognito windows) get different IDs.
function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'player_1';
  let id = localStorage.getItem('hexara_player_id') || sessionStorage.getItem('hexara_player_id');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('hexara_player_id', id);
  }
  sessionStorage.setItem('hexara_player_id', id);
  return id;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  localPlayerId: getOrCreatePlayerId(),
  buildMode: 'none',
  cameraMode: 'perspective',
  selectedVertexId: null,
  selectedEdgeId: null,
  isBuildModalOpen: false,
  isTradeModalOpen: false,
  isLogModalOpen: false,
  isSettingsModalOpen: false,
  isAlmanacModalOpen: false,
  isScoreboardExpanded: false,
  errorToast: null,

  setGameState: (gameState) => set({ gameState }),
  setLocalPlayerId: (localPlayerId) => set({ localPlayerId }),
  setBuildMode: (buildMode) => set({ buildMode }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === 'perspective' ? 'tactical' : 'perspective',
    })),
  setSelectedVertexId: (selectedVertexId) => set({ selectedVertexId }),
  setSelectedEdgeId: (selectedEdgeId) => set({ selectedEdgeId }),
  setBuildModalOpen: (isBuildModalOpen) => set({ isBuildModalOpen }),
  setTradeModalOpen: (isTradeModalOpen) => set({ isTradeModalOpen }),
  setLogModalOpen: (isLogModalOpen) => set({ isLogModalOpen }),
  setSettingsModalOpen: (isSettingsModalOpen) => set({ isSettingsModalOpen }),
  setAlmanacModalOpen: (isAlmanacModalOpen) => set({ isAlmanacModalOpen }),
  setScoreboardExpanded: (isScoreboardExpanded) => set({ isScoreboardExpanded }),
  toggleScoreboardExpanded: () =>
    set((state) => ({ isScoreboardExpanded: !state.isScoreboardExpanded })),
  setErrorToast: (errorToast) => set({ errorToast }),
}));
