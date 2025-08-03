/**
 * 优化后的统一配置面板组件
 * 展示新的参数传递逻辑和状态管理
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useOptimizedConfigManager } from '@/hooks/use-optimized-config-manager'
import { ConfigGroup, ConfigStatus, ConfigMetadata } from '@/types/site-config-optimized'
import { useToast } from '@/hooks/use-toast'


import OptimizedConfigForm from './optimized-config-form'

// 配置分组定义
const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'basic',
    label: '基础信息',
    description: '网站的基本信息设置',
    category: 'basic',
    icon: '🏠',
    items: [
      {
        key: 'site_title',
        label: '网站标题',
        description: '显示在浏览器标题栏的网站名称',
        placeholder: '请输入网站标题',
        validation: {
          required: true,
          minLength: 1,
          maxLength: 100
        },
        ui: { type: 'input' }
      },
      {
        key: 'site_subtitle',
        label: '网站副标题',
        description: '网站的简短描述或标语',
        placeholder: '请输入网站副标题',
        validation: { maxLength: 200 },
        ui: { type: 'input' }
      },
      {
        key: 'site_description',
        label: '网站描述',
        description: '详细的网站介绍，用于SEO优化',
        placeholder: '请输入网站描述',
        validation: { maxLength: 500 },
        ui: { type: 'textarea', rows: 3 }
      },
      {
        key: 'site_logo',
        label: '网站Logo',
        description: '网站标志图片的URL地址',
        placeholder: 'https://example.com/logo.png',
        validation: {
          pattern: '^https?://.*\\.(jpg|jpeg|png|gif|svg)$'
        },
        ui: { type: 'input' }
      }
    ]
  },
  {
    id: 'social',
    label: '社交媒体',
    description: '社交媒体平台链接设置',
    category: 'social',
    icon: '🌐',
    items: [
      {
        key: 'social_github',
        label: 'GitHub',
        description: 'GitHub个人或组织主页链接',
        placeholder: 'https://github.com/username',
        validation: {
          pattern: '^https://github\\.com/[a-zA-Z0-9_-]+/?$'
        },
        ui: { type: 'input' }
      },
      {
        key: 'social_twitter',
        label: 'Twitter',
        description: 'Twitter账号链接',
        placeholder: 'https://twitter.com/username',
        validation: {
          pattern: '^https://twitter\\.com/[a-zA-Z0-9_]+/?$'
        },
        ui: { type: 'input' }
      },
      {
        key: 'social_weibo',
        label: '微博',
        description: '新浪微博主页链接',
        placeholder: 'https://weibo.com/username',
        ui: { type: 'input' }
      }
    ]
  },
  {
    id: 'seo',
    label: 'SEO设置',
    description: '搜索引擎优化相关配置',
    category: 'seo',
    icon: '🔍',
    items: [
      {
        key: 'seo_google_analytics',
        label: 'Google Analytics',
        description: 'Google Analytics跟踪ID',
        placeholder: 'G-XXXXXXXXXX',
        validation: {
          pattern: '^G-[A-Z0-9]{10}$'
        },
        ui: { type: 'input' }
      },
      {
        key: 'seo_baidu_analytics',
        label: '百度统计',
        description: '百度统计跟踪代码',
        placeholder: '请输入百度统计代码',
        ui: { type: 'textarea', rows: 2 }
      }
    ]
  }
]

interface OptimizedConfigPanelProps {
  className?: string
}

export function OptimizedConfigPanel({ className }: OptimizedConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('basic')
  
  // 使用优化后的配置管理器
  const {
    configs,
    loading,
    syncing,
    syncInfo,
    status,
    getConfigValue,
    updateConfig,
    syncPendingChanges,
    forceSave,
    hasUnsavedChanges,
    pendingChangesCount,
    validateConfigs,
    toast
  } = useOptimizedConfigManager({
    autoSync: true,
    syncInterval: 30000 // 30秒自动同步
  })

  // 获取当前活动的配置组
  const activeGroup = useMemo(() => {
    return CONFIG_GROUPS.find(group => group.id === activeTab)
  }, [activeTab])

  // 获取状态指示器
  const getStatusIndicator = () => {
    switch (status) {
      case ConfigStatus.LOADING:
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />加载中</Badge>
      case ConfigStatus.SYNCING:
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />同步中</Badge>
      case ConfigStatus.ERROR:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />错误</Badge>
      default:
        if (hasUnsavedChanges()) {
          return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />有未保存更改</Badge>
        }
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />已同步</Badge>
    }
  }

  // 处理保存操作
  const handleSave = async () => {
    if (!activeGroup) return

    try {
      // 先验证当前分组的配置
      const groupConfigs = activeGroup.items.map(item => ({
        key: item.key,
        value: getConfigValue(item.key),
        data_type: item.ui?.type === 'textarea' ? 'string' : 'string'
      }))

      const validationResult = await validateConfigs(groupConfigs)
      
      if (!validationResult.valid) {
        const errorCount = Object.keys(validationResult.errors).length
        toast({
          title: '验证失败',
          description: `发现 ${errorCount} 个配置项存在错误，请检查后重试`,
          variant: 'destructive'
        })
        return
      }

      // 执行保存
      const success = await forceSave()
      
      if (success) {
        toast({
          title: '保存成功',
          description: `${activeGroup.label}配置已更新`,
        })
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      })
    }
  }

  // 处理自动同步
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = '您有未保存的更改，确定要离开吗？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载配置中...</span>
      </div>
    )
  }

  return (
    <div className={`container mx-auto py-6 space-y-6 ${className}`}>
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-lg font-bold">⚙️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">优化配置管理</h1>
            <p className="text-muted-foreground">
              使用新的参数传递逻辑和状态管理系统
            </p>
          </div>
        </div>
        
        {/* 状态和操作区域 */}
        <div className="flex items-center space-x-3">
          {getStatusIndicator()}
          
          {pendingChangesCount > 0 && (
            <Badge variant="outline">
              {pendingChangesCount} 个待保存更改
            </Badge>
          )}
          
          <Button
            onClick={handleSave}
            disabled={syncing || !hasUnsavedChanges()}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存更改
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 同步信息 */}
      {syncInfo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            配置版本: {syncInfo.version} | 
            最后同步: {new Date(syncInfo.last_modified).toLocaleString()} |
            校验和: {syncInfo.checksum.substring(0, 8)}...
          </AlertDescription>
        </Alert>
      )}

      {/* 配置标签页 */}
      <Card>
        <CardHeader>
          <CardTitle>配置管理面板</CardTitle>
          <CardDescription>
            优化后的配置系统支持实时验证、自动同步和乐观更新
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {CONFIG_GROUPS.map((group) => (
                <TabsTrigger 
                  key={group.id} 
                  value={group.id}
                  className="relative"
                >
                  <span className="mr-2">{group.icon || '📝'}</span>
                  {group.label}
                  {/* 显示该分组是否有未保存更改 */}
                  {group.items.some(item => {
                    const currentValue = getConfigValue(item.key)
                    const originalConfig = configs.find(c => c.key === item.key)
                    return currentValue !== (originalConfig?.value || '')
                  }) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {CONFIG_GROUPS.map((group) => (
              <TabsContent key={group.id} value={group.id} className="mt-6">
                <OptimizedConfigForm
                  group={group}
                  getConfigValue={getConfigValue}
                  onUpdate={updateConfig}
                  validateConfigs={validateConfigs}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default OptimizedConfigPanel