'use client';

import { PlayerStats, GameSession, GamePreferences, LocalGameData } from '@/types/game';
import { STORAGE_KEYS, GAME_CONFIG, BRUSH_CONFIG } from '@/lib/constants';

export class StorageService {
  /**
   * 检查localStorage是否可用
   */
  private static isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 安全地获取localStorage数据
   */
  private static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isStorageAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`读取localStorage失败 (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 安全地设置localStorage数据
   */
  private static setItem<T>(key: string, value: T): boolean {
    if (!this.isStorageAvailable()) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`写入localStorage失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 获取玩家统计数据
   */
  static getPlayerStats(): PlayerStats {
    return this.getItem(STORAGE_KEYS.PLAYER_STATS, {
      totalGames: 0,
      totalScore: 0,
      averageGuessAccuracy: 0,
      favoriteCategories: [],
      recentDrawings: [],
      bestScore: 0,
      totalPlayTime: 0
    });
  }

  /**
   * 保存玩家统计数据
   */
  static savePlayerStats(stats: PlayerStats): boolean {
    return this.setItem(STORAGE_KEYS.PLAYER_STATS, {
      ...stats,
      lastUpdated: new Date()
    });
  }

  /**
   * 获取游戏历史记录
   */
  static getGameHistory(): GameSession[] {
    const history = this.getItem<GameSession[]>(STORAGE_KEYS.GAME_HISTORY, []);
    
    // 转换日期字符串为Date对象
    return history.map(session => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      rounds: session.rounds.map(round => ({
        ...round,
        startTime: new Date(round.startTime),
        endTime: round.endTime ? new Date(round.endTime) : undefined,
        drawing: {
          ...round.drawing,
          timestamp: new Date(round.drawing.timestamp)
        }
      }))
    }));
  }

  /**
   * 保存游戏会话到历史记录
   */
  static saveGameSession(session: GameSession): boolean {
    const history = this.getGameHistory();
    
    // 添加新会话到历史记录开头
    history.unshift(session);
    
    // 限制历史记录数量（保留最近50个游戏）
    const limitedHistory = history.slice(0, 50);
    
    return this.setItem(STORAGE_KEYS.GAME_HISTORY, limitedHistory);
  }

  /**
   * 获取游戏偏好设置
   */
  static getPreferences(): GamePreferences {
    return this.getItem(STORAGE_KEYS.PREFERENCES, {
      brushSize: BRUSH_CONFIG.DEFAULT_SIZE,
      brushColor: BRUSH_CONFIG.DEFAULT_COLOR,
      canvasSize: {
        width: GAME_CONFIG.DEFAULT_ROUNDS,
        height: GAME_CONFIG.DEFAULT_ROUNDS
      },
      soundEnabled: true,
      difficulty: 'medium'
    });
  }

  /**
   * 保存游戏偏好设置
   */
  static savePreferences(preferences: GamePreferences): boolean {
    return this.setItem(STORAGE_KEYS.PREFERENCES, preferences);
  }

  /**
   * 获取完整的本地游戏数据
   */
  static getLocalGameData(): LocalGameData {
    return {
      playerStats: this.getPlayerStats(),
      gameHistory: this.getGameHistory(),
      preferences: this.getPreferences(),
      lastUpdated: new Date()
    };
  }

  /**
   * 保存完整的本地游戏数据
   */
  static saveLocalGameData(data: LocalGameData): boolean {
    const success = [
      this.savePlayerStats(data.playerStats),
      this.setItem(STORAGE_KEYS.GAME_HISTORY, data.gameHistory),
      this.savePreferences(data.preferences)
    ].every(Boolean);

    return success;
  }

  /**
   * 清除所有游戏数据
   */
  static clearAllData(): boolean {
    if (!this.isStorageAvailable()) return false;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('清除数据失败:', error);
      return false;
    }
  }

  /**
   * 导出游戏数据（用于备份）
   */
  static exportGameData(): string | null {
    try {
      const data = this.getLocalGameData();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.warn('导出数据失败:', error);
      return null;
    }
  }

  /**
   * 导入游戏数据（用于恢复）
   */
  static importGameData(jsonData: string): boolean {
    try {
      const data: LocalGameData = JSON.parse(jsonData);
      
      // 验证数据格式
      if (!data.playerStats || !data.gameHistory || !data.preferences) {
        throw new Error('数据格式无效');
      }

      return this.saveLocalGameData(data);
    } catch (error) {
      console.warn('导入数据失败:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   */
  static getStorageUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if (!this.isStorageAvailable()) return null;

    try {
      let used = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length;
        }
      });

      // localStorage通常限制为5MB
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      console.warn('获取存储使用情况失败:', error);
      return null;
    }
  }

  /**
   * 清理旧数据（保留最近的数据）
   */
  static cleanupOldData(keepDays: number = 30): boolean {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const history = this.getGameHistory();
      const filteredHistory = history.filter(session => 
        session.startTime > cutoffDate
      );

      return this.setItem(STORAGE_KEYS.GAME_HISTORY, filteredHistory);
    } catch (error) {
      console.warn('清理旧数据失败:', error);
      return false;
    }
  }

  /**
   * 获取游戏统计摘要
   */
  static getStatsSummary(): {
    totalGames: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    totalPlayTime: number;
    averageAccuracy: number;
    recentGames: number;
  } {
    const stats = this.getPlayerStats();
    const history = this.getGameHistory();
    
    const recentGames = history.filter(session => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return session.startTime > weekAgo;
    }).length;

    const averageScore = stats.totalGames > 0 ? stats.totalScore / stats.totalGames : 0;

    return {
      totalGames: stats.totalGames,
      totalScore: stats.totalScore,
      averageScore: Math.round(averageScore),
      bestScore: stats.bestScore,
      totalPlayTime: stats.totalPlayTime,
      averageAccuracy: stats.averageGuessAccuracy,
      recentGames
    };
  }
}