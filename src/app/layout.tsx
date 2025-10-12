import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/Common/ErrorBoundary';
import { PerformanceMonitor } from '@/services/performanceOptimizer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoxAI 你画我猜 - AI 智能绘画识别游戏',
  description: '在线绘画游戏，让 AI 猜测你的画作。支持桌面端和移动端，流畅的绘图体验，智能的 AI 识别。',
  keywords: '绘画游戏, AI识别, 你画我猜, FoxAI, 在线游戏',
  authors: [{ name: 'FoxAI Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FoxAI 你画我猜',
    description: '在线绘画游戏，让 AI 猜测你的画作',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'FoxAI 你画我猜',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoxAI 你画我猜',
    description: '在线绘画游戏，让 AI 猜测你的画作',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // 允许iPad用户放大
  userScalable: true, // 允许缩放以便更好的绘画体验
  themeColor: '#2563EB',
  viewportFit: 'cover', // 支持全屏显示
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}