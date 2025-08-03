'use client'

import React from 'react'
import { BASIC_INFO_ITEMS } from '../constants'

interface BasicInfoAnimationContainerProps {
  isExpanded: boolean
  isTransitioning: boolean
  animatingCard: string | null
  selectedCardPosition: { top: number; left: number; width: number; height: number } | null
  validationErrors: Record<string, string[]>
  containerRef: React.RefObject<HTMLDivElement | null>
  cardRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
  getConfigValue: (key: string) => string
  onCardClick: (cardKey: string) => void
}

export function BasicInfoAnimationContainer({
  isExpanded,
  isTransitioning,
  animatingCard,
  selectedCardPosition,
  validationErrors,
  containerRef,
  cardRefs,
  getConfigValue,
  onCardClick
}: BasicInfoAnimationContainerProps) {
  if (isExpanded && !isTransitioning) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {BASIC_INFO_ITEMS.map((item) => {
        const hasValue = getConfigValue(item.key)
        const hasError = validationErrors[item.key] && validationErrors[item.key].length > 0
        const Icon = item.icon
        const isAnimating = animatingCard === item.key

        return (
          <div
            key={item.key}
            ref={(el) => {
              cardRefs.current[item.key] = el
            }}
            onClick={() => onCardClick(item.key)}
            className={`
              relative group cursor-pointer transition-all duration-300 transform
              ${isAnimating ? 'scale-105 z-10' : 'hover:scale-105'}
              ${hasError ? 'animate-pulse' : ''}
            `}
          >
            <div
              className={`
                p-4 rounded-lg border-2 transition-all duration-300
                ${hasValue
                  ? hasError
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }
                ${isAnimating ? 'shadow-lg' : 'group-hover:shadow-md'}
              `}
            >
              {/* 图标和标题 */}
              <div className="flex items-center justify-between mb-2">
                <Icon 
                  className={`
                    h-5 w-5 transition-colors duration-300
                    ${hasValue
                      ? hasError
                        ? 'text-red-600'
                        : 'text-blue-600'
                      : 'text-gray-400'
                    }
                  `} 
                />
                {hasValue && (
                  <div 
                    className={`
                      w-2 h-2 rounded-full
                      ${hasError ? 'bg-red-500' : 'bg-blue-500'}
                    `}
                  />
                )}
              </div>

              {/* 标题 */}
              <h3 className="font-medium text-sm text-gray-900 mb-1">
                {item.label}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </h3>

              {/* 描述 */}
              <p className="text-xs text-gray-500 line-clamp-2">
                {item.description}
              </p>

              {/* 值预览 */}
              {hasValue && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="text-xs text-gray-700 truncate">
                    {getConfigValue(item.key)}
                  </p>
                </div>
              )}

              {/* 错误指示器 */}
              {hasError && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute top-0 w-3 h-3 bg-red-500 rounded-full" />
                </div>
              )}

              {/* 悬停效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 rounded-lg transition-all duration-300" />
            </div>
          </div>
        )
      })}
    </div>
  )
}