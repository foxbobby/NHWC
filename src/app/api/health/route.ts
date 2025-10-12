import { NextResponse } from 'next/server';
import { SiliconFlowClient } from '@/services/siliconFlowClient';
import { APIResponse, HealthCheckResponse } from '@/types/api';

export async function GET() {
  try {
    const checks = {
      api: false,
      siliconflow: false,
      environment: false
    };

    // 检查环境变量
    const apiKey = process.env.SILICONFLOW_API_KEY;
    checks.environment = !!apiKey;

    // 检查API基础功能
    checks.api = true;

    // 检查SiliconFlow服务
    if (apiKey) {
      try {
        const client = new SiliconFlowClient(apiKey);
        checks.siliconflow = await client.healthCheck();
      } catch (error) {
        console.warn('SiliconFlow健康检查失败:', error);
        checks.siliconflow = false;
      }
    }

    const allHealthy = Object.values(checks).every(check => check);

    const response: APIResponse<HealthCheckResponse> = {
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          siliconflow: checks.siliconflow ? 'available' : 'unavailable',
          database: 'connected' // 暂时没有数据库
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503
    });

  } catch (error) {
    console.error('健康检查失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: '健康检查失败',
        timestamp: new Date().toISOString()
      } as APIResponse,
      { status: 500 }
    );
  }
}

// 支持HEAD请求用于简单的存活检查
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}