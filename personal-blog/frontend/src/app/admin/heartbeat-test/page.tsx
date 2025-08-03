"use client";

import React from 'react';
import { HeartbeatStatus } from '@/components/HeartbeatStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Shield, Clock, AlertTriangle } from 'lucide-react';

export default function HeartbeatTestPage() {
  const { 
    user, 
    isAuthenticated, 
    authStatus, 
    sessionId, 
    token,
    forceAuthCheck 
  } = useAuth();

  const handleForceAuthCheck = async () => {
    console.log('执行强制认证检查...');
    await forceAuthCheck();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">心跳检测测试页面</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 心跳状态组件 */}
        <div>
          <HeartbeatStatus />
        </div>

        {/* 认证状态信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              认证状态详情
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 认证状态 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">认证状态:</span>
              <Badge 
                variant={isAuthenticated ? 'default' : 'destructive'}
                className="text-xs"
              >
                {authStatus}
              </Badge>
            </div>

            {/* 用户信息 */}
            {user && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">用户名:</span>
                  <span className="text-sm">{user.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">用户ID:</span>
                  <span className="text-sm">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">管理员:</span>
                  <Badge variant={user.is_superuser ? 'default' : 'secondary'} className="text-xs">
                    {user.is_superuser ? '是' : '否'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Token信息 */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token状态:</span>
                <Badge variant={token ? 'default' : 'destructive'} className="text-xs">
                  {token ? '存在' : '缺失'}
                </Badge>
              </div>
              {token && (
                <div className="text-xs font-mono text-gray-600 break-all">
                  {token.substring(0, 50)}...
                </div>
              )}
            </div>

            {/* Session信息 */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session状态:</span>
                <Badge variant={sessionId ? 'default' : 'destructive'} className="text-xs">
                  {sessionId ? '存在' : '缺失'}
                </Badge>
              </div>
              {sessionId && (
                <div className="text-xs font-mono text-gray-600">
                  {sessionId}
                </div>
              )}
            </div>

            {/* 强制认证检查按钮 */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleForceAuthCheck}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                强制认证检查
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            心跳检测功能说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🔄 自动心跳检测</h4>
              <p>系统每5分钟自动向服务器发送心跳请求，验证用户会话是否仍然有效。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">👁️ 页面可见性检测</h4>
              <p>当用户切换回页面时，系统会立即执行一次心跳检测，确保会话状态最新。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🛡️ 三重验证机制</h4>
              <p>心跳检测包含JWT Token验证、Redis Session验证和Cookie一致性验证。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🔧 故障恢复</h4>
              <p>如果心跳检测失败，系统会自动尝试强制认证检查，必要时会要求用户重新登录。</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-1">⚙️ 可配置选项</h4>
              <p>用户可以通过开关控制是否启用自动心跳检测，也可以手动触发检测。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}