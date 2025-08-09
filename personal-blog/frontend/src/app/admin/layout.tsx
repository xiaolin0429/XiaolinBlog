/**
 * 管理后台布局 - 使用新架构
 * 迁移到新架构的管理后台布局
 */

"use client"

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../application/hooks/useAuth';
import { 
  Button, 
  Badge, 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '../../presentation/components/ui';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  MessageSquare, 
  Tags, 
  Folder, 
  Settings,
  Menu,
  X,
  Home,
  LogOut,
  Cog,
  Activity
} from 'lucide-react';
import { cn } from '../../presentation/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  {
    title: '仪表盘',
    href: '/admin',
    icon: LayoutDashboard,
    badge: null
  },
  {
    title: '文章管理',
    href: '/admin/posts',
    icon: FileText,
    badge: null
  },
  {
    title: '分类管理',
    href: '/admin/categories',
    icon: Folder,
    badge: null
  },
  {
    title: '标签管理',
    href: '/admin/tags',
    icon: Tags,
    badge: null
  },
  {
    title: '评论管理',
    href: '/admin/comments',
    icon: MessageSquare,
    badge: null
  },
  {
    title: '用户管理',
    href: '/admin/users',
    icon: Users,
    badge: null
  },
  {
    title: '博客配置',
    href: '/admin/site-config',
    icon: Cog,
    badge: null
  },
  {
    title: '系统设置',
    href: '/admin/settings',
    icon: Settings,
    badge: null
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">博客管理</h2>
                <p className="text-xs text-muted-foreground">管理后台</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 侧边栏底部 */}
          <div className="p-4 border-t space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" />
              返回首页
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              {/* 面包屑导航 */}
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/admin" className="hover:text-foreground">
                  管理后台
                </Link>
                {pathname !== '/admin' && (
                  <>
                    <span>/</span>
                    <span className="text-foreground">
                      {sidebarItems.find(item => 
                        pathname === item.href || 
                        (item.href !== '/admin' && pathname.startsWith(item.href))
                      )?.title || '页面'}
                    </span>
                  </>
                )}
              </nav>
            </div>

            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.full_name || user?.username || '管理员'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={user?.avatar ? `http://localhost:8000${user.avatar}` : undefined} 
                  alt={user?.username || '管理员'} 
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}