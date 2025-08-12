'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { blogConfigAPI } from '@/lib/api/blog-config';
import { BlogConfigPublic } from '@/types/blog-config';

interface SiteConfig {
  site_title: string;
  site_subtitle: string;
  site_description: string;
  site_keywords: string;
  site_author: string;
  site_logo: string;
  site_favicon: string;
  [key: string]: string;
}

interface SiteConfigContextType {
  config: SiteConfig;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const defaultConfig: SiteConfig = {
  site_title: '个人博客系统',
  site_subtitle: '分享技术与生活',
  site_description: '现代化的个人博客平台，支持文章发布、评论互动、分类标签等功能',
  site_keywords: '博客,文章,技术分享,个人网站',
  site_author: '博客作者',
  site_logo: '',
  site_favicon: '',
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const publicConfigs = await blogConfigAPI.getPublicConfigs();
      
      // 将配置数组转换为对象
      const configObj: SiteConfig = { ...defaultConfig };
      publicConfigs.forEach((item: BlogConfigPublic) => {
        configObj[item.config_key] = item.config_value || '';
      });
      
      setConfig(configObj);
    } catch (err) {
      console.error('Failed to load site config:', err);
      setError(err instanceof Error ? err.message : '加载配置失败');
      // 使用默认配置
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    await loadConfig();
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, loading, error, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}

// 便捷的 Hook 用于获取特定配置值
export function useConfigValue(key: string, defaultValue: string = '') {
  const { config } = useSiteConfig();
  return config[key] || defaultValue;
}