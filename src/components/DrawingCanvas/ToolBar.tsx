'use client';

import React from 'react';
import { BrushSettings } from '@/types/canvas';
import { BRUSH_CONFIG, BRAND_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import Button from '@/components/Common/Button';

interface ToolBarProps {
  brushSettings: BrushSettings;
  onBrushChange: (settings: Partial<BrushSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ToolBar({
  brushSettings,
  onBrushChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  disabled = false,
  className
}: ToolBarProps) {
  const { isMobile } = useResponsive();

  // 画笔大小选项
  const brushSizes = [2, 4, 6, 8, 12, 16];
  
  // 颜色选项
  const colors = BRUSH_CONFIG.COLORS;

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-4',
      isMobile ? 'space-y-4' : 'space-y-6',
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      {/* 画笔大小 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          画笔大小
        </label>
        <div className={cn(
          'flex gap-2',
          isMobile ? 'flex-wrap' : 'flex-row'
        )}>
          {brushSizes.map((size) => (
            <button
              key={size}
              onClick={() => onBrushChange({ size })}
              className={cn(
                'w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all touch-target',
                brushSettings.size === size
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              style={{
                borderColor: brushSettings.size === size ? BRAND_COLORS.primary : undefined
              }}
              disabled={disabled}
            >
              <div
                className="rounded-full bg-gray-800"
                style={{
                  width: `${Math.min(size, 8)}px`,
                  height: `${Math.min(size, 8)}px`
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 颜色选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          画笔颜色
        </label>
        <div className={cn(
          'grid gap-2',
          isMobile ? 'grid-cols-4' : 'grid-cols-4'
        )}>
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onBrushChange({ color })}
              className={cn(
                'w-10 h-10 rounded-lg border-2 transition-all touch-target',
                brushSettings.color === color
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              )}
              style={{ backgroundColor: color }}
              disabled={disabled}
            >
              {brushSettings.color === color && (
                <div className="w-full h-full rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          操作
        </label>
        <div className={cn(
          'flex gap-2',
          isMobile ? 'flex-col' : 'flex-row'
        )}>
          <Button
            variant="outline"
            size={isMobile ? 'md' : 'sm'}
            onClick={onUndo}
            disabled={!canUndo || disabled}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            撤销
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? 'md' : 'sm'}
            onClick={onRedo}
            disabled={!canRedo || disabled}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
            重做
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? 'md' : 'sm'}
            onClick={onClear}
            disabled={disabled}
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空
          </Button>
        </div>
      </div>

      {/* 画笔预览 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          预览
        </label>
        <div className="h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
          <div
            className="rounded-full"
            style={{
              width: `${brushSettings.size}px`,
              height: `${brushSettings.size}px`,
              backgroundColor: brushSettings.color,
              opacity: brushSettings.opacity
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 紧凑版工具栏（移动端）
interface CompactToolBarProps {
  brushSettings: BrushSettings;
  onBrushChange: (settings: Partial<BrushSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
  className?: string;
}

export function CompactToolBar({
  brushSettings,
  onBrushChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  disabled = false,
  className
}: CompactToolBarProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showSizePicker, setShowSizePicker] = React.useState(false);

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-2',
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      <div className="flex items-center justify-between gap-2">
        {/* 画笔设置 */}
        <div className="flex items-center gap-2">
          {/* 颜色选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded-md border-2 border-gray-300 touch-target"
              style={{ backgroundColor: brushSettings.color }}
              disabled={disabled}
            />
            {showColorPicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
                <div className="grid grid-cols-4 gap-1">
                  {BRUSH_CONFIG.COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onBrushChange({ color });
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-gray-300 touch-target"
                      style={{ backgroundColor: color }}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 大小选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowSizePicker(!showSizePicker)}
              className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center touch-target"
              disabled={disabled}
            >
              <div
                className="rounded-full bg-gray-800"
                style={{
                  width: `${Math.min(brushSettings.size / 2, 6)}px`,
                  height: `${Math.min(brushSettings.size / 2, 6)}px`
                }}
              />
            </button>
            {showSizePicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
                <div className="flex gap-1">
                  {[2, 4, 6, 8, 12].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onBrushChange({ size });
                        setShowSizePicker(false);
                      }}
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center touch-target"
                      disabled={disabled}
                    >
                      <div
                        className="rounded-full bg-gray-800"
                        style={{
                          width: `${Math.min(size / 2, 6)}px`,
                          height: `${Math.min(size / 2, 6)}px`
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo || disabled}
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center disabled:opacity-50 touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo || disabled}
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center disabled:opacity-50 touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          
          <button
            onClick={onClear}
            disabled={disabled}
            className="w-8 h-8 rounded-md border border-red-300 text-red-600 flex items-center justify-center hover:bg-red-50 touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}