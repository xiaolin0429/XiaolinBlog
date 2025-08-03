/**
 * 社交媒体配置提示组件
 */

'use client'

import { SocialConfigTipsProps } from '../types'

export function SocialConfigTips({ platform }: SocialConfigTipsProps) {
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        配置说明
      </h4>
      <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
        <li>• 填入链接后将自动在网站上显示对应的社交媒体图标</li>
        <li>• 清空链接内容则不会在网站上显示此社交媒体</li>
        <li>• 确保链接格式正确，以http://或https://开头</li>
        <li>• 建议使用完整的URL地址，包含协议前缀</li>
        {platform.id === 'wechat' && (
          <li>• 微信可以填入微信号或二维码图片链接</li>
        )}
      </ul>
    </div>
  )
}