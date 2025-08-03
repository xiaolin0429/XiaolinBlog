/**
 * Cookie状态监控Hook
 * 监控Cookie的变化，检测Cookie被清除的情况
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface CookieMonitorConfig {
  checkInterval?: number; // 检查间隔（毫秒）
  cookieName?: string; // 要监控的Cookie名称
  onCookieCleared?: () => void; // Cookie被清除时的回调
  onCookieChanged?: (oldValue: string | null, newValue: string | null) => void; // Cookie变化时的回调
}

interface CookieStatus {
  exists: boolean;
  value: string | null;
  lastChecked: Date;
  changeCount: number;
  isMonitoring: boolean;
}

const DEFAULT_CONFIG: Required<CookieMonitorConfig> = {
  checkInterval: 5000, // 5秒检查一次
  cookieName: 'blog_auth_session',
  onCookieCleared: () => {},
  onCookieChanged: () => {}
};

export const useCookieMonitor = (config: CookieMonitorConfig = {}) => {
  const { user, logout } = useAuth();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [status, setStatus] = useState<CookieStatus>({
    exists: false,
    value: null,
    lastChecked: new Date(),
    changeCount: 0,
    isMonitoring: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<string | null>(null);
  const isMonitoringRef = useRef(false);

  // 获取Cookie值
  const getCookieValue = useCallback((name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  }, []);

  // 检查Cookie状态
  const checkCookieStatus = useCallback(() => {
    const currentValue = getCookieValue(mergedConfig.cookieName);
    const previousValue = lastValueRef.current;
    const now = new Date();

    // 检查Cookie是否发生变化
    if (currentValue !== previousValue) {
      console.log('Cookie状态变化:', {
        cookieName: mergedConfig.cookieName,
        previousValue: previousValue ? `${previousValue.substring(0, 8)}...` : null,
        currentValue: currentValue ? `${currentValue.substring(0, 8)}...` : null,
        timestamp: now.toISOString()
      });

      // 更新状态
      setStatus(prev => ({
        ...prev,
        exists: currentValue !== null,
        value: currentValue,
        lastChecked: now,
        changeCount: prev.changeCount + 1
      }));

      // 触发变化回调
      mergedConfig.onCookieChanged(previousValue, currentValue);

      // 检查Cookie是否被清除
      if (previousValue !== null && currentValue === null) {
        console.warn('检测到Cookie被清除:', mergedConfig.cookieName);
        
        // 触发清除回调
        mergedConfig.onCookieCleared();

        // 如果用户已登录但Cookie被清除，显示警告并可能需要重新登录
        if (user) {
          toast({
            title: "认证状态异常",
            description: "检测到认证Cookie被清除，可能需要重新登录",
            variant: "destructive",
          });

          // 延迟一段时间后强制登出，给用户时间看到提示
          setTimeout(() => {
            logout();
          }, 3000);
        }
      }

      // 更新引用值
      lastValueRef.current = currentValue;
    } else {
      // 没有变化，只更新检查时间
      setStatus(prev => ({
        ...prev,
        lastChecked: now
      }));
    }

    return {
      exists: currentValue !== null,
      value: currentValue,
      changed: currentValue !== previousValue
    };
  }, [getCookieValue, mergedConfig, user, logout]);

  // 启动监控
  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current) {
      return;
    }

    console.log('启动Cookie监控:', {
      cookieName: mergedConfig.cookieName,
      checkInterval: mergedConfig.checkInterval
    });

    isMonitoringRef.current = true;

    // 立即检查一次
    const initialValue = getCookieValue(mergedConfig.cookieName);
    lastValueRef.current = initialValue;
    
    setStatus({
      exists: initialValue !== null,
      value: initialValue,
      lastChecked: new Date(),
      changeCount: 0,
      isMonitoring: true
    });

    // 设置定时检查
    intervalRef.current = setInterval(() => {
      if (isMonitoringRef.current) {
        checkCookieStatus();
      }
    }, mergedConfig.checkInterval);

  }, [getCookieValue, mergedConfig, checkCookieStatus]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    console.log('停止Cookie监控');
    
    isMonitoringRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStatus(prev => ({
      ...prev,
      isMonitoring: false
    }));
  }, []);

  // 手动检查Cookie
  const manualCheck = useCallback(() => {
    return checkCookieStatus();
  }, [checkCookieStatus]);

  // 验证Cookie完整性
  const validateCookieIntegrity = useCallback(async (): Promise<boolean> => {
    const cookieValue = getCookieValue(mergedConfig.cookieName);
    
    if (!cookieValue) {
      return false;
    }

    try {
      // 向服务器验证Cookie的有效性
      const response = await fetch('/api/v1/session/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.is_valid === true;
      }

      return false;
    } catch (error) {
      console.error('验证Cookie完整性失败:', error);
      return false;
    }
  }, [getCookieValue, mergedConfig.cookieName]);

  // 获取所有相关Cookie
  const getAllAuthCookies = useCallback(() => {
    const authCookieNames = [
      'blog_auth_session',
      'blog_auth_token',
      'csrftoken',
      'sessionid'
    ];

    const cookies: Record<string, string | null> = {};
    
    authCookieNames.forEach(name => {
      cookies[name] = getCookieValue(name);
    });

    return cookies;
  }, [getCookieValue]);

  // 监听用户登录状态变化
  useEffect(() => {
    if (user) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [user, startMonitoring, stopMonitoring]);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isMonitoringRef.current) {
        // 页面重新可见时，立即检查Cookie状态
        checkCookieStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkCookieStatus]);

  // 监听存储事件（跨标签页Cookie变化）
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // 虽然Cookie不会触发storage事件，但我们可以监听其他相关的存储变化
      if (event.key === 'auth_token' || event.key === 'user_session') {
        // 如果localStorage中的认证信息发生变化，也检查Cookie
        setTimeout(() => {
          if (isMonitoringRef.current) {
            checkCookieStatus();
          }
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkCookieStatus]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    status,
    isMonitoring: status.isMonitoring,
    cookieExists: status.exists,
    cookieValue: status.value,
    lastChecked: status.lastChecked,
    changeCount: status.changeCount,
    startMonitoring,
    stopMonitoring,
    manualCheck,
    validateCookieIntegrity,
    getAllAuthCookies
  };
};

export default useCookieMonitor;