'use client'

import { useState } from 'react'
import { SocialFanMenuSystem } from './SocialFanMenuSystem'
import { SocialConfigInputPanels } from './SocialConfigInputPanels'

export interface SocialFanMenuConfigProps {
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
 * 社交媒体扇形菜单配置组件
 * 与基础信息模块保持一致的UI交互体验
 */
export function SocialFanMenuConfig({ configs, onUpdate }: SocialFanMenuConfigProps) {
  const [activeItem, setActiveItem] = useState<string>('')

  const handleItemSelect = (itemId: string) => {
    setActiveItem(itemId)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">社</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            社交媒体配置
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            管理网站的社交媒体链接设置
          </p>
        </div>
      </div>

      {/* 扇形菜单系统 - 固定容器 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* 扇形菜单区域 - 固定高度 */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <SocialFanMenuSystem
            activeItem={activeItem}
            onItemSelect={handleItemSelect}
            className="w-full"
          />
        </div>

        {/* 配置输入面板 - 固定最小高度 */}
        <div className="p-8 min-h-[400px]">
          <SocialConfigInputPanels
            activeItem={activeItem}
            configs={configs}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  )
}

// 默认导出
export default SocialFanMenuConfig