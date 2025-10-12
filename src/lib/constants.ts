// FoxAI品牌色彩
export const BRAND_COLORS = {
  primary: '#2563EB',
  secondary: '#F97316', 
  neutral: '#64748B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    light: '#94A3B8'
  }
} as const;

// 游戏配置
export const GAME_CONFIG = {
  DEFAULT_ROUNDS: 5,
  MAX_ROUNDS: 10,
  ROUND_TIME_LIMIT: 60, // 秒
  MIN_DRAWING_TIME: 5, // 最少绘画时间
  MAX_GUESS_RESULTS: 5,
  CONFIDENCE_THRESHOLD: 0.1,
  POINTS: {
    CORRECT_GUESS: 100,
    TIME_BONUS: 50,
    CONFIDENCE_BONUS: 25
  }
} as const;

// 画布配置
export const CANVAS_CONFIG = {
  DEFAULT_WIDTH: 512,
  DEFAULT_HEIGHT: 512,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 300,
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  ASPECT_RATIO: 1, // 1:1 正方形
  BACKGROUND_COLOR: '#FFFFFF',
  MAX_STROKES: 1000
} as const;

// 画笔配置
export const BRUSH_CONFIG = {
  DEFAULT_SIZE: 4,
  MIN_SIZE: 1,
  MAX_SIZE: 20,
  DEFAULT_COLOR: '#1E293B',
  DEFAULT_OPACITY: 1,
  COLORS: [
    '#1E293B', // 黑色
    '#EF4444', // 红色
    '#10B981', // 绿色
    '#2563EB', // 蓝色
    '#F59E0B', // 黄色
    '#8B5CF6', // 紫色
    '#F97316', // 橙色
    '#64748B'  // 灰色
  ]
} as const;

// API配置
export const API_CONFIG = {
  SILICONFLOW_BASE_URL: 'https://api.siliconflow.cn',
  DEFAULT_MODEL: 'Qwen/Qwen2-VL-72B-Instruct',
  REQUEST_TIMEOUT: 30000, // 30秒，VL模型需要更长时间
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1秒
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
} as const;

// 响应式断点
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1025
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  PLAYER_STATS: 'foxai_player_stats',
  GAME_HISTORY: 'foxai_game_history',
  PREFERENCES: 'foxai_preferences',
  LAST_SESSION: 'foxai_last_session'
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接异常，请检查网络设置',
  API_ERROR: 'AI服务暂时不可用，请稍后重试',
  TIMEOUT_ERROR: '请求超时，请重新提交',
  INVALID_IMAGE: '图像格式不支持，请重新绘制',
  CANVAS_ERROR: '画布初始化失败，请刷新页面',
  STORAGE_ERROR: '数据保存失败，请检查浏览器设置'
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  CORRECT_GUESS: '太棒了！AI猜对了！',
  GAME_COMPLETED: '游戏完成！查看你的成绩吧！',
  DRAWING_SAVED: '绘画已保存到历史记录',
  SETTINGS_SAVED: '设置已保存'
} as const;