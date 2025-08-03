import { useState, useEffect, useCallback, useRef } from 'react'
import { ConfigValidator } from './validation-utils'

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

interface UseConfigStateProps {
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
}

export function useConfigState({ configs, onUpdate }: UseConfigStateProps) {
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // 获取配置值
  const getConfigValue = useCallback((key: string) => {
    // 优先使用本地值（正在编辑的值）
    if (localValues[key] !== undefined) {
      return localValues[key]
    }
    const config = configs.find(c => c.key === key)
    return config?.value || ''
  }, [localValues, configs])

  // 验证单个配置项
  const validateField = useCallback((key: string, value: string) => {
    switch (key) {
      case 'site_title':
        return ConfigValidator.validateSiteTitle(value)
      case 'site_description':
        return ConfigValidator.validateSiteDescription(value)
      case 'site_logo':
      case 'site_favicon':
        return value ? ConfigValidator.validateUrl(value) : { isValid: true, errors: [] }
      default:
        return { isValid: true, errors: [] }
    }
  }, [])

  // 防抖处理输入变化
  const handleInputChange = useCallback((key: string, value: string) => {
    // 立即更新本地状态以保证输入流畅
    setLocalValues(prev => ({
      ...prev,
      [key]: value
    }))
    
    // 立即验证并更新错误状态
    const validation = validateField(key, value)
    setValidationErrors(prev => ({
      ...prev,
      [key]: validation.errors
    }))

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器，延迟调用onUpdate
    timeoutRef.current = setTimeout(() => {
      onUpdate(key, value)
    }, 300) // 300ms防抖，与社交媒体保持一致
  }, [validateField, onUpdate])

  // 初始化本地值
  useEffect(() => {
    if (configs.length > 0) {
      const initialValues: { [key: string]: string } = {}
      configs.forEach(config => {
        initialValues[config.key] = config.value
      })
      setLocalValues(initialValues)
    }
  }, [configs.length])

  // 强制同步所有待处理的更新（用于保存时）
  const flushPendingUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    
    // 同步所有本地值到父组件
    Object.entries(localValues).forEach(([key, value]) => {
      const config = configs.find(c => c.key === key)
      const currentValue = config?.value || ''
      if (currentValue !== value) {
        onUpdate(key, value)
      }
    })
  }, [localValues, configs, onUpdate])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    validationErrors,
    getConfigValue,
    handleInputChange,
    flushPendingUpdates
  }
}