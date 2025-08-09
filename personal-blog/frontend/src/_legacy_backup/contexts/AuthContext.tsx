"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { User, UserLogin } from '@/types/api';
import { toast } from 'sonner';
import { setupTokenRefreshTimer, getCurrentToken } from '@/lib/auth-utils';
import Cookies from 'js-cookie';

interface SessionDetails {
  session_id: string;
  user_id: number;
  created_at: string;
  expires_at: string;
  metadata: Record<string, any>;
}

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
  sessionDetails: SessionDetails | null;
  authStatus: 'authenticated' | 'unauthenticated' | 'checking' | 'error';
  forceAuthCheck: () => Promise<void>;
  fetchSessionDetails: () => Promise<SessionDetails | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated' | 'checking' | 'error'>('checking');
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // 从Cookie中提取sessionId - 使用js-cookie库更可靠
  const getSessionIdFromCookie = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      console.log('开始获取Cookie中的sessionId...');
      console.log('当前所有Cookie:', document.cookie);
      
      // 尝试多个可能的Cookie名称
      const possibleNames = ['blog_auth_session', 'session_id', 'sessionid'];
      
      for (const name of possibleNames) {
        const value = Cookies.get(name);
        console.log(`检查Cookie ${name}:`, value);
        if (value) {
          console.log(`从Cookie获取到sessionId: ${name} = ${value.substring(0, 8)}...`);
          return value;
        }
      }
      
      console.log('未找到任何sessionId Cookie');
      return null;
    }
    return null;
  }, []);

  // 获取会话详情
  const fetchSessionDetails = useCallback(async (): Promise<SessionDetails | null> => {
    if (!user || !sessionId) {
      return null;
    }
    
    try {
      console.log('获取会话详情...');
      
      // 直接使用fetch API发送请求，确保请求能够正确发送
      const response = await fetch('/api/v1/session/validate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('会话详情获取成功:', data);
        
        if (data.is_valid && data.session_info) {
          setSessionDetails(data.session_info);
          // 确保sessionId与后端返回的一致
          if (data.session_info.session_id !== sessionId) {
            setSessionId(data.session_info.session_id);
          }
          
          return data.session_info;
        } else {
          console.warn('会话无效:', data.error_message);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('获取会话详情失败:', error);
      return null;
    }
  }, [user, sessionId, token]);

  // 强制认证检查
  const forceAuthCheck = useCallback(async () => {
    setAuthStatus('checking');
    setLoading(true);
    
    try {
      const currentToken = getCurrentToken();
      const currentSessionId = getSessionIdFromCookie();
      
      console.log('强制认证检查 - 当前会话信息:', {
        hasToken: !!currentToken,
        sessionId: currentSessionId ? `${currentSessionId.substring(0, 8)}...` : '无'
      });
      
      setToken(currentToken);
      setSessionId(currentSessionId);
      
      if (currentToken) {
        // 通过获取用户信息来验证认证状态
        const userResponse = await authApi.getCurrentUser();
        if (userResponse.data) {
          setUser(userResponse.data);
          setAuthStatus('authenticated');
          
          // 获取会话详情
          await fetchSessionDetails();
        } else {
          throw new Error('无法获取用户信息');
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
  }, [getSessionIdFromCookie, fetchSessionDetails]);

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

  // 当用户状态改变时，管理刷新定时器
  useEffect(() => {
    if (user) {
      // 用户已登录，启动自动刷新
      startRefreshTimer();
    } else {
      // 用户未登录，停止自动刷新
      stopRefreshTimer();
    }

    // 组件卸载时清理定时器
    return () => {
      stopRefreshTimer();
    };
  }, [user]);



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
          
          // 获取会话详情
          await fetchSessionDetails();
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
    sessionDetails,
    authStatus,
    forceAuthCheck,
    fetchSessionDetails,
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