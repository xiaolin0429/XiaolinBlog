'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Info, Lightbulb, Shield, Globe } from 'lucide-react'

export function BasicInfoConfigTips() {
  const tips = [
    {
      icon: Info,
      title: '配置说明',
      content: '基础信息配置用于设置网站的基本信息，包括标题、描述、语言等核心设置。'
    },
    {
      icon: Lightbulb,
      title: '优化建议',
      content: '网站标题和描述对SEO很重要，建议包含关键词但保持自然。标题控制在60字符以内，描述控制在200字符以内。'
    },
    {
      icon: Shield,
      title: '备案信息',
      content: '如果您的网站部署在中国大陆，需要填写ICP备案号和公安备案号。这些信息通常显示在网站底部。'
    },
    {
      icon: Globe,
      title: '国际化',
      content: '语言和时区设置会影响网站的显示效果，请根据您的目标用户群体选择合适的设置。'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          配置说明
        </CardTitle>
        <CardDescription>
          了解基础信息配置的相关说明和最佳实践
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => {
            const Icon = tip.icon
            return (
              <div key={index} className="flex gap-3 p-3 rounded-lg border bg-gray-50/50">
                <Icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}