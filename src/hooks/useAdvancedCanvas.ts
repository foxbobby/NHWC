'use client';

import { useRef, useCallback, useReducer, useEffect, useMemo } from 'react';
import { Point, DrawingStroke, CanvasState, BrushSettings, CanvasAction } from '@/types/canvas';
import { AdvancedCanvasRenderer, createAdvancedRenderer } from '@/services/advancedCanvasRenderer';
import { BRUSH_CONFIG, CANVAS_CONFIG } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { PerformanceOptimizer } from '@/services/performanceOptimizer';

// 扩展的Canvas状态
interface AdvancedCanvasState extends CanvasState {
  isOptimized: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  renderingStats: {
    framesRendered: number;
    averageFrameTime: number;
    droppedFrames: number;
  };
}

// 初始状态
const initialState: AdvancedCanvasState = {
  strokes: [],
  undoStack: [],
  redoStack: [],
  isDrawing: false,
  currentStroke: undefined,
  brushSettings: {
    size: BRUSH_CONFIG.DEFAULT_SIZE,
    color: BRUSH_CONFIG.DEFAULT_COLOR,
    opacity: BRUSH_CONFIG.DEFAULT_OPACITY,
    type: 'pen'
  },
  isOptimized: true,
  performanceLevel: 'medium',
  renderingStats: {
    framesRendered: 0,
    averageFrameTime: 0,
    droppedFrames: 0
  }
};

// 扩展的Canvas动作
type AdvancedCanvasAction = CanvasAction | 
  { type: 'UPDATE_PERFORMANCE'; payload: { level: 'low' | 'medium' | 'high' } } |
  { type: 'UPDATE_STATS'; payload: typeof initialState.renderingStats };

function advancedCanvasReducer(state: AdvancedCanvasState, action: AdvancedCanvasAction): AdvancedCanvasState {
  switch (action.type) {
    case 'DRAW':
      return {
        ...state,
        strokes: [...state.strokes, action.payload as DrawingStroke],
        redoStack: [] // 清空重做栈
      };
    
    case 'UNDO':
      if (state.strokes.length === 0) return state;
      
      const lastStroke = state.strokes[state.strokes.length - 1];
      return {
        ...state,
        strokes: state.strokes.slice(0, -1),
        undoStack: [...state.undoStack, [lastStroke]]
      };
    
    case 'REDO':
      if (state.undoStack.length === 0) return state;
      
      const strokesToRedo = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        strokes: [...state.strokes, ...strokesToRedo],
        undoStack: state.undoStack.slice(0, -1)
      };
    
    case 'CLEAR':
      return {
        ...state,
        strokes: [],
        undoStack: [...state.undoStack, state.strokes],
        redoStack: []
      };
    
    case 'SET_BRUSH':
      return {
        ...state,
        brushSettings: { ...state.brushSettings, ...(action.payload as Partial<BrushSettings>) }
      };
    
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performanceLevel: action.payload.level
      };
    
    case 'UPDATE_STATS':
      return {
        ...state,
        renderingStats: action.payload
      };
    
    default:
      return state;
  }
}

export function useAdvancedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AdvancedCanvasRenderer | null>(null);
  const [state, dispatch] = useReducer(advancedCanvasReducer, initialState);
  
  // 绘制状态
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  
  // 性能监控
  const performanceMonitorRef = useRef<number | null>(null);
  
  // 根据设备性能调整渲染选项
  const renderingOptions = useMemo(() => {
    const deviceLevel = PerformanceOptimizer.getDevicePerformanceLevel();
    
    switch (deviceLevel) {
      case 'high':
        return {
          enableOffscreenRendering: true,
          enableSmoothing: true,
          enableBatching: true,
          maxBatchSize: 50,
          frameRate: 60
        };
      case 'medium':
        return {
          enableOffscreenRendering: true,
          enableSmoothing: true,
          enableBatching: true,
          maxBatchSize: 30,
          frameRate: 30
        };
      case 'low':
        return {
          enableOffscreenRendering: false,
          enableSmoothing: false,
          enableBatching: true,
          maxBatchSize: 10,
          frameRate: 15
        };
      default:
        return {
          enableOffscreenRendering: true,
          enableSmoothing: true,
          enableBatching: true,
          maxBatchSize: 30,
          frameRate: 30
        };
    }
  }, []);

  // 初始化渲染器
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      try {
        rendererRef.current = createAdvancedRenderer(canvasRef.current, renderingOptions);
        
        // 更新性能级别
        dispatch({
          type: 'UPDATE_PERFORMANCE',
          payload: { level: PerformanceOptimizer.getDevicePerformanceLevel() }
        });
        
        console.log('高级Canvas渲染器初始化成功', {
          设备性能: PerformanceOptimizer.getDevicePerformanceLevel(),
          渲染选项: renderingOptions
        });
      } catch (error) {
        console.error('初始化高级渲染器失败:', error);
      }
    }
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [renderingOptions]);

  // 性能监控
  useEffect(() => {
    const updateStats = () => {
      if (rendererRef.current) {
        const stats = rendererRef.current.getPerformanceStats();
        dispatch({
          type: 'UPDATE_STATS',
          payload: stats
        });
      }
    };
    
    performanceMonitorRef.current = window.setInterval(updateStats, 1000);
    
    return () => {
      if (performanceMonitorRef.current) {
        clearInterval(performanceMonitorRef.current);
      }
    };
  }, []);

  // 获取Canvas点坐标（优化版）
  const getCanvasPoint = useCallback((event: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // 开始绘制（优化版）
  const startDrawing = useCallback((point: Point) => {
    if (!rendererRef.current) return;

    isDrawingRef.current = true;
    lastPointRef.current = point;
    
    currentStrokeRef.current = {
      id: generateId(),
      points: [point],
      color: state.brushSettings.color,
      width: state.brushSettings.size,
      timestamp: Date.now()
    };
  }, [state.brushSettings]);

  // 继续绘制（优化版）
  const continueDrawing = useCallback((point: Point) => {
    if (!rendererRef.current || !isDrawingRef.current || !currentStrokeRef.current || !lastPointRef.current) {
      return;
    }

    // 距离过滤，减少不必要的点
    const distance = Math.sqrt(
      Math.pow(point.x - lastPointRef.current.x, 2) + 
      Math.pow(point.y - lastPointRef.current.y, 2)
    );
    
    const minDistance = state.brushSettings.size * 0.5;
    if (distance < minDistance) return;

    // 添加点到当前笔画
    currentStrokeRef.current.points.push(point);
    lastPointRef.current = point;
    
    // 使用高性能渲染器绘制
    rendererRef.current.drawStroke(currentStrokeRef.current);
  }, [state.brushSettings.size]);

  // 结束绘制（优化版）
  const endDrawing = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    isDrawingRef.current = false;
    
    // 添加完成的笔画到状态
    dispatch({
      type: 'DRAW',
      payload: currentStrokeRef.current,
      timestamp: Date.now()
    });
    
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  }, []);

  // 撤销操作（优化版）
  const undo = useCallback(() => {
    if (state.strokes.length === 0 || !rendererRef.current) return;
    
    dispatch({ type: 'UNDO', timestamp: Date.now() });
    
    // 重新渲染所有笔画
    rendererRef.current.clearLayer('drawing');
    const remainingStrokes = state.strokes.slice(0, -1);
    if (remainingStrokes.length > 0) {
      rendererRef.current.drawStrokes(remainingStrokes);
    }
  }, [state.strokes]);

  // 重做操作（优化版）
  const redo = useCallback(() => {
    if (state.undoStack.length === 0 || !rendererRef.current) return;
    
    dispatch({ type: 'REDO', timestamp: Date.now() });
    
    // 重新渲染所有笔画
    const strokesToRedo = state.undoStack[state.undoStack.length - 1];
    rendererRef.current.drawStrokes(strokesToRedo);
  }, [state.undoStack]);

  // 清空画布（优化版）
  const clear = useCallback(() => {
    if (!rendererRef.current) return;
    
    dispatch({ type: 'CLEAR', timestamp: Date.now() });
    rendererRef.current.clear();
  }, []);

  // 设置画笔
  const setBrush = useCallback((settings: Partial<BrushSettings>) => {
    dispatch({
      type: 'SET_BRUSH',
      payload: settings,
      timestamp: Date.now()
    });
  }, []);

  // 获取Canvas数据（优化版）
  const getCanvasData = useCallback(() => {
    if (!rendererRef.current) return null;
    
    return {
      imageData: rendererRef.current.getImageData(),
      width: canvasRef.current?.width || 0,
      height: canvasRef.current?.height || 0,
      strokes: [...state.strokes],
      timestamp: new Date()
    };
  }, [state.strokes]);

  // 调整Canvas大小
  const resizeCanvas = useCallback((width: number, height: number) => {
    if (!rendererRef.current) return;
    
    rendererRef.current.resize(width, height);
    
    // 重新绘制所有笔画
    if (state.strokes.length > 0) {
      rendererRef.current.drawStrokes(state.strokes);
    }
  }, [state.strokes]);

  // 批量绘制笔画（用于加载保存的绘画）
  const loadStrokes = useCallback((strokes: DrawingStroke[]) => {
    if (!rendererRef.current) return;
    
    // 清空当前内容
    rendererRef.current.clear();
    
    // 批量绘制
    if (strokes.length > 0) {
      rendererRef.current.drawStrokes(strokes);
    }
    
    // 更新状态
    dispatch({
      type: 'CLEAR',
      timestamp: Date.now()
    });
    
    strokes.forEach(stroke => {
      dispatch({
        type: 'DRAW',
        payload: stroke,
        timestamp: Date.now()
      });
    });
  }, []);

  // 导出的工具函数
  const utils = useMemo(() => ({
    getCanvasData,
    resizeCanvas,
    loadStrokes,
    getPerformanceStats: () => rendererRef.current?.getPerformanceStats() || state.renderingStats
  }), [getCanvasData, resizeCanvas, loadStrokes, state.renderingStats]);

  // 导出的动作函数
  const actions = useMemo(() => ({
    startDrawing,
    continueDrawing,
    endDrawing,
    undo,
    redo,
    clear,
    setBrush
  }), [startDrawing, continueDrawing, endDrawing, undo, redo, clear, setBrush]);

  return {
    canvasRef,
    state,
    actions,
    utils,
    getCanvasPoint,
    canUndo: state.strokes.length > 0,
    canRedo: state.undoStack.length > 0,
    isOptimized: state.isOptimized,
    performanceLevel: state.performanceLevel,
    renderingStats: state.renderingStats
  };
}
