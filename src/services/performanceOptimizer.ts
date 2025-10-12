'use client';

import { debounce, throttle } from '@/lib/utils';

export class PerformanceOptimizer {
  private static rafId: number | null = null;
  private static pendingOperations: (() => void)[] = [];

  /**
   * 使用requestAnimationFrame批量处理操作
   */
  static batchOperations(operation: () => void): void {
    this.pendingOperations.push(operation);
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        const operations = [...this.pendingOperations];
        this.pendingOperations = [];
        this.rafId = null;
        
        operations.forEach(op => op());
      });
    }
  }

  /**
   * 创建防抖的画布重绘函数
   */
  static createDebouncedRedraw(redrawFn: () => void, delay: number = 16): () => void {
    return debounce(redrawFn, delay);
  }

  /**
   * 创建节流的事件处理函数
   */
  static createThrottledHandler<T extends (...args: unknown[]) => unknown>(
    handler: T,
    limit: number = 16
  ): T {
    return throttle(handler, limit) as T;
  }

  /**
   * 图像预加载
   */
  static preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * 批量预加载图像
   */
  static async preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
    const promises = sources.map(src => this.preloadImage(src));
    return Promise.all(promises);
  }

  /**
   * 内存使用监控
   */
  static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return null;
  }

  /**
   * 性能监控
   */
  static measurePerformance<T>(
    name: string,
    operation: () => T
  ): { result: T; duration: number } {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }

  /**
   * 异步性能监控
   */
  static async measureAsyncPerformance<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Async Performance [${name}]: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }

  /**
   * Canvas性能优化设置
   */
  static optimizeCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 启用硬件加速
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 设置合适的像素比
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  /**
   * 虚拟化长列表
   */
  static createVirtualList<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ): {
    visibleItems: T[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetY: number;
  } {
    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight,
      offsetY
    };
  }

  /**
   * 懒加载观察器
   */
  static createLazyLoader(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  }

  /**
   * 资源清理
   */
  static cleanup(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingOperations = [];
  }

  /**
   * 检测设备性能等级
   */
  static getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
    // 基于硬件并发数判断
    const cores = navigator.hardwareConcurrency || 2;
    
    // 基于内存判断（如果可用）
    const memory = this.getMemoryUsage();
    const memoryGB = memory ? memory.total / (1024 * 1024 * 1024) : 4;
    
    // 基于用户代理判断移动设备
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (isMobile) {
      return cores >= 6 && memoryGB >= 4 ? 'medium' : 'low';
    }
    
    if (cores >= 8 && memoryGB >= 8) {
      return 'high';
    } else if (cores >= 4 && memoryGB >= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 根据设备性能调整设置
   */
  static getOptimalSettings(): {
    canvasSize: { width: number; height: number };
    imageQuality: number;
    animationEnabled: boolean;
    maxHistoryItems: number;
  } {
    const performanceLevel = this.getDevicePerformanceLevel();
    
    switch (performanceLevel) {
      case 'high':
        return {
          canvasSize: { width: 512, height: 512 },
          imageQuality: 0.9,
          animationEnabled: true,
          maxHistoryItems: 100
        };
      
      case 'medium':
        return {
          canvasSize: { width: 400, height: 400 },
          imageQuality: 0.8,
          animationEnabled: true,
          maxHistoryItems: 50
        };
      
      case 'low':
        return {
          canvasSize: { width: 300, height: 300 },
          imageQuality: 0.6,
          animationEnabled: false,
          maxHistoryItems: 20
        };
      
      default:
        return {
          canvasSize: { width: 400, height: 400 },
          imageQuality: 0.8,
          animationEnabled: true,
          maxHistoryItems: 50
        };
    }
  }
}

// 全局性能监控
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static observers: PerformanceObserver[] = [];

  /**
   * 开始性能监控
   */
  static startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // 监控导航性能
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration);
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'measure', 'paint'] });
      this.observers.push(observer);
    }
  }

  /**
   * 记录性能指标
   */
  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 保留最近100个值
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * 获取性能统计
   */
  static getStats(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  /**
   * 获取所有性能指标
   */
  static getAllStats(): Record<string, unknown> {
    const stats: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    
    return stats;
  }

  /**
   * 停止监控
   */
  static stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}