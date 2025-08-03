"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;
  const isAdmin = !!user?.is_superuser;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // 跳转到登录页面，携带当前页面URL作为重定向参数
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.push(loginUrl);
        return;
      }
      
      if (requireAdmin && !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [loading, isAuthenticated, isAdmin, requireAdmin, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">检查认证状态...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 正在跳转到登录页面，显示加载状态
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>权限不足</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              您需要管理员权限才能访问此页面
            </p>
            <Button onClick={() => router.push('/admin')}>
              返回管理后台
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

