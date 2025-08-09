/**
 * 管理员布局组件
 * 新架构下的布局系统
 */

'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '../../application/hooks/useAuth'
import { AuthGuard } from '../components/auth/AuthGuard'
import { Button, LoadingSpinner } from '../components/ui'

export interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard 
      requireAdmin={true}
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">访问受限</h1>
            <p className="text-gray-600 mb-4">您需要管理员权限才能访问此页面</p>
            <Link href="/login">
              <Button>前往登录</Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

function AdminHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">管理后台</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              欢迎，{user?.full_name || user?.username}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              退出登录
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function AdminSidebar() {
  const menuItems = [
    { href: '/admin', label: '仪表盘', icon: '📊' },
    { href: '/admin/posts', label: '文章管理', icon: '📝' },
    { href: '/admin/categories', label: '分类管理', icon: '📂' },
    { href: '/admin/tags', label: '标签管理', icon: '🏷️' },
    { href: '/admin/comments', label: '评论管理', icon: '💬' },
    { href: '/admin/users', label: '用户管理', icon: '👥' },
    { href: '/admin/site-config', label: '站点配置', icon: '⚙️' }
  ]

  return (
    <aside className="w-64 bg-white shadow-sm border-r min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}