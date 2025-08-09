/**
 * 事件总线系统 - 实现组件间解耦通信
 * 使用发布-订阅模式，减少组件间的直接依赖
 */

export interface EventData {
  [key: string]: any
}

export type EventListener<T = EventData> = (data: T) => void | Promise<void>

export interface EventSubscription {
  unsubscribe: () => void
}

// 预定义的系统事件类型
export enum SystemEvents {
  // 认证相关
  AUTH_LOGIN_SUCCESS = 'auth:login:success',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_TOKEN_REFRESH = 'auth:token:refresh',
  AUTH_ERROR = 'auth:error',
  
  // 配置相关
  CONFIG_UPDATED = 'config:updated',
  CONFIG_SAVED = 'config:saved',
  CONFIG_LOAD_ERROR = 'config:load:error',
  CONFIG_SAVE_ERROR = 'config:save:error',
  CONFIG_RESET = 'config:reset',
  
  // 导航相关
  NAVIGATION_CHANGE = 'navigation:change',
  NAVIGATION_ERROR = 'navigation:error',
  
  // UI相关
  TOAST_SHOW = 'ui:toast:show',
  MODAL_OPEN = 'ui:modal:open',
  MODAL_CLOSE = 'ui:modal:close',
  LOADING_START = 'ui:loading:start',
  LOADING_END = 'ui:loading:end',
  
  // 数据相关
  DATA_REFRESH = 'data:refresh',
  DATA_ERROR = 'data:error',
  CACHE_CLEAR = 'cache:clear',
  
  // 页面相关
  PAGE_TITLE_UPDATE = 'page:title:update',
  META_UPDATE = 'page:meta:update',
  FAVICON_UPDATE = 'page:favicon:update'
}

// 事件数据接口
export interface AuthLoginData {
  user: any
  token: string
  sessionId: string
}

export interface AuthLogoutData {
  reason?: string
  redirectTo?: string
}

export interface ConfigUpdateData {
  key: string
  value: any
  previousValue?: any
}

export interface NavigationData {
  from: string
  to: string
  params?: Record<string, any>
}

export interface ToastData {
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

// 事件总线类
class EventBus {
  private static instance: EventBus
  private listeners: Map<string, Set<EventListener>> = new Map()
  private onceListeners: Map<string, Set<EventListener>> = new Map()
  private wildcardListeners: Set<(event: string, data: any) => void> = new Set()
  private debugMode: boolean = process.env.NODE_ENV === 'development'

  private constructor() {
    // 私有构造函数确保单例
    if (this.debugMode) {
      console.log('EventBus initialized')
    }
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * 订阅事件
   */
  public on<T = EventData>(event: string, listener: EventListener<T>): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const eventListeners = this.listeners.get(event)!
    eventListeners.add(listener as EventListener)

    if (this.debugMode) {
      console.log(`EventBus: Subscribed to ${event}, total listeners: ${eventListeners.size}`)
    }

    return {
      unsubscribe: () => this.off(event, listener)
    }
  }

  /**
   * 订阅事件（仅触发一次）
   */
  public once<T = EventData>(event: string, listener: EventListener<T>): EventSubscription {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }

    const eventListeners = this.onceListeners.get(event)!
    eventListeners.add(listener as EventListener)

    if (this.debugMode) {
      console.log(`EventBus: Subscribed once to ${event}`)
    }

    return {
      unsubscribe: () => this.offOnce(event, listener)
    }
  }

  /**
   * 取消订阅事件
   */
  public off<T = EventData>(event: string, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener as EventListener)
      
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }

      if (this.debugMode) {
        console.log(`EventBus: Unsubscribed from ${event}, remaining listeners: ${eventListeners.size}`)
      }
    }
  }

  /**
   * 取消一次性事件订阅
   */
  private offOnce<T = EventData>(event: string, listener: EventListener<T>): void {
    const eventListeners = this.onceListeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener as EventListener)
      
      if (eventListeners.size === 0) {
        this.onceListeners.delete(event)
      }
    }
  }

  /**
   * 发布事件
   */
  public async emit<T = EventData>(event: string, data?: T): Promise<void> {
    if (this.debugMode) {
      console.log(`EventBus: Emitting ${event}`, data)
    }

    const promises: Promise<void>[] = []

    // 处理普通监听器
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          const result = listener(data as any)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          console.error(`EventBus: Error in listener for ${event}:`, error)
        }
      }
    }

    // 处理一次性监听器
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      const listenersArray = Array.from(onceListeners)
      this.onceListeners.delete(event) // 清除一次性监听器

      for (const listener of listenersArray) {
        try {
          const result = listener(data as any)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          console.error(`EventBus: Error in once listener for ${event}:`, error)
        }
      }
    }

    // 处理通配符监听器
    for (const listener of this.wildcardListeners) {
      try {
        listener(event, data)
      } catch (error) {
        console.error(`EventBus: Error in wildcard listener:`, error)
      }
    }

    // 等待所有异步监听器完成
    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  /**
   * 同步发布事件（不等待异步监听器）
   */
  public emitSync<T = EventData>(event: string, data?: T): void {
    if (this.debugMode) {
      console.log(`EventBus: Emitting sync ${event}`, data)
    }

    // 处理普通监听器
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(data as any)
        } catch (error) {
          console.error(`EventBus: Error in sync listener for ${event}:`, error)
        }
      }
    }

    // 处理一次性监听器
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      const listenersArray = Array.from(onceListeners)
      this.onceListeners.delete(event)

      for (const listener of listenersArray) {
        try {
          listener(data as any)
        } catch (error) {
          console.error(`EventBus: Error in sync once listener for ${event}:`, error)
        }
      }
    }

    // 处理通配符监听器
    for (const listener of this.wildcardListeners) {
      try {
        listener(event, data)
      } catch (error) {
        console.error(`EventBus: Error in sync wildcard listener:`, error)
      }
    }
  }

  /**
   * 添加通配符监听器（监听所有事件）
   */
  public onAny(listener: (event: string, data: any) => void): EventSubscription {
    this.wildcardListeners.add(listener)

    return {
      unsubscribe: () => this.wildcardListeners.delete(listener)
    }
  }

  /**
   * 移除事件的所有监听器
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
      
      if (this.debugMode) {
        console.log(`EventBus: Removed all listeners for ${event}`)
      }
    } else {
      this.listeners.clear()
      this.onceListeners.clear()
      this.wildcardListeners.clear()
      
      if (this.debugMode) {
        console.log('EventBus: Removed all listeners')
      }
    }
  }

  /**
   * 获取事件的监听器数量
   */
  public getListenerCount(event: string): number {
    const normalCount = this.listeners.get(event)?.size || 0
    const onceCount = this.onceListeners.get(event)?.size || 0
    return normalCount + onceCount
  }

  /**
   * 获取所有事件名称
   */
  public getEventNames(): string[] {
    const normalEvents = Array.from(this.listeners.keys())
    const onceEvents = Array.from(this.onceListeners.keys())
    return [...new Set([...normalEvents, ...onceEvents])]
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): {
    totalEvents: number
    totalListeners: number
    events: Record<string, number>
  } {
    const events: Record<string, number> = {}
    let totalListeners = 0

    for (const [event, listeners] of this.listeners.entries()) {
      events[event] = listeners.size
      totalListeners += listeners.size
    }

    for (const [event, listeners] of this.onceListeners.entries()) {
      events[event + ' (once)'] = listeners.size
      totalListeners += listeners.size
    }

    return {
      totalEvents: Object.keys(events).length,
      totalListeners,
      events
    }
  }
}

// 创建全局实例
export const eventBus = EventBus.getInstance()

// React Hook for using EventBus
import { useEffect, useRef } from 'react'

export function useEventBus() {
  return {
    emit: eventBus.emit.bind(eventBus),
    emitSync: eventBus.emitSync.bind(eventBus),
    on: eventBus.on.bind(eventBus),
    once: eventBus.once.bind(eventBus),
    off: eventBus.off.bind(eventBus)
  }
}

// Hook for subscribing to events
export function useEventListener<T = EventData>(
  event: string, 
  listener: EventListener<T>,
  deps: React.DependencyList = []
) {
  const listenerRef = useRef(listener)
  listenerRef.current = listener

  useEffect(() => {
    const subscription = eventBus.on(event, (data: T) => {
      listenerRef.current(data)
    })

    return () => subscription.unsubscribe()
  }, [event, ...deps])
}

// Hook for one-time event subscription
export function useEventOnce<T = EventData>(
  event: string,
  listener: EventListener<T>,
  deps: React.DependencyList = []
) {
  const listenerRef = useRef(listener)
  listenerRef.current = listener

  useEffect(() => {
    const subscription = eventBus.once(event, (data: T) => {
      listenerRef.current(data)
    })

    return () => subscription.unsubscribe()
  }, [event, ...deps])
}

// 便捷的事件发射器hooks
export const useAuthEvents = () => ({
  emitLogin: (data: AuthLoginData) => eventBus.emit(SystemEvents.AUTH_LOGIN_SUCCESS, data),
  emitLogout: (data?: AuthLogoutData) => eventBus.emit(SystemEvents.AUTH_LOGOUT, data),
  emitTokenRefresh: () => eventBus.emit(SystemEvents.AUTH_TOKEN_REFRESH),
  emitAuthError: (error: string) => eventBus.emit(SystemEvents.AUTH_ERROR, { error })
})

export const useConfigEvents = () => ({
  emitConfigUpdate: (data: ConfigUpdateData) => eventBus.emit(SystemEvents.CONFIG_UPDATED, data),
  emitConfigSaved: () => eventBus.emit(SystemEvents.CONFIG_SAVED),
  emitConfigError: (error: string) => eventBus.emit(SystemEvents.CONFIG_SAVE_ERROR, { error })
})

export const useToastEvents = () => ({
  showToast: (data: ToastData) => eventBus.emitSync(SystemEvents.TOAST_SHOW, data),
  showSuccess: (title: string, description?: string) => 
    eventBus.emitSync(SystemEvents.TOAST_SHOW, { title, description, type: 'success' }),
  showError: (title: string, description?: string) =>
    eventBus.emitSync(SystemEvents.TOAST_SHOW, { title, description, type: 'error' }),
  showWarning: (title: string, description?: string) =>
    eventBus.emitSync(SystemEvents.TOAST_SHOW, { title, description, type: 'warning' })
})