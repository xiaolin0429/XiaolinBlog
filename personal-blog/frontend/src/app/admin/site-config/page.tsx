'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Settings } from 'lucide-react'
import { useSiteConfigManager } from '@/hooks/use-site-config-manager'
import { useSiteConfigSaver } from '@/hooks/use-site-config-saver'
import { hasConfigChanges } from '@/utils/site-config-utils'
import { tabConfigs } from '@/config/site-config-tabs'

export default function SiteConfigPage() {
  const [activeTab, setActiveTab] = useState('basic')
  
  const {
    configs,
    originalConfigs,
    setOriginalConfigs,
    loading,
    savingStates,
    setSavingStates,
    fetchConfigs,
    updateConfig,
    getConfigsByCategory,
    toast
  } = useSiteConfigManager()

  const { saveCurrentTabConfigs } = useSiteConfigSaver({
    configs,
    originalConfigs,
    tabConfigs,
    setSavingStates,
    setOriginalConfigs,
    toast
  })

  // 检查当前标签页是否有变更
  const hasCurrentTabChanges = () => {
    const currentTabConfig = tabConfigs.find(tab => tab.value === activeTab)
    if (!currentTabConfig) return false
    return hasConfigChanges(configs, originalConfigs, currentTabConfig.category)
  }

  // 检查指定标签页是否有变更（用于标签页标题显示）
  const hasTabChanges = (category: string) => {
    return hasConfigChanges(configs, originalConfigs, category)
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
                
                // 如果是基础信息配置，先强制同步所有待处理的更新
                if (activeTab === 'basic' && typeof window !== 'undefined' && (window as any).flushBasicConfigUpdates) {
                  console.log(`🔄 [DEBUG] 强制同步基础信息配置更新`)
                  ;(window as any).flushBasicConfigUpdates()
                }
                
                // 稍微延迟执行保存，确保状态已更新
                setTimeout(() => {
                  saveCurrentTabConfigs(activeTab)
                }, 50)
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