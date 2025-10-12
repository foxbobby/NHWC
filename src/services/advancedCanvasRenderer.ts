'use client';

import { Point, DrawingStroke, BrushSettings } from '@/types/canvas';
import { CANVAS_CONFIG, BRUSH_CONFIG } from '@/lib/constants';
import { PerformanceOptimizer } from './performanceOptimizer';

export interface RenderingOptions {
  enableOffscreenRendering?: boolean;
  enableSmoothing?: boolean;
  enableBatching?: boolean;
  maxBatchSize?: number;
  frameRate?: number;
}

export interface CanvasLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isDirty: boolean;
  zIndex: number;
}

export class AdvancedCanvasRenderer {
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  
  // 分层渲染
  private layers: Map<string, CanvasLayer> = new Map();
  
  // 渲染队列和批处理
  private renderQueue: (() => void)[] = [];
  private batchedOperations: (() => void)[] = [];
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private targetFrameRate = 60;
  
  // 性能监控
  private renderStats = {
    framesRendered: 0,
    averageFrameTime: 0,
    droppedFrames: 0,
    totalRenderTime: 0
  };
  
  // 缓存和优化
  private strokeCache = new Map<string, Path2D>();
  private dirtyRegions: DOMRect[] = [];
  private isRendering = false;

  constructor(
    canvas: HTMLCanvasElement,
    options: RenderingOptions = {}
  ) {
    this.mainCanvas = canvas;
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // 启用异步渲染
      willReadFrequently: false // 优化写入性能
    });
    
    if (!ctx) {
      throw new Error('无法获取Canvas上下文');
    }
    
    this.mainCtx = ctx;
    this.targetFrameRate = options.frameRate || 60;
    
    // 初始化离屏Canvas
    if (options.enableOffscreenRendering !== false) {
      this.initOffscreenCanvas();
    }
    
    // 初始化分层
    this.initLayers();
    
    // 优化Canvas设置
    this.optimizeCanvas();
    
    // 启动渲染循环
    this.startRenderLoop();
  }

  /**
   * 初始化离屏Canvas
   */
  private initOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.mainCanvas.width;
    this.offscreenCanvas.height = this.mainCanvas.height;
    
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });
    
    if (!this.offscreenCtx) {
      console.warn('无法创建离屏Canvas上下文，回退到主Canvas');
      this.offscreenCanvas = null;
    }
  }

  /**
   * 初始化分层系统
   */
  private initLayers(): void {
    // 背景层
    this.createLayer('background', 0);
    // 绘画层
    this.createLayer('drawing', 1);
    // UI层（工具提示等）
    this.createLayer('ui', 2);
  }

  /**
   * 创建新图层
   */
  private createLayer(name: string, zIndex: number): CanvasLayer {
    const canvas = document.createElement('canvas');
    canvas.width = this.mainCanvas.width;
    canvas.height = this.mainCanvas.height;
    
    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });
    
    if (!ctx) {
      throw new Error(`无法创建图层 ${name} 的上下文`);
    }
    
    const layer: CanvasLayer = {
      canvas,
      ctx,
      isDirty: false,
      zIndex
    };
    
    this.layers.set(name, layer);
    return layer;
  }

  /**
   * 优化Canvas设置
   */
  private optimizeCanvas(): void {
    // 设置高DPI支持
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = this.mainCanvas.getBoundingClientRect();
    
    this.mainCanvas.width = rect.width * devicePixelRatio;
    this.mainCanvas.height = rect.height * devicePixelRatio;
    
    this.mainCtx.scale(devicePixelRatio, devicePixelRatio);
    
    // 优化渲染设置
    this.mainCtx.imageSmoothingEnabled = true;
    this.mainCtx.imageSmoothingQuality = 'high';
    this.mainCtx.lineCap = 'round';
    this.mainCtx.lineJoin = 'round';
    
    // 同步离屏Canvas尺寸
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.offscreenCanvas.width = this.mainCanvas.width;
      this.offscreenCanvas.height = this.mainCanvas.height;
      this.offscreenCtx.scale(devicePixelRatio, devicePixelRatio);
    }
    
    // 同步所有图层尺寸
    this.layers.forEach(layer => {
      layer.canvas.width = this.mainCanvas.width;
      layer.canvas.height = this.mainCanvas.height;
      layer.ctx.scale(devicePixelRatio, devicePixelRatio);
    });
  }

  /**
   * 启动渲染循环
   */
  private startRenderLoop(): void {
    const frameInterval = 1000 / this.targetFrameRate;
    
    const renderFrame = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime >= frameInterval) {
        this.processRenderQueue();
        this.lastFrameTime = currentTime;
      }
      
      this.rafId = requestAnimationFrame(renderFrame);
    };
    
    this.rafId = requestAnimationFrame(renderFrame);
  }

  /**
   * 处理渲染队列
   */
  private processRenderQueue(): void {
    if (this.renderQueue.length === 0 && this.batchedOperations.length === 0) {
      return;
    }
    
    const startTime = performance.now();
    this.isRendering = true;
    
    // 处理批量操作
    if (this.batchedOperations.length > 0) {
      this.processBatchedOperations();
    }
    
    // 处理渲染队列
    while (this.renderQueue.length > 0) {
      const operation = this.renderQueue.shift();
      if (operation) {
        operation();
      }
    }
    
    // 合成所有图层
    this.composeLayers();
    
    const endTime = performance.now();
    this.updateRenderStats(endTime - startTime);
    this.isRendering = false;
  }

  /**
   * 处理批量操作
   */
  private processBatchedOperations(): void {
    const operations = [...this.batchedOperations];
    this.batchedOperations = [];
    
    // 在离屏Canvas上批量执行操作
    const targetCtx = this.offscreenCtx || this.mainCtx;
    
    operations.forEach(operation => {
      operation();
    });
  }

  /**
   * 合成所有图层
   */
  private composeLayers(): void {
    // 清空主Canvas
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    
    // 按z-index顺序合成图层
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
    
    sortedLayers.forEach(layer => {
      if (layer.isDirty) {
        this.mainCtx.drawImage(layer.canvas, 0, 0);
        layer.isDirty = false;
      }
    });
    
    // 如果有离屏Canvas，最后合成
    if (this.offscreenCanvas) {
      this.mainCtx.drawImage(this.offscreenCanvas, 0, 0);
    }
  }

  /**
   * 高性能绘制笔画
   */
  drawStroke(stroke: DrawingStroke, layerName: string = 'drawing'): void {
    const operation = () => {
      const layer = this.layers.get(layerName);
      if (!layer) return;
      
      const ctx = layer.ctx;
      const cacheKey = this.getStrokeCacheKey(stroke);
      
      // 尝试使用缓存的Path2D
      let path = this.strokeCache.get(cacheKey);
      if (!path) {
        path = this.createStrokePath(stroke);
        this.strokeCache.set(cacheKey, path);
      }
      
      // 设置绘制样式
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // 绘制路径
      ctx.stroke(path);
      ctx.restore();
      
      layer.isDirty = true;
      
      // 更新脏区域
      this.addDirtyRegion(this.getStrokeBounds(stroke));
    };
    
    this.batchedOperations.push(operation);
  }

  /**
   * 创建笔画路径
   */
  private createStrokePath(stroke: DrawingStroke): Path2D {
    const path = new Path2D();
    
    if (stroke.points.length < 2) return path;
    
    const points = stroke.points;
    path.moveTo(points[0].x, points[0].y);
    
    // 使用二次贝塞尔曲线平滑路径
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      const controlY = (current.y + next.y) / 2;
      
      path.quadraticCurveTo(current.x, current.y, controlX, controlY);
    }
    
    // 绘制最后一个点
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      path.lineTo(lastPoint.x, lastPoint.y);
    }
    
    return path;
  }

  /**
   * 获取笔画缓存键
   */
  private getStrokeCacheKey(stroke: DrawingStroke): string {
    return `${stroke.id}_${stroke.points.length}_${stroke.color}_${stroke.width}`;
  }

  /**
   * 获取笔画边界
   */
  private getStrokeBounds(stroke: DrawingStroke): DOMRect {
    if (stroke.points.length === 0) {
      return new DOMRect(0, 0, 0, 0);
    }
    
    let minX = stroke.points[0].x;
    let minY = stroke.points[0].y;
    let maxX = minX;
    let maxY = minY;
    
    stroke.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    
    // 考虑笔画宽度
    const padding = stroke.width / 2;
    return new DOMRect(
      minX - padding,
      minY - padding,
      maxX - minX + padding * 2,
      maxY - minY + padding * 2
    );
  }

  /**
   * 添加脏区域
   */
  private addDirtyRegion(rect: DOMRect): void {
    this.dirtyRegions.push(rect);
    
    // 限制脏区域数量，避免内存泄漏
    if (this.dirtyRegions.length > 100) {
      this.dirtyRegions = this.dirtyRegions.slice(-50);
    }
  }

  /**
   * 批量绘制多个笔画
   */
  drawStrokes(strokes: DrawingStroke[], layerName: string = 'drawing'): void {
    const operation = () => {
      const layer = this.layers.get(layerName);
      if (!layer) return;
      
      const ctx = layer.ctx;
      
      // 批量设置样式以减少状态切换
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        // 只在样式改变时更新
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        
        const path = this.createStrokePath(stroke);
        ctx.stroke(path);
      });
      
      ctx.restore();
      layer.isDirty = true;
    };
    
    this.batchedOperations.push(operation);
  }

  /**
   * 清空指定图层
   */
  clearLayer(layerName: string): void {
    const operation = () => {
      const layer = this.layers.get(layerName);
      if (!layer) return;
      
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.isDirty = true;
    };
    
    this.renderQueue.push(operation);
  }

  /**
   * 清空所有内容
   */
  clear(): void {
    this.layers.forEach((layer, name) => {
      this.clearLayer(name);
    });
    
    if (this.offscreenCtx) {
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas!.width, this.offscreenCanvas!.height);
    }
    
    this.strokeCache.clear();
    this.dirtyRegions = [];
  }

  /**
   * 调整Canvas大小
   */
  resize(width: number, height: number): void {
    const operation = () => {
      // 保存当前内容
      const imageData = this.mainCanvas.toDataURL();
      
      // 调整主Canvas
      this.mainCanvas.width = width;
      this.mainCanvas.height = height;
      
      // 调整离屏Canvas
      if (this.offscreenCanvas) {
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
      }
      
      // 调整所有图层
      this.layers.forEach(layer => {
        layer.canvas.width = width;
        layer.canvas.height = height;
        layer.isDirty = true;
      });
      
      // 重新优化设置
      this.optimizeCanvas();
    };
    
    this.renderQueue.push(operation);
  }

  /**
   * 获取Canvas数据
   */
  getImageData(format: string = 'image/png', quality: number = 1.0): string {
    // 确保所有渲染完成
    this.processRenderQueue();
    return this.mainCanvas.toDataURL(format, quality);
  }

  /**
   * 更新渲染统计
   */
  private updateRenderStats(frameTime: number): void {
    this.renderStats.framesRendered++;
    this.renderStats.totalRenderTime += frameTime;
    this.renderStats.averageFrameTime = this.renderStats.totalRenderTime / this.renderStats.framesRendered;
    
    // 检测丢帧
    const targetFrameTime = 1000 / this.targetFrameRate;
    if (frameTime > targetFrameTime * 1.5) {
      this.renderStats.droppedFrames++;
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): typeof this.renderStats {
    return { ...this.renderStats };
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    this.renderQueue = [];
    this.batchedOperations = [];
    this.strokeCache.clear();
    this.dirtyRegions = [];
    this.layers.clear();
    
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = 0;
      this.offscreenCanvas.height = 0;
      this.offscreenCanvas = null;
      this.offscreenCtx = null;
    }
  }
}

// 导出工厂函数
export function createAdvancedRenderer(
  canvas: HTMLCanvasElement,
  options?: RenderingOptions
): AdvancedCanvasRenderer {
  return new AdvancedCanvasRenderer(canvas, options);
}
