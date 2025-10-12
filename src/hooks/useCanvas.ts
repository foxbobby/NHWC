'use client';

import { useRef, useCallback, useReducer, useEffect } from 'react';
import { Point, DrawingStroke, CanvasState, BrushSettings, CanvasAction } from '@/types/canvas';
import { CanvasUtils } from '@/services/canvasUtils';
import { BRUSH_CONFIG, CANVAS_CONFIG } from '@/lib/constants';
import { generateId } from '@/lib/utils';

// Canvas状态管理
const initialState: CanvasState = {
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
  }
};

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
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
    
    default:
      return state;
  }
}

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const isDrawingRef = useRef(false);

  // 获取画布上下文
  const getContext = useCallback((): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // 开始绘制
  const startDrawing = useCallback((point: Point) => {
    const ctx = getContext();
    if (!ctx) return;

    isDrawingRef.current = true;
    currentStrokeRef.current = {
      id: generateId(),
      points: [point],
      color: state.brushSettings.color,
      width: state.brushSettings.size,
      timestamp: Date.now()
    };

    // 设置绘制样式（只在开始时设置一次）
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = state.brushSettings.size;
    ctx.strokeStyle = state.brushSettings.color;
    ctx.globalAlpha = state.brushSettings.opacity;
    
    // 开始新路径
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [state.brushSettings, getContext]);

  // 继续绘制
  const continueDrawing = useCallback((point: Point) => {
    const ctx = getContext();
    if (!ctx || !isDrawingRef.current || !currentStrokeRef.current) return;

    // 添加点到当前笔画
    currentStrokeRef.current.points.push(point);
    
    // 直接绘制到当前点（更高效）
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [getContext]);

  // 结束绘制
  const finishDrawing = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    isDrawingRef.current = false;
    
    // 保存笔画到状态
    dispatch({
      type: 'DRAW',
      payload: currentStrokeRef.current,
      timestamp: Date.now()
    });
    
    currentStrokeRef.current = null;
  }, []);

  // 撤销
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO', timestamp: Date.now() });
  }, []);

  // 重做
  const redo = useCallback(() => {
    dispatch({ type: 'REDO', timestamp: Date.now() });
  }, []);

  // 清空画布
  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR', timestamp: Date.now() });
  }, []);

  // 设置画笔
  const setBrush = useCallback((settings: Partial<BrushSettings>) => {
    console.log('setBrush called with:', settings);
    dispatch({ 
      type: 'SET_BRUSH', 
      payload: settings,
      timestamp: Date.now()
    });
  }, []);

  // 重绘画布
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布并设置背景
    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 重绘所有笔画
    CanvasUtils.redrawCanvas(ctx, state.strokes);
  }, [state.strokes]);

  // 获取画布数据
  const getCanvasData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return CanvasUtils.createCanvasData(canvas, state.strokes);
  }, [state.strokes]);

  // 检查画布是否为空
  const isEmpty = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    
    return state.strokes.length === 0 || CanvasUtils.isCanvasEmpty(canvas);
  }, [state.strokes]);

  // 导出图像
  const exportImage = useCallback((quality: number = 0.8) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return CanvasUtils.compressCanvasImage(canvas, 512, 512, quality);
  }, []);

  // 监听状态变化，重绘画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 延迟重绘，确保画布已经初始化
    const timer = setTimeout(() => {
      redraw();
    }, 10);
    
    return () => clearTimeout(timer);
  }, [state.strokes, redraw]);

  // 初始化画布
  const initCanvas = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置画布背景
    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);
    
    // 设置绘图属性
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    
    // 重绘现有笔画
    if (state.strokes.length > 0) {
      CanvasUtils.redrawCanvas(ctx, state.strokes);
    }
  }, [state.strokes]);

  return {
    canvasRef,
    state,
    actions: {
      startDrawing,
      continueDrawing,
      finishDrawing,
      undo,
      redo,
      clear,
      setBrush,
      initCanvas,
      redraw
    },
    utils: {
      getCanvasData,
      isEmpty,
      exportImage
    },
    canUndo: state.strokes.length > 0,
    canRedo: state.undoStack.length > 0
  };
}