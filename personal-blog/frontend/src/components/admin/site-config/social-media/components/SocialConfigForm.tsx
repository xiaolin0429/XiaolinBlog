/**
 * 社交媒体配置表单组件
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Check, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SocialConfigFormProps } from '../types'

export function SocialConfigForm({
  platform,
  value,
  error,
  onChange,
  onClear
}: SocialConfigFormProps) {
  const hasError = !!error
  const isConfigured = value.trim() !== ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={platform.urlKey} className="text-sm font-medium">
          {platform.label}链接
        </Label>
        {isConfigured && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
            <span>清空</span>
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Input
          id={platform.urlKey}
          type="text"
          placeholder={platform.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pr-10",
            hasError && "border-red-500 focus:border-red-500",
            isConfigured && value && !hasError && "border-green-500 focus:border-green-500"
          )}
        />
        {value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <X className="w-4 h-4 text-red-500" />
            ) : (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {hasError && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      
      {!hasError && value && isConfigured && (
        <p className="text-xs text-green-600 mt-1">链接格式正确</p>
      )}
      
      <p className="text-xs text-gray-500">
        {isConfigured ? '配置后将在网站上显示此社交媒体链接' : '留空则不显示此社交媒体链接'}
      </p>
    </div>
  )
}