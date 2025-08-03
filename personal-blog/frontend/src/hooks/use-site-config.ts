"use client"

import { useState, useEffect } from 'react'

interface SiteConfig {
  key: string
  value: string
  category: string
  description?: string
  data_type: string
}

interface SiteInfo {
  title: string
  subtitle: string
  description: string
  keywords: string
  logo: string
}


interface SocialLinks {
  github: string
  weibo: string
  wechat: string
  linkedin: string
}

interface SeoSettings {
  googleAnalytics: string
  baiduAnalytics: string
  metaAuthor: string
}

interface OtherSettings {
  copyright: string
  icp: string
  notice: string
}

export function useSiteConfig() {
  const [configs, setConfigs] = useState<SiteConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/site-config/public')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error('获取网站配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfigValue = (key: string, defaultValue: string = ''): string => {
    const config = configs.find(c => c.key === key)
    return config?.value || defaultValue
  }

  const getSiteInfo = (): SiteInfo => ({
    title: getConfigValue('site_title', '个人博客'),
    subtitle: getConfigValue('site_subtitle', '分享技术与生活'),
    description: getConfigValue('site_description', '这是一个个人技术博客'),
    keywords: getConfigValue('site_keywords', '博客,技术,编程'),
    logo: getConfigValue('site_logo', '')
  })


  const getSocialLinks = (): SocialLinks => ({
    github: getConfigValue('social_github', ''),
    weibo: getConfigValue('social_weibo', ''),
    wechat: getConfigValue('social_wechat', ''),
    linkedin: getConfigValue('social_linkedin', '')
  })

  const getSeoSettings = (): SeoSettings => ({
    googleAnalytics: getConfigValue('seo_google_analytics', ''),
    baiduAnalytics: getConfigValue('seo_baidu_analytics', ''),
    metaAuthor: getConfigValue('seo_meta_author', '')
  })

  const getOtherSettings = (): OtherSettings => ({
    copyright: getConfigValue('other_copyright', '保留所有权利。'),
    icp: getConfigValue('other_icp', ''),
    notice: getConfigValue('other_notice', '')
  })

  return {
    configs,
    loading,
    getSiteInfo,
    getSocialLinks,
    getSeoSettings,
    getOtherSettings,
    getConfigValue,
    refetch: fetchConfigs
  }
}