export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface GuessAPIRequest {
  imageData: string;
  prompt?: string;
  maxResults?: number;
  confidenceThreshold?: number;
  context?: {
    gameHistory: string[];
    playerSkillLevel: 'beginner' | 'intermediate' | 'advanced';
    drawingTime: number;
    strokeCount: number;
    previousGuesses: Array<{
      guess: string;
      confidence: number;
      isCorrect: boolean;
    }>;
  };
}

export interface GuessAPIResponse {
  results: GuessResult[];
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
  };
  qualityMetrics?: {
    isEmpty: boolean;
    strokeDensity: number;
    contrastLevel: number;
    colorVariance: number;
    qualityScore: number;
  };
  optimizationStats?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    format: string;
  };
}

export interface SiliconFlowRequest {
  image: string;
  model: string;
  max_results: number;
  confidence_threshold: number;
}

export interface SiliconFlowResponse {
  predictions: Array<{
    label: string;
    confidence: number;
    bbox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  processing_time: number;
  model_version: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    siliconflow: 'available' | 'unavailable';
    database: 'connected' | 'disconnected';
  };
}

import { GuessResult } from './game';