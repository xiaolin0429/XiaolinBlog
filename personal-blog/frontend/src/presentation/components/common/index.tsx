/**
 * 通用组件
 * 迁移自原common目录的组件
 */

import React, { Component, ReactNode } from 'react'
import { LoadingSpinner, Alert, AlertTitle, AlertDescription } from '../ui'

// 错误边界组件
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Alert variant="error">
          <AlertTitle>出现了错误</AlertTitle>
          <AlertDescription>
            {this.state.error?.message || '应用遇到了意外错误，请刷新页面重试。'}
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

// 加载状态组件
interface LoadingStateProps {
  isLoading: boolean
  children: ReactNode
  loadingText?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ 
  isLoading, 
  children, 
  loadingText = '加载中...',
  size = 'md' 
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner size={size} />
          {loadingText && <p className="mt-2 text-sm text-muted-foreground">{loadingText}</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 空状态组件
interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title = '暂无数据',
  description,
  icon,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center p-8 ${className}`}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}