'use client';

import React, { useState } from 'react';
import { useMultiScreen } from '@/components/Layout/MultiScreenLayout';
import EnhancedHomePage from '@/components/Home/EnhancedHomePage';
import IPadOptimizedGamePage from '@/components/Game/IPadOptimizedGamePage';
import GamePage from '@/components/Game/GamePage';

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