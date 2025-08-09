/**
 * 全局DOM错误处理器
 * 在应用根级别捕获所有DOM相关错误
 */

"use client"

import { useEffect } from 'react'
import { reactSafeDOMManager } from '@/services/ReactSafeDOMManager'
import { eventBus, SystemEvents } from '@/services/EventBus'

interface GlobalDOMErrorHandlerProps {
  children: React.ReactNode
  enableLogging?: boolean
  enableRecovery?: boolean
}

export function GlobalDOMErrorHandler({ 
  children, 
  enableLogging = true,
  enableRecovery = true 
}: GlobalDOMErrorHandlerProps) {

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 设置全局DOM错误处理
    const setupGlobalErrorHandling = () => {
      // 捕获所有未处理的错误
      const handleGlobalError = (event: ErrorEvent) => {
        const error = event.error
        
        if (error && (
          error.message?.includes('removeChild') ||
          error.message?.includes('appendChild') ||
          error.message?.includes('insertBefore') ||
          error.message?.includes('Cannot read properties of null') ||
          error.stack?.includes('commitDeletionEffectsOnFiber') ||
          error.stack?.includes('react-dom-client')
        )) {
          if (enableLogging) {
            console.error('🚨 Global DOM Error Caught:', {
              message: error.message,
              stack: error.stack,
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            })
          }

          // 阻止错误传播到控制台
          event.preventDefault()

          // 发布错误事件
          eventBus.emitSync(SystemEvents.DATA_ERROR, {
            type: 'global-dom-error',
            message: error.message,
            stack: error.stack,
            location: `${event.filename}:${event.lineno}:${event.colno}`
          })

          // 执行恢复操作
          if (enableRecovery) {
            performGlobalRecovery(error)
          }

          return true
        }

        return false
      }

      // 捕获Promise rejection错误
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason

        if (reason instanceof Error && (
          reason.message?.includes('removeChild') ||
          reason.message?.includes('appendChild') ||
          reason.stack?.includes('react-dom-client')
        )) {
          if (enableLogging) {
            console.error('🚨 Global DOM Promise Rejection:', reason)
          }

          event.preventDefault()

          eventBus.emitSync(SystemEvents.DATA_ERROR, {
            type: 'global-dom-promise-rejection',
            message: reason.message,
            stack: reason.stack
          })

          if (enableRecovery) {
            performGlobalRecovery(reason)
          }
        }
      }

      // 监听React的错误事件（如果可用）
      const handleReactError = (event: any) => {
        if (event.detail?.error?.message?.includes('removeChild')) {
          if (enableLogging) {
            console.error('🚨 React DOM Error:', event.detail.error)
          }

          event.preventDefault()

          if (enableRecovery) {
            performGlobalRecovery(event.detail.error)
          }
        }
      }

      // 添加事件监听器
      window.addEventListener('error', handleGlobalError, true)
      window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
      
      // React特定的错误事件
      if ('addEventListener' in window) {
        window.addEventListener('react-error', handleReactError, true)
      }

      // 返回清理函数
      return () => {
        window.removeEventListener('error', handleGlobalError, true)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
        window.removeEventListener('react-error', handleReactError, true)
      }
    }

    // 全局恢复操作
    const performGlobalRecovery = (error: Error) => {
      console.log('🔄 Performing global DOM recovery...')
      
      try {
        // 延迟执行恢复操作，避免与React的生命周期冲突
        setTimeout(() => {
          // 清理可能有问题的DOM元素
          cleanupProblematicElements()
          
          // 重新初始化DOM管理器
          if (reactSafeDOMManager) {
            reactSafeDOMManager.cleanup()
          }

          // 触发页面重新渲染相关状态
          eventBus.emitSync(SystemEvents.DATA_REFRESH, {
            source: 'global-dom-recovery',
            reason: error.message
          })

          console.log('✅ Global DOM recovery completed')
        }, 100)

      } catch (recoveryError) {
        console.error('❌ Global DOM recovery failed:', recoveryError)
      }
    }

    // 清理有问题的DOM元素
    const cleanupProblematicElements = () => {
      try {
        // 查找所有可能有问题的元素
        const selectors = [
          'meta[name]:not([data-next-head])',
          'link[rel="icon"]:not([data-next-head])',
          'script[src*="gtag"]:not([data-next-head])',
          'script[src*="baidu"]:not([data-next-head])'
        ]

        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector)
            let removedCount = 0
            
            elements.forEach((element, index) => {
              // 只保留第一个，删除重复的
              if (index > 0) {
                try {
                  if (element.parentNode && document.contains(element)) {
                    element.parentNode.removeChild(element)
                    removedCount++
                  }
                } catch (removeError) {
                  // 如果删除失败，尝试隐藏
                  try {
                    ;(element as HTMLElement).style.display = 'none'
                  } catch (hideError) {
                    console.warn('Failed to hide problematic element:', hideError)
                  }
                }
              }
            })

            if (removedCount > 0) {
              console.log(`Cleaned up ${removedCount} duplicate elements: ${selector}`)
            }
          } catch (selectorError) {
            console.warn(`Error cleaning selector ${selector}:`, selectorError)
          }
        })

        // 清理孤立的文本节点
        const walker = document.createTreeWalker(
          document.head,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // 检查是否是孤立的文本节点
              return node.textContent?.trim() === '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            }
          }
        )

        const textNodesToRemove = []
        let node
        while (node = walker.nextNode()) {
          textNodesToRemove.push(node)
        }

        textNodesToRemove.forEach(textNode => {
          try {
            if (textNode.parentNode) {
              textNode.parentNode.removeChild(textNode)
            }
          } catch (error) {
            // 忽略文本节点删除错误
          }
        })

      } catch (cleanupError) {
        console.warn('Error during DOM cleanup:', cleanupError)
      }
    }

    // 设置错误处理
    const cleanup = setupGlobalErrorHandling()

    // 设置定期健康检查
    const healthCheckInterval = setInterval(() => {
      try {
        // 检查DOM管理器状态
        if (reactSafeDOMManager) {
          const debugInfo = reactSafeDOMManager.getDebugInfo()
          if (debugInfo.managedElements > 50) {
            console.warn('DOM Manager has too many managed elements:', debugInfo)
            reactSafeDOMManager.cleanup()
          }
        }

        // 检查重复元素
        const duplicateSelectors = ['meta[name="description"]', 'link[rel="icon"]']
        duplicateSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          if (elements.length > 2) {
            console.warn(`Found ${elements.length} duplicate elements: ${selector}`)
            cleanupProblematicElements()
          }
        })

      } catch (healthCheckError) {
        console.warn('Health check error:', healthCheckError)
      }
    }, 10000) // 每10秒检查一次

    // 清理函数
    return () => {
      cleanup()
      clearInterval(healthCheckInterval)
    }
  }, [enableLogging, enableRecovery])

  return <>{children}</>
}

export default GlobalDOMErrorHandler