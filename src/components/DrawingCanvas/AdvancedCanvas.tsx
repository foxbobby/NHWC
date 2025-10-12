'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { useAdvancedCanvas } from '@/hooks/useAdvancedCanvas';
import { Point } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface AdvancedCanvasProps {
  className?: string;
  disabled?: boolean;
  onDrawingChange?: (hasContent: boolean) => void;
  onStrokeComplete?: (strokeCount: number) => void;
  width?: number;
  height?: number;
}

export default function AdvancedCanvas({
  className,
  disabled = false,
  onDrawingChange,
  onStrokeComplete,
  width = 512,
  height = 512
}: AdvancedCanvasProps) {
  const {
    canvasRef,
    state,
    actions,
    utils,
    getCanvasPoint,
    performanceLevel,
    renderingStats
  } = useAdvancedCanvas();

  // 触控状态管理
  const touchStartTimeRef = useRef<number>(0);
  const lastTouchRef = useRef<Point | null>(null);
  const isMultiTouchRef = useRef(false);

  // 通知绘画内容变化
  useEffect(() => {
    const hasContent = state.strokes.length > 0;
    onDrawingChange?.(hasContent);
  }, [state.strokes.length, onDrawingChange]);

  // 通知笔画完成
  useEffect(() => {
    onStrokeComplete?.(state.strokes.length);
  }, [state.strokes.length, onStrokeComplete]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    const point = getCanvasPoint(event.nativeEvent);
    actions.startDrawing(point);
  }, [disabled, getCanvasPoint, actions]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    const point = getCanvasPoint(event.nativeEvent);
    actions.continueDrawing(point);
  }, [disabled, getCanvasPoint, actions]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    actions.endDrawing();
  }, [disabled, actions]);

  // 触控事件处理（优化版）
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    
    // 检测多点触控
    if (event.touches.length > 1) {
      isMultiTouchRef.current = true;
      return;
    }
    
    isMultiTouchRef.current = false;
    touchStartTimeRef.current = Date.now();
    
    const point = getCanvasPoint(event.nativeEvent);
    lastTouchRef.current = point;
    actions.startDrawing(point);
  }, [disabled, getCanvasPoint, actions]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled || isMultiTouchRef.current) return;
    
    event.preventDefault();
    
    const point = getCanvasPoint(event.nativeEvent);
    
    // 触控优化：减少过于频繁的点
    if (lastTouchRef.current) {
      const distance = Math.sqrt(
        Math.pow(point.x - lastTouchRef.current.x, 2) + 
        Math.pow(point.y - lastTouchRef.current.y, 2)
      );
      
      // 根据性能级别调整最小距离
      const minDistance = performanceLevel === 'low' ? 3 : 
                         performanceLevel === 'medium' ? 2 : 1;
      
      if (distance < minDistance) return;
    }
    
    lastTouchRef.current = point;
    actions.continueDrawing(point);
  }, [disabled, getCanvasPoint, actions, performanceLevel]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled || isMultiTouchRef.current) return;
    
    event.preventDefault();
    
    // 检测是否为点击（而非绘制）
    const touchDuration = Date.now() - touchStartTimeRef.current;
    const isClick = touchDuration < 150; // 150ms内为点击
    
    if (isClick && lastTouchRef.current) {
      // 对于点击，创建一个小圆点
      actions.continueDrawing({
        x: lastTouchRef.current.x + 1,
        y: lastTouchRef.current.y + 1
      });
    }
    
    actions.endDrawing();
    lastTouchRef.current = null;
  }, [disabled, actions]);

  // 阻止默认的触控行为
  const handleTouchCancel = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    actions.endDrawing();
    isMultiTouchRef.current = false;
    lastTouchRef.current = null;
  }, [actions]);

  // 阻止右键菜单
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // 阻止拖拽
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // 调整Canvas大小
  useEffect(() => {
    if (canvasRef.current) {
      utils.resizeCanvas(width, height);
    }
  }, [width, height, utils]);

  // 性能监控显示（开发模式）
  const showPerformanceStats = process.env.NODE_ENV === 'development';

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "border border-gray-300 rounded-lg bg-white cursor-crosshair",
          "touch-none select-none", // 禁用触控默认行为
          disabled && "cursor-not-allowed opacity-50",
          "transition-opacity duration-200"
        )}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: performanceLevel === 'low' ? 'pixelated' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
      
      {/* 性能统计显示（仅开发模式） */}
      {showPerformanceStats && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>性能: {performanceLevel}</div>
          <div>帧数: {renderingStats.framesRendered}</div>
          <div>平均帧时: {renderingStats.averageFrameTime.toFixed(1)}ms</div>
          <div>丢帧: {renderingStats.droppedFrames}</div>
          <div>笔画数: {state.strokes.length}</div>
        </div>
      )}
      
      {/* 加载指示器 */}
      {state.isDrawing && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          绘制中...
        </div>
      )}
      
      {/* 禁用状态遮罩 */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center rounded-lg">
          <span className="text-gray-500 font-medium">画布已禁用</span>
        </div>
      )}
    </div>
  );
}

// 导出性能优化的Canvas组件
export const MemoizedAdvancedCanvas = React.memo(AdvancedCanvas);

// 导出带错误边界的Canvas组件
export function AdvancedCanvasWithErrorBoundary(props: AdvancedCanvasProps) {
  return (
    <React.Suspense fallback={
      <div className={cn("border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center", props.className)}
           style={{ width: props.width || 512, height: props.height || 512 }}>
        <span className="text-gray-500">加载画布中...</span>
      </div>
    }>
      <MemoizedAdvancedCanvas {...props} />
    </React.Suspense>
  );
}
