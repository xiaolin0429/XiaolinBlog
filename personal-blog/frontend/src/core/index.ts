/**
 * 核心层导出文件
 * 统一导出所有接口契约、实体和错误类型
 */

// 接口契约
export * from './contracts/IAuthService'
export * from './contracts/IHttpClient'
export * from './contracts/IStateManager'
export * from './contracts/IStorageService'
export * from './contracts/IEventBus'

// 实体
export * from './entities/User'
export * from './entities/SiteConfig'

// 错误
export * from './errors/ApplicationError'