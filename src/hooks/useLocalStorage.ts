'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlayerStats, GameSession, GamePreferences } from '@/types/game';
import { StorageService } from '@/services/storageService';
import { GameLogic } from '@/services/gameLogic';
import { useToast } from '@/hooks/useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';

/**
 * 玩家统计数据钩子
 */
export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  // 加载统计数据
  useEffect(() => {
    try {
      const playerStats = StorageService.getPlayerStats();
      setStats(playerStats);
    } catch (err) {
      console.error('加载玩家统计失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  // 更新统计数据
  const updateStats = useCallback((completedSession: GameSession) => {
    if (!stats) return;

    try {
      const updatedStats = GameLogic.updatePlayerStats(stats, completedSession);
      setStats(updatedStats);
      
      const saved = StorageService.savePlayerStats(updatedStats);
      if (saved) {
        success(SUCCESS_MESSAGES.SETTINGS_SAVED);
      } else {
        error(ERROR_MESSAGES.STORAGE_ERROR);
      }
    } catch (err) {
      console.error('更新玩家统计失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [stats, success, error]);

  // 重置统计数据
  const resetStats = useCallback(() => {
    try {
      const defaultStats: PlayerStats = {
        totalGames: 0,
        totalScore: 0,
        averageGuessAccuracy: 0,
        favoriteCategories: [],
        recentDrawings: [],
        bestScore: 0,
        totalPlayTime: 0
      };
      
      setStats(defaultStats);
      StorageService.savePlayerStats(defaultStats);
      success('统计数据已重置');
    } catch (err) {
      console.error('重置统计数据失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [success, error]);

  return {
    stats,
    isLoading,
    updateStats,
    resetStats
  };
}

/**
 * 游戏历史记录钩子
 */
export function useGameHistory() {
  const [history, setHistory] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  // 加载历史记录
  useEffect(() => {
    try {
      const gameHistory = StorageService.getGameHistory();
      setHistory(gameHistory);
    } catch (err) {
      console.error('加载游戏历史失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  // 保存游戏会话
  const saveSession = useCallback((session: GameSession) => {
    try {
      const saved = StorageService.saveGameSession(session);
      if (saved) {
        setHistory(prev => [session, ...prev.slice(0, 49)]); // 保持最新50个
        success(SUCCESS_MESSAGES.DRAWING_SAVED);
      } else {
        error(ERROR_MESSAGES.STORAGE_ERROR);
      }
    } catch (err) {
      console.error('保存游戏会话失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [success, error]);

  // 删除游戏会话
  const deleteSession = useCallback((sessionId: string) => {
    try {
      const updatedHistory = history.filter(session => session.id !== sessionId);
      setHistory(updatedHistory);
      StorageService.saveGameSession(updatedHistory[0]);
      success('游戏记录已删除');
    } catch (err) {
      console.error('删除游戏会话失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [history, success, error]);

  // 清空历史记录
  const clearHistory = useCallback(() => {
    try {
      setHistory([]);
      StorageService.clearAllData();
      success('历史记录已清空');
    } catch (err) {
      console.error('清空历史记录失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [success, error]);

  return {
    history,
    isLoading,
    saveSession,
    deleteSession,
    clearHistory
  };
}

/**
 * 游戏偏好设置钩子
 */
export function useGamePreferences() {
  const [preferences, setPreferences] = useState<GamePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  // 加载偏好设置
  useEffect(() => {
    try {
      const gamePreferences = StorageService.getPreferences();
      setPreferences(gamePreferences);
    } catch (err) {
      console.error('加载游戏偏好失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  // 更新偏好设置
  const updatePreferences = useCallback((updates: Partial<GamePreferences>) => {
    if (!preferences) return;

    try {
      const updatedPreferences = { ...preferences, ...updates };
      setPreferences(updatedPreferences);
      
      const saved = StorageService.savePreferences(updatedPreferences);
      if (!saved) {
        error(ERROR_MESSAGES.STORAGE_ERROR);
      }
    } catch (err) {
      console.error('更新游戏偏好失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [preferences, error]);

  // 重置偏好设置
  const resetPreferences = useCallback(() => {
    try {
      const defaultPreferences = StorageService.getPreferences();
      setPreferences(defaultPreferences);
      StorageService.savePreferences(defaultPreferences);
      success(SUCCESS_MESSAGES.SETTINGS_SAVED);
    } catch (err) {
      console.error('重置偏好设置失败:', err);
      error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }, [success, error]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    resetPreferences
  };
}

/**
 * 存储管理钩子
 */
export function useStorageManager() {
  const { success, error } = useToast();

  // 导出数据
  const exportData = useCallback(() => {
    try {
      const data = StorageService.exportGameData();
      if (data) {
        // 创建下载链接
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `foxai-game-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        success('数据导出成功');
      } else {
        error('数据导出失败');
      }
    } catch (err) {
      console.error('导出数据失败:', err);
      error('数据导出失败');
    }
  }, [success, error]);

  // 导入数据
  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const imported = StorageService.importGameData(jsonData);
        
        if (imported) {
          success('数据导入成功，请刷新页面');
          // 延迟刷新页面以显示成功消息
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          error('数据导入失败，请检查文件格式');
        }
      } catch (err) {
        console.error('导入数据失败:', err);
        error('数据导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  }, [success, error]);

  // 清除所有数据
  const clearAllData = useCallback(() => {
    try {
      const cleared = StorageService.clearAllData();
      if (cleared) {
        success('所有数据已清除，请刷新页面');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        error('清除数据失败');
      }
    } catch (err) {
      console.error('清除数据失败:', err);
      error('清除数据失败');
    }
  }, [success, error]);

  // 获取存储使用情况
  const getStorageUsage = useCallback(() => {
    return StorageService.getStorageUsage();
  }, []);

  // 清理旧数据
  const cleanupOldData = useCallback((keepDays: number = 30) => {
    try {
      const cleaned = StorageService.cleanupOldData(keepDays);
      if (cleaned) {
        success(`已清理${keepDays}天前的旧数据`);
      } else {
        error('清理数据失败');
      }
    } catch (err) {
      console.error('清理数据失败:', err);
      error('清理数据失败');
    }
  }, [success, error]);

  return {
    exportData,
    importData,
    clearAllData,
    getStorageUsage,
    cleanupOldData
  };
}