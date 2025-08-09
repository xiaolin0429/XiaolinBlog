/**
 * 登录表单组件
 * 基于新架构的登录组件
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../application/hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { toast } from 'sonner'

export interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
  className?: string
}

export function LoginForm({ 
  onSuccess, 
  redirectTo = '/admin', 
  className = '' 
}: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, isLoading, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast.error('请输入用户名和密码')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await login(username, password)
      
      if (result.success) {
        onSuccess?.()
        router.push(redirectTo)
      }
    } catch (error) {
      // 错误已经在hook中处理
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormDisabled = isLoading || isSubmitting

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            用户名
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            disabled={isFormDisabled}
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            密码
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            disabled={isFormDisabled}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isFormDisabled}
          className="w-full"
        >
          {isFormDisabled ? (
            <>
              <LoadingSpinner size="sm" />
              登录中...
            </>
          ) : (
            '登录'
          )}
        </Button>
      </form>
    </div>
  )
}

// 登录状态指示器
export function LoginStatus() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return <LoadingSpinner size="sm" />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-sm text-gray-500">
        未登录
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm">
        欢迎，{user.full_name || user.username}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
      >
        退出
      </Button>
    </div>
  )
}