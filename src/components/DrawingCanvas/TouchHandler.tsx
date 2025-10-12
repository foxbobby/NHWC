'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { Point } from '@/types/canvas';
import { CanvasUtils } from '@/services/canvasUtils';
import { useDeviceType } from '@/hooks/useResponsive';

interface TouchHandlerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onDrawStart: (point: Point) => void;
  onDrawMove: (point: Point) => void;
  onDrawEnd: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function TouchHandler({
  canvasRef,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  disabled = false,
  children
}: TouchHandlerProps) {
  const { isTouchDevice } = useDeviceType();
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  // 获取触摸点坐标
  const getTouchPoint = useCallback((touch: Touch): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return CanvasUtils.getCanvasPoint(
      { touches: [touch] } as unknown as TouchEvent,
      canvas
    );
  }, [canvasRef]);

  // 处理触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !canvasRef.current) return;

    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;

    const point = getTouchPoint(touch);
    if (!point) return;

    isDrawingRef.current = true;
    lastPointRef.current = point;
    onDrawStart(point);
  }, [disabled, canvasRef, getTouchPoint, onDrawStart]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !isDrawingRef.current || !canvasRef.current) return;

    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;

    const point = getTouchPoint(touch);
    if (!point || !lastPointRef.current) return;

    // 计算移动距离，避免过于频繁的绘制
    const distance = CanvasUtils.getDistance(lastPointRef.current, point);
    if (distance < 2) return; // 最小移动距离

    lastPointRef.current = point;
    onDrawMove(point);
  }, [disabled, canvasRef, getTouchPoint, onDrawMove]);

  // 处理触摸结束
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || !isDrawingRef.current) return;

    e.preventDefault();
    
    isDrawingRef.current = false;
    lastPointRef.current = null;
    onDrawEnd();
  }, [disabled, onDrawEnd]);

  // 处理触摸取消
  const handleTouchCancel = useCallback((e: TouchEvent) => {
    if (disabled) return;

    e.preventDefault();
    
    isDrawingRef.current = false;
    lastPointRef.current = null;
    onDrawEnd();
  }, [disabled, onDrawEnd]);

  // 绑定触摸事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isTouchDevice) return;

    const options = { passive: false };

    canvas.addEventListener('touchstart', handleTouchStart, options);
    canvas.addEventListener('touchmove', handleTouchMove, options);
    canvas.addEventListener('touchend', handleTouchEnd, options);
    canvas.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    canvasRef,
    isTouchDevice,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  ]);

  // 防止页面滚动和缩放
  useEffect(() => {
    if (!isTouchDevice) return;

    const preventScroll = (e: TouchEvent) => {
      if (e.target === canvasRef.current) {
        e.preventDefault();
      }
    };

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('touchstart', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('touchstart', preventZoom);
    };
  }, [isTouchDevice, canvasRef]);

  return <>{children}</>;
}

// 响应式画布容器
interface ResponsiveCanvasContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveCanvasContainer({ 
  children, 
  className 
}: ResponsiveCanvasContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useDeviceType();

  // 处理方向变化
  useEffect(() => {
    const handleOrientationChange = () => {
      // 延迟处理，等待方向变化完成
      setTimeout(() => {
        if (containerRef.current) {
          // 触发重新计算尺寸
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`
        flex items-center justify-center
        ${isMobile ? 'p-2' : isTablet ? 'p-4' : 'p-6'}
        ${className || ''}
      `}
      style={{
        // 确保容器适应屏幕
        maxWidth: '100vw',
        maxHeight: isMobile ? '60vh' : '70vh',
        overflow: 'hidden'
      }}
    >
      {children}
    </div>
  );
}

// 触摸优化的画布包装器
interface TouchOptimizedCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onDrawStart: (point: Point) => void;
  onDrawMove: (point: Point) => void;
  onDrawEnd: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function TouchOptimizedCanvas(props: TouchOptimizedCanvasProps) {
  return (
    <ResponsiveCanvasContainer>
      <TouchHandler {...props}>
        {props.children}
      </TouchHandler>
    </ResponsiveCanvasContainer>
  );
}