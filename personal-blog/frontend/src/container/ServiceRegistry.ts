/**
 * 服务注册表
 * 统一配置所有服务的注册信息
 */

import { DIContainer } from './DIContainer'
import { SERVICE_TOKENS, ApiConfig, AppConfig } from './types'

export class ServiceRegistry {
  private container: DIContainer

  constructor(container: DIContainer) {
    this.container = container
  }

  /**
   * 注册所有核心服务
   */
  registerCoreServices(): void {
    this.registerConfigurations()
    this.registerInfrastructure()
    this.registerUseCases()
  }

  /**
   * 注册配置
   */
  private registerConfigurations(): void {
    // API配置
    this.container.registerInstance(SERVICE_TOKENS.API_CONFIG, {
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
      timeout: 30000,
      enableLogging: process.env.NODE_ENV === 'development'
    } as ApiConfig)

    // 应用配置
    this.container.registerInstance(SERVICE_TOKENS.APP_CONFIG, {
      isDevelopment: process.env.NODE_ENV === 'development',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      features: {
        enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
        enableDebugMode: process.env.NODE_ENV === 'development'
      }
    } as AppConfig)
  }

  /**
   * 注册基础设施层服务
   */
  private registerInfrastructure(): void {
    // 存储服务
    this.container.registerSingleton(
      SERVICE_TOKENS.STORAGE_SERVICE,
      {
        create: async () => {
          const { LocalStorageService } = await import('../infrastructure/storage/StorageService')
          return new LocalStorageService('app_')
        }
      }
    )

    this.container.registerSingleton(
      SERVICE_TOKENS.SESSION_STORAGE_SERVICE,
      {
        create: async () => {
          const { SessionStorageService } = await import('../infrastructure/storage/StorageService')
          return new SessionStorageService('app_session_')
        }
      }
    )

    // 事件总线
    this.container.registerSingleton(
      SERVICE_TOKENS.EVENT_BUS,
      {
        create: async () => {
          const { EventBusService } = await import('../infrastructure/services/EventBusService')
          return new EventBusService({
            maxListeners: 100,
            enableLogging: process.env.NODE_ENV === 'development'
          })
        }
      }
    )

    // HTTP客户端
    this.container.registerSingleton(
      SERVICE_TOKENS.HTTP_CLIENT,
      {
        create: async (container) => {
          const config = container.resolveSync(SERVICE_TOKENS.API_CONFIG)
          const { HttpClient } = await import('../infrastructure/api/HttpClient')
          
          const httpClient = new HttpClient(config)
          
          // 添加认证拦截器
          httpClient.addRequestInterceptor((requestConfig) => {
            // 从localStorage获取token
            const token = localStorage.getItem('access_token')
            if (token) {
              requestConfig.headers = {
                ...requestConfig.headers,
                'Authorization': `Bearer ${token}`
              }
            }
            return requestConfig
          })

          return httpClient
        },
        dependencies: [SERVICE_TOKENS.API_CONFIG]
      }
    )

    // API服务
    this.container.registerSingleton(
      SERVICE_TOKENS.AUTH_API,
      {
        create: async (container) => {
          const httpClient = await container.resolve(SERVICE_TOKENS.HTTP_CLIENT)
          const { AuthApi } = await import('../infrastructure/api/AuthApi')
          return new AuthApi(httpClient)
        },
        dependencies: [SERVICE_TOKENS.HTTP_CLIENT]
      }
    )

    this.container.registerSingleton(
      SERVICE_TOKENS.CONFIG_API,
      {
        create: async (container) => {
          const httpClient = await container.resolve(SERVICE_TOKENS.HTTP_CLIENT)
          const { ConfigApi } = await import('../infrastructure/api/ConfigApi')
          return new ConfigApi(httpClient)
        },
        dependencies: [SERVICE_TOKENS.HTTP_CLIENT]
      }
    )

    // 认证服务
    this.container.registerSingleton(
      SERVICE_TOKENS.AUTH_SERVICE,
      {
        create: async (container) => {
          const [authApi, storageService, eventBus] = await Promise.all([
            container.resolve(SERVICE_TOKENS.AUTH_API),
            container.resolve(SERVICE_TOKENS.STORAGE_SERVICE),
            container.resolve(SERVICE_TOKENS.EVENT_BUS)
          ])
          
          const { AuthService } = await import('../infrastructure/services/AuthService')
          return new AuthService(authApi, storageService, eventBus)
        },
        dependencies: [
          SERVICE_TOKENS.AUTH_API,
          SERVICE_TOKENS.STORAGE_SERVICE,
          SERVICE_TOKENS.EVENT_BUS
        ]
      }
    )
  }

  /**
   * 注册用例层服务
   */
  private registerUseCases(): void {
    // 登录用例
    this.container.registerSingleton(
      SERVICE_TOKENS.LOGIN_USE_CASE,
      {
        create: async (container) => {
          const [authService, eventBus] = await Promise.all([
            container.resolve(SERVICE_TOKENS.AUTH_SERVICE),
            container.resolve(SERVICE_TOKENS.EVENT_BUS)
          ])
          
          const { LoginUseCase } = await import('../application/usecases/LoginUseCase')
          return new LoginUseCase(authService, eventBus)
        },
        dependencies: [
          SERVICE_TOKENS.AUTH_SERVICE,
          SERVICE_TOKENS.EVENT_BUS
        ]
      }
    )

    // 配置管理用例
    this.container.registerSingleton(
      SERVICE_TOKENS.CONFIG_MANAGEMENT_USE_CASE,
      {
        create: async (container) => {
          const [configApi, eventBus] = await Promise.all([
            container.resolve(SERVICE_TOKENS.CONFIG_API),
            container.resolve(SERVICE_TOKENS.EVENT_BUS)
          ])
          
          const { ConfigManagementUseCase } = await import('../application/usecases/ConfigManagementUseCase')
          return new ConfigManagementUseCase(configApi, eventBus)
        },
        dependencies: [
          SERVICE_TOKENS.CONFIG_API,
          SERVICE_TOKENS.EVENT_BUS
        ]
      }
    )
  }

  /**
   * 注册开发模式专用服务
   */
  registerDevServices(): void {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // 开发工具可以在这里注册
    console.log('🔧 Development services registered')
  }

  /**
   * 获取容器实例
   */
  getContainer(): DIContainer {
    return this.container
  }
}