'use client';

import React, { useEffect, useCallback, forwardRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useResponsive } from '@/hooks/useResponsive';
import { CanvasUtils } from '@/services/canvasUtils';
import { CANVAS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TouchOptimizedCanvas } from './TouchHandler';

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onDrawingChange?: (hasDrawing: boolean) => void;
  disabled?: boolean;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(function Canvas({
  width,
  height,
  className,
  onDrawingChange,
  disabled = false
}: CanvasProps) {
  const { isMobile, isTablet } = useResponsive();
  const { canvasRef, actions, utils } = useCanvas();

  // 计算画布尺寸
  const canvasWidth = width || (isMobile ? 300 : isTablet ? 400 : CANVAS_CONFIG.DEFAULT_WIDTH);
  const canvasHeight = height || (isMobile ? 300 : isTablet ? 400 : CANVAS_CONFIG.DEFAULT_HEIGHT);

  // 初始化画布
  useEffect(() => {
    actions.initCanvas(canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight, actions]);

  // 监听绘画变化
  useEffect(() => {
    if (onDrawingChange) {
      onDrawingChange(!utils.isEmpty());
    }
  }, [utils, onDrawingChange]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    actions.startDrawing(point);
  }, [disabled, canvasRef, actions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    actions.continueDrawing(point);
  }, [disabled, canvasRef, actions]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    actions.finishDrawing();
  }, [disabled, actions]);

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    actions.startDrawing(point);
  }, [disabled, canvasRef, actions]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = CanvasUtils.getCanvasPoint(e.nativeEvent, canvas);
    actions.continueDrawing(point);
  }, [disabled, canvasRef, actions]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    actions.finishDrawing();
  }, [disabled, actions]);

  // 防止上下文菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <TouchOptimizedCanvas
      canvasRef={canvasRef}
      onDrawStart={actions.startDrawing}
      onDrawMove={actions.continueDrawing}
      onDrawEnd={actions.finishDrawing}
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

// 导出画布操作钩子供父组件使用
export { useCanvas };