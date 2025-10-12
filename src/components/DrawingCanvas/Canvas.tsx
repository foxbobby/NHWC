'use client';

import React, { useEffect, useCallback, forwardRef, useRef } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { CanvasUtils } from '@/services/canvasUtils';
import { CANVAS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TouchOptimizedCanvas } from './TouchHandler';
import type { CanvasState } from '@/types/canvas';

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onDrawingChange?: (hasDrawing: boolean) => void;
  disabled?: boolean;
  // 新增：接收外部的canvas状态和操作
  canvasState?: CanvasState;
  canvasActions?: {
    startDrawing: (point: { x: number; y: number }) => void;
    continueDrawing: (point: { x: number; y: number }) => void;
    finishDrawing: () => void;
    initCanvas: (width: number, height: number) => void;
    redraw: () => void;
  };
  canvasUtils?: {
    isEmpty: () => boolean;
  };
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(function Canvas({
  width,
  height,
  className,
  onDrawingChange,
  disabled = false,
  canvasState,
  canvasActions,
  canvasUtils
}, ref) {
  const { isMobile, isTablet } = useResponsive();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 合并外部ref和内部ref
  React.useImperativeHandle(ref, () => canvasRef.current!, [canvasRef]);

  // 计算画布尺寸
  const canvasWidth = width || (isMobile ? 300 : isTablet ? 400 : CANVAS_CONFIG.DEFAULT_WIDTH);
  const canvasHeight = height || (isMobile ? 300 : isTablet ? 400 : CANVAS_CONFIG.DEFAULT_HEIGHT);

  // 初始化画布
  useEffect(() => {
    if (canvasActions && canvasRef.current) {
      // 直接初始化本地canvas
      const canvas = canvasRef.current;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = true;
        
        // 重绘现有笔画
        if (canvasState && canvasState.strokes.length > 0) {
          canvasState.strokes.forEach(stroke => {
            if (stroke.points && stroke.points.length > 1) {
              ctx.save();
              ctx.strokeStyle = stroke.color;
              ctx.lineWidth = stroke.width;
              ctx.beginPath();
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
              }
              ctx.stroke();
              ctx.restore();
            }
          });
        }
      }
    }
  }, [canvasWidth, canvasHeight, canvasActions, canvasState]);

  // 监听绘画变化
  useEffect(() => {
    if (onDrawingChange && canvasUtils) {
      onDrawingChange(!canvasUtils.isEmpty());
    }
  }, [canvasUtils, onDrawingChange]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || !canvasState || !canvasActions) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    
    // 直接在这里处理绘制开始
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = canvasState.brushSettings.size;
    ctx.strokeStyle = canvasState.brushSettings.color;
    ctx.globalAlpha = canvasState.brushSettings.opacity;
    
    console.log('开始绘制，使用颜色:', canvasState.brushSettings.color);
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    
    // 调用外部的action来更新状态
    canvasActions.startDrawing(point);
  }, [disabled, canvasRef, canvasActions, canvasState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled || !canvasState || !canvasActions) return;
    
    // 检查是否正在绘制
    if (!canvasState.isDrawing) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    
    // 直接绘制到画布
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    
    // 调用外部的action来更新状态
    canvasActions.continueDrawing(point);
  }, [disabled, canvasRef, canvasActions, canvasState]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    if (canvasActions) {
      canvasActions.finishDrawing();
    }
  }, [disabled, canvasActions]);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !canvasState || !canvasActions) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    
    // 直接在这里处理绘制开始
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = canvasState.brushSettings.size;
    ctx.strokeStyle = canvasState.brushSettings.color;
    ctx.globalAlpha = canvasState.brushSettings.opacity;
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    
    canvasActions.startDrawing(point);
  }, [disabled, canvasRef, canvasActions, canvasState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !canvasState || !canvasActions) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    
    // 直接绘制到画布
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    
    canvasActions.continueDrawing(point);
  }, [disabled, canvasRef, canvasActions, canvasState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    if (canvasActions) {
      canvasActions.finishDrawing();
    }
  }, [disabled, canvasActions]);

  // 防止上下文菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <TouchOptimizedCanvas
      canvasRef={canvasRef}
      onDrawStart={canvasActions?.startDrawing || (() => {})}
      onDrawMove={canvasActions?.continueDrawing || (() => {})}
      onDrawEnd={canvasActions?.finishDrawing || (() => {})}
      disabled={disabled}
    >
      <div className={cn('relative inline-block', className)}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={cn(
            'border border-gray-300 rounded-lg cursor-crosshair',
            disabled && 'cursor-not-allowed opacity-50',
            'shadow-sm bg-white'
          )}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        />
        
        {disabled && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-gray-500 text-sm font-medium">
              画布已禁用
            </div>
          </div>
        )}
      </div>
    </TouchOptimizedCanvas>
  );
});

export default Canvas;
