'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// 扩展的屏幕尺寸检测
interface ScreenInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIPad: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  screenSize: 'mobile' | 'tablet' | 'ipad' | 'desktop' | 'large-desktop';
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
}

// 自定义hook用于多屏幕检测
function useMultiScreen(): ScreenInfo {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    isMobile: false,
    isTablet: false,
    isIPad: false,
    isDesktop: true,
    isLargeDesktop: false,
    screenSize: 'desktop',
    orientation: 'landscape',
    width: 1024,
    height: 768
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      // 检测iPad
      const isIPad = /iPad/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                    (width >= 768 && width <= 1024 && 'ontouchstart' in window);
      
      // 屏幕尺寸分类
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024 && !isIPad;
      const isDesktop = width >= 1024 && width < 1440;
      const isLargeDesktop = width >= 1440;
      
      let screenSize: ScreenInfo['screenSize'] = 'desktop';
      if (isMobile) screenSize = 'mobile';
      else if (isIPad) screenSize = 'ipad';
      else if (isTablet) screenSize = 'tablet';
      else if (isLargeDesktop) screenSize = 'large-desktop';
      
      setScreenInfo({
        isMobile,
        isTablet,
        isIPad,
        isDesktop,
        isLargeDesktop,
        screenSize,
        orientation,
        width,
        height
      });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  return screenInfo;
}

interface MultiScreenLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
}

export default function MultiScreenLayout({
  children,
  showHeader = true,
  className
}: MultiScreenLayoutProps) {
  const screenInfo = useMultiScreen();

  return (
    <div className={cn(
      'min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50',
      className
    )}>
      {showHeader && <EnhancedHeader screenInfo={screenInfo} />}
      
      <main className={cn(
        'flex-1 flex flex-col',
        // iPad专用样式
        screenInfo.isIPad && [
          'px-6 py-4',
          screenInfo.orientation === 'landscape' ? 'max-w-none' : 'max-w-4xl mx-auto'
        ],
        // 移动端样式
        screenInfo.isMobile && 'px-4 py-3',
        // 平板样式
        screenInfo.isTablet && 'px-6 py-5',
        // 桌面端样式
        screenInfo.isDesktop && 'px-8 py-6 max-w-7xl mx-auto',
        // 大屏幕样式
        screenInfo.isLargeDesktop && 'px-12 py-8 max-w-8xl mx-auto'
      )}>
        {children}
      </main>
    </div>
  );
}

// 增强的头部组件
function EnhancedHeader({ screenInfo }: { screenInfo: ScreenInfo }) {
  return (
    <header className={cn(
      'bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm',
      'sticky top-0 z-40'
    )}>
      <div className={cn(
        'flex items-center justify-between',
        // iPad专用头部样式
        screenInfo.isIPad && 'px-6 py-4',
        screenInfo.isMobile && 'px-4 py-3',
        screenInfo.isTablet && 'px-6 py-4',
        screenInfo.isDesktop && 'px-8 py-4 max-w-7xl mx-auto',
        screenInfo.isLargeDesktop && 'px-12 py-5 max-w-8xl mx-auto'
      )}>
        {/* Logo区域 */}
        <div className="flex items-center space-x-3">
          <div className={cn(
            'bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold',
            screenInfo.isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-lg'
          )}>
            🦊
          </div>
          <div>
            <h1 className={cn(
              'font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
              screenInfo.isMobile ? 'text-lg' : 'text-xl'
            )}>
              FoxAI 你画我猜
            </h1>
            {!screenInfo.isMobile && (
              <p className="text-xs text-gray-500">AI 智能绘画识别游戏</p>
            )}
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center space-x-2">
          {/* 屏幕信息指示器（开发模式） */}
          {process.env.NODE_ENV === 'development' && (
            <div className={cn(
              'px-2 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600',
              screenInfo.isMobile && 'hidden'
            )}>
              {screenInfo.screenSize} {screenInfo.orientation}
            </div>
          )}
          
          {/* 设置按钮 */}
          <button className={cn(
            'p-2 rounded-lg hover:bg-gray-100 transition-colors',
            screenInfo.isMobile ? 'text-sm' : 'text-base'
          )}>
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
}

// iPad专用游戏布局
interface IPadGameLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export function IPadGameLayout({ children, sidebar, className }: IPadGameLayoutProps) {
  const screenInfo = useMultiScreen();

  if (!screenInfo.isIPad) {
    return <EnhancedGameLayout children={children} sidebar={sidebar} className={className} />;
  }

  return (
    <MultiScreenLayout showHeader={false} className={className}>
      <div className={cn(
        'flex h-full gap-6',
        // iPad横屏：左右布局
        screenInfo.orientation === 'landscape' ? 'flex-row' : 'flex-col'
      )}>
        {/* 主内容区域 */}
        <div className={cn(
          'flex-1 flex flex-col',
          screenInfo.orientation === 'landscape' ? 'min-w-0' : 'order-2'
        )}>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 h-full">
            {children}
          </div>
        </div>

        {/* 侧边栏 */}
        {sidebar && (
          <div className={cn(
            'flex-shrink-0',
            screenInfo.orientation === 'landscape' 
              ? 'w-80' // 横屏时固定宽度
              : 'order-1 h-auto' // 竖屏时在顶部
          )}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 h-full">
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </MultiScreenLayout>
  );
}

// 增强的通用游戏布局
export function EnhancedGameLayout({ children, sidebar, className }: IPadGameLayoutProps) {
  const screenInfo = useMultiScreen();

  return (
    <MultiScreenLayout showHeader={false} className={className}>
      <div className={cn(
        'flex h-full',
        // 响应式布局策略
        screenInfo.isMobile ? 'flex-col space-y-4' :
        screenInfo.isTablet ? 'flex-col space-y-6' :
        'flex-row space-x-8'
      )}>
        {/* 主内容区域 */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          screenInfo.isMobile && 'order-2',
          screenInfo.isTablet && 'order-2'
        )}>
          <div className={cn(
            'bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 h-full',
            screenInfo.isMobile ? 'p-4' : 'p-6'
          )}>
            {children}
          </div>
        </div>

        {/* 侧边栏 */}
        {sidebar && (
          <div className={cn(
            'flex-shrink-0',
            screenInfo.isMobile ? 'order-1' : '',
            screenInfo.isTablet ? 'order-1 w-full' : 'w-80'
          )}>
            <div className={cn(
              'bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 h-full',
              screenInfo.isMobile ? 'p-3' : 'p-4'
            )}>
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </MultiScreenLayout>
  );
}

// 美化的欢迎页面布局
interface WelcomeLayoutProps {
  children: ReactNode;
  className?: string;
}

export function WelcomeLayout({ children, className }: WelcomeLayoutProps) {
  const screenInfo = useMultiScreen();

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
      className
    )}>
      {/* 装饰性背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl" />
      </div>

      <EnhancedHeader screenInfo={screenInfo} />
      
      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className={cn(
          'w-full max-w-4xl mx-auto',
          screenInfo.isMobile ? 'px-4' : 'px-8'
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}

// 导出hook供其他组件使用
export { useMultiScreen };
