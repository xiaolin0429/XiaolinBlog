'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Type, Globe, FileText, Image, Palette, Languages, 
  Clock, Copyright, Shield, Building, Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  color: string
  gradient: string
}

interface FanMenuSystemProps {
  activeItem: string
  onItemSelect: (itemId: string) => void
  className?: string
}

const menuItems: MenuItem[] = [
  {
    id: 'site_title',
    label: '网站标题',
    icon: Type,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'site_subtitle',
    label: '网站副标题',
    icon: Globe,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'site_description',
    label: '网站描述',
    icon: FileText,
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'site_logo',
    label: '网站Logo',
    icon: Image,
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-pink-600'
  },
  {
    id: 'site_favicon',
    label: '网站图标',
    icon: Palette,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'site_language',
    label: '网站语言',
    icon: Languages,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'site_timezone',
    label: '时区设置',
    icon: Clock,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'site_copyright',
    label: '版权信息',
    icon: Copyright,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 'icp_number',
    label: 'ICP备案号',
    icon: Shield,
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    id: 'police_number',
    label: '公安备案号',
    icon: Building,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600'
  }
]

export function FanMenuSystem({ activeItem, onItemSelect, className }: FanMenuSystemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHorizontalMenu, setShowHorizontalMenu] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  // 计算圆形环绕的角度和位置
  const calculateCirclePosition = (index: number, total: number, radius: number = 120) => {
    const angleStep = (360 / total) // 360度平均分布
    const angle = angleStep * index - 90 // 从顶部开始（-90度偏移）
    const radian = (angle * Math.PI) / 180
    
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
      rotate: 0 // 图标保持正向
    }
  }

  // 处理鼠标进入主图标
  const handleMouseEnter = () => {
    setIsExpanded(true)
  }

  // 处理鼠标离开整个菜单区域
  const handleMouseLeave = () => {
    if (!selectedItem) {
      setIsExpanded(false)
      setShowHorizontalMenu(false)
    }
  }

  // 处理点击子菜单项
  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item.id)
    setShowHorizontalMenu(true)
    onItemSelect(item.id)
  }

  // 处理横向菜单项点击
  const handleHorizontalMenuClick = (item: MenuItem) => {
    setSelectedItem(item.id)
    onItemSelect(item.id)
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* 固定尺寸的扇形菜单容器 - 16:9 比例，最小高度 400px */}
      <div className="relative w-full">
        {/* 扇形菜单区域 - 固定高度容器 */}
        <div 
          className="relative flex items-center justify-center w-full h-96 min-h-[400px] max-h-[500px]"
          onMouseLeave={handleMouseLeave}
        >
          {/* 主图标 - 扇形堆叠状态 */}
          <motion.div
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl cursor-pointer flex items-center justify-center z-10"
            onMouseEnter={handleMouseEnter}
            animate={{ 
              rotate: isExpanded ? 360 : 0,
              scale: isExpanded ? 1.1 : 1
            }}
            transition={{ 
              duration: 0.6, 
              type: "spring", 
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ scale: 1.05 }}
          >
            {/* 主图标内容 - 堆叠的小图标 */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-white" />
              {/* 堆叠效果的小图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                {menuItems.slice(0, 4).map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.id}
                      className="absolute"
                      style={{
                        transform: `translate(${(index - 1.5) * 3}px, ${(index - 1.5) * 3}px)`
                      }}
                      animate={{
                        opacity: isExpanded ? 0 : 0.6,
                        scale: isExpanded ? 0 : 0.4
                      }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* 脉动效果 */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* 圆形环绕的子菜单项 */}
          <AnimatePresence>
            {isExpanded && menuItems.map((item, index) => {
              const Icon = item.icon
              const position = calculateCirclePosition(index, menuItems.length)
              
              return (
                <motion.div
                  key={item.id}
                  className="absolute cursor-pointer group"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0, 
                    opacity: 0 
                  }}
                  animate={{ 
                    x: position.x, 
                    y: position.y, 
                    scale: 1, 
                    opacity: 1 
                  }}
                  exit={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0, 
                    opacity: 0 
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  onClick={() => handleItemClick(item)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.gradient} shadow-lg flex items-center justify-center relative`}>
                    <Icon className="w-6 h-6 text-white" />
                    
                    {/* 悬停时显示标签 */}
                    <motion.div
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ zIndex: 1000 }}
                    >
                      {item.label}
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* 提示文字 - 固定位置 */}
          {!isExpanded && (
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-gray-500 text-center whitespace-nowrap">
                将鼠标悬停在中心图标上查看所有配置选项
              </p>
            </motion.div>
          )}
        </div>

        {/* 横向菜单栏 - 固定高度容器 */}
        <div className="w-full min-h-[80px]">
          <AnimatePresence>
            {showHorizontalMenu && (
              <motion.div
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-wrap gap-2 justify-center">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = selectedItem === item.id
                    
                    return (
                      <motion.button
                        key={item.id}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                          isActive 
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-md` 
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                        )}
                        onClick={() => handleHorizontalMenuClick(item)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}