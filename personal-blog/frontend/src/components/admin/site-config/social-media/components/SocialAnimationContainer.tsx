/**
 * 社交媒体配置动画容器组件
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SocialAnimationContainerProps } from '../types'

export function SocialAnimationContainer({ 
  activeItem, 
  children 
}: SocialAnimationContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeItem}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}