/**
 * 优化后的配置表单组件
 * 展示统一的参数传递和验证逻辑
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { ConfigGroup, ConfigMetadata, ConfigValidationResult } from '@/types/site-config-optimized'

interface OptimizedConfigFormProps {
  group: ConfigGroup
  getConfigValue: (key: string) => string
  onUpdate: (key: string, value: string, immediate?: boolean) => void
  validateConfigs: (configs: any[]) => Promise<ConfigValidationResult>
}

interface FieldState {
  value: string
  error: string[]
  warning: string[]
  validating: boolean
  touched: boolean
  dirty: boolean
}

export function OptimizedConfigForm({
  group,
  getConfigValue,
  onUpdate,
  validateConfigs
}: OptimizedConfigFormProps) {
  // 字段状态管理
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [validationInProgress, setValidationInProgress] = useState(false)

  // 初始化字段状态
  useEffect(() => {
    const initialStates: Record<string, FieldState> = {}
    
    group.items.forEach(item => {
      initialStates[item.key] = {
        value: getConfigValue(item.key),
        error: [],
        warning: [],
        validating: false,
        touched: false,
        dirty: false
      }
    })
    
    setFieldStates(initialStates)
  }, [group.items, getConfigValue])

  // 验证单个字段
  const validateField = useCallback(async (item: ConfigMetadata, value: string): Promise<{
    errors: string[]
    warnings: string[]
  }> => {
    const errors: string[] = []
    const warnings: string[] = []

    // 必填验证
    if (item.validation?.required && !value.trim()) {
      errors.push('此字段为必填项')
    }

    // 长度验证
    if (value && item.validation?.minLength && value.length < item.validation.minLength) {
      errors.push(`最少需要 ${item.validation.minLength} 个字符`)
    }
    
    if (value && item.validation?.maxLength && value.length > item.validation.maxLength) {
      errors.push(`最多允许 ${item.validation.maxLength} 个字符`)
    }

    // 模式验证
    if (value && item.validation?.pattern) {
      const regex = new RegExp(item.validation.pattern)
      if (!regex.test(value)) {
        errors.push('格式不正确')
      }
    }

    // 自定义验证
    if (value && item.validation?.customValidator) {
      const customError = item.validation.customValidator(value)
      if (customError) {
        errors.push(customError)
      }
    }

    // 长度警告
    if (value && item.validation?.maxLength) {
      const ratio = value.length / item.validation.maxLength
      if (ratio > 0.8) {
        warnings.push(`已使用 ${Math.round(ratio * 100)}% 的字符限制`)
      }
    }

    return { errors, warnings }
  }, [])

  // 处理字段变更
  const handleFieldChange = useCallback(async (item: ConfigMetadata, newValue: string) => {
    const key = item.key
    
    // 立即更新本地状态
    setFieldStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: newValue,
        dirty: newValue !== getConfigValue(key),
        touched: true,
        validating: true
      }
    }))

    // 调用父组件的更新方法（带防抖）
    onUpdate(key, newValue)

    // 异步验证
    try {
      const { errors, warnings } = await validateField(item, newValue)
      
      setFieldStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          error: errors,
          warning: warnings,
          validating: false
        }
      }))
    } catch (error) {
      console.error('字段验证失败:', error)
      setFieldStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          error: ['验证失败'],
          validating: false
        }
      }))
    }
  }, [getConfigValue, onUpdate, validateField])

  // 处理字段失焦
  const handleFieldBlur = useCallback((key: string) => {
    setFieldStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        touched: true
      }
    }))
  }, [])

  // 批量验证所有字段
  const validateAllFields = useCallback(async () => {
    setValidationInProgress(true)
    
    try {
      const configsToValidate = group.items.map(item => ({
        key: item.key,
        value: fieldStates[item.key]?.value || getConfigValue(item.key),
        data_type: item.ui?.type === 'textarea' ? 'string' : 'string'
      }))

      const result = await validateConfigs(configsToValidate)
      
      // 更新字段状态
      setFieldStates(prev => {
        const newStates = { ...prev }
        
        group.items.forEach(item => {
          const key = item.key
          newStates[key] = {
            ...newStates[key],
            error: result.errors[key] || [],
            warning: result.warnings[key] || []
          }
        })
        
        return newStates
      })
      
      return result
    } catch (error) {
      console.error('批量验证失败:', error)
      return { valid: false, errors: {}, warnings: {} }
    } finally {
      setValidationInProgress(false)
    }
  }, [group.items, fieldStates, getConfigValue, validateConfigs])

  // 渲染输入组件
  const renderInput = (item: ConfigMetadata) => {
    const key = item.key
    const fieldState = fieldStates[key] || {
      value: getConfigValue(key),
      error: [],
      warning: [],
      validating: false,
      touched: false,
      dirty: false
    }

    const hasError = fieldState.error.length > 0
    const hasWarning = fieldState.warning.length > 0
    const showValidation = fieldState.touched || fieldState.dirty

    const commonProps = {
      id: key,
      value: fieldState.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleFieldChange(item, e.target.value),
      onBlur: () => handleFieldBlur(key),
      placeholder: item.placeholder,
      className: `${hasError && showValidation ? 'border-red-500' : ''} ${
        hasWarning && showValidation ? 'border-yellow-500' : ''
      }`
    }

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={key} className="text-sm font-medium">
            {item.label}
            {item.validation?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          
          <div className="flex items-center space-x-2">
            {fieldState.validating && (
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            )}
            
            {fieldState.dirty && (
              <Badge variant="outline" className="text-xs">
                已修改
              </Badge>
            )}
            
            {!hasError && fieldState.touched && fieldState.value && (
              <CheckCircle className="w-3 h-3 text-green-500" />
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground">
            {item.description}
          </p>
        )}

        {item.ui?.type === 'textarea' ? (
          <Textarea
            {...commonProps}
            rows={item.ui.rows || 3}
          />
        ) : (
          <Input {...commonProps} />
        )}

        {/* 字符计数 */}
        {item.validation?.maxLength && fieldState.value && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {fieldState.value.length} / {item.validation.maxLength} 字符
            </span>
            <span>
              {item.validation.maxLength - fieldState.value.length} 剩余
            </span>
          </div>
        )}

        {/* 错误信息 */}
        {hasError && showValidation && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {fieldState.error.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* 警告信息 */}
        {hasWarning && showValidation && !hasError && (
          <Alert className="py-2 border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-3 w-3 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-700">
              {fieldState.warning.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // 计算统计信息
  const stats = {
    total: group.items.length,
    configured: group.items.filter(item => {
      const value = fieldStates[item.key]?.value || getConfigValue(item.key)
      return value && value.trim() !== ''
    }).length,
    withErrors: group.items.filter(item => {
      const fieldState = fieldStates[item.key]
      return fieldState && fieldState.error.length > 0 && fieldState.touched
    }).length,
    dirty: group.items.filter(item => {
      const fieldState = fieldStates[item.key]
      return fieldState && fieldState.dirty
    }).length
  }

  return (
    <div className="space-y-6">
      {/* 分组头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{group.icon || '📝'}</span>
          <div>
            <h3 className="text-lg font-semibold">{group.label}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? '隐藏预览' : '显示预览'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={validateAllFields}
            disabled={validationInProgress}
          >
            {validationInProgress ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '验证全部'
            )}
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex space-x-4">
        <Badge variant="secondary">
          总计: {stats.total}
        </Badge>
        <Badge variant="secondary">
          已配置: {stats.configured}
        </Badge>
        {stats.withErrors > 0 && (
          <Badge variant="destructive">
            错误: {stats.withErrors}
          </Badge>
        )}
        {stats.dirty > 0 && (
          <Badge variant="outline">
            待保存: {stats.dirty}
          </Badge>
        )}
      </div>

      {/* 配置表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{group.label}配置</CardTitle>
          <CardDescription>
            修改后会自动保存，支持实时验证和预览
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {group.items.map(renderInput)}
        </CardContent>
      </Card>

      {/* 预览区域 */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">配置预览</CardTitle>
            <CardDescription>
              当前配置的实时预览效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <pre className="text-sm">
                {JSON.stringify(
                  Object.fromEntries(
                    group.items.map(item => [
                      item.key,
                      fieldStates[item.key]?.value || getConfigValue(item.key)
                    ])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OptimizedConfigForm