import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface HeartbeatConfig {
  interval?: number; // 心跳间隔，默认5分钟
  enabled?: boolean; // 是否启用心跳检测
  onHeartbeatFail?: () => void; // 心跳失败回调
  onSessionExpired?: () => void; // 会话过期回调
}

interface HeartbeatResponse {
  status: string;
  user_id: number;
  session_id: string;
  server_timestamp: string;
  next_ping_in: number;
}

export function useHeartbeat(config: HeartbeatConfig = {}) {
  const {
    interval = 5 * 60 * 1000, // 默认5分钟
    enabled = true,
    onHeartbeatFail,
    onSessionExpired
  } = config;

  const { user, token, sessionId, logout, forceAuthCheck } = useAuth();
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHeartbeatRunningRef = useRef(false);

  // 执行心跳检测
  const performHeartbeat = useCallback(async (): Promise<boolean> => {
    if (!user || !token || !sessionId) {
      console.log('心跳检测跳过：用户未登录');
      return false;
    }

    if (isHeartbeatRunningRef.current) {
      console.log('心跳检测跳过：正在进行中');
      return false;
    }

    try {
      isHeartbeatRunningRef.current = true;
      console.log('执行心跳检测...');

      const response = await fetch('/api/v1/heartbeat/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          client_timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          page_url: window.location.href
        })
      });

      if (response.ok) {
        const data: HeartbeatResponse = await response.json();
        console.log('心跳检测成功:', {
          status: data.status,
          user_id: data.user_id,
          session_id: data.session_id.substring(0, 8) + '...',
          next_ping_in: data.next_ping_in
        });
        return true;
      } else if (response.status === 401 || response.status === 403) {
        // 认证失败，可能是token过期或session无效
        console.warn('心跳检测认证失败，状态码:', response.status);
        
        // 尝试强制认证检查
        await forceAuthCheck();
        
        // 如果强制检查后仍然没有用户，说明会话确实过期了
        if (!user) {
          console.warn('会话已过期，执行登出');
          onSessionExpired?.();
          toast.warning('会话已过期，请重新登录');
          logout();
        }
        
        return false;
      } else {
        console.error('心跳检测失败，状态码:', response.status);
        onHeartbeatFail?.();
        return false;
      }
    } catch (error) {
      console.error('心跳检测异常:', error);
      onHeartbeatFail?.();
      return false;
    } finally {
      isHeartbeatRunningRef.current = false;
    }
  }, [user, token, sessionId, logout, forceAuthCheck, onHeartbeatFail, onSessionExpired]);

  // 启动心跳定时器
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    if (!enabled || !user) {
      return;
    }

    console.log(`启动心跳检测，间隔: ${interval / 1000}秒`);
    
    // 立即执行一次心跳检测
    performHeartbeat();
    
    // 设置定时器
    heartbeatTimerRef.current = setInterval(() => {
      performHeartbeat();
    }, interval);
  }, [enabled, user, interval, performHeartbeat]);

  // 停止心跳定时器
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      console.log('停止心跳检测');
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // 手动触发心跳检测
  const triggerHeartbeat = useCallback(() => {
    return performHeartbeat();
  }, [performHeartbeat]);

  // 监听用户登录状态变化
  useEffect(() => {
    if (user && enabled) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    // 清理函数
    return () => {
      stopHeartbeat();
    };
  }, [user, enabled, startHeartbeat, stopHeartbeat]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && enabled) {
        // 页面变为可见时，立即执行一次心跳检测
        console.log('页面变为可见，执行心跳检测');
        performHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, enabled, performHeartbeat]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    triggerHeartbeat,
    isRunning: !!heartbeatTimerRef.current,
    startHeartbeat,
    stopHeartbeat
  };
}