/**
 * 事件总线服务实现
 * 基于EventEmitter模式的发布订阅系统
 */

import { 
  IEventBus, 
  EventHandler, 
  EventFilter, 
  EventSubscription 
} from '../../core/contracts/IEventBus'
import { 
  ApplicationError, 
  ErrorCode 
} from '../../core/errors/ApplicationError'

interface EventListener<T = any> {
  handler: EventHandler<T>
  filter?: EventFilter<T>
  once: boolean
  id: string
}

export class EventBusService implements IEventBus {
  private listeners: Map<string, EventListener[]> = new Map()
  private maxListeners: number = 100
  private enableLogging: boolean = false

  constructor(options?: {
    maxListeners?: number
    enableLogging?: boolean
  }) {
    this.maxListeners = options?.maxListeners || 100
    this.enableLogging = options?.enableLogging || false
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private log(message: string, data?: any): void {
    if (this.enableLogging) {
      console.log(`[EventBus] ${message}`, data || '')
    }
  }

  async publish<T = any>(event: string, data?: T): Promise<void> {
    try {
      this.log(`Publishing event: ${event}`, data)
      
      const listeners = this.listeners.get(event)
      if (!listeners || listeners.length === 0) {
        this.log(`No listeners for event: ${event}`)
        return
      }

      // 执行所有监听器
      const promises: Promise<void>[] = []
      const toRemove: string[] = []

      for (const listener of listeners) {
        try {
          // 应用过滤器
          if (listener.filter && data !== undefined) {
            if (!listener.filter(data)) {
              continue
            }
          }

          // 执行处理器
          const result = listener.handler(data)
          if (result instanceof Promise) {
            promises.push(result)
          }

          // 标记一次性监听器待移除
          if (listener.once) {
            toRemove.push(listener.id)
          }
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      }

      // 等待所有异步处理器完成
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }

      // 移除一次性监听器
      if (toRemove.length > 0) {
        const updatedListeners = listeners.filter(
          listener => !toRemove.includes(listener.id)
        )
        this.listeners.set(event, updatedListeners)
      }

      this.log(`Event ${event} published to ${listeners.length} listeners`)
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        `Failed to publish event: ${event}`,
        { event, data, originalError: error }
      )
    }
  }

  subscribe<T = any>(
    event: string, 
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): EventSubscription {
    try {
      this.log(`Subscribing to event: ${event}`)
      
      if (!this.listeners.has(event)) {
        this.listeners.set(event, [])
      }

      const listeners = this.listeners.get(event)!
      
      // 检查监听器数量限制
      if (listeners.length >= this.maxListeners) {
        throw new ApplicationError(
          ErrorCode.UNKNOWN,
          `Too many listeners for event: ${event}`,
          { event, maxListeners: this.maxListeners }
        )
      }

      const listener: EventListener<T> = {
        handler,
        filter,
        once: false,
        id: this.generateId()
      }

      listeners.push(listener)
      this.log(`Subscribed to ${event}, total listeners: ${listeners.length}`)

      // 返回取消订阅函数
      return {
        unsubscribe: () => {
          this.unsubscribeById(event, listener.id)
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        `Failed to subscribe to event: ${event}`,
        { event, originalError: error }
      )
    }
  }

  once<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    try {
      this.log(`Subscribing once to event: ${event}`)
      
      if (!this.listeners.has(event)) {
        this.listeners.set(event, [])
      }

      const listeners = this.listeners.get(event)!
      
      const listener: EventListener<T> = {
        handler,
        once: true,
        id: this.generateId()
      }

      listeners.push(listener)
      this.log(`Subscribed once to ${event}, total listeners: ${listeners.length}`)

      return {
        unsubscribe: () => {
          this.unsubscribeById(event, listener.id)
        }
      }
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        `Failed to subscribe once to event: ${event}`,
        { event, originalError: error }
      )
    }
  }

  unsubscribe(event: string, handler: EventHandler): void {
    try {
      const listeners = this.listeners.get(event)
      if (!listeners) {
        return
      }

      const initialLength = listeners.length
      const updatedListeners = listeners.filter(listener => listener.handler !== handler)
      
      this.listeners.set(event, updatedListeners)
      
      const removedCount = initialLength - updatedListeners.length
      this.log(`Unsubscribed ${removedCount} handlers from ${event}`)
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        `Failed to unsubscribe from event: ${event}`,
        { event, originalError: error }
      )
    }
  }

  private unsubscribeById(event: string, listenerId: string): void {
    try {
      const listeners = this.listeners.get(event)
      if (!listeners) {
        return
      }

      const updatedListeners = listeners.filter(listener => listener.id !== listenerId)
      this.listeners.set(event, updatedListeners)
      
      this.log(`Unsubscribed listener ${listenerId} from ${event}`)
    } catch (error) {
      this.log(`Failed to unsubscribe listener ${listenerId} from ${event}`, error)
    }
  }

  unsubscribeAll(event?: string): void {
    try {
      if (event) {
        // 取消指定事件的所有订阅
        this.listeners.delete(event)
        this.log(`Unsubscribed all listeners from ${event}`)
      } else {
        // 取消所有事件的订阅
        const eventCount = this.listeners.size
        this.listeners.clear()
        this.log(`Unsubscribed all listeners from ${eventCount} events`)
      }
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        'Failed to unsubscribe all listeners',
        { event, originalError: error }
      )
    }
  }

  getListenerCount(event: string): number {
    const listeners = this.listeners.get(event)
    return listeners ? listeners.length : 0
  }

  getEventNames(): string[] {
    return Array.from(this.listeners.keys())
  }

  clear(): void {
    try {
      const eventCount = this.listeners.size
      this.listeners.clear()
      this.log(`Cleared ${eventCount} events`)
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.UNKNOWN,
        'Failed to clear event bus',
        { originalError: error }
      )
    }
  }

  // 扩展功能

  /**
   * 获取事件统计信息
   */
  getStats(): {
    totalEvents: number
    totalListeners: number
    events: Array<{ name: string; listenerCount: number }>
  } {
    const events = []
    let totalListeners = 0

    for (const [eventName, listeners] of this.listeners.entries()) {
      events.push({
        name: eventName,
        listenerCount: listeners.length
      })
      totalListeners += listeners.length
    }

    return {
      totalEvents: this.listeners.size,
      totalListeners,
      events
    }
  }

  /**
   * 设置最大监听器数量
   */
  setMaxListeners(count: number): void {
    this.maxListeners = Math.max(1, count)
  }

  /**
   * 启用或禁用日志
   */
  setLogging(enabled: boolean): void {
    this.enableLogging = enabled
  }

  /**
   * 检查事件是否有监听器
   */
  hasListeners(event: string): boolean {
    return this.getListenerCount(event) > 0
  }

  /**
   * 批量发布事件
   */
  async publishBatch<T = any>(events: Array<{ name: string; data?: T }>): Promise<void> {
    const promises = events.map(({ name, data }) => this.publish(name, data))
    await Promise.allSettled(promises)
  }
}