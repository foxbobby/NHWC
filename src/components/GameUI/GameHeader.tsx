'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { BRAND_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface GameHeaderProps {
  gameState: GameState;
  className?: string;
}

export default function GameHeader({ gameState, className }: GameHeaderProps) {
  const { isMobile } = useResponsive();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (status: GameState['gameStatus']): string => {
    switch (status) {
      case 'waiting': return '准备开始';
      case 'drawing': return '正在绘画';
      case 'guessing': return 'AI正在猜测';
      case 'finished': return '游戏结束';
      default: return '';
    }
  };

  const getStatusColor = (status: GameState['gameStatus']): string => {
    switch (status) {
      case 'waiting': return BRAND_COLORS.neutral;
      case 'drawing': return BRAND_COLORS.primary;
      case 'guessing': return BRAND_COLORS.secondary;
      case 'finished': return BRAND_COLORS.success;
      default: return BRAND_COLORS.neutral;
    }
  };

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-4',
      className
    )}>
      <div className={cn(
        'flex items-center justify-between',
        isMobile && 'flex-col space-y-3'
      )}>
        {/* Logo和标题 */}
        <div className="flex items-center space-x-3">
          <div 
            className="text-2xl font-bold"
            style={{ color: BRAND_COLORS.primary }}
          >
            🦊 FoxAI
          </div>
          <div className="text-sm text-gray-600 hidden sm:block">
            你画我猜
          </div>
        </div>

        {/* 游戏状态 */}
        <div className={cn(
          'flex items-center space-x-4',
          isMobile && 'w-full justify-between'
        )}>
          {/* 回合信息 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">回合</div>
            <div className="text-lg font-bold text-gray-900">
              {gameState.currentRound} / {gameState.totalRounds}
            </div>
          </div>

          {/* 分数 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">得分</div>
            <div 
              className="text-lg font-bold"
              style={{ color: BRAND_COLORS.primary }}
            >
              {gameState.score.toLocaleString()}
            </div>
          </div>

          {/* 时间 */}
          {gameState.gameStatus === 'drawing' && (
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">剩余时间</div>
              <div 
                className={cn(
                  'text-lg font-bold',
                  gameState.timeRemaining <= 10 ? 'text-red-500' : 'text-gray-900'
                )}
              >
                {formatTime(gameState.timeRemaining)}
              </div>
            </div>
          )}

          {/* 状态指示器 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">状态</div>
            <div 
              className="text-sm font-medium px-2 py-1 rounded-full"
              style={{ 
                color: getStatusColor(gameState.gameStatus),
                backgroundColor: getStatusColor(gameState.gameStatus) + '20'
              }}
            >
              {getStatusText(gameState.gameStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>游戏进度</span>
          <span>{Math.round((gameState.currentRound / gameState.totalRounds) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(gameState.currentRound / gameState.totalRounds) * 100}%`,
              backgroundColor: BRAND_COLORS.primary
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 紧凑版游戏头部（移动端）
interface CompactGameHeaderProps {
  gameState: GameState;
  className?: string;
}

export function CompactGameHeader({ gameState, className }: CompactGameHeaderProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-3',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        {/* Logo */}
        <div 
          className="text-lg font-bold"
          style={{ color: BRAND_COLORS.primary }}
        >
          🦊 FoxAI
        </div>

        {/* 核心信息 */}
        <div className="flex items-center space-x-3 text-sm">
          <div className="text-center">
            <div className="text-xs text-gray-500">回合</div>
            <div className="font-bold">{gameState.currentRound}/{gameState.totalRounds}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500">得分</div>
            <div 
              className="font-bold"
              style={{ color: BRAND_COLORS.primary }}
            >
              {gameState.score}
            </div>
          </div>

          {gameState.gameStatus === 'drawing' && (
            <div className="text-center">
              <div className="text-xs text-gray-500">时间</div>
              <div 
                className={cn(
                  'font-bold',
                  gameState.timeRemaining <= 10 ? 'text-red-500' : 'text-gray-900'
                )}
              >
                {formatTime(gameState.timeRemaining)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 简化进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className="h-1 rounded-full transition-all duration-300"
          style={{ 
            width: `${(gameState.currentRound / gameState.totalRounds) * 100}%`,
            backgroundColor: BRAND_COLORS.primary
          }}
        />
      </div>
    </div>
  );
}