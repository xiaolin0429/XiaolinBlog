/**
 * 配置状态管理Store
 * 扩展和改进原有的配置Store
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { devtools, persist } from 'zustand/middleware'
// import { shallow } from 'zustand/shallow' // 暂时移除，因为当前版本不支持
import { SiteConfig, SiteConfigEntity } from '../../core/entities/SiteConfig'

export interface ConfigState {
  // 配置数据
  config: SiteConfig
  originalConfig: SiteConfig // 用于比较变化
  
  // 状态标识
  loading: boolean
  saving: boolean
  error: string | null
  
  // 变更追踪
  hasUnsavedChanges: boolean
  changedFields: Set<keyof SiteConfig>
  lastModified: string | null
  lastSaved: string | null
  
  // 版本控制
  version: number
  checksum: string
  
  // 验证状态
  validationErrors: Record<keyof SiteConfig, string[]>
  isValid: boolean
}

export interface ConfigActions {
  // 基础操作
  setConfig: (config: Partial<SiteConfig>) => void
  updateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void
  resetConfig: () => void
  resetField: <K extends keyof SiteConfig>(key: K) => void
  
  // 状态管理
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  
  // 变更管理
  markAsSaved: () => void
  discardChanges: () => void
  getChanges: () => Partial<SiteConfig>
  hasFieldChanged: <K extends keyof SiteConfig>(key: K) => boolean
  
  // 验证
  validateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => string[]
  validateAll: () => boolean
  clearValidationErrors: () => void
  
  // 工具方法
  exportConfig: () => SiteConfig
  importConfig: (config: SiteConfig) => void
  getConfigByCategory: (category: 'basic' | 'social' | 'seo' | 'other') => Partial<SiteConfig>
  
  // 快照功能
  createSnapshot: () => string
  restoreFromSnapshot: (snapshot: string) => void
}

// 默认配置
const DEFAULT_CONFIG: SiteConfig = {
  site_title: '个人博客',
  site_subtitle: '分享技术与生活',
  site_description: '这是一个个人技术博客',
  site_keywords: '博客,技术,编程',
  site_logo: '',
  site_favicon: '',
  site_language: 'zh-CN',
  site_timezone: 'Asia/Shanghai',
  site_copyright: '',
  site_icp: '',
  site_public_security: '',
  social_github: '',
  social_twitter: '',
  social_weibo: '',
  social_wechat: '',
  social_linkedin: '',
  seo_google_analytics: '',
  seo_baidu_analytics: '',
  seo_meta_author: '',
  other_notice: ''
}

// 计算配置校验和
function calculateChecksum(config: SiteConfig): string {
  const configString = JSON.stringify(config, Object.keys(config).sort())
  let hash = 0
  for (let i = 0; i < configString.length; i++) {
    const char = configString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

// 配置分类映射 - 修复类型定义
const CATEGORY_MAPPING: Record<string, (keyof SiteConfig)[]> = {
  basic: [
    'site_title', 'site_subtitle', 'site_description', 'site_keywords',
    'site_logo', 'site_favicon', 'site_language', 'site_timezone',
    'site_copyright', 'site_icp', 'site_public_security'
  ],
  social: [
    'social_github', 'social_twitter', 'social_weibo', 
    'social_wechat', 'social_linkedin'
  ],
  seo: [
    'seo_google_analytics', 'seo_baidu_analytics', 'seo_meta_author'
  ],
  other: ['other_notice']
}

export const useConfigStore = create<ConfigState & ConfigActions>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // 初始状态
        config: DEFAULT_CONFIG,
        originalConfig: DEFAULT_CONFIG,
        loading: false,
        saving: false,
        error: null,
        hasUnsavedChanges: false,
        changedFields: new Set(),
        lastModified: null,
        lastSaved: null,
        version: 1,
        checksum: calculateChecksum(DEFAULT_CONFIG),
        validationErrors: {} as Record<keyof SiteConfig, string[]>,
        isValid: true,

        // Actions
        setConfig: (newConfig: Partial<SiteConfig>) => {
          set((state) => {
            const updatedConfig = { ...state.config, ...newConfig }
            const changedFields = new Set(state.changedFields)
            
            // 追踪变更字段
            Object.keys(newConfig).forEach(key => {
              const configKey = key as keyof SiteConfig
              if (newConfig[configKey] !== state.originalConfig[configKey]) {
                changedFields.add(configKey)
              } else {
                changedFields.delete(configKey)
              }
            })

            return {
              config: updatedConfig,
              changedFields,
              hasUnsavedChanges: changedFields.size > 0,
              checksum: calculateChecksum(updatedConfig),
              lastModified: new Date().toISOString(),
              version: state.version + 1
            }
          })
        },

        updateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
          set((state) => {
            const updatedConfig = { ...state.config, [key]: value }
            const changedFields = new Set(state.changedFields)
            
            // 追踪变更字段
            if (value !== state.originalConfig[key]) {
              changedFields.add(key)
            } else {
              changedFields.delete(key)
            }

            // 验证字段 - 直接在这里进行验证逻辑，避免调用get()
            const errors: string[] = []
            switch (key) {
              case 'site_title':
                if (!String(value).trim()) {
                  errors.push('网站标题不能为空')
                } else if (String(value).length > 100) {
                  errors.push('网站标题长度不能超过100个字符')
                }
                break
                
              case 'site_description':
                if (String(value).length > 500) {
                  errors.push('网站描述长度不能超过500个字符')
                }
                break
                
              case 'site_keywords':
                if (String(value).length > 200) {
                  errors.push('网站关键词长度不能超过200个字符')
                }
                break
                
              case 'site_logo':
              case 'site_favicon':
                const url = String(value)
                if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                  errors.push('请输入有效的URL地址')
                }
                break
                
              default:
                // 其他字段暂无特殊验证规则
                break
            }
            
            return {
              config: updatedConfig,
              changedFields,
              hasUnsavedChanges: changedFields.size > 0,
              checksum: calculateChecksum(updatedConfig),
              lastModified: new Date().toISOString(),
              version: state.version + 1,
              validationErrors: {
                ...state.validationErrors,
                [key]: errors
              },
              isValid: Object.values({
                ...state.validationErrors,
                [key]: errors
              }).every(errs => errs.length === 0)
            }
          })
        },

        resetConfig: () => {
          set({
            config: DEFAULT_CONFIG,
            changedFields: new Set(),
            hasUnsavedChanges: false,
            checksum: calculateChecksum(DEFAULT_CONFIG),
            validationErrors: {} as Record<keyof SiteConfig, string[]>,
            isValid: true,
            error: null,
            lastModified: new Date().toISOString()
          })
        },

        resetField: <K extends keyof SiteConfig>(key: K) => {
          set((state) => {
            const originalValue = state.originalConfig[key]
            const updatedConfig = { ...state.config, [key]: originalValue }
            const changedFields = new Set(state.changedFields)
            
            // 移除变更字段追踪
            changedFields.delete(key)
            
            return {
              config: updatedConfig,
              changedFields,
              hasUnsavedChanges: changedFields.size > 0,
              checksum: calculateChecksum(updatedConfig),
              lastModified: new Date().toISOString(),
              version: state.version + 1,
              validationErrors: {
                ...state.validationErrors,
                [key]: [] // 重置字段时清除验证错误
              },
              isValid: Object.values({
                ...state.validationErrors,
                [key]: []
              }).every(errs => errs.length === 0)
            }
          })
        },

        setLoading: (loading: boolean) => {
          set({ loading })
        },

        setSaving: (saving: boolean) => {
          set({ saving })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        markAsSaved: () => {
          set((state) => ({
            originalConfig: { ...state.config },
            hasUnsavedChanges: false,
            changedFields: new Set(),
            lastSaved: new Date().toISOString(),
            error: null
          }))
        },

        discardChanges: () => {
          set((state) => ({
            config: { ...state.originalConfig },
            hasUnsavedChanges: false,
            changedFields: new Set(),
            checksum: calculateChecksum(state.originalConfig),
            validationErrors: {} as Record<keyof SiteConfig, string[]>,
            isValid: true,
            error: null
          }))
        },

        getChanges: () => {
          const state = get()
          const changes: Partial<SiteConfig> = {}
          
          state.changedFields.forEach(field => {
            changes[field] = state.config[field]
          })
          
          return changes
        },

        hasFieldChanged: <K extends keyof SiteConfig>(key: K) => {
          const state = get()
          return state.changedFields.has(key)
        },

        validateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
          const errors: string[] = []
          
          switch (key) {
            case 'site_title':
              if (!String(value).trim()) {
                errors.push('网站标题不能为空')
              } else if (String(value).length > 100) {
                errors.push('网站标题长度不能超过100个字符')
              }
              break
              
            case 'site_description':
              if (String(value).length > 500) {
                errors.push('网站描述长度不能超过500个字符')
              }
              break
              
            case 'site_keywords':
              if (String(value).length > 200) {
                errors.push('网站关键词长度不能超过200个字符')
              }
              break
              
            case 'site_logo':
            case 'site_favicon':
            case 'social_github':
            case 'social_twitter':
            case 'social_weibo':
            case 'social_linkedin':
              if (value && String(value).trim()) {
                try {
                  new URL(String(value))
                } catch {
                  errors.push(`${key} 不是有效的URL格式`)
                }
              }
              break
              
            case 'site_language':
              if (value && !/^[a-z]{2}(-[A-Z]{2})?$/.test(String(value))) {
                errors.push('语言代码格式无效')
              }
              break
              
            case 'site_timezone':
              if (value && !/^[A-Z][a-zA-Z]*\/[A-Z][a-zA-Z_]*$/.test(String(value))) {
                errors.push('时区格式无效')
              }
              break
          }
          
          return errors
        },

        validateAll: () => {
          const state = get()
          const allErrors: Record<keyof SiteConfig, string[]> = {} as any
          let isValid = true
          
          // 直接进行验证，不调用 state.validateField 避免循环
          Object.keys(state.config).forEach(key => {
            const configKey = key as keyof SiteConfig
            const value = state.config[configKey]
            const errors: string[] = []
            
            // 复制验证逻辑，避免调用 state.validateField
            switch (configKey) {
              case 'site_title':
                if (!String(value).trim()) {
                  errors.push('网站标题不能为空')
                } else if (String(value).length > 100) {
                  errors.push('网站标题长度不能超过100个字符')
                }
                break
                
              case 'site_description':
                if (String(value).length > 500) {
                  errors.push('网站描述长度不能超过500个字符')
                }
                break
                
              case 'site_keywords':
                if (String(value).length > 200) {
                  errors.push('网站关键词长度不能超过200个字符')
                }
                break
                
              case 'site_logo':
              case 'site_favicon':
              case 'social_github':
              case 'social_twitter':
              case 'social_weibo':
              case 'social_linkedin':
                if (value && String(value).trim()) {
                  try {
                    new URL(String(value))
                  } catch {
                    errors.push(`${configKey} 不是有效的URL格式`)
                  }
                }
                break
                
              case 'site_language':
                if (value && !/^[a-z]{2}(-[A-Z]{2})?$/.test(String(value))) {
                  errors.push('语言代码格式无效')
                }
                break
                
              case 'site_timezone':
                if (value && !/^[A-Z][a-zA-Z]*\/[A-Z][a-zA-Z_]*$/.test(String(value))) {
                  errors.push('时区格式无效')
                }
                break
            }
            
            allErrors[configKey] = errors
            if (errors.length > 0) isValid = false
          })
          
          set({
            validationErrors: allErrors,
            isValid
          })
          
          return isValid
        },

        clearValidationErrors: () => {
          set({
            validationErrors: {} as Record<keyof SiteConfig, string[]>,
            isValid: true
          })
        },

        exportConfig: () => {
          const state = get()
          return { ...state.config }
        },

        importConfig: (config: SiteConfig) => {
          set((state) => {
            const newConfig = { ...config }
            
            // 验证所有字段
            const validationErrors: Record<keyof SiteConfig, string[]> = {} as any
            let isValid = true
            
            Object.entries(newConfig).forEach(([key, value]) => {
              const configKey = key as keyof SiteConfig
              const errors: string[] = []
              
              // 复制验证逻辑（与updateField中的逻辑一致）
              switch (configKey) {
                case 'site_title':
                  if (!String(value).trim()) {
                    errors.push('网站标题不能为空')
                  } else if (String(value).length > 100) {
                    errors.push('网站标题长度不能超过100个字符')
                  }
                  break
                  
                case 'site_description':
                  if (String(value).length > 500) {
                    errors.push('网站描述长度不能超过500个字符')
                  }
                  break
                  
                case 'site_keywords':
                  if (String(value).length > 200) {
                    errors.push('网站关键词长度不能超过200个字符')
                  }
                  break
                  
                case 'site_logo':
                case 'site_favicon':
                  const url = String(value)
                  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                    errors.push('请输入有效的URL地址')
                  }
                  break
              }
              
              validationErrors[configKey] = errors
              if (errors.length > 0) {
                isValid = false
              }
            })
            
            return {
              config: newConfig,
              changedFields: new Set(Object.keys(config) as (keyof SiteConfig)[]),
              hasUnsavedChanges: true,
              checksum: calculateChecksum(newConfig),
              lastModified: new Date().toISOString(),
              version: state.version + 1,
              validationErrors,
              isValid,
              error: null
            }
          })
        },

        getConfigByCategory: (category: 'basic' | 'social' | 'seo' | 'other') => {
          const state = get()
          const categoryFields = CATEGORY_MAPPING[category] || []
          const categoryConfig: Partial<SiteConfig> = {}
          
          categoryFields.forEach(field => {
            categoryConfig[field] = state.config[field]
          })
          
          return categoryConfig
        },

        createSnapshot: () => {
          const state = get()
          return JSON.stringify({
            config: state.config,
            timestamp: Date.now(),
            version: state.version
          })
        },

        restoreFromSnapshot: (snapshot: string) => {
          try {
            const data = JSON.parse(snapshot)
            if (data.config) {
              const actions = get()
              actions.importConfig(data.config)
            }
          } catch (error) {
            console.error('Failed to restore from snapshot:', error)
            set({ error: '恢复快照失败' })
          }
        }
      })),
      {
        name: 'config-store',
        // 只持久化关键数据
        partialize: (state) => ({
          config: state.config,
          originalConfig: state.originalConfig,
          lastSaved: state.lastSaved
        })
      }
    ),
    { name: 'config-store' }
  )
)

// 便捷的选择器hooks - 使用稳定的选择器函数避免无限重渲染
export const useConfigValue = <K extends keyof SiteConfig>(key: K) => 
  useConfigStore(state => state.config[key])

// 创建稳定的选择器函数
const configStatusSelector = (state: ConfigState & ConfigActions) => ({
  loading: state.loading,
  saving: state.saving,
  error: state.error,
  hasUnsavedChanges: state.hasUnsavedChanges,
  isValid: state.isValid,
  version: state.version,
  lastModified: state.lastModified,
  lastSaved: state.lastSaved
})

const configActionsSelector = (state: ConfigState & ConfigActions) => ({
  setConfig: state.setConfig,
  updateField: state.updateField,
  resetConfig: state.resetConfig,
  resetField: state.resetField,
  markAsSaved: state.markAsSaved,
  discardChanges: state.discardChanges,
  exportConfig: state.exportConfig,
  importConfig: state.importConfig
})

const configValidationSelector = (state: ConfigState & ConfigActions) => ({
  validationErrors: state.validationErrors,
  isValid: state.isValid,
  validateField: state.validateField,
  validateAll: state.validateAll,
  clearValidationErrors: state.clearValidationErrors
})

const configChangesSelector = (state: ConfigState & ConfigActions) => ({
  hasUnsavedChanges: state.hasUnsavedChanges,
  changedFields: state.changedFields,
  getChanges: state.getChanges,
  hasFieldChanged: state.hasFieldChanged
})

export const useConfigStatus = () => useConfigStore(configStatusSelector)
export const useConfigActions = () => useConfigStore(configActionsSelector)
export const useConfigValidation = () => useConfigStore(configValidationSelector)
export const useConfigChanges = () => useConfigStore(configChangesSelector)

// 分类配置hooks - 创建稳定的选择器
const siteInfoSelector = (state: ConfigState & ConfigActions) => state.getConfigByCategory('basic')
const socialLinksSelector = (state: ConfigState & ConfigActions) => state.getConfigByCategory('social')
const seoSettingsSelector = (state: ConfigState & ConfigActions) => state.getConfigByCategory('seo')
const otherSettingsSelector = (state: ConfigState & ConfigActions) => state.getConfigByCategory('other')

export const useSiteInfo = () => useConfigStore(siteInfoSelector)
export const useSocialLinks = () => useConfigStore(socialLinksSelector)
export const useSeoSettings = () => useConfigStore(seoSettingsSelector)
export const useOtherSettings = () => useConfigStore(otherSettingsSelector)
