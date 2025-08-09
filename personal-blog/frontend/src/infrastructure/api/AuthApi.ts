/**
 * 认证API实现
 * 处理所有认证相关的API调用
 */

import { IHttpClient, ApiResponse } from '../../core/contracts/IHttpClient'
import { 
  IAuthService, 
  LoginCredentials, 
  LoginResult, 
  SessionDetails 
} from '../../core/contracts/IAuthService'
import { User, UserEntity } from '../../core/entities/User'
import { 
  AuthError, 
  NetworkError, 
  ApplicationError,
  ErrorCode 
} from '../../core/errors/ApplicationError'

export interface UserRegistration {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  new_password: string
}

export interface TokenRefreshResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export class AuthApi {
  private httpClient: IHttpClient
  private readonly endpoints = {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    currentUser: '/auth/me',
    refreshToken: '/auth/refresh',
    validateToken: '/auth/validate',
    sessionDetails: '/session/validate',
    passwordReset: '/auth/password-reset',
    passwordResetConfirm: '/auth/password-reset/confirm'
  }

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{
    access_token: string
    refresh_token?: string
    user: User
    session_id?: string
  }>> {
    try {
      const response = await this.httpClient.post<{
        access_token: string
        refresh_token?: string
        user: User
        session_id?: string
      }>(this.endpoints.login, credentials)

      if (!response.data) {
        throw new AuthError(response.error || '登录失败')
      }

      // 转换用户数据为实体
      if (response.data.user) {
        response.data.user = UserEntity.fromJSON(response.data.user).toJSON()
      }

      return response
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('登录请求失败', { originalError: error })
    }
  }

  /**
   * 用户注册
   */
  async register(userData: UserRegistration): Promise<ApiResponse<{
    message: string
    user: User
  }>> {
    try {
      const response = await this.httpClient.post<{
        message: string
        user: User
      }>(this.endpoints.register, userData)

      if (response.data?.user) {
        response.data.user = UserEntity.fromJSON(response.data.user).toJSON()
      }

      return response
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('注册请求失败', { originalError: error })
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.httpClient.post<{ message: string }>(this.endpoints.logout)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('登出请求失败', { originalError: error })
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.httpClient.get<User>(this.endpoints.currentUser)

      if (response.data) {
        response.data = UserEntity.fromJSON(response.data).toJSON()
      }

      return response
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('获取用户信息失败', { originalError: error })
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken?: string): Promise<ApiResponse<TokenRefreshResponse>> {
    try {
      const data = refreshToken ? { refresh_token: refreshToken } : undefined
      return await this.httpClient.post<TokenRefreshResponse>(this.endpoints.refreshToken, data)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('令牌刷新失败', { originalError: error })
    }
  }

  /**
   * 验证令牌有效性
   */
  async validateToken(token: string): Promise<ApiResponse<{
    valid: boolean
    user?: User
    expires_at?: string
  }>> {
    try {
      const response = await this.httpClient.post<{
        valid: boolean
        user?: User
        expires_at?: string
      }>(this.endpoints.validateToken, { token })

      if (response.data?.user) {
        response.data.user = UserEntity.fromJSON(response.data.user).toJSON()
      }

      return response
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('令牌验证失败', { originalError: error })
    }
  }

  /**
   * 获取会话详情
   */
  async getSessionDetails(): Promise<ApiResponse<{
    is_valid: boolean
    session_info?: SessionDetails
    error_message?: string
  }>> {
    try {
      return await this.httpClient.get<{
        is_valid: boolean
        session_info?: SessionDetails
        error_message?: string
      }>(this.endpoints.sessionDetails)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('获取会话信息失败', { originalError: error })
    }
  }

  /**
   * 请求密码重置
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<{
    message: string
  }>> {
    try {
      return await this.httpClient.post<{
        message: string
      }>(this.endpoints.passwordReset, data)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('密码重置请求失败', { originalError: error })
    }
  }

  /**
   * 确认密码重置
   */
  async confirmPasswordReset(data: PasswordReset): Promise<ApiResponse<{
    message: string
  }>> {
    try {
      return await this.httpClient.post<{
        message: string
      }>(this.endpoints.passwordResetConfirm, data)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('密码重置确认失败', { originalError: error })
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.httpClient.patch<User>('/auth/profile', updates)

      if (response.data) {
        response.data = UserEntity.fromJSON(response.data).toJSON()
      }

      return response
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('更新用户资料失败', { originalError: error })
    }
  }

  /**
   * 修改密码
   */
  async changePassword(data: {
    current_password: string
    new_password: string
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.httpClient.post<{ message: string }>('/auth/change-password', data)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new AuthError('修改密码失败', { originalError: error })
    }
  }
}