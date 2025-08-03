/**
 * 优化后的配置管理Hook
 * 统一处理所有配置类型的状态管理和API调用
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { siteConfigOptimizedAPI } from '@/lib/api/site-config-optimized'
import { SiteConfig, ConfigChange, ConfigSyncInfo, ConfigStatus } from '@/types/site-config-optimized'

interface UseOptimizedConfigManagerOptions {
  category?: string
  autoSync?: boolean
  syncInterval?: number
}

export function useOptimizedConfigManager(options: UseOptimizedConfigManagerOptions = {}) {
  const { category, autoSync = true, syncInterval = 30000 } = options
  
  // 状态管理
  const [configs, setConfigs] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncInfo, setSyncInfo] = useState<ConfigSyncInfo | null>(null)
  const [status, setStatus] = useState<ConfigStatus>(ConfigStatus.IDLE)
  
  // 变更追踪
  const [pendingChanges, setPendingChanges] = useState<Map<string, ConfigChange>>(new Map())
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, string>>(new Map())
  
  // 防抖和定时器
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const syncTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const { toast } = useToast()

  /**
   * 获取配置值（支持乐观更新）
   */
  const getConfigValue = useCallback((key: string): string => {
    // 优先返回乐观更新的值
    if (optimisticUpdates.has(key)) {
      return optimisticUpdates.get(key)!
    }
    
    const config = configs.find(c => c.key === key)
    return config?.value || ''
  }, [configs, optimisticUpdates])

  /**
   * 获取配置项
   */
  const getConfig = useCallback((key: string): SiteConfig | undefined => {
    return configs.find(c => c.key === key)
  }, [configs])

  /**
   * 根据分类获取配置
   */
  const getConfigsByCategory = useCallback((cat: string): SiteConfig[] => {
    return configs.filter(config => config.category === cat)
  }, [configs])

  /**
   * 更新单个配置项（带防抖）
   */
  const updateConfig = useCallback((key: string, value: string, immediate = false) => {
    // 立即更新乐观状态
    setOptimisticUpdates(prev => new Map(prev.set(key, value)))
    
    // 记录待处理的变更
    setPendingChanges(prev => {
      const newChanges = new Map(prev)
      newChanges.set(key, { key, value, operation: 'update' })
      return newChanges
    })

    // 清除之前的防抖定时器
    const existingTimer = debounceTimers.current.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的防抖定时器
    const delay = immediate ? 0 : 500
    const timer = setTimeout(() => {
      debounceTimers.current.delete(key)
      // 防抖结束后，变更会在下次同步时发送
    }, delay)
    
    debounceTimers.current.set(key, timer)
  }, [])

  /**
   * 获取配置数据
   */
  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setStatus(ConfigStatus.LOADING)
      
      const syncRequest = syncInfo ? {
        client_version: syncInfo.version,
        last_sync: syncInfo.last_modified
      } : undefined
      
      const response = await siteConfigOptimizedAPI.syncConfigs(syncRequest)
      
      if (response.has_changes) {
        setConfigs(response.configs)
      }
      
      setSyncInfo({
        version: response.cache_info.version,
        checksum: response.cache_info.checksum,
        last_modified: response.cache_info.last_modified
      })
      
      setStatus(ConfigStatus.IDLE)
      
    } catch (error) {
      console.error('获取配置失败:', error)
      setStatus(ConfigStatus.ERROR)
      toast({
        title: '获取配置失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [syncInfo, toast])

  /**
   * 删除配置项
   */
  const deleteConfig = useCallback((key: string) => {
    setPendingChanges(prev => {
      const newChanges = new Map(prev)
      newChanges.set(key, { key, value: '', operation: 'delete' })
      return newChanges
    })
    
    // 从乐观更新中移除
    setOptimisticUpdates(prev => {
      const newUpdates = new Map(prev)
      newUpdates.delete(key)
      return newUpdates
    })
  }, [])

  /**
   * 批量更新配置
   */
  const batchUpdateConfigs = useCallback(async (changes: ConfigChange[]): Promise<boolean> => {
    try {
      setSyncing(true)
      setStatus(ConfigStatus.SYNCING)
      
      const result = await siteConfigOptimizedAPI.batchUpdateOptimized({
        changes,
        category: category as any
      })
      
      // 处理成功的变更
      if (result.changed.length > 0 || result.added.length > 0) {
        // 重新获取配置以确保数据一致性
        await fetchConfigs()
        
        toast({
          title: '保存成功',
          description: `已更新 ${result.changed.length + result.added.length} 个配置项`,
        })
      }
      
      // 处理错误
      if (Object.keys(result.errors).length > 0) {
        const errorMessages = Object.entries(result.errors)
          .map(([key, error]) => `${key}: ${error}`)
          .join(', ')
        
        toast({
          title: '部分配置保存失败',
          description: errorMessages,
          variant: 'destructive'
        })
        
        setStatus(ConfigStatus.ERROR)
        return false
      }
      
      setStatus(ConfigStatus.IDLE)
      return true
    } catch (error) {
      console.error('批量更新配置失败:', error)
      setStatus(ConfigStatus.ERROR)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
      return false
    } finally {
      setSyncing(false)
    }
  }, [category, toast, fetchConfigs])

  /**
   * 同步待处理的变更
   */
  const syncPendingChanges = useCallback(async (): Promise<boolean> => {
    if (pendingChanges.size === 0) {
      return true
    }

    const changes = Array.from(pendingChanges.values())
    const success = await batchUpdateConfigs(changes)
    
    if (success) {
      // 清除已同步的变更
      setPendingChanges(new Map())
      setOptimisticUpdates(new Map())
    }
    
    return success
  }, [pendingChanges, batchUpdateConfigs])

  /**
   * 验证配置
   */
  const validateConfigs = useCallback(async (configsToValidate: any[]) => {
    try {
      const result = await siteConfigOptimizedAPI.validateConfigs({ configs: configsToValidate })
      return result
    } catch (error) {
      console.error('配置验证失败:', error)
      return { valid: false, errors: {}, warnings: {} }
    }
  }, [])

  /**
   * 强制同步（立即保存所有变更）
   */
  const forceSave = useCallback(async (): Promise<boolean> => {
    // 清除所有防抖定时器
    debounceTimers.current.forEach(timer => clearTimeout(timer))
    debounceTimers.current.clear()
    
    return await syncPendingChanges()
  }, [syncPendingChanges])

  /**
   * 检查是否有未保存的变更
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    return pendingChanges.size > 0
  }, [pendingChanges])

  // 自动同步定时器
  useEffect(() => {
    if (autoSync && syncInterval > 0) {
      syncTimer.current = setInterval(() => {
        if (pendingChanges.size > 0) {
          syncPendingChanges()
        }
      }, syncInterval)
      
      return () => {
        if (syncTimer.current) {
          clearInterval(syncTimer.current)
        }
      }
    }
  }, [autoSync, syncInterval, pendingChanges.size, syncPendingChanges])

  // 初始化加载
  useEffect(() => {
    fetchConfigs()
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach(timer => clearTimeout(timer))
      if (syncTimer.current) {
        clearInterval(syncTimer.current)
      }
    }
  }, [])

  return {
    // 状态
    configs,
    loading,
    syncing,
    syncInfo,
    status,
    
    // 数据获取
    getConfigValue,
    getConfig,
    getConfigsByCategory,
    
    // 数据操作
    updateConfig,
    deleteConfig,
    batchUpdateConfigs,
    
    // 同步控制
    syncPendingChanges,
    forceSave,
    fetchConfigs,
    
    // 验证
    validateConfigs,
    
    // 状态检查
    hasUnsavedChanges,
    pendingChangesCount: pendingChanges.size,
    
    // 工具
    toast
  }
}