import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { siteConfigAPI } from '@/lib/api/site-config'
import { SiteConfig, ConfigUpdateRequest } from '@/types/site-config'

export function useSiteConfigManager() {
  const [configs, setConfigs] = useState<SiteConfig[]>([])
  const [originalConfigs, setOriginalConfigs] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // 获取配置数据
  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const data = await siteConfigAPI.getConfigs()
      setConfigs(data)
      setOriginalConfigs(JSON.parse(JSON.stringify(data)))
    } catch (error) {
      console.error('获取配置失败:', error)
      toast({
        title: '获取配置失败',
        description: error instanceof Error ? error.message : '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新单个配置项
  const updateConfig = useCallback((key: string, value: string) => {
    setConfigs(prev => {
      const newConfigs = [...prev]
      const index = newConfigs.findIndex(config => config.key === key)
      if (index !== -1) {
        newConfigs[index] = { ...newConfigs[index], value }
      }
      return newConfigs
    })
  }, [])

  // 根据分类获取配置
  const getConfigsByCategory = (category: string) => {
    return configs.filter(config => config.category === category)
  }

  return {
    configs,
    originalConfigs,
    setOriginalConfigs,
    loading,
    savingStates,
    setSavingStates,
    fetchConfigs,
    updateConfig,
    getConfigsByCategory,
    toast
  }
}