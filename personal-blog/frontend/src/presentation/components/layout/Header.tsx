/**
 * 网站头部组件
 * 迁移并更新到新架构
 */

"use client"

import React from "react"
import Link from "next/link"
import { useState } from "react"
import { Menu, X, Search, User, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "../../../application/hooks/useAuth"
import { 
  Button, 
  Input,
  LoadingSpinner 
} from "../ui"

// 简化的下拉菜单组件（避免复杂依赖）
interface DropdownMenuProps {
  children: React.ReactNode
}

function SimpleDropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SimpleDropdownTrigger) {
            return React.cloneElement(child as any, { onClick: () => setIsOpen(!isOpen) })
          }
          if (child.type === SimpleDropdownContent && isOpen) {
            return React.cloneElement(child as any, { onClose: () => setIsOpen(false) })
          }
        }
        return null
      })}
    </div>
  )
}

function SimpleDropdownTrigger({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return <div onClick={onClick}>{children}</div>
}

function SimpleDropdownContent({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
      <div className="py-1" onClick={onClose}>
        {children}
      </div>
    </div>
  )
}

function SimpleDropdownItem({ children, onClick, asChild }: { 
  children: React.ReactNode
  onClick?: () => void
  asChild?: boolean
}) {
  if (asChild && React.isValidElement(children)) {
    // 当使用 asChild 时，直接渲染子元素并添加样式
    return React.cloneElement(children, {
      className: "block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left",
      onClick: onClick || children.props.onClick,
    })
  }

  const content = (
    <div 
      className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
      onClick={onClick}
    >
      {children}
    </div>
  )

  return content
}

function SimpleDropdownSeparator() {
  return <hr className="my-1 border-border" />
}

// 简化的头像组件
function SimpleAvatar({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`rounded-full bg-muted flex items-center justify-center ${className}`}>{children}</div>
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout, loading: authLoading } = useAuth()
  
  // 临时使用硬编码的网站信息，避免Zustand缓存问题
  const siteInfo = {
    title: '个人博客'
  }

  const navigation = [
    { name: "首页", href: "/" },
    { name: "文章", href: "/posts" },
    { name: "分类", href: "/categories" },
    { name: "标签", href: "/tags" },
    { name: "关于", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {siteInfo.title?.charAt(0) || 'B'}
              </span>
            </div>
            <span className="font-bold text-xl">
              {siteInfo.title || '个人博客'}
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
            {authLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <SimpleDropdownMenu>
                <SimpleDropdownTrigger>
                  {user ? (
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <SimpleAvatar className="h-8 w-8">
                        <span className="text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </SimpleAvatar>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                      <span className="sr-only">用户菜单</span>
                    </Button>
                  )}
                </SimpleDropdownTrigger>
                <SimpleDropdownContent>
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
                      <SimpleDropdownSeparator />
                      <SimpleDropdownItem asChild>
                        <Link href="/profile">个人资料</Link>
                      </SimpleDropdownItem>
                      {user.is_superuser && (
                        <SimpleDropdownItem asChild>
                          <Link href="/admin">管理后台</Link>
                        </SimpleDropdownItem>
                      )}
                      <SimpleDropdownSeparator />
                      <SimpleDropdownItem onClick={logout}>
                        <div className="flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>退出登录</span>
                        </div>
                      </SimpleDropdownItem>
                    </>
                  ) : (
                    <>
                      <SimpleDropdownItem asChild>
                        <Link href="/login">登录</Link>
                      </SimpleDropdownItem>
                      <SimpleDropdownItem asChild>
                        <Link href="/register">注册</Link>
                      </SimpleDropdownItem>
                    </>
                  )}
                </SimpleDropdownContent>
              </SimpleDropdownMenu>
            )}

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
  )
}