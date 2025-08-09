/**
 * DOM管理器 - 单例模式
 * 安全管理DOM元素的创建、更新和删除，防止removeChild错误
 */

export interface MetaTagUpdate {
  key: string
  name?: string
  property?: string
  content: string
  type: 'meta' | 'link' | 'script'
  attributes?: Record<string, string>
}

export interface DOMElement {
  element: HTMLElement
  key: string
  type: string
}

class DOMManager {
  private static instance: DOMManager
  private managedElements: Map<string, DOMElement> = new Map()
  private observers: Set<(changes: MetaTagUpdate[]) => void> = new Set()

  private constructor() {
    // 私有构造函数确保单例
  }

  public static getInstance(): DOMManager {
    if (!DOMManager.instance) {
      DOMManager.instance = new DOMManager()
    }
    return DOMManager.instance
  }

  /**
   * 安全地移除DOM元素
   */
  private safeRemoveElement(element: HTMLElement): boolean {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element)
        return true
      }
      // 如果元素不存在或已被移除，使用新的remove方法
      if (element && typeof element.remove === 'function') {
        element.remove()
        return true
      }
    } catch (error) {
      console.warn('Failed to remove DOM element safely:', error)
    }
    return false
  }

  /**
   * 创建DOM元素
   */
  private createElement(update: MetaTagUpdate): HTMLElement | null {
    try {
      let element: HTMLElement

      switch (update.type) {
        case 'meta':
          element = document.createElement('meta')
          if (update.name) {
            element.setAttribute('name', update.name)
          }
          if (update.property) {
            element.setAttribute('property', update.property)
          }
          element.setAttribute('content', update.content)
          break

        case 'link':
          element = document.createElement('link')
          element.setAttribute('href', update.content)
          break

        case 'script':
          element = document.createElement('script')
          if (update.content.startsWith('http')) {
            element.setAttribute('src', update.content)
          } else {
            element.innerHTML = update.content
          }
          break

        default:
          console.warn('Unsupported element type:', update.type)
          return null
      }

      // 应用额外属性
      if (update.attributes) {
        Object.entries(update.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value)
        })
      }

      return element
    } catch (error) {
      console.error('Failed to create DOM element:', error)
      return null
    }
  }

  /**
   * 更新meta标签
   */
  public updateMetaTags(updates: MetaTagUpdate[]): void {
    const changes: MetaTagUpdate[] = []

    updates.forEach(update => {
      try {
        // 安全移除现有元素
        const existing = this.managedElements.get(update.key)
        if (existing) {
          this.safeRemoveElement(existing.element)
          this.managedElements.delete(update.key)
        }

        // 创建新元素
        const newElement = this.createElement(update)
        if (newElement && document.head) {
          document.head.appendChild(newElement)
          
          // 记录管理的元素
          this.managedElements.set(update.key, {
            element: newElement,
            key: update.key,
            type: update.type
          })

          changes.push(update)
        }
      } catch (error) {
        console.error(`Failed to update meta tag ${update.key}:`, error)
      }
    })

    // 通知观察者
    this.notifyObservers(changes)
  }

  /**
   * 更新favicon (特殊处理)
   */
  public updateFavicon(faviconUrl: string): void {
    try {
      // 安全移除所有现有的favicon
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
      existingFavicons.forEach(link => {
        this.safeRemoveElement(link as HTMLElement)
      })

      // 清理管理的favicon元素
      Array.from(this.managedElements.keys())
        .filter(key => key.includes('favicon'))
        .forEach(key => this.managedElements.delete(key))

      if (faviconUrl) {
        // 创建新的favicon链接
        const faviconUpdates: MetaTagUpdate[] = [
          {
            key: 'favicon-ico',
            type: 'link',
            content: faviconUrl,
            attributes: {
              rel: 'icon',
              type: 'image/x-icon'
            }
          },
          {
            key: 'favicon-png',
            type: 'link', 
            content: faviconUrl,
            attributes: {
              rel: 'icon',
              type: 'image/png'
            }
          }
        ]

        this.updateMetaTags(faviconUpdates)
      }
    } catch (error) {
      console.error('Failed to update favicon:', error)
    }
  }

  /**
   * 添加观察者
   */
  public addObserver(callback: (changes: MetaTagUpdate[]) => void): void {
    this.observers.add(callback)
  }

  /**
   * 移除观察者
   */
  public removeObserver(callback: (changes: MetaTagUpdate[]) => void): void {
    this.observers.delete(callback)
  }

  /**
   * 通知所有观察者
   */
  private notifyObservers(changes: MetaTagUpdate[]): void {
    this.observers.forEach(callback => {
      try {
        callback(changes)
      } catch (error) {
        console.error('Error in DOM observer callback:', error)
      }
    })
  }

  /**
   * 清理所有管理的元素
   */
  public cleanup(): void {
    this.managedElements.forEach(({ element }) => {
      this.safeRemoveElement(element)
    })
    this.managedElements.clear()
    this.observers.clear()
  }

  /**
   * 获取当前管理的元素信息 (调试用)
   */
  public getDebugInfo(): { managedElements: number, observers: number } {
    return {
      managedElements: this.managedElements.size,
      observers: this.observers.size
    }
  }
}

// 导出单例实例
export const domManager = DOMManager.getInstance()

// React Hook for DOM management
export function useDOMManager() {
  return {
    updateMetaTags: domManager.updateMetaTags.bind(domManager),
    updateFavicon: domManager.updateFavicon.bind(domManager),
    addObserver: domManager.addObserver.bind(domManager),
    removeObserver: domManager.removeObserver.bind(domManager),
    cleanup: domManager.cleanup.bind(domManager)
  }
}