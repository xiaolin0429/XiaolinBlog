'use client'

import React from 'react'
import { BasicInfoCardItem } from '../types'

interface BasicInfoCardSelectorProps {
  basicInfoItems: BasicInfoCardItem[]
  expandedCard: string | null
  getConfigValue: (key: string) => string
  onCardSelect: (itemKey: string) => void
}

export function BasicInfoCardSelector({
  basicInfoItems,
  expandedCard,
  getConfigValue,
  onCardSelect
}: BasicInfoCardSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      {basicInfoItems.map((item) => {
        const isSelected = expandedCard === item.key
        const hasValue = getConfigValue(item.key)
        const Icon = item.icon
        
        return (
          <button
            key={item.key}
            onClick={() => onCardSelect(item.key)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
              ${isSelected 
                ? 'bg-blue-600 text-white shadow-md' 
                : hasValue
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {hasValue && !isSelected && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
        )
      })}
    </div>
  )
}