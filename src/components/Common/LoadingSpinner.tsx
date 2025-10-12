'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BRAND_COLORS } from '@/lib/constants';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  color?: 'primary' | 'secondary' | 'neutral';
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  text,
  color = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    neutral: BRAND_COLORS.neutral
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div 
        className={cn('loading-spinner', sizeClasses[size])}
        style={{ borderTopColor: colors[color] }}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">
          {text}
        </p>
      )}
    </div>
  );
}

// 页面加载组件
interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = '加载中...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: BRAND_COLORS.primary }}
          >
            🦊 FoxAI
          </div>
          <div className="text-gray-600">
            你画我猜
          </div>
        </div>
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

// 内联加载组件
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text = '处理中...', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

// 按钮加载状态
interface ButtonLoadingProps {
  size?: 'sm' | 'md';
}

export function ButtonLoading({ size = 'sm' }: ButtonLoadingProps) {
  return (
    <div 
      className={cn('loading-spinner', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')}
      style={{ borderTopColor: 'currentColor', borderWidth: '2px' }}
    />
  );
}

// AI思考动画
export function AIThinkingAnimation() {
  return (
    <div className="flex items-center justify-center py-8">
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