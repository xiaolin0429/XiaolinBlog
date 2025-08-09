/**
 * 应用程序引导和依赖注入初始化
 * 设置全局依赖注入容器
 */

import { DIContainer } from './container/DIContainer'
import { SERVICE_TOKENS, ApiConfig, AppConfig } from './container/types'
import { HttpClient } from './infrastructure/api/HttpClient'
import { EventBusService } from './infrastructure/services/EventBusService'
import { LocalStorageService, SessionStorageService } from './infrastructure/storage/StorageService'
import { AuthApi } from './infrastructure/api/AuthApi'
import { ConfigApi } from './infrastructure/api/ConfigApi'
import { AuthService } from './infrastructure/services/AuthService'
import { LoginUseCase } from './application/usecases/LoginUseCase'
import { ConfigManagementUseCase } from './application/usecases/ConfigManagementUseCase'

// 全局容器实例
let container: DIContainer | null = null

/**
 * 初始化依赖注入容器
 */
export async function initializeContainer(): Promise<DIContainer> {
  if (container) {
    return container
  }

  container = new DIContainer()

  // 配置服务
  const apiConfig: ApiConfig = {
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000,
    enableLogging: process.env.NODE_ENV === 'development'
  }

  const appConfig: AppConfig = {
    isDevelopment: process.env.NODE_ENV === 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    features: {
      enableAnalytics: false,
      enableDebugMode: process.env.NODE_ENV === 'development'
    }
  }

  // 注册配置
  container.registerInstance(SERVICE_TOKENS.API_CONFIG, apiConfig)
  container.registerInstance(SERVICE_TOKENS.APP_CONFIG, appConfig)

  // 注册核心服务 - 不依赖其他服务
  container.registerSingleton(SERVICE_TOKENS.HTTP_CLIENT, {
    create: () => new HttpClient(apiConfig),
    dependencies: [] // 明确指定无依赖
  })

  container.registerSingleton(SERVICE_TOKENS.EVENT_BUS, {
    create: () => new EventBusService(),
    dependencies: []
  })

  container.registerSingleton(SERVICE_TOKENS.STORAGE_SERVICE, {
    create: () => new LocalStorageService(),
    dependencies: []
  })

  container.registerSingleton(SERVICE_TOKENS.SESSION_STORAGE_SERVICE, {
    create: () => new SessionStorageService(),
    dependencies: []
  })

  // 注册API服务 - 依赖HttpClient
  container.registerSingleton(SERVICE_TOKENS.AUTH_API, {
    create: async (container) => {
      const httpClient = await container.resolve(SERVICE_TOKENS.HTTP_CLIENT) as any
      return new AuthApi(httpClient)
    },
    dependencies: [SERVICE_TOKENS.HTTP_CLIENT]
  })

  container.registerSingleton(SERVICE_TOKENS.CONFIG_API, {
    create: async (container) => {
      const httpClient = await container.resolve(SERVICE_TOKENS.HTTP_CLIENT) as any
      return new ConfigApi(httpClient)
    },
    dependencies: [SERVICE_TOKENS.HTTP_CLIENT]
  })

  // 注册业务服务
  container.registerSingleton(SERVICE_TOKENS.AUTH_SERVICE, {
    create: async (container) => {
      const authApi = await container.resolve(SERVICE_TOKENS.AUTH_API) as any
      const storageService = await container.resolve(SERVICE_TOKENS.STORAGE_SERVICE) as any
      const eventBus = await container.resolve(SERVICE_TOKENS.EVENT_BUS) as any
      return new AuthService(authApi, storageService, eventBus)
    },
    dependencies: [SERVICE_TOKENS.AUTH_API, SERVICE_TOKENS.STORAGE_SERVICE, SERVICE_TOKENS.EVENT_BUS]
  })

  // 注册用例
  container.registerSingleton(SERVICE_TOKENS.LOGIN_USE_CASE, {
    create: async (container) => {
      const authService = await container.resolve(SERVICE_TOKENS.AUTH_SERVICE) as any
      const eventBus = await container.resolve(SERVICE_TOKENS.EVENT_BUS) as any
      return new LoginUseCase(authService, eventBus)
    },
    dependencies: [SERVICE_TOKENS.AUTH_SERVICE, SERVICE_TOKENS.EVENT_BUS]
  })

  container.registerSingleton(SERVICE_TOKENS.CONFIG_MANAGEMENT_USE_CASE, {
    create: async (container) => {
      const configApi = await container.resolve(SERVICE_TOKENS.CONFIG_API) as any
      const eventBus = await container.resolve(SERVICE_TOKENS.EVENT_BUS) as any
      return new ConfigManagementUseCase(configApi, eventBus)
    },
    dependencies: [SERVICE_TOKENS.CONFIG_API, SERVICE_TOKENS.EVENT_BUS]
  })

  // 分步初始化服务，避免批量预热导致的循环依赖
  try {
    // 先初始化基础服务
    await container.resolve(SERVICE_TOKENS.HTTP_CLIENT)
    await container.resolve(SERVICE_TOKENS.EVENT_BUS)
    await container.resolve(SERVICE_TOKENS.STORAGE_SERVICE)
    await container.resolve(SERVICE_TOKENS.SESSION_STORAGE_SERVICE)

    // 然后初始化API服务
    await container.resolve(SERVICE_TOKENS.AUTH_API)
    await container.resolve(SERVICE_TOKENS.CONFIG_API)

    // 接着初始化业务服务
    await container.resolve(SERVICE_TOKENS.AUTH_SERVICE)

    // 最后初始化用例
    await container.resolve(SERVICE_TOKENS.LOGIN_USE_CASE)
    const configManagementUseCase = await container.resolve(SERVICE_TOKENS.CONFIG_MANAGEMENT_USE_CASE) as any

    // 设置全局访问
    if (typeof window !== 'undefined') {
      globalThis.configManagementUseCase = configManagementUseCase
    }

    console.log('依赖注入容器初始化完成', container.getDebugInfo())
  } catch (error) {
    console.error('依赖注入容器初始化失败:', error)
    throw error
  }

  return container
}

/**
 * 获取容器实例
 */
export function getContainer(): DIContainer {
  if (!container) {
    throw new Error('容器尚未初始化，请先调用 initializeContainer()')
  }
  return container
}

/**
 * 释放容器资源
 */
export function disposeContainer(): void {
  if (container) {
    container.clear()
    container = null
    
    // 清理全局对象
    if (typeof window !== 'undefined') {
      delete (globalThis as any).configManagementUseCase
    }
  }
}