'use client';

import React, { useState } from 'react';
import { GameState } from '@/types/game';
import { BRAND_COLORS, GAME_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import Button from '@/components/Common/Button';
import { ConfirmModal } from '@/components/Common/Modal';

interface GameControlsProps {
  gameState: GameState;
  onStartGame: (rounds?: number) => void;
  onSubmitDrawing: () => void;
  onNextRound: () => void;
  onResetGame: () => void;
  canSubmitDrawing: boolean;
  hasDrawing: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function GameControls({
  gameState,
  onStartGame,
  onSubmitDrawing,
  onNextRound,
  onResetGame,
  canSubmitDrawing,
  hasDrawing,
  isLoading = false,
  className
}: GameControlsProps) {
  const { isMobile } = useResponsive();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState<number>(GAME_CONFIG.DEFAULT_ROUNDS);

  const handleStartGame = () => {
    onStartGame(selectedRounds);
  };

  const handleResetGame = () => {
    setShowResetConfirm(false);
    onResetGame();
  };

  // 等待开始状态
  if (gameState.gameStatus === 'waiting' && gameState.currentRound === 1) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-900">
            FoxAI 你画我猜
          </h2>
          <p className="text-gray-600">
            在画布上自由创作，让AI来猜测你画的是什么！
          </p>
          
          {/* 回合数选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              选择游戏回合数
            </label>
            <div className="flex justify-center space-x-2">
              {[3, 5, 8, 10].map((rounds) => (
                <button
                  key={rounds}
                  onClick={() => setSelectedRounds(rounds)}
                  className={cn(
                    'px-3 py-2 rounded-lg border-2 transition-all touch-target',
                    selectedRounds === rounds
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{
                    borderColor: selectedRounds === rounds ? BRAND_COLORS.primary : undefined,
                    backgroundColor: selectedRounds === rounds ? BRAND_COLORS.primary + '10' : undefined,
                    color: selectedRounds === rounds ? BRAND_COLORS.primary : undefined
                  }}
                >
                  {rounds} 回合
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            className="w-full max-w-xs"
          >
            开始游戏
          </Button>
        </div>
      </div>
    );
  }

  // 绘画状态
  if (gameState.gameStatus === 'drawing') {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              第 {gameState.currentRound} 回合
            </h3>
            <p className="text-gray-600 text-sm">
              {gameState.currentPrompt || '自由发挥，画出你想画的任何东西！'}
            </p>
          </div>

          <div className={cn(
            'flex gap-3',
            isMobile ? 'flex-col' : 'flex-row'
          )}>
            <Button
              variant="primary"
              onClick={onSubmitDrawing}
              disabled={!canSubmitDrawing || !hasDrawing}
              loading={isLoading}
              className="flex-1"
            >
              {isLoading ? 'AI正在猜测...' : '提交绘画'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              disabled={isLoading}
              className={isMobile ? 'w-full' : 'w-auto'}
            >
              重新开始
            </Button>
          </div>

          {!hasDrawing && (
            <div className="text-center text-sm text-gray-500">
              请先在画布上绘制内容
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI猜测状态
  if (gameState.gameStatus === 'guessing') {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🤖</div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI正在分析你的画作
          </h3>
          <div className="flex items-center justify-center space-x-1">
            <div className="text-gray-600">请稍等</div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 回合结束，等待下一回合
  if (gameState.gameStatus === 'waiting' && gameState.currentRound > 1) {
    const isLastRound = gameState.currentRound > gameState.totalRounds;
    
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center space-y-4">
          {isLastRound ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900">
                游戏结束！
              </h3>
              <p className="text-gray-600">
                恭喜完成所有回合！查看你的最终成绩吧！
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-lg font-semibold text-gray-900">
                第 {gameState.currentRound - 1} 回合完成
              </h3>
              <p className="text-gray-600">
                准备好进行下一回合了吗？
              </p>
            </>
          )}

          <div className={cn(
            'flex gap-3',
            isMobile ? 'flex-col' : 'flex-row justify-center'
          )}>
            {!isLastRound && (
              <Button
                variant="primary"
                onClick={onNextRound}
                className={isMobile ? 'w-full' : 'w-auto'}
              >
                下一回合
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              className={isMobile ? 'w-full' : 'w-auto'}
            >
              重新开始
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 游戏结束状态
  if (gameState.gameStatus === 'finished') {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-gray-900">
            游戏完成！
          </h3>
          <div className="space-y-2">
            <div 
              className="text-3xl font-bold"
              style={{ color: BRAND_COLORS.primary }}
            >
              {gameState.score} 分
            </div>
            <p className="text-gray-600">
              你完成了 {gameState.totalRounds} 个回合的挑战！
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowResetConfirm(true)}
            className="w-full max-w-xs"
          >
            再玩一次
          </Button>
        </div>
      </div>
    );
  }

  return null;

  // 确认重置对话框
  return (
    <>
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetGame}
        title="重新开始游戏"
        message="确定要重新开始吗？当前进度将会丢失。"
        confirmText="确定"
        cancelText="取消"
        variant="warning"
      />
    </>
  );
}

// 浮动操作按钮（移动端）
interface FloatingControlsProps {
  gameState: GameState;
  onSubmitDrawing: () => void;
  canSubmitDrawing: boolean;
  hasDrawing: boolean;
  isLoading?: boolean;
  className?: string;
}

export function FloatingControls({
  gameState,
  onSubmitDrawing,
  canSubmitDrawing,
  hasDrawing,
  isLoading = false,
  className
}: FloatingControlsProps) {
  if (gameState.gameStatus !== 'drawing') {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-10',
      className
    )}>
      <Button
        variant="primary"
        size="lg"
        onClick={onSubmitDrawing}
        disabled={!canSubmitDrawing || !hasDrawing}
        loading={isLoading}
        className="rounded-full shadow-lg"
      >
        {isLoading ? '猜测中...' : '提交'}
      </Button>
    </div>
  );
}