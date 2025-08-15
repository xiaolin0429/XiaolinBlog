'use client';

import { useState, useEffect, useCallback } from 'react';
import { blogConfigApi } from '@/lib/api/blog-config';
import {
  BlogConfig,
  BlogConfigPublic,
  ConfigGroup,
  ConfigCategory,
  BatchConfigUpdate,
  GroupedConfigResponse,
  ConfigStats,
  ConfigHistory
} from '@/types/blog-config';

export function useBlogConfig() {
  const [configs, setConfigs] = useState<BlogConfig[]>([]);
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<ConfigStats | null>(null);

  // 获取所有配置
  const fetchConfigs = useCallback(async (params?: {
    category?: ConfigCategory;
    group_key?: string;
    is_enabled?: boolean;
    is_public?: boolean;
    search?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogConfigApi.getConfigsByCategory(params?.category || ConfigCategory.SITE_BASIC);
      setConfigs(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取配置失败');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取所有分组
  const fetchGroups = useCallback(async (params?: {
    category?: ConfigCategory;
    is_active?: boolean;
  }) => {
    try {
      const data = await blogConfigApi.getConfigGroups();
      setGroups(data);
      return data;
    } catch (err) {
      console.error('获取配置分组失败:', err);
      throw err;
    }
  }, []);

  // 获取分组的配置
  const fetchGroupedConfigs = useCallback(async (category: ConfigCategory) => {
    try {
      return await blogConfigApi.getGroupedConfigs(category);
    } catch (err) {
      console.error('获取分组配置失败:', err);
      throw err;
    }
  }, []);

  // 获取配置统计信息
  const fetchStats = useCallback(async () => {
    try {
      const data = await blogConfigApi.getConfigStats();
      setStats(data);
      return data;
    } catch (err) {
      console.error('获取配置统计信息失败:', err);
      throw err;
    }
  }, []);

  // 获取公开配置
  const fetchPublicConfigs = useCallback(async () => {
    try {
      return await blogConfigApi.getAllPublicConfigs();
    } catch (err) {
      console.error('获取公开配置失败:', err);
      throw err;
    }
  }, []);

  // 获取网站基础信息
  const fetchSiteInfo = useCallback(async () => {
    try {
      return await blogConfigApi.getSiteInfo();
    } catch (err) {
      console.error('获取网站信息失败:', err);
      throw err;
    }
  }, []);

  // 更新单个配置
  const updateConfig = useCallback(async (id: number, data: any) => {
    try {
      const updated = await blogConfigApi.updateConfig(id, data);
      setConfigs(prev => prev.map(config => config.id === id ? updated : config));
      return updated;
    } catch (err) {
      console.error('更新配置失败:', err);
      throw err;
    }
  }, []);

  // 根据键名更新配置
  const updateConfigByKey = useCallback(async (key: string, value?: string) => {
    try {
      const updated = await blogConfigApi.updateConfigByKey(key, value || '');
      setConfigs(prev => prev.map(config => config.config_key === key ? updated : config));
      return updated;
    } catch (err) {
      console.error('更新配置失败:', err);
      throw err;
    }
  }, []);

  // 批量更新配置
  const batchUpdateConfigs = useCallback(async (data: BatchConfigUpdate) => {
    try {
      const updated = await blogConfigApi.batchUpdateConfigs(data);
      setConfigs(prev => {
        const newConfigs = [...prev];
        for (const updatedConfig of updated) {
          const index = newConfigs.findIndex(c => c.id === updatedConfig.id);
          if (index !== -1) {
            newConfigs[index] = updatedConfig;
          }
        }
        return newConfigs;
      });
      return updated;
    } catch (err) {
      console.error('批量更新配置失败:', err);
      throw err;
    }
  }, []);

  // 创建配置 - API中暂未实现
  const createConfig = useCallback(async (data: any) => {
    try {
      // 暂时抛出未实现错误
      throw new Error('创建配置功能暂未实现');
    } catch (err) {
      console.error('创建配置失败:', err);
      throw err;
    }
  }, []);

  // 删除配置 - API中暂未实现
  const deleteConfig = useCallback(async (id: number) => {
    try {
      // 暂时抛出未实现错误
      throw new Error('删除配置功能暂未实现');
    } catch (err) {
      console.error('删除配置失败:', err);
      throw err;
    }
  }, []);

  // 创建配置分组 - API中暂未实现
  const createGroup = useCallback(async (data: any) => {
    try {
      // 暂时抛出未实现错误
      throw new Error('创建配置分组功能暂未实现');
    } catch (err) {
      console.error('创建配置分组失败:', err);
      throw err;
    }
  }, []);

  // 更新配置分组 - API中暂未实现
  const updateGroup = useCallback(async (id: number, data: any) => {
    try {
      // 暂时抛出未实现错误
      throw new Error('更新配置分组功能暂未实现');
    } catch (err) {
      console.error('更新配置分组失败:', err);
      throw err;
    }
  }, []);

  // 删除配置分组 - API中暂未实现
  const deleteGroup = useCallback(async (id: number) => {
    try {
      // 暂时抛出未实现错误
      throw new Error('删除配置分组功能暂未实现');
    } catch (err) {
      console.error('删除配置分组失败:', err);
      throw err;
    }
  }, []);

  // 初始化默认配置 - API中暂未实现
  const initDefaultConfigs = useCallback(async () => {
    try {
      // 暂时返回成功消息
      return { success: true, message: '初始化默认配置功能暂未实现' };
    } catch (err) {
      console.error('初始化默认配置失败:', err);
      throw err;
    }
  }, []);

  // 清除配置缓存
  const clearConfigCache = useCallback(async (category?: ConfigCategory) => {
    try {
      return await blogConfigApi.clearConfigCache(category);
    } catch (err) {
      console.error('清除配置缓存失败:', err);
      throw err;
    }
  }, []);

  // 获取配置历史
  const getConfigHistory = useCallback(async (configKey: string, limit: number = 50) => {
    try {
      return await blogConfigApi.getConfigHistory(configKey, limit);
    } catch (err) {
      console.error('获取配置历史失败:', err);
      throw err;
    }
  }, []);

  // 获取配置值
  const getConfigValue = useCallback((key: string, defaultValue: string = ''): string => {
    const config = configs.find(c => c.config_key === key);
    return config?.config_value || defaultValue;
  }, [configs]);

  // 获取指定分类的配置
  const getConfigsByCategory = useCallback((category: ConfigCategory): BlogConfig[] => {
    return configs.filter(config => config.category === category);
  }, [configs]);

  // 获取指定分组的配置
  const getConfigsByGroup = useCallback((groupKey: string): BlogConfig[] => {
    return configs.filter(config => config.group_key === groupKey);
  }, [configs]);

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 并行加载配置和分组
        await Promise.all([
          fetchConfigs(),
          fetchGroups(),
          fetchStats()
        ]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('初始化配置失败');
        setError(error);
        console.error('初始化配置失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [fetchConfigs, fetchGroups, fetchStats]);

  return {
    configs,
    groups,
    loading,
    error,
    stats,
    fetchConfigs,
    fetchGroups,
    fetchGroupedConfigs,
    fetchStats,
    fetchPublicConfigs,
    fetchSiteInfo,
    updateConfig,
    updateConfigByKey,
    batchUpdateConfigs,
    createConfig,
    deleteConfig,
    createGroup,
    updateGroup,
    deleteGroup,
    initDefaultConfigs,
    clearConfigCache,
    getConfigHistory,
    getConfigValue,
    getConfigsByCategory,
    getConfigsByGroup
  };
}