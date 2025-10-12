'use client';

import { API_CONFIG } from '@/lib/constants';

export interface ImageQualityMetrics {
  isEmpty: boolean;
  strokeDensity: number;
  contrastLevel: number;
  colorVariance: number;
  qualityScore: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  progressive?: boolean;
}

export interface OptimizationResult {
  imageData: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  quality: number;
  processingTime: number;
}

export class AdvancedImageOptimizer {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  /**
   * 获取或创建离屏Canvas
   */
  private static getOffscreenCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: true 
      });
      
      if (!this.ctx) {
        throw new Error('无法创建Canvas上下文');
      }
    }
    
    return { canvas: this.canvas!, ctx: this.ctx! };
  }

  /**
   * 检测浏览器WebP支持
   */
  static async supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * 分析图像质量
   */
  static async analyzeImageQuality(imageData: string): Promise<ImageQualityMetrics> {
    const startTime = performance.now();
    
    try {
      const { canvas, ctx } = this.getOffscreenCanvas();
      const img = new Image();
      
      return await new Promise<ImageQualityMetrics>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageDataObj.data;
          
          let nonTransparentPixels = 0;
          let totalBrightness = 0;
          let colorVariance = 0;
          const colorCounts = new Map<string, number>();
          
          // 分析像素数据
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            if (a > 0) {
              nonTransparentPixels++;
              const brightness = (r + g + b) / 3;
              totalBrightness += brightness;
              
              // 统计颜色分布
              const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
              colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
            }
          }
          
          const totalPixels = canvas.width * canvas.height;
          const strokeDensity = nonTransparentPixels / totalPixels;
          const avgBrightness = totalBrightness / nonTransparentPixels || 0;
          
          // 计算颜色方差
          let brightnessVariance = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            const a = pixels[i + 3];
            if (a > 0) {
              const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
              brightnessVariance += Math.pow(brightness - avgBrightness, 2);
            }
          }
          colorVariance = Math.sqrt(brightnessVariance / nonTransparentPixels) || 0;
          
          // 计算对比度
          const contrastLevel = colorVariance / 255;
          
          // 综合质量评分
          let qualityScore = 0;
          qualityScore += strokeDensity * 40; // 笔画密度权重40%
          qualityScore += Math.min(contrastLevel * 30, 30); // 对比度权重30%
          qualityScore += Math.min(colorCounts.size / 10 * 20, 20); // 颜色丰富度权重20%
          qualityScore += nonTransparentPixels > 100 ? 10 : 0; // 最小笔画数权重10%
          
          const metrics: ImageQualityMetrics = {
            isEmpty: strokeDensity < 0.001,
            strokeDensity,
            contrastLevel,
            colorVariance,
            qualityScore: Math.min(qualityScore, 100)
          };
          
          console.log(`图像质量分析完成: ${(performance.now() - startTime).toFixed(2)}ms`, metrics);
          resolve(metrics);
        };
        
        img.onerror = () => {
          resolve({
            isEmpty: true,
            strokeDensity: 0,
            contrastLevel: 0,
            colorVariance: 0,
            qualityScore: 0
          });
        };
        
        img.src = imageData;
      });
    } catch (error) {
      console.error('图像质量分析失败:', error);
      return {
        isEmpty: true,
        strokeDensity: 0,
        contrastLevel: 0,
        colorVariance: 0,
        qualityScore: 0
      };
    }
  }

  /**
   * 渐进式图像压缩
   */
  static async compressImageProgressive(
    imageData: string,
    options: CompressionOptions = {}
  ): Promise<OptimizationResult> {
    const startTime = performance.now();
    const originalSize = this.getImageSize(imageData);
    
    const {
      maxWidth = 512,
      maxHeight = 512,
      quality = 0.8,
      format = await this.supportsWebP() ? 'webp' : 'jpeg',
      progressive = true
    } = options;

    try {
      const { canvas, ctx } = this.getOffscreenCanvas();
      const img = new Image();
      
      return await new Promise<OptimizationResult>((resolve, reject) => {
        img.onload = () => {
          // 计算最优尺寸
          const { width: newWidth, height: newHeight } = this.calculateOptimalSize(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // 高质量缩放
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // 清除画布
          ctx.clearRect(0, 0, newWidth, newHeight);
          
          // 绘制图像
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // 渐进式压缩
          let finalImageData: string;
          let finalQuality = quality;
          
          if (progressive) {
            // 尝试不同质量级别，找到最优平衡点
            const targetSize = API_CONFIG.MAX_IMAGE_SIZE;
            finalImageData = this.findOptimalCompression(canvas, format, quality, targetSize);
          } else {
            finalImageData = canvas.toDataURL(`image/${format}`, quality);
          }
          
          const compressedSize = this.getImageSize(finalImageData);
          const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;
          
          const result: OptimizationResult = {
            imageData: finalImageData,
            originalSize,
            compressedSize,
            compressionRatio,
            format,
            quality: finalQuality,
            processingTime: performance.now() - startTime
          };
          
          console.log('图像压缩完成:', {
            原始大小: `${(originalSize / 1024).toFixed(1)}KB`,
            压缩后大小: `${(compressedSize / 1024).toFixed(1)}KB`,
            压缩比: `${(compressionRatio * 100).toFixed(1)}%`,
            格式: format,
            处理时间: `${result.processingTime.toFixed(2)}ms`
          });
          
          resolve(result);
        };
        
        img.onerror = () => {
          reject(new Error('图像加载失败'));
        };
        
        img.src = imageData;
      });
    } catch (error) {
      console.error('图像压缩失败:', error);
      throw error;
    }
  }

  /**
   * 寻找最优压缩参数
   */
  private static findOptimalCompression(
    canvas: HTMLCanvasElement,
    format: string,
    initialQuality: number,
    targetSize: number
  ): string {
    let quality = initialQuality;
    let imageData = canvas.toDataURL(`image/${format}`, quality);
    let currentSize = this.getImageSize(imageData);
    
    // 如果初始大小就符合要求，直接返回
    if (currentSize <= targetSize) {
      return imageData;
    }
    
    // 二分查找最优质量
    let minQuality = 0.1;
    let maxQuality = quality;
    let bestImageData = imageData;
    
    for (let i = 0; i < 8; i++) { // 最多8次迭代
      quality = (minQuality + maxQuality) / 2;
      imageData = canvas.toDataURL(`image/${format}`, quality);
      currentSize = this.getImageSize(imageData);
      
      if (currentSize <= targetSize) {
        bestImageData = imageData;
        minQuality = quality;
      } else {
        maxQuality = quality;
      }
      
      // 如果已经很接近目标大小，提前退出
      if (Math.abs(currentSize - targetSize) / targetSize < 0.1) {
        break;
      }
    }
    
    return bestImageData;
  }

  /**
   * 计算最优尺寸
   */
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    // 按比例缩放
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
    
    // 确保尺寸为整数
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  /**
   * 获取图像大小（字节）
   */
  private static getImageSize(imageData: string): number {
    // 移除data URL前缀
    const base64Data = imageData.split(',')[1] || imageData;
    
    // 计算base64编码的实际字节大小
    const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
    return Math.floor((base64Data.length * 3) / 4) - padding;
  }

  /**
   * 验证图像格式
   */
  static validateImageFormat(imageData: string): boolean {
    if (!imageData || typeof imageData !== 'string') {
      return false;
    }
    
    // 检查是否为有效的data URL
    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/i;
    return dataUrlPattern.test(imageData);
  }

  /**
   * 图像预处理（增强对比度、去噪等）
   */
  static async preprocessImage(imageData: string): Promise<string> {
    try {
      const { canvas, ctx } = this.getOffscreenCanvas();
      const img = new Image();
      
      return await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 绘制原图
          ctx.drawImage(img, 0, 0);
          
          // 获取图像数据
          const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageDataObj.data;
          
          // 增强对比度
          this.enhanceContrast(pixels, 1.2);
          
          // 锐化处理
          this.applySharpen(imageDataObj);
          
          // 将处理后的数据写回画布
          ctx.putImageData(imageDataObj, 0, 0);
          
          // 返回处理后的图像
          resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => reject(new Error('图像预处理失败'));
        img.src = imageData;
      });
    } catch (error) {
      console.error('图像预处理失败:', error);
      return imageData; // 返回原图
    }
  }

  /**
   * 增强对比度
   */
  private static enhanceContrast(pixels: Uint8ClampedArray, factor: number): void {
    for (let i = 0; i < pixels.length; i += 4) {
      // 跳过透明像素
      if (pixels[i + 3] === 0) continue;
      
      // 增强RGB通道
      pixels[i] = Math.min(255, Math.max(0, (pixels[i] - 128) * factor + 128));
      pixels[i + 1] = Math.min(255, Math.max(0, (pixels[i + 1] - 128) * factor + 128));
      pixels[i + 2] = Math.min(255, Math.max(0, (pixels[i + 2] - 128) * factor + 128));
    }
  }

  /**
   * 应用锐化滤镜
   */
  private static applySharpen(imageData: ImageData): void {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(pixels);
    
    // 锐化核
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB通道
          let sum = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              sum += pixels[pixelIndex] * kernel[kernelIndex];
            }
          }
          
          const outputIndex = (y * width + x) * 4 + c;
          output[outputIndex] = Math.min(255, Math.max(0, sum));
        }
      }
    }
    
    // 复制处理后的数据
    for (let i = 0; i < pixels.length; i++) {
      pixels[i] = output[i];
    }
  }

  /**
   * 清理资源
   */
  static cleanup(): void {
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
      this.ctx = null;
    }
  }
}

// 导出兼容性函数（保持向后兼容）
export const ImageOptimizerCompat = {
  compressImage: async (imageData: string) => {
    const result = await AdvancedImageOptimizer.compressImageProgressive(imageData, { quality: 0.8 });
    return result.imageData;
  },
  
  validateImageFormat: AdvancedImageOptimizer.validateImageFormat,
  
  getImageInfo: (imageData: string) => ({
    sizeInBytes: AdvancedImageOptimizer['getImageSize'](imageData),
    format: imageData.split(';')[0]?.split('/')[1] || 'unknown'
  })
};
