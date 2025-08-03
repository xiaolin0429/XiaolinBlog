"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { User, UserLogin } from '@/types/api';
import { toast } from 'sonner';
import { setupTokenRefreshTimer, getCurrentToken } from '@/lib/auth-utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  sessionId: string | null;
  authStatus: 'authenticated' | 'unauthenticated' | 'checking' | 'error';
  forceAuthCheck: () => Promise<void>;
  heartbeatEnabled: boolean;
  setHeartbeatEnabled: (enabled: boolean) => void;
  triggerHeartbeat: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'checking' | 'error'>('checking');
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInitializedRef = useRef(false); // 标记心跳是否已初始化
  const router = useRouter();
  const pathname = usePathname();

  // 从Cookie中提取sessionId
  const getSessionIdFromCookie = useCallback((): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; blog_auth_session=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }, []);

  // 强制认证检查 - 需要先定义，因为performHeartbeat会使用它
  const forceAuthCheck = useCallback(async () => {
    setAuthStatus('checking');
    setLoading(true);
    
    try {
      const currentToken = getCurrentToken();
      const currentSessionId = getSessionIdFromCookie();
      
      setToken(currentToken);
      setSessionId(currentSessionId);
      
      if (currentToken && currentSessionId) {
        // 执行三重验证：JWT + Session + Cookie
        const response = await fetch('/api/v1/heartbeat/force-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            client_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          })
        });
        
        if (response.ok) {
          const checkResult = await response.json();
          
          if (checkResult.authentication_valid) {
            // 三重验证通过，获取用户信息
            const userResponse = await authApi.getCurrentUser();
            if (userResponse.data) {
              setUser(userResponse.data);
              setAuthStatus('authenticated');
            } else {
              throw new Error('无法获取用户信息');
            }
          } else {
            // 验证失败
            console.warn('三重验证失败:', checkResult);
            setUser(null);
            setAuthStatus('error');
            localStorage.removeItem('access_token');
          }
        } else {
          throw new Error('认证检查请求失败');
        }
      } else {
        // 缺少必要的认证信息
        setUser(null);
        setAuthStatus('unauthenticated');
        localStorage.removeItem('access_token');
      }
    } catch (error) {
      console.error('强制认证检查失败:', error);
      setUser(null);
      setAuthStatus('error');
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, [getSessionIdFromCookie]);

  // 执行心跳检测 - 现在可以安全地使用forceAuthCheck
  const performHeartbeat = useCallback(async (): Promise<boolean> => {
    if (!user || !token || !sessionId || !heartbeatEnabled) {
      return false;
    }

    try {
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
        const data = await response.json();
        console.log('心跳检测成功:', {
          status: data.status,
          user_id: data.user_id,
          session_id: data.session_id?.substring(0, 8) + '...',
          next_ping_in: data.next_ping_in
        });
        return true;
      } else if (response.status === 401 || response.status === 403) {
        console.warn('心跳检测认证失败，执行强制认证检查');
        await forceAuthCheck();
        return false;
      } else {
        console.error('心跳检测失败，状态码:', response.status);
        return false;
      }
    } catch (error) {
      console.error('心跳检测异常:', error);
      return false;
    }
  }, [user, token, sessionId, heartbeatEnabled, forceAuthCheck]);

  // 启动心跳定时器
  const startHeartbeat = useCallback(() => {
    // 如果已经有定时器在运行，不要重复启动
    if (heartbeatTimerRef.current) {
      console.log('心跳检测已在运行，跳过启动');
      return;
    }

    if (!heartbeatEnabled || !user) {
      console.log('心跳检测条件不满足，跳过启动');
      return;
    }

    console.log('启动心跳检测，间隔: 5分钟');
    
    // 立即执行一次心跳检测
    performHeartbeat();
    
    // 设置定时器，每5分钟执行一次
    heartbeatTimerRef.current = setInterval(() => {
      performHeartbeat();
    }, 5 * 60 * 1000); // 5分钟
  }, [heartbeatEnabled, user, performHeartbeat]);

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

  // 检查用户认证状态 - 通过获取当前用户信息来验证认证状态
  const checkAuth = async (skipLogoutOnError: boolean = false) => {
    try {
      const currentToken = getCurrentToken();
      const currentSessionId = getSessionIdFromCookie();
      
      setToken(currentToken);
      setSessionId(currentSessionId);
      
      if (currentToken) {
        // 如果有token，尝试获取用户信息来验证认证状态
        const response = await authApi.getCurrentUser();
        if (response.data) {
          // 认证有效，设置用户信息
          setUser(response.data);
          setAuthStatus('authenticated');
        } else {
          // 认证无效，清除状态
          setUser(null);
          setAuthStatus('unauthenticated');
          if (!skipLogoutOnError) {
            localStorage.removeItem('access_token');
          }
        }
      } else {
        // 没有token，清除用户状态
        setUser(null);
        setAuthStatus('unauthenticated');
        if (!skipLogoutOnError) {
          localStorage.removeItem('access_token');
        }
      }
    } catch (error) {
      // 获取用户信息失败，可能是token过期或无效
      console.warn('获取用户信息失败:', error);
      setUser(null);
      setAuthStatus('error');
      if (!skipLogoutOnError) {
        localStorage.removeItem('access_token');
      }
    } finally {
      setLoading(false);
    }
  };

  // 启动自动刷新定时器
  const startRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = setupTokenRefreshTimer(() => {
      // Token 刷新成功后，保持当前用户状态
      // 不需要重新检查认证状态，避免不必要的API调用
      console.log('Token 已刷新');
    });
  };

  // 停止自动刷新定时器
  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  useEffect(() => {
    // 初始化时检查认证状态
    // 页面刷新时，如果有token就尝试恢复用户状态，如果失败也不自动清除Cookie
    checkAuth(true);
  }, []);

  // 当用户状态改变时，管理刷新定时器和心跳检测
  useEffect(() => {
    if (user) {
      // 用户已登录，启动自动刷新
      startRefreshTimer();
      
      // 只在心跳未初始化时启动心跳检测
      if (!heartbeatInitializedRef.current) {
        console.log('用户登录，首次启动心跳检测');
        startHeartbeat();
        heartbeatInitializedRef.current = true;
      }
    } else {
      // 用户未登录，停止自动刷新和心跳检测
      stopRefreshTimer();
      stopHeartbeat();
      heartbeatInitializedRef.current = false;
    }

    // 组件卸载时清理定时器
    return () => {
      stopRefreshTimer();
      stopHeartbeat();
      heartbeatInitializedRef.current = false;
    };
  }, [user]); // 只依赖 user 状态，避免函数重新创建导致的重复启停

  // 监听心跳启用状态变化
  useEffect(() => {
    if (user && heartbeatEnabled && !heartbeatTimerRef.current) {
      // 心跳被启用且当前没有运行，启动心跳
      console.log('心跳检测被启用，启动心跳');
      startHeartbeat();
      heartbeatInitializedRef.current = true;
    } else if (!heartbeatEnabled && heartbeatTimerRef.current) {
      // 心跳被禁用且当前正在运行，停止心跳
      console.log('心跳检测被禁用，停止心跳');
      stopHeartbeat();
      heartbeatInitializedRef.current = false;
    }
  }, [heartbeatEnabled, user]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && heartbeatEnabled) {
        // 页面变为可见时，立即执行一次心跳检测
        console.log('页面变为可见，执行心跳检测');
        performHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, heartbeatEnabled, performHeartbeat]);

  // 监听用户状态变化，当用户变为null且不在加载状态时，检查是否需要跳转
  useEffect(() => {
    if (!loading && !user && pathname.startsWith('/admin')) {
      // 用户未登录且在管理页面，跳转到登录页
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setAuthStatus('checking');
      
      const response = await authApi.login({ username, password });
      if (response.data) {
        // Cookie 由服务端自动设置，这里只需要保存 token 到 localStorage 作为备用
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token);
          setToken(response.data.access_token);
        }
        
        // 获取并设置sessionId
        const newSessionId = getSessionIdFromCookie();
        setSessionId(newSessionId);
        
        // 直接使用登录接口返回的用户信息，避免立即调用testToken
        if (response.data.user) {
          setUser(response.data.user);
          setAuthStatus('authenticated');
        }
        
        console.log('登录成功:', {
          userId: response.data.user?.id,
          sessionId: newSessionId?.substring(0, 8) + '...',
          hasToken: !!response.data.access_token
        });
        
        toast.success('登录成功');
        return true;
      } else {
        setAuthStatus('unauthenticated');
        toast.error(response.error || '登录失败');
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      setAuthStatus('error');
      toast.error('登录失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setAuthStatus('checking');
      
      // 调用服务端登出接口，清除服务端会话
      await authApi.logout();
      
      // 清除本地状态
      setUser(null);
      setToken(null);
      setSessionId(null);
      setAuthStatus('unauthenticated');
      
      // 清除本地存储
      localStorage.removeItem('access_token');
      
      // 停止自动刷新
      stopRefreshTimer();
      
      console.log('登出成功');
      toast.success('已退出登录');
      
      // 如果当前在需要认证的页面，跳转到登录页
      if (pathname.startsWith('/admin')) {
        router.push('/login');
      }
    } catch (error) {
      console.error('登出过程中发生错误:', error);
      
      // 即使登出接口调用失败，也要清除本地状态
      setUser(null);
      setToken(null);
      setSessionId(null);
      setAuthStatus('unauthenticated');
      localStorage.removeItem('access_token');
      stopRefreshTimer();
      
      toast.success('已退出登录');
      
      // 如果当前在需要认证的页面，跳转到登录页
      if (pathname.startsWith('/admin')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router, stopRefreshTimer]);

  // Cookie监控配置
  const cookieMonitorConfig = {
    checkInterval: 5000, // 5秒检查一次
    cookieName: 'blog_auth_session',
    onCookieCleared: () => {
      console.warn('检测到认证Cookie被清除，强制登出');
      logout();
    },
    onCookieChanged: (oldValue: string | null, newValue: string | null) => {
      console.log('Cookie状态变化:', {
        oldValue: oldValue ? `${oldValue.substring(0, 8)}...` : null,
        newValue: newValue ? `${newValue.substring(0, 8)}...` : null
      });
      
      // 如果Cookie值发生变化，更新sessionId
      setSessionId(newValue);
      
      // 如果用户已登录但Cookie被清除，需要重新验证
      if (user && oldValue && !newValue) {
        console.warn('用户已登录但Cookie被清除，执行强制认证检查');
        forceAuthCheck();
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    setUser,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_superuser,
    token,
    sessionId,
    authStatus,
    forceAuthCheck,
    heartbeatEnabled,
    setHeartbeatEnabled,
    triggerHeartbeat,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}