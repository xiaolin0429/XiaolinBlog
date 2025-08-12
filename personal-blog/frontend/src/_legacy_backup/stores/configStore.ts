/**
 * 统一配置管理 Store - 使用 Zustand
 * 取代所有分散的配置hooks，提供单一状态源
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'

// 配置类型定义
export interface SiteConfig {
  // 基础信息
  site_title: string
  site_subtitle: string
  site_description: string
  site_keywords: string
  site_logo: string
  site_favicon: string
  site_language: string
  site_timezone: string
  site_copyright: string
  site_icp: string
  site_public_security: string
  
  // 社交媒体
  social_github: string
  social_twitter: string
  social_weibo: string
  social_wechat: string
  social_linkedin: string
  
  // SEO设置
  seo_google_analytics: string
  seo_baidu_analytics: string
  seo_meta_author: string
  
  // 其他设置
  other_notice: string
}

export interface ConfigState {
  // 状态
  config: SiteConfig
  loading: boolean
  saving: boolean
  error: string | null
  lastModified: string | null
  hasUnsavedChanges: boolean
  
  // 元数据
  version: number
  checksum: string
  
  // Actions
  setConfig: (config: Partial<SiteConfig>) => void
  updateConfigField: (key: keyof SiteConfig, value: string) => void
  resetConfig: () => void
  loadConfig: () => Promise<void>
  saveConfig: () => Promise<boolean>
  markAsSaved: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

// API服务函数
async function fetchConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch('/api/site-config/public')
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`)
    }
    
    const rawConfigs = await response.json()
    const config = { ...DEFAULT_CONFIG }
    
    // 将API返回的数组转换为配置对象
    if (Array.isArray(rawConfigs)) {
      rawConfigs.forEach((item: any) => {
        if (item.key && item.value !== undefined) {
          (config as any)[item.key] = item.value
        }
      })
    }
    
    return config
  } catch (error) {
    console.error('Failed to fetch configuration:', error)
    throw error
  }
}

async function saveConfigToAPI(config: SiteConfig): Promise<boolean> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    // 将配置对象转换为API期望的格式
    const configArray = Object.entries(config).map(([key, value]) => ({
      key,
      value: value || '',
      category: getCategoryForKey(key),
      data_type: 'string'
    }))
    
    const response = await fetch('/api/v1/site-config/batch-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ configs: configArray })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Save failed: ${response.status}`)
    }
    
    return true
  } catch (error) {
    console.error('Failed to save configuration:', error)
    throw error
  }
}

// 获取配置项的分类
function getCategoryForKey(key: string): string {
  if (key.startsWith('site_')) return 'basic'
  if (key.startsWith('social_')) return 'social'
  if (key.startsWith('seo_')) return 'seo'
  return 'other'
}

// 创建配置 Store
export const useConfigStore = create<ConfigState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      config: DEFAULT_CONFIG,
      loading: false,
      saving: false,
      error: null,
      lastModified: null,
      hasUnsavedChanges: false,
      version: 1,
      checksum: calculateChecksum(DEFAULT_CONFIG),
      
      // 设置完整配置
      setConfig: (newConfig: Partial<SiteConfig>) => {
        const currentConfig = get().config
        const updatedConfig = { ...currentConfig, ...newConfig }
        const newChecksum = calculateChecksum(updatedConfig)
        
        set({
          config: updatedConfig,
          checksum: newChecksum,
          hasUnsavedChanges: true,
          lastModified: new Date().toISOString()
        })
      },
      
      // 更新单个配置字段
      updateConfigField: (key: keyof SiteConfig, value: string) => {
        const currentConfig = get().config
        const updatedConfig = { ...currentConfig, [key]: value }
        const newChecksum = calculateChecksum(updatedConfig)
        
        set({
          config: updatedConfig,
          checksum: newChecksum,
          hasUnsavedChanges: true,
          lastModified: new Date().toISOString()
        })
      },
      
      // 重置配置
      resetConfig: () => {
        set({
          config: DEFAULT_CONFIG,
          checksum: calculateChecksum(DEFAULT_CONFIG),
          hasUnsavedChanges: false,
          error: null
        })
      },
      
      // 加载配置
      loadConfig: async () => {
        set({ loading: true, error: null })
        
        try {
          const config = await fetchConfig()
          const checksum = calculateChecksum(config)
          
          set({
            config,
            checksum,
            loading: false,
            hasUnsavedChanges: false,
            version: get().version + 1,
            lastModified: new Date().toISOString()
          })
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load configuration'
          })
        }
      },
      
      // 保存配置
      saveConfig: async (): Promise<boolean> => {
        const { config, saving } = get()
        if (saving) return false
        
        set({ saving: true, error: null })
        
        try {
          const success = await saveConfigToAPI(config)
          if (success) {
            set({
              saving: false,
              hasUnsavedChanges: false,
              version: get().version + 1,
              lastModified: new Date().toISOString()
            })
            return true
          }
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to save configuration'
          })
        }
        
        return false
      },
      
      // 标记为已保存
      markAsSaved: () => {
        set({ hasUnsavedChanges: false })
      },
      
      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ loading })
      },
      
      // 设置错误信息
      setError: (error: string | null) => {
        set({ error })
      }
    })),
    { name: 'config-store' }
  )
)

// 便捷的选择器hooks
export const useConfigValue = <K extends keyof SiteConfig>(key: K) => 
  useConfigStore(state => state.config[key])

export const useConfigActions = () => 
  useConfigStore(state => ({
    setConfig: state.setConfig,
    updateConfigField: state.updateConfigField,
    resetConfig: state.resetConfig,
    loadConfig: state.loadConfig,
    saveConfig: state.saveConfig,
    markAsSaved: state.markAsSaved
  }))

export const useConfigStatus = () => 
  useConfigStore(state => ({
    loading: state.loading,
    saving: state.saving,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,
    version: state.version,
    checksum: state.checksum,
    lastModified: state.lastModified
  }))

// 分类配置hooks
export const useSiteInfo = () => useConfigStore(state => ({
  title: state.config.site_title,
  subtitle: state.config.site_subtitle,
  description: state.config.site_description,
  keywords: state.config.site_keywords,
  logo: state.config.site_logo,
  favicon: state.config.site_favicon,
  language: state.config.site_language,
  timezone: state.config.site_timezone,
  copyright: state.config.site_copyright,
  icp: state.config.site_icp,
  publicSecurity: state.config.site_public_security
}))

export const useSocialLinks = () => useConfigStore(state => ({
  github: state.config.social_github,
  twitter: state.config.social_twitter,
  weibo: state.config.social_weibo,
  wechat: state.config.social_wechat,
  linkedin: state.config.social_linkedin
}))

export const useSeoSettings = () => useConfigStore(state => ({
  googleAnalytics: state.config.seo_google_analytics,
  baiduAnalytics: state.config.seo_baidu_analytics,
  metaAuthor: state.config.seo_meta_author
}))