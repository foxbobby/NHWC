'use client';

import React, { useState, useEffect } from 'react';
import { WelcomeLayout, useMultiScreen } from '@/components/Layout/MultiScreenLayout';
import { cn } from '@/lib/utils';

interface EnhancedHomePageProps {
  onStartGame: () => void;
}

export default function EnhancedHomePage({ onStartGame }: EnhancedHomePageProps) {
  const screenInfo = useMultiScreen();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <WelcomeLayout>
      <div className={cn(
        'text-center space-y-8 transition-all duration-1000',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}>
        {/* 主标题区域 */}
        <div className="space-y-4">
          <div className={cn(
            'inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-2xl',
            screenInfo.isMobile ? 'w-20 h-20 text-3xl' :
            screenInfo.isIPad ? 'w-28 h-28 text-5xl' :
            'w-32 h-32 text-6xl'
          )}>
            🦊
          </div>
          
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent',
            screenInfo.isMobile ? 'text-4xl' :
            screenInfo.isIPad ? 'text-6xl' :
            'text-7xl'
          )}>
            FoxAI 你画我猜
          </h1>
          
          <p className={cn(
            'text-gray-600 max-w-2xl mx-auto leading-relaxed',
            screenInfo.isMobile ? 'text-lg px-4' :
            screenInfo.isIPad ? 'text-xl px-8' :
            'text-2xl'
          )}>
            用你的创意挑战AI！画出你想的，让智能AI来猜测你的杰作
          </p>
        </div>

        {/* 特色功能展示 */}
        <div className={cn(
          'grid gap-6 max-w-4xl mx-auto',
          screenInfo.isMobile ? 'grid-cols-1 px-4' :
          screenInfo.isIPad ? 'grid-cols-2 px-8' :
          'grid-cols-3'
        )}>
          <FeatureCard
            icon="🎨"
            title="流畅绘画"
            description="支持触控笔、手指绘画，60fps流畅体验"
            screenInfo={screenInfo}
          />
          <FeatureCard
            icon="🤖"
            title="AI识别"
            description="先进的视觉AI，准确识别你的创作"
            screenInfo={screenInfo}
          />
          <FeatureCard
            icon="📱"
            title="多设备"
            description="完美适配iPad、手机、电脑"
            screenInfo={screenInfo}
            className={screenInfo.isMobile ? 'col-span-1' : screenInfo.isIPad ? 'col-span-2' : ''}
          />
        </div>

        {/* 开始游戏按钮 */}
        <div className="space-y-4">
          <button
            onClick={onStartGame}
            className={cn(
              'group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-105 active:scale-95',
              screenInfo.isMobile ? 'px-8 py-4 text-lg' :
              screenInfo.isIPad ? 'px-12 py-6 text-xl' :
              'px-16 py-8 text-2xl'
            )}
          >
            <span className="relative z-10 flex items-center justify-center space-x-3">
              <span>🚀</span>
              <span>开始游戏</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          <p className={cn(
            'text-gray-500',
            screenInfo.isMobile ? 'text-sm' : 'text-base'
          )}>
            {screenInfo.isIPad ? '专为iPad优化，触控体验更佳' : '支持多种设备，随时随地畅玩'}
          </p>
        </div>

        {/* 游戏统计 */}
        <GameStats screenInfo={screenInfo} />
      </div>
    </WelcomeLayout>
  );
}

// 特色功能卡片
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  screenInfo: any;
  className?: string;
}

function FeatureCard({ icon, title, description, screenInfo, className }: FeatureCardProps) {
  return (
    <div className={cn(
      'bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
      className
    )}>
      <div className={cn(
        'text-center space-y-3',
        screenInfo.isIPad && 'space-y-4'
      )}>
        <div className={cn(
          'text-4xl',
          screenInfo.isIPad && 'text-5xl'
        )}>
          {icon}
        </div>
        <h3 className={cn(
          'font-bold text-gray-800',
          screenInfo.isMobile ? 'text-lg' :
          screenInfo.isIPad ? 'text-xl' :
          'text-xl'
        )}>
          {title}
        </h3>
        <p className={cn(
          'text-gray-600 leading-relaxed',
          screenInfo.isMobile ? 'text-sm' :
          screenInfo.isIPad ? 'text-base' :
          'text-base'
        )}>
          {description}
        </p>
      </div>
    </div>
  );
}

// 游戏统计组件
function GameStats({ screenInfo }: { screenInfo: any }) {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPlayers: 0,
    accuracy: 0
  });

  useEffect(() => {
    // 模拟加载统计数据
    const timer = setTimeout(() => {
      setStats({
        totalGames: 12580,
        totalPlayers: 3420,
        accuracy: 87
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      'bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 max-w-2xl mx-auto',
      screenInfo.isMobile && 'mx-4'
    )}>
      <h3 className={cn(
        'font-bold text-gray-800 mb-4 text-center',
        screenInfo.isMobile ? 'text-lg' : 'text-xl'
      )}>
        🏆 游戏统计
      </h3>
      
      <div className={cn(
        'grid gap-4',
        screenInfo.isMobile ? 'grid-cols-1' : 'grid-cols-3'
      )}>
        <StatItem
          label="总游戏数"
          value={stats.totalGames.toLocaleString()}
          icon="🎮"
          screenInfo={screenInfo}
        />
        <StatItem
          label="玩家数量"
          value={stats.totalPlayers.toLocaleString()}
          icon="👥"
          screenInfo={screenInfo}
        />
        <StatItem
          label="AI准确率"
          value={`${stats.accuracy}%`}
          icon="🎯"
          screenInfo={screenInfo}
        />
      </div>
    </div>
  );
}

// 统计项组件
function StatItem({ label, value, icon, screenInfo }: {
  label: string;
  value: string;
  icon: string;
  screenInfo: any;
}) {
  return (
    <div className="text-center space-y-2">
      <div className={cn(
        'text-2xl',
        screenInfo.isIPad && 'text-3xl'
      )}>
        {icon}
      </div>
      <div className={cn(
        'font-bold text-blue-600',
        screenInfo.isMobile ? 'text-lg' :
        screenInfo.isIPad ? 'text-xl' :
        'text-xl'
      )}>
        {value}
      </div>
      <div className={cn(
        'text-gray-600',
        screenInfo.isMobile ? 'text-sm' : 'text-base'
      )}>
        {label}
      </div>
    </div>
  );
}
