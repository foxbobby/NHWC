import { NextRequest, NextResponse } from 'next/server';
import { SiliconFlowClient, APIRetryHandler, ImageOptimizer } from '@/services/siliconFlowClient';
import { AdvancedImageOptimizer } from '@/services/advancedImageOptimizer';
import { enhancedAI } from '@/services/enhancedAIRecognition';
import { GuessAPIRequest, GuessAPIResponse, APIResponse } from '@/types/api';
import { GuessResult } from '@/types/game';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const body: GuessAPIRequest = await request.json();
    const { 
      imageData, 
      prompt, 
      maxResults = 5, 
      confidenceThreshold = 0.1,
      context // 新增上下文参数
    } = body;

    // 验证必要参数
    if (!imageData) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少图像数据',
          timestamp: new Date().toISOString()
        } as APIResponse,
        { status: 400 }
      );
    }

    // 验证图像格式
    if (!AdvancedImageOptimizer.validateImageFormat(imageData)) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.INVALID_IMAGE,
          timestamp: new Date().toISOString()
        } as APIResponse,
        { status: 400 }
      );
    }

    // 获取API密钥
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error('SILICONFLOW_API_KEY环境变量未设置');
      return NextResponse.json(
        {
          success: false,
          error: '服务配置错误',
          timestamp: new Date().toISOString()
        } as APIResponse,
        { status: 500 }
      );
    }

    // 分析图像质量
    const qualityMetrics = await AdvancedImageOptimizer.analyzeImageQuality(imageData);
    
    // 如果图像质量太低，返回错误
    if (qualityMetrics.isEmpty || qualityMetrics.qualityScore < 10) {
      return NextResponse.json(
        {
          success: false,
          error: '图像质量过低或为空白画布，请重新绘制',
          timestamp: new Date().toISOString()
        } as APIResponse,
        { status: 400 }
      );
    }
    
    // 优化图像数据
    const optimizationResult = await AdvancedImageOptimizer.compressImageProgressive(imageData, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.8,
      progressive: true
    });
    
    console.log('图像优化结果:', {
      原始大小: `${(optimizationResult.originalSize / 1024).toFixed(1)}KB`,
      压缩后大小: `${(optimizationResult.compressedSize / 1024).toFixed(1)}KB`,
      压缩比: `${(optimizationResult.compressionRatio * 100).toFixed(1)}%`,
      质量评分: qualityMetrics.qualityScore.toFixed(1)
    });

    // 初始化API客户端
    const client = new SiliconFlowClient(apiKey);

    // 记录请求开始时间
    const startTime = Date.now();

    // 使用增强AI识别
    const results = await enhancedAI.recognizeImage(optimizationResult.imageData, {
      enablePreprocessing: true,
      enableMultiModel: false, // 可以根据需要启用
      enableContextualHints: true,
      confidenceThreshold,
      maxResults,
      context
    });

    // 计算处理时间
    const processingTime = Date.now() - startTime;

    // 处理结果（如果有提示词，进行匹配判断）
    const processedResults = prompt ? processGuessResults(results, prompt) : results;

    // 构建响应
    const response: APIResponse<GuessAPIResponse> = {
      success: true,
      data: {
        results: processedResults,
        processingTime,
        imageSize: {
          width: optimizationResult.compressedSize,
          height: 0 // SiliconFlow API可能不返回尺寸信息
        },
        qualityMetrics,
        optimizationStats: {
          originalSize: optimizationResult.originalSize,
          compressedSize: optimizationResult.compressedSize,
          compressionRatio: optimizationResult.compressionRatio,
          format: optimizationResult.format
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API路由错误:', error);

    // 根据错误类型返回不同的状态码
    let statusCode = 500;
    let errorMessage: string = ERROR_MESSAGES.API_ERROR;

    if (error instanceof Error) {
      if (error.message.includes('网络')) {
        statusCode = 503;
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (error.message.includes('超时')) {
        statusCode = 408;
        errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        statusCode = 401;
        errorMessage = 'API密钥无效';
      } else if (error.message.includes('400') || error.message.includes('bad request')) {
        statusCode = 400;
        errorMessage = '请求格式错误';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      } as APIResponse,
      { status: statusCode }
    );
  }
}

/**
 * 处理猜测结果，判断是否正确
 */
function processGuessResults(results: GuessResult[], correctAnswer: string): GuessResult[] {
  const normalizedAnswer = correctAnswer.toLowerCase().trim();
  
  return results.map(result => ({
    ...result,
    isCorrect: isGuessCorrect(result.guess, normalizedAnswer)
  }));
}

/**
 * 判断猜测是否正确
 */
function isGuessCorrect(guess: string, correctAnswer: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim();
  
  // 完全匹配
  if (normalizedGuess === correctAnswer) {
    return true;
  }
  
  // 包含匹配
  if (normalizedGuess.includes(correctAnswer) || correctAnswer.includes(normalizedGuess)) {
    return true;
  }
  
  // 可以添加更多匹配逻辑，如：
  // - 同义词匹配
  // - 模糊匹配
  // - 多语言匹配
  
  return false;
}

/**
 * 健康检查端点
 */
export async function GET() {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API密钥未配置',
          timestamp: new Date().toISOString()
        } as APIResponse,
        { status: 500 }
      );
    }

    // 执行健康检查
    const client = new SiliconFlowClient(apiKey);
    const isHealthy = await client.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          siliconflow: isHealthy ? 'available' : 'unavailable',
          database: 'connected' // 目前没有数据库，始终返回连接状态
        }
      },
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('健康检查失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '健康检查失败',
        timestamp: new Date().toISOString()
      } as APIResponse,
      { status: 500 }
    );
  }
}