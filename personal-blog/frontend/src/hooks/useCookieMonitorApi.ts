/**
 * Cookie监控API Hook
 * 处理所有Cookie监控相关的API调用
 */
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

export const useCookieMonitorApi = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  // 检查Cookie状态
  const checkCookieStatus = async (): Promise<CookieStatus | null> => {
    if (!token || !user) return null;

    try {
      setLoading(true);
      const response = await fetch('/api/v1/cookie-monitor/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          client_timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        toast({
          title: "检查失败",
          description: "无法获取Cookie状态",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('Cookie状态检查失败:', error);
      toast({
        title: "检查失败",
        description: "Cookie状态检查出现错误",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 验证Cookie完整性
  const verifyCookieIntegrity = async (): Promise<CookieIntegrity | null> => {
    if (!token || !user) return null;

    try {
      setLoading(true);
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('blog_auth_session='))
        ?.split('=')[1];

      if (!sessionCookie) {
        toast({
          title: "验证失败",
          description: "未找到会话Cookie",
          variant: "destructive"
        });
        return null;
      }

      const response = await fetch('/api/v1/cookie-monitor/integrity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          cookie_value: sessionCookie,
          expected_user_id: user.id,
          client_info: {
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        toast({
          title: "验证失败",
          description: "无法验证Cookie完整性",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('Cookie完整性验证失败:', error);
      toast({
        title: "验证失败",
        description: "Cookie完整性验证出现错误",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 获取监控统计
  const fetchMonitorStats = async (): Promise<MonitorStats | null> => {
    if (!token || !user?.is_superuser) return null;

    try {
      const response = await fetch('/api/v1/cookie-monitor/monitor/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        toast({
          title: "获取失败",
          description: "无法获取监控统计",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error('获取监控统计失败:', error);
      toast({
        title: "获取失败",
        description: "监控统计获取出现错误",
        variant: "destructive"
      });
      return null;
    }
  };

  // 清理无效Cookie
  const cleanupInvalidCookies = async (): Promise<boolean> => {
    if (!token || !user?.is_superuser) return false;

    try {
      const response = await fetch('/api/v1/cookie-monitor/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          cleanup_expired: true,
          cleanup_invalid: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "清理完成",
          description: `已清理 ${data.cleaned_sessions} 个会话和 ${data.cleaned_tokens} 个令牌`,
        });
        return true;
      } else {
        toast({
          title: "清理失败",
          description: "无法清理无效Cookie",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Cookie清理失败:', error);
      toast({
        title: "清理失败",
        description: "Cookie清理出现错误",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    loading,
    checkCookieStatus,
    verifyCookieIntegrity,
    fetchMonitorStats,
    cleanupInvalidCookies
  };
};