'use client';

import React, { useState } from 'react';
import { useMultiScreen } from '@/components/Layout/MultiScreenLayout';
import EnhancedHomePage from '@/components/Home/EnhancedHomePage';
import IPadOptimizedGamePage from '@/components/Game/IPadOptimizedGamePage';
import GamePage from '@/components/Game/GamePage';
import type { Viewport } from 'next';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const screenInfo = useMultiScreen();

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleBackToHome = () => {
    setGameStarted(false);
  };

  if (!gameStarted) {
    return <EnhancedHomePage onStartGame={handleStartGame} />;
  }

  // 根据设备类型选择最适合的游戏页面
  if (screenInfo.isIPad) {
    return <IPadOptimizedGamePage />;
  }

  return <GamePage />;
}

export const metadata = {
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