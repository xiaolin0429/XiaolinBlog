import { siteConfigAPI } from '@/lib/api/site-config'
import { SiteConfig, TabConfig } from '@/types/site-config'
import { prepareSocialConfigUpdates, prepareOtherConfigUpdates } from '@/utils/site-config-utils'

interface UseSiteConfigSaverProps {
  configs: SiteConfig[]
  originalConfigs: SiteConfig[]
  tabConfigs: TabConfig[]
  setSavingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setOriginalConfigs: React.Dispatch<React.SetStateAction<SiteConfig[]>>
  toast: any
}

export function useSiteConfigSaver({
  configs,
  originalConfigs,
  tabConfigs,
  setSavingStates,
  setOriginalConfigs,
  toast
}: UseSiteConfigSaverProps) {
  
  // 保存当前标签页的配置
  const saveCurrentTabConfigs = async (activeTab: string) => {
    const currentTabConfig = tabConfigs.find(tab => tab.value === activeTab)
    if (!currentTabConfig) return

    try {
      setSavingStates(prev => ({ ...prev, [activeTab]: true }))
      console.log(`🔵 [DEBUG] 开始保存${currentTabConfig.label}配置`)
      
      // 找出当前标签页的所有配置项
      const currentTabConfigs = configs.filter(config => config.category === currentTabConfig.category)
      
      let configsToUpdate
      
      // 特殊处理社交媒体配置：发送所有配置项，包括启用状态
      if (currentTabConfig.category === 'social') {
        configsToUpdate = prepareSocialConfigUpdates(currentTabConfigs)
        console.log(`🔍 [DEBUG] 社交媒体配置 - 发送所有配置项:`, configsToUpdate.length)
        console.log(`🔍 [DEBUG] 社交媒体配置详情:`, configsToUpdate)
      } else {
        // 对于其他配置，直接发送所有配置项
        configsToUpdate = prepareOtherConfigUpdates(currentTabConfigs, originalConfigs)
        
        console.log(`🔍 [DEBUG] 准备发送的配置项:`, configsToUpdate.length)
        console.log(`🔍 [DEBUG] 配置项详情:`, configsToUpdate)
      }

      console.log(`🚀 [DEBUG] ${currentTabConfig.label}发送配置项:`, configsToUpdate)

      // 发送配置项
      await siteConfigAPI.batchUpdateConfigs(configsToUpdate)
      
      // 更新该标签页的原始配置数据
      setOriginalConfigs(prev => {
        const newOriginalConfigs = [...prev]
        configsToUpdate.forEach(updateConfig => {
          const index = newOriginalConfigs.findIndex(orig => orig.key === updateConfig.key)
          if (index !== -1) {
            newOriginalConfigs[index] = { ...newOriginalConfigs[index], value: updateConfig.value }
          }
        })
        return newOriginalConfigs
      })
      
      toast({
        title: '保存成功',
        description: `${currentTabConfig.label}已更新 ${configsToUpdate.length} 个配置项`,
      })
      
      console.log(`✅ [DEBUG] ${currentTabConfig.label}配置保存完成，更新了 ${configsToUpdate.length} 个配置项`)
    } catch (error) {
      console.error('保存配置失败:', error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setSavingStates(prev => ({ ...prev, [activeTab]: false }))
    }
  }

  return {
    saveCurrentTabConfigs
  }
}