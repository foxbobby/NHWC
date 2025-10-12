'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/lib/constants';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768
  });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop,
        width,
        height
      });
    };

    // 初始化
    updateSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  return state;
}

// 媒体查询钩子
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// 设备类型检测钩子
export function useDeviceType() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  
  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice
  };
}