'use client';

import React from 'react';
import { BRAND_COLORS } from '@/lib/constants';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer 
      className={`bg-gray-50 border-t border-gray-200 ${className}`}
      style={{ 
        backgroundColor: BRAND_COLORS.background,
        borderTopColor: BRAND_COLORS.neutral + '20'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div 
              className="text-lg font-semibold"
              style={{ color: BRAND_COLORS.primary }}
            >
              🦊 FoxAI
            </div>
            <div 
              className="ml-2 text-sm"
              style={{ color: BRAND_COLORS.text.secondary }}
            >
              让AI猜猜你的画作
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <a 
              href="#" 
              className="hover:underline transition-colors text-gray-600 hover:text-blue-600"
            >
              关于我们
            </a>
            <a 
              href="#" 
              className="hover:underline transition-colors text-gray-600 hover:text-blue-600"
            >
              隐私政策
            </a>
            <a 
              href="#" 
              className="hover:underline transition-colors text-gray-600 hover:text-blue-600"
            >
              联系我们
            </a>
          </div>
        </div>
        
        <div 
          className="mt-4 pt-4 border-t text-center text-xs"
          style={{ 
            borderTopColor: BRAND_COLORS.neutral + '20',
            color: BRAND_COLORS.text.light
          }}
        >
          © 2025 FoxAI. 保留所有权利。
        </div>
      </div>
    </footer>
  );
}