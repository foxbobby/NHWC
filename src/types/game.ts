import { CanvasData } from './canvas';

export type GameStatus = 'waiting' | 'drawing' | 'guessing' | 'finished';

export interface GameState {
  score: number;
  timeRemaining: number;
  gameStatus: GameStatus;
  currentPrompt?: string;
  guessResults: GuessResult[];
  startTime?: Date;
  targetWord?: string; // 用户想要画的目标词汇
  userAnswer?: string; // 用户输入的答案（用于验证AI的准确性）
}

export interface GuessResult {
  guess: string;
  confidence: number;
  isCorrect: boolean;
}

export interface GameRound {
  roundNumber: number;
  prompt: string;
  drawing?: CanvasData;
  guesses: GuessResult[];
  timeSpent: number;
  score: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface GameSession {
  id: string;
  playerId: string;
  startTime: Date;
  endTime?: Date;
  drawing?: CanvasData;
  targetWord?: string;
  userAnswer?: string;
  aiGuesses: GuessResult[];
  finalScore: number;
  status: GameStatus;
  aiAccuracy: number; // AI猜测的准确性评分
}

export interface PlayerStats {
  totalGames: number;
  totalScore: number;
  averageGuessAccuracy: number;
  favoriteCategories: string[];
  recentDrawings: CanvasData[];
  bestScore: number;
  totalPlayTime: number;
}

export interface GamePreferences {
  brushSize: number;
  brushColor: string;
  canvasSize: { width: number; height: number };
  soundEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LocalGameData {
  playerStats: PlayerStats;
  gameHistory: GameSession[];
  preferences: GamePreferences;
  lastUpdated: Date;
}