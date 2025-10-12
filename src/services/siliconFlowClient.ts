import { 
  SiliconFlowRequest, 
  SiliconFlowResponse, 
  APIError 
} from '@/types/api';
import { GuessResult } from '@/types/game';
import { API_CONFIG, ERROR_MESSAGES } from '@/lib/constants';
import { AdvancedImageOptimizer, ImageOptimizerCompat } from './advancedImageOptimizer';

export class SiliconFlowClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = API_CONFIG.SILICONFLOW_BASE_URL;
  }

  /**
   * 识别图像内容
   */
  async recognizeImage(
    imageData: string,
    options: {
      maxResults?: number;
      confidenceThreshold?: number;
    } = {}
  ): Promise<GuessResult[]> {
    try {
      // 准备VL模型请求数据
      const requestData = {
        model: API_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                }
              },
              {
                type: "text",
                text: "请仔细观察这幅画，告诉我画的是什么。请用简短的中文词汇回答，比如：猫、房子、汽车等。如果画面不清楚或无法识别，请回答'无法识别'。"
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      };

      // 发送请求
      const response = await this.makeRequest('/v1/chat/completions', requestData);
      
      // 解析VL模型响应
      return this.parseVLResponse(response);
    } catch (error) {
      console.error('图像识别失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 发送HTTP请求
   */
  private async makeRequest(endpoint: string, data: unknown): Promise<unknown> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FoxAI-DrawGuess/1.0'
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API请求失败: ${response.status} - ${errorData.message || errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 解析VL模型响应
   */
  private parseVLResponse(response: unknown): GuessResult[] {
    const apiResponse = response as any;
    if (!apiResponse.choices || !Array.isArray(apiResponse.choices) || apiResponse.choices.length === 0) {
      throw new Error('无效的API响应格式');
    }

    const content = apiResponse.choices[0]?.message?.content;
    if (!content) {
      throw new Error('API返回空内容');
    }

    // 解析AI的回答，提取可能的答案
    const guesses = this.extractGuessesFromText(content);
    
    return guesses.map((guess, index) => ({
      guess: guess.trim(),
      confidence: Math.max(0.1, 1.0 - (index * 0.2)), // 模拟置信度，第一个答案置信度最高
      isCorrect: false // 将在游戏逻辑中判断
    }));
  }

  /**
   * 从文本中提取猜测结果
   */
  private extractGuessesFromText(text: string): string[] {
    // 清理文本
    const cleanText = text.replace(/[，。！？、]/g, ',').toLowerCase();
    
    // 分割可能的多个答案
    const parts = cleanText.split(/[,，\n\r]/);
    const guesses: string[] = [];
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && trimmed !== '无法识别' && trimmed.length > 0 && trimmed.length < 20) {
        // 移除常见的前缀词
        const cleaned = trimmed
          .replace(/^(这是|画的是|看起来像|应该是|可能是|似乎是)/, '')
          .replace(/[的了吧呢啊]$/, '')
          .trim();
        
        if (cleaned && !guesses.includes(cleaned)) {
          guesses.push(cleaned);
        }
      }
    }
    
    // 如果没有提取到有效答案，返回原始文本
    if (guesses.length === 0) {
      guesses.push(text.trim());
    }
    
    // 最多返回5个猜测
    return guesses.slice(0, 5);
  }

  /**
   * 清理图像数据
   */
  private cleanImageData(imageData: string): string {
    // 移除data URL前缀，只保留base64数据
    const base64Match = imageData.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
    if (base64Match) {
      return base64Match[1];
    }
    
    // 如果已经是纯base64数据，直接返回
    return imageData;
  }

  /**
   * 错误处理
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      
      if (error.message?.includes('网络') || error.message?.includes('fetch')) {
        return new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      if (error.message?.includes('API')) {
        return new Error(ERROR_MESSAGES.API_ERROR);
      }
      
      return new Error(error.message || '未知错误');
    }
    
    return new Error('未知错误');
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 使用简单的文本请求进行健康检查
      const testData = {
        model: API_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "你好"
              }
            ]
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      };
      
      await this.makeRequest('/v1/chat/completions', testData);
      
      return true;
    } catch (error) {
      console.warn('SiliconFlow API健康检查失败:', error);
      return false;
    }
  }
}

/**
 * API重试包装器
 */
export class APIRetryHandler {
  static async withRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = API_CONFIG.MAX_RETRIES,
    delay: number = API_CONFIG.RETRY_DELAY
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // 某些错误不需要重试
        if (this.shouldNotRetry(lastError)) {
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

  private static shouldNotRetry(error: Error): boolean {
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
}

/**
 * 图像优化工具
 */
export class ImageOptimizer {
  /**
   * 压缩图像数据
   */
  static compressImage(
    imageData: string,
    maxSize: number = API_CONFIG.MAX_IMAGE_SIZE,
    quality: number = 0.8
  ): string {
    // 检查图像大小
    const sizeInBytes = (imageData.length * 3) / 4; // base64大小估算
    
    if (sizeInBytes <= maxSize) {
      return imageData;
    }
    
    // 如果图像过大，需要进一步压缩
    // 这里可以实现更复杂的压缩逻辑
    console.warn('图像大小超出限制，建议在前端进行压缩');
    return imageData;
  }

  /**
   * 验证图像格式
   */
  static validateImageFormat(imageData: string): boolean {
    const formatRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    return formatRegex.test(imageData);
  }

  /**
   * 获取图像信息
   */
  static getImageInfo(imageData: string): {
    format: string;
    sizeInBytes: number;
  } | null {
    const match = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!match) return null;

    const [, format, base64Data] = match;
    const sizeInBytes = (base64Data.length * 3) / 4;

    return {
      format,
      sizeInBytes
    };
  }
}