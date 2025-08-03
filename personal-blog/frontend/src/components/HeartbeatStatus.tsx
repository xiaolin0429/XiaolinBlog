"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Heart, Activity, Clock, User, Shield } from 'lucide-react';

export function HeartbeatStatus() {
  const { 
    user, 
    isAuthenticated, 
    sessionId, 
    heartbeatEnabled, 
    setHeartbeatEnabled, 
    triggerHeartbeat 
  } = useAuth();
  
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [heartbeatStatus, setHeartbeatStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [isManualTesting, setIsManualTesting] = useState(false);

  // 手动触发心跳检测
  const handleManualHeartbeat = async () => {
    setIsManualTesting(true);
    setHeartbeatStatus('pending');
    
    try {
      const success = await triggerHeartbeat();
      setHeartbeatStatus(success ? 'success' : 'error');
      setLastHeartbeat(new Date());
    } catch (error) {
      setHeartbeatStatus('error');
    } finally {
      setIsManualTesting(false);
    }
  };

  // 格式化时间显示
  const formatTime = (date: Date | null) => {
    if (!date) return '从未执行';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '正常';
      case 'error': return '失败';
      case 'pending': return '检测中';
      default: return '未知';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4" />
            心跳检测状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>请先登录以启用心跳检测</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Heart className={`h-4 w-4 ${heartbeatEnabled ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
          心跳检测状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 用户信息 */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{user?.username}</span>
          <Badge variant="outline" className="text-xs">
            ID: {user?.id}
          </Badge>
        </div>

        {/* Session信息 */}
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="font-mono text-xs">
            {sessionId ? `${sessionId.substring(0, 8)}...` : '无会话'}
          </span>
        </div>

        {/* 心跳状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 ${getStatusColor(heartbeatStatus)}`} />
            <span className="text-sm">状态:</span>
            <Badge 
              variant={heartbeatStatus === 'success' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {getStatusText(heartbeatStatus)}
            </Badge>
          </div>
        </div>

        {/* 最后检测时间 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>最后检测: {formatTime(lastHeartbeat)}</span>
        </div>

        {/* 控制开关 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">自动心跳检测</span>
          <Switch
            checked={heartbeatEnabled}
            onCheckedChange={setHeartbeatEnabled}
          />
        </div>

        {/* 手动测试按钮 */}
        <Button
          onClick={handleManualHeartbeat}
          disabled={isManualTesting}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isManualTesting ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              检测中...
            </>
          ) : (
            <>
              <Heart className="h-4 w-4 mr-2" />
              手动检测
            </>
          )}
        </Button>

        {/* 说明文字 */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>• 自动心跳检测每5分钟执行一次</p>
          <p>• 页面切换到前台时会立即检测</p>
          <p>• 检测失败时会自动尝试重新认证</p>
        </div>
      </CardContent>
    </Card>
  );
}