/**
 * 网站配置实体 - 重构版本
 */

export class SiteConfig {
  constructor(
    public readonly id: number,
    public readonly key: string,
    public readonly value: string,
    public readonly category: string,
    public readonly description: string = '',
    public readonly dataType: string = 'string',
    public readonly isPublic: boolean = true,
    public readonly sortOrder: number = 0,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  /**
   * 创建一个新的配置实例，更新值
   */
  withValue(newValue: string): SiteConfig {
    return new SiteConfig(
      this.id,
      this.key,
      newValue,
      this.category,
      this.description,
      this.dataType,
      this.isPublic,
      this.sortOrder,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 检查配置是否为空
   */
  isEmpty(): boolean {
    return !this.value || this.value.trim() === ''
  }

  /**
   * 获取配置的显示名称
   */
  getDisplayName(): string {
    return this.description || this.key
  }

  /**
   * 根据数据类型解析值
   */
  getParsedValue(): any {
    switch (this.dataType) {
      case 'boolean':
        return this.value === 'true' || this.value === '1'
      case 'number':
        return parseFloat(this.value) || 0
      case 'json':
        try {
          return JSON.parse(this.value)
        } catch {
          return {}
        }
      default:
        return this.value
    }
  }

  /**
   * 验证配置值格式
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (this.dataType) {
      case 'email':
        if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
          errors.push('邮箱格式不正确')
        }
        break
      case 'url':
        if (this.value && !/^https?:\/\/.+/.test(this.value)) {
          errors.push('URL格式不正确')
        }
        break
      case 'json':
        if (this.value) {
          try {
            JSON.parse(this.value)
          } catch {
            errors.push('JSON格式不正确')
          }
        }
        break
      case 'number':
        if (this.value && isNaN(parseFloat(this.value))) {
          errors.push('数字格式不正确')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 转换为普通对象
   */
  toObject(): Record<string, any> {
    return {
      id: this.id,
      key: this.key,
      value: this.value,
      category: this.category,
      description: this.description,
      dataType: this.dataType,
      isPublic: this.isPublic,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}