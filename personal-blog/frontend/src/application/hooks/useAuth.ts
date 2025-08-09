/**
 * 认证业务Hook - 连接后端API
 * 封装认证相关的业务逻辑
 */

import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '../../lib/api/auth'
import type { User, UserCreate } from '../../types/api'

export interface LoginResult {
  success: boolean
  user?: User
  error?: string
}

export interface RegisterResult {
  success: boolean
  user?: User
  error?: string
}

export interface UseAuthReturn {
  // 状态
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  // 方法
  login: (username: string, password: string) => Promise<LoginResult>
  register: (userData: UserCreate) => Promise<RegisterResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

const USER_STORAGE_KEY = 'auth_user'

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  
  const router = useRouter()
  const isAuthenticated = !!user

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.data) {
        setUser(response.data)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data))
        console.log('User refreshed from API:', response.data)
      } else {
        // 如果无法获取用户信息，清除本地存储
        setUser(null)
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }, [])

  // 初始化时从 localStorage 读取用户信息，然后验证
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          console.log('User loaded from localStorage:', parsedUser)
          
          // 验证token是否仍然有效
          await refreshUser()
        } catch (e) {
          console.error('Failed to parse saved user:', e)
          localStorage.removeItem(USER_STORAGE_KEY)
        }
      }
      setInitialized(true)
    }
    
    initAuth()
  }, [refreshUser])

  // 登录方法
  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Attempting login with:', { username })
      
      const response = await authApi.login({ 
        username, 
        password 
      })
      
      if (response.data) {
        const { access_token, user: userData } = response.data
        
        // 设置token
        if (access_token) {
          const { apiClient } = await import('../../lib/api/client')
          apiClient.setToken(access_token)
        }
        
        // 保存用户信息
        setUser(userData)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
        console.log('User logged in successfully:', userData)
        
        toast.success('登录成功')
        
        return {
          success: true,
          user: userData
        }
      } else {
        const errorMessage = response.error || '登录失败'
        setError(errorMessage)
        toast.error(errorMessage)
        
        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录时发生错误'
      setError(message)
      toast.error(message)
      console.error('Login error:', error)
      
      return {
        success: false,
        error: message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 注册方法
  const register = useCallback(async (userData: UserCreate): Promise<RegisterResult> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Attempting registration with:', { 
        username: userData.username, 
        email: userData.email,
        full_name: userData.full_name 
      })
      
      const response = await authApi.register(userData)
      
      if (response.data) {
        const { access_token, user: registeredUser } = response.data
        
        // 设置token
        if (access_token) {
          const { apiClient } = await import('../../lib/api/client')
          apiClient.setToken(access_token)
        }
        
        // 保存用户信息
        setUser(registeredUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser))
        console.log('User registered successfully:', registeredUser)
        
        toast.success('注册成功！欢迎加入')
        
        return {
          success: true,
          user: registeredUser
        }
      } else {
        const errorMessage = response.error || '注册失败'
        setError(errorMessage)
        toast.error(errorMessage)
        
        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册时发生错误'
      setError(message)
      toast.error(message)
      console.error('Registration error:', error)
      
      return {
        success: false,
        error: message
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 登出方法
  const logout = useCallback(async () => {
    try {
      setLoading(true)
      
      // 调用后端登出API
      await authApi.logout()
      
      setUser(null)
      setError(null)
      localStorage.removeItem(USER_STORAGE_KEY)
      console.log('User logged out, localStorage cleared')
      
      toast.success('已退出登录')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('退出登录失败')
    } finally {
      setLoading(false)
    }
  }, [router])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // 状态
    user,
    isAuthenticated,
    loading: loading || !initialized, // 包含初始化状态
    error,
    
    // 方法
    login,
    register,
    logout,
    refreshUser,
    clearError
  }
}