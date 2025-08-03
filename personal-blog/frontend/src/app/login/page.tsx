"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        // 获取重定向参数，如果没有则跳转到首页
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/';
        router.push(redirectTo);
      }
    } catch (err: any) {
      const errorMessage = err.message || '登录失败，请稍后重试';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 返回首页链接 */}
        <div className="flex items-center justify-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>

        {/* 登录卡片 */}
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <LogIn className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">登录</CardTitle>
            <CardDescription className="text-center">
              登录到您的博客管理后台
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 错误提示 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 用户名/邮箱输入 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名或邮箱</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名或邮箱"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入您的密码"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 登录按钮 */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    登录
                  </>
                )}
              </Button>
            </form>

            {/* 其他链接 */}
            <div className="mt-6 text-center space-y-2">
              <Link 
                href="/register" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                还没有账号？立即注册
              </Link>
              <br />
              <Link 
                href="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                忘记密码？
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 版权信息 */}
        <div className="text-center text-xs text-muted-foreground">
          © 2024 个人博客系统. 保留所有权利.
        </div>
      </div>
    </div>
  );
}