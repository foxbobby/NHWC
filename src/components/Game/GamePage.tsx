'use client';

import React, { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useCanvas } from '@/hooks/useCanvas';
import { usePlayerStats } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Common/Toast';
import { useResponsive } from '@/hooks/useResponsive';

// 组件导入
import ResponsiveLayout, { GameLayout } from '@/components/Layout/ResponsiveLayout';
import MobileOptimized, { SafeArea } from '@/components/Layout/MobileOptimized';
import ErrorBoundary, { GameErrorBoundary, CanvasErrorBoundary } from '@/components/Common/ErrorBoundary';

import GameHeader, { CompactGameHeader } from '@/components/GameUI/GameHeader';
import ScoreBoard, { CompactScoreBoard } from '@/components/GameUI/ScoreBoard';
import GameControls, { FloatingControls } from '@/components/GameUI/GameControls';
import GuessResults, { CompactGuessResults } from '@/components/GameUI/GuessResults';

import Canvas from '@/components/DrawingCanvas/Canvas';
import ToolBar, { CompactToolBar } from '@/components/DrawingCanvas/ToolBar';

export default function GamePage() {
  const { isMobile, isTablet } = useResponsive();
  const { toasts, removeToast } = useToast();
  const [hasDrawing, setHasDrawing] = useState(false);

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

  // 画布管理
  const { 
    canvasRef, 
    state: canvasState, 
    actions: canvasActions,
    utils: canvasUtils,
    canUndo,
    canRedo
  } = useCanvas();

  // 玩家统计
  const { stats: playerStats, updateStats } = usePlayerStats();

  // 处理绘画变化
  const handleDrawingChange = (hasContent: boolean) => {
    setHasDrawing(hasContent);
  };

  // 处理提交绘画
  const handleSubmitDrawing = async () => {
    console.log('handleSubmitDrawing called');
    const canvasData = canvasUtils.getCanvasData();
    console.log('canvasData:', canvasData);
    if (canvasData) {
      console.log('Submitting drawing...');
      try {
        await submitDrawing(canvasData);
        console.log('Drawing submitted successfully');
      } catch (error) {
        console.error('Error submitting drawing:', error);
      }
    } else {
      console.log('No canvas data available');
    }
  };

  // 处理游戏完成
  React.useEffect(() => {
    if (session && gameState.gameStatus === 'finished' && playerStats) {
      updateStats(session);
    }
  }, [session, gameState.gameStatus, playerStats, updateStats]);

  // 渲染移动端布局
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileOptimized>
          <SafeArea>
            <div className="flex flex-col h-full bg-gray-50 p-4">
              {/* 头部 */}
              <CompactGameHeader gameState={gameState} className="mb-4" />
              
              {/* 主要内容区域 */}
              <div className="flex-1 flex flex-col space-y-4">
                {/* 画布区域 */}
                <CanvasErrorBoundary>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <Canvas
                      onDrawingChange={handleDrawingChange}
                      disabled={gameState.gameStatus === 'guessing' || gameState.gameStatus === 'finished'}
                      className="w-full"
                      canvasState={canvasState}
                      canvasActions={canvasActions}
                      canvasUtils={canvasUtils}
                    />
                    
                    {/* 紧凑工具栏 */}
                    <div className="mt-4">
                      <CompactToolBar
                        brushSettings={canvasState.brushSettings}
                        onBrushChange={canvasActions.setBrush}
                        onUndo={canvasActions.undo}
                        onRedo={canvasActions.redo}
                        onClear={canvasActions.clear}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        disabled={gameState.gameStatus === 'guessing' || gameState.gameStatus === 'finished'}
                      />
                    </div>
                  </div>
                </CanvasErrorBoundary>

                {/* 游戏控制 */}
                <GameErrorBoundary>
                  <GameControls
                    gameState={gameState}
                    onStartGame={startGame}
                    onSubmitDrawing={handleSubmitDrawing}
                    onNextRound={nextRound}
                    onResetGame={resetGame}
                    canSubmitDrawing={canSubmitDrawing}
                    hasDrawing={hasDrawing}
                    isLoading={isLoading}
                  />
                </GameErrorBoundary>

                {/* AI 猜测结果 */}
                {(hasResults || isLoading) && (
                  <CompactGuessResults
                    results={gameState.guessResults}
                    isLoading={isLoading}
                  />
                )}

                {/* 统计信息 */}
                <CompactScoreBoard session={session} />
              </div>

              {/* 浮动提交按钮 */}
              <FloatingControls
                gameState={gameState}
                onSubmitDrawing={handleSubmitDrawing}
                canSubmitDrawing={canSubmitDrawing}
                hasDrawing={hasDrawing}
                isLoading={isLoading}
              />
            </div>
          </SafeArea>
        </MobileOptimized>
        
        {/* Toast 通知 */}
        <ToastContainer toasts={toasts.map(toast => ({ ...toast, onClose: removeToast }))} onClose={removeToast} />
      </ErrorBoundary>
    );
  }

  // 渲染桌面端/平板端布局
  return (
    <ErrorBoundary>
      <ResponsiveLayout showHeader={false}>
        <GameLayout
          sidebar={
            <div className="space-y-4">
              {/* 工具栏 */}
              <CanvasErrorBoundary>
                <ToolBar
                  brushSettings={canvasState.brushSettings}
                  onBrushChange={canvasActions.setBrush}
                  onUndo={canvasActions.undo}
                  onRedo={canvasActions.redo}
                  onClear={canvasActions.clear}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  disabled={gameState.gameStatus === 'guessing' || gameState.gameStatus === 'finished'}
                />
              </CanvasErrorBoundary>

              {/* 游戏控制 */}
              <GameErrorBoundary>
                <GameControls
                  gameState={gameState}
                  onStartGame={startGame}
                  onSubmitDrawing={handleSubmitDrawing}
                  onNextRound={nextRound}
                  onResetGame={resetGame}
                  canSubmitDrawing={canSubmitDrawing}
                  hasDrawing={hasDrawing}
                  isLoading={isLoading}
                />
              </GameErrorBoundary>

              {/* AI 猜测结果 */}
              {(hasResults || isLoading) && (
                <GuessResults
                  results={gameState.guessResults}
                  isLoading={isLoading}
                />
              )}

              {/* 统计信息 */}
              <ScoreBoard session={session} playerStats={playerStats || undefined} />
            </div>
          }
        >
          <div className="space-y-4">
            {/* 游戏头部 */}
            <GameHeader gameState={gameState} />
            
            {/* 画布区域 */}
            <CanvasErrorBoundary>
              <div className="canvas-container">
                <Canvas
                  onDrawingChange={handleDrawingChange}
                  disabled={gameState.gameStatus === 'guessing' || gameState.gameStatus === 'finished'}
                  canvasState={canvasState}
                  canvasActions={canvasActions}
                  canvasUtils={canvasUtils}
                />
              </div>
            </CanvasErrorBoundary>
          </div>
        </GameLayout>
        
        {/* Toast 通知 */}
        <ToastContainer toasts={toasts.map(toast => ({ ...toast, onClose: removeToast }))} onClose={removeToast} />
      </ResponsiveLayout>
    </ErrorBoundary>
  );
}