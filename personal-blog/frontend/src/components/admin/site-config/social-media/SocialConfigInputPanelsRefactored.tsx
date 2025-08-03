/**
 * 重构后的社交媒体配置输入面板组件
 */

'use client'

import { CardContent } from '@/components/ui/card'
import { useSocialConfig } from './hooks/useSocialConfig'
import { 
  SocialAnimationContainer,
  SocialConfigForm,
  SocialConfigPreview,
  SocialConfigTips,
  SocialPlatformCard,
  SocialEmptyState
} from './components'
import { SocialConfigInputPanelsProps } from './types'

export function SocialConfigInputPanelsRefactored({ 
  activeItem, 
  configs, 
  onUpdate 
}: SocialConfigInputPanelsProps) {
  const {
    getConfigValue,
    isConfigured,
    handleInputChange,
    handleClearConfig,
    getPlatform,
    getValidationError
  } = useSocialConfig({ configs, onUpdate })

  const activePlatform = getPlatform(activeItem)

  if (!activePlatform) {
    return <SocialEmptyState />
  }

  const urlValue = getConfigValue(activePlatform.urlKey)
  const hasError = getValidationError(activePlatform.urlKey)
  const configured = isConfigured(activePlatform.urlKey)

  return (
    <SocialAnimationContainer activeItem={activeItem}>
      {/* 平台信息卡片 */}
      <SocialPlatformCard 
        platform={activePlatform} 
        isConfigured={configured} 
      />
      
      <CardContent className="space-y-6">
        {/* URL输入表单 */}
        <SocialConfigForm
          platform={activePlatform}
          value={urlValue}
          error={hasError}
          onChange={(value) => handleInputChange(activePlatform.urlKey, value)}
          onClear={() => handleClearConfig(activePlatform.urlKey)}
        />

        {/* 预览链接 */}
        <SocialConfigPreview
          platform={activePlatform}
          value={urlValue}
          error={hasError}
        />

        {/* 配置提示 */}
        <SocialConfigTips platform={activePlatform} />
      </CardContent>
    </SocialAnimationContainer>
  )
}