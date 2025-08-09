/**
 * DOM操作错误边界组件
 * 专门捕获和处理DOM相关的React错误，包括removeChild错误
 */

"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { eventBus, SystemEvents } from '@/services/EventBus'

interface DOMErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface DOMErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRecovery?: boolean
  recoveryDelay?: number
}

export class DOMErrorBoundary extends Component<DOMErrorBoundaryProps, DOMErrorBoundaryState> {
  private recoveryTimer: NodeJS.Timeout | null = null

  constructor(props: DOMErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<DOMErrorBoundaryState> {
    // 检查是否是DOM相关错误
    const isDOMError = this.isDOMRelatedError(error)
    
    if (isDOMError) {
      return {
        hasError: true,
        error,
        errorId: `dom-error-${Date.now()}`
      }
    }

    // 如果不是DOM错误，重新抛出让其他错误边界处理
    throw error
  }

  static isDOMRelatedError(error: Error): boolean {
    const domErrorPatterns = [
      'removeChild',
      'appendChild',
      'insertBefore',
      'replaceChild',
      'Cannot read properties of null',
      'Cannot read property \'removeChild\'',
      'Node was not found',
      'Failed to execute \'removeChild\'',
      'Failed to execute \'appendChild\'',
      'The node to be removed is not a child of this node'
    ]

    return domErrorPatterns.some(pattern => 
      error.message.includes(pattern) || error.stack?.includes(pattern)
    )
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DOMErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      errorInfo
    })

    // 触发错误事件
    eventBus.emit(SystemEvents.DATA_ERROR, {
      type: 'dom-error',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    })

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 启动自动恢复机制
    if (this.props.enableRecovery !== false) {
      this.startRecovery()
    }
  }

  /**
   * 启动错误恢复机制
   */
  private startRecovery = () => {
    const delay = this.props.recoveryDelay || 3000

    this.recoveryTimer = setTimeout(() => {
      console.log('DOMErrorBoundary attempting recovery...')
      
      try {
        // 清理可能有问题的DOM状态
        this.performDOMCleanup()
        
        // 重置错误状态
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorId: null
        })

        eventBus.emit(SystemEvents.DATA_REFRESH, {
          source: 'dom-error-boundary-recovery'
        })

        console.log('DOMErrorBoundary recovery completed')
      } catch (recoveryError) {
        console.error('DOMErrorBoundary recovery failed:', recoveryError)
      }
    }, delay)
  }

  /**
   * 执行DOM清理
   */
  private performDOMCleanup = () => {
    try {
      // 查找并清理可能有问题的元素
      const problematicSelectors = [
        'meta[data-react-error]',
        'link[data-react-error]',
        'script[data-react-error]'
      ]

      problematicSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          try {
            if (element.parentNode) {
              element.parentNode.removeChild(element)
            }
          } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError)
          }
        })
      })

      // 触发DOM管理器的清理
      if (typeof window !== 'undefined' && (window as any).reactSafeDOMManager) {
        (window as any).reactSafeDOMManager.performErrorRecovery?.()
      }

    } catch (error) {
      console.warn('DOM cleanup error:', error)
    }
  }

  /**
   * 手动重置错误状态
   */
  public resetErrorBoundary = () => {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = null
    }

    this.performDOMCleanup()

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
    }
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="dom-error-boundary-fallback">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  页面组件出现问题
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>检测到DOM操作错误，正在自动恢复中...</p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">开发模式：错误详情</summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                        {this.state.error.message}
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={this.resetErrorBoundary}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    手动重试
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * React Hook版本的错误边界
 */
export function useDOMErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (DOMErrorBoundary.isDOMRelatedError(event.error)) {
        console.warn('DOM error caught by hook:', event.error)
        setError(event.error)
        
        // 阻止错误继续传播
        event.preventDefault()
        
        // 自动清除错误状态
        setTimeout(() => {
          setError(null)
        }, 3000)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof Error && DOMErrorBoundary.isDOMRelatedError(event.reason)) {
        console.warn('DOM promise rejection caught by hook:', event.reason)
        setError(event.reason)
        event.preventDefault()

        setTimeout(() => {
          setError(null)
        }, 3000)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return {
    domError: error,
    clearError: () => setError(null)
  }
}

/**
 * 高阶组件：为组件包装DOM错误边界
 */
export function withDOMErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<DOMErrorBoundaryProps, 'children'>
) {
  const WithDOMErrorBoundaryComponent = (props: P) => (
    <DOMErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </DOMErrorBoundary>
  )

  WithDOMErrorBoundaryComponent.displayName = `withDOMErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithDOMErrorBoundaryComponent
}

export default DOMErrorBoundary