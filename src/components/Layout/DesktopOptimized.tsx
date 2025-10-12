'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface DesktopOptimizedProps {
  children: ReactNode;
  className?: string;
}

export default function DesktopOptimized({ children, className }: DesktopOptimizedProps) {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div className={cn('desktop-optimized', className)}>
      {children}
    </div>
  );
}

// 桌面端网格布局
interface DesktopGridLayoutProps {
  main: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function DesktopGridLayout({ main, sidebar, className }: DesktopGridLayoutProps) {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div>{main}</div>
        <div>{sidebar}</div>
      </div>
    );
  }

  return (
    <div className={cn('desktop-grid', className)}>
      <div className="desktop-main">
        {main}
      </div>
      <div className="desktop-sidebar">
        {sidebar}
      </div>
    </div>
  );
}

// 桌面端工具栏
interface DesktopToolbarProps {
  children: ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function DesktopToolbar({ 
  children, 
  className, 
  position = 'top' 
}: DesktopToolbarProps) {
  const { isDesktop } = useResponsive();

  if (!isDesktop) return null;

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
    left: 'top-0 bottom-0 left-0',
    right: 'top-0 bottom-0 right-0'
  };

  return (
    <div className={cn(
      'fixed z-40 bg-white border shadow-sm',
      positionClasses[position],
      position === 'top' || position === 'bottom' ? 'border-x-0' : 'border-y-0',
      className
    )}>
      {children}
    </div>
  );
}

// 桌面端快捷键支持
interface KeyboardShortcutsProps {
  shortcuts: Record<string, () => void>;
  children: ReactNode;
}

export function KeyboardShortcuts({ shortcuts, children }: KeyboardShortcutsProps) {
  const { isDesktop } = useResponsive();

  useEffect(() => {
    if (!isDesktop) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrlKey = event.ctrlKey || event.metaKey;
      const altKey = event.altKey;
      const shiftKey = event.shiftKey;

      // 构建快捷键字符串
      let shortcut = '';
      if (ctrlKey) shortcut += 'ctrl+';
      if (altKey) shortcut += 'alt+';
      if (shiftKey) shortcut += 'shift+';
      shortcut += key;

      // 执行对应的快捷键操作
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isDesktop]);

  return <>{children}</>;
}

// 桌面端上下文菜单
interface ContextMenuProps {
  children: ReactNode;
  menuItems: Array<{
    label: string;
    action: () => void;
    shortcut?: string;
    disabled?: boolean;
  }>;
  className?: string;
}

export function ContextMenu({ children, menuItems, className }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { isDesktop } = useResponsive();

  const handleContextMenu = (event: React.MouseEvent) => {
    if (!isDesktop) return;
    
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  const handleClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isOpen]);

  return (
    <>
      <div onContextMenu={handleContextMenu} className={className}>
        {children}
      </div>
      
      {isOpen && isDesktop && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48"
          style={{ left: position.x, top: position.y }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                }
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between',
                item.disabled && 'text-gray-400 cursor-not-allowed'
              )}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-500 ml-4">
                  {item.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// 桌面端拖拽支持
interface DraggableProps {
  children: ReactNode;
  onDragStart?: (event: React.DragEvent) => void;
  onDragEnd?: (event: React.DragEvent) => void;
  dragData?: unknown;
  className?: string;
}

export function Draggable({ 
  children, 
  onDragStart, 
  onDragEnd, 
  dragData, 
  className 
}: DraggableProps) {
  const { isDesktop } = useResponsive();

  const handleDragStart = (event: React.DragEvent) => {
    if (dragData) {
      event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    }
    onDragStart?.(event);
  };

  if (!isDesktop) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn('cursor-move', className)}
    >
      {children}
    </div>
  );
}

// 桌面端放置区域
interface DropZoneProps {
  children: ReactNode;
  onDrop?: (data: unknown, event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  className?: string;
  activeClassName?: string;
}

export function DropZone({ 
  children, 
  onDrop, 
  onDragOver, 
  className, 
  activeClassName 
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { isDesktop } = useResponsive();

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
    onDragOver?.(event);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      onDrop?.(data, event);
    } catch (error) {
      console.warn('Failed to parse drag data:', error);
    }
  };

  if (!isDesktop) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        className,
        isDragOver && activeClassName
      )}
    >
      {children}
    </div>
  );
}

// 桌面端窗口管理
interface WindowManagerProps {
  children: ReactNode;
  title: string;
  width?: number;
  height?: number;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
}

export function WindowManager({ 
  children, 
  title, 
  width = 800, 
  height = 600,
  resizable = true,
  minimizable = true,
  maximizable = true
}: WindowManagerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width, height });
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: isMaximized ? '100vw' : size.width,
        height: isMaximized ? '100vh' : size.height,
        zIndex: 1000
      }}
    >
      {/* 窗口标题栏 */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          {minimizable && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600"
            />
          )}
          {maximizable && (
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600"
            />
          )}
          <button className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600" />
        </div>
      </div>
      
      {/* 窗口内容 */}
      {!isMinimized && (
        <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
          {children}
        </div>
      )}
    </div>
  );
}