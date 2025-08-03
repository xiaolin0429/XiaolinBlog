/**
 * 社交媒体配置预览组件
 */

'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { SocialConfigPreviewProps } from '../types'

export function SocialConfigPreview({
  platform,
  value,
  error
}: SocialConfigPreviewProps) {
  const Icon = platform.icon
  const isConfigured = value.trim() !== '' && !error

  if (!isConfigured) {
    return null
  }

  const handleOpenLink = () => {
    const url = value.startsWith('http') ? value : `https://${value}`
    window.open(url, '_blank')
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${platform.color}`} />
          <span className="text-sm font-medium">预览链接</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenLink}
          className="flex items-center space-x-1"
        >
          <ExternalLink className="w-3 h-3" />
          <span>访问</span>
        </Button>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 break-all">
        {value}
      </p>
    </div>
  )
}