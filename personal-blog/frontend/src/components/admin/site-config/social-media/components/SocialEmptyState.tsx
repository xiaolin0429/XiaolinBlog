/**
 * 社交媒体配置空状态组件
 */

'use client'

import { Globe } from 'lucide-react'

export function SocialEmptyState() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="text-center">
        <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>请选择一个社交媒体平台进行配置</p>
      </div>
    </div>
  )
}