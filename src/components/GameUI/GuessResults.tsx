'use client';

import React from 'react';
import { GuessResult } from '@/types/game';
import { BRAND_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface GuessResultsProps {
  results: GuessResult[];
  isLoading?: boolean;
  className?: string;
}

export default function GuessResults({ 
  results, 
  isLoading = false, 
  className 
}: GuessResultsProps) {
  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">
            🤖
          </div>
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="text-lg font-medium text-gray-700">
              AI正在思考
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            正在分析你的绘画...
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🎨</div>
          <div className="text-sm">
            完成绘画后，AI将为你猜测画作内容
          </div>
        </div>
      </div>
    );
  }

  const correctGuess = results.find(result => result.isCorrect);
  const hasCorrectGuess = !!correctGuess;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}>
      <div className="space-y-4">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            AI的猜测
          </h3>
          {hasCorrectGuess && (
            <div className="flex items-center text-green-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">猜对了！</span>
            </div>
          )}
        </div>

        {/* 结果列表 */}
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-all',
                result.isCorrect 
                  ? 'bg-green-50 border-green-200 ring-2 ring-green-500 ring-opacity-20' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center space-x-3">
                {/* 排名 */}
                <div 
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    result.isCorrect 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {index + 1}
                </div>
                
                {/* 猜测内容 */}
                <div className="flex-1">
                  <div className={cn(
                    'font-medium',
                    result.isCorrect ? 'text-green-800' : 'text-gray-900'
                  )}>
                    {result.guess}
                  </div>
                </div>
              </div>

              {/* 置信度 */}
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">
                  {Math.round(result.confidence * 100)}%
                </div>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-500',
                      result.isCorrect ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ 
                      width: `${result.confidence * 100}%`,
                      backgroundColor: result.isCorrect ? BRAND_COLORS.success : BRAND_COLORS.primary
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 总结信息 */}
        <div className="pt-4 border-t border-gray-200">
          {hasCorrectGuess ? (
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-green-600 font-medium mb-1">
                恭喜！AI成功识别了你的画作
              </div>
              <div className="text-sm text-gray-600">
                正确答案：<span className="font-medium">{correctGuess.guess}</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">🤔</div>
              <div className="text-gray-600 font-medium mb-1">
                AI这次没有猜对
              </div>
              <div className="text-sm text-gray-500">
                不过这些猜测也很有趣呢！
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 简化版结果显示（移动端）
interface CompactGuessResultsProps {
  results: GuessResult[];
  isLoading?: boolean;
  className?: string;
}

export function CompactGuessResults({ 
  results, 
  isLoading = false, 
  className 
}: CompactGuessResultsProps) {
  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">🤖</div>
          <div className="text-sm text-gray-600">AI正在思考...</div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-1">🎨</div>
          <div className="text-xs">等待AI猜测</div>
        </div>
      </div>
    );
  }

  const correctGuess = results.find(result => result.isCorrect);
  const topGuesses = results.slice(0, 3);

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">AI猜测</h4>
          {correctGuess && (
            <div className="text-green-600 text-xs font-medium">✓ 猜对了</div>
          )}
        </div>

        <div className="space-y-2">
          {topGuesses.map((result, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-2 rounded border',
                result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-xs',
                  result.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                )}>
                  {index + 1}
                </div>
                <span className={cn(
                  'text-sm',
                  result.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'
                )}>
                  {result.guess}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}