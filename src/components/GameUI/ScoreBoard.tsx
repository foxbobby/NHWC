'use client';

import React from 'react';
import { GameSession, PlayerStats } from '@/types/game';
import { BRAND_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface ScoreBoardProps {
  session: GameSession | null;
  playerStats?: PlayerStats;
  className?: string;
}

export default function ScoreBoard({ session, playerStats, className }: ScoreBoardProps) {
  const { isMobile } = useResponsive();

  if (!session) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">开始游戏后查看统计</div>
        </div>
      </div>
    );
  }

  const completedRounds = session.rounds.filter(r => r.completed);
  const correctGuesses = completedRounds.filter(r => r.guesses.some(g => g.isCorrect));
  const accuracy = completedRounds.length > 0 ? (correctGuesses.length / completedRounds.length) * 100 : 0;
  const averageTime = completedRounds.length > 0 
    ? completedRounds.reduce((sum, r) => sum + r.timeSpent, 0) / completedRounds.length 
    : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            游戏统计
          </h3>
          <div className="text-sm text-gray-500">
            第 {session.rounds.length} 回合
          </div>
        </div>

        {/* 当前游戏统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: BRAND_COLORS.primary }}
            >
              {session.totalScore}
            </div>
            <div className="text-xs text-gray-600">总得分</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: BRAND_COLORS.success }}
            >
              {Math.round(accuracy)}%
            </div>
            <div className="text-xs text-gray-600">准确率</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: BRAND_COLORS.secondary }}
            >
              {formatTime(averageTime)}
            </div>
            <div className="text-xs text-gray-600">平均用时</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold mb-1 text-gray-700">
              {correctGuesses.length}
            </div>
            <div className="text-xs text-gray-600">猜对次数</div>
          </div>
        </div>

        {/* 回合详情 */}
        {completedRounds.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">回合详情</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {completedRounds.map((round, index) => {
                const isCorrect = round.guesses.some(g => g.isCorrect);
                return (
                  <div
                    key={round.roundNumber}
                    className={cn(
                      'flex items-center justify-between p-2 rounded border',
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      )}>
                        {round.roundNumber}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {round.prompt || '自由绘画'}
                        </div>
                        {isCorrect && (
                          <div className="text-xs text-green-600">
                            AI猜测: {round.guesses.find(g => g.isCorrect)?.guess}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {round.score}分
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(round.timeSpent)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 历史统计 */}
        {playerStats && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">历史记录</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">总游戏数:</span>
                <span className="font-medium">{playerStats.totalGames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">最高分:</span>
                <span className="font-medium">{playerStats.bestScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均准确率:</span>
                <span className="font-medium">{Math.round(playerStats.averageGuessAccuracy)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">总游戏时长:</span>
                <span className="font-medium">{formatTime(playerStats.totalPlayTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 简化版计分板
interface CompactScoreBoardProps {
  session: GameSession | null;
  className?: string;
}

export function CompactScoreBoard({ session, className }: CompactScoreBoardProps) {
  if (!session) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-1">📊</div>
          <div className="text-xs">等待统计</div>
        </div>
      </div>
    );
  }

  const completedRounds = session.rounds.filter(r => r.completed);
  const correctGuesses = completedRounds.filter(r => r.guesses.some(g => g.isCorrect));
  const accuracy = completedRounds.length > 0 ? (correctGuesses.length / completedRounds.length) * 100 : 0;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-center">统计</h4>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div 
              className="font-bold"
              style={{ color: BRAND_COLORS.primary }}
            >
              {session.totalScore}
            </div>
            <div className="text-xs text-gray-600">得分</div>
          </div>
          
          <div className="text-center p-2 bg-green-50 rounded">
            <div 
              className="font-bold"
              style={{ color: BRAND_COLORS.success }}
            >
              {Math.round(accuracy)}%
            </div>
            <div className="text-xs text-gray-600">准确率</div>
          </div>
        </div>

        {/* 最近回合 */}
        {completedRounds.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">最近回合</div>
            {completedRounds.slice(-2).map((round) => {
              const isCorrect = round.guesses.some(g => g.isCorrect);
              return (
                <div
                  key={round.roundNumber}
                  className={cn(
                    'flex items-center justify-between p-1 rounded text-xs',
                    isCorrect ? 'bg-green-50' : 'bg-red-50'
                  )}
                >
                  <span>第{round.roundNumber}回合</span>
                  <span className="font-medium">{round.score}分</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}