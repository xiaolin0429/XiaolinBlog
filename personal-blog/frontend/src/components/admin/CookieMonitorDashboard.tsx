/**
 * Cookie监控仪表板组件
 * 提供Cookie状态监控、完整性验证和清理功能
 */
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCookieMonitorApi } from '@/hooks/useCookieMonitorApi';
import CookieStatusCard from './cookie-monitor/CookieStatusCard';
import CookieIntegrityCard from './cookie-monitor/CookieIntegrityCard';
import MonitorStatsCards from './cookie-monitor/MonitorStatsCards';

interface CookieStatus {
  cookie_exists: boolean;
  cookie_valid: boolean;
  session_valid: boolean;
  user_id?: number;
  session_id?: string;
  expires_at?: string;
  last_activity?: string;
  warnings: string[];
  recommendations: string[];
}

interface CookieIntegrity {
  integrity_valid: boolean;
  session_match: boolean;
  user_match: boolean;
  expiry_valid: boolean;
  security_score: number;
  issues: string[];
  recommendations: string[];
}

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

export default function CookieMonitorDashboard() {
  const { user } = useAuth();
  const { 
    loading, 
    checkCookieStatus, 
    verifyCookieIntegrity, 
    fetchMonitorStats, 
    cleanupInvalidCookies 
  } = useCookieMonitorApi();

  const [cookieStatus, setCookieStatus] = useState<CookieStatus | null>(null);
  const [cookieIntegrity, setCookieIntegrity] = useState<CookieIntegrity | null>(null);
  const [monitorStats, setMonitorStats] = useState<MonitorStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // 刷新Cookie状态
  const handleCheckCookieStatus = async () => {
    const status = await checkCookieStatus();
    if (status) {
      setCookieStatus(status);
    }
  };

  // 验证Cookie完整性
  const handleVerifyCookieIntegrity = async () => {
    const integrity = await verifyCookieIntegrity();
    if (integrity) {
      setCookieIntegrity(integrity);
    }
  };

  // 获取监控统计
  const handleFetchMonitorStats = async () => {
    if (!user?.is_superuser) return;
    
    setRefreshing(true);
    try {
      const stats = await fetchMonitorStats();
      if (stats) {
        setMonitorStats(stats);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // 清理无效Cookie
  const handleCleanupInvalidCookies = async () => {
    if (!user?.is_superuser) return;

    setCleaning(true);
    try {
      const success = await cleanupInvalidCookies();
      if (success) {
        // 刷新统计数据
        await handleFetchMonitorStats();
      }
    } finally {
      setCleaning(false);
    }
  };

  // 刷新所有数据
  const handleRefreshAll = async () => {
    await Promise.all([
      handleCheckCookieStatus(),
      handleVerifyCookieIntegrity(),
      user?.is_superuser ? handleFetchMonitorStats() : Promise.resolve()
    ]);
  };

  // 初始化加载
  useEffect(() => {
    if (user) {
      handleRefreshAll();
    }
  }, [user]);

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        handleCheckCookieStatus();
        if (user.is_superuser) {
          handleFetchMonitorStats();
        }
      }
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            请先登录以查看Cookie监控信息
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cookie监控仪表板</h2>
          <p className="text-muted-foreground">
            监控和管理认证Cookie的状态和安全性
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", (loading || refreshing) && "animate-spin")} />
            刷新
          </Button>
          {user.is_superuser && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCleanupInvalidCookies}
              disabled={cleaning}
            >
              <Trash2 className={cn("h-4 w-4 mr-2", cleaning && "animate-pulse")} />
              清理无效
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Cookie状态</TabsTrigger>
          <TabsTrigger value="integrity">完整性验证</TabsTrigger>
          {user.is_superuser && (
            <TabsTrigger value="stats">系统统计</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <CookieStatusCard 
            cookieStatus={cookieStatus} 
            loading={loading} 
          />
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <CookieIntegrityCard 
            cookieIntegrity={cookieIntegrity} 
            loading={loading} 
          />
        </TabsContent>

        {user.is_superuser && (
          <TabsContent value="stats" className="space-y-4">
            <MonitorStatsCards 
              monitorStats={monitorStats} 
              refreshing={refreshing} 
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}