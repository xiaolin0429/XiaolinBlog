/**
 * 本地存储服务实现
 * 基于localStorage和sessionStorage的统一存储接口
 */

import { 
  ILocalStorageService, 
  ISessionStorageService, 
  StorageOptions 
} from '../../core/contracts/IStorageService'
import { 
  ApplicationError, 
  ErrorCode 
} from '../../core/errors/ApplicationError'

export class LocalStorageService implements ILocalStorageService {
  private readonly prefix: string
  
  constructor(prefix: string = 'app_') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private compress(data: string): string {
    // 简单的压缩实现，实际项目中可以使用更好的压缩算法
    try {
      return btoa(encodeURIComponent(data))
    } catch {
      return data
    }
  }

  private decompress(data: string): string {
    try {
      return decodeURIComponent(atob(data))
    } catch {
      return data
    }
  }

  private encrypt(data: string): string {
    // 简单的编码，实际项目中应使用真正的加密
    return btoa(data)
  }

  private decrypt(data: string): string {
    try {
      return atob(data)
    } catch {
      return data
    }
  }

  private processData(value: any, options?: StorageOptions): string {
    let serialized = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      ttl: options?.ttl,
      compressed: options?.compress,
      encrypted: options?.encrypt
    })

    if (options?.compress) {
      serialized = this.compress(serialized)
    }

    if (options?.encrypt) {
      serialized = this.encrypt(serialized)
    }

    return serialized
  }

  private parseData<T>(raw: string, defaultValue?: T): T | null {
    try {
      let data = raw

      // 尝试解密
      try {
        data = this.decrypt(data)
      } catch {
        // 如果解密失败，继续使用原始数据
      }

      // 尝试解压
      try {
        data = this.decompress(data)
      } catch {
        // 如果解压失败，继续使用原始数据
      }

      const parsed = JSON.parse(data)

      // 检查TTL
      if (parsed.ttl && parsed.timestamp) {
        const isExpired = Date.now() - parsed.timestamp > parsed.ttl
        if (isExpired) {
          return defaultValue || null
        }
      }

      return parsed.data
    } catch {
      return defaultValue || null
    }
  }

  async setItem<T = any>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const processedData = this.processData(value, options)
      localStorage.setItem(this.getKey(key), processedData)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new ApplicationError(
          ErrorCode.STORAGE_QUOTA_EXCEEDED,
          '存储空间不足',
          { key, originalError: error }
        )
      }
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '存储数据失败',
        { key, originalError: error }
      )
    }
  }

  async getItem<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.getKey(key))
      if (raw === null) {
        return defaultValue || null
      }
      return this.parseData<T>(raw, defaultValue)
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '读取存储数据失败',
        { key, originalError: error }
      )
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key))
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '删除存储数据失败',
        { key, originalError: error }
      )
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '清空存储失败',
        { originalError: error }
      )
    }
  }

  async hasItem(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(this.getKey(key)) !== null
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '检查存储项失败',
        { key, originalError: error }
      )
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = Object.keys(localStorage)
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length))
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '获取所有键失败',
        { originalError: error }
      )
    }
  }

  async getSize(): Promise<number> {
    try {
      let size = 0
      const keys = await this.getAllKeys()
      for (const key of keys) {
        const value = localStorage.getItem(this.getKey(key))
        if (value) {
          size += value.length
        }
      }
      return size
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '计算存储大小失败',
        { originalError: error }
      )
    }
  }

  // 同步方法
  setItemSync<T = any>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(this.getKey(key), serialized)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new ApplicationError(
          ErrorCode.STORAGE_QUOTA_EXCEEDED,
          '存储空间不足',
          { key, originalError: error }
        )
      }
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '同步存储数据失败',
        { key, originalError: error }
      )
    }
  }

  getItemSync<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key))
      if (raw === null) {
        return defaultValue || null
      }
      return JSON.parse(raw)
    } catch (error) {
      return defaultValue || null
    }
  }
}

export class SessionStorageService implements ISessionStorageService {
  private readonly prefix: string
  
  constructor(prefix: string = 'app_session_') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async setItem<T = any>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const data = {
        data: value,
        timestamp: Date.now(),
        ttl: options?.ttl
      }
      sessionStorage.setItem(this.getKey(key), JSON.stringify(data))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new ApplicationError(
          ErrorCode.STORAGE_QUOTA_EXCEEDED,
          '会话存储空间不足',
          { key, originalError: error }
        )
      }
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '会话存储数据失败',
        { key, originalError: error }
      )
    }
  }

  async getItem<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const raw = sessionStorage.getItem(this.getKey(key))
      if (raw === null) {
        return defaultValue || null
      }

      const parsed = JSON.parse(raw)

      // 检查TTL
      if (parsed.ttl && parsed.timestamp) {
        const isExpired = Date.now() - parsed.timestamp > parsed.ttl
        if (isExpired) {
          await this.removeItem(key)
          return defaultValue || null
        }
      }

      return parsed.data
    } catch (error) {
      return defaultValue || null
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(this.getKey(key))
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '删除会话存储数据失败',
        { key, originalError: error }
      )
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(sessionStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      throw new ApplicationError(
        ErrorCode.STORAGE_ERROR,
        '清空会话存储失败',
        { originalError: error }
      )
    }
  }

  async hasItem(key: string): Promise<boolean> {
    try {
      return sessionStorage.getItem(this.getKey(key)) !== null
    } catch (error) {
      return false
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = Object.keys(sessionStorage)
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length))
    } catch (error) {
      return []
    }
  }

  async getSize(): Promise<number> {
    try {
      let size = 0
      const keys = await this.getAllKeys()
      for (const key of keys) {
        const value = sessionStorage.getItem(this.getKey(key))
        if (value) {
          size += value.length
        }
      }
      return size
    } catch (error) {
      return 0
    }
  }

  // 会话存储特有方法
  async setSessionItem<T = any>(key: string, value: T): Promise<void> {
    return this.setItem(key, value)
  }

  async getSessionItem<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    return this.getItem(key, defaultValue)
  }
}