import { CanvasData } from './canvas';

export type GameStatus = 'waiting' | 'drawing' | 'guessing' | 'finished';

export interface GameState {
  currentRound: number;
  score: number;
  timeRemaining: number;
  gameStatus: GameStatus;
  currentPrompt?: string;
  guessResults: GuessResult[];
  totalRounds: number;
  startTime?: Date;
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
  rounds: GameRound[];
  totalScore: number;
  status: GameStatus;
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