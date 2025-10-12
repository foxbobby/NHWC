'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DrawingHint, uxEnhancer } from '@/services/userExperienceEnhancer';
import { DrawingStroke } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface DrawingHintsProps {
  strokes: DrawingStroke[];
  timeElapsed: number;
  gameContext?: {
    currentRound: number;
    totalRounds: number;
    previousAttempts: number;
  };
  className?: string;
  position?: 'top' | 'bottom' | 'floating';
}

export default function DrawingHints({
  strokes,
  timeElapsed,
  gameContext,
  className,
  position = 'floating'
}: DrawingHintsProps) {
  const [activeHints, setActiveHints] = useState<DrawingHint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  // 分析绘画并获取提示
  const analyzeAndShowHints = useCallback(() => {
    const hints = uxEnhancer.analyzeDrawingAndProvideHints(
      strokes,
      timeElapsed,
      gameContext
    );

    // 过滤已经被用户关闭的提示
    const newHints = hints.filter(hint => !dismissedHints.has(hint.id));
    
    if (newHints.length > 0) {
      setActiveHints(prev => {
        // 避免重复添加相同的提示
        const existingIds = new Set(prev.map(h => h.id));
        const uniqueNewHints = newHints.filter(h => !existingIds.has(h.id));
        return [...prev, ...uniqueNewHints];
      });

      // 为每个新提示设置自动隐藏
      newHints.forEach(hint => {
        uxEnhancer.showHint(hint, () => {
          // 提示显示回调
          console.log(`显示提示: ${hint.message}`);
        });

        // 设置自动移除
        setTimeout(() => {
          setActiveHints(prev => prev.filter(h => h.id !== hint.id));
        }, hint.displayDuration);
      });
    }
  }, [strokes, timeElapsed, gameContext, dismissedHints]);

  // 定期分析绘画状态
  useEffect(() => {
    const interval = setInterval(analyzeAndShowHints, 5000); // 每5秒分析一次
    return () => clearInterval(interval);
  }, [analyzeAndShowHints]);

  // 手动关闭提示
  const dismissHint = useCallback((hintId: string) => {
    setActiveHints(prev => prev.filter(h => h.id !== hintId));
    setDismissedHints(prev => new Set([...prev, hintId]));
    uxEnhancer.hideHint(hintId);
  }, []);

  // 获取提示图标
  const getHintIcon = (type: DrawingHint['type']) => {
    switch (type) {
      case 'technique':
        return '💡';
      case 'composition':
        return '📐';
      case 'detail':
        return '🎨';
      case 'encouragement':
        return '🌟';
      default:
        return '💭';
    }
  };

  // 获取提示样式
  const getHintStyle = (priority: DrawingHint['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'medium':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'low':
        return 'border-green-200 bg-green-50 text-green-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // 获取容器位置样式
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'floating':
        return 'top-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (activeHints.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'fixed z-50 max-w-sm space-y-2',
      getPositionStyle(),
      className
    )}>
      {activeHints.map((hint, index) => (
        <div
          key={hint.id}
          className={cn(
            'relative rounded-lg border-2 p-3 shadow-lg transition-all duration-300 ease-in-out',
            'animate-in slide-in-from-right-5 fade-in-0',
            getHintStyle(hint.priority)
          )}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => dismissHint(hint.id)}
            className="absolute top-1 right-1 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="关闭提示"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* 提示内容 */}
          <div className="flex items-start space-x-2 pr-6">
            <span className="text-lg flex-shrink-0 mt-0.5">
              {getHintIcon(hint.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">
                {hint.message}
              </p>
              
              {/* 提示类型标签 */}
              <div className="flex items-center justify-between mt-2">
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  hint.type === 'technique' && 'bg-purple-100 text-purple-700',
                  hint.type === 'composition' && 'bg-indigo-100 text-indigo-700',
                  hint.type === 'detail' && 'bg-pink-100 text-pink-700',
                  hint.type === 'encouragement' && 'bg-yellow-100 text-yellow-700'
                )}>
                  {hint.type === 'technique' && '技巧'}
                  {hint.type === 'composition' && '构图'}
                  {hint.type === 'detail' && '细节'}
                  {hint.type === 'encouragement' && '鼓励'}
                </span>

                {/* 优先级指示器 */}
                <div className="flex space-x-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        i < (hint.priority === 'high' ? 3 : hint.priority === 'medium' ? 2 : 1)
                          ? 'bg-current opacity-70'
                          : 'bg-current opacity-20'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-current opacity-30 transition-all duration-100 ease-linear"
              style={{
                animation: `shrink ${hint.displayDuration}ms linear forwards`
              }}
            />
          </div>
        </div>
      ))}

      {/* CSS动画定义 */}
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// 紧凑版提示组件（用于移动端）
export function CompactDrawingHints({
  strokes,
  timeElapsed,
  gameContext,
  className
}: DrawingHintsProps) {
  const [currentHint, setCurrentHint] = useState<DrawingHint | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const analyzeAndShowHint = useCallback(() => {
    const hints = uxEnhancer.analyzeDrawingAndProvideHints(
      strokes,
      timeElapsed,
      gameContext
    );

    if (hints.length > 0 && !currentHint) {
      const hint = hints[0]; // 只显示最重要的提示
      setCurrentHint(hint);
      setIsVisible(true);

      // 自动隐藏
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setCurrentHint(null), 300); // 等待动画完成
      }, hint.displayDuration);
    }
  }, [strokes, timeElapsed, gameContext, currentHint]);

  useEffect(() => {
    const interval = setInterval(analyzeAndShowHint, 8000); // 移动端降低频率
    return () => clearInterval(interval);
  }, [analyzeAndShowHint]);

  const dismissHint = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setCurrentHint(null), 300);
  }, []);

  if (!currentHint) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-20 left-4 right-4 z-50 transition-all duration-300',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      className
    )}>
      <div className={cn(
        'rounded-lg border-2 p-3 shadow-lg backdrop-blur-sm',
        'bg-white bg-opacity-95',
        getHintStyle(currentHint.priority)
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className="text-base flex-shrink-0">
              {getHintIcon(currentHint.type)}
            </span>
            <p className="text-sm font-medium truncate">
              {currentHint.message}
            </p>
          </div>
          
          <button
            onClick={dismissHint}
            className="ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors flex-shrink-0"
            aria-label="关闭提示"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// 辅助函数
function getHintIcon(type: DrawingHint['type']) {
  switch (type) {
    case 'technique': return '💡';
    case 'composition': return '📐';
    case 'detail': return '🎨';
    case 'encouragement': return '🌟';
    default: return '💭';
  }
}

function getHintStyle(priority: DrawingHint['priority']) {
  switch (priority) {
    case 'high': return 'border-orange-200 bg-orange-50 text-orange-800';
    case 'medium': return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'low': return 'border-green-200 bg-green-50 text-green-800';
    default: return 'border-gray-200 bg-gray-50 text-gray-800';
  }
}
