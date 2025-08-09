/**
 * 重构的配置表单组件 - 解决无限循环问题
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Globe, Share2, Search, AlertCircle } from 'lucide-react'
import { useSiteConfig } from '../../../application/hooks/useSiteConfig'
import { useToast } from '@/hooks/use-toast'

interface ConfigFormProps {
  className?: string
}

export function ConfigFormRefactored({ className }: ConfigFormProps) {
  const { 
    configs, 
    loading, 
    error,
    getConfigValue, 
    getConfigsByCategory,
    updateConfig,
    batchUpdateConfigs,
    validateConfigs
  } = useSiteConfig()
  
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map())

  /**
   * 处理单个字段变更
   */
  const handleFieldChange = useCallback((key: string, value: string) => {
    setPendingChanges(prev => {
      const newChanges = new Map(prev)
      newChanges.set(key, value)
      return newChanges
    })
  }, [])

  /**
   * 保存变更
   */
  const handleSave = useCallback(async () => {
    if (pendingChanges.size === 0) {
      toast({ title: '没有需要保存的变更' })
      return
    }

    setSaving(true)
    try {
      const changes = Array.from(pendingChanges.entries()).map(([key, value]) => ({
        key,
        value,
        operation: 'update'
      }))

      await batchUpdateConfigs(changes)
      setPendingChanges(new Map())
      
      toast({
        title: '保存成功',
        description: `已更新 ${changes.length} 个配置项`,
      })
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存配置时发生错误',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }, [pendingChanges, batchUpdateConfigs, toast])

  /**
   * 取消变更
   */
  const handleCancel = useCallback(() => {
    setPendingChanges(new Map())
    toast({ title: '已取消变更' })
  }, [toast])

  /**
   * 获取字段当前值（包括待保存的变更）
   */
  const getFieldValue = useCallback((key: string): string => {
    return pendingChanges.get(key) ?? getConfigValue(key, '')
  }, [pendingChanges, getConfigValue])

  /**
   * 渲染输入字段
   */
  const renderField = useCallback((
    key: string, 
    label: string, 
    type: 'input' | 'textarea' = 'input',
    placeholder?: string
  ) => {
    const value = getFieldValue(key)
    const hasChanged = pendingChanges.has(key)

    return (
      <div className="space-y-2">
        <Label htmlFor={key} className={hasChanged ? 'text-blue-600' : ''}>
          {label}
          {hasChanged && <span className="ml-1 text-xs">(已修改)</span>}
        </Label>
        {type === 'textarea' ? (
          <Textarea
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={hasChanged ? 'border-blue-300' : ''}
          />
        ) : (
          <Input
            id={key}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={hasChanged ? 'border-blue-300' : ''}
          />
        )}
      </div>
    )
  }, [getFieldValue, pendingChanges, handleFieldChange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {!getConfigValue ? '正在初始化配置服务...' : '加载配置中...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>加载配置失败: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>基础信息</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>社交媒体</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>SEO设置</span>
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>其他设置</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基础信息配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderField('site_title', '网站标题', 'input', '您的博客标题')}
              {renderField('site_subtitle', '网站副标题', 'input', '简短的副标题或标语')}
              {renderField('site_description', '网站描述', 'textarea', '网站的详细描述')}
              {renderField('site_keywords', '关键词', 'input', '用逗号分隔多个关键词')}
              {renderField('site_logo', 'Logo URL', 'input', 'https://example.com/logo.png')}
              {renderField('site_copyright', '版权信息', 'input', '© 2024 您的名称')}
              {renderField('site_icp', 'ICP备案号', 'input', '京ICP备xxxxxxxx号')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>社交媒体链接</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderField('social_github', 'GitHub', 'input', 'https://github.com/username')}
              {renderField('social_weibo', '微博', 'input', 'https://weibo.com/username')}
              {renderField('social_wechat', '微信', 'input', '微信号或二维码链接')}
              {renderField('social_linkedin', 'LinkedIn', 'input', 'https://linkedin.com/in/username')}
              {renderField('social_twitter', 'Twitter', 'input', 'https://twitter.com/username')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderField('seo_google_analytics', 'Google Analytics ID', 'input', 'G-XXXXXXXXXX')}
              {renderField('seo_baidu_analytics', '百度统计ID', 'input', 'xxxxxxxxxxxxxxxx')}
              {renderField('seo_meta_author', 'Meta作者', 'input', '网站作者姓名')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>其他设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderField('other_notice', '网站公告', 'textarea', '重要通知或公告内容')}
              {renderField('site_public_security', '公安备案号', 'input', '京公网安备xxxxxxxx号')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 保存操作栏 */}
      {pendingChanges.size > 0 && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600">
                有 {pendingChanges.size} 个配置项待保存
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? '保存中...' : '保存变更'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}