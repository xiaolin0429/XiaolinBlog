/**
 * 登录用例
 * 处理用户登录的业务逻辑
 */

import { IAuthService, LoginCredentials, LoginResult } from '../../core/contracts/IAuthService'
import { IEventBus } from '../../core/contracts/IEventBus'
import { User } from '../../core/entities/User'
import { 
  ValidationError, 
  ApplicationError,
  ErrorCode 
} from '../../core/errors/ApplicationError'

export interface LoginUseCaseResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export class LoginUseCase {
  constructor(
    private authService: IAuthService,
    private eventBus: IEventBus
  ) {}

  /**
   * 执行登录
   */
  async execute(credentials: LoginCredentials): Promise<LoginUseCaseResult> {
    try {
      // 1. 验证输入
      this.validateCredentials(credentials)

      // 2. 执行登录
      const result = await this.authService.login(credentials)

      // 3. 处理结果
      if (result.success && result.user) {
        // 发布登录成功事件
        await this.eventBus.publish('user.logged_in', {
          userId: result.user.id,
          username: result.user.username,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          user: result.user,
          token: result.token
        }
      } else {
        // 记录登录失败
        await this.eventBus.publish('user.login_failed', {
          username: credentials.username,
          error: result.error,
          timestamp: new Date().toISOString()
        })

        return {
          success: false,
          error: result.error || '登录失败'
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.getUserMessage()
        }
      }

      return {
        success: false,
        error: '登录过程中发生错误'
      }
    }
  }

  /**
   * 验证登录凭据
   */
  private validateCredentials(credentials: LoginCredentials): void {
    const errors: string[] = []

    if (!credentials.username?.trim()) {
      errors.push('用户名不能为空')
    } else if (credentials.username.length < 3) {
      errors.push('用户名长度不能少于3个字符')
    } else if (credentials.username.length > 50) {
      errors.push('用户名长度不能超过50个字符')
    }

    if (!credentials.password?.trim()) {
      errors.push('密码不能为空')
    } else if (credentials.password.length < 6) {
      errors.push('密码长度不能少于6个字符')
    } else if (credentials.password.length > 128) {
      errors.push('密码长度不能超过128个字符')
    }

    if (errors.length > 0) {
      throw new ValidationError(
        errors.join('; '),
        undefined,
        errors
      )
    }
  }

  /**
   * 检查用户名是否有效
   */
  private isValidUsername(username: string): boolean {
    // 用户名规则：只能包含字母、数字、下划线和连字符
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    return usernameRegex.test(username)
  }

  /**
   * 检查密码强度
   */
  private validatePasswordStrength(password: string): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!/[a-z]/.test(password)) {
      issues.push('密码必须包含小写字母')
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('密码必须包含大写字母')
    }

    if (!/[0-9]/.test(password)) {
      issues.push('密码必须包含数字')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      issues.push('密码必须包含特殊字符')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}