'use client';

import { GuessResult } from '@/types/game';
import { AdvancedImageOptimizer } from './advancedImageOptimizer';
import { API_CONFIG } from '@/lib/constants';

export interface AIModel {
  name: string;
  endpoint: string;
  weight: number;
  isAvailable: boolean;
  responseTime: number;
  accuracy: number;
}

export interface RecognitionContext {
  gameHistory: string[];
  playerSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  drawingTime: number;
  strokeCount: number;
  previousGuesses: GuessResult[];
}

export interface EnhancedRecognitionOptions {
  enablePreprocessing?: boolean;
  enableMultiModel?: boolean;
  enableContextualHints?: boolean;
  confidenceThreshold?: number;
  maxResults?: number;
  context?: RecognitionContext;
}

export class EnhancedAIRecognition {
  private models: Map<string, AIModel> = new Map();
  private contextualKeywords: Map<string, string[]> = new Map();
  private performanceHistory: Array<{
    model: string;
    accuracy: number;
    responseTime: number;
    timestamp: number;
  }> = [];

  constructor() {
    this.initializeModels();
    this.initializeContextualKeywords();
  }

  /**
   * 初始化AI模型配置
   */
  private initializeModels(): void {
    // 主模型 - Qwen2-VL-72B-Instruct
    this.models.set('qwen2-vl-72b', {
      name: 'Qwen2-VL-72B-Instruct',
      endpoint: '/v1/chat/completions',
      weight: 0.7,
      isAvailable: true,
      responseTime: 0,
      accuracy: 0.85
    });

    // 备用模型 - 可以添加其他模型
    this.models.set('qwen2-vl-7b', {
      name: 'Qwen2-VL-7B-Instruct',
      endpoint: '/v1/chat/completions',
      weight: 0.3,
      isAvailable: true,
      responseTime: 0,
      accuracy: 0.75
    });
  }

  /**
   * 初始化上下文关键词
   */
  private initializeContextualKeywords(): void {
    // 动物类别
    this.contextualKeywords.set('animals', [
      '猫', '狗', '鸟', '鱼', '马', '牛', '羊', '猪', '鸡', '鸭',
      '老虎', '狮子', '大象', '熊猫', '兔子', '老鼠', '蛇', '青蛙'
    ]);

    // 交通工具
    this.contextualKeywords.set('vehicles', [
      '汽车', '自行车', '摩托车', '公交车', '火车', '飞机', '船',
      '卡车', '出租车', '地铁', '轮船', '直升机'
    ]);

    // 食物
    this.contextualKeywords.set('food', [
      '苹果', '香蕉', '橙子', '草莓', '西瓜', '葡萄', '面包', '蛋糕',
      '汉堡', '披萨', '面条', '米饭', '鸡蛋', '牛奶', '咖啡', '茶'
    ]);

    // 日常用品
    this.contextualKeywords.set('objects', [
      '桌子', '椅子', '床', '电视', '电脑', '手机', '书', '笔',
      '杯子', '盘子', '碗', '筷子', '勺子', '刀', '叉子', '钥匙'
    ]);

    // 自然景物
    this.contextualKeywords.set('nature', [
      '太阳', '月亮', '星星', '云', '雨', '雪', '山', '海',
      '树', '花', '草', '石头', '河流', '湖泊', '森林', '沙漠'
    ]);
  }

  /**
   * 增强的图像识别
   */
  async recognizeImage(
    imageData: string,
    options: EnhancedRecognitionOptions = {}
  ): Promise<GuessResult[]> {
    const {
      enablePreprocessing = true,
      enableMultiModel = false,
      enableContextualHints = true,
      confidenceThreshold = 0.1,
      maxResults = 5,
      context
    } = options;

    try {
      // 1. 图像预处理
      let processedImageData = imageData;
      if (enablePreprocessing) {
        processedImageData = await this.preprocessImage(imageData, context);
      }

      // 2. 生成上下文提示
      const contextualPrompt = enableContextualHints ? 
        this.generateContextualPrompt(context) : '';

      // 3. 多模型识别或单模型识别
      let results: GuessResult[];
      if (enableMultiModel && this.getAvailableModels().length > 1) {
        results = await this.multiModelRecognition(processedImageData, contextualPrompt, maxResults);
      } else {
        results = await this.singleModelRecognition(processedImageData, contextualPrompt, maxResults);
      }

      // 4. 后处理和排序
      const processedResults = this.postProcessResults(results, context, confidenceThreshold);

      // 5. 记录性能数据
      this.recordPerformance(results);

      return processedResults.slice(0, maxResults);

    } catch (error) {
      console.error('增强AI识别失败:', error);
      throw error;
    }
  }

  /**
   * 图像预处理
   */
  private async preprocessImage(imageData: string, context?: RecognitionContext): Promise<string> {
    try {
      // 分析图像质量
      const qualityMetrics = await AdvancedImageOptimizer.analyzeImageQuality(imageData);
      
      // 根据质量决定预处理策略
      if (qualityMetrics.contrastLevel < 0.3) {
        // 低对比度图像 - 增强对比度
        return await AdvancedImageOptimizer.preprocessImage(imageData);
      } else if (qualityMetrics.strokeDensity < 0.05) {
        // 稀疏绘画 - 可能需要放大关键区域
        return await this.enhanceSparsDrawing(imageData);
      } else {
        // 正常质量 - 标准预处理
        return await AdvancedImageOptimizer.preprocessImage(imageData);
      }
    } catch (error) {
      console.warn('图像预处理失败，使用原图:', error);
      return imageData;
    }
  }

  /**
   * 增强稀疏绘画
   */
  private async enhanceSparsDrawing(imageData: string): Promise<string> {
    // 这里可以实现更复杂的图像增强算法
    // 目前使用基础预处理
    return await AdvancedImageOptimizer.preprocessImage(imageData);
  }

  /**
   * 生成上下文提示
   */
  private generateContextualPrompt(context?: RecognitionContext): string {
    if (!context) {
      return '请仔细观察这幅画，告诉我画的是什么。请用简短的中文词汇回答，比如：猫、房子、汽车等。';
    }

    let prompt = '请仔细观察这幅画，告诉我画的是什么。';

    // 根据游戏历史添加上下文
    if (context.gameHistory.length > 0) {
      const recentItems = context.gameHistory.slice(-3).join('、');
      prompt += `之前画过：${recentItems}。`;
    }

    // 根据玩家技能水平调整
    switch (context.playerSkillLevel) {
      case 'beginner':
        prompt += '这可能是一个简单的物体或动物。';
        break;
      case 'intermediate':
        prompt += '这可能是一个日常物品、动物或简单场景。';
        break;
      case 'advanced':
        prompt += '这可能是一个复杂的物体、场景或抽象概念。';
        break;
    }

    // 根据绘画时间和笔画数添加提示
    if (context.drawingTime < 10000) { // 10秒内
      prompt += '绘画时间较短，可能是简单图形。';
    } else if (context.drawingTime > 30000) { // 30秒以上
      prompt += '绘画时间较长，可能包含细节。';
    }

    if (context.strokeCount < 5) {
      prompt += '笔画较少，可能是简单形状。';
    } else if (context.strokeCount > 20) {
      prompt += '笔画较多，可能是复杂图形。';
    }

    prompt += '请用简短的中文词汇回答，如果不确定请提供几个可能的选项。';

    return prompt;
  }

  /**
   * 单模型识别
   */
  private async singleModelRecognition(
    imageData: string,
    prompt: string,
    maxResults: number
  ): Promise<GuessResult[]> {
    const primaryModel = this.getPrimaryModel();
    if (!primaryModel) {
      throw new Error('没有可用的AI模型');
    }

    const startTime = Date.now();
    
    try {
      const response = await this.callModel(primaryModel, imageData, prompt);
      const results = this.parseModelResponse(response, maxResults);
      
      // 更新模型性能
      primaryModel.responseTime = Date.now() - startTime;
      
      return results;
    } catch (error) {
      console.error(`模型 ${primaryModel.name} 调用失败:`, error);
      throw error;
    }
  }

  /**
   * 多模型识别
   */
  private async multiModelRecognition(
    imageData: string,
    prompt: string,
    maxResults: number
  ): Promise<GuessResult[]> {
    const availableModels = this.getAvailableModels();
    const promises = availableModels.map(async (model) => {
      const startTime = Date.now();
      try {
        const response = await this.callModel(model, imageData, prompt);
        const results = this.parseModelResponse(response, maxResults);
        
        // 更新模型性能
        model.responseTime = Date.now() - startTime;
        
        return { model, results, success: true };
      } catch (error) {
        console.warn(`模型 ${model.name} 调用失败:`, error);
        model.isAvailable = false;
        return { model, results: [], success: false };
      }
    });

    const responses = await Promise.allSettled(promises);
    const successfulResponses = responses
      .filter((response): response is PromiseFulfilledResult<any> => 
        response.status === 'fulfilled' && response.value.success
      )
      .map(response => response.value);

    if (successfulResponses.length === 0) {
      throw new Error('所有AI模型调用失败');
    }

    // 合并和加权结果
    return this.mergeModelResults(successfulResponses, maxResults);
  }

  /**
   * 调用AI模型
   */
  private async callModel(model: AIModel, imageData: string, prompt: string): Promise<any> {
    const response = await fetch(`${API_CONFIG.SILICONFLOW_BASE_URL}${model.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.name,
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
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`模型调用失败: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 解析模型响应
   */
  private parseModelResponse(response: any, maxResults: number): GuessResult[] {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('模型返回空内容');
      }

      // 解析多个可能的答案
      const answers = this.extractAnswers(content);
      
      return answers.slice(0, maxResults).map((answer, index) => ({
        guess: answer.trim(),
        confidence: Math.max(0.1, 0.9 - index * 0.15), // 递减置信度
        isCorrect: false // 将在后续处理中确定
      }));
    } catch (error) {
      console.error('解析模型响应失败:', error);
      return [];
    }
  }

  /**
   * 从文本中提取答案
   */
  private extractAnswers(text: string): string[] {
    const answers: string[] = [];
    
    // 匹配常见的答案格式
    const patterns = [
      /(?:这是|画的是|可能是|看起来像)([^，。！？\n]+)/g,
      /([一-龯]+)(?:[，。！？]|$)/g,
      /\d+[\.、]\s*([^，。！？\n]+)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const answer = match[1].trim();
        if (answer.length > 0 && answer.length < 10 && !answers.includes(answer)) {
          answers.push(answer);
        }
      }
    }

    // 如果没有匹配到，尝试简单分词
    if (answers.length === 0) {
      const words = text.split(/[，。！？\s]+/).filter(word => 
        word.length > 0 && word.length < 10 && /[\u4e00-\u9fff]/.test(word)
      );
      answers.push(...words.slice(0, 3));
    }

    return answers;
  }

  /**
   * 合并多模型结果
   */
  private mergeModelResults(responses: any[], maxResults: number): GuessResult[] {
    const resultMap = new Map<string, { confidence: number; count: number; totalWeight: number }>();

    // 收集所有结果
    responses.forEach(({ model, results }) => {
      results.forEach((result: GuessResult) => {
        const key = result.guess.toLowerCase();
        const existing = resultMap.get(key);
        
        if (existing) {
          existing.confidence = Math.max(existing.confidence, result.confidence * model.weight);
          existing.count += 1;
          existing.totalWeight += model.weight;
        } else {
          resultMap.set(key, {
            confidence: result.confidence * model.weight,
            count: 1,
            totalWeight: model.weight
          });
        }
      });
    });

    // 转换为最终结果
    const mergedResults: GuessResult[] = Array.from(resultMap.entries())
      .map(([guess, data]) => ({
        guess,
        confidence: data.confidence / data.totalWeight, // 加权平均
        isCorrect: false
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);

    return mergedResults;
  }

  /**
   * 后处理结果
   */
  private postProcessResults(
    results: GuessResult[],
    context?: RecognitionContext,
    confidenceThreshold: number = 0.1
  ): GuessResult[] {
    // 过滤低置信度结果
    let filteredResults = results.filter(result => result.confidence >= confidenceThreshold);

    // 上下文增强
    if (context) {
      filteredResults = this.enhanceWithContext(filteredResults, context);
    }

    // 去重和标准化
    filteredResults = this.deduplicateResults(filteredResults);

    return filteredResults;
  }

  /**
   * 上下文增强
   */
  private enhanceWithContext(results: GuessResult[], context: RecognitionContext): GuessResult[] {
    return results.map(result => {
      let enhancedConfidence = result.confidence;

      // 如果结果在上下文关键词中，提升置信度
      for (const [category, keywords] of this.contextualKeywords) {
        if (keywords.includes(result.guess)) {
          enhancedConfidence *= 1.2;
          break;
        }
      }

      // 如果与历史记录相似但不重复，略微降低置信度
      if (context.gameHistory.includes(result.guess)) {
        enhancedConfidence *= 0.8;
      }

      return {
        ...result,
        confidence: Math.min(enhancedConfidence, 1.0)
      };
    });
  }

  /**
   * 去重结果
   */
  private deduplicateResults(results: GuessResult[]): GuessResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.guess.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取主要模型
   */
  private getPrimaryModel(): AIModel | undefined {
    return Array.from(this.models.values())
      .filter(model => model.isAvailable)
      .sort((a, b) => b.weight - a.weight)[0];
  }

  /**
   * 获取可用模型
   */
  private getAvailableModels(): AIModel[] {
    return Array.from(this.models.values())
      .filter(model => model.isAvailable)
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * 记录性能数据
   */
  private recordPerformance(results: GuessResult[]): void {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    this.performanceHistory.push({
      model: 'combined',
      accuracy: avgConfidence,
      responseTime: Date.now(),
      timestamp: Date.now()
    });

    // 保留最近100条记录
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    averageAccuracy: number;
    averageResponseTime: number;
    modelStatus: Array<{ name: string; isAvailable: boolean; accuracy: number }>;
  } {
    const recentHistory = this.performanceHistory.slice(-20);
    const averageAccuracy = recentHistory.reduce((sum, h) => sum + h.accuracy, 0) / recentHistory.length || 0;
    const averageResponseTime = recentHistory.reduce((sum, h) => sum + h.responseTime, 0) / recentHistory.length || 0;

    const modelStatus = Array.from(this.models.values()).map(model => ({
      name: model.name,
      isAvailable: model.isAvailable,
      accuracy: model.accuracy
    }));

    return {
      averageAccuracy,
      averageResponseTime,
      modelStatus
    };
  }
}

// 导出单例实例
export const enhancedAI = new EnhancedAIRecognition();
