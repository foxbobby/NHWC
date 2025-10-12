'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProgressSave, uxEnhancer } from '@/services/userExperienceEnhancer';
import { GameSession } from '@/types/game';
import { CanvasData } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface ProgressManagerProps {
  gameSession: Partial<GameSession> | null;
  canvasData: CanvasData | null;
  currentRound: number;
  timeRemaining: number;
  onLoadProgress?: (save: ProgressSave) => void;
  onAutoSave?: (saveId: string) => void;
  className?: string;
}

export default function ProgressManager({
  gameSession,
  canvasData,
  currentRound,
  timeRemaining,
  onLoadProgress,
  onAutoSave,
  className
}: ProgressManagerProps) {
  const [saves, setSaves] = useState<ProgressSave[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 加载保存的进度
  const loadSaves = useCallback(() => {
    const loadedSaves = uxEnhancer.loadProgress();
    if (Array.isArray(loadedSaves)) {
      setSaves(loadedSaves);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadSaves();
  }, [loadSaves]);

  // 自动保存
  useEffect(() => {
    if (!gameSession || !canvasData) return;

    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // 30秒自动保存

    return () => clearInterval(autoSaveInterval);
  }, [gameSession, canvasData, currentRound, timeRemaining]);

  // 手动保存
  const handleManualSave = useCallback(() => {
    if (!gameSession || !canvasData) return;

    setIsLoading(true);
    try {
      const saveId = uxEnhancer.saveProgress(
        gameSession,
        canvasData,
        currentRound,
        timeRemaining,
        false // 手动保存
      );
      
      loadSaves(); // 重新加载保存列表
      setShowSaveDialog(false);
      console.log('手动保存成功:', saveId);
    } catch (error) {
      console.error('手动保存失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameSession, canvasData, currentRound, timeRemaining, loadSaves]);

  // 自动保存
  const handleAutoSave = useCallback(() => {
    if (!gameSession || !canvasData) return;

    try {
      const saveId = uxEnhancer.saveProgress(
        gameSession,
        canvasData,
        currentRound,
        timeRemaining,
        true // 自动保存
      );
      
      setLastAutoSave(new Date());
      onAutoSave?.(saveId);
      console.log('自动保存成功:', saveId);
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }, [gameSession, canvasData, currentRound, timeRemaining, onAutoSave]);

  // 加载进度
  const handleLoadProgress = useCallback((save: ProgressSave) => {
    onLoadProgress?.(save);
    setShowLoadDialog(false);
  }, [onLoadProgress]);

  // 删除保存
  const handleDeleteSave = useCallback((saveId: string) => {
    if (uxEnhancer.deleteProgress(saveId)) {
      loadSaves();
    }
  }, [loadSaves]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // 获取保存类型图标
  const getSaveIcon = (autoSave: boolean) => {
    return autoSave ? '🔄' : '💾';
  };

  return (
    <div className={cn('relative', className)}>
      {/* 主控制按钮 */}
      <div className="flex items-center space-x-2">
        {/* 网络状态指示器 */}
        <div className={cn(
          'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
          isOnline 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span>{isOnline ? '在线' : '离线'}</span>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={!gameSession || !canvasData || isLoading}
          className={cn(
            'flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span>💾</span>
          <span>保存</span>
        </button>

        {/* 加载按钮 */}
        <button
          onClick={() => {
            loadSaves();
            setShowLoadDialog(true);
          }}
          className={cn(
            'flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-green-500 text-white hover:bg-green-600'
          )}
        >
          <span>📂</span>
          <span>加载</span>
        </button>
      </div>

      {/* 自动保存状态 */}
      {lastAutoSave && (
        <div className="mt-2 text-xs text-gray-500">
          上次自动保存: {formatTime(lastAutoSave)}
        </div>
      )}

      {/* 保存对话框 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">保存游戏进度</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">当前回合:</span>
                <span className="font-medium">{currentRound}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">剩余时间:</span>
                <span className="font-medium">{Math.ceil(timeRemaining / 1000)}秒</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">网络状态:</span>
                <span className={cn(
                  'font-medium',
                  isOnline ? 'text-green-600' : 'text-red-600'
                )}>
                  {isOnline ? '在线保存' : '离线保存'}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleManualSave}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载对话框 */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">加载游戏进度</h3>
            
            {saves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📁</div>
                <p>暂无保存的进度</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getSaveIcon(save.autoSave)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            第 {save.currentRound} 回合
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(save.timestamp)}
                            {save.autoSave && ' (自动)'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLoadProgress(save)}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        加载
                      </button>
                      <button
                        onClick={() => handleDeleteSave(save.id)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 紧凑版进度管理器（用于移动端）
export function CompactProgressManager({
  gameSession,
  canvasData,
  currentRound,
  timeRemaining,
  onLoadProgress,
  onAutoSave,
  className
}: ProgressManagerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMenu, setShowMenu] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 自动保存
  useEffect(() => {
    if (!gameSession || !canvasData) return;

    const autoSaveInterval = setInterval(() => {
      try {
        const saveId = uxEnhancer.saveProgress(
          gameSession,
          canvasData,
          currentRound,
          timeRemaining,
          true
        );
        setLastAutoSave(new Date());
        onAutoSave?.(saveId);
      } catch (error) {
        console.error('自动保存失败:', error);
      }
    }, 45000); // 移动端降低自动保存频率

    return () => clearInterval(autoSaveInterval);
  }, [gameSession, canvasData, currentRound, timeRemaining, onAutoSave]);

  return (
    <div className={cn('relative', className)}>
      {/* 主按钮 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          'flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-colors',
          'bg-white border border-gray-300 shadow-sm hover:bg-gray-50'
        )}
      >
        <div className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500'
        )} />
        <span>💾</span>
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs text-gray-500 mb-1">
              状态: {isOnline ? '在线' : '离线'}
            </div>
            {lastAutoSave && (
              <div className="text-xs text-gray-500">
                上次保存: {formatTime(lastAutoSave)}
              </div>
            )}
          </div>
          
          <div className="p-1">
            <button
              onClick={() => {
                // 手动保存逻辑
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              💾 手动保存
            </button>
            <button
              onClick={() => {
                // 加载进度逻辑
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              📂 加载进度
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 辅助函数
function formatTime(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}
