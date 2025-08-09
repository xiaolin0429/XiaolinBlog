/**
 * ConfigApi 适配器 - 让现有的 ConfigApi 符合 ISiteConfigApi 接口
 */

import { ConfigApi } from './ConfigApi'
import { ISiteConfigApi } from '../../application/usecases/SiteConfigUseCase'

export class ConfigApiAdapter implements ISiteConfigApi {
  constructor(private configApi: ConfigApi) {}

  async getAllConfig(): Promise<{ data: any[] }> {
    const response = await this.configApi.getAllConfig()
    return { data: response.data || [] }
  }

  async batchUpdateConfig(configs: Array<{ key: string; value: string }>): Promise<any[]> {
    return await this.configApi.batchUpdateConfig(configs)
  }

  async validateConfigs(configs: Array<{ key: string; value: string; data_type?: string }>): Promise<{ valid: boolean; errors: Record<string, string[]>; warnings: Record<string, string[]> }> {
    return await this.configApi.validateConfigs(configs)
  }
}