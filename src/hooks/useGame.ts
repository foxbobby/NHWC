'use client';

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, GameSession, GuessResult, PlayerStats } from '@/types/game';
import { CanvasData } from '@/types/canvas';
import { GameLogic } from '@/services/gameLogic';
import { apiClient, withRetry } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';
import { GAME_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';

// 游戏动作类型
type GameAction = 
  | { type: 'START_GAME'; payload: { totalRounds?: number; prompt?: string } }
  | { type: 'START_ROUND'; payload: { prompt?: string } }
  | { type: 'SUBMIT_DRAWING'; payload: { canvasData: CanvasData } }
  | { type: 'RECEIVE_RESULTS'; payload: { results: GuessResult[]; timeSpent: number } }
  | { type: 'NEXT_ROUND' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_TIME'; payload: { timeRemaining: number } }
  | { type: 'SET_ERROR'; payload: { error: string } };

// 游戏状态
interface GameHookState {
  gameState: GameState;
  session: GameSession | null;
  isLoading: boolean;
  error: string | null;
}

// 初始状态
const initialState: GameHookState = {
  gameState: GameLogic.createInitialGameState(),
  session: null,
  isLoading: false,
  error: null
};

// 状态管理器
function gameReducer(state: GameHookState, action: GameAction): GameHookState {
  switch (action.type) {
    case 'START_GAME':
      const newSession = GameLogic.createGameSession();
      const newGameState = GameLogic.createInitialGameState(action.payload.totalRounds);
      const startedGameState = GameLogic.startNewRound(newGameState, action.payload.prompt);
      return {
        ...state,
        session: newSession,
        gameState: startedGameState,
        error: null
      };

    case 'START_ROUND':
      return {
        ...state,
        gameState: GameLogic.startNewRound(state.gameState, action.payload.prompt),
        error: null
      };

    case 'SUBMIT_DRAWING':
      return {
        ...state,
        gameState: GameLogic.submitDrawing(state.gameState, action.payload.canvasData),
        isLoading: true,
        error: null
      };

    case 'RECEIVE_RESULTS':
      const updatedGameState = GameLogic.processGuessResults(
        state.gameState,
        action.payload.results,
        action.payload.timeSpent
      );
      
      // 创建回合记录
      const round = GameLogic.createGameRound(
        state.gameState.currentRound,
        state.gameState.currentPrompt || '',
        state.gameState.currentPrompt ? { 
          imageData: '', 
          width: 0, 
          height: 0, 
          strokes: [], 
          timestamp: new Date() 
        } : { imageData: '', width: 0, height: 0, strokes: [], timestamp: new Date() },
        action.payload.results,
        action.payload.timeSpent
      );

      const updatedSession = state.session ? {
        ...state.session,
        rounds: [...state.session.rounds, round],
        totalScore: updatedGameState.score
      } : null;

      return {
        ...state,
        gameState: updatedGameState,
        session: updatedSession,
        isLoading: false,
        error: null
      };

    case 'NEXT_ROUND':
      return {
        ...state,
        gameState: GameLogic.nextRound(state.gameState),
        error: null
      };

    case 'END_GAME':
      const completedSession = state.session ? 
        GameLogic.completeGameSession(state.session, state.gameState) : null;
      
      return {
        ...state,
        session: completedSession,
        error: null
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        gameState: GameLogic.createInitialGameState()
      };

    case 'UPDATE_TIME':
      return {
        ...state,
        gameState: {
          ...state.gameState,
          timeRemaining: action.payload.timeRemaining
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isLoading: false
      };

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { success, error: showError } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 开始游戏
  const startGame = useCallback((totalRounds?: number, prompt?: string) => {
    dispatch({ 
      type: 'START_GAME', 
      payload: { totalRounds, prompt } 
    });
    startTimeRef.current = Date.now();
  }, []);

  // 开始新回合
  const startRound = useCallback((prompt?: string) => {
    dispatch({ 
      type: 'START_ROUND', 
      payload: { prompt } 
    });
    startTimeRef.current = Date.now();
  }, []);

  // 提交绘画
  const submitDrawing = useCallback(async (canvasData: CanvasData) => {
    console.log('submitDrawing called with:', canvasData);
    try {
      console.log('Dispatching SUBMIT_DRAWING action');
      dispatch({ 
        type: 'SUBMIT_DRAWING', 
        payload: { canvasData } 
      });

      // 计算绘画时间
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      console.log('Time spent:', timeSpent);

      // 调用AI识别API
      console.log('Calling AI API...');
      const response = await withRetry(() => 
        apiClient.guessImage({
          imageData: canvasData.imageData,
          prompt: state.gameState.currentPrompt,
          maxResults: 5,
          confidenceThreshold: 0.1
        })
      );
      console.log('AI API response:', response);

      // 处理结果
      dispatch({
        type: 'RECEIVE_RESULTS',
        payload: {
          results: response.results,
          timeSpent
        }
      });

      // 显示成功消息
      const correctGuess = response.results.find(r => r.isCorrect);
      if (correctGuess) {
        success(SUCCESS_MESSAGES.CORRECT_GUESS);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { error: errorMessage } 
      });
      showError(errorMessage);
    }
  }, [state.gameState.currentPrompt, success, showError]);

  // 下一回合
  const nextRound = useCallback(() => {
    if (GameLogic.isGameFinished(state.gameState)) {
      dispatch({ type: 'END_GAME' });
      success(SUCCESS_MESSAGES.GAME_COMPLETED);
    } else {
      dispatch({ type: 'NEXT_ROUND' });
    }
  }, [state.gameState, success]);

  // 重置游戏
  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    dispatch({ type: 'RESET_GAME' });
  }, []);

  // 时间管理
  useEffect(() => {
    if (state.gameState.gameStatus === 'drawing' && state.gameState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch({
          type: 'UPDATE_TIME',
          payload: { timeRemaining: state.gameState.timeRemaining - 1 }
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.gameState.gameStatus, state.gameState.timeRemaining]);

  // 时间用完自动提交
  useEffect(() => {
    if (state.gameState.gameStatus === 'drawing' && state.gameState.timeRemaining <= 0) {
      // 这里需要从外部获取画布数据，暂时创建空数据
      const emptyCanvasData: CanvasData = {
        imageData: '',
        width: 0,
        height: 0,
        strokes: [],
        timestamp: new Date()
      };
      submitDrawing(emptyCanvasData);
    }
  }, [state.gameState.gameStatus, state.gameState.timeRemaining, submitDrawing]);

  // 游戏统计
  const gameStats = {
    progress: GameLogic.getGameProgress(state.gameState),
    isFinished: GameLogic.isGameFinished(state.gameState),
    currentRound: state.gameState.currentRound,
    totalRounds: state.gameState.totalRounds,
    score: state.gameState.score,
    timeRemaining: state.gameState.timeRemaining,
    formattedTime: GameLogic.formatGameTime(state.gameState.timeRemaining)
  };

  // 游戏总结
  const gameSummary = state.session && GameLogic.isGameFinished(state.gameState) 
    ? GameLogic.generateGameSummary(state.session)
    : null;

  return {
    // 状态
    gameState: state.gameState,
    session: state.session,
    isLoading: state.isLoading,
    error: state.error,
    
    // 动作
    startGame,
    startRound,
    submitDrawing,
    nextRound,
    resetGame,
    
    // 统计
    gameStats,
    gameSummary,
    
    // 工具方法
    isGameActive: state.gameState.gameStatus === 'drawing' || state.gameState.gameStatus === 'guessing',
    canSubmitDrawing: state.gameState.gameStatus === 'drawing' && !state.isLoading,
    hasResults: state.gameState.guessResults.length > 0
  };
}