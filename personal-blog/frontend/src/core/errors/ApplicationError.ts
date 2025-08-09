/**
 * 应用程序错误基类
 * 提供统一的错误处理模式
 */

export enum ErrorCode {
  // 通用错误
  UNKNOWN = 'UNKNOWN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // 认证相关错误
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  
  // API相关错误
  API_ERROR = 'API_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_SERVER_ERROR = 'API_SERVER_ERROR',
  
  // 存储相关错误
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  
  // 业务逻辑错误
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 配置相关错误
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_VALIDATION_ERROR = 'CONFIG_VALIDATION_ERROR'
}

export interface ErrorContext {
  [key: string]: any
}

export class ApplicationError extends Error {
  public readonly code: ErrorCode
  public readonly context: ErrorContext
  public readonly timestamp: Date
  public readonly stackTrace?: string

  constructor(
    code: ErrorCode,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message)
    this.name = 'ApplicationError'
    this.code = code
    this.context = context
    this.timestamp = new Date()
    this.stackTrace = this.stack
    
    // 保持原始错误的堆栈信息
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }

  /**
   * 序列化错误信息
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stackTrace
    }
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserMessage(): string {
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.UNKNOWN]: '发生了未知错误，请稍后重试',
      [ErrorCode.NETWORK_ERROR]: '网络连接异常，请检查网络后重试',
      [ErrorCode.VALIDATION_ERROR]: '输入信息有误，请检查后重新提交',
      [ErrorCode.AUTH_REQUIRED]: '请先登录',
      [ErrorCode.AUTH_INVALID]: '用户名或密码错误',
      [ErrorCode.AUTH_EXPIRED]: '登录已过期，请重新登录',
      [ErrorCode.AUTH_FORBIDDEN]: '无权限执行此操作',
      [ErrorCode.API_ERROR]: '服务异常，请稍后重试',
      [ErrorCode.API_TIMEOUT]: '请求超时，请稍后重试',
      [ErrorCode.API_NOT_FOUND]: '请求的资源不存在',
      [ErrorCode.API_SERVER_ERROR]: '服务器内部错误，请联系管理员',
      [ErrorCode.STORAGE_ERROR]: '本地存储异常',
      [ErrorCode.STORAGE_QUOTA_EXCEEDED]: '存储空间不足',
      [ErrorCode.BUSINESS_LOGIC_ERROR]: '操作失败，请检查输入信息',
      [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
      [ErrorCode.RESOURCE_CONFLICT]: '资源冲突，请刷新后重试',
      [ErrorCode.CONFIG_ERROR]: '配置错误',
      [ErrorCode.CONFIG_VALIDATION_ERROR]: '配置验证失败'
    }

    return userMessages[this.code] || this.message
  }

  /**
   * 检查是否为指定错误类型
   */
  is(code: ErrorCode): boolean {
    return this.code === code
  }

  /**
   * 检查是否为认证相关错误
   */
  isAuthError(): boolean {
    return [
      ErrorCode.AUTH_REQUIRED,
      ErrorCode.AUTH_INVALID,
      ErrorCode.AUTH_EXPIRED,
      ErrorCode.AUTH_FORBIDDEN
    ].includes(this.code)
  }

  /**
   * 检查是否为网络相关错误
   */
  isNetworkError(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.API_TIMEOUT,
      ErrorCode.API_ERROR,
      ErrorCode.API_SERVER_ERROR
    ].includes(this.code)
  }
}

/**
 * 认证错误
 */
export class AuthError extends ApplicationError {
  constructor(message: string, context: ErrorContext = {}) {
    super(ErrorCode.AUTH_INVALID, message, context)
    this.name = 'AuthError'
  }
}

/**
 * 验证错误
 */
export class ValidationError extends ApplicationError {
  public readonly field?: string
  public readonly rules?: string[]

  constructor(
    message: string, 
    field?: string, 
    rules?: string[], 
    context: ErrorContext = {}
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, { ...context, field, rules })
    this.name = 'ValidationError'
    this.field = field
    this.rules = rules
  }
}

/**
 * 网络错误
 */
export class NetworkError extends ApplicationError {
  public readonly status?: number
  public readonly url?: string

  constructor(
    message: string, 
    status?: number, 
    url?: string, 
    context: ErrorContext = {}
  ) {
    super(ErrorCode.NETWORK_ERROR, message, { ...context, status, url })
    this.name = 'NetworkError'
    this.status = status
    this.url = url
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessLogicError extends ApplicationError {
  constructor(message: string, context: ErrorContext = {}) {
    super(ErrorCode.BUSINESS_LOGIC_ERROR, message, context)
    this.name = 'BusinessLogicError'
  }
}

/**
 * 配置错误
 */
export class ConfigError extends ApplicationError {
  public readonly configKey?: string

  constructor(message: string, configKey?: string, context: ErrorContext = {}) {
    super(ErrorCode.CONFIG_ERROR, message, { ...context, configKey })
    this.name = 'ConfigError'
    this.configKey = configKey
  }
}