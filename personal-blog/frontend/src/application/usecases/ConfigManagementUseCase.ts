/**
 * 配置管理用例
 * 处理站点配置的业务逻辑
 */

import { IEventBus } from '../../core/contracts/IEventBus'
import { SiteConfig, SiteConfigEntity, SiteConfigItem } from '../../core/entities/SiteConfig'
import { ConfigApi, BatchConfigUpdate } from '../../infrastructure/api/ConfigApi'
import { 
  ValidationError, 
  ApplicationError,
  ConfigError,
  ErrorCode 
} from '../../core/errors/ApplicationError'

export interface ConfigUpdateResult {
  success: boolean
  updatedCount?: number
  failedItems?: Array<{ key: string; error: string }>
  error?: string
}

export interface ConfigGetResult {
  success: boolean
  config?: SiteConfig
  error?: string
}

export class ConfigManagementUseCase {
  constructor(
    private configApi: ConfigApi,
    private eventBus: IEventBus
  ) {}

  /**
   * 获取站点配置
   */
  async getConfig(): Promise<ConfigGetResult> {
    try {
      const response = await this.configApi.getPublicConfig()
      
      if (response.data) {
        const configEntity = SiteConfigEntity.fromConfigItems(response.data as any)
        
        // 发布配置加载事件
        await this.eventBus.publish('config.loaded', {
          config: configEntity.toJSON(),
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          config: configEntity.toJSON()
        }
      } else {
        return {
          success: false,
          error: response.error || '获取配置失败'
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.getUserMessage()
        }
      }

      return {
        success: false,
        error: '获取配置时发生错误'
      }
    }
  }

  /**
   * 获取所有配置（需要认证）
   */
  async getAllConfig(): Promise<ConfigGetResult> {
    try {
      const response = await this.configApi.getAllConfig()
      
      if (response.data) {
        const configEntity = SiteConfigEntity.fromConfigItems(response.data as any)
        
        return {
          success: true,
          config: configEntity.toJSON()
        }
      } else {
        return {
          success: false,
          error: response.error || '获取配置失败'
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.getUserMessage()
        }
      }

      return {
        success: false,
        error: '获取配置时发生错误'
      }
    }
  }

  /**
   * 更新单个配置项
   */
  async updateConfigItem(key: keyof SiteConfig, value: string): Promise<ConfigUpdateResult> {
    try {
      // 1. 验证配置键
      this.validateConfigKey(key)

      // 2. 验证配置值
      this.validateConfigValue(key, value)

      // 3. 执行更新
      const response = await this.configApi.updateConfigItem(key, value)

      if (response.data) {
        // 发布配置更新事件
        await this.eventBus.publish('config.updated', {
          key,
          value,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          updatedCount: 1
        }
      } else {
        return {
          success: false,
          error: response.error || '更新配置失败'
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.getUserMessage()
        }
      }

      return {
        success: false,
        error: '更新配置时发生错误'
      }
    }
  }

  /**
   * 批量更新配置
   */
  async batchUpdateConfig(updates: Partial<SiteConfig>): Promise<ConfigUpdateResult> {
    try {
      // 1. 验证更新数据
      this.validateConfigUpdates(updates)

      // 2. 转换为API格式
      const batchUpdate = this.transformToBatchUpdate(updates)

      // 3. 执行批量更新
      const response = await this.configApi.batchUpdateConfig(batchUpdate)

      if (response.data) {
        const { updated, failed } = response.data

        // 发布批量更新事件
        await this.eventBus.publish('config.batch_updated', {
          updates,
          updated,
          failed,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          updatedCount: updated,
          failedItems: failed
        }
      } else {
        return {
          success: false,
          error: response.error || '批量更新配置失败'
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.getUserMessage()
        }
      }

      return {
        success: false,
        error: '批量更新配置时发生错误'
      }
    }
  }

  /**
   * 重置配置到默认值
   */
  async resetConfig(): Promise<ConfigUpdateResult> {
    try {
      const response = await this.configApi.resetConfig()

      if (response.data) {
        // 发布配置重置事件
        await this.eventBus.publish('config.reset', {
          timestamp: new Date().toISOString()
        })

        return {
          success: true
        }
      } else {
        return {
          success: false,
          error: response.error || '重置配置失败'
        }
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.getUserMessage()
        }
      }

      return {
        success: false,
        error: '重置配置时发生错误'
      }
    }
  }

  /**
   * 验证配置键
   */
  private validateConfigKey(key: string): void {
    const validKeys = [
      'site_title', 'site_subtitle', 'site_description', 'site_keywords',
      'site_logo', 'site_favicon', 'site_language', 'site_timezone',
      'site_copyright', 'site_icp', 'site_public_security',
      'social_github', 'social_twitter', 'social_weibo', 'social_wechat', 'social_linkedin',
      'seo_google_analytics', 'seo_baidu_analytics', 'seo_meta_author',
      'other_notice'
    ]

    if (!validKeys.includes(key)) {
      throw new ConfigError(`无效的配置键: ${key}`, key)
    }
  }

  /**
   * 验证配置值
   */
  private validateConfigValue(key: keyof SiteConfig, value: string): void {
    const errors: string[] = []

    switch (key) {
      case 'site_title':
        if (!value.trim()) {
          errors.push('网站标题不能为空')
        } else if (value.length > 100) {
          errors.push('网站标题长度不能超过100个字符')
        }
        break

      case 'site_description':
        if (value.length > 500) {
          errors.push('网站描述长度不能超过500个字符')
        }
        break

      case 'site_keywords':
        if (value.length > 200) {
          errors.push('网站关键词长度不能超过200个字符')
        }
        break

      case 'site_logo':
      case 'site_favicon':
      case 'social_github':
      case 'social_twitter':
      case 'social_weibo':
      case 'social_linkedin':
        if (value && value.trim() && !this.isValidUrl(value)) {
          errors.push(`${key} 不是有效的URL格式`)
        }
        break

      case 'site_language':
        if (value && !this.isValidLanguageCode(value)) {
          errors.push('语言代码格式无效')
        }
        break

      case 'site_timezone':
        if (value && !this.isValidTimezone(value)) {
          errors.push('时区格式无效')
        }
        break
    }

    if (errors.length > 0) {
      throw new ValidationError(
        errors.join('; '),
        key,
        errors
      )
    }
  }

  /**
   * 验证批量更新数据
   */
  private validateConfigUpdates(updates: Partial<SiteConfig>): void {
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string') {
        this.validateConfigKey(key)
        this.validateConfigValue(key as keyof SiteConfig, value)
      }
    }

    // 使用配置实体的验证方法
    const tempConfig = new SiteConfigEntity()
    tempConfig.updateFields(updates)
    const validation = tempConfig.validate()
    
    if (!validation.valid) {
      throw new ValidationError(
        validation.errors.join('; '),
        undefined,
        validation.errors
      )
    }
  }

  /**
   * 转换为批量更新格式
   */
  private transformToBatchUpdate(updates: Partial<SiteConfig>): BatchConfigUpdate {
    const configs = Object.entries(updates).map(([key, value]) => ({
      key,
      value: String(value || ''),
      category: this.getCategoryForKey(key),
      data_type: 'string'
    }))

    return { configs }
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
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证语言代码格式
   */
  private isValidLanguageCode(code: string): boolean {
    // 简单的语言代码验证（如 zh-CN, en-US）
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/
    return languageRegex.test(code)
  }

  /**
   * 验证时区格式
   */
  private isValidTimezone(timezone: string): boolean {
    // 简单的时区验证
    const timezoneRegex = /^[A-Z][a-zA-Z]*\/[A-Z][a-zA-Z_]*$/
    return timezoneRegex.test(timezone)
  }

  /**
   * 创建配置备份
   */
  async createConfigBackup(): Promise<{ success: boolean; backup?: SiteConfigItem[]; error?: string }> {
    try {
      const response = await this.configApi.exportConfig()
      
      if (response.data) {
        // 发布备份创建事件
        await this.eventBus.publish('config.backup_created', {
          itemCount: response.data.length,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          backup: response.data as any
        }
      } else {
        return {
          success: false,
          error: response.error || '创建配置备份失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: '创建配置备份时发生错误'
      }
    }
  }

  /**
   * 从备份恢复配置
   */
  async restoreConfigFromBackup(backup: SiteConfigItem[]): Promise<ConfigUpdateResult> {
    try {
      const response = await this.configApi.importConfig(backup as any)
      
      if (response.data) {
        const { imported, failed } = response.data

        // 发布恢复事件
        await this.eventBus.publish('config.restored', {
          imported,
          failed,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          updatedCount: imported,
          failedItems: failed
        }
      } else {
        return {
          success: false,
          error: response.error || '恢复配置失败'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: '恢复配置时发生错误'
      }
    }
  }
}