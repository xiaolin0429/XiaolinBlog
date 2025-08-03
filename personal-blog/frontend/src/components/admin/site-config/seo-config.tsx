'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Search, Code, BarChart3, Globe, AlertCircle, Save, Loader2 } from 'lucide-react'
import { SiteConfigValidator, ValidationResult } from '@/lib/validation/site-config'
import { siteConfigAPI } from '@/lib/api/site-config'
import { useToast } from '@/hooks/use-toast'

interface SiteConfig {
  id: number
  key: string
  value: string
  category: string
  description: string
  data_type: string
  is_public: string
  sort_order: number
}

interface SeoConfigProps {
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
}

export function SeoConfig({ configs, onUpdate }: SeoConfigProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [savingItems, setSavingItems] = useState<{ [key: string]: boolean }>({})
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const { toast } = useToast()

  // 保存SEO配置
  const handleSave = async () => {
    console.log(`🔵 [DEBUG] 开始统一保存SEO配置`)
    
    try {
      setIsSaving(true)
      
      // 获取所有SEO相关的配置项
      const seoKeys = [
        'seo_keywords', 'seo_description', 'google_analytics_id', 
        'google_search_console', 'baidu_analytics_id', 'custom_head_tags'
      ]
      
      // 保存所有配置项，包括空值
      const configsToUpdate = seoKeys.map(key => ({
        key,
        value: getConfigValue(key)
      }))
      
      console.log(`🟡 [DEBUG] 准备保存的配置项:`, configsToUpdate)

      console.log(`🚀 [DEBUG] 调用批量更新API`)
      await siteConfigAPI.batchUpdateConfigs(configsToUpdate)
      
      // 更新所有配置项到父组件
      configsToUpdate.forEach(config => {
        onUpdate(config.key, config.value)
      })
      
      toast({
        title: '保存成功',
        description: `SEO设置已更新 ${configsToUpdate.length} 个配置项`,
      })
      
      console.log(`✅ [DEBUG] 统一保存SEO配置完成`)
      
    } catch (error) {
      console.error(`❌ [DEBUG] 保存SEO配置失败:`, error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getConfigValue = (key: string) => {
    // 优先使用本地值，如果没有则使用配置值
    if (localValues[key] !== undefined) {
      console.log(`🟨 [DEBUG] getConfigValue(${key}) 从本地值获取: "${localValues[key]}"`)
      return localValues[key]
    }
    const config = configs.find(c => c.key === key)
    const value = config?.value || ''
    console.log(`🟨 [DEBUG] getConfigValue(${key}) 从配置获取: "${value}"`, { config })
    return value
  }

  // 验证单个配置项
  const validateField = (key: string, value: string): ValidationResult => {
    switch (key) {
      case 'seo_keywords':
        return SiteConfigValidator.validateKeywords(value)
      case 'seo_description':
        return SiteConfigValidator.validateSiteDescription(value)
      case 'google_analytics_id':
        return SiteConfigValidator.validateGoogleAnalyticsId(value)
      case 'google_search_console':
        return SiteConfigValidator.validateGoogleSearchConsole(value)
      case 'baidu_analytics_id':
        return SiteConfigValidator.validateBaiduAnalyticsId(value)
      default:
        return { isValid: true, errors: [] }
    }
  }

  // 防抖更新函数 - 只更新父组件状态，不直接调用API
  const debouncedUpdate = useCallback((key: string, value: string) => {
    // 清除之前的定时器
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }

    // 设置新的定时器
    debounceTimers.current[key] = setTimeout(() => {
      // 只更新父组件状态，由父组件统一处理保存
      onUpdate(key, value)
      delete debounceTimers.current[key]
    }, 300) // 300ms 防抖延迟
  }, [onUpdate])

  // 处理输入变化和验证
  const handleInputChange = (key: string, value: string) => {
    console.log(`🟦 [DEBUG] 输入变化: ${key} = "${value}"`)
    
    // 立即更新本地状态以保持输入响应性
    setLocalValues(prev => {
      const newValues = { ...prev, [key]: value }
      console.log(`🟦 [DEBUG] 更新本地值:`, newValues)
      return newValues
    })
    
    // 验证字段
    const validation = validateField(key, value)
    console.log(`🟦 [DEBUG] 字段验证结果 ${key}:`, validation)
    
    setValidationErrors(prev => {
      const newErrors = { ...prev, [key]: validation.errors }
      console.log(`🟦 [DEBUG] 更新验证错误:`, newErrors)
      return newErrors
    })

    // 防抖更新到父组件
    console.log(`🟦 [DEBUG] 触发防抖更新: ${key}`)
    debouncedUpdate(key, value)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  // 初始化本地值 - 只在configs首次加载时初始化
  useEffect(() => {
    if (configs.length > 0) {
      const initialValues: { [key: string]: string } = {}
      configs.forEach(config => {
        initialValues[config.key] = config.value
      })
      setLocalValues(initialValues)
    }
  }, [configs.length]) // 只依赖configs的长度，避免重复初始化

  // 初始验证所有字段 - 只对非空值进行验证，空值不算错误
  useEffect(() => {
    const errors: { [key: string]: string[] } = {}
    const fieldsToValidate = [
      'seo_keywords', 'seo_description', 'google_analytics_id', 
      'google_search_console', 'baidu_analytics_id'
    ]
    
    fieldsToValidate.forEach(key => {
      const value = getConfigValue(key)
      // 只对非空值进行验证，空值不算错误，允许保存
      if (value.trim()) {
        const validation = validateField(key, value)
        if (!validation.isValid) {
          errors[key] = validation.errors
        }
      } else {
        // 空值时清除错误状态
        errors[key] = []
      }
    })
    
    console.log(`🟨 [DEBUG] 初始验证结果:`, errors)
    setValidationErrors(errors)
  }, [configs])

  // 保存单个配置项
  const handleSaveItem = async (key: string) => {
    console.log(`🔵 [DEBUG] 开始保存配置项: ${key}`)
    console.log(`🔵 [DEBUG] 当前保存状态:`, savingItems)
    console.log(`🔵 [DEBUG] 当前验证错误:`, validationErrors)
    
    try {
      console.log(`🟡 [DEBUG] 设置 ${key} 为保存中状态`)
      setSavingItems(prev => {
        const newState = { ...prev, [key]: true }
        console.log(`🟡 [DEBUG] 新的保存状态:`, newState)
        return newState
      })
      
      const value = getConfigValue(key)
      console.log(`🔵 [DEBUG] 获取到的配置值: ${key} = "${value}"`)
      console.log(`🔵 [DEBUG] 配置值类型:`, typeof value)
      console.log(`🔵 [DEBUG] 配置值长度:`, value.length)
      
      // 验证字段 - 给出警告但不阻止保存
      console.log(`🟡 [DEBUG] 开始验证字段: ${key}`)
      const validation = validateField(key, value)
      console.log(`🟡 [DEBUG] 验证结果:`, validation)
      
      // 如果有验证错误，给出警告但继续保存
      if (value.trim() && !validation.isValid) {
        console.log(`🟠 [DEBUG] 验证警告: ${key}`, validation.errors)
        toast({
          title: '保存警告',
          description: `${getSeoItemLabel(key)} 格式可能不正确，但已保存: ${validation.errors.join(', ')}`,
          variant: 'default'
        })
      }
      
      console.log(`🟢 [DEBUG] 继续保存配置项: ${key}`)
      
      console.log(`🟢 [DEBUG] 验证通过，准备调用API: ${key} = "${value}"`)
      console.log(`🟢 [DEBUG] API调用参数:`, { key, value })
      
      // 调用API更新配置
      console.log(`🚀 [DEBUG] 调用 siteConfigAPI.updateConfigByKey(${key}, "${value}")`)
      const updatedConfig = await siteConfigAPI.updateConfigByKey(key, value)
      console.log(`🟢 [DEBUG] API调用成功，返回结果:`, updatedConfig)
      
      // 更新父组件状态
      console.log(`🟡 [DEBUG] 更新父组件状态: onUpdate(${key}, "${value}")`)
      onUpdate(key, value)
      
      toast({
        title: '保存成功',
        description: `${getSeoItemLabel(key)} 配置已更新`,
      })
      
      console.log(`✅ [DEBUG] SEO配置项 ${key} 保存完成`)
      
    } catch (error) {
      console.error(`❌ [DEBUG] 保存SEO配置项 ${key} 失败:`, error)
      console.error(`❌ [DEBUG] 错误详情:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      console.log(`🟡 [DEBUG] 重置 ${key} 保存状态为 false`)
      setSavingItems(prev => {
        const newState = { ...prev, [key]: false }
        console.log(`🟡 [DEBUG] 最终保存状态:`, newState)
        return newState
      })
    }
  }

  // 获取配置项的中文标签
  const getSeoItemLabel = (key: string): string => {
    const item = seoItems.find(item => item.key === key)
    return item?.label || key
  }

  const seoItems = [
    {
      key: 'seo_keywords',
      label: 'SEO关键词',
      description: '网站的核心关键词，用逗号分隔，有助于搜索引擎优化',
      icon: Search,
      placeholder: '博客,技术,编程,前端,后端',
      type: 'text',
      multiline: false
    },
    {
      key: 'seo_description',
      label: 'SEO描述',
      description: '网站的SEO描述，会显示在搜索结果中，建议150-160字符',
      icon: Globe,
      placeholder: '这是一个专注于技术分享的个人博客，涵盖前端、后端、数据库等多个技术领域...',
      type: 'text',
      multiline: true
    },
    {
      key: 'google_analytics_id',
      label: 'Google Analytics ID',
      description: 'Google Analytics跟踪ID，格式如：G-XXXXXXXXXX',
      icon: BarChart3,
      placeholder: 'G-XXXXXXXXXX',
      type: 'text',
      multiline: false
    },
    {
      key: 'google_search_console',
      label: 'Google Search Console验证码',
      description: 'Google Search Console的HTML标签验证码',
      icon: Code,
      placeholder: 'google-site-verification=xxxxxxxxxxxxxx',
      type: 'text',
      multiline: false
    },
    {
      key: 'baidu_analytics_id',
      label: '百度统计ID',
      description: '百度统计的跟踪ID，用于国内网站统计分析',
      icon: BarChart3,
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'text',
      multiline: false
    },
    {
      key: 'custom_head_tags',
      label: '自定义Head标签',
      description: '自定义的HTML头部标签，如meta标签、第三方脚本等',
      icon: Code,
      placeholder: '<meta name="author" content="Your Name">\n<meta name="robots" content="index,follow">',
      type: 'text',
      multiline: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">SEO设置配置</h3>
        </div>
        <Button
          onClick={() => {
            console.log(`🔵 [DEBUG] 统一保存按钮被点击`)
            console.log(`🔵 [DEBUG] 当前保存状态:`, { isSaving })
            handleSave()
          }}
          disabled={false}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存SEO设置
            </>
          )}
        </Button>
      </div>
      
      <div className="grid gap-6">
        {seoItems.map((item) => {
          const IconComponent = item.icon
          const hasError = validationErrors[item.key] && validationErrors[item.key].length > 0
          const isCurrentlySaving = savingItems[item.key] || false
          // 独立保存按钮只在保存过程中禁用，不受验证错误影响
          const shouldDisableButton = isCurrentlySaving
          
          console.log(`🟨 [DEBUG] 按钮状态计算 ${item.key}:`, {
            hasError,
            isCurrentlySaving,
            shouldDisableButton: shouldDisableButton,
            note: '独立保存按钮始终可用，只在保存时禁用',
            validationErrors: validationErrors[item.key],
            currentValue: getConfigValue(item.key)
          })
          
          return (
            <Card key={item.key} className={`border-l-4 ${hasError ? 'border-l-red-500' : 'border-l-orange-500'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <IconComponent className={`h-4 w-4 ${hasError ? 'text-red-600' : 'text-orange-600'}`} />
                  <CardTitle className="text-base">{item.label}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor={item.key} className="text-sm font-medium">
                    {item.label}
                  </Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      {item.multiline ? (
                        <Textarea
                          id={item.key}
                          value={getConfigValue(item.key)}
                          onChange={(e) => handleInputChange(item.key, e.target.value)}
                          placeholder={item.placeholder}
                          className={`min-h-[80px] resize-none ${hasError ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      ) : (
                        <Input
                          id={item.key}
                          type={item.type}
                          value={getConfigValue(item.key)}
                          onChange={(e) => handleInputChange(item.key, e.target.value)}
                          placeholder={item.placeholder}
                          className={`w-full ${hasError ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        console.log(`🔵 [DEBUG] 按钮被点击: ${item.key}`)
                        console.log(`🔵 [DEBUG] 按钮状态检查:`, {
                          key: item.key,
                          isSaving: savingItems[item.key],
                          hasError: hasError,
                          disabled: savingItems[item.key] || hasError,
                          currentValue: getConfigValue(item.key),
                          validationErrors: validationErrors[item.key]
                        })
                        handleSaveItem(item.key)
                      }}
                      disabled={savingItems[item.key] || hasError}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 shrink-0"
                    >
                      {savingItems[item.key] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="mr-1 h-3 w-3" />
                          保存
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* 显示验证错误 */}
                  {hasError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors[item.key].map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 配置预览 */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-orange-600" />
            <CardTitle className="text-base">SEO配置预览</CardTitle>
          </div>
          <CardDescription>
            以下是SEO配置在网站中的应用效果预览
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* HTML Head标签预览 */}
            <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
              <div className="text-xs text-gray-400 mb-2">HTML Head 标签预览</div>
              <div className="space-y-1">
                <div>&lt;head&gt;</div>
                <div className="ml-2">&lt;title&gt;{getConfigValue('site_title') || '我的博客'}&lt;/title&gt;</div>
                <div className="ml-2">&lt;meta name="description" content="{getConfigValue('seo_description') || '网站描述'}" /&gt;</div>
                <div className="ml-2">&lt;meta name="keywords" content="{getConfigValue('seo_keywords') || '关键词'}" /&gt;</div>
                
                {getConfigValue('google_analytics_id') && (
                  <>
                    <div className="ml-2 text-yellow-400">
                      &lt;!-- Google Analytics --&gt;
                    </div>
                    <div className="ml-2">&lt;script async src="https://www.googletagmanager.com/gtag/js?id={getConfigValue('google_analytics_id')}"&gt;&lt;/script&gt;</div>
                  </>
                )}
                
                {getConfigValue('google_search_console') && (
                  <div className="ml-2">&lt;meta name="{getConfigValue('google_search_console').split('=')[0]}" content="{getConfigValue('google_search_console').split('=')[1]}" /&gt;</div>
                )}
                
                {getConfigValue('baidu_analytics_id') && (
                  <>
                    <div className="ml-2 text-yellow-400">
                      &lt;!-- 百度统计 --&gt;
                    </div>
                    <div className="ml-2">&lt;script&gt;/* 百度统计代码 */&lt;/script&gt;</div>
                  </>
                )}
                
                {getConfigValue('custom_head_tags') && (
                  <>
                    <div className="ml-2 text-yellow-400">
                      &lt;!-- 自定义标签 --&gt;
                    </div>
                    <div className="ml-2 whitespace-pre-wrap">{getConfigValue('custom_head_tags')}</div>
                  </>
                )}
                
                <div>&lt;/head&gt;</div>
              </div>
            </div>

            {/* 搜索结果预览 */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="text-xs text-gray-500 mb-3">Google搜索结果预览</div>
              <div className="space-y-1">
                <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {getConfigValue('site_title') || '我的博客'}
                </div>
                <div className="text-green-600 text-sm">
                  https://example.com
                </div>
                <div className="text-gray-700 text-sm">
                  {getConfigValue('seo_description') || '网站SEO描述...'}
                </div>
                {getConfigValue('seo_keywords') && (
                  <div className="text-xs text-gray-500 mt-2">
                    关键词: {getConfigValue('seo_keywords')}
                  </div>
                )}
              </div>
            </div>

            {/* 统计工具状态 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Google Analytics</span>
                </div>
                <div className="text-xs text-gray-600">
                  {getConfigValue('google_analytics_id') ? (
                    <span className="text-green-600">✓ 已配置: {getConfigValue('google_analytics_id')}</span>
                  ) : (
                    <span className="text-gray-400">未配置</span>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center space-x-2 mb-2">
                  <Search className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">Google Search Console</span>
                </div>
                <div className="text-xs text-gray-600">
                  {getConfigValue('google_search_console') ? (
                    <span className="text-green-600">✓ 已验证</span>
                  ) : (
                    <span className="text-gray-400">未验证</span>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-800" />
                  <span className="font-medium text-sm">百度统计</span>
                </div>
                <div className="text-xs text-gray-600">
                  {getConfigValue('baidu_analytics_id') ? (
                    <span className="text-green-600">✓ 已配置</span>
                  ) : (
                    <span className="text-gray-400">未配置</span>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-white rounded border">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">自定义标签</span>
                </div>
                <div className="text-xs text-gray-600">
                  {getConfigValue('custom_head_tags') ? (
                    <span className="text-green-600">✓ 已添加</span>
                  ) : (
                    <span className="text-gray-400">未添加</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            </div>
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">配置说明</p>
              <ul className="space-y-1 text-orange-700">
                <li>• SEO关键词建议3-5个，用英文逗号分隔</li>
                <li>• SEO描述建议控制在150-160字符以内</li>
                <li>• Google Analytics ID格式：G-XXXXXXXXXX</li>
                <li>• Google Search Console验证码从网站管理员工具获取</li>
                <li>• 百度统计ID为32位字符串</li>
                <li>• 自定义Head标签请确保HTML格式正确</li>
                <li>• 配置后需要重新部署网站才能生效</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}