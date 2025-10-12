'use client';

import { DrawingStroke, CanvasData } from '@/types/canvas';
import { GameSession, PlayerStats } from '@/types/game';

export interface DrawingHint {
  id: string;
  type: 'technique' | 'composition' | 'detail' | 'encouragement';
  message: string;
  priority: 'low' | 'medium' | 'high';
  trigger: 'time' | 'stroke_count' | 'quality' | 'manual';
  displayDuration: number;
}

export interface ProgressSave {
  id: string;
  timestamp: Date;
  gameSession: Partial<GameSession>;
  canvasData: CanvasData;
  currentRound: number;
  timeRemaining: number;
  autoSave: boolean;
}

export interface OfflineQueueItem {
  id: string;
  type: 'guess_request' | 'save_progress' | 'submit_score';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export class UserExperienceEnhancer {
  private hints: DrawingHint[] = [];
  private progressSaves: Map<string, ProgressSave> = new Map();
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private hintTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // 用户偏好设置
  private preferences = {
    enableHints: true,
    enableAutoSave: true,
    autoSaveInterval: 30000, // 30秒
    enableOfflineMode: true,
    hintFrequency: 'normal' as 'low' | 'normal' | 'high',
    encouragementLevel: 'medium' as 'low' | 'medium' | 'high'
  };

  constructor() {
    this.initializeHints();
    this.setupNetworkListeners();
    this.loadPreferences();
    this.startAutoSave();
  }

  /**
   * 初始化绘画提示系统
   */
  private initializeHints(): void {
    // 技巧提示
    this.hints.push(
      {
        id: 'basic_shapes',
        type: 'technique',
        message: '💡 尝试从基本形状开始，如圆形、方形或三角形',
        priority: 'medium',
        trigger: 'stroke_count',
        displayDuration: 5000
      },
      {
        id: 'smooth_lines',
        type: 'technique',
        message: '✨ 画线时保持手势流畅，一气呵成效果更好',
        priority: 'low',
        trigger: 'time',
        displayDuration: 4000
      },
      {
        id: 'add_details',
        type: 'detail',
        message: '🎨 添加一些细节可以让AI更容易识别',
        priority: 'high',
        trigger: 'quality',
        displayDuration: 6000
      }
    );

    // 构图提示
    this.hints.push(
      {
        id: 'center_composition',
        type: 'composition',
        message: '📐 将主要物体放在画布中央通常效果更好',
        priority: 'medium',
        trigger: 'stroke_count',
        displayDuration: 5000
      },
      {
        id: 'size_matters',
        type: 'composition',
        message: '📏 画得大一些，让AI能看清楚细节',
        priority: 'high',
        trigger: 'quality',
        displayDuration: 5000
      }
    );

    // 鼓励提示
    this.hints.push(
      {
        id: 'keep_going',
        type: 'encouragement',
        message: '🌟 画得不错！继续加油！',
        priority: 'low',
        trigger: 'time',
        displayDuration: 3000
      },
      {
        id: 'almost_there',
        type: 'encouragement',
        message: '🎯 快完成了，再添加一些特征吧！',
        priority: 'medium',
        trigger: 'time',
        displayDuration: 4000
      },
      {
        id: 'great_progress',
        type: 'encouragement',
        message: '👏 进步很大！这幅画很有特色！',
        priority: 'low',
        trigger: 'manual',
        displayDuration: 3000
      }
    );
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
      console.log('网络已连接，处理离线队列');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('网络已断开，启用离线模式');
    });
  }

  /**
   * 加载用户偏好
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('foxai_ux_preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('加载用户偏好失败:', error);
    }
  }

  /**
   * 保存用户偏好
   */
  savePreferences(newPreferences: Partial<typeof this.preferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    try {
      localStorage.setItem('foxai_ux_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('保存用户偏好失败:', error);
    }
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    if (!this.preferences.enableAutoSave) return;

    setInterval(() => {
      this.triggerAutoSave();
    }, this.preferences.autoSaveInterval);
  }

  /**
   * 分析绘画并提供智能提示
   */
  analyzeDrawingAndProvideHints(
    strokes: DrawingStroke[],
    timeElapsed: number,
    gameContext?: {
      currentRound: number;
      totalRounds: number;
      previousAttempts: number;
    }
  ): DrawingHint[] {
    if (!this.preferences.enableHints) return [];

    const applicableHints: DrawingHint[] = [];
    const strokeCount = strokes.length;
    const drawingDensity = this.calculateDrawingDensity(strokes);

    // 基于笔画数量的提示
    if (strokeCount < 3 && timeElapsed > 10000) {
      applicableHints.push(this.getHintByType('technique', 'basic_shapes'));
    }

    // 基于时间的提示
    if (timeElapsed > 30000 && strokeCount > 10) {
      applicableHints.push(this.getHintByType('detail', 'add_details'));
    }

    // 基于绘画质量的提示
    if (drawingDensity < 0.1 && strokeCount > 5) {
      applicableHints.push(this.getHintByType('composition', 'size_matters'));
    }

    // 鼓励性提示
    if (gameContext && gameContext.previousAttempts > 2) {
      applicableHints.push(this.getHintByType('encouragement', 'keep_going'));
    }

    // 根据用户偏好过滤提示频率
    return this.filterHintsByFrequency(applicableHints);
  }

  /**
   * 计算绘画密度
   */
  private calculateDrawingDensity(strokes: DrawingStroke[]): number {
    if (strokes.length === 0) return 0;

    let totalPoints = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    strokes.forEach(stroke => {
      totalPoints += stroke.points.length;
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    const area = (maxX - minX) * (maxY - minY);
    return area > 0 ? totalPoints / area : 0;
  }

  /**
   * 获取指定类型的提示
   */
  private getHintByType(type: DrawingHint['type'], id?: string): DrawingHint | null {
    const hints = this.hints.filter(h => h.type === type);
    if (id) {
      return hints.find(h => h.id === id) || null;
    }
    return hints[Math.floor(Math.random() * hints.length)] || null;
  }

  /**
   * 根据频率偏好过滤提示
   */
  private filterHintsByFrequency(hints: (DrawingHint | null)[]): DrawingHint[] {
    const validHints = hints.filter((h): h is DrawingHint => h !== null);
    
    switch (this.preferences.hintFrequency) {
      case 'low':
        return validHints.filter(h => h.priority === 'high').slice(0, 1);
      case 'normal':
        return validHints.filter(h => h.priority !== 'low').slice(0, 2);
      case 'high':
        return validHints.slice(0, 3);
      default:
        return validHints.slice(0, 2);
    }
  }

  /**
   * 显示提示
   */
  showHint(hint: DrawingHint, onDisplay?: (hint: DrawingHint) => void): void {
    // 清除之前的定时器
    const existingTimer = this.hintTimers.get(hint.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 显示提示
    onDisplay?.(hint);

    // 设置自动隐藏
    const timer = setTimeout(() => {
      this.hideHint(hint.id);
    }, hint.displayDuration);

    this.hintTimers.set(hint.id, timer);
  }

  /**
   * 隐藏提示
   */
  hideHint(hintId: string): void {
    const timer = this.hintTimers.get(hintId);
    if (timer) {
      clearTimeout(timer);
      this.hintTimers.delete(hintId);
    }
  }

  /**
   * 保存游戏进度
   */
  saveProgress(
    gameSession: Partial<GameSession>,
    canvasData: CanvasData,
    currentRound: number,
    timeRemaining: number,
    autoSave: boolean = false
  ): string {
    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const progressSave: ProgressSave = {
      id: saveId,
      timestamp: new Date(),
      gameSession,
      canvasData,
      currentRound,
      timeRemaining,
      autoSave
    };

    this.progressSaves.set(saveId, progressSave);

    // 保存到本地存储
    try {
      const saves = Array.from(this.progressSaves.values());
      localStorage.setItem('foxai_progress_saves', JSON.stringify(saves));
      console.log(`游戏进度已保存: ${saveId}`);
    } catch (error) {
      console.error('保存进度失败:', error);
    }

    return saveId;
  }

  /**
   * 加载游戏进度
   */
  loadProgress(saveId?: string): ProgressSave | ProgressSave[] | null {
    try {
      const saved = localStorage.getItem('foxai_progress_saves');
      if (!saved) return null;

      const saves: ProgressSave[] = JSON.parse(saved);
      
      // 重建Map
      this.progressSaves.clear();
      saves.forEach(save => {
        this.progressSaves.set(save.id, save);
      });

      if (saveId) {
        return this.progressSaves.get(saveId) || null;
      } else {
        // 返回最近的保存
        return saves.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch (error) {
      console.error('加载进度失败:', error);
      return null;
    }
  }

  /**
   * 删除保存的进度
   */
  deleteProgress(saveId: string): boolean {
    try {
      this.progressSaves.delete(saveId);
      const saves = Array.from(this.progressSaves.values());
      localStorage.setItem('foxai_progress_saves', JSON.stringify(saves));
      return true;
    } catch (error) {
      console.error('删除进度失败:', error);
      return false;
    }
  }

  /**
   * 触发自动保存
   */
  private triggerAutoSave(): void {
    // 这个方法需要从外部调用，传入当前游戏状态
    // 这里只是一个占位符
    console.log('自动保存触发器已准备就绪');
  }

  /**
   * 添加到离线队列
   */
  addToOfflineQueue(
    type: OfflineQueueItem['type'],
    data: any,
    maxRetries: number = 3
  ): string {
    const itemId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: OfflineQueueItem = {
      id: itemId,
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries
    };

    this.offlineQueue.push(queueItem);
    
    // 保存到本地存储
    try {
      localStorage.setItem('foxai_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('保存离线队列失败:', error);
    }

    return itemId;
  }

  /**
   * 处理离线队列
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    console.log(`处理离线队列，共 ${this.offlineQueue.length} 项`);

    const itemsToProcess = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.processOfflineItem(item);
        console.log(`离线项目处理成功: ${item.id}`);
      } catch (error) {
        console.error(`离线项目处理失败: ${item.id}`, error);
        
        // 重试逻辑
        if (item.retryCount < item.maxRetries) {
          item.retryCount++;
          this.offlineQueue.push(item);
        } else {
          console.warn(`离线项目达到最大重试次数，放弃: ${item.id}`);
        }
      }
    }

    // 更新本地存储
    try {
      localStorage.setItem('foxai_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('更新离线队列失败:', error);
    }
  }

  /**
   * 处理单个离线项目
   */
  private async processOfflineItem(item: OfflineQueueItem): Promise<void> {
    switch (item.type) {
      case 'guess_request':
        await this.processOfflineGuessRequest(item.data);
        break;
      case 'save_progress':
        await this.processOfflineProgressSave(item.data);
        break;
      case 'submit_score':
        await this.processOfflineScoreSubmit(item.data);
        break;
      default:
        console.warn(`未知的离线项目类型: ${item.type}`);
    }
  }

  /**
   * 处理离线猜测请求
   */
  private async processOfflineGuessRequest(data: any): Promise<void> {
    const response = await fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`猜测请求失败: ${response.status}`);
    }

    // 这里可以触发回调或事件来更新UI
  }

  /**
   * 处理离线进度保存
   */
  private async processOfflineProgressSave(data: any): Promise<void> {
    // 实现云端进度保存逻辑
    console.log('处理离线进度保存:', data);
  }

  /**
   * 处理离线分数提交
   */
  private async processOfflineScoreSubmit(data: any): Promise<void> {
    // 实现分数提交逻辑
    console.log('处理离线分数提交:', data);
  }

  /**
   * 获取用户体验统计
   */
  getUXStats(): {
    hintsShown: number;
    progressSaves: number;
    offlineQueueSize: number;
    isOnline: boolean;
    preferences: typeof this.preferences;
  } {
    return {
      hintsShown: this.hintTimers.size,
      progressSaves: this.progressSaves.size,
      offlineQueueSize: this.offlineQueue.length,
      isOnline: this.isOnline,
      preferences: { ...this.preferences }
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 清除所有定时器
    this.hintTimers.forEach(timer => clearTimeout(timer));
    this.hintTimers.clear();

    // 移除事件监听器
    window.removeEventListener('online', this.processOfflineQueue);
    window.removeEventListener('offline', () => {});
  }
}

// 导出单例实例
export const uxEnhancer = new UserExperienceEnhancer();
