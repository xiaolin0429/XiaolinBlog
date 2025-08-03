/**
 * 心跳状态指示器组件
 * 显示当前的心跳连接状态
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Activity
} from 'lucide-react';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HeartbeatIndicatorProps {
  className?: string;
  showDetails?: boolean;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const HeartbeatIndicator: React.FC<HeartbeatIndicatorProps> = ({
  className,
  showDetails = false,
  showControls = false,
  size = 'md'
}) => {
  const { 
    status, 
    isActive, 
    lastHeartbeat, 
    sendHeartbeat, 
    forceCheck, 
    attemptRecovery 
  } = useHeartbeat();

  // 获取状态图标和颜色
  const getStatusIcon = () => {
    switch (status.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'disconnected':
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'healthy':
        return '连接正常';
      case 'warning':
        return '连接不稳定';
      case 'error':
        return '连接错误';
      case 'disconnected':
      default:
        return '未连接';
    }
  };

  const getStatusDescription = () => {
    const baseInfo = `状态: ${getStatusText()}`;
    const lastHeartbeatInfo = lastHeartbeat 
      ? `上次心跳: ${formatDistanceToNow(lastHeartbeat, { locale: zhCN, addSuffix: true })}` 
      : '暂无心跳记录';
    const failedCountInfo = status.failedCount > 0 
      ? `失败次数: ${status.failedCount}` 
      : '';
    const sessionInfo = status.sessionId 
      ? `会话ID: ${status.sessionId.substring(0, 8)}...` 
      : '';

    return [baseInfo, lastHeartbeatInfo, failedCountInfo, sessionInfo]
      .filter(Boolean)
      .join('\n');
  };

  // 处理手动心跳
  const handleManualHeartbeat = async () => {
    try {
      await sendHeartbeat();
    } catch (error) {
      console.error('手动心跳失败:', error);
    }
  };

  // 处理强制检查
  const handleForceCheck = async () => {
    try {
      await forceCheck();
    } catch (error) {
      console.error('强制检查失败:', error);
    }
  };

  // 处理恢复连接
  const handleRecovery = async () => {
    try {
      await attemptRecovery();
    } catch (error) {
      console.error('恢复连接失败:', error);
    }
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  if (!showDetails) {
    // 简单模式：只显示状态指示器
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'relative inline-flex items-center justify-center rounded-full',
              sizeClasses[size],
              className
            )}>
              {getStatusIcon()}
              {/* 状态指示点 */}
              <div className={cn(
                'absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white',
                getStatusColor()
              )} />
              {/* 活动动画 */}
              {isActive && status.status === 'healthy' && (
                <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-20" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs whitespace-pre-line">
              {getStatusDescription()}
            </pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 详细模式：显示完整的状态信息
  return (
    <div className={cn(
      'flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm',
      className
    )}>
      {/* 状态图标 */}
      <div className="relative">
        {getStatusIcon()}
        {isActive && status.status === 'healthy' && (
          <div className="absolute inset-0 rounded-full border border-green-500 animate-ping opacity-30" />
        )}
      </div>

      {/* 状态信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Badge variant={
            status.status === 'healthy' ? 'default' :
            status.status === 'warning' ? 'secondary' :
            'destructive'
          }>
            {getStatusText()}
          </Badge>
          {status.sessionId && (
            <span className="text-xs text-gray-500 font-mono">
              {status.sessionId.substring(0, 8)}
            </span>
          )}
        </div>
        
        {lastHeartbeat && (
          <p className="text-xs text-gray-500 mt-1">
            上次心跳: {formatDistanceToNow(lastHeartbeat, { locale: zhCN, addSuffix: true })}
          </p>
        )}
        
        {status.failedCount > 0 && (
          <p className="text-xs text-red-500 mt-1">
            失败次数: {status.failedCount}
          </p>
        )}
      </div>

      {/* 控制按钮 */}
      {showControls && (
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualHeartbeat}
                  disabled={!isActive}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>手动心跳</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleForceCheck}
                  disabled={!isActive}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>强制检查</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {status.status === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRecovery}
                  >
                    <Wifi className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>尝试恢复</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
};

export default HeartbeatIndicator;