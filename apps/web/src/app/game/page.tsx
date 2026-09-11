'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  ServerErrorPayload,
} from '@hexara/protocol';
import {
  createInitialGameState,
  executeGameAction,
  GameState,
  BoardVertex,
  BoardEdge,
} from '@hexara/game-core';
import { ResourceType } from '@hexara/shared';
import confetti from 'canvas-confetti';
import { io, Socket } from 'socket.io-client';
import { ToastNotification } from '../../components/common/ToastNotification';
import { BuildModal } from '../../components/game-ui/BuildModal';
import { DevCardParams } from '../../components/game-ui/DevCardPanel';
import { DiscardModal } from '../../components/game-ui/DiscardModal';
import { GameHUD } from '../../components/game-ui/GameHUD';
import { GameLogModal } from '../../components/game-ui/GameLogModal';
import { RotateOverlay } from '../../components/game-ui/RotateOverlay';
import { StealVictimModal } from '../../components/game-ui/StealVictimModal';
import { TradeModal } from '../../components/game-ui/TradeModal';
import { TradeOfferNotification } from '../../components/game-ui/TradeOfferNotification';
import { VictoryScreen } from '../../components/game-ui/VictoryScreen';
import { GameCanvas } from '../../game/GameCanvas';
import { useGameStore } from '../../store/gameStore';
import { ChatMessage } from '../../components/game-ui/ChatLogModal';
import { soundManager } from '../../game/SoundManager';
import { SERVER_URL } from '../../lib/serverUrl';

export default function GamePage() {
  const {
    gameState,
    setGameState,
    localPlayerId,
    setLocalPlayerId,
    buildMode,
    setBuildMode,
    selectedVertexId,
    setSelectedVertexId,
    selectedEdgeId,
    setSelectedEdgeId,
    errorToast,
    setErrorToast,
  } = useGameStore();

  const socketRef = useRef<Socket | null>(null);
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);
  const [turnDeadline, setTurnDeadline] = useState<number | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'system_1',
      sender: 'System',
      text: 'Match started! Welcome to the Isles of Hexara.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    },
  ]);

  // Setup Phase: Auto-activate placement mode for human player turn
  useEffect(() => {
    if (!gameState) return;
    const activePlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    const isMyTurn = activePlayerId === localPlayerId;

    if (isMyTurn && gameState.phase.startsWith('SETUP')) {
      const p = gameState.players[localPlayerId];
      if (!p) return;

      if (gameState.phase === 'SETUP_ROUND_1') {
        if (p.settlementsRemaining === 5 && buildMode !== 'settlement') {
          setBuildMode('settlement');
        } else if (p.settlementsRemaining === 4 && p.roadsRemaining === 15 && buildMode !== 'road') {
          setBuildMode('road');
        }
      } else if (gameState.phase === 'SETUP_ROUND_2') {
        if (p.settlementsRemaining === 4 && buildMode !== 'settlement') {
          setBuildMode('settlement');
        } else if (p.settlementsRemaining === 3 && p.roadsRemaining === 14 && buildMode !== 'road') {
          setBuildMode('road');
        }
      }
    }
  }, [gameState?.phase, gameState?.currentPlayerIndex, gameState?.players, localPlayerId, buildMode]);

  // Initialize Connection or Local Game
  useEffect(() => {
    let storedMode = sessionStorage.getItem('hexara_match_mode') || 'solo';
    let roomCode = sessionStorage.getItem('hexara_room_code') || '';

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const codeFromUrl = urlParams.get('room') || urlParams.get('code') || hashParams.get('room') || hashParams.get('code');
      if (codeFromUrl) {
        roomCode = codeFromUrl.toUpperCase();
        storedMode = 'online';
        sessionStorage.setItem('hexara_room_code', roomCode);
        sessionStorage.setItem('hexara_match_mode', 'online');
      }
    }
    if (!roomCode) roomCode = 'HEXARA';

    const storedCount = Number(sessionStorage.getItem('hexara_player_count') || '4');
    const storedScenarioId = sessionStorage.getItem('hexara_scenario_id') || 'first_island';
    const storedScenarioName = sessionStorage.getItem('hexara_scenario_name') || 'The First Island';
    const storedVp = Number(sessionStorage.getItem('hexara_vp_target') || '10');
    const storedSeed = Number(sessionStorage.getItem('hexara_board_seed') || '123456');

    // Use the persistent player ID and name from localStorage
    const persistedId = localStorage.getItem('hexara_player_id') || sessionStorage.getItem('hexara_player_id') || localPlayerId;
    const persistedName = localStorage.getItem('hexara_username') || sessionStorage.getItem('hexara_username') || 'Captain Amber';
    // Update gameStore so the rest of the app uses the right ID
    if (persistedId !== localPlayerId) {
      useGameStore.getState().setLocalPlayerId(persistedId);
    }

    if (!useGameStore.getState().gameState && storedMode !== 'online') {
      const playerList = [
        { id: persistedId, username: persistedName },
        { id: 'ai_1', username: 'Candamir (Bot)', isAi: true },
        { id: 'ai_2', username: 'Louis (Bot)', isAi: true },
      ];
      if (storedCount === 4) {
        playerList.push({ id: 'ai_3', username: 'William (Bot)', isAi: true });
      }

      const initialGame = createInitialGameState(
        'hexara_' + Date.now(),
        playerList,
        storedSeed,
        {
          targetVictoryPoints: storedVp,
          scenarioId: storedScenarioId,
          scenarioName: storedScenarioName,
        }
      );
      setGameState(initialGame);
    }

    if (storedMode === 'online') {
      const gameServerUrl = SERVER_URL;

      const token = localStorage.getItem('hexara_auth_token') || sessionStorage.getItem('hexara_auth_token') || undefined;
      const username = localStorage.getItem('hexara_username') || sessionStorage.getItem('hexara_username') || 'Captain Voyager';
      const myPlayerId = localStorage.getItem('hexara_player_id') || sessionStorage.getItem('hexara_player_id') || localPlayerId;

      const socket = io(gameServerUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 5,
        auth: {
          token,
          username,
          playerId: myPlayerId,
        },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsOnlineConnected(true);
        setConnectionStatus('connected');
        socket.emit(CLIENT_EVENTS.JOIN_GAME, {
          code: roomCode,
          gameId: roomCode,
          playerId: myPlayerId,
          username,
        });
      });

      socket.on(SERVER_EVENTS.GAME_STATE, (state: GameState) => {
        setGameState(state);
        sessionStorage.setItem('hexara_active_game_state', JSON.stringify(state));
        if (state.phase === 'FINISHED' && state.winnerId === localPlayerId) {
          soundManager.playVictory();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      });

      socket.on(SERVER_EVENTS.GAME_SYNC, (payload: { state: GameState }) => {
        if (payload?.state) {
          setGameState(payload.state);
          sessionStorage.setItem('hexara_active_game_state', JSON.stringify(payload.state));
        }
      });

      socket.on(SERVER_EVENTS.TURN_TIMER, (payload: { currentPlayerId: string; turnDeadline: number; turnId: number; durationSeconds: number }) => {
        if (payload?.turnDeadline) {
          setTurnDeadline(payload.turnDeadline);
        }
      });

      socket.on(SERVER_EVENTS.TURN_EXPIRED, () => {
        soundManager.playError();
        setBuildMode('none');
        useGameStore.getState().setSelectedVertexId(null);
        useGameStore.getState().setSelectedEdgeId(null);
        useGameStore.getState().setBuildModalOpen(false);
        useGameStore.getState().setTradeModalOpen(false);
        setErrorToast('Turn deadline expired. Turn automatically advanced.');
        setTimeout(() => setErrorToast(null), 3500);
      });

      socket.on(SERVER_EVENTS.ERROR, (err: ServerErrorPayload) => {
        soundManager.playError();
        setErrorToast(err.message);
        setTimeout(() => setErrorToast(null), 4000);
      });

      socket.on(SERVER_EVENTS.CHAT_MESSAGE, (payload: { playerId: string; username: string; message: string; timestamp: number }) => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${payload.playerId}_${payload.timestamp}_${Math.random()}`,
            sender: payload.username,
            text: payload.message,
            timestamp: new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: payload.playerId === 'system',
          },
        ]);
      });

      socket.on('disconnect', () => {
        setIsOnlineConnected(false);
        setConnectionStatus('reconnecting');
      });

      socket.on('connect_error', () => {
        setIsOnlineConnected(false);
        setConnectionStatus('reconnecting');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  // Offline Solo Mode: Update turn deadline on player turn change
  useEffect(() => {
    if (!gameState || isOnlineConnected || gameState.phase === 'FINISHED') return;
    const storedTurnDuration = Number(sessionStorage.getItem('hexara_turn_duration') || '60');
    setTurnDeadline(Date.now() + storedTurnDuration * 1000);
  }, [gameState?.currentPlayerIndex, gameState?.turnNumber, gameState?.phase, isOnlineConnected]);

  // Cancel pending placement if active player index changes
  useEffect(() => {
    if (!gameState) return;
    const activePlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    if (activePlayerId !== localPlayerId) {
      if (buildMode !== 'none') setBuildMode('none');
      useGameStore.getState().setSelectedVertexId(null);
      useGameStore.getState().setSelectedEdgeId(null);
      useGameStore.getState().setBuildModalOpen(false);
      useGameStore.getState().setTradeModalOpen(false);
    }
  }, [gameState?.currentPlayerIndex, localPlayerId, buildMode]);

  // Offline Autonomous AI Turn Automation
  useEffect(() => {
    if (!gameState || isOnlineConnected || gameState.phase === 'FINISHED') return;

    // AI Response to Human Trade Offers in Solo Mode
    if (gameState.activeTrade && gameState.activeTrade.fromPlayerId === localPlayerId) {
      const aiTradeTimer = setTimeout(() => {
        // Find an AI player who holds the requested resources
        const willingAiId = gameState.playerOrder.find((pId) => {
          if (pId === localPlayerId) return false;
          const aiP = gameState.players[pId];
          if (!aiP || !aiP.isAi) return false;
          for (const [res, count] of Object.entries(gameState.activeTrade!.request) as [ResourceType, number][]) {
            if ((aiP.resources[res] ?? 0) < (count ?? 0)) return false;
          }
          return true;
        });

        if (willingAiId) {
          const acceptRes = executeGameAction(gameState, {
            type: 'TRADE_ACCEPT',
            playerId: willingAiId,
          });
          if (acceptRes.success) {
            setGameState(acceptRes.newState);
            return;
          }
        } else {
          // If no AI can fulfill trade, cancel with feedback
          const cancelRes = executeGameAction(gameState, {
            type: 'TRADE_CANCEL',
            playerId: localPlayerId,
          });
          if (cancelRes.success) {
            setGameState(cancelRes.newState);
          }
        }
      }, 1500);

      return () => clearTimeout(aiTradeTimer);
    }

    const activePlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    const activePlayer = gameState.players[activePlayerId];

    if (!activePlayer || !activePlayer.isAi) return;

    const aiTimer = setTimeout(() => {
      // 1. Setup Phase for AI (Setup Round 1 & 2)
      if (gameState.phase.startsWith('SETUP')) {
        const vertices = Object.values(gameState.board.vertices) as BoardVertex[];
        const validVertex = vertices.find((v) => {
          if (v.building) return false;
          return v.adjacentVertexIds.every((adjId) => !gameState.board.vertices[adjId]?.building);
        });

        if (validVertex) {
          const buildSettleRes = executeGameAction(gameState, {
            type: 'BUILD_SETTLEMENT',
            playerId: activePlayerId,
            vertexId: validVertex.id,
          });

          if (buildSettleRes.success) {
            const nextState = buildSettleRes.newState;
            const adjEdgeId = validVertex.adjacentEdgeIds[0];
            if (adjEdgeId) {
              const buildRoadRes = executeGameAction(nextState, {
                type: 'BUILD_ROAD',
                playerId: activePlayerId,
                edgeId: adjEdgeId,
              });
              if (buildRoadRes.success) {
                setGameState(buildRoadRes.newState);
                return;
              }
            }
            setGameState(nextState);
            return;
          }
        }
      }

      // 2. Rolling Phase for AI
      if (gameState.phase === 'ROLLING') {
        const rollRes = executeGameAction(gameState, {
          type: 'ROLL_DICE',
          playerId: activePlayerId,
        });
        if (rollRes.success) {
          setGameState(rollRes.newState);
        }
        return;
      }

      // 3. Robber Discard Phase for AI players
      if (gameState.phase === 'ROBBER_DISCARD') {
        const pendingPlayerId = Object.keys(gameState.pendingDiscards)[0];
        if (pendingPlayerId && pendingPlayerId !== localPlayerId) {
          const p = gameState.players[pendingPlayerId];
          const needed = gameState.pendingDiscards[pendingPlayerId];
          const toDiscard: Partial<Record<ResourceType, number>> = {};
          let count = 0;
          for (const [res, qty] of Object.entries(p.resources)) {
            for (let i = 0; i < qty && count < needed; i++) {
              toDiscard[res as ResourceType] = (toDiscard[res as ResourceType] ?? 0) + 1;
              count++;
            }
          }
          const discardRes = executeGameAction(gameState, {
            type: 'DISCARD_RESOURCES',
            playerId: pendingPlayerId,
            resources: toDiscard,
          });
          if (discardRes.success) {
            setGameState(discardRes.newState);
          }
        }
        return;
      }

      // 4. Robber Move Phase for AI
      if (gameState.phase === 'ROBBER_MOVE') {
        const hexes = Object.values(gameState.board.hexes);
        const targetHex =
          hexes.find((h) => {
            if (h.id === gameState.robberHexId || h.terrain === 'desert') return false;
            return h.vertexIds.some((vId) => {
              const b = gameState.board.vertices[vId]?.building;
              return b && b.playerId !== activePlayerId;
            });
          }) ||
          hexes.find((h) => h.id !== gameState.robberHexId) ||
          hexes[0];

        if (targetHex) {
          const robRes = executeGameAction(gameState, {
            type: 'MOVE_ROBBER',
            playerId: activePlayerId,
            hexId: targetHex.id,
          });
          if (robRes.success) {
            setGameState(robRes.newState);
          }
        }
        return;
      }

      // 5. Robber Steal Phase for AI
      if (gameState.phase === 'ROBBER_STEAL') {
        const victimId = gameState.robberEligibleVictimIds[0];
        if (victimId) {
          const stealRes = executeGameAction(gameState, {
            type: 'STEAL_RESOURCE',
            playerId: activePlayerId,
            victimId,
          });
          if (stealRes.success) {
            setGameState(stealRes.newState);
          }
        }
        return;
      }

      // 6. Main Turn Phase for AI (Smart Builds & Dev Cards, then End Turn)
      if (gameState.phase === 'MAIN') {
        let currentState = gameState;

        // Try to upgrade a settlement to City (3 ore, 2 grain)
        if (
          activePlayer.resources.ore >= 3 &&
          activePlayer.resources.grain >= 2 &&
          activePlayer.citiesRemaining > 0
        ) {
          const upgradeVertex = Object.values(currentState.board.vertices).find(
            (v) => v.building && v.building.playerId === activePlayerId && v.building.type === 'settlement'
          );
          if (upgradeVertex) {
            const cityRes = executeGameAction(currentState, {
              type: 'BUILD_CITY',
              playerId: activePlayerId,
              vertexId: upgradeVertex.id,
            });
            if (cityRes.success) {
              currentState = cityRes.newState;
            }
          }
        }

        // Try to buy Dev Card (1 ore, 1 wool, 1 grain)
        if (
          activePlayer.resources.ore >= 1 &&
          activePlayer.resources.wool >= 1 &&
          activePlayer.resources.grain >= 1 &&
          currentState.developmentDeck.length > 0
        ) {
          const devRes = executeGameAction(currentState, {
            type: 'BUY_DEV_CARD',
            playerId: activePlayerId,
          });
          if (devRes.success) {
            currentState = devRes.newState;
          }
        }

        // End AI turn
        const endRes = executeGameAction(currentState, {
          type: 'END_TURN',
          playerId: activePlayerId,
        });
        if (endRes.success) {
          setGameState(endRes.newState);
        }
        return;
      }
    }, 700);

    return () => clearTimeout(aiTimer);
  }, [gameState, isOnlineConnected, localPlayerId]);

  const dispatchAction = (action: any) => {
    if (socketRef.current && isOnlineConnected) {
      if (action.type === 'ROLL_DICE') {
        socketRef.current.emit(CLIENT_EVENTS.ROLL_DICE, {
          gameId: gameState?.id,
          playerId: localPlayerId,
        });
      } else if (action.type === 'BUILD_ROAD') {
        socketRef.current.emit(CLIENT_EVENTS.BUILD_ROAD, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          edgeId: action.edgeId,
        });
      } else if (action.type === 'BUILD_SETTLEMENT') {
        socketRef.current.emit(CLIENT_EVENTS.BUILD_SETTLEMENT, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          vertexId: action.vertexId,
        });
      } else if (action.type === 'BUILD_CITY') {
        socketRef.current.emit(CLIENT_EVENTS.BUILD_CITY, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          vertexId: action.vertexId,
        });
      } else if (action.type === 'MOVE_ROBBER') {
        socketRef.current.emit(CLIENT_EVENTS.MOVE_ROBBER, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          hexId: action.hexId,
        });
      } else if (action.type === 'DISCARD_RESOURCES') {
        socketRef.current.emit(CLIENT_EVENTS.DISCARD_RESOURCES, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          resources: action.resources,
        });
      } else if (action.type === 'STEAL_RESOURCE') {
        socketRef.current.emit(CLIENT_EVENTS.STEAL_RESOURCE, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          victimId: action.victimId,
        });
      } else if (action.type === 'BUY_DEV_CARD') {
        socketRef.current.emit(CLIENT_EVENTS.BUY_DEV_CARD, {
          gameId: gameState?.id,
          playerId: localPlayerId,
        });
      } else if (action.type === 'PLAY_DEV_CARD') {
        socketRef.current.emit(CLIENT_EVENTS.PLAY_DEV_CARD, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          card: action.card,
          params: action.params,
        });
      } else if (action.type === 'TRADE_BANK') {
        socketRef.current.emit(CLIENT_EVENTS.TRADE_BANK, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          giving: action.giving,
          receiving: action.receiving,
        });
      } else if (action.type === 'TRADE_MARITIME') {
        socketRef.current.emit(CLIENT_EVENTS.TRADE_MARITIME, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          giving: action.giving,
          receiving: action.receiving,
        });
      } else if (action.type === 'TRADE_PROPOSE') {
        socketRef.current.emit(CLIENT_EVENTS.TRADE_PROPOSE, {
          gameId: gameState?.id,
          playerId: localPlayerId,
          offer: action.offer,
          request: action.request,
        });
      } else if (action.type === 'TRADE_ACCEPT') {
        socketRef.current.emit(CLIENT_EVENTS.TRADE_ACCEPT, {
          gameId: gameState?.id,
          playerId: localPlayerId,
        });
      } else if (action.type === 'TRADE_CANCEL') {
        socketRef.current.emit(CLIENT_EVENTS.TRADE_CANCEL, {
          gameId: gameState?.id,
          playerId: localPlayerId,
        });
      } else if (action.type === 'END_TURN') {
        socketRef.current.emit(CLIENT_EVENTS.END_TURN, {
          gameId: gameState?.id,
          playerId: localPlayerId,
        });
      }
    } else if (gameState) {
      // Offline local engine transition
      const res = executeGameAction(gameState, action);
      if (res.success) {
        setGameState(res.newState);
        if (res.newState.phase === 'FINISHED') {
          if (res.newState.winnerId === localPlayerId) {
            soundManager.playVictory();
            confetti({ particleCount: 150, spread: 70 });
          } else {
            soundManager.playError();
          }
        }
      } else {
        soundManager.playError();
        setErrorToast(res.error || 'Action failed');
        setTimeout(() => setErrorToast(null), 3000);
      }
    }
  };

  const handleVertexSelect = (vertexId: string) => {
    if (!gameState) return;
    const vertex = gameState.board.vertices[vertexId];
    if (!vertex) return;

    if (buildMode === 'settlement' || buildMode === 'city') {
      setSelectedVertexId(vertexId);
      setSelectedEdgeId(null);

      // In SETUP phases: immediately place the piece on click (no separate confirm needed)
      const isSetup = gameState.phase.startsWith('SETUP');
      if (isSetup) {
        soundManager.playPlacement();
        dispatchAction({ type: 'BUILD_SETTLEMENT', playerId: localPlayerId, vertexId });
        setSelectedVertexId(null);
        setBuildMode('road');
      }
      // In regular game phase, the user sees a preview and must click "Confirm" in the HUD
    }
  };

  const handleEdgeSelect = (edgeId: string) => {
    if (!gameState) return;
    if (buildMode === 'road') {
      setSelectedEdgeId(edgeId);
      setSelectedVertexId(null);

      // In SETUP phases: immediately place road on click
      const isSetup = gameState.phase.startsWith('SETUP');
      if (isSetup) {
        soundManager.playPlacement();
        dispatchAction({ type: 'BUILD_ROAD', playerId: localPlayerId, edgeId });
        setSelectedEdgeId(null);
        setBuildMode('none');
        dispatchAction({ type: 'END_TURN', playerId: localPlayerId });
      }
    }
  };

  const handleConfirmPlacement = () => {
    if (!gameState) return;
    const isSetup = gameState.phase.startsWith('SETUP');

    if (buildMode === 'settlement') {
      if (!selectedVertexId) {
        soundManager.playError();
        setErrorToast('Please click an intersection circle on the board first.');
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
      soundManager.playPlacement();
      dispatchAction({ type: 'BUILD_SETTLEMENT', playerId: localPlayerId, vertexId: selectedVertexId });
      setSelectedVertexId(null);
      if (isSetup) {
        setBuildMode('road');
      } else {
        setBuildMode('none');
      }
    } else if (buildMode === 'city') {
      if (!selectedVertexId) {
        soundManager.playError();
        setErrorToast('Please click an intersection to upgrade to city.');
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
      soundManager.playPlacement();
      dispatchAction({ type: 'BUILD_CITY', playerId: localPlayerId, vertexId: selectedVertexId });
      setSelectedVertexId(null);
      setBuildMode('none');
    } else if (buildMode === 'road') {
      if (!selectedEdgeId) {
        soundManager.playError();
        setErrorToast('Please click a road path on the board first.');
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
      soundManager.playPlacement();
      dispatchAction({ type: 'BUILD_ROAD', playerId: localPlayerId, edgeId: selectedEdgeId });
      setSelectedEdgeId(null);
      if (isSetup) {
        setBuildMode('none');
        dispatchAction({ type: 'END_TURN', playerId: localPlayerId });
      } else {
        setBuildMode('none');
      }
    }
  };

  const handleHexSelect = (hexId: string) => {
    if (!gameState) return;
    if (gameState.phase === 'ROBBER_MOVE') {
      soundManager.playClick();
      dispatchAction({ type: 'MOVE_ROBBER', playerId: localPlayerId, hexId });
    }
  };

  const handleRollDice = () => {
    soundManager.playDiceRoll();
    dispatchAction({ type: 'ROLL_DICE', playerId: localPlayerId });
  };

  const handleEndTurn = () => {
    soundManager.playTurnChime();
    dispatchAction({ type: 'END_TURN', playerId: localPlayerId });
  };

  const handleBankTrade = (giving: ResourceType, receiving: ResourceType) => {
    soundManager.playClick();
    dispatchAction({ type: 'TRADE_BANK', playerId: localPlayerId, giving, receiving });
  };

  const handleProposeTrade = (
    offer: Partial<Record<ResourceType, number>>,
    request: Partial<Record<ResourceType, number>>
  ) => {
    soundManager.playClick();
    dispatchAction({ type: 'TRADE_PROPOSE', playerId: localPlayerId, offer, request });
  };

  const handleCancelTrade = () => {
    soundManager.playClick();
    dispatchAction({ type: 'TRADE_CANCEL', playerId: localPlayerId });
  };

  const handleAcceptTrade = () => {
    soundManager.playPlacement();
    dispatchAction({ type: 'TRADE_ACCEPT', playerId: localPlayerId });
  };

  const handleDeclineTrade = () => {
    soundManager.playClick();
    dispatchAction({ type: 'TRADE_CANCEL', playerId: localPlayerId });
  };

  const handleBuyDevCard = () => {
    soundManager.playDevCard();
    dispatchAction({ type: 'BUY_DEV_CARD', playerId: localPlayerId });
  };

  const handlePlayDevCard = (card: string, params?: DevCardParams) => {
    soundManager.playDevCard();
    dispatchAction({
      type: 'PLAY_DEV_CARD',
      playerId: localPlayerId,
      card,
      params,
    });
    if (card === 'road_building') {
      setBuildMode('road');
    }
  };

  const handleDiscard = (resources: Record<ResourceType, number>) => {
    soundManager.playClick();
    dispatchAction({ type: 'DISCARD_RESOURCES', playerId: localPlayerId, resources });
  };

  const handleSteal = (victimId: string) => {
    soundManager.playClick();
    dispatchAction({ type: 'STEAL_RESOURCE', playerId: localPlayerId, victimId });
  };

  const handlePlayAgain = () => {
    soundManager.playClick();
    const storedCount = Number(sessionStorage.getItem('hexara_player_count') || '4');
    const storedScenarioId = sessionStorage.getItem('hexara_scenario_id') || 'first_island';
    const storedScenarioName = sessionStorage.getItem('hexara_scenario_name') || 'The First Island';
    const storedVp = Number(sessionStorage.getItem('hexara_vp_target') || '10');
    const storedSeed = Date.now();
    sessionStorage.setItem('hexara_board_seed', String(storedSeed));
    sessionStorage.removeItem('hexara_active_game_state');

    const persistedId = localStorage.getItem('hexara_player_id') || sessionStorage.getItem('hexara_player_id') || localPlayerId;
    const persistedName = localStorage.getItem('hexara_username') || sessionStorage.getItem('hexara_username') || 'Captain Voyager';

    const playerList = [
      { id: persistedId, username: persistedName },
      { id: 'ai_1', username: 'Candamir (Bot)', isAi: true },
      { id: 'ai_2', username: 'Louis (Bot)', isAi: true },
    ];
    if (storedCount === 4) {
      playerList.push({ id: 'ai_3', username: 'William (Bot)', isAi: true });
    }

    const newGame = createInitialGameState(
      'hexara_' + Date.now(),
      playerList,
      storedSeed,
      {
        targetVictoryPoints: storedVp,
        scenarioId: storedScenarioId,
        scenarioName: storedScenarioName,
      }
    );
    setGameState(newGame);
  };

  const handleSendMessage = (text: string) => {
    const pName = gameState?.players[localPlayerId]?.username || 'You';
    const newMsg: ChatMessage = {
      id: `${localPlayerId}_${Date.now()}`,
      sender: pName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    let storedRoom = sessionStorage.getItem('hexara_room_code') || 'HEXARA';
    if (socketRef.current && isOnlineConnected) {
      socketRef.current.emit(CLIENT_EVENTS.SEND_CHAT, {
        gameId: storedRoom,
        message: text,
      });
    } else {
      // Offline solo mode bot responses for immersion
      const botReplies = [
        'Good luck out there, Captain!',
        'May the dice roll in your favor!',
        'Looking to trade some lumber for brick later?',
        'Watch out for the Corsair on the desert sands!',
      ];
      setTimeout(() => {
        const randomBot = Object.values(gameState?.players || {}).find((p) => p.isAi);
        if (randomBot) {
          const botMsg: ChatMessage = {
            id: `bot_${Date.now()}`,
            sender: randomBot.username,
            text: botReplies[Math.floor(Math.random() * botReplies.length)],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setChatMessages((prev) => [...prev, botMsg]);
        }
      }, 1200);
    }
  };

  // Determine if local player needs to show discard modal
  const localPendingDiscard = gameState?.pendingDiscards?.[localPlayerId] ?? 0;
  const showDiscardModal =
    gameState?.phase === 'ROBBER_DISCARD' && localPendingDiscard > 0;

  // Determine if steal victim modal should show
  const showStealModal =
    gameState?.phase === 'ROBBER_STEAL' &&
    gameState?.playerOrder[gameState.currentPlayerIndex] === localPlayerId &&
    (gameState?.robberEligibleVictimIds?.length ?? 0) > 0;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0d0705]">
      <RotateOverlay />
      <GameCanvas
        onVertexSelect={handleVertexSelect}
        onEdgeSelect={handleEdgeSelect}
        onHexSelect={handleHexSelect}
      />
      <GameHUD
        socket={socketRef.current}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onRollDice={handleRollDice}
        onEndTurn={handleEndTurn}
        onConfirmPlacement={handleConfirmPlacement}
        onPlayDevCard={handlePlayDevCard}
        turnDeadline={turnDeadline}
        connectionStatus={connectionStatus}
      />
      <BuildModal onBuyDevCard={handleBuyDevCard} />
      <TradeModal
        onBankTrade={handleBankTrade}
        onProposeTrade={handleProposeTrade}
        onCancelTrade={handleCancelTrade}
      />
      <GameLogModal />

      {/* Global Toast System */}
      <ToastNotification logs={gameState?.logs || []} errorToast={errorToast} />

      {/* Incoming Trade Offer from Opponent */}
      {gameState?.activeTrade && (
        <TradeOfferNotification
          activeTrade={gameState.activeTrade}
          players={gameState.players}
          localPlayerId={localPlayerId}
          onAccept={handleAcceptTrade}
          onDecline={handleDeclineTrade}
        />
      )}

      {/* Robber: Discard dialog for local human player */}
      {showDiscardModal && gameState && (
        <DiscardModal
          handCounts={gameState.players[localPlayerId]?.resources as Record<ResourceType, number>}
          requiredDiscard={localPendingDiscard}
          onConfirm={handleDiscard}
        />
      )}

      {/* Robber: Steal victim selection for local human player */}
      {showStealModal && gameState && (
        <StealVictimModal
          victimIds={gameState.robberEligibleVictimIds}
          players={gameState.players}
          activePlayerName={gameState.players[localPlayerId]?.username || 'You'}
          onSteal={handleSteal}
        />
      )}

      {/* Game Victory Endgame Screen */}
      {gameState && gameState.phase === 'FINISHED' && (
        <VictoryScreen
          gameState={gameState}
          localPlayerId={localPlayerId}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </main>
  );
}
