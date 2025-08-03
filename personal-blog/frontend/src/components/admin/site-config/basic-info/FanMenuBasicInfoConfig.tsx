'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { FanMenuSystem } from './FanMenuSystem'
import { ConfigInputPanels } from './ConfigInputPanels'

interface SiteConfig {
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
}

interface FanMenuBasicInfoConfigProps {
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
}

export function FanMenuBasicInfoConfig({ configs, onUpdate }: FanMenuBasicInfoConfigProps) {
  const [activeItem, setActiveItem] = useState<string>('')

  const handleItemSelect = (itemId: string) => {
    setActiveItem(itemId)
  }

  return (
    <div className="space-y-8">
      {/* 标题区域 */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">基础信息配置</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理网站的基本信息和其他设置
          </p>
        </div>
      </div>

      {/* 扇形菜单系统 - 固定容器 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* 扇形菜单区域 - 固定高度 */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <FanMenuSystem
            activeItem={activeItem}
            onItemSelect={handleItemSelect}
            className="w-full"
          />
        </div>

        {/* 配置输入面板 - 固定最小高度 */}
        <div className="p-8 min-h-[400px]">
          <ConfigInputPanels
            activeItem={activeItem}
            configs={configs}
            onUpdate={onUpdate}
          />
        </div>
      </div>

      {/* 使用说明 */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-2">使用说明</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• 将鼠标悬停在中央图标上，查看扇形展开的配置项</li>
              <li>• 点击任意配置项图标，在横向菜单中选择具体设置</li>
              <li>• 在横向菜单中点击配置项，下方将显示对应的设置表单</li>
              <li>• 所有配置项支持实时预览和自动保存</li>
              <li>• 系统会自动验证输入格式并提供错误提示</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}