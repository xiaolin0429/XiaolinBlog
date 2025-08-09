'use client'

import React from 'react'
import { Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// 导入类型和常量
import { BASIC_INFO_ITEMS } from './constants'

// 导入自定义 Hook
import { useBasicInfoConfig } from './hooks/useBasicInfoConfigRefactored'

// 导入子组件
import {
  BasicInfoAnimationContainer,
  BasicInfoCardSelector,
  BasicInfoConfigForm,
  BasicInfoPreview,
  BasicInfoConfigTips
} from './components'

export interface BasicInfoConfigRefactorProps {
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

export function BasicInfoConfigRefactored({ configs, onUpdate }: BasicInfoConfigRefactorProps) {
  const { toast } = useToast()
  
  // 将 SiteConfig[] 转换为 Record<string, string>
  const configsRecord = React.useMemo(() => {
    const record: Record<string, string> = {}
    configs.forEach(config => {
      record[config.key] = config.value
    })
    return record
  }, [configs])
  
  // 使用自定义 Hook 管理状态和逻辑
  const {
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
  } = useBasicInfoConfig({ configs: configsRecord, onUpdate })

  return (
    <div className="space-y-6">
      {/* 标题和控制按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">基础信息配置</h3>
        </div>
        {isExpanded && (
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            收缩所有卡片
          </button>
        )}
      </div>
      
      {/* 动画容器 */}
      <div className="relative" ref={containerRef}>
        <BasicInfoAnimationContainer
          isExpanded={isExpanded}
          isTransitioning={isTransitioning}
          animatingCard={animatingCard}
          selectedCardPosition={selectedCardPosition}
          validationErrors={validationErrors}
          containerRef={containerRef}
          cardRefs={cardRefs}
          getConfigValue={getConfigValue}
          onCardClick={handleCardClick}
        />

        {/* 展开状态 - 显示选中的卡片详情 */}
        {isExpanded && !isTransitioning && (
          <div className="space-y-6 animate-fade-in-up">
            {/* 卡片选择器 */}
            <BasicInfoCardSelector
              basicInfoItems={BASIC_INFO_ITEMS}
              expandedCard={expandedCard}
              getConfigValue={getConfigValue}
              onCardSelect={(itemKey: string) => handleCardClick(itemKey)}
            />
            
            {/* 展开的卡片详情 */}
            {expandedCard && BASIC_INFO_ITEMS.map((item) => {
              if (item.key !== expandedCard) return null
              
              const value = getConfigValue(item.key)
              const hasError = validationErrors[item.key] && validationErrors[item.key].length > 0
              
              return (
                <BasicInfoConfigForm
                  key={item.key}
                  item={item}
                  value={value}
                  hasError={hasError}
                  validationErrors={validationErrors}
                  onInputChange={handleInputChange}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* 配置预览 */}
      <BasicInfoPreview
        config={{
          site_title: getConfigValue('site_title'),
          site_subtitle: getConfigValue('site_subtitle'),
          site_description: getConfigValue('site_description'),
          site_logo: getConfigValue('site_logo'),
          site_favicon: getConfigValue('site_favicon'),
          site_language: getConfigValue('site_language'),
          site_timezone: getConfigValue('site_timezone'),
          site_copyright: getConfigValue('site_copyright'),
          site_icp: getConfigValue('site_icp'),
          site_public_security: getConfigValue('site_public_security')
        }}
      />

      {/* 配置说明 */}
      <BasicInfoConfigTips />
    </div>
  )
}