"use client"

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, User, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { getSiteInfo, loading } = useSiteConfig();
  
  const siteInfo = getSiteInfo();

  const navigation = [
    { name: "首页", href: "/" },
    { name: "文章", href: "/posts" },
    { name: "分类", href: "/categories" },
    { name: "标签", href: "/tags" },
    { name: "关于", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {loading ? 'B' : (siteInfo.title?.charAt(0) || 'B')}
              </span>
            </div>
            <span className="font-bold text-xl">
              {loading ? '个人博客' : (siteInfo.title || '个人博客')}
            </span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 搜索和用户操作 */}
          <div className="flex items-center space-x-4">
            {/* 搜索框 */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文章..."
                  className="pl-8 w-64"
                />
              </div>
            </div>

            {/* 主题切换 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">切换主题</span>
            </Button>

            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {user ? (
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.avatar ? `http://localhost:8000${user.avatar}` : undefined} 
                        alt={user.username} 
                      />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                    <span className="sr-only">用户菜单</span>
                  </Button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.full_name || user.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">个人资料</Link>
                    </DropdownMenuItem>
                    {user.is_superuser && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">管理后台</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">登录</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register">注册</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span className="sr-only">切换菜单</span>
            </Button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* 移动端搜索 */}
              <div className="pt-4 border-t">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文章..."
                    className="pl-8"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}