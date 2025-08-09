/**
 * 重构后的动态元数据组件
 * 使用DOMManager安全管理DOM，使用ConfigStore统一状态管理
 */

"use client"

import { useEffect, useCallback } from 'react'
import { useSiteInfo, useSeoSettings, useConfigStatus } from '@/stores/configStore'
import { domManager, MetaTagUpdate } from '@/services/DOMManager'

export function DynamicMetadata() {
  const siteInfo = useSiteInfo()
  const seoSettings = useSeoSettings()
  const { loading } = useConfigStatus()

  // 更新基础meta标签
  const updateBasicMetaTags = useCallback(() => {
    if (loading) return

    const metaUpdates: MetaTagUpdate[] = []

    // 页面标题
    if (siteInfo.title) {
      document.title = siteInfo.title
    }

    // 基础meta标签
    if (siteInfo.description) {
      metaUpdates.push({
        key: 'meta-description',
        type: 'meta',
        name: 'description',
        content: siteInfo.description
      })
    }

    if (siteInfo.keywords) {
      metaUpdates.push({
        key: 'meta-keywords',
        type: 'meta',
        name: 'keywords',
        content: siteInfo.keywords
      })
    }

    if (seoSettings.metaAuthor) {
      metaUpdates.push({
        key: 'meta-author',
        type: 'meta',
        name: 'author',
        content: seoSettings.metaAuthor
      })
    }

    // Open Graph标签
    if (siteInfo.title) {
      metaUpdates.push({
        key: 'og-title',
        type: 'meta',
        property: 'og:title',
        content: siteInfo.title
      })
    }

    if (siteInfo.description) {
      metaUpdates.push({
        key: 'og-description',
        type: 'meta',
        property: 'og:description',
        content: siteInfo.description
      })
    }

    metaUpdates.push({
      key: 'og-type',
      type: 'meta',
      property: 'og:type',
      content: 'website'
    })

    // 语言标签
    if (siteInfo.language) {
      document.documentElement.lang = siteInfo.language
    }

    // 批量更新meta标签
    if (metaUpdates.length > 0) {
      domManager.updateMetaTags(metaUpdates)
    }
  }, [siteInfo, seoSettings, loading])

  // 更新favicon
  const updateFavicon = useCallback(async () => {
    if (loading) return

    try {
      if (siteInfo.favicon) {
        // 如果有自定义favicon
        domManager.updateFavicon(siteInfo.favicon)
      } else {
        // 尝试从API获取favicon
        const response = await fetch('/api/v1/image/site-favicon')
        if (response.ok) {
          domManager.updateFavicon('/api/v1/image/site-favicon')
        } else {
          // 使用默认favicon
          domManager.updateFavicon('/favicon.ico')
        }
      }
    } catch (error) {
      console.warn('Failed to update favicon:', error)
      // 出错时使用默认favicon
      domManager.updateFavicon('/favicon.ico')
    }
  }, [siteInfo.favicon, loading])

  // 更新分析脚本
  const updateAnalyticsScripts = useCallback(() => {
    if (loading) return

    const scriptUpdates: MetaTagUpdate[] = []

    // Google Analytics
    if (seoSettings.googleAnalytics) {
      // 检查是否已经添加了GA脚本
      const existingGA = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${seoSettings.googleAnalytics}"]`)
      
      if (!existingGA) {
        scriptUpdates.push({
          key: 'ga-script',
          type: 'script',
          content: `https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalytics}`,
          attributes: { async: 'true' }
        })

        scriptUpdates.push({
          key: 'ga-config',
          type: 'script',
          content: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${seoSettings.googleAnalytics}');
          `
        })
      }
    }

    // 百度统计
    if (seoSettings.baiduAnalytics) {
      const existingBaidu = document.querySelector(`script[src*="hm.baidu.com/hm.js?${seoSettings.baiduAnalytics}"]`)
      
      if (!existingBaidu) {
        scriptUpdates.push({
          key: 'baidu-analytics',
          type: 'script',
          content: `
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?${seoSettings.baiduAnalytics}";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();
          `
        })
      }
    }

    // 更新脚本
    if (scriptUpdates.length > 0) {
      domManager.updateMetaTags(scriptUpdates)
    }
  }, [seoSettings.googleAnalytics, seoSettings.baiduAnalytics, loading])

  // 主要的更新效果
  useEffect(() => {
    updateBasicMetaTags()
  }, [updateBasicMetaTags])

  // favicon更新效果
  useEffect(() => {
    updateFavicon()
  }, [updateFavicon])

  // 分析脚本更新效果
  useEffect(() => {
    updateAnalyticsScripts()
  }, [updateAnalyticsScripts])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 不在这里清理，因为用户可能需要保持meta标签
      // domManager.cleanup()
    }
  }, [])

  // 调试信息（开发环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const debugInfo = domManager.getDebugInfo()
      console.log('DynamicMetadata Debug Info:', debugInfo)
    }
  }, [siteInfo, seoSettings])

  return null // 这个组件不渲染任何内容，只管理DOM
}