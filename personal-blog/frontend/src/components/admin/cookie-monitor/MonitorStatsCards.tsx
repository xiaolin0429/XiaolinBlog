/**
 * 监控统计卡片组件
 */
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity,
  Clock,
  Users,
  Database,
  Shield
} from 'lucide-react';

interface MonitorStats {
  timestamp: string;
  session_stats: {
    total_sessions: number;
    active_sessions: number;
    expired_sessions: number;
  };
  blacklist_stats: {
    total_blacklisted: number;
  };
  active_users: number;
  system_health: {
    total_sessions: number;
    active_sessions: number;
    expired_sessions: number;
    blacklisted_tokens: number;
  };
}

interface MonitorStatsCardsProps {
  monitorStats: MonitorStats | null;
  refreshing: boolean;
}

export default function MonitorStatsCards({ monitorStats, refreshing }: MonitorStatsCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {monitorStats?.system_health.total_sessions || 0}
                </div>
                <div className="text-sm text-muted-foreground">总会话数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {monitorStats?.system_health.active_sessions || 0}
                </div>
                <div className="text-sm text-muted-foreground">活跃会话</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {monitorStats?.active_users || 0}
                </div>
                <div className="text-sm text-muted-foreground">活跃用户</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {monitorStats?.system_health.blacklisted_tokens || 0}
                </div>
                <div className="text-sm text-muted-foreground">黑名单令牌</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            系统健康状态
          </CardTitle>
          <CardDescription>
            实时监控系统的认证状态和性能指标
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monitorStats ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                最后更新: {new Date(monitorStats.timestamp).toLocaleString()}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">会话状态分布</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">活跃会话</span>
                      <span className="text-sm font-mono">
                        {monitorStats.session_stats.active_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">过期会话</span>
                      <span className="text-sm font-mono">
                        {monitorStats.session_stats.expired_sessions}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">安全状态</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">黑名单令牌</span>
                      <span className="text-sm font-mono">
                        {monitorStats.blacklist_stats.total_blacklisted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">活跃用户</span>
                      <span className="text-sm font-mono">
                        {monitorStats.active_users}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {refreshing ? "正在加载统计数据..." : "暂无统计数据"}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}