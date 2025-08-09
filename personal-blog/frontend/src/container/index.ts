/**
 * 容器实例管理
 * 全局容器单例和React集成
 */

import { DIContainer } from './DIContainer'
import { ServiceRegistry } from './ServiceRegistry'
import { SERVICE_TOKENS, ServiceMap } from './types'

// 全局容器实例
let globalContainer: DIContainer | null = null

/**
 * 获取全局容器实例
 */
export function getContainer(): DIContainer {
  if (!globalContainer) {
    throw new Error('Container not initialized. Call initializeContainer() first.')
  }
  return globalContainer
}

/**
 * 初始化容器
 */
export async function initializeContainer(): Promise<DIContainer> {
  if (globalContainer) {
    console.warn('Container already initialized')
    return globalContainer
  }

  try {
    globalContainer = new DIContainer()
    const registry = new ServiceRegistry(globalContainer)
    
    // 注册服务
    registry.registerCoreServices()
    registry.registerDevServices()
    
    // 预热关键服务
    await warmupEssentialServices(globalContainer)
    
    // 设置全局引用（用于业务hooks）
    setupGlobalReferences(globalContainer)
    
    console.log('🚀 DI Container initialized successfully')
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Container debug info:', globalContainer.getDebugInfo())
    }
    
    return globalContainer
  } catch (error) {
    console.error('❌ Failed to initialize container:', error)
    globalContainer = null
    throw error
  }
}

/**
 * 预热核心服务
 */
async function warmupEssentialServices(container: DIContainer): Promise<void> {
  const essentialServices = [
    SERVICE_TOKENS.STORAGE_SERVICE,
    SERVICE_TOKENS.EVENT_BUS,
    SERVICE_TOKENS.HTTP_CLIENT
  ]

  try {
    await Promise.all(
      essentialServices.map(token => container.resolve(token as any))
    )
    console.log('✅ Essential services warmed up')
  } catch (error) {
    console.error('❌ Failed to warm up essential services:', error)
    throw error
  }
}

/**
 * 设置全局引用（为向后兼容）
 */
function setupGlobalReferences(container: DIContainer): void {
  // 设置用例的全局引用，供hooks使用
  container.resolve(SERVICE_TOKENS.LOGIN_USE_CASE).then(useCase => {
    ;(globalThis as any).loginUseCase = useCase
  })

  container.resolve(SERVICE_TOKENS.CONFIG_MANAGEMENT_USE_CASE).then(useCase => {
    ;(globalThis as any).configManagementUseCase = useCase
  })
}

/**
 * 销毁容器
 */
export function destroyContainer(): void {
  if (globalContainer) {
    globalContainer.clear()
    globalContainer = null
    
    // 清除全局引用
    ;(globalThis as any).loginUseCase = undefined
    ;(globalThis as any).configManagementUseCase = undefined
    
    console.log('🗑️ Container destroyed')
  }
}

/**
 * 重新初始化容器
 */
export async function reinitializeContainer(): Promise<DIContainer> {
  destroyContainer()
  return initializeContainer()
}

// React hooks for DI
import { useEffect, useState } from 'react'

/**
 * 使用依赖注入的React Hook
 */
export function useService<K extends keyof ServiceMap>(
  token: K
): ServiceMap[K] | null {
  const [service, setService] = useState<ServiceMap[K] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const loadService = async () => {
      try {
        const container = getContainer()
        const serviceInstance = await container.resolve(token)
        
        if (mounted) {
          setService(serviceInstance)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
          setService(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadService()

    return () => {
      mounted = false
    }
  }, [token])

  if (error) {
    throw error
  }

  return loading ? null : service
}

/**
 * 同步获取服务的Hook（仅适用于单例）
 */
export function useServiceSync<K extends keyof ServiceMap>(
  token: K
): ServiceMap[K] {
  try {
    const container = getContainer()
    return container.resolveSync(token)
  } catch (error) {
    console.error(`Failed to resolve service ${token.toString()}:`, error)
    throw error
  }
}

/**
 * 容器状态Hook
 */
export function useContainerStatus() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const checkContainer = async () => {
      try {
        if (!globalContainer) {
          await initializeContainer()
        }
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        setError(err as Error)
        setIsInitialized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkContainer()
  }, [])

  return {
    isInitialized,
    isLoading,
    error,
    reinitialize: reinitializeContainer,
    destroy: destroyContainer
  }
}