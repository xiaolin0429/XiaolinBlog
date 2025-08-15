'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useBlogConfig } from '@/hooks/use-blog-config';

// 兼容旧接口的类型定义
interface SiteInfo {
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
  logo: string;
  language: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  wechat: string;
  qq: string;
}

interface SocialLinks {
  github: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  weibo: string;
  wechat: string;
}

interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  author: string;
  favicon: string;
  metaAuthor: string;
  googleAnalytics: string;
  baiduAnalytics: string;
}

interface OtherSettings {
  analytics_id: string;
  comment_system: string;
  footer_text: string;
  icp_number: string;
  notice: string;
  copyright: string;
  icp: string;
  publicSecurity: string;
}

interface SiteConfigContextType {
  config: Record<string, string>;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  // 兼容旧接口的便捷方法
  getSiteInfo: () => SiteInfo;
  getContactInfo: () => ContactInfo;
  getSocialLinks: () => SocialLinks;
  getSeoSettings: () => SeoSettings;
  getOtherSettings: () => OtherSettings;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // 使用公开接口获取配置
  const fetchPublicConfigs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用公开接口获取配置
      const response = await fetch('http://localhost:8000/api/v1/public/blog-config/configs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const publicConfigs = await response.json();
      
      // 转换为旧格式
      const configMap = publicConfigs.reduce((acc: Record<string, string>, item: any) => {
        acc[item.config_key] = item.config_value || '';
        return acc;
      }, {});
      
      setConfig(configMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取配置失败';
      setError(errorMessage);
      console.error('获取公开配置失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时获取配置
  React.useEffect(() => {
    fetchPublicConfigs();
  }, [fetchPublicConfigs]);

  const getConfigValue = (key: string, defaultValue: string = ''): string => {
    return config[key] || defaultValue;
  };

  const getSiteInfo = (): SiteInfo => ({
    title: getConfigValue('site_title', '个人博客'),
    subtitle: getConfigValue('site_subtitle', '分享技术与生活'),
    description: getConfigValue('site_description', '这是一个个人技术博客'),
    keywords: getConfigValue('site_keywords', '博客,技术,编程'),
    logo: getConfigValue('site_logo', ''),
    language: getConfigValue('site_language', 'zh-CN')
  });

  const getContactInfo = (): ContactInfo => ({
    email: getConfigValue('contact_email', ''),
    phone: getConfigValue('contact_phone', ''),
    address: getConfigValue('contact_address', ''),
    wechat: getConfigValue('contact_wechat', ''),
    qq: getConfigValue('contact_qq', '')
  });

  const getSocialLinks = (): SocialLinks => ({
    github: getConfigValue('social_github', ''),
    twitter: getConfigValue('social_twitter', ''),
    linkedin: getConfigValue('social_linkedin', ''),
    instagram: getConfigValue('social_instagram', ''),
    youtube: getConfigValue('social_youtube', ''),
    weibo: getConfigValue('social_weibo', ''),
    wechat: getConfigValue('contact_wechat', '')
  });

  const getSeoSettings = (): SeoSettings => ({
    title: getConfigValue('seo_title', getConfigValue('site_title', '个人博客')),
    description: getConfigValue('seo_description', getConfigValue('site_description', '')),
    keywords: getConfigValue('seo_keywords', getConfigValue('site_keywords', '')),
    author: getConfigValue('seo_author', ''),
    favicon: getConfigValue('seo_favicon', '/favicon.ico'),
    metaAuthor: getConfigValue('seo_author', ''),
    googleAnalytics: getConfigValue('analytics_google_id', ''),
    baiduAnalytics: getConfigValue('analytics_baidu_id', '')
  });

  const getOtherSettings = (): OtherSettings => ({
    analytics_id: getConfigValue('analytics_google_id', ''),
    comment_system: getConfigValue('comment_system', 'none'),
    footer_text: getConfigValue('footer_copyright', ''),
    icp_number: getConfigValue('site_icp', ''),
    notice: getConfigValue('site_notice', ''),
    copyright: getConfigValue('footer_copyright', ''),
    icp: getConfigValue('site_icp', ''),
    publicSecurity: getConfigValue('site_public_security', '')
  });

  const refreshConfig = async (): Promise<void> => {
    await fetchPublicConfigs();
  };

  return (
    <SiteConfigContext.Provider value={{
      config,
      loading,
      error,
      refreshConfig,
      getSiteInfo,
      getContactInfo,
      getSocialLinks,
      getSeoSettings,
      getOtherSettings
    }}>
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

export function useConfigValue(key: string, defaultValue: string = '') {
  const { config } = useSiteConfig();
  return config[key] || defaultValue;
}