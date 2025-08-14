'use client';

import { useState, useEffect, useCallback } from 'react';
import { blogConfigAPI } from '@/lib/api/blog-config';
import {
  BlogConfig,
  BlogConfigPublic,
  ConfigGroup,
  ConfigCategory,
  BatchConfigUpdate,
  GroupedConfigResponse,
  ConfigStats
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
      const data = await blogConfigAPI.getConfigs(params);
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
      const data = await blogConfigAPI.getConfigGroups(params);
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
      return await blogConfigAPI.getGroupedConfigs(category);
    } catch (err) {
      console.error('获取分组配置失败:', err);
      throw err;
    }
  }, []);

  // 获取配置统计信息
  const fetchStats = useCallback(async () => {
    try {
      const data = await blogConfigAPI.getConfigStats();
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
      return await blogConfigAPI.getPublicConfigs();
    } catch (err) {
      console.error('获取公开配置失败:', err);
      throw err;
    }
  }, []);

  // 获取网站基础信息
  const fetchSiteInfo = useCallback(async () => {
    try {
      return await blogConfigAPI.getSiteInfo();
    } catch (err) {
      console.error('获取网站信息失败:', err);
      throw err;
    }
  }, []);

  // 更新单个配置
  const updateConfig = useCallback(async (id: number, data: any) => {
    try {
      const updated = await blogConfigAPI.updateConfig(id, data);
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
      const updated = await blogConfigAPI.updateConfigByKey(key, value);
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
      const updated = await blogConfigAPI.batchUpdateConfigs(data);
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

  // 创建配置
  const createConfig = useCallback(async (data: any) => {
    try {
      const created = await blogConfigAPI.createConfig(data);
      setConfigs(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('创建配置失败:', err);
      throw err;
    }
  }, []);

  // 删除配置
  const deleteConfig = useCallback(async (id: number) => {
    try {
      const deleted = await blogConfigAPI.deleteConfig(id);
      setConfigs(prev => prev.filter(config => config.id !== id));
      return deleted;
    } catch (err) {
      console.error('删除配置失败:', err);
      throw err;
    }
  }, []);

  // 创建配置分组
  const createGroup = useCallback(async (data: any) => {
    try {
      const created = await blogConfigAPI.createConfigGroup(data);
      setGroups(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('创建配置分组失败:', err);
      throw err;
    }
  }, []);

  // 更新配置分组
  const updateGroup = useCallback(async (id: number, data: any) => {
    try {
      const updated = await blogConfigAPI.updateConfigGroup(id, data);
      setGroups(prev => prev.map(group => group.id === id ? updated : group));
      return updated;
    } catch (err) {
      console.error('更新配置分组失败:', err);
      throw err;
    }
  }, []);

  // 删除配置分组
  const deleteGroup = useCallback(async (id: number) => {
    try {
      const deleted = await blogConfigAPI.deleteConfigGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
      return deleted;
    } catch (err) {
      console.error('删除配置分组失败:', err);
      throw err;
    }
  }, []);

  // 初始化默认配置
  const initDefaultConfigs = useCallback(async () => {
    try {
      return await blogConfigAPI.initDefaultConfigs();
    } catch (err) {
      console.error('初始化默认配置失败:', err);
      throw err;
    }
  }, []);

  // 清除配置缓存
  const clearConfigCache = useCallback(async (category?: ConfigCategory) => {
    try {
      return await blogConfigAPI.clearConfigCache(category);
    } catch (err) {
      console.error('清除配置缓存失败:', err);
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
    getConfigValue,
    getConfigsByCategory,
    getConfigsByGroup
  };
}