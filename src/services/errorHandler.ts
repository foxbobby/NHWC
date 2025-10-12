'use client';

import { ERROR_MESSAGES } from '@/lib/constants';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  userId?: string;
  context?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = true;
  private maxQueueSize: number = 50;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkStatusListener();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // 捕获JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // 捕获Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'promise_rejection' }
      );
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(new Error(`Resource failed to load: ${(event.target as any)?.src || 'unknown'}`), {
          type: 'resource',
          element: event.target
        });
      }
    }, true);
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkStatusListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.isOnline = navigator.onLine;
  }

  /**
   * 处理错误
   */
  handleError(error: Error, context?: Record<string, unknown>): void {
    const errorReport = this.createErrorReport(error, context);
    
    // 记录到控制台
    console.error('Error handled:', errorReport);

    // 添加到队列
    this.addToQueue(errorReport);

    // 如果在线，尝试发送
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  /**
   * 创建错误报告
   */
  private createErrorReport(error: Error, context?: Record<string, unknown>): ErrorReport {
    return {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
      severity: this.determineSeverity(error, context)
    };
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 确定错误严重程度
   */
  private determineSeverity(error: Error, context?: Record<string, unknown>): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    // 关键错误
    if (message.includes('network') || message.includes('api') || message.includes('auth')) {
      return 'critical';
    }
    
    // 高严重性错误
    if (message.includes('canvas') || message.includes('drawing') || message.includes('game')) {
      return 'high';
    }
    
    // 中等严重性错误
    if (message.includes('ui') || message.includes('component')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 添加到错误队列
   */
  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * 发送错误队列
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // 这里可以发送到错误监控服务
      await this.sendErrorReports(errors);
    } catch (error) {
      console.warn('Failed to send error reports:', error);
      // 重新添加到队列
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * 发送错误报告到服务器
   */
  private async sendErrorReports(errors: ErrorReport[]): Promise<void> {
    // 在实际项目中，这里会发送到错误监控服务
    // 例如：Sentry, LogRocket, 或自定义错误收集API
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Error reports (dev mode):', errors);
      return;
    }

    // 示例：发送到自定义API
    try {
      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // 发送失败，重新抛出错误
      throw error;
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  static getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    if (message.includes('api')) {
      return ERROR_MESSAGES.API_ERROR;
    }

    if (message.includes('canvas') || message.includes('drawing')) {
      return ERROR_MESSAGES.CANVAS_ERROR;
    }

    if (message.includes('storage') || message.includes('localstorage')) {
      return ERROR_MESSAGES.STORAGE_ERROR;
    }

    return '发生了未知错误，请稍后重试';
  }

  /**
   * 检查是否为可恢复错误
   */
  static isRecoverableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // 网络错误通常是可恢复的
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return true;
    }

    // API错误可能是可恢复的
    if (message.includes('api') && !message.includes('401') && !message.includes('403')) {
      return true;
    }

    return false;
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsBySeverity = this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorQueue.length,
      errorsBySeverity,
      recentErrors: this.errorQueue.slice(-10)
    };
  }

  /**
   * 清空错误队列
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// 全局错误处理器实例
export const globalErrorHandler = ErrorHandler.getInstance();

// 便捷函数
export function reportError(error: Error, context?: Record<string, unknown>): void {
  globalErrorHandler.handleError(error, context);
}

export function getUserFriendlyErrorMessage(error: Error): string {
  return ErrorHandler.getUserFriendlyMessage(error);
}

export function isRecoverableError(error: Error): boolean {
  return ErrorHandler.isRecoverableError(error);
}