"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Shield, UserCheck, UserX, Key } from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { usersApi, User, UserCreate, UserUpdate } from '@/lib/api/users';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_superuser: false,
  });

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('加载用户失败:', error);
      toast.error("加载用户数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 筛选用户
  const filteredUsers = (users || []).filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 创建用户
  const handleCreate = async () => {
    try {
      if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
        toast.error("用户名、邮箱和密码不能为空");
        return;
      }

      await usersApi.createUser(formData);
      toast.success("用户创建成功");
      
      setIsCreateDialogOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        is_active: true,
        is_superuser: false,
      });
      loadUsers();
    } catch (error) {
      console.error('创建用户失败:', error);
      toast.error("创建用户失败");
    }
  };

  // 编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // 编辑时不显示密码
      full_name: user.full_name || '',
      is_active: user.is_active,
      is_superuser: user.is_superuser,
    });
    setIsEditDialogOpen(true);
  };

  // 更新用户
  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      if (!formData.username.trim() || !formData.email.trim()) {
        toast.error("用户名和邮箱不能为空");
        return;
      }

      const updateData: UserUpdate = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        is_active: formData.is_active,
        is_superuser: formData.is_superuser,
      };

      await usersApi.updateUser(editingUser.id, updateData);
      toast.success("用户更新成功");
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        is_active: true,
        is_superuser: false,
      });
      loadUsers();
    } catch (error) {
      console.error('更新用户失败:', error);
      toast.error("更新用户失败");
    }
  };

  // 删除用户
  const handleDelete = async (user: User) => {
    if (!confirm(`确定要删除用户"${user.username}"吗？`)) return;

    try {
      await usersApi.deleteUser(user.id);
      toast.success("用户删除成功");
      loadUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error("删除用户失败");
    }
  };

  // 切换用户状态
  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.toggleUserStatus(user.id, !user.is_active);
      toast.success(`用户已${!user.is_active ? '激活' : '禁用'}`);
      loadUsers();
    } catch (error) {
      console.error('切换用户状态失败:', error);
      toast.error("切换用户状态失败");
    }
  };

  // 重置密码
  const handleResetPassword = (user: User) => {
    setEditingUser(user);
    setNewPassword('');
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordReset = async () => {
    if (!editingUser || !newPassword.trim()) {
      toast.error("新密码不能为空");
      return;
    }

    try {
      await usersApi.resetPassword(editingUser.id, newPassword);
      toast.success("密码重置成功");
      setIsPasswordDialogOpen(false);
      setEditingUser(null);
      setNewPassword('');
    } catch (error) {
      console.error('重置密码失败:', error);
      toast.error("重置密码失败");
    }
  };

  const UserForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">用户名 *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="输入用户名"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">邮箱 *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="输入邮箱地址"
        />
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="password">密码 *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="输入密码"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="full_name">全名</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="输入用户全名"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">激活状态</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_superuser">管理员权限</Label>
        <Switch
          id="is_superuser"
          checked={formData.is_superuser}
          onCheckedChange={(checked) => setFormData({ ...formData, is_superuser: checked })}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingUser(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            setFormData({
              username: '',
              email: '',
              password: '',
              full_name: '',
              is_active: true,
              is_superuser: false,
            });
          }}
        >
          取消
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? '更新' : '创建'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建用户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
            </DialogHeader>
            <UserForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(users || []).length}</div>
            <p className="text-xs text-muted-foreground">
              已注册的用户总数
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(user => user.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              当前激活的用户数
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(user => user.is_superuser).length}
            </div>
            <p className="text-xs text-muted-foreground">
              拥有管理员权限的用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">禁用用户</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(users || []).filter(user => !user.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              已禁用的用户数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索用户名、邮箱或全名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 用户表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <td colSpan={7} className="text-center py-8 p-2 align-middle">
                      加载中...
                    </td>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <td colSpan={7} className="text-center py-8 p-2 align-middle">
                      {searchQuery ? '没有找到匹配的用户' : '暂无用户数据'}
                    </td>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={user.avatar ? `http://localhost:8000${user.avatar}` : undefined} 
                            />
                            <AvatarFallback>
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            {user.full_name && (
                              <div className="text-sm text-muted-foreground">
                                {user.full_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? '激活' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_superuser && (
                          <Badge variant="destructive">
                            <Shield className="h-3 w-3 mr-1" />
                            管理员
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_login 
                          ? format(new Date(user.last_login), 'yyyy-MM-dd HH:mm', { locale: zhCN })
                          : '从未登录'
                        }
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          <UserForm isEdit />
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">新密码</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setEditingUser(null);
                  setNewPassword('');
                }}
              >
                取消
              </Button>
              <Button onClick={handlePasswordReset}>
                重置密码
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AuthGuard requireAdmin>
      <UsersPageContent />
    </AuthGuard>
  );
}
