import { 
  GameState, 
  GameRound, 
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
      rounds: [],
      totalScore: 0,
      status: 'waiting'
    };
  }

  /**
   * 创建新游戏状态
   */
  static createInitialGameState(totalRounds: number = GAME_CONFIG.DEFAULT_ROUNDS): GameState {
    return {
      currentRound: 1,
      score: 0,
      timeRemaining: GAME_CONFIG.ROUND_TIME_LIMIT,
      gameStatus: 'waiting',
      guessResults: [],
      totalRounds,
      startTime: new Date()
    };
  }

  /**
   * 开始新回合
   */
  static startNewRound(gameState: GameState, prompt?: string): GameState {
    return {
      ...gameState,
      gameStatus: 'drawing',
      timeRemaining: GAME_CONFIG.ROUND_TIME_LIMIT,
      currentPrompt: prompt,
      guessResults: [],
      startTime: new Date()
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
    timeSpent: number
  ): GameState {
    const correctGuess = results.find(result => result.isCorrect);
    const roundScore = this.calculateRoundScore(correctGuess, timeSpent, results);

    const newGameState: GameState = {
      ...gameState,
      guessResults: results,
      score: gameState.score + roundScore,
      gameStatus: gameState.currentRound >= gameState.totalRounds ? 'finished' : 'waiting'
    };

    return newGameState;
  }

  /**
   * 进入下一回合
   */
  static nextRound(gameState: GameState): GameState {
    if (gameState.currentRound >= gameState.totalRounds) {
      return {
        ...gameState,
        gameStatus: 'finished'
      };
    }

    return {
      ...gameState,
      currentRound: gameState.currentRound + 1,
      gameStatus: 'waiting',
      timeRemaining: GAME_CONFIG.ROUND_TIME_LIMIT,
      currentPrompt: undefined,
      guessResults: []
    };
  }

  /**
   * 计算回合得分
   */
  static calculateRoundScore(
    correctGuess: GuessResult | undefined,
    timeSpent: number,
    allResults: GuessResult[]
  ): number {
    if (!correctGuess) return 0;

    let score = GAME_CONFIG.POINTS.CORRECT_GUESS;

    // 时间奖励（越快完成得分越高）
    const timeBonus = Math.max(0, GAME_CONFIG.ROUND_TIME_LIMIT - timeSpent);
    score += Math.floor(timeBonus * GAME_CONFIG.POINTS.TIME_BONUS / GAME_CONFIG.ROUND_TIME_LIMIT);

    // 置信度奖励
    const confidenceBonus = Math.floor(correctGuess.confidence * GAME_CONFIG.POINTS.CONFIDENCE_BONUS);
    score += confidenceBonus;

    return score;
  }

  /**
   * 创建游戏回合记录
   */
  static createGameRound(
    roundNumber: number,
    prompt: string,
    drawing: CanvasData,
    guesses: GuessResult[],
    timeSpent: number
  ): GameRound {
    const correctGuess = guesses.find(g => g.isCorrect);
    const score = this.calculateRoundScore(correctGuess, timeSpent, guesses);

    return {
      roundNumber,
      prompt,
      drawing,
      guesses,
      timeSpent,
      score,
      completed: true,
      startTime: new Date(Date.now() - timeSpent * 1000),
      endTime: new Date()
    };
  }

  /**
   * 完成游戏会话
   */
  static completeGameSession(
    session: GameSession,
    finalState: GameState
  ): GameSession {
    return {
      ...session,
      endTime: new Date(),
      totalScore: finalState.score,
      status: 'finished'
    };
  }

  /**
   * 更新玩家统计
   */
  static updatePlayerStats(
    currentStats: PlayerStats,
    completedSession: GameSession
  ): PlayerStats {
    const correctGuesses = completedSession.rounds.reduce(
      (count, round) => count + (round.guesses.some(g => g.isCorrect) ? 1 : 0),
      0
    );
    
    const totalGuesses = completedSession.rounds.length;
    const sessionAccuracy = totalGuesses > 0 ? (correctGuesses / totalGuesses) * 100 : 0;
    
    const totalPlayTime = completedSession.rounds.reduce(
      (total, round) => total + round.timeSpent,
      0
    );

    return {
      totalGames: currentStats.totalGames + 1,
      totalScore: currentStats.totalScore + completedSession.totalScore,
      averageGuessAccuracy: this.calculateNewAverage(
        currentStats.averageGuessAccuracy,
        currentStats.totalGames,
        sessionAccuracy
      ),
      favoriteCategories: [...currentStats.favoriteCategories], // TODO: 实现分类统计
      recentDrawings: [
        ...completedSession.rounds.map(r => r.drawing).filter((d): d is CanvasData => d !== undefined),
        ...currentStats.recentDrawings
      ].slice(0, 10), // 保留最近10个绘画
      bestScore: Math.max(currentStats.bestScore, completedSession.totalScore),
      totalPlayTime: currentStats.totalPlayTime + totalPlayTime
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
    return gameState.gameStatus === 'finished' || 
           gameState.currentRound > gameState.totalRounds;
  }

  /**
   * 获取游戏进度百分比
   */
  static getGameProgress(gameState: GameState): number {
    return Math.min(100, (gameState.currentRound / gameState.totalRounds) * 100);
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
   * 获取难度等级
   */
  static getDifficultyLevel(timeSpent: number): 'easy' | 'medium' | 'hard' {
    if (timeSpent <= 15) return 'hard';
    if (timeSpent <= 30) return 'medium';
    return 'easy';
  }

  /**
   * 生成游戏总结
   */
  static generateGameSummary(session: GameSession): {
    totalScore: number;
    accuracy: number;
    averageTime: number;
    bestRound: GameRound | null;
    difficulty: 'easy' | 'medium' | 'hard';
  } {
    const rounds = session.rounds;
    const correctRounds = rounds.filter(r => r.guesses.some(g => g.isCorrect));
    const accuracy = rounds.length > 0 ? (correctRounds.length / rounds.length) * 100 : 0;
    
    const totalTime = rounds.reduce((sum, r) => sum + r.timeSpent, 0);
    const averageTime = rounds.length > 0 ? totalTime / rounds.length : 0;
    
    const bestRound = rounds.reduce((best, current) => 
      !best || current.score > best.score ? current : best, 
      null as GameRound | null
    );

    const difficulty = this.getDifficultyLevel(averageTime);

    return {
      totalScore: session.totalScore,
      accuracy,
      averageTime,
      bestRound,
      difficulty
    };
  }
}