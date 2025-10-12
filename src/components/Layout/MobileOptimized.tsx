'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: ReactNode;
  className?: string;
}

export default function MobileOptimized({ children, className }: MobileOptimizedProps) {
  const { isMobile, isTablet } = useResponsive();
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  // 处理移动端视口高度变化（虚拟键盘等）
  useEffect(() => {
    if (!isMobile) return;

    const updateViewportHeight = () => {
      // 使用visualViewport API（如果可用）
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      };
    } else {
      window.addEventListener('resize', updateViewportHeight);
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
      };
    }
  }, [isMobile]);

  // 防止iOS Safari的橡皮筋效果
  useEffect(() => {
    if (!isMobile) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      
      const target = e.target as Element;
      const scrollableParent = findScrollableParent(target);
      
      if (!scrollableParent) {
        e.preventDefault();
      }
    };

    const findScrollableParent = (element: Element | null): Element | null => {
      if (!element) return null;
      
      const style = window.getComputedStyle(element);
      const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
      
      if (isScrollable && element.scrollHeight > element.clientHeight) {
        return element;
      }
      
      return findScrollableParent(element.parentElement);
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isMobile]);

  const containerStyle = isMobile && viewportHeight > 0 ? {
    height: `${viewportHeight}px`,
    maxHeight: `${viewportHeight}px`
  } : {};

  return (
    <div 
      className={cn(
        'w-full',
        isMobile && 'overflow-hidden',
        className
      )}
      style={containerStyle}
    >
      {children}
    </div>
  );
}

// 移动端安全区域组件
interface SafeAreaProps {
  children: ReactNode;
  className?: string;
}

export function SafeArea({ children, className }: SafeAreaProps) {
  return (
    <div 
      className={cn('safe-area-inset', className)}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {children}
    </div>
  );
}

// 移动端友好的滚动容器
interface MobileScrollContainerProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export function MobileScrollContainer({ 
  children, 
  className, 
  maxHeight = '60vh' 
}: MobileScrollContainerProps) {
  const { isMobile } = useResponsive();

  return (
    <div 
      className={cn(
        'overflow-y-auto',
        isMobile && 'scrollbar-hide -webkit-overflow-scrolling-touch',
        className
      )}
      style={{
        maxHeight: isMobile ? maxHeight : 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {children}
    </div>
  );
}

// 移动端手势处理组件
interface MobileGestureHandlerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function MobileGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className
}: MobileGestureHandlerProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 确定是水平还是垂直滑动
    if (absDeltaX > absDeltaY) {
      // 水平滑动
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // 垂直滑动
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// 移动端键盘适配组件
interface KeyboardAdaptiveProps {
  children: ReactNode;
  className?: string;
}

export function KeyboardAdaptive({ children, className }: KeyboardAdaptiveProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(Math.max(0, keyboardHeight));
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, [isMobile]);

  return (
    <div 
      className={cn('transition-all duration-300', className)}
      style={{
        paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px'
      }}
    >
      {children}
    </div>
  );
}

// 移动端底部操作栏
interface MobileBottomBarProps {
  children: ReactNode;
  className?: string;
  fixed?: boolean;
}

export function MobileBottomBar({ 
  children, 
  className, 
  fixed = true 
}: MobileBottomBarProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <div 
      className={cn(
        'bg-white border-t border-gray-200 p-4',
        fixed && 'fixed bottom-0 left-0 right-0 z-50',
        'safe-area-inset',
        className
      )}
      style={{
        paddingBottom: `calc(1rem + env(safe-area-inset-bottom))`
      }}
    >
      {children}
    </div>
  );
}