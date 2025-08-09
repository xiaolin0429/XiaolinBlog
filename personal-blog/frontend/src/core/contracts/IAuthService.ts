/**
 * 认证服务接口契约
 * 定义认证相关的所有操作标准
 */

import { User } from '../entities/User'

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  user?: User
  token?: string
  sessionId?: string
  error?: string
}

export interface SessionDetails {
  session_id: string
  user_id: number
  created_at: string
  expires_at: string
  metadata: Record<string, any>
}

export interface IAuthService {
  /**
   * 用户登录
   */
  login(credentials: LoginCredentials): Promise<LoginResult>
  
  /**
   * 用户登出
   */
  logout(): Promise<void>
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<User | null>
  
  /**
   * 检查认证状态
   */
  checkAuthStatus(): Promise<boolean>
  
  /**
   * 刷新令牌
   */
  refreshToken(): Promise<string | null>
  
  /**
   * 获取会话详情
   */
  getSessionDetails(): Promise<SessionDetails | null>
  
  /**
   * 验证令牌有效性
   */
  validateToken(token: string): Promise<boolean>
  
  /**
   * 获取当前令牌
   */
  getToken(): string | null
  
  /**
   * 设置令牌
   */
  setToken(token: string): void
  
  /**
   * 清除认证信息
   */
  clearAuth(): void
}