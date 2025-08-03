'use client'

// 使用扇形菜单的社交媒体配置组件
import { SocialFanMenuConfig } from './social-media/SocialFanMenuConfig'

export interface SocialConfigProps {
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

export function SocialConfig({ configs, onUpdate }: SocialConfigProps) {
  return <SocialFanMenuConfig configs={configs} onUpdate={onUpdate} />
}

