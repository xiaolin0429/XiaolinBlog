/**
 * 社交媒体配置相关类型定义
 */

export interface SocialPlatform {
  id: string
  label: string
  icon: React.ComponentType<any>
  color: string
  gradient: string
  urlKey: string
  placeholder: string
  description: string
  urlPattern?: RegExp
}

export interface SocialConfigData {
  github: string
  twitter: string
  linkedin: string
  instagram: string
  facebook: string
  youtube: string
  wechat: string
  weibo: string
}

export interface SocialConfigInputPanelsProps {
  activeItem: string
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

export interface SocialConfigFormProps {
  platform: SocialPlatform
  value: string
  error?: string
  onChange: (value: string) => void
  onClear: () => void
}

export interface SocialConfigPreviewProps {
  platform: SocialPlatform
  value: string
  error?: string
}

export interface SocialValidationResult {
  isValid: boolean
  error: string
}

export interface SocialConfigTipsProps {
  platform: SocialPlatform
}

export interface SocialAnimationContainerProps {
  activeItem: string
  children: React.ReactNode
}