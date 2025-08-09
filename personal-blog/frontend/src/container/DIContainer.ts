/**
 * 依赖注入容器实现
 * 基于Symbol的类型安全依赖注入系统
 */

import { ServiceToken, ServiceMap } from './types'

export interface ServiceFactory<T = any> {
  create(container: DIContainer): T | Promise<T>
  dependencies?: ServiceToken[]
  singleton?: boolean
}

export interface ServiceRegistration {
  factory: ServiceFactory
  instance?: any
  singleton: boolean
  dependencies: ServiceToken[]
  isCreating?: boolean // 防止循环依赖
}

export class DIContainer {
  private services = new Map<ServiceToken, ServiceRegistration>()
  private singletons = new Map<ServiceToken, any>()

  /**
   * 注册服务
   */
  register<K extends keyof ServiceMap>(
    token: K,
    factory: ServiceFactory<ServiceMap[K]>,
    options: {
      singleton?: boolean
      dependencies?: ServiceToken[]
    } = {}
  ): void {
    const registration: ServiceRegistration = {
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies || factory.dependencies || []
    }

    this.services.set(token, registration)
  }

  /**
   * 注册单例服务（便捷方法）
   */
  registerSingleton<K extends keyof ServiceMap>(
    token: K,
    factory: ServiceFactory<ServiceMap[K]>,
    dependencies?: ServiceToken[]
  ): void {
    this.register(token, factory, { singleton: true, dependencies })
  }

  /**
   * 注册瞬时服务（便捷方法）
   */
  registerTransient<K extends keyof ServiceMap>(
    token: K,
    factory: ServiceFactory<ServiceMap[K]>,
    dependencies?: ServiceToken[]
  ): void {
    this.register(token, factory, { singleton: false, dependencies })
  }

  /**
   * 注册实例（便捷方法）
   */
  registerInstance<K extends keyof ServiceMap>(
    token: K,
    instance: ServiceMap[K]
  ): void {
    this.register(token, { create: () => instance }, { singleton: true })
    this.singletons.set(token, instance)
  }

  /**
   * 解析服务
   */
  async resolve<K extends keyof ServiceMap>(token: K): Promise<ServiceMap[K]> {
    const registration = this.services.get(token)
    
    if (!registration) {
      throw new Error(`Service not registered: ${token.toString()}`)
    }

    // 检查单例缓存
    if (registration.singleton && this.singletons.has(token)) {
      return this.singletons.get(token)
    }

    // 防止循环依赖
    if (registration.isCreating) {
      throw new Error(`Circular dependency detected: ${token.toString()}`)
    }

    try {
      registration.isCreating = true

      // 解析依赖
      const dependencies = await this.resolveDependencies(registration.dependencies)
      
      // 创建实例
      const instance = await registration.factory.create(this)

      // 注入依赖（如果服务支持）
      if (instance && typeof instance === 'object' && dependencies.length > 0) {
        this.injectDependencies(instance, registration.dependencies, dependencies)
      }

      // 缓存单例
      if (registration.singleton) {
        this.singletons.set(token, instance)
      }

      return instance
    } finally {
      registration.isCreating = false
    }
  }

  /**
   * 同步解析（仅适用于已创建的单例）
   */
  resolveSync<K extends keyof ServiceMap>(token: K): ServiceMap[K] {
    if (!this.singletons.has(token)) {
      throw new Error(`Service not available synchronously: ${token.toString()}`)
    }
    return this.singletons.get(token)
  }

  /**
   * 检查服务是否已注册
   */
  isRegistered(token: ServiceToken): boolean {
    return this.services.has(token)
  }

  /**
   * 检查服务是否已创建
   */
  isCreated(token: ServiceToken): boolean {
    return this.singletons.has(token)
  }

  /**
   * 移除服务注册
   */
  unregister(token: ServiceToken): void {
    this.services.delete(token)
    this.singletons.delete(token)
  }

  /**
   * 清除所有服务
   */
  clear(): void {
    // 清理单例服务
    for (const instance of this.singletons.values()) {
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose()
        } catch (error) {
          console.error('Error disposing service:', error)
        }
      }
    }

    this.services.clear()
    this.singletons.clear()
  }

  /**
   * 解析依赖数组
   */
  private async resolveDependencies(dependencies: ServiceToken[]): Promise<any[]> {
    const resolved = []
    for (const dep of dependencies) {
      resolved.push(await this.resolve(dep as any))
    }
    return resolved
  }

  /**
   * 注入依赖到实例
   */
  private injectDependencies(
    instance: any,
    tokens: ServiceToken[],
    dependencies: any[]
  ): void {
    tokens.forEach((token, index) => {
      const dep = dependencies[index]
      if (dep !== undefined) {
        // 简单的属性注入策略
        const propName = this.getPropertyName(token)
        if (propName && !(propName in instance)) {
          instance[propName] = dep
        }
      }
    })
  }

  /**
   * 根据token获取属性名
   */
  private getPropertyName(token: ServiceToken): string | null {
    // 这是一个简单的实现，实际项目中可能需要更复杂的策略
    const tokenString = token.toString()
    const match = tokenString.match(/Symbol\((.+)\)/)
    if (match && match[1]) {
      // 转换为驼峰命名：HttpClient -> httpClient
      return match[1].charAt(0).toLowerCase() + match[1].slice(1)
    }
    return null
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): {
    registered: number
    created: number
    services: Array<{
      token: string
      singleton: boolean
      created: boolean
      dependencies: string[]
    }>
  } {
    const services = []

    for (const [token, registration] of this.services.entries()) {
      services.push({
        token: token.toString(),
        singleton: registration.singleton,
        created: this.singletons.has(token),
        dependencies: registration.dependencies.map(dep => dep.toString())
      })
    }

    return {
      registered: this.services.size,
      created: this.singletons.size,
      services
    }
  }

  /**
   * 批量注册服务
   */
  registerBatch(registrations: Array<{
    token: ServiceToken
    factory: ServiceFactory
    singleton?: boolean
    dependencies?: ServiceToken[]
  }>): void {
    for (const reg of registrations) {
      this.register(reg.token as any, reg.factory, {
        singleton: reg.singleton,
        dependencies: reg.dependencies
      })
    }
  }

  /**
   * 预热服务（创建所有单例服务）
   */
  async warmup(): Promise<void> {
    const promises = []
    
    for (const [token, registration] of this.services.entries()) {
      if (registration.singleton && !this.singletons.has(token)) {
        promises.push(this.resolve(token as any))
      }
    }

    await Promise.all(promises)
  }
}