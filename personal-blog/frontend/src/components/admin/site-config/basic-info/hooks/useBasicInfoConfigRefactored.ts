/**
 * 基础信息配置Hook - 重构版本
 * 适配横向菜单模式
 */

import { useState, useCallback, useRef } from 'react'
import { BASIC_INFO_VALIDATION_RULES } from '../constants'

export interface UseBasicInfoConfigProps {
  configs: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

export interface UseBasicInfoConfigReturn {
  validationErrors: Record<string, string[]>
  isExpanded: boolean
  expandedCard: string | null
  isTransitioning: boolean
  selectedCardPosition: { top: number; left: number; width: number; height: number } | null
  animatingCard: string | null
  cardRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
  containerRef: React.RefObject<HTMLDivElement | null>
  getConfigValue: (key: string) => string
  handleInputChange: (key: string, value: string) => void
  handleCardClick: (cardKey: string) => void
  handleCollapseAll: () => void
}

/**
 * 基础信息配置Hook - 重构版本
 */
export function useBasicInfoConfig({
  configs,
  onUpdate
}: UseBasicInfoConfigProps): UseBasicInfoConfigReturn {
  // 状态管理
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedCardPosition, setSelectedCardPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const [animatingCard, setAnimatingCard] = useState<string | null>(null)

  // Refs
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * 获取配置值
   */
  const getConfigValue = useCallback((key: string): string => {
    return configs[key] || ''
  }, [configs])

  /**
   * 验证单个字段
   */
  const validateField = useCallback((key: string, value: string): string[] => {
    const errors: string[] = []
    const rule = BASIC_INFO_VALIDATION_RULES[key]
    
    if (!rule) return errors

    // 必填验证
    if (rule.required && (!value || value.trim() === '')) {
      errors.push(rule.message)
      return errors
    }

    // 长度验证
    if ('minLength' in rule && rule.minLength && value && value.length < rule.minLength) {
      errors.push(rule.message)
    }

    if ('maxLength' in rule && rule.maxLength && value && value.length > rule.maxLength) {
      errors.push(rule.message)
    }

    // 正则验证
    if ('pattern' in rule && rule.pattern && value && !rule.pattern.test(value)) {
      errors.push(rule.message)
    }

    return errors
  }, [])

  /**
   * 处理输入变化
   */
  const handleInputChange = useCallback((key: string, value: string) => {
    // 更新配置值
    onUpdate(key, value)
    
    // 验证字段
    const fieldErrors = validateField(key, value)
    setValidationErrors(prev => ({
      ...prev,
      [key]: fieldErrors
    }))
  }, [onUpdate, validateField])

  /**
   * 处理卡片点击
   */
  const handleCardClick = useCallback((cardKey: string) => {
    const cardElement = cardRefs.current[cardKey]
    if (!cardElement || !containerRef.current) return

    // 如果已经展开且点击的是同一个卡片，则收缩
    if (isExpanded && expandedCard === cardKey) {
      setIsTransitioning(true)
      setIsExpanded(false)
      setExpandedCard(null)
      setSelectedCardPosition(null)
      setAnimatingCard(null)
      
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
      return
    }

    // 获取卡片位置
    const containerRect = containerRef.current.getBoundingClientRect()
    const cardRect = cardElement.getBoundingClientRect()
    
    const position = {
      top: cardRect.top - containerRect.top,
      left: cardRect.left - containerRect.left,
      width: cardRect.width,
      height: cardRect.height
    }

    setSelectedCardPosition(position)
    setAnimatingCard(cardKey)
    setIsTransitioning(true)

    // 延迟展开
    setTimeout(() => {
      setIsExpanded(true)
      setExpandedCard(cardKey)
      setIsTransitioning(false)
    }, 150)
  }, [isExpanded, expandedCard])

  /**
   * 收缩所有卡片
   */
  const handleCollapseAll = useCallback(() => {
    setIsTransitioning(true)
    setIsExpanded(false)
    setExpandedCard(null)
    setSelectedCardPosition(null)
    setAnimatingCard(null)
    
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }, [])

  return {
    validationErrors,
    isExpanded,
    expandedCard,
    isTransitioning,
    selectedCardPosition,
    animatingCard,
    cardRefs,
    containerRef,
    getConfigValue,
    handleInputChange,
    handleCardClick,
    handleCollapseAll
  }
}