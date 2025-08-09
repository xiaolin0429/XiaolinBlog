/**
 * 事件总线接口契约
 * 定义发布订阅模式的标准接口
 */

export type EventHandler<T = any> = (data: T) => void | Promise<void>
export type EventFilter<T = any> = (data: T) => boolean

export interface EventSubscription {
  unsubscribe(): void
}

export interface IEventBus {
  /**
   * 发布事件
   */
  publish<T = any>(event: string, data?: T): Promise<void>
  
  /**
   * 订阅事件
   */
  subscribe<T = any>(
    event: string, 
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): EventSubscription
  
  /**
   * 一次性订阅事件
   */
  once<T = any>(
    event: string, 
    handler: EventHandler<T>
  ): EventSubscription
  
  /**
   * 取消订阅
   */
  unsubscribe(event: string, handler: EventHandler): void
  
  /**
   * 取消所有订阅
   */
  unsubscribeAll(event?: string): void
  
  /**
   * 获取事件监听器数量
   */
  getListenerCount(event: string): number
  
  /**
   * 获取所有事件名称
   */
  getEventNames(): string[]
  
  /**
   * 清除所有事件和监听器
   */
  clear(): void
}