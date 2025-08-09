/**
 * 重构后的认证服务
 * 使用EventBus解耦，使用ServiceContainer管理依赖
 */

import { IService, ApiClient, StorageService } from './ServiceContainer'
import { eventBus, SystemEvents, AuthLoginData, AuthLogoutData } from './EventBus'

export interface User {
  id: number
  username: string
  email: string
  is_superuser: boolean
  created_at: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthState {
  user: User | null
  token: string | null
  sessionId: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  error: string | null
}

export class AuthService implements IService {
  name = 'AuthService'
  
  private apiClient!: ApiClient
  private storageService!: StorageService
  private refreshTimer: NodeJS.Timeout | null = null

  // 依赖会通过ServiceContainer自动注入
  constructor(
    apiClient?: ApiClient,
    storageService?: StorageService
  ) {
    if (apiClient) this.apiClient = apiClient
    if (storageService) this.storageService = storageService
  }

  async initialize() {
    console.log('AuthService initialized')
    
    // 监听登出事件
    eventBus.on(SystemEvents.AUTH_LOGOUT, this.handleLogoutEvent.bind(this))
    
    // 启动token刷新定时器
    this.startTokenRefreshTimer()
  }

  async dispose() {
    this.stopTokenRefreshTimer()
    eventBus.removeAllListeners(SystemEvents.AUTH_LOGOUT)
    console.log('AuthService disposed')
  }

  /**
   * 登录
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean, user?: User, error?: string }> {
    try {
      const response = await this.apiClient.post('/api/v1/auth/login', credentials)

      if (response.success && response.data) {
        const { user, access_token, session_id } = response.data

        // 保存认证信息
        this.storageService.setItem('access_token', access_token)
        this.storageService.setItem('user', user)
        
        if (session_id) {
          this.storageService.setItem('session_id', session_id)
        }

        // 发布登录成功事件
        await eventBus.emit(SystemEvents.AUTH_LOGIN_SUCCESS, {
          user,
          token: access_token,
          sessionId: session_id
        } as AuthLoginData)

        // 启动token刷新
        this.startTokenRefreshTimer()

        return { success: true, user }
      } else {
        const error = response.error || '登录失败'
        await eventBus.emit(SystemEvents.AUTH_ERROR, { error })
        return { success: false, error }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误'
      await eventBus.emit(SystemEvents.AUTH_ERROR, { error: errorMsg })
      return { success: false, error: errorMsg }
    }
  }

  /**
   * 登出
   */
  async logout(reason?: string): Promise<void> {
    try {
      // 调用服务端登出接口
      await this.apiClient.post('/api/v1/auth/logout')
    } catch (error) {
      console.warn('Logout API call failed:', error)
    }

    // 清除本地存储
    this.clearAuthStorage()
    
    // 停止token刷新
    this.stopTokenRefreshTimer()

    // 发布登出事件
    await eventBus.emit(SystemEvents.AUTH_LOGOUT, {
      reason,
      redirectTo: '/login'
    } as AuthLogoutData)
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<{ success: boolean, user?: User, error?: string }> {
    try {
      const response = await this.apiClient.get('/api/v1/auth/me')

      if (response.success && response.data) {
        // 更新本地存储的用户信息
        this.storageService.setItem('user', response.data)
        return { success: true, user: response.data }
      } else {
        return { success: false, error: response.error || '获取用户信息失败' }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误'
      return { success: false, error: errorMsg }
    }
  }

  /**
   * 检查认证状态
   */
  async checkAuthStatus(): Promise<AuthState> {
    const token = this.storageService.getItem('access_token')
    const user = this.storageService.getItem<User>('user')
    const sessionId = this.storageService.getItem('session_id')

    if (!token) {
      return {
        user: null,
        token: null,
        sessionId: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null
      }
    }

    try {
      // 验证token有效性
      const result = await this.getCurrentUser()
      
      if (result.success && result.user) {
        return {
          user: result.user,
          token,
          sessionId,
          isAuthenticated: true,
          isAdmin: result.user.is_superuser,
          loading: false,
          error: null
        }
      } else {
        // Token无效，清除认证信息
        this.clearAuthStorage()
        return {
          user: null,
          token: null,
          sessionId: null,
          isAuthenticated: false,
          isAdmin: false,
          loading: false,
          error: result.error || null
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '认证检查失败'
      return {
        user,
        token,
        sessionId,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: errorMsg
      }
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await this.apiClient.post('/api/v1/auth/refresh')

      if (response.success && response.data?.access_token) {
        this.storageService.setItem('access_token', response.data.access_token)
        
        await eventBus.emit(SystemEvents.AUTH_TOKEN_REFRESH, {
          token: response.data.access_token
        })

        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      await eventBus.emit(SystemEvents.AUTH_ERROR, { 
        error: 'Token刷新失败' 
      })
      return false
    }
  }

  /**
   * 处理登出事件
   */
  private async handleLogoutEvent(data: AuthLogoutData) {
    // 执行登出后的清理工作
    this.clearAuthStorage()
    this.stopTokenRefreshTimer()
    
    // 可以在这里执行其他清理工作
    console.log('Logout event handled:', data.reason)
  }

  /**
   * 清除认证存储
   */
  private clearAuthStorage(): void {
    this.storageService.removeItem('access_token')
    this.storageService.removeItem('user')
    this.storageService.removeItem('session_id')
  }

  /**
   * 启动token刷新定时器
   */
  private startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer()
    
    // 每45分钟刷新一次token（假设token有效期为1小时）
    this.refreshTimer = setInterval(() => {
      this.refreshToken()
    }, 45 * 60 * 1000)
  }

  /**
   * 停止token刷新定时器
   */
  private stopTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * 获取存储的用户信息
   */
  getStoredUser(): User | null {
    return this.storageService.getItem<User>('user')
  }

  /**
   * 获取存储的token
   */
  getStoredToken(): string | null {
    return this.storageService.getItem('access_token')
  }
}

// 在ServiceContainer中注册AuthService
import { container, ServiceTokens } from './ServiceContainer'

container.register(ServiceTokens.AUTH_SERVICE, {
  create: async () => {
    const apiClient = await container.get<ApiClient>(ServiceTokens.API_CLIENT)
    const storageService = await container.get<StorageService>(ServiceTokens.STORAGE_SERVICE)
    return new AuthService(apiClient, storageService)
  },
  singleton: true
}, [ServiceTokens.API_CLIENT, ServiceTokens.STORAGE_SERVICE])