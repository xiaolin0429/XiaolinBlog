/**
 * 带认证监控的管理后台布局组件
 * 集成心跳检测和Cookie监控功能
 */
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useCookieMonitor } from '@/hooks/useCookieMonitor';
import HeartbeatIndicator from '@/components/common/HeartbeatIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AdminLayoutWithAuthProps {
  children: React.ReactNode;
  className?: string;
  showAuthStatus?: boolean;
  enableHeartbeat?: boolean;
  enableCookieMonitor?: boolean;
}

const AdminLayoutWithAuth: React.FC<AdminLayoutWithAuthProps> = ({
  children,
  className,
  showAuthStatus = true,
  enableHeartbeat = true,
  enableCookieMonitor = true
}) => {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    authStatus, 
    token, 
    sessionId, 
    forceAuthCheck,
    logout 
  } = useAuth();

  const [showDetails, setShowDetails] = useState(false);
  const [authWarnings, setAuthWarnings] = useState<string[]>([]);

  // 心跳检测配置
  const heartbeatConfig = {
    interval: 5 * 60 * 1000, // 5分钟
    timeout: 10 * 1000, // 10秒
    maxRetries: 3,
    enableAutoRecovery: true,
    onStatusChange: (status: any) => {
      console.log('心跳状态变化:', status);
      
      // 根据心跳状态更新警告信息
      if (status.status === 'error') {
        setAuthWarnings(prev => [
          ...prev.filter(w => !w.includes('心跳')),
          '心跳检测失败，连接可能不稳定'
        ]);
      } else if (status.status === 'healthy') {
        setAuthWarnings(prev => prev.filter(w => !w.includes('心跳')));
      }
    }
  };

  // Cookie监控配置
  const cookieMonitorConfig = {
    checkInterval: 5000, // 5秒
    cookieName: 'blog_auth_session',
    onCookieCleared: () => {
      console.warn('检测到认证Cookie被清除');
      setAuthWarnings(prev => [
        ...prev.filter(w => !w.includes('Cookie')),
        'Cookie已被清除，认证状态可能失效'
      ]);
      
      toast({
        title: "认证警告",
        description: "检测到认证Cookie被清除，可能需要重新登录",
        variant: "destructive",
      });
    },
    onCookieChanged: (oldValue: string | null, newValue: string | null) => {
      if (oldValue && !newValue) {
        console.warn('Cookie被清除:', { oldValue: oldValue.substring(0, 8) + '...' });
      } else if (!oldValue && newValue) {
        console.log('Cookie已设置:', { newValue: newValue.substring(0, 8) + '...' });
        setAuthWarnings(prev => prev.filter(w => !w.includes('Cookie')));
      }
    }
  };

  // 使用心跳检测Hook
  const heartbeat = useHeartbeat(enableHeartbeat ? heartbeatConfig : {});
  
  // 使用Cookie监控Hook
  const cookieMonitor = useCookieMonitor(enableCookieMonitor ? cookieMonitorConfig : {});

  // 处理认证状态变化
  useEffect(() => {
    const warnings: string[] = [];

    // 检查基本认证状态
    if (!isAuthenticated && !loading) {
      warnings.push('用户未登录');
    }

    // 检查token状态
    if (isAuthenticated && !token) {
      warnings.push('缺少访问令牌');
    }

    // 检查session状态
    if (isAuthenticated && !sessionId) {
      warnings.push('缺少会话标识');
    }

    // 检查Cookie状态
    if (enableCookieMonitor && isAuthenticated && !cookieMonitor.cookieExists) {
      warnings.push('认证Cookie不存在');
    }

    // 检查心跳状态
    if (enableHeartbeat && isAuthenticated && !heartbeat.isActive) {
      warnings.push('心跳检测未激活');
    }

    setAuthWarnings(warnings);
  }, [
    isAuthenticated, 
    loading, 
    token, 
    sessionId, 
    cookieMonitor.cookieExists, 
    heartbeat.isActive,
    enableHeartbeat,
    enableCookieMonitor
  ]);

  // 处理强制认证检查
  const handleForceCheck = async () => {
    try {
      await forceAuthCheck();
      toast({
        title: "认证检查完成",
        description: "已完成强制认证状态检查",
      });
    } catch (error) {
      console.error('强制认证检查失败:', error);
      toast({
        title: "认证检查失败",
        description: "强制认证检查过程中发生错误",
        variant: "destructive",
      });
    }
  };

  // 处理Cookie完整性验证
  const handleCookieValidation = async () => {
    try {
      const isValid = await cookieMonitor.validateCookieIntegrity();
      toast({
        title: isValid ? "Cookie验证通过" : "Cookie验证失败",
        description: isValid ? "Cookie状态正常" : "Cookie可能已损坏或过期",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Cookie验证失败:', error);
      toast({
        title: "Cookie验证错误",
        description: "验证过程中发生错误",
        variant: "destructive",
      });
    }
  };

  // 获取认证状态颜色
  const getAuthStatusColor = () => {
    switch (authStatus) {
      case 'authenticated':
        return authWarnings.length > 0 ? 'text-yellow-600' : 'text-green-600';
      case 'unauthenticated':
        return 'text-gray-500';
      case 'checking':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  // 获取认证状态文本
  const getAuthStatusText = () => {
    switch (authStatus) {
      case 'authenticated':
        return authWarnings.length > 0 ? '已认证(有警告)' : '已认证';
      case 'unauthenticated':
        return '未认证';
      case 'checking':
        return '检查中';
      case 'error':
        return '认证错误';
      default:
        return '未知状态';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在验证认证状态...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">需要登录</h2>
          <p className="text-gray-600 mb-6">请先登录以访问管理后台</p>
          <Button onClick={() => window.location.href = '/login'}>
            前往登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* 认证状态栏 */}
      {showAuthStatus && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 用户信息 */}
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {user?.username || '未知用户'}
                </span>
                <Badge variant={authStatus === 'authenticated' ? 'default' : 'secondary'}>
                  {getAuthStatusText()}
                </Badge>
              </div>

              {/* 心跳指示器 */}
              {enableHeartbeat && (
                <HeartbeatIndicator 
                  size="sm" 
                  showDetails={false}
                />
              )}

              {/* Cookie状态 */}
              {enableCookieMonitor && (
                <div className="flex items-center space-x-1">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    cookieMonitor.cookieExists ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-gray-500">
                    Cookie
                  </span>
                </div>
              )}

              {/* 会话信息 */}
              {sessionId && (
                <span className="text-xs text-gray-500 font-mono">
                  会话: {sessionId.substring(0, 8)}...
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* 详情切换按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              {/* 强制检查按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForceCheck}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Cookie验证按钮 */}
              {enableCookieMonitor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCookieValidation}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 详细信息面板 */}
          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 认证状态详情 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">认证状态</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>状态:</span>
                      <span className={getAuthStatusColor()}>{getAuthStatusText()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>用户ID:</span>
                      <span>{user?.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>管理员:</span>
                      <span>{user?.is_superuser ? '是' : '否'}</span>
                    </div>
                  </div>
                </div>

                {/* 心跳状态详情 */}
                {enableHeartbeat && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">心跳状态</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>状态:</span>
                        <span className={
                          heartbeat.status.status === 'healthy' ? 'text-green-600' :
                          heartbeat.status.status === 'warning' ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {heartbeat.status.status === 'healthy' ? '正常' :
                           heartbeat.status.status === 'warning' ? '警告' : '错误'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>上次心跳:</span>
                        <span>
                          {heartbeat.lastHeartbeat ? 
                            new Date(heartbeat.lastHeartbeat).toLocaleTimeString() : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>失败次数:</span>
                        <span>{heartbeat.status.failedCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cookie状态详情 */}
                {enableCookieMonitor && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Cookie状态</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>存在:</span>
                        <span className={cookieMonitor.cookieExists ? 'text-green-600' : 'text-red-600'}>
                          {cookieMonitor.cookieExists ? '是' : '否'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>上次检查:</span>
                        <span>{cookieMonitor.lastChecked.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>变化次数:</span>
                        <span>{cookieMonitor.changeCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 警告信息 */}
          {authWarnings.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {authWarnings.map((warning, index) => (
                    <div key={index} className="text-sm">
                      • {warning}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default AdminLayoutWithAuth;