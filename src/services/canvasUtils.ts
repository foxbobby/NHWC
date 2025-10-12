import { Point, DrawingStroke, CanvasData, BrushSettings } from '@/types/canvas';
import { CANVAS_CONFIG, BRUSH_CONFIG } from '@/lib/constants';

export class CanvasUtils {
  // 获取画布上的点坐标
  static getCanvasPoint(
    event: MouseEvent | TouchEvent,
    canvas: HTMLCanvasElement
  ): Point {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // 绘制线条
  static drawLine(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    brushSettings: BrushSettings
  ): void {
    // 直接设置绘制属性，避免 save/restore 的性能开销
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSettings.size;
    ctx.strokeStyle = brushSettings.color;
    ctx.globalAlpha = brushSettings.opacity;
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  // 绘制笔画
  static drawStroke(
    ctx: CanvasRenderingContext2D,
    stroke: DrawingStroke
  ): void {
    if (stroke.points.length < 2) return;

    ctx.save();
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.color;
    
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    ctx.stroke();
    ctx.restore();
  }

  // 重绘所有笔画
  static redrawCanvas(
    ctx: CanvasRenderingContext2D,
    strokes: DrawingStroke[],
    backgroundColor: string = CANVAS_CONFIG.BACKGROUND_COLOR
  ): void {
    // 不在这里清空画布，因为调用方已经处理了
    
    // 重绘所有笔画
    strokes.forEach(stroke => {
      if (stroke.points && stroke.points.length > 0) {
        this.drawStroke(ctx, stroke);
      }
    });
  }

  // 将画布转换为图像数据
  static canvasToImageData(canvas: HTMLCanvasElement, quality: number = 0.8): string {
    return canvas.toDataURL('image/jpeg', quality);
  }

  // 压缩画布图像
  static compressCanvasImage(
    canvas: HTMLCanvasElement,
    maxWidth: number = 512,
    maxHeight: number = 512,
    quality: number = 0.8
  ): string {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // 计算缩放比例
    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height, 1);
    
    tempCanvas.width = Math.floor(canvas.width * scale);
    tempCanvas.height = Math.floor(canvas.height * scale);
    
    // 设置高质量缩放
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    
    // 绘制缩放后的图像
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    
    return tempCanvas.toDataURL('image/jpeg', quality);
  }

  // 智能压缩图像（根据内容复杂度调整质量）
  static smartCompressImage(
    canvas: HTMLCanvasElement,
    targetSizeKB: number = 100
  ): string {
    let quality = 0.9;
    let compressed = this.compressCanvasImage(canvas, 512, 512, quality);
    
    // 估算文件大小（base64字符数 * 0.75 / 1024）
    const getSizeKB = (dataUrl: string) => {
      const base64 = dataUrl.split(',')[1];
      return (base64.length * 0.75) / 1024;
    };
    
    // 二分查找最佳质量
    let minQuality = 0.1;
    let maxQuality = 0.9;
    let attempts = 0;
    const maxAttempts = 8;
    
    while (attempts < maxAttempts && Math.abs(getSizeKB(compressed) - targetSizeKB) > 10) {
      const currentSize = getSizeKB(compressed);
      
      if (currentSize > targetSizeKB) {
        maxQuality = quality;
        quality = (minQuality + quality) / 2;
      } else {
        minQuality = quality;
        quality = (quality + maxQuality) / 2;
      }
      
      compressed = this.compressCanvasImage(canvas, 512, 512, quality);
      attempts++;
    }
    
    return compressed;
  }

  // 渐进式图像加载
  static createProgressiveImage(
    canvas: HTMLCanvasElement
  ): { thumbnail: string; fullSize: string } {
    // 创建缩略图（低质量，小尺寸）
    const thumbnail = this.compressCanvasImage(canvas, 128, 128, 0.3);
    
    // 创建全尺寸图像（高质量）
    const fullSize = this.compressCanvasImage(canvas, 512, 512, 0.8);
    
    return { thumbnail, fullSize };
  }

  // 创建画布数据对象
  static createCanvasData(
    canvas: HTMLCanvasElement,
    strokes: DrawingStroke[]
  ): CanvasData {
    return {
      imageData: this.compressCanvasImage(canvas),
      width: canvas.width,
      height: canvas.height,
      strokes: [...strokes],
      timestamp: new Date()
    };
  }

  // 计算两点之间的距离
  static getDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 平滑路径点
  static smoothPath(points: Point[], smoothing: number = 0.5): Point[] {
    if (points.length < 3) return points;

    const smoothedPoints: Point[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      const smoothedX = current.x + (prev.x + next.x - 2 * current.x) * smoothing;
      const smoothedY = current.y + (prev.y + next.y - 2 * current.y) * smoothing;

      smoothedPoints.push({ x: smoothedX, y: smoothedY });
    }

    smoothedPoints.push(points[points.length - 1]);
    return smoothedPoints;
  }

  // 检查画布是否为空
  static isCanvasEmpty(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 检查是否所有像素都是透明或背景色
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3];
      if (alpha !== 0) {
        // 检查是否为背景色
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        // 如果不是白色背景，说明有绘制内容
        if (r !== 255 || g !== 255 || b !== 255) {
          return false;
        }
      }
    }
    
    return true;
  }

  // 获取画布边界框
  static getCanvasBounds(strokes: DrawingStroke[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null {
    if (strokes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return { minX, minY, maxX, maxY };
  }

  // 调整画布大小
  static resizeCanvas(
    canvas: HTMLCanvasElement,
    newWidth: number,
    newHeight: number,
    strokes: DrawingStroke[]
  ): void {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    // 保存当前画布内容
    const imageData = canvas.toDataURL();
    
    // 调整画布大小
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const ctx = canvas.getContext('2d')!;
    
    // 设置背景色
    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, newWidth, newHeight);
    
    // 计算缩放比例
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;
    
    // 重绘笔画（按比例缩放）
    const scaledStrokes = strokes.map(stroke => ({
      ...stroke,
      points: stroke.points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
      })),
      width: stroke.width * Math.min(scaleX, scaleY)
    }));
    
    this.redrawCanvas(ctx, scaledStrokes);
  }
}