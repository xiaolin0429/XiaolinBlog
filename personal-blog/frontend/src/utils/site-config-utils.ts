import { SiteConfig, ConfigUpdateRequest } from '@/types/site-config'

/**
 * 检查指定分类的配置是否有变更（简化版本，主要用于UI显示）
 */
export function hasConfigChanges(
  configs: SiteConfig[],
  originalConfigs: SiteConfig[],
  category: string
): boolean {
  // 简化逻辑：只要有配置项就认为可能有变更，用于UI显示变更指示器
  const categoryConfigs = configs.filter(config => config.category === category)
  return categoryConfigs.some(config => {
    const original = originalConfigs.find(orig => orig.key === config.key)
    if (!original) {
      return config.value && config.value.trim() !== ''
    }
    const originalValue = original.value || ''
    const currentValue = config.value || ''
    return originalValue !== currentValue
  })
}

/**
 * 准备社交媒体配置更新数据
 */
export function prepareSocialConfigUpdates(
  currentTabConfigs: SiteConfig[]
): ConfigUpdateRequest[] {
  // 对于社交媒体配置，发送所有当前配置项
  const configsToUpdate = currentTabConfigs.map(config => ({
    key: config.key,
    value: config.value || ''
  }))
  
  // 自动更新启用状态配置项
  const socialPlatforms = ['github', 'twitter', 'linkedin', 'instagram', 'facebook', 'youtube']
  socialPlatforms.forEach(platform => {
    const socialConfig = currentTabConfigs.find(config => config.key === `social_${platform}`)
    const enabledKey = `${platform}_enabled`
    const isEnabled = socialConfig && socialConfig.value && socialConfig.value.trim() !== ''
    
    // 查找或更新启用状态配置
    const existingEnabledConfigIndex = configsToUpdate.findIndex(config => config.key === enabledKey)
    if (existingEnabledConfigIndex !== -1) {
      // 更新现有的启用状态配置
      configsToUpdate[existingEnabledConfigIndex].value = isEnabled ? 'true' : 'false'
    } else {
      // 添加新的启用状态配置
      configsToUpdate.push({
        key: enabledKey,
        value: isEnabled ? 'true' : 'false'
      })
    }
  })
  
  return configsToUpdate
}

/**
 * 准备其他配置更新数据
 */
export function prepareOtherConfigUpdates(
  currentTabConfigs: SiteConfig[],
  originalConfigs: SiteConfig[]
): ConfigUpdateRequest[] {
  // 直接发送所有当前配置项，让服务端处理
  const configsToUpdate = currentTabConfigs.map(config => ({
    key: config.key,
    value: config.value || ''
  }))
  
  console.log(`🚀 [DEBUG] 准备发送所有配置项:`, configsToUpdate.length)
  console.log(`🔍 [DEBUG] 配置项详情:`, configsToUpdate)
  
  return configsToUpdate
}
