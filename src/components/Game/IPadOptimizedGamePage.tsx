'use client';

import React, { useState, useEffect } from 'react';
import { IPadGameLayout, useMultiScreen } from '@/components/Layout/MultiScreenLayout';
import { useGame } from '@/hooks/useGame';
import { useAdvancedCanvas } from '@/hooks/useAdvancedCanvas';
import { usePlayerStats } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Common/Toast';
import { cn } from '@/lib/utils';

// 导入优化的组件
import { AdvancedCanvasWithErrorBoundary } from '@/components/DrawingCanvas/AdvancedCanvas';
import DrawingHints, { CompactDrawingHints } from '@/components/GameUI/DrawingHints';
import ProgressManager, { CompactProgressManager } from '@/components/GameUI/ProgressManager';

export default function IPadOptimizedGamePage() {
  const screenInfo = useMultiScreen();
  const { toasts, removeToast } = useToast();
  const [hasDrawing, setHasDrawing] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  // 游戏状态管理
  const {
    gameState,
    session,
    isLoading,
    error,
    startGame,
    submitDrawing,
    nextRound,
    resetGame,
    canSubmitDrawing,
    hasResults
  } = useGame();

  // 高性能画布管理
  const {
    canvasRef,
    state: canvasState,
    actions: canvasActions,
    utils: canvasUtils,
    canUndo,
    canRedo,
    performanceLevel,
    renderingStats
  } = useAdvancedCanvas();

  // 玩家统计
  const { stats: playerStats, updateStats } = usePlayerStats();

  // 处理绘画变化
  const handleDrawingChange = (hasContent: boolean) => {
    setHasDrawing(hasContent);
  };

  // 处理提交绘画
  const handleSubmitDrawing = async () => {
    const canvasData = canvasUtils.getCanvasData();
    if (canvasData) {
      try {
        await submitDrawing(canvasData);
      } catch (error) {
        console.error('提交绘画失败:', error);
      }
    }
  };

  // 开始游戏时记录时间
  const handleStartGame = () => {
    setGameStartTime(Date.now());
    startGame();
  };

  // 游戏完成时更新统计
  useEffect(() => {
    if (session && gameState.gameStatus === 'finished' && playerStats) {
      updateStats(session);
    }
  }, [session, gameState.gameStatus, playerStats, updateStats]);

  // 计算绘画时间
  const drawingTime = gameStartTime > 0 ? Date.now() - gameStartTime : 0;

  // 侧边栏内容
  const sidebarContent = (
    <div className="space-y-4 h-full flex flex-col">
      {/* 游戏状态头部 */}
      <IPadGameHeader gameState={gameState} screenInfo={screenInfo} />
      
      {/* 工具栏 */}
      <IPadToolBar
        brushSettings={canvasState.brushSettings}
        onBrushChange={canvasActions.setBrush}
        onUndo={canvasActions.undo}
        onRedo={canvasActions.redo}
        onClear={canvasActions.clear}
        canUndo={canUndo}
        canRedo={canRedo}
        disabled={gameState.gameStatus === 'guessing' || gameState.gameStatus === 'finished'}
        screenInfo={screenInfo}
      />

      {/* 游戏控制 */}
      <IPadGameControls
        gameState={gameState}
        onStartGame={handleStartGame}
        onSubmitDrawing={handleSubmitDrawing}
        onNextRound={nextRound}
        onResetGame={resetGame}
        canSubmitDrawing={canSubmitDrawing}
        hasDrawing={hasDrawing}
        isLoading={isLoading}
        screenInfo={screenInfo}
      />

      {/* AI 猜测结果 */}
      {(hasResults || isLoading) && (
        <IPadGuessResults
          results={gameState.guessResults}
          isLoading={isLoading}
          screenInfo={screenInfo}
        />
      )}

      {/* 进度管理 */}
      <div className="mt-auto">
        <CompactProgressManager
          gameSession={session}
          canvasData={canvasUtils.getCanvasData()}
          currentRound={gameState.currentRound}
          timeRemaining={gameState.timeRemaining}
        />
      </div>

      {/* 性能统计（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
          <div>性能: {performanceLevel}</div>
          <div>帧数: {renderingStats.framesRendered}</div>
          <div>笔画: {canvasState.strokes.length}</div>
        </div>
      )}
    </div>
  );

  return (
    <IPadGameLayout sidebar={sidebarContent}>
      <div className="h-full flex flex-col space-y-4">
        {/* 画布区域 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <AdvancedCanvasWithErrorBoundary
              onDrawingChange={handleDrawingChange}
              disabled={gameState.gameStatus === 'guessing' || gameState.gameStatus === 'finished'}
              width={screenInfo.isIPad && screenInfo.orientation === 'landscape' ? 600 : 500}
              height={screenInfo.isIPad && screenInfo.orientation === 'landscape' ? 600 : 500}
              className="shadow-2xl rounded-2xl overflow-hidden"
            />
            
            {/* 画布状态指示器 */}
            {gameState.gameStatus === 'drawing' && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🎨 绘画中...
              </div>
            )}
            
            {gameState.gameStatus === 'guessing' && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                🤖 AI思考中...
              </div>
            )}
          </div>
        </div>

        {/* 时间和回合信息 */}
        {gameState.gameStatus !== 'waiting' && (
          <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-gray-200/50">
              <div className="flex items-center space-x-6 text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>第 {gameState.currentRound} / {gameState.totalRounds} 回合</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⏱️</span>
                  <span>{Math.ceil(gameState.timeRemaining / 1000)}秒</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⭐</span>
                  <span>{gameState.score}分</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 绘画提示 */}
      {screenInfo.isIPad ? (
        <DrawingHints
          strokes={canvasState.strokes}
          timeElapsed={drawingTime}
          gameContext={{
            currentRound: gameState.currentRound,
            totalRounds: gameState.totalRounds,
            previousAttempts: 0
          }}
          position="top"
        />
      ) : (
        <CompactDrawingHints
          strokes={canvasState.strokes}
          timeElapsed={drawingTime}
          gameContext={{
            currentRound: gameState.currentRound,
            totalRounds: gameState.totalRounds,
            previousAttempts: 0
          }}
        />
      )}

      {/* Toast 通知 */}
      <ToastContainer 
        toasts={toasts.map(toast => ({ ...toast, onClose: removeToast }))} 
        onClose={removeToast} 
      />
    </IPadGameLayout>
  );
}

// iPad优化的游戏头部
function IPadGameHeader({ gameState, screenInfo }: any) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4">
      <div className="text-center space-y-2">
        <h2 className={cn(
          'font-bold',
          screenInfo.isIPad ? 'text-xl' : 'text-lg'
        )}>
          🦊 FoxAI 你画我猜
        </h2>
        {gameState.gameStatus === 'waiting' ? (
          <p className="text-blue-100">准备开始你的创作之旅！</p>
        ) : (
          <p className="text-blue-100">让AI猜猜你的杰作</p>
        )}
      </div>
    </div>
  );
}

// iPad优化的工具栏
function IPadToolBar({ 
  brushSettings, 
  onBrushChange, 
  onUndo, 
  onRedo, 
  onClear, 
  canUndo, 
  canRedo, 
  disabled,
  screenInfo 
}: any) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-gray-800 text-center">🎨 绘画工具</h3>
      
      {/* 画笔大小 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">画笔大小</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSettings.size}
          onChange={(e) => onBrushChange({ size: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full"
        />
        <div className="text-center text-xs text-gray-500">{brushSettings.size}px</div>
      </div>

      {/* 颜色选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">画笔颜色</label>
        <div className="grid grid-cols-4 gap-2">
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'].map(color => (
            <button
              key={color}
              onClick={() => onBrushChange({ color })}
              disabled={disabled}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                brushSettings.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="px-3 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 text-sm"
        >
          ↶ 撤销
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo || disabled}
          className="px-3 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 text-sm"
        >
          ↷ 重做
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          className="px-3 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50 text-sm"
        >
          🗑️ 清空
        </button>
      </div>
    </div>
  );
}

// iPad优化的游戏控制
function IPadGameControls({ 
  gameState, 
  onStartGame, 
  onSubmitDrawing, 
  onNextRound, 
  onResetGame,
  canSubmitDrawing,
  hasDrawing,
  isLoading,
  screenInfo 
}: any) {
  return (
    <div className="space-y-3">
      {gameState.gameStatus === 'waiting' && (
        <button
          onClick={onStartGame}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          🚀 开始游戏
        </button>
      )}

      {gameState.gameStatus === 'drawing' && (
        <button
          onClick={onSubmitDrawing}
          disabled={!canSubmitDrawing || !hasDrawing || isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? '🤖 AI识别中...' : '✨ 让AI猜猜'}
        </button>
      )}

      {gameState.gameStatus === 'finished' && (
        <div className="space-y-2">
          <button
            onClick={onNextRound}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            ➡️ 下一回合
          </button>
          <button
            onClick={onResetGame}
            className="w-full py-2 bg-gray-500 text-white rounded-xl font-medium"
          >
            🔄 重新开始
          </button>
        </div>
      )}
    </div>
  );
}

// iPad优化的猜测结果
function IPadGuessResults({ results, isLoading, screenInfo }: any) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-gray-800 text-center">🤖 AI的猜测</h3>
      
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin text-2xl">🤖</div>
          <p className="text-sm text-gray-600 mt-2">AI正在思考中...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((result: any, index: number) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                result.isCorrect ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
              )}
            >
              <span className="font-medium">{result.guess}</span>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">
                  {Math.round(result.confidence * 100)}%
                </div>
                {result.isCorrect && <span className="text-green-600">✅</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
