/**
 * 配置管理业务Hook
 * 封装配置相关的业务逻辑
 */

import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { SiteConfig } from '../../core/entities/SiteConfig'
import { 
  useConfigStore, 
  useConfigActions, 
  useConfigStatus, 
  useConfigValidation,
  useConfigChanges 
} from '../stores/ConfigStore'
import { 
  ConfigManagementUseCase, 
  ConfigUpdateResult, 
  ConfigGetResult 
} from '../usecases/ConfigManagementUseCase'

// 依赖注入声明
declare global {
  var configManagementUseCase: ConfigManagementUseCase | undefined
}

export interface UseConfigReturn {
  // 状态
  config: SiteConfig
  loading: boolean
  saving: boolean
  error: string | null
  hasUnsavedChanges: boolean
  isValid: boolean
  
  // 方法
  loadConfig: () => Promise<ConfigGetResult>
  saveConfig: () => Promise<ConfigUpdateResult>
  updateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void
  resetConfig: () => void
  resetField: <K extends keyof SiteConfig>(key: K) => void
  discardChanges: () => void
  
  // 验证
  validateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => string[]
  validateAll: () => boolean
  getFieldErrors: <K extends keyof SiteConfig>(key: K) => string[]
  
  // 工具方法
  exportConfig: () => SiteConfig
  importConfig: (config: SiteConfig) => void
  createBackup: () => Promise<void>
  
  // 变更追踪
  getChanges: () => Partial<SiteConfig>
  hasFieldChanged: <K extends keyof SiteConfig>(key: K) => boolean
}

export function useConfig(): UseConfigReturn {
  const config = useConfigStore(state => state.config)
  const { loading, saving, error, hasUnsavedChanges, isValid } = useConfigStatus()
  const actions = useConfigActions()
  const validation = useConfigValidation()
  const changes = useConfigChanges()

  // 使用 useMemo 缓存稳定的引用 - 移除依赖项避免循环
  const stableActions = useMemo(() => ({
    setConfig: actions.setConfig,
    updateField: actions.updateField,
    resetConfig: actions.resetConfig,
    resetField: actions.resetField,
    markAsSaved: actions.markAsSaved,
    discardChanges: actions.discardChanges,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig
  }), [
    actions.setConfig,
    actions.updateField,
    actions.resetConfig,
    actions.resetField,
    actions.markAsSaved,
    actions.discardChanges,
    actions.exportConfig,
    actions.importConfig
  ])

  const stableValidation = useMemo(() => ({
    validateField: validation.validateField,
    validateAll: validation.validateAll,
    validationErrors: validation.validationErrors
  }), [
    validation.validateField,
    validation.validateAll,
    validation.validationErrors
  ])

  const stableChanges = useMemo(() => ({
    getChanges: changes.getChanges,
    hasFieldChanged: changes.hasFieldChanged
  }), [
    changes.getChanges,
    changes.hasFieldChanged
  ])

  // 加载配置 - 使用稳定的依赖
  const loadConfig = useCallback(async (): Promise<ConfigGetResult> => {
    try {
      useConfigStore.getState().setLoading(true)
      useConfigStore.getState().setError(null)

      if (!globalThis.configManagementUseCase) {
        throw new Error('ConfigManagementUseCase not initialized')
      }

      const result = await globalThis.configManagementUseCase.getConfig()

      if (result.success && result.config) {
        useConfigStore.getState().setConfig(result.config)
        useConfigStore.getState().markAsSaved() // 标记为已保存状态
        toast.success('配置加载成功')
      } else {
        useConfigStore.getState().setError(result.error || '加载配置失败')
        toast.error(result.error || '加载配置失败')
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载配置时发生错误'
      useConfigStore.getState().setError(message)
      toast.error(message)
      
      return {
        success: false,
        error: message
      }
    } finally {
      useConfigStore.getState().setLoading(false)
    }
  }, []) // 空依赖数组，直接使用store的getState

  // 保存配置 - 使用稳定的依赖
  const saveConfig = useCallback(async (): Promise<ConfigUpdateResult> => {
    try {
      // 先验证所有字段
      if (!useConfigStore.getState().validateAll()) {
        toast.error('配置验证失败，请检查输入')
        return {
          success: false,
          error: '配置验证失败'
        }
      }

      useConfigStore.getState().setSaving(true)
      useConfigStore.getState().setError(null)

      if (!globalThis.configManagementUseCase) {
        throw new Error('ConfigManagementUseCase not initialized')
      }

      // 获取变更的字段
      const changes = useConfigStore.getState().getChanges()
      
      if (Object.keys(changes).length === 0) {
        toast.info('没有需要保存的变更')
        return {
          success: true,
          updatedCount: 0
        }
      }

      const result = await globalThis.configManagementUseCase.batchUpdateConfig(changes)

      if (result.success) {
        useConfigStore.getState().markAsSaved()
        toast.success(`成功保存 ${result.updatedCount || 0} 项配置`)
        
        // 如果有失败的项目，显示警告
        if (result.failedItems && result.failedItems.length > 0) {
          toast.warning(`${result.failedItems.length} 项配置保存失败`)
        }
      } else {
        useConfigStore.getState().setError(result.error || '保存配置失败')
        toast.error(result.error || '保存配置失败')
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存配置时发生错误'
      useConfigStore.getState().setError(message)
      toast.error(message)
      
      return {
        success: false,
        error: message
      }
    } finally {
      useConfigStore.getState().setSaving(false)
    }
  }, []) // 空依赖数组，直接使用store的getState

  // 获取字段错误 - 使用稳定的依赖
  const getFieldErrors = useCallback(<K extends keyof SiteConfig>(key: K): string[] => {
    return stableValidation.validationErrors[key] || []
  }, [stableValidation.validationErrors])

  // 导出配置
  const exportConfig = useCallback(() => {
    return stableActions.exportConfig()
  }, [stableActions.exportConfig])

  // 导入配置
  const importConfig = useCallback((newConfig: SiteConfig) => {
    stableActions.importConfig(newConfig)
    toast.success('配置导入成功')
  }, [stableActions.importConfig])

  // 创建备份
  const createBackup = useCallback(async () => {
    try {
      if (!globalThis.configManagementUseCase) {
        throw new Error('ConfigManagementUseCase not initialized')
      }

      const result = await globalThis.configManagementUseCase.createConfigBackup()

      if (result.success && result.backup) {
        // 将备份保存到本地
        const backupData = JSON.stringify(result.backup, null, 2)
        const blob = new Blob([backupData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `config-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success('配置备份已下载')
      } else {
        toast.error(result.error || '创建备份失败')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建备份时发生错误'
      toast.error(message)
    }
  }, [])

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      // 清除错误状态
      useConfigStore.getState().setError(null)
    }
  }, [])

  return {
    // 状态
    config,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    isValid,
    
    // 方法
    loadConfig,
    saveConfig,
    updateField: stableActions.updateField,
    resetConfig: stableActions.resetConfig,
    resetField: stableActions.resetField,
    discardChanges: stableActions.discardChanges,
    
    // 验证
    validateField: stableValidation.validateField,
    validateAll: stableValidation.validateAll,
    getFieldErrors,
    
    // 工具方法
    exportConfig,
    importConfig,
    createBackup,
    
    // 变更追踪
    getChanges: stableChanges.getChanges,
    hasFieldChanged: stableChanges.hasFieldChanged
  }
}

// 特定分类配置Hook
export function useBasicConfig() {
  const { config, updateField, validateField, getFieldErrors, hasFieldChanged } = useConfig()

  return {
    title: config.site_title,
    subtitle: config.site_subtitle,
    description: config.site_description,
    keywords: config.site_keywords,
    logo: config.site_logo,
    favicon: config.site_favicon,
    language: config.site_language,
    timezone: config.site_timezone,
    copyright: config.site_copyright,
    icp: config.site_icp,
    publicSecurity: config.site_public_security,
    
    updateTitle: (value: string) => updateField('site_title', value),
    updateSubtitle: (value: string) => updateField('site_subtitle', value),
    updateDescription: (value: string) => updateField('site_description', value),
    updateKeywords: (value: string) => updateField('site_keywords', value),
    updateLogo: (value: string) => updateField('site_logo', value),
    updateFavicon: (value: string) => updateField('site_favicon', value),
    updateLanguage: (value: string) => updateField('site_language', value),
    updateTimezone: (value: string) => updateField('site_timezone', value),
    updateCopyright: (value: string) => updateField('site_copyright', value),
    updateIcp: (value: string) => updateField('site_icp', value),
    updatePublicSecurity: (value: string) => updateField('site_public_security', value),
    
    validateField,
    getFieldErrors,
    hasFieldChanged
  }
}

export function useSocialConfig() {
  const { config, updateField, validateField, getFieldErrors, hasFieldChanged } = useConfig()

  return {
    github: config.social_github,
    twitter: config.social_twitter,
    weibo: config.social_weibo,
    wechat: config.social_wechat,
    linkedin: config.social_linkedin,
    
    updateGithub: (value: string) => updateField('social_github', value),
    updateTwitter: (value: string) => updateField('social_twitter', value),
    updateWeibo: (value: string) => updateField('social_weibo', value),
    updateWechat: (value: string) => updateField('social_wechat', value),
    updateLinkedin: (value: string) => updateField('social_linkedin', value),
    
    validateField,
    getFieldErrors,
    hasFieldChanged
  }
}

export function useSeoConfig() {
  const { config, updateField, validateField, getFieldErrors, hasFieldChanged } = useConfig()

  return {
    googleAnalytics: config.seo_google_analytics,
    baiduAnalytics: config.seo_baidu_analytics,
    metaAuthor: config.seo_meta_author,
    
    updateGoogleAnalytics: (value: string) => updateField('seo_google_analytics', value),
    updateBaiduAnalytics: (value: string) => updateField('seo_baidu_analytics', value),
    updateMetaAuthor: (value: string) => updateField('seo_meta_author', value),
    
    validateField,
    getFieldErrors,
    hasFieldChanged
  }
}

// 配置保存守卫Hook - 防止用户离开时丢失未保存的更改
export function useConfigSaveGuard() {
  const { hasUnsavedChanges } = useConfigStatus()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '您有未保存的更改，确定要离开吗？'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return { hasUnsavedChanges }
}