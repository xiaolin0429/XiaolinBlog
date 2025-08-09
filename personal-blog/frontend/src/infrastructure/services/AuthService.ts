/**
 * 认证服务实现
 * 统一处理认证逻辑，消除原有Context的强耦合
 */

import { 
  IAuthService, 
  LoginCredentials, 
  LoginResult, 
  SessionDetails 
} from '../../core/contracts/IAuthService'
import { IStorageService } from '../../core/contracts/IStorageService'
import { IEventBus } from '../../core/contracts/IEventBus'
import { User, UserEntity } from '../../core/entities/User'
import { AuthApi } from '../api/AuthApi'
import { 
  AuthError, 
  ApplicationError, 
  ErrorCode 
} from '../../core/errors/ApplicationError'

// 认证相关事件
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  TOKEN_REFRESHED: 'auth.token.refreshed',
  AUTH_STATE_CHANGED: 'auth.state.changed',
  SESSION_EXPIRED: 'auth.session.expired'
} as const

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  sessionId: string | null
  sessionDetails: SessionDetails | null
  lastCheck: number
}

export class AuthService implements IAuthService {
  private authApi: AuthApi
  private storageService: IStorageService
  private eventBus: IEventBus
  private refreshTimer: NodeJS.Timeout | null = null
  private state: AuthState

  // 存储键
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    SESSION_ID: 'session_id'
  }

  constructor(
    authApi: AuthApi,
    storageService: IStorageService,
    eventBus: IEventBus
  ) {
    this.authApi = authApi
    this.storageService = storageService
    this.eventBus = eventBus
    
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      sessionId: null,
      sessionDetails: null,
      lastCheck: 0
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      // 从存储中恢复认证状态
      await this.restoreAuthState()
      
      // 如果有token，验证其有效性
      if (this.state.token) {
        await this.validateCurrentAuth()
      }
    } catch (error) {
      console.error('Auth service initialization failed:', error)
      await this.clearAuth()
    }
  }

  private async restoreAuthState(): Promise<void> {
    try {
      const [token, userData, sessionId] = await Promise.all([
        this.storageService.getItem<string>(this.STORAGE_KEYS.ACCESS_TOKEN),
        this.storageService.getItem<User>(this.STORAGE_KEYS.USER_DATA),
        this.storageService.getItem<string>(this.STORAGE_KEYS.SESSION_ID)
      ])

      if (token && userData) {
        this.state = {
          ...this.state,
          token,
          user: UserEntity.fromJSON(userData),
          sessionId,
          isAuthenticated: true,
          lastCheck: Date.now()
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error)
    }
  }

  private async validateCurrentAuth(): Promise<void> {
    try {
      this.state.isLoading = true
      this.notifyStateChange()

      const response = await this.authApi.getCurrentUser()
      
      if (response.data) {
        this.state.user = UserEntity.fromJSON(response.data)
        this.state.isAuthenticated = true
        await this.storageService.setItem(this.STORAGE_KEYS.USER_DATA, this.state.user.toJSON())
      } else {
        await this.clearAuth()
      }
    } catch (error) {
      console.error('Auth validation failed:', error)
      await this.clearAuth()
    } finally {
      this.state.isLoading = false
      this.notifyStateChange()
    }
  }

  private async saveAuthState(
    token: string, 
    user: User, 
    sessionId?: string,
    refreshToken?: string
  ): Promise<void> {
    await Promise.all([
      this.storageService.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, token),
      this.storageService.setItem(this.STORAGE_KEYS.USER_DATA, user),
      sessionId ? this.storageService.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId) : Promise.resolve(),
      refreshToken ? this.storageService.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken) : Promise.resolve()
    ])
  }

  private async clearStoredAuth(): Promise<void> {
    await Promise.all([
      this.storageService.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN),
      this.storageService.removeItem(this.STORAGE_KEYS.USER_DATA),
      this.storageService.removeItem(this.STORAGE_KEYS.SESSION_ID),
      this.storageService.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN)
    ])
  }

  private notifyStateChange(): void {
    this.eventBus.publish(AUTH_EVENTS.AUTH_STATE_CHANGED, {
      ...this.state,
      lastCheck: Date.now()
    })
  }

  private startTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    // 每25分钟刷新一次token（假设token有效期30分钟）
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshToken()
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.eventBus.publish(AUTH_EVENTS.SESSION_EXPIRED, error)
      }
    }, 25 * 60 * 1000)
  }

  private stopTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  // 接口实现

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      this.state.isLoading = true
      this.notifyStateChange()

      const response = await this.authApi.login(credentials)
      
      if (response.data) {
        const { access_token, user, session_id, refresh_token } = response.data
        const userEntity = UserEntity.fromJSON(user)

        // 更新状态
        this.state = {
          ...this.state,
          user: userEntity,
          token: access_token,
          sessionId: session_id || null,
          isAuthenticated: true,
          lastCheck: Date.now()
        }

        // 保存到存储
        await this.saveAuthState(access_token, userEntity.toJSON(), session_id, refresh_token)

        // 启动token刷新定时器
        this.startTokenRefreshTimer()

        // 获取会话详情
        if (session_id) {
          await this.fetchSessionDetails()
        }

        const result: LoginResult = {
          success: true,
          user: userEntity.toJSON(),
          token: access_token,
          sessionId: session_id
        }

        this.eventBus.publish(AUTH_EVENTS.LOGIN_SUCCESS, result)
        this.notifyStateChange()

        return result
      } else {
        const result: LoginResult = {
          success: false,
          error: response.error || '登录失败'
        }

        this.eventBus.publish(AUTH_EVENTS.LOGIN_FAILED, result)
        return result
      }
    } catch (error) {
      const result: LoginResult = {
        success: false,
        error: error instanceof Error ? error.message : '登录失败'
      }

      this.eventBus.publish(AUTH_EVENTS.LOGIN_FAILED, result)
      return result
    } finally {
      this.state.isLoading = false
      this.notifyStateChange()
    }
  }

  async logout(): Promise<void> {
    try {
      this.state.isLoading = true
      this.notifyStateChange()

      // 调用服务端登出接口
      await this.authApi.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      await this.clearAuth()
      this.eventBus.publish(AUTH_EVENTS.LOGOUT)
      this.notifyStateChange()
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.state.isAuthenticated || !this.state.token) {
      return null
    }

    try {
      const response = await this.authApi.getCurrentUser()
      
      if (response.data) {
        const userEntity = UserEntity.fromJSON(response.data)
        this.state.user = userEntity
        await this.storageService.setItem(this.STORAGE_KEYS.USER_DATA, userEntity.toJSON())
        return userEntity.toJSON()
      }
      
      return null
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    if (!this.state.token) {
      return false
    }

    try {
      const user = await this.getCurrentUser()
      const isValid = user !== null
      
      this.state.isAuthenticated = isValid
      this.state.lastCheck = Date.now()
      
      if (!isValid) {
        await this.clearAuth()
      }
      
      this.notifyStateChange()
      return isValid
    } catch (error) {
      console.error('Auth status check failed:', error)
      await this.clearAuth()
      this.notifyStateChange()
      return false
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.storageService.getItem<string>(this.STORAGE_KEYS.REFRESH_TOKEN)
      const response = await this.authApi.refreshToken(refreshToken)
      
      if (response.data?.access_token) {
        const newToken = response.data.access_token
        this.state.token = newToken
        await this.storageService.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, newToken)
        
        if (response.data.refresh_token) {
          await this.storageService.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh_token)
        }
        
        this.eventBus.publish(AUTH_EVENTS.TOKEN_REFRESHED, { token: newToken })
        return newToken
      }
      
      return null
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw new AuthError('Token refresh failed')
    }
  }

  async getSessionDetails(): Promise<SessionDetails | null> {
    if (!this.state.sessionId) {
      return null
    }

    return this.state.sessionDetails
  }

  private async fetchSessionDetails(): Promise<void> {
    try {
      const response = await this.authApi.getSessionDetails()
      
      if (response.data?.is_valid && response.data.session_info) {
        this.state.sessionDetails = response.data.session_info
        this.state.sessionId = response.data.session_info.session_id
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error)
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await this.authApi.validateToken(token)
      return response.data?.valid ?? false
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }

  getToken(): string | null {
    return this.state.token
  }

  setToken(token: string): void {
    this.state.token = token
    this.storageService.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, token)
    this.notifyStateChange()
  }

  async clearAuth(): Promise<void> {
    this.stopTokenRefreshTimer()
    
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      sessionId: null,
      sessionDetails: null,
      lastCheck: Date.now()
    }

    await this.clearStoredAuth()
    this.notifyStateChange()
  }

  // 扩展功能

  /**
   * 获取当前认证状态
   */
  getAuthState(): AuthState {
    return { ...this.state }
  }

  /**
   * 检查用户是否有指定权限
   */
  hasPermission(permission: string): boolean {
    if (!this.state.user) return false
    const userEntity = UserEntity.fromJSON(this.state.user)
    return userEntity.hasPermission(permission)
  }

  /**
   * 检查用户是否为管理员
   */
  isAdmin(): boolean {
    if (!this.state.user) return false
    const userEntity = UserEntity.fromJSON(this.state.user)
    return userEntity.isAdmin()
  }

  /**
   * 检查用户是否有指定角色
   */
  hasRole(roleName: string): boolean {
    if (!this.state.user) return false
    const userEntity = UserEntity.fromJSON(this.state.user)
    return userEntity.hasRole(roleName)
  }
}