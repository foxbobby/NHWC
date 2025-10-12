'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BRAND_COLORS } from '@/lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 发送错误报告（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // 这里可以集成错误监控服务，如 Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Error Report:', errorReport);
    
    // 示例：发送到错误监控服务
    // fetch('/api/error-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">😵</div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              哎呀，出错了！
            </h1>
            
            <p className="text-gray-600 mb-6">
              应用遇到了一个意外错误。我们已经记录了这个问题，正在努力修复。
            </p>

            {/* 错误详情（开发环境） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  错误详情：
                </h3>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack && '\n\n' + this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                重试
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                刷新页面
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              如果问题持续存在，请联系技术支持
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 游戏专用错误边界
interface GameErrorBoundaryProps {
  children: ReactNode;
  onGameError?: (error: Error) => void;
}

export function GameErrorBoundary({ children, onGameError }: GameErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Game Error:', error, errorInfo);
    
    if (onGameError) {
      onGameError(error);
    }
  };

  const fallback = (
    <div className="flex items-center justify-center min-h-96 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="text-center p-6">
        <div className="text-4xl mb-4">🎮</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          游戏遇到错误
        </h3>
        <p className="text-gray-600 mb-4">
          游戏组件出现了问题，请尝试刷新页面
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          style={{ backgroundColor: BRAND_COLORS.primary }}
        >
          刷新游戏
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

// Canvas专用错误边界
interface CanvasErrorBoundaryProps {
  children: ReactNode;
  onCanvasError?: (error: Error) => void;
}

export function CanvasErrorBoundary({ children, onCanvasError }: CanvasErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Canvas Error:', error, errorInfo);
    
    if (onCanvasError) {
      onCanvasError(error);
    }
  };

  const fallback = (
    <div className="flex items-center justify-center w-full h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center p-6">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          画布加载失败
        </h3>
        <p className="text-gray-600 mb-4">
          绘图组件出现问题，请检查浏览器兼容性
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          style={{ backgroundColor: BRAND_COLORS.primary }}
        >
          重新加载
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}