/**
 * 网站配置应用Hook - 基于新架构
 * 解决无限循环问题的统一配置管理
 */

import { useEffect, useState, useCallback } from 'react'
import { useService } from '../../container'
import { SERVICE_TOKENS } from '../../container/types'
import { SiteConfigUseCase } from '../usecases/SiteConfigUseCase'

export interface UseSiteConfigReturn {
  // 数据状态
  configs: any[]
  loading: boolean
  error: Error | null
  
  // 数据获取
  getConfigValue: (key: string, defaultValue?: string) => string
  getConfigsByCategory: (category: string) => any[]
  
  // 数据操作
  updateConfig: (key: string, value: string) => Promise<void>
  batchUpdateConfigs: (changes: Array<{ key: string; value: string; operation: string }>) => Promise<void>
  validateConfigs: (configs: Array<{ key: string; value: string; data_type?: string }>) => Promise<any>
  
  // 工具方法
  refresh: () => Promise<void>
}

/**
 * 网站配置Hook - 基于新架构的统一实现
 */
export function useSiteConfig(): UseSiteConfigReturn {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // 使用依赖注入获取用例，可能为null
  const configUseCase = useService<SiteConfigUseCase>(SERVICE_TOKENS.SITE_CONFIG_USE_CASE)

  /**
   * 从用例同步状态到Hook
   */
  const syncState = useCallback(() => {
    if (!configUseCase) return
    
    const useCaseConfigs = configUseCase.getConfigs()
    const mappedConfigs = useCaseConfigs.map(config => ({
      id: config.id,
      key: config.key,
      value: config.value,
      category: config.category,
      description: config.description,
      data_type: config.dataType,
      is_public: config.isPublic ? 'true' : 'false',
      sort_order: config.sortOrder,
      created_at: config.createdAt?.toISOString() || '',
      updated_at: config.updatedAt?.toISOString() || ''
    }))
    
    setConfigs(mappedConfigs)
    setLoading(configUseCase.isConfigLoading())
  }, [configUseCase])

  /**
   * 初始化和订阅变更
   */
  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    if (!configUseCase) {
      // 用例尚未初始化，保持loading状态
      setLoading(true)
      return
    }
    
    // 订阅配置变更
    unsubscribe = configUseCase.subscribe(() => {
      if (isMounted) {
        syncState()
      }
    })

    // 初始加载
    const loadInitialData = async () => {
      if (!isMounted || !configUseCase) return
      
      try {
        setError(null)
        await configUseCase.loadConfigs()
        if (isMounted) {
          syncState()
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('加载配置失败'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [configUseCase, syncState])

  /**
   * 获取配置值
   */
  const getConfigValue = useCallback((key: string, defaultValue = ''): string => {
    if (!configUseCase) return defaultValue
    return configUseCase.getConfigValue(key, defaultValue)
  }, [configUseCase])

  /**
   * 根据分类获取配置
   */
  const getConfigsByCategory = useCallback((category: string) => {
    if (!configUseCase) return []
    
    const categoryConfigs = configUseCase.getConfigsByCategory(category)
    return categoryConfigs.map(config => ({
      id: config.id,
      key: config.key,
      value: config.value,
      category: config.category,
      description: config.description,
      data_type: config.dataType,
      is_public: config.isPublic ? 'true' : 'false',
      sort_order: config.sortOrder
    }))
  }, [configUseCase])

  /**
   * 更新单个配置
   */
  const updateConfig = useCallback(async (key: string, value: string): Promise<void> => {
    if (!configUseCase) {
      throw new Error('配置服务未初始化')
    }
    
    try {
      setError(null)
      await configUseCase.updateConfig(key, value)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('更新配置失败')
      setError(error)
      throw error
    }
  }, [configUseCase])

  /**
   * 批量更新配置
   */
  const batchUpdateConfigs = useCallback(async (changes: Array<{ key: string; value: string; operation: string }>): Promise<void> => {
    if (!configUseCase) {
      throw new Error('配置服务未初始化')
    }
    
    try {
      setError(null)
      await configUseCase.batchUpdateConfigs(changes)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('批量更新配置失败')
      setError(error)
      throw error
    }
  }, [configUseCase])

  /**
   * 验证配置
   */
  const validateConfigs = useCallback(async (configs: Array<{ key: string; value: string; data_type?: string }>) => {
    if (!configUseCase) {
      throw new Error('配置服务未初始化')
    }
    
    try {
      setError(null)
      return await configUseCase.validateConfigs(configs)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('验证配置失败')
      setError(error)
      throw error
    }
  }, [configUseCase])

  /**
   * 刷新配置数据
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!configUseCase) {
      throw new Error('配置服务未初始化')
    }
    
    try {
      setLoading(true)
      setError(null)
      await configUseCase.loadConfigs()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('刷新配置失败')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [configUseCase])

  return {
    configs,
    loading,
    error,
    getConfigValue,
    getConfigsByCategory,
    updateConfig,
    batchUpdateConfigs,
    validateConfigs,
    refresh
  }
}