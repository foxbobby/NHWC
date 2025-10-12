'use client';

import React from 'react';
import { BRAND_COLORS } from '@/lib/constants';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  return (
    <header 
      className={`bg-white shadow-sm border-b border-gray-200 ${className}`}
      style={{ borderBottomColor: BRAND_COLORS.neutral + '20' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="text-2xl font-bold"
              style={{ color: BRAND_COLORS.primary }}
            >
              🦊 FoxAI
            </div>
            <div className="ml-2 text-sm text-gray-600 hidden sm:block">
              你画我猜
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              游戏规则
            </button>
            <button 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              统计
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}