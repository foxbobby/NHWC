/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // iPad专用断点
      screens: {
        'ipad': {'raw': '(min-device-width: 768px) and (max-device-width: 1024px)'},
        'ipad-portrait': {'raw': '(min-device-width: 768px) and (max-device-width: 1024px) and (orientation: portrait)'},
        'ipad-landscape': {'raw': '(min-device-width: 768px) and (max-device-width: 1024px) and (orientation: landscape)'},
        'ipad-pro': {'raw': '(min-device-width: 1024px) and (max-device-width: 1366px)'},
      },
      
      // FoxAI品牌色彩
      colors: {
        foxai: {
          primary: '#2563EB',
          secondary: '#F97316',
          neutral: '#64748B',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          text: {
            primary: '#1E293B',
            secondary: '#64748B',
            light: '#94A3B8',
          }
        }
      },
      
      // iPad优化的字体大小
      fontSize: {
        'ipad-xs': ['12px', '16px'],
        'ipad-sm': ['14px', '20px'],
        'ipad-base': ['16px', '24px'],
        'ipad-lg': ['18px', '28px'],
        'ipad-xl': ['20px', '32px'],
        'ipad-2xl': ['24px', '36px'],
        'ipad-3xl': ['30px', '40px'],
        'ipad-4xl': ['36px', '48px'],
        'ipad-5xl': ['48px', '56px'],
      },
      
      // iPad优化的间距
      spacing: {
        'ipad-safe': 'env(safe-area-inset-top)',
        'ipad-safe-bottom': 'env(safe-area-inset-bottom)',
        'ipad-safe-left': 'env(safe-area-inset-left)',
        'ipad-safe-right': 'env(safe-area-inset-right)',
      },
      
      // iPad优化的圆角
      borderRadius: {
        'ipad': '16px',
        'ipad-lg': '24px',
        'ipad-xl': '32px',
      },
      
      // iPad优化的阴影
      boxShadow: {
        'ipad': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'ipad-lg': '0 20px 40px rgba(0, 0, 0, 0.1)',
        'enhanced': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      
      // 毛玻璃效果
      backdropBlur: {
        'glass': '20px',
      },
      
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'gradient-shift': 'gradientShift 15s ease infinite',
        'touch-feedback': 'touchFeedback 0.1s ease',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        touchFeedback: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      
      // 渐变背景
      backgroundImage: {
        'gradient-foxai': 'linear-gradient(135deg, #2563EB, #F97316)',
        'gradient-ipad': 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 25%, rgba(236, 72, 153, 0.05) 50%, rgba(245, 158, 11, 0.05) 75%, rgba(16, 185, 129, 0.05) 100%)',
        'gradient-welcome': 'linear-gradient(135deg, #F0F9FF 0%, #F3E8FF 25%, #FDF2F8 50%, #FEF3C7 75%, #F0FDF4 100%)',
      },
      
      // 触控目标最小尺寸
      minWidth: {
        'touch': '44px',
        'ipad-touch': '48px',
      },
      minHeight: {
        'touch': '44px',
        'ipad-touch': '48px',
      },
    },
  },
  plugins: [
    // iPad专用工具类插件
    function({ addUtilities, theme }) {
      const newUtilities = {
        // 触控优化
        '.touch-optimized': {
          '-webkit-touch-callout': 'none',
          '-webkit-user-select': 'none',
          'user-select': 'none',
          '-webkit-tap-highlight-color': 'transparent',
        },
        
        // Canvas优化
        '.canvas-optimized': {
          'touch-action': 'none',
          '-webkit-touch-callout': 'none',
          '-webkit-user-select': 'none',
          'user-select': 'none',
          'image-rendering': '-webkit-optimize-contrast',
        },
        
        // 毛玻璃效果
        '.glass-morphism': {
          'background': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(20px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        
        // GPU加速
        '.gpu-accelerated': {
          'transform': 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)',
          'will-change': 'transform',
        },
        
        // 安全区域
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        
        // 触控反馈
        '.touch-feedback:active': {
          'transform': 'scale(0.95)',
          'transition': 'transform 0.1s ease',
        },
        
        // iPad专用布局
        '.ipad-layout': {
          '@media (min-device-width: 768px) and (max-device-width: 1024px)': {
            'padding': '24px',
            'border-radius': '16px',
          },
        },
        
        // 高DPI优化
        '.high-dpi-optimized': {
          '@media (-webkit-min-device-pixel-ratio: 2)': {
            '-webkit-font-smoothing': 'antialiased',
            '-moz-osx-font-smoothing': 'grayscale',
          },
        },
      }
      
      addUtilities(newUtilities)
    },
    
    // 响应式变体插件
    function({ addVariant }) {
      addVariant('ipad', '@media (min-device-width: 768px) and (max-device-width: 1024px)')
      addVariant('ipad-portrait', '@media (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: portrait)')
      addVariant('ipad-landscape', '@media (min-device-width: 768px) and (max-device-width: 1024px) and (orientation: landscape)')
      addVariant('ipad-pro', '@media (min-device-width: 1024px) and (max-device-width: 1366px)')
      addVariant('touch', '@media (pointer: coarse)')
      addVariant('stylus', '@media (pointer: fine) and (hover: none)')
    }
  ],
}
