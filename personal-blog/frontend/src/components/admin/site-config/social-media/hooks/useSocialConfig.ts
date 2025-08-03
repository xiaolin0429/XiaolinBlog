/**
 * 社交媒体配置自定义 Hook
 */

import { useState, useCallback, useRef } from 'react'
import { SOCIAL_PLATFORMS, URL_VALIDATION_RULES } from '../constants'
import { SocialPlatform, SocialValidationResult } from '../types'

interface UseSocialConfigProps {
  configs: Array<{
    id: number
    key: string
    value: string
    category: string
    description: string
    data_type: string
    is_public: string
    sort_order: number
    created_at: string
    updated_at: string
  }>
  onUpdate: (key: string, value: string) => void
}

export function useSocialConfig({ configs, onUpdate }: UseSocialConfigProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // 获取配置值
  const getConfigValue = useCallback((key: string): string => {
    // 优先使用本地值（正在编辑的值）
    if (localValues[key] !== undefined) {
      return localValues[key]
    }
    const config = configs.find(c => c.key === key)
    return config?.value || ''
  }, [configs, localValues])

  // 检查是否已配置
  const isConfigured = useCallback((key: string): boolean => {
    const value = getConfigValue(key)
    return value.trim() !== ''
  }, [getConfigValue])

  // 验证URL格式
  const validateUrl = useCallback((platform: SocialPlatform, value: string): SocialValidationResult => {
    if (!value.trim()) {
      return { isValid: true, error: '' }
    }
    
    if (platform.urlPattern && !platform.urlPattern.test(value)) {
      return { 
        isValid: false, 
        error: `请输入有效的${platform.label}链接格式` 
      }
    }
    
    return { isValid: true, error: '' }
  }, [])

  // 防抖处理输入变化
  const handleInputChange = useCallback((key: string, value: string) => {
    // 立即更新本地状态以保证输入流畅
    setLocalValues(prev => ({
      ...prev,
      [key]: value
    }))

    // 立即验证并更新错误状态
    const platform = SOCIAL_PLATFORMS.find(p => p.urlKey === key)
    if (platform) {
      const validation = validateUrl(platform, value)
      setValidationErrors(prev => ({
        ...prev,
        [key]: validation.error
      }))
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器，延迟调用onUpdate
    timeoutRef.current = setTimeout(() => {
      onUpdate(key, value)
    }, 300) // 300ms防抖
  }, [onUpdate, validateUrl])

  // 清空配置
  const handleClearConfig = useCallback((key: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [key]: ''
    }))
    setLocalValues(prev => ({
      ...prev,
      [key]: ''
    }))
    onUpdate(key, '')
  }, [onUpdate])

  // 获取平台信息
  const getPlatform = useCallback((id: string): SocialPlatform | undefined => {
    return SOCIAL_PLATFORMS.find(p => p.id === id)
  }, [])

  // 获取验证错误
  const getValidationError = useCallback((key: string): string => {
    return validationErrors[key] || ''
  }, [validationErrors])

  return {
    getConfigValue,
    isConfigured,
    validateUrl,
    handleInputChange,
    handleClearConfig,
    getPlatform,
    getValidationError,
    validationErrors,
    localValues
  }
}