/**
 * 网站配置用例 - 统一配置管理业务逻辑
 */

import { IEventBus } from '../../core/contracts/IEventBus'
import { SiteConfig } from '../../core/entities/SiteConfig'
import { ApplicationError, ErrorCode } from '../../core/errors/ApplicationError'

export interface ISiteConfigApi {
  getAllConfig(): Promise<{ data: any[] }>
  batchUpdateConfig(configs: Array<{ key: string; value: string }>): Promise<any[]>
  validateConfigs(configs: Array<{ key: string; value: string; data_type?: string }>): Promise<{ valid: boolean; errors: Record<string, string[]>; warnings: Record<string, string[]> }>
}

export interface ConfigChange {
  key: string
  value: string
  operation: 'update' | 'delete'
}

export interface ConfigValidationResult {
  valid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}

export class SiteConfigUseCase {
  private configs: SiteConfig[] = []
  private isLoading = false
  private subscribers = new Set<() => void>()

  constructor(
    private configApi: ISiteConfigApi,
    private eventBus: IEventBus
  ) {}

  /**
   * 订阅配置变更
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 通知订阅者
   */
  private notify(): void {
    this.subscribers.forEach(callback => callback())
  }

  /**
   * 获取所有配置
   */
  getConfigs(): SiteConfig[] {
    return [...this.configs]
  }

  /**
   * 根据键获取配置值
   */
  getConfigValue(key: string, defaultValue = ''): string {
    const config = this.configs.find(c => c.key === key)
    return config?.value || defaultValue
  }

  /**
   * 根据分类获取配置
   */
  getConfigsByCategory(category: string): SiteConfig[] {
    return this.configs.filter(c => c.category === category)
  }

  /**
   * 检查是否正在加载
   */
  isConfigLoading(): boolean {
    return this.isLoading
  }

  /**
   * 加载配置数据
   */
  async loadConfigs(): Promise<void> {
    if (this.isLoading) return

    try {
      this.isLoading = true
      const response = await this.configApi.getAllConfig()
      const data = response.data || []
      
      this.configs = data.map((item: any) => new SiteConfig(
        item.id,
        item.key,
        item.value || '',
        item.category,
        item.description,
        item.data_type,
        item.is_public === 'true',
        item.sort_order
      ))

      this.notify()
      this.eventBus.publish('config:loaded', { count: this.configs.length })
      
    } catch (error) {
      const appError = ApplicationError.fromError(error, ErrorCode.CONFIG_ERROR)
      this.eventBus.publish('config:error', appError)
      throw appError
    } finally {
      this.isLoading = false
    }
  }

  /**
   * 更新单个配置
   */
  async updateConfig(key: string, value: string): Promise<void> {
    try {
      // 乐观更新
      const configIndex = this.configs.findIndex(c => c.key === key)
      if (configIndex !== -1) {
        this.configs[configIndex] = this.configs[configIndex].withValue(value)
        this.notify()
      }

      // 服务器更新
      await this.configApi.batchUpdateConfig([{ key, value }])
      
      this.eventBus.publish('config:updated', { key, value })
      
    } catch (error) {
      // 回滚乐观更新
      await this.loadConfigs()
      
      const appError = ApplicationError.fromError(error, ErrorCode.CONFIG_ERROR)
      this.eventBus.publish('config:error', appError)
      throw appError
    }
  }

  /**
   * 批量更新配置
   */
  async batchUpdateConfigs(changes: ConfigChange[]): Promise<void> {
    try {
      const updateData = changes
        .filter(change => change.operation === 'update')
        .map(change => ({
          key: change.key,
          value: change.value
        }))

      if (updateData.length === 0) return

      await this.configApi.batchUpdateConfig(updateData)
      
      // 重新加载配置以确保一致性
      await this.loadConfigs()
      
      this.eventBus.publish('config:batch-updated', { count: updateData.length })
      
    } catch (error) {
      const appError = ApplicationError.fromError(error, ErrorCode.CONFIG_ERROR)
      this.eventBus.publish('config:error', appError)
      throw appError
    }
  }

  /**
   * 验证配置
   */
  async validateConfigs(configs: Array<{ key: string; value: string; data_type?: string }>): Promise<ConfigValidationResult> {
    try {
      const result = await this.configApi.validateConfigs(configs)
      return result
    } catch (error) {
      const appError = ApplicationError.fromError(error, ErrorCode.CONFIG_VALIDATION_ERROR)
      throw appError
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.subscribers.clear()
    this.configs = []
    this.isLoading = false
  }
}