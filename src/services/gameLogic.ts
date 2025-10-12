import { 
  GameState, 
  GameSession, 
  GuessResult, 
  PlayerStats,
  GameStatus 
} from '@/types/game';
import { CanvasData } from '@/types/canvas';
import { GAME_CONFIG } from '@/lib/constants';
import { generateId } from '@/lib/utils';

export class GameLogic {
  /**
   * 创建新游戏会话
   */
  static createGameSession(playerId: string = 'anonymous'): GameSession {
    return {
      id: generateId(),
      playerId,
      startTime: new Date(),
      aiGuesses: [],
      finalScore: 0,
      status: 'waiting',
      aiAccuracy: 0
    };
  }

  /**
   * 创建新游戏状态
   */
  static createInitialGameState(): GameState {
    return {
      score: 0,
      timeRemaining: GAME_CONFIG.ROUND_TIME_LIMIT,
      gameStatus: 'waiting',
      guessResults: [],
      startTime: new Date()
    };
  }

  /**
   * 开始游戏（设置目标词汇）
   */
  static startGame(gameState: GameState, targetWord?: string): GameState {
    return {
      ...gameState,
      gameStatus: 'drawing',
      timeRemaining: GAME_CONFIG.ROUND_TIME_LIMIT,
      targetWord,
      guessResults: []
    };
  }

  /**
   * 提交绘画，开始AI猜测
   */
  static submitDrawing(gameState: GameState, canvasData: CanvasData): GameState {
    return {
      ...gameState,
      gameStatus: 'guessing'
    };
  }

  /**
   * 处理AI猜测结果
   */
  static processGuessResults(
    gameState: GameState, 
    results: GuessResult[],
    timeSpent: number,
    userAnswer?: string
  ): GameState {
    // 计算AI的准确性
    const aiAccuracy = this.calculateAIAccuracy(results, gameState.targetWord, userAnswer);
    const finalScore = this.calculateFinalScore(results, timeSpent, aiAccuracy);

    return {
      ...gameState,
      guessResults: results,
      score: finalScore,
      gameStatus: 'finished',
      userAnswer
    };
  }

  /**
   * 计算AI猜测的准确性
   */
  static calculateAIAccuracy(
    results: GuessResult[], 
    targetWord?: string, 
    userAnswer?: string
  ): number {
    if (!targetWord && !userAnswer) return 0;
    
    const actualTarget = userAnswer || targetWord || '';
    const topGuess = results[0];
    
    if (!topGuess) return 0;
    
    // 检查最高置信度的猜测是否正确
    const isTopGuessCorrect = topGuess.guess.toLowerCase().includes(actualTarget.toLowerCase()) ||
                             actualTarget.toLowerCase().includes(topGuess.guess.toLowerCase());
    
    if (isTopGuessCorrect) {
      return Math.min(100, topGuess.confidence * 100);
    }
    
    // 检查其他猜测中是否有正确的
    const correctGuess = results.find(result => 
      result.guess.toLowerCase().includes(actualTarget.toLowerCase()) ||
      actualTarget.toLowerCase().includes(result.guess.toLowerCase())
    );
    
    if (correctGuess) {
      return Math.min(80, correctGuess.confidence * 100);
    }
    
    return 0;
  }

  /**
   * 计算最终得分
   */
  static calculateFinalScore(
    results: GuessResult[], 
    timeSpent: number, 
    aiAccuracy: number
  ): number {
    const baseScore = aiAccuracy;
    const timeBonus = Math.max(0, (GAME_CONFIG.ROUND_TIME_LIMIT - timeSpent) / 10);
    const confidenceBonus = results[0]?.confidence ? results[0].confidence * 20 : 0;
    
    return Math.round(baseScore + timeBonus + confidenceBonus);
  }

  /**
   * 重置游戏
   */
  static resetGame(): GameState {
    return this.createInitialGameState();
  }

  /**
   * 完成游戏会话
   */
  static completeGameSession(
    session: GameSession,
    finalState: GameState,
    canvasData?: CanvasData
  ): GameSession {
    const aiAccuracy = this.calculateAIAccuracy(
      finalState.guessResults, 
      finalState.targetWord, 
      finalState.userAnswer
    );

    return {
      ...session,
      endTime: new Date(),
      drawing: canvasData,
      targetWord: finalState.targetWord,
      userAnswer: finalState.userAnswer,
      aiGuesses: finalState.guessResults,
      finalScore: finalState.score,
      status: 'finished',
      aiAccuracy
    };
  }

  /**
   * 更新玩家统计
   */
  static updatePlayerStats(
    currentStats: PlayerStats,
    completedSession: GameSession
  ): PlayerStats {
    const sessionAccuracy = completedSession.aiAccuracy;
    const playTime = completedSession.endTime && completedSession.startTime 
      ? (completedSession.endTime.getTime() - completedSession.startTime.getTime()) / 1000
      : 0;

    return {
      totalGames: currentStats.totalGames + 1,
      totalScore: currentStats.totalScore + completedSession.finalScore,
      averageGuessAccuracy: this.calculateNewAverage(
        currentStats.averageGuessAccuracy,
        currentStats.totalGames,
        sessionAccuracy
      ),
      favoriteCategories: [...currentStats.favoriteCategories],
      recentDrawings: [
        ...(completedSession.drawing ? [completedSession.drawing] : []),
        ...currentStats.recentDrawings
      ].slice(0, 10),
      bestScore: Math.max(currentStats.bestScore, completedSession.finalScore),
      totalPlayTime: currentStats.totalPlayTime + playTime
    };
  }

  /**
   * 计算新的平均值
   */
  private static calculateNewAverage(
    currentAverage: number,
    currentCount: number,
    newValue: number
  ): number {
    if (currentCount === 0) return newValue;
    return (currentAverage * currentCount + newValue) / (currentCount + 1);
  }

  /**
   * 检查游戏是否结束
   */
  static isGameFinished(gameState: GameState): boolean {
    return gameState.gameStatus === 'finished';
  }

  /**
   * 格式化游戏时间
   */
  static formatGameTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 生成游戏总结
   */
  static generateGameSummary(session: GameSession): {
    finalScore: number;
    aiAccuracy: number;
    targetWord?: string;
    userAnswer?: string;
    topGuess?: string;
    playTime: number;
  } {
    const playTime = session.endTime && session.startTime 
      ? (session.endTime.getTime() - session.startTime.getTime()) / 1000
      : 0;

    return {
      finalScore: session.finalScore,
      aiAccuracy: session.aiAccuracy,
      targetWord: session.targetWord,
      userAnswer: session.userAnswer,
      topGuess: session.aiGuesses[0]?.guess,
      playTime
    };
  }
}