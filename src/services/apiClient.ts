'use client';

import { GuessAPIRequest, GuessAPIResponse, APIResponse, HealthCheckResponse } from '@/types/api';
import { ERROR_MESSAGES } from '@/lib/constants';

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * 发送图像猜测请求
   */
  async guessImage(request: GuessAPIRequest): Promise<GuessAPIResponse> {
    try {
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: APIResponse<GuessAPIResponse> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success || !data.data) {
        throw new Error(data.error || '请求失败');
      }

      return data.data;
    } catch (error) {
      console.error('图像猜测请求失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
      });

      const data: APIResponse<HealthCheckResponse> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || '健康检查失败');
      }

      return data.data;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: unknown): Error {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      }

      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        return new Error('认证失败，请检查API配置');
      }

      if (error.message?.includes('400') || error.message?.includes('bad request')) {
        return new Error('请求格式错误，请重试');
      }

      if (error.message?.includes('500') || error.message?.includes('internal server')) {
        return new Error(ERROR_MESSAGES.API_ERROR);
      }

      if (error.message?.includes('503') || error.message?.includes('service unavailable')) {
        return new Error('服务暂时不可用，请稍后重试');
      }

      return new Error(error.message || '未知错误');
    }

    return new Error('未知错误');
  }
}

// 创建默认客户端实例
export const apiClient = new APIClient();

/**
 * 带重试的API调用包装器
 */
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;

      // 最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 某些错误不需要重试
      if (shouldNotRetry(lastError)) {
        throw lastError;
      }

      // 指数退避延迟
      const retryDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      console.warn(`API调用失败，第${attempt}次重试 (${retryDelay}ms后):`, lastError.message);
    }
  }

  throw lastError!;
}

/**
 * 判断是否应该重试
 */
function shouldNotRetry(error: Error): boolean {
  const message = error.message.toLowerCase();

  // 认证错误不重试
  if (message.includes('401') || message.includes('unauthorized')) {
    return true;
  }

  // 请求格式错误不重试
  if (message.includes('400') || message.includes('bad request')) {
    return true;
  }

  // 图像格式错误不重试
  if (message.includes('invalid image') || message.includes('unsupported format')) {
    return true;
  }

  return false;
}

/**
 * 请求拦截器类型
 */
export type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;

/**
 * 响应拦截器类型
 */
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * 增强的API客户端
 */
export class EnhancedAPIClient extends APIClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 发送请求（带拦截器支持）
   */
  protected async fetch(url: string, config: RequestInit = {}): Promise<Response> {
    // 应用请求拦截器
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // 发送请求
    let response = await fetch(url, finalConfig);

    // 应用响应拦截器
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    return response;
  }
}

// 创建增强的客户端实例
export const enhancedApiClient = new EnhancedAPIClient();

// 添加默认的请求拦截器（添加时间戳防止缓存）
enhancedApiClient.addRequestInterceptor((config) => {
  return {
    ...config,
    cache: 'no-cache' as RequestCache
  };
});

// 添加默认的响应拦截器（日志记录）
enhancedApiClient.addResponseInterceptor((response) => {
  console.log(`API请求: ${response.url} - ${response.status}`);
  return response;
});