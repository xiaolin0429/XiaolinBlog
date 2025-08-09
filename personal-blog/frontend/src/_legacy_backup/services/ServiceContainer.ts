/**
 * 服务容器 - 依赖注入系统
 * 解耦服务创建和使用，提供统一的服务管理
 */

import { eventBus, EventBus } from './EventBus'
import { domManager, DOMManager } from './DOMManager'

// 服务接口
export interface IService {
  name: string
  initialize?(): Promise<void>
  dispose?(): Promise<void>
}

// 服务工厂接口
export interface ServiceFactory<T = any> {
  create(): T | Promise<T>
  singleton?: boolean
}

// 服务元数据
export interface ServiceMetadata {
  name: string
  singleton: boolean
  instance?: any
  factory: ServiceFactory
  dependencies: string[]
  initialized: boolean
}

// 预定义的服务标识符
export const ServiceTokens = {
  EVENT_BUS: 'EventBus',
  DOM_MANAGER: 'DOMManager',
  AUTH_SERVICE: 'AuthService',
  CONFIG_SERVICE: 'ConfigService',
  API_CLIENT: 'ApiClient',
  STORAGE_SERVICE: 'StorageService',
  NOTIFICATION_SERVICE: 'NotificationService',
  ROUTER_SERVICE: 'RouterService',
  THEME_SERVICE: 'ThemeService',
  ANALYTICS_SERVICE: 'AnalyticsService'
} as const

// API客户端服务
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
  status: number
}

export class ApiClient implements IService {
  name = 'ApiClient'
  private baseUrl: string = ''
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  async initialize() {
    // 初始化API客户端
    console.log('ApiClient initialized')
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders }
    const token = this.getAuthToken()
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl + url, {
        method: 'GET',
        headers: this.buildHeaders(headers)
      })

      const data = await response.json()

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || 'Request failed',
        success: response.ok,
        status: response.status
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
        status: 0
      }
    }
  }

  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl + url, {
        method: 'POST',
        headers: this.buildHeaders(headers),
        body: JSON.stringify(body)
      })

      const data = await response.json()

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || 'Request failed',
        success: response.ok,
        status: response.status
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
        status: 0
      }
    }
  }

  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl + url, {
        method: 'PUT',
        headers: this.buildHeaders(headers),
        body: JSON.stringify(body)
      })

      const data = await response.json()

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || 'Request failed',
        success: response.ok,
        status: response.status
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
        status: 0
      }
    }
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl + url, {
        method: 'DELETE',
        headers: this.buildHeaders(headers)
      })

      const data = response.status !== 204 ? await response.json() : null

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data?.detail || 'Delete failed'),
        success: response.ok,
        status: response.status
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
        status: 0
      }
    }
  }
}

// 存储服务
export class StorageService implements IService {
  name = 'StorageService'

  async initialize() {
    console.log('StorageService initialized')
  }

  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  getItem<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue || null
      
      return JSON.parse(item)
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return defaultValue || null
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key)
  }

  clear(): void {
    localStorage.clear()
  }

  // Session Storage methods
  setSessionItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      sessionStorage.setItem(key, serialized)
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error)
    }
  }

  getSessionItem<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key)
      if (item === null) return defaultValue || null
      
      return JSON.parse(item)
    } catch (error) {
      console.error('Failed to read from sessionStorage:', error)
      return defaultValue || null
    }
  }

  removeSessionItem(key: string): void {
    sessionStorage.removeItem(key)
  }
}

// 服务容器类
export class ServiceContainer {
  private static instance: ServiceContainer
  private services: Map<string, ServiceMetadata> = new Map()
  private instances: Map<string, any> = new Map()

  private constructor() {
    // 注册核心服务
    this.registerCoreServices()
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  /**
   * 注册核心系统服务
   */
  private registerCoreServices(): void {
    // 注册EventBus
    this.register(ServiceTokens.EVENT_BUS, {
      create: () => eventBus,
      singleton: true
    })

    // 注册DOMManager
    this.register(ServiceTokens.DOM_MANAGER, {
      create: () => domManager,
      singleton: true
    })

    // 注册ApiClient
    this.register(ServiceTokens.API_CLIENT, {
      create: () => new ApiClient(),
      singleton: true
    })

    // 注册StorageService
    this.register(ServiceTokens.STORAGE_SERVICE, {
      create: () => new StorageService(),
      singleton: true
    })
  }

  /**
   * 注册服务
   */
  register<T>(
    token: string,
    factory: ServiceFactory<T>,
    dependencies: string[] = []
  ): void {
    this.services.set(token, {
      name: token,
      singleton: factory.singleton !== false,
      factory,
      dependencies,
      initialized: false
    })

    console.log(`Service registered: ${token}`)
  }

  /**
   * 获取服务实例
   */
  async get<T>(token: string): Promise<T> {
    const metadata = this.services.get(token)
    if (!metadata) {
      throw new Error(`Service not found: ${token}`)
    }

    // 如果是单例且已创建实例，直接返回
    if (metadata.singleton && this.instances.has(token)) {
      return this.instances.get(token)
    }

    // 解析依赖
    const dependencies = await this.resolveDependencies(metadata.dependencies)

    // 创建服务实例
    let instance = await metadata.factory.create()

    // 注入依赖
    if (dependencies.length > 0 && typeof instance === 'object' && instance !== null) {
      dependencies.forEach((dep, index) => {
        const depName = metadata.dependencies[index]
        ;(instance as any)[depName] = dep
      })
    }

    // 初始化服务
    if (instance && typeof instance.initialize === 'function' && !metadata.initialized) {
      await instance.initialize()
      metadata.initialized = true
    }

    // 缓存单例实例
    if (metadata.singleton) {
      this.instances.set(token, instance)
    }

    return instance
  }

  /**
   * 同步获取服务实例（仅适用于已初始化的单例）
   */
  getSync<T>(token: string): T {
    const instance = this.instances.get(token)
    if (!instance) {
      throw new Error(`Service not initialized or not singleton: ${token}`)
    }
    return instance
  }

  /**
   * 解析依赖
   */
  private async resolveDependencies(dependencies: string[]): Promise<any[]> {
    const resolved = []
    for (const dep of dependencies) {
      resolved.push(await this.get(dep))
    }
    return resolved
  }

  /**
   * 检查服务是否已注册
   */
  has(token: string): boolean {
    return this.services.has(token)
  }

  /**
   * 移除服务
   */
  async remove(token: string): Promise<void> {
    const instance = this.instances.get(token)
    
    // 清理服务实例
    if (instance && typeof instance.dispose === 'function') {
      await instance.dispose()
    }

    this.services.delete(token)
    this.instances.delete(token)

    console.log(`Service removed: ${token}`)
  }

  /**
   * 获取所有已注册的服务名称
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): {
    registered: number
    initialized: number
    services: Record<string, { singleton: boolean, initialized: boolean }>
  } {
    const services: Record<string, { singleton: boolean, initialized: boolean }> = {}
    let initializedCount = 0

    for (const [token, metadata] of this.services.entries()) {
      services[token] = {
        singleton: metadata.singleton,
        initialized: metadata.initialized
      }
      if (metadata.initialized) initializedCount++
    }

    return {
      registered: this.services.size,
      initialized: initializedCount,
      services
    }
  }

  /**
   * 清理所有服务
   */
  async dispose(): Promise<void> {
    const promises = []
    
    for (const [token, instance] of this.instances.entries()) {
      if (instance && typeof instance.dispose === 'function') {
        promises.push(instance.dispose())
      }
    }

    await Promise.all(promises)
    
    this.services.clear()
    this.instances.clear()
    
    console.log('ServiceContainer disposed')
  }
}

// 创建全局容器实例
export const container = ServiceContainer.getInstance()

// React Hook for using services
import { useEffect, useState } from 'react'

export function useService<T>(token: string): T | null {
  const [service, setService] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadService = async () => {
      try {
        const serviceInstance = await container.get<T>(token)
        if (isMounted) {
          setService(serviceInstance)
        }
      } catch (error) {
        console.error(`Failed to load service ${token}:`, error)
        if (isMounted) {
          setService(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadService()

    return () => {
      isMounted = false
    }
  }, [token])

  return loading ? null : service
}

// 便捷的服务hooks
export const useApiClient = () => useService<ApiClient>(ServiceTokens.API_CLIENT)
export const useStorageService = () => useService<StorageService>(ServiceTokens.STORAGE_SERVICE)
export const useEventBusService = () => useService<EventBus>(ServiceTokens.EVENT_BUS)
export const useDOMManagerService = () => useService<DOMManager>(ServiceTokens.DOM_MANAGER)