/**
 * 存储服务接口契约
 * 定义数据存储的标准操作
 */

export interface StorageOptions {
  encrypt?: boolean
  compress?: boolean
  ttl?: number // Time to live in milliseconds
}

export interface IStorageService {
  /**
   * 设置存储项
   */
  setItem<T = any>(key: string, value: T, options?: StorageOptions): Promise<void>
  
  /**
   * 获取存储项
   */
  getItem<T = any>(key: string, defaultValue?: T): Promise<T | null>
  
  /**
   * 移除存储项
   */
  removeItem(key: string): Promise<void>
  
  /**
   * 清空所有存储
   */
  clear(): Promise<void>
  
  /**
   * 检查键是否存在
   */
  hasItem(key: string): Promise<boolean>
  
  /**
   * 获取所有键
   */
  getAllKeys(): Promise<string[]>
  
  /**
   * 获取存储大小
   */
  getSize(): Promise<number>
}

export interface ILocalStorageService extends IStorageService {
  /**
   * 同步设置存储项
   */
  setItemSync<T = any>(key: string, value: T): void
  
  /**
   * 同步获取存储项
   */
  getItemSync<T = any>(key: string, defaultValue?: T): T | null
}

export interface ISessionStorageService extends IStorageService {
  /**
   * 设置会话存储项
   */
  setSessionItem<T = any>(key: string, value: T): Promise<void>
  
  /**
   * 获取会话存储项
   */
  getSessionItem<T = any>(key: string, defaultValue?: T): Promise<T | null>
}