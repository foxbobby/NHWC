'use client';

import React, { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import Header from './Header';
import Footer from './Footer';

interface ResponsiveLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export default function ResponsiveLayout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  className = ''
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Header />}
      
      <main className="flex-1 flex flex-col">
        <div className={`
          flex-1 
          ${isMobile ? 'px-4 py-4' : isTablet ? 'px-6 py-6' : 'px-8 py-8'}
          ${isMobile ? 'max-w-full' : 'max-w-7xl mx-auto w-full'}
        `}>
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}

// 游戏专用布局
interface GameLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export function GameLayout({ children, sidebar, className = '' }: GameLayoutProps) {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return (
      <ResponsiveLayout showFooter={false} className={className}>
        <div className="flex flex-col space-y-4 h-full">
          <div className="flex-1">
            {children}
          </div>
          {sidebar && (
            <div className="flex-shrink-0">
              {sidebar}
            </div>
          )}
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout showFooter={false} className={className}>
      <div className={`
        flex 
        ${isTablet ? 'flex-col space-y-6' : 'flex-row space-x-8'} 
        h-full
      `}>
        <div className={`
          ${isTablet ? 'order-1' : 'flex-1'}
          ${isTablet ? 'w-full' : ''}
        `}>
          {children}
        </div>
        {sidebar && (
          <div className={`
            ${isTablet ? 'order-2 w-full' : 'w-80 flex-shrink-0'}
          `}>
            {sidebar}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}