'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../application/hooks/useAuth';
import { usersApi } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Camera, Lock, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProfileFormData {
  username: string;
  email: string;
  full_name: string;
  bio: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    username: '',
    email: '',
    full_name: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  // 如果用户未登录，重定向到登录页
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersApi.updateProfile(profileForm);
      // 重新获取完整的用户信息，确保包含所有字段（如 is_superuser）
      const updatedUser = await usersApi.getCurrentUser();
      // setUser(updatedUser); // 移除 setUser 调用，因为 useAuth 不再提供此方法
      toast.success("个人资料更新成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("新密码和确认密码不匹配");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("新密码长度不能少于6位");
      return;
    }

    setLoading(true);

    try {
      await usersApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      toast.success("密码修改成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "密码修改失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error("只能上传图片文件");
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("文件大小不能超过5MB");
      return;
    }

    setAvatarLoading(true);

    try {
      await usersApi.uploadAvatar(file);
      
      // 重新获取完整的用户信息，确保包含所有字段（如 is_superuser）
      const updatedUser = await usersApi.getCurrentUser();
      // setUser(updatedUser); // 移除 setUser 调用，因为 useAuth 不再提供此方法
      
      toast.success("头像上传成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) {
    return null; // 或者显示加载状态
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">个人资料</h1>
          <p className="text-muted-foreground">管理您的账户信息和设置</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            修改密码
          </TabsTrigger>
        </TabsList>

        {/* 基本信息标签页 */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>
                更新您的个人资料信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像上传 */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={user.avatar ? `http://localhost:8000${user.avatar}` : undefined} 
                      alt={user.username} 
                    />
                    <AvatarFallback className="text-2xl">
                      {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarLoading}
                  />
                </div>
                <div>
                  <h3 className="font-medium">头像</h3>
                  <p className="text-sm text-muted-foreground">
                    点击相机图标上传新头像
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 JPG、PNG 格式，最大 5MB
                  </p>
                </div>
              </div>

              {/* 个人信息表单 */}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="请输入用户名"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="请输入邮箱"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">真实姓名</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="请输入真实姓名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="介绍一下自己..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '保存中...' : '保存更改'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 修改密码标签页 */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>
                为了账户安全，请定期更换密码
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">当前密码</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                    placeholder="请输入当前密码"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">新密码</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="请输入新密码（至少6位）"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">确认新密码</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="请再次输入新密码"
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? '修改中...' : '修改密码'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}