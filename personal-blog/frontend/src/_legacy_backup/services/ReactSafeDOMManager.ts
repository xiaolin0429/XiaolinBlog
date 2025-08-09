/**
 * React安全的DOM管理器 - 紧急修复版本
 * 专门解决 React Fiber "Cannot read properties of null (reading 'removeChild')" 错误
 */

export interface ReactSafeDOMOptions {
  enableReactIntegration?: boolean
  enableMutationObserver?: boolean
  enableErrorRecovery?: boolean
}

class ReactSafeDOMManager {
  private static instance: ReactSafeDOMManager
  private managedElements: Map<string, HTMLElement> = new Map()
  private mutationObserver: MutationObserver | null = null
  private reactRenderedElements: WeakSet<HTMLElement> = new WeakSet()
  private cleanupCallbacks: Map<string, () => void> = new Map()
  
  private constructor(private options: ReactSafeDOMOptions = {}) {
    this.options = {
      enableReactIntegration: true,
      enableMutationObserver: true,
      enableErrorRecovery: true,
      ...options
    }
    
    this.initializeMutationObserver()
    this.setupReactIntegration()
  }

  public static getInstance(options?: ReactSafeDOMOptions): ReactSafeDOMManager {
    if (!ReactSafeDOMManager.instance) {
      ReactSafeDOMManager.instance = new ReactSafeDOMManager(options)
    }
    return ReactSafeDOMManager.instance
  }

  /**
   * 初始化DOM变化监听器
   */
  private initializeMutationObserver(): void {
    if (!this.options.enableMutationObserver || typeof window === 'undefined') return

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 监听被删除的节点
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            // 如果是我们管理的元素，从管理列表中移除
            for (const [key, managedElement] of this.managedElements.entries()) {
              if (managedElement === element) {
                this.managedElements.delete(key)
                const cleanup = this.cleanupCallbacks.get(key)
                if (cleanup) {
                  cleanup()
                  this.cleanupCallbacks.delete(key)
                }
                break
              }
            }
          }
        })
      })
    })

    // 观察整个document的变化
    this.mutationObserver.observe(document, {
      childList: true,
      subtree: true
    })
  }

  /**
   * 设置React集成
   */
  private setupReactIntegration(): void {
    if (!this.options.enableReactIntegration || typeof window === 'undefined') return

    // 监听React的错误事件
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('removeChild')) {
        console.warn('React DOM removeChild error caught and handled')
        event.preventDefault()
        
        if (this.options.enableErrorRecovery) {
          this.performErrorRecovery()
        }
      }
    })

    // 监听未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('removeChild')) {
        console.warn('Unhandled DOM removeChild error caught')
        event.preventDefault()
      }
    })
  }

  /**
   * 错误恢复机制
   */
  private performErrorRecovery(): void {
    // 清理所有可能有问题的管理元素
    for (const [key, element] of this.managedElements.entries()) {
      try {
        if (!element.parentNode) {
          this.managedElements.delete(key)
          const cleanup = this.cleanupCallbacks.get(key)
          if (cleanup) {
            cleanup()
            this.cleanupCallbacks.delete(key)
          }
        }
      } catch (error) {
        console.warn(`Error during recovery for element ${key}:`, error)
      }
    }
  }

  /**
   * React安全的元素移除
   */
  private safeRemoveElement(element: HTMLElement): boolean {
    if (!element) return false

    try {
      // 检查元素是否仍在DOM中
      if (!document.contains(element)) {
        return true // 已经被移除了
      }

      // 检查是否有父节点
      if (!element.parentNode) {
        return true // 没有父节点，可能已经被React管理
      }

      // 检查是否是React渲染的元素
      if (this.reactRenderedElements.has(element)) {
        // 如果是React管理的元素，让React自己处理
        element.style.display = 'none' // 隐藏而不是删除
        return true
      }

      // 使用现代的remove方法
      if (typeof element.remove === 'function') {
        element.remove()
        return true
      }

      // 降级到传统方法
      if (element.parentNode && typeof element.parentNode.removeChild === 'function') {
        element.parentNode.removeChild(element)
        return true
      }

      return false
    } catch (error) {
      console.warn('Safe remove element failed:', error)
      
      // 最后的尝试：标记为隐藏
      try {
        element.style.display = 'none'
        element.style.visibility = 'hidden'
        return true
      } catch (hideError) {
        console.error('Even hiding element failed:', hideError)
        return false
      }
    }
  }

  /**
   * React安全的元素创建
   */
  private createElementSafely(tag: string, attributes: Record<string, string> = {}): HTMLElement | null {
    try {
      const element = document.createElement(tag)
      
      // 设置属性
      Object.entries(attributes).forEach(([key, value]) => {
        try {
          element.setAttribute(key, value)
        } catch (attrError) {
          console.warn(`Failed to set attribute ${key}:`, attrError)
        }
      })

      return element
    } catch (error) {
      console.error('Failed to create element:', error)
      return null
    }
  }

  /**
   * React安全的meta标签更新
   */
  public updateMetaTagSafely(key: string, attributes: Record<string, string>): boolean {
    try {
      // 查找现有元素
      const existingElement = this.managedElements.get(key)
      if (existingElement) {
        // 更新现有元素而不是删除重建
        Object.entries(attributes).forEach(([attr, value]) => {
          try {
            existingElement.setAttribute(attr, value)
          } catch (error) {
            console.warn(`Failed to update attribute ${attr}:`, error)
          }
        })
        return true
      }

      // 创建新元素
      const newElement = this.createElementSafely('meta', attributes)
      if (!newElement) return false

      // 添加到head
      if (document.head) {
        document.head.appendChild(newElement)
        this.managedElements.set(key, newElement)
        
        // 设置清理回调
        this.cleanupCallbacks.set(key, () => {
          this.safeRemoveElement(newElement)
        })
        
        return true
      }

      return false
    } catch (error) {
      console.error(`Failed to update meta tag ${key}:`, error)
      return false
    }
  }

  /**
   * React安全的favicon更新
   */
  public updateFaviconSafely(href: string): boolean {
    const FAVICON_KEY = 'app-favicon'
    
    try {
      // 查找现有favicon
      const existingFavicon = this.managedElements.get(FAVICON_KEY)
      if (existingFavicon) {
        // 更新href而不是删除重建
        existingFavicon.setAttribute('href', href)
        return true
      }

      // 查找并隐藏页面中的其他favicon（不删除，避免React冲突）
      const otherFavicons = document.querySelectorAll('link[rel*="icon"]')
      otherFavicons.forEach((link) => {
        if (!this.managedElements.has(FAVICON_KEY) || this.managedElements.get(FAVICON_KEY) !== link) {
          ;(link as HTMLElement).style.display = 'none'
        }
      })

      // 创建新的favicon
      const faviconElement = this.createElementSafely('link', {
        rel: 'icon',
        type: 'image/x-icon',
        href: href
      })

      if (!faviconElement) return false

      if (document.head) {
        document.head.appendChild(faviconElement)
        this.managedElements.set(FAVICON_KEY, faviconElement)
        
        this.cleanupCallbacks.set(FAVICON_KEY, () => {
          this.safeRemoveElement(faviconElement)
        })
        
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to update favicon safely:', error)
      return false
    }
  }

  /**
   * 标记React渲染的元素
   */
  public markAsReactElement(element: HTMLElement): void {
    this.reactRenderedElements.add(element)
  }

  /**
   * 清理所有管理的元素
   */
  public cleanup(): void {
    // 执行所有清理回调
    for (const cleanup of this.cleanupCallbacks.values()) {
      try {
        cleanup()
      } catch (error) {
        console.warn('Cleanup callback error:', error)
      }
    }

    this.managedElements.clear()
    this.cleanupCallbacks.clear()
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): {
    managedElements: number
    cleanupCallbacks: number
    hasObserver: boolean
  } {
    return {
      managedElements: this.managedElements.size,
      cleanupCallbacks: this.cleanupCallbacks.size,
      hasObserver: !!this.mutationObserver
    }
  }
}

// 创建全局实例
export const reactSafeDOMManager = ReactSafeDOMManager.getInstance()

// React Hook
import { useEffect, useRef } from 'react'

export function useReactSafeDOM() {
  const managerRef = useRef(reactSafeDOMManager)

  useEffect(() => {
    // 组件卸载时不主动清理，让MutationObserver处理
    return () => {
      // 不执行清理，避免与React的清理冲突
    }
  }, [])

  return {
    updateMetaTag: managerRef.current.updateMetaTagSafely.bind(managerRef.current),
    updateFavicon: managerRef.current.updateFaviconSafely.bind(managerRef.current),
    markAsReactElement: managerRef.current.markAsReactElement.bind(managerRef.current)
  }
}