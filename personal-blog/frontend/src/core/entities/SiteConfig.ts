/**
 * 站点配置实体
 * 领域模型定义
 */

export interface SiteConfigCategory {
  basic: 'basic'
  social: 'social'
  seo: 'seo'
  other: 'other'
}

export interface SiteConfigItem {
  id: number
  key: string
  value: string
  category: keyof SiteConfigCategory
  description?: string
  data_type: 'string' | 'number' | 'boolean' | 'json'
  is_public: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SiteConfig {
  // 基础信息
  site_title: string
  site_subtitle: string
  site_description: string
  site_keywords: string
  site_logo: string
  site_favicon: string
  site_language: string
  site_timezone: string
  site_copyright: string
  site_icp: string
  site_public_security: string
  
  // 社交媒体
  social_github: string
  social_twitter: string
  social_weibo: string
  social_wechat: string
  social_linkedin: string
  
  // SEO设置
  seo_google_analytics: string
  seo_baidu_analytics: string
  seo_meta_author: string
  
  // 其他设置
  other_notice: string
}

export class SiteConfigEntity implements SiteConfig {
  constructor(
    public site_title: string = '个人博客',
    public site_subtitle: string = '分享技术与生活',
    public site_description: string = '这是一个个人技术博客',
    public site_keywords: string = '博客,技术,编程',
    public site_logo: string = '',
    public site_favicon: string = '',
    public site_language: string = 'zh-CN',
    public site_timezone: string = 'Asia/Shanghai',
    public site_copyright: string = '',
    public site_icp: string = '',
    public site_public_security: string = '',
    public social_github: string = '',
    public social_twitter: string = '',
    public social_weibo: string = '',
    public social_wechat: string = '',
    public social_linkedin: string = '',
    public seo_google_analytics: string = '',
    public seo_baidu_analytics: string = '',
    public seo_meta_author: string = '',
    public other_notice: string = ''
  ) {}

  /**
   * 获取基础信息配置
   */
  getBasicInfo() {
    return {
      title: this.site_title,
      subtitle: this.site_subtitle,
      description: this.site_description,
      keywords: this.site_keywords,
      logo: this.site_logo,
      favicon: this.site_favicon,
      language: this.site_language,
      timezone: this.site_timezone,
      copyright: this.site_copyright,
      icp: this.site_icp,
      publicSecurity: this.site_public_security
    }
  }

  /**
   * 获取社交媒体配置
   */
  getSocialLinks() {
    return {
      github: this.social_github,
      twitter: this.social_twitter,
      weibo: this.social_weibo,
      wechat: this.social_wechat,
      linkedin: this.social_linkedin
    }
  }

  /**
   * 获取SEO配置
   */
  getSeoSettings() {
    return {
      googleAnalytics: this.seo_google_analytics,
      baiduAnalytics: this.seo_baidu_analytics,
      metaAuthor: this.seo_meta_author
    }
  }

  /**
   * 获取其他配置
   */
  getOtherSettings() {
    return {
      notice: this.other_notice
    }
  }

  /**
   * 更新单个字段
   */
  updateField<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    this[key] = value
  }

  /**
   * 批量更新字段
   */
  updateFields(updates: Partial<SiteConfig>) {
    Object.assign(this, updates)
  }

  /**
   * 验证配置
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.site_title.trim()) {
      errors.push('网站标题不能为空')
    }

    if (this.site_title.length > 100) {
      errors.push('网站标题长度不能超过100个字符')
    }

    if (this.site_description.length > 500) {
      errors.push('网站描述长度不能超过500个字符')
    }

    // 验证URL格式
    const urlFields = [
      'site_logo', 'site_favicon', 'social_github', 
      'social_twitter', 'social_weibo', 'social_linkedin'
    ]
    
    for (const field of urlFields) {
      const value = this[field as keyof SiteConfig]
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

  /**
   * 转换为配置项数组
   */
  toConfigItems(): Partial<SiteConfigItem>[] {
    const items: Partial<SiteConfigItem>[] = []
    
    const configMap: Record<keyof SiteConfig, { category: keyof SiteConfigCategory; description: string }> = {
      site_title: { category: 'basic', description: '网站标题' },
      site_subtitle: { category: 'basic', description: '网站副标题' },
      site_description: { category: 'basic', description: '网站描述' },
      site_keywords: { category: 'basic', description: '网站关键词' },
      site_logo: { category: 'basic', description: '网站Logo' },
      site_favicon: { category: 'basic', description: '网站图标' },
      site_language: { category: 'basic', description: '网站语言' },
      site_timezone: { category: 'basic', description: '时区' },
      site_copyright: { category: 'basic', description: '版权信息' },
      site_icp: { category: 'basic', description: 'ICP备案号' },
      site_public_security: { category: 'basic', description: '公安备案号' },
      social_github: { category: 'social', description: 'GitHub链接' },
      social_twitter: { category: 'social', description: 'Twitter链接' },
      social_weibo: { category: 'social', description: '微博链接' },
      social_wechat: { category: 'social', description: '微信链接' },
      social_linkedin: { category: 'social', description: 'LinkedIn链接' },
      seo_google_analytics: { category: 'seo', description: 'Google Analytics ID' },
      seo_baidu_analytics: { category: 'seo', description: '百度统计ID' },
      seo_meta_author: { category: 'seo', description: 'Meta作者信息' },
      other_notice: { category: 'other', description: '网站公告' }
    }

    let sortOrder = 0
    for (const [key, config] of Object.entries(configMap)) {
      items.push({
        key,
        value: this[key as keyof SiteConfig],
        category: config.category,
        description: config.description,
        data_type: 'string',
        is_public: config.category !== 'seo',
        sort_order: sortOrder++
      })
    }

    return items
  }

  toJSON(): SiteConfig {
    return {
      site_title: this.site_title,
      site_subtitle: this.site_subtitle,
      site_description: this.site_description,
      site_keywords: this.site_keywords,
      site_logo: this.site_logo,
      site_favicon: this.site_favicon,
      site_language: this.site_language,
      site_timezone: this.site_timezone,
      site_copyright: this.site_copyright,
      site_icp: this.site_icp,
      site_public_security: this.site_public_security,
      social_github: this.social_github,
      social_twitter: this.social_twitter,
      social_weibo: this.social_weibo,
      social_wechat: this.social_wechat,
      social_linkedin: this.social_linkedin,
      seo_google_analytics: this.seo_google_analytics,
      seo_baidu_analytics: this.seo_baidu_analytics,
      seo_meta_author: this.seo_meta_author,
      other_notice: this.other_notice
    }
  }

  static fromJSON(data: SiteConfig): SiteConfigEntity {
    return new SiteConfigEntity(
      data.site_title,
      data.site_subtitle,
      data.site_description,
      data.site_keywords,
      data.site_logo,
      data.site_favicon,
      data.site_language,
      data.site_timezone,
      data.site_copyright,
      data.site_icp,
      data.site_public_security,
      data.social_github,
      data.social_twitter,
      data.social_weibo,
      data.social_wechat,
      data.social_linkedin,
      data.seo_google_analytics,
      data.seo_baidu_analytics,
      data.seo_meta_author,
      data.other_notice
    )
  }

  static fromConfigItems(items: SiteConfigItem[]): SiteConfigEntity {
    const config = new SiteConfigEntity()
    
    items.forEach(item => {
      if (item.key in config) {
        (config as any)[item.key] = item.value
      }
    })

    return config
  }
}