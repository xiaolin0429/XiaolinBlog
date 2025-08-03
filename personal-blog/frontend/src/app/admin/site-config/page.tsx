'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Settings } from 'lucide-react'
import { BasicInfoConfigPage } from '@/components/admin/site-config/basic-info-config'
import { SocialConfig } from '@/components/admin/site-config/social-config'
import { SeoConfig } from '@/components/admin/site-config/seo-config'
import { OtherConfig } from '@/components/admin/site-config/other-config'
import { siteConfigAPI } from '@/lib/api/site-config'

interface SiteConfig {
  id: number
  key: string
  value: string
  category: 'basic' | 'contact' | 'social' | 'seo' | 'features'
  description: string
  data_type: string
  is_public: string
  sort_order: number
}

interface TabConfig {
  value: string
  label: string
  category: string
  component: React.ComponentType<any>
}

export default function SiteConfigPage() {
  const [configs, setConfigs] = useState<SiteConfig[]>([])
  const [originalConfigs, setOriginalConfigs] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('basic')
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // 标签页配置
  const tabConfigs: TabConfig[] = [
    {
      value: 'basic',
      label: '基础信息',
      category: 'basic',
      component: BasicInfoConfigPage
    },
    {
      value: 'social',
      label: '社交媒体',
      category: 'social',
      component: SocialConfig
    },
    {
      value: 'seo',
      label: 'SEO设置',
      category: 'seo',
      component: SeoConfig
    },
    {
      value: 'other',
      label: '其他配置',
      category: 'features',
      component: OtherConfig
    }
  ]

  // 获取配置数据
  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const data = await siteConfigAPI.getConfigs()
      setConfigs(data)
      setOriginalConfigs(JSON.parse(JSON.stringify(data)))
    } catch (error) {
      console.error('获取配置失败:', error)
      toast({
        title: '获取配置失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 保存当前标签页的配置
  const saveCurrentTabConfigs = async () => {
    const currentTabConfig = tabConfigs.find(tab => tab.value === activeTab)
    if (!currentTabConfig) return

    try {
      setSavingStates(prev => ({ ...prev, [activeTab]: true }))
      console.log(`🔵 [DEBUG] 开始保存${currentTabConfig.label}配置`)
      
      // 找出当前标签页的所有配置项
      const currentTabConfigs = configs.filter(config => config.category === currentTabConfig.category)
      
      let configsToUpdate: Array<{key: string, value: string}> = []
      
      // 特殊处理社交媒体配置：发送所有配置项，包括启用状态
      if (currentTabConfig.category === 'social') {
        // 对于社交媒体配置，发送所有当前配置项
        configsToUpdate = currentTabConfigs.map(config => ({
          key: config.key,
          value: config.value || ''
        }))
        
        // 自动更新启用状态配置项
        const socialPlatforms = ['github', 'twitter', 'linkedin', 'instagram', 'facebook', 'youtube']
        socialPlatforms.forEach(platform => {
          const socialConfig = currentTabConfigs.find(config => config.key === `social_${platform}`)
          const enabledKey = `${platform}_enabled`
          const isEnabled = socialConfig && socialConfig.value && socialConfig.value.trim() !== ''
          
          // 查找或更新启用状态配置
          const existingEnabledConfigIndex = configsToUpdate.findIndex(config => config.key === enabledKey)
          if (existingEnabledConfigIndex !== -1) {
            // 更新现有的启用状态配置
            configsToUpdate[existingEnabledConfigIndex].value = isEnabled ? 'true' : 'false'
          } else {
            // 添加新的启用状态配置
            configsToUpdate.push({
              key: enabledKey,
              value: isEnabled ? 'true' : 'false'
            })
          }
        })
        
        console.log(`🔍 [DEBUG] 社交媒体配置 - 发送所有配置项:`, configsToUpdate.length)
        console.log(`🔍 [DEBUG] 社交媒体配置详情:`, configsToUpdate)
      } else {
        // 对于其他配置，只发送有变更的配置项
        const changedConfigs = currentTabConfigs.filter(config => {
          const original = originalConfigs.find(orig => orig.key === config.key)
          return original && original.value !== config.value
        })
        
        console.log(`🔍 [DEBUG] 检测到的变更配置项:`, changedConfigs.length)
        
        // 如果没有变更，仍然允许保存，但不发送请求
        if (changedConfigs.length === 0) {
          console.log(`ℹ️ [DEBUG] 没有检测到配置变更，但仍然显示保存成功`)
          toast({
            title: '保存成功',
            description: `${currentTabConfig.label}配置已保存（无变更）`,
          })
          return
        }
        
        configsToUpdate = changedConfigs.map(config => ({
          key: config.key,
          value: config.value
        }))
      }

      console.log(`🚀 [DEBUG] ${currentTabConfig.label}发送配置项:`, configsToUpdate)

      // 发送配置项
      await siteConfigAPI.batchUpdateConfigs(configsToUpdate)
      
      // 更新该标签页的原始配置数据
      setOriginalConfigs(prev => {
        const newOriginalConfigs = [...prev]
        configsToUpdate.forEach(updateConfig => {
          const index = newOriginalConfigs.findIndex(orig => orig.key === updateConfig.key)
          if (index !== -1) {
            newOriginalConfigs[index] = { ...newOriginalConfigs[index], value: updateConfig.value }
          }
        })
        return newOriginalConfigs
      })
      
      toast({
        title: '保存成功',
        description: `${currentTabConfig.label}已更新 ${configsToUpdate.length} 个配置项`,
      })
      
      console.log(`✅ [DEBUG] ${currentTabConfig.label}配置保存完成，更新了 ${configsToUpdate.length} 个配置项`)
    } catch (error) {
      console.error('保存配置失败:', error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setSavingStates(prev => ({ ...prev, [activeTab]: false }))
    }
  }

  // 更新单个配置项
  const updateConfig = useCallback((key: string, value: string) => {
    setConfigs(prev => {
      const newConfigs = [...prev]
      const index = newConfigs.findIndex(config => config.key === key)
      if (index !== -1) {
        newConfigs[index] = { ...newConfigs[index], value }
      }
      return newConfigs
    })
  }, [])

  // 根据分类获取配置
  const getConfigsByCategory = (category: string) => {
    return configs.filter(config => config.category === category)
  }

  // 检查当前标签页是否有变更
  const hasCurrentTabChanges = () => {
    const currentTabConfig = tabConfigs.find(tab => tab.value === activeTab)
    if (!currentTabConfig) return false

    const currentTabConfigs = configs.filter(config => config.category === currentTabConfig.category)
    return currentTabConfigs.some(config => {
      const original = originalConfigs.find(orig => orig.key === config.key)
      return original && original.value !== config.value
    })
  }

  // 检查指定标签页是否有变更（用于标签页标题显示）
  const hasTabChanges = (category: string) => {
    const categoryConfigs = configs.filter(config => config.category === category)
    return categoryConfigs.some(config => {
      const original = originalConfigs.find(orig => orig.key === config.key)
      return original && original.value !== config.value
    })
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载配置中...</span>
      </div>
    )
  }

  const currentTabConfig = tabConfigs.find(tab => tab.value === activeTab)
  const isSaving = savingStates[activeTab] || false
  const hasChanges = hasCurrentTabChanges()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">博客配置</h1>
          <p className="text-muted-foreground">管理网站的基本信息、社交媒体和其他设置</p>
        </div>
      </div>

      {/* 配置标签页 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>网站配置管理</CardTitle>
              <CardDescription>
                通过以下标签页管理不同类型的网站配置项
              </CardDescription>
            </div>
            {/* 当前标签页的保存按钮 - 任意时刻都可点击 */}
            <Button
              onClick={() => {
                console.log(`🔵 [DEBUG] 顶部保存按钮被点击: ${currentTabConfig?.label}`)
                saveCurrentTabConfigs()
              }}
              disabled={isSaving}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存{currentTabConfig?.label}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {tabConfigs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="relative"
                >
                  {tab.label}
                  {/* 显示变更指示器 */}
                  {hasTabChanges(tab.category) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfigs.map((tab) => {
              const Component = tab.component
              return (
                <TabsContent key={tab.value} value={tab.value} className="mt-6">
                  <Component 
                    configs={getConfigsByCategory(tab.category)}
                    onUpdate={updateConfig}
                  />
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}