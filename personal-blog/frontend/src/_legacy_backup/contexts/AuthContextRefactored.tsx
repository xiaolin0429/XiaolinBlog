/**
 * 重构后的认证Context
 * 使用新的架构：EventBus + ServiceContainer + 统一状态管理
 */

"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEventListener, SystemEvents, AuthLoginData, AuthLogoutData } from '@/services/EventBus'
import { useService } from '@/services/ServiceContainer'
import { AuthService, User, AuthState, LoginCredentials } from '@/services/AuthService'

interface AuthContextType {
  // 状态
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  error: string | null
  
  // 方法
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: (reason?: string) => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 状态管理
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    sessionId: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    error: null
  })

  // 依赖注入
  const authService = useService<AuthService>('AuthService')
  const router = useRouter()
  const pathname = usePathname()

  /**
   * 检查认证状态
   */
  const checkAuth = useCallback(async () => {
    if (!authService) return

    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const newAuthState = await authService.checkAuthStatus()
      setAuthState(newAuthState)
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '认证检查失败'
      }))
    }
  }, [authService])

  /**
   * 登录
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    if (!authService) return false

    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    const result = await authService.login(credentials)

    if (result.success && result.user) {
      setAuthState(prev => ({
        ...prev,
        user: result.user!,
        isAuthenticated: true,
        isAdmin: result.user!.is_superuser,
        loading: false,
        error: null
      }))
      return true
    } else {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: result.error || '登录失败'
      }))
      return false
    }
  }, [authService])

  /**
   * 登出
   */
  const logout = useCallback(async (reason?: string) => {
    if (!authService) return

    setAuthState(prev => ({ ...prev, loading: true }))
    
    await authService.logout(reason)
    
    // 状态会通过事件监听器更新
  }, [authService])

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  // 监听登录成功事件
  useEventListener<AuthLoginData>(SystemEvents.AUTH_LOGIN_SUCCESS, (data) => {
    setAuthState(prev => ({
      ...prev,
      user: data.user,
      token: data.token,
      sessionId: data.sessionId,
      isAuthenticated: true,
      isAdmin: data.user.is_superuser,
      loading: false,
      error: null
    }))
  })

  // 监听登出事件
  useEventListener<AuthLogoutData>(SystemEvents.AUTH_LOGOUT, (data) => {
    setAuthState({
      user: null,
      token: null,
      sessionId: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
      error: null
    })

    // 路由处理
    if (data.redirectTo && pathname.startsWith('/admin')) {
      router.push(data.redirectTo)
    }
  })

  // 监听认证错误事件
  useEventListener<{ error: string }>(SystemEvents.AUTH_ERROR, (data) => {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: data.error
    }))
  })

  // 监听token刷新事件
  useEventListener<{ token: string }>(SystemEvents.AUTH_TOKEN_REFRESH, (data) => {
    setAuthState(prev => ({
      ...prev,
      token: data.token
    }))
  })

  // 初始化时检查认证状态
  useEffect(() => {
    if (authService) {
      checkAuth()
    }
  }, [authService, checkAuth])

  // 路由保护 - 当用户未登录且访问需要认证的页面时重定向
  useEffect(() => {
    if (!authState.loading && !authState.isAuthenticated && pathname.startsWith('/admin')) {
      router.push('/login')
    }
  }, [authState.loading, authState.isAuthenticated, pathname, router])

  const contextValue: AuthContextType = {
    // 状态
    user: authState.user,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.isAdmin,
    error: authState.error,
    
    // 方法
    login,
    logout,
    checkAuth,
    clearError
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证Context的Hook
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * 认证守卫组件
 */
interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = false, 
  requireAdmin = false,
  fallback = null 
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || <div>需要登录</div>
  }

  if (requireAdmin && !isAdmin) {
    return fallback || <div>需要管理员权限</div>
  }

  return <>{children}</>
}

/**
 * 便捷的认证Hook
 */
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  return { isAuthenticated, loading }
}

export function useRequireAdmin() {
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/login')
    }
  }, [loading, isAdmin, router])

  return { isAdmin, loading }
}