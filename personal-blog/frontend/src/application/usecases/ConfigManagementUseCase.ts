/**
 * 配置管理用例 - 简化版本
 * 处理站点配置的业务逻辑
 */

import { IEventBus } from '../../core/contracts/IEventBus'
import { ConfigApi } from '../../infrastructure/api/ConfigApi'

export interface ConfigUpdateResult {
  success: boolean
  updatedCount?: number
  failedItems?: Array<{ key: string; error: string }>
  error?: string
}

export class ConfigManagementUseCase {
  constructor(
    private configApi: ConfigApi,
    private eventBus: IEventBus
  ) {}

  /**
   * 获取所有配置
   */
  async getAllConfigs(): Promise<any[]> {
    try {
      const response = await this.configApi.getAllConfig()
      return response.data || []
    } catch (error) {
      this.eventBus.emit('config:error', { error })
      throw error
    }
  }

  /**
   * 更新配置
   */
  async updateConfigs(configs: Array<{ key: string; value: string }>): Promise<ConfigUpdateResult> {
    try {
      const result = await this.configApi.batchUpdateConfig(configs)
      this.eventBus.emit('config:updated', { count: result.length })
      
      return {
        success: true,
        updatedCount: result.length
      }
    } catch (error) {
      this.eventBus.emit('config:error', { error })
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      }
    }
  }
}