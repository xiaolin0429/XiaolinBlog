"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, UserPlus, ArrowLeft, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const { login } = useAuth();

  // 表单验证函数
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 用户名验证
    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过20个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线';
    }

    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含字母和数字';
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 获取密码强度
  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, text: '弱', color: 'text-red-500' };
    if (strength <= 3) return { strength, text: '中', color: 'text-yellow-500' };
    return { strength, text: '强', color: 'text-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined
      });

      if (response.data) {
        // 注册成功，显示成功消息
        toast.success('注册成功！正在为您登录...');
        
        // 注册成功后自动登录（后端已返回token和用户信息）
        if (response.data.access_token && response.data.user) {
          // 保存token到localStorage
          localStorage.setItem('access_token', response.data.access_token);
          
          // 调用登录函数来设置用户状态
          const loginSuccess = await login(formData.username, formData.password);
          if (loginSuccess) {
            router.push('/');
          }
        }
      } else {
        throw new Error(response.error || '注册失败');
      }
    } catch (err: any) {
      const errorMessage = err.message || '注册失败，请稍后重试';
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

    // 清除对应字段的错误
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

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

        {/* 注册卡片 */}
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">注册</CardTitle>
            <CardDescription className="text-center">
              创建您的博客账户
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

              {/* 用户名输入 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              {/* 邮箱输入 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址 *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* 昵称输入（可选） */}
              <div className="space-y-2">
                <Label htmlFor="full_name">昵称（可选）</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="请输入您的昵称"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
                {/* 密码强度指示器 */}
                {formData.password && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">密码强度:</span>
                    <span className={passwordStrength.color}>{passwordStrength.text}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength <= 2 ? 'bg-red-500' :
                          passwordStrength.strength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* 确认密码输入 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {/* 密码匹配指示器 */}
                {formData.confirmPassword && formData.password && (
                  <div className="flex items-center gap-2 text-sm">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">密码匹配</span>
                      </>
                    ) : (
                      <span className="text-red-500">密码不匹配</span>
                    )}
                  </div>
                )}
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 注册按钮 */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    注册中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    注册
                  </>
                )}
              </Button>
            </form>

            {/* 其他链接 */}
            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                已有账号？立即登录
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