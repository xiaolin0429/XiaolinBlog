'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { BasicInfoCardItem } from '../types'

interface BasicInfoConfigFormProps {
  item: BasicInfoCardItem
  value: string
  hasError: boolean
  validationErrors: Record<string, string[]>
  onInputChange: (key: string, value: string) => void
}

export function BasicInfoConfigForm({
  item,
  value,
  hasError,
  validationErrors,
  onInputChange
}: BasicInfoConfigFormProps) {
  const Icon = item.icon
  const errors = validationErrors[item.key] || []

  const renderInput = () => {
    switch (item.type) {
      case 'textarea':
        return (
          <Textarea
            id={item.key}
            value={value}
            onChange={(e) => onInputChange(item.key, e.target.value)}
            placeholder={item.placeholder}
            maxLength={item.maxLength}
            className={hasError ? 'border-red-500' : ''}
            rows={4}
          />
        )
      
      case 'select':
        return (
          <Select value={value} onValueChange={(newValue) => onInputChange(item.key, newValue)}>
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={item.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            id={item.key}
            type={item.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => onInputChange(item.key, e.target.value)}
            placeholder={item.placeholder}
            maxLength={item.maxLength}
            className={hasError ? 'border-red-500' : ''}
          />
        )
    }
  }

  return (
    <Card className={`transition-all ${hasError ? 'border-red-200 bg-red-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-blue-600" />
          {item.label}
          {item.required && <span className="text-red-500">*</span>}
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={item.key} className="text-sm font-medium">
            {item.label}
          </Label>
          {renderInput()}
          {item.maxLength && (
            <div className="text-xs text-gray-500 text-right">
              {value.length}/{item.maxLength}
            </div>
          )}
        </div>
        
        {hasError && errors.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}