/**
 * 服务标识符常量
 * 定义所有服务的注入标识符
 */

export const SERVICE_TOKENS = {
  // 核心服务
  HTTP_CLIENT: Symbol('HttpClient'),
  EVENT_BUS: Symbol('EventBus'),
  STORAGE_SERVICE: Symbol('StorageService'),
  SESSION_STORAGE_SERVICE: Symbol('SessionStorageService'),
  
  // API服务
  AUTH_API: Symbol('AuthApi'),
  CONFIG_API: Symbol('ConfigApi'),
  
  // 业务服务
  AUTH_SERVICE: Symbol('AuthService'),
  
  // 用例
  LOGIN_USE_CASE: Symbol('LoginUseCase'),
  CONFIG_MANAGEMENT_USE_CASE: Symbol('ConfigManagementUseCase'),
  
  // 配置
  API_CONFIG: Symbol('ApiConfig'),
  APP_CONFIG: Symbol('AppConfig')
} as const

export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS]

// 服务标识符类型映射
export interface ServiceMap {
  [SERVICE_TOKENS.HTTP_CLIENT]: import('../infrastructure/api/HttpClient').HttpClient
  [SERVICE_TOKENS.EVENT_BUS]: import('../infrastructure/services/EventBusService').EventBusService
  [SERVICE_TOKENS.STORAGE_SERVICE]: import('../infrastructure/storage/StorageService').LocalStorageService
  [SERVICE_TOKENS.SESSION_STORAGE_SERVICE]: import('../infrastructure/storage/StorageService').SessionStorageService
  [SERVICE_TOKENS.AUTH_API]: import('../infrastructure/api/AuthApi').AuthApi
  [SERVICE_TOKENS.CONFIG_API]: import('../infrastructure/api/ConfigApi').ConfigApi
  [SERVICE_TOKENS.AUTH_SERVICE]: import('../infrastructure/services/AuthService').AuthService
  [SERVICE_TOKENS.LOGIN_USE_CASE]: import('../application/usecases/LoginUseCase').LoginUseCase
  [SERVICE_TOKENS.CONFIG_MANAGEMENT_USE_CASE]: import('../application/usecases/ConfigManagementUseCase').ConfigManagementUseCase
  [SERVICE_TOKENS.API_CONFIG]: ApiConfig
  [SERVICE_TOKENS.APP_CONFIG]: AppConfig
}

// 配置接口
export interface ApiConfig {
  baseURL: string
  timeout: number
  enableLogging: boolean
}

export interface AppConfig {
  isDevelopment: boolean
  version: string
  features: {
    enableAnalytics: boolean
    enableDebugMode: boolean
  }
}