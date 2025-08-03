'use client'

/**
 * 基础信息配置主页面组件
 * 使用扇形菜单系统
 */

import { FanMenuBasicInfoConfig } from './basic-info/FanMenuBasicInfoConfig'

export interface BasicInfoConfigPageProps {
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

/**
 * 基础信息配置页面
 */
export function BasicInfoConfigPage({ configs, onUpdate }: BasicInfoConfigPageProps) {
  return <FanMenuBasicInfoConfig configs={configs} onUpdate={onUpdate} />
}

// 默认导出
export default BasicInfoConfigPage