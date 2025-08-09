/**
 * 状态管理接口契约
 * 定义统一的状态管理标准
 */

export interface StateChangeEvent<T = any> {
  type: string
  payload: T
  timestamp: number
}

export interface IStateManager<T = any> {
  /**
   * 获取当前状态
   */
  getState(): T
  
  /**
   * 设置状态
   */
  setState(newState: Partial<T>): void
  
  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: T, event: StateChangeEvent) => void): () => void
  
  /**
   * 重置状态
   */
  reset(): void
  
  /**
   * 获取状态快照
   */
  getSnapshot(): T
  
  /**
   * 恢复状态快照
   */
  restoreSnapshot(snapshot: T): void
}

export interface IPersistentStateManager<T = any> extends IStateManager<T> {
  /**
   * 持久化状态
   */
  persist(): Promise<void>
  
  /**
   * 恢复持久化状态
   */
  restore(): Promise<void>
  
  /**
   * 清除持久化数据
   */
  clearPersisted(): Promise<void>
}