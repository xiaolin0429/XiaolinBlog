/**
 * 社交媒体平台信息卡片组件
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'
import { SocialPlatform } from '../types'

interface SocialPlatformCardProps {
  platform: SocialPlatform
  isConfigured: boolean
}

export function SocialPlatformCard({ platform, isConfigured }: SocialPlatformCardProps) {
  const Icon = platform.icon

  return (
    <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${platform.gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              <span>{platform.label}</span>
              <Badge variant={isConfigured ? "default" : "secondary"} className="ml-2">
                {isConfigured ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    已配置
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    未配置
                  </>
                )}
              </Badge>
            </CardTitle>
            <CardDescription>{platform.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}