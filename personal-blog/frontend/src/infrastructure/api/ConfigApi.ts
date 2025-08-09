/**
 * 配置API实现
 * 处理站点配置相关的API调用
 */

import { IHttpClient, ApiResponse } from '../../core/contracts/IHttpClient'
import { SiteConfig, SiteConfigItem } from '../../core/entities/SiteConfig'
import { ApplicationError, ErrorCode } from '../../core/errors/ApplicationError'

export interface BatchConfigUpdate {
  configs: Array<{
    key: string
    value: string
    category: string
    data_type: string
  }>
}

export interface ConfigResponse {
  id: number
  key: string
  value: string
  category: string
  description: string
  data_type: string
  is_public: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export class ConfigApi {
  private httpClient: IHttpClient
  private readonly endpoints = {
    public: '/site-config/public',
    private: '/site-config',
    batch: '/site-config/batch-update',
    single: (key: string) => `/site-config/${key}`,
    validate: '/site-config/validate'
  }

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient
  }

  /**
   * 获取公开配置
   */
  async getPublicConfig(): Promise<ApiResponse<ConfigResponse[]>> {
    try {
      return await this.httpClient.get<ConfigResponse[]>(this.endpoints.public)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '获取公开配置失败',
        { originalError: error }
      )
    }
  }

  /**
   * 获取所有配置（需要认证）
   */
  async getAllConfig(): Promise<ApiResponse<ConfigResponse[]>> {
    try {
      return await this.httpClient.get<ConfigResponse[]>(this.endpoints.private)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '获取配置失败',
        { originalError: error }
      )
    }
  }

  /**
   * 获取单个配置项
   */
  async getConfigItem(key: string): Promise<ApiResponse<ConfigResponse>> {
    try {
      return await this.httpClient.get<ConfigResponse>(this.endpoints.single(key))
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        `获取配置项 ${key} 失败`,
        { originalError: error, configKey: key }
      )
    }
  }

  /**
   * 更新单个配置项
   */
  async updateConfigItem(
    key: string, 
    value: string,
    category?: string,
    dataType: string = 'string'
  ): Promise<ApiResponse<ConfigResponse>> {
    try {
      const data = {
        value,
        category: category || this.getCategoryForKey(key),
        data_type: dataType
      }

      return await this.httpClient.put<ConfigResponse>(this.endpoints.single(key), data)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        `更新配置项 ${key} 失败`,
        { originalError: error, configKey: key }
      )
    }
  }

  /**
   * 批量更新配置
   */
  async batchUpdateConfig(configs: Array<{ key: string; value: string }>): Promise<ConfigResponse[]> {
    try {
      const response = await this.httpClient.post<ConfigResponse[]>(this.endpoints.batch, { configs })
      return response.data
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '批量更新配置失败',
        { originalError: error, configCount: configs.length }
      )
    }
  }

  /**
   * 验证配置项
   */
  async validateConfigs(configs: Array<{ key: string; value: string; data_type?: string }>): Promise<{
    valid: boolean
    errors: Record<string, string[]>
    warnings: Record<string, string[]>
  }> {
    try {
      const response = await this.httpClient.post<{
        valid: boolean
        errors: Record<string, string[]>
        warnings: Record<string, string[]>
      }>(this.endpoints.validate, { configs })
      return response.data
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '验证配置失败',
        { originalError: error }
      )
    }
  }

  /**
   * 创建新配置项
   */
  async createConfigItem(data: {
    key: string
    value: string
    category: string
    description?: string
    data_type?: string
    is_public?: boolean
  }): Promise<ApiResponse<ConfigResponse>> {
    try {
      const configData = {
        ...data,
        data_type: data.data_type || 'string',
        is_public: data.is_public ?? true
      }

      return await this.httpClient.post<ConfigResponse>(this.endpoints.private, configData)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        `创建配置项 ${data.key} 失败`,
        { originalError: error, configKey: data.key }
      )
    }
  }

  /**
   * 删除配置项
   */
  async deleteConfigItem(key: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.httpClient.delete<{ message: string }>(this.endpoints.single(key))
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        `删除配置项 ${key} 失败`,
        { originalError: error, configKey: key }
      )
    }
  }

  /**
   * 根据分类获取配置
   */
  async getConfigByCategory(category: string): Promise<ApiResponse<ConfigResponse[]>> {
    try {
      return await this.httpClient.get<ConfigResponse[]>(`${this.endpoints.private}?category=${category}`)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        `获取 ${category} 分类配置失败`,
        { originalError: error, category }
      )
    }
  }

  /**
   * 重置配置到默认值
   */
  async resetConfig(): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.httpClient.post<{ message: string }>(`${this.endpoints.private}/reset`)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '重置配置失败',
        { originalError: error }
      )
    }
  }

  /**
   * 导出配置
   */
  async exportConfig(): Promise<ApiResponse<ConfigResponse[]>> {
    try {
      return await this.httpClient.get<ConfigResponse[]>(`${this.endpoints.private}/export`)
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '导出配置失败',
        { originalError: error }
      )
    }
  }

  /**
   * 导入配置
   */
  async importConfig(configs: ConfigResponse[]): Promise<ApiResponse<{
    imported: number
    failed: Array<{ key: string; error: string }>
  }>> {
    try {
      return await this.httpClient.post<{
        imported: number
        failed: Array<{ key: string; error: string }>
      }>(`${this.endpoints.private}/import`, { configs })
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }
      throw new ApplicationError(
        ErrorCode.CONFIG_ERROR,
        '导入配置失败',
        { originalError: error, configCount: configs.length }
      )
    }
  }

  /**
   * 根据配置键获取分类
   */
  private getCategoryForKey(key: string): string {
    if (key.startsWith('site_')) return 'basic'
    if (key.startsWith('social_')) return 'social'
    if (key.startsWith('seo_')) return 'seo'
    return 'other'
  }

  /**
   * 验证配置数据
   */
  validateConfigData(data: Partial<SiteConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.site_title !== undefined) {
      if (!data.site_title.trim()) {
        errors.push('网站标题不能为空')
      } else if (data.site_title.length > 100) {
        errors.push('网站标题长度不能超过100个字符')
      }
    }

    if (data.site_description !== undefined && data.site_description.length > 500) {
      errors.push('网站描述长度不能超过500个字符')
    }

    // 验证URL格式
    const urlFields: (keyof SiteConfig)[] = [
      'site_logo', 'site_favicon', 'social_github', 
      'social_twitter', 'social_weibo', 'social_linkedin'
    ]
    
    for (const field of urlFields) {
      const value = data[field]
      if (value && typeof value === 'string' && value.trim()) {
        try {
          new URL(value)
        } catch {
          errors.push(`${field} 不是有效的URL格式`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}