'use client'

import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { configItems } from './config-items'
import { ConfigCard } from './config-card'
import { useConfigState } from './use-config-state'

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

interface ConfigInputPanelsProps {
  activeItem: string | null
  configs: SiteConfig[]
  onUpdate: (key: string, value: string) => void
}

export function ConfigInputPanels({ activeItem, configs, onUpdate }: ConfigInputPanelsProps) {
  const { validationErrors, getConfigValue, handleInputChange, flushPendingUpdates } = useConfigState({
    configs,
    onUpdate
  })

  // 暴露强制同步函数给全局，以便父组件调用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).flushBasicConfigUpdates = flushPendingUpdates
    }
  }, [flushPendingUpdates])

  // 获取当前活动的配置项
  const activeConfig = configItems.find(item => item.key === activeItem)

  if (!activeItem || !activeConfig) {
    return (
      <motion.div
        className="flex items-center justify-center h-40 text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>请选择一个配置项进行编辑</p>
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeItem}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <ConfigCard
          configItem={activeConfig}
          value={getConfigValue(activeConfig.key)}
          onChange={(value) => handleInputChange(activeConfig.key, value)}
          errors={validationErrors[activeConfig.key]}
        />
      </motion.div>
    </AnimatePresence>
  )
}