'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MoreHorizontal, Plus, Trash2, Settings, AlertCircle, Check, X } from 'lucide-react'
import { SiteConfigValidator, ValidationResult } from '@/lib/validation/site-config'

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

interface OtherConfigProps {
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
  onAdd?: (config: Partial<SiteConfig>) => void
  onDelete?: (key: string) => void
}

export function OtherConfig({ configs, onUpdate, onAdd, onDelete }: OtherConfigProps) {
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const [newConfigKey, setNewConfigKey] = useState('')
  const [newConfigValue, setNewConfigValue] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const getConfigValue = (key: string) => {
    // 优先使用本地值，如果没有则使用配置值
    if (localValues[key] !== undefined) {
      return localValues[key]
    }
    const config = configs.find(c => c.key === key)
    return config?.value || ''
  }

  // 检查配置是否已启用（有值且不为空）
  const isConfigEnabled = (key: string) => {
    const value = getConfigValue(key)
    return value.trim() !== ''
  }

  // 验证单个配置项
  const validateField = (key: string, value: string): ValidationResult => {
    // 根据配置项的键名进行不同的验证
    if (key.includes('_url') || key.includes('_link')) {
      return SiteConfigValidator.validateUrl(value)
    }
    if (key.includes('_email')) {
      return SiteConfigValidator.validateEmail(value)
    }
    if (key.includes('_phone')) {
      return SiteConfigValidator.validatePhone(value)
    }
    // 默认验证
    return { isValid: true, errors: [] }
  }

  // 防抖更新函数
  const debouncedUpdate = useCallback((key: string, value: string) => {
    // 清除之前的定时器
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }

    // 设置新的定时器
    debounceTimers.current[key] = setTimeout(() => {
      onUpdate(key, value)
      delete debounceTimers.current[key]
    }, 500) // 500ms 防抖延迟
  }, [onUpdate])

  // 处理输入变化和验证
  const handleInputChange = (key: string, value: string) => {
    // 立即更新本地状态以保持输入响应性
    setLocalValues(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 验证字段
    const validation = validateField(key, value)
    setValidationErrors(prev => ({
      ...prev,
      [key]: validation.errors
    }))

    // 防抖更新到父组件
    debouncedUpdate(key, value)
  }

  // 清空配置（禁用功能）
  const handleClearConfig = (key: string) => {
    setLocalValues(prev => ({
      ...prev,
      [key]: ''
    }))
    setValidationErrors(prev => ({
      ...prev,
      [key]: []
    }))
    onUpdate(key, '')
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  // 初始化本地值 - 只在组件首次加载时初始化
  useEffect(() => {
    const initialValues: { [key: string]: string } = {}
    configs.forEach(config => {
      // 只有当本地值不存在时才设置初始值
      if (localValues[config.key] === undefined) {
        initialValues[config.key] = config.value
      }
    })
    
    // 只有当有新的初始值时才更新状态
    if (Object.keys(initialValues).length > 0) {
      setLocalValues(prev => ({
        ...prev,
        ...initialValues
      }))
    }
  }, [configs])

  // 组件首次挂载时初始化所有值
  useEffect(() => {
    if (configs.length > 0 && Object.keys(localValues).length === 0) {
      const initialValues: { [key: string]: string } = {}
      configs.forEach(config => {
        initialValues[config.key] = config.value
      })
      setLocalValues(initialValues)
    }
  }, [configs, localValues])

  // 添加新配置项
  const handleAddConfig = () => {
    if (!newConfigKey.trim()) return

    if (onAdd) {
      onAdd({
        key: newConfigKey,
        value: newConfigValue,
        description: newConfigDescription,
        category: 'other',
        data_type: 'string',
        is_public: 'true',
        sort_order: 0
      })
    }

    // 重置表单
    setNewConfigKey('')
    setNewConfigValue('')
    setNewConfigDescription('')
    setShowAddForm(false)
  }

  // 删除配置项
  const handleDeleteConfig = (key: string) => {
    if (onDelete) {
      onDelete(key)
    }
  }

  // 初始验证所有字段
  useEffect(() => {
    const errors: { [key: string]: string[] } = {}
    
    configs.forEach(config => {
      if (config.value.trim()) {
        const validation = validateField(config.key, config.value)
        if (!validation.isValid) {
          errors[config.key] = validation.errors
        }
      }
    })
    
    setValidationErrors(errors)
  }, [configs])

  // 获取其他分类的配置项
  const otherConfigs = configs.filter(config => 
    config.category === 'other'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MoreHorizontal className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">其他配置</h3>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>添加配置</span>
        </Button>
      </div>

      {/* 添加新配置表单 */}
      {showAddForm && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-green-600" />
              <CardTitle className="text-base">添加新配置</CardTitle>
            </div>
            <CardDescription>
              添加自定义配置项，留空则不启用该配置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-config-key" className="text-sm font-medium">
                  配置键名 *
                </Label>
                <Input
                  id="new-config-key"
                  value={newConfigKey}
                  onChange={(e) => setNewConfigKey(e.target.value)}
                  placeholder="例如：other_copyright"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="new-config-value" className="text-sm font-medium">
                  配置值
                </Label>
                <Textarea
                  id="new-config-value"
                  value={newConfigValue}
                  onChange={(e) => setNewConfigValue(e.target.value)}
                  placeholder="配置的值，留空则不启用"
                  className="min-h-[60px] resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="new-config-description" className="text-sm font-medium">
                  配置描述
                </Label>
                <Input
                  id="new-config-description"
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  placeholder="描述这个配置项的用途"
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleAddConfig} size="sm">
                  添加配置
                </Button>
                <Button 
                  onClick={() => setShowAddForm(false)} 
                  variant="outline" 
                  size="sm"
                >
                  取消
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 配置项列表 */}
      {otherConfigs.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">配置项管理</h4>
          {otherConfigs.map((config) => {
            const hasError = validationErrors[config.key] && validationErrors[config.key].length > 0
            const isEnabled = isConfigEnabled(config.key)
            
            return (
              <Card key={config.key} className={`border-l-4 ${hasError ? 'border-l-red-500' : isEnabled ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className={`h-4 w-4 ${hasError ? 'text-red-600' : isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                      <CardTitle className="text-base">{config.key}</CardTitle>
                      <div className="flex items-center space-x-1">
                        {isEnabled ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">已配置</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-400">
                            <X className="h-3 w-3" />
                            <span className="text-xs">未配置</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isEnabled && (
                        <Button
                          onClick={() => handleClearConfig(config.key)}
                          variant="outline"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <X className="h-4 w-4" />
                          <span className="ml-1">清空</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          onClick={() => handleDeleteConfig(config.key)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {config.description && (
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={config.key} className="text-sm font-medium">
                      配置值
                    </Label>
                    <Textarea
                      id={config.key}
                      value={getConfigValue(config.key)}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      placeholder="请输入配置值，留空则不启用此配置"
                      className={`min-h-[60px] resize-none ${hasError ? 'border-red-300 focus:border-red-500' : isEnabled ? 'border-green-300 focus:border-green-500' : ''}`}
                    />
                    
                    {/* 显示验证错误 */}
                    {hasError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {validationErrors[config.key].map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* 配置状态提示 */}
                    <p className="text-xs text-gray-500">
                      {isEnabled ? '此配置已启用，将在网站上生效' : '此配置未启用，不会在网站上显示'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 配置预览 */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-base">配置状态预览</CardTitle>
          </div>
          <CardDescription>
            当前其他配置项的状态预览
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 配置状态统计 */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="text-xs text-gray-500 mb-3">配置统计</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {otherConfigs.filter(config => isConfigEnabled(config.key)).length}
                  </div>
                  <div className="text-sm text-gray-600">已配置</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {otherConfigs.filter(config => !isConfigEnabled(config.key)).length}
                  </div>
                  <div className="text-sm text-gray-600">未配置</div>
                </div>
              </div>
            </div>

            {/* 已启用配置列表 */}
            {otherConfigs.filter(config => isConfigEnabled(config.key)).length > 0 && (
              <div className="p-4 bg-white rounded-lg border shadow-sm">
                <div className="text-xs text-gray-500 mb-3">已启用的配置</div>
                <div className="space-y-2">
                  {otherConfigs
                    .filter(config => isConfigEnabled(config.key))
                    .map((config) => (
                      <div key={config.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">{config.key}:</span>
                        <span className="text-sm text-gray-600 max-w-xs truncate">
                          {getConfigValue(config.key)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 未配置项提示 */}
            {otherConfigs.filter(config => !isConfigEnabled(config.key)).length > 0 && (
              <div className="p-3 bg-gray-100 rounded">
                <div className="text-xs text-gray-500 mb-2">未配置项</div>
                <div className="flex flex-wrap gap-2">
                  {otherConfigs
                    .filter(config => !isConfigEnabled(config.key))
                    .map(config => (
                      <span key={config.key} className="px-2 py-1 bg-gray-300 text-xs rounded text-gray-700">
                        {config.key}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
            </div>
            <div className="text-sm text-indigo-800">
              <p className="font-medium mb-1">配置说明</p>
              <ul className="space-y-1 text-indigo-700">
                <li>• 配置项有值时自动启用，清空值则禁用该配置</li>
                <li>• 自定义配置项支持添加任意键值对配置</li>
                <li>• 配置键名建议使用下划线命名法，如：other_copyright</li>
                <li>• 删除配置项前请确认不会影响网站正常运行</li>
                <li>• 系统会根据配置键名自动进行格式验证</li>
                <li>• 配置修改后建议测试相关功能是否正常</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}